import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.ARKMATX_TEST_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.ARKMATX_SCREENSHOT_DIR || 'test-results/arkmatx';
await fs.mkdir(outDir, { recursive: true });

const failures = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

const fail = message => failures.push(message);
const waitForScene = async scene => {
  await page.waitForFunction(expected => {
    const text = document.querySelector('#location')?.textContent || '';
    return text.startsWith(expected.toUpperCase());
  }, scene, { timeout: 15_000 });
};

try {
  await page.goto(`${baseURL}?login=field-alpha&scene=servers`, { waitUntil: 'networkidle' });
  await waitForScene('servers');
  if (await page.locator('#journal').count() !== 1) fail('field journal button missing');

  await page.locator('#journal').click();
  const firstJournal = await page.locator('#copy').textContent();
  if (!firstJournal?.includes('CURRENT ROOM ..... SERVERS')) fail('journal did not record servers as current room');
  if (!firstJournal?.includes('WORKSHOP · SERVERS')) fail('journal did not record workshop and servers as visited');
  await page.locator('#close').click();

  await page.goto(`${baseURL}?login=field-alpha`, { waitUntil: 'networkidle' });
  await waitForScene('servers');
  await page.locator('#journal').click();
  const resumedJournal = await page.locator('#copy').textContent();
  if (!resumedJournal?.includes('CURRENT ROOM ..... SERVERS')) fail('same login did not resume its last room');
  if (await page.locator('[data-journal-scene="workshop"]').count() !== 1) fail('journal is missing workshop navigation');
  if (await page.locator('[data-journal-scene="servers"]').count() !== 1) fail('journal is missing servers navigation');
  await page.screenshot({ path: path.join(outDir, 'expedition-memory-alpha.png'), fullPage: true });

  await page.goto(`${baseURL}?login=field-beta`, { waitUntil: 'networkidle' });
  await waitForScene('workshop');
  await page.locator('#journal').click();
  const betaJournal = await page.locator('#copy').textContent();
  if (!betaJournal?.includes('CURRENT ROOM ..... WORKSHOP')) fail('new login did not begin in workshop');
  if (betaJournal?.includes('SERVERS')) fail('new login inherited another login\'s visited rooms');

  await page.goto(`${baseURL}?login=field-alpha`, { waitUntil: 'networkidle' });
  await waitForScene('servers');
  await page.locator('#journal').click();
  await page.locator('[data-journal-scene="workshop"]').click();
  await page.waitForURL(/scene=workshop/);
  await waitForScene('workshop');
} catch (error) {
  fail(error.stack || error.message);
  await page.screenshot({ path: path.join(outDir, 'expedition-memory-failure.png'), fullPage: true }).catch(() => {});
} finally {
  await context.close();
  await browser.close();
}

await fs.writeFile(
  path.join(outDir, 'expedition-memory-report.json'),
  JSON.stringify({ baseURL, failures }, null, 2),
);

if (failures.length) {
  console.error('\nARKMATX EXPEDITION MEMORY CHECK FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ARKMATX EXPEDITION MEMORY CHECK PASSED.');
