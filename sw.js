/* Dove l'ho messo? - aggiornamento PWA v09 */
const CACHE='dlm-v09-app-shell';
const APP_SHELL=['./','./index.html','./style.css','./app.js','./qr.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(APP_SHELL);await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('dlm-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;event.respondWith((async()=>{try{const res=await fetch(req,{cache:'no-store'});if(res.ok&&res.type==='basic'){const cache=await caches.open(CACHE);await cache.put(req,res.clone())}return res}catch(e){const cached=await caches.match(req,{ignoreSearch:true});if(cached)return cached;if(req.mode==='navigate'){const fallback=await caches.match('./index.html');if(fallback)return fallback}throw e}})())});
