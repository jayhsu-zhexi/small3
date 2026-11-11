(function(root){'use strict';
const words=['one','two','three','four','five','six','seven','eight','nine','ten'];
function create(env=root,onStatus=()=>{}){let clip=null,timer=null,generation=0,disposed=false;
 function stop(){generation++;if(timer!==null){env.clearTimeout(timer);timer=null;}if(clip){clip.onended=clip.onerror=clip.onplaying=null;try{clip.pause();clip.currentTime=0;}catch{}clip=null;}onStatus('idle');}
 function play(n,slow=false){if(disposed||!Number.isInteger(n)||!words[n-1])return false;stop();const ticket=generation;let finished=false;
  const finish=status=>{if(disposed||ticket!==generation||finished)return;finished=true;if(timer!==null){env.clearTimeout(timer);timer=null;}if(clip){clip.onended=clip.onerror=clip.onplaying=null;try{clip.pause();}catch{}}onStatus(status);};
  onStatus('loading');try{clip=new env.Audio('/assets/vocabulary-audio/'+words[n-1]+'.wav');clip.preload='auto';clip.playbackRate=slow?.75:1;clip.preservesPitch=true;
   clip.onplaying=()=>{if(disposed||ticket!==generation)return;onStatus('playing');};clip.onended=()=>finish('ended');clip.onerror=()=>finish('error');
   timer=env.setTimeout(()=>finish('error'),12000);const pending=clip.play();if(pending&&typeof pending.catch==='function')pending.catch(()=>finish('error'));return true;
  }catch{finish('error');return false;}
 }
 function dispose(){stop();disposed=true;}
 return {play,stop,dispose};
}
if(typeof module!=='undefined')module.exports={create};else root.NumberBakeryAudio={create};
})(typeof globalThis!=='undefined'?globalThis:this);
