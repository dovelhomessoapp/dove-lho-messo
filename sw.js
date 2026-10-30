/* Dove l'ho messo? - aggiornamento PWA v19 */
const CACHE='dlm-v33-app-shell';
const APP_SHELL=['./','./index.html','./casa-dolce-casa.html','./style.css','./app.js','./casa-dolce-casa.js','./casa-dolce-casa-bridge.js','./casa-dolce-casa-pantry.js','./casa-dolce-casa-gemini.js','./casa-dolce-casa-photo-ai.js','./casa-dolce-casa-value-estimate.js','./qr.js','./manifest.webmanifest','./casa-dolce-casa.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(APP_SHELL);await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('dlm-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;event.respondWith((async()=>{try{const res=await fetch(req,{cache:'no-store'});if(res.ok&&res.type==='basic'){const cache=await caches.open(CACHE);await cache.put(req,res.clone())}return res}catch(e){const cached=await caches.match(req,{ignoreSearch:true});if(cached)return cached;if(req.mode==='navigate'){const fallback=await caches.match('./index.html');if(fallback)return fallback}throw e}})())});

/* Push notification handlers. Delivery requires a separately configured VAPID sender
   and an authenticated subscription registration endpoint. */
self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};try{data=event.data?.json()||{}}catch(e){}
    if(data.type!=='pantry-expiry'&&data.type!=='admin-event')return;
    const isAdmin=data.type==='admin-event';
    const title=isAdmin?(typeof data.title==='string'?data.title.slice(0,80):'👑 Dove l’ho messo? Admin'):'🔔 Dove l’ho messo?';
    const body=typeof data.body==='string'?data.body.slice(0,180):(isAdmin?'Nuovo evento amministratore.':'Controlla gli alimenti in scadenza nella tua dispensa.');
    await self.registration.showNotification(title,{
      body,icon:'./icon-192.png',badge:'./icon-192.png',
      tag:isAdmin?'dlm-admin-'+String(data.event_id||Date.now()):'dlm-expiry-'+String(data.date||'today').replace(/[^0-9-]/g,'').slice(0,12),
      data:{url:isAdmin?'./casa-dolce-casa.html#admin':'./casa-dolce-casa.html#pantry',type:data.type}
    });
  })());
});
self.addEventListener('notificationclick',event=>{
  const data=event.notification.data||{};
  event.notification.close();
  event.waitUntil((async()=>{
    const target=new URL(data.url||'./casa-dolce-casa.html',self.registration.scope).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(new URL(client.url).pathname===new URL(target).pathname){
        await client.focus();
        if(data.type==='pantry-expiry')client.postMessage({type:'DLM_OPEN_PANTRY'});
        else if(data.type==='admin-event')client.postMessage({type:'DLM_OPEN_ADMIN'});
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
