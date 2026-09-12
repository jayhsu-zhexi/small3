const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const recordsModule={exports:{}};vm.runInNewContext(fs.readFileSync('assets/memory-records.js','utf8'),{module:recordsModule});const R=recordsModule.exports;
function storage(initial=[]){const values=new Map(initial);return {values,getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};}
function mission({size=16,pairs=size/2,attempts=pairs,phase='won'}={}){return {size,matched:Array.from({length:pairs*2},(_,i)=>i),flips:attempts*2,attempts,phase,score:pairs*100,bestCombo:pairs};}

const device=storage(),store=R.create(()=>device);
const newest=R.create(()=>storage());newest.savePreferences({size:108,duration:540,manualTime:false});assert.equal(newest.loadPreferences().size,108);for(let size=108;size<=120;size+=2)assert.equal(newest.record(mission({size}),600).persisted,true);assert.equal(newest.record(mission({size:40}),270).persisted,true);assert.equal(R.create(()=>storage([[R.PREFS_KEY,JSON.stringify({size:40,duration:270})]])).loadPreferences().size,16);
const highLevel=R.create(()=>storage());highLevel.savePreferences({size:74,duration:420,manualTime:false});assert.equal(highLevel.loadPreferences().size,74);for(const size of [74,76,78,80,82,84])assert.equal(highLevel.record(mission({size}),450).persisted,true);assert.equal(highLevel.record(mission({size:24}),210).persisted,true,'Removed level history remains valid');
assert.equal(R.create(()=>storage([[R.PREFS_KEY,JSON.stringify({size:24,duration:210})]])).loadPreferences().size,16,'An old removed selection falls back to an available level');
assert.deepEqual({...store.loadPreferences()},{size:16,duration:180,manualTime:false,music:true,sound:true});
for(const duration of [180,210,570,600,null]){
  store.savePreferences({size:52,duration,music:false,sound:false});
  assert.deepEqual({...R.create(()=>device).loadPreferences()},{size:52,duration,manualTime:duration!==300,music:false,sound:false});
}
for(const value of [null,[],true,'bad',{size:'52',duration:'300',music:0,sound:'false'}]){
  const source=storage([[R.PREFS_KEY,JSON.stringify(value)]]);
  assert.deepEqual({...R.create(()=>source).loadPreferences()},{size:16,duration:180,manualTime:false,music:true,sound:true});
}
for(const duration of [0,179,181,601]){
  const source=storage([[R.PREFS_KEY,JSON.stringify({size:24,duration})]]);
  assert.equal(R.create(()=>source).loadPreferences().duration,180);
}
assert.equal(R.create(()=>storage([[R.PREFS_KEY,'{broken']])).loadPreferences().duration,180);
const blocked=R.create(()=>{throw Error('No device storage');});
assert.equal(blocked.savePreferences({size:40,duration:270,music:false,sound:true}),false);
assert.equal(blocked.loadPreferences().music,false,'Settings still work in this page when storage is unavailable');
assert.equal(blocked.record(mission(),180).persisted,false);
assert.ok(blocked.record(mission(),180).previous,'Page-local progress remains usable without device storage');

const past=storage(),history=R.create(()=>past);
let result=history.record(mission({attempts:12}),180);
assert.equal(result.previous,null);assert.match(result.feedback.title,/第一份/);
history.record(mission({size:24}),180);history.record(mission({attempts:20}),600);history.record(mission({attempts:18}),null);
result=history.record(mission({attempts:10}),180);
assert.equal(result.previous.attempts,12,'Different deck sizes and time choices do not become comparison baselines');
assert.match(result.feedback.title,/少翻 4 次/);
result=R.create(()=>past).record(mission({attempts:10}),180);
assert.match(result.feedback.detail,/和上次一樣/,'Comparable history survives reload');
assert.equal(R.accuracy(result.current),80);assert.equal(R.accuracy({pairs:0,attempts:0}),null);assert.equal(R.accuracy({pairs:8,attempts:8}),100);
assert.match(history.record(mission({attempts:13}),180).feedback.detail,/多翻 6 次/);
const challenge=R.create(()=>storage());challenge.record(mission({pairs:2,attempts:5,phase:'lost'}),180);
assert.match(challenge.record(mission({pairs:5,attempts:8,phase:'lost'}),180).feedback.title,/多修復 3 組/);
assert.match(challenge.record(mission(),180).feedback.title,/成功救援/);
assert.doesNotMatch(challenge.record(mission({pairs:1,attempts:2,phase:'lost'}),180).feedback.title,/少翻|進步/,'A shorter failed run is never described as a more efficient win');
for(let i=0;i<80;i++)history.record(mission(),180);
assert.equal(JSON.parse(past.values.get(R.HISTORY_KEY)).length,R.LIMIT);
assert.equal(Object.keys(JSON.parse(past.values.get(R.HISTORY_KEY))[0]).sort().join(','),'attempts,bestCombo,duration,flips,outcome,pairs,score,size','History contains only the small mission summary, not card positions');
const malformed=[null,{}, {size:16,duration:180,outcome:'won',pairs:8,flips:2,attempts:1,score:1,bestCombo:8}];
assert.equal(R.create(()=>storage([[R.HISTORY_KEY,JSON.stringify(malformed)]])).record(mission(),180).previous,null);
assert.equal(history.record(mission({phase:'playing'}),180),null,'Interrupted or unfinished missions are not recorded as completed runs');
console.log('PASS: device preferences validate and survive reload; progress is bounded, tolerates unavailable/corrupt storage, and only compares honest outcomes with matching deck/time settings.');
const paddedHistory=R.create(()=>storage());paddedHistory.record(mission({size:40}),300);paddedHistory.record(mission({size:42,attempts:30}),null);
assert.equal(paddedHistory.record(mission({size:42,attempts:25}),300).previous,null,'A 40+ tier does not compare different actual counts or clocks');
assert.equal(paddedHistory.record(mission({size:42,attempts:23}),300).previous.attempts,25);
for(const size of [18,26,28,34,36,42,44,46,54,56,58,60])assert.ok(paddedHistory.record(mission({size}),300));
for(const size of [17,20,30,38,48,50,62])assert.equal(paddedHistory.record(mission({size,pairs:0,attempts:0,phase:'lost'}),300),null);
store.savePreferences({size:52,duration:300,manualTime:true});assert.equal(R.create(()=>device).loadPreferences().manualTime,true);
store.savePreferences({size:52,duration:360,manualTime:false});assert.equal(R.create(()=>device).loadPreferences().manualTime,false);
