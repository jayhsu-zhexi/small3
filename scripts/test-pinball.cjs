const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={exports:{}};vm.runInNewContext(fs.readFileSync('assets/pinball-engine.js','utf8'),{module:box});const E=box.exports;
function advance(s,seconds,input={}){for(let i=0;i<Math.round(seconds*120);i++){E.tick(s,1/120,input);s.events=[];}}
function put(s,x,y,vx=0,vy=0){s.phase='playing';s.balls=[{x,y,vx,vy,r:10,lane:false,stuck:0}];s.time+=2;}
assert.throws(()=>E.create('bad'));let s=E.create();assert.equal(s.lives,3);assert.equal(s.phase,'ready');assert.equal(E.launch(s,.6),true);assert.equal(E.launch(s,1),false);
advance(s,.9);assert.ok(s.balls.every(b=>!b.lane),'A launched ball reaches the playable field');
const snapshot=JSON.stringify(s);s.paused=true;const paused=JSON.stringify(s);E.tick(s,1/30,{left:true});assert.equal(JSON.stringify(s),paused);assert.notEqual(snapshot,paused);assert.equal(E.launch(s),false);s.paused=false;
put(s,240,850);s.saveUntil=s.time+3;E.tick(s,1/120);assert.equal(s.phase,'ready');assert.equal(s.lives,3);assert.equal(s.events.at(-1).kind,'saved');
for(let lives=2;lives>=0;lives--){put(s,240,850);s.saveUntil=0;E.tick(s,1/120);assert.equal(s.lives,lives);assert.equal(s.phase,lives?'ready':'lost');}
const ended=JSON.stringify(s);E.tick(s,1/30);assert.equal(JSON.stringify(s),ended);assert.equal(E.launch(s),false);
const practice=E.create('practice');for(let i=0;i<12;i++){put(practice,240,850);practice.saveUntil=0;E.tick(practice,1/120);assert.equal(practice.phase,'ready');assert.equal(practice.lives,null);}
const multi=E.create();put(multi,240,850);multi.balls.push({x:240,y:400,vx:0,vy:0,r:10,lane:false,stuck:0});multi.saveUntil=0;E.tick(multi,1/120);assert.equal(multi.lives,3);assert.equal(multi.phase,'playing');assert.equal(multi.balls.length,1);
const resting=E.create(),striking=E.create();for(const g of [resting,striking])put(g,200,742,0,100);E.tick(resting,1/120);E.tick(striking,1/120,{left:true});assert.ok(striking.balls[0].vy<resting.balls[0].vy-100,'A rising flipper transfers upward momentum');assert.ok(striking.flippers[0].a<resting.flippers[0].a);assert.equal(striking.flippers[1].a,resting.flippers[1].a);
function touch(g,c){put(g,c.x,c.y+c.r+9,0,-10);E.tick(g,1/240);}
const mission=E.create();E.bumpers.forEach(c=>touch(mission,c));assert.equal(mission.stage,1);assert.equal(mission.completed,1);assert.equal(mission.score,1300);
touch(mission,E.targets[2]);assert.equal(mission.sequence,0);touch(mission,E.targets[0]);assert.equal(mission.sequence,1);touch(mission,E.targets[2]);assert.equal(mission.sequence,0,'Wrong order resets the sequence');
E.targets.forEach(c=>touch(mission,c));assert.equal(mission.stage,2);assert.equal(mission.completed,2);assert.equal(mission.balls.length,2,'Number mission rewards a second ball');put(mission,E.scoop.x,E.scoop.y);E.tick(mission,1/240);assert.ok(mission.balls[0].captureUntil);advance(mission,2.05);assert.equal(mission.phase,'won');assert.equal(mission.completed,3);assert.equal(mission.score,6000);const won=JSON.stringify(mission);advance(mission,2);assert.equal(mission.score,6000);
const repeat=E.create('practice');E.bumpers.forEach(c=>touch(repeat,c));E.targets.forEach(c=>touch(repeat,c));put(repeat,E.scoop.x,E.scoop.y);E.tick(repeat,1/240);advance(repeat,2.05);assert.equal(repeat.stage,0);assert.equal(repeat.completed,3);assert.equal(repeat.phase,'playing');assert.ok(repeat.lit.every(v=>!v));
for(let run=0;run<12;run++){const g=E.create('practice');E.launch(g,run/11);for(let i=0;i<3600;i++){if(g.phase==='ready')E.launch(g,.7);E.tick(g,1/120,{left:i%67<28,right:i%83<36});g.events=[];for(const b of g.balls){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));assert.ok(b.x>=0&&b.x<=480);assert.ok(Math.hypot(b.vx,b.vy)<1500);}}}
console.log('PASS: pinball launch, moving flippers, collision stability, rescue shield, three-ball ending, multiball, ordered missions, practice loop and pause behave correctly.');
for(const x of [62,377]){const channel=E.create('practice');put(channel,x,x===62?475:350,0,-650);let touched=false,returned=false;for(let i=0;i<300;i++){E.tick(channel,1/120);touched||=channel.events.some(e=>e.kind==='rail');returned||=channel.balls.some(b=>!b.lane&&b.y>(x===62?510:390)&&b.vy>0);channel.events=[];}assert.ok(touched,'Ball must collide with the visible curved rail');assert.ok(returned,'Return channel must have an open playable exit');}
assert.equal(E.sideLanes.length,2);assert.equal(E.guides.length,6);assert.ok(E.sideWalls.every(([a,b])=>[...a,...b].every(Number.isFinite)));
assert.doesNotMatch(fs.readFileSync('assets/pinball.css','utf8'),/transform\s*:\s*rotate\(/,'The table must stay upright on home and gameplay screens');

for(const x of [235,240,245]){
  const drain=E.create();put(drain,x,700,0,180);drain.saveUntil=0;
  advance(drain,1);
  assert.equal(drain.phase,'ready','A ball above the resting flippers must fall through the center opening');
  assert.equal(drain.lives,2,'A real center drain consumes one ball');
}
const protectedDrop=E.create();put(protectedDrop,240,700,0,180);protectedDrop.saveUntil=protectedDrop.time+8;advance(protectedDrop,1);assert.equal(protectedDrop.phase,'ready');assert.equal(protectedDrop.lives,3);
console.log('PASS: physical center drains above the flippers consume a life after protection and are saved during protection.');

for(const vx of [-250,-200]){
 const entry=E.create('practice');put(entry,200,690,vx,-850);let entered=false,returned=false;
 for(let i=0;i<480;i++){E.tick(entry,1/120);for(const b of entry.balls){if(!b.lane&&b.x>45&&b.x<110&&b.y<400)entered=true;if(entered&&!b.lane&&b.y>540&&b.vy>0)returned=true;}entry.events=[];}
 assert.ok(entered,'Shots from the lower playfield must enter the left return channel');
 assert.ok(returned,'The left channel must return an entering shot to play');
}
console.log('PASS: left return channel accepts shots from the lower playfield and returns them.');

const warp=E.create();put(warp,E.scoop.x,E.scoop.y);E.tick(warp,1/240);assert.ok(warp.balls[0].captureUntil);advance(warp,1);assert.equal(warp.balls[0].x,E.scoop.x);warp.paused=true;const frozen=JSON.stringify(warp);advance(warp,3);assert.equal(JSON.stringify(warp),frozen);warp.paused=false;advance(warp,1.01);assert.equal(warp.balls[0].captureUntil,0);assert.ok(Math.abs(warp.balls[0].x-E.wormhole.x)<10);assert.ok(warp.balls[0].vy<0);assert.equal(warp.score,300);assert.equal(warp.lives,3);
console.log('PASS: scoop holds the ball for two active seconds, pauses safely and ejects from the separate wormhole once.');

let rightRailHit=false,rightRailExit=false;
for(let i=0;i<360;i++){E.tick(warp,1/120);rightRailHit||=warp.events.some(e=>e.kind==='rail');rightRailExit||=warp.balls.some(b=>!b.lane&&!b.captureUntil&&b.y>390&&b.vy>0);warp.events=[];}
assert.ok(rightRailHit);assert.ok(rightRailExit,'A captured ball launches up the right rail and returns to play');
