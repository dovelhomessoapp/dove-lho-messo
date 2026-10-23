/* Free in-browser photo recognition using TensorFlow.js MobileNet. No upload or paid API. */
const btn=document.getElementById('photoAiAnalyze');
const status=document.getElementById('photoAiStatus');
const preview=document.getElementById('photoPreview');
let modelPromise=null;
function loadScript(src){
 return new Promise((resolve,reject)=>{
  const existing=[...document.scripts].find(s=>s.src===src);
  if(existing&&existing.dataset.loaded==='yes'){resolve();return}
  const el=document.createElement('script');el.src=src;el.crossOrigin='anonymous';
  el.onload=()=>{el.dataset.loaded='yes';resolve()};
  el.onerror=()=>reject(new Error('Impossibile scaricare la libreria: controlla la connessione'));
  document.head.appendChild(el);
 });
}
async function getModel(){
 if(!modelPromise)modelPromise=(async()=>{
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
  if(!window.mobilenet)throw new Error('Libreria MobileNet non caricata');
  await window.tf.setBackend('cpu');
  await window.tf.ready();
  return window.mobilenet.load({version:2,alpha:0.5});
 })().catch(e=>{modelPromise=null;throw e});
 return modelPromise;
}
if(btn&&status&&preview){
 btn.addEventListener('click',async()=>{
  if(!preview.src||preview.hidden){status.textContent='Prima scatta o scegli una fotografia.';return}
  if(!navigator.onLine&&!modelPromise){status.textContent='Serve Internet per caricare il modello la prima volta.';return}
  btn.disabled=true;
  try{
   status.textContent='Caricamento del riconoscimento gratuito…';
   const model=await getModel();
   status.textContent='Sto analizzando la fotografia…';
   if(!preview.complete)await new Promise((resolve,reject)=>{preview.addEventListener('load',resolve,{once:true});preview.addEventListener('error',reject,{once:true})});
   const result=await model.classify(preview,3);
   const labels=result.map(x=>x.className+' ('+Math.round(x.probability*100)+'%)').join(' · ');
   const confidence=result[0]?.probability||0;
   status.textContent=confidence<0.5
    ? '⚠️ Oggetto non riconosciuto con sufficiente affidabilità. Ipotesi del modello: '+labels+'. Non userò questi risultati per compilare la scheda: inserisci il nome manualmente oppure prova una foto più ravvicinata e con sfondo semplice.'
    : 'Possibili riconoscimenti: '+labels+'. Controlla sempre i suggerimenti prima di compilare la scheda.';
  }catch(e){
   status.textContent='Analisi non riuscita: '+((e&&e.message)||String(e)).slice(0,180)+'. Puoi compilare la scheda normalmente.';
   console.warn('Photo AI:',e);
  }finally{btn.disabled=false}
 });
}

