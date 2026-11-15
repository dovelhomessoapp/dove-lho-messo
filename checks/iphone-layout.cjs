// Empty local archive only: block all external requests, including Supabase.
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
    document.querySelector('#pantryOnline').hidden=false;
    document.querySelector('#pantryAddDetails').open=true;
   });
   await page.locator('#pantryAddDetails input[type="file"]').first().waitFor({state:'visible'});
   for(const fraction of [0,0.5,1]){
    const layout=await page.evaluate(async fraction=>{
     const scroll=document.scrollingElement;
     const target=Math.round((scroll.scrollHeight-innerHeight)*fraction);
     window.scrollTo({left:100,top:target,behavior:'instant'});
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     const nav=document.querySelector('body>nav');
     const {left,right,bottom}=nav.getBoundingClientRect();
     const lastTab=nav.querySelector('button[data-page="pantry"]').getBoundingClientRect();
     return {target,x:scrollX,y:scrollY,left,right,bottom,lastTabRight:lastTab.right};
    },fraction);
    assert.equal(layout.x,0,`${width}: the open pantry form permits horizontal scrolling`);
    assert.ok(Math.abs(layout.y-layout.target)<2,`${width}: vertical pantry scrolling failed`);
    assert.ok(Math.abs(layout.left)<2 && Math.abs(layout.right-width)<2 && Math.abs(layout.bottom-height)<2,
     `${width}: the pantry navigation left the viewport edges`);
    assert.ok(layout.lastTabRight<=width,`${width}: the pantry tab is clipped`);
   }
   assert.deepEqual(errors,[]);
   console.log(`PASS WebKit ${width}x${height}: seven sections, navigation, clearance, form text and pantry scrolling`);
   await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
