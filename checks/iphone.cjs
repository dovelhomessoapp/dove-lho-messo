// Isolated checks: never contact the backend or read real household data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('casa-dolce-casa.html','utf8');
const app=fs.readFileSync('casa-dolce-casa.js','utf8');
const script=html.match(/<script id="dlm-navigation-clearance">([\s\S]*?)<\/script>/)[1];
for(const observerAvailable of [true,false]){
 let height=106,listener,resize,actual;
 const context={document:{querySelector:()=>({getBoundingClientRect:()=>({height})}),documentElement:{style:{setProperty:(key,value)=>{assert.equal(key,'--dlm-nav-height');actual=value}}}},window:{addEventListener:(event,callback)=>{assert.equal(event,'resize');resize=callback}}};
 if(observerAvailable)context.window.ResizeObserver=context.ResizeObserver=class{constructor(callback){listener=callback}observe(){}};
 vm.runInNewContext(script,context);
 assert.equal(actual,'106px');
 height=127.4;(observerAvailable?listener:resize)();assert.equal(actual,'128px');
}
let hidden=false,stops=0;
const handlers={};
const tail=app.slice(app.indexOf('// Release the camera when iPhone locks'));
vm.runInNewContext(tail,{document:{get hidden(){return hidden},addEventListener:(event,fn)=>{handlers[event]=fn}},window:{addEventListener:(event,fn)=>{handlers[event]=fn}},stopCamera:()=>stops++});
handlers.visibilitychange();assert.equal(stops,0);
hidden=true;handlers.visibilitychange();assert.equal(stops,1);
handlers.pagehide();assert.equal(stops,2);
assert.match(html,/viewport-fit=cover/);
assert.match(html,/\.app input,\.app select,\.app textarea\{font-size:16px!important\}/);
assert.match(html,/#dlmGuideDialog\{max-height:100%;overflow-y:auto/);
console.log('PASS: navigation resize and fallback, camera lifecycle, iPhone layout safeguards');
