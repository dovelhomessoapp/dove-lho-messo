(()=>{
const root=document.getElementById('pantry');if(!root)return;
const base='https://ephdnunjudbwlgbxdadm.supabase.co',apikey='sb_publishable_3kcIRxESMdgXMEwvFs3_0A_0JZkJqZT';
let lots=[],access=null,zone='tutte',busy=false;
const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
root.innerHTML='<div class="panel"><h2>🍎 La mia dispensa</h2><p class="hint">Inventario condiviso della famiglia · avvisi 5 giorni prima della scadenza</p><p id="pantryStatus" role="status">Accedi alla tua Casa dolce casa per vedere la dispensa.</p><div id="pantryOnline" hidden><div class="pantry-tabs"><button type="button" data-zone="tutte">Tutti</button><button type="button" data-zone="dispensa">🥫 Dispensa</button><button type="button" data-zone="frigo">🥬 Frigo</button><button type="button" data-zone="freezer">🧊 Freezer</button></div><div id="pantryAlerts"></div><form id="pantryForm"><h3>➕ Aggiungi alimento</h3><div class="panel" style="margin:12px 0;background:#faf5ff"><strong>📷 Riconosci dal codice a barre</strong><p class="hint">Cerca automaticamente nome, marca e formato. La scadenza va inserita dalla confezione.</p><label>Codice a barre<input id="pantryBarcode" inputmode="numeric" placeholder="Es. 8001234567890"></label><div class="row"><button type="button" class="secondary" id="pantryCamera">📷 Scansiona</button><button type="button" class="secondary" id="pantryLookup">🔎 Cerca prodotto</button></div><video id="pantryVideo" playsinline muted hidden style="width:100%;max-height:280px;border-radius:14px;margin-top:8px"></video><button type="button" class="secondary full" id="pantryStop" hidden>Chiudi fotocamera</button><p class="hint" id="pantryProductInfo" role="status"></p></div><label>Nome alimento<input id="pantryName" required maxlength="120" placeholder="Es. Yogurt alla fragola"></label><label>Marca<input id="pantryBrand" maxlength="80" placeholder="Es. Granarolo"></label><label>Formato<input id="pantryFormat" maxlength="50" placeholder="Es. 1 litro"></label><label>Dove si trova?<select id="pantryZone"><option value="dispensa">🥫 Dispensa</option><option value="frigo">🥬 Frigo</option><option value="freezer">🧊 Freezer</option></select></label><label>Ripiano o cassetto (facoltativo)<select id="pantryShelf"></select></label><button type="button" class="secondary full" id="pantryManageShelves">⚙️ Gestisci ripiani e cassetti</button><label>Quantità<input id="pantryQty" type="number" min="1" max="99999" value="1" required></label><label>Data di scadenza (facoltativa)<input id="pantryExpiry" type="date"></label><p class="hint">Se lo stesso prodotto ha scadenze diverse, aggiungilo una volta per ciascuna scadenza.</p><button class="primary full" type="submit">💜 Salva alimento</button></form><h3>📦 Alimenti in casa</h3><div id="pantryList"></div><button type="button" class="secondary full" id="pantryRefresh">↻ Aggiorna dispensa</button></div></div>';
const status=$('pantryStatus'),online=$('pantryOnline');
const pantryDefaultShelves={dispensa:['Ripiano 1','Ripiano 2','Ripiano 3'],frigo:['Ripiano 1','Ripiano 2','Ripiano 3','Ripiano 4','Ripiano 5','Cassetto verdure','Sportello'],freezer:['Cassetto 1','Cassetto 2','Cassetto 3']};
const pantryShelfKey='dlm-pantry-shelves-v1';
function pantryShelfStore(){try{return JSON.parse(localStorage.getItem(pantryShelfKey)||'{}')||{}}catch(e){return {}}}
function pantryShelfOptions(z,selected=''){
 const saved=pantryShelfStore(),custom=Array.isArray(saved[z])?saved[z]:pantryDefaultShelves[z]||[];
 const existing=lots.filter(l=>l.zone===z&&l.shelf).map(l=>l.shelf);
 return [...new Set([...custom,...existing,selected].map(x=>String(x||'').trim()).filter(Boolean))];
}
function pantryPopulateShelf(select,z,selected=''){
 select.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Nessun ripiano specificato';select.appendChild(empty);
 pantryShelfOptions(z,selected).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=/^\\d+$/.test(v)?'Ripiano '+v:v;select.appendChild(o)});
 select.value=selected||'';
}
$('pantryZone').addEventListener('change',()=>pantryPopulateShelf($('pantryShelf'),$('pantryZone').value));
$('pantryManageShelves').onclick=()=>pantryManageShelves();
function pantryManageShelves(){
 const z=$('pantryZone').value,labels={dispensa:'Dispensa',frigo:'Frigo',freezer:'Freezer'};
 const current=pantryShelfOptions(z);
 const action=prompt('⚙️ '+labels[z]+' — posizioni disponibili:\\n'+current.map((v,i)=>(i+1)+'. '+v).join('\\n')+'\\n\\nScrivi il nome di un nuovo ripiano o cassetto (es. Ripiano 6). Per eliminare scrivi - seguito dal numero (es. -2).','');
 if(action===null)return;
 const input=action.trim();if(!input)return;
 let next=current.slice();
 if(/^-[0-9]+$/.test(input)){const n=Number(input.slice(1));if(n<1||n>next.length){alert('Numero non valido');return}next.splice(n-1,1)}
 else if(input.length>80){alert('Nome troppo lungo');return}
 else if(!next.some(v=>v.toLowerCase()===input.toLowerCase()))next.push(input);
 const saved=pantryShelfStore();saved[z]=next;localStorage.setItem(pantryShelfKey,JSON.stringify(saved));
 pantryPopulateShelf($('pantryShelf'),z,$('pantryShelf').value);
 status.textContent='💜 Posizioni aggiornate. I ripiani già usati negli alimenti restano visibili.';
}
pantryPopulateShelf($('pantryShelf'),$('pantryZone').value);
let pantryStream=null,pantryTimer=null,pantryDetector=null,pantryScanning=false,pantryZXing=null;
function stopPantryCamera(){pantryScanning=false;if(pantryZXing){try{pantryZXing.reset()}catch(e){}pantryZXing=null;}if(pantryTimer)clearTimeout(pantryTimer);pantryTimer=null;if(pantryStream)pantryStream.getTracks().forEach(t=>t.stop());pantryStream=null;const v=$('pantryVideo');v.pause();v.srcObject=null;v.hidden=true;$('pantryStop').hidden=true}
async function lookupFoodBarcode(){
 const code=$('pantryBarcode').value.trim().replace(/\s/g,'');
 const info=$('pantryProductInfo');
 if(!/^\d{8,14}$/.test(code)){info.textContent='Inserisci un codice a barre numerico da 8 a 14 cifre.';return}
 info.textContent='🔎 Cerco il prodotto…';
 try{
 const response=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?fields=product_name,product_name_it,brands,quantity,image_front_small_url',{headers:{Accept:'application/json'}});
 if(!response.ok)throw Error('Ricerca temporaneamente non disponibile');
 const data=await response.json(),p=data.product;
 if(data.status!==1||!p){info.textContent='Prodotto non trovato. Puoi inserire il nome manualmente.';return}
 const name=(p.product_name_it||p.product_name||'').trim(),brand=(p.brands||'').split(',')[0].trim(),qty=(p.quantity||'').trim();
 if(!name){info.textContent='Codice trovato, ma nome mancante: inseriscilo manualmente.';return}
 $('pantryName').value=name.slice(0,120);$('pantryBrand').value=brand;$('pantryFormat').value=qty;
 info.textContent='💜 Prodotto riconosciuto! Controlla il nome, poi scegli posizione, quantità e scadenza.';
 }catch(e){info.textContent='Non riesco a cercare il prodotto: '+e.message+'. Puoi inserirlo manualmente.'}
}
$('pantryLookup').onclick=lookupFoodBarcode;
$('pantryBarcode').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupFoodBarcode()}});
$('pantryStop').onclick=stopPantryCamera;
$('pantryCamera').onclick=async()=>{
 const info=$('pantryProductInfo'),video=$('pantryVideo');
 if(pantryScanning)stopPantryCamera();
 if(!navigator.mediaDevices?.getUserMedia){info.textContent='Fotocamera non disponibile. Inserisci il codice manualmente.';return}
 try{
 pantryStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
 video.srcObject=pantryStream;video.hidden=false;$('pantryStop').hidden=false;await video.play();pantryScanning=true;
 if(!('BarcodeDetector' in window)){
 info.textContent='Preparo il lettore compatibile con iPhone…';
 try{
  if(!window.ZXing){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';script.onload=resolve;script.onerror=()=>reject(Error('Lettore non disponibile'));document.head.appendChild(script)})}
  if(!pantryScanning)return;
  pantryZXing=new ZXing.BrowserMultiFormatReader();
  info.textContent='Inquadra il codice a barre con la fotocamera…';
  pantryZXing.decodeFromVideoElementContinuously(video,(result,err)=>{if(!pantryScanning||!result)return;const value=result.getText().replace(/\s/g,'');if(/^\d{8,14}$/.test(value)){$('pantryBarcode').value=value;stopPantryCamera();lookupFoodBarcode()}});
 }catch(e){stopPantryCamera();info.textContent='Lettore automatico non disponibile. Inserisci il codice manualmente.'}
 return
}
 pantryDetector=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
 info.textContent='Inquadra il codice a barre…';
 const tick=async()=>{if(!pantryScanning)return;try{const codes=await pantryDetector.detect(video);const found=codes.find(x=>/^\d{8,14}$/.test(x.rawValue));if(found){$('pantryBarcode').value=found.rawValue;stopPantryCamera();await lookupFoodBarcode();return}}catch(e){}if(pantryScanning)pantryTimer=setTimeout(tick,350)};
 tick();
 }catch(e){stopPantryCamera();info.textContent='Impossibile avviare la fotocamera. Puoi inserire il codice manualmente.'}
};
const dayCount=date=>{if(!date)return null;const d=new Date(date+'T12:00:00'),today=new Date();today.setHours(12,0,0,0);return Math.round((d-today)/86400000)};
function choosePantryZone(current,currentShelf=""){
 return new Promise(resolve=>{
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(30,16,45,.48);display:flex;align-items:center;justify-content:center;padding:22px';
  const panel=document.createElement('div');
  panel.style.cssText='background:white;border-radius:22px;padding:24px;width:min(100%,420px);box-shadow:0 14px 50px #24133244';
  const heading=document.createElement('h3');heading.textContent='📍 Dove si trova?';heading.style.margin='0 0 15px';
  const select=document.createElement('select');select.style.cssText='width:100%;padding:14px;border:1px solid #d8b9eb;border-radius:12px;font-size:17px;background:#faf5ff;color:#42265c';
  [['dispensa','🥫 Dispensa'],['frigo','🥬 Frigo'],['freezer','🧊 Freezer']].forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o)});
  select.value=current;
  const shelfLabel=document.createElement('label');shelfLabel.textContent='Ripiano o cassetto (facoltativo)';shelfLabel.style.cssText='display:block;margin-top:14px;font-weight:600';const shelfInput=document.createElement('select');shelfInput.style.cssText='display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:14px;border:1px solid #d8b9eb;border-radius:12px;font-size:17px;background:#faf5ff;color:#42265c';pantryPopulateShelf(shelfInput,current,currentShelf);select.addEventListener('change',()=>pantryPopulateShelf(shelfInput,select.value));shelfLabel.appendChild(shelfInput);const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;margin-top:18px';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Annulla';
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent='Conferma';
  actions.append(cancel,confirm);panel.append(heading,select,shelfLabel,actions);overlay.appendChild(panel);document.body.appendChild(overlay);
  const finish=value=>{overlay.remove();resolve(value)};
  cancel.onclick=()=>finish(null);confirm.onclick=()=>finish({zone:select.value,shelf:shelfInput.value.trim()});
  overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null)});
 });
}
function render(){
 const visible=lots.filter(l=>zone==='tutte'||l.zone===zone).sort((a,b)=>Number(Boolean(b.opened_on))-Number(Boolean(a.opened_on))||((a.opened_on?(a.opened_until||a.expires_on):a.expires_on)||'9999').localeCompare((b.opened_on?(b.opened_until||b.expires_on):b.expires_on)||'9999')||a.name.localeCompare(b.name));
 root.querySelectorAll('[data-zone]').forEach(b=>b.classList.toggle('primary',b.dataset.zone===zone));
 const expiring=lots.filter(l=>l.quantity>0&&((l.expires_on&&dayCount(l.expires_on)<=5)||(l.opened_on&&l.opened_until&&dayCount(l.opened_until)<=5)));
 $('pantryAlerts').innerHTML=expiring.length?'<div class="panel" style="background:#fff4e9;border:1px solid #f2d6b7"><strong>🔔 Da consumare prima: '+expiring.length+' lotti in scadenza o scaduti</strong></div>':'<p class="hint">💚 Nessun alimento in scadenza nei prossimi 5 giorni.</p>';
 $('pantryList').innerHTML=visible.length?visible.map(l=>{const days=dayCount(l.expires_on);const badge=days===null?'Senza scadenza':days<0?'⚠️ Scaduto da '+Math.abs(days)+' giorni':days===0?'⚠️ Scade oggi':days<=5?'🔔 Scade tra '+days+' giorni':'Scade il '+l.expires_on.split('-').reverse().join('/');
 const opened=l.opened_on?'<p class="hint">📦 Aperta il '+escape(l.opened_on.split('-').reverse().join('/'))+(l.opened_until?' · Consumare entro '+escape(l.opened_until.split('-').reverse().join('/'))+(dayCount(l.opened_until)<=5?' 🔔':''):' · Termine dopo apertura non indicato')+'</p>':'';return '<div class="panel" style="margin:10px 0"><strong>'+escape(l.name)+'</strong>'+(l.opened_on?' <span style="display:inline-block;margin-left:6px;padding:4px 9px;border-radius:999px;background:#f2dfff;color:#7432a6;font-weight:700;font-size:12px">📦 APERTO</span>':'')+'<p class="hint">'+({frigo:'🥬 Frigo',freezer:'🧊 Freezer',dispensa:'🥫 Dispensa'}[l.zone]||'')+(l.shelf?' · 📍 '+escape(/^\\d+$/.test(l.shelf)?'Ripiano '+l.shelf:l.shelf):'')+' · '+escape(badge)+'</p>'+opened+'<div class="row"><span>Quantità: <b>'+l.quantity+'</b></span><button type="button" class="secondary" data-consume="'+l.id+'">− 1 consumato</button>'+(l.opened_on?'':'<button type="button" class="secondary" data-open="'+l.id+'">📦 Apri 1</button>')+'<button type="button" class="secondary" data-move="'+l.id+'">📍 Sposta</button><button type="button" class="secondary" data-delete="'+l.id+'">Elimina</button></div></div>'}).join(''):'<p class="hint">Non ci sono alimenti in questa sezione.</p>';
}
async function request(path,opts={}){
 if(!access)throw Error('Accedi prima alla tua casa');
 const token=await access.token();
 const response=await fetch(base+'/rest/v1/'+path,{...opts,headers:{apikey,Authorization:'Bearer '+token,...opts.headers}});
 if(!response.ok){const d=await response.json().catch(()=>({}));throw Error(d.message||'Errore '+response.status)}
 if(response.status===204)return null;const t=await response.text();return t?JSON.parse(t):null;
}
async function refresh(){
 if(!access)return;
 try{status.textContent='Aggiorno la dispensa…';lots=await request('pantry_lots?select=id,name,zone,quantity,expires_on,opened_on,opened_until,shelf&home_id=eq.'+encodeURIComponent(access.homeId)+'&order=expires_on.asc.nullslast');status.textContent='💜 Dispensa condivisa aggiornata';pantryPopulateShelf($('pantryShelf'),$('pantryZone').value,$('pantryShelf').value);render()}
 catch(e){status.textContent='Per attivare la dispensa condivisa, esegui prima pantry-setup.sql in Supabase. Dettaglio: '+e.message}
}
window.familyPantryConnect=(homeId,getToken)=>{access={homeId,token:getToken};online.hidden=false;refresh()};
window.familyPantryDisconnect=()=>{access=null;lots=[];online.hidden=true;status.textContent='Accedi alla tua Casa dolce casa per vedere la dispensa.'};
root.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>{zone=b.dataset.zone;render()}));
$('pantryRefresh').onclick=refresh;
$('pantryForm').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;try{
 const payload={home_id:access.homeId,name:[$('pantryName').value.trim(),$('pantryBrand').value.trim(),$('pantryFormat').value.trim()].filter(Boolean).join(' · ').slice(0,120),zone:$('pantryZone').value,shelf:$('pantryShelf').value.trim()||null,quantity:Number($('pantryQty').value),expires_on:$('pantryExpiry').value||null};
 if(!payload.name||!Number.isInteger(payload.quantity)||payload.quantity<1)throw Error('Controlla nome e quantità');
 await request('pantry_lots',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)});
 $('pantryForm').reset();await refresh();pantryPopulateShelf($('pantryShelf'),$('pantryZone').value);status.textContent='💜 Alimento salvato per tutta la famiglia';
 }catch(err){status.textContent='Non salvato: '+err.message}finally{busy=false}};
