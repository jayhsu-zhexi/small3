(function () {
  'use strict';
  const E=window.PlanetBoard,bank=window.PlanetBoardBank,$=id=>document.getElementById(id);
  if(!E||!bank){$('saveStatus').textContent='遊戲暫時沒有載入完成，請重新整理再試。';$('startBoard').disabled=true;return;}
  let state=null,selected='cat',busy=false,animationTicket=0,taskViewKey='',updates=[],corrupt=false;
  const taskDialog=$('taskDialog');
  const audio=window.PlanetBoardAudio?window.PlanetBoardAudio.createAudio(message=>{$('audioStatus').textContent=message}):null;
  function activateAudio(){if(!audio)return;audio.setMusic($('musicSetting').checked);audio.setEffects($('effectsSetting').checked);audio.activate();}
  $('musicSetting').onchange=()=>{$('audioStatus').textContent=$('musicSetting').checked?'輕音樂已開啟，可隨時取消勾選。':'輕音樂已關閉。';activateAudio();};
  $('effectsSetting').onchange=()=>{$('audioStatus').textContent=$('effectsSetting').checked?'音效已開啟。':'音效已關閉。';activateAudio();};
  const tiles=[],coordinates=[];
  for(let c=1;c<=7;c++)coordinates.push([1,c]);
  for(let r=2;r<=7;r++)coordinates.push([r,7]);
  for(let c=6;c>=1;c--)coordinates.push([7,c]);
  for(let r=6;r>=2;r--)coordinates.push([r,1]);
  function node(tag,text='',className=''){const el=document.createElement(tag);el.textContent=text;el.className=className;return el;}
  function button(parent,text,action,className='choice'){const b=node('button',text,className);b.type='button';b.onclick=action;parent.appendChild(b);return b;}
  const directionNames={'↑':'往上','→':'往右','↓':'往下','←':'往左'};
  function routeSlots(parent,label){
    const list=node('div','','route-steps');list.setAttribute('role','list');list.setAttribute('aria-label',label);parent.appendChild(list);
    const slots=[1,2,3].map(step=>{const item=node('div','','route-step');item.setAttribute('role','listitem');const icon=node('strong','','route-direction'),word=node('span','','route-word');item.append(node('span','第 '+step+' 步','route-step-index'),icon,word);list.appendChild(item);return {icon,word};});
    return values=>slots.forEach((slot,i)=>{slot.icon.textContent=values[i]||'—';slot.word.textContent=values[i]?directionNames[values[i]]:'待選';});
  }
  const token=node('span','🐱','token');token.setAttribute('aria-hidden','true');
  E.TYPES.forEach((kind,i)=>{
    const tile=node('div','','tile');tile.dataset.kind=kind;tile.style.gridRow=coordinates[i][0];tile.style.gridColumn=coordinates[i][1];
    tile.setAttribute('aria-label','第 '+(i+1)+' 格，'+E.INFO[kind][1]);
    tile.append(node('span',String(i+1).padStart(2,'0'),'tile-number'),node('span',E.INFO[kind][0],'tile-icon'),node('span',E.INFO[kind][1],'tile-name'));
    $('board').appendChild(tile);tiles.push(tile);
  });
  for(const [key,[icon,name]] of Object.entries(E.INFO))$('legendItems').appendChild(node('span',icon+' '+name));
  for(const [key,[icon,name]] of Object.entries(E.CHARACTERS)){
    const b=button($('characters'),'',()=>{selected=key;renderCharacters()},'character');b.dataset.character=key;b.append(node('span',icon),node('strong',name));
  }
  function renderCharacters(){for(const b of $('characters').children)b.setAttribute('aria-pressed',String(b.dataset.character===selected));token.textContent=E.CHARACTERS[selected][0];}
  function warn(message){$('saveStatus').textContent=message;$('saveStatus').classList.add('error');$('retrySave').classList.remove('hidden');}
  function persist(){
    if(!state)return true;
    try{
      localStorage.setItem(E.KEY,JSON.stringify(state));
      const raw=localStorage.getItem(E.HISTORY_KEY),history=raw?JSON.parse(raw):null;
      if(history&&!E.validHistory(history))throw Error('紀錄格式');
      localStorage.setItem(E.HISTORY_KEY,JSON.stringify(E.archive(history,state)));
      $('saveStatus').textContent='✓ 已自動存檔。回來時，會從這一站繼續。';$('saveStatus').classList.remove('error');$('retrySave').classList.add('hidden');return true;
    }catch{warn('目前無法完整存檔，請先保持頁面開啟。可稍後重試，或回首頁下載備份。');return false;}
  }
  function load(){try{const raw=localStorage.getItem(E.KEY);if(!raw||raw==='null')return;const value=JSON.parse(raw);if(!E.validState(value))throw Error('invalid');state=value;selected=state.character;persist();}catch{corrupt=true;warn('原來的旅程暫時讀不到，請先到首頁下載備份。開始新旅程前會再次確認。');}}
  function setPosition(position){tiles.forEach((tile,i)=>{tile.classList.toggle('current',i===position);if(i===position)tile.setAttribute('aria-current','step');else tile.removeAttribute('aria-current')});tiles[position].appendChild(token);}
  function paint(){
    $('setupCard').classList.toggle('hidden',!!state);$('playCard').classList.toggle('hidden',!state);$('newJourney').classList.toggle('hidden',!state);
    renderPark();renderCharacters();setPosition(state?state.position:0);
    const level=state?Math.max(state.baseLevel,E.parkOf(state).facilities.length):0,style=state?state.baseStyle:'space';
    $('baseCenter').dataset.level=String(level);$('baseLevel').textContent='LEVEL '+level+' / 3';
    $('baseName').textContent=level?E.BASES[style][0]+' '+E.STAGES[level]:'你的小小營地';
    $('baseCaption').textContent='建材蓋設施，星星換裝飾。到下方樂園和朋友一起玩！';
    $('baseMilestones').replaceChildren(...[1,2,3].map(n=>node('span',(n<=level?'✓ ':'')+['補給','建設','家園'][n-1],'milestone'+(n<=level?' done':''))));
    if(!state){$('tripLabel').textContent='準備出發';return;}
    $('tripLabel').textContent=state.phase==='finished'?'12 回合 · 探險完成':'旅程 '+state.turn+' / '+E.TOTAL+' 回合';
    $('avatar').textContent=E.CHARACTERS[state.character][0];$('characterName').textContent=E.CHARACTERS[state.character][1];
    $('starCount').textContent=E.parkOf(state).stars;$('supplyCount').textContent=state.supplies;
    $('dice').textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][Math.max(0,state.dice-1)];
    $('diceLabel').textContent=busy?'看看這次走到哪裡…':state.phase==='finished'?'今天的探險完成了！':state.dice?'上次擲出 '+state.dice+'，還有 '+(E.TOTAL-state.turn)+' 次擲骰。':'準備好，就丟骰子！';
    $('rollButton').disabled=busy||state.phase!=='ready';$('rollButton').classList.toggle('hidden',state.phase==='finished');
    $('resumeTask').classList.toggle('hidden',state.phase==='ready'||busy);$('resumeTask').textContent=state.phase==='finished'?'🏆 看看這趟旅程的成果':'繼續這一站 →';
    $('buildButton').disabled=busy||!['ready','reward','finished'].includes(state.phase);
    $('buildButton').textContent='🏗️ 蓋設施・換裝飾';
    const next=Object.entries(E.FACILITIES).find(([id])=>!E.parkOf(state).facilities.includes(id));
    $('buildNote').textContent=next?(state.supplies>=next[1][2]?'可以蓋'+next[1][1]+'了！打開工坊選一個喜歡的。':'再收集 '+(next[1][2]-state.supplies)+' 份建材，就能蓋'+next[1][1]+'。'):'設施都蓋好了！點樂園裡的設施和朋友一起玩。';
  }
  function dispatch(action){if(!state||busy)return;const next=E.act(state,action,bank);if(next===state)return;const rewarded=state.phase!=='reward'&&next.phase==='reward';state=next;persist();paint();renderTask();if(rewarded||action.type==='upgrade'||action.type==='purchase')audio?.effect('reward');}
  function stopSpeech(){if(window.speechSynthesis)window.speechSynthesis.cancel();}
  function speak(word){
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){$('taskFeedback').textContent='這個瀏覽器暫時無法朗讀。可以看英文單字繼續玩。';return;}
    try{stopSpeech();const voice=new SpeechSynthesisUtterance(word);voice.lang='en-US';voice.rate=.8;voice.onerror=()=>{$('taskFeedback').textContent='暫時無法朗讀，可以看單字繼續玩。'};window.speechSynthesis.speak(voice)}catch{$('taskFeedback').textContent='暫時無法朗讀，可以看單字繼續玩。'}
  }
  function explanation(t){if(t.kind==='money')return '把蘋果的數量乘上每顆的價格，共需要 '+t.answer+' 元。';if(t.kind==='memory')return '路線是：'+t.answer.map((direction,i)=>'第 '+(i+1)+' 步'+directionNames[direction]).join('；')+'。跟著念一遍，下次再試試看。';return '答案是「'+t.answer+'」。'+t.hint;}
  function renderTask(){
    if(!state||state.phase==='ready'){taskDialog.close();return;}
    const key=state.id+':'+state.turn+':'+state.phase+(state.phase==='finished'?':'+state.baseLevel:'');
    const bind=fn=>{updates.push(fn);fn()};
    if(taskViewKey!==key){
      taskViewKey=key;updates=[];stopSpeech();$('taskControls').replaceChildren();$('taskFeedback').textContent='';$('hintText').classList.add('hidden');
      const controls=$('taskControls');
      $('hintButton').classList.toggle('hidden',state.phase!=='task');$('demoButton').classList.toggle('hidden',state.phase!=='task');$('taskAction').classList.remove('hidden');
      if(state.phase==='task'){
        const t=state.task;$('taskCategory').textContent=E.INFO[t.subject].join(' ');$('taskTitle').textContent=t.title;$('taskText').textContent=t.text;
        if(t.kind==='money'){
          const grid=node('div','','coin-grid');controls.appendChild(grid);
          for(const coin of t.coins){
            const box=node('div','','coin-box');grid.appendChild(box);box.appendChild(node('strong',coin+' 元'));
            const row=node('div','','coin-controls');box.appendChild(row);
            const minus=button(row,'−',()=>dispatch({type:'coin',coin,delta:-1}), '');minus.setAttribute('aria-label','取回一枚 '+coin+' 元');
            const output=node('output','0');output.setAttribute('aria-label',coin+' 元硬幣數量');row.appendChild(output);
            const plus=button(row,'＋',()=>dispatch({type:'coin',coin,delta:1}), '');plus.setAttribute('aria-label','放入一枚 '+coin+' 元');
            bind(()=>{output.textContent=state.input.coins[coin]||0;minus.setAttribute('aria-disabled',String(!state.input.coins[coin]));});
          }
          const total=node('p','','big-signal');controls.appendChild(total);total.setAttribute('role','status');
          bind(()=>{total.textContent='托盤共 '+Object.entries(state.input.coins).reduce((sum,[c,n])=>sum+Number(c)*n,0)+' 元';});
          $('taskAction').textContent='準備好了，送出補給';$('taskAction').onclick=()=>dispatch({type:'answer'});
        }else if(t.kind==='memory'){
          const preview=node('div');controls.appendChild(preview);const showPreview=routeSlots(preview,'要記住的路線');
          const input=node('div');controls.appendChild(input);const progress=node('p','','route-progress');progress.setAttribute('role','status');input.appendChild(progress);const showSelection=routeSlots(input,'你選的路線');
          const arrows=node('div','','directions');input.appendChild(arrows);const buttons=[];
          const hide=button(preview,'我記好了，藏起路線',()=>{dispatch({type:'conceal'});buttons[0].focus()},'secondary');
          for(const dir of E.dirs){const b=button(arrows,'',()=>dispatch({type:'direction',value:dir}),'');b.setAttribute('aria-label',directionNames[dir]);b.append(node('strong',dir),node('span',directionNames[dir],'direction-word'));buttons.push(b);}
          button(input,'退回上一步',()=>dispatch({type:'undo'}),'secondary');
          bind(()=>{preview.classList.toggle('hidden',state.task.concealed);input.classList.toggle('hidden',!state.task.concealed);showPreview(state.task.concealed?[]:state.task.answer);showSelection(state.input.sequence);progress.textContent='你選的路線：'+state.input.sequence.length+' / 3 步';$('taskAction').disabled=!state.task.concealed||state.input.sequence.length!==3;});
          $('taskAction').textContent='照這條路線前進';$('taskAction').onclick=()=>dispatch({type:'answer'});
        }else{
          if(t.subject==='english')button(controls,'🔊 聽聽 '+t.word,()=>speak(t.word),'secondary');
          const grid=node('div','','choice-grid');controls.appendChild(grid);
          for(const choice of t.choices)button(grid,choice,()=>dispatch({type:'answer',value:choice}));
          $('taskAction').classList.add('hidden');
        }
        bind(()=>{
          $('hintText').classList.toggle('hidden',!state.task.hintUsed);$('hintText').textContent=state.task.hintUsed?state.task.hint:'';
          $('hintButton').textContent=state.task.kind==='memory'?'💡 再看一次路線':'💡 給我提示';
          $('taskFeedback').textContent=state.task.attempts?'還差一點。慢慢調整、再試一次；也可以看提示一起完成。':'';
        });
      }else if(state.phase==='encounter'){
        const [title,copy,amount]=E.encounter(state);$('taskCategory').textContent=E.INFO[state.encounter.kind].join(' ');$('taskTitle').textContent=title;$('taskText').textContent=copy;
        controls.appendChild(node('div',E.INFO[state.encounter.kind][0],'reward-icon'));
        $('taskAction').textContent='收下 '+amount+' 份建材';$('taskAction').onclick=()=>dispatch({type:'claim'});
      }else if(state.phase==='reward'){
        const outcome=state.outcome;$('taskCategory').textContent='✦ 旅途收穫';$('taskTitle').textContent=outcome.title;$('taskText').textContent=state.task&&state.task.demoUsed?explanation(state.task):outcome.text;
        controls.appendChild(node('div',outcome.stars?'🌟':'🎁','reward-icon'));
        const chips=node('div','','reward-chips');chips.appendChild(node('span','🧱 +'+outcome.supplies+' 建材'));if(outcome.stars)chips.appendChild(node('span','⭐ +1 星星'));controls.appendChild(chips);
        button(controls,'🏗️ 看看這些獎勵能蓋什麼',()=>openBuild(),'secondary');
        $('taskAction').textContent=state.turn===E.TOTAL?'完成旅程，看看成果':'收進背包，繼續出發';$('taskAction').onclick=()=>{dispatch({type:'continue'});if(state.phase==='finished')openTask();else $('rollButton').focus()};
      }else{
        $('taskCategory').textContent='🏆 每趟旅程，都值得慶祝';$('taskTitle').textContent='旅程完成，樂園繼續長大';$('taskText').textContent='12 次擲骰完成了！今天你和'+E.CHARACTERS[state.character][1]+'走過星球，完成 '+state.events.length+' 個學習任務。';
        const stats=node('div','','result-stats');
        const stars=node('div','這趟獲得的星星');stars.appendChild(node('strong','⭐ '+state.stars));
        const base=node('div','我的樂園');base.appendChild(node('strong',E.parkOf(state).facilities.length+' 座設施・'+E.parkOf(state).decorations.length+' 種裝飾'));stats.append(stars,base);controls.appendChild(stats);
        const list=node('ul','','learning-list');
        for(const kind of ['math','chinese','english','focus']){const events=state.events.filter(e=>e.subject===kind);if(events.length)list.appendChild(node('li',E.INFO[kind].join(' ')+'：'+events.length+' 個任務，獨立 '+events.filter(e=>e.mode==='independent').length+'、提示 '+events.filter(e=>e.mode==='hint').length+'、重試 '+events.filter(e=>e.mode==='retry').length+'、示範 '+events.filter(e=>e.mode==='demo').length+'。'));}
        if(!state.events.length)list.appendChild(node('li','這次遇到了很多驚喜站。下次再來尋找四科任務！'));controls.appendChild(list);
        button(controls,'🏗️ 去樂園蓋設施・換裝飾',()=>openBuild(),'secondary');
        $('taskAction').textContent='繼續建設，開始新旅程';$('taskAction').onclick=restartJourney;
      }
      if(state.phase!=='task'||state.task.kind!=='memory')$('taskAction').disabled=false;
      if(taskDialog.open)$('taskTitle').focus();
    }
    for(const update of updates)update();
  }
  function openTask(){if(!state||state.phase==='ready'||busy)return;renderTask();if(!taskDialog.open)taskDialog.showModal();$('taskTitle').focus();}
  function renderPark(){
    const park=state?E.parkOf(state):{facilities:[],decorations:[]};
    $('parkShop').disabled=!state||busy||!['ready','reward','finished'].includes(state.phase);
    $('parkDecor').textContent=park.decorations.map(id=>E.DECORATIONS[id][0]+' '+E.DECORATIONS[id][1]).join('　');
    $('parkMessage').textContent=park.facilities.length?'點亮的設施可以玩！樂園和剩餘獎勵都會留到下一趟旅程。':'第一個目標：收集 4 份建材，幫朋友蓋溜滑梯。';
    $('parkScene').replaceChildren();
    for(const [id,[icon,name,cost,copy]] of Object.entries(E.FACILITIES)){
      const owned=park.facilities.includes(id),place=button($('parkScene'),'',()=>{
        if(!owned){openBuild();return;}
        $('parkMessage').textContent=copy;audio?.effect('reward');
        const actor=place.children[1];
        if(actor.animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)actor.animate(id==='slide'?[{transform:'translate(-22px,-35px)'},{transform:'translate(24px,14px)'},{transform:'translate(0,0)'}]:id==='garden'?[{transform:'translate(-25px,0)'},{transform:'translate(25px,-25px)'},{transform:'translate(0,0)'}]:[{transform:'scale(.3)'},{transform:'scale(1.3)'},{transform:'scale(1)'}],{duration:1400,easing:'ease-in-out'});
      },'park-place'+(owned?' owned':''));
      place.disabled=!owned&&(!state||busy||!['ready','reward','finished'].includes(state.phase));
      place.append(node('span',icon,'park-building'),node('span',owned?(id==='garden'?'🦋':id==='house'?'🐰':E.CHARACTERS[state.character][0]):'','park-actor'),node('strong',name),node('small',owned?'點我一起玩':cost+' 建材・等你來蓋'));
    }
  }
  function openBuild(){
    if(!state||busy||!['ready','reward','finished'].includes(state.phase))return;
    const park=E.parkOf(state);$('baseChoices').replaceChildren();
    $('buildDescription').textContent='你有 '+state.supplies+' 份建材、'+park.stars+' 顆星星。設施和裝飾會一直保留。';
    for(const [category,catalog,currency,balance] of [['facilities',E.FACILITIES,'建材',state.supplies],['decorations',E.DECORATIONS,'星星',park.stars]]){
      for(const [id,[icon,name,cost]] of Object.entries(catalog)){
        const owned=park[category].includes(id),b=button($('baseChoices'),icon+' '+name+' · '+(owned?'已擁有':cost+' '+currency),()=>{
          dispatch({type:'purchase',category,item:id});$('buildDialog').close();taskDialog.close();
          $('parkMessage').textContent='完成了！'+name+'加入你的樂園。'+(category==='facilities'?'點它，和朋友一起玩！':'下趟旅程也會陪著你。');
          $('parkScene').scrollIntoView({block:'center',behavior:'auto'});$('parkShop').focus();
          if($('parkScene').animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)$('parkScene').animate([{opacity:.3,transform:'scale(.9)'},{opacity:1,transform:'scale(1)'}],{duration:650});
        },'base-choice');b.disabled=owned||balance<cost;
        if(!owned&&balance<cost)b.appendChild(node('small','還差 '+(cost-balance)+' '+currency));
      }
    }
    if(!$('buildDialog').open)$('buildDialog').showModal();
  }
  function restartJourney(){if(!state||busy||!persist())return;state=E.nextJourney(state);taskViewKey='';taskDialog.close();persist();paint();$('rollButton').focus();$('announcement').textContent='新的旅程出發！你的樂園和獎勵都保留下來了。';}
  $('parkShop').onclick=openBuild;
  async function roll(){
    if(!state||busy||state.phase!=='ready')return;
    activateAudio();
    const from=state.position,next=E.act(state,{type:'roll'},bank),ticket=++animationTicket;
    state=next;persist();busy=true;paint();setPosition(from);$('dice').classList.add('rolling');
    if(window.matchMedia('(max-width: 780px)').matches)$('board').scrollIntoView({block:'center',behavior:'auto'});
    const animated=$('gentleMotion').checked&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
    if(animated){
      for(let frame=0;frame<10;frame++){
        if(ticket!==animationTicket)return;
        $('dice').textContent=faces[frame%6];if(frame%2===0)audio?.effect('dice');
        await new Promise(resolve=>setTimeout(resolve,frame<7?90:160));
      }
    }
    if(ticket!==animationTicket)return;
    $('dice').classList.remove('rolling');$('dice').textContent=faces[state.dice-1];
    $('diceLabel').textContent='擲出 '+state.dice+'！現在一步一步前進。';
    for(let step=1;step<=state.dice;step++){
      if(ticket!==animationTicket)return;
      const before=animated?token.getBoundingClientRect():null;setPosition((from+step)%24);audio?.effect('step');
      if(animated){
        const after=token.getBoundingClientRect(),dx=before.left-after.left,dy=before.top-after.top;
        if(token.animate){const hop=token.animate([{transform:'translate('+dx+'px,'+dy+'px) rotate(-6deg)'},{transform:'translate('+(dx/2)+'px,'+(dy/2-15)+'px) rotate(6deg)',offset:.5},{transform:'translate(0,0) rotate(0deg)'}],{duration:650,easing:'ease-in-out'});await hop.finished.catch(()=>{});}
        else await new Promise(resolve=>setTimeout(resolve,650));
        if(ticket!==animationTicket)return;
        await new Promise(resolve=>setTimeout(resolve,150));
      }
    }
    if(ticket!==animationTicket)return;
    busy=false;audio?.effect('land');paint();$('announcement').textContent='擲出 '+state.dice+'，到達'+E.INFO[E.TYPES[state.position]][1];openTask();
  }
  function start(){activateAudio();state=E.create(selected);corrupt=false;taskViewKey='';persist();paint();$('rollButton').focus();}
  $('startBoard').onclick=()=>{if(corrupt){$('restartDialog').showModal();return;}start();};
  $('rollButton').onclick=roll;$('resumeTask').onclick=openTask;$('buildButton').onclick=openBuild;
  $('hintButton').onclick=()=>{dispatch({type:'hint'});if(state.task.kind==='memory')$('taskTitle').focus()};$('demoButton').onclick=()=>dispatch({type:'demo'});
  $('closeTask').onclick=()=>taskDialog.close();taskDialog.onclose=stopSpeech;
  $('cancelBuild').onclick=()=>$('buildDialog').close();$('helpButton').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();
  $('retrySave').onclick=persist;
  $('newJourney').onclick=()=>{if(persist())$('restartDialog').showModal()};
  $('confirmRestart').onclick=()=>{$('restartDialog').close();if(corrupt){start();return;}restartJourney()};
  $('cancelRestart').onclick=()=>$('restartDialog').close();
  $('goHome').onclick=event=>{stopSpeech();if(!persist())event.preventDefault();else animationTicket++};
  window.addEventListener('pagehide',()=>{animationTicket++;stopSpeech();audio?.dispose()});
  window.addEventListener('pageshow',event=>{if(event.persisted){animationTicket++;busy=false;$('dice').classList.remove('rolling');state=null;load();paint();if(state&&state.phase!=='ready')openTask();}});
  document.addEventListener?.('visibilitychange',()=>{if(document.hidden){audio?.suspend();stopSpeech();}else activateAudio();});
  window.addEventListener('storage',event=>{if(event.key===E.KEY||event.key===null){animationTicket++;busy=false;taskDialog.close();state=null;corrupt=false;load();paint();$('announcement').textContent='已同步另一個分頁的旅程。';}});
  load();paint();if(state&&state.phase!=='ready')openTask();
})();
