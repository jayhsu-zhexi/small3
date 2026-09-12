(function(root){
  'use strict';
  const COUNTS=[16,32,52,74,108],SECONDS={16:180,24:210,32:240,40:270,52:300,74:420,108:540};
  const SHIELDS={16:16,24:32,32:48,40:72,52:104,74:148,108:216};
  const EXTRA={16:2,24:4,32:4,40:6,52:8,74:10,108:12};
  const PHONE_COLUMNS={16:4,24:4,32:6,40:6,52:6,74:6,108:6};
  function tier(size){return [...COUNTS,24,40].find(base=>Number.isInteger(size)&&size%2===0&&size>=base&&size<=base+EXTRA[base]);}
  function rules(size){const base=tier(size);if(!base)throw Error('不支援的卡牌數量');return {base,size,shields:Math.ceil(SHIELDS[base]*size/base),seconds:Math.ceil(SECONDS[base]*size/base/30)*30};}
  // Only full rectangles are candidates. Equal-size cards prefer fewer added pairs.
  function rectangle(size,width,height,gap=4,preferredCols=0){const fixed=preferredCols>0&&size%preferredCols===0?preferredCols:0;let best={size,cols:fixed||1,rows:size/(fixed||1),tile:0};for(let cols=1;cols<=size;cols++){if(size%cols||(fixed&&cols!==fixed))continue;const rows=size/cols,tile=Math.max(0,Math.min(128,(width-gap*(cols-1))/cols,(height-gap*(rows-1))/rows/1.25));if(tile>best.tile)best={size,cols,rows,tile};}return best;}
  function plan(base,width,height,gap=4,portraitPhone=false){if(!COUNTS.includes(base))throw Error('不支援的難度');if(portraitPhone){const cols=PHONE_COLUMNS[base],size=Math.ceil(base/cols)*cols;return {...rectangle(size,width,height,gap,cols),...rules(size)};}let best=rectangle(base,width,height,gap);for(let size=base+2;size<=base+EXTRA[base];size+=2){const candidate=rectangle(size,width,height,gap);if(candidate.tile>best.tile+.01)best=candidate;}return {...best,...rules(best.size)};}
  const SYMBOLS=[['rocket','推進器'],['satellite','衛星'],['cpu','晶片'],['shield','護盾'],['flashlight','探照燈'],['battery-charging','電池'],['radio','電台'],['orbit','軌道儀'],['atom','反應爐'],['magnet','磁力器'],['thermometer','溫度計'],['gem','晶礦'],['flame','燃料'],['key-round','密鑰'],['lock-keyhole','氣閘鎖'],['wrench','扳手'],['radar','雷達'],['antenna','天線'],['hard-drive','硬碟'],['sun','太陽能'],['moon','月岩'],['telescope','望遠鏡'],['test-tube','試劑'],['microscope','顯微鏡'],['plug','接頭'],['circuit-board','電路板']];
  function shuffle(list,rng){const result=list.slice();for(let i=result.length-1;i>0;i--){const j=Math.max(0,Math.min(i,Math.floor(rng()*(i+1))));[result[i],result[j]]=[result[j],result[i]];}return result;}
  SYMBOLS.push(['helmet','太空頭盔'],['oxygen','氧氣背包'],['robot','探險機器人'],['boot','太空靴']);
  SYMBOLS.push(...[['🛸','飛碟'],['🌍','地球'],['🌈','彩虹'],['⏳','沙漏'],['🧭','指南針'],['🎯','標靶'],['🧩','拼圖'],['🎲','骰子'],['🎵','音符'],['🔔','鈴鐺'],['📡','接收站'],['🌀','漩渦']]);
  SYMBOLS.push(...[['🎈','氣球'],['🪁','風箏'],['🎁','禮物'],['🏆','獎盃'],['🎨','調色盤'],['📷','相機'],['📚','書本'],['✉️','信封'],['☂️','雨傘'],['🕯️','蠟燭'],['🍎','蘋果'],['🍇','葡萄'],['🍉','西瓜'],['🌻','向日葵'],['🌵','仙人掌'],['🦋','蝴蝶'],['🐢','烏龜'],['🐳','鯨魚']]);
  function create(size=16,rng=Math.random,now=0,seconds=rules(size).seconds){const initial=rules(size);if(seconds!==null&&(!Number.isFinite(seconds)||seconds<180||seconds>600||seconds%30!==0))throw Error('不支援的任務時間');const ids=shuffle(SYMBOLS.slice(0,size>84?60:size>60?42:30).map((_,i)=>i),rng).slice(0,size/2);return {size,initialShields:initial.shields,deck:shuffle(ids.flatMap(id=>[id,id]),rng),matched:[],open:[],phase:'playing',paused:false,remainingMs:seconds===null?null:seconds*1000,shields:initial.shields,score:0,bonus:0,combo:0,bestCombo:0,flips:0,attempts:0,revealMs:0,lastAt:now,reason:''};}
  function act(previous,action,now=previous.lastAt){
    const s={...previous,matched:previous.matched.slice(),open:previous.open.slice()},effects=[];
    const active=()=>['playing','resolving'].includes(s.phase),emit=(kind,indices=[])=>effects.push({kind,indices:indices.slice()});
    const delta=Math.max(0,now-s.lastAt);s.lastAt=Math.max(now,s.lastAt);
    if(active()&&!s.paused){
      if(s.remainingMs!==null)s.remainingMs=Math.max(0,s.remainingMs-delta);
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
          if(s.matched.length===s.size){s.phase='won';s.bonus=(s.remainingMs===null?0:Math.floor(s.remainingMs/1000)*2)+s.shields*10;emit('won');}
        }
      }
    }
    return {state:s,effects};
  }
  const api={COUNTS,SECONDS,SHIELDS,EXTRA,PHONE_COLUMNS,SYMBOLS,rules,rectangle,plan,create,act};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitMemory=api;
})(typeof window==='undefined'?{}:window);
