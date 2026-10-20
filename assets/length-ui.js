(()=>{'use strict';
const E=LengthPractice,$=id=>document.getElementById(id),KEY='small3-length-practice-v1',SOUND='small3-length-sound';
let state=E.create('mixed',Math.random,true),selected=0,pending=null,enabled=true,storageFailed=false;
try{state=E.restore(JSON.parse(localStorage.getItem(KEY)));enabled=localStorage.getItem(SOUND)!=='off'}catch{}
let audio=MultiplyAudio.create();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{storageFailed=true}$('saveNote').textContent=storageFailed?'目前無法保存，仍可繼續練習。':'進度會自動保存。'}
function feedback(text,kind=''){$('feedback').textContent=text;$('helper').className='helper '+kind}
function inputs(){return [...$('answers').querySelectorAll('input')]}
function focus(){inputs()[selected]?.focus({preventScroll:true})}
function soundButton(){$('sound').textContent=enabled?'🔊 音效':'🔇 靜音';$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'關閉音效':'開啟音效')}
function sync(){inputs().forEach((input,i)=>{input.value=state.values[i]||'';input.disabled=state.solved||state.finished;input.classList.toggle('selected',selected===i&&!state.solved);input.classList.toggle('correct',state.solved);input.classList.remove('wrong')});for(const button of $('keypad').querySelectorAll('button'))button.disabled=state.solved||state.finished;$('hint').disabled=state.solved||state.finished;save()}
function put(digit){if(E.enter(state,selected,digit)){feedback('填好答案後，按「確認答案」檢查。');sync();focus()}}
function erase(){if(E.erase(state,selected)){feedback('可以重新填這一格。');sync();focus()}}
function clear(){if(E.clear(state)){selected=0;feedback('重新想一想，再填入答案。');sync();focus()}}
function svg(tag,attributes,text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))e.setAttribute(key,String(value));if(text!==undefined)e.textContent=text;return e}
function drawRuler(q){
  const ruler=$('ruler');ruler.replaceChildren();
  ruler.append(svg('rect',{x:4,y:59,width:672,height:101,rx:13,fill:'#ffe58b',stroke:'#af8239','stroke-width':3}),svg('rect',{x:10,y:65,width:660,height:90,rx:9,fill:'none',stroke:'#fff4bd','stroke-width':3}));
  for(const tick of E.ruler(q)){ruler.append(svg('line',{x1:tick.x,x2:tick.x,y1:60,y2:tick.long?103:tick.mid?94:85,stroke:'#805a29','stroke-width':tick.long?2.6:1.3}));if(tick.label)ruler.append(svg('text',{x:tick.x,y:135,'text-anchor':'middle',fill:'#593b25','font-size':24,'font-weight':800},tick.label))}
  ruler.append(svg('text',{x:645,y:152,fill:'#79542f','font-size':15},'公分'));
  for(const mm of [q.start,q.end]){const x=40+600*mm/q.max;ruler.append(svg('line',{x1:x,x2:x,y1:1,y2:108,stroke:'#64abe0','stroke-width':2,'stroke-dasharray':'5 4'}))}
  $('eraser').style.left=((40+600*q.start/q.max)/680*100)+'%';$('eraser').style.width=((600*q.total/q.max)/680*100)+'%';
  $('scale').setAttribute('aria-label',`尺規從 0 到 ${q.max/10} 公分，每小格 1 毫米；橡皮擦起點 ${q.start} 毫米，終點 ${q.end} 毫米。`);
}
function updateMeasurement(){const visible=!state.finished&&(state.mode!=='story'||state.solved);$('measurement').hidden=!visible;$('scaleNote').hidden=!visible;if(visible)drawRuler(E.current(state));else{$('ruler').replaceChildren();$('scale').setAttribute('aria-label','答對後顯示尺規驗證。');$('eraser').style.left='';$('eraser').style.width=''}}
function makeAnswers(q){$('answers').replaceChildren();q.units.forEach((unit,i)=>{const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');input.readOnly=true;input.inputMode='none';input.maxLength=3;input.autocomplete='off';input.dataset.index=String(i);input.setAttribute('aria-label',unit+'答案');input.addEventListener('focus',()=>{selected=i;sync()});input.addEventListener('keydown',event=>{if(/^\d$/.test(event.key)){event.preventDefault();put(event.key)}else if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();erase()}else if(event.key==='Enter'){event.preventDefault();check()}else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();selected=Math.max(0,Math.min(q.units.length-1,selected+(event.key==='ArrowLeft'?-1:1)));focus()}});text.textContent=unit;label.append(input,text);$('answers').append(label)})}
function render(){
  selected=0;const q=E.current(state);$('mode').value=state.mode;$('questionTitle').textContent=state.mode==='ruler'?'認識刻度':state.mode==='story'?'生活應用':'長度換算';$('progress').textContent=`第 ${state.index+1} 題 / 共 10 題`;$('prompt').textContent=q.prompt;
  for(const id of ['measurement','answers','actions','helper','scaleNote'])$(id).hidden=false;$('result').hidden=true;updateMeasurement();makeAnswers(q);sync();$('check').textContent=state.solved?(state.index===9?'查看成果':'下一題 →'):'✓ 確認答案';feedback(state.solved?'答對了！'+q.answers.map((v,i)=>v+' '+q.units[i]).join(' '):q.hint,state.solved?'correct':'');
  if(state.finished){for(const id of ['measurement','answers','actions','scaleNote'])$(id).hidden=true;$('result').hidden=false;$('questionTitle').textContent='這一輪的練習成果';$('progress').textContent='10 / 10 題';$('prompt').textContent='完成 10 題，越來越熟練！';$('resultStars').textContent='★ ★ ★';$('resultSummary').textContent=`獨立首次答對 ${state.results.filter(r=>!r.hinted&&r.attempts===0).length} 題`;feedback('看提示、重試都能幫助學習，學會最重要。')}
  save();
}
function check(){if(state.finished)return;if(state.solved){audio.stop();E.next(state);render();return}const result=E.check(state);save();if(result.status==='incomplete'){feedback('還有答案格沒填，先填完再確認喔。','wrong');return}if(result.status==='wrong'){if(enabled)audio.play('wrong');feedback('再想一想！確認單位，也可以按「看提示」。','wrong');for(const index of result.bad)inputs()[index].classList.add('wrong');return}if(result.status==='correct'){if(enabled)audio.play('correct');sync();updateMeasurement();const q=E.current(state);feedback('答對了！'+q.answers.map((v,i)=>v+' '+q.units[i]).join(' '),'correct');$('check').textContent=state.index===9?'查看成果':'下一題 →'}}
function start(mode){audio.stop();state=E.create(mode);render()}
for(const mode of E.modes){const option=document.createElement('option');option.value=mode.id;option.textContent=mode.title;$('mode').append(option)}
$('mode').onchange=()=>{const mode=$('mode').value;if(mode===state.mode)return;if(!state.finished&&(state.results.length||state.values.some(Boolean)||state.hinted)){pending=mode;$('mode').value=state.mode;$('switchDialog').showModal()}else start(mode)};
$('cancelSwitch').onclick=()=>{pending=null;$('switchDialog').close()};$('switchDialog').addEventListener('cancel',()=>{pending=null});$('confirmSwitch').onclick=()=>{const mode=pending;pending=null;$('switchDialog').close();if(mode)start(mode)};
$('hint').onclick=()=>{const text=E.hint(state);if(text){feedback(text);save()}};$('check').onclick=check;$('clear').onclick=clear;$('erase').onclick=erase;for(const button of $('keypad').querySelectorAll('[data-digit]'))button.onclick=()=>put(button.dataset.digit);
$('sound').onclick=()=>{enabled=!enabled;audio.stop();soundButton();try{localStorage.setItem(SOUND,enabled?'on':'off')}catch{}};
const stars=document.createElement('div');stars.id='resultStars';stars.className='stars';const summary=document.createElement('p');summary.id='resultSummary';const replay=document.createElement('button');replay.textContent='再練習 10 題';replay.id='replay';replay.onclick=()=>start(state.mode);$('result').append(stars,summary,replay);
document.addEventListener('keydown',event=>{if($('switchDialog').open||state.finished||state.solved||['INPUT','SELECT','BUTTON'].includes(event.target?.tagName))return;if(/^\d$/.test(event.key)){event.preventDefault();put(event.key)}else if(event.key==='Backspace'){event.preventDefault();erase()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.stop()});window.addEventListener('pagehide',()=>audio.dispose());window.addEventListener('pageshow',event=>{if(event.persisted)audio=MultiplyAudio.create()});soundButton();render();
})();
