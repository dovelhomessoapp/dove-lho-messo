/* Gemini recognition through the existing authenticated Supabase family session. */
(()=>{
 const panel=document.getElementById('photoAiPanel');
 const preview=document.getElementById('photoPreview');
 if(!panel||!preview)return;
 const button=document.createElement('button');
 button.type='button';button.className='primary full';button.textContent='✨ Riconosci oggetto con Gemini';
 button.style.margin='12px 0 8px';
 const status=document.createElement('p');status.className='hint';status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 const results=document.createElement('div');
 panel.insertBefore(button,panel.firstChild);
 button.after(status,results);
 const firstString=(obj,keys)=>{for(const k of keys){if(typeof obj?.[k]==='string'&&obj[k].trim())return obj[k].trim()}return ''};
 button.addEventListener('click',async()=>{
  if(preview.hidden||!preview.src){status.textContent='Prima scatta o scegli una fotografia.';return}
  if(!navigator.onLine){status.textContent='Per riconoscere la foto con Gemini serve Internet.';return}
  if(typeof window.casaDolceCasaRecognize!=='function'){status.textContent='Collegamento familiare non ancora pronto. Aggiorna l’app.';return}
  button.disabled=true;results.replaceChildren();status.textContent='Analizzo la fotografia con Gemini…';
  try{
   const src=preview.currentSrc||preview.src;
   const img=new Image();img.src=src;
   if(img.decode)await img.decode();else if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
   const scale=Math.min(1,1024/Math.max(img.naturalWidth,img.naturalHeight));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
   const base64=canvas.toDataURL('image/jpeg',0.78).split(',')[1];
   const response=await window.casaDolceCasaRecognize(base64);
   let data=response?.result||response?.oggetto||response?.object||response;
   if(typeof data==='string'){try{data=JSON.parse(data)}catch{data={name:data}}}
   const name=firstString(data,['nome','name','oggetto','titolo','title','objectName']);
   const category=firstString(data,['categoria','category']);
   const description=firstString(data,['descrizione','description','dettagli','details']);
   if(!name&&!category&&!description){status.textContent='Risposta ricevuta, ma non contiene suggerimenti utilizzabili. Riprova con una foto più chiara.';return}
   status.textContent='Gemini ha proposto questi dati. Controllali prima di inserirli.';
   const info=document.createElement('p');info.textContent=[name&&'Nome: '+name,category&&'Categoria: '+category,description&&'Descrizione: '+description].filter(Boolean).join(' · ');results.append(info);
   const use=document.createElement('button');use.type='button';use.className='secondary full';use.textContent='💜 Usa i suggerimenti nella scheda';
   use.onclick=()=>{
    const fields=[['itemName',name],['itemCategory',category],['desc',description]];
    if(fields.some(([id,v])=>v&&document.getElementById(id)?.value.trim())&&!confirm('Alcuni campi sono già compilati. Vuoi sostituirli con i suggerimenti?'))return;
    for(const [id,v] of fields){const el=document.getElementById(id);if(el&&v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}}
    status.textContent='Suggerimenti inseriti. Verifica e premi Salva quando sei pronta.';
   };results.append(use);
  }catch(e){status.textContent='Riconoscimento non riuscito: '+(e?.message||String(e)).slice(0,200)}
  finally{button.disabled=false}
 });
})();