/* Optional browser-only CLIP experiment. Uses explicitly hosted WASM assets. */
const compareBtn=document.getElementById('photoAiCompare');
const compareStatus=document.getElementById('photoAiCompareStatus');
let semanticModelPromise=null;
const candidatePairs=[["a 3D printer","Stampante 3D"],["a humidity controlled storage jar for eyelash extension glue","Contenitore per colla extension ciglia"],["a container for eyelash glue","Contenitore per colla ciglia"],["a digital watch","Orologio digitale"],["a plastic food storage container","Contenitore per alimenti"],["a jar with a lid","Barattolo con coperchio"],["a camera","Fotocamera"],["a pair of shoes","Scarpe"],["a book","Libro"],["a kitchen appliance","Elettrodomestico"],["a toy","Giocattolo"],["a printer","Stampante"],["a power tool","Utensile elettrico"],["a phone charger","Caricabatterie"],["a bottle","Bottiglia"],["a hair dryer","Asciugacapelli"],["a sewing machine","Macchina da cucire"],["a pair of glasses","Occhiali"],["a lamp","Lampada"],["a cardboard box","Scatola"],["a vacuum cleaner","Aspirapolvere"],["a coffee machine","Macchina del caffè"],["a blender","Frullatore"],["a kitchen scale","Bilancia da cucina"],["a digital thermometer","Termometro digitale"],["a digital hygrometer","Igrometro"],["a cosmetic storage container","Contenitore per cosmetici"],["a nail polish bottle","Smalto"],["a makeup brush","Pennello da trucco"],["a storage box","Scatola portaoggetti"],["a jewelry box","Portagioie"],["a refrigerator","Frigorifero"],["a freezer","Congelatore"],["a microwave oven","Microonde"],["a computer keyboard","Tastiera"],["a laptop","Computer portatile"],["a screwdriver","Cacciavite"],["a drill","Trapano"],["a pair of scissors","Forbici"],["a remote control","Telecomando"],["a bicycle","Bicicletta"],["a cooking pot","Pentola"],["a drinking mug","Tazza"],["a backpack","Zaino"],["a perfume bottle","Profumo"],["a set of keys","Chiavi"],["a flashlight","Torcia"]];
const candidates=candidatePairs.map(x=>x[0]);
const candidateTranslations=new Map(candidatePairs);
const suggestions=document.getElementById('photoAiSuggestions');
if(suggestions)suggestions.addEventListener('click',event=>{const button=event.target.closest('button[data-ai-name]');if(!button)return;const field=document.getElementById('itemName');if(!field)return;const name=button.dataset.aiName;if(field.value.trim()&&!confirm('Sostituire il nome già inserito?'))return;field.value=name;field.dispatchEvent(new Event('input',{bubbles:true}));
const descriptions={
 'Contenitore per colla extension ciglia':['Bellezza e cura personale','Contenitore per conservare la colla per extension ciglia, con chiusura metallica e display digitale sul coperchio.'],
 'Contenitore per colla ciglia':['Bellezza e cura personale','Contenitore per conservare la colla per ciglia finte.'],
 'Stampante 3D':['Elettronica e strumenti','Stampante 3D per realizzare oggetti mediante stampa a filamento.'],
 'Igrometro':['Strumenti di misura','Strumento per misurare l’umidità.'],
 'Termometro digitale':['Strumenti di misura','Dispositivo digitale per misurare la temperatura.'],
 'Bilancia da cucina':['Cucina','Bilancia per pesare ingredienti e alimenti.'],
 'Contenitore per cosmetici':['Bellezza e cura personale','Contenitore per riporre o conservare prodotti cosmetici.']
};
const category=document.getElementById('aiCategorySuggestion');
const desc=document.getElementById('desc');
const suggestion=descriptions[name];
const categoryInput=document.getElementById('itemCategory');
if(category)category.textContent=suggestion?'Categoria proposta automaticamente: '+suggestion[0]+' (puoi modificarla)':'Categoria: da definire manualmente';
if(suggestion&&categoryInput&&!categoryInput.value.trim()){categoryInput.value=suggestion[0];categoryInput.dispatchEvent(new Event('input',{bubbles:true}));}
if(suggestion&&desc&&!desc.value.trim()){desc.value=suggestion[1];desc.dispatchEvent(new Event('input',{bubbles:true}));}
compareStatus.textContent='Nome inserito: '+name+'.'+(suggestion?' Descrizione proposta se il campo era vuoto.':'')+' Verifica e correggi prima di salvare.';});
if(compareBtn&&compareStatus&&preview){
 compareBtn.addEventListener('click',async()=>{
  if(!preview.src||preview.hidden){compareStatus.textContent='Prima scegli una fotografia.';return}
  if(!navigator.onLine&&!semanticModelPromise){compareStatus.textContent='Per scaricare il modello serve Internet.';return}
  compareBtn.disabled=true;
  if(suggestions)suggestions.replaceChildren();
  try{
   compareStatus.textContent='Caricamento del modello avanzato gratuito… può richiedere alcuni minuti e molta memoria.';
   if(!semanticModelPromise)semanticModelPromise=import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1')
    .then(async m=>{
      m.env.allowLocalModels=false;
      m.env.backends.onnx.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
      m.env.backends.onnx.wasm.numThreads=1;
      const model=await m.pipeline('zero-shot-image-classification','Xenova/clip-vit-base-patch32',{device:'wasm',dtype:'q8'});
      return {module:m,model};
    }).catch(e=>{semanticModelPromise=null;throw e});
   const {module,model}=await semanticModelPromise;
   compareStatus.textContent='Confronto delle descrizioni con la fotografia…';
   const blob=await (await fetch(preview.src)).blob();
   const image=await module.RawImage.fromBlob(blob);
   const results=await model(image,candidates);
   const top=results[0]?.score||0;compareStatus.textContent=top<0.3?'⚠️ Nessun riconoscimento sufficientemente affidabile. Inserisci il nome manualmente; le percentuali del confronto non sono probabilità di correttezza.':'Scegli un nome solo se corrisponde davvero alla foto. Le percentuali sono relative alle descrizioni confrontate.';if(suggestions){suggestions.replaceChildren();(top>=0.3?results.slice(0,3):[]).forEach(x=>{const label=candidateTranslations.get(x.label)||x.label;const button=document.createElement('button');button.type='button';button.className='secondary full';button.style.marginTop='8px';button.dataset.aiName=label;button.textContent=label+' · '+Math.round(x.score*100)+'% — Usa questo nome';suggestions.appendChild(button);});}
  }catch(e){
   compareStatus.textContent='Test avanzato non riuscito: '+((e&&e.message)||String(e)).slice(0,200)+'. Puoi continuare con la scheda normale.';
   console.warn('Advanced image recognition',e);
  }finally{compareBtn.disabled=false}
 });
}


