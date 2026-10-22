(()=>{
const root=document.getElementById('pantry');if(!root)return;
const base='https://ephdnunjudbwlgbxdadm.supabase.co',apikey='sb_publishable_3kcIRxESMdgXMEwvFs3_0A_0JZkJqZT';
let lots=[],access=null,zone='tutte',busy=false;
const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
root.innerHTML='<div class="panel"><h2>🍎 La mia dispensa</h2><p class="hint">Inventario condiviso della famiglia · avvisi 5 giorni prima della scadenza</p><p id="pantryStatus" role="status">Accedi alla tua Casa dolce casa per vedere la dispensa.</p><div id="pantryOnline" hidden><div style="margin:14px 0"><label>🔎 Cerca un alimento<input id="pantrySearch" type="search" placeholder="Es. latte, pasta, marca o ripiano" autocomplete="off"></label></div><div id="pantryAlerts"></div><details id="pantryAddDetails" style="margin:14px 0;border:1px solid #e6d1f5;border-radius:18px;padding:12px;background:#faf5ff"><summary style="cursor:pointer;font-weight:700;color:#7432a6;padding:8px 2px">➕ Aggiungi alimento</summary><form id="pantryForm" style="margin-top:12px"><div class="panel" style="margin:12px 0;background:#faf5ff"><strong>📷 Riconosci dal codice a barre</strong><p class="hint">Cerca automaticamente nome, marca e formato. La scadenza va inserita dalla confezione.</p><label>Codice a barre<input id="pantryBarcode" inputmode="numeric" placeholder="Es. 8001234567890"></label><div class="row"><button type="button" class="secondary" id="pantryCamera">📷 Scansiona</button><button type="button" class="secondary" id="pantryLookup">🔎 Cerca prodotto</button></div><video id="pantryVideo" playsinline muted hidden style="width:100%;max-height:280px;border-radius:14px;margin-top:8px"></video><button type="button" class="secondary full" id="pantryStop" hidden>Chiudi fotocamera</button><label style="display:block;margin-top:10px">🖼️ Scegli una foto dalla galleria (oppure scattane una)<input id="pantryBarcodePhoto" type="file" accept="image/*" style="margin-top:6px"></label><p class="hint" id="pantryProductInfo" role="status"></p></div><label>Nome alimento<input id="pantryName" required maxlength="120" placeholder="Es. Yogurt alla fragola"></label><label>Marca<input id="pantryBrand" maxlength="80" placeholder="Es. Granarolo"></label><label>Formato<input id="pantryFormat" maxlength="50" placeholder="Es. 1 litro"></label><label>Dove si trova?<select id="pantryZone"><option value="dispensa">🥫 Dispensa</option><option value="frigo">🥬 Frigo</option><option value="freezer">🧊 Freezer</option></select></label><label>Ripiano o cassetto (facoltativo)<select id="pantryShelf"></select></label><button type="button" class="secondary full" id="pantryManageShelves">⚙️ Gestisci ripiani e cassetti</button><label>Quantità<input id="pantryQty" type="number" min="1" max="99999" value="1" required></label><label>Data di scadenza (facoltativa)<input id="pantryExpiry" type="date"></label><p class="hint">Se lo stesso prodotto ha scadenze diverse, aggiungilo una volta per ciascuna scadenza.</p><button class="primary full" type="submit">💜 Salva alimento</button></form></details><h3>📦 Alimenti in casa</h3><div id="pantryList"></div><button type="button" class="secondary full" id="pantryRefresh">↻ Aggiorna dispensa</button></div></div>';
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
 pantryShelfOptions(z,selected).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=/^\d+$/.test(v)?'Ripiano '+v:v;select.appendChild(o)});
 select.value=selected||'';
}
$('pantryZone').addEventListener('change',()=>pantryPopulateShelf($('pantryShelf'),$('pantryZone').value));
$('pantryManageShelves').onclick=()=>pantryManageShelves();
function pantryManageShelves(){
 const z=$('pantryZone').value,labels={dispensa:'Dispensa',frigo:'Frigo',freezer:'Freezer'};
 let entries=(Array.isArray(pantryShelfStore()[z])?pantryShelfStore()[z]:pantryDefaultShelves[z]).slice();
 const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(30,16,45,.48);display:flex;align-items:center;justify-content:center;padding:16px';
 const panel=document.createElement('div');panel.style.cssText='background:white;border-radius:22px;padding:20px;width:min(100%,420px);max-height:85vh;overflow-y:auto;box-shadow:0 14px 50px #24133244';
 const title=document.createElement('h3');title.textContent='⚙️ Ripiani e cassetti — '+labels[z];title.style.margin='0 0 8px';
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Aggiungi o elimina posizioni dall’elenco. Gli alimenti già salvati non vengono eliminati.';
 const list=document.createElement('div');
 const field=document.createElement('input');field.placeholder='Es. Ripiano 6 oppure Cassetto verdure';field.maxLength=80;field.style.cssText='width:100%;box-sizing:border-box;margin:12px 0;padding:12px;border:1px solid #d8b9eb;border-radius:12px';
 const add=document.createElement('button');add.type='button';add.className='secondary full';add.textContent='＋ Aggiungi posizione';
 const done=document.createElement('button');done.type='button';done.className='primary full';done.textContent='Fine';done.style.marginTop='12px';
 function persist(){const saved=pantryShelfStore();saved[z]=entries;localStorage.setItem(pantryShelfKey,JSON.stringify(saved));pantryPopulateShelf($('pantryShelf'),z,$('pantryShelf').value)}
 function draw(){list.replaceChildren();entries.forEach((name,i)=>{const line=document.createElement('div');line.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0;padding:8px 0;border-bottom:1px solid #eee';const label=document.createElement('span');label.textContent='📍 '+name;const del=document.createElement('button');del.type='button';del.className='secondary';del.textContent='Elimina';del.style.flexShrink='0';del.onclick=()=>{entries.splice(i,1);persist();draw()};line.append(label,del);list.appendChild(line)})}
 add.onclick=()=>{const value=field.value.trim();if(!value)return;if(entries.some(x=>x.toLowerCase()===value.toLowerCase())){alert('Questa posizione esiste già.');return}entries.push(value);field.value='';persist();draw()};
 field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add.click()}});
 done.onclick=()=>overlay.remove();overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
 panel.append(title,hint,list,field,add,done);overlay.appendChild(panel);document.body.appendChild(overlay);draw();
}
pantryPopulateShelf($('pantryShelf'),$('pantryZone').value);
let pantryStream=null,pantryTimer=null,pantryDetector=null,pantryScanning=false,pantryZXing=null,pantryScanSession=0;
function stopPantryCamera(){
 pantryScanning=false;pantryScanSession++;
 if(pantryZXing){try{pantryZXing.reset()}catch(e){}pantryZXing=null}
 if(pantryTimer)clearTimeout(pantryTimer);pantryTimer=null;
 if(pantryStream)pantryStream.getTracks().forEach(t=>t.stop());pantryStream=null;
 const v=$('pantryVideo');v.pause();v.srcObject=null;v.hidden=true;$('pantryStop').hidden=true;
}
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
$('pantryBarcodePhoto').addEventListener('change',async e=>{
 const file=e.target.files?.[0],info=$('pantryProductInfo');if(!file)return;
 stopPantryCamera();info.textContent='🔎 Analizzo la foto del codice a barre…';
 let url;
 try{
  await loadPantryZXing();
  url=URL.createObjectURL(file);
  const reader=new window.ZXing.BrowserMultiFormatReader();
  let result;
  try{result=await reader.decodeFromImageUrl(url)}
  catch(firstError){
   const img=new Image();img.src=url;await img.decode();
   const variants=[0,90,270];
   for(const angle of variants){
    if(result)break;
    const rotated=angle!==0;
    const canvas=document.createElement('canvas');
    const scale=Math.min(3,1800/Math.max(img.naturalWidth,img.naturalHeight));
    const w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
    canvas.width=rotated?h:w;canvas.height=rotated?w:h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.translate(canvas.width/2,canvas.height/2);
    ctx.rotate(angle*Math.PI/180);
    ctx.drawImage(img,-w/2,-h/2,w,h);
    const data=ctx.getImageData(0,0,canvas.width,canvas.height);
    const modes=['original','contrast','threshold'];
    for(const mode of modes){
     if(result)break;
     const pixels=new Uint8ClampedArray(data.data);
     if(mode!=='original'){
      for(let p=0;p<pixels.length;p+=4){
       const gray=.299*pixels[p]+.587*pixels[p+1]+.114*pixels[p+2];
       const v=mode==='threshold'?(gray>145?255:0):Math.max(0,Math.min(255,(gray-128)*1.9+128));
       pixels[p]=pixels[p+1]=pixels[p+2]=v;
      }
     }
     ctx.putImageData(new ImageData(pixels,canvas.width,canvas.height),0,0);
     const attempt=new Image();attempt.src=canvas.toDataURL('image/png');await attempt.decode();
     try{result=await reader.decodeFromImageElement(attempt)}catch(_){}
    }
   }
   if(!result)throw firstError;
  }
  const code=String(result.getText()).replace(/\s/g,'');
  if(!/^\d{8,14}$/.test(code))throw Error('Codice non valido');
  $('pantryBarcode').value=code;info.textContent='💜 Codice letto dalla foto!';await lookupFoodBarcode();
 }catch(err){const detail=String(err?.name||'Errore')+' — '+String(err?.message||'nessun dettaglio');info.textContent='Non sono riuscita a leggere il codice. Dettaglio tecnico: '+detail+'. Puoi inviarmi uno screenshot di questo messaggio?'}
 finally{if(url)URL.revokeObjectURL(url);e.target.value=''}
});

