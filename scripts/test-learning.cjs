const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const DAY=86400000;
function boot(saved={}){
  let now=1800000000000,timers=[],fail=false;
  const elements=new Map();
  function el(){const classes=new Set();return {children:[],dataset:{},style:{},textContent:'',checked:false,parentElement:{after(){}},
    classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x)}},
    appendChild(x){this.children.push(x)},before(){},after(){},remove(){},setAttribute(){},set innerHTML(v){this.children=[]},get innerHTML(){return ''}}}
  const get=id=>{if(!elements.has(id))elements.set(id,el());return elements.get(id)};
  const subjects=['math','chinese','focus','english'].map(kind=>{const b=el();b.dataset.kind=kind;return b});
  const document={getElementById:get,createElement:el,body:el(),querySelectorAll:s=>s==='.subject'?subjects:s==='.answer'?get('answers').children:[]};
  class Clock extends Date{static now(){return now}}
  const context=vm.createContext({console,Math,Date:Clock,document,window:{},localStorage:{getItem:k=>saved[k]??null,setItem(k,v){if(fail)throw Error('quota');saved[k]=v}},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){}});
  vm.runInContext(source,context);
  const run=s=>vm.runInContext(s,context);
  const flush=()=>{const pending=timers;timers=[];pending.forEach(fn=>fn())};
  const answer=(correct=true)=>{if(run('previewing'))run('memoryButton.onclick()');run(`answer(current.choices.find(c=>c${correct?'===':'!=='}current.answer),document.getElementById('answers').children.find(b=>b.dataset.choice${correct?'===':'!=='}current.answer))`)};
  return {run,saved,answer,flush,days:n=>now+=n*DAY,fail:()=>fail=true};
}
const app=boot();
for(const kind of ['math','chinese','english','focus']){
  app.run(`subject='${kind}';level=1;begin()`);app.answer();app.run('advance();saveExitButton.onclick()');
}
assert.equal(app.run('savedList.children.length'),4);
for(const kind of ['math','chinese','english','focus']){
  app.run(`restoreSession('${kind}')`);assert.equal(app.run('subject'),kind);assert.equal(app.run('round'),1);app.run('saveExitButton.onclick()');
}
app.run("restoreSession('math');round=7;pendingAdvance=true;advance()");
assert.equal(app.run("readSession('math')"),null);
for(const kind of ['chinese','english','focus'])assert.ok(app.run(`readSession('${kind}')`));
const reload=boot(app.saved);
assert.ok(reload.run("readSession('english')"));
reload.run("restoreSession('english')");assert.equal(reload.run('round'),1);
console.log('PASS: four independent save slots, reload, and completing one subject preserves other slots.');

const legacy=JSON.parse(app.saved['learning-planet-session-v1-english']);
delete legacy.sessionId;delete legacy.difficultyTier;delete legacy.dueReviews;delete legacy.seenQuestions;
const migrated=boot({'learning-planet-session-v1':JSON.stringify(legacy)});
assert.ok(migrated.run("readSession('english')"));
migrated.run("restoreSession('english')");assert.equal(migrated.run('round'),1);
assert.equal(migrated.saved['learning-planet-session-v1'],'null');
const untouched=boot({'learning-planet-session-v1':JSON.stringify(legacy),'learning-planet-session-v1-english':'null'});
assert.equal(untouched.run("readSession('english')"),null);
console.log('PASS: legacy migration without overwriting a newer slot.');

