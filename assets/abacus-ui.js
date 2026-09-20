(()=>{
 'use strict';
 const E=window.AbacusPractice,s=E.create(),$=id=>document.getElementById(id),names=['萬位','千位','百位','十位','個位'],columns=[];let dirty=false,autoSettings=null;
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
 function render(){columns.forEach(({buttons,digit},col)=>{const upper=s.digits[col]>=5,lower=s.digits[col]%5;buttons.forEach((button,i)=>{const active=i===0?upper:i<=lower;button.style.top=(i===0?(upper?52:0):108+(i<=lower?(i-1)*44:64+(i-1)*44))/348*100+'%';button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',names[col]+'，'+(i===0?'上珠，值五':'下珠第'+i+'顆，值一')+'，'+(active?'已靠梁，按下移開':'未靠梁，按下靠梁'));});digit.textContent=s.digits[col];});$('value').textContent=E.value(s).toLocaleString('en-US');$('mode').textContent=s.problem?'題目練習':'自由練習';$('questionLabel').textContent=s.problem?'用算盤撥出答案':'隨手撥一個數字';$('question').textContent=s.problem?(s.problem.terms||[s.problem.a,s.problem.b]).map((n,i)=>(i?((s.problem.ops||[s.problem.op])[i-1]==='+'?' ＋ ':' − '):'')+n).join('')+' ＝ ?':'自由撥珠';$('check').disabled=!s.problem||dirty;$('check').textContent=autoSettings&&s.result===true?'下一題':'確認答案';$('questionLabel').textContent=autoSettings?'電腦出題':s.problem?'用算盤撥出答案':'隨手撥一個數字';}
 names.forEach((name,col)=>{const lane=document.createElement('div');lane.className='ab-column';lane.setAttribute('role','group');lane.setAttribute('aria-label',name);const buttons=[];for(let i=0;i<5;i++){const button=document.createElement('button');button.type='button';button.className='ab-bead';button.addEventListener('click',()=>{E.move(s,col,i);render();feedback(dirty?'設定已修改，請先按「用這些數字出題」。':s.problem?'撥好後按「確認答案」。':'自由練習中，隨時可以清空重來。');});lane.append(button);buttons.push(button);}if(col===1||col===4){const dot=document.createElement('span');dot.className='ab-dot';lane.append(dot);}$('field').append(lane);const label=document.createElement('div'),text=document.createElement('span'),digit=document.createElement('strong');text.textContent=name;label.append(text,digit);$('places').append(label);columns.push({buttons,digit});});
 $('clear').addEventListener('click',()=>{E.clear(s);render();feedback(dirty?'算盤已清空；設定已修改，請重新出題。':s.problem?'算盤已清空，題目保留，可以重新算。':'算盤已清空，可以開始撥珠。');});
 $('check').addEventListener('click',()=>{if(dirty||!s.problem)return;if(autoSettings&&s.result===true){nextAuto();return;}const correct=E.check(s);render();feedback(correct?(autoSettings?'✓ 答對了！按「下一題」繼續挑戰。':'✓ 答對了！你撥出了正確的答案。'):'再試一次，還沒有答對。可以調整算珠，再按「確認答案」。',correct?'success':'retry');showEffect(correct);playAnswerSound(correct);});
 $('problemForm').addEventListener('submit',e=>{e.preventDefault();try{const count=Number($('manualCount').value||2),terms=[$('first').value,$('second').value],ops=[$('subtract').checked?'-':'+'];for(let i=3;i<=count;i++){terms.push($('term'+i).value);ops.push($('op'+i).value);}E.setSequence(s,terms,ops);autoSettings=null;dirty=false;$('formError').textContent='';if($('problemDialog').open)$('problemDialog').close();render();feedback('題目準備好了！算盤已歸零，撥好後再確認答案。');}catch(error){dirty=true;$('formError').textContent=error.message;render();feedback('請先修正題目設定。');}});
 for(const id of ['first','second','add','subtract','manualCount','term3','term4','term5','op3','op4','op5'])$(id).addEventListener('input',()=>{updateTerms();dirty=true;$('formError').textContent='';render();feedback('設定已修改，按「用這些數字出題」開始新題。');});
 $('free').addEventListener('click',()=>{E.free(s);autoSettings=null;dirty=false;$('formError').textContent='';if($('problemDialog').open)$('problemDialog').close();render();feedback('已回到自由練習，保留現在的算珠。');});
 function source(computer){$('computerForm').hidden=!computer;$('problemForm').hidden=computer;$('computerSource').setAttribute('aria-pressed',String(computer));$('manualSource').setAttribute('aria-pressed',String(!computer));}
 $('manualSource').addEventListener('click',()=>source(false));
 $('computerSource').addEventListener('click',()=>source(true));
 function nextAuto(){E.randomSequence(s,autoSettings.limit,autoSettings.operation,autoSettings.count);dirty=false;render();feedback('電腦已出題，撥好算珠後按「確認答案」。');}
 $('computerForm').addEventListener('submit',e=>{e.preventDefault();const settings={limit:Number($('autoLimit').value),operation:$('autoOperation').value,count:Number($('autoCount').value||2)};try{E.randomSequence(s,settings.limit,settings.operation,settings.count);autoSettings=settings;dirty=false;$('autoError').textContent='';$('formError').textContent='';if($('problemDialog').open)$('problemDialog').close();render();feedback('電腦已出題，撥好算珠後按「確認答案」。');}catch(error){$('autoError').textContent=error.message;}});
 function updateTerms(){const count=Number($('manualCount').value||2);for(let i=3;i<=5;i++)$('termRow'+i).hidden=i>count;}
 updateTerms();
 // A focused, touch-friendly editor avoids the software keyboard covering settings.
 const numberIds=['first','second','term3','term4','term5'];
 const keypad=document.createElement('dialog'),keyTitle=document.createElement('h2'),keyValue=document.createElement('output'),keyGrid=document.createElement('div');
 keypad.className='number-keypad';keyTitle.id='numberKeyTitle';keypad.setAttribute('aria-labelledby',keyTitle.id);keyValue.setAttribute('aria-live','polite');keyGrid.className='number-key-grid';keypad.append(keyTitle,keyValue,keyGrid);$('problemDialog').append(keypad);
 let activeNumber=0,replaceNumber=true;
 function showNumber(){keyTitle.textContent='第 '+(activeNumber+1)+' 個數字';keyValue.textContent=$(numberIds[activeNumber]).value||'0';}
 function numberKey(key){
  const field=$(numberIds[activeNumber]);
  if(key==='完成'){keypad.close();return;}
  if(key==='下一個'){const count=Number($('manualCount').value||2);activeNumber=(activeNumber+1)%count;replaceNumber=true;showNumber();return;}
  if(key==='清除'){field.value='';replaceNumber=true;}
  else if(key==='⌫'){field.value=field.value.slice(0,-1);replaceNumber=false;}
  else {const previous=replaceNumber?'':field.value;if(previous.length>=5)return;field.value=(previous+key).replace(/^0+(?=\d)/,'');replaceNumber=false;}
  updateTerms();dirty=true;$('formError').textContent='';render();feedback('設定已修改，按「用這些數字出題」開始新題。');showNumber();
 }
 for(const key of ['1','2','3','4','5','6','7','8','9','清除','0','⌫','下一個','完成']){const button=document.createElement('button');button.type='button';button.textContent=key;button.setAttribute('aria-label',key==='⌫'?'退一格':key);if(key==='下一個'||key==='完成')button.className='number-key-action';button.addEventListener('click',()=>numberKey(key));keyGrid.append(button);}
 numberIds.forEach((id,index)=>{const field=$(id);field.readOnly=true;field.setAttribute('inputmode','none');field.setAttribute('aria-haspopup','dialog');field.addEventListener('click',()=>{activeNumber=index;replaceNumber=true;showNumber();keypad.showModal();});field.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activeNumber=index;replaceNumber=true;showNumber();keypad.showModal();}});});
 keypad.addEventListener('keydown',event=>{const key=event.key;if(/^\d$/.test(key)||key==='Backspace'||key==='Delete'){event.preventDefault();numberKey(key==='Backspace'?'⌫':key==='Delete'?'清除':key);}else if(key==='Enter'&&event.target===keypad){event.preventDefault();numberKey('完成');}});
 let draft=null;
 $('openProblem').addEventListener('click',()=>{hideEffect();draft={first:$('first').value,second:$('second').value,subtract:$('subtract').checked,extra:['manualCount','term3','term4','term5','op3','op4','op5'].map(id=>[id,$(id).value]),dirty};$('problemDialog').showModal();});
 function cancelDraft(){if(draft){$('first').value=draft.first;$('second').value=draft.second;$('subtract').checked=draft.subtract;$('add').checked=!draft.subtract;draft.extra.forEach(([id,value])=>{$(id).value=value;});updateTerms();dirty=draft.dirty;$('formError').textContent='';render();}draft=null;}
 $('closeProblem').addEventListener('click',()=>{cancelDraft();$('problemDialog').close();});
 $('problemDialog').addEventListener('cancel',()=>cancelDraft());
 $('problemDialog').addEventListener('close',()=>{draft=null;$('openProblem').focus();});
 render();
 if(typeof Image==='function'){const buttonImage=new Image();buttonImage.onload=()=>document.documentElement.classList.add('confirm-art-ready');buttonImage.src='/assets/abacus-confirm-v1.png';}
 // Decorative art is optional: controls remain usable if either image fails.
 if(typeof Image==='function')Promise.all(['/assets/abacus-materials-v1.png','/assets/abacus-pieces-v1.png'].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=src;}))).then(()=>document.documentElement.classList.add('art-ready')).catch(()=>{});
})();
