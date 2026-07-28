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
    return {
      ...globalThis.__arkmatxSceneIntegrity?.snapshot?.(),
      sourcePrefix: image?.src.slice(0, 32) || '',
      sourceEndsInSvg: image?.src.endsWith('.svg') || false,
      signalState: signal?.dataset.state || null,
      loadedModules: performance.getEntriesByType('resource').map(entry => entry.name).filter(name => name.includes('/src/')),
    };
  });

  snapshots.push(snapshot);
  if (!snapshot.sourcePrefix.startsWith('data:image/')) failures.push(`${scene}: active scene is not a manifest raster`);
  if (snapshot.sourceEndsInSvg || snapshot.vectorFallbackVisible) failures.push(`${scene}: vector fallback became active`);
  if (snapshot.signalState !== 'ready') failures.push(`${scene}: raster signal did not settle to ready`);
  if (!snapshot.provenance?.includes(scene)) failures.push(`${scene}: missing raster provenance (${snapshot.provenance})`);
  if (snapshot.loadedModules.some(name => name.includes('server-raster.js'))) failures.push(`${scene}: stale server-raster compatibility module still loaded`);
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

console.log('ARKMATX RASTER INTEGRITY CHECK PASSED for workshop, server closet, and paradox room.');
