(()=>{
 'use strict';
 const E=window.AbacusPractice,s=E.create(),$=id=>document.getElementById(id),names=['萬位','千位','百位','十位','個位'],columns=[];let dirty=false,autoSettings=null,practiceSet=null,manualDrafts=[null],manualIndex=0;
 let soundEnabled=true,audioContext=null,soundToken=0;const voices=new Set();
 const errorAudio=typeof window.Audio==='function'?new window.Audio('/assets/abacus-error-kenney-v1.wav'):null;
 if(errorAudio){errorAudio.preload='auto';errorAudio.volume=.9;}
 function stopSound(){soundToken++;if(errorAudio){errorAudio.pause();try{errorAudio.currentTime=0;}catch(_){}}for(const voice of voices){try{voice.osc.stop();}catch(_){}voice.osc.disconnect();voice.gain.disconnect();}voices.clear();}
 function playAnswerSound(correct,fallback=false){
  stopSound();if(!soundEnabled)return;if(!correct&&errorAudio&&!fallback){const token=soundToken;errorAudio.onplaying=()=>{if(token!==soundToken||!soundEnabled||document.hidden)errorAudio.pause();};try{const playing=errorAudio.play();if(playing&&playing.catch)playing.catch(()=>{if(token===soundToken&&soundEnabled&&!document.hidden)playAnswerSound(false,true);});return;}catch(_){playAnswerSound(false,true);return;}}const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  try{
   if(!audioContext||audioContext.state==='closed')audioContext=new Audio();
   const token=soundToken,ctx=audioContext;
   const schedule=()=>{if(token!==soundToken||!soundEnabled||document.hidden||ctx.state!=='running')return;
    const notes=correct?[[0,880,.17],[.18,659.25,.22],[.43,880,.17],[.61,659.25,.26]]:[[0,220,.20],[.25,165,.23]];
    for(const [offset,hz,duration] of notes){const osc=ctx.createOscillator(),gain=ctx.createGain(),voice={osc,gain};const start=ctx.currentTime+.015+offset;osc.type=correct?'sine':'sawtooth';osc.frequency.setValueAtTime(hz,start);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(correct?.13:.18,start+.015);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.connect(gain);gain.connect(ctx.destination);voices.add(voice);osc.onended=()=>{voices.delete(voice);osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.02);}
   };
   if(ctx.state==='suspended')ctx.resume().then(schedule).catch(()=>{});else schedule();
  }catch(_){stopSound();}
 }
 $('soundToggle').addEventListener('click',()=>{soundEnabled=!soundEnabled;stopSound();$('soundToggle').textContent=soundEnabled?'♪ 音效開':'♪ 音效關';$('soundToggle').setAttribute('aria-pressed',String(soundEnabled));$('soundToggle').setAttribute('aria-label',soundEnabled?'音效已開啟，按下關閉':'音效已關閉，按下開啟');});
 let effectTimer=null;
 function hideEffect(){stopSound();clearTimeout(effectTimer);effectTimer=null;$('answerEffect').hidden=true;}
 function showEffect(correct){hideEffect();const effect=$('answerEffect');effect.dataset.kind=correct?'success':'retry';$('effectLabel').textContent=correct?'答對了！':'再試一次';effect.hidden=false;effect.style.animation='none';void effect.offsetWidth;effect.style.animation='';effectTimer=setTimeout(hideEffect,1100);}
 if(document.addEventListener)document.addEventListener('visibilitychange',()=>{if(document.hidden)hideEffect();});
 function feedback(message,kind=''){hideEffect();const box=$('feedback');box.textContent=message;box.dataset.kind=kind;}
 function render(){columns.forEach(({buttons,digit},col)=>{const upper=s.digits[col]>=5,lower=s.digits[col]%5;buttons.forEach((button,i)=>{const active=i===0?upper:i<=lower;button.style.top=(i===0?(upper?52:0):108+(i<=lower?(i-1)*44:64+(i-1)*44))/348*100+'%';button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',names[col]+'，'+(i===0?'上珠，值五':'下珠第'+i+'顆，值一')+'，'+(active?'已靠梁，按下移開':'未靠梁，按下靠梁'));});digit.textContent=s.digits[col];});$('value').textContent=E.value(s).toLocaleString('en-US');$('mode').textContent=s.problem?'題目練習':'自由練習';$('questionLabel').textContent=s.problem?'用算盤撥出答案':'隨手撥一個數字';$('question').textContent=s.problem?(s.problem.terms||[s.problem.a,s.problem.b]).map((n,i)=>(i?((s.problem.ops||[s.problem.op])[i-1]==='+'?' ＋ ':' − '):'')+n).join('')+' ＝ ?':'自由撥珠';$('check').disabled=!s.problem||dirty;$('check').textContent=practiceSet?(practiceSet.completed?'已完成':practiceSet.solved?'下一題':'確認答案'):'確認答案';if(practiceSet&&practiceSet.completed)$('check').disabled=true;$('questionLabel').textContent=practiceSet?(practiceSet.source==='auto'?'電腦出題':'自己出題')+' · 第 '+(practiceSet.index+1)+'／'+practiceSet.problems.length+' 題':s.problem?'用算盤撥出答案':'隨手撥一個數字';}
 names.forEach((name,col)=>{const lane=document.createElement('div');lane.className='ab-column';lane.setAttribute('role','group');lane.setAttribute('aria-label',name);const buttons=[];for(let i=0;i<5;i++){const button=document.createElement('button');button.type='button';button.className='ab-bead';const activate=()=>{if(practiceSet&&practiceSet.solved)return;E.move(s,col,i);render();feedback(dirty?'設定已修改，請先按「開始練習」。':s.problem?'撥好後按「確認答案」。':'自由練習中，隨時可以清空重來。');};
 // Each new contact is a complete bead action. Do not wait for a release event:
 // an interrupted iPad gesture must never leave a bead permanently locked.
 let touchClick=false;
 button.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch'&&event.pointerType!=='pen'){touchClick=false;return;}event.preventDefault();touchClick=true;activate();});
 button.addEventListener('click',event=>{if(event&&touchClick&&event.detail!==0)return;activate();});lane.append(button);buttons.push(button);}if(col===1||col===4){const dot=document.createElement('span');dot.className='ab-dot';lane.append(dot);}$('field').append(lane);const label=document.createElement('div'),text=document.createElement('span'),digit=document.createElement('strong');text.textContent=name;label.append(text,digit);$('places').append(label);columns.push({buttons,digit});});
 $('clear').addEventListener('click',()=>{if(practiceSet&&practiceSet.solved)return;E.clear(s);render();feedback(dirty?'算盤已清空；設定已修改，請重新出題。':s.problem?'算盤已清空，題目保留，可以重新算。':'算盤已清空，可以開始撥珠。');});
 function expression(problem){return (problem.terms||[problem.a,problem.b]).map((n,i)=>(i?((problem.ops||[problem.op])[i-1]==='+'?' ＋ ':' − '):'')+ (n===''?'□':n)).join('')+' ＝ ?';}
 function readManual(){const count=Number($('manualCount').value||2),terms=[$('first').value,$('second').value],ops=[$('subtract').checked?'-':'+'];for(let i=3;i<=count;i++){terms.push($('term'+i).value);ops.push($('op'+i).value||'+');}return {terms,ops};}
 function validateQuestion(question){const temp=E.create();E.setSequence(temp,question.terms,question.ops);return temp.problem;}
 function loadManual(index){manualIndex=index;const question=manualDrafts[index];$('manualCount').value=String(question.terms.length);['first','second','term3','term4','term5'].forEach((id,i)=>{$(id).value=question.terms[i]===undefined?'1':String(question.terms[i]);});$('subtract').checked=question.ops[0]==='-';$('add').checked=!$('subtract').checked;for(let i=3;i<=5;i++)$('op'+i).value=question.ops[i-2]||'+';updateTerms();}
 function renderManualList(){
  $('manualSetTitle').textContent='正在編輯第 '+(manualIndex+1)+' 題';$('addQuestion').disabled=manualDrafts.length>=20;$('questionListSummary').textContent='查看題目清單（'+manualDrafts.length+' 題）';$('startManual').textContent='開始練習，共 '+manualDrafts.length+' 題';
  const rows=manualDrafts.map((question,index)=>{const row=document.createElement('div'),select=document.createElement('button'),remove=document.createElement('button');row.className='question-set-row';select.type='button';select.textContent='第 '+(index+1)+' 題 · '+expression(question).replace(/ ＝ \?$/,'');select.setAttribute('aria-pressed',String(index===manualIndex));select.addEventListener('click',()=>loadManual(index));remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','移除第 '+(index+1)+' 題');remove.disabled=manualDrafts.length===1;remove.addEventListener('click',()=>{if(manualDrafts.length===1)return;manualDrafts.splice(index,1);const next=index<manualIndex?manualIndex-1:index===manualIndex?Math.min(index,manualDrafts.length-1):manualIndex;dirty=true;loadManual(next);render();});row.append(select,remove);return row;});$('manualQuestionList').replaceChildren(...rows);
 }
 function addManualQuestion(){try{updateTerms(true);validateQuestion(readManual());if(manualDrafts.length>=20)throw Error('一組最多 20 題。');const current=readManual();manualDrafts.push({terms:current.terms.map(()=>''),ops:current.ops.slice()});dirty=true;loadManual(manualDrafts.length-1);render();return true;}catch(error){$('formError').textContent=error.message;return false;}}
 $('addQuestion').addEventListener('click',addManualQuestion);
 function loadPracticeQuestion(){const p=practiceSet.problems[practiceSet.index];E.setSequence(s,p.terms||[p.a,p.b],p.ops||[p.op]);practiceSet.solved=false;dirty=false;render();}
 function startSet(problems,source){practiceSet=problems.length>1||source==='auto'?{problems,index:0,source,solved:false,completed:false}:null;if(practiceSet)loadPracticeQuestion();else E.setSequence(s,problems[0].terms,problems[0].ops);}
 $('closeCompletion').addEventListener('click',()=>{$('completionDialog').close();$('openProblem').focus();});
 $('check').addEventListener('click',()=>{
  if(dirty||!s.problem||practiceSet&&practiceSet.completed)return;
  if(practiceSet&&practiceSet.solved){practiceSet.index++;loadPracticeQuestion();feedback('下一題準備好了！算盤已歸零。');return;}
  const correct=E.check(s);if(correct&&practiceSet){practiceSet.solved=true;if(practiceSet.index===practiceSet.problems.length-1)practiceSet.completed=true;}
  render();feedback(correct?(practiceSet?(practiceSet.completed?'✓ 全部完成了！每一道都算對了。':'✓ 答對了！按「下一題」繼續挑戰。'):'✓ 答對了！你撥出了正確的答案。'):'再試一次，還沒有答對。可以調整算珠，再按「確認答案」。',correct?'success':'retry');showEffect(correct);playAnswerSound(correct);
  if(practiceSet&&practiceSet.completed){$('completionSummary').textContent='你完成了 '+practiceSet.problems.length+' 題練習！';$('completionDialog').showModal();}
 });
 function startManualPractice(){try{
  manualDrafts[manualIndex]=readManual();const problems=[];
  for(let i=0;i<manualDrafts.length;i++){try{problems.push(validateQuestion(manualDrafts[i]));}catch(error){loadManual(i);updateTerms(true);throw Error('第 '+(i+1)+' 題：'+error.message);}}
  startSet(problems,'manual');autoSettings=null;dirty=false;$('formError').textContent='';if($('problemDialog').open)$('problemDialog').close();render();feedback('題目準備好了！共 '+problems.length+' 題，撥好後再確認答案。');
 }catch(error){dirty=true;$('formError').textContent=error.message;render();feedback('請先修正題目設定。');$('formError').scrollIntoView?.({block:'nearest'});}}
 $('problemForm').addEventListener('submit',e=>{e.preventDefault();startManualPractice();});
 for(const id of ['first','second','add','subtract','manualCount','term3','term4','term5','op3','op4','op5'])$(id).addEventListener('input',()=>{dirty=true;updateTerms();render();feedback('設定已修改，按「開始練習」開始新題。');});
 $('free').addEventListener('click',()=>{E.free(s);autoSettings=null;practiceSet=null;dirty=false;$('formError').textContent='';if($('problemDialog').open)$('problemDialog').close();render();feedback('已回到自由練習，保留現在的算珠。');});
 function source(computer){$('manualFooter').hidden=computer;$('computerForm').hidden=!computer;$('problemForm').hidden=computer;$('computerSource').setAttribute('aria-pressed',String(computer));$('manualSource').setAttribute('aria-pressed',String(!computer));}
 $('manualSource').addEventListener('click',()=>source(false));
 $('computerSource').addEventListener('click',()=>source(true));
 $('computerForm').addEventListener('submit',e=>{e.preventDefault();const settings={limit:Number($('autoLimit').value),operation:$('autoOperation').value,count:Number($('autoCount').value||2),total:Number($('autoTotal').value||5)};try{
  if(![5,10,20].includes(settings.total))throw Error('請選擇 5、10 或 20 題。');const temp=E.create(),problems=[];for(let i=0;i<settings.total;i++){E.randomSequence(temp,settings.limit,settings.operation,settings.count);problems.push(temp.problem);}
  startSet(problems,'auto');autoSettings=settings;dirty=false;$('autoError').textContent='';$('formError').textContent='';if($('problemDialog').open)$('problemDialog').close();render();feedback('電腦已準備 '+settings.total+' 題，撥好算珠後按「確認答案」。');
 }catch(error){$('autoError').textContent=error.message;}});
 function signAt(index){return index===1?($('subtract').checked?'-':'+'):$('op'+(index+1)).value||'+';}
 const signButtons=[];
 function setSign(index,sign){if(index===1){$('subtract').checked=sign==='-';$('add').checked=sign==='+';}else $('op'+(index+1)).value=sign;dirty=true;updateTerms();render();feedback('設定已修改，按「開始練習」開始新題。');}
 for(let n=2;n<=5;n++)for(const sign of ['+','-']){const button=document.createElement('button');button.type='button';button.textContent=sign==='+'?'＋':'−';button.setAttribute('aria-label','第 '+n+' 口'+(sign==='+'?'加法':'減法'));button.addEventListener('click',()=>setSign(n-1,sign));$('signGroup'+n).append(button);signButtons.push({button,index:n-1,sign});}
 function updateTerms(showErrors=false){
  const ids=['first','second','term3','term4','term5'],count=Number($('manualCount').value||2);let total=0,error='';
  for(let i=0;i<5;i++){if(i>=2)$('termRow'+(i+1)).hidden=i>=count;const raw=$(ids[i]).value;let invalid=false;if(i<count){if(!/^\d{1,5}$/.test(raw)){invalid=true;if(!error)error='請填入第 '+(i+1)+' 口的整數。';}else {total+=(i&&signAt(i)==='-'?-1:1)*Number(raw);if(total<0||total>99999){invalid=true;if(!error)error='第 '+(i+1)+' 口算完超出 0～99,999，請調整。';}}}$(ids[i]).setAttribute('aria-invalid',String(showErrors&&invalid));}
  $('manualPreview').textContent=ids.slice(0,count).map((id,i)=>(i?(signAt(i)==='+'?' ＋ ':' − '):'')+($(id).value||'□')).join('')+' ＝ ?';
  manualDrafts[manualIndex]=readManual();renderManualList();$('formError').textContent=showErrors?error:'';signButtons.forEach(({button,index,sign})=>button.setAttribute('aria-pressed',String(signAt(index)===sign)));
 }
 updateTerms();
 // A focused, touch-friendly editor avoids the software keyboard covering settings.
 const numberIds=['first','second','term3','term4','term5'];
 const keypad=document.createElement('dialog'),keyTitle=document.createElement('h2'),keyValue=document.createElement('output'),keyGrid=document.createElement('div');
 keypad.className='number-keypad';keyTitle.id='numberKeyTitle';keypad.setAttribute('aria-labelledby',keyTitle.id);keyValue.setAttribute('aria-live','polite');keyGrid.className='number-key-grid';keypad.append(keyTitle,keyValue,keyGrid);$('problemDialog').append(keypad);
 let activeNumber=0,replaceNumber=true,keyReady=false;
 const keySigns=document.createElement('div'),keySignButtons=[];keySigns.className='manual-signs keypad-signs';keySigns.setAttribute('role','group');keySigns.setAttribute('aria-label','目前這一口的運算');
 for(const sign of ['+','-']){const button=document.createElement('button');button.type='button';button.textContent=sign==='+'?'＋ 加法':'− 減法';button.addEventListener('click',()=>{setSign(activeNumber,sign);showNumber();});keySigns.append(button);keySignButtons.push({button,sign});}
 keypad.append(keySigns);
 const keyPreview=document.createElement('div');keyPreview.className='keypad-preview';keyPreview.setAttribute('aria-label','題目預覽');keyPreview.setAttribute('aria-live','polite');keypad.append(keyPreview);
 const keyError=document.createElement('p'),keyActions=document.createElement('div'),keyBack=document.createElement('button');keyError.className='keypad-error';keyError.setAttribute('role','alert');keyActions.className='keypad-finish-actions';keyBack.type='button';keyBack.className='keypad-back';keyBack.textContent='返回出題設定';keyBack.addEventListener('click',()=>keypad.close());
 for(const label of ['繼續修改','＋ 再出一題','開始練習']){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>{if(label==='繼續修改'){keyReady=false;showNumber();}else if(label==='＋ 再出一題'){if(addManualQuestion()){keyReady=false;activeNumber=0;replaceNumber=true;showNumber();}else keyError.textContent=$('formError').textContent;}else{keypad.close();startManualPractice();}});keyActions.append(button);}keypad.append(keyError,keyActions,keyBack);
 function showNumber(){
  keyError.textContent='';keyActions.hidden=!keyReady;keyGrid.hidden=keyReady;keyValue.hidden=keyReady;keyActions.children[1].disabled=manualDrafts.length>=20;keyActions.children[2].textContent='開始練習，共 '+manualDrafts.length+' 題';
  const count=Number($('manualCount').value||2);keyTitle.textContent='第 '+(manualIndex+1)+' 題 · 第 '+(activeNumber+1)+' 口 / 共 '+count+' 口';keyValue.textContent=$(numberIds[activeNumber]).value||'□';
  const parts=[];numberIds.slice(0,count).forEach((id,index)=>{if(index){const sign=document.createElement('span');sign.textContent=signAt(index)==='+'?' ＋ ':' − ';parts.push(sign);}const term=document.createElement('span');term.className='preview-term'+(index===activeNumber?' is-editing':'');term.textContent=$(id).value||'□';if(index===activeNumber){term.setAttribute('aria-current','true');term.setAttribute('aria-label','正在修改第 '+(index+1)+' 口：'+term.textContent);}parts.push(term);});const ending=document.createElement('span');ending.textContent=' ＝ ?';parts.push(ending);keyPreview.replaceChildren(...parts);
  if(keyReady)keyTitle.textContent='第 '+(manualIndex+1)+' 題準備好了！';keySigns.hidden=keyReady||activeNumber===0;keySignButtons.forEach(({button,sign})=>button.setAttribute('aria-pressed',String(activeNumber>0&&signAt(activeNumber)===sign)));
 }
 function numberKey(key){
  const field=$(numberIds[activeNumber]);
  if(key==='完成本題'){try{updateTerms(true);validateQuestion(readManual());keyReady=true;showNumber();keyActions.children[0].focus?.();}catch(error){keyError.textContent=error.message;}return;}
  if(key==='下一個'||key==='上一個'){const count=Number($('manualCount').value||2);activeNumber=(activeNumber+(key==='下一個'?1:count-1))%count;replaceNumber=true;showNumber();return;}
  if(key==='清除'){field.value='';replaceNumber=true;}
  else if(key==='⌫'){field.value=field.value.slice(0,-1);replaceNumber=false;}
  else {const previous=replaceNumber?'':field.value;if(previous.length>=5)return;field.value=(previous+key).replace(/^0+(?=\d)/,'');replaceNumber=false;}
  dirty=true;updateTerms();render();feedback('設定已修改，按「開始練習」開始新題。');showNumber();
 }
 for(const key of ['1','2','3','4','5','6','7','8','9','清除','0','⌫','上一個','下一個','完成本題']){const button=document.createElement('button');button.type='button';button.textContent=key;button.setAttribute('aria-label',key==='⌫'?'退一格':key);if(key==='上一個'||key==='下一個'||key==='完成本題')button.className='number-key-action';button.addEventListener('click',()=>numberKey(key));keyGrid.append(button);}
 numberIds.forEach((id,index)=>{const field=$(id);field.readOnly=true;field.setAttribute('inputmode','none');field.setAttribute('aria-haspopup','dialog');field.addEventListener('click',()=>{activeNumber=index;replaceNumber=true;keyReady=false;showNumber();keypad.showModal();});field.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activeNumber=index;replaceNumber=true;keyReady=false;showNumber();keypad.showModal();}});});
 keypad.addEventListener('keydown',event=>{if(keyReady)return;const key=event.key;if(/^\d$/.test(key)||key==='Backspace'||key==='Delete'){event.preventDefault();numberKey(key==='Backspace'?'⌫':key==='Delete'?'清除':key);}else if(key==='Enter'&&event.target===keypad){event.preventDefault();numberKey('完成本題');}});
 let draft=null;
 $('openProblem').addEventListener('click',()=>{hideEffect();draft={manualDrafts:manualDrafts.map(q=>({terms:q.terms.slice(),ops:q.ops.slice()})),manualIndex,first:$('first').value,second:$('second').value,subtract:$('subtract').checked,extra:['manualCount','term3','term4','term5','op3','op4','op5'].map(id=>[id,$(id).value]),dirty};$('problemDialog').showModal();});
 function cancelDraft(){if(draft){manualDrafts=draft.manualDrafts;manualIndex=draft.manualIndex;$('first').value=draft.first;$('second').value=draft.second;$('subtract').checked=draft.subtract;$('add').checked=!draft.subtract;draft.extra.forEach(([id,value])=>{$(id).value=value;});updateTerms();dirty=draft.dirty;$('formError').textContent='';render();}draft=null;}
 $('closeProblem').addEventListener('click',()=>{cancelDraft();$('problemDialog').close();});
 $('problemDialog').addEventListener('cancel',()=>cancelDraft());
 $('problemDialog').addEventListener('close',()=>{draft=null;$('openProblem').focus();});
 render();
 if(typeof Image==='function'){const buttonImage=new Image();buttonImage.onload=()=>document.documentElement.classList.add('confirm-art-ready');buttonImage.src='/assets/abacus-confirm-v1.png';}
 // Decorative art is optional: controls remain usable if either image fails.
 if(typeof Image==='function')Promise.all(['/assets/abacus-materials-v1.png','/assets/abacus-pieces-v1.png'].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=src;}))).then(()=>document.documentElement.classList.add('art-ready')).catch(()=>{});
})();