const stats=boot();stats.run('begin()');stats.answer(false);
assert.equal(stats.run('learning.math.events.length'),1);
stats.answer(false);assert.equal(stats.run('learning.math.events.length'),1);
stats.run('saveExitButton.onclick();restoreSession()');stats.flush();stats.answer(true);
assert.equal(stats.run("learning.math.events.filter(e=>e.kind==='first'&&!e.correct).length"),1);
assert.equal(stats.run("learning.math.events.filter(e=>e.kind==='retry').length"),1);
stats.run('restoreSession()');stats.answer();assert.equal(stats.run('learning.math.events.length'),2);
stats.run('advance()');stats.answer();assert.equal(stats.run('stars'),1);
assert.equal(stats.run("learning.math.events.filter(e=>e.kind==='first'&&e.correct).length"),1);
stats.run('round=7;pendingAdvance=true;advance();completeStage()');assert.equal(stats.run('learning.math.stages.length'),1);
stats.run('reviewButton.onclick()');stats.answer();stats.run('advance()');
assert.equal(stats.run('stars'),1);assert.equal(stats.run('learning.math.stages.length'),1);
assert.equal(stats.run('learning.math.mistakes[0].success'),0,'Same-day practice does not retire a mistake');
assert.equal(stats.run("learning.math.events.filter(e=>e.kind==='review').length"),1);
const statsReload=boot(stats.saved);assert.equal(statsReload.run('learning.math.stages.length'),1);
console.log('PASS: first attempts and successful retries counted once, unscored review, and persistent parent records.');

for(const kind of ['math','chinese','english','focus']){
  const spaced=boot();spaced.run(`subject='${kind}';level=${kind==='english'?3:1};begin()`);spaced.answer(false);spaced.flush();spaced.answer();
  const id=spaced.run(`learning.${kind}.mistakes[0].id`);
  spaced.run('saveExitButton.onclick()');spaced.days(2);
  // A new stage may differ from the stage where the mistake originated.
  spaced.run(`level=${kind==='english'?4:2};begin();round=2;render()`);
  assert.equal(spaced.run('current.spaced'),true,kind+' gets a due review');
  assert.equal(spaced.run('current.mistakeId'),id);
  const before=spaced.run('JSON.stringify(current)');spaced.run('saveExitButton.onclick();restoreSession()');
  assert.equal(spaced.run('JSON.stringify(current)'),before);
  spaced.answer();assert.equal(spaced.run(`learning.${kind}.mistakes[0].success`),1);
  spaced.run('saveExitButton.onclick()');spaced.days(4);spaced.run('begin();round=2;render()');spaced.answer();
  assert.equal(spaced.run(`learning.${kind}.mistakes.length`),0,kind+' retires after spaced successes');
}
console.log('PASS: due reviews across days and stages, resume the same review, retire only after spaced successes.');

const adaptive=boot();
for(const kind of ['math','chinese','english','focus']){
  adaptive.run(`subject='${kind}';learning[subject].stages=[{stars:7},{stars:8}];level=1;begin()`);
  assert.equal(adaptive.run('difficultyTier'),1);assert.equal(adaptive.run('level'),1);
  adaptive.run('saveExitButton.onclick();restoreSession()');assert.equal(adaptive.run('difficultyTier'),1);
  adaptive.run('learning[subject].stages=[{stars:3},{stars:4}];begin()');assert.equal(adaptive.run('difficultyTier'),-1);
  adaptive.run('learning[subject].stages=[{stars:6},{stars:5}];begin()');assert.equal(adaptive.run('difficultyTier'),0);
}
adaptive.run("subject='focus';level=1;difficultyTier=-1");assert.equal(adaptive.run('focusChallenge(0).answer.length'),2);
adaptive.run('difficultyTier=1');assert.equal(adaptive.run('focusChallenge(0).answer.length'),4);
for(const tier of [-1,0,1])for(const stage of [1,2,3]){
  adaptive.run(`subject='math';level=${stage};difficultyTier=${tier}`);
  for(let i=0;i<200;i++){const q=adaptive.run('math()');assert.equal(new Set(q[2]).size,4);assert.ok(q[2].includes(q[3]))}
}
console.log('PASS: difficulty uses recent first-try scores, stays fixed on resume, keeps levels and valid questions.');

const broken=boot({'learning-planet-history-v1':'{invalid'});broken.run('begin()');broken.fail();broken.run('saveExitButton.onclick()');
assert.equal(broken.run('adventureActive'),true,'Do not exit when save fails');
assert.ok(broken.run("document.getElementById('message').textContent.includes('無法存檔')"));
console.log('PASS: corrupt history fallback and storage failure does not silently exit.');
