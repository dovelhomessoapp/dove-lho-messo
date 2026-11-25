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
const premiumUI = `
if (premiumPage && window.dlmStoreDistribution === 'app-store') {
 const panel = premiumPage.querySelectorAll('.panel')[1];
 if (panel) {
  panel.innerHTML = '<h3>💜 Premium Famiglia</h3>' +
   '<p>Oggetti e libri illimitati per la tua famiglia.</p>' +
   '<button id="applePremiumTrial" type="button" class="primary full" hidden>Prova Premium gratis per 30 giorni</button>' +
   '<p id="applePremiumTrialInfo" role="status"></p>' +
   '<p id="applePremiumPrice" aria-live="polite">Caricamento prezzo annuale…</p>' +
   '<button id="applePremiumBuy" aria-describedby="applePremiumBuyStatus" type="button" class="primary full" disabled>Abbonati per un anno</button><span id="applePremiumBuyStatus" role="status" style="display:block"></span>' +
   '<img id="appleMonthlyOfferArt" src="./assets/premium-offerta-lancio.webp" alt="" width="72" height="72" style="border-radius:14px;float:left;margin:0 12px 8px 0" hidden>' +
   '<p id="appleMonthlyPrice" aria-live="polite">Caricamento prezzo mensile…</p>' +
   '<button id="appleMonthlyBuy" aria-describedby="appleMonthlyBuyStatus" style="clear:both" type="button" class="primary full" disabled>Abbonati per un mese</button><span id="appleMonthlyBuyStatus" role="status" style="display:block"></span>' +
   '<button id="applePremiumRestore" aria-describedby="applePremiumRestoreStatus" type="button" class="full">Ripristina acquisti</button><span id="applePremiumRestoreStatus" role="status" style="display:block"></span>' +
   '<p>Rinnovo automatico. Puoi gestire o annullare l’abbonamento nelle impostazioni Apple.</p>' +
   '<p><a href="./privacy.html">Privacy</a> · <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Condizioni d’uso</a></p>';
  const buy = panel.querySelector('#applePremiumBuy');
  const monthlyBuy = panel.querySelector('#appleMonthlyBuy');
  const plans = [
   {id:'annual', button:buy, price:panel.querySelector('#applePremiumPrice'), interval:'anno'},
   {id:'monthly', button:monthlyBuy, price:panel.querySelector('#appleMonthlyPrice'), interval:'mese'}
  ];
  const restore = panel.querySelector('#applePremiumRestore');
  const statuses = [buy, monthlyBuy, restore].map(button =>
   panel.querySelector('#' + button.id + 'Status')
  );
  const [annualStatus, monthlyStatus, restoreStatus] = statuses;
  const store = () => window.Capacitor?.Plugins?.PremiumStore;
  const available = new Set();
  let busy = false;
  let loadingPrice = false;
  async function loadPrice() {
   if (available.size === plans.length || loadingPrice) return;
   loadingPrice = true;
   try {
    await Promise.all(plans.filter(plan => !available.has(plan.id)).map(async plan => {
     try {
      const product = await store().price({plan:plan.id});
      plan.price.textContent = product.introPrice && product.introMonths > 0
       ? 'Offerta di lancio: ' + product.introPrice + ' al mese per ' + product.introMonths +
         (product.introMonths === 1 ? ' mese, poi ' : ' mesi, poi ') + product.price + ' al mese.'
       : product.price + ' / ' + plan.interval;
      if (plan.id === 'monthly') panel.querySelector('#appleMonthlyOfferArt').hidden = !(product.introPrice && product.introMonths > 0);
      available.add(plan.id);
      plan.button.disabled = busy;
     } catch {
      plan.price.textContent = 'Prezzo ' + (plan.id === 'annual' ? 'annuale' : 'mensile') + ' al momento non disponibile.';
     }
    }));
   } finally {
    loadingPrice = false;
   }
  }
  async function checkout(message, isRestore, plan) {
   if (busy) return;
   for (const status of statuses) status.textContent = '';
   const accountID = currentFamilyUserId();
   const homeID = house?.id;
   if (!token || !accountID || !homeID) {
    message.textContent = 'Accedi con l’account proprietario della casa.';
    return;
   }
   busy = true;
   buy.disabled = monthlyBuy.disabled = restore.disabled = true;
   message.textContent = isRestore ? 'Ricerca acquisti Apple…' : 'Apertura acquisto Apple…';
   try {
    const {outcome} = await store().checkout({session:token, accountID, homeID, restore:isRestore, plan});
    if (homeID !== house?.id || accountID !== currentFamilyUserId()) {
     message.textContent = '';
     return;
    }
    if (outcome === 'activated') await loadPremiumStatus();
    message.textContent = {
     activated:'Premium attivato per la tua famiglia.',
     pending:'Acquisto in attesa di approvazione. Una volta approvato, usa Ripristina acquisti.',
     missing:'Nessun acquisto Premium attivo per questo account.',
     cancelled:'Acquisto annullato.'
    }[outcome] || '';
   } catch (error) {
    message.textContent = error.message || 'Verifica Apple non disponibile. Riprova.';
   } finally {
    busy = false;
    for (const option of plans) option.button.disabled = !available.has(option.id);
    restore.disabled = false;
   }
  }
  buy.addEventListener('click', () => checkout(annualStatus, false, 'annual'));
  monthlyBuy.addEventListener('click', () => checkout(monthlyStatus, false, 'monthly'));
  restore.addEventListener('click', () => checkout(restoreStatus, true));
  const trialButton = panel.querySelector('#applePremiumTrial');
  const trialInfo = panel.querySelector('#applePremiumTrialInfo');
  let trialBusy = false;
  async function refreshTrial(start = false) {
   const homeID = house?.id;
   const accountID = currentFamilyUserId();
   if (!token || !homeID || !accountID) {
    trialButton.hidden = true;
    trialInfo.textContent = '';
    return;
   }
   if (trialBusy) return;
   trialBusy = true;
   trialButton.disabled = true;
   try {
    const result = await familyRpc('ios_premium_trial', {p_home:homeID,p_start:start});
    if (homeID !== house?.id || accountID !== currentFamilyUserId()) return;
    trialButton.hidden = !result.eligible;
    const active = result.endsAt && new Date(result.endsAt).getTime() > Date.now();
    trialInfo.textContent = active
      ? 'Prova gratuita attiva fino al ' + formatPremiumDate(result.endsAt) + '. Nessun rinnovo automatico.'
      : result.eligible ? 'Nessun addebito. Alla fine della prova scegli se abbonarti.' : '';
    if (active && start) await loadPremiumStatus();
   } catch {
    if (start) trialInfo.textContent = 'Impossibile avviare la prova. Riprova.';
   } finally {
    trialBusy = false;
    trialButton.disabled = false;
   }
  }
  trialButton.addEventListener('click', () => void refreshTrial(true));
  new MutationObserver(() => {
   if (premiumPage.classList.contains('active') || premiumPage.getClientRects().length) { void loadPrice(); void refreshTrial(); }
  }).observe(premiumPage, {attributes:true, attributeFilter:['class','hidden','style']});
  if (premiumPage.getClientRects().length) { void loadPrice(); void refreshTrial(); }
 }
}
`;
if(!bridge.trimEnd().endsWith('})();'))throw Error('Family bridge closure missing');
bridge=bridge.trimEnd().slice(0,-5)+premiumUI+'})();\n';
fs.writeFileSync(path.join(out,'casa-dolce-casa-bridge.js'),bridge);
console.log('Staged bundled iOS app, local scanners and existing account bridge. No production files changed.');
