(function(){
  'use strict';
  const E=window.PlanetBoard,$=id=>document.getElementById(id),game=document.body.dataset.game,total=E.ATTENTION_TOTALS[game],isParcel=game==='parcels';
  let state=null,busy=false,broken=false,timer=null,liveToken='';
  const el=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;n.className=className;return n;};
  const session=s=>s?.[game]?.session;
  const token=t=>t?[t.id,t.round,t.phase,t.activeAt,t.trials[t.round].selected?.join(',')||''].join(':'):'';
  function stopTimer(){if(timer!==null){clearTimeout(timer);timer=null;}}
  function load(){try{const raw=localStorage.getItem(E.KEY);state=raw?JSON.parse(raw):null;if(state&&!E.validState(state))throw Error();broken=false;}catch{broken=true;$('attentionSave').textContent='原來的進度暫時讀不到，請先回首頁下載備份；不會取代原資料。';}}
  function send(type,extra={}){
    if(busy||broken)return false;busy=true;let saved=false;
    try{
      const raw=localStorage.getItem(E.KEY),latest=raw?JSON.parse(raw):E.create();if(!E.validState(latest))throw Error();
      if(token(session(latest))!==token(session(state))){state=latest;liveToken='';$('attentionSave').textContent='已同步另一個分頁，請看看目前的進度再繼續。';}
      else{const next=E.act(latest,{type,game,...extra},null);if(next!==latest)localStorage.setItem(E.KEY,JSON.stringify(next));state=next;saved=true;
        if(type==='attentionBegin'&&!isParcel)liveToken=token(session(state));
        if(type==='attentionPause')liveToken='';$('attentionSave').textContent='✓ 已保存，回來可以接著練習。';}
    }catch{liveToken='';$('attentionSave').textContent='這一步暫時無法存檔，請保持頁面開啟，再試一次。';}
    busy=false;paint();
    if(type==='attentionSelect'&&session(state)?.phase==='active')$('attentionScene').children[1]?.children[extra.position]?.focus();
    else if(type!=='attentionWait')$('attentionTitle').focus();
    if(saved&&!isParcel&&type==='attentionBegin')$('attentionScene').scrollIntoView({block:'center',behavior:'auto'});return saved;
  }
  function ruleText(rule){return E.PARCEL_COLORS[rule.color]+(rule.mark?'、'+E.PARCEL_MARKS[rule.mark][1]+'貼紙':'')+(rule.smallOnly?'、不是大包裹（選小的）':'');}
  function parcelCard(item,i,interactive,selected,correct){const b=el(interactive?'button':'div','','parcel-card'+(selected?' selected':'')+(correct?' correct':''));b.dataset.color=item.color;b.setAttribute('aria-label','第 '+(i+1)+' 件：'+E.PARCEL_COLORS[item.color]+'、'+E.PARCEL_MARKS[item.mark][1]+'貼紙、'+(item.size==='small'?'小':'大')+'包裹');
    b.append(el('span','📦','parcel-icon '+item.size),el('strong',E.PARCEL_COLORS[item.color],'color-label'),el('span',E.PARCEL_MARKS[item.mark][0]+' '+E.PARCEL_MARKS[item.mark][1]+'貼紙'),el('small',item.size==='small'?'小包裹':'大包裹'),el('span',selected?'✓ 已選':'','selection-mark'));
    if(interactive){b.type='button';b.setAttribute('aria-pressed',String(selected));b.onclick=()=>send('attentionSelect',{position:i});}return b;
  }
  function renderParcels(t,c){
    const scene=$('attentionScene'),action=$('attentionAction'),help=$('attentionHelp');
    scene.appendChild(el('p','小動物要找：'+ruleText(c.rule),'rule-banner'));
    const grid=el('div','','parcel-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label','待檢查的包裹');
    c.choices.forEach((item,i)=>grid.appendChild(parcelCard(item,i,t.phase==='active',c.selected.includes(i),t.phase==='feedback'&&E.parcelMatch(item,c.rule))));scene.appendChild(grid);
    if(t.phase==='ready'){$('attentionTitle').textContent='先看清這次的收件條件';$('attentionInstruction').textContent=t.round===0?'先只找指定顏色。符合的都選起來，再一起檢查。':t.round===3?'這次多了一個條件：不要大包裹。先慢慢讀完再開始。':'所有條件都符合的包裹才選。不要急，可以隨時取消選擇。';action.textContent='我知道條件了，開始找 →';action.onclick=()=>send('attentionBegin');}
    else if(t.phase==='active'){$('attentionTitle').textContent='哪些包裹送錯地方了？';$('attentionInstruction').textContent='把符合收件條件的包裹全部選起來，交還給小動物。點第二次可以取消。';action.textContent='檢查這 '+c.selected.length+' 件包裹';action.disabled=broken||!c.selected.length;action.onclick=()=>send('attentionCheck');help.hidden=false;help.textContent='💡 幫我拆開條件';help.onclick=()=>send('attentionHint');if(c.hints)$('attentionFeedback').textContent='先找'+E.PARCEL_COLORS[c.rule.color]+'。'+(c.rule.mark?'再看是不是'+E.PARCEL_MARKS[c.rule.mark][1]+'貼紙。':'')+(c.rule.smallOnly?'最後確認是小包裹。':'不限制大小。');}
    else{$('attentionTitle').textContent=c.solved?'找齊了！小動物收到包裹了':'一起核對，再試一次';$('attentionInstruction').textContent='綠色框線標出符合條件的包裹。'+(c.solved?'你把每個條件都看清楚了。':'可能多選或少選了，看看每件的顏色、貼紙和大小。');nextAction(t,c);}
  }
  function nextAction(t,c){const action=$('attentionAction');action.textContent=!c.solved?'準備好，再試這一站':t.round===total-1?'完成練習，收下 3 顆星星':'下一站 →';action.onclick=()=>send('attentionNext');}
  function renderCrossing(t,c){const scene=$('attentionScene'),action=$('attentionAction'),help=$('attentionHelp');
    const advanced=t.round>=6;scene.appendChild(el('p',advanced?'新規則：紅燈停；綠燈可以走，但警察舉手也要停。':'紅燈先停手，綠燈按一次「小熊前進」。','rule-banner'));
    if(t.phase==='ready'||t.phase==='active'&&liveToken!==token(t)){
      $('attentionTitle').textContent=t.phase==='active'?'休息好了，再看一次訊號':t.round===6?'警察來幫忙了！先看新規則':'準備好了，再看訊號';$('attentionInstruction').textContent='每次只按一下就好。紅燈時不用按任何按鈕，等小熊說「等得好」。';scene.appendChild(el('div','🐻  🚦','signal-rest'));
      if(advanced)scene.appendChild(el('p','🖐️ 👮 警察舉手時，即使綠燈也要等。','rule-banner'));
      action.textContent=t.phase==='active'?'繼續，重新準備這一站':'我準備好了，看訊號 →';action.onclick=()=>send(t.phase==='active'?'attentionPause':'attentionBegin');return;
    }
    if(t.phase==='active'){
      $('attentionTitle').textContent='看清訊號，再決定';$('attentionInstruction').textContent='留意燈號和警察。沒有速度排名，還沒準備好可以暫停。';
      const panel=el('div','','signal-panel '+(c.green?'green':'red'));panel.setAttribute('role','status');panel.append(el('span',c.green?'🟢':'🔴','signal-light'),el('strong',c.green?'綠燈':'紅燈'));scene.appendChild(panel);
      scene.appendChild(el('div',c.police?'👮 🖐️ 警察舉手了':advanced?'👮 警察沒有舉手':'🐻 小熊正在看訊號','police-cue'));
      const go=el('button','🐻 小熊前進','primary go-button');go.onclick=()=>send('attentionGo',{signalAt:t.activeAt});scene.appendChild(go);action.hidden=true;help.hidden=false;help.textContent='先暫停一下';help.onclick=()=>send('attentionPause');
      const expected=token(t);timer=setTimeout(()=>{timer=null;if(document.hidden||liveToken!==expected)return;send('attentionWait',{signalAt:t.activeAt});},Math.max(0,E.crossingDuration(c)-(Date.now()-t.activeAt)));return;
    }
    const canGo=c.green&&!c.police;
    $('attentionTitle').textContent=c.solved?(canGo?'小熊前進了！':'等得好！小熊停住了'):t.feedback==='missed'?'小熊還在等你，一起再試一次':'先停一下，重新看清訊號';
    $('attentionInstruction').textContent=c.police?'剛剛警察舉手了，所以綠燈也要停手等待。':c.green?'剛剛是綠燈，可以按一次「小熊前進」。':'剛剛是紅燈，手先休息，不用按按鈕。';scene.appendChild(el('div',c.solved?'🐻 ✨':'🐻 💛','signal-rest'));nextAction(t,c);
  }
  function records(){const wrap=$('attentionRecords');wrap.replaceChildren();const list=state?.[game]?.records||[];if(!list.length){wrap.appendChild(el('p','完成一局後，這裡會留下練習紀錄。'));return;}
    for(const r of list.slice(-10).reverse()){const section=el('section','','record-row'),errors=r.results.reduce((n,c)=>n+c.errors,0);section.appendChild(el('h3',new Date(r.at).toLocaleDateString('zh-TW')+' · 完成 '+total+' 站'));section.appendChild(el('p',isParcel?'重新核對 '+errors+' 次 · 提示 '+r.results.reduce((n,c)=>n+c.hints,0)+' 次':'需要等待時按了前進 '+errors+' 次 · 綠燈再練習 '+r.results.reduce((n,c)=>n+c.misses,0)+' 次'));wrap.appendChild(section);}
  }
  function paint(){stopTimer();const scene=$('attentionScene'),action=$('attentionAction');scene.replaceChildren();action.hidden=false;action.disabled=broken;$('attentionHelp').hidden=true;$('attentionFeedback').textContent='';records();const t=session(state);
    $('attentionProgress').textContent=t?'第 '+(t.round+1)+' / '+total+' 站':total+' 站 · 每次準備好再開始';$('attentionPhase').textContent=t?({ready:'先看規則',active:'練習中',feedback:'一起看看',finished:'完成'})[t.phase]:'準備開始';
    if(!t){$('attentionTitle').textContent=isParcel?'先看條件，幫包裹找到主人':'看訊號，陪小熊走走停停';$('attentionInstruction').textContent=isParcel?'符合條件的全部選起來。先看顏色，再練習貼紙和大小，沒有倒數。':'綠燈按一次前進，紅燈時停手等待。後半段會加入警察舉手的新規則。';scene.appendChild(el('div',isParcel?'📦 ⭐ 📦':'🐻 🚦','signal-rest'));action.textContent='開始練習 →';action.onclick=()=>send('attentionStart');return;}
    if(t.phase==='finished'){$('attentionTitle').textContent='完成了！謝謝你仔細練習';$('attentionInstruction').textContent='3 顆星星已放進樂園，提示或重試也有完整獎勵。';scene.appendChild(el('div','⭐ ⭐ ⭐','detective-reward'));const visit=el('a','去樂園看看朋友 →','secondary park-link');visit.href='/board';scene.appendChild(visit);action.textContent='再玩一局';action.onclick=()=>send('attentionStart');return;}
    const c=t.trials[t.round];isParcel?renderParcels(t,c):renderCrossing(t,c);
  }
  function interrupt(){stopTimer();const t=session(state);if(!isParcel&&t?.phase==='active'&&liveToken===token(t))send('attentionPause');liveToken='';}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();else{load();paint();}});
  window.addEventListener('pagehide',interrupt);window.addEventListener('pageshow',event=>{if(event.persisted){liveToken='';load();paint();}});
  window.addEventListener('storage',event=>{if(event.key===E.KEY||event.key===null){const before=token(session(state));load();if(before!==token(session(state)))liveToken='';paint();}});
  load();paint();
})();
