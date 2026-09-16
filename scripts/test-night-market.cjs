const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={exports:{}};vm.runInNewContext(fs.readFileSync('assets/night-market-engine.js','utf8'),{module:box});
const E=box.exports,bins=new Set();
for(let i=0;i<=100;i++){
 const s=E.create();assert(E.launch(s,i/100));assert.equal(E.launch(s,1),false);
 let n=0;while(!s.count&&n++<1800){E.step(s,1/120);assert(Number.isFinite(s.ball.x)&&Number.isFinite(s.ball.y));}
 assert.equal(s.count,1,'Every shot must settle within 15 seconds');assert.equal(s.score,E.values[s.bin]);bins.add(s.bin);
 for(let j=0;j<180;j++)E.step(s,1/120);
 assert.equal(s.phase,'ready');assert.equal(s.count,1);assert.equal(s.score,E.values[s.bin]);
 assert(E.launch(s,.5));
}
assert.equal(bins.size,7,'All score bins are physically reachable');
const html=fs.readFileSync('pinball-night-market.html','utf8');
for(const name of ['night-market-engine.js','night-market-ui.js','night-market.css'])assert(html.includes(name));
assert(!html.includes('pinball-design.js'),'Saved classic geometry must not affect new board');
console.log('Night market: 101 launch powers, seven bins, single scoring, replay and isolated layout passed.');
