const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={exports:{}};vm.runInNewContext(fs.readFileSync('assets/pinball-table.js','utf8')+'\n'+fs.readFileSync('assets/pinball-engine.js','utf8'),{module:box});const E=box.exports;
function advance(s,seconds,input={}){for(let i=0;i<Math.round(seconds*120);i++){E.tick(s,1/120,input);s.events=[];}}
function put(s,x,y,vx=0,vy=0){s.phase='playing';s.balls=[{x,y,vx,vy,r:E.R,lane:false,stuck:0}];s.time+=2;}
assert.throws(()=>E.create('bad'));let s=E.create();assert.equal(s.lives,3);assert.equal(s.phase,'ready');assert.equal(E.launch(s,.6),true);assert.equal(E.launch(s,1),false);
advance(s,1.6);assert.ok(s.balls.every(b=>!b.lane),'A launched ball reaches the playable field');
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
const warp=E.create();put(warp,E.scoop.x,E.scoop.y);E.tick(warp,1/240);assert.ok(warp.balls[0].captureUntil);advance(warp,.5);assert.equal(warp.balls[0].x,E.scoop.x);warp.paused=true;const frozen=JSON.stringify(warp);advance(warp,3);assert.equal(JSON.stringify(warp),frozen);warp.paused=false;advance(warp,.51);assert.equal(warp.balls[0].captureUntil,0);assert.equal(warp.score,300);assert.equal(warp.lives,3);
let exits=false,captures=0;for(let i=0;i<2400&&warp.phase==='playing';i++){E.tick(warp,1/120);exits||=warp.balls.some(b=>!b.lane&&!b.captureUntil&&b.x<330&&b.y>330);captures+=warp.events.filter(e=>e.kind==='scoop').length;warp.events=[];}assert.ok(exits,'Right return must exit into main play');assert.equal(captures,0,'Returned ball must not be captured again in a passive loop');assert.equal(warp.phase,'ready');
const orbit=E.create();put(orbit,E.ramp[0][0],E.ramp[0][1]+10,0,-400);E.tick(orbit,1/120);assert.ok(orbit.balls[0].rampUntil);
advance(orbit,1);assert.equal(orbit.score,0);orbit.paused=true;const frozenRamp=JSON.stringify(orbit);advance(orbit,3);assert.equal(JSON.stringify(orbit),frozenRamp);orbit.paused=false;advance(orbit,1.42);assert.equal(orbit.score,500);assert.equal(orbit.balls[0].rampUntil,0);assert.ok(Math.abs(orbit.balls[0].x-E.ramp.at(-1)[0])<12);
assert.ok(E.ramp.every(([x,y])=>x<200&&y>250),'Approved ramp remains a short left-side hairpin');
const down=E.create();put(down,E.ramp[0][0],E.ramp[0][1],0,200);E.tick(down,1/120);assert.ok(!down.balls[0].rampUntil);
assert.equal(E.bonusBumpers.length,4);for(const c of E.bonusBumpers){const g=E.create();put(g,c.x,c.y+c.r+E.R-1,0,-20);g.balls[0].deck=c!==E.bonusBumpers[0];E.tick(g,1/240);assert.ok(g.score>=50,'Visible auxiliary bumpers must score');}
assert.doesNotMatch(fs.readFileSync('assets/pinball.css','utf8'),/transform\s*:\s*rotate\(/);
console.log('PASS: approved layout center/side drains, rescue return, short left hairpin, auxiliary bumpers and pause-safe layer separation.');

for(const power of [0,.5,1]){
 const shot=E.create();assert.equal(shot.balls[0].x,E.launchPath[0][0]);assert.equal(shot.balls[0].y,E.launchPath[0][1]);E.launch(shot,power);
 let previous={...shot.balls[0]},exited=false,reachedTop=false;
 for(let i=0;i<500;i++){E.tick(shot,1/240);const b=shot.balls[0];reachedTop||=b.y<75;if(b.lane&&b.y>200)assert.ok(b.x>410,'Shooter stays on the yellow right outer lane before the crown');assert.ok(Math.hypot(b.x-previous.x,b.y-previous.y)<5,'Launch cannot teleport between lane and field');if(b.lane){const expected=E.launchPoint(b.launchDistance);assert.ok(Math.hypot(b.x-expected.x,b.y-expected.y)<.001);}else{assert.ok(b.vx<0&&b.vy>0,'Top exit points inward and downward');assert.ok(b.y<90,'Launch must not exit halfway up the right side');exited=true;break;}previous={...b};}
 assert.ok(exited);assert.ok(reachedTop,'Every power reaches the very top of the yellow outer rail');
}
console.log('PASS: all launch strengths follow the illustrated spring-to-gate centerline and enter play continuously.');

// Photo regression: ball trapped at the right sling's back and return guide.
for(const x of [342,350,360,370]){
 const trapped=E.create();put(trapped,x,608,0,100);let reachedFlippers=false;
 for(let i=0;i<1200;i++){E.tick(trapped,1/120);reachedFlippers||=trapped.balls.some(b=>!b.lane&&b.y>680);}
 assert.ok(reachedFlippers,'Right rear channel must carry the ball down to the flippers');
 assert.equal(trapped.score,0,'Passive rear contacts cannot farm sling points');
 assert.equal(trapped.phase,'ready','Unattended rear-channel ball must eventually drain');
}
const activeSling=E.create();put(activeSling,321,590,200,0);advance(activeSling,.08);assert.ok(activeSling.score>=25,'The front plate still detects and scores a real impact');
console.log('PASS: right sling photo positions escape without score farming; the passive front still detects hits.');

for(const c of E.targets){
 const rollover=E.create();put(rollover,c.x,c.y-18,0,180);
 for(let i=0;i<25;i++){E.tick(rollover,1/240);assert.ok(rollover.balls[0].vy>0,'Upper rollover lanes cannot bounce a falling ball upward');}
 assert.equal(rollover.score,150,'One passage scores once');assert.ok(rollover.balls[0].y>c.y);
}
const returnLane=E.create();put(returnLane,E.ramp[0][0],E.ramp[0][1]+10,0,-400);let caught=false,prematureDrain=false;
for(let i=0;i<1200&&returnLane.phase==='playing';i++){E.tick(returnLane,1/120);caught||=returnLane.events.some(e=>e.kind==='flipper');if(!caught&&returnLane.events.some(e=>e.kind==='drain'))prematureDrain=true;returnLane.events=[];}
assert.ok(caught,'Left ramp return must reach a flipper in the normal playfield');assert.equal(prematureDrain,false,'Ramp exit cannot feed directly into the left outlane');
console.log('PASS: top rollover lanes do not rebound, and the left ramp feeds a flipper before any drain.');

let previousBounce=0;
for(const speed of [60,250,700]){
 const impact=E.create();put(impact,29,580,-speed,0);E.tick(impact,1/240);const bounce=impact.balls[0].vx;
 assert.ok(bounce>0&&bounce<speed*.51,'A stationary wall cannot add energy');
 assert.ok(bounce>previousBounce,'Faster impacts produce larger natural rebounds');previousBounce=bounce;
}
const quiet=E.create();put(quiet,240,450,0,0);quiet.balls[0].stuck=10;E.tick(quiet,1/240);assert.ok(quiet.balls[0].vy>0);assert.ok(!quiet.events.some(e=>e.kind==='pulse'),'No artificial upward unsticking kick');
console.log('PASS: passive surfaces dissipate impact energy; rebound scales with incoming speed and no idle kick is injected.');

for(const y of [80,180,300,340,414,465,560]){
 for(const vx of [-900,0,400]){
 const edge=E.create('practice');put(edge,10,y,vx,180);
 for(let i=0;i<600;i++){E.tick(edge,1/120);for(const b of edge.balls){if(b.lane||b.rampUntil||b.captureUntil)continue;assert.ok(b.x>=E.leftLimit(b.y,b.r)-.001,'Post-collision position must stay inside the illustrated left boundary');assert.ok(b.x<=464-b.r+.001);}}
 }
}
console.log('PASS: left-edge impacts remain inside the cabinet after every physics step, including adjacent bumpers.');

for(const y of [300,340,365,450,500,600]){
 const right=E.create('practice');put(right,410,y,900,0);
 for(let i=0;i<360;i++){E.tick(right,1/120);for(const b of right.balls){if(b.lane||b.rampUntil||b.captureUntil)continue;assert.ok(b.x<=E.rightLimit(b.y,b.r)+.001,'Active play cannot enter the black margin or shooter lane');}}
}
const purpleSide=E.create();put(purpleSide,140,410,-400,0);purpleSide.balls[0].deck=true;advance(purpleSide,.12);assert.ok(purpleSide.balls[0].x>115,'Purple side wall blocks lateral entry');
const purpleGate=E.create();put(purpleGate,94,615,0,-240);advance(purpleGate,.12);assert.ok(purpleGate.balls[0].y<600,'Purple lower opening admits the ball');
const purpleOut=E.create();put(purpleOut,94,580,0,200);advance(purpleOut,.2);assert.ok(purpleOut.balls[0].y>610,'The same lower opening lets the ball return');
const markup=fs.readFileSync('pinball.html','utf8');assert.match(markup,/<\/canvas><\/div><div id="notice"/,'Messages must be outside the board container');
console.log('PASS: right margin stays closed, purple chamber uses the lower gate, and status is outside the playfield.');

const ids=new Set(E.table.components.map(c=>c.id));assert.equal(ids.size,E.table.components.length,'Every table component has an independent identity');
for(const collider of E.table.railColliders){assert.ok(E.table.components.includes(collider.component));assert.ok(collider.component.points.includes(collider.a));assert.ok(collider.component.points.includes(collider.b));assert.equal(collider.radius,collider.component.radius);}
for(const c of E.table.components.filter(c=>c.type==='bumper'))assert.ok([...E.bumpers,...E.bonusBumpers].includes(c.shape),'Rendered circles and physics share the same shape object');
assert.equal(E.table.components.find(c=>c.id==='left-ramp').points,E.ramp);
assert.equal(E.table.components.find(c=>c.id==='shooter').points,E.launchPath);
assert.equal(E.table.components.filter(c=>c.type==='drain').length,3);
const uiSource=fs.readFileSync('assets/pinball-ui.js','utf8');assert.doesNotMatch(uiSource,/pinball-approved-field|const mask=/,'No whole-board component image or copied bridge mask remains');
assert.match(uiSource,/E\.table\.components/,'Renderer reads the component registry');
assert.ok(fs.readFileSync('pinball.html','utf8').indexOf('pinball-table.js')<fs.readFileSync('pinball.html','utf8').indexOf('pinball-engine.js'));
console.log('PASS: rendered components, collider edges, circles, paths, drains and flippers share the table definitions.');
const portal=E.create();put(portal,E.scoop.x,E.scoop.y);E.tick(portal,1/240);const releaseAt=portal.balls[0].captureUntil;assert.ok(Math.abs(releaseAt-portal.time-1)<1/240+.00001);while(portal.time+1/240<releaseAt)E.tick(portal,1/240);assert.ok(portal.balls[0].captureUntil);while(portal.balls[0].captureUntil)E.tick(portal,1/240);assert.equal(portal.balls[0].x,E.wormhole.x);assert.equal(portal.balls[0].y,E.wormhole.y);assert.ok(portal.balls[0].vy>0);assert.ok(E.wormhole.x<150&&E.wormhole.y<120);
for(const bumper of E.bonusBumpers.slice(1)){const chamberScore=E.create();put(chamberScore,bumper.x,bumper.y-bumper.r-E.R+1,0,120);chamberScore.balls[0].deck=true;E.tick(chamberScore,1/240);assert.equal(chamberScore.score,50,'Each of the three chamber bumpers scores');}
const chamberRun=E.create();put(chamberRun,E.ramp[0][0],E.ramp[0][1]+10,0,-400);let chamberEntered=false,chamberExited=false;for(let i=0;i<1800&&chamberRun.phase==='playing';i++){E.tick(chamberRun,1/120);const b=chamberRun.balls[0];if(!b.lane&&!b.rampUntil&&b.y>370&&b.y<500&&b.x<110)chamberEntered=true;if(chamberEntered&&b.y>600&&b.x>80)chamberExited=true;}assert.ok(chamberEntered);assert.ok(chamberExited,'Chamber feed eventually leaves the lower gate into normal play');assert.ok(E.launchPath.at(-1)[0]>=300,'Yellow track stops at the marked top-right gate');
console.log('PASS: one-second upper-left wormhole, three scoring chamber bumpers and lower chamber exit.');
// Red-line regression: ground balls slide along the new upper-left guide, never into the old pocket.
for(const y of [155,200,260,310,345])for(const vx of [-700,0,250]){
 const slide=E.create('practice');put(slide,E.leftLimit(y)+1,y,vx,80);let cleared=false;
 for(let i=0;i<960;i++){E.tick(slide,1/120);for(const b of slide.balls){if(b.lane||b.rampUntil||b.captureUntil)continue;if(b.y>=150&&b.y<=350)assert.ok(b.x>=E.leftLimit(b.y,b.r)-.001);if(b.y>370)cleared=true;}}
 assert.ok(cleared,'Red-line guide must carry the ball out of the upper-left pocket');
}
console.log('PASS: red-line left guide clears all sampled heights and impact speeds.');
const elevated=E.create('practice');put(elevated,E.ramp[0][0],E.ramp[0][1]+10,0,-400);let onDeck=false,dropping=false,returned=false,scored=false;for(let i=0;i<1800&&!returned;i++){E.tick(elevated,1/120);const b=elevated.balls[0];onDeck||=!!b.deck;scored||=onDeck&&elevated.score>500;dropping||=!!b.dropUntil;returned=onDeck&&!b.deck&&!b.rampUntil; }assert.ok(onDeck&&dropping&&returned&&scored,'Ramp feeds scoring upper deck, then the lower hole returns the ball');
const lower=E.create('practice'),upperBumper=E.bonusBumpers[1];put(lower,upperBumper.x,upperBumper.y,0,100);E.tick(lower,1/240);assert.equal(lower.score,0,'Ground ball cannot hit an upper-deck bumper');assert.ok(!lower.balls[0].deck);
const dropPause=E.create('practice');put(dropPause,95,593,0,100);dropPause.balls[0].deck=true;E.tick(dropPause,1/240);assert.ok(dropPause.balls[0].dropUntil);dropPause.paused=true;const pausedDrop=JSON.stringify(dropPause);advance(dropPause,1);assert.equal(JSON.stringify(dropPause),pausedDrop);dropPause.paused=false;advance(dropPause,.3);assert.ok(!dropPause.balls[0].deck);
console.log('PASS: elevated deck collision separation, scoring, hole transition and pause-safe falling.');
