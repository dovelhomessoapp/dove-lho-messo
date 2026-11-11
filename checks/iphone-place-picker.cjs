// Synthetic local archive only. Never contact authentication or production data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {webkit} = require(process.env.DLM_PLAYWRIGHT_MODULE || 'playwright');
const photo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42"><rect width="42" height="42" fill="purple"/></svg>');
const places = [{id:'room', name:'Camera matrimoniale', parentId:''},
 {id:'wardrobe', name:'Armadio bianco con ante scorrevoli', parentId:'room'},
 ...Array.from({length:24}, (_,i)=>({id:'shelf-'+i,
  name:i===23?'Scatola verde dei ricordi e degli oggetti da conservare con attenzione':'Ripiano '+(i+1),
  parentId:'wardrobe', photo:i%2?photo:''}))];
(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{
   res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':'text/html');
   res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await webkit.launch();
  const origin='http://127.0.0.1:'+server.address().port;
  for(const [width,height] of [[375,667],[390,844],[844,390]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
   await context.addInitScript(data=>localStorage.setItem('dlm-casa-dolce-casa-v1',JSON.stringify({places:data,items:[]})),places);
   const page=await context.newPage();
   await page.goto(origin+'/casa-dolce-casa.html');
   await page.waitForFunction(()=>typeof window.startStripeCheckout==='function');
   await page.evaluate(()=>{
    document.querySelector('#dlmGuideOverlay')?.style.setProperty('display','none');
    window.page('add');
    document.querySelector('#dlmItemPlaceButton').click();
   });
   const measurements=await page.locator('#dlmItemPlaceOptions').evaluate(list=>{
    const box=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};
    return {clientHeight:list.clientHeight,scrollHeight:list.scrollHeight,
     rows:[...list.children].map(row=>({row:box(row),parts:[...row.querySelectorAll('.dlm-place-option-icon,.dlm-place-option-label,strong,small')].map(box)}))};
   });
   assert.equal(measurements.rows.length,places.length+1,'All locations and unassigned must be listed');
   assert.ok(measurements.scrollHeight>measurements.clientHeight,'Long list must scroll');
   assert.ok(measurements.clientHeight<=391,'List must stay bounded');
   measurements.rows.forEach(({row,parts},i)=>{
    assert.ok(row.height>=63,`${width}: row ${i} collapsed to ${row.height}px`);
    for(const p of parts){
     assert.ok(p.top>=row.top-1 && p.bottom<=row.bottom+1,`${width}: row ${i} text/icon exceeds row height`);
     assert.ok(p.left>=row.left-1 && p.right<=row.right+1,`${width}: row ${i} exceeds row width`);
    }
    if(i)assert.ok(row.top>=measurements.rows[i-1].row.bottom+7,`${width}: overlapping rows`);
   });
   // Select the last result through a real click after scrolling the list.
   await page.locator('[data-place-choice="shelf-23"]').click();
   assert.equal(await page.locator('#itemPlace').inputValue(),'shelf-23');
   assert.equal(await page.locator('#dlmItemPlacePanel').evaluate(el=>el.hidden),true);
   assert.ok((await page.locator('#dlmItemPlaceSelected').innerText()).includes('Camera matrimoniale'));
   await page.locator('#dlmItemPlaceButton').click();
   await page.locator('#dlmItemPlaceSearch').fill('Scatola verde');
   assert.equal(await page.locator('#dlmItemPlaceOptions button').count(),2,'Search includes match and unassigned');
   await page.locator('[data-place-choice=""]').click();
   assert.equal(await page.locator('#itemPlace').inputValue(),'');
   console.log(`PASS WebKit ${width}x${height}: 26 nested locations, wrapping, scrolling, selection and search`);
   await context.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
