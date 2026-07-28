import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ARKMATX_TEST_URL||'http://127.0.0.1:4173/';
const outDir=process.env.ARKMATX_SCREENSHOT_DIR||'test-results/arkmatx';
await fs.mkdir(outDir,{recursive:true});
const failures=[];const fail=m=>failures.push(m);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:720}});
const page=await context.newPage();
const waitScene=scene=>page.waitForFunction(expected=>(document.querySelector('#location')?.textContent||'').startsWith(expected.toUpperCase()),scene,{timeout:15000});
const close=async()=>{const button=page.locator('#close');if(await button.count())await button.click({force:true}).catch(()=>{});};
const activate=async label=>{const spot=page.locator(`#hotspots polygon[aria-label="${label}"]`);await spot.evaluate(node=>node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window})));};
try{
 await page.goto(`${baseURL}?login=ledger-alpha&noresume=1`,{waitUntil:'networkidle'});await waitScene('workshop');
 if(await page.locator('#discoveries').count()!==1)fail('discovery ledger button missing');
 await activate('BRAIN CONNECT CRT');await close();
 await activate('SERVER CLOSET');await waitScene('servers');
 await activate('MOSS NODE');await close();
 await page.locator('#discoveries').click();
 const ledger=await page.locator('#copy').textContent();
 if(!ledger?.includes('WORKSHOP')||!ledger.includes('BRAIN CONNECT CRT')||!ledger.includes('SERVER CLOSET'))fail('workshop discoveries missing');
 if(!ledger?.includes('SERVERS')||!ledger.includes('MOSS NODE'))fail('server discovery missing');
 await page.screenshot({path:path.join(outDir,'discovery-ledger-alpha.png'),fullPage:true});
 await page.goto(`${baseURL}?login=ledger-beta&noresume=1`,{waitUntil:'networkidle'});await waitScene('workshop');await page.locator('#discoveries').click();
 const beta=await page.locator('#copy').textContent();if(beta?.includes('BRAIN CONNECT')||beta?.includes('MOSS NODE'))fail('new login inherited discovery ledger');
}catch(error){fail(error.stack||error.message);await page.screenshot({path:path.join(outDir,'discovery-ledger-failure.png'),fullPage:true}).catch(()=>{});}finally{await context.close();await browser.close();}
await fs.writeFile(path.join(outDir,'discovery-ledger-report.json'),JSON.stringify({baseURL,failures},null,2));
if(failures.length){console.error('\nARKMATX DISCOVERY LEDGER CHECK FAILED\n');for(const failure of failures)console.error(`- ${failure}`);process.exit(1);}console.log('ARKMATX DISCOVERY LEDGER CHECK PASSED.');
