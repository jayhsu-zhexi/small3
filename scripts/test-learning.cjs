const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const DAY=86400000;
function boot(saved={}){
  let now=1800000000000,timers=[],fail=false;
  const elements=new Map();
  function el(){const classes=new Set();return {children:[],dataset:{},style:{},textContent:'',checked:false,parentElement:{style:{},after(){}},
    classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x)}},
    appendChild(x){this.children.push(x)},before(){},after(){},remove(){},setAttribute(){},showModal(){this.open=true},close(){this.open=false;this.onclose?.()},set innerHTML(v){this.children=[]},get innerHTML(){return ''}}}
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
  adaptive.run(`subject='${kind}';learning[subject].stages=[{stars:7,independent:7},{stars:8,independent:8}];level=1;begin()`);
  assert.equal(adaptive.run('difficultyTier'),1);assert.equal(adaptive.run('level'),1);
  adaptive.run('saveExitButton.onclick();restoreSession()');assert.equal(adaptive.run('difficultyTier'),1);
  adaptive.run('learning[subject].stages=[{stars:3,independent:3},{stars:4,independent:4}];begin()');assert.equal(adaptive.run('difficultyTier'),-1);
  adaptive.run('learning[subject].stages=[{stars:6,independent:6},{stars:5,independent:5}];begin()');assert.equal(adaptive.run('difficultyTier'),0);
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

// Exercise the actual round renderer, not only the individual random generators.
let uniqueRounds=0;
for(const [kind,max] of Object.entries({math:3,chinese:3,english:6,focus:12})){
  const game=boot();
  for(let stage=1;stage<=max;stage++)for(const tier of [-1,0,1])for(let replay=0;replay<3;replay++){
    const score=tier<0?3:tier>0?8:5;
    game.run(`subject='${kind}';level=${stage};learning[subject].stages=[{stars:${score},independent:${score}},{stars:${score},independent:${score}}];begin()`);
    const seen=new Set();
    for(let r=0;r<8;r++){
      if(r)game.run(`round=${r};render()`);
      const key=game.run('questionKey(current)');
      assert.ok(!seen.has(key),`${kind} stage ${stage}, tier ${tier}, round ${r}: repeated ${key}`);seen.add(key);
      if(r===3){game.run('saveExitButton.onclick();restoreSession()');assert.equal(game.run('questionKey(current)'),key)}
    }
    assert.equal(seen.size,8);uniqueRounds++;
  }
}
console.log(`PASS: ${uniqueRounds} complete eight-question rounds are unique across all subjects, stages, difficulty tiers and mid-round restores.`);

const vocabulary=boot();vocabulary.run("subject='english';level=3;begin()");
const played=new Set();for(let r=0;r<8;r++){if(r)vocabulary.run(`round=${r};render()`);played.add(vocabulary.run('questionKey(current)'))}
vocabulary.run('begin()');assert.ok(!played.has(vocabulary.run('questionKey(current)')));
vocabulary.run('round=1;render()');assert.ok(!played.has(vocabulary.run('questionKey(current)')));
assert.equal(vocabulary.run('questionKey({display:"紅色",answer:"red"})'),vocabulary.run('questionKey({display:"red",answer:"紅色"})'));
assert.equal(vocabulary.run('questionKey({display:"A",answer:"a"})'),vocabulary.run('questionKey({display:"a",answer:"A"})'));
console.log('PASS: English replay uses unseen vocabulary first; reversed pairs share the same identity.');

for(const kind of ['math','english','chinese','focus']){
  const game=boot();game.run(`subject='${kind}';level=${kind==='focus'?11:kind==='english'?3:1};begin()`);
  for(let r=0;r<8;r++){game.answer(false);game.flush();game.answer();game.run('advance()')}
  game.run('reviewButton.onclick()');
  assert.equal(game.run('new Set(reviewDeck.map(questionKey)).size'),game.run('reviewDeck.length'));
  game.run('saveExitButton.onclick()');game.days(2);game.run('begin()');
  const seen=new Set();for(let r=0;r<8;r++){if(r)game.run(`round=${r};render()`);const key=game.run('questionKey(current)');assert.ok(!seen.has(key),kind+' due-review duplicate');seen.add(key)}
}
console.log('PASS: mistake-review decks and normal rounds with injected due reviews are unique.');

const forced=boot();forced.run('begin();const fixed=current;generatedCandidates=()=>[fixed];round=1;render()');
assert.notEqual(forced.run('questionKey(current)'),forced.run('questionKey(fixed)'));
console.log('PASS: repeated random candidates use a fresh fallback, never an already played question.');

