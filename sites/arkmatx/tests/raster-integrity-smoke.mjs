import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.ARKMATX_TEST_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.ARKMATX_SCREENSHOT_DIR || 'test-results/arkmatx';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 810 } });
const page = await context.newPage();
const failures = [];
const snapshots = [];
const consoleErrors = [];
const badResponses = [];

const contracts = {
  workshop: { kind: 'embedded' },
  servers: { kind: 'asset', path: '/scenes/servers-render.jpg', width: 256, height: 144 },
  paradox: { kind: 'embedded' },
};

page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', error => consoleErrors.push(error.message));
page.on('response', response => {
  if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
});

async function activateHotspot(label) {
  const hotspot = page.locator(`#hotspots polygon[aria-label="${label}"]`);
  if (await hotspot.count() !== 1) throw new Error(`missing hotspot '${label}'`);
  await hotspot.evaluate(node => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}

async function assertRasterScene(scene) {
  await page.waitForFunction(expected => {
    const image = document.querySelector('#sceneBg');
    return image?.dataset.scene === expected
      && image.dataset.rasterState === 'ready'
      && image.complete
      && image.naturalWidth > 0
      && image.naturalHeight > 0;
  }, scene, { timeout: 20_000 });

  const snapshot = await page.evaluate(() => {
    const image = document.querySelector('#sceneBg');
    const signal = document.querySelector('#sceneSignal');
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 36;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const bins = new Set();
    let flatGray = 0;
    const total = pixels.length / 4;
    for (let index = 0; index < pixels.length; index += 4) {
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      bins.add(`${r >> 4}:${g >> 4}:${b >> 4}`);
      if (Math.abs(r - g) <= 2 && Math.abs(g - b) <= 2 && r >= 105 && r <= 165) flatGray += 1;
    }
    return {
      ...globalThis.__arkmatxSceneIntegrity?.snapshot?.(),
      sourcePrefix: image?.src.slice(0, 48) || '',
      sourceEndsInSvg: image?.src.endsWith('.svg') || false,
      signalState: signal?.dataset.state || null,
      flatGrayRatio: total ? flatGray / total : 1,
      colorBins: bins.size,
      loadedModules: performance.getEntriesByType('resource').map(entry => entry.name),
    };
  });

  snapshots.push(snapshot);
  const contract = contracts[scene];
  if (contract.kind === 'embedded' && !snapshot.sourcePrefix.startsWith('data:image/')) {
    failures.push(`${scene}: expected embedded manifest raster, got ${snapshot.sourcePrefix}`);
  }
  if (contract.kind === 'asset' && !snapshot.source.includes(contract.path)) {
    failures.push(`${scene}: expected direct asset ${contract.path}, got ${snapshot.source}`);
  }
  if (contract.width && snapshot.width !== contract.width) failures.push(`${scene}: expected width ${contract.width}, got ${snapshot.width}`);
  if (contract.height && snapshot.height !== contract.height) failures.push(`${scene}: expected height ${contract.height}, got ${snapshot.height}`);
  if (snapshot.sourceEndsInSvg || snapshot.vectorFallbackVisible) failures.push(`${scene}: vector fallback became active`);
  if (snapshot.signalState !== 'ready') failures.push(`${scene}: raster signal did not settle to ready`);
  if (!snapshot.provenance?.startsWith(`${contract.kind}:core:${scene}`)) {
    failures.push(`${scene}: unexpected raster provenance (${snapshot.provenance})`);
  }
  if (scene === 'servers' && snapshot.flatGrayRatio > 0.45) {
    failures.push(`servers: ${Math.round(snapshot.flatGrayRatio * 100)}% of sampled pixels are flat gray; likely corrupt/dashboard extraction`);
  }
  if (scene === 'servers' && snapshot.colorBins < 24) {
    failures.push(`servers: only ${snapshot.colorBins} sampled color bins; rendered room lacks expected visual detail`);
  }
  if (snapshot.loadedModules.some(name => name.includes('server-raster.js'))) {
    failures.push(`${scene}: stale server-raster compatibility module still loaded`);
  }
}

try {
  const url = new URL(baseURL);
  url.searchParams.set('login', `raster-integrity-${Date.now()}`);
  url.searchParams.set('variant', 'core');
  await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 30_000 });

  await assertRasterScene('workshop');
  await page.screenshot({ path: path.join(outDir, 'raster-integrity-workshop.png'), fullPage: true });

  await activateHotspot('SERVER CLOSET');
  await assertRasterScene('servers');
  await page.screenshot({ path: path.join(outDir, 'raster-integrity-servers.png'), fullPage: true });

  await activateHotspot('PARADOX');
  await assertRasterScene('paradox');
  await page.screenshot({ path: path.join(outDir, 'raster-integrity-paradox.png'), fullPage: true });
} catch (error) {
  failures.push(error.stack || error.message);
  await page.screenshot({ path: path.join(outDir, 'raster-integrity-failure.png'), fullPage: true }).catch(() => {});
}

if (consoleErrors.length) failures.push(`browser errors: ${consoleErrors.join(' | ')}`);
const unexpectedResponses = badResponses.filter(item => !item.includes('world-state.php'));
if (unexpectedResponses.length) failures.push(`HTTP errors: ${unexpectedResponses.join(' | ')}`);

await fs.writeFile(
  path.join(outDir, 'raster-integrity-report.json'),
  JSON.stringify({ baseURL, failures, snapshots, consoleErrors, badResponses }, null, 2)
);

await context.close();
await browser.close();

if (failures.length) {
  console.error('\nARKMATX RASTER INTEGRITY CHECK FAILED\n');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('ARKMATX RASTER INTEGRITY CHECK PASSED for workshop, clean server asset, and paradox room.');
