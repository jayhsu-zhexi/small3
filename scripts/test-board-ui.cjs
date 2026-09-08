const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const box={exports:{}};vm.runInNewContext(fs.readFileSync('assets/board-engine.js','utf8'),{module:box});
const E=box.exports,bank=require('./export-board-bank.cjs').exportBank();
let initial=E.create('cat',1800000000000);initial.position=4;
initial=E.act(initial,{type:'roll'},bank,()=>0,1800000000001);
function boot(saved,options={}){
  const values={...saved},elements=new Map(),timers=[],delays=[],animations=[],windowEvents={},documentEvents={};let document;
  function element(){
    const classes=new Set();let ownText='';
    return {children:[],style:{},dataset:{},attributes:{},open:false,disabled:false,
      get textContent(){return ownText+this.children.map(c=>c.textContent).join('')},
      set textContent(value){ownText=value==null?'':String(value);this.children=[]},
      appendChild(child){if(child.parentElement){const siblings=child.parentElement.children;const index=siblings.indexOf(child);if(index>=0)siblings.splice(index,1)}this.children.push(child);child.parentElement=this;return child},
      append(...children){for(const child of children)this.appendChild(child)},
      replaceChildren(...children){this.children=[];ownText='';this.append(...children)},
      setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]},
      classList:{add:(...c)=>c.forEach(x=>classes.add(x)),remove:(...c)=>c.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle(x,on){on=on===undefined?!classes.has(x):on;on?classes.add(x):classes.delete(x)}},
      focus(){document.activeElement=this},showModal(){this.open=true},close(){this.open=false;this.onclose?.()},
      click(){if(!this.disabled)return this.onclick?.()},getBoundingClientRect(){return {left:0,top:0}},scrollIntoView(){},
      animate(frames,options){const record={frames,options,canceled:false,paused:false};animations.push(record);return {finished:Promise.resolve(),cancel(){record.canceled=true},pause(){record.paused=true},play(){record.paused=false}}}
    };
  }
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
  document={getElementById:get,createElement:element,hidden:false,addEventListener(type,fn){documentEvents[type]=fn}};
  const localStorage={getItem:k=>values[k]??null,setItem:(k,v)=>{values[k]=v}};
  vm.runInNewContext(fs.readFileSync('assets/board-ui.js','utf8'),{window:{PlanetBoard:E,PlanetBoardBank:bank,addEventListener(type,fn){windowEvents[type]=fn},matchMedia(query){return {matches:!!options.reduced&&query.includes('prefers-reduced-motion')}}},document,localStorage,setTimeout(fn,delay){delays.push(delay);timers.push(fn)}});
  const walk=node=>[node,...node.children.flatMap(walk)];
  const find=text=>walk(get('taskControls')).find(n=>n.textContent===text&&n.onclick);
  const direction=arrow=>walk(get('taskControls')).find(n=>n.attributes['aria-label']==={'↑':'往上','→':'往右','↓':'往下','←':'往左'}[arrow]);
  return {get,find,direction,walk,values,timers,delays,animations,document,windowEvents,documentEvents,read:()=>JSON.parse(values[E.KEY])};
}
const ui=boot({[E.KEY]:JSON.stringify(initial)});
ui.find('我記好了，藏起路線').click();
for(const arrow of ['↑','←','↓'])ui.direction(arrow).click();
// Remove the four direction buttons themselves before checking the chosen route.
const route=ui.walk(ui.get('taskControls')).find(n=>n.attributes['aria-label']==='你選的路線'||n.className==='big-signal'&&/[↑→↓←]/.test(n.textContent));
assert.deepEqual(route.textContent.match(/[↑→↓←]/g),['↑','←','↓'],'Only selected directions may appear in the route, with no extra arrow separators');
assert.deepEqual(ui.read().input.sequence,['↑','←','↓']);
ui.find('退回上一步').click();assert.deepEqual(ui.read().input.sequence,['↑','←']);
const reloaded=boot(ui.values);assert.deepEqual(reloaded.read().input.sequence,['↑','←']);
assert.equal(reloaded.get('taskAction').disabled,true);
reloaded.direction('→').click();assert.equal(reloaded.get('taskAction').disabled,false);
assert.deepEqual(reloaded.read().input.sequence,['↑','←','→']);
reloaded.get('hintButton').click();assert.deepEqual(reloaded.read().input.sequence,[]);assert.equal(reloaded.read().task.concealed,false);
console.log('PASS: real UI direction buttons render exactly the clicked sequence; undo, reload, a different final direction and re-preview preserve the expected route.');

