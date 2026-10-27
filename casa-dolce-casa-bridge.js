/* Casa dolce casa: archivio condiviso separato dall'inventario personale. */
(()=>{
const base='https://ephdnunjudbwlgbxdadm.supabase.co';
const key='sb_publishable_3kcIRxESMdgXMEwvFs3_0A_0JZkJqZT';
const home=document.getElementById('home');
const panel=document.createElement('section');panel.className='panel cd-family-panel';
panel.innerHTML='<div class="cd-family-heading"><img class="cd-family-icon" src="./assets/casa-dolce-casa-3d.png" alt="" style="object-fit:contain;overflow:visible"><div><h3>Casa dolce casa</h3><p>Archivio familiare condiviso</p></div></div><form id="familyForm"><label>Email<input type="email" id="familyEmail" required autocomplete="email"></label><label>Password<input type="password" id="familyPass" required autocomplete="current-password"></label><button class="primary">Accedi</button></form><details id="familySignupBox"><summary>✨ Crea il tuo account</summary><form id="familySignup"><label>Nome o nickname<input id="signupNickname" type="text" maxlength="40" autocomplete="nickname" required></label><label>Email personale<input id="signupEmail" type="email" autocomplete="email" required></label><label>Nuova password<input id="signupPass" type="password" autocomplete="new-password" minlength="8" required></label><button type="submit" class="secondary">Crea account</button></form><p class="hint">Dopo la conferma dell’email potrai accedere e creare la tua casa, oppure entrare in quella di un familiare tramite invito.</p></details><section id="familyAcceptBox" hidden><h3>💌 Accetta invito familiare</h3><p>Accedi con la stessa email a cui è destinato l’invito, poi premi il pulsante qui sotto.</p><button id="familyAcceptBtn" class="secondary" type="button">Accetta invito</button></section><section id="familyOnline" hidden><p id="familyHouse"></p><p id="familyCount"></p><details id="familyMembersBox" style="margin:12px 0"><summary>👨‍👩‍👧‍👦 La mia famiglia</summary><div id="familyMembersList"></div><form id="familyNicknameForm"><label>Il mio nome o nickname<input id="familyNickname" type="text" maxlength="40" required></label><button type="submit" class="secondary">Salva nome</button></form><form id="familyInviteForm" hidden><label>Email del familiare<input id="familyInviteEmail" type="email" required></label><button class="secondary" type="submit">Invia invito via email</button></form><div id="familyInviteResult" aria-live="polite"></div></details><button type="button" class="secondary" id="familyReload">Aggiorna inventario</button><button type="button" class="secondary" id="familyExit">Esci</button></section><p class="hint" id="familyMsg" role="status">Gli oggetti online compariranno nella sezione Oggetti dopo l’accesso.</p>';
home.append(panel);
const forgotButton=document.createElement('button');
forgotButton.id='familyForgotPassword';
forgotButton.type='button';
forgotButton.className='secondary';
forgotButton.textContent='🔐 Password dimenticata?';
forgotButton.style.margin='8px 0 12px';
const forgotBox=document.createElement('section');
forgotBox.id='familyForgotBox';
forgotBox.hidden=true;
forgotBox.style.cssText='margin:10px 0 16px;padding:16px;border:1px solid #e5c9f4;border-radius:16px;background:#faf4ff';
forgotBox.innerHTML='<h3>💜 Recupera la password</h3><p>Inserisci la tua email per ricevere un link di recupero.</p><form id="familyForgotForm"><label>Email<input id="familyForgotEmail" type="email" autocomplete="email" required></label><button class="primary" type="submit">Invia link di recupero</button></form><p id="familyForgotStatus" role="status" aria-live="polite"></p>';
panel.querySelector('#familyForm').after(forgotButton,forgotBox);
forgotButton.onclick=()=>{forgotBox.hidden=!forgotBox.hidden;if(!forgotBox.hidden){document.getElementById('familyForgotEmail').value=document.getElementById('familyEmail').value;document.getElementById('familyForgotEmail').focus()}};
forgotBox.querySelector('form').onsubmit=async e=>{
 e.preventDefault();
 const email=document.getElementById('familyForgotEmail').value.trim();
 const status=document.getElementById('familyForgotStatus');
 const button=forgotBox.querySelector('button[type="submit"]');
 button.disabled=true;status.textContent='Invio in corso…';
 try{
  const redirectTo=new URL('./casa-dolce-casa.html',location.href).href;
  const r=await fetch(base+'/auth/v1/recover?redirect_to='+encodeURIComponent(redirectTo),{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.msg||data.message||data.error_description||'Invio non riuscito');
  status.textContent='💜 Se l’indirizzo è registrato, riceverai un’email. Controlla anche lo spam.';
 }catch(err){status.textContent='Errore: '+err.message}
 finally{button.disabled=false}
};
const recoveryParams=new URLSearchParams(location.hash.replace(/^#/,''));
const recoveryAccessToken=recoveryParams.get('type')==='recovery'?recoveryParams.get('access_token'):null;
if(recoveryAccessToken){forgotButton.hidden=true;forgotBox.hidden=true;}
// Primo passo guidato per una casa appena creata, senza modificare i dati.
const firstObjectGuide=document.createElement('div');
firstObjectGuide.id='familyFirstObjectGuide';firstObjectGuide.hidden=true;
firstObjectGuide.style.cssText='margin:14px 0;padding:16px;border:1px solid #e5c9f4;border-radius:18px;background:#faf4ff';
firstObjectGuide.innerHTML='<h3>✨ La tua casa è pronta!</h3><p>Inizia aggiungendo il tuo primo oggetto. Puoi fotografarlo, dargli un nome e scegliere dove si trova.</p><button type="button" class="primary" id="familyFirstObjectBtn">＋ Aggiungi il primo oggetto</button>';
panel.append(firstObjectGuide);
document.getElementById('familyFirstObjectBtn').onclick=()=>document.querySelector('#home [data-page="add"]')?.click();
// Creazione autonoma della casa: visibile solo a utenti autenticati senza casa e senza invito.
const createHomeBox=document.createElement('section');
createHomeBox.id='familyCreateHomeBox';
createHomeBox.hidden=true;
createHomeBox.style.cssText='margin:14px 0;padding:16px;border:1px solid #e5c9f4;border-radius:18px;background:#faf4ff';
createHomeBox.innerHTML='<h3>🏡 Crea la mia casa</h3><p>Inizia il tuo archivio privato. Potrai invitare la tua famiglia in seguito.</p><form id="familyCreateHomeForm"><label>Come vuoi chiamare la tua casa?<input id="familyCreateHomeName" type="text" maxlength="60" minlength="2" placeholder="Es. Casa nostra" required></label><button class="primary" type="submit">Crea la mia casa</button></form>';
panel.append(createHomeBox);
// Recupero password Supabase: il link email apre questa pagina con un token temporaneo.
if(recoveryAccessToken){
 const resetBox=document.createElement('section');
 resetBox.className='panel';
 resetBox.style.cssText='margin:14px 0;padding:18px;border:2px solid #c9a1e8;border-radius:18px;background:#fff9ff';
 resetBox.innerHTML='<h3>🔐 Scegli una nuova password</h3><p>Inserisci una nuova password di almeno 8 caratteri. Non usare quella vecchia.</p><form id="familyPasswordResetForm"><label>Nuova password<input id="familyNewPassword" type="password" autocomplete="new-password" minlength="8" required></label><label>Ripeti la password<input id="familyRepeatPassword" type="password" autocomplete="new-password" minlength="8" required></label><button type="submit" class="primary">Salva nuova password</button></form><p id="familyResetStatus" role="status"></p>';
 panel.prepend(resetBox);
 // Il recupero deve essere visibile subito, anche dalla prima apertura dell'app.
 resetBox.id='familyRecoveryScreen';
 resetBox.style.cssText+=';position:fixed;z-index:10020;inset:0;margin:0;border:0;border-radius:0;overflow-y:auto;padding:calc(env(safe-area-inset-top) + 30px) 22px calc(env(safe-area-inset-bottom) + 30px);background:#fff9ff';
 panel.querySelector('#familyForm').hidden=true;
 panel.querySelector('#familySignupBox').hidden=true;
 resetBox.querySelector('form').onsubmit=async e=>{
  e.preventDefault();
  const pass=resetBox.querySelector('#familyNewPassword').value;
  const repeat=resetBox.querySelector('#familyRepeatPassword').value;
  const status=resetBox.querySelector('#familyResetStatus');
  if(pass!==repeat){status.textContent='Le due password non coincidono.';return}
  const button=e.submitter;button.disabled=true;status.textContent='Salvataggio in corso…';
  try{
   const response=await fetch(base+'/auth/v1/user',{method:'PUT',headers:{apikey:key,Authorization:'Bearer '+recoveryAccessToken,'Content-Type':'application/json'},body:JSON.stringify({password:pass})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.msg||data.message||data.error_description||'Impossibile aggiornare la password. Richiedi un nuovo link.');
   history.replaceState(null,'',location.pathname+location.search);
   // Mostra la conferma una sola volta e rimuovi completamente il modulo di recupero.
   resetBox.remove();
   const confirmation=document.createElement('div');
   confirmation.setAttribute('role','status');
   confirmation.textContent='💜 Password aggiornata con successo! Ora puoi usare la nuova password per accedere.';
   confirmation.style.cssText='position:fixed;z-index:10021;top:calc(env(safe-area-inset-top) + 18px);left:16px;right:16px;max-width:560px;margin:0 auto;padding:18px 20px;border:2px solid #d8b9ed;border-radius:18px;background:#fff9ff;color:#63338e;box-shadow:0 8px 26px #44225533;font-weight:700;text-align:center';
   document.body.append(confirmation);
   const closeConfirmation=document.createElement('button');
   closeConfirmation.type='button';closeConfirmation.textContent='Chiudi';
   closeConfirmation.style.cssText='display:block;margin:12px auto 0;padding:8px 22px;border-radius:20px;background:#8b45c3;color:white;border:0';
   closeConfirmation.onclick=()=>confirmation.remove();
   confirmation.append(closeConfirmation);
   panel.querySelector('#familyForm').hidden=false;
  }catch(err){status.textContent='Errore: '+err.message}
  finally{button.disabled=false}
 };
}

const el=id=>document.getElementById(id);
let token=null,house=null,sending=false;
let refreshToken=null;
let familyNicknames=new Map();
function currentFamilyUserId(){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub||null}catch{return null}}
function showFamilyCreator(item){return item?.createdByName||familyNicknames.get(item?.createdBy)||'Non identificato'}
const SESSION_KEY='dlm-casa-dolce-casa-family-refresh-v1';
const cloudIds=new Set();
const cloudPlaceIds=new Set();
const pendingPhotos=new Set();
const EDIT_KEY='dlm-casa-dolce-casa-offline-edits-v1';
const pendingEdits=new Map(Object.entries(JSON.parse(localStorage.getItem(EDIT_KEY)||'{}')));
const saveEdits=()=>localStorage.setItem(EDIT_KEY,JSON.stringify(Object.fromEntries(pendingEdits)));
const deletingIds=new Set();
const CREATE_KEY='dlm-casa-dolce-casa-pending-creates-v1';
const pendingCreates=new Set(JSON.parse(localStorage.getItem(CREATE_KEY)||'[]'));
const saveCreates=()=>localStorage.setItem(CREATE_KEY,JSON.stringify([...pendingCreates]));
const seenIds=new Set(JSON.parse(localStorage.getItem('dlm-casa-dolce-casa-seen-v1')||'[]'));
const saveSeen=()=>localStorage.setItem('dlm-casa-dolce-casa-seen-v1',JSON.stringify([...seenIds]));
async function uploadPhoto(item){
 const path=house.id+'/'+item.id+'-'+crypto.randomUUID()+'.jpg';
 const binary=await (await fetch(item.photo)).blob();
 const response=await familyFetch(base+'/storage/v1/object/foto-oggetti/'+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'image/jpeg'},body:binary});
 if(!response.ok)throw Error((await response.json().catch(()=>({}))).message||'Upload non riuscito');
 return path;
}
async function signPhoto(path){
 const response=await familyFetch(base+'/storage/v1/object/sign/foto-oggetti/'+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});
 const data=await response.json();
 if(!response.ok||!data.signedURL)throw Error(data.message||'Foto non disponibile');
 return base+'/storage/v1'+data.signedURL;
}
const PHOTO_CACHE='dlm-casa-dolce-casa-photo-cache-v33';
async function cacheFamilyPhoto(id,url){
 if(!('caches' in window)||!url||!url.startsWith('https://'))return;
 try{
  const response=await fetch(url);
  if(!response.ok)return;
  const cache=await caches.open(PHOTO_CACHE);
  await cache.put('offline-photo-'+id,response);
 }catch(e){}
}
async function restoreFamilyPhotos(){
 if(!('caches' in window))return;
 try{
  const cache=await caches.open(PHOTO_CACHE);
  for(const item of db.items){
   if(!item.photo||!item.photo.startsWith('https://'))continue;
   const hit=await cache.match('offline-photo-'+item.id);
   if(!hit)continue;
   const blob=await hit.blob();
   const reader=new FileReader();
   const data=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)});
   item.photo=data;
  }
  renderItems();
 }catch(e){}
}
void restoreFamilyPhotos();
const notice=s=>el('familyMsg').textContent=s;
async function renew(){
 if(!refreshToken)throw Error('Sessione scaduta');
 const r=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refreshToken})});
 const d=await r.json();if(!r.ok)throw Error(d.msg||d.message||'Accesso scaduto');
 token=d.access_token;refreshToken=d.refresh_token;
 localStorage.setItem(SESSION_KEY,refreshToken);
 return token;
}
let renewalPromise=null;
function needsRenewal(){
 try{const p=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return Date.now()>=(p.exp-90)*1000}catch{return true}
}
async function refreshOnce(){
 if(!renewalPromise)renewalPromise=renew().finally(()=>{renewalPromise=null});
 return renewalPromise;
}
async function familyFetch(url,options={}){
 const isFamily=!!token&&!!refreshToken;
 if(isFamily&&needsRenewal())await refreshOnce();
 const headers={...options.headers};
 if(isFamily)headers.Authorization='Bearer '+token;
 let response=await fetch(url,{...options,headers});
 if(response.status===401&&isFamily){
  await refreshOnce();
  headers.Authorization='Bearer '+token;
  response=await fetch(url,{...options,headers});
 }
 return response;
}
window.casaDolceCasaRecognize=async function(imageBase64){
 if(!token||!house)throw Error('Accedi prima a Casa dolce casa con il tuo account familiare.');
 const response=await familyFetch(base+'/functions/v1/riconosci-oggetto',{
  method:'POST',
  headers:{apikey:key,'Content-Type':'application/json'},
  body:JSON.stringify({imageBase64})
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||data.message||'Errore '+response.status);
 return data;
};
async function get(path,t){const r=await familyFetch(base+path,{headers:{apikey:key,Authorization:'Bearer '+t},cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.message||'Errore di lettura');return d}
const PLACE_PHOTOS_KEY='dlm-casa-dolce-casa-location-photos-v37';
function localPlacePhotos(){try{return JSON.parse(localStorage.getItem(PLACE_PHOTOS_KEY)||'{}')}catch{return {}}}
async function syncPlacePhotos(){
 if(!token||!house||!navigator.onLine)return;
 const photos=localPlacePhotos();
 let synced={};try{synced=JSON.parse(localStorage.getItem('dlm-casa-dolce-casa-location-synced-v38')||'{}')}catch{}
 for(const place of db.places){
  if(!cloudPlaceIds.has(place.id))continue;
  const path=house.id+'/location-'+place.id+'.jpg';
  if(photos[place.id]?.startsWith('data:image/')&&synced[place.id]!==photos[place.id].length+':'+photos[place.id].slice(-60)){
   try{
    const binary=await(await fetch(photos[place.id])).blob();
    const result=await familyFetch(base+'/storage/v1/object/foto-oggetti/'+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'image/jpeg','x-upsert':'true'},body:binary});
    if(!result.ok)throw Error((await result.json().catch(()=>({}))).message||'Caricamento foto fallito');
    synced[place.id]=photos[place.id].length+':'+photos[place.id].slice(-60);
    localStorage.setItem('dlm-casa-dolce-casa-location-synced-v38',JSON.stringify(synced));
   }catch(err){notice('Foto posizione conservata sul telefono: '+err.message);continue}
  }
  if(!photos[place.id]){
   try{
    const signed=await signPhoto(path);
    const response=await fetch(signed);
    if(!response.ok)continue;
    const blob=await response.blob();
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)});
    photos[place.id]=data;
    localStorage.setItem(PLACE_PHOTOS_KEY,JSON.stringify(photos));
    synced[place.id]=data.length+':'+data.slice(-60);
    localStorage.setItem('dlm-casa-dolce-casa-location-synced-v38',JSON.stringify(synced));
   }catch(err){}
  }
 }
 renderPlaces();
}
async function load(){
 const objects=await get('/rest/v1/items?select=id,kind,title,author,isbn,description,image_url,location_id,estimated_value,created_at,created_by,updated_by&home_id=eq.'+house.id,token);
 const places=await get('/rest/v1/locations?select=id,name,parent_id&home_id=eq.'+house.id,token);
 const members=await get('/rest/v1/home_members?select=user_id,nickname,role&home_id=eq.'+house.id,token);
 familyNicknames=new Map(members.map(m=>[m.user_id,m.nickname]).filter(x=>x[1]));
 const list=el('familyMembersList');list.replaceChildren();
 const me=currentFamilyUserId(),owner=members.some(m=>m.user_id===me&&m.role==='owner');
 const myMember=members.find(m=>m.user_id===me);
 if(document.activeElement!==el('familyNickname'))el('familyNickname').value=myMember?.nickname||'';
 for(const m of members){
  const line=document.createElement('div');line.style.cssText='display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px;background:#faf3ff;border-radius:10px';
  const label=document.createElement('span');label.style.flex='1';label.textContent=(m.role==='owner'?'👑 ':'👤 ')+(m.nickname||'Familiare')+(m.user_id===me?' (tu)':'');line.append(label);
  if(owner&&m.role!=='owner'){
   const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Rimuovi';
   remove.onclick=async()=>{if(!confirm('Rimuovere questo familiare dalla casa condivisa?'))return;try{await familyRpc('family_remove_member',{p_home:house.id,p_user:m.user_id});await load();notice('Familiare rimosso.')}catch(e){notice(e.message)}};
   line.append(remove);
  }list.append(line);
 }
 // Impostazioni promemoria: visibili solo al proprietario. La sincronizzazione cloud verrà abilitata separatamente.
 let expirySettings=el('familyExpirySettings');
 if(!expirySettings){
  expirySettings=document.createElement('section');expirySettings.id='familyExpirySettings';expirySettings.className='panel';
  expirySettings.style.cssText='margin:14px 0;padding:16px;border:2px solid #dfb9f2;border-radius:18px;background:#fff9ff';
  expirySettings.innerHTML='<h3>🔔 Notifiche della dispensa</h3><p class="hint">Promemoria alle 13:00 per gli alimenti in frigo, freezer e dispensa: 5, 3 e 1 giorno prima, e il giorno della scadenza.</p><label style="display:block;margin:10px 0">Chi riceverà gli avvisi?<select id="familyExpiryAudience"><option value="owner">👑 Solo il proprietario</option><option value="all">👨‍👩‍👧‍👦 Tutti i familiari</option><option value="none">🔕 Nessuno</option></select></label><p class="hint">Questa scelta è una bozza salvata sul dispositivo. Non attiva ancora le notifiche né cambia le impostazioni degli altri familiari: il collegamento cloud e l’invio push sono in preparazione.</p><p id="familyExpiryAudienceStatus" class="hint" role="status"></p>';
  el('familyMembersList').before(expirySettings);
  expirySettings.querySelector('select').addEventListener('change',e=>{
   try{localStorage.setItem('dlm-expiry-audience-draft-v1',e.target.value);expirySettings.querySelector('#familyExpiryAudienceStatus').textContent='💜 Preferenza salvata su questo dispositivo (non ancora attiva).'}
   catch(err){expirySettings.querySelector('#familyExpiryAudienceStatus').textContent='Non riesco a salvare la preferenza.'}
  });
 }
 expirySettings.hidden=!owner;
 if(owner){
  let saved='owner';try{saved=localStorage.getItem('dlm-expiry-audience-draft-v1')||'owner'}catch(err){}
  expirySettings.querySelector('select').value=['owner','all','none'].includes(saved)?saved:'owner';
  // Chiedi la preferenza una sola volta per ogni casa, senza attivare prematuramente le push.
  const promptKey='dlm-expiry-audience-asked-v1-'+house.id;
  let alreadyAsked=false;try{alreadyAsked=localStorage.getItem(promptKey)==='yes'}catch(err){}
  if(!alreadyAsked&&!document.getElementById('familyExpiryFirstRun')){
   const overlay=document.createElement('div');overlay.id='familyExpiryFirstRun';
   overlay.style.cssText='position:fixed;inset:0;z-index:10040;display:flex;align-items:center;justify-content:center;padding:20px;background:#28133499';
   const dialog=document.createElement('div');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Notifiche della dispensa');
   dialog.style.cssText='width:100%;max-width:440px;max-height:90vh;overflow:auto;padding:24px;border-radius:24px;background:#fff9ff;color:#602c89;box-shadow:0 14px 45px #210d3840';
   dialog.innerHTML='<h2 style="margin:0 0 12px">🔔 Notifiche della dispensa</h2><p>Chi vuoi che riceva gli avvisi alle 13:00, a 5, 3 e 1 giorno dalla scadenza e il giorno stesso? Gli avvisi riguarderanno frigo, freezer e dispensa.</p><label style="display:block;margin:16px 0">Destinatari<select id="familyExpiryFirstRunChoice" style="width:100%;margin-top:8px"><option value="owner">👑 Solo il proprietario</option><option value="all">👨‍👩‍👧‍👦 Tutti i familiari</option><option value="none">🔕 Nessuno</option></select></label><p class="hint">Le notifiche non sono ancora attive: questa scelta prepara le impostazioni e potrai cambiarla in «La mia famiglia».</p><button type="button" class="primary full" id="familyExpiryFirstRunSave">💜 Salva preferenza</button>';
   overlay.append(dialog);document.body.append(overlay);
   dialog.querySelector('select').value=expirySettings.querySelector('select').value;
   dialog.querySelector('button').onclick=()=>{
    const value=dialog.querySelector('select').value;
    try{localStorage.setItem('dlm-expiry-audience-draft-v1',value);localStorage.setItem(promptKey,'yes')}
    catch(err){alert('Impossibile salvare la preferenza su questo dispositivo.');return}
    expirySettings.querySelector('select').value=value;
    expirySettings.querySelector('#familyExpiryAudienceStatus').textContent='💜 Preferenza salvata su questo dispositivo (notifiche non ancora attive).';
    overlay.remove();
   };
  }
 }

 el('familyInviteForm').hidden=!owner;
 el('familyAcceptBox').hidden=true;updateFamilyAccept();
 for(const i of objects){if(i.image_url&&i.image_url.startsWith(house.id+'/')){try{i.image_url=await signPhoto(i.image_url)}catch(e){i.image_url='';notice('Foto non disponibile')}}}
 // Aggiorna solo la copia locale usata dalle schermate dell'app di prova.
 cloudIds.clear();objects.forEach(i=>{cloudIds.add(i.id);seenIds.add(i.id);if(pendingCreates.delete(i.id))saveCreates()});saveSeen();
 places.forEach(p=>cloudPlaceIds.add(p.id));
 const pending=db.items.filter(i=>(pendingCreates.has(i.id)&&!seenIds.has(i.id))||pendingPhotos.has(i.id)||pendingEdits.has(i.id));
 db.items=[...objects.filter(i=>!pendingPhotos.has(i.id)&&!pendingEdits.has(i.id)).map(i=>({id:i.id,kind:i.kind,name:i.title,author:i.author||'',barcode:i.isbn||'',desc:i.description||'',photo:i.image_url||'',place:i.location_id||'',value:i.estimated_value??'',created:Date.parse(i.created_at)||Date.now(),createdBy:i.created_by||null,createdByName:familyNicknames.get(i.created_by)||null,updatedBy:i.updated_by||null,updatedByName:familyNicknames.get(i.updated_by)||null})),...pending];
 db.places=[...places.map(p=>{const local=db.places.find(x=>x.id===p.id);return {id:p.id,name:p.name,parentId:p.parent_id||null,...(local?.photo?{photo:local.photo}:{})}}),...db.places.filter(p=>!places.some(c=>c.id===p.id))];
 localStorage.setItem('dlm-casa-dolce-casa-v1',JSON.stringify(db));
 renderStats();renderPlaces();renderItems();
 for(const item of db.items)if(item.photo&&item.photo.startsWith('https://'))void cacheFamilyPhoto(item.id,item.photo);
 void restoreFamilyPhotos();
 await syncPlacePhotos();
 el('familyCount').textContent='Oggetti online: '+objects.length;
 firstObjectGuide.hidden=objects.length!==0;
 notice('Inventario familiare aggiornato.');
}
async function familyRpc(name,args){
 const response=await familyFetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(args)});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw Error(data?.message||'Funzione non ancora attiva su Supabase');
 return data;
}
const INVITE_KEY='dlm-pending-family-invite';
const initialInvite=new URLSearchParams(location.hash.slice(1)).get('family_invite');
if(initialInvite)sessionStorage.setItem(INVITE_KEY,initialInvite);
function pendingFamilyInvite(){return new URLSearchParams(location.hash.slice(1)).get('family_invite')||sessionStorage.getItem(INVITE_KEY)||''}
function updateCreateHomeVisibility(){createHomeBox.hidden=!token||!!house||!!pendingFamilyInvite()}
el('familyCreateHomeForm').onsubmit=async e=>{
 e.preventDefault();if(!token||house||pendingFamilyInvite())return;
 const button=e.submitter;button.disabled=true;
 try{
  const name=el('familyCreateHomeName').value.trim();
  const homeId=await familyRpc('family_create_home',{p_name:name});
  if(!homeId)throw Error('La casa non è stata creata.');
  const houses=await get('/rest/v1/homes?select=id,name',token);
  if(houses.length!==1)throw Error('Impossibile caricare la nuova casa.');
  house=houses[0];await load();
  el('familyForm').hidden=true;el('familySignupBox').hidden=true;
  el('familyOnline').hidden=false;
  el('familyHouse').textContent='💜 '+house.name;
  updateCreateHomeVisibility();
  notice('🏡 La tua casa è pronta! Ora puoi invitare la tua famiglia.');
 }catch(err){notice('Creazione casa: '+err.message)}
 finally{button.disabled=false}
};
function updateFamilyAccept(){el('familyAcceptBox').hidden=!!house||!pendingFamilyInvite();el('familyAcceptBtn').hidden=!pendingFamilyInvite();const welcome=el('familyInviteWelcome');if(welcome)welcome.hidden=!!house;}
updateFamilyAccept();
// L'invito appare immediatamente in una finestra centrale.
if(pendingFamilyInvite()&&!house){
 const overlay=document.createElement('div');
 overlay.id='familyInviteOverlay';
 overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-labelledby','familyInviteWelcomeTitle');
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(46,24,69,.58);display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box';
 overlay.innerHTML='<div style="width:min(100%,420px);max-height:85dvh;overflow:auto;padding:26px 20px;border-radius:26px;background:#fff8ff;border:2px solid #e6c8f4;box-shadow:0 20px 60px #2c17484d;text-align:center;color:#633b87"><div style="font-size:42px;margin-bottom:8px">💜🏡</div><h3 id="familyInviteWelcomeTitle" style="margin:0 0 12px;font-size:24px">Benvenuto in Casa dolce casa!</h3><p style="margin:0 0 20px;font-size:16px">Hai ricevuto un invito a condividere una casa. Come vuoi continuare?</p><button type="button" class="primary" id="familyInviteRegister" style="display:block;width:100%;margin:0 0 12px">✨ Sono nuovo, registrami</button><button type="button" class="secondary" id="familyInviteLogin" style="display:block;width:100%;margin:0">🏡 Ho già un account</button></div>';
 document.body.appendChild(overlay);
 const signup=el('familySignupBox'),login=el('familyForm');
 signup.hidden=true;login.hidden=true;
 function chooseInviteMode(mode){
  overlay.remove();
  signup.hidden=mode!=='register';signup.open=mode==='register';
  login.hidden=mode!=='login';
  el('familyAcceptBox').hidden=true;
  (mode==='register'?signup:login).scrollIntoView({behavior:'smooth',block:'center'});
 }
 el('familyInviteRegister').onclick=()=>chooseInviteMode('register');
 el('familyInviteLogin').onclick=()=>chooseInviteMode('login');
 el('familyInviteRegister').focus();
}
if(pendingFamilyInvite()){
 el('familyAcceptBtn').hidden=true;
 el('familyAcceptBox').querySelector('h3').textContent='💌 Sei stato invitato in una casa!';
 el('familyAcceptBox').querySelector('p').textContent='Prima volta qui? Compila il modulo di registrazione. Hai già un account? Accedi qui sopra. Dopo la verifica della tua email entrerai nella casa.';
}
window.addEventListener('hashchange',()=>{const invite=new URLSearchParams(location.hash.slice(1)).get('family_invite');if(invite)sessionStorage.setItem(INVITE_KEY,invite);updateFamilyAccept()});
el('familyNicknameForm').onsubmit=async e=>{
 e.preventDefault();if(!house||!token)return;
 const name=el('familyNickname').value.trim();if(!name||name.length>40){notice('Inserisci un nome di massimo 40 caratteri.');return}
 const btn=e.submitter;btn.disabled=true;
 try{await familyRpc('family_update_nickname',{p_nickname:name});await load();notice('Nome aggiornato 💜')}
 catch(err){notice('Nome: '+err.message)}finally{btn.disabled=false}
};
el('familyInviteForm').onsubmit=async e=>{
 e.preventDefault();if(!house||!token)return;
 const button=e.submitter;button.disabled=true;
 try{
  const email=el('familyInviteEmail').value.trim();
  const response=await familyFetch(base+'/functions/v1/invia-invito-famiglia',{
   method:'POST',
   headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({home_id:house.id,email})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok&&!data.invite_url)throw Error(data.error||data.message||'Invito non riuscito');
  const result=el('familyInviteResult');result.replaceChildren();
  const p=document.createElement('p');
  p.textContent=data.success?'💌 Invito inviato via email a '+email+'! Il link è valido 7 giorni.':'Non è stato possibile inviare l’email. Puoi condividere il link personale con '+email+'.';
  result.append(p);
  if(data.invite_url){
   const input=document.createElement('input');input.readOnly=true;input.value=data.invite_url;input.setAttribute('aria-label','Link di invito');result.append(input);
   const copy=document.createElement('button');copy.type='button';copy.className='secondary';copy.textContent='Copia link';copy.onclick=async()=>{try{await navigator.clipboard.writeText(data.invite_url);notice('Link copiato.')}catch{input.select();notice('Seleziona e copia il link.')}};result.append(copy);
  }
  notice(data.success?'💜 Email di invito inviata!':'Invito creato, ma email non inviata.');
 }catch(err){notice('Invito: '+err.message)}finally{button.disabled=false}
};
el('familyAcceptBtn').onclick=async()=>{
 if(!token){notice('Prima accedi con la tua email e password.');return}
 if(!pendingFamilyInvite())return;
 if(el('familyAcceptBtn').disabled)return;
 el('familyAcceptBtn').disabled=true;
 try{await familyRpc('family_accept_invite',{p_token:pendingFamilyInvite()});sessionStorage.removeItem(INVITE_KEY);history.replaceState(null,'',location.pathname+location.search);updateFamilyAccept();const houses=await get('/rest/v1/homes?select=id,name',token);if(houses.length!==1)throw Error('Casa non disponibile');house=houses[0];await load();await syncEdits();await load();await uploadNew();if(window.familyPantryConnect)window.familyPantryConnect(house.id,async()=>{if(needsRenewal())await refreshOnce();return token});el('familyForm').hidden=true;el('familySignupBox').hidden=true;el('familyOnline').hidden=false;el('familyHouse').textContent='💜 '+house.name;updateFamilyAccept();notice('Benvenuto nella casa condivisa!')}catch(e){notice('Invito: '+e.message)}finally{el('familyAcceptBtn').disabled=false}
};
el('familySignup').onsubmit=async e=>{
 e.preventDefault();
 const btn=e.submitter;btn.disabled=true;
 if(!el('signupNickname').value.trim()){notice('Inserisci un nome o nickname.');btn.disabled=false;return}
 try{
  const redirectUrl=new URL(location.pathname,location.origin).href;
  const response=await fetch(base+'/auth/v1/signup?redirect_to='+encodeURIComponent(redirectUrl),{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:el('signupEmail').value.trim(),password:el('signupPass').value,data:{nickname:el('signupNickname').value.trim()}})});
  const data=await response.json();
  el('signupPass').value='';
  if(!response.ok)throw Error(data.msg||data.message||'Registrazione non riuscita');
  el('familyEmail').value=el('signupEmail').value.trim();
  const modal=document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(45,20,70,.65);display:flex;align-items:center;justify-content:center;padding:20px';
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  const content=document.createElement('div');
  content.style.cssText='max-width:420px;width:100%;padding:26px 22px;box-sizing:border-box;border-radius:24px;background:#fff9ff;color:#603281;text-align:center;box-shadow:0 12px 40px #30144055';
  content.innerHTML='<div style="font-size:44px">💌</div><h2 style="margin:12px 0;color:#7937a4">Registrazione effettuata!</h2><p>Controlla la tua email e premi il link di conferma.</p><p>'+ (pendingFamilyInvite()?'Poi torna qui, accedi e potrai entrare nella casa che ti ha invitato. 💜':'Poi torna qui, accedi e crea la tua casa. 🏡') +'</p><button type="button" class="primary">Ho capito 💜</button>';
  modal.append(content);document.body.append(modal);
  const closeButton=content.querySelector('button');
  closeButton.onclick=()=>{modal.remove();el('familySignupBox').open=false;el('familyForm').hidden=false;el('familyEmail').focus()};
  closeButton.focus();
 }catch(err){notice('Registrazione: '+err.message)}
 finally{btn.disabled=false}
};
el('familyForm').onsubmit=async e=>{
 e.preventDefault();const btn=e.submitter;btn.disabled=true;
 try{
 const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:el('familyEmail').value.trim(),password:el('familyPass').value})});
 const d=await r.json();if(!r.ok)throw Error(d.error_description||d.msg||d.message||d.error||'Accesso non riuscito');el('familyPass').value='';
 token=d.access_token;refreshToken=d.refresh_token;localStorage.setItem(SESSION_KEY,refreshToken);
 const houses=await get('/rest/v1/homes?select=id,name',d.access_token);
 if(houses.length!==1){
  if(houses.length===0){
   house=null;
   el('familyForm').hidden=true;el('familySignupBox').hidden=true;
   updateFamilyAccept();
   if(pendingFamilyInvite()){notice('Accesso riuscito! Ti stiamo aggiungendo alla casa…');await el('familyAcceptBtn').onclick()}else {updateCreateHomeVisibility();notice('Accesso riuscito! Ora puoi creare la tua casa.')}
   return;
  }
  throw Error('Questo account risulta collegato a più case: contatta il proprietario.');
 }
 token=d.access_token;refreshToken=d.refresh_token;localStorage.setItem(SESSION_KEY,refreshToken);house=houses[0];el('familyHouse').textContent='💜 '+house.name;
 await load();await syncEdits();await load();await uploadNew();if(window.familyPantryConnect)window.familyPantryConnect(house.id,async()=>{if(needsRenewal())await refreshOnce();return token});el('familyForm').hidden=true;el('familySignupBox').hidden=true;el('familyOnline').hidden=false;updateFamilyAccept();
 }catch(err){notice('Errore: '+err.message)}finally{btn.disabled=false}
};
async function uploadNew(){
 if(!token||!house||sending||!navigator.onLine)return;
 sending=true;
 try{
  const todo=db.items.filter(i=>i.name&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(i.id)&&pendingCreates.has(i.id)&&!seenIds.has(i.id)&&!cloudIds.has(i.id)&&!deletingIds.has(i.id));
  for(const i of todo){
   let imagePath=null;
   if(i.photo){try{imagePath=await uploadPhoto(i)}catch(e){notice('Foto ancora sul telefono: '+e.message);continue}}
   if(i.place&&!cloudPlaceIds.has(i.place)){notice('Posizione locale da sincronizzare prima dell’oggetto.');continue}
   const row={id:i.id,home_id:house.id,title:i.name,kind:i.kind==='book'?'book':'object',author:i.author||null,isbn:i.kind==='book'?i.barcode||null:null,description:i.desc||null,location_id:i.place||null,estimated_value:i.value===''?null:Number(i.value),created_by:i.createdBy||currentFamilyUserId(),image_url:imagePath};
   const res=await familyFetch(base+'/rest/v1/items?on_conflict=id',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(row)});
   if(!res.ok){const err=await res.json().catch(()=>({}));throw Error(err.message||'Errore salvataggio')}
   cloudIds.add(i.id);seenIds.add(i.id);saveSeen();pendingCreates.delete(i.id);saveCreates();
   const confirmed=await get('/rest/v1/items?select=id,location_id&id=eq.'+encodeURIComponent(i.id)+'&home_id=eq.'+encodeURIComponent(house.id),token);
   if(confirmed.length!==1||confirmed[0].location_id!==(i.place||null))throw Error('Posizione non confermata online per '+i.name);
  }
  await load();
 }catch(e){notice('Sincronizzazione da riprovare: '+e.message)}
 finally{sending=false}
}
async function syncEdits(){
 if(!token||!house||!navigator.onLine)return;
 for(const [id,edit] of pendingEdits){
  try{
   const r=await familyFetch(base+'/rest/v1/items?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(house.id),{method:'PATCH',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({title:edit.name,description:edit.desc||null,location_id:edit.place||null,updated_by:edit.updatedBy||null})});
   const rows=await r.json();
   if(!r.ok||!Array.isArray(rows)||rows.length!==1)throw Error(rows?.message||'Aggiornamento non confermato');
   pendingEdits.delete(id);saveEdits();notice('Modifica offline sincronizzata.');
  }catch(e){notice('Modifica in attesa: '+e.message);break}
 }
}
window.familySyncQueue=id=>{if(id&&!cloudIds.has(id)&&!pendingCreates.has(id)){pendingCreates.add(id);saveCreates()}if(token&&house){if(navigator.onLine)void syncEdits().then(uploadNew);else notice('Oggetto salvato sul telefono: sarà sincronizzato quando torni online.')}};
window.addEventListener('online',()=>{if(token&&house){void syncEdits().then(uploadNew)}});
window.familyUpdateItem=async item=>{
 const editorId=currentFamilyUserId();
 if(editorId){item.updatedBy=editorId;item.updatedByName=familyNicknames.get(editorId)||null;}
 pendingEdits.set(item.id,{name:item.name,desc:item.desc,place:item.place,updatedBy:editorId});saveEdits();
 if(!token||!house||!cloudIds.has(item.id)){notice('Modifica salvata soltanto sul dispositivo di prova.');return}
 if(!navigator.onLine){notice('Modifica salvata sul telefono: sarà sincronizzata quando torni online.');return}
 try{
  const res=await familyFetch(base+'/rest/v1/items?id=eq.'+encodeURIComponent(item.id)+'&home_id=eq.'+encodeURIComponent(house.id),{
   method:'PATCH',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},
   body:JSON.stringify({title:item.name,description:item.desc||null,location_id:item.place&&cloudPlaceIds.has(item.place)?item.place:null,updated_by:editorId})
  });
  const result=await res.json().catch(()=>null);
  if(!res.ok||!Array.isArray(result)||result.length!==1)throw Error(result?.message||'Conferma server non ricevuta');
  pendingEdits.delete(item.id);saveEdits();
  if(item.photo&&item.photo.startsWith('data:image/')){
   pendingPhotos.add(item.id);
   try{
    const path=await uploadPhoto(item);
    const p=await familyFetch(base+'/rest/v1/items?id=eq.'+encodeURIComponent(item.id)+'&home_id=eq.'+encodeURIComponent(house.id),{method:'PATCH',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({image_url:path})});
    const a=await p.json().catch(()=>null);
    if(!p.ok||!Array.isArray(a)||a.length!==1)throw Error(a?.message||'Associazione foto non confermata');
    pendingPhotos.delete(item.id);
    notice('Fotografia salvata online.');
   }catch(err){notice('Foto salvata solo sul telefono: '+err.message+'. Non aggiornare inventario.')}
   return;
  }
  notice('Nome, descrizione e posizione aggiornati online.');
 }catch(err){notice('Modifica salvata solo in locale: '+err.message+'. Non premere Aggiorna inventario.')}
};
window.familyEditPlace=async place=>{
 if(!token||!house||!navigator.onLine){notice('Per modificare una posizione condivisa devi essere online e collegata alla casa.');return false}
 if(!cloudPlaceIds.has(place.id)){notice('La posizione non è ancora sincronizzata. Aggiorna inventario prima di modificarla.');return false}
 try{
  const result=await familyFetch(base+'/rest/v1/locations?id=eq.'+encodeURIComponent(place.id)+'&home_id=eq.'+encodeURIComponent(house.id),{method:'PATCH',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({name:place.name,parent_id:place.parentId||null})});
  const rows=await result.json().catch(()=>null);
  if(!result.ok||!Array.isArray(rows)||rows.length!==1)throw Error(rows?.message||'Modifica non confermata');
  notice('Posizione modificata e salvata online.');
  return true;
 }catch(err){notice('Modifica non riuscita: '+err.message);return false}
};
window.familyCreatePlace=async place=>{
 if(!token||!house){notice('Posizione salvata solo in locale: accedi a Casa dolce casa.');return}
 try{
  const result=await familyFetch(base+'/rest/v1/locations?on_conflict=id',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:place.id,home_id:house.id,name:place.name,parent_id:place.parentId||null})});
  const rows=await result.json().catch(()=>null);
  if(!result.ok||!Array.isArray(rows)||rows.length!==1)throw Error(rows?.message||'Salvataggio non confermato');
  cloudPlaceIds.add(place.id);
  notice('Posizione salvata su Casa dolce casa.');
 }catch(err){notice('Posizione soltanto in locale: '+err.message)}
};
window.familyDeleteItem=async id=>{
 if(!token||!house){notice('Accedi a Casa dolce casa prima di eliminare.');return false}
 if(!cloudIds.has(id)){notice('Oggetto non ancora sincronizzato: eliminazione online non necessaria.');return true}
 if(!navigator.onLine){notice('Offline: eliminazione annullata.');return false}
 deletingIds.add(id);
 try{
  const response=await familyFetch(base+'/rest/v1/items?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(house.id),{
   method:'DELETE',headers:{apikey:key,Authorization:'Bearer '+token,Prefer:'return=representation'}
  });
  const rows=await response.json().catch(()=>null);
  if(!response.ok||!Array.isArray(rows)||rows.length!==1)throw Error(rows?.message||'Eliminazione non confermata dal server');
  const check=await get('/rest/v1/items?select=id&id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(house.id),token);
  if(check.length)throw Error('L’oggetto risulta ancora online: eliminazione non confermata');
  cloudIds.delete(id);
  pendingEdits.delete(id);saveEdits();
  notice('Eliminazione confermata anche online.');
  return true;
 }catch(e){notice('Eliminazione non eseguita: '+e.message);return false}
 finally{setTimeout(()=>deletingIds.delete(id),1500)}
};
el('familyReload').onclick=()=>syncEdits().then(load).then(uploadNew).catch(err=>notice(err.message));
el('familyExit').onclick=()=>{window.familyPantryDisconnect?.();localStorage.removeItem(SESSION_KEY);refreshToken=null;token=null;house=null;el('familyForm').hidden=false;el('familySignupBox').hidden=false;el('familyOnline').hidden=true;firstObjectGuide.hidden=true;updateFamilyAccept();notice('Disconnessa. I dati già caricati restano in questa copia di prova.')};
async function restoreSession(){
 const saved=localStorage.getItem(SESSION_KEY);
 if(!saved)return;
 refreshToken=saved;
 if(!navigator.onLine){notice('Sei offline: puoi consultare gli oggetti già salvati. L’accesso familiare riprenderà quando torna Internet.');return}
 try{
  await renew();
  const houses=await get('/rest/v1/homes?select=id,name',token);
  if(houses.length!==1){
   if(houses.length===0){
    house=null;el('familyForm').hidden=true;el('familySignupBox').hidden=true;updateFamilyAccept();if(pendingFamilyInvite()){notice('Invito trovato. Ti stiamo aggiungendo alla casa…');await el('familyAcceptBtn').onclick()}else {updateCreateHomeVisibility();notice('💜 Che bello rivederti! Dai un nome alla tua casa e inizia a organizzare tutto ciò che ami.')}return;
   }
   throw Error('Casa non disponibile');
  }
  house=houses[0];el('familyHouse').textContent='💜 '+house.name;
  await load();await syncEdits();await load();await uploadNew();if(window.familyPantryConnect)window.familyPantryConnect(house.id,async()=>{if(needsRenewal())await refreshOnce();return token});el('familyForm').hidden=true;el('familySignupBox').hidden=true;el('familyOnline').hidden=false;
  notice('Accesso ripristinato.');
 }catch(e){
  if(!navigator.onLine||e instanceof TypeError){notice('Connessione non disponibile: gli oggetti salvati restano consultabili. Riprova quando torni online.');return}
  localStorage.removeItem(SESSION_KEY);refreshToken=null;token=null;house=null;
  notice('Effettua nuovamente l’accesso.');
 }
}
window.addEventListener('online',()=>{if(!token&&refreshToken)void restoreSession()});
if(!recoveryAccessToken)void restoreSession();