async function loadPantryZXing(){
 if(window.ZXing?.BrowserMultiFormatReader)return;
 const urls=['https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/umd/index.min.js','https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js'];
 for(const url of urls){
  try{await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>reject(Error('download'));document.head.appendChild(s)});if(window.ZXing?.BrowserMultiFormatReader)return}catch(e){}
 }
 throw Error('Impossibile caricare il lettore');
}
function pantryFoundBarcode(value,session){
 if(!pantryScanning||session!==pantryScanSession)return false;
 const code=String(value||'').replace(/\s/g,'');
 if(!/^\d{8,14}$/.test(code))return false;
 $('pantryBarcode').value=code;stopPantryCamera();lookupFoodBarcode();return true;
}
async function startPantryNative(session){
 const info=$('pantryProductInfo'),video=$('pantryVideo');
 if(!('BarcodeDetector' in window))throw Error('Lettore nativo non disponibile');
 pantryDetector=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']});
 info.textContent='📷 Inquadra il codice a barre. Avvicina lentamente la confezione e tienila ferma.';
 const tick=async()=>{if(!pantryScanning||session!==pantryScanSession)return;
  try{const codes=await pantryDetector.detect(video);if(codes.some(x=>pantryFoundBarcode(x.rawValue,session)))return}catch(e){}
  if(pantryScanning&&session===pantryScanSession)pantryTimer=setTimeout(tick,350);
 };tick();
}
$('pantryCamera').onclick=async()=>{
 const info=$('pantryProductInfo'),video=$('pantryVideo');
 if(pantryScanning){stopPantryCamera();return}
 if(!navigator.mediaDevices?.getUserMedia){info.textContent='Fotocamera non disponibile. Inserisci il codice manualmente.';return}
 const session=++pantryScanSession;
 try{
  pantryStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
  if(session!==pantryScanSession){pantryStream.getTracks().forEach(t=>t.stop());return}
  video.srcObject=pantryStream;video.hidden=false;$('pantryStop').hidden=false;await video.play();pantryScanning=true;
  info.textContent='📷 Preparo il lettore per iPhone…';
  try{
   await loadPantryZXing();
   if(!pantryScanning||session!==pantryScanSession)return;
   pantryZXing=new window.ZXing.BrowserMultiFormatReader();
   info.textContent='📷 Inquadra il codice a barre al centro, con buona luce. Attendi qualche secondo…';
   const onDecode=(result,err)=>{if(result)pantryFoundBarcode(result.getText(),session);else if(err&&err.name&&!/NotFound|Checksum|Format/.test(err.name)&&pantryScanning&&session===pantryScanSession)info.textContent='📷 Lettore attivo. Riprova tenendo il codice fermo e ben illuminato.'};
   if(typeof pantryZXing.decodeFromVideoElementContinuously==='function')pantryZXing.decodeFromVideoElementContinuously(video,onDecode);
   else if(typeof pantryZXing.decodeFromVideoElement==='function')pantryZXing.decodeFromVideoElement(video).then(result=>pantryFoundBarcode(result.getText(),session)).catch(()=>{});
   else throw Error('Metodo video non supportato');
   // Se Safari espone il rilevatore nativo, lo usiamo contemporaneamente come secondo lettore.
   if('BarcodeDetector' in window){try{await startPantryNative(session)}catch(e){}}
  }catch(err){
   if(!pantryScanning||session!==pantryScanSession)return;
   try{await startPantryNative(session)}
   catch(e){info.textContent='Lettore automatico non disponibile. Puoi scrivere il codice nel campo sopra.'}
  }
 }catch(e){if(session===pantryScanSession){stopPantryCamera();info.textContent='Impossibile avviare la fotocamera. Puoi inserire il codice manualmente.'}}
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
 const q=($('pantrySearch')?.value||'').trim().toLocaleLowerCase('it');
 const sorted=lots.filter(l=>Number(l.quantity)>0).sort((a,b)=>Number(Boolean(b.opened_on))-Number(Boolean(a.opened_on))||((a.opened_on?(a.opened_until||a.expires_on):a.expires_on)||'9999').localeCompare((b.opened_on?(b.opened_until||b.expires_on):b.expires_on)||'9999')||a.name.localeCompare(b.name));
 const isPriority=l=>Boolean(l.opened_on)||(l.expires_on&&dayCount(l.expires_on)<=5)||(l.opened_until&&dayCount(l.opened_until)<=5);
 const expiring=sorted.filter(l=>(l.expires_on&&dayCount(l.expires_on)<=5)||(l.opened_until&&dayCount(l.opened_until)<=5));
 $('pantryAlerts').innerHTML=expiring.length?'<div class="panel" style="background:#fff4e9;border:1px solid #f2d6b7"><strong>🔔 Da consumare prima: '+expiring.length+' lotti in scadenza o scaduti</strong></div>':'<p class="hint">💚 Nessun alimento in scadenza nei prossimi 5 giorni.</p>';
 const matches=l=>!q||[l.name,l.brand,l.format,l.zone,l.shelf].some(v=>String(v||'').toLocaleLowerCase('it').includes(q));
 const filtered=sorted.filter(matches);
 const cards=arr=>arr.map(l=>{const days=dayCount(l.expires_on);const badge=days===null?'Senza scadenza':days<0?'⚠️ Scaduto da '+Math.abs(days)+' giorni':days===0?'⚠️ Scade oggi':days<=5?'🔔 Scade tra '+days+' giorni':'Scade il '+l.expires_on.split('-').reverse().join('/');
 const opened=l.opened_on?'<p class="hint">📦 Aperta il '+escape(l.opened_on.split('-').reverse().join('/'))+(l.opened_until?' · Consumare entro '+escape(l.opened_until.split('-').reverse().join('/'))+(dayCount(l.opened_until)<=5?' 🔔':''):' · Termine dopo apertura non indicato')+'</p>':'';return '<div class="panel" style="margin:10px 0"><strong>'+escape(l.name)+'</strong>'+(l.opened_on?' <span style="display:inline-block;margin-left:6px;padding:4px 9px;border-radius:999px;background:#f2dfff;color:#7432a6;font-weight:700;font-size:12px">📦 APERTO</span>':'')+'<p class="hint">'+({frigo:'🥬 Frigo',freezer:'🧊 Freezer',dispensa:'🥫 Dispensa'}[l.zone]||'')+(l.shelf?' · 📍 '+escape(/^\d+$/.test(l.shelf)?'Ripiano '+l.shelf:l.shelf):'')+' · '+escape(badge)+'</p>'+opened+'<div class="row"><span>Quantità: <b>'+l.quantity+'</b></span><button type="button" class="secondary" data-consume="'+l.id+'">− 1 consumato</button>'+(l.opened_on?'':'<button type="button" class="secondary" data-open="'+l.id+'">📦 Apri 1</button>')+'<button type="button" class="secondary" data-edit="'+l.id+'">✏️ Modifica</button><button type="button" class="secondary" data-move="'+l.id+'">📍 Sposta</button><button type="button" class="secondary" data-delete="'+l.id+'">Elimina</button></div></div>'}).join('');
 const priority=filtered.filter(isPriority);
 const normal=filtered.filter(l=>!isPriority(l));
 const sections=[['frigo','🥬 Frigo'],['freezer','🧊 Freezer'],['dispensa','🥫 Dispensa']];
 const accordions=sections.map(([key,label])=>{
   const group=normal.filter(l=>l.zone===key);
   return '<details class="pantry-group" '+(q&&group.length?'open':'')+' style="margin:10px 0;border:1px solid #e6d1f5;border-radius:18px;padding:12px;background:#faf5ff"><summary style="cursor:pointer;font-weight:700;color:#7432a6;padding:5px 0">'+label+' · '+group.length+' lotti</summary><div style="margin-top:10px">'+(group.length?cards(group):'<p class="hint">Nessun alimento in questa posizione.</p>')+'</div></details>';
 }).join('');
 $('pantryList').innerHTML=(q?'<p class="hint">🔎 '+filtered.length+' risultati per «'+escape(q)+'»</p>':'')+
 '<details class="pantry-group" '+(q?'open':'')+' style="margin:10px 0;border:1px solid #e6d1f5;border-radius:18px;padding:12px;background:#faf5ff"><summary style="cursor:pointer;font-weight:700;color:#7432a6;padding:5px 0">🔔 Aperti e da consumare prima ('+priority.length+')</summary><div style="margin-top:10px">'+(priority.length?cards(priority):'<p class="hint">Nessun alimento aperto o in scadenza'+(q?' tra i risultati':'')+'.</p>')+'</div></details>'+
 '<h3 style="margin-top:22px">📦 Tutti gli altri alimenti</h3>'+accordions;
}