(async()=>{
  const moving=boot({[E.KEY]:JSON.stringify(E.create())});moving.get('gentleMotion').checked=true;
  let complete=false;const rolling=moving.get('rollButton').click().then(()=>{complete=true});
  assert.equal(moving.read().turn,1,'Roll saved before animation starts');
  assert.equal(moving.get('rollButton').disabled,true);
  moving.get('rollButton').click();assert.equal(moving.read().turn,1);
  for(let i=0;i<100&&!complete;i++){while(moving.timers.length)moving.timers.shift()();await Promise.resolve();}
  await rolling;
  assert.equal(moving.animations.length,moving.read().dice,'One hop per dice step');
  assert.ok(moving.animations.every(a=>a.options.duration===650));
  assert.equal(moving.delays.filter(d=>d===150).length,moving.read().dice);
  assert.equal(moving.get('taskDialog').open,true);
  const resumed=boot(moving.values);assert.equal(resumed.read().turn,1);assert.equal(resumed.get('taskDialog').open,true);
  const instant=boot({[E.KEY]:JSON.stringify(E.create())});instant.get('gentleMotion').checked=false;await instant.get('rollButton').click();
  assert.equal(instant.animations.length,0);assert.equal(instant.delays.length,0);
  assert.equal(instant.get('taskDialog').open,true);
  console.log('PASS: dice animation precedes one slow hop per step, repeat rolls are locked, interrupted movement restores its task, and disabling motion skips delays.');
})().catch(error=>{console.error(error);process.exitCode=1});

const parkState=E.create();parkState.supplies=4;parkState.stars=2;
const parkUI=boot({[E.KEY]:JSON.stringify(parkState)});parkUI.get('buildButton').click();
let slide=parkUI.get('baseChoices').children.find(b=>b.textContent.includes('溜滑梯'));assert.equal(slide.disabled,false);slide.click();
assert.equal(parkUI.read().supplies,0);assert.deepEqual(parkUI.read().park.facilities,['slide']);
parkUI.get('parkScene').children[0].click();assert.match(parkUI.get('parkMessage').textContent,/滑下來/);
parkUI.get('parkShop').click();const balloons=parkUI.get('baseChoices').children.find(b=>b.textContent.includes('氣球'));balloons.click();assert.equal(parkUI.read().park.stars,0);assert.match(parkUI.get('parkDecor').textContent,/氣球/);
const ended=parkUI.read();ended.turn=12;ended.phase='finished';
const finishUI=boot({[E.KEY]:JSON.stringify(ended)});assert.match(finishUI.get('taskAction').textContent,/開始新旅程/);finishUI.get('taskAction').click();assert.equal(finishUI.read().turn,0);assert.deepEqual(finishUI.read().park.facilities,['slide']);assert.deepEqual(finishUI.read().park.decorations,['balloons']);assert.equal(finishUI.get('taskDialog').open,false);
console.log('PASS: actual workshop controls buy facilities and decorations, facilities respond to play, and the finish button keeps the park in the next journey.');

const residents=E.create();residents.supplies=70;residents.park={stars:30,facilities:Object.keys(E.FACILITIES),decorations:[],animals:[]};
const animalUI=boot({[E.KEY]:JSON.stringify(residents)});animalUI.get('parkShop').click();animalUI.get('baseChoices').children.find(b=>b.onclick&&b.textContent.includes('小狗豆豆')).click();
assert.deepEqual(animalUI.read().park.animals,['dog']);assert.equal(animalUI.read().park.stars,27);
const actor=animalUI.get('parkHabitat').children.find(c=>c.attributes['aria-label']?.includes('小狗豆豆'));assert.ok(actor);actor.click();assert.match(animalUI.get('parkMessage').textContent,/汪/);
assert.equal(animalUI.get('baseLevel').textContent,'LEVEL 3 / 3','Expanded facilities do not overflow old base stages');
const walks=animalUI.animations.filter(a=>a.options.iterations===Infinity);assert.equal(walks.length,1);assert.ok(new Set(walks[0].frames.map(f=>f.left+f.top)).size>1,'Residents travel to multiple owned facilities');
animalUI.document.hidden=true;animalUI.documentEvents.visibilitychange();assert.equal(walks[0].paused,true);animalUI.document.hidden=false;animalUI.documentEvents.visibilitychange();assert.equal(walks[0].paused,false);
animalUI.windowEvents.pagehide();assert.equal(walks[0].canceled,true);
const still=boot(animalUI.values,{reduced:true});assert.equal(still.animations.filter(a=>a.options.iterations===Infinity).length,0);assert.match(still.get('parkResidents').textContent,/豆豆/);
const animalReload=boot(animalUI.values);assert.equal(animalReload.get('parkHabitat').children.filter(c=>c.attributes['aria-label']?.includes('豆豆')).length,1);
console.log('PASS: workshop invites residents, saved animals appear and greet, automatic routes pause/clean up, reduced motion stays still and seven facilities keep a valid base display.');
