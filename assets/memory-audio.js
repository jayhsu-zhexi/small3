(function(root){
  'use strict';
  // Original four-bar synth ostinato: pulsing bass, arpeggios and soft electronic percussion.
  const roots=[73.416,65.406,58.270,65.406],thirds=[3,4,4,4],motif=[0,7,12,15,7,12,15,7];
  function create(onError=()=>{}){
    let context=null,enabled=true,music=true,active=false,awake=false,timer=null,step=0,nextAt=0,tension=0,epoch=0;
    const voices=new Set();
    function stopVoices(kind){
      for(const voice of [...voices])if(kind===undefined||voice.music===kind){
        try{voice.osc.stop();}catch{}
        voice.osc.disconnect();voice.gain.disconnect();voices.delete(voice);
      }
    }
    function clearMusic(){if(timer!==null){root.clearTimeout(timer);timer=null;}stopVoices(true);}
    function canPlayMusic(){return active&&music&&awake&&context?.state==='running';}
    function tone(hz,start,duration,volume=.035,type='sine',isMusic=false,slide=0){
      if(!awake||!context||context.state!=='running'||(isMusic?!active||!music:!enabled))return;
      const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime+Math.max(0,start),voice={osc,gain,music:isMusic};
      voices.add(voice);osc.type=type;osc.frequency.setValueAtTime(hz,at);
      if(slide)osc.frequency.exponentialRampToValueAtTime(slide,at+duration);
      gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.01);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
      osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+duration+.03);
      osc.onended=()=>{osc.disconnect();gain.disconnect();voices.delete(voice);};
    }
    function musicStep(at){
      const beat=step%8,bar=Math.floor(step/8)%4,rootNote=roots[bar],delay=at-context.currentTime;
      const interval=motif[beat]===15?12+thirds[bar]:motif[beat];
      tone(rootNote*2*Math.pow(2,interval/12),delay,.17,.014,'triangle',true);
      if(beat%2===0){tone(rootNote,delay,.32,.019,'sine',true);tone(118,delay,.1,.018,'sine',true,46);}
      tone(1400+beat*60,delay,.025,.0028,'sine',true);
      if(beat===0)tone(rootNote/2,delay,1.4,.012,'sine',true);
      if(tension>.55&&beat%2===1)tone(rootNote*4,delay+.1,.07,.007,'triangle',true);
      step=(step+1)%32;
    }
    function scheduleMusic(){
      if(timer!==null||!canPlayMusic())return;
      nextAt=context.currentTime+.04;
      const tick=()=>{
        timer=null;if(!canPlayMusic())return;
        // Skip an interrupted gap; never queue a burst of missed notes.
        if(nextAt<context.currentTime-.1)nextAt=context.currentTime+.03;
        while(nextAt<context.currentTime+.12){musicStep(nextAt);nextAt+=60/(108+24*tension)/2;}
        timer=root.setTimeout(tick,40);
      };
      tick();
    }
    async function activate(){
      if(!enabled&&!music)return;
      const ticket=epoch;
      try{
        const Context=root.AudioContext||root.webkitAudioContext;if(!Context)throw Error();
        if(!context)context=new Context();const instance=context;awake=true;
        if(instance.state==='suspended')await instance.resume();
        if(ticket!==epoch||instance!==context){if(instance===context&&!awake)Promise.resolve(instance.suspend()).catch(()=>{});return;}
        scheduleMusic();
      }catch{if(ticket!==epoch)return;awake=false;clearMusic();onError('目前無法播放遊戲聲音，仍可繼續遊戲。');}
    }
    function startMusic(reset=false){if(reset){clearMusic();step=0;tension=0;}active=true;return activate();}
    function stopMusic(){active=false;clearMusic();}
    function play(kind){
      if(kind==='launch'){
        // Reactor charge, engine sweep and arrival lock, timed to the warp sequence.
        tone(55,0,1.45,.022,'sine',false,155);
        tone(140,.12,1.2,.018,'triangle',false,1120);
        [440,660,880].forEach((hz,i)=>tone(hz,.2+i*.21,.17,.017));
        tone(110,.95,.7,.026,'sine',false,42);
        tone(1480,1.3,.65,.016,'sine',false,370);
        [660,990,1320].forEach((hz,i)=>tone(hz,1.7+i*.07,.3,.019));
      }
      if(kind==='flip'){tone(480,0,.065,.022,'triangle');tone(720,.04,.05,.018);}
      if(kind==='match'){
        // A charging sweep resolves into three bright docking-confirmation pings.
        tone(260,0,.19,.022,'triangle',false,1040);
        [740,1110,1480].forEach((hz,i)=>tone(hz,.13+i*.065,.22,.023));
        tone(185,.05,.28,.012,'sine');
      }
      if(kind==='miss'){
        // Two short descending comms glitches; no piercing alarm or harsh noise.
        tone(560,0,.12,.024,'triangle',false,220);
        tone(430,.15,.14,.019,'triangle',false,160);
        tone(92,.03,.2,.018,'sine');
      }
      if(kind==='won'){
        tone(130,0,.65,.024,'triangle',false,1040);
        tone(65,.2,1.2,.022,'sine',false,130);
        [523,659,784,1047].forEach((hz,i)=>tone(hz,.4+i*.16,.7,.028));
        [1568,2093].forEach((hz,i)=>tone(hz,1.15+i*.18,.6,.012));
      }
      if(kind==='lost'){
        tone(480,0,.9,.023,'triangle',false,70);
        tone(110,.15,1.1,.021,'sine',false,42);
        [330,247].forEach((hz,i)=>tone(hz,.8+i*.3,.33,.023));
        tone(165,1.35,.5,.016);
      }
    }
    function suspend(){epoch++;awake=false;stopMusic();stopVoices();if(context&&context.state==='running')Promise.resolve(context.suspend()).catch(()=>{});}
    function dispose(){epoch++;awake=false;stopMusic();stopVoices();if(context){const instance=context;context=null;Promise.resolve(instance.close()).catch(()=>{});}}
    return {
      activate,play,startMusic,stopMusic,suspend,dispose,
      setTension(value){tension=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;},
      setEnabled(value){enabled=!!value;if(!enabled)stopVoices(false);else if(active)activate();},
      setMusic(value){music=!!value;if(!music)clearMusic();else if(active)activate();}
    };
  }
  const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitAudio=api;
})(typeof window==='undefined'?{}:window);
