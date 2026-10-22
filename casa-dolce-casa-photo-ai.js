/* Optional on-device image classification experiment; no paid API or upload. */
const btn=document.getElementById('photoAiAnalyze');
const status=document.getElementById('photoAiStatus');
const preview=document.getElementById('photoPreview');
let classifierPromise=null;
if(btn&&status&&preview){
 btn.addEventListener('click',async()=>{
  if(!preview.src||preview.hidden){status.textContent='Prima scatta o scegli una fotografia.';return}
  if(!navigator.onLine){status.textContent='Per il primo caricamento del modello serve Internet.';return}
  btn.disabled=true;
  try{
   status.textContent='Caricamento del modello gratuito sul dispositivo… potrebbe richiedere alcuni minuti.';
   if(!classifierPromise)classifierPromise=import('https://esm.sh/@xenova/transformers@2.17.2?bundle').then(m=>m.pipeline('image-classification','Xenova/mobilenet_v2_1.0_224',{quantized:true}));
   const classifier=await classifierPromise;
   status.textContent='Analisi della fotografia in corso…';
   const result=await classifier(preview.src,{topk:3});
   const labels=result.map(x=>x.label+' ('+Math.round(x.score*100)+'%)').join(' · ');
   status.textContent='Possibili riconoscimenti: '+labels+'. Controlla il risultato: non viene inserito automaticamente nella scheda.';
  }catch(e){classifierPromise=null;status.textContent='Analisi non riuscita ('+((e&&e.message)||String(e)).slice(0,180)+'). Puoi compilare la scheda normalmente.';console.warn('Photo AI:',e)}
  finally{btn.disabled=false}
 });
}
