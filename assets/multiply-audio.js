(function(root){'use strict';
function create(env=root){let context=null,voices=[],generation=0,disposed=false;const clips=new Map(),sources={correct:'/assets/multiply-correct-voice-v2.mp3',wrong:'/assets/multiply-wrong-voice-v1.wav'};
  function stop(){generation++;for(const clip of clips.values()){clip.onplaying=null;clip.onerror=null;try{clip.pause();clip.currentTime=0}catch{}}for(const voice of voices){try{voice.stop();voice.disconnect()}catch{}}voices=[];}
  function play(kind){if(disposed||!['correct','wrong'].includes(kind))return;stop();const ticket=generation;let fallingBack=false;
    const fallback=()=>{if(fallingBack||disposed||ticket!==generation)return;fallingBack=true;const clip=clips.get(kind);if(clip){clip.onerror=null;try{clip.pause()}catch{}}tone(kind,ticket)};
    try{if(typeof env.Audio==='function'){let clip=clips.get(kind);if(!clip){clip=new env.Audio(sources[kind]);clip.preload='auto';clip.volume=.9;clips.set(kind,clip)}clip.onplaying=()=>{if(disposed||ticket!==generation){try{clip.pause()}catch{}}};clip.onerror=fallback;const pending=clip.play();if(pending&&typeof pending.catch==='function')pending.catch(fallback);return}}catch{}fallback();
  }
  function tone(kind,ticket){try{const C=env.AudioContext||env.webkitAudioContext;if(!C)return;if(!context)context=new C();const ctx=context;
    const schedule=()=>{if(disposed||ticket!==generation||ctx.state!=='running')return;const start=ctx.currentTime;const notes=kind==='correct'?[[523.25,0,.12],[659.25,.10,.12],[783.99,.20,.22]]:[[293.66,0,.10],[246.94,.10,.16]];
      for(const [frequency,offset,duration] of notes){const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start+offset);gain.gain.setValueAtTime(0,start+offset);gain.gain.linearRampToValueAtTime(.10,start+offset+.012);gain.gain.exponentialRampToValueAtTime(.001,start+offset+duration);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();voices=voices.filter(v=>v!==oscillator)};voices.push(oscillator);oscillator.start(start+offset);oscillator.stop(start+offset+duration+.015);}
    };if(ctx.state==='suspended')Promise.resolve(ctx.resume()).then(schedule).catch(()=>{});else schedule();
  }catch{stop();}}
  function dispose(){stop();disposed=true;clips.clear();try{Promise.resolve(context?.close()).catch(()=>{})}catch{}context=null;}
  return {play,stop,dispose};
}
if(typeof module!=='undefined')module.exports={create};else root.MultiplyAudio={create};
})(typeof globalThis!=='undefined'?globalThis:this);
