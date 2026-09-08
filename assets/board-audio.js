(function(root){
  'use strict';
  // A quiet, original four-bar pentatonic tune, synthesized locally (no downloads).
  const melody=[523.25,659.25,783.99,659.25,587.33,0,493.88,587.33,440,523.25,659.25,523.25,392,0,493.88,587.33];
  function createAudio(onError=()=>{}){
    let context=null,music=false,effects=false,timer=null,step=0,active=false;
    const stopMusic=()=>{if(timer!==null){root.clearInterval(timer);timer=null;}};
    function tone(frequency,duration,volume,delay=0,type='sine'){
      if(!context||context.state!=='running'||!frequency)return;
      const oscillator=context.createOscillator(),gain=context.createGain(),at=context.currentTime+delay;
      oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,at);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.025);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(at);oscillator.stop(at+duration+.02);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }
    function startMusic(){
      if(!active||!music||timer!==null||!context||context.state!=='running')return;
      const tick=()=>{if(!active||!music)return;const frequency=melody[step%melody.length];tone(frequency,.65,.025);if(step%4===0)tone([261.63,293.66,220,196][Math.floor(step/4)%4],1.7,.018);step++;};
      tick();timer=root.setInterval(tick,750);
    }
    async function activate(){
      if(!music&&!effects)return;
      try{
        const Context=root.AudioContext||root.webkitAudioContext;if(!Context)throw Error('unsupported');
        if(!context)context=new Context();active=true;
        if(context.state==='suspended')await context.resume();
        startMusic();
      }catch{active=false;stopMusic();onError('這個瀏覽器暫時無法播放聲音，仍可繼續遊戲。');}
    }
    function effect(kind){
      if(!active||!effects)return;
      if(kind==='dice'){tone(330,.06,.035);tone(440,.06,.025,.07);}
      if(kind==='step')tone(440,.1,.025,0,'triangle');
      if(kind==='land')tone(659.25,.22,.04);
      if(kind==='reward'){tone(523.25,.25,.04);tone(659.25,.3,.035,.12);tone(783.99,.4,.03,.24);}
    }
    function suspend(){active=false;stopMusic();if(context&&context.state==='running')Promise.resolve(context.suspend()).catch(()=>{});}
    function dispose(){active=false;stopMusic();if(context){Promise.resolve(context.close()).catch(()=>{});context=null;}}
    return {activate,effect,suspend,dispose,setMusic(value){music=!!value;if(!music)stopMusic();else startMusic();},setEffects(value){effects=!!value;}};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createAudio};else root.PlanetBoardAudio={createAudio};
})(typeof window==='undefined'?{}:window);
