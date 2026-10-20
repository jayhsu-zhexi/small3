(function(root){'use strict';
const modes=[{id:'ruler',title:'認識刻度'},{id:'convert',title:'公分毫米換算'},{id:'mixed',title:'公分與毫米合併'},{id:'story',title:'生活應用'}];
function question(mode,n){
  let total,start=0,type,prompt,units,answers,hint;
  if(mode==='ruler'){
    start=n<35?0:5+(n%15);total=11+n%69;type='read';units=['毫米'];answers=[total];
    prompt=start?'橡皮擦沒有從 0 開始，長度是幾毫米？':'看尺上的橡皮擦，長度是幾毫米？';
    hint=start?'先讀出終點與起點的毫米數，再用終點減起點。':'先數完整的公分，每公分有 10 毫米，再加上剩下的小刻度。';
  }else if(mode==='convert'){
    const cm=1+Math.floor(n/2);total=cm*10;type=n%2?'mm-cm':'cm-mm';
    prompt=n%2?`${total} 毫米＝幾公分？`:`${cm} 公分＝幾毫米？`;units=[n%2?'公分':'毫米'];answers=[n%2?cm:total];
    hint=n%2?'每 10 毫米可以換成 1 公分，數一數有幾個 10。':'每公分有 10 毫米，想想總共有幾個 10。';
  }else{
    total=1+n%99;type=mode==='story'?'story':n%2?'split':'join';
    const cm=Math.floor(total/10),mm=total%10;
    prompt=type==='story'?`橡皮擦長 ${cm} 公分 ${mm} 毫米，共長幾毫米？`:type==='split'?`${total} 毫米＝幾公分幾毫米？`:`${cm} 公分 ${mm} 毫米＝幾毫米？`;
    units=type==='split'?['公分','毫米']:['毫米'];answers=type==='split'?[cm,mm]:[total];
    hint=type==='split'?'每 10 毫米換成 1 公分，再看看還剩幾毫米。':'先把公分換成毫米，再加上剩下的毫米。';
  }
  const end=start+total,max=Math.max(40,Math.ceil(end/10)*10);
  return {id:mode+'-'+n,mode,n,type,total,start,end,max,prompt,units,answers,hint};
}
function create(mode='mixed',random=Math.random,sample=false){
  if(!modes.some(m=>m.id===mode))mode='mixed';
  const count=mode==='convert'?18:mode==='ruler'?69:99,pool=Array.from({length:count},(_,i)=>i);
  for(let i=pool.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[pool[i],pool[j]]=[pool[j],pool[i]]}
  // The approved 3 cm 6 mm sample is a join question (n=134); use its canonical ID.
  const chosen=mode==='ruler'?[...pool.filter(n=>n<35).slice(0,5),...pool.filter(n=>n>=35).slice(0,5)]:pool.slice(0,10);if(mode==='mixed'&&sample){const at=chosen.indexOf(35);if(at>=0)chosen.splice(at,1);else chosen.pop();chosen.unshift(134)}
  return {version:1,mode,questions:chosen.map(n=>question(mode,n)),index:0,values:[],hinted:false,attempts:0,solved:false,finished:false,results:[]};
}
const current=s=>s.questions[s.index];
function enter(s,index,digit){if(s.solved||s.finished||!Number.isInteger(index)||index<0||index>=current(s).answers.length||!/^\d$/.test(String(digit))||(s.values[index]||'').length>=3)return false;while(s.values.length<current(s).answers.length)s.values.push('');s.values[index]=(s.values[index]||'')+digit;return true}
function erase(s,index){if(s.solved||s.finished||index<0||index>=current(s).answers.length)return false;s.values[index]=(s.values[index]||'').slice(0,-1);return true}
function clear(s){if(s.solved||s.finished)return false;s.values=[];return true}
function hint(s){if(s.solved||s.finished)return '';s.hinted=true;const q=current(s),cm=Math.floor(q.total/10),mm=q.total%10;return q.type==='read'?`終點讀作 ${q.end} 毫米，起點讀作 ${q.start} 毫米；用終點減起點。`:q.type==='mm-cm'?`${q.total} 毫米裡每 10 毫米是一組，數一數共有幾組。`:q.type==='cm-mm'?`${cm} 公分有 ${cm} 個 10 毫米，把它們加起來。`:q.type==='split'?`${q.total} 毫米中，每 10 毫米先圈成一組，剩下的不足 10 毫米另外填。`:`${cm} 公分先換成 ${cm*10} 毫米，再加上 ${mm} 毫米。`}
function check(s){if(s.solved||s.finished)return {status:'locked'};const q=current(s);if(q.answers.some((_,i)=>!/^\d{1,3}$/.test(s.values[i]||'')))return {status:'incomplete'};const bad=q.answers.flatMap((answer,i)=>Number(s.values[i])!==answer?[i]:[]);if(bad.length){s.attempts++;return {status:'wrong',bad}}s.solved=true;s.results.push({id:q.id,hinted:s.hinted,attempts:s.attempts});return {status:'correct'}}
function next(s){if(!s.solved||s.finished)return false;if(s.index===9){s.finished=true;return true}s.index++;s.values=[];s.hinted=false;s.attempts=0;s.solved=false;return true}
function valid(s){
  if(!s||s.version!==1||!modes.some(m=>m.id===s.mode)||!Array.isArray(s.questions)||s.questions.length!==10||!Number.isInteger(s.index)||s.index<0||s.index>9||!Array.isArray(s.values)||typeof s.hinted!=='boolean'||typeof s.solved!=='boolean'||typeof s.finished!=='boolean'||!Number.isInteger(s.attempts)||s.attempts<0||!Array.isArray(s.results))return false;
  if(s.questions.some(q=>!q||q.mode!==s.mode||!Number.isInteger(q.n)||q.n<0||q.n>=(s.mode==='convert'?18:s.mode==='ruler'?69:99)&&!(s.mode==='mixed'&&q.n===134)||JSON.stringify(q)!==JSON.stringify(question(s.mode,q.n))))return false;
  if(new Set(s.questions.map(q=>q.type+':'+q.start+':'+q.total)).size!==10||s.values.length>current(s).answers.length||Object.keys(s.values).some(k=>!/^\d$/.test(k)||!/^\d{0,3}$/.test(s.values[k])||typeof s.values[k]!=='string'))return false;
  if(s.finished&&(!s.solved||s.index!==9)||s.results.length!==s.index+(s.solved?1:0))return false;
  return s.results.every((r,i)=>r&&r.id===s.questions[i].id&&typeof r.hinted==='boolean'&&Number.isInteger(r.attempts)&&r.attempts>=0)&&(!s.solved||current(s).answers.every((v,i)=>/^\d{1,3}$/.test(s.values[i]||'')&&Number(s.values[i])===v));
}
function restore(s){return valid(s)?JSON.parse(JSON.stringify(s)):create('mixed',Math.random,true)}
function ruler(q){return Array.from({length:q.max+1},(_,mm)=>({mm,x:40+600*mm/q.max,long:mm%10===0,mid:mm%5===0,label:mm%10===0?String(mm/10):''}))}
const api={modes,question,create,current,enter,erase,clear,hint,check,next,valid,restore,ruler};if(typeof module!=='undefined')module.exports=api;else root.LengthPractice=api;
})(typeof globalThis!=='undefined'?globalThis:this);
