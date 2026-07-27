import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.ARKMATX_TEST_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.ARKMATX_SCREENSHOT_DIR || 'test-results/arkmatx';
await fs.mkdir(outDir, { recursive: true });

const viewports = [
  { name: 'desktop-16x9', width: 1440, height: 810 },
  { name: 'desktop-3x2', width: 1440, height: 960 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
];

const failures = [];
const results = [];
const browser = await chromium.launch({ headless: true });
const fail = (view, message) => failures.push(`[${view}] ${message}`);
const closeModal = async page => {
  const close = page.locator('#close');
  if (await close.count()) await close.click({ force: true }).catch(() => {});
  await page.waitForTimeout(40);
};

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const consoleErrors = [];
  const badResponses = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.on('response', res => { if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`); });

  try {
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForSelector('#sceneBg', { state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(700);

    const visual = await page.evaluate(() => {
      const img = document.querySelector('#sceneBg');
      const svg = document.querySelector('#hotspots');
      const polygons = [...document.querySelectorAll('#hotspots polygon')];
      const ir = img?.getBoundingClientRect();
      const sr = svg?.getBoundingClientRect();
      const rect = r => r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
      return {
        imageComplete: Boolean(img?.complete),
        naturalWidth: img?.naturalWidth || 0,
        naturalHeight: img?.naturalHeight || 0,
        imageRect: rect(ir),
        svgRect: rect(sr),
        hotspotCount: polygons.length,
        hotspots: polygons.map(p => ({ label: p.getAttribute('aria-label'), ...rect(p.getBoundingClientRect()) })),
      };
    });

    if (!visual.imageComplete || visual.naturalWidth <= 0 || visual.naturalHeight <= 0) {
      fail(vp.name, `scene asset failed to load (${visual.naturalWidth}x${visual.naturalHeight})`);
    }
    if (!visual.imageRect || visual.imageRect.width < 200 || visual.imageRect.height < 110) {
      fail(vp.name, `scene canvas is too small: ${JSON.stringify(visual.imageRect)}`);
    }
    if (!visual.svgRect) fail(vp.name, 'hotspot SVG missing');
    if (visual.imageRect && visual.svgRect) {
      const delta = Math.max(
        Math.abs(visual.imageRect.x - visual.svgRect.x),
        Math.abs(visual.imageRect.y - visual.svgRect.y),
        Math.abs(visual.imageRect.width - visual.svgRect.width),
        Math.abs(visual.imageRect.height - visual.svgRect.height),
      );
      if (delta > 2) fail(vp.name, `scene/hotspot canvases are misaligned by ${Math.round(delta)}px`);
      const ratio = visual.imageRect.width / visual.imageRect.height;
      if (Math.abs(ratio - 16 / 9) > 0.03) fail(vp.name, `scene canvas ratio is ${ratio.toFixed(3)}, expected 16:9`);
    }
    if (visual.hotspotCount < 8) fail(vp.name, `expected at least 8 workshop hotspots, found ${visual.hotspotCount}`);

    const scene = visual.imageRect;
    for (const h of visual.hotspots) {
      if (h.width < 18 || h.height < 18) fail(vp.name, `hotspot '${h.label}' is too small (${Math.round(h.width)}x${Math.round(h.height)})`);
      const cx = h.x + h.width / 2;
      const cy = h.y + h.height / 2;
      if (scene && (cx < scene.x - 2 || cy < scene.y - 2 || cx > scene.x + scene.width + 2 || cy > scene.y + scene.height + 2)) {
        fail(vp.name, `hotspot '${h.label}' center is outside the scene canvas (${Math.round(cx)},${Math.round(cy)})`);
      }
    }

    await page.screenshot({ path: path.join(outDir, `${vp.name}-workshop.png`), fullPage: true });

    const modalCases = ['BRAIN CONNECT CRT', 'HARDWARE BENCH', 'WET BEARD BIKE', 'ÜBERCORP RACK', 'WORLD MAP', 'RADIO'];
    for (const label of modalCases) {
      const spot = page.locator(`#hotspots polygon[aria-label="${label}"]`);
      if (await spot.count() !== 1) {
        fail(vp.name, `missing hotspot '${label}'`);
        continue;
      }
      await spot.click({ force: true });
      await page.waitForTimeout(60);
      if (!(await page.locator('#modal.show').count())) fail(vp.name, `clicking '${label}' did not open the interaction panel`);
      await closeModal(page);
    }

    const red = page.locator('#hotspots polygon[aria-label="DO NOT PUSH"]');
    if (await red.count() === 1) {
      const before = await page.locator('body').getAttribute('class') || '';
      await red.click({ force: true });
      await page.waitForTimeout(60);
      const after = await page.locator('body').getAttribute('class') || '';
      if (before === after || !after.includes('alarm')) fail(vp.name, 'red button did not visibly toggle alarm state');
    }

    const servers = page.locator('#hotspots polygon[aria-label="SERVER CLOSET"]');
    if (await servers.count() === 1) {
      await servers.click({ force: true });
      await page.waitForTimeout(500);
      const serverVisual = await page.evaluate(() => {
        const img = document.querySelector('#sceneBg');
        return {
          location: document.querySelector('#location')?.textContent || '',
          scene: img?.dataset.scene || '',
          complete: Boolean(img?.complete),
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          hotspotCount: document.querySelectorAll('#hotspots polygon').length,
        };
      });
      if (!serverVisual.location.includes('SERVERS')) fail(vp.name, `server-closet navigation failed; location='${serverVisual.location}'`);
      if (serverVisual.scene !== 'servers') fail(vp.name, `server scene provenance missing; data-scene='${serverVisual.scene}'`);
      if (!serverVisual.complete || serverVisual.naturalWidth < 200 || serverVisual.naturalHeight < 100) {
        fail(vp.name, `rendered server scene failed to load (${serverVisual.naturalWidth}x${serverVisual.naturalHeight})`);
      }
      if (serverVisual.hotspotCount < 6) fail(vp.name, `expected at least 6 server-room hotspots, found ${serverVisual.hotspotCount}`);
      await page.screenshot({ path: path.join(outDir, `${vp.name}-servers.png`), fullPage: true });

      const paradox = page.locator('#hotspots polygon[aria-label="PARADOX"]');
      if (await paradox.count() !== 1) {
        fail(vp.name, 'server room is missing the PARADOX route');
      } else {
        await paradox.click({ force: true });
        await page.waitForTimeout(500);
        const paradoxVisual = await page.evaluate(() => {
          const img = document.querySelector('#sceneBg');
          const labels = [...document.querySelectorAll('#hotspots polygon')].map(p => p.getAttribute('aria-label'));
          return {
            location: document.querySelector('#location')?.textContent || '',
            scene: img?.dataset.scene || '',
            complete: Boolean(img?.complete),
            naturalWidth: img?.naturalWidth || 0,
            naturalHeight: img?.naturalHeight || 0,
            labels,
          };
        });
        if (!paradoxVisual.location.includes('PARADOX')) fail(vp.name, `paradox navigation failed; location='${paradoxVisual.location}'`);
        if (paradoxVisual.scene !== 'paradox') fail(vp.name, `paradox scene provenance missing; data-scene='${paradoxVisual.scene}'`);
        if (!paradoxVisual.complete || paradoxVisual.naturalWidth < 100 || paradoxVisual.naturalHeight < 50) {
          fail(vp.name, `rendered paradox scene failed to load (${paradoxVisual.naturalWidth}x${paradoxVisual.naturalHeight})`);
        }
        for (const label of ['TERMINAL A', 'TERMINAL B', 'TERMINAL C', 'MAINTENANCE CHANNEL', 'WORKSHOP', 'SERVER CLOSET']) {
          if (!paradoxVisual.labels.includes(label)) fail(vp.name, `paradox room missing hotspot '${label}'`);
        }

        await page.locator('#hotspots polygon[aria-label="TERMINAL A"]').click({ force: true });
        await page.locator('#hotspots polygon[aria-label="TERMINAL C"]').click({ force: true });
        await page.locator('#hotspots polygon[aria-label="MAINTENANCE CHANNEL"]').click({ force: true });
        await page.waitForTimeout(80);
        if (!(await page.locator('#modal.show').count())) fail(vp.name, 'paradox A-on / B-off / C-on sequence did not open the maintenance channel');
        await closeModal(page);
        await page.screenshot({ path: path.join(outDir, `${vp.name}-paradox.png`), fullPage: true });
      }
    }

    if (consoleErrors.length) fail(vp.name, `browser errors: ${consoleErrors.join(' | ')}`);
    const unexpected = badResponses.filter(x => !x.includes('world-state.php'));
    if (unexpected.length) fail(vp.name, `HTTP errors: ${unexpected.join(' | ')}`);

    results.push({ viewport: vp, visual, consoleErrors, badResponses });
  } catch (err) {
    fail(vp.name, `test crashed: ${err.stack || err.message}`);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-failure.png`), fullPage: true }).catch(() => {});
  } finally {
    await context.close();
  }
}

await browser.close();
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify({ baseURL, failures, results }, null, 2));

if (failures.length) {
  console.error('\nARKMATX VISUAL CHECK FAILED\n');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log(`ARKMATX VISUAL CHECK PASSED across ${viewports.length} viewport profiles.`);
