const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element(){
  const classes = new Set();
  return {children:[],dataset:{},style:{},textContent:'',disabled:false,
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
