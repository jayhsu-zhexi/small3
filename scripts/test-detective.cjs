const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const box={exports:{}};vm.runInNewContext(fs.readFileSync('assets/board-engine.js','utf8'),{module:box});const E=box.exports,copy=x=>JSON.parse(JSON.stringify(x));let seed=12;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const act=(s,type,extra={})=>E.act(s,{type,...extra},null,rng,1800000000000+seed);
for(let run=0;run<100;run++){
 let s=E.create();s.position=8;s.supplies=14;s.park={stars:10,facilities:['slide','house'],decorations:['balloons'],animals:['fox','dog']};s=act(s,'detectiveStart');assert.ok(E.validState(s));assert.equal(act(s,'detectiveStart'),s,'Active session cannot be overwritten');
 for(let round=0;round<5;round++){
  let c=s.detective.session.cases[round];assert.equal(c.before.filter(Boolean).length,[4,4,5,5,6][round]);assert.ok(c.before.some(id=>id?.includes('-')),'Owned park items appear');
  assert.equal(act(s,'detectiveAnswer',{position:0}),s,'Cannot answer while observing');s=act(s,'detectiveLook');
  if(run%2===0){s=act(s,'detectiveHint');assert.equal(s.detective.session.phase,'observe');s=act(s,'detectiveLook');}
  c=s.detective.session.cases[round];const diff=c.before.map((id,i)=>id!==c.after[i]?i:-1).filter(i=>i>=0),wrong=c.before.findIndex((id,i)=>id===c.after[i]);
  s=act(s,'detectiveAnswer',{position:wrong});assert.equal(s.detective.session.cases[round].attempts,1);assert.equal(s.park.stars,10);
  s=act(copy(s),'detectiveAnswer',{position:diff[run%diff.length]});assert.equal(s.detective.session.phase,'result');assert.equal(act(s,'detectiveAnswer',{position:diff[0]}),s);
  s=act(copy(s),'detectiveNext');assert.ok(E.validState(s));
 }
 assert.equal(s.detective.session.phase,'finished');assert.equal(s.park.stars,13);assert.equal(s.position,8);assert.equal(s.supplies,14);assert.equal(s.turn,0);assert.equal(s.stars,0);assert.equal(s.detective.records.length,1);assert.equal(act(s,'detectiveNext'),s,'Reward may only be claimed once');
 const next=E.nextJourney(s);assert.deepEqual(copy(next.detective),copy(s.detective));assert.equal(act(s,'detectiveStart').detective.records.length,1);
}
const original=act(E.create(),'detectiveStart');for(const value of [null,{}, {...original.detective,session:{...original.detective.session,round:5}},{...original.detective,session:{...original.detective.session,phase:'finished'}}])assert.equal(E.validState({...original,detective:value}),false);
const backupBox={exports:{}};vm.runInNewContext(fs.readFileSync('assets/backup.js','utf8'),{module:backupBox,window:{PlanetBoard:E}});const B=backupBox.exports;const values={[E.KEY]:JSON.stringify(original)},storage={getItem:k=>values[k]??null,setItem:(k,v)=>{values[k]=v},removeItem:k=>{delete values[k]}};const backup=B.parse(JSON.stringify(B.capture(storage)));delete values[E.KEY];B.restore(storage,backup);assert.deepEqual(JSON.parse(values[E.KEY]).detective,copy(original.detective));
console.log('PASS: 100 detective sessions produce valid single changes, accept both move positions, preserve park state, record hints/retries, award once and survive reload/new journeys/backup.');

function boot(saved={},fail=false){const data={...saved},nodes=new Map();let document;function node(){let text='';return {children:[],style:{},attributes:{},hidden:false,disabled:false,append(...items){this.children.push(...items)},appendChild(item){this.children.push(item);return item},replaceChildren(...items){text='';this.children=items},setAttribute(k,v){this.attributes[k]=v},focus(){document.activeElement=this},get textContent(){return text+this.children.map(c=>c.textContent).join('')},set textContent(v){text=String(v);this.children=[]},click(){if(!this.disabled)return this.onclick?.()}};}const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};document={getElementById:get,createElement:node};const localStorage={getItem:k=>data[k]??null,setItem(k,v){if(fail)throw Error('quota');data[k]=v}};vm.runInNewContext(fs.readFileSync('assets/detective-ui.js','utf8'),{window:{PlanetBoard:E,addEventListener(){}},document,localStorage});return {get,data,read:()=>JSON.parse(data[E.KEY]),walk:n=>[n,...n.children.flatMap(child=>walk(child))]};function walk(n){return [n,...n.children.flatMap(walk)]}}
let ui=boot();ui.get('caseAction').click();assert.equal(ui.read().detective.session.phase,'observe');
for(let round=0;round<5;round++){
 ui.get('caseAction').click();assert.equal(ui.read().detective.session.phase,'search');assert.equal(ui.get('caseAction').hidden,true);
 ui.get('caseHint').click();assert.equal(ui.read().detective.session.phase,'observe');ui.get('caseAction').click();
 const c=ui.read().detective.session.cases[round],i=c.before.findIndex((id,pos)=>id!==c.after[pos]);const buttons=ui.walk(ui.get('detectiveScene')).filter(n=>n.onclick);assert.equal(buttons.length,9);buttons[i].click();assert.equal(ui.read().detective.session.phase,'result');assert.match(ui.get('detectiveScene').textContent,/原來的花園/);
 ui=boot(ui.data);ui.get('caseAction').click();
}
assert.equal(ui.read().park.stars,3);assert.match(ui.get('caseTitle').textContent,/全都找到了/);assert.match(ui.get('detectiveRecords').textContent,/完成 5 個案件/);
const noSave=boot({},true);noSave.get('caseAction').click();assert.equal(noSave.data[E.KEY],undefined);assert.match(noSave.get('detectiveSave').textContent,/無法存檔/);
const corrupt=boot({[E.KEY]:'bad json'});assert.equal(corrupt.get('caseAction').disabled,true);assert.equal(corrupt.data[E.KEY],'bad json');
console.log('PASS: actual detective controls complete all five cases with replayed hints and reloads; failed storage never claims a reward and corrupt saves stay untouched.');

const stale=boot({[E.KEY]:JSON.stringify(original)});const newer=act(original,'detectiveLook');stale.data[E.KEY]=JSON.stringify(newer);stale.get('caseAction').click();assert.equal(stale.data[E.KEY],JSON.stringify(newer));assert.match(stale.get('detectiveSave').textContent,/同步/);
console.log('PASS: stale controls synchronize another tab instead of answering or advancing a different phase.');
