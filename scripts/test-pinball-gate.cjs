const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),m={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/pinball-table.js','utf8')+fs.readFileSync('assets/pinball-engine.js','utf8'),{module:m});
const E=m.exports,well=E.table.components.find(c=>c.id==='orbit-wormhole').shape,cap=E.table.components.find(c=>c.id==='upper-neck-right');
assert.equal(cap.type,'rail');assert(E.table.railColliders.some(c=>c.component===cap));
const s=E.create('practice');s.phase='playing';s.balls=[{x:well.x,y:well.y+17,vx:0,vy:-300,r:8,lane:false,stuck:0}];
E.tick(s,1/240);assert.equal(s.score,250);const b=s.balls[0],release=b.orbitCaptureUntil;assert(release);assert.equal(b.x,well.x);assert.equal(b.y,well.y);
s.paused=true;const snapshot=JSON.stringify(s);E.tick(s,1/30);assert.equal(JSON.stringify(s),snapshot);s.paused=false;
while(s.time+1/240<release){E.tick(s,1/240);assert(b.orbitCaptureUntil);assert.equal(s.score,250);}
while(b.orbitCaptureUntil)E.tick(s,1/240);
assert.equal(b.x,well.x);assert.equal(b.y,well.y);assert(b.vy>300);assert(b.orbitBlocked);
let returned=false;for(let i=0;i<480;i++){E.tick(s,1/240);returned||=b.y>350;assert.equal(s.events.filter(e=>e.kind==='orbit-capture').length,1,'Ejection cannot immediately farm the wormhole');}
assert(returned,'Ejected ball follows the channel back down');
for(const power of [0,.5,1]){const g=E.create('practice');E.launch(g,power);for(let i=0;i<500&&g.balls[0].lane;i++)E.tick(g,1/240);assert(!g.balls[0].lane);assert(g.balls[0].vx<0);}
console.log('PASS: closed orbit, +250 once, pause-safe one-second capture, same-position downward ejection and unobstructed launch.');
