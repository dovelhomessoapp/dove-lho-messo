// Isolated startup orchestration: no credentials, network or real household data.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('casa-dolce-casa-bridge.js','utf8');
const helper=source.slice(source.indexOf('let homeWarmup=null;'),source.indexOf('async function restoreSession(){'));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
(async()=>{
 for(const scenario of ['clean','edits','creates','failure','signout']){
  const inventory=deferred(),premium=deferred(),nodes=new Map();let loads=0,uploads=0,syncs=0,connects=0,message='';
  const context={house:{id:'synthetic-home',name:'Casa di prova'},token:'synthetic-token',pendingCreates:new Set(scenario==='creates'?['new']:[]),pendingEdits:new Map(scenario==='edits'?[['edited',{}]]:[]),
   currentFamilyUserId:()=> 'synthetic-user',el:id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:''});return nodes.get(id)},
   notice:value=>message=value,updateAccountSettings:()=>{},updateFamilyAccept:()=>{},updateCreateHomeVisibility:()=>{},needsRenewal:()=>false,refreshOnce:async()=>{},console,
   window:{familyPantryConnect:()=>connects++},loadPremiumStatus:()=>premium.promise,
   load:async()=>{loads++;if(loads===1)await inventory.promise},syncEdits:async()=>{syncs++;context.pendingEdits.clear()},uploadNew:async()=>{uploads++;context.pendingCreates.clear()}};
  vm.createContext(context);vm.runInContext(helper,context);
  const first=context.activateFamilyHome(),second=context.activateFamilyHome();
  assert.equal(first,second,'Simultaneous startup must share a single inventory job');
  assert.equal(nodes.get('familyOnline').hidden,false,'Account visible before inventory completes');
  assert.equal(nodes.get('familyForm').hidden,true);
  assert.equal(nodes.get('familyHouse').textContent,'💜 Casa di prova');
  assert.equal(connects,1,'Pantry connected only once');assert.equal(loads,1);
  if(scenario==='signout')context.house=null;
  if(scenario==='failure')inventory.reject(Error('Rete lenta'));else inventory.resolve();
  // Optional premium request deliberately remains unresolved throughout startup.
  await Promise.race([first,new Promise((_,reject)=>setTimeout(()=>reject(Error('Optional premium blocked startup')),1000))]);
  assert.equal(loads,scenario==='edits'?2:1,'No redundant inventory download');
  assert.equal(uploads,scenario==='creates'?1:0,'Only upload when a pending create exists');
  assert.equal(syncs,['failure','signout'].includes(scenario)?0:1,'Stop queued writes after sign-out or failed inventory');
  if(scenario==='failure')assert.match(message,/Account collegato.*Rete lenta/);
  premium.resolve();
 }
 console.log('PASS: immediate account display, single startup, optional premium, pending writes, failure and sign-out');
})().catch(error=>{console.error(error);process.exitCode=1});
