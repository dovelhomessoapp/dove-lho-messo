const KEY='dlm-proto-v1';const DRAFT_KEY='dlm-draft-v02';let db={places:[],items:[]},photoData='',stream=null,scanTimer=null,editing=null;try{db=JSON.parse(localStorage.getItem(KEY))||db}catch{};const $=s=>document.querySelector(s);const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){toast('Memoria piena: usa foto più leggere');return false}};const uid=()=>Math.random().toString(36).slice(2,10).toUpperCase();const placeName=id=>db.places.find(x=>x.id===id)?.name||'Posizione non assegnata';function toast(t){let el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3200)}function page(p){if(document.querySelector('#add.page.active')&&p!=='add')saveDraft();stopCamera();document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===p));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('selected',b.dataset.page===p));if(p==='scan'&&!('BarcodeDetector' in window))loadZXing();if(p==='places')renderPlaces();if(p==='items'||p==='books')renderItems();if(p==='home')renderStats();scrollTo(0,0)}document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.page==='add') {editing=null;resetForm();if(b.dataset.book){$('#kind').value='book';updateKind()}else restoreDraft()}if(b.dataset.page==='scan'&&scanForItem)scanForItem=false;page(b.dataset.page)}));function renderStats(){$('#stats').innerHTML=`<div><strong>${db.items.length}</strong><span>Oggetti e libri</span></div><div><strong>${db.places.length}</strong><span>Posizioni</span></div><div><strong>${db.items.filter(x=>x.kind==='book').length}</strong><span>Libri</span></div>`}function qrData(id){return 'DLM-P-'+id}function qrSVG(code){try{let q=new LocalQRCode(-1,LocalQRError.M);q.addData(code);q.make();let n=q.getModuleCount(),rect=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))rect.push(`<rect x="${x+4}" y="${y+4}" width="1" height="1"/>`);return `<svg class="qr" role="img" aria-label="Codice QR della posizione" viewBox="0 0 ${n+8} ${n+8}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><g fill="#43246c">${rect.join('')}</g></svg>`}catch(e){return '<p>QR non disponibile</p>'}}function renderPlaces(){let h=db.places.map(p=>`<article class="panel"><h3>📍 ${safe(p.name)}</h3><p class="muted">${db.items.filter(i=>i.place===p.id).length} oggetti · Codice ${qrData(p.id)}</p>${qrSVG(qrData(p.id))}<div class="row"><button class="secondary" onclick="printQR('${p.id}')">🖨️ Stampa</button><button class="secondary" onclick="deletePlace('${p.id}')">Elimina</button></div></article>`).join('');$('#placeList').innerHTML=h||'<div class="empty">📍 Crea la tua prima posizione!</div>';$('#itemPlace').innerHTML='<option value="">Da assegnare</option>'+db.places.map(p=>`<option value="${p.id}">${safe(p.name)}</option>`).join('')}window.printQR=id=>{const p=db.places.find(x=>x.id===id);if(!p)return;let w=window.open('','_blank');if(!w){toast('Consenti le finestre popup per stampare');return}w.document.write(`<html><meta charset="utf-8"><title>Etichetta</title><body style="text-align:center;font-family:Arial"><h2>${safe(p.name)}</h2>${qrSVG(qrData(id))}<p>${qrData(id)}</p><script>setTimeout(()=>print(),250)<\/script></body></html>`);w.document.close()};window.deletePlace=id=>{if(!confirm('Eliminare la posizione? Gli oggetti resteranno catalogati, senza posizione.'))return;db.places=db.places.filter(p=>p.id!==id);db.items.forEach(i=>{if(i.place===id)i.place=''});save();renderPlaces();toast('Posizione eliminata')};$('#placeForm').addEventListener('submit',e=>{e.preventDefault();db.places.push({id:uid(),name:$('#placeName').value.trim()});if(save()){e.target.reset();renderPlaces();toast('Posizione e QR creati!')}});function renderItems(){const list=(target,data)=>{$(target).innerHTML=data.map(i=>`<article class="entry"><div class="thumb">${i.photo?`<img class="thumb" src="${safe(i.photo)}" alt="">`:i.kind==='book'?'📖':'📦'}</div><div class="info"><strong>${safe(i.name)}</strong><small>${safe(i.author||placeName(i.place))}</small></div><button aria-label="Apri" onclick="showItem('${i.id}')">›</button></article>`).join('')||'<div class="empty">Niente qui per ora. Aggiungiamo qualcosa? 💜</div>'};let q=$('#itemFilter').value.toLocaleLowerCase();list('#itemList',db.items.filter(i=>[i.name,i.desc,i.author,i.barcode,placeName(i.place)].some(x=>String(x||'').toLocaleLowerCase().includes(q))));list('#bookList',db.items.filter(i=>i.kind==='book'))}$('#itemFilter').addEventListener('input',renderItems);$('#quickSearch').addEventListener('input',e=>{$('#itemFilter').value=e.target.value;page('items')});function resetForm(){$('#itemForm').reset();$('#editId').value='';$('#photoPreview').hidden=true;photoData='';$('#formHeading').textContent='Aggiungi oggetto ✨';renderPlaces()}$('#photoCameraBtn').onclick=()=>$('#photoCamera').click();$('#photoGalleryBtn').onclick=()=>$('#photo').click();async function onPhoto(e){let f=e.target.files[0];if(!f)return;try{let img=new Image(),url=URL.createObjectURL(f);await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});let max=720,scale=Math.min(1,max/Math.max(img.width,img.height));let c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);photoData=c.toDataURL('image/jpeg',.68);lastAutoBookCover='';URL.revokeObjectURL(url);$('#photoPreview').src=photoData;$('#photoPreview').hidden=false}catch{toast('Impossibile leggere la foto')}finally{saveDraft()}}['photo','photoCamera'].forEach(id=>$('#'+id).addEventListener('change',onPhoto));$('#itemForm').addEventListener('submit',e=>{e.preventDefault();let old=db.items.find(x=>x.id===$('#editId').value);let i={id:old?.id||uid(),kind:$('#kind').value,name:$('#itemName').value.trim(),author:$('#author').value.trim(),barcode:$('#barcode').value.trim(),desc:$('#desc').value.trim(),place:$('#itemPlace').value,value:$('#value').value,photo:photoData||old?.photo||'',created:old?.created||Date.now()};if(!i.name)return; if(old) Object.assign(old,i);else db.items.unshift(i);if(save()){editing=null;localStorage.removeItem(DRAFT_KEY);renderItems();page('items');toast('Salvato! 💜')}});window.showItem=id=>{let i=db.items.find(x=>x.id===id);if(!i)return;$('#detailBody').innerHTML=`<h2>${safe(i.name)}</h2>${i.photo?`<img class="detail-photo" src="${safe(i.photo)}" alt="Foto dell'oggetto">`:'<div class="scan-box">📦</div>'}<div class="panel"><p class="pill">${i.kind==='book'?'📚 Libro':'📦 Oggetto'}</p>${i.author?`<p><b>Autore:</b> ${safe(i.author)}</p>`:''}<p>${safe(i.desc)||'Nessuna descrizione'}</p><p><b>📍 Posizione:</b> ${safe(placeName(i.place))}</p>${i.barcode?`<p><b>Codice:</b> ${safe(i.barcode)}</p>`:''}${i.value?`<p><b>Valore inserito:</b> ${safe(i.value)} €</p>`:''}<div class="row"><button class="secondary" onclick="editItem('${i.id}')">✏️ Modifica</button><button class="secondary" onclick="deleteItem('${i.id}')">🗑️ Elimina</button></div></div>`;page('detail')};window.editItem=id=>{let i=db.items.find(x=>x.id===id);if(!i)return;editing=id;resetForm();editing=id;$('#editId').value=id;for(let [k,v] of [['kind',i.kind],['itemName',i.name],['author',i.author],['barcode',i.barcode],['desc',i.desc],['itemPlace',i.place],['value',i.value]])$('#'+k).value=v||'';photoData=i.photo||'';if(photoData){$('#photoPreview').src=photoData;$('#photoPreview').hidden=false}$('#formHeading').textContent='Modifica oggetto ✏️';updateKind();page('add');saveDraft()};window.deleteItem=id=>{if(!confirm('Eliminare definitivamente questo elemento?'))return;db.items=db.items.filter(i=>i.id!==id);save();page('items');toast('Elemento eliminato')};

