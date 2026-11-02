const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const code=fs.readFileSync('store-distribution.js','utf8');
function check(url,referrer='',stored=null,storageWorks=true){let value=stored;const c={URL,location:{href:url},document:{referrer,documentElement:{dataset:{}}},sessionStorage:{getItem(){if(!storageWorks)throw Error('blocked');return value},setItem(k,v){if(!storageWorks)throw Error('blocked');value=v}},window:{}};vm.runInNewContext(code,c);return c.window.dlmStoreDistribution}
assert.equal(check('https://example.com/casa-dolce-casa.html'),'web');
assert.equal(check('https://example.com/casa-dolce-casa.html?distribution=google-play'),'google-play');
assert.equal(check('https://example.com/casa-dolce-casa.html','android-app://it.dovelhomesso.casadolcecasa'),'google-play');
assert.equal(check('https://example.com/casa-dolce-casa.html','android-app://other.app'),'web');
assert.equal(check('https://example.com/casa-dolce-casa.html','','google-play'),'google-play');
assert.equal(check('https://example.com/casa-dolce-casa.html?distribution=google-play','',null,false),'google-play');
assert.equal(check('https://example.com/casa-dolce-casa.html','',null,false),'web');
console.log('PASS: 7 distribution routing scenarios');
