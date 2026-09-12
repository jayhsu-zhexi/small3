const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function bootAudio({delayedResume=false,unsupported=false,initialState='running',resumeFails=false,staysBlocked=false,audioSession}={}){
  const timers=new Map(),notes=[],instances=[],statuses=[];let now=0,id=0,resumePending,message='';
  function parameter(log){return {setValueAtTime(value,at){log.push({kind:'set',value,at})},exponentialRampToValueAtTime(value,at){log.push({kind:'ramp',value,at})}};}
  class AudioContext{
    constructor(){this.state=delayedResume?'suspended':initialState;this.destination={};this.resumeCalls=0;this.sessionType=audioSession?.type;instances.push(this);}
    get currentTime(){return now/1000;}
    resume(){this.resumeCalls++;if(resumeFails)return Promise.reject(Error('blocked'));if(delayedResume)return new Promise(resolve=>{resumePending=()=>{this.state='running';resolve();}});if(!staysBlocked)this.state='running';return Promise.resolve();}
    suspend(){this.state='suspended';return Promise.resolve();}
    close(){this.state='closed';return Promise.resolve();}
    createOscillator(){const n={frequencies:[],gains:[],disconnected:false};notes.push(n);return n.osc={frequency:parameter(n.frequencies),connect(gain){n.gains= gain.log;},disconnect(){n.disconnected=true;},start(at){n.at=at;n.type=this.type;},stop(at=now/1000){n.end=at;}};}
    createGain(){const log=[];return {log,gain:parameter(log),connect(){},disconnect(){}};}
  }
  const box={exports:{}},root={setTimeout(fn,delay){const key=++id;timers.set(key,{fn,at:now+delay});return key;},clearTimeout(key){timers.delete(key);}};
  if(!unsupported)root.AudioContext=AudioContext;
  if(audioSession)root.navigator={audioSession};
  vm.runInNewContext(fs.readFileSync('assets/memory-audio.js','utf8'),{window:root,module:box});
  const sound=box.exports.create(value=>{message=value;},value=>statuses.push(value));
  return {sound,notes,timers,instances,statuses,get message(){return message;},resume(){resumePending();},run(ms){const end=now+ms;while(now<end){now=Math.min(end,now+20);for(const [key,t] of [...timers])if(t.at<=now){timers.delete(key);t.fn();}for(const n of notes)if(!n.disconnected&&n.end<=now/1000)n.osc.onended?.();}}};
}
(async()=>{
  const ipad=bootAudio({initialState:'interrupted',audioSession:{type:'ambient'}});
  assert.equal(await ipad.sound.test(),true);assert.equal(ipad.instances[0].resumeCalls,1);assert.equal(ipad.instances[0].sessionType,'playback','Playback policy is set before constructing the iPad context');assert.equal(ipad.notes.length,2);assert.equal(ipad.timers.size,0,'Home test does not start background music');assert.match(ipad.statuses.at(-1),/若沒聽到/);
  ipad.sound.stopEffects();assert.ok(ipad.notes.every(n=>n.disconnected));assert.equal(ipad.instances[0].state,'running','Ending launch effects preserves the unlocked context');await ipad.sound.startMusic();assert.equal(ipad.instances[0].resumeCalls,1);
  ipad.instances[0].state='interrupted';ipad.instances[0].onstatechange();assert.equal(ipad.timers.size,0);assert.match(ipad.message,/中斷/);await ipad.sound.test();assert.equal(ipad.instances[0].resumeCalls,2);ipad.sound.dispose();
  const policyFallback=bootAudio({audioSession:{get type(){return 'ambient'},set type(value){throw Error('unsupported')}}});assert.equal(await policyFallback.sound.test(),true);policyFallback.sound.dispose();
  for(const options of [{resumeFails:true},{staysBlocked:true}]){const blocked=bootAudio({initialState:'suspended',...options});assert.equal(await blocked.sound.test(),false);assert.equal(blocked.notes.length,0);assert.equal(blocked.timers.size,0);assert.match(blocked.message,/重試/);blocked.sound.dispose();}
  const hanging=bootAudio({delayedResume:true}),testPending=hanging.sound.test();hanging.run(3001);assert.equal(await testPending,false);assert.match(hanging.message,/重試/);assert.equal(hanging.notes.length,0);hanging.resume();await Promise.resolve();assert.equal(hanging.notes.length,0,'Late unlock cannot play an expired test');assert.equal(await hanging.sound.test(),true);hanging.sound.dispose();
  for(const cancel of ['suspend','dispose']){const canceled=bootAudio({delayedResume:true}),p=canceled.sound.test();canceled.sound[cancel]();canceled.resume();assert.equal(await p,false);assert.equal(canceled.notes.length,0);assert.equal(canceled.timers.size,0);}
  const mutedTest=bootAudio();mutedTest.sound.setEnabled(false);assert.equal(await mutedTest.sound.test(),false);assert.equal(mutedTest.instances.length,0);
  const retry=bootAudio({delayedResume:true}),oldAttempt=retry.sound.test();retry.instances[0].state='running';assert.equal(await retry.sound.test(),true);retry.run(3001);assert.equal(await oldAttempt,false);assert.equal(retry.message,'','An older timeout cannot overwrite a successful retry');const retryNotes=retry.notes.length;retry.sound.play('flip');assert.ok(retry.notes.length>retryNotes);retry.sound.dispose();
  const a=bootAudio(),s=a.sound;
  assert.equal(a.instances.length,0,'No audio context before interaction');
  await s.activate();assert.equal(a.timers.size,0,'The home screen does not start music');
  s.play('match');assert.ok(a.notes.some(n=>n.frequencies.some(f=>f.kind==='ramp'&&f.value>n.frequencies[0].value)),'Successful link has an ascending energy sweep');
  const beforeMiss=a.notes.length;s.play('miss');assert.ok(a.notes.slice(beforeMiss).some(n=>n.frequencies.some(f=>f.kind==='ramp'&&f.value<n.frequencies[0].value)),'Mismatch has a descending signal-error sweep');
  for(const kind of ['flip','won','lost'])s.play(kind);
  await s.startMusic(true);assert.equal(a.timers.size,1);
  await s.startMusic();await s.activate();assert.equal(a.timers.size,1,'Repeated activation cannot layer music schedulers');
  s.setEnabled(false);const mutedAt=a.notes.length;s.play('match');assert.equal(a.notes.length,mutedAt);a.run(1000);assert.ok(a.notes.length>mutedAt,'Music continues when effects are muted');
  s.setMusic(false);assert.equal(a.timers.size,0);assert.ok(a.notes.every(n=>n.disconnected),'Muting both channels releases existing voices');
  s.setEnabled(true);s.play('flip');assert.ok(a.notes.length>mutedAt);assert.equal(a.timers.size,0,'Effects can play with music muted');
  s.setMusic(true);assert.equal(a.timers.size,1);s.suspend();assert.equal(a.timers.size,0);assert.equal(a.instances[0].state,'suspended');assert.ok(a.notes.every(n=>n.disconnected));
  s.setMusic(true);assert.equal(a.timers.size,0,'A toggle cannot resume paused music');
  await s.startMusic();assert.equal(a.timers.size,1);assert.equal(a.instances.length,1);
  s.stopMusic();assert.equal(a.timers.size,0);const endedAt=a.notes.length;s.play('won');assert.ok(a.notes.length>endedAt,'Mission ending stops the loop and preserves the result cue');
  s.dispose();assert.equal(a.timers.size,0);assert.equal(a.instances[0].state,'closed');assert.ok(a.notes.every(n=>n.disconnected));
  const slow=bootAudio(),urgent=bootAudio();await slow.sound.startMusic(true);await urgent.sound.startMusic(true);urgent.sound.setTension(1);slow.run(3000);urgent.run(3000);assert.ok(urgent.notes.length>slow.notes.length,'Final countdown adds pace and rhythmic detail');slow.sound.dispose();urgent.sound.dispose();
  const balance=bootAudio();await balance.sound.startMusic(true);balance.run(4000);
  const peak=note=>Math.max(...note.gains.map(point=>point.value));
  assert.ok(balance.notes.some(note=>peak(note)>.03),'Music melody must have enough gain to remain audible');
  assert.ok(balance.notes.some(note=>note.type==='triangle'&&note.frequencies[0].value>230&&note.frequencies[0].value<300&&peak(note)>.015),'Bass rhythm has an audible midrange layer for small speakers');
  for(const note of balance.notes){const overlapping=balance.notes.filter(other=>other.at<=note.at&&other.end>note.at);assert.ok(overlapping.reduce((sum,other)=>sum+peak(other),0)<.3,'Conservative summed music peaks leave headroom for effects');}
  balance.sound.stopMusic();const effectStart=balance.notes.length;balance.sound.play('flip');assert.equal(peak(balance.notes[effectStart]),.022,'Music boost must not amplify the flip effect');balance.sound.dispose();
  const late=bootAudio({delayedResume:true}),pending=late.sound.startMusic();late.sound.suspend();late.resume();await pending;assert.equal(late.timers.size,0,'An old resume promise cannot restart music after pausing');assert.equal(late.instances[0].state,'suspended');late.sound.dispose();
  const unavailable=bootAudio({unsupported:true});await unavailable.sound.startMusic();assert.match(unavailable.message,/無法播放/);assert.equal(unavailable.timers.size,0);
  for(const kind of ['launch','won','lost']){const cue=bootAudio();await cue.sound.activate();cue.sound.play(kind);assert.ok(cue.notes.length>0);assert.ok(cue.notes.some(n=>n.end>1.5),'Cinematic cue accompanies the scene');assert.equal(cue.timers.size,0,'A one-shot cue must not create a loop');cue.sound.setEnabled(false);assert.ok(cue.notes.every(n=>n.disconnected),'Mute immediately silences even queued ending notes');cue.sound.setEnabled(true);cue.sound.play(kind);cue.sound.suspend();assert.ok(cue.notes.every(n=>n.disconnected),'Skipping or restarting releases the cinematic tail');cue.sound.dispose();}
  const musicOnly=bootAudio({delayedResume:true});musicOnly.sound.setEnabled(false);const unlock=musicOnly.sound.activate();assert.equal(musicOnly.instances.length,1,'Launch interaction unlocks music even when effects are muted');musicOnly.resume();await unlock;musicOnly.sound.play('launch');assert.equal(musicOnly.notes.length,0);await musicOnly.sound.startMusic(true);assert.ok(musicOnly.notes.length>0);musicOnly.sound.dispose();
  console.log('PASS: original space music has one scheduler, independent sound/music mute, faster countdown, clean pause/end/disposal, no late-resume race, and distinct energy/error synth cues.');
})().catch(error=>{console.error(error);process.exitCode=1;});
