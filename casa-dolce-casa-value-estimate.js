/* Optional value suggestion from the existing Gemini recognition response.
   Never fabricate a price when the server does not return one. */
(()=>{
 const valueField=document.getElementById('value');
 if(valueField){valueField.addEventListener('blur',()=>{const raw=valueField.value.trim();if(!raw)return;const n=Number(raw.replace(',','.'));if(Number.isFinite(n)&&n>=0)valueField.value=n.toFixed(2).replace('.',',')});}
 const button=document.getElementById('estimateValueAi');
 const status=document.getElementById('estimateValueStatus');
 const result=document.getElementById('estimateValueResult');
 const preview=document.getElementById('photoPreview');
 if(!button||!status||!result)return;
 function readPrice(data){
  const sources=[data?.stima_valore,data?.stimaValore,data?.prezzo_stimato,data?.prezzoStimato,data?.valore_stimato,data?.estimated_price,data?.estimatedPrice,data?.priceEstimate];
  for(const candidate of sources){
   const v=typeof candidate==='object'&&candidate!==null?(candidate.eur??candidate.euro??candidate.valore??candidate.prezzo??candidate.amount):candidate;
   if(typeof v==='number'&&Number.isFinite(v)&&v>0&&v<1000000)return v;
   if(typeof v==='string'){
    const match=v.match(/(?:€\s*)?(\d{1,6}(?:[.,]\d{1,2})?)/);
    if(match){const n=Number(match[1].replace(',','.'));if(Number.isFinite(n)&&n>0&&n<1000000)return n}
   }
  }
  return null;
 }
 button.addEventListener('click',async()=>{
  result.replaceChildren();
  if(!preview||preview.hidden||!preview.src){status.textContent='Per stimare il valore, aggiungi prima una fotografia dell’oggetto.';return}
  if(!navigator.onLine){status.textContent='Per richiedere una stima serve Internet.';return}
  if(typeof window.casaDolceCasaRecognize!=='function'){status.textContent='Collegamento con Gemini non disponibile. Riprova dopo aver effettuato l’accesso.';return}
  button.disabled=true;status.textContent='Chiedo a Gemini se dispone di una stima…';
  try{
   const img=new Image();img.src=preview.currentSrc||preview.src;
   if(img.decode)await img.decode();else if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
   const scale=Math.min(1,1024/Math.max(img.naturalWidth,img.naturalHeight));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
   const data64=canvas.toDataURL('image/jpeg',0.78).split(',')[1];
   const response=await window.casaDolceCasaRecognize(data64);
   let data=response?.result||response?.oggetto||response?.object||response;
   if(typeof data==='string'){try{data=JSON.parse(data)}catch{data={}}}
   const price=readPrice(data);
   if(price===null){status.textContent='Gemini riconosce l’oggetto, ma la funzione Supabase non restituisce ancora una stima del prezzo. Nessun valore è stato modificato.';return}
   const formatted=new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(price);
   status.textContent='Stima indicativa basata sulla foto, non verificata nei negozi.';
   const p=document.createElement('p');p.textContent='Valore suggerito: '+formatted;
   const apply=document.createElement('button');apply.type='button';apply.className='secondary full';apply.textContent='💜 Usa questa stima';
   apply.onclick=()=>{
    const input=document.getElementById('value');if(!input)return;
    if(input.value.trim()&&!confirm('Vuoi sostituire il valore già inserito?'))return;
    input.value=price.toFixed(2).replace('.',',');input.dispatchEvent(new Event('input',{bubbles:true}));
    status.textContent='Valore inserito. Verifica la stima prima di salvare.';
   };
   result.append(p,apply);
  }catch(e){status.textContent='Stima non disponibile: '+(e?.message||String(e)).slice(0,160)}
  finally{button.disabled=false}
 });
})();
