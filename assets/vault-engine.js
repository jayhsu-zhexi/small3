(function(root){
  'use strict';
  const LEVELS=[3,5,7,10],SECONDS={3:75,5:105,7:135,10:180};
  function sequence(count,rng=Math.random){if(!LEVELS.includes(count))throw Error('Invalid level');return Array.from({length:count},()=>({dir:rng()<.5?-1:1,steps:1+Math.min(8,Math.max(0,Math.floor(rng()*9)))}));}
  function create(count=3,rng=Math.random){return {count,code:sequence(count,rng),phase:'listening',index:0,draft:0,angle:0,hp:3,remaining:SECONDS[count]*1000,last:0,cooldown:0,replays:2,score:0,streak:0,doors:0,round:1,assisted:false,award:0,resumePhase:null};}
  function clock(s,now){if(s.phase==='input'){s.remaining=Math.max(0,s.remaining-Math.max(0,now-s.last));s.last=now;if(!s.remaining){s.phase='lost';s.streak=0;}}return s;}
  function act(previous,action,now=0,rng=Math.random){const s={...previous};clock(s,now);let event='';
    if(action.type==='tick')return {state:s,event};
    if(action.type==='pause'&&['input','listening','audioerror','visual'].includes(s.phase)){s.resumePhase=s.phase;s.phase='paused';return {state:s,event:'pause'};}
    if(action.type==='resume'&&s.phase==='paused'){s.phase=s.resumePhase;s.resumePhase=null;s.last=now;return {state:s,event:'resume'};}
    if(action.type==='audioerror'&&s.phase==='listening'){s.phase='audioerror';return {state:s,event};}
    if(action.type==='retry'&&s.phase==='audioerror'){s.phase='listening';return {state:s,event};}
    if(action.type==='visual'&&['audioerror','listening'].includes(s.phase)){s.phase='visual';s.assisted=true;return {state:s,event};}
    if(action.type==='ready'&&['listening','visual'].includes(s.phase)){s.phase='input';s.last=now;return {state:s,event:'ready'};}
    if(action.type==='next'&&s.phase==='won'){
      let code=sequence(s.count,rng);if(JSON.stringify(code)===JSON.stringify(s.code))code[0]={...code[0],steps:code[0].steps%9+1};
      Object.assign(s,{code,phase:'listening',index:0,draft:0,angle:0,hp:Math.min(3,s.hp+1),remaining:SECONDS[s.count]*1000,last:now,cooldown:0,replays:2,round:s.round+1,assisted:false,award:0});return {state:s,event:'next'};
    }
    if(s.phase!=='input'||now<s.cooldown)return {state:s,event};
    if(action.type==='turn'&&[-1,1].includes(action.dir)){const draft=s.draft+action.dir;if(Math.abs(draft)<=9){s.draft=draft;s.angle+=action.dir*18;event='tick';}}
    if(action.type==='clear'){s.angle-=s.draft*18;s.draft=0;}
    if(action.type==='replay'&&s.replays>0){s.replays--;s.remaining=Math.max(0,s.remaining-5000);s.angle-=s.draft*18;s.draft=0;s.phase=s.remaining?'listening':'lost';if(!s.remaining)s.streak=0;event=s.remaining?'replay':'lost';}
    if(action.type==='confirm'&&s.draft){
      const expected=s.code[s.index];
      if(s.draft===expected.dir*expected.steps){s.index++;s.draft=0;event='match';if(s.index===s.count){s.phase='won';s.doors++;s.streak++;s.award=Math.floor((s.count*100+Math.floor(s.remaining/1000)*2+Math.min(s.streak,10)*50)*(s.assisted?.5:1));s.score+=s.award;event='won';}}
      else{s.hp--;s.angle-=s.draft*18;s.draft=0;s.streak=0;s.cooldown=now+850;event='miss';if(!s.hp){s.phase='lost';event='lost';}}
    }
    return {state:s,event};
  }
  function delta(from,to){return ((to-from+540)%360)-180;}
  const api={LEVELS,SECONDS,sequence,create,act,delta};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VaultEngine=api;
})(typeof window==='undefined'?{}:window);
