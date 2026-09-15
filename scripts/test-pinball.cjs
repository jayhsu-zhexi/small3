const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={exports:{}};vm.runInNewContext(fs.readFileSync('assets/pinball-engine.js','utf8'),{module:box});const E=box.exports;
function advance(s,seconds,input={}){for(let i=0;i<Math.round(seconds*120);i++){E.tick(s,1/120,input);s.events=[];}}
function put(s,x,y,vx=0,vy=0){s.phase='playing';s.balls=[{x,y,vx,vy,r:E.R,lane:false,stuck:0}];s.time+=2;}
assert.throws(()=>E.create('bad'));let s=E.create();assert.equal(s.lives,3);assert.equal(s.phase,'ready');assert.equal(E.launch(s,.6),true);assert.equal(E.launch(s,1),false);
advance(s,.9);assert.ok(s.balls.every(b=>!b.lane),'A launched ball reaches the playable field');
const snapshot=JSON.stringify(s);s.paused=true;const paused=JSON.stringify(s);E.tick(s,1/30,{left:true});assert.equal(JSON.stringify(s),paused);assert.notEqual(snapshot,paused);assert.equal(E.launch(s),false);s.paused=false;
put(s,240,850);s.saveUntil=s.time+3;E.tick(s,1/120);assert.equal(s.phase,'ready');assert.equal(s.lives,3);assert.equal(s.events.at(-1).kind,'saved');
for(let lives=2;lives>=0;lives--){put(s,240,850);s.saveUntil=0;E.tick(s,1/120);assert.equal(s.lives,lives);assert.equal(s.phase,lives?'ready':'lost');}
const ended=JSON.stringify(s);E.tick(s,1/30);assert.equal(JSON.stringify(s),ended);assert.equal(E.launch(s),false);
const practice=E.create('practice');for(let i=0;i<12;i++){put(practice,240,850);practice.saveUntil=0;E.tick(practice,1/120);assert.equal(practice.phase,'ready');assert.equal(practice.lives,null);}
const multi=E.create();put(multi,240,850);multi.balls.push({x:240,y:400,vx:0,vy:0,r:E.R,lane:false,stuck:0});multi.saveUntil=0;E.tick(multi,1/120);assert.equal(multi.lives,3);assert.equal(multi.phase,'playing');assert.equal(multi.balls.length,1);
const resting=E.create(),striking=E.create();for(const g of [resting,striking])put(g,188,715,0,100);E.tick(resting,1/120);E.tick(striking,1/120,{left:true});assert.ok(striking.balls[0].vy<resting.balls[0].vy-100,'A rising flipper transfers upward momentum');assert.ok(striking.flippers[0].a<resting.flippers[0].a);assert.equal(striking.flippers[1].a,resting.flippers[1].a);
function touch(g,c){put(g,c.x,c.y+c.r+E.R-1,0,-10);E.tick(g,1/240);}
const mission=E.create();E.bumpers.forEach(c=>touch(mission,c));assert.equal(mission.stage,1);assert.equal(mission.completed,1);assert.equal(mission.score,1300);
touch(mission,E.targets[2]);assert.equal(mission.sequence,0);touch(mission,E.targets[0]);assert.equal(mission.sequence,1);touch(mission,E.targets[2]);assert.equal(mission.sequence,0,'Wrong order resets the sequence');
E.targets.forEach(c=>touch(mission,c));assert.equal(mission.stage,2);assert.equal(mission.completed,2);assert.equal(mission.balls.length,2,'Number mission rewards a second ball');put(mission,E.scoop.x,E.scoop.y);E.tick(mission,1/240);assert.ok(mission.balls[0].captureUntil);advance(mission,2.05);assert.equal(mission.phase,'won');assert.equal(mission.completed,3);assert.equal(mission.score,6000);const won=JSON.stringify(mission);advance(mission,2);assert.equal(mission.score,6000);
const repeat=E.create('practice');E.bumpers.forEach(c=>touch(repeat,c));E.targets.forEach(c=>touch(repeat,c));put(repeat,E.scoop.x,E.scoop.y);E.tick(repeat,1/240);advance(repeat,2.05);assert.equal(repeat.stage,0);assert.equal(repeat.completed,3);assert.equal(repeat.phase,'playing');assert.ok(repeat.lit.every(v=>!v));
for(let run=0;run<12;run++){const g=E.create('practice');E.launch(g,run/11);for(let i=0;i<3600;i++){if(g.phase==='ready')E.launch(g,.7);E.tick(g,1/120,{left:i%67<28,right:i%83<36});g.events=[];for(const b of g.balls){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));assert.ok(b.x>=0&&b.x<=480);assert.ok(Math.hypot(b.vx,b.vy)<1500);}}}
console.log('PASS: pinball launch, moving flippers, collision stability, rescue shield, three-ball ending, multiball, ordered missions, practice loop and pause behave correctly.');

