import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ARKMATX_TEST_URL||'http://127.0.0.1:4173/';
const outDir=process.env.ARKMATX_SCREENSHOT_DIR||'test-results/arkmatx';
await fs.mkdir(outDir,{recursive:true});
const variants=['core','nerve','ghost'];
const profiles=[{name:'desktop',width:1280,height:720},{name:'phone',width:390,height:844}];
const failures=[];
const results=[];
const browser=await chromium.launch({headless:true});

for(const variant of variants){
 for(const profile of profiles){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  const label=`${variant}-${profile.name}`;
  try{
   const url=new URL(baseURL);url.searchParams.set('variant',variant);
   await page.goto(url.toString(),{waitUntil:'networkidle',timeout:30000});
   await page.waitForSelector('#sceneBg',{state:'visible'});
   await page.waitForTimeout(350);
   let state=await page.evaluate(()=>({dataset:document.body.dataset.variant,stored:sessionStorage.getItem('arkmatx-active-variant'),location:document.querySelector('#location')?.textContent||''}));
   if(state.dataset!==variant||state.stored!==variant)failures.push(`[${label}] forced variant failed: ${JSON.stringify(state)}`);
   await page.goto(baseURL,{waitUntil:'networkidle',timeout:30000});
   await page.waitForTimeout(350);
   state=await page.evaluate(()=>({dataset:document.body.dataset.variant,stored:sessionStorage.getItem('arkmatx-active-variant')}));
   if(state.dataset!==variant||state.stored!==variant)failures.push(`[${label}] session variant did not persist: ${JSON.stringify(state)}`);
   await page.locator('#hotspots polygon[aria-label="SERVER CLOSET"]').click({force:true});
   await page.waitForTimeout(450);
   let room=(await page.locator('#location').textContent())||'';
   if(!room.startsWith('SERVERS'))failures.push(`[${label}] server navigation failed: ${room}`);
   await page.locator('#hotspots polygon[aria-label="PARADOX"]').click({force:true});
   await page.waitForTimeout(550);
   room=(await page.locator('#location').textContent())||'';
   const raster=await page.locator('#sceneBg').evaluate(img=>({complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
   if(!room.startsWith('PARADOX')||!raster.complete||raster.naturalWidth<100)failures.push(`[${label}] paradox navigation/raster failed: ${room} ${JSON.stringify(raster)}`);
   if(pageErrors.length)failures.push(`[${label}] page errors: ${pageErrors.join(' | ')}`);
   results.push({label,state,room,raster,pageErrors});
   await page.screenshot({path:path.join(outDir,`${label}-variant.png`),fullPage:true});
  }catch(error){
   failures.push(`[${label}] variant test crashed: ${error.stack||error.message}`);
   await page.screenshot({path:path.join(outDir,`${label}-variant-failure.png`),fullPage:true}).catch(()=>{});
  }finally{await context.close()}
 }
}
await browser.close();
await fs.writeFile(path.join(outDir,'variant-report.json'),JSON.stringify({failures,results},null,2));
if(failures.length){for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log(`ARKMATX VARIANT CHECK PASSED for ${variants.length} variants across ${profiles.length} profiles.`);
