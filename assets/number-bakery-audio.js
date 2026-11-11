(function(root){'use strict';
const words=['one','two','three','four','five','six','seven','eight','nine','ten'];
function create(env=root,onStatus=()=>{}){let clip=null,timer=null,generation=0,disposed=false;
 function stop(){generation++;if(timer!==null){env.clearTimeout(timer);timer=null;}if(clip){clip.onended=clip.onerror=clip.onplaying=null;try{clip.pause();clip.currentTime=0;}catch{}clip=null;}onStatus('idle');}
 function start(n,slow,spelling){if(disposed||!Number.isInteger(n)||!words[n-1])return false;stop();const ticket=generation,detail={word:words[n-1],spelling};let finished=false;
  const finish=status=>{if(disposed||ticket!==generation||finished)return;finished=true;if(timer!==null){env.clearTimeout(timer);timer=null;}if(clip){clip.onended=clip.onerror=clip.onplaying=null;try{clip.pause();}catch{}}onStatus(status,detail);};
  onStatus('loading',detail);try{clip=new env.Audio('/assets/'+(spelling?'number-bakery-spelling/':'vocabulary-audio/')+words[n-1]+'.wav');clip.preload='auto';clip.playbackRate=slow?.75:1;clip.preservesPitch=true;
   clip.onplaying=()=>{if(disposed||ticket!==generation||finished)return;onStatus('playing',detail);};clip.onended=()=>finish('ended');clip.onerror=()=>finish('error');
   timer=env.setTimeout(()=>finish('error'),spelling?20000:12000);const pending=clip.play();if(pending&&typeof pending.catch==='function')pending.catch(()=>finish('error'));return true;
  }catch{finish('error');return false;}
 }
 function dispose(){stop();disposed=true;}
 return {play:(n,slow=false)=>start(n,slow,false),spell:n=>start(n,false,true),stop,dispose};
}
if(typeof module!=='undefined')module.exports={create};else root.NumberBakeryAudio={create};
})(typeof globalThis!=='undefined'?globalThis:this);
