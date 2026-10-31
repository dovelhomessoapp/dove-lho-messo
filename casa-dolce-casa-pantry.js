(()=>{
const root=document.getElementById('pantry');if(!root)return;
const base='https://ephdnunjudbwlgbxdadm.supabase.co',apikey='sb_publishable_3kcIRxESMdgXMEwvFs3_0A_0JZkJqZT';
let lots=[],areas=[],access=null,zone='tutte',busy=false,overviewFilter='';
const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
root.innerHTML='<div class="panel"><h2><img class="pantry-real-3d-icon" src="assets/dispensa-nuova.png" alt=""> La mia dispensa</h2><p class="hint">Inventario condiviso della famiglia · avvisi 5 giorni prima della scadenza</p><p id="pantryStatus" role="status">Accedi alla tua Casa dolce casa per vedere la dispensa.</p><div id="pantryOnline" hidden><div style="margin:14px 0"><label>🔎 Cerca un alimento<input id="pantrySearch" type="search" placeholder="Es. latte, pasta, marca o ripiano" autocomplete="off"></label></div><div id="pantryOverview" class="pantry-overview" aria-label="Riepilogo dispensa"></div><div id="pantryAlerts"></div><details id="pantryAddDetails" style="margin:14px 0;border:1px solid #e6d1f5;border-radius:18px;padding:12px;background:#faf5ff"><summary style="cursor:pointer;font-weight:700;color:#7432a6;padding:8px 2px">➕ Aggiungi alimento</summary><form id="pantryForm" style="margin-top:12px"><div class="panel" style="margin:12px 0;background:#faf5ff"><strong>📷 Riconosci dal codice a barre</strong><p class="hint">Cerca automaticamente nome, marca e formato. La scadenza va inserita dalla confezione.</p><label>Codice a barre<input id="pantryBarcode" inputmode="numeric" placeholder="Es. 8001234567890"></label><div class="row"><button type="button" class="secondary" id="pantryCamera">📷 Scansiona</button><button type="button" class="secondary" id="pantryLookup">🔎 Cerca prodotto</button></div><video id="pantryVideo" playsinline muted hidden style="width:100%;max-height:280px;border-radius:14px;margin-top:8px"></video><button type="button" class="secondary full" id="pantryStop" hidden>Chiudi fotocamera</button><label style="display:block;margin-top:10px">🖼️ Scegli una foto dalla galleria (oppure scattane una)<input id="pantryBarcodePhoto" type="file" accept="image/*" style="margin-top:6px"></label><p class="hint" id="pantryProductInfo" role="status"></p></div><label>Nome alimento<input id="pantryName" required maxlength="120" placeholder="Es. Yogurt alla fragola"></label><label>Marca<input id="pantryBrand" maxlength="80" placeholder="Es. Granarolo"></label><label>Formato<input id="pantryFormat" maxlength="50" placeholder="Es. 1 litro"></label><label>Dove si trova?<select id="pantryZone"><option value="dispensa">🥫 Dispensa</option><option value="frigo">🥬 Frigo</option><option value="freezer">🧊 Freezer</option></select></label><label>Ripiano o cassetto (facoltativo)<select id="pantryShelf"></select></label><button type="button" class="secondary full" id="pantryManageShelves">⚙️ Gestisci ripiani e cassetti</button><label>Quantità<input id="pantryQty" type="number" min="1" max="99999" value="1" required></label><label>Data di scadenza (facoltativa)<input id="pantryExpiry" type="date"></label><p class="hint">Se lo stesso prodotto ha scadenze diverse, aggiungilo una volta per ciascuna scadenza.</p><button class="primary full" type="submit">💜 Salva alimento</button></form></details><details id="shoppingBox" style="margin:14px 0;border:1px solid #e6d1f5;border-radius:18px;padding:12px;background:#faf5ff"><summary style="cursor:pointer;font-weight:700;color:#7432a6;padding:8px 2px"><img class="pantry-real-3d-icon" src="assets/carrello-rosa-3d-corretto.png" alt=""> La mia lista della spesa <span id="shoppingCount"></span></summary><form id="shoppingForm" style="margin:12px 0"><label>Prodotto da comprare<input id="shoppingName" maxlength="120" required placeholder="Es. Latte · Parmalat · 1 litro"></label><label>Quantità<input id="shoppingQty" type="number" min="1" max="99999" value="1" required></label><button type="submit" class="primary full">➕ Aggiungi alla lista</button></form><p id="shoppingStatus" class="hint"></p><div id="shoppingList"></div><button type="button" class="secondary full" id="shoppingRefresh">↻ Aggiorna lista</button></details><h3><img class="pantry-real-3d-icon" src="assets/dispensa-nuova.png" alt=""> Alimenti in casa</h3><div id="pantryList"></div><button type="button" class="secondary full" id="pantryRefresh">↻ Aggiorna dispensa</button></div></div>';
// Compact pantry layout: existing controls and IDs are retained.
const pantryContainer=$('pantryOnline');
const shoppingSection=$('shoppingBox');
const addSection=$('pantryAddDetails');
const pantryList=$('pantryList');
const pantryRefreshButton=$('pantryRefresh');
if(pantryContainer&&shoppingSection&&addSection&&pantryList&&pantryRefreshButton){
 const inventoryTitle=pantryList.previousElementSibling;
 if(inventoryTitle)inventoryTitle.classList.add('pantry-inventory-heading');
 const zonesTitle=document.createElement('h3');
 zonesTitle.className='pantry-section-heading';
 zonesTitle.textContent='🏠 Dove sono gli alimenti';
 if(inventoryTitle)inventoryTitle.replaceWith(zonesTitle);
 const manageTitle=document.createElement('h3');
 manageTitle.className='pantry-section-heading';
 manageTitle.textContent='➕ Aggiungi e gestisci';
 zonesTitle.before(manageTitle);
 manageTitle.after(addSection);
 const shopTitle=document.createElement('h3');
 shopTitle.className='pantry-section-heading';
 shopTitle.textContent='🛒 La spesa';
 pantryRefreshButton.after(shopTitle);
 shopTitle.after(shoppingSection);
}
const status=$('pantryStatus'),online=$('pantryOnline');
const pantryOverviewStyle=document.createElement('style');
pantryOverviewStyle.textContent='.pantry-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:14px 0}.pantry-overview-card{min-width:0;text-align:center;background:linear-gradient(145deg,#fff9ff,#f2e5fb);border-radius:17px;padding:10px 3px;box-shadow:0 3px 10px #8652a31a}.pantry-overview-card span{display:block;font-size:22px}.pantry-overview-card strong{display:block;color:#6c3099;font-size:23px;line-height:1.2;margin:4px 0}.pantry-overview-card small{font-size:10px;color:#866c9b;line-height:1.2;display:block}.pantry-overview-warning{background:#fff0e8}.pantry-overview-warning strong{color:#b44347}@media(max-width:355px){.pantry-overview{grid-template-columns:repeat(2,minmax(0,1fr))}}';
pantryOverviewStyle.textContent += '.pantry-stat-icon{width:34px;height:34px;object-fit:contain;display:inline-block;vertical-align:middle}.pantry-overview-card span:has(.pantry-stat-icon){height:35px}';pantryOverviewStyle.textContent += '.pantry-overview-card[data-overview-filter]{cursor:pointer;border:1px solid transparent;font:inherit;color:inherit;appearance:none;-webkit-appearance:none}.pantry-overview-card[data-overview-filter]:focus-visible{outline:3px solid #8d51b6;outline-offset:2px}.pantry-overview-card[aria-pressed="true"]{border:2px solid #8d51b6;box-shadow:0 0 0 2px #e7d5f8}.pantry-filter-note{padding:10px 13px;border-radius:13px;background:#f4eafa;color:#69368c;margin:12px 0}.pantry-filter-note button{margin-left:8px;border:0;background:transparent;color:#69368c;text-decoration:underline;font-weight:700}';pantryOverviewStyle.textContent += ".pantry-lot-quantity{margin:14px 0 10px;color:#543268;font-size:15px}.pantry-lot-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;width:100%}.pantry-lot-actions button.secondary{box-sizing:border-box;width:100%;min-width:0;min-height:45px;margin:0;padding:10px 7px!important;white-space:normal;overflow-wrap:normal;word-break:normal;line-height:1.25;font-size:14px;text-align:center;border-radius:15px}.pantry-lot-actions .pantry-lot-delete{grid-column:1/-1;background:#fff2f7!important}@media(min-width:600px){.pantry-lot-actions{grid-template-columns:repeat(3,minmax(0,1fr))}.pantry-lot-actions .pantry-lot-delete{grid-column:auto}}";pantryOverviewStyle.textContent += ".pantry-shopping-card{display:flex;flex-direction:column;align-items:stretch;gap:12px;margin:10px 0!important;padding:15px!important;min-width:0}.pantry-shopping-name{display:block;overflow-wrap:anywhere;line-height:1.4}.pantry-shopping-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-width:0}.pantry-shopping-actions button.secondary{min-width:0;width:100%;box-sizing:border-box;margin:0;padding:12px 8px!important;min-height:46px;white-space:normal;word-break:normal;overflow-wrap:normal;font-size:14px;line-height:1.3;border-radius:15px}";document.head.appendChild(pantryOverviewStyle);
const pantryUrgentStyle=document.createElement('style');
pantryUrgentStyle.textContent='.pantry-urgent{border:2px solid #efc38f;border-radius:22px;padding:0;background:linear-gradient(120deg,#fff0dc,#fff8ec);box-shadow:0 5px 15px #d89b5c24;overflow:hidden}.pantry-urgent>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:15px 13px;color:#7e3b26}.pantry-urgent>summary::-webkit-details-marker{display:none}.pantry-urgent-bell{font-size:25px;filter:drop-shadow(0 2px 2px #b8774b50)}.pantry-urgent-title{font-family:ui-rounded,"Trebuchet MS",Verdana,sans-serif;font-size:clamp(17px,4.5vw,22px);font-weight:900;letter-spacing:-.45px;line-height:1.2;text-shadow:0 1px 0 #fff}.pantry-urgent-count{display:inline-grid;place-items:center;min-width:29px;height:29px;border-radius:99px;background:#e96869;color:#fff;font-size:16px;margin-left:4px;box-shadow:0 2px 5px #a94c4c35}.pantry-urgent-arrow{margin-left:auto;flex:none;border-radius:50%;width:32px;height:32px;display:grid;place-items:center;background:#fff7ee;color:#a4533e;font-size:25px;font-weight:800;transition:transform .2s}.pantry-urgent[open] .pantry-urgent-arrow{transform:rotate(180deg)}.pantry-urgent>p,.pantry-urgent>ul{margin-left:15px;margin-right:15px}.pantry-urgent>ul{padding-left:22px!important;margin-bottom:17px!important}.pantry-urgent:focus-within{outline:2px solid #d7955e;outline-offset:2px}';
document.head.appendChild(pantryUrgentStyle);
const pantryUrgentRefinement=document.createElement('style');
pantryUrgentRefinement.textContent='.pantry-urgent>summary{gap:9px}.pantry-urgent-title{flex:0 1 auto;min-width:0;color:#60249b}.pantry-urgent-count{flex:none;display:grid;place-items:center;margin:0 0 0 auto;min-width:36px;height:36px;padding:0 7px;border-radius:12px;background:linear-gradient(145deg,#f3e2ff,#dfbfff);color:#7432c6;font-size:20px;font-weight:900;box-shadow:0 3px 8px #a76cc329}.pantry-urgent-arrow{margin-left:0;color:#7837b2;background:#fff8f0}.pantry-urgent{background:linear-gradient(110deg,#fff8eb,#fff1db)}@media(max-width:390px){.pantry-urgent>summary{gap:7px;padding:13px 10px}.pantry-urgent-title{font-size:17px}.pantry-urgent-count{min-width:32px;height:32px;font-size:17px}.pantry-urgent-bell{font-size:22px}.pantry-urgent-arrow{width:27px;height:27px}}';
document.head.appendChild(pantryUrgentRefinement);
const pantryBasketStyle=document.createElement('style');pantryBasketStyle.textContent='.pantry-real-3d-icon{width:43px;height:43px;object-fit:contain;vertical-align:middle;margin-right:6px;border-radius:0}.pantry-group>summary .pantry-real-3d-icon{width:52px;height:52px;box-sizing:border-box;object-fit:contain;padding:5px;vertical-align:middle;margin-right:9px;border-radius:0;overflow:visible}.pantry-group>summary{min-height:56px;line-height:1.4}.pantry-basket-icon{display:inline-block;font-size:25px;vertical-align:-3px;margin-right:3px;filter:drop-shadow(0 2px 3px #8e6d8e33)}';document.head.appendChild(pantryBasketStyle);



const areaIcon={frigo:'assets/frigorifero-nuovo.png',freezer:'assets/freezer-nuovo.png',dispensa:'assets/dispensa-nuova.png'};
const areaType=v=>areas.find(a=>a.id===v)?.kind||v;
const areaId=v=>areas.some(a=>a.id===v)?v:null;
const areaChoice=l=>l.area_id||l.zone;
const areaName=l=>areas.find(a=>a.id===l.area_id)?.name||({frigo:'Frigo',freezer:'Freezer',dispensa:'Dispensa'}[l.zone]||l.zone);
const areaOptions=()=>[['dispensa','🥫 Dispensa'],['frigo','🥬 Frigo'],['freezer','🧊 Freezer'],...areas.map(a=>[a.id,a.name])];
const fillAreas=(select,value)=>{select.replaceChildren();for(const [v,t] of areaOptions()){const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o)}select.value=value||'dispensa'};
const areaUI=document.createElement('details');areaUI.id='pantryCustomAreas';areaUI.style.cssText='margin:15px 0;padding:14px;background:#f7eeff;border:1px solid #e3cdf2;border-radius:19px';
areaUI.innerHTML='<summary style="cursor:pointer;font-weight:750;color:#6d328e">🏠 ＋ Aggiungi o gestisci ambienti</summary><p class="hint">Crea un secondo freezer, un frigo o una dispensa con nome, icona 3D oppure foto. Tutti i familiari vedranno gli stessi ambienti.</p><div id="pantryAreaRows"></div><form id="pantryAreaEditor"><label>Nome ambiente<input id="pantryAreaName" required maxlength="60" placeholder="Es. Freezer garage"></label><label>Tipo<select id="pantryAreaKind"><option value="freezer">🧊 Freezer</option><option value="frigo">🥬 Frigo</option><option value="dispensa">🥫 Dispensa</option></select></label><label>Scegli l’icona<select id="pantryAreaIcon"><option value="default">Icona del tipo scelto</option><option value="freezer">🧊 Freezer 3D</option><option value="frigo">🥬 Frigo 3D</option><option value="dispensa">🥫 Dispensa 3D</option></select></label><label>Oppure carica una foto<input id="pantryAreaPhoto" type="file" accept="image/*"></label><label>Ripiani o cassetti, uno per riga<textarea id="pantryAreaShelves" rows="3" placeholder="Ripiano 1&#10;Ripiano 2"></textarea></label><p class="hint" id="pantryAreaMessage"></p><button class="primary full" type="submit">💜 Salva ambiente</button><button class="secondary full" id="pantryAreaCancel" type="button" hidden>Annulla modifica</button></form>';
$('pantryAddDetails').before(areaUI);
let editArea=null,photoArea=null;
const areaPhoto=a=>a.photo||areaIcon[a.icon==='default'?a.kind:a.icon]||areaIcon[a.kind];
function redrawAreas(){
 $('pantryAreaRows').innerHTML=areas.map(a=>'<div style="display:flex;align-items:center;gap:8px;margin:9px 0;min-width:0"><img src="'+escape(areaPhoto(a))+'" style="width:44px;height:44px;border-radius:12px;object-fit:cover"><strong style="flex:1;min-width:0;overflow-wrap:anywhere">'+escape(a.name)+'</strong><button class="secondary" type="button" data-aedit="'+a.id+'">✏️</button><button class="secondary" type="button" data-adel="'+a.id+'">✕</button></div>').join('');
 const selected=$('pantryZone').value;fillAreas($('pantryZone'),selected);
 pantryPopulateShelf($('pantryShelf'),$('pantryZone').value,$('pantryShelf').value);
}
function resetArea(){editArea=null;photoArea=null;$('pantryAreaEditor').reset();$('pantryAreaCancel').hidden=true}
$('pantryAreaCancel').onclick=resetArea;
$('pantryAreaRows').onclick=async e=>{
 const id=e.target.closest('[data-aedit],[data-adel]')?.dataset.aedit||e.target.closest('[data-adel]')?.dataset.adel;
 const a=areas.find(x=>x.id===id);if(!a)return;
 if(e.target.closest('[data-aedit]')){editArea=id;photoArea=a.photo;$('pantryAreaName').value=a.name;$('pantryAreaKind').value=a.kind;$('pantryAreaIcon').value=a.icon;$('pantryAreaShelves').value=(a.shelves||[]).join('\n');$('pantryAreaCancel').hidden=false;return}
 if(lots.some(l=>l.area_id===id)){alert('Sposta prima gli alimenti presenti in questo ambiente.');return}
 if(!confirm('Eliminare '+a.name+'?'))return;
 try{await request('pantry_areas?id=eq.'+id+'&home_id=eq.'+access.homeId,{method:'DELETE'});await refresh()}catch(err){$('pantryAreaMessage').textContent=err.message}
};
$('pantryAreaPhoto').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,380/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();photoArea=canvas.toDataURL('image/jpeg',.6);if(photoArea.length>170000)throw Error('Foto troppo grande');$('pantryAreaMessage').textContent='📷 Foto pronta'}catch(err){photoArea=null;$('pantryAreaMessage').textContent='Foto non caricata: '+err.message}
};
$('pantryAreaEditor').onsubmit=async e=>{
 e.preventDefault();if(!access)return;
 const payload={name:$('pantryAreaName').value.trim(),kind:$('pantryAreaKind').value,icon:$('pantryAreaIcon').value,photo:photoArea,shelves:[...new Set($('pantryAreaShelves').value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean))].slice(0,30)};
 if(areas.some(a=>a.id!==editArea&&a.name.toLowerCase()===payload.name.toLowerCase())){$('pantryAreaMessage').textContent='Nome già utilizzato';return}
 try{if(editArea)await request('pantry_areas?id=eq.'+editArea+'&home_id=eq.'+access.homeId,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});else await request('pantry_areas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,home_id:access.homeId})});resetArea();await refresh();$('pantryAreaMessage').textContent='💜 Ambiente condiviso salvato'}catch(err){$('pantryAreaMessage').textContent='Errore: '+err.message}
};
const areaCSS=document.createElement('style');areaCSS.textContent='#pantryCustomAreas label{display:block;margin:10px 0}#pantryCustomAreas input,#pantryCustomAreas select,#pantryCustomAreas textarea{display:block;box-sizing:border-box;width:100%;margin-top:5px}#pantryCustomAreas [data-aedit],#pantryCustomAreas [data-adel]{min-width:38px;padding:8px}';document.head.append(areaCSS);

