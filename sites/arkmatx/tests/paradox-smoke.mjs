import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ARKMATX_TEST_URL||'http://127.0.0.1:4173/';
const outDir=process.env.ARKMATX_SCREENSHOT_DIR||'test-results/arkmatx';
await fs.mkdir(outDir,{recursive:true});
const viewports=[
 {name:'desktop-16x9',width:1440,height:810},
 {name:'desktop-3x2',width:1440,height:960},
 {name:'tablet-landscape',width:1024,height:768},
 {name:'phone-portrait',width:390,height:844},
 {name:'phone-landscape',width:844,height:390},
];
const failures=[];
const browser=await chromium.launch({headless:true});
for(const vp of viewports){
 const context=await browser.newContext({viewport:{width:vp.width,height:vp.height}});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 try{
  await page.goto(baseURL,{waitUntil:'networkidle',timeout:30000});
  await page.waitForSelector('#sceneBg',{state:'visible'});
  await page.locator('#hotspots polygon[aria-label="SERVER CLOSET"]').click({force:true});
  await page.waitForTimeout(450);
  await page.locator('#hotspots polygon[aria-label="PARADOX"]').click({force:true});
  await page.waitForTimeout(650);
  const location=(await page.locator('#location').textContent())||'';
  const raster=await page.locator('#sceneBg').evaluate(img=>({src:img.getAttribute('src')||'',complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
  if(!location.startsWith('PARADOX'))failures.push(`[${vp.name}] paradox navigation failed: ${location}`);
  if(!raster.src.startsWith('data:image/jpeg;base64,')||!raster.complete||raster.naturalWidth<100||raster.naturalHeight<50)failures.push(`[${vp.name}] paradox chunked raster not active: ${JSON.stringify(raster)}`);
  for(const label of ['TERMINAL A','TERMINAL B','TERMINAL C','MAINTENANCE CHANNEL']){
   if(await page.locator(`#hotspots polygon[aria-label="${label}"]`).count()!==1)failures.push(`[${vp.name}] missing ${label}`);
  }
  if(errors.length)failures.push(`[${vp.name}] browser errors: ${errors.join(' | ')}`);
  await page.screenshot({path:path.join(outDir,`${vp.name}-paradox.png`),fullPage:true});
 }catch(error){
  failures.push(`[${vp.name}] paradox test crashed: ${error.stack||error.message}`);
  await page.screenshot({path:path.join(outDir,`${vp.name}-paradox-failure.png`),fullPage:true}).catch(()=>{});
 }finally{await context.close()}
}
await browser.close();
if(failures.length){for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log(`ARKMATX PARADOX CHECK PASSED across ${viewports.length} viewport profiles.`);
