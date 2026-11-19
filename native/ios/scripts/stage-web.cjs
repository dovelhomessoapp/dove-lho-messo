'use strict';
const fs=require('node:fs'),path=require('node:path');
const native=path.resolve(__dirname,'..'),root=path.resolve(native,'../..'),out=path.join(native,'www');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const names=['casa-dolce-casa.html','casa-dolce-casa.js','casa-dolce-casa-bridge.js','casa-dolce-casa-pantry.js','casa-dolce-casa-gemini.js','casa-dolce-casa-photo-ai.js','casa-dolce-casa-value-estimate.js','style.css','qr.js','privacy.html','elimina-account.html','icon-192.png','icon-512.png','apple-touch-icon.png'];
for(const name of names)fs.copyFileSync(path.join(root,name),path.join(out,name));
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
fs.mkdirSync(path.join(out,'vendor'));
fs.copyFileSync(require.resolve('@zxing/library/umd/index.min.js'),path.join(out,'vendor/zxing.js'));
fs.copyFileSync(require.resolve('jsqr/dist/jsQR.js'),path.join(out,'vendor/jsqr.js'));
function replaceOnce(source,from,to){if(source.split(from).length!==2)throw Error('Source changed; inspect native transform: '+from);return source.replace(from,to)}
require('./stage-catalogs.cjs')(out);
let html=fs.readFileSync(path.join(out,'casa-dolce-casa.html'),'utf8');
html=replaceOnce(html,'./store-distribution.js?v=android1','./native-context.js');
html=replaceOnce(html,'<script src="./qr.js">','<script src="./vendor/zxing.js"></script><script src="./vendor/jsqr.js"></script><script src="./qr.js">');
html=html.replace(/<link\b[^>]*rel="manifest"[^>]*\/?\s*>/g,'');
const safeUpdates=/<script id="dlm-safe-updates">[\s\S]*?<\/script>/;
if(!safeUpdates.test(html))throw Error('Web update block missing');
html=html.replace(safeUpdates,'');
html=replaceOnce(html,'</head>',`<style>
#updateAppBtn,#googleCoverSearchBtn{display:none!important}
/* Only the content scrolls. Keep the WebView document and navigation in place. */
html[data-distribution="app-store"],
html[data-distribution="app-store"] body{height:100%;overflow:hidden;overscroll-behavior:none!important}
html[data-distribution="app-store"] body>.app{
  position:absolute;inset:0;min-height:0;overflow:hidden auto;
  overscroll-behavior:none;
  scroll-padding-bottom:calc(var(--dlm-nav-height) + 20px);
}
html[data-distribution="app-store"] body>.app>main{overflow-x:clip}
html[data-distribution="app-store"] body>nav{right:0!important;width:auto!important;max-width:100%!important}
html[data-distribution="app-store"] #pantry input[type="file"]{min-width:0;max-width:100%}
</style></head>`);
// Both entry names remain local: internal navigation never downloads a new app shell.
for(const name of ['index.html','casa-dolce-casa.html'])fs.writeFileSync(path.join(out,name),html);
fs.writeFileSync(path.join(out,'native-context.js'),"Object.defineProperty(window,'dlmStoreDistribution',{value:'app-store',writable:false,configurable:false});document.documentElement.dataset.distribution='app-store';\n");
const appScriptPath=path.join(out,'casa-dolce-casa.js');
const appScript=fs.readFileSync(appScriptPath,'utf8');
fs.writeFileSync(appScriptPath,replaceOnce(appScript,'scrollTo(0,0)}document.querySelectorAll(\'[data-page]\')','$(\'.app\').scrollTo(0,0)}document.querySelectorAll(\'[data-page]\')'));
let bridge=fs.readFileSync(path.join(out,'casa-dolce-casa-bridge.js'),'utf8');
if((bridge.match(/google-play/g)||[]).length!==3)throw Error('Store routing changed; inspect guards');
bridge=bridge.replaceAll('google-play','app-store').replaceAll('questa versione Android','questa versione iPhone');
const webReturn='https://dovelhomessoapp.github.io/dove-lho-messo/casa-dolce-casa.html';
bridge=replaceOnce(bridge,"new URL('./casa-dolce-casa.html',location.href).href",JSON.stringify(webReturn));
bridge=replaceOnce(bridge,'new URL(location.pathname,location.origin).href',JSON.stringify(webReturn));
bridge=bridge.replaceAll('Su iPhone apri l’app dalla schermata Home.','Le notifiche native sono ancora in preparazione in questa build iOS.');
bridge += "\nif (premiumPage && window.dlmStoreDistribution === 'app-store') {\n const panel = premiumPage.querySelectorAll('.panel')[1];\n if (panel) {\n  panel.innerHTML = '<h3>💜 Premium Famiglia annuale</h3>' +\n   '<p>Oggetti e libri illimitati per la tua famiglia.</p>' +\n   '<p id=\"applePremiumPrice\" aria-live=\"polite\">Caricamento prezzo Apple…</p>' +\n   '<button id=\"applePremiumBuy\" type=\"button\" class=\"primary full\" disabled>Abbonati per un anno</button>' +\n   '<button id=\"applePremiumRestore\" type=\"button\" class=\"full\">Ripristina acquisti</button>' +\n   '<p>Rinnovo automatico. Puoi gestire o annullare l’abbonamento nelle impostazioni Apple.</p>' +\n   '<p><a href=\"./privacy.html\">Privacy</a> · <a href=\"https://www.apple.com/legal/internet-services/itunes/dev/stdeula/\">Condizioni d’uso</a></p>' +\n   '<p id=\"applePremiumMessage\" role=\"status\"></p>';\n  const buy = panel.querySelector('#applePremiumBuy');\n  const restore = panel.querySelector('#applePremiumRestore');\n  const message = panel.querySelector('#applePremiumMessage');\n  const price = panel.querySelector('#applePremiumPrice');\n  const store = () => window.Capacitor?.Plugins?.PremiumStore;\n  let available = false;\n  let busy = false;\n  let loadingPrice = false;\n  async function loadPrice() {\n   if (available || loadingPrice) return;\n   loadingPrice = true;\n   try {\n    const product = await store().price();\n    price.textContent = product.price + ' / anno';\n    available = true;\n    buy.disabled = busy;\n   } catch {\n    price.textContent = 'Prezzo Apple al momento non disponibile.';\n   } finally {\n    loadingPrice = false;\n   }\n  }\n  async function checkout(isRestore) {\n   if (busy) return;\n   const accountID = currentFamilyUserId();\n   const homeID = house?.id;\n   if (!token || !accountID || !homeID) {\n    message.textContent = 'Accedi con l’account proprietario della casa.';\n    return;\n   }\n   busy = true;\n   buy.disabled = restore.disabled = true;\n   message.textContent = isRestore ? 'Ricerca acquisti Apple…' : 'Apertura acquisto Apple…';\n   try {\n    const {outcome} = await store().checkout({session:token, accountID, homeID, restore:isRestore});\n    if (homeID !== house?.id || accountID !== currentFamilyUserId()) {\n     message.textContent = '';\n     return;\n    }\n    if (outcome === 'activated') await loadPremiumStatus();\n    message.textContent = {\n     activated:'Premium attivato per la tua famiglia.',\n     pending:'Acquisto in attesa di approvazione. Una volta approvato, usa Ripristina acquisti.',\n     missing:'Nessun acquisto annuale attivo per questo account.',\n     cancelled:'Acquisto annullato.'\n    }[outcome] || '';\n   } catch (error) {\n    message.textContent = error.message || 'Verifica Apple non disponibile. Riprova.';\n   } finally {\n    busy = false;\n    buy.disabled = !available;\n    restore.disabled = false;\n   }\n  }\n  buy.addEventListener('click', () => checkout(false));\n  restore.addEventListener('click', () => checkout(true));\n  new MutationObserver(() => {\n   if (premiumPage.classList.contains('active') || premiumPage.getClientRects().length) void loadPrice();\n  }).observe(premiumPage, {attributes:true, attributeFilter:['class','hidden','style']});\n  if (premiumPage.getClientRects().length) void loadPrice();\n }\n}\n";
fs.writeFileSync(path.join(out,'casa-dolce-casa-bridge.js'),bridge);
console.log('Staged bundled iOS app, local scanners and existing account bridge. No production files changed.');
