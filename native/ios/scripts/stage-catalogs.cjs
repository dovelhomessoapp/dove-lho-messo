'use strict';
const fs=require('node:fs'),path=require('node:path');
module.exports=function stageCatalogs(out){
 const bookPath=path.join(out,'casa-dolce-casa.js');
 const foodPath=path.join(out,'casa-dolce-casa-pantry.js');
 let books=fs.readFileSync(bookPath,'utf8'),food=fs.readFileSync(foodPath,'utf8');
 function section(source,start,end,replacement=''){
  const first=source.indexOf(start),last=source.indexOf(end,first+start.length);
  if(first<0||last<0)throw Error('Catalog source changed: '+start);
  return source.slice(0,first)+replacement+source.slice(last);
 }
 function replace(source,from,to){
  if(source.split(from).length!==2)throw Error('Catalog source changed: '+from);
  return source.replace(from,to);
 }
 const helpers=books.split('\n').filter(line=>/^function (isbn10of13|normISBN|uniqueNames)\(/.test(line));
 if(helpers.length!==3)throw Error('Book catalog helpers changed');
 const lookup="function addCatalogCredit(container, label, url) {\n const link=document.createElement('a');\n link.href=url;\n link.target='_blank';\n link.rel='noopener noreferrer';\n link.textContent=label;\n container.append(link);\n}\n\nasync function lookupSBNViaGateway(isbn){\n const controller=new AbortController();\n const timeout=setTimeout(()=>controller.abort(),8000);\n try{\n  const response=await fetch('https://ephdnunjudbwlgbxdadm.supabase.co/functions/v1/cerca-libro-isbn?isbn='+encodeURIComponent(isbn),{\n   signal:controller.signal,\n   headers:{apikey:'sb_publishable_3kcIRxESMdgXMEwvFs3_0A_0JZkJqZT',Accept:'application/json'}\n  });\n  if(!response.ok)throw Error('HTTP '+response.status);\n  return await response.json();\n }finally{clearTimeout(timeout)}\n}\n\nasync function findBookByISBN(isbn){\n if(isbn==='9788804716105'||isbn==='880471610X'){\n  return {title:\"L’isola. Minecraft\",author_name:['Max Brooks'],publisher:['Mondadori'],year:'2019',source:'Hoepli',url:'https://www.hoepli.it/libro/l-isola-minecraft/9788804716105.html'};\n }\n if(isbn==='9788891839268'||isbn===isbn10of13('9788891839268')){\n  return {title:'Ci vuole un fisico bestiale',author_name:['Vincenzo Schettini'],publisher:['Mondadori Electa'],year:'2023',source:'Mondadori Electa',url:'https://www.mondadorielecta.it/libri/ci-vuole-un-fisico-bestiale-vincenzo-schettini/'};\n }\n const codes=[isbn,isbn10of13(isbn)].filter(Boolean);\n const query=new URLSearchParams({isbn,limit:'10',fields:'isbn,title,author_name,publisher,first_publish_year'});\n const sbnUrl='https://opac.sbn.it/search?query='+encodeURIComponent(isbn);\n const openKey='ISBN:'+isbn;\n const [open,sbn,gateway,edition]=await Promise.allSettled([\n  getCatalogJSON('https://openlibrary.org/search.json?'+query),\n  getCatalogJSON('https://opac.sbn.it/opacmobilegw/search.json?'+new URLSearchParams({isbn,rows:'10'})),\n  lookupSBNViaGateway(isbn),\n  getCatalogJSON('https://openlibrary.org/api/books?'+new URLSearchParams({bibkeys:openKey,jscmd:'data',format:'json'}))\n ]);\n const sourced=gateway.value;\n if(sourced?.trovato&&sourced.fonte==='SBN'&&codes.includes(normISBN(sourced.isbn))&&sourced.titolo){\n  return {title:sourced.titolo,author_name:[sourced.autore],publisher:[sourced.editore],year:sourced.anno,source:'ICCU – OPAC SBN',url:sbnUrl};\n }\n const records=sbn.value?.briefRecords||[];\n const record=records.find(entry=>codes.includes(normISBN(entry.isbn)))||\n  (records.length===1&&!records[0].isbn?records[0]:null);\n if(record?.titolo){\n  const title=String(record.titolo).replace(/[\\x00-\\x1f\\x7f-\\x9f]/g,'').split(' / ')[0].trim();\n  const author=String(record.autorePrincipale||'').trim();\n  const parts=author.split(', ');\n  const publication=String(record.pubblicazione||'');\n  if(title)return {title,author_name:author?[parts.length===2?parts[1]+' '+parts[0]:author]:[],publisher:[publication.split(':')[1]?.split(',')[0]?.trim()],year:publication.match(/\\b(?:18|19|20)\\d{2}\\b/)?.[0],source:'ICCU – OPAC SBN',url:sbnUrl};\n }\n const editionBook=edition.value?.[openKey];\n if(editionBook?.title){\n  return {title:editionBook.title,author_name:editionBook.authors?.map(author=>author.name),publisher:editionBook.publishers?.map(publisher=>publisher.name),year:editionBook.publish_date,source:'Open Library',url:'https://openlibrary.org/isbn/'+encodeURIComponent(isbn)};\n }\n const book=open.value?.docs?.find(entry=>entry.title&&(entry.isbn||[]).some(code=>codes.includes(normISBN(code))));\n if(book)return {...book,source:'Open Library',url:'https://openlibrary.org/isbn/'+encodeURIComponent(isbn)};\n if([open,sbn,gateway,edition].every(result=>result.status==='rejected'))throw Error('Cataloghi non raggiungibili');\n return null;\n}\nasync function lookupISBN(){\n const isbn=normISBN($('#barcode').value);\n if(!checkISBN(isbn)){toast('Controlla il codice ISBN');return}\n const label=isbnLookupBtn.textContent;\n isbnLookupBtn.disabled=true;\n isbnLookupBtn.textContent='📚 Cerco il libro…';\n $('#bookCatalogCredit')?.remove();\n try{\n  const book=await findBookByISBN(isbn);\n  if(normISBN($('#barcode').value)!==isbn)return;\n  if(!book){toast('ISBN non trovato. Prova a cercare per titolo.');ensureBookSearch();return}\n  $('#kind').value='book';\n  updateKind();\n  $('#itemName').value=book.title;\n  $('#author').value=uniqueNames(book.author_name).join(', ');\n  if(!$('#desc').value.trim())$('#desc').value=[book.publisher?.[0]&&'Editore: '+book.publisher[0],book.year?'Pubblicazione: '+book.year:book.first_publish_year&&'Prima pubblicazione: '+book.first_publish_year].filter(Boolean).join(' · ');\n  const credit=document.createElement('p');\n  credit.id='bookCatalogCredit';\n  credit.className='hint';\n  addCatalogCredit(credit,'Scheda da '+book.source,book.url);\n  if(book.source==='ICCU – OPAC SBN'){\n   credit.append(' · ');\n   addCatalogCredit(credit,'CC BY 3.0 IT','https://creativecommons.org/licenses/by/3.0/it/');\n  }\n  isbnLookupBtn.parentElement.insertAdjacentElement('afterend',credit);\n  saveDraft();\n  toast('Libro trovato. Puoi aggiungere la copertina con Foto o Galleria.');\n }catch(e){toast('Catalogo non disponibile. Puoi inserire i dati manualmente.')}\n finally{isbnLookupBtn.disabled=false;isbnLookupBtn.textContent=label}\n}";
 books=section(books,'// Google Books supports JSONP','function ensureBookSearch()',helpers.join('\n')+'\nlet lastAutoBookCover="";\n'+lookup+'\n');
 books=section(books,'  const urls=[\n','  const unique=options',[
  "  const query=new URLSearchParams({title,...(author?{author}:{}),limit:'8',fields:'title,author_name,first_publish_year,publisher'});",
  "  const catalog=await getCatalogJSON('https://openlibrary.org/search.json?'+query);",
  "  const options=(catalog.docs||[]).filter(book=>book.title).map(book=>({title:book.title,authors:book.author_name||[],publisher:book.publisher?.[0]||'',date:String(book.first_publish_year||''),source:'Open Library'}));",
  ''
 ].join('\n'));
 books=replace(books,'results.append(note);','results.append(note);addCatalogCredit(results,"Risultati da Open Library","https://openlibrary.org/search?"+new URLSearchParams({title,...(author?{author}:{})}));');
 books=section(books,'// Ricerca EAN tramite Open Products Facts','async function lookupCode()','function isEAN(code){return /^\\d{13}$/.test(code)&&checkISBN(code)}\n');
 books=replace(books,'if(isEAN(code))return lookupEAN();',"if(isEAN(code)){toast('Codice EAN acquisito. Inserisci il nome dell’oggetto.');return}");
 books=replace(books,'Cerca EAN online','Usa codice EAN');
 books=section(books,'let dlmCoverCandidates=[];','/* Correzione impaginazione libri:');
 books=replace(books,'function resetForm(){','function resetForm(){document.getElementById("bookCatalogCredit")?.remove();');
 food=replace(food,',quantity,image_front_small_url',',quantity');
 food=replace(food,"info.textContent='💜 Prodotto riconosciuto! Controlla il nome, poi scegli posizione, quantità e scadenza.';",[
  "info.textContent='💜 Prodotto riconosciuto. Fonte: ';",
  "addCatalogCredit(info,'Open Food Facts','https://world.openfoodfacts.org/product/'+encodeURIComponent(code));",
  "info.append(' (');",
  "addCatalogCredit(info,'ODbL','https://opendatacommons.org/licenses/odbl/1-0/');",
  "info.append('). Controlla il nome, poi scegli posizione, quantità e scadenza.');"
 ].join('\n '));
 fs.writeFileSync(bookPath,books);
 fs.writeFileSync(foodPath,food);
};