const pantryDefaultShelves={dispensa:['Ripiano 1','Ripiano 2','Ripiano 3'],frigo:['Ripiano 1','Ripiano 2','Ripiano 3','Ripiano 4','Ripiano 5','Cassetto verdure','Sportello'],freezer:['Cassetto 1','Cassetto 2','Cassetto 3']};
const pantryShelfKey='dlm-pantry-shelves-v1';
function pantryShelfStore(){try{return JSON.parse(localStorage.getItem(pantryShelfKey)||'{}')||{}}catch(e){return {}}}
function pantryShelfOptions(z,selected=''){
 const saved=pantryShelfStore(),custom=areas.find(a=>a.id===z)?.shelves|| (Array.isArray(saved[z])?saved[z]:pantryDefaultShelves[z]||[]);
 const existing=lots.filter(l=>(l.area_id||l.zone)===z&&l.shelf).map(l=>l.shelf);
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
 const z=$('pantryZone').value,labels={dispensa:'Dispensa',frigo:'Frigo',freezer:'Freezer'};labels[z]=areas.find(a=>a.id===z)?.name||labels[z]||z;
 let entries=(areas.find(a=>a.id===z)?.shelves|| (Array.isArray(pantryShelfStore()[z])?pantryShelfStore()[z]:pantryDefaultShelves[z]||[])).slice();
 const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(30,16,45,.48);display:flex;align-items:center;justify-content:center;padding:16px';
 const panel=document.createElement('div');panel.style.cssText='background:white;border-radius:22px;padding:20px;width:min(100%,420px);max-height:85vh;overflow-y:auto;box-shadow:0 14px 50px #24133244';
 const title=document.createElement('h3');title.textContent='⚙️ Ripiani e cassetti — '+labels[z];title.style.margin='0 0 8px';
 const hint=document.createElement('p');hint.className='hint';hint.textContent='Aggiungi o elimina posizioni dall’elenco. Gli alimenti già salvati non vengono eliminati.';
 const list=document.createElement('div');
 const field=document.createElement('input');field.placeholder='Es. Ripiano 6 oppure Cassetto verdure';field.maxLength=80;field.style.cssText='width:100%;box-sizing:border-box;margin:12px 0;padding:12px;border:1px solid #d8b9eb;border-radius:12px';
 const add=document.createElement('button');add.type='button';add.className='secondary full';add.textContent='＋ Aggiungi posizione';
 const done=document.createElement('button');done.type='button';done.className='primary full';done.textContent='Fine';done.style.marginTop='12px';
 async function persist(){if(areaId(z)){await request('pantry_areas?id=eq.'+z+'&home_id=eq.'+access.homeId,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({shelves:entries})});areas.find(a=>a.id===z).shelves=entries.slice()}else{const saved=pantryShelfStore();saved[z]=entries;localStorage.setItem(pantryShelfKey,JSON.stringify(saved))}pantryPopulateShelf($('pantryShelf'),z,$('pantryShelf').value)}
 function draw(){list.replaceChildren();entries.forEach((name,i)=>{const line=document.createElement('div');line.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0;padding:8px 0;border-bottom:1px solid #eee';const label=document.createElement('span');label.textContent='📍 '+name;const del=document.createElement('button');del.type='button';del.className='secondary';del.textContent='Elimina';del.style.flexShrink='0';del.onclick=()=>{entries.splice(i,1);persist().catch(e=>alert(e.message));draw()};line.append(label,del);list.appendChild(line)})}
 add.onclick=()=>{const value=field.value.trim();if(!value)return;if(entries.some(x=>x.toLowerCase()===value.toLowerCase())){alert('Questa posizione esiste già.');return}entries.push(value);field.value='';persist().catch(e=>alert(e.message));draw()};
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
 try {
  const saved = await request(
    'pantry_products?select=name,brand,format&home_id=eq.' +
    encodeURIComponent(access.homeId) +
    '&barcode=eq.' + encodeURIComponent(code) + '&limit=1'
  );
  if (saved.length) {
    const p = saved[0];
    const parts = (p.name || '').split(' · ');
    const legacy = !p.brand && !p.format && parts.length >= 3;
    $('pantryName').value = legacy ? parts.slice(0, -2).join(' · ') : (p.name || '');
    $('pantryBrand').value = legacy ? parts[parts.length - 2] : (p.brand || '');
    $('pantryFormat').value = legacy ? parts[parts.length - 1] : (p.format || '');
    info.textContent = '💜 Prodotto riconosciuto dall’archivio della famiglia!';
    return;
  }
} catch (e) {
  console.warn('Archivio familiare non disponibile', e);
}
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
 const session=++pantryScanSession;
 pantryScanning=true;
 video.hidden=false;$('pantryStop').hidden=false;
 info.textContent='📷 Avvio lo scanner automatico…';
 try{
  await loadPantryZXing();
  if(!pantryScanning||session!==pantryScanSession)return;
  pantryZXing=new window.ZXing.BrowserMultiFormatReader(undefined,250);
  const onDecode=(result,err)=>{
   if(result){pantryFoundBarcode(result.getText(),session);return}
   if(err&&err.name&&!/NotFound|Checksum|Format/.test(err.name)&&pantryScanning&&session===pantryScanSession)info.textContent='📷 Scanner attivo: tieni il codice fermo e ben illuminato.';
  };
  // ZXing gestisce direttamente la fotocamera: evita conflitti con getUserMedia separato su Safari.
  info.textContent='📷 Inquadra il codice a barre: la lettura è automatica.';
  await pantryZXing.decodeFromVideoDevice(undefined,video,onDecode);
 }catch(err){
  if(!pantryScanning||session!==pantryScanSession)return;
  info.textContent='⚠️ Scanner non avviato: '+String(err?.message||err).slice(0,160);
  stopPantryCamera();
 }
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
  areaOptions().forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o)});
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
 const dueDate=l=>{const dates=[l.expires_on,l.opened_until].filter(Boolean);return dates.length?dates.sort()[0]:null};
 const soon=sorted.filter(l=>dueDate(l)&&dayCount(dueDate(l))<=5).sort((a,b)=>dueDate(a).localeCompare(dueDate(b))||a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
 const overdue=sorted.filter(l=>dueDate(l)&&dayCount(dueDate(l))<0).length;
 const expiringSoon=soon.length-overdue;
 const openCount=sorted.filter(l=>Boolean(l.opened_on)).length;
 const totalUnits=sorted.reduce((n,l)=>n+Number(l.quantity||0),0);
 const overview=$('pantryOverview');
 if(overview)overview.innerHTML=[
 ['all','assets/alimenti.png',totalUnits,'Confezioni'],
 ['open','assets/cibi-aperti-3d.png',openCount,'Aperte'],
 ['soon','assets/cibi-in-scadenza-3d.png',expiringSoon,'Entro 5 giorni'],
 ['expired','assets/cibi-scaduti-3d.png',overdue,'Scadute']
 ].map(([key,img,count,label])=>'<button type="button" class="pantry-overview-card'+(key==='expired'&&overdue?' pantry-overview-warning':'')+'" data-overview-filter="'+key+'" aria-pressed="'+(overviewFilter===key)+'"><span><img class="pantry-stat-icon" src="'+img+'" alt=""></span><strong>'+count+'</strong><small>'+label+'</small></button>').join('');
 const urgentRows=soon.map(l=>{const days=dayCount(dueDate(l));const label=days<0?'⚠️ Scaduto da '+Math.abs(days)+' giorni':days===0?'⚠️ Scade oggi':'🔔 Mancano '+days+' giorni';const location=areaName(l)+(l.shelf?' · '+(/^\d+$/.test(l.shelf)?'Ripiano '+l.shelf:l.shelf):'');return '<li style="margin:10px 0"><strong>'+escape(l.name)+'</strong> · '+escape(label)+'<div class="hint">'+escape(location)+' · Quantità: '+Number(l.quantity)+'</div></li>'}).join('');
 $('pantryAlerts').innerHTML=soon.length?'<details class="pantry-urgent" style="margin:12px 0"><summary><span class="pantry-urgent-bell" aria-hidden="true">🔔</span><span class="pantry-urgent-title">Da consumare presto</span><b class="pantry-urgent-count">'+soon.length+'</b><span class="pantry-urgent-arrow" aria-hidden="true">⌄</span></summary><p class="hint">In ordine di scadenza, dai più urgenti.</p><ul style="padding-left:22px;margin-bottom:0">'+urgentRows+'</ul></details>':'<p class="hint">💚 Nessun alimento in scadenza nei prossimi 5 giorni.</p>';
 const matches=l=>!q||[l.name,l.brand,l.format,l.zone,areaName(l),l.shelf].some(v=>String(v||'').toLocaleLowerCase('it').includes(q));
 const filtered=sorted.filter(l=>matches(l)&&(!overviewFilter||overviewFilter==='all'||(overviewFilter==='open'&&Boolean(l.opened_on))||(overviewFilter==='soon'&&dueDate(l)&&dayCount(dueDate(l))>=0&&dayCount(dueDate(l))<=5)||(overviewFilter==='expired'&&dueDate(l)&&dayCount(dueDate(l))<0)));
 renderMinimumStocks();
 const cards=arr=>arr.map(l=>{const days=dayCount(l.expires_on);const badge=days===null?'Senza scadenza':days<0?'⚠️ Scaduto da '+Math.abs(days)+' giorni':days===0?'⚠️ Scade oggi':days<=5?'🔔 Scade tra '+days+' giorni':'Scade il '+l.expires_on.split('-').reverse().join('/');
 const opened=l.opened_on?'<p class="hint">📦 Aperta il '+escape(l.opened_on.split('-').reverse().join('/'))+(l.opened_until?' · Consumare entro '+escape(l.opened_until.split('-').reverse().join('/'))+(dayCount(l.opened_until)<=5?' 🔔':''):' · Termine dopo apertura non indicato')+'</p>':'';return '<div class="panel" style="margin:10px 0"><strong>'+escape(l.name)+'</strong>'+(l.opened_on?' <span style="display:inline-block;margin-left:6px;padding:4px 9px;border-radius:999px;background:#f2dfff;color:#7432a6;font-weight:700;font-size:12px">📦 APERTO</span>':'')+'<p class="hint">'+escape(areaName(l))+(l.shelf?' · 📍 '+escape(/^\d+$/.test(l.shelf)?'Ripiano '+l.shelf:l.shelf):'')+' · '+escape(badge)+'</p>'+opened+'<div class="pantry-lot-quantity">Quantità: <strong>'+l.quantity+'</strong></div><div class="pantry-lot-actions"><button type="button" class="secondary" data-consume="'+l.id+'">− 1 consumato</button>'+(l.opened_on?'':'<button type="button" class="secondary" data-open="'+l.id+'">📦 Apri 1</button>')+'<button type="button" class="secondary" data-edit="'+l.id+'">✏️ Modifica</button><button type="button" class="secondary" data-move="'+l.id+'">📍 Sposta</button><button type="button" class="secondary pantry-lot-delete" data-delete="'+l.id+'">Elimina</button></div></div>'}).join('');
 const priority=filtered.filter(l=>overviewFilter&&overviewFilter!=='all'?true:isPriority(l));
 const normal=overviewFilter&&overviewFilter!=='all'?[]:filtered.filter(l=>!isPriority(l));
 const sections=[['frigo','<img class="pantry-real-3d-icon" src="assets/frigorifero-nuovo.png" alt="Frigo" loading="eager" decoding="sync"> Frigo'],['freezer','<img class="pantry-real-3d-icon" src="assets/freezer-nuovo.png" alt="Freezer" loading="eager" decoding="sync"> Freezer'],['dispensa','<img class="pantry-real-3d-icon" src="assets/dispensa-nuova.png" alt=""> Dispensa'],...areas.map(a=>[a.id,'<img class="pantry-real-3d-icon" src="'+escape(areaPhoto(a))+'" alt=""> '+escape(a.name)])];
 const accordions=sections.map(([key,label])=>{
   const group=normal.filter(l=>(l.area_id||l.zone)===key).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'it',{sensitivity:'base',numeric:true})||String(a.brand||'').localeCompare(String(b.brand||''),'it',{sensitivity:'base'}));
   return '<details class="pantry-group pantry-zone-'+key+'" '+((q&&group.length)||overviewFilter==='all'?'open':'')+' style="margin:10px 0;border:1px solid #e6d1f5;border-radius:18px;padding:12px;background:#faf5ff"><summary style="cursor:pointer;font-weight:700;color:#7432a6;padding:5px 0">'+label+' · '+group.length+' lotti</summary><div style="margin-top:10px">'+(group.length?cards(group):'<p class="hint">Nessun alimento in questa posizione.</p>')+'</div></details>';
 }).join('');
 $('pantryList').innerHTML=(overviewFilter==='all'?'<div class="pantry-filter-note">📦 Tutte le confezioni, suddivise per posizione. Scorri per vedere gli alimenti e le quantità.</div>':'')+(overviewFilter&&overviewFilter!=='all'?'<div class="pantry-filter-note">Filtro: '+({open:'Aperte',soon:'Entro 5 giorni',expired:'Scadute'}[overviewFilter]||'Tutte')+' <button type="button" id="pantryClearOverview">Mostra tutto</button></div>':'')+(q?'<p class="hint">🔎 '+filtered.length+' risultati per «'+escape(q)+'»</p>':'')+
 '<details class="pantry-group pantry-priority" '+(q||overviewFilter==='all'||(overviewFilter&&overviewFilter!=='all')?'open':'')+' style="margin:10px 0;border:1px solid #e6d1f5;border-radius:18px;padding:12px;background:#faf5ff"><summary style="cursor:pointer;font-weight:700;color:#7432a6;padding:5px 0"><img class="pantry-real-3d-icon" src="assets/cibi-in-scadenza-3d.png" alt=""> Aperti e da consumare prima ('+priority.length+')</summary><div style="margin-top:10px">'+(priority.length?cards(priority):'<p class="hint">Nessun alimento aperto o in scadenza'+(q?' tra i risultati':'')+'.</p>')+'</div></details>'+
 '<div class="pantry-zone-tiles">'+accordions+'</div>';
}

