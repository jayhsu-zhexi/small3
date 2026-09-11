(function(root){
  'use strict';
  function create(onError=()=>{}){let context=null,enabled=true;
    async function activate(){if(!enabled)return;try{const Context=root.AudioContext||root.webkitAudioContext;if(!Context)throw Error();if(!context)context=new Context();if(context.state==='suspended')await context.resume();}catch{onError('目前無法播放音效，仍可繼續遊戲。');}}
    function tone(hz,start,duration,volume=.035,type='sine'){if(!enabled||!context||context.state!=='running')return;const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime+start;osc.type=type;osc.frequency.setValueAtTime(hz,at);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+duration+.03);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
    function play(kind){if(kind==='flip'){tone(480,0,.065,.022,'triangle');tone(720,.04,.05,.018);}if(kind==='match')[523,659,880].forEach((hz,i)=>tone(hz,i*.07,.23));if(kind==='miss'){tone(190,0,.17,.025,'triangle');tone(130,.1,.22,.02,'triangle');}if(kind==='won')[523,659,784,1047].forEach((hz,i)=>tone(hz,i*.13,.5));if(kind==='lost')[392,294,196].forEach((hz,i)=>tone(hz,i*.18,.42,.03,'triangle'));}
    function suspend(){if(context&&context.state==='running')Promise.resolve(context.suspend()).catch(()=>{});}
    function dispose(){if(context){Promise.resolve(context.close()).catch(()=>{});context=null;}}
    return {activate,play,suspend,dispose,setEnabled(value){enabled=!!value;if(!enabled)suspend();else activate();}};
  }
  const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitAudio=api;
})(typeof window==='undefined'?{}:window);