// Ricerca ISBN: privilegia l'edizione esatta, completa i metadati e lascia correggere la foto.
const isbnLookupBtn=$('#lookupBook');
function checkISBN(code){if(!/^(?:\d{13}|\d{9}[\dX])$/.test(code))return false;let sum=0;if(code.length===13){for(let n=0;n<12;n++)sum+=Number(code[n])*(n%2?3:1);return (10-sum%10)%10===Number(code[12])}for(let n=0;n<10;n++)sum+=(10-n)*(code[n]==='X'?10:Number(code[n]));return sum%11===0}
async function getCatalogJSON(url){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),6500);try{const response=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json'}});if(!response.ok)throw Error('HTTP '+response.status);return await response.json()}finally{clearTimeout(timer)}}
// La copertina deve essere un'immagine reale (Open Library può rispondere con un pixel segnaposto).
function coverExists(url){return new Promise(resolve=>{const img=new Image();let ended=false;const done=ok=>{if(ended)return;ended=true;clearTimeout(timer);img.onload=img.onerror=null;resolve(ok)};const timer=setTimeout(()=>done(false),3200);img.onload=()=>done(img.naturalWidth>12&&img.naturalHeight>12);img.onerror=()=>done(false);img.src=url})}
async function coverToPhoto(url){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),3500);try{const response=await fetch(url,{signal:ctrl.signal});if(!response.ok||!(response.headers.get('content-type')||'').startsWith('image/'))return null;const blob=await response.blob();let img=new Image(),objectURL=URL.createObjectURL(blob);try{await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=objectURL});if(img.naturalWidth<=12||img.naturalHeight<=12)return null;const max=480,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.68)}finally{URL.revokeObjectURL(objectURL)}}catch{return null}finally{clearTimeout(timer)}}
let lastAutoBookCover='';
async function lookupISBN(){
 const isbn=$('#barcode').value.replace(/[\s-]/g,'').toUpperCase();
 if(!checkISBN(isbn)){toast('Controlla il codice ISBN: inserisci un ISBN valido');return}
 if(!navigator.onLine){toast('Per cercare un libro serve Internet');return}
 isbnLookupBtn.disabled=true;isbnLookupBtn.textContent='📚 Cerco libro e copertina…';
 let reachable=false,title='',authors=[],publisher='',date='',source='',exactCovers=[],otherCovers=[];
 try{
  // Richieste parallele: nessuna deve attendere inutilmente la fine dell'altra.
  const [google,edition,search]=await Promise.allSettled([
   getCatalogJSON('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent('isbn:'+isbn)+'&maxResults=5'),
   getCatalogJSON('https://openlibrary.org/isbn/'+encodeURIComponent(isbn)+'.json'),
   getCatalogJSON('https://openlibrary.org/search.json?isbn='+encodeURIComponent(isbn)+'&limit=3&fields=title,author_name,first_publish_year,publisher,isbn,cover_i')
  ]);
  const g=google.status==='fulfilled'?google.value:null;
  const e=edition.status==='fulfilled'?edition.value:null;
  const r=search.status==='fulfilled'?search.value:null;
  reachable=!!(g||e||r);
  const volume=(g?.items||[]).find(x=>(x.volumeInfo?.industryIdentifiers||[]).some(i=>i.identifier?.replace(/[\s-]/g,'')===isbn))?.volumeInfo;
  if(volume?.title){title=volume.title+(volume.subtitle?': '+volume.subtitle:'');authors=volume.authors||[];publisher=volume.publisher||'';date=volume.publishedDate||'';source='Google Books';for(const size of ['thumbnail','smallThumbnail','small','medium','large']){let u=volume.imageLinks?.[size];if(u)otherCovers.push(u.replace(/^http:/,'https:'))}}
  if(e?.title){if(!title){title=e.title;source='Open Library'}if(!publisher)publisher=e.publishers?.join(', ')||'';if(!date)date=e.publish_date||'';for(const id of e.covers||[])exactCovers.push('https://covers.openlibrary.org/b/id/'+id+'-L.jpg?default=false')}
  const match=r?.docs?.find(x=>(x.isbn||[]).includes(isbn));
  if(match){if(!title){title=match.title||'';source='Open Library Search'}if(!authors.length)authors=match.author_name||[];if(!publisher)publisher=match.publisher?.[0]||'';if(!date)date=String(match.first_publish_year||'');if(match.cover_i)otherCovers.push('https://covers.openlibrary.org/b/id/'+match.cover_i+'-L.jpg?default=false')}
  if(!authors.length&&e?.authors?.length){const details=await Promise.allSettled(e.authors.slice(0,3).filter(a=>a.key).map(a=>getCatalogJSON('https://openlibrary.org'+a.key+'.json')));authors=details.filter(x=>x.status==='fulfilled'&&x.value.name).map(x=>x.value.name)}
  if(!title){toast(reachable?'Libro non trovato nei cataloghi: puoi inserirlo manualmente':'Cataloghi non raggiungibili. Riprova.');return}
  $('#kind').value='book';updateKind();$('#itemName').value=title;if(authors.length)$('#author').value=[...new Set(authors)].join(', ');
  const notes=[publisher&&'Editore: '+publisher,date&&'Pubblicazione: '+date].filter(Boolean).join(' · ');if(notes&&!$('#desc').value.trim())$('#desc').value=notes;
  // La copertina dell'edizione ISBN viene prima di immagini di opere/edizioni generiche.
  // Le banche dati possono comunque sbagliare: l'utente può sempre sostituire la foto.
  const isbnCover='https://covers.openlibrary.org/b/isbn/'+isbn+'-L.jpg?default=false';
  const candidates=[...new Set([isbnCover,...exactCovers,...otherCovers])];
  if(!photoData||photoData===lastAutoBookCover){
   photoData='';$('#photoPreview').hidden=true;
   for(const url of candidates){
    if(!await coverExists(url))continue;
    photoData=await coverToPhoto(url)||url;
    lastAutoBookCover=photoData;
    $('#photoPreview').src=photoData;$('#photoPreview').hidden=false;
    break;
   }
  }
  saveDraft();toast(photoData?'Libro e copertina trovati! Controlla l’edizione 💜':'Libro trovato! Puoi aggiungere la copertina.');
 }finally{isbnLookupBtn.disabled=false;isbnLookupBtn.textContent='📖 Cerca ISBN online'}
}
isbnLookupBtn.addEventListener('click',lookupISBN);

let scanForItem=false;$('#scanForItem').onclick=()=>{saveDraft();scanForItem=true;$('#scanBack').hidden=false;page('scan')};$('#scanBack').onclick=()=>{scanForItem=false;stopCamera();page('add');restoreDraft(false)};function resolveScan(code){code=code.trim();if(!code)return;stopCamera();if(code.startsWith('DLM-P-')){let p=db.places.find(x=>x.id===code.slice(6));if(!p){$('#scanResult').innerHTML='<div class="panel">Posizione non presente in questo archivio.</div>';return}let items=db.items.filter(i=>i.place===p.id);$('#scanResult').innerHTML=`<div class="panel"><h3>📍 ${safe(p.name)}</h3><p>${items.length} oggetti in questa posizione</p>${items.map(i=>`<p>📦 ${safe(i.name)}</p>`).join('')}<button class="primary full" onclick="assignScannedPlace('${p.id}')">Aggiungi qui un oggetto</button></div>`;return}if(scanForItem){scanForItem=false;page('add');restoreDraft(false);$('#barcode').value=code;saveDraft();toast('Codice inserito nel modulo');if($('#kind').value==='book'&&/^97[89]\d{10}$/.test(code))$('#lookupBook').click();return}let item=db.items.find(i=>i.barcode===code);if(item)showItem(item.id);else $('#scanResult').innerHTML='<div class="panel">Nessun oggetto associato a questo codice. Puoi aggiungerlo manualmente.</div>'}window.assignScannedPlace=id=>{editing=null;resetForm();$('#itemPlace').value=id;page('add')};$('#manualGo').onclick=()=>resolveScan($('#manualScan').value);let html5scanner=null,zxReader=null,zxControls=null,scanBusy=false,scanTimeout=null,scanHandled=false,zxingLoading=null;
async function loadZXing(){
 if(window.ZXing?.BrowserMultiFormatReader)return true;
 if(!navigator.onLine)return false;
 if(!zxingLoading)zxingLoading=new Promise((resolve)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';script.onload=()=>resolve(!!window.ZXing?.BrowserMultiFormatReader);script.onerror=()=>resolve(false);document.head.appendChild(script)}).then(ok=>{if(!ok)zxingLoading=null;return ok});
 return zxingLoading;
}
function scanStatus(message){$('#scanMessage').hidden=false;$('#scanMessage').textContent=message}
function cameraError(){stopCamera();scanStatus('Non riesco a leggere il codice. Prova una foto dalla galleria oppure inseriscilo manualmente.');toast('Scansione non disponibile: prova dalla galleria')}
async function startCamera(){
  if(scanBusy)return;scanBusy=true;scanHandled=false;scanStatus('Carico il lettore…');$('#startScan').disabled=true;
  try{
    if('BarcodeDetector' in window){
      const supported=await BarcodeDetector.getSupportedFormats?.()||['qr_code','ean_13','ean_8','upc_a','code_128','code_39'];const formats=['qr_code','ean_13','ean_8','upc_a','code_128','code_39'].filter(f=>supported.includes(f));if(!formats.length)throw Error('Nessun formato supportato');const detector=new BarcodeDetector({formats});
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      $('#camera').srcObject=stream;$('#camera').hidden=false;await $('#camera').play();$('#scanMessage').hidden=true;
      $('#stopScan').hidden=false;$('#startScan').hidden=true;
      let detecting=false;scanTimer=setInterval(async()=>{if(detecting||!stream||$('#camera').readyState<2)return;detecting=true;try{const results=await detector.detect($('#camera'));if(results.length&&!scanHandled){scanHandled=true;resolveScan(results[0].rawValue)}}catch{}finally{detecting=false}},350);
    }else{
      if(!await loadZXing()){scanStatus('Il lettore richiede Internet al primo utilizzo. Puoi inserire il codice manualmente.');toast('Impossibile caricare il lettore');return}
      zxReader=new ZXing.BrowserMultiFormatReader(new Map(),120);
      $('#camera').hidden=false;$('#stopScan').hidden=false;$('#startScan').hidden=true;
      scanStatus('Avvio la fotocamera…');
      const video=$('#camera');
      // ZXing library avvia il flusso e analizza continuamente i fotogrammi.
      zxReader.decodeFromVideoDevice(null,video,(result,err)=>{if(result&&!scanHandled){scanHandled=true;resolveScan(result.getText())}})
        .then(()=>{}).catch(()=>cameraError());
      scanTimeout=setTimeout(()=>{if($('#scan').classList.contains('active')&&!video.videoWidth)cameraError();else if(video.videoWidth)$('#scanMessage').hidden=true},7000);
    }
  }catch(e){cameraError()}finally{scanBusy=false;$('#startScan').disabled=false}
}
function stopCamera(){clearTimeout(scanTimeout);scanTimeout=null;clearInterval(scanTimer);scanTimer=null;
  if(zxReader){try{zxReader.reset()}catch{}zxReader=null}
  if(html5scanner){const old=html5scanner;html5scanner=null;old.stop().then(()=>old.clear()).catch(()=>{})}
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  const v=$('#camera');if(v.srcObject){try{v.srcObject.getTracks().forEach(t=>t.stop())}catch{}v.srcObject=null}
  v.hidden=true;$('#html5reader').hidden=true;scanHandled=false;$('#scanMessage').hidden=false;$('#scanMessage').textContent='📷 Inquadra un codice oppure scegli una foto.';
  $('#stopScan').hidden=true;$('#startScan').hidden=false;scanBusy=false
}
$('#scanImageBtn').onclick=()=>$('#scanImageFile').click();
$('#scanImageFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  scanStatus('Leggo il codice nella fotografia…');
  try{
    if(!await loadZXing())throw Error('Connessione richiesta per caricare il lettore');
    const reader=new ZXing.BrowserMultiFormatReader();const url=URL.createObjectURL(file);
    try{const result=await reader.decodeFromImageUrl(url);resolveScan(result.getText())}
    finally{URL.revokeObjectURL(url);reader.reset()}
  }catch(e){scanStatus('Codice non riconosciuto nella foto. Riprova con un’immagine nitida, oppure inserisci il numero sotto il codice.');toast('Codice non trovato nella foto')}
  finally{e.target.value=''}
});
$('#startScan').onclick=startCamera;$('#stopScan').onclick=stopCamera;if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});function updateKind(){$('#authorWrap').hidden=$('#kind').value!=='book';$('#lookupBook').hidden=$('#kind').value!=='book'}$('#kind').addEventListener('change',()=>{updateKind();saveDraft()});function saveDraft(){if(!$('#itemName'))return;let data={editId:$('#editId').value,kind:$('#kind').value,itemName:$('#itemName').value,author:$('#author').value,barcode:$('#barcode').value,desc:$('#desc').value,itemPlace:$('#itemPlace').value,value:$('#value').value,photo:photoData};try{localStorage.setItem(DRAFT_KEY,JSON.stringify(data))}catch{toast('Spazio insufficiente: bozza non salvata')}}function restoreDraft(notify=true){let d;try{d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null')}catch{}if(!d)return;for(let k of ['editId','kind','itemName','author','barcode','desc','itemPlace','value'])if(d[k]!==undefined)$('#'+k).value=d[k];photoData=d.photo||'';if(photoData){$('#photoPreview').src=photoData;$('#photoPreview').hidden=false}updateKind();if(notify)toast('Bozza recuperata 💜')}$('#itemForm').addEventListener('input',saveDraft);$('#itemForm').addEventListener('change',saveDraft);window.addEventListener('pagehide',()=>{if($('#add').classList.contains('active'))saveDraft()});updateKind();renderPlaces();renderStats();page('home');
