(function(root){'use strict';
function create(env=root){let context=null,voices=[],generation=0,disposed=false;
  function stop(){generation++;for(const voice of voices){try{voice.stop();voice.disconnect()}catch{}}voices=[];}
  function play(kind){if(disposed||!['correct','wrong'].includes(kind))return;stop();const ticket=generation;try{const C=env.AudioContext||env.webkitAudioContext;if(!C)return;if(!context)context=new C();const ctx=context;
    const schedule=()=>{if(disposed||ticket!==generation||ctx.state!=='running')return;const start=ctx.currentTime;const notes=kind==='correct'?[[523.25,0,.12],[659.25,.10,.12],[783.99,.20,.22]]:[[293.66,0,.10],[246.94,.10,.16]];
      for(const [frequency,offset,duration] of notes){const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start+offset);gain.gain.setValueAtTime(0,start+offset);gain.gain.linearRampToValueAtTime(.10,start+offset+.012);gain.gain.exponentialRampToValueAtTime(.001,start+offset+duration);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();voices=voices.filter(v=>v!==oscillator)};voices.push(oscillator);oscillator.start(start+offset);oscillator.stop(start+offset+duration+.015);}
    };if(ctx.state==='suspended')Promise.resolve(ctx.resume()).then(schedule).catch(()=>{});else schedule();
  }catch{stop();}}
  function dispose(){stop();disposed=true;try{Promise.resolve(context?.close()).catch(()=>{})}catch{}context=null;}
  return {play,stop,dispose};
}
if(typeof module!=='undefined')module.exports={create};else root.MultiplyAudio={create};
})(typeof globalThis!=='undefined'?globalThis:this);
