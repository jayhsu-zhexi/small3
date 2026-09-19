(()=>{
 'use strict';
 const E=window.AbacusPractice,s=E.create(),$=id=>document.getElementById(id),names=['萬位','千位','百位','十位','個位'],columns=[];let dirty=false;
 function feedback(message,kind=''){const box=$('feedback');box.textContent=message;box.dataset.kind=kind;}
 function render(){columns.forEach(({buttons,digit},col)=>{const upper=s.digits[col]>=5,lower=s.digits[col]%5;buttons.forEach((button,i)=>{const active=i===0?upper:i<=lower;button.style.top=(i===0?(upper?52:0):108+(i<=lower?(i-1)*44:64+(i-1)*44))/348*100+'%';button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',names[col]+'，'+(i===0?'上珠，值五':'下珠第'+i+'顆，值一')+'，'+(active?'已靠梁，按下移開':'未靠梁，按下靠梁'));});digit.textContent=s.digits[col];});$('value').textContent=E.value(s).toLocaleString('en-US');$('mode').textContent=s.problem?'題目練習':'自由練習';$('questionLabel').textContent=s.problem?'用算盤撥出答案':'隨手撥一個數字';$('question').textContent=s.problem?s.problem.a+' '+(s.problem.op==='+'?'＋':'−')+' '+s.problem.b+' ＝ ?':'自由撥珠';$('check').disabled=!s.problem||dirty;}
 names.forEach((name,col)=>{const lane=document.createElement('div');lane.className='ab-column';lane.setAttribute('role','group');lane.setAttribute('aria-label',name);const buttons=[];for(let i=0;i<5;i++){const button=document.createElement('button');button.type='button';button.className='ab-bead';button.addEventListener('click',()=>{E.move(s,col,i);render();feedback(dirty?'設定已修改，請先按「用這兩個數字出題」。':s.problem?'撥好後按「確認答案」。':'自由練習中，隨時可以清空重來。');});lane.append(button);buttons.push(button);}if(col===1||col===4){const dot=document.createElement('span');dot.className='ab-dot';lane.append(dot);}$('field').append(lane);const label=document.createElement('div'),text=document.createElement('span'),digit=document.createElement('strong');text.textContent=name;label.append(text,digit);$('places').append(label);columns.push({buttons,digit});});
 $('clear').addEventListener('click',()=>{E.clear(s);render();feedback(dirty?'算盤已清空；設定已修改，請重新出題。':s.problem?'算盤已清空，題目保留，可以重新算。':'算盤已清空，可以開始撥珠。');});
 $('check').addEventListener('click',()=>{if(dirty||!s.problem)return;const correct=E.check(s);feedback(correct?'✓ 答對了！你撥出了正確的答案。':'再試一次，還沒有答對。可以調整算珠，再按「確認答案」。',correct?'success':'retry');});
 $('problemForm').addEventListener('submit',e=>{e.preventDefault();try{E.setProblem(s,$('first').value,$('subtract').checked?'-':'+',$('second').value);dirty=false;$('formError').textContent='';if($('problemDialog').open)$('problemDialog').close();render();feedback('題目準備好了！算盤已歸零，撥好後再確認答案。');}catch(error){dirty=true;$('formError').textContent=error.message;render();feedback('請先修正題目設定。');}});
 for(const id of ['first','second','add','subtract'])$(id).addEventListener('input',()=>{dirty=true;$('formError').textContent='';render();feedback('設定已修改，按「用這兩個數字出題」開始新題。');});
 $('free').addEventListener('click',()=>{E.free(s);dirty=false;$('formError').textContent='';if($('problemDialog').open)$('problemDialog').close();render();feedback('已回到自由練習，保留現在的算珠。');});
 let draft=null;
 $('openProblem').addEventListener('click',()=>{draft={first:$('first').value,second:$('second').value,subtract:$('subtract').checked,dirty};$('problemDialog').showModal();});
 function cancelDraft(){if(draft){$('first').value=draft.first;$('second').value=draft.second;$('subtract').checked=draft.subtract;$('add').checked=!draft.subtract;dirty=draft.dirty;$('formError').textContent='';render();}draft=null;}
 $('closeProblem').addEventListener('click',()=>{cancelDraft();$('problemDialog').close();});
 $('problemDialog').addEventListener('cancel',()=>cancelDraft());
 $('problemDialog').addEventListener('close',()=>{draft=null;$('openProblem').focus();});
 render();
 // Decorative art is optional: controls remain usable if either image fails.
 if(typeof Image==='function')Promise.all(['/assets/abacus-materials-v1.png','/assets/abacus-pieces-v1.png'].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=src;}))).then(()=>document.documentElement.classList.add('art-ready')).catch(()=>{});
})();
