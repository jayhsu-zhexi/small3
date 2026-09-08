const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const moduleBox={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/board-engine.js','utf8'),{module:moduleBox});
const E=moduleBox.exports,bank=require('./export-board-bank.cjs').exportBank();
const copy=x=>JSON.parse(JSON.stringify(x));
const act=(s,a,rng=()=>0)=>E.act(s,a,bank,rng,1800000000000);
function land(index){let s=E.create('cat',1800000000000);s.position=(index+23)%24;return act(s,{type:'roll'});}
function solve(state){let s=state,t=s.task;
  if(t.kind==='money'){for(let i=0;i<t.answer;i++)s=act(s,{type:'coin',coin:1,delta:1});return act(s,{type:'answer'});}
  if(t.kind==='memory'){s=act(s,{type:'conceal'});for(const dir of t.answer)s=act(s,{type:'direction',value:dir});return act(s,{type:'answer'});}
  return act(s,{type:'answer',value:t.answer});
}
assert.equal(E.TYPES.length,24);
for(let index=0;index<24;index++){
  const state=land(index);assert.ok(E.validState(state));assert.equal(state.position,index);assert.equal(state.turn,1);
  assert.equal(act(state,{type:'roll'}),state,'Cannot roll through a pending task');
  const done=state.phase==='task'?solve(state):act(state,{type:'claim'});
  assert.equal(done.phase,'reward');assert.ok(done.supplies>=1);assert.ok(E.validState(done));
  assert.equal(act(done,{type:'claim'}),done,'Cannot claim an event twice');
  assert.equal(act(done,{type:'answer',value:done.task?.answer}),done,'Cannot duplicate learning rewards');
  assert.equal(act(done,{type:'continue'}).phase,'ready');
}
for(const subject of ['math','chinese','english','focus'])for(const mode of ['independent','hint','retry','demo']){
  let s=land(E.TYPES.indexOf(subject));
  if(mode==='hint')s=act(s,{type:'hint'});
  if(mode==='retry'){
    if(subject==='focus'){s=act(s,{type:'conceal'});s=act(s,{type:'direction',value:'→'});}
    s=act(s,{type:'answer',value:s.task.kind==='choice'?s.task.choices.find(c=>c!==s.task.answer):undefined});
    assert.equal(s.task.attempts,1);
  }
  s=mode==='demo'?act(s,{type:'demo'}):solve(s);
  assert.equal(s.events[0].mode,mode);assert.equal(s.supplies,2);assert.equal(s.stars,mode==='independent'?1:0);
  assert.ok(E.validState(copy(s)));const h=E.archive(null,s);
  assert.equal(E.archive(h,s).events.length,1,'Reloading must not duplicate records');
}
let memory=land(5);const initial=memory;
assert.equal(act(memory,{type:'answer'}),initial,'Must conceal memory before answering');
memory=act(memory,{type:'conceal'});memory=act(memory,{type:'direction',value:'↑'});memory=copy(memory);
assert.equal(memory.input.sequence.length,1);assert.equal(memory.task.concealed,true);
memory=act(memory,{type:'hint'});assert.equal(memory.input.sequence.length,0);assert.equal(memory.task.concealed,false);assert.equal(memory.task.hintUsed,true);
let money=land(1);money=act(money,{type:'coin',coin:1,delta:-1});assert.equal(money.input.coins[1],0);
assert.equal(act(money,{type:'coin',coin:100,delta:1}),money);
console.log('PASS: all 24 cells resolve, all four subjects distinguish independent/hint/retry/demo, rewards cannot duplicate, and memory/input states survive reload.');

let seed=42;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let game=0;game<40;game++){
  let s=E.create(['cat','rabbit','bear'][game%3],1800000000000+game);
  for(let turn=1;turn<=12;turn++){
    const from=s.position;s=act(s,{type:'roll'},rng);assert.equal(s.position,(from+s.dice)%24);assert.equal(s.turn,turn);
    s=copy(s);assert.ok(E.validState(s));
    s=s.phase==='task'?solve(s):act(s,{type:'claim'});
    if(s.supplies>=4&&s.baseLevel<3)s=act(s,{type:'upgrade',style:['space','tree','pets'][game%3]});
    s=act(s,{type:'continue'});assert.ok(E.validState(s));
  }
  assert.equal(s.phase,'finished');assert.equal(act(s,{type:'roll'},rng),s);assert.ok(s.baseLevel>=2);
  const h=E.archive(E.archive(null,s),s);assert.equal(h.games.length,1);assert.equal(h.events.length,s.events.length);assert.ok(E.validHistory(h));
}
let upgraded=E.create();upgraded.supplies=12;for(let i=0;i<3;i++)upgraded=act(upgraded,{type:'upgrade',style:'tree'});
assert.equal(upgraded.baseLevel,3);assert.equal(upgraded.supplies,0);assert.equal(act(upgraded,{type:'upgrade',style:'pets'}),upgraded);
for(const invalid of [null,{}, {...E.create(),turn:99},{...E.create(),position:-1},{...E.create(),phase:'task'},{...E.create(),phase:'finished'},{...E.create(),input:{coins:{'1':-1},sequence:[]}}])assert.equal(E.validState(invalid),false);
console.log('PASS: 40 complete seeded journeys wrap around the board, finish at exactly 12 rolls, preserve all rewards, cap upgrades, and reject malformed saves.');

const backupModule={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/backup.js','utf8'),{module:backupModule,window:{PlanetBoard:E}});
const B=backupModule.exports;
function storage(values={}){return {values,getItem:k=>values[k]??null,setItem:(k,v)=>{values[k]=v;},removeItem:k=>{delete values[k];}};}
const original=storage({[E.KEY]:JSON.stringify(memory),[E.HISTORY_KEY]:JSON.stringify(E.archive(null,solve(land(1)))),'unrelated':'keep'});
const b=B.parse(JSON.stringify(B.capture(original))),destination=storage();B.restore(destination,b);
assert.equal(destination.values[E.KEY],original.values[E.KEY]);assert.equal(destination.values[E.HISTORY_KEY],original.values[E.HISTORY_KEY]);
const legacy=copy(b);legacy.version=1;delete legacy.entries[E.KEY];delete legacy.entries[E.HISTORY_KEY];
B.restore(destination,legacy);assert.equal(destination.values[E.KEY],original.values[E.KEY],'Legacy backups preserve the newer board game');
const invalid=copy(b);invalid.entries[E.KEY]='{"version":1}';const previous=JSON.stringify(destination.values);
assert.throws(()=>B.restore(destination,invalid));assert.equal(JSON.stringify(destination.values),previous);
console.log('PASS: backups include board position, hidden memory and parent history; version-1 backups preserve board data; invalid imported board states never overwrite progress.');
