const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),moduleBox={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/kart-engine.js','utf8'),{module:moduleBox});const E=moduleBox.exports;
assert.ok(E.TRACK.length>700&&E.TRACK.length<1500);let lo=Infinity,hi=-Infinity;for(let i=0;i<1000;i++){const p=E.sample(i/1000*E.TRACK.length);assert.ok(Object.values(p).every(Number.isFinite));lo=Math.min(lo,p.y);hi=Math.max(hi,p.y);assert.ok(Number.isFinite(E.curvature(i)));}assert.ok(hi-lo>8);assert.deepEqual(E.sample(0),E.sample(E.TRACK.length));
let s=E.create('trial');for(let i=0;i<180;i++)E.step(s,{throttle:1},1/60);assert.equal(s.phase,'racing');assert.equal(s.time,0);assert.equal(s.cars[0].v,0);
for(let i=0;i<60;i++)E.step(s,{throttle:1},1/60);assert.ok(s.cars[0].v>7);const speed=s.cars[0].v;for(let i=0;i<20;i++)E.step(s,{brake:true},1/60);assert.ok(s.cars[0].v<speed);const frozen=JSON.stringify(s);E.pause(s);const paused=JSON.stringify(s);E.step(s,{throttle:1},.05);assert.equal(JSON.stringify(s),paused);E.resume(s);assert.equal(s.phase,'racing');assert.notEqual(frozen,paused);
s=E.create();s.phase='racing';s.cars[0].v=20;E.step(s,{boost:true,throttle:1},.05);assert.equal(s.cars[0].charges,0);assert.ok(s.cars[0].boost>2);E.step(s,{boost:true},.05);assert.equal(s.cars[0].charges,0);
s=E.create();s.phase='racing';const p=s.cars[0];p.v=23;for(let i=0;i<45;i++){p.n=0;p.h=0;E.step(s,{throttle:1,steer:.3,drift:true},1/60);}assert.ok(p.drift>=.65);E.step(s,{throttle:1},1/60);assert.ok(p.boost>1);assert.ok(s.events.some(e=>e.kind==='miniBoost'));
s=E.create();s.phase='racing';s.cars[0].v=25;s.cars[0].n=9.14;s.cars[0].h=1;E.step(s,{steer:1},.05);assert.ok(s.cars[0].n<=9.15);assert.ok(s.cars[0].v<20);const hit=s.cars[0].hit;E.step(s,{},.05);assert.ok(s.cars[0].hit<hit);
s=E.create();s.phase='racing';const pickup=E.PICKUPS[0];s.cars[0].d=pickup.d-.3;s.cars[0].n=pickup.n;s.cars[0].v=20;E.step(s,{throttle:1},.05);assert.equal(s.cars[0].charges,2);assert.equal(s.score,100);E.step(s,{},.05);assert.equal(s.score,100);
s=E.create();s.phase='racing';const obstacle=E.OBSTACLES[0];s.cars[0].d=obstacle.d-.3;s.cars[0].n=obstacle.n;s.cars[0].v=20;E.step(s,{},.05);assert.ok(s.events.some(e=>e.kind==='hit'));assert.ok(s.cars[0].v<12);
for(const mode of ['trial','race']){s=E.create(mode);let frames=0;while(s.phase!=='finished'&&frames++<24000){E.step(s,E.ai(s.cars[0]),1/60);for(const c of s.cars){for(const k of ['d','n','v','h','lateral'])assert.ok(Number.isFinite(c[k]));assert.ok(Math.abs(c.n)<=9.15001);}}assert.equal(s.phase,'finished');assert.equal(s.cars[0].laps.length,mode==='trial'?1:3);assert.ok(s.cars[0].laps.every(t=>t>15&&t<180));assert.ok(Math.abs(s.cars[0].laps.reduce((a,b)=>a+b,0)-s.time)<1e-7);const score=s.score,time=s.time;E.step(s,{throttle:1},.05);assert.equal(s.score,score);assert.equal(s.time,time);assert.equal(s.cars[0].checkpoint,mode==='trial'?9:25);}
// Stopped beside the start never earns laps; pausing countdown consumes no race time.
s=E.create();E.pause(s);for(let i=0;i<100;i++)E.step(s,{throttle:1},.05);assert.equal(s.countdown,3);E.resume(s);for(let i=0;i<400;i++)E.step(s,{},.05);assert.equal(s.cars[0].lap,0);assert.equal(s.score,0);
for(const file of ['assets/kart-render.js','assets/kart-audio.js','assets/kart-ui.js'])new vm.Script(fs.readFileSync(file,'utf8'));
console.log('PASS: closed elevated course, countdown gating, steering/acceleration/braking, drift boost, pickup and collision cooldowns, full trial/race simulations, ordered checkpoints and immutable finish.');

function boot({failGL=false,failStorage=false,trackId='coast'}={}){const game=E.forTrack(trackId);const nodes=new Map(),events={},docEvents={},frames=new Map(),sounds=[],inputs=[],states=[],store=new Map();let now=0,id=0,doc;
 function node(){return {hidden:false,disabled:false,checked:true,value:'trial',textContent:'',style:{},open:false,children:[],classList:{add(){},remove(){},toggle(){}},addEventListener(k,f){this['on-'+k]=f},setPointerCapture(){},focus(){doc.activeElement=this},showModal(){this.open=true},close(){this.open=false},replaceChildren(){this.children=[]},appendChild(n){this.children.push(n)}};}
 const get=k=>{if(!nodes.has(k))nodes.set(k,node());return nodes.get(k)};doc={body:node(),getElementById:get,createElement:node,addEventListener(k,f){docEvents[k]=f}};
 const root={Kart:{...game,create(mode){const s=game.create(mode);states.push(s);return s},step(s,i,dt){inputs.push(i);return game.step(s,i,dt)}},KartRenderer:{create(){if(failGL)throw Error('test unsupported');return {draw(){},resize(){}}}},KartAudio:{create(){return {start(){sounds.push('start')},stop(){sounds.push('stop')},play(k){sounds.push(k)},update(){},dispose(){sounds.push('dispose')},setEnabled(){}}}},matchMedia(){return {matches:true}},addEventListener(k,f){events[k]=f}};
 vm.runInNewContext(fs.readFileSync('assets/kart-ui.js','utf8'),{window:root,document:doc,navigator:{maxTouchPoints:2},performance:{now:()=>now},localStorage:{getItem:k=>store.get(k),setItem(k,v){if(failStorage)throw Error('full');store.set(k,v)}},console:{error(){}},requestAnimationFrame(f){frames.set(++id,f);return id},cancelAnimationFrame(k){frames.delete(k)}});
 return {get,events,docEvents,doc,frames,states,sounds,inputs,store,run(ms){const end=now+ms;while(now<end){now=Math.min(end,now+17);const calls=[...frames.values()];frames.clear();calls.forEach(f=>f(now));}}};}
const ui=boot();assert.equal(ui.sounds.length,0);assert.equal(ui.get('kartStart').disabled,false);ui.get('kartStart').onclick();ui.run(3200);assert.equal(ui.states.at(-1).phase,'racing');assert.ok(ui.states.at(-1).time<.3);ui.get('kartPause').onclick();const time=ui.states.at(-1).time;ui.run(3000);assert.equal(ui.states.at(-1).time,time);assert.equal(ui.frames.size,0);ui.get('kartResume').onclick();
function finger(id){return {pointerId:id,preventDefault(){}};}ui.get('kartLeft')['on-pointerdown'](finger(1));ui.get('kartDrift')['on-pointerdown'](finger(2));ui.run(34);assert.equal(ui.inputs.at(-1).steer,-1);assert.equal(ui.inputs.at(-1).drift,true);ui.get('kartLeft')['on-pointercancel'](finger(1));ui.run(34);assert.equal(ui.inputs.at(-1).steer,0);assert.equal(ui.inputs.at(-1).drift,true);ui.doc.hidden=true;ui.docEvents.visibilitychange();assert.equal(ui.states.at(-1).phase,'paused');ui.get('kartResume').onclick();ui.run(34);assert.equal(ui.inputs.at(-1).drift,false);
const st=ui.states.at(-1);st.cars[0].d=E.TRACK.length-.1;st.cars[0].checkpoint=8;st.cars[0].v=20;st.time=50;ui.run(34);assert.equal(ui.get('kartResult').hidden,false);assert.equal(ui.get('kartLapList').children.length,1);assert.ok(ui.store.has('coast-kart-best-v1'));ui.get('kartRestart').onclick();assert.equal(ui.states.at(-1).time,0);assert.equal(ui.states.at(-1).cars[0].charges,1);ui.get('kartWorld')['on-webglcontextlost']({preventDefault(){}});assert.equal(ui.get('kartResume').disabled,true);ui.get('kartWorld')['on-webglcontextrestored']();assert.equal(ui.get('kartResume').disabled,false);ui.get('kartResume').onclick();ui.events.pagehide();assert.equal(ui.frames.size,0);assert.equal(ui.sounds.at(-1),'dispose');
const fail=boot({failGL:true});assert.equal(fail.get('kartStart').disabled,true);
assert.match(fail.get('kartStatus').textContent,/無法啟動/);fail.get('kartStart').onclick();assert.equal(fail.frames.size,0);
console.log('PASS: real UI startup, fixed countdown, independent touch controls, pause/visibility/context restore, score/lap display, restart and unavailable WebGL fallback.');
async function audioTest(){let created=0;const oscillators=[];class Context{constructor(){created++;this.state='suspended';this.currentTime=0;this.destination={};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}createOscillator(){const o={frequency:{value:0,setTargetAtTime(){}},connect(){},disconnect(){},start(){},stop(){o.stopped=true}};oscillators.push(o);return o;}createGain(){return {gain:{value:0,setTargetAtTime(){},setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}}
const root={AudioContext:Context,navigator:{audioSession:{}},setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync('assets/kart-audio.js','utf8'),{window:root});const sound=root.KartAudio.create();assert.equal(created,0);await sound.start();assert.equal(root.navigator.audioSession.type,'playback');await sound.start();assert.equal(oscillators.length,2);sound.update({v:20,drifting:true,h:.4,boost:0},true);for(let i=0;i<100;i++)sound.play('boost');assert.ok(oscillators.length<=24);sound.stop();assert.ok(oscillators.every(o=>o.stopped));sound.setEnabled(false);const count=oscillators.length;await sound.start();sound.play('go');assert.equal(oscillators.length,count);sound.setEnabled(true);const pending=sound.start();sound.stop();await pending;assert.equal(oscillators.length,count,'Late audio resume cannot create orphan engine voices');sound.dispose();
const warnings=[],unsupported={setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync('assets/kart-audio.js','utf8'),{window:unsupported});await unsupported.KartAudio.create(t=>warnings.push(t)).start();assert.equal(warnings.length,1);console.log('PASS: gesture-only audio, iPad playback policy, bounded effects, single engine/skid voices, mute/disposal, late-resume cancellation and unavailable audio fallback.');}
audioTest().catch(error=>{console.error(error);process.exitCode=1;});
// Actual renderer image-selection policy, asset packaging and PNG validation.
const rendererRoot={};vm.runInNewContext(fs.readFileSync('assets/kart-render.js','utf8'),{window:rendererRoot});
const view=rendererRoot.KartRenderer.spriteView;
assert.equal(view(-.3),'left');assert.equal(view(.3),'right');assert.equal(view(0,'left'),'rear');assert.equal(view(.14,'right'),'right');assert.equal(view(NaN),'rear');
const publicFiles=require('./build.cjs').files;
for(const name of ['rock','carbon','sky','player-rear','player-left','player-right']){
 const file='assets/kart-'+name+'.png',data=fs.readFileSync(file);assert.ok(publicFiles.includes(file));assert.equal(data.subarray(1,4).toString(),'PNG');assert.ok(data.readUInt32BE(16)>256);if(name.startsWith('player'))assert.equal(data[25],6,'Vehicle sprites must preserve RGBA transparency');
}
console.log('PASS: vehicle sprite direction/hysteresis and six packaged image assets with RGBA player sprites.');
const {createPose,advancePose}=rendererRoot.KartRenderer;
const pose=createPose();advancePose(pose,.6,1/60);assert.ok(pose.heading>0&&pose.heading<.6);
for(let i=0;i<30;i++){advancePose(pose,.6,1/60);assert.ok(Math.abs(Object.values(pose.weights).reduce((a,b)=>a+b,0)-1)<1e-9);}
assert.ok(pose.weights.right>.99);const beforeLean=pose.lean;advancePose(pose,-.6,1/60);assert.ok(Math.abs(pose.lean-beforeLean)<.02,'Reversal must ease without a sudden body snap');
for(let i=0;i<90;i++)advancePose(pose,0,1/60);assert.ok(pose.weights.rear>.999);assert.ok(Math.abs(pose.lean)<.0001);
const low=createPose(),high=createPose();for(let i=0;i<30;i++)advancePose(low,.5,1/30);for(let i=0;i<120;i++)advancePose(high,.5,1/120);assert.ok(Math.abs(low.heading-high.heading)<1e-8);assert.ok(Math.abs(low.weights.right-high.weights.right)<.001);
const calm=createPose();advancePose(calm,.6,1/60,true);assert.equal(calm.lean,0);assert.equal(calm.weights.right,1);
const missing=createPose();for(let i=0;i<60;i++)advancePose(missing,.6,1/60,false,{rear:true});assert.equal(missing.weights.rear,1);
console.log('PASS: eased turning/recentering/reversal, normalized image blend, frame-rate consistency, missing-pose fallback and reduced motion.');
const trail=rendererRoot.KartRenderer.createTrail(),advanceTrail=rendererRoot.KartRenderer.advanceTrail;
assert.equal(advanceTrail(trail,{d:0,n:0,v:20,drifting:true},true).length,0);
assert.equal(advanceTrail(trail,{d:1,n:0,v:20,drifting:true},true).length,2);
assert.equal(trail.count,2);
advanceTrail(trail,{d:2,n:0,v:20,drifting:false},true);
assert.equal(advanceTrail(trail,{d:3,n:0,v:20,drifting:true},true).length,0,'No trail across gaps');
for(let d=4;d<2000;d++)advanceTrail(trail,{d,n:0,v:20,h:.2,drifting:true},true);
assert.equal(trail.count,512);assert.ok(trail.cursor<512);
assert.equal(advanceTrail(trail,{d:9000,n:0,v:20,drifting:true},true).length,0,'No teleport streak');
advanceTrail(trail,{d:9001,n:0,v:20,drifting:true},false);assert.equal(trail.last,null);
console.log('PASS: bounded paired tyre marks, drift/phase gates, no bridging gaps or teleports.');
async function noiseTest(){
 const sources=[],gains=[],filters=[];
 const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});
 class NoiseContext{
 constructor(){this.state='suspended';this.sampleRate=8000;this.currentTime=0;this.destination={};}
 resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){return Promise.resolve();}
 createBuffer(){return {getChannelData(){return new Float32Array(8000);}};}
 createBufferSource(){const n={connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};sources.push(n);return n;}
 createBiquadFilter(){const n={frequency:param(),Q:param(),connect(){},disconnect(){this.disconnected=true;}};filters.push(n);return n;}
 createGain(){const n={gain:param(),connect(){},disconnect(){}};gains.push(n);return n;}
 createOscillator(){return {frequency:param(),connect(){},disconnect(){},start(){},stop(){}};}
 }
 const target={AudioContext:NoiseContext,setTimeout,clearTimeout};
 vm.runInNewContext(fs.readFileSync('assets/kart-audio.js','utf8'),{window:target});
 const a=target.KartAudio.create();await a.start();await a.start();assert.equal(sources.length,2);
 a.update({v:25,h:.3,drifting:true,boost:1},true);assert.ok(gains[1].gain.value>0);assert.ok(gains[2].gain.value>0);
 a.update({v:25,h:0,drifting:false,boost:0},true);assert.equal(gains[1].gain.value,0);assert.equal(gains[2].gain.value,0);
 a.update({v:25,h:.3,drifting:true,boost:1},false);assert.ok(gains.every(g=>g.gain.value===0));
 a.stop();assert.ok(sources.every(s=>s.stopped));assert.ok(filters.every(f=>f.disconnected));a.dispose();
 console.log('PASS: filtered skid/jet noise, no duplicate loops, phase gating and audio resource cleanup.');
}
noiseTest().catch(e=>{console.error(e);process.exitCode=1;});
const lengths=new Set();
for(const spec of E.MAPS){
 const track=E.forTrack(spec.id);lengths.add(Math.round(track.TRACK.length));assert.equal(track.map.id,spec.id);
 const a=track.sample(0),b=track.sample(track.TRACK.length);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-6);
 for(let d=0;d<track.TRACK.length;d+=2){const q=track.sample(d);assert.ok(Number.isFinite(q.y));assert.ok(Math.abs(track.curvature(d))<.09,'Road offset must not fold');}
 for(const mode of ['trial','race']){const race=track.create(mode);for(let i=0;i<24000&&race.phase!=='finished';i++)track.step(race,track.ai(race.cars[0]),1/60);assert.equal(race.phase,'finished',spec.id+' '+mode+' must complete');assert.equal(race.cars[0].laps.length,mode==='race'?3:1);}
}
assert.equal(lengths.size,4);assert.equal(E.forTrack('invalid').map.id,'coast');assert.equal(E.map.id,'coast','Independent track instances do not mutate default');
console.log('PASS: four distinct closed tracks, safe curvature, full trial/race simulations and isolated track instances.');
for(const spec of E.MAPS){const app=boot({trackId:spec.id});app.get('kartStart').onclick();app.run(3200);const race=app.states.at(-1);race.cars[0].d=E.forTrack(spec.id).TRACK.length-.1;race.cars[0].checkpoint=8;race.cars[0].v=20;race.time=50;app.run(34);const key=spec.id==='coast'?'coast-kart-best-v1':'coast-kart-best-v1-'+spec.id;assert.ok(app.store.has(key));assert.equal(app.store.size,1);assert.equal(app.get('kartMapName').textContent,spec.label);}
console.log('PASS: each map saves only its own record and displays the matching map label.');
assert.equal(new Set(E.MAPS.map(m=>E.forTrack(m.id).map.theme.sky)).size,4);
for(const m of E.MAPS){const theme=E.forTrack(m.id).map.theme,file='assets/'+theme.sky;assert.ok(require('./build.cjs').files.includes(file));assert.ok(fs.statSync(file).size>10000);assert.ok(theme.intensity>0);}
console.log('PASS: each circuit has its own packaged panoramic environment and lighting theme.');
