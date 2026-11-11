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
 const lookup="function addCatalogCredit(container, label, url) {\n const link=document.createElement('a');\n link.href=url;\n link.target='_blank';\n link.rel='noopener noreferrer';\n link.textContent=label;\n container.append(link);\n}\nasync function lookupISBN(){\n const isbn=normISBN($('#barcode').value);\n if(!checkISBN(isbn)){toast('Controlla il codice ISBN');return}\n const label=isbnLookupBtn.textContent;\n isbnLookupBtn.disabled=true;\n isbnLookupBtn.textContent='📚 Cerco il libro…';\n $('#bookCatalogCredit')?.remove();\n try{\n  const codes=[isbn,isbn10of13(isbn)].filter(Boolean);\n  const query=new URLSearchParams({isbn,limit:'10',fields:'isbn,title,author_name,publisher,first_publish_year,key'});\n  const catalog=await getCatalogJSON('https://openlibrary.org/search.json?'+query);\n  if(normISBN($('#barcode').value)!==isbn)return;\n  const book=catalog.docs?.find(entry=>entry.title&&(entry.isbn||[]).some(code=>codes.includes(normISBN(code))));\n  if(!book){toast('ISBN non trovato. Prova a cercare per titolo.');ensureBookSearch();return}\n  $('#kind').value='book';\n  updateKind();\n  $('#itemName').value=book.title;\n  $('#author').value=uniqueNames(book.author_name).join(', ');\n  if(!$('#desc').value.trim())$('#desc').value=[book.publisher?.[0]&&'Editore: '+book.publisher[0],book.first_publish_year&&'Prima pubblicazione: '+book.first_publish_year].filter(Boolean).join(' · ');\n  const credit=document.createElement('p');\n  credit.id='bookCatalogCredit';\n  credit.className='hint';\n  addCatalogCredit(credit,'Scheda da Open Library','https://openlibrary.org/isbn/'+encodeURIComponent(isbn));\n  isbnLookupBtn.parentElement.insertAdjacentElement('afterend',credit);\n  saveDraft();\n  toast('Libro trovato. Puoi aggiungere la copertina con Foto o Galleria.');\n }catch(e){toast('Catalogo non disponibile. Puoi inserire i dati manualmente.')}\n finally{isbnLookupBtn.disabled=false;isbnLookupBtn.textContent=label}\n}";
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
