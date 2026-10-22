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

/* Experimental semantic image comparison using an on-device CLIP model. */
const compareBtn=document.getElementById('photoAiCompare');
const compareStatus=document.getElementById('photoAiCompareStatus');
let semanticModelPromise=null;
const candidates=[
 'a 3D printer machine','a storage container with a digital humidity display',
 'a container for eyelash extension glue','a digital watch','a plastic food storage container',
 'a jar with a lid','a camera','a pair of shoes','a book','a kitchen appliance',
 'a toy','a printer','a power tool','a phone charger','a bottle',
 'a hair dryer','a sewing machine','a pair of glasses','a lamp','a box'
];
if(compareBtn&&compareStatus&&preview){
 compareBtn.addEventListener('click',async()=>{
  if(!preview.src||preview.hidden){compareStatus.textContent='Prima scegli una fotografia.';return}
  if(!navigator.onLine&&!semanticModelPromise){compareStatus.textContent='Per il primo caricamento serve Internet.';return}
  compareBtn.disabled=true;
  try{
   compareStatus.textContent='Caricamento del modello visivo gratuito CLIP… Il primo download può essere grande e richiedere alcuni minuti.';
   if(!semanticModelPromise)semanticModelPromise=import('https://esm.sh/@xenova/transformers@2.17.2?bundle')
    .then(async m=>({module:m,model:await m.pipeline('zero-shot-image-classification','Xenova/clip-vit-base-patch32',{quantized:true})}))
    .catch(e=>{semanticModelPromise=null;throw e});
   const {module,model}=await semanticModelPromise;
   compareStatus.textContent='Confronto della fotografia con descrizioni di oggetti…';
   const response=await fetch(preview.src);
   const photo=await module.RawImage.fromBlob(await response.blob());
   const result=await model(photo,candidates);
   const best=result.slice(0,4).map(x=>x.label+' ('+Math.round(x.score*100)+'%)').join(' · ');
   compareStatus.textContent='Ipotesi del modello sperimentale: '+best+'. Sono confronti con un elenco limitato, non identificazioni certe. Non modifico automaticamente la scheda.';
  }catch(e){
   compareStatus.textContent='Modello avanzato non disponibile su questo iPhone: '+((e&&e.message)||String(e)).slice(0,180)+'. Il riconoscimento standard resta utilizzabile.';
   console.warn('Semantic photo recognition:',e);
  }finally{compareBtn.disabled=false}
 });
}