$('pantryOverview').addEventListener('click',e=>{
 const button=e.target.closest('[data-overview-filter]');if(!button)return;
 const key=button.dataset.overviewFilter;
 overviewFilter=key==='all'?'all':overviewFilter===key?'':key;
 render();
 if(overviewFilter&&overviewFilter!=='all'){const details=$('pantryList').querySelector('.pantry-priority');if(details)details.open=true}
 $('pantryList').scrollIntoView({behavior:'smooth',block:'start'});
});
$('pantryList').addEventListener('click',e=>{if(e.target.closest('#pantryClearOverview')){overviewFilter='';render();$('pantryOverview').scrollIntoView({behavior:'smooth',block:'start'})}});
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
 [['dispensa','🥫 Dispensa'],['frigo','🥬 Frigo'],['freezer','🧊 Freezer']].forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;zoneSelect.appendChild(o)});zoneSelect.value=areaChoice(l);zoneLabel.appendChild(zoneSelect);panel.appendChild(zoneLabel);
 const shelfLabel=document.createElement('label');shelfLabel.textContent='Ripiano o cassetto';shelfLabel.style.cssText='display:block;margin:12px 0;font-weight:650';const shelfSelect=document.createElement('select');shelfSelect.style.cssText='display:block;width:100%;margin-top:5px;padding:11px;border:1px solid #dcc6e9;border-radius:12px';shelfLabel.appendChild(shelfSelect);panel.appendChild(shelfLabel);
 pantryPopulateShelf(shelfSelect,areaChoice(l),l.shelf||'');zoneSelect.onchange=()=>pantryPopulateShelf(shelfSelect,zoneSelect.value);
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;margin-top:18px';
 const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Annulla';cancel.style.flex='1';cancel.onclick=()=>overlay.remove();
 const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='💜 Salva modifiche';save.style.flex='2';actions.append(cancel,save);panel.appendChild(actions);
 const error=document.createElement('p');error.setAttribute('role','alert');error.style.color='#9c244d';panel.appendChild(error);
 panel.onsubmit=async e=>{e.preventDefault();if(busy)return;const fullName=[nameInput.value.trim(),brandInput.value.trim(),formatInput.value.trim()].filter(Boolean).join(' · ').slice(0,120);const quantity=Number(qtyInput.value);if(!fullName||!Number.isInteger(quantity)||quantity<1){error.textContent='Inserisci nome e quantità valida (almeno 1).';return}
 const payload={name:fullName,quantity,expires_on:expiryInput.value||null,zone:areaType(zoneSelect.value),area_id:areaId(zoneSelect.value),shelf:shelfSelect.value||null};
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
async function rememberPantryPosition(l){
 const productName=String(l.name||'').trim().slice(0,120);
 const productKey=productName.normalize('NFKC').toLocaleLowerCase('it').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
 if(!productKey||!['frigo','freezer','dispensa'].includes(l.zone))return;
 await request('pantry_product_positions?on_conflict=home_id,product_key',{
  method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},
  body:JSON.stringify({home_id:access.homeId,product_name:productName,product_key:productKey,last_zone:l.zone,last_shelf:l.shelf||null,updated_at:new Date().toISOString()})
 });
}
let shopping=[],minimumStocks=[];
const stockKey=name=>String(name||'').trim().toLocaleLowerCase('it').slice(0,120);
async function refreshMinimumStocks(){
 try{minimumStocks=await request('pantry_minimum_stocks?select=id,product_name,product_key,minimum_quantity&home_id=eq.'+encodeURIComponent(access.homeId));$('pantryStockStatus').textContent=''}
 catch(err){minimumStocks=[];$('pantryStockStatus').textContent='Scorte minime non disponibili: '+err.message}
}
function renderMinimumStocks(){
 const entries=minimumStocks.map(m=>{const total=lots.filter(l=>stockKey(l.name)===m.product_key).reduce((n,l)=>n+Number(l.quantity||0),0);return {...m,total,missing:Math.max(0,m.minimum_quantity-total)}}).sort((a,b)=>b.missing-a.missing||a.product_name.localeCompare(b.product_name,'it'));
 $('pantryStockList').innerHTML=entries.length?entries.map(m=>'<div class="panel" style="padding:12px;margin:8px 0"><strong>'+escape(m.product_name)+'</strong><p class="hint">In casa: '+m.total+' · Scorta minima: '+m.minimum_quantity+(m.missing?' · ⚠️ Mancano '+m.missing:' · 💚 Scorta sufficiente')+'</p><div class="row">'+(m.missing?'<button type="button" class="secondary" data-stock-buy="'+escape(m.id)+'">🛒 Aggiungi '+m.missing+' alla spesa</button>':'')+'<button type="button" class="secondary" data-stock-edit="'+escape(m.id)+'">✏️ Modifica</button><button type="button" class="secondary" data-stock-delete="'+escape(m.id)+'">Elimina soglia</button></div></div>').join(''):'<p class="hint">Nessuna scorta minima impostata.</p>';
 const low=entries.filter(m=>m.missing);$('pantryStockAlerts').innerHTML=low.length?'<div class="panel" style="background:#fff4e9;border:1px solid #f2d6b7;margin:12px 0"><strong><img class="pantry-real-3d-icon" src="assets/scorte.png" alt=""> Scorte da reintegrare: '+low.length+'</strong><p class="hint">'+low.map(m=>escape(m.product_name)+' (mancano '+m.missing+')').join(' · ')+'</p></div>':'';
}
async function saveMinimumStock(name,amount){
 const key=stockKey(name),existing=minimumStocks.find(m=>m.product_key===key);
 if(!key||!Number.isInteger(amount)||amount<1||amount>99999)throw Error('Inserisci un nome e una quantità valida');
 if(existing)await request('pantry_minimum_stocks?id=eq.'+encodeURIComponent(existing.id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({minimum_quantity:amount,product_name:name.trim()})});
 else await request('pantry_minimum_stocks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({home_id:access.homeId,product_name:name.trim(),product_key:key,minimum_quantity:amount})});
 await refreshMinimumStocks();renderMinimumStocks();
}

async function refreshShopping(){
 if(!access)return;
 try{
  shopping=await request('shopping_items?select=id,name,quantity,purchased&home_id=eq.'+encodeURIComponent(access.homeId)+'&order=name.asc');
  renderShopping();
  $('shoppingStatus').textContent='';
 }catch(err){$('shoppingStatus').textContent='Per attivare la lista della spesa, esegui shopping-setup.sql in Supabase. '+err.message}
}
function renderShopping(){
 const pending=shopping.filter(x=>!x.purchased).sort((a,b)=>a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
 const bought=shopping.filter(x=>x.purchased).sort((a,b)=>a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
 $('shoppingCount').textContent='('+pending.length+')';
 const card=x=>'<div class="panel pantry-shopping-card"><strong class="pantry-shopping-name" style="'+(x.purchased?'text-decoration:line-through;opacity:.65':'')+'">'+escape(x.name)+' · '+x.quantity+'</strong><div class="pantry-shopping-actions"><button type="button" class="secondary" data-shopping-toggle="'+x.id+'">'+(x.purchased?'↩️ Ripristina':'✓ Comprato')+'</button><button type="button" class="secondary" data-shopping-delete="'+x.id+'">Elimina</button></div></div>';
 $('shoppingList').innerHTML=(pending.length?pending.map(card).join(''):'<p class="hint">Nessun prodotto da acquistare.</p>')+(bought.length?'<details style="margin-top:12px"><summary>✅ Acquistati ('+bought.length+')</summary>'+bought.map(card).join('')+'</details>':'');
}
function choosePurchasedExpiry(){
 return new Promise(resolve=>{
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(30,16,45,.48);display:flex;align-items:center;justify-content:center;padding:22px';
  const panel=document.createElement('div');
  panel.style.cssText='background:white;border-radius:22px;padding:24px;width:min(100%,420px);box-shadow:0 14px 50px #24133244';
  const heading=document.createElement('h3');heading.textContent='📅 Nuova scadenza';heading.style.margin='0 0 8px';heading.style.color='#7432a6';
  const hint=document.createElement('p');hint.textContent='Scegli la data dal calendario. Puoi anche lasciare il campo vuoto.';hint.style.cssText='margin:0 0 16px;color:#725a83';
  const label=document.createElement('label');label.textContent='Data di scadenza (facoltativa)';label.style.cssText='display:block;font-weight:600;color:#63328b';
  const input=document.createElement('input');input.type='date';input.lang='it-IT';input.style.cssText='display:block;box-sizing:border-box;width:100%;margin-top:8px;padding:14px;border:1px solid #d8b9eb;border-radius:12px;font-size:17px;background:#faf5ff;color:#42265c';
  label.appendChild(input);
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-top:18px';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Annulla';
  const noExpiry=document.createElement('button');noExpiry.type='button';noExpiry.className='secondary';noExpiry.textContent='Senza scadenza';
  const save=document.createElement('button');save.type='button';save.className='primary';save.textContent='Conferma';
  actions.append(cancel,noExpiry,save);panel.append(heading,hint,label,actions);overlay.appendChild(panel);document.body.appendChild(overlay);
  const finish=value=>{overlay.remove();resolve(value)};
  cancel.onclick=()=>finish(null);noExpiry.onclick=()=>finish('');
  save.onclick=()=>{if(!input.value){input.focus();return}finish(input.value)};
  overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null)});
 });
}
function choosePurchasedQuantity(initial){
 return new Promise(resolve=>{
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(30,16,45,.48);display:flex;align-items:center;justify-content:center;padding:22px';
  const panel=document.createElement('div');
  panel.style.cssText='background:white;border-radius:22px;padding:24px;width:min(100%,420px);box-shadow:0 14px 50px #24133244';
  const title=document.createElement('h3');title.textContent='🛒 Quante confezioni hai comprato?';title.style.cssText='margin:0 0 10px;color:#7432a6';
  const note=document.createElement('p');note.textContent='Puoi cambiare la quantità prevista nella lista.';note.style.cssText='margin:0 0 14px;color:#725a83';
  const input=document.createElement('input');input.type='number';input.min='1';input.max='99999';input.step='1';input.value=String(initial);input.inputMode='numeric';input.setAttribute('aria-label','Quantità acquistata');input.style.cssText='box-sizing:border-box;width:100%;padding:14px;border:1px solid #d8b9eb;border-radius:12px;font-size:20px;background:#faf5ff;color:#42265c';
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;margin-top:18px';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Annulla';
  const save=document.createElement('button');save.type='button';save.className='primary';save.textContent='Continua';
  actions.append(cancel,save);panel.append(title,note,input,actions);overlay.appendChild(panel);document.body.appendChild(overlay);
  const finish=value=>{overlay.remove();resolve(value)};
  cancel.onclick=()=>finish(null);
  save.onclick=()=>{const n=Number(input.value);if(!Number.isSafeInteger(n)||n<1||n>99999){alert('Inserisci una quantità intera tra 1 e 99999.');return}finish(n)};
  overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null)});
 });
}
async function offerPurchasedToPantry(item){
 if(!confirm('🛒 '+item.name+' acquistato! Vuoi aggiungerlo alla dispensa?'))return;
 const amount=await choosePurchasedQuantity(item.quantity);
 if(amount===null)return;
 const key=value=>String(value||'').normalize('NFKC').toLocaleLowerCase('it').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
 const rows=await request('pantry_product_positions?select=last_zone,last_shelf&home_id=eq.'+encodeURIComponent(access.homeId)+'&product_key=eq.'+encodeURIComponent(key(item.name))+'&limit=1');
 const remembered=rows&&rows[0];
 const current=lots.find(l=>key(l.name)===key(item.name));
 const zone=remembered?.last_zone||current?.zone||'dispensa';
 const shelf=remembered?.last_shelf||current?.shelf||'';
 const placement=await choosePantryZone(zone,shelf);
 if(!placement)return;
 const expiry=await choosePurchasedExpiry();
 if(expiry===null)return;

 const match=lots.find(l=>key(l.name)===key(item.name)&&l.zone===placement.zone&&(l.shelf||'')===(placement.shelf||'')&&(l.expires_on||'')===expiry&&!l.opened_on);
 if(match){
  await request('pantry_lots?id=eq.'+encodeURIComponent(match.id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity:Number(match.quantity)+amount})});
 }else{
  await request('pantry_lots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({home_id:access.homeId,name:item.name,zone:placement.zone,shelf:placement.shelf||null,quantity:amount,expires_on:expiry||null})});
 }
 await rememberPantryPosition({name:item.name,zone:placement.zone,shelf:placement.shelf});
 await refresh();
 $('shoppingStatus').textContent='💜 Acquisto aggiunto alla dispensa nella posizione scelta';
}
async function addToShopping(name,quantity=1){
 if(!access)throw Error('Accedi alla casa');
 const clean=String(name||'').trim().slice(0,120);if(!clean)throw Error('Nome mancante');
 const normalizedName=value=>String(value||'').normalize('NFKC').toLocaleLowerCase('it').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
 const existing=shopping.find(x=>!x.purchased&&normalizedName(x.name)===normalizedName(clean));
 if(existing)await request('shopping_items?id=eq.'+encodeURIComponent(existing.id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity:existing.quantity+quantity})});
 else await request('shopping_items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({home_id:access.homeId,name:clean,quantity})});
 await refreshShopping();
}
$('shoppingForm').onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;
 try{await addToShopping($('shoppingName').value,Number($('shoppingQty').value));$('shoppingForm').reset();$('shoppingStatus').textContent='💜 Aggiunto alla lista condivisa'}
 catch(err){$('shoppingStatus').textContent='Non salvato: '+err.message}finally{busy=false}
};
$('shoppingRefresh').onclick=refreshShopping;
$('shoppingList').onclick=async e=>{
 const b=e.target.closest('button[data-shopping-toggle],button[data-shopping-delete]');if(!b||busy)return;
 const id=b.dataset.shoppingToggle||b.dataset.shoppingDelete,x=shopping.find(y=>y.id===id);if(!x)return;
 busy=true;try{
  if(b.dataset.shoppingDelete){if(!confirm('Eliminare '+x.name+' dalla lista?'))return;await request('shopping_items?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'DELETE'})}
  else {await request('shopping_items?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({purchased:!x.purchased})});if(!x.purchased)await offerPurchasedToPantry(x);}
  await refreshShopping();
 }catch(err){$('shoppingStatus').textContent=err.message}finally{busy=false}
};
const stockPanel=document.createElement('details');stockPanel.style.cssText='margin:14px 0;border:1px solid #e6d1f5;border-radius:18px;padding:12px;background:#faf5ff';
stockPanel.innerHTML='<summary style="cursor:pointer;font-weight:700;color:#7432a6;padding:8px 2px"><img class="pantry-real-3d-icon" src="assets/scorte.png" alt=""> Scorte minime della famiglia</summary><p class="hint">Imposta quante confezioni vuoi avere sempre in casa. Sommiamo frigo, freezer e dispensa.</p><form id="pantryStockForm"><label>Nome alimento<input id="pantryStockName" required maxlength="120" placeholder="Es. Latte · Parmalat"></label><label>Quantità minima<input id="pantryStockQty" type="number" min="1" max="99999" value="2" required></label><button class="secondary" type="submit">💜 Salva scorta minima</button></form><p id="pantryStockStatus" class="hint"></p><div id="pantryStockList"></div>';
$('pantryList').before(stockPanel);
const stockAlert=document.createElement('div');stockAlert.id='pantryStockAlerts';$('pantryAlerts').after(stockAlert);
$('pantryStockForm').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;try{await saveMinimumStock($('pantryStockName').value,Number($('pantryStockQty').value));$('pantryStockStatus').textContent='💜 Scorta minima salvata per la famiglia'}catch(err){$('pantryStockStatus').textContent='Non salvato: '+err.message}finally{busy=false}};
$('pantryStockList').onclick=async e=>{
 const b=e.target.closest('button[data-stock-buy],button[data-stock-edit],button[data-stock-delete]');if(!b||busy)return;
 const id=b.dataset.stockBuy||b.dataset.stockEdit||b.dataset.stockDelete,m=minimumStocks.find(x=>x.id===id);if(!m)return;
 if(b.dataset.stockEdit){$('pantryStockName').value=m.product_name;$('pantryStockQty').value=m.minimum_quantity;stockPanel.open=true;$('pantryStockName').focus();return}
 if(b.dataset.stockDelete&&!confirm('Eliminare la scorta minima di '+m.product_name+'? Gli alimenti restano nella dispensa.'))return;
 busy=true;try{
 if(b.dataset.stockDelete){await request('pantry_minimum_stocks?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'DELETE'});await refreshMinimumStocks();renderMinimumStocks();$('pantryStockStatus').textContent='Scorta minima eliminata'}
 else{const total=lots.filter(l=>stockKey(l.name)===m.product_key).reduce((n,l)=>n+Number(l.quantity||0),0),missing=Math.max(0,m.minimum_quantity-total);if(missing){await addToShopping(m.product_name,missing);$('shoppingBox').open=true;$('pantryStockStatus').textContent='💜 Aggiunto alla lista della spesa'}}
 }catch(err){$('pantryStockStatus').textContent='Operazione non riuscita: '+err.message}finally{busy=false}
};
async function refresh(){
 if(!access)return;
 try{status.textContent='Aggiorno la dispensa…';areas=await request('pantry_areas?select=id,name,kind,icon,photo,shelves&home_id=eq.'+encodeURIComponent(access.homeId)+'&order=name.asc');redrawAreas();lots=await request('pantry_lots?select=id,name,zone,area_id,quantity,expires_on,opened_on,opened_until,shelf&home_id=eq.'+encodeURIComponent(access.homeId)+'&order=expires_on.asc.nullslast');status.textContent='💜 Dispensa condivisa aggiornata';pantryPopulateShelf($('pantryShelf'),$('pantryZone').value,$('pantryShelf').value);await refreshMinimumStocks();render();await refreshShopping()}
 catch(e){status.textContent='Per attivare la dispensa condivisa, esegui prima pantry-setup.sql in Supabase. Dettaglio: '+e.message}
}
window.familyPantryConnect=(homeId,getToken)=>{access={homeId,token:getToken};online.hidden=false;refresh()};
window.familyPantryDisconnect=()=>{access=null;lots=[];areas=[];shopping=[];minimumStocks=[];online.hidden=true;status.textContent='Accedi alla tua Casa dolce casa per vedere la dispensa.'};
root.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>{zone=b.dataset.zone;render()}));
$('pantryRefresh').onclick=refresh;
$('pantryForm').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;try{
 const payload={home_id:access.homeId,name:[$('pantryName').value.trim(),$('pantryBrand').value.trim(),$('pantryFormat').value.trim()].filter(Boolean).join(' · ').slice(0,120),zone:areaType($('pantryZone').value),area_id:areaId($('pantryZone').value),shelf:$('pantryShelf').value.trim()||null,quantity:Number($('pantryQty').value),expires_on:$('pantryExpiry').value||null};
 if(!payload.name||!Number.isInteger(payload.quantity)||payload.quantity<1)throw Error('Controlla nome e quantità');
 
const same = lots.filter(l =>
  l.name?.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
  (l.brand || '').trim().toLowerCase() === (payload.brand || '').trim().toLowerCase() &&
  (l.format || '').trim().toLowerCase() === (payload.format || '').trim().toLowerCase() &&
  l.zone === payload.zone && (l.area_id||null)===(payload.area_id||null) &&
  (l.expires_on || null) === (payload.expires_on || null) &&
  !l.opened_on
);

let match = same.find(l =>
  (l.shelf || null) === (payload.shelf || null)
);

if (!match && !payload.shelf && same.length === 1) {
  match = same[0];
}

if (match) {
  await request(
    'pantry_lots?id=eq.' + encodeURIComponent(match.id) +
    '&home_id=eq.' + encodeURIComponent(access.homeId),
    {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        quantity: Number(match.quantity) + Number(payload.quantity)
      })
    }
  );
} else {
  await request('pantry_lots', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(payload)
  });
}

 try {
  const barcode = $('pantryBarcode').value.trim();
  if (barcode && access?.homeId) {
    const product = {
      home_id: access.homeId,
      barcode: barcode,
      name: $('pantryName').value.trim(),
      brand: $('pantryBrand').value.trim(),
      format: $('pantryFormat').value.trim()
    };

    const existing = await request(
      'pantry_products?select=id&home_id=eq.' +
      encodeURIComponent(access.homeId) +
      '&barcode=eq.' + encodeURIComponent(barcode) +
      '&limit=1'
    );

    if (existing.length) {
      await request('pantry_products?id=eq.' + existing[0].id, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(product)
      });
    } else {
      await request('pantry_products', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(product)
      });
    }
  }
} catch (err) {
  console.warn('Archivio prodotti:', err);
}
 $('pantryForm').reset();await refresh();pantryPopulateShelf($('pantryShelf'),$('pantryZone').value);status.textContent='💜 Alimento salvato per tutta la famiglia';
 }catch(err){status.textContent='Non salvato: '+err.message}finally{busy=false}};
