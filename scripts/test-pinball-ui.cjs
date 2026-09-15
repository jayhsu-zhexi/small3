const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function boot(){
 const box={exports:{}};vm.runInNewContext(fs.readFileSync('assets/pinball-engine.js','utf8'),{module:box});let state,now=0,serial=0;const nodes=new Map(),frames=new Map(),timers=new Map(),windowEvents={},docEvents={},audioCalls=[];
 const ctx=new Proxy({},{get:(object,key)=>object[key]||(()=>{}),set:(object,key,value)=>(object[key]=value,true)});
 function node(id){if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:false,disabled:false,open:false,dataset:{},attrs:{},events:{},style:{setProperty(k,v){this[k]=v}},offsetHeight:40,clientHeight:700,clientWidth:370,width:480,height:860,getContext:()=>ctx,getBoundingClientRect:()=>({width:330,height:591}),setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},addEventListener(k,f){this.events[k]=f},setPointerCapture(){},focus(){},showModal(){this.open=true},close(){this.open=false},click(){if(!this.disabled)this.onclick?.();}});return nodes.get(id);}
 class Image{set src(value){this.onload?.();}}
 const audio={};for(const method of ['setEnabled','setMusic','play','suspend','startMusic','stopMusic','dispose'])audio[method]=(...args)=>audioCalls.push([method,...args]);
 const document={getElementById:node,querySelector:node,hidden:false,addEventListener(k,f){docEvents[k]=f}};
 vm.runInNewContext(fs.readFileSync('assets/pinball-ui.js','utf8'),{window:{OrbitPinball:{...box.exports,create(...args){state=box.exports.create(...args);return state;}},OrbitAudio:{create:()=>audio},innerWidth:390,innerHeight:844,devicePixelRatio:1,visualViewport:{height:844,addEventListener(){}},matchMedia:()=>({matches:true}),addEventListener(k,f){windowEvents[k]=f}},document,Image,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>now},requestAnimationFrame(f){const id=++serial;frames.set(id,f);return id;},cancelAnimationFrame:id=>frames.delete(id),setTimeout(f,delay){const id=++serial;timers.set(id,f);return id;},clearTimeout:id=>timers.delete(id)});
 await new Promise(setImmediate);
 const fire=(id,type,pointerId=1)=>node(id).events[type]({pointerId,preventDefault(){}});
 return {node,fire,frames,audioCalls,windowEvents,docEvents,document,get state(){return state;},step(ms=17){now+=ms;for(const [id,f] of [...frames]){frames.delete(id);f(now);}}};
}
(async()=>{
 const app=await boot();assert.equal(app.node('start').disabled,false);assert.equal(app.frames.size,0,'Home does not animate physics');assert.equal(app.audioCalls.some(([kind])=>kind==='startMusic'),false);
 app.node('start').click();assert.equal(app.state.phase,'ready');assert.equal(app.node('home').hidden,true);
 app.fire('left','pointerdown',1);app.fire('right','pointerdown',2);app.step();assert.ok(app.state.flippers[0].a<.36);assert.ok(app.state.flippers[1].a>Math.PI-.36);
 app.fire('left','pointerup',1);assert.equal(app.node('left').attrs['aria-pressed'],'false');assert.equal(app.node('right').attrs['aria-pressed'],'true','Independent multitouch release keeps the other flipper held');app.fire('right','pointercancel',2);assert.equal(app.node('right').attrs['aria-pressed'],'false');
 app.fire('launch','pointerdown',3);app.step(500);app.fire('launch','pointercancel',3);assert.equal(app.state.phase,'ready','Canceled touches never fire a ball');
 app.fire('launch','pointerdown',4);app.step(600);app.fire('launch','pointerup',4);assert.equal(app.state.phase,'playing');app.step();assert.equal(app.node('launch').disabled,true);
 app.node('pause').click();assert.equal(app.state.paused,true);assert.equal(app.frames.size,0);assert.equal(app.node('dialog').open,true);const y=app.state.balls[0].y;app.step(3000);assert.equal(app.state.balls[0].y,y);
 app.node('resume').click();assert.equal(app.state.paused,false);app.windowEvents.keydown({code:'ArrowLeft',preventDefault(){}});app.step();app.document.hidden=true;app.docEvents.visibilitychange();assert.equal(app.state.paused,true);assert.equal(app.node('left').attrs['aria-pressed'],'false');
 app.document.hidden=false;app.node('resume').click();app.node('pause').click();app.node('restart').click();assert.equal(app.state.phase,'ready');assert.equal(app.state.score,0);assert.equal(app.state.lives,3);
 app.windowEvents.keydown({code:'Space',preventDefault(){}});app.step(700);app.windowEvents.keyup({code:'Space',preventDefault(){}});assert.equal(app.state.phase,'playing','Keyboard charges and launches the ball');
 app.state.phase='won';app.state.completed=3;app.state.score=9000;app.step();assert.equal(app.node('dialog').open,true);assert.equal(app.node('resume').hidden,true);assert.equal(app.node('resultScore').textContent,'9,000');assert.equal(app.frames.size,0);
 app.node('menu').click();assert.equal(app.node('home').hidden,false);assert.equal(app.node('app').dataset.view,'home');app.node('practiceMode').click();app.node('start').click();assert.equal(app.state.lives,null);app.node('sound').click();assert.equal(app.node('sound').attrs['aria-pressed'],'false');
 app.windowEvents.blur();assert.equal(app.state.paused,true);app.node('menu').click();app.node('help').click();assert.equal(app.node('closeHelp').hidden,false);app.node('closeHelp').click();assert.equal(app.node('dialog').open,false);
 console.log('PASS: pinball UI supports independent touch/keyboard controls, cancel-safe charging, background pause, restart, result/menu, practice and sound controls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