async function editPantryLot(l){
 const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(30,16,45,.48);display:flex;align-items:center;justify-content:center;padding:14px';
 const panel=document.createElement('form');panel.style.cssText='background:#fff;border-radius:22px;padding:20px;width:min(100%,440px);max-height:86vh;overflow-y:auto;box-shadow:0 14px 50px #24133244';
 const heading=document.createElement('h3');heading.textContent='✏️ Modifica alimento';heading.style.margin='0 0 10px';panel.appendChild(heading);
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Le modifiche saranno salvate per tutta la famiglia. Le date di apertura già registrate resteranno invariate.';panel.appendChild(hint);
 const parts=l.name.split(' · ');const name=parts.shift()||'',brand=parts.shift()||'',format=parts.join(' · ');
 const field=(label,value,type='text')=>{const wrap=document.createElement('label');wrap.style.cssText='display:block;margin:12px 0;font-weight:650';wrap.textContent=label;const input=document.createElement('input');input.type=type;input.value=value??'';input.style.cssText='display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:11px;border:1px solid #dcc6e9;border-radius:12px';wrap.appendChild(input);panel.appendChild(wrap);return input};
 const nameInput=field('Nome alimento',name),brandInput=field('Marca',brand),formatInput=field('Formato',format),qtyInput=field('Quantità',l.quantity,'number');qtyInput.min='1';qtyInput.step='1';
 const expiryInput=field('Scadenza (facoltativa)',l.expires_on||'','date');
 const zoneLabel=document.createElement('label');zoneLabel.textContent='Dove si trova?';zoneLabel.style.cssText='display:block;margin:12px 0;font-weight:650';
 const zoneSelect=document.createElement('select');zoneSelect.style.cssText='display:block;width:100%;margin-top:5px;padding:11px;border:1px solid #dcc6e9;border-radius:12px';
 [['dispensa','🥫 Dispensa'],['frigo','🥬 Frigo'],['freezer','🧊 Freezer']].forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;zoneSelect.appendChild(o)});zoneSelect.value=l.zone;zoneLabel.appendChild(zoneSelect);panel.appendChild(zoneLabel);
 const shelfLabel=document.createElement('label');shelfLabel.textContent='Ripiano o cassetto';shelfLabel.style.cssText='display:block;margin:12px 0;font-weight:650';const shelfSelect=document.createElement('select');shelfSelect.style.cssText='display:block;width:100%;margin-top:5px;padding:11px;border:1px solid #dcc6e9;border-radius:12px';shelfLabel.appendChild(shelfSelect);panel.appendChild(shelfLabel);
 pantryPopulateShelf(shelfSelect,l.zone,l.shelf||'');zoneSelect.onchange=()=>pantryPopulateShelf(shelfSelect,zoneSelect.value);
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;margin-top:18px';
 const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Annulla';cancel.style.flex='1';cancel.onclick=()=>overlay.remove();
 const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='💜 Salva modifiche';save.style.flex='2';actions.append(cancel,save);panel.appendChild(actions);
 const error=document.createElement('p');error.setAttribute('role','alert');error.style.color='#9c244d';panel.appendChild(error);
 panel.onsubmit=async e=>{e.preventDefault();if(busy)return;const fullName=[nameInput.value.trim(),brandInput.value.trim(),formatInput.value.trim()].filter(Boolean).join(' · ').slice(0,120);const quantity=Number(qtyInput.value);if(!fullName||!Number.isInteger(quantity)||quantity<1){error.textContent='Inserisci nome e quantità valida (almeno 1).';return}
 const payload={name:fullName,quantity,expires_on:expiryInput.value||null,zone:zoneSelect.value,shelf:shelfSelect.value||null};
 busy=true;save.disabled=true;try{await request('pantry_lots?id=eq.'+encodeURIComponent(l.id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});overlay.remove();await refresh();status.textContent='💜 Modifiche salvate per tutta la famiglia'}catch(err){error.textContent='Salvataggio non riuscito: '+err.message}finally{busy=false;save.disabled=false}};
 overlay.appendChild(panel);document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay&&!busy)overlay.remove()});
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
$('pantrySearch').addEventListener('input',render);
$('pantryList').onclick=async e=>{const b=e.target.closest('button[data-consume],button[data-delete],button[data-open],button[data-move],button[data-edit]');if(!b||busy)return;const id=b.dataset.consume||b.dataset.delete||b.dataset.open||b.dataset.move||b.dataset.edit,l=lots.find(x=>x.id===id);if(!l)return;
 if(b.dataset.edit){await editPantryLot(l);return}
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
