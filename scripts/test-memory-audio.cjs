const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function bootAudio({delayedResume=false,unsupported=false}={}){
  const timers=new Map(),notes=[],instances=[];let now=0,id=0,resumePending,message='';
  function parameter(log){return {setValueAtTime(value,at){log.push({kind:'set',value,at})},exponentialRampToValueAtTime(value,at){log.push({kind:'ramp',value,at})}};}
  class AudioContext{
    constructor(){this.state=delayedResume?'suspended':'running';this.destination={};instances.push(this);}
    get currentTime(){return now/1000;}
    resume(){if(delayedResume)return new Promise(resolve=>{resumePending=()=>{this.state='running';resolve();}});this.state='running';return Promise.resolve();}
    suspend(){this.state='suspended';return Promise.resolve();}
    close(){this.state='closed';return Promise.resolve();}
    createOscillator(){const n={frequencies:[],gains:[],disconnected:false};notes.push(n);return n.osc={frequency:parameter(n.frequencies),connect(gain){n.gains= gain.log;},disconnect(){n.disconnected=true;},start(at){n.at=at;n.type=this.type;},stop(at=now/1000){n.end=at;}};}
    createGain(){const log=[];return {log,gain:parameter(log),connect(){},disconnect(){}};}
  }
  const box={exports:{}},root={setTimeout(fn,delay){const key=++id;timers.set(key,{fn,at:now+delay});return key;},clearTimeout(key){timers.delete(key);}};
  if(!unsupported)root.AudioContext=AudioContext;
  vm.runInNewContext(fs.readFileSync('assets/memory-audio.js','utf8'),{window:root,module:box});
  const sound=box.exports.create(value=>{message=value;});
  return {sound,notes,timers,instances,get message(){return message;},resume(){resumePending();},run(ms){const end=now+ms;while(now<end){now=Math.min(end,now+20);for(const [key,t] of [...timers])if(t.at<=now){timers.delete(key);t.fn();}for(const n of notes)if(!n.disconnected&&n.end<=now/1000)n.osc.onended?.();}}};
}
(async()=>{
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
  const late=bootAudio({delayedResume:true}),pending=late.sound.startMusic();late.sound.suspend();late.resume();await pending;assert.equal(late.timers.size,0,'An old resume promise cannot restart music after pausing');assert.equal(late.instances[0].state,'suspended');late.sound.dispose();
  const unavailable=bootAudio({unsupported:true});await unavailable.sound.startMusic();assert.match(unavailable.message,/無法播放/);assert.equal(unavailable.timers.size,0);
  for(const kind of ['launch','won','lost']){const cue=bootAudio();await cue.sound.activate();cue.sound.play(kind);assert.ok(cue.notes.length>0);assert.ok(cue.notes.some(n=>n.end>1.5),'Cinematic cue accompanies the scene');assert.equal(cue.timers.size,0,'A one-shot cue must not create a loop');cue.sound.setEnabled(false);assert.ok(cue.notes.every(n=>n.disconnected),'Mute immediately silences even queued ending notes');cue.sound.setEnabled(true);cue.sound.play(kind);cue.sound.suspend();assert.ok(cue.notes.every(n=>n.disconnected),'Skipping or restarting releases the cinematic tail');cue.sound.dispose();}
  const musicOnly=bootAudio({delayedResume:true});musicOnly.sound.setEnabled(false);const unlock=musicOnly.sound.activate();assert.equal(musicOnly.instances.length,1,'Launch interaction unlocks music even when effects are muted');musicOnly.resume();await unlock;musicOnly.sound.play('launch');assert.equal(musicOnly.notes.length,0);await musicOnly.sound.startMusic(true);assert.ok(musicOnly.notes.length>0);musicOnly.sound.dispose();
  console.log('PASS: original space music has one scheduler, independent sound/music mute, faster countdown, clean pause/end/disposal, no late-resume race, and distinct energy/error synth cues.');
})().catch(error=>{console.error(error);process.exitCode=1;});