/* OCR gratuito nel browser: legge testo sulle confezioni senza caricare foto su server applicativi. */
const ocrPanel=document.createElement('div');
ocrPanel.style.cssText='margin-top:16px;padding:16px;border:1px solid #e6d0f3;border-radius:18px;background:#fff';
ocrPanel.innerHTML='<h3 style="margin:0 0 8px;color:#43246c">🔤 Leggi le scritte sulla confezione</h3><p class="hint">Riconosce marca, tipo di prodotto e quantità scritte sulla foto. Controlla sempre il risultato.</p><button type="button" class="secondary full" id="photoOcrRead">🔎 Leggi testo dalla foto (gratis)</button><p id="photoOcrStatus" class="hint" aria-live="polite"></p><div id="photoOcrResults"></div>';
const ocrAnchor=document.getElementById('photoAiAnalyze');
if(ocrAnchor){const parent=ocrAnchor.closest('.panel')||ocrAnchor.parentElement;parent?.insertAdjacentElement('afterend',ocrPanel)}
else ocrPanel.remove();
const cropPanel=document.createElement('div');
cropPanel.style.cssText='margin:12px 0;padding:12px;border:1px solid #e6d0f3;border-radius:14px';
cropPanel.innerHTML='<button type="button" class="secondary full" id="photoCropToggle">✂️ Seleziona le scritte con il dito</button><p class="hint" id="photoCropHelp">Trascina un rettangolo intorno alla marca e alle scritte. La selezione sarà usata solo per la lettura del testo.</p><div id="photoCropStage" style="display:none;position:relative;touch-action:none;user-select:none;margin:10px auto;max-width:100%;width:max-content"><img id="photoCropImage" alt="Foto da ritagliare" style="display:block;max-width:100%;max-height:360px;object-fit:contain;border-radius:10px"><div id="photoCropRect" style="display:none;position:absolute;border:3px solid #853dc6;background:#ae65e433;pointer-events:none"></div></div><button type="button" class="secondary full" id="photoCropClear" style="display:none">↩️ Annulla selezione</button>';
ocrPanel.insertBefore(cropPanel,document.getElementById('photoOcrRead'));
let selectedCrop=null;
const cropStage=document.getElementById('photoCropStage'),cropImage=document.getElementById('photoCropImage'),cropRect=document.getElementById('photoCropRect'),cropHelp=document.getElementById('photoCropHelp'),cropClear=document.getElementById('photoCropClear');
function clearPhotoCrop(){selectedCrop=null;cropRect.style.display='none';cropClear.style.display='none'}
document.getElementById('photoCropToggle').addEventListener('click',()=>{
 if(!preview.src||preview.hidden){cropHelp.textContent='Prima scegli una foto.';return}
 clearPhotoCrop();cropImage.src=preview.src;cropStage.style.display='block';
 cropHelp.textContent='Trascina il dito sulla foto per racchiudere le scritte.';
});
cropClear.addEventListener('click',()=>{clearPhotoCrop();cropHelp.textContent='Selezione annullata: verrà analizzata tutta la foto.'});
let cropStart=null;
cropStage.addEventListener('pointerdown',e=>{
 if(!cropImage.complete||!cropImage.naturalWidth)return;
 const b=cropImage.getBoundingClientRect();if(!b.width||!b.height)return;
 cropStart={x:Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(e.clientY-b.top)/b.height))};
 cropStage.setPointerCapture(e.pointerId);e.preventDefault();
});
cropStage.addEventListener('pointermove',e=>{
 if(!cropStart)return;
 const b=cropImage.getBoundingClientRect();
 const x=Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),y=Math.max(0,Math.min(1,(e.clientY-b.top)/b.height));
 selectedCrop={x:Math.min(x,cropStart.x),y:Math.min(y,cropStart.y),w:Math.abs(x-cropStart.x),h:Math.abs(y-cropStart.y)};
 cropRect.style.display='block';cropRect.style.left=(selectedCrop.x*100)+'%';cropRect.style.top=(selectedCrop.y*100)+'%';cropRect.style.width=(selectedCrop.w*100)+'%';cropRect.style.height=(selectedCrop.h*100)+'%';e.preventDefault();
});
cropStage.addEventListener('pointerup',()=>{
 if(!cropStart)return;cropStart=null;
 if(!selectedCrop||selectedCrop.w<0.08||selectedCrop.h<0.05){clearPhotoCrop();cropHelp.textContent='Selezione troppo piccola: riprova.';return}
 cropClear.style.display='block';cropHelp.textContent='Area selezionata! Premi «Leggi testo dalla foto» per analizzarla.';
});
// On iOS Safari, prevent page panning during a finger-drawn selection.
cropStage.style.touchAction='none';
cropImage.style.touchAction='none';
cropImage.style.webkitUserDrag='none';
cropStage.style.overscrollBehavior='contain';
cropStage.addEventListener('touchstart',e=>{
 if(!cropImage.complete||!cropImage.naturalWidth||!e.touches.length)return;
 e.preventDefault();
 const t=e.touches[0],b=cropImage.getBoundingClientRect();
 cropStart={x:Math.max(0,Math.min(1,(t.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(t.clientY-b.top)/b.height))};
},{passive:false});
cropStage.addEventListener('touchmove',e=>{
 if(!cropStart||!e.touches.length)return;
 e.preventDefault();
 const t=e.touches[0],b=cropImage.getBoundingClientRect();
 const x=Math.max(0,Math.min(1,(t.clientX-b.left)/b.width)),y=Math.max(0,Math.min(1,(t.clientY-b.top)/b.height));
 selectedCrop={x:Math.min(x,cropStart.x),y:Math.min(y,cropStart.y),w:Math.abs(x-cropStart.x),h:Math.abs(y-cropStart.y)};
 cropRect.style.display='block';cropRect.style.left=(selectedCrop.x*100)+'%';cropRect.style.top=(selectedCrop.y*100)+'%';cropRect.style.width=(selectedCrop.w*100)+'%';cropRect.style.height=(selectedCrop.h*100)+'%';
},{passive:false});
cropStage.addEventListener('touchend',e=>{
 if(!cropStart)return;e.preventDefault();cropStart=null;
 if(!selectedCrop||selectedCrop.w<0.08||selectedCrop.h<0.05){clearPhotoCrop();cropHelp.textContent='Selezione troppo piccola: riprova.';return}
 cropClear.style.display='block';cropHelp.textContent='Area selezionata! Premi «Leggi testo dalla foto» per analizzarla.';
},{passive:false});
cropStage.addEventListener('touchcancel',()=>{cropStart=null});
async function getOcrImage(){
 if(!selectedCrop)return preview.src;
 const img=new Image();img.src=preview.src;
 if(!img.complete)await new Promise((ok,fail)=>{img.onload=ok;img.onerror=fail});
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*selectedCrop.w));c.height=Math.max(1,Math.round(img.naturalHeight*selectedCrop.h));
 c.getContext('2d').drawImage(img,img.naturalWidth*selectedCrop.x,img.naturalHeight*selectedCrop.y,c.width,c.height,0,0,c.width,c.height);
 return c.toDataURL('image/png');
}
let ocrWorkerPromise=null;
const ocrRead=document.getElementById('photoOcrRead');
const ocrStatus=document.getElementById('photoOcrStatus');
const ocrResults=document.getElementById('photoOcrResults');
function ocrSuggestion(raw){
 const lines=raw.split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x.length>=3);
 const text=lines.join(' ');
 const brand=(text.match(/(?:faber|aber)[\s-]*castel{1,2}/i)||text.match(/stabilo|staedtler|giotto|bic|pilot|edding|sharpie/i)||[])[0]||'';
 // Allow OCR to insert or lose a few letters in common packaging words.
 const compact=text.toLowerCase().replace(/[^a-z0-9]/g,'');
 const hasMarker=/felt[\s\W]*t(?:i|l)?p|filzstift|pennarell|markers/i.test(text)||(/(?:faber|aber)[\s-]*castel/i.test(text)&&/\bfelt\b/i.test(text))||
   (/faber[\s-]*castell/i.test(text)&&/\b12\b/.test(text)&&/fel.{0,6}(?:pen|ip)|(?:fel|fil).{0,9}pen/i.test(text));
 const qty=(text.match(/\b(?:\d{1,3})\s*(?:felt[\s-]*tip pens|pennarelli|matite|markers|pezzi|pcs)\b/i)||[])[0]||'';
 let type='';
 if(hasMarker)type='Pennarelli';
 else if(/matite|pencils/i.test(text))type='Matite';
 else if(/penne|ballpoint/i.test(text))type='Penne';
 else if(/colla|glue/i.test(text))type='Colla';
 else if(/quadern|notebook/i.test(text))type='Quaderno';
 const number=(qty.match(/\d+/)||[])[0]||(hasMarker&&(text.match(/\b(?:12|24|36|48|6|8|10)\b/)||[])[0])||'';
 const safeBrand=/^(?:faber|aber)[\s-]*castel/i.test(brand)?'Faber-Castell':brand;\n const name=[type,safeBrand,number?'confezione da '+number:''].filter(Boolean).join(' ').trim();
 return {name,category:type?'Cancelleria e materiale scolastico':'',description:lines.slice(0,8).join(' · '),raw:lines.join('\n')};
}
/* Try the original orientation and quarter-turns: iPhone photos can carry orientation metadata. */
async function ocrOriented(worker,img){
 const source=new Image();source.src=img;
 if(!source.complete)await new Promise((ok,fail)=>{source.onload=ok;source.onerror=fail});
 const w=source.naturalWidth,h=source.naturalHeight;
 if(!w||!h)throw new Error('Immagine non leggibile');
 const runs=[];
 // Scan the whole photo first, then enlarge the central package area.
 // Crop is deliberately generous to avoid cutting off packaging text.
 for(const crop of [1,0.82,0.64]){
  for(const degrees of [0,90,270,180]){
   const cw=w*crop,ch=h*crop,swapped=degrees===90||degrees===270;
   const scale=Math.min(3,Math.max(1,1600/Math.max(cw,ch)));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round((swapped?ch:cw)*scale));
   canvas.height=Math.max(1,Math.round((swapped?cw:ch)*scale));
   const ctx=canvas.getContext('2d');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.translate(canvas.width/2,canvas.height/2);
   ctx.rotate(degrees*Math.PI/180);
   ctx.drawImage(source,(w-cw)/2,(h-ch)/2,cw,ch,-cw*scale/2,-ch*scale/2,cw*scale,ch*scale);
   const result=await worker.recognize(canvas);
   const raw=(result.data.text||'').trim();
   const words=(result.data.words||[]).filter(x=>x.confidence>=45&&/[a-zA-ZÀ-ÿ]{2,}/.test(x.text));
   const confidence=words.length?words.reduce((sum,x)=>sum+x.confidence,0)/words.length:0;
   const meaningful=raw.match(/[a-zA-ZÀ-ÿ]{3,}/g)||[];
   const productHints=(/(?:faber|aber)[\s-]*castel|stabilo|staedtler|giotto/i.test(raw)?20:0)+(/felt|filzstift|pennarell|markers/i.test(raw)?18:0)+(/\b(?:12|24|36|48)\b/.test(raw)?12:0);\n   const score=confidence*Math.min(meaningful.length,12)/12+productHints;
   runs.push({raw,score,confidence,words:meaningful.length,degrees,crop});
  }
 }
 // Prefer recognitions with legible words; never auto-save uncertain results.
 return runs.sort((a,b)=>b.score-a.score)[0];
}
if(ocrRead&&preview){
 ocrRead.addEventListener('click',async()=>{
  if(!preview.src||preview.hidden){ocrStatus.textContent='Prima scatta o scegli una foto.';return}
  if(!navigator.onLine&&!ocrWorkerPromise){ocrStatus.textContent='Serve Internet per scaricare il lettore di testo al primo utilizzo.';return}
  ocrRead.disabled=true;ocrResults.replaceChildren();
  try{
   ocrStatus.textContent='Caricamento del lettore gratuito (italiano e inglese)…';
   await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
   if(!window.Tesseract)throw new Error('Lettore di testo non disponibile');
   if(!ocrWorkerPromise)ocrWorkerPromise=window.Tesseract.createWorker('ita+eng',1,{logger:()=>{}}).catch(e=>{ocrWorkerPromise=null;throw e});
   const worker=await ocrWorkerPromise;
   ocrStatus.textContent='Sto leggendo e ingrandendo le scritte (può richiedere un minuto)…';
   const result=await ocrOriented(worker,await getOcrImage());
   const extracted=result.raw;
   if(!extracted||result.score<18||result.words<2){ocrStatus.textContent='⚠️ Non riesco a leggere le scritte con sufficiente affidabilità, nemmeno ruotando la foto. Non inserirò testo confuso nella scheda. Prova una foto frontale e ravvicinata della confezione.';return}
   const suggestion=ocrSuggestion(extracted);
   // Tesseract confidence can be misleading on decorative packaging.
   // Only offer import when recognizable product words are actually present.
   const normalized=extracted.replace(/[^a-zA-ZÀ-ÿ0-9]+/g,' ').trim();
   const meaningfulWords=normalized.split(/\s+/).filter(x=>x.length>=4);
   const recognizable=/(?:faber|aber)[\\s-]*castel|pennarell|felt[\\s-]*tip|filzstift|markers|matite|pencils|stabilo|staedtler|giotto|bic|pilot|sharpie|quadern|notebook|colla|glue/i.test(extracted);
   if(!recognizable && (meaningfulWords.length<3 || !meaningfulWords.some(x=>x.length>=6))){
    ocrStatus.textContent='⚠️ Il lettore ha trovato soltanto frammenti di lettere, non parole attendibili. Non propongo di aggiungerli alla scheda. Puoi scrivere il nome manualmente o riprovare con una foto ravvicinata.';
    return;
   }
   ocrStatus.textContent='Lettura migliore con rotazione '+result.degrees+'° e ritaglio '+Math.round(result.crop*100)+'%. Controlla il testo prima di inserirlo.';
   const pre=document.createElement('p');pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:.92em;color:#654982';pre.textContent=suggestion.raw;ocrResults.appendChild(pre);
   const addButton=(label,handler)=>{const b=document.createElement('button');b.type='button';b.className='secondary full';b.style.marginTop='8px';b.textContent=label;b.addEventListener('click',handler);ocrResults.appendChild(b)};
   if(suggestion.name)addButton('✨ Usa nome suggerito: '+suggestion.name,()=>{
    const input=document.getElementById('itemName');if(!input)return;
    if(input.value.trim()&&!confirm('Sostituire il nome già inserito?'))return;
    input.value=suggestion.name;input.dispatchEvent(new Event('input',{bubbles:true}));
    const cat=document.getElementById('itemCategory');
    if(cat&&!cat.value.trim()&&suggestion.category){cat.value=suggestion.category;cat.dispatchEvent(new Event('input',{bubbles:true}))}
    ocrStatus.textContent='Nome inserito. Controlla e correggi prima di salvare.';
   });
   addButton('📝 Aggiungi il testo letto alla descrizione',()=>{
    const field=document.getElementById('desc');if(!field)return;
    const next=suggestion.description;
    if(field.value.trim()&&!confirm('Aggiungere il testo alla descrizione esistente?'))return;
    field.value=[field.value.trim(),next].filter(Boolean).join('\n');field.dispatchEvent(new Event('input',{bubbles:true}));
    ocrStatus.textContent='Testo aggiunto alla descrizione. Controlla prima di salvare.';
   });
  }catch(e){ocrStatus.textContent='Lettura non riuscita: '+((e&&e.message)||String(e)).slice(0,150)+'. Puoi compilare la scheda normalmente.';console.warn('OCR',e)}
  finally{ocrRead.disabled=false}
 });
}
