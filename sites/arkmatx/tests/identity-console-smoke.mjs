import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.ARKMATX_TEST_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.ARKMATX_SCREENSHOT_DIR || 'test-results/arkmatx';
await fs.mkdir(outDir, { recursive: true });

const profiles = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'phone', width: 390, height: 844 },
];
const failures = [];
const results = [];
const browser = await chromium.launch({ headless: true });

for (const profile of profiles) {
  const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  try {
    const first = new URL(baseURL);
    first.searchParams.set('login', `pilot-one-${profile.name}`);
    first.searchParams.set('variant', 'core');
    first.searchParams.set('noresume', '1');
    await page.goto(first.toString(), { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForSelector('#identityConsole', { state: 'visible' });

    await page.locator('#identityConsole').click();
    await page.waitForSelector('#modal.show #identityInput', { state: 'visible' });
    const initial = await page.evaluate(() => ({
      input: document.querySelector('#identityInput')?.value,
      variant: document.body.dataset.variant,
      login: sessionStorage.getItem('arkmatx-active-login'),
    }));
    if (initial.input !== `pilot-one-${profile.name}` || initial.variant !== 'core') {
      failures.push(`[${profile.name}] identity terminal initial state failed: ${JSON.stringify(initial)}`);
    }

    await page.locator('#close').click();
    await page.locator('#hotspots polygon[aria-label="SERVER CLOSET"]').click({ force: true });
    await page.waitForFunction(() => document.querySelector('#location')?.textContent?.startsWith('SERVERS'), null, { timeout: 10_000 });

    await page.locator('#identityConsole').click();
    await page.locator('#identityInput').fill(`pilot-two-${profile.name}`);
    await Promise.all([
      page.waitForURL(url => url.searchParams.get('login') === `pilot-two-${profile.name}`, { timeout: 15_000 }),
      page.locator('#identityApply').click(),
    ]);
    await page.waitForSelector('#identityConsole', { state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#location')?.textContent?.startsWith('SERVERS'), null, { timeout: 12_000 });
    const switched = await page.evaluate(() => ({
      login: new URLSearchParams(location.search).get('login'),
      activeLogin: sessionStorage.getItem('arkmatx-active-login'),
      room: document.querySelector('#location')?.textContent || '',
      variant: document.body.dataset.variant,
    }));
    if (switched.login !== `pilot-two-${profile.name}` || switched.activeLogin !== `pilot-two-${profile.name}` || !switched.room.startsWith('SERVERS')) {
      failures.push(`[${profile.name}] callsign switch failed: ${JSON.stringify(switched)}`);
    }

    const previousVisitor = await page.evaluate(() => localStorage.getItem('arkmatx-visitor-id'));
    await page.locator('#identityConsole').click();
    await Promise.all([
      page.waitForURL(url => !url.searchParams.has('login') && !url.searchParams.has('user'), { timeout: 15_000 }),
      page.locator('#identityAnonymous').click(),
    ]);
    await page.waitForSelector('#identityConsole', { state: 'visible' });
    const anonymous = await page.evaluate(() => ({
      login: new URLSearchParams(location.search).get('login'),
      visitor: localStorage.getItem('arkmatx-visitor-id'),
      activeLogin: sessionStorage.getItem('arkmatx-active-login'),
    }));
    if (anonymous.login !== null || !anonymous.visitor || anonymous.visitor === previousVisitor || anonymous.activeLogin) {
      failures.push(`[${profile.name}] anonymous slot reset failed: ${JSON.stringify(anonymous)}`);
    }

    if (errors.length) failures.push(`[${profile.name}] page errors: ${errors.join(' | ')}`);
    results.push({ profile, initial, switched, anonymous, errors });
    await page.screenshot({ path: path.join(outDir, `${profile.name}-identity-console.png`), fullPage: true });
  } catch (error) {
    failures.push(`[${profile.name}] identity console test crashed: ${error.stack || error.message}`);
    await page.screenshot({ path: path.join(outDir, `${profile.name}-identity-console-failure.png`), fullPage: true }).catch(() => {});
  } finally {
    await context.close();
  }
}

await browser.close();
await fs.writeFile(path.join(outDir, 'identity-console-report.json'), JSON.stringify({ failures, results }, null, 2));
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`ARKMATX IDENTITY CONSOLE CHECK PASSED across ${profiles.length} viewport profiles.`);
