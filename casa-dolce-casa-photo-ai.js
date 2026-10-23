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
if(suggestions)suggestions.addEventListener('click',event=>{const button=event.target.closest('button[data-ai-name]');if(!button)return;const field=document.getElementById('itemName');if(!field)return;const name=button.dataset.aiName;if(field.value.trim()&&!confirm('Sostituire il nome già inserito?'))return;field.value=name;field.dispatchEvent(new Event('input',{bubbles:true}));compareStatus.textContent='Nome inserito: '+name+'. Verifica prima di salvare.';});
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
   compareStatus.textContent='Scegli uno dei tre nomi suggeriti, oppure inseriscilo manualmente. Le percentuali sono relative alle descrizioni confrontate.';if(suggestions){suggestions.replaceChildren();results.slice(0,3).forEach(x=>{const label=candidateTranslations.get(x.label)||x.label;const button=document.createElement('button');button.type='button';button.className='secondary full';button.style.marginTop='8px';button.dataset.aiName=label;button.textContent=label+' · '+Math.round(x.score*100)+'% — Usa questo nome';suggestions.appendChild(button);});}
  }catch(e){
   compareStatus.textContent='Test avanzato non riuscito: '+((e&&e.message)||String(e)).slice(0,200)+'. Puoi continuare con la scheda normale.';
   console.warn('Advanced image recognition',e);
  }finally{compareBtn.disabled=false}
 });
}
