(function(root){
  'use strict';
  function create(report=()=>{}){
    let context=null,enabled=true,epoch=0,speechId=0,pending=null;const voices=new Set();
    function stopSpeech(){speechId++;if(pending){root.clearTimeout(pending.timer);pending.resolve(false);pending=null;}try{root.speechSynthesis?.cancel();}catch{}}
    async function unlock(){const ticket=epoch;try{try{if(root.navigator?.audioSession)root.navigator.audioSession.type='playback';}catch{}const C=root.AudioContext||root.webkitAudioContext;if(!C)return false;if(!context||context.state==='closed')context=new C();const c=context;if(c.state!=='running')await c.resume();if(ticket!==epoch){if(c===context)c.suspend().catch(()=>{});return false;}return c.state==='running';}catch{return false;}}
    function tone(hz,delay,duration,gain=.03,slide=0){if(!enabled||context?.state!=='running')return;const osc=context.createOscillator(),volume=context.createGain(),at=context.currentTime+delay;osc.type='triangle';osc.frequency.setValueAtTime(hz,at);if(slide)osc.frequency.exponentialRampToValueAtTime(slide,at+duration);volume.gain.setValueAtTime(.0001,at);volume.gain.exponentialRampToValueAtTime(gain,at+.008);volume.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(volume);volume.connect(context.destination);const voice={osc,volume};voices.add(voice);osc.onended=()=>{osc.disconnect();volume.disconnect();voices.delete(voice);};osc.start(at);osc.stop(at+duration+.03);}
    function effect(kind){if(kind==='tick'){tone(320,0,.045,.022,90);tone(1200,.006,.025,.008);}if(kind==='match')[660,990,1320].forEach((f,i)=>tone(f,i*.07,.2));if(kind==='miss'||kind==='lost'){tone(280,0,.4,.026,90);tone(180,.3,.3,.022,60);}if(kind==='won')[261,392,523,659,784,1046].forEach((f,i)=>tone(f,i*.12,.55,.03));}
    function speak(code){stopSpeech();const token=speechId;return new Promise(resolve=>{
      const synth=root.speechSynthesis,U=root.SpeechSynthesisUtterance;
      if(!synth||!U){report('這個瀏覽器沒有語音功能。可以改用文字練習。');resolve(false);return;}
      try{
        const chinese=['零','一','二','三','四','五','六','七','八','九'];const u=new U(code.map(c=>(c.dir<0?'左':'右')+'，'+chinese[c.steps]).join('。')+'。');
        u.lang='zh-TW';u.rate=.65;u.pitch=.82;u.volume=1;
        const available=synth.getVoices(),voice=available.find(v=>/^zh[-_]TW/i.test(v.lang))||available.find(v=>/^zh/i.test(v.lang));if(voice)u.voice=voice;
        const finish=ok=>{if(token!==speechId||!pending)return;root.clearTimeout(pending.timer);pending=null;if(!ok){speechId++;try{synth.cancel();}catch{}report('語音未能完成。請重試語音，或選擇文字練習。');}resolve(ok);};
        u.onend=()=>finish(true);u.onerror=()=>finish(false);
        pending={resolve,utterance:u,timer:root.setTimeout(()=>finish(false),Math.max(12000,code.length*5000))};
        // speak remains inside the click handler; do not await AudioContext.resume first.
        synth.resume();synth.speak(u);
      }catch{if(pending)root.clearTimeout(pending.timer);pending=null;report('無法啟動語音，請重試或改用文字練習。');resolve(false);}
    });}
    function stop(){epoch++;stopSpeech();for(const v of [...voices]){try{v.osc.stop();}catch{}v.osc.disconnect();v.volume.disconnect();voices.delete(v);}if(context?.state==='running')context.suspend().catch(()=>{});}
    return {unlock,effect,speak,stopSpeech,stop,setEnabled(value){enabled=!!value;},dispose(){stop();if(context){context.close().catch(()=>{});context=null;}}};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={create};else root.VaultAudio={create};
})(typeof window==='undefined'?{}:window);
