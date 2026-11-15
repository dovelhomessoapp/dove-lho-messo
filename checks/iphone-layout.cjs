// Synthetic pantry data only. Block all external requests.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {webkit}=require(process.env.DLM_PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await webkit.launch();
  const origin='http://127.0.0.1:'+server.address().port;
  for(const [width,height] of [[375,667],[390,844],[844,390]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/casa-dolce-casa.html');
   await page.waitForFunction(()=>typeof window.startStripeCheckout==='function');
   await page.evaluate(()=>{
    // Dismiss first-run tutorials without changing any account or app data.
    document.querySelector('#dlmGuideOverlay')?.style.setProperty('display','none');
   });
   for(const section of ['home','items','places','books','scan','pantry','add']){
    await page.evaluate(id=>window.page(id),section);
    await page.waitForTimeout(100);
    const m=await page.evaluate(()=>{
     const nav=document.querySelector('body>nav').getBoundingClientRect();
     const app=document.querySelector('.app');
     const active=document.querySelector('.page.active');
     const fields=[...active.querySelectorAll('input,select,textarea')].filter(el=>el.getBoundingClientRect().width>0 && !['checkbox','radio','range','color','file','button','submit','reset','hidden'].includes(el.type));
     return {overflow:document.documentElement.scrollWidth>innerWidth+1,navBottom:nav.bottom,navHeight:nav.height,padding:parseFloat(getComputedStyle(app).paddingBottom),fonts:fields.map(el=>({id:el.id||el.name||el.tagName,size:parseFloat(getComputedStyle(el).fontSize)}))};
    });
    assert.equal(m.overflow,false,`${width} ${section}: horizontal overflow`);
    assert.ok(Math.abs(m.navBottom-height)<2,`${width} ${section}: navigation bottom`);
    assert.ok(m.padding>=m.navHeight+23,`${width} ${section}: bottom clearance`);
    assert.ok(m.fonts.every(field=>field.size>=16),`${width} ${section}: small form input ${JSON.stringify(m.fonts)}`);
   }
   await page.evaluate(()=>{
    window.page('pantry');
    document.querySelector('#pantryAddDetails').open=true;
    const fetchOriginal=window.fetch.bind(window);
    const lots=Array.from({length:80},(_,i)=>({
     id:'lot-'+i,name:'Alimento di prova '+i,quantity:1,zone:'dispensa',shelf:'Ripiano '+(i%5)
    }));
    let rejectNextFood=true;
    window.fetch=(url,options={})=>{
     if(typeof url!=='string'||!url.includes('/rest/v1/'))return fetchOriginal(url,options);
     if(options.method==='POST'&&url.endsWith('/pantry_lots')&&rejectNextFood){
      rejectNextFood=false;
      return Promise.resolve(Response.json({message:'Errore di prova'},{status:400}));
     }
     if(options.method==='POST'&&url.endsWith('/pantry_areas')){
      return Promise.resolve(Response.json([{id:'test-area',...JSON.parse(options.body)}]));
     }
     return Promise.resolve(Response.json(url.includes('/pantry_lots?')?lots:[]));
    };
    window.familyPantryConnect('test-home',async()=> 'test-token');
   });
   await page.locator('#pantryList .pantry-group:not(.pantry-priority) .pantry-lot-card').first().waitFor({state:'attached'});
   await page.evaluate(()=>document.querySelector('#pantryList .pantry-lot-card').closest('details').open=true);
   await page.locator('#pantryAddDetails input[type="file"]').first().waitFor({state:'visible'});
   for(const fraction of [0,0.5,1]){
    const layout=await page.evaluate(async fraction=>{
     const native=document.documentElement.dataset.distribution==='app-store';
     const scroll=native?document.querySelector('.app'):document.scrollingElement;
     const target=Math.round((scroll.scrollHeight-scroll.clientHeight)*fraction);
     scroll.scrollTo({left:100,top:target,behavior:'instant'});
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     const nav=document.querySelector('body>nav');
     const {left,right,bottom}=nav.getBoundingClientRect();
     const lastTab=nav.querySelector('button[data-page="pantry"]').getBoundingClientRect();
     return {target,x:scroll.scrollLeft,y:scroll.scrollTop,left,right,bottom,lastTabRight:lastTab.right,documentMoved:native&&(scrollX!==0||scrollY!==0)};
    },fraction);
    assert.equal(layout.x,0,`${width}: the open pantry form permits horizontal scrolling`);
    assert.equal(layout.documentMoved,false,`${width}: iOS document must stay still`);
    assert.ok(Math.abs(layout.y-layout.target)<2,`${width}: vertical pantry scrolling failed`);
    assert.ok(Math.abs(layout.left)<2 && Math.abs(layout.right-width)<2 && Math.abs(layout.bottom-height)<2,
     `${width}: the pantry navigation left the viewport edges`);
    assert.ok(layout.lastTabRight<=width,`${width}: the pantry tab is clipped`);
   }
   if(width===390){
    await page.waitForFunction(()=>document.querySelector('#pantryStatus').textContent.includes('Dispensa condivisa aggiornata'));
    const foodName=page.locator('#pantryName');
    await foodName.fill('Pasta di prova');
    await page.locator('#pantryForm').evaluate(form=>form.requestSubmit());
    await page.waitForFunction(()=>document.querySelector('#pantrySaveError').textContent.includes('Errore di prova'));
    assert.equal(await foodName.inputValue(),'Pasta di prova','A failed save must preserve the food form');
    const forms=[
     ['#pantryForm','#pantryName','Pasta di prova','Alimento salvato'],
     ['#pantryAreaEditor','#pantryAreaName','Frigo di prova','Ambiente condiviso salvato'],
     ['#pantryStockForm','#pantryStockName','Latte di prova','Scorta minima salvata'],
     ['#shoppingForm','#shoppingName','Pane di prova','Aggiunto alla lista condivisa']
    ];
    for(const [selector,name,value,message] of forms){
     const form=page.locator(selector);
     await form.evaluate(el=>{el.closest('details').open=true});
     await page.locator(name).fill(value);
     if(selector==='#pantryForm'){
      await form.locator('button[type="submit"]').scrollIntoViewIfNeeded();
     }
     await form.evaluate(el=>el.requestSubmit());
     await page.waitForFunction(id=>!document.querySelector(id).closest('details').open,selector);
     assert.equal(await page.locator(name).inputValue(),'');
     assert.ok((await page.locator('#toast').textContent()).includes(message));
     if(selector==='#pantryForm'){
      const summary=await page.locator('#pantryAddDetails > summary').boundingBox();
      const nav=await page.locator('body > nav').boundingBox();
      assert.ok(summary.y>=0 && summary.y+summary.height<=nav.y,'The closed food form must remain visible after saving');
     }
    }
   }
   await page.evaluate(()=>window.page('home'));
   assert.equal(await page.evaluate(()=>document.querySelector('.app').scrollTop+scrollY),0,'Changing sections must return to the top');
   assert.deepEqual(errors,[]);
   console.log(`PASS WebKit ${width}x${height}: seven sections, navigation, clearance, form text and pantry scrolling`);
   await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
