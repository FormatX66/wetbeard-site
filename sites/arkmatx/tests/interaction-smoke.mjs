import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ARKMATX_TEST_URL||'http://127.0.0.1:4173/';
const outDir=process.env.ARKMATX_SCREENSHOT_DIR||'test-results/arkmatx';
await fs.mkdir(outDir,{recursive:true});
const profiles=[{name:'desktop',width:1280,height:720},{name:'phone',width:390,height:844}];
const failures=[];
const results=[];
const browser=await chromium.launch({headless:true});

for(const profile of profiles){
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height}});
 const page=await context.newPage();
 try{
  await page.goto(baseURL,{waitUntil:'networkidle',timeout:30000});
  await page.waitForSelector('#sceneBg',{state:'visible'});
  const accessibility=await page.evaluate(()=>({
   live:document.querySelector('#readout')?.getAttribute('aria-live'),
   group:document.querySelector('#hotspots')?.getAttribute('role'),
   groupLabel:document.querySelector('#hotspots')?.getAttribute('aria-label'),
   dialog:document.querySelector('#modal')?.getAttribute('role'),
   modal:document.querySelector('#modal')?.getAttribute('aria-modal'),
   labelledBy:document.querySelector('#modal')?.getAttribute('aria-labelledby'),
   closeLabel:document.querySelector('#close')?.getAttribute('aria-label'),
  }));
  if(accessibility.live!=='polite'||accessibility.group!=='group'||accessibility.dialog!=='dialog'||accessibility.modal!=='true'||accessibility.labelledBy!=='title'||!accessibility.closeLabel){
   failures.push(`[${profile.name}] accessibility attributes missing: ${JSON.stringify(accessibility)}`);
  }

  const hint=page.locator('#hint');
  await hint.click();
  let state=await page.evaluate(()=>({reveal:document.body.classList.contains('reveal'),pressed:document.querySelector('#hint')?.getAttribute('aria-pressed')}));
  if(!state.reveal||state.pressed!=='true')failures.push(`[${profile.name}] hint did not persistently reveal hotspots: ${JSON.stringify(state)}`);

  await page.keyboard.press('Escape');
  state=await page.evaluate(()=>({reveal:document.body.classList.contains('reveal'),pressed:document.querySelector('#hint')?.getAttribute('aria-pressed')}));
  if(state.reveal||state.pressed!=='false')failures.push(`[${profile.name}] Escape did not hide revealed hotspots: ${JSON.stringify(state)}`);

  const terminal=page.locator('#hotspots polygon[aria-label="BRAIN CONNECT CRT"]');
  await terminal.focus();
  const focusReadout=(await page.locator('#readout').textContent())||'';
  if(!focusReadout.includes('TARGET // BRAIN CONNECT CRT'))failures.push(`[${profile.name}] focused hotspot did not announce target: ${focusReadout}`);

  await page.keyboard.press('ArrowRight');
  const arrowFocus=await page.evaluate(()=>document.activeElement?.getAttribute?.('aria-label')||'');
  if(arrowFocus!=='HARDWARE BENCH')failures.push(`[${profile.name}] ArrowRight did not move to next hotspot: ${arrowFocus}`);

  await terminal.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  if(!(await page.locator('#modal.show').count()))failures.push(`[${profile.name}] Space did not open terminal modal`);
  const activeInModal=await page.evaluate(()=>document.activeElement?.id||document.activeElement?.getAttribute?.('aria-label')||'');
  if(!['gitBtn','Close information panel'].includes(activeInModal))failures.push(`[${profile.name}] modal did not receive focus: ${activeInModal}`);

  await page.keyboard.press('Escape');
  if(await page.locator('#modal.show').count())failures.push(`[${profile.name}] Escape did not close modal`);
  const returnedFocus=await page.evaluate(()=>document.activeElement?.getAttribute?.('aria-label')||'');
  if(returnedFocus!=='BRAIN CONNECT CRT')failures.push(`[${profile.name}] modal close did not return focus to hotspot: ${returnedFocus}`);

  await terminal.click({force:true});
  await page.locator('#modal').evaluate(element=>element.click());
  if(await page.locator('#modal.show').count())failures.push(`[${profile.name}] backdrop click did not close modal`);

  results.push({profile,state,focusReadout,accessibility,arrowFocus,activeInModal,returnedFocus});
  await page.screenshot({path:path.join(outDir,`${profile.name}-interaction-polish.png`),fullPage:true});
 }catch(error){
  failures.push(`[${profile.name}] interaction test crashed: ${error.stack||error.message}`);
  await page.screenshot({path:path.join(outDir,`${profile.name}-interaction-polish-failure.png`),fullPage:true}).catch(()=>{});
 }finally{await context.close()}
}

await browser.close();
await fs.writeFile(path.join(outDir,'interaction-report.json'),JSON.stringify({failures,results},null,2));
if(failures.length){for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log(`ARKMATX INTERACTION CHECK PASSED across ${profiles.length} profiles.`);