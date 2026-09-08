const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let contexts=0,tones=0,closed=0;const timers=new Set();
class Context {
  constructor(){contexts++;this.state='running';this.currentTime=0;this.destination={};}
  createOscillator(){return {type:'sine',frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){tones++},stop(){}};}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  async resume(){this.state='running'}async suspend(){this.state='suspended'}async close(){closed++;this.state='closed'}
}
const window={AudioContext:Context,setInterval(fn){timers.add(fn);return fn},clearInterval(fn){timers.delete(fn)}};
vm.runInNewContext(fs.readFileSync('assets/board-audio.js','utf8'),{window});
(async()=>{
  const audio=window.PlanetBoardAudio.createAudio();await audio.activate();assert.equal(contexts,0,'No sound context before opting in');
  audio.setEffects(true);await audio.activate();audio.effect('step');assert.equal(tones,1);
  audio.setEffects(false);audio.effect('reward');assert.equal(tones,1,'Muted effects create no notes');
  audio.setMusic(true);await audio.activate();await audio.activate();assert.equal(timers.size,1);assert.equal(contexts,1);
  const before=tones;[...timers][0]();assert.ok(tones>before);
  audio.setMusic(false);assert.equal(timers.size,0);audio.setMusic(true);assert.equal(timers.size,1);
  audio.suspend();assert.equal(timers.size,0);await audio.activate();assert.equal(timers.size,1);
  audio.dispose();assert.equal(timers.size,0);assert.equal(closed,1);
  const unsupported={setInterval(){},clearInterval(){}};vm.runInNewContext(fs.readFileSync('assets/board-audio.js','utf8'),{window:unsupported});
  let message='';const fallback=unsupported.PlanetBoardAudio.createAudio(text=>{message=text});fallback.setEffects(true);await fallback.activate();assert.match(message,/仍可繼續遊戲/);
  console.log('PASS: audio is opt-in, effects mute, music never duplicates timers, tab suspension/disposal releases playback, and unsupported browsers degrade safely.');
})().catch(error=>{console.error(error);process.exitCode=1});