/* Mostra chi ha inserito l'oggetto nella scheda famiglia. */
const originalShowItem=window.showItem;
window.showItem=function(id){
 originalShowItem(id);
 const item=db.items.find(x=>x.id===id),detail=document.getElementById('detailBody');
 const panel=detail?.querySelector('.panel');
 if(!item||!panel)return;
 const line=document.createElement('p'),label=document.createElement('b');
 label.textContent='👤 Inserito da: ';
 line.append(label,document.createTextNode(showFamilyCreator(item)));
 const buttons=panel.querySelector('.row');
 if(buttons)panel.insertBefore(line,buttons);else panel.append(line);

 // Spostamento rapido dalla scheda, senza modificare gli altri dati.
 const moveBox=document.createElement('div');
 moveBox.style.cssText='margin:18px 0 12px;padding:14px;border:1px solid #dec4eb;border-radius:16px;background:#faf4ff';
 const moveButton=document.createElement('button');
 moveButton.type='button';moveButton.className='secondary full';moveButton.textContent='📍 Sposta in un’altra posizione';
 const moveControls=document.createElement('div');moveControls.hidden=true;moveControls.style.marginTop='12px';
 const moveLabel=document.createElement('label');moveLabel.textContent='Nuova posizione';
 const moveSelect=document.createElement('select');moveSelect.style.cssText='width:100%;margin:8px 0 12px';
 const noPlace=document.createElement('option');noPlace.value='';noPlace.textContent='Da assegnare';moveSelect.append(noPlace);
 const placePath=p=>{const names=[],seen=new Set();let cur=p;while(cur&&!seen.has(cur.id)){seen.add(cur.id);names.unshift(cur.name);cur=db.places.find(x=>x.id===cur.parentId)}return names.join(' → ')};
 db.places.forEach(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=placePath(p);moveSelect.append(option)});
 moveSelect.value=item.place||'';
 moveLabel.append(moveSelect);
 const confirmMove=document.createElement('button');confirmMove.type='button';confirmMove.className='primary full';confirmMove.textContent='💜 Conferma spostamento';
 const cancelMove=document.createElement('button');cancelMove.type='button';cancelMove.className='secondary full';cancelMove.style.marginTop='8px';cancelMove.textContent='Annulla';
 moveControls.append(moveLabel,confirmMove,cancelMove);moveBox.append(moveButton,moveControls);
 moveButton.onclick=()=>{moveControls.hidden=false;moveButton.hidden=true};
 cancelMove.onclick=()=>{moveControls.hidden=true;moveButton.hidden=false;moveSelect.value=item.place||''};
 confirmMove.onclick=async()=>{
  if(moveSelect.value===(item.place||'')){cancelMove.click();return}
  const newPlace=moveSelect.value;
  if(newPlace&&!db.places.some(p=>p.id===newPlace)){notice('Questa posizione non esiste più.');return}
  confirmMove.disabled=true;confirmMove.textContent='Salvataggio…';
  try{
   item.place=newPlace;
   if(!save())throw Error('Salvataggio locale non riuscito');
   if(window.familyUpdateItem)await window.familyUpdateItem(item);
   renderPlaces();renderItems();window.showItem(id);
   notice('Posizione aggiornata 💜');
  }catch(e){notice('Impossibile spostare: '+e.message);confirmMove.disabled=false;confirmMove.textContent='💜 Conferma spostamento'}
 };
 if(buttons)panel.insertBefore(moveBox,buttons);else panel.append(moveBox);
 if(item.updatedBy){const editLine=document.createElement('p'),editLabel=document.createElement('b');editLabel.textContent='✏️ Ultima modifica di: ';editLine.append(editLabel,document.createTextNode(item.updatedByName||familyNicknames.get(item.updatedBy)||'Non identificato'));if(buttons)panel.insertBefore(editLine,buttons);else panel.append(editLine);}
};
})();