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
  parentId:'wardrobe', photo:i%2?photo:''})),
 {id:'kitchen',name:'Cucina',parentId:''},
 {id:'cupboard',name:'armadietto sotto finestra',parentId:'kitchen'},
 {id:'inside-shelf',name:'Ripiano 1',parentId:'cupboard'},
 {id:'direct-shelf',name:'Ripiano 1',parentId:'kitchen'}];
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
   assert.equal(await page.locator('#dlmItemPlaceOptions>details').count(),2,'Initially show two closed rooms');
   assert.equal(await page.locator('#dlmItemPlaceOptions details[open]').count(),0);
   assert.equal(await page.locator('[data-place-choice="shelf-23"]').isVisible(),false);
   await page.locator('[data-branch="room"]>summary>.dlm-branch-arrow').click();
   assert.equal(await page.locator('[data-place-choice="wardrobe"]').isVisible(),true);
   assert.equal(await page.locator('[data-place-choice="shelf-23"]').isVisible(),false);
   await page.locator('[data-branch="wardrobe"]>summary>.dlm-branch-arrow').click();
   assert.equal(await page.locator('[data-place-choice="shelf-23"]').isVisible(),true);
   await page.locator('[data-place-choice="shelf-23"]').click();
   assert.equal(await page.locator('#itemPlace').inputValue(),'shelf-23');
   assert.equal(await page.locator('#dlmItemPlacePanel').evaluate(el=>el.hidden),true);
   assert.ok((await page.locator('#dlmItemPlaceSelected').innerText()).includes('Camera matrimoniale'));
   await page.locator('#dlmItemPlaceButton').click();
   await page.locator('#dlmItemPlaceSearch').fill('Cucina');
   assert.equal(await page.locator('#dlmItemPlaceOptions button').count(),5,'Search finds hidden descendants');
   assert.equal(await page.locator('[data-place-choice="inside-shelf"] small').textContent(),'In Cucina › armadietto sotto finestra');
   assert.equal(await page.locator('[data-place-choice="direct-shelf"] small').textContent(),'In Cucina');
   const rows=await page.locator('#dlmItemPlaceOptions').evaluate(list=>[...list.querySelectorAll('button')].map(row=>{
    const r=row.getBoundingClientRect();
    return {height:r.height,ok:[...row.querySelectorAll('strong,small,img')].every(el=>{const b=el.getBoundingClientRect();return b.top>=r.top-1&&b.bottom<=r.bottom+1&&b.left>=r.left-1&&b.right<=r.right+1})};
   }));
   assert.ok(rows.every(row=>row.height>=63&&row.ok),'Choice text and images fit narrow rows');
   await page.locator('[data-place-choice="cupboard"]').click();
   assert.equal(await page.locator('#itemPlace').inputValue(),'cupboard','Parent rooms and cupboards remain selectable');
   await page.evaluate(()=>{
    document.querySelector('#itemName').value='Bozza da annullare';
    document.querySelector('#desc').value='Non salvare';
    document.querySelector('#itemForm').dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('[data-cancel-item]').click();
   });
   assert.equal(await page.evaluate(()=>localStorage.getItem('dlm-casa-dolce-casa-draft-v1')),null);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dlm-casa-dolce-casa-v1')).items.length),0);
   await page.evaluate(()=>{
    window.page('add');
    document.querySelector('#itemName').value='Oggetto di prova';
    document.querySelector('#itemPlace').value='room';
    document.querySelector('#itemForm').requestSubmit();
   });
   assert.equal(await page.locator('#items').evaluate(el=>el.classList.contains('active')),true);
   assert.equal(await page.locator('#itemList details[open]').count(),0,'Even the only room stays closed after saving');
   assert.equal(await page.evaluate(()=>localStorage.getItem('dlm-casa-dolce-casa-draft-v1')),null,'Save must not recreate draft');
   await page.evaluate(()=>{
    document.querySelector('#itemList details').open=true;
    window.editItem(JSON.parse(localStorage.getItem('dlm-casa-dolce-casa-v1')).items[0].id);
    document.querySelector('#itemName').value='Modifica da annullare';
    document.querySelectorAll('[data-cancel-item]')[1].click();
    window.renderItems();
   });
   assert.equal(await page.locator('#itemList details[open]').count(),0,'Refresh preserves collapsed rooms');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dlm-casa-dolce-casa-v1')).items[0].name),'Oggetto di prova','Cancel edit preserves saved item');
   // A focused iPhone field must not have its downward touch cancelled by the Android guard.
   const touchAllowed=await page.evaluate(()=>{
    window.page('add');window.scrollTo(0,0);document.querySelector('#itemName').focus();
    const send=(type,y)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:[{clientX:100,clientY:y}]});document.querySelector('#itemName').dispatchEvent(event);return !event.defaultPrevented};
    send('touchstart',100);return send('touchmove',160);
   });
   assert.ok(touchAllowed,'iPhone upward-page gesture must remain available with a focused input');
   console.log(`PASS WebKit ${width}x${height}: collapsed hierarchy, nested choices, search, wrapping, cancel, save and iPhone touch`);
   await context.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
