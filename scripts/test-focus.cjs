const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element(){
  const classes = new Set();
  return {children:[],dataset:{},style:{},textContent:'',disabled:false,parentElement:{after(){}},
    classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x)},contains:x=>classes.has(x)},
    appendChild(x){this.children.push(x)},after(){},before(){},setAttribute(){},
    set innerHTML(value){this.children=[]},get innerHTML(){return ''}};
}
const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
let timers=[];const saved={};
const context=vm.createContext({console,Math,Set,document:{getElementById:get,createElement:element,querySelectorAll:s=>s==='.answer'?get('answers').children:[]},localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout:()=>{},window:{}});
const html=fs.readFileSync('index.html','utf8');
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const run=code=>vm.runInContext(code,context);
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
      const q=run(`round=${r};chineseChallenge()`);
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
