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
for(const word of E.WORDS)assert.ok(fs.statSync('assets/vocabulary-audio/'+word+'.wav').size>1000);
const clips=[],events=[],timers=new Map();let nextTimer=0;
class FakeAudio{constructor(src){this.src=src;this.paused=false;clips.push(this);}play(){return {catch:fn=>this.reject=fn};}pause(){this.paused=true;}}
const audio=A.create({Audio:FakeAudio,setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;},clearTimeout:id=>timers.delete(id)},s=>events.push(s));
audio.play(3,true);assert.match(clips[0].src,/three.wav$/);assert.equal(clips[0].playbackRate,.75);assert.equal(clips[0].preservesPitch,true);const oldFailure=clips[0].reject;
audio.play(10);assert.equal(clips[0].paused,true);const before=events.length;oldFailure();assert.equal(events.length,before);clips[1].onplaying();assert.equal(events.at(-1),'playing');clips[1].onended();assert.equal(events.at(-1),'ended');assert.equal(timers.size,0);
audio.play(1);clips[2].reject();assert.equal(events.at(-1),'error');assert.equal(clips[2].paused,true);audio.play(2);const timeout=[...timers.values()][0];timeout();assert.equal(events.at(-1),'error');audio.stop();assert.equal(timers.size,0);assert.equal(audio.play(11),false);audio.dispose();assert.equal(audio.play(1),false);
console.log('PASS number bakery: 1,080 randomized rounds, range coverage, three spelling levels, repeated letters, edits, retry persistence, perfect/normal results, review pool, malformed saves, audio cancellation/failure/timeout and existing WAV assets.');
