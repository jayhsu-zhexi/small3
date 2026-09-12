(function(root){
  'use strict';
  const COUNTS=[16,32,40,52,74],SECONDS={16:180,32:240,40:270,52:300,74:420};
  const PREFS_KEY='learning-planet-memory-preferences-v1',HISTORY_KEY='learning-planet-memory-progress-v1',LIMIT=50;
  const validTime=value=>value===null||(Number.isFinite(value)&&value>=180&&value<=600&&value%30===0);
  function preferences(value){
    const input=value&&typeof value==='object'?value:{},size=COUNTS.includes(input.size)?input.size:16;
    const duration=validTime(input.duration)?input.duration:SECONDS[size];
    return {size,duration,manualTime:typeof input.manualTime==='boolean'?input.manualTime:duration!==SECONDS[size],music:typeof input.music==='boolean'?input.music:true,sound:typeof input.sound==='boolean'?input.sound:true};
  }
  function validRun(value){
    return value&&Number.isInteger(value.size)&&value.size%2===0&&[16,24,32,40,52,74].some((base,i)=>value.size>=base&&value.size<=base+[2,4,4,6,8,10][i])&&validTime(value.duration)&&['won','lost'].includes(value.outcome)&&
      ['pairs','flips','attempts','score','bestCombo'].every(key=>Number.isSafeInteger(value[key])&&value[key]>=0)&&
      value.pairs<=value.size/2&&value.pairs<=value.attempts&&value.bestCombo<=value.pairs&&
      value.attempts===Math.floor(value.flips/2)&&(value.outcome!=='won'||value.pairs===value.size/2);
  }
  function cleanRun(value){return {size:value.size,duration:value.duration,outcome:value.outcome,pairs:value.pairs,flips:value.flips,attempts:value.attempts,score:value.score,bestCombo:value.bestCombo};}
  function accuracy(value){return value.attempts?Math.round(value.pairs/value.attempts*100):null;}
  function feedback(current,previous){
    if(!previous)return {title:'第一份星際紀錄',detail:'這組設定的第一次任務已記下。再玩一次，看看自己的進步！'};
    if(current.outcome==='won'&&previous.outcome==='won'){
      const fewer=previous.flips-current.flips;
      if(fewer>0)return {title:'比上次少翻 '+fewer+' 次！',detail:'你用更少次翻牌，完成了全部 '+current.pairs+' 組配對。'};
      if(fewer===0)return {title:'再次完成救援！',detail:'和上次一樣，用 '+current.flips+' 次翻牌完成。繼續記住道具的位置。'};
      return {title:'你完成了全部配對！',detail:'這次比上次多翻 '+(-fewer)+' 次。每次位置都不同，下一趟再慢慢觀察。'};
    }
    if(current.outcome==='won')return {title:'這次成功救援了！',detail:'上次修復 '+previous.pairs+' 組，這次完成全部 '+current.pairs+' 組。'};
    const more=current.pairs-previous.pairs;
    if(more>0)return {title:'比上次多修復 '+more+' 組！',detail:'這次已連接 '+current.pairs+' 組能源。把剛翻過的道具位置記住，再出發。'};
    return {title:current.pairs?'已修復 '+current.pairs+' 組能源':'先觀察，再翻牌',detail:'下次先找剛剛看過的道具。也可以增加時間，慢慢完成任務。'};
  }
  function create(storageAccess){
    function read(key){try{return JSON.parse(storageAccess().getItem(key));}catch{return null;}}
    function write(key,value){try{storageAccess().setItem(key,JSON.stringify(value));return true;}catch{return false;}}
    let saved=preferences(read(PREFS_KEY));const initial=read(HISTORY_KEY);
    let history=Array.isArray(initial)?initial.filter(validRun).slice(-LIMIT).map(cleanRun):[];
    return {
      loadPreferences(){return {...saved};},
      savePreferences(value){saved=preferences(value);return write(PREFS_KEY,saved);},
      record(state,duration){
        const current={size:state.size,duration,outcome:state.phase,pairs:state.matched.length/2,flips:state.flips,attempts:state.attempts,score:state.score,bestCombo:state.bestCombo};
        if(!validRun(current))return null;
        const previous=history.findLast(item=>item.size===current.size&&item.duration===duration)||null;
        history.push(current);history=history.slice(-LIMIT);
        const persisted=write(HISTORY_KEY,history);
        return {current,previous,persisted,feedback:feedback(current,previous)};
      }
    };
  }
  const api={create,accuracy,PREFS_KEY,HISTORY_KEY,LIMIT};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitRecords=api;
})(typeof window==='undefined'?{}:window);
