import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.ARKMATX_TEST_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.ARKMATX_SCREENSHOT_DIR || 'test-results/arkmatx';
await fs.mkdir(outDir, { recursive: true });

const failures = [];
const fail = message => failures.push(message);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

const waitScene = scene => page.waitForFunction(
  expected => (document.querySelector('#location')?.textContent || '').startsWith(expected.toUpperCase()),
  scene,
  { timeout: 15_000 },
);
const close = async () => page.locator('#close').click({ force: true }).catch(() => {});
const activate = async label => {
  const spot = page.locator(`#hotspots polygon[aria-label="${label}"]`);
  await spot.evaluate(node => node.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  })));
};

try {
  await page.goto(`${baseURL}?login=compass-alpha&noresume=1`, { waitUntil: 'networkidle' });
  await waitScene('workshop');
  if (await page.locator('#signalCompass').count() !== 1) fail('signal compass button missing');

  await page.locator('#signalCompass').click();
  let copy = await page.locator('#copy').textContent();
  if (!copy?.includes('MISSION CLEARANCE ... 0/4')) fail('new login did not start at zero mission clearance');
  if (!copy?.includes('NEXT: BRAIN CONNECT CRT')) fail('initial compass vector is incorrect');
  await close();

  await activate('BRAIN CONNECT CRT');
  await close();
  await page.locator('#signalCompass').click();
  copy = await page.locator('#copy').textContent();
  if (!copy?.includes('SURVEY THE WORKSHOP .... 1/3')) fail('compass did not consume live discovery ledger progress');
  if (!copy?.includes('NEXT: WORLD MAP')) fail('compass did not advance to the next workshop target');
  await close();

  await page.evaluate(() => {
    const hash32 = value => {
      let hash = 2166136261;
      for (const char of value) {
        hash ^= char.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    };
    const labels = [
      'BRAIN CONNECT CRT', 'WORLD MAP', 'SERVER CLOSET',
      'MOSS NODE', 'PAPER NODE', 'INK NODE', 'LOOPBACK',
      'TERMINAL A', 'TERMINAL C', 'MAINTENANCE CHANNEL 0',
      'WORLD BUS RADIO SEQUENCE',
    ];
    const now = new Date().toISOString();
    const key = `arkmatx-discoveries:${hash32('compass-alpha').toString(36)}`;
    localStorage.setItem(key, JSON.stringify({
      items: labels.map((label, index) => ({ id: `seed:${index}`, label, room: 'QA', firstSeen: now, lastSeen: now, count: 1 })),
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await waitScene('workshop');
  if (!(await page.locator('#signalCompass').getAttribute('class') || '').includes('complete')) fail('completed compass did not receive unlocked state');
  await page.locator('#signalCompass').click();
  copy = await page.locator('#copy').textContent();
  const heading = await page.locator('#title').textContent();
  if (heading !== 'DEVELOPER CHANNEL') fail(`developer channel heading missing: ${heading}`);
  if (!copy?.includes('MISSION CLEARANCE ... 4/4') || !copy.includes('DEVELOPER CHANNEL ... UNLOCKED')) fail('complete mission summary missing');
  for (const selector of ['#compassSource', '#compassMemory', '#compassReview']) {
    if (await page.locator(selector).count() !== 1) fail(`unlocked developer action missing: ${selector}`);
  }
  await page.screenshot({ path: path.join(outDir, 'signal-compass-unlocked.png'), fullPage: true });

  await page.goto(`${baseURL}?login=compass-beta&noresume=1`, { waitUntil: 'networkidle' });
  await waitScene('workshop');
  await page.locator('#signalCompass').click();
  copy = await page.locator('#copy').textContent();
  if (copy?.includes('DEVELOPER CHANNEL ... UNLOCKED')) fail('new login inherited unlocked developer channel');
  if (!copy?.includes('MISSION CLEARANCE ... 0/4')) fail('new login inherited another login mission progress');
} catch (error) {
  fail(error.stack || error.message);
  await page.screenshot({ path: path.join(outDir, 'signal-compass-failure.png'), fullPage: true }).catch(() => {});
} finally {
  await context.close();
  await browser.close();
}

await fs.writeFile(path.join(outDir, 'signal-compass-report.json'), JSON.stringify({ baseURL, failures }, null, 2));
if (failures.length) {
  console.error('\nARKMATX SIGNAL COMPASS CHECK FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('ARKMATX SIGNAL COMPASS CHECK PASSED.');
