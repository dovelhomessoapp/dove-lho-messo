const assert=require('node:assert/strict');const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{
 const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
 const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!f.startsWith(process.cwd()+'/')){res.writeHead(403).end();return}try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(f))}catch(e){res.writeHead(404).end()}});
 await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.DLM_TEST_BROWSER,headless:true,args:['--no-sandbox']});
 const url='http://127.0.0.1:8765/casa-dolce-casa.html';
 for(const play of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8765/')?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Runtime.enable');cdp.on('Runtime.exceptionThrown',e=>console.log('JS exception',JSON.stringify(e.exceptionDetails)));
  await page.goto(url+(play?'?distribution=google-play':''));
  await page.waitForFunction(()=>typeof window.startStripeCheckout==='function');
  assert.equal(await page.evaluate(()=>window.dlmStoreDistribution),play?'google-play':'web');
  assert.equal(await page.locator('#stripeCheckoutBtn').count(),play?0:1);
  assert.equal(await page.locator('#stripeAnnualCheckoutBtn').count(),play?0:1);
  assert.equal(await page.locator('#stripeManageSubscription').count(),play?0:1);
  if(play){
   assert.match(await page.locator('#premium').innerText(),/nuovi acquisti non sono disponibili/);
   assert.doesNotMatch(await page.locator('#premium').innerText(),/4,99|49,99|addebito|prova gratuita/);
   const error=await page.evaluate(()=>window.startStripeCheckout().catch(e=>e.message));assert.match(error,/nuovi acquisti non sono disponibili/);
   await page.goto(url);assert.equal(await page.evaluate(()=>window.dlmStoreDistribution),'google-play');assert.equal(await page.locator('#stripeCheckoutBtn').count(),0);
  }
  assert.deepEqual(errors,[]);console.log('PASS:',play?'Play UI, checkout blocked, mode survives navigation':'Web UI and Stripe checkout controls preserved');
  await context.close();
 }
 await browser.close();await new Promise(resolve=>server.close(resolve));
})().catch(e=>{console.error(e);process.exit(1)});
