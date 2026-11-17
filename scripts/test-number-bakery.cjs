'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const load=file=>{const scope={exports:{}};new Function('module',fs.readFileSync(file,'utf8'))(scope);return scope.exports;};
const E=load('assets/number-bakery-engine.js'),A=load('assets/number-bakery-audio.js');
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function solve(s){const t=E.current(s);if(t.type==='spell'){E.clear(s);for(const i of E.positions(t,s.config)){E.setFocus(s,i);assert.equal(E.put(s,E.word(t.n)[i]),true);}}else E.choose(s,t.n);assert.equal(E.submit(s),'correct');}
for(const range of Object.keys(E.RANGES))for(const mode of ['mixed','listen','read','spell'])for(const level of ['missing','tiles','keyboard'])for(let seed=1;seed<=30;seed++){
 let s=E.create({range,mode,level},random(seed));assert.equal(s.tasks.length,10);assert.deepEqual([...new Set(s.tasks.map(t=>t.n))].sort((a,b)=>a-b),E.RANGES[range]);
 assert.ok(s.tasks.every((t,i)=>i===0||t.n!==s.tasks[i-1].n));if(mode==='mixed')assert.equal(new Set(s.tasks.map(t=>t.type)).size,3);
 for(let i=0;i<10;i++){assert.equal(E.advance(s),false);assert.equal(E.submit(s),'incomplete');assert.equal(s.entry.attempts,0);solve(s);assert.equal(E.submit(s),'locked');assert.equal(E.put(s,'a'),false);assert.equal(E.choose(s,1),false);assert.ok(E.restore(JSON.stringify(s)));E.advance(s);s=E.restore(s);assert.ok(s);}
 assert.equal(s.phase,'result');assert.equal(E.perfect(s),true);assert.equal(E.advance(s),false);assert.deepEqual(E.mistakes(s),[]);
}
let wrong=E.create({mode:'listen'},random(8));const target=E.current(wrong);E.choose(wrong,target.choices.find(n=>n!==target.n));assert.equal(E.submit(wrong),'wrong');wrong=E.restore(JSON.stringify(wrong));assert.equal(wrong.entry.attempts,1);solve(wrong);E.advance(wrong);while(wrong.phase!=='result'){solve(wrong);E.advance(wrong);}assert.equal(E.perfect(wrong),false);assert.deepEqual(E.mistakes(wrong),[target.n]);
const review=E.create(wrong.config,random(3),E.mistakes(wrong));assert.ok(review.tasks.every(t=>t.n===target.n));assert.ok(review.tasks.every(t=>t.choices.length===3));assert.ok(E.restore(review));
const tiles=E.create({mode:'spell',level:'tiles'},random(2),[3]);assert.equal(E.put(tiles,'e'),true);assert.equal(E.put(tiles,'e'),true);assert.equal(E.put(tiles,'e'),false);E.setFocus(tiles,0);assert.equal(E.put(tiles,'e'),true);E.clear(tiles);assert.equal(tiles.entry.draft.join(''),'');solve(tiles);
const editing=E.create({mode:'spell',level:'keyboard'},random(1),[3]);E.put(editing,'T');E.put(editing,'h');E.erase(editing);assert.equal(editing.entry.draft.join(''),'t');assert.equal(editing.entry.focus,1);assert.equal(E.put(editing,'!'),false);
const clean=E.create();for(const mutate of [s=>s.version=2,s=>s.index=10,s=>s.config.range='oops',s=>s.tasks[0].n=11,s=>s.tasks[0].choices=[1,1,1],s=>s.entry.attempts=-1,s=>s.entry.solved=true,s=>s.phase='result',s=>s.results.push({n:1,first:true}),s=>s.entry.draft=['<img>'],s=>s.tasks[0].bank=['<script>']]){const s=structuredClone(clean);mutate(s);assert.equal(E.restore(s),null);}
assert.equal(E.restore('not json'),null);assert.equal(E.restore(' '.repeat(40001)),null);const forged=structuredClone(wrong);forged.results[0].first=true;assert.equal(E.restore(forged),null);
// Matching must accept either selection order, keep positions stable, and survive a reload after every tap.
for(const range of Object.keys(E.RANGES))for(let seed=1;seed<=30;seed++){
 let s=E.create({mode:'match',range},random(seed));assert.equal(s.boards.length,2);assert.equal(E.matchErrors(s),0);assert.equal(E.perfect(s),false,'Zero errors alone cannot finish a round');
 assert.deepEqual([...new Set(s.boards.flatMap(b=>b.left))].sort((a,b)=>a-b),E.RANGES[range]);
 while(s.phase==='playing'){
  const board=s.boards[s.index],positions=JSON.stringify([board.left,board.right]);
  assert.equal(board.left.length,5);assert.equal(new Set(board.left).size,5);assert.notDeepEqual(board.left,board.right);assert.equal(E.advance(s),false);
  for(const [i,n] of board.right.entries()){
   const first=i%2?'right':'left',second=i%2?'left':'right';
   assert.equal(E.selectMatch(s,first,n).status,'selected');s=E.restore(JSON.stringify(s));assert.ok(s);assert.equal(s.selection[first],n);
   assert.equal(E.selectMatch(s,second,n).status,'correct');assert.equal(E.selectMatch(s,first,n).status,'locked');
   s=E.restore(JSON.stringify(s));assert.ok(s);assert.equal(E.matchErrors(s),0);assert.equal(JSON.stringify([s.boards[s.index].left,s.boards[s.index].right]),positions);
  }
  assert.equal(E.matchComplete(s),true);assert.equal(E.advance(s),true);s=E.restore(s);assert.ok(s);
 }
 assert.equal(s.results.length,10);assert.equal(E.perfect(s),true);assert.equal(E.advance(s),false);assert.equal(E.selectMatch(s,'left',1).status,'locked');
}
let matching=E.create({mode:'match'},random(12));const [a,b]=matching.boards[0].left;
E.selectMatch(matching,'left',a);E.selectMatch(matching,'left',a);assert.deepEqual(matching.selection,{left:null,right:null});assert.equal(E.matchErrors(matching),0);
E.selectMatch(matching,'left',a);E.selectMatch(matching,'left',b);assert.equal(matching.selection.left,b,'Changing the same side is not an answer');assert.ok(matching.boards[0].entries.every(e=>e.attempts===0));
assert.equal(E.selectMatch(matching,'right',a).status,'wrong');matching=E.restore(JSON.stringify(matching));assert.ok(matching);assert.equal(matching.results.length,0);assert.equal(E.matchErrors(matching),1,'One wrong pairing counts once, even though two words need review');
assert.equal(E.selectMatch(matching,'right',11).status,'locked');assert.equal(E.selectMatch(matching,'other',a).status,'locked');
while(matching.phase==='playing'){for(const n of matching.boards[matching.index].left){E.selectMatch(matching,'right',n);E.selectMatch(matching,'left',n);}E.advance(matching);}
assert.equal(E.perfect(matching),false);assert.deepEqual(E.mistakes(matching).sort((x,y)=>x-y),[a,b].sort((x,y)=>x-y));assert.equal(E.matchErrors(matching),1);assert.equal(E.matchErrors(E.restore(matching)),1);
const repeated=E.create({mode:'match'},random(7)),[repeatA,repeatB]=repeated.boards[0].left;
for(let error=1;error<=3;error++){E.selectMatch(repeated,'right',repeatA);E.selectMatch(repeated,'left',repeatB);assert.equal(E.matchErrors(repeated),error);assert.equal(E.matchErrors(E.restore(repeated)),error);}
E.selectMatch(repeated,'left',repeatA);E.selectMatch(repeated,'right',repeatA);assert.equal(E.matchErrors(repeated),3,'Correcting a pair preserves the previous error count');
// A saved round from the original preview has per-word attempts, not an error counter.
const legacy=E.create({mode:'match'},random(17)),[legacyA,legacyB]=legacy.boards[0].entries;
legacyA.attempts=2;legacyA.solved=true;legacyB.attempts=1;
legacy.results.push({n:legacyA.n,type:'match',board:0,attempts:2,first:false});
const restoredLegacy=E.restore(JSON.stringify(legacy));assert.ok(restoredLegacy);assert.equal(E.matchErrors(restoredLegacy),1);assert.equal(restoredLegacy.results.length,1);assert.deepEqual(restoredLegacy.boards,legacy.boards);
for(const size of [1,2,3,4,6,7,9,10]){let s=E.create({mode:'match'},random(size),E.RANGES.all.slice(0,size));while(s.phase==='playing'){const board=s.boards[s.index];assert.equal(new Set(board.left).size,board.left.length);assert.ok(board.left.length<=5);for(const n of board.right){E.selectMatch(s,'right',n);E.selectMatch(s,'left',n);}E.advance(s);s=E.restore(s);assert.ok(s);}assert.equal(s.results.length,10);}
const matchingClean=E.create({mode:'match'},random(1));
for(const mutate of [s=>s.index=1,s=>s.boards[0].right[0]=11,s=>s.boards[0].left[1]=s.boards[0].left[0],s=>s.boards[0].entries[0].solved=true,s=>s.boards[0].entries[0].attempts=-1,s=>s.boards[0].entries[0].attempts=1,s=>s.boards[0].entries[0].attempts=2,s=>s.boards[1].entries[0].attempts=1,s=>s.selection={left:s.boards[0].left[0],right:s.boards[0].left[1]},s=>s.selection.left=11,s=>s.results.push({n:1}),s=>s.phase='result',s=>s.boards.pop()]){const s=structuredClone(matchingClean);mutate(s);assert.equal(E.restore(s),null);}
for(const mutate of [s=>s.results[0].first=!s.results[0].first,s=>s.results[0].attempts++,s=>s.results[0].board=1,s=>s.results[1]=s.results[0]]){const s=structuredClone(matching);mutate(s);assert.equal(E.restore(s),null);}
console.log('PASS number matching: 90 randomized full rounds, one count per wrong pairing, zero errors plus completion required for perfect results, legacy saves, both selection orders, stable positions, retries, small review pools, invalid saves and duplicate actions.');
for(const word of E.WORDS)assert.ok(fs.statSync('assets/vocabulary-audio/'+word+'.wav').size>1000);
const clips=[],events=[],timers=new Map();let nextTimer=0;
class FakeAudio{constructor(src){this.src=src;this.paused=false;clips.push(this);}play(){return {catch:fn=>this.reject=fn};}pause(){this.paused=true;}}
const audio=A.create({Audio:FakeAudio,setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;},clearTimeout:id=>timers.delete(id)},s=>events.push(s));
audio.play(3,true);assert.match(clips[0].src,/three.wav$/);assert.equal(clips[0].playbackRate,.75);assert.equal(clips[0].preservesPitch,true);const oldFailure=clips[0].reject;
audio.play(10);assert.equal(clips[0].paused,true);const before=events.length;oldFailure();assert.equal(events.length,before);clips[1].onplaying();assert.equal(events.at(-1),'playing');clips[1].onended();assert.equal(events.at(-1),'ended');assert.equal(timers.size,0);
audio.play(1);clips[2].reject();assert.equal(events.at(-1),'error');assert.equal(clips[2].paused,true);audio.play(2);const timeout=[...timers.values()][0];timeout();assert.equal(events.at(-1),'error');audio.stop();assert.equal(timers.size,0);assert.equal(audio.play(11),false);audio.dispose();assert.equal(audio.play(1),false);
const spellingEvents=[],spelling=A.create({Audio:FakeAudio,setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;},clearTimeout:id=>timers.delete(id)},(status,detail)=>spellingEvents.push({status,detail}));
const clipCount=clips.length;assert.equal(spelling.spell(8),true);assert.equal(clips.length,clipCount+1,'A full word-letter-word sequence uses one audio playback');let activeClip=clips.at(-1);assert.equal(activeClip.src,'/assets/number-bakery-spelling/eight.wav');assert.equal(activeClip.playbackRate,.8);assert.equal(activeClip.preservesPitch,true);activeClip.onplaying();assert.deepEqual(spellingEvents.at(-1),{status:'playing',detail:{word:'eight',spelling:true}});const staleEnd=activeClip.onended,staleFailure=activeClip.reject;spelling.play(1,true);assert.equal(activeClip.paused,true);const eventCount=spellingEvents.length;staleEnd();staleFailure();assert.equal(spellingEvents.length,eventCount);assert.match(clips.at(-1).src,/vocabulary-audio\/one.wav$/);assert.equal(clips.at(-1).playbackRate,.75);
spelling.spell(3);activeClip=clips.at(-1);spelling.stop();assert.equal(activeClip.paused,true);assert.equal(activeClip.currentTime,0);assert.equal(activeClip.onended,null);assert.equal(timers.size,0);spelling.spell(2);clips.at(-1).reject();assert.equal(spellingEvents.at(-1).status,'error');assert.equal(spelling.spell(2),true,'Spelling audio can be retried after failure');clips.at(-1).onended();assert.equal(timers.size,0);assert.equal(spelling.spell(0),false);assert.equal(spelling.spell(1.5),false);spelling.dispose();assert.equal(spelling.spell(1),false);
for(const word of E.WORDS){const wav=fs.readFileSync('assets/number-bakery-spelling/'+word+'.wav');assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');let format,data;for(let offset=12;offset+8<=wav.length;){const size=wav.readUInt32LE(offset+4),chunk=wav.subarray(offset+8,offset+8+size),id=wav.toString('ascii',offset,offset+4);assert.equal(chunk.length,size);if(id==='fmt ')format=chunk;if(id==='data')data=chunk;offset+=8+size+(size%2);}assert.ok(format&&data,word);assert.equal(format.readUInt16LE(0),1);assert.equal(format.readUInt16LE(2),1);assert.equal(format.readUInt32LE(4),22050);assert.equal(format.readUInt16LE(14),16);const seconds=data.length/(22050*2);assert.ok(seconds>3&&seconds<15,word+' duration '+seconds);let audible=0;for(let i=0;i<data.length;i+=2)if(Math.abs(data.readInt16LE(i))>300)audible++;assert.ok(audible/(data.length/2)>.05,word+' must contain audible speech');}
console.log('PASS number bakery: 1,080 randomized rounds, ranges, spelling levels, repeated letters, retries, both results, review, saved state, normal/spelling audio cancellation, failure and retry; all ten spelling WAVs contain PCM speech within the playback limit.');