$('pantrySearch').addEventListener('input',render);
$('pantryList').onclick=async e=>{const b=e.target.closest('button[data-consume],button[data-delete],button[data-open],button[data-move],button[data-edit]');if(!b||busy)return;const id=b.dataset.consume||b.dataset.delete||b.dataset.open||b.dataset.move||b.dataset.edit,l=lots.find(x=>x.id===id);if(!l)return;
 if(b.dataset.edit){await editPantryLot(l);return}
 if(b.dataset.move){
 const placement=await choosePantryZone(areaChoice(l),l.shelf);if(placement===null)return;const newZone=areaType(placement.zone);const newArea=areaId(placement.zone);const newShelf=placement.shelf||null;
 if(!['dispensa','frigo','freezer'].includes(newZone)){status.textContent='Scegli: dispensa, frigo oppure freezer.';return}
 busy=true;try{await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({zone:newZone,area_id:newArea,shelf:newShelf})});await rememberPantryPosition({name:l.name,zone:newZone,shelf:newShelf});await refresh();status.textContent='💜 Posizione aggiornata e ricordata'}catch(err){status.textContent='Spostamento non riuscito: '+err.message}finally{busy=false}return;
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
 busy=true;try{if(b.dataset.consume&&l.quantity<=1)await rememberPantryPosition(l);if(b.dataset.delete||l.quantity<=1){await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'DELETE'})}
 else{await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity:l.quantity-1})})}
 await refresh();if(b.dataset.consume&&l.quantity<=1&&confirm('🛒 Hai finito '+l.name+'. Vuoi aggiungerlo alla mia lista della spesa?')){try{await addToShopping(l.name,1);$('shoppingBox').open=true;status.textContent='💜 Aggiunto alla lista della spesa'}catch(err){status.textContent='Alimento consumato, ma lista della spesa non aggiornata: '+err.message}}}catch(err){status.textContent='Modifica non riuscita: '+err.message}finally{busy=false}};
})();
