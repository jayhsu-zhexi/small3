const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/geography-engine.js','utf8'),context);const G=context.Geography;
assert.equal(G.bank.length,24);
assert.equal(new Set(G.bank.map(q=>q.prompt)).size,24,'Every question has a distinct prompt');
assert.equal(G.bank.filter(q=>q.kind==='coordinate').length,4);
assert.equal(G.bank.filter(q=>q.kind==='coordinate-reading').length,4);
for(let r=0;r<3;r++)assert.equal(G.bank.filter(q=>q.route===r).length,8);
for(const q of G.bank){assert.equal(new Set(q.choices).size,4);assert(q.choices.includes(q.answer));assert(q.hint&&q.explanation);if(q.kind==='coordinate'){const p=G.points.find(p=>p.label===q.answer);assert(q.prompt.includes(p.lat===0?"緯度 0°（赤道）":`北緯 ${p.lat}°`));assert(q.prompt.includes(`東經 ${p.lon}°`));}if(q.kind==='scale')assert.equal(q.answer,`${q.scale*q.cm/100000} 公里`);}
assert(G.valid(G.fresh()));assert(!G.valid({...G.fresh(),index:24}));assert(!G.valid({...G.fresh(),answers:{99:true}}));assert(!G.valid({...G.fresh(),hinted:[-1]}));
const progress=G.fresh();progress.answers[8]=true;assert.equal(G.nextPending(progress),9);
progress.answers[10]=false;progress.index=9;assert.equal(G.nextPending(progress),11,'Skip already completed questions');
progress.index=15;progress.answers[15]=true;assert.equal(G.nextPending(progress),9,'Wrap to unfinished questions only');
for(let n=8;n<16;n++)progress.answers[n]=true;
assert.equal(G.nextPending(progress),null,'Completed route must show results instead of replaying');
for(let n=0;n<24;n++)progress.answers[n]=true;
assert.equal(G.pending(progress).length,0,'A completed journey has no automatic replay');
const old={...progress,bankRevision:undefined,hinted:[1,12],mistakes:[2,13]};const restored=G.restore(old);
assert.equal(Object.keys(restored.answers).length,20);assert(restored.answers[8]);assert.equal(restored.answers[12],undefined);
assert.equal(restored.hinted.join(','),'1');assert.equal(restored.mistakes.join(','),'2');assert.equal(Object.keys(old.answers).length,24,'Migration must not mutate input');
assert.equal(Object.keys(G.restore(progress).answers).length,24,'Current saves retain every completed question');
// Exercise the actual UI handlers with saved progress, including reload and route switching.
function mount(saved){
  const elements=new Map();let stored=JSON.stringify(saved);
  const element=()=>({style:{},children:[],hidden:false,disabled:false,textContent:'',innerHTML:'',setAttribute(){},replaceChildren(){this.children=[]},append(child){this.children.push(child)},querySelectorAll(){return []},showModal(){this.open=true},close(){this.open=false}});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
  const ui={Geography:G,document:{getElementById:get,createElement:element},localStorage:{getItem(){return stored},setItem(key,value){stored=value}}};
  vm.createContext(ui);vm.runInContext(fs.readFileSync('assets/geography-ui.js','utf8'),ui);
  return {get,save:()=>JSON.parse(stored),answer(){const state=JSON.parse(stored),q=G.bank[state.index];get('choices').children.find(b=>b.textContent===q.answer).onclick();get('confirm').onclick()}};
}
let ui=mount(G.fresh());ui.answer();assert.equal(ui.save().answers[8],true);
ui=mount(ui.save());assert.equal(ui.save().index,9,'Reload after answering must continue with an unfinished question');
ui.get('routes').children[1].onclick();assert.equal(ui.save().index,9,'Switching back does not replay answered questions');
const mixed={...G.fresh(),index:14,answers:{15:true}};ui=mount(mixed);ui.answer();ui.get('confirm').onclick();assert.equal(ui.save().index,8,'Next skips a completed last question and wraps to unfinished work');
ui=mount(progress);assert.equal(ui.get('result').hidden,false,'A completed save loads the results');
ui.get('routes').children[1].onclick();assert.equal(ui.get('result').hidden,false,'A completed route stays on results');
ui.get('continueRoute').onclick();assert.equal(ui.get('restartDialog').open,true,'Replay requires the restart dialog');assert.equal(Object.keys(ui.save().answers).length,24);
ui.get('acceptRestart').onclick();assert.equal(Object.keys(ui.save().answers).length,0);
const {build,files}=require('./build.cjs');assert(files.includes('geography.html'));assert(files.includes('assets/geography-backdrop.webp'));
const {createServer}=require('./serve.cjs');const {once}=require('node:events');
(async()=>{const server=createServer();try{server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;for(const route of ['/geography','/geography/','/geography.html']){const res=await fetch(origin+route);assert.equal(res.status,200);assert.match(await res.text(),/id="missionTitle"/);}for(const asset of ['geography.css','geography-ui.js','geography-engine.js','geography-backdrop.webp'])assert.equal((await fetch(origin+'/assets/'+asset)).status,200);console.log('PASS: geography questions, coordinates, scale conversions, save validation and preview routes');}finally{server.closeAllConnections();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
