(function(root){
  'use strict';
  const COUNTS=[16,24,32,40,52],SECONDS={16:180,24:210,32:240,40:270,52:300};
  const SYMBOLS=[['rocket','推進器'],['satellite','衛星'],['cpu','晶片'],['shield','護盾'],['flashlight','探照燈'],['battery-charging','電池'],['radio','電台'],['orbit','軌道儀'],['atom','反應爐'],['magnet','磁力器'],['thermometer','溫度計'],['gem','晶礦'],['flame','燃料'],['key-round','密鑰'],['lock-keyhole','氣閘鎖'],['wrench','扳手'],['radar','雷達'],['antenna','天線'],['hard-drive','硬碟'],['sun','太陽能'],['moon','月岩'],['telescope','望遠鏡'],['test-tube','試劑'],['microscope','顯微鏡'],['plug','接頭'],['circuit-board','電路板']];
  function shuffle(list,rng){const result=list.slice();for(let i=result.length-1;i>0;i--){const j=Math.max(0,Math.min(i,Math.floor(rng()*(i+1))));[result[i],result[j]]=[result[j],result[i]];}return result;}
  function create(size=16,rng=Math.random,now=0){if(!COUNTS.includes(size))throw Error('不支援的卡牌數量');const ids=shuffle(SYMBOLS.map((_,i)=>i),rng).slice(0,size/2);return {size,deck:shuffle(ids.flatMap(id=>[id,id]),rng),matched:[],open:[],phase:'playing',paused:false,remainingMs:SECONDS[size]*1000,shields:size,score:0,bonus:0,combo:0,bestCombo:0,flips:0,attempts:0,revealMs:0,lastAt:now,reason:''};}
  function act(previous,action,now=previous.lastAt){
    const s={...previous,matched:previous.matched.slice(),open:previous.open.slice()},effects=[];
    const active=()=>['playing','resolving'].includes(s.phase),emit=(kind,indices=[])=>effects.push({kind,indices:indices.slice()});
    const delta=Math.max(0,now-s.lastAt);s.lastAt=Math.max(now,s.lastAt);
    if(active()&&!s.paused){
      s.remainingMs=Math.max(0,s.remainingMs-delta);
      if(s.remainingMs===0){s.phase='lost';s.reason='time';emit('lost');}
      else if(s.phase==='resolving'){
        s.revealMs=Math.max(0,s.revealMs-delta);
        if(!s.revealMs){const wrong=s.deck[s.open[0]]!==s.deck[s.open[1]];if(wrong){s.shields--;s.combo=0;emit('miss',s.open);}s.open=[];s.phase='playing';if(s.shields===0){s.phase='lost';s.reason='shield';emit('lost');}}
      }
    }
    if(action.type==='pause'&&active()&&!s.paused)s.paused=true;
    if(action.type==='resume'&&active()&&s.paused)s.paused=false;
    if(action.type==='flip'&&s.phase==='playing'&&!s.paused&&Number.isInteger(action.index)&&action.index>=0&&action.index<s.size&&!s.matched.includes(action.index)&&!s.open.includes(action.index)){
      s.open.push(action.index);s.flips++;emit('flip',[action.index]);
      if(s.open.length===2){
        s.attempts++;s.phase='resolving';const match=s.deck[s.open[0]]===s.deck[s.open[1]];s.revealMs=match?650:1100;
        if(match){s.matched.push(...s.open);s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);s.score+=100+Math.min(9,s.combo-1)*25;emit('match',s.open);
          if(s.matched.length===s.size){s.phase='won';s.bonus=Math.floor(s.remainingMs/1000)*2+s.shields*10;s.score+=s.bonus;emit('won');}
        }
      }
    }
    return {state:s,effects};
  }
  const api={COUNTS,SECONDS,SYMBOLS,create,act};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitMemory=api;
})(typeof window==='undefined'?{}:window);
