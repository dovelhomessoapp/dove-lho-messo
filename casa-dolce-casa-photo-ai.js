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
   status.textContent='Possibili riconoscimenti: '+labels+'. Sono suggerimenti da verificare; il modello potrebbe non conoscere oggetti specifici come le stampanti 3D.';
  }catch(e){
   status.textContent='Analisi non riuscita: '+((e&&e.message)||String(e)).slice(0,180)+'. Puoi compilare la scheda normalmente.';
   console.warn('Photo AI:',e);
  }finally{btn.disabled=false}
 });
}
