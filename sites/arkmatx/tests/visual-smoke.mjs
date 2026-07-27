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

function fail(view, message) {
  failures.push(`[${view}] ${message}`);
}

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

    const visual = await page.evaluate(() => {
      const img = document.querySelector('#sceneBg');
      const svg = document.querySelector('#hotspots');
      const polygons = [...document.querySelectorAll('#hotspots polygon')];
      const ir = img?.getBoundingClientRect();
      const sr = svg?.getBoundingClientRect();
      return {
        imageComplete: Boolean(img?.complete),
        naturalWidth: img?.naturalWidth || 0,
        naturalHeight: img?.naturalHeight || 0,
        imageRect: ir ? { x: ir.x, y: ir.y, width: ir.width, height: ir.height } : null,
        svgRect: sr ? { x: sr.x, y: sr.y, width: sr.width, height: sr.height } : null,
        hotspotCount: polygons.length,
        hotspots: polygons.map(p => {
          const r = p.getBoundingClientRect();
          return { label: p.getAttribute('aria-label'), x: r.x, y: r.y, width: r.width, height: r.height };
        }),
      };
    });

    if (!visual.imageComplete || visual.naturalWidth < 1000 || visual.naturalHeight < 500) {
      fail(vp.name, `scene image did not render correctly (${visual.naturalWidth}x${visual.naturalHeight})`);
    }
    if (!visual.imageRect || visual.imageRect.width < vp.width * 0.8 || visual.imageRect.height < vp.height * 0.8) {
      fail(vp.name, `scene image does not occupy the viewport: ${JSON.stringify(visual.imageRect)}`);
    }
    if (!visual.svgRect) fail(vp.name, 'hotspot SVG missing');
    if (visual.hotspotCount < 8) fail(vp.name, `expected at least 8 workshop hotspots, found ${visual.hotspotCount}`);

    for (const h of visual.hotspots) {
      if (h.width < 18 || h.height < 18) fail(vp.name, `hotspot '${h.label}' is too small (${Math.round(h.width)}x${Math.round(h.height)})`);
      const cx = h.x + h.width / 2;
      const cy = h.y + h.height / 2;
      if (cx < -2 || cy < -2 || cx > vp.width + 2 || cy > vp.height + 2) {
        fail(vp.name, `hotspot '${h.label}' center is off-screen (${Math.round(cx)},${Math.round(cy)})`);
      }
    }

    // Exercise the major workshop interactions without following external navigation.
    const modalCases = ['BRAIN CONNECT CRT', 'HARDWARE BENCH', 'WET BEARD BIKE', 'ÜBERCORP RACK', 'WORLD MAP', 'RADIO'];
    for (const label of modalCases) {
      const spot = page.locator(`#hotspots polygon[aria-label="${label}"]`);
      if (await spot.count() !== 1) {
        fail(vp.name, `missing hotspot '${label}'`);
        continue;
      }
      await spot.click({ force: true });
      await page.waitForTimeout(80);
      const shown = await page.locator('#modal.show').count();
      if (!shown) fail(vp.name, `clicking '${label}' did not open the interaction panel`);
      await page.locator('#close').click({ force: true }).catch(() => {});
    }

    // The red button should alter the room rather than silently fail.
    const red = page.locator('#hotspots polygon[aria-label="DO NOT PUSH"]');
    if (await red.count() === 1) {
      const before = await page.locator('body').getAttribute('class') || '';
      await red.click({ force: true });
      const after = await page.locator('body').getAttribute('class') || '';
      if (before === after || !after.includes('alarm')) fail(vp.name, 'red button did not visibly toggle alarm state');
    }

    // Scene navigation should replace the background and hotspot set.
    const servers = page.locator('#hotspots polygon[aria-label="SERVER CLOSET"]');
    if (await servers.count() === 1) {
      await servers.click({ force: true });
      await page.waitForTimeout(150);
      const scene = await page.locator('#location').textContent();
      const src = await page.locator('#sceneBg').getAttribute('src');
      if (!scene?.includes('SERVERS')) fail(vp.name, `server-closet navigation failed; location='${scene}'`);
      if (!src?.includes('servers')) fail(vp.name, `server-closet scene image did not change; src='${src}'`);
    }

    if (consoleErrors.length) fail(vp.name, `browser errors: ${consoleErrors.join(' | ')}`);
    // world-state.php can be absent in local Vite preview, so ignore only that known local backend 404.
    const unexpected = badResponses.filter(x => !x.includes('world-state.php'));
    if (unexpected.length) fail(vp.name, `HTTP errors: ${unexpected.join(' | ')}`);

    await page.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true });
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