$('pantryList').onclick=async e=>{const b=e.target.closest('button[data-consume],button[data-delete],button[data-open],button[data-move]');if(!b||busy)return;const id=b.dataset.consume||b.dataset.delete||b.dataset.open||b.dataset.move,l=lots.find(x=>x.id===id);if(!l)return;
 if(b.dataset.move){
 const placement=await choosePantryZone(l.zone,l.shelf);if(placement===null)return;const newZone=placement.zone;const newShelf=placement.shelf||null;
 if(!['dispensa','frigo','freezer'].includes(newZone)){status.textContent='Scegli: dispensa, frigo oppure freezer.';return}
 busy=true;try{await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({zone:newZone,shelf:newShelf})});await refresh();status.textContent='💜 Posizione aggiornata'}catch(err){status.textContent='Spostamento non riuscito: '+err.message}finally{busy=false}return;
 }
 if(b.dataset.delete&&!confirm('Eliminare questo lotto di '+l.name+'?'))return;
 if(b.dataset.open){
 const today=new Date(),pad=n=>String(n).padStart(2,'0'),localDate=pad(today.getDate())+'/'+pad(today.getMonth()+1)+'/'+today.getFullYear();
 const parseItalian=v=>{if(!/^\d{2}\/\d{2}\/\d{4}$/.test(v))return null;const [d,m,y]=v.split('/').map(Number),date=new Date(y,m-1,d);if(date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d)return null;return y+'-'+pad(m)+'-'+pad(d)};
 const openedInput=prompt('📦 Quando hai aperto la confezione? (GG/MM/AAAA)',localDate);if(openedInput===null)return;
 const opened=parseItalian(openedInput.trim());if(!opened){status.textContent='Inserisci una data valida nel formato GG/MM/AAAA, per esempio 21/10/2026';return}
 const untilInput=prompt('📅 Entro quando va consumata? (GG/MM/AAAA). Controlla la confezione; puoi lasciare vuoto.','');if(untilInput===null)return;
 const until=untilInput.trim()?parseItalian(untilInput.trim()):null;
 if(untilInput.trim()&&(!until||until<opened)){status.textContent='Inserisci una data valida (GG/MM/AAAA), non precedente a quella in cui l’hai aperta';return}
 const placement=await choosePantryZone(l.zone,l.shelf);if(placement===null)return;const newZone=placement.zone;const newShelf=placement.shelf||null;
 if(!['dispensa','frigo','freezer'].includes(newZone)){status.textContent='Scegli: dispensa, frigo oppure freezer.';return}
 busy=true;try{
  const payload={home_id:access.homeId,name:l.name,zone:newZone,shelf:newShelf,quantity:1,expires_on:l.expires_on,opened_on:opened,opened_until:until||null};
  if(l.quantity===1){
   await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({opened_on:opened,opened_until:until||null,zone:newZone,shelf:newShelf})});
  }else{
   await request('pantry_lots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity:l.quantity-1})});
  }
  await refresh();status.textContent='💜 Confezione aperta registrata';
 }catch(err){status.textContent='Apertura non riuscita: '+err.message}finally{busy=false}
 return;
 }
 busy=true;try{if(b.dataset.delete||l.quantity<=1){await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'DELETE'})}
 else{await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity:l.quantity-1})})}
 await refresh()}catch(err){status.textContent='Modifica non riuscita: '+err.message}finally{busy=false}};
})();