for(const x of [235,241,247]){
 const drop=E.create();put(drop,x,680,0,180);advance(drop,1);assert.equal(drop.phase,'ready');assert.equal(drop.lives,2);
}
for(const x of [43,47,416,420]){
 const drop=E.create();put(drop,x,640,0,150);advance(drop,2);assert.equal(drop.phase,'ready','Both artwork outlanes must drain');assert.equal(drop.lives,2);
}
const warp=E.create();put(warp,E.scoop.x,E.scoop.y);E.tick(warp,1/240);assert.ok(warp.balls[0].captureUntil);advance(warp,1);assert.equal(warp.balls[0].x,E.scoop.x);warp.paused=true;const frozen=JSON.stringify(warp);advance(warp,3);assert.equal(JSON.stringify(warp),frozen);warp.paused=false;advance(warp,1.01);assert.equal(warp.balls[0].captureUntil,0);assert.equal(warp.score,300);assert.equal(warp.lives,3);
let exits=false,captures=0;for(let i=0;i<2400&&warp.phase==='playing';i++){E.tick(warp,1/120);exits||=warp.balls.some(b=>!b.lane&&!b.captureUntil&&b.x<330&&b.y>330);captures+=warp.events.filter(e=>e.kind==='scoop').length;warp.events=[];}assert.ok(exits,'Right return must exit into main play');assert.equal(captures,0,'Returned ball must not be captured again in a passive loop');assert.equal(warp.phase,'ready');
const orbit=E.create();put(orbit,E.ramp[0][0],E.ramp[0][1]+10,0,-400);E.tick(orbit,1/120);assert.ok(orbit.balls[0].rampUntil);
advance(orbit,1);assert.equal(orbit.score,0);orbit.paused=true;const frozenRamp=JSON.stringify(orbit);advance(orbit,3);assert.equal(JSON.stringify(orbit),frozenRamp);orbit.paused=false;advance(orbit,1.42);assert.equal(orbit.score,500);assert.equal(orbit.balls[0].rampUntil,0);assert.ok(Math.abs(orbit.balls[0].x-E.ramp.at(-1)[0])<12);
assert.ok(E.ramp.every(([x,y])=>x<200&&y>250),'Approved ramp remains a short left-side hairpin');
const down=E.create();put(down,E.ramp[0][0],E.ramp[0][1],0,200);E.tick(down,1/120);assert.ok(!down.balls[0].rampUntil);
assert.equal(E.bonusBumpers.length,4);for(const c of E.bonusBumpers){const g=E.create();put(g,c.x,c.y+c.r+E.R-1,0,-20);E.tick(g,1/240);assert.ok(g.score>=50,'Visible auxiliary bumpers must score');}
assert.doesNotMatch(fs.readFileSync('assets/pinball.css','utf8'),/transform\s*:\s*rotate\(/);
console.log('PASS: approved layout center/side drains, rescue return, short left hairpin, auxiliary bumpers and pause-safe layer separation.');
