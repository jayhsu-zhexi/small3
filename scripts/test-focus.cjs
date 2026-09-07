const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element(){
  const classes = new Set();
  return {children:[],dataset:{},style:{},textContent:'',disabled:false,parentElement:{style:{},after(){}},
    classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x)},contains:x=>classes.has(x)},
    appendChild(x){this.children.push(x)},after(){},before(){},remove(){this.removed=true},setAttribute(){},
    set innerHTML(value){this.children=[]},get innerHTML(){return ''}};
}
const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
let timers=[];const saved={};
const context=vm.createContext({console,Math,Set,document:{getElementById:get,createElement:element,querySelectorAll:s=>s==='.answer'?get('answers').children:[]},localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout:()=>{},window:{}});
const html=fs.readFileSync('index.html','utf8');
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const run=code=>vm.runInContext(code,context);
assert.equal(run('pauseButton.removed'),true,'Pause button is removed from the mission toolbar');
assert.equal(run('missionActions.children.includes(saveExitButton)'),true,'Save and exit stays available');
const flush=()=>{const pending=timers;timers=[];pending.forEach(fn=>fn())};
run("subject='focus';level=1;begin()");
for(let stage=1;stage<=12;stage++)for(let r=0;r<8;r++)for(let sample=0;sample<10;sample++){
  const q=run(`level=${stage};round=${r};focusChallenge()`);
  assert.equal(q.choices.length,4);
  assert.equal(q.choices.filter(c=>c===q.answer).length,1);
  assert.ok(q.display&&q.hint);
}
run("level=4;round=0;render()");
assert.equal(run('previewing'),true);
run("answer(current.answer,document.getElementById('answers').children[0])");
assert.equal(run('stars'),0);
run('memoryButton.onclick()');assert.equal(run('previewing'),false);
assert.equal(get('display').textContent,'剛才背包裡的圖案順序是？');
function finish(firstCorrect){
  run("level=1;unlocks.focus=1;begin()");
  for(let i=0;i<8;i++){
    if(run('previewing'))run('memoryButton.onclick()');
    if(i>=firstCorrect){
      run("answer(current.choices.find(c=>c!==current.answer),document.getElementById('answers').children.find(b=>b.dataset.choice!==current.answer))");
      run("answer(current.answer,document.getElementById('answers').children.find(b=>b.dataset.choice===current.answer))");
      assert.equal(run('locked'),false,'rapid click must be ignored');flush();
    }
    run("answer(current.answer,document.getElementById('answers').children.find(b=>b.dataset.choice===current.answer))");
    const score=run('stars');run("answer(current.answer,document.getElementById('answers').children[0])");assert.equal(run('stars'),score);
    run('advance()');
  }
}
finish(0);assert.equal(run('stars'),0);assert.equal(run('unlocks.focus'),1);
finish(4);assert.equal(run('unlocks.focus'),1);
finish(5);assert.equal(run('unlocks.focus'),2);
run("level=12;begin();round=7;stars=5;pendingAdvance=true;advance()");assert.equal(get('next').classList.contains('hidden'),true);
run("level=1;begin();pauseButton.onclick()");assert.equal(run('paused'),true);run("document.getElementById('resume').onclick()");assert.equal(run('paused'),false);
console.log('PASS: 960 generated questions, memory concealment, click lock, scoring threshold, final stage and pause/resume.');
run("subject='english'");assert.equal(run('stageCount()'),6);assert.equal(run('unlocks.english'),1);
for(let stage=1;stage<=6;stage++)for(let sample=0;sample<20;sample++){
  run(`level=${stage};begin()`);const seen=new Set();
  for(let r=0;r<8;r++){
    const q=run(`round=${r};englishChallenge()`);
    assert.equal(new Set(q.choices).size,4);assert.equal(q.choices.filter(c=>c===q.answer).length,1);
    assert.ok(q.display&&q.hint);assert.ok(!seen.has(q.display));seen.add(q.display);
  }
}
function englishRound(correct){
  run('level=1;unlocks.english=1;begin()');
  for(let i=0;i<8;i++){
    if(i>=correct){run("answer(current.choices.find(c=>c!==current.answer),document.getElementById('answers').children.find(b=>b.dataset.choice!==current.answer))");flush()}
    run("answer(current.answer,document.getElementById('answers').children.find(b=>b.dataset.choice===current.answer))");run('advance()');
  }
}
englishRound(0);assert.equal(run('unlocks.english'),1);assert.equal(run('stars'),0);
englishRound(4);assert.equal(run('unlocks.english'),1);
englishRound(5);assert.equal(run('unlocks.english'),2);
assert.equal(JSON.parse(saved['learning-planet-levels']).english,2);
run('level=6;begin();round=7;stars=5;pendingAdvance=true;advance()');assert.equal(get('next').classList.contains('hidden'),true);
console.log('PASS: 960 English questions, unique choices and rounds, scoring, saved progress, final stage.');
for(let stage=1;stage<=3;stage++){
  run(`subject='chinese';level=${stage};chineseHistory=[]`);
  const sessions=[];
  for(let session=0;session<8;session++){
    run('begin()');const seen=new Set([run('current.display')]);
    for(let r=1;r<8;r++){
      const q=run(`round=${r};challenge()`);
      assert.ok(!seen.has(q.display),'Chinese repeat within round');seen.add(q.display);
      assert.equal(q.choices.filter(c=>c===q.answer).length,1);
    }
    sessions.push(seen);
  }
  assert.equal([...sessions[1]].filter(q=>sessions[0].has(q)).length,0,'Prefer unseen on replay');
}
const history=JSON.parse(saved['learning-planet-chinese-history']);assert.ok(history.length>=16);
run(`chineseHistory=${JSON.stringify(history)};prepareChinese()`);
assert.equal(run('chineseDeck.length'),8);
console.log('PASS: Chinese rounds never repeat; replay prioritizes unseen questions and records history.');
for(let stage=1;stage<=3;stage++)for(let i=0;i<1000;i++){
  const q=run(`level=${stage};math()`);
  assert.equal(new Set(q[2]).size,4,'Math choices must be distinct');
  assert.equal(q[2].filter(c=>c===q[3]).length,1);
  if(q[0]==='找出餘數'){const numbers=q[1].match(/\d+/g).map(Number);assert.equal(Number(q[3]),numbers[0]%numbers[1])}
}
const opposite={'↑':'↓','↓':'↑','←':'→','→':'←'};
for(let r=0;r<8;r+=2){for(let sample=0;sample<20;sample++){
  const q=run(`level=11;round=${r};focusChallenge()`);
  assert.ok(q.display.includes('相反'));assert.equal(q.answer,opposite[q.display.slice(-1)]);
}}
for(const mode of ['math','chinese','focus','english']){
  run(`subject='${mode}';level=1;begin()`);flush();
  run("answer(current.answer,document.getElementById('answers').children.find(b=>b.dataset.choice===current.answer))");
  flush();assert.equal(run('round'),0,'Must wait for Next in every subject');
  assert.equal(run("continueButton.classList.contains('hidden')"),false);
  assert.ok(get('hint').textContent.startsWith('答案：'));
  run('pauseButton.onclick();advance()');assert.equal(run('round'),0);
  run("document.getElementById('resume').onclick();continueButton.onclick()");assert.equal(run('round'),1);
}
console.log('PASS: 3000 math questions, reverse navigation, manual Next and pause in all four subjects.');
context.document.body=element();
for(const mode of ['math','chinese','english','focus']){
  run(`subject='${mode}';level=${mode==='english'?3:1};begin()`);
  let before=run('JSON.stringify(current)');
  run("answer(current.choices.find(c=>c!==current.answer),document.getElementById('answers').children.find(b=>b.dataset.choice!==current.answer))");
  before=run('JSON.stringify(current)');
  const checkpoint=saved['learning-planet-session-v1-'+mode];
  run('current=null;attempted=new Set;stars=7;adventureActive=false');
  run('restoreSession()');assert.equal(run('JSON.stringify(current)'),before);assert.equal(run('attempted.size'),1);assert.equal(run('stars'),0);
  assert.equal(run('cooldown'),true);flush();
  run("answer(current.answer,document.getElementById('answers').children.find(b=>b.dataset.choice===current.answer))");
  assert.equal(run('stars'),0);run('restoreSession()');assert.equal(run('locked'),true);
  run("answer(current.answer,document.getElementById('answers').children.find(b=>b.dataset.choice===current.answer))");assert.equal(run('stars'),0);
  run('advance()');assert.equal(run('round'),1);assert.equal(run('attempted.size'),0);
  if(mode==='english')assert.equal(run('new Set(current.choices).size'),4);
  run('round=7;pendingAdvance=true;advance()');assert.equal(run('wrongQuestions.length'),1);
  const oldUnlocks=run('JSON.stringify(unlocks)'),oldStars=run('stars');
  run('reviewButton.onclick()');assert.equal(run('reviewMode'),true);assert.notEqual(run('current.display'),JSON.parse(before).display);
  run('restoreSession()');assert.equal(run('reviewMode'),true);
  if(run('previewing'))run('memoryButton.onclick()');
  run("answer(current.answer,document.getElementById('answers').children.find(b=>b.dataset.choice===current.answer));advance()");
  assert.equal(run('stars'),oldStars);assert.equal(run('JSON.stringify(unlocks)'),oldUnlocks);assert.equal(run('readSession()'),null);
}
run("subject='focus';level=4;begin();memoryButton.onclick();restoreSession()");
assert.equal(run('previewing'),false);assert.equal(get('display').textContent,'剛才背包裡的圖案順序是？');
run('pauseButton.onclick();exitButton.onclick()');assert.equal(run('adventureActive'),false);assert.ok(run('readSession()'));run('savedButton.onclick()');assert.equal(run('adventureActive'),true);
saved['learning-planet-session-v1-focus']='{bad json';assert.equal(run('readSession()'),null);
console.log('PASS: save/restore all subjects, wrong-answer persistence, cooldown, locked answers, review without rewards, memory hiding, exit/resume, corrupt saves.');
