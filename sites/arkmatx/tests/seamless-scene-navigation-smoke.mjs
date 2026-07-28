import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.ARKMATX_TEST_URL || 'http://127.0.0.1:4173/';
const outDir = process.env.ARKMATX_SCREENSHOT_DIR || 'test-results/arkmatx';
await fs.mkdir(outDir, { recursive: true });

const profiles = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];
const failures = [];
const browser = await chromium.launch({ headless: true });

const fail = (profile, message) => failures.push(`${profile}: ${message}`);

for (const profile of profiles) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    isMobile: Boolean(profile.isMobile),
    hasTouch: Boolean(profile.hasTouch),
  });
  const page = await context.newPage();
  const login = `seamless-${profile.name}`;

  const waitForScene = async scene => {
    await page.waitForFunction(expected => {
      const text = document.querySelector('#location')?.textContent || '';
      return text.startsWith(expected.toUpperCase());
    }, scene, { timeout: 15_000 });
  };

  const clickHotspot = async label => {
    const hotspot = page.locator(`polygon[aria-label="${label}"]`).first();
    await hotspot.waitFor({ state: 'attached', timeout: 15_000 });
    await hotspot.evaluate(node => node.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })));
  };

  const expectContinuity = async step => {
    const marker = await page.evaluate(() => window.__arkmatxContinuityMarker);
    if (marker !== login) fail(profile.name, `page continuity was lost after ${step}`);
  };

  try {
    await page.goto(`${baseURL}?login=${login}&noresume=1`, { waitUntil: 'networkidle' });
    await waitForScene('workshop');
    await page.waitForFunction(() => window.__arkmatxSceneNavigator === true);
    await page.evaluate(value => { window.__arkmatxContinuityMarker = value; }, login);

    await clickHotspot('SERVER CLOSET');
    await waitForScene('servers');
    await page.waitForFunction(() => new URL(location.href).searchParams.get('scene') === 'servers');
    await expectContinuity('physical server-room travel');

    await page.evaluate(() => history.back());
    await waitForScene('workshop');
    await page.waitForFunction(() => new URL(location.href).searchParams.get('scene') === 'workshop');
    await expectContinuity('browser Back travel');

    await clickHotspot('SERVER CLOSET');
    await waitForScene('servers');
    await page.locator('#journal').click();
    await page.locator('[data-journal-scene="workshop"]').click();
    await waitForScene('workshop');
    await page.waitForFunction(() => new URL(location.href).searchParams.get('scene') === 'workshop');
    await expectContinuity('field-journal travel');

    await page.evaluate(identity => {
      const hash32 = value => {
        let hash = 2166136261;
        for (const char of value) {
          hash ^= char.charCodeAt(0);
          hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
      };
      const key = `arkmatx-discoveries:${hash32(identity).toString(36)}`;
      localStorage.setItem(key, JSON.stringify({
        items: [
          { label: 'BRAIN CONNECT CRT' },
          { label: 'WORLD MAP' },
          { label: 'SERVER CLOSET' },
        ],
      }));
    }, login);

    await page.locator('#signalCompass').click();
    const route = page.locator('#compassRoute');
    await route.waitFor({ state: 'visible' });
    if ((await route.textContent())?.trim() !== 'ROUTE TO SERVERS') {
      fail(profile.name, 'signal compass did not point to the server-room mission');
    }
    await route.click();
    await waitForScene('servers');
    await page.waitForFunction(() => new URL(location.href).searchParams.get('scene') === 'servers');
    await expectContinuity('signal-compass travel');

    await page.screenshot({
      path: path.join(outDir, `seamless-scene-navigation-${profile.name}.png`),
      fullPage: true,
    });
  } catch (error) {
    fail(profile.name, error.stack || error.message);
    await page.screenshot({
      path: path.join(outDir, `seamless-scene-navigation-${profile.name}-failure.png`),
      fullPage: true,
    }).catch(() => {});
  } finally {
    await context.close();
  }
}

await browser.close();

await fs.writeFile(
  path.join(outDir, 'seamless-scene-navigation-report.json'),
  JSON.stringify({ baseURL, profiles: profiles.map(profile => profile.name), failures }, null, 2),
);

if (failures.length) {
  console.error('\nARKMATX SEAMLESS SCENE NAVIGATION CHECK FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ARKMATX SEAMLESS SCENE NAVIGATION CHECK PASSED.');
