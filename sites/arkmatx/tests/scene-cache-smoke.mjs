import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.ARKMATX_TEST_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.ARKMATX_SCREENSHOT_DIR || 'test-results/arkmatx';
await fs.mkdir(outDir, { recursive: true });

const failures = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 810 } });
const page = await context.newPage();

const fail = message => failures.push(message);
const snapshot = () => page.evaluate(() => ({ ...window.__arkmatxSceneCache }));

try {
  const url = new URL(baseURL);
  url.searchParams.set('login', 'scene-cache-smoke');
  url.searchParams.set('variant', 'core');
  url.searchParams.set('noresume', '1');
  await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForSelector('#sceneBg', { state: 'visible', timeout: 10_000 });
  await page.waitForFunction(() => ['ready', 'degraded'].includes(window.__arkmatxSceneCache?.status), null, { timeout: 20_000 });

  const warmed = await snapshot();
  if (warmed.status !== 'ready') fail(`scene cache did not fully warm: ${JSON.stringify(warmed.errors)}`);
  for (const name of ['workshop', 'servers', 'paradox']) {
    if (!warmed.preloaded?.includes(name)) fail(`scene cache did not preload ${name}`);
  }
  if ((warmed.entries || 0) < 5) fail(`expected at least five cached render payloads, found ${warmed.entries || 0}`);

  const beforeServers = warmed.hits || 0;
  await page.locator('#hotspots polygon[aria-label="SERVER CLOSET"]').click({ force: true });
  await page.waitForFunction(() => document.querySelector('#location')?.textContent?.startsWith('SERVERS'), null, { timeout: 10_000 });
  await page.waitForFunction(() => !document.body.dataset.sceneLoading && document.querySelector('#viewport')?.getAttribute('aria-busy') !== 'true', null, { timeout: 10_000 });
  const serverState = await snapshot();
  if ((serverState.hits || 0) <= beforeServers) fail('server navigation did not reuse the warmed scene payload cache');
  if (serverState.loading) fail(`server loading state remained stuck on ${serverState.loading}`);

  const beforeParadox = serverState.hits || 0;
  await page.locator('#hotspots polygon[aria-label="PARADOX"]').click({ force: true });
  await page.waitForFunction(() => document.querySelector('#location')?.textContent?.startsWith('PARADOX'), null, { timeout: 10_000 });
  await page.waitForFunction(() => !document.body.dataset.sceneLoading && document.querySelector('#viewport')?.getAttribute('aria-busy') !== 'true', null, { timeout: 10_000 });
  const paradoxState = await snapshot();
  if ((paradoxState.hits || 0) <= beforeParadox) fail('paradox navigation did not reuse the warmed scene payload cache');
  if (paradoxState.loading) fail(`paradox loading state remained stuck on ${paradoxState.loading}`);

  const image = await page.locator('#sceneBg').evaluate(node => ({
    complete: node.complete,
    naturalWidth: node.naturalWidth,
    naturalHeight: node.naturalHeight,
    scene: node.dataset.scene,
  }));
  if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) fail(`paradox render was not ready: ${JSON.stringify(image)}`);

  await page.screenshot({ path: path.join(outDir, 'scene-cache-paradox.png'), fullPage: true });
  await fs.writeFile(path.join(outDir, 'scene-cache-report.json'), JSON.stringify({ warmed, serverState, paradoxState, image, failures }, null, 2));
} catch (error) {
  fail(error.stack || error.message);
  await page.screenshot({ path: path.join(outDir, 'scene-cache-failure.png'), fullPage: true }).catch(() => {});
} finally {
  await context.close();
  await browser.close();
}

if (failures.length) {
  console.error('\nARKMATX SCENE CACHE CHECK FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ARKMATX SCENE CACHE CHECK PASSED.');
