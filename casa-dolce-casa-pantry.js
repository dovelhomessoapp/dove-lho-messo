(()=>{
const root=document.getElementById('pantry');if(!root)return;
const base='https://ephdnunjudbwlgbxdadm.supabase.co',apikey='sb_publishable_3kcIRxESMdgXMEwvFs3_0A_0JZkJqZT';
let lots=[],access=null,zone='tutte',busy=false;
const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
root.innerHTML='<div class="panel"><h2>🍎 La mia dispensa</h2><p class="hint">Inventario condiviso della famiglia · avvisi 5 giorni prima della scadenza</p><p id="pantryStatus" role="status">Accedi alla tua Casa dolce casa per vedere la dispensa.</p><div id="pantryOnline" hidden><div class="pantry-tabs"><button type="button" data-zone="tutte">Tutti</button><button type="button" data-zone="dispensa">🥫 Dispensa</button><button type="button" data-zone="frigo">🥬 Frigo</button><button type="button" data-zone="freezer">🧊 Freezer</button></div><div id="pantryAlerts"></div><form id="pantryForm"><h3>➕ Aggiungi alimento</h3><label>Nome alimento<input id="pantryName" required maxlength="120" placeholder="Es. Yogurt alla fragola"></label><label>Dove si trova?<select id="pantryZone"><option value="dispensa">🥫 Dispensa</option><option value="frigo">🥬 Frigo</option><option value="freezer">🧊 Freezer</option></select></label><label>Quantità<input id="pantryQty" type="number" min="1" max="99999" value="1" required></label><label>Data di scadenza (facoltativa)<input id="pantryExpiry" type="date"></label><p class="hint">Se lo stesso prodotto ha scadenze diverse, aggiungilo una volta per ciascuna scadenza.</p><button class="primary full" type="submit">💜 Salva alimento</button></form><h3>📦 Alimenti in casa</h3><div id="pantryList"></div><button type="button" class="secondary full" id="pantryRefresh">↻ Aggiorna dispensa</button></div></div>';
const status=$('pantryStatus'),online=$('pantryOnline');
const dayCount=date=>{if(!date)return null;const d=new Date(date+'T12:00:00'),today=new Date();today.setHours(12,0,0,0);return Math.round((d-today)/86400000)};
function render(){
 const visible=lots.filter(l=>zone==='tutte'||l.zone===zone).sort((a,b)=>(a.expires_on||'9999').localeCompare(b.expires_on||'9999')||a.name.localeCompare(b.name));
 root.querySelectorAll('[data-zone]').forEach(b=>b.classList.toggle('primary',b.dataset.zone===zone));
 const expiring=lots.filter(l=>l.quantity>0&&l.expires_on&&dayCount(l.expires_on)<=5);
 $('pantryAlerts').innerHTML=expiring.length?'<div class="panel" style="background:#fff4e9;border:1px solid #f2d6b7"><strong>🔔 Da consumare prima: '+expiring.length+' lotti in scadenza o scaduti</strong></div>':'<p class="hint">💚 Nessun alimento in scadenza nei prossimi 5 giorni.</p>';
 $('pantryList').innerHTML=visible.length?visible.map(l=>{const days=dayCount(l.expires_on);const badge=days===null?'Senza scadenza':days<0?'⚠️ Scaduto da '+Math.abs(days)+' giorni':days===0?'⚠️ Scade oggi':days<=5?'🔔 Scade tra '+days+' giorni':'Scade il '+l.expires_on.split('-').reverse().join('/');
 return '<div class="panel" style="margin:10px 0"><strong>'+escape(l.name)+'</strong><p class="hint">'+({frigo:'🥬 Frigo',freezer:'🧊 Freezer',dispensa:'🥫 Dispensa'}[l.zone]||'')+' · '+escape(badge)+'</p><div class="row"><span>Quantità: <b>'+l.quantity+'</b></span><button type="button" class="secondary" data-consume="'+l.id+'">− 1 consumato</button><button type="button" class="secondary" data-delete="'+l.id+'">Elimina</button></div></div>'}).join(''):'<p class="hint">Non ci sono alimenti in questa sezione.</p>';
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
 try{status.textContent='Aggiorno la dispensa…';lots=await request('pantry_lots?select=id,name,zone,quantity,expires_on&home_id=eq.'+encodeURIComponent(access.homeId)+'&order=expires_on.asc.nullslast');status.textContent='💜 Dispensa condivisa aggiornata';render()}
 catch(e){status.textContent='Per attivare la dispensa condivisa, esegui prima pantry-setup.sql in Supabase. Dettaglio: '+e.message}
}
window.familyPantryConnect=(homeId,getToken)=>{access={homeId,token:getToken};online.hidden=false;refresh()};
window.familyPantryDisconnect=()=>{access=null;lots=[];online.hidden=true;status.textContent='Accedi alla tua Casa dolce casa per vedere la dispensa.'};
root.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>{zone=b.dataset.zone;render()}));
$('pantryRefresh').onclick=refresh;
$('pantryForm').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;try{
 const payload={home_id:access.homeId,name:$('pantryName').value.trim(),zone:$('pantryZone').value,quantity:Number($('pantryQty').value),expires_on:$('pantryExpiry').value||null};
 if(!payload.name||!Number.isInteger(payload.quantity)||payload.quantity<1)throw Error('Controlla nome e quantità');
 await request('pantry_lots',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)});
 $('pantryForm').reset();await refresh();status.textContent='💜 Alimento salvato per tutta la famiglia';
 }catch(err){status.textContent='Non salvato: '+err.message}finally{busy=false}};
$('pantryList').onclick=async e=>{const b=e.target.closest('button[data-consume],button[data-delete]');if(!b||busy)return;const id=b.dataset.consume||b.dataset.delete,l=lots.find(x=>x.id===id);if(!l)return;
 if(b.dataset.delete&&!confirm('Eliminare questo lotto di '+l.name+'?'))return;
 busy=true;try{if(b.dataset.delete||l.quantity<=1){await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'DELETE'})}
 else{await request('pantry_lots?id=eq.'+encodeURIComponent(id)+'&home_id=eq.'+encodeURIComponent(access.homeId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity:l.quantity-1})})}
 await refresh()}catch(err){status.textContent='Modifica non riuscita: '+err.message}finally{busy=false}};
})();