const assisted=boot();assisted.run('begin();document.getElementById("hintBtn").onclick();document.getElementById("hintBtn").onclick();saveExitButton.onclick();restoreSession()');
assert.equal(assisted.run('current.hintUsed'),true,'Hiding a hint or resuming cannot clear assistance');
assisted.answer();assert.equal(assisted.run('stars'),1,'Assisted first answers still earn stars');
assert.equal(assisted.run('learning.math.events[0].hintUsed'),true);
assisted.run('advance()');assisted.answer();assert.equal(assisted.run('learning.math.events[1].hintUsed'),false);
for(let r=2;r<8;r++){assisted.run('advance()');assisted.answer()}
assisted.run('advance()');assert.equal(assisted.run('learning.math.stages[0].independent'),7);
assisted.run('learning.math.stages=[{stars:8,independent:3},{stars:8,independent:4}]');assert.equal(assisted.run("nextDifficulty('math')"),-1);
assisted.run('learning.math.stages=[{stars:8},{stars:8}]');assert.equal(assisted.run("nextDifficulty('math')"),0,'Unclassified old records cannot raise difficulty');
console.log('PASS: assistance persists, still earns stars, and difficulty uses only tracked independent answers.');

const confirm=boot();confirm.run('begin();saveExitButton.onclick()');const original=confirm.saved['learning-planet-session-v1-math'];
confirm.run('level=2;document.getElementById("start").onclick()');assert.equal(confirm.saved['learning-planet-session-v1-math'],original);
assert.equal(confirm.run('pendingRestart.level'),2);assert.equal(confirm.run('restartPanel.open'),true);confirm.run('cancelRestart.onclick()');assert.equal(confirm.run('restartPanel.open'),false);assert.equal(confirm.saved['learning-planet-session-v1-math'],original);
confirm.run('document.getElementById("start").onclick();restartPanel.oncancel({preventDefault(){}})');assert.equal(confirm.run('restartPanel.open'),false);assert.equal(confirm.saved['learning-planet-session-v1-math'],original);
confirm.run('document.getElementById("start").onclick();continueSaved.onclick()');assert.equal(confirm.run('level'),1);
confirm.run('saveExitButton.onclick();level=2;document.getElementById("start").onclick();confirmRestart.onclick()');assert.equal(confirm.run('level'),2);assert.equal(confirm.run('adventureActive'),true);
confirm.run('saveExitButton.onclick();subject="english";level=1;document.getElementById("start").onclick()');assert.ok(confirm.run('readSession("math")'));assert.equal(confirm.run('pendingRestart'),null);
console.log('PASS: same-subject overwrite requires confirmation; cancel/continue and switching subjects preserve saves.');

for(const kind of ['math','chinese','english','focus']){
  const sameSkill=boot();sameSkill.run(`subject='${kind}';level=${kind==='english'?3:1};begin()`);
  for(let r=0;r<8;r++){sameSkill.answer(false);sameSkill.flush();sameSkill.answer();sameSkill.run('advance()')}
  sameSkill.run('reviewButton.onclick()');
  assert.ok(sameSkill.run('reviewDeck.length')>0);
  assert.equal(sameSkill.run('reviewDeck.every(q=>{const old=wrongQuestions.find(x=>x.mistakeId===q.mistakeId);return skillKey(q)===skillKey(old)&&questionKey(q)!==questionKey(old)})'),true);
  const length=sameSkill.run('reviewDeck.length');sameSkill.run('document.getElementById("hintBtn").onclick()');
  for(let r=0;r<length;r++){sameSkill.answer();sameSkill.run('advance()')}
  assert.equal(sameSkill.run('scorePanel.style.display'),'none');
  assert.ok(sameSkill.run('reviewOutcome.textContent').includes('完成 '+length+' 題'));
  assert.ok(sameSkill.run('document.getElementById("finishText").textContent').includes('看提示首次答對 1 題'));
  sameSkill.run('begin();round=7;pendingAdvance=true;advance()');assert.equal(sameSkill.run('scorePanel.style.display'),'');
}
console.log('PASS: review questions stay on the original skill, differ from the source, and show current review results without old stars.');

const mastery=boot();mastery.run('begin()');mastery.answer(false);mastery.flush();mastery.answer();mastery.run('saveExitButton.onclick()');mastery.days(2);
mastery.run('begin();round=2;render();document.getElementById("hintBtn").onclick()');mastery.answer();
assert.equal(mastery.run('learning.math.mistakes[0].success'),0,'Assisted review cannot retire the mistake');
const stale=boot();stale.run('begin()');stale.answer(false);stale.flush();stale.answer();stale.run('saveExitButton.onclick()');stale.days(2);
stale.run('begin();round=2;render();current.prompt="其他題型"');stale.answer();
assert.equal(stale.run('learning.math.mistakes[0].success'),0,'Unrelated legacy review cannot retire the mistake');
console.log('PASS: assisted and unrelated legacy review answers do not advance original mistake mastery.');
