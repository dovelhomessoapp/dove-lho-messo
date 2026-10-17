/* Dove l'ho messo — sperimentazione famiglia Supabase.
   Non carica né sostituisce l'archivio locale senza consenso. */
(()=>{
'use strict';
const BASE='https://ephdnunjudbwlgbxdadm.supabase.co';
const KEY='sb_publishable_3kcIRxESMdgXMEwvFs3_0A_0JZkJqZT';
const TOK='dlm-family-auth-v1';
let session=null, home=null, busy=false;
const $=id=>document.getElementById(id);
const headers=(token,extra={})=>({'apikey':KEY,'Authorization':'Bearer '+(token||KEY),...extra});
const notice=t=>{if($('familyStatus'))$('familyStatus').textContent=t};
async function request(path,{method='GET',body,token}={}){
  const res=await fetch(BASE+path,{method,headers:headers(token||session?.access_token,body?{'Content-Type':'application/json'}:{}),body:body?JSON.stringify(body):undefined});
  let data=await res.json().catch(()=>null);
  if(!res.ok)throw Error(data?.msg||data?.message||data?.error_description||data?.error||('HTTP '+res.status));
  return data;
}
function saveSession(s){session=s; if(s)localStorage.setItem(TOK,JSON.stringify(s));else localStorage.removeItem(TOK)}
async function token(){
  if(!session)return null;
  if(Date.now() < (session.expires_at||0)*1000-90000)return session.access_token;
  const s=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},token:KEY});
  saveSession({...s,expires_at:Math.floor(Date.now()/1000)+s.expires_in});
  return session.access_token;
}
async function api(table,query='',options={}){
  const t=await token(); if(!t)throw Error('Accedi prima di sincronizzare');
  return request('/rest/v1/'+table+query,{...options,token:t});
}
function uuid(){return crypto.randomUUID()}
function cleanId(x){return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(x||'')?x:uuid()}
function currentDb(){try{return JSON.parse(localStorage.getItem('dlm-proto-v1')||'{}')}catch{return {}}}
function apply(db){
  localStorage.setItem('dlm-proto-v1',JSON.stringify(db));
  location.reload();
}
async function homes(){
  const list=await api('homes','?select=id,name&order=name.asc');
  const sel=$('familyHome');
  sel.innerHTML='<option value="">Seleziona casa</option>';
  for(const h of list){const op=document.createElement('option');op.value=h.id;op.textContent=h.name;sel.append(op)}
  const old=sessionStorage.getItem('dlm-family-home');
  if(old&&list.some(h=>h.id===old))sel.value=old;
  home=sel.value||null;
  $('familyArea').hidden=false;
  notice(list.length?'Scegli la casa. Per trasferire dati usa i pulsanti espliciti.':'Accesso riuscito, ma nessuna casa è associata a questo account. Chiedi al proprietario di aggiungerti.');
}
async function refresh(){
  $('familyLogin').hidden=!!session;
  $('familyLogged').hidden=!session;
  if(!session){$('familyArea').hidden=true;return}
  $('familyWho').textContent=session.user?.email||'Account collegato';
  try{await homes()}catch(e){notice('Accesso riuscito; impossibile leggere la casa: '+e.message)}
}
async function withBusy(fn){
  if(busy)return;busy=true;
  try{await fn()}catch(e){notice('Errore: '+e.message)}
  finally{busy=false}
}
async function fetchCloud(){
  const [places,items]=await Promise.all([
    api('locations','?select=*&home_id=eq.'+encodeURIComponent(home)),
    api('items','?select=*&home_id=eq.'+encodeURIComponent(home))
  ]);
  return {places:places.map(p=>({id:p.id,name:p.name,parent_id:p.parent_id})),
    items:items.map(i=>({id:i.id,kind:i.kind,name:i.title,author:i.author||'',barcode:i.isbn||'',desc:i.description||'',photo:i.image_url||'',place:i.location_id||'',value:i.estimated_value??'',created:i.created_at}))};
}
async function upload(){
  if(!home)throw Error('Seleziona una casa');
  const db=currentDb(), places=db.places||[], items=db.items||[];
  if(!confirm('Caricare '+places.length+' posizioni e '+items.length+' oggetti nella casa condivisa? I dati già presenti online resteranno.'))return;
  const ids=new Map();
  const locs=places.map(p=>{const id=cleanId(p.id);ids.set(p.id,id);return {id,home_id:home,name:p.name,parent_id:null}});
  // Inserisce prima le posizioni e poi gli oggetti: mantiene i riferimenti.
  if(locs.length)await api('locations','?on_conflict=id',{method:'POST',body:locs,token:await token(),}).catch(async e=>{throw e});
  const rows=items.map(i=>({id:cleanId(i.id),home_id:home,location_id:ids.get(i.place)||null,kind:i.kind==='book'?'book':'object',title:i.name||'Senza titolo',author:i.author||null,isbn:i.barcode||null,description:i.desc||null,image_url:i.photo||null,estimated_value:i.value===''?null:Number(i.value)||null,created_by:session.user.id}));
  if(rows.length)await api('items','',{method:'POST',body:rows});
  notice('Caricamento terminato. Ora puoi scaricare i dati dal cloud per verificarli.');
}
function wire(){
  const homePage=$('home');if(!homePage)return;
  const section=document.createElement('section');section.className='panel';section.style.marginTop='16px';
  section.innerHTML=`<h3>🏡 Famiglia online (prova)</h3>
  <p class="hint">Usa un account personale per condividere libri, oggetti e posizioni. Le operazioni cloud richiedono Internet.</p>
  <form id="familyLogin">
    <label>Email<input id="familyEmail" type="email" autocomplete="email" required></label>
    <label>Password<input id="familyPassword" type="password" autocomplete="current-password" minlength="12" required></label>
    <div class="row"><button class="secondary" type="submit">Accedi</button><button class="secondary" type="button" id="familySignup">Registrati</button></div>
  </form>
  <div id="familyLogged" hidden><p id="familyWho"></p>
    <div id="familyArea" hidden>
      <label>Casa condivisa<select id="familyHome"><option value="">Seleziona casa</option></select></label>
      <p class="hint">La sincronizzazione è manuale in questa versione di prova.</p>
      <div class="row"><button type="button" class="secondary" id="familyUpload">⬆️ Carica archivio locale</button>
      <button type="button" class="secondary" id="familyDownload">⬇️ Apri archivio familiare</button></div>
    </div>
    <button class="secondary" type="button" id="familyLogout">Esci</button>
  </div>
  <p class="hint" role="status" aria-live="polite" id="familyStatus"></p>`;
  homePage.appendChild(section);
  $('familyLogin').addEventListener('submit',e=>{e.preventDefault();withBusy(async()=>{
    const s=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:$('familyEmail').value.trim(),password:$('familyPassword').value},token:KEY});
    saveSession({...s,expires_at:Math.floor(Date.now()/1000)+s.expires_in});
    $('familyPassword').value='';await refresh()})});
  $('familySignup').onclick=()=>withBusy(async()=>{
    const email=$('familyEmail').value.trim(), password=$('familyPassword').value;
    if(!email||password.length<12){notice('Inserisci email e una password di almeno 12 caratteri.');return}
    const d=await request('/auth/v1/signup',{method:'POST',body:{email,password},token:KEY});
    $('familyPassword').value='';
    if(d.access_token){saveSession({...d,expires_at:Math.floor(Date.now()/1000)+d.expires_in});await refresh()}
    else notice('Controlla la casella email, conferma l’account e poi accedi.')});
  $('familyLogout').onclick=()=>withBusy(async()=>{try{await request('/auth/v1/logout',{method:'POST',token:await token()})}catch{}saveSession(null);home=null;await refresh();notice('Disconnesso.')});
  $('familyHome').onchange=e=>{home=e.target.value||null;if(home)sessionStorage.setItem('dlm-family-home',home);notice(home?'Casa selezionata.':'Scegli una casa.')};
  $('familyDownload').onclick=()=>withBusy(async()=>{
    if(!home)throw Error('Seleziona una casa');
    if(!confirm('Sostituire l’archivio di questo telefono con i dati della casa selezionata?'))return;
    const db=await fetchCloud();notice('Archivio ricevuto, aggiorno l’app…');apply(db);
  });
  $('familyUpload').onclick=()=>withBusy(upload);
  try{session=JSON.parse(localStorage.getItem(TOK)||'null')}catch{session=null}
  refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
