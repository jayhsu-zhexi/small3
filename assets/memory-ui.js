(function(){
  'use strict';
  const E=window.OrbitMemory,$=id=>document.getElementById(id),canvas=$('particles'),ctx=canvas.getContext('2d'),dialog=$('missionDialog'),launchDialog=$('launchDialog');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sound=window.OrbitAudio.create(message=>{$('audioStatus').textContent=message});
  const records=window.OrbitRecords.create(()=>window.localStorage),preferences=records.loadPreferences(),hudView=new Map();
  const themes=[['A','金屬反應爐'],['B','水晶能源'],['C','太空裝備艙']],themeKey='learning-planet-memory-theme-v1';
  const artworkFiles=['/assets/memory-card-shells.webp','/assets/memory-equipment-1.webp','/assets/memory-equipment-2.webp','/assets/memory-equipment-3.webp'];
  let theme='C',artworkReady=false,artworkLoading=false,artworkAttempt=0;
  try{const saved=window.localStorage.getItem(themeKey);if(themes.some(([key])=>key===saved))theme=saved;}catch{}
  let selected=preferences.size,duration=preferences.duration,manualTime=preferences.manualTime,planned=null,state=null,cards=[],raf=null,tickTimer=null,endTimer=null,launchTimer=null,launching=false,run=0,viewKey='',dialogMode='',particles=[],canvasDirty=false,lowTimeAnnounced=false,resultReport=null,boardFit=null;
  $('memoryMusic').checked=preferences.music;$('memorySound').checked=preferences.sound;
  function savePreferences(){records.savePreferences({size:selected,duration,manualTime,music:$('memoryMusic').checked,sound:$('memorySound').checked});}
  function node(tag,text='',className=''){const n=document.createElement(tag);n.textContent=text;n.className=className;return n;}
  for(let i=0;i<28;i++){const trail=node('i');trail.style.setProperty('--angle',(i*360/28)+'deg');trail.style.setProperty('--delay',((i%5)*.045)+'s');$('launchTrails').appendChild(trail);}
  for(let i=0;i<20;i++){const spark=node('i');spark.style.setProperty('--angle',(i*18)+'deg');spark.style.setProperty('--delay',((i%4)*.065)+'s');spark.style.setProperty('--distance',(110+i%5*25)+'px');$('resultSparks').appendChild(spark);}
  function equipment(id){const extra=id>=26,art=node('span','','equipment-art equipment-sheet-'+(extra?3:id<13?1:2)),cell=extra?id-26:id%13,columns=extra?2:4;art.style.backgroundPosition=(cell%columns*100/(columns-1))+'% '+(Math.floor(cell/columns)*100/(columns-1))+'%';return art;}
  function themeFan(){const fan=node('span','','theme-fan'),back=node('span','','preview-card preview-back'),front=node('span','','preview-card preview-front');fan.setAttribute('aria-hidden','true');back.appendChild(node('span','','card-art'));front.append(node('span','','card-art'),equipment(0));fan.append(back,front);return fan;}
  function chooseTheme(key,save=false){theme=key;document.body.dataset.cardTheme=theme;const name=themes.find(([id])=>id===theme)[1];for(const b of $('memoryThemes').children)b.setAttribute('aria-pressed',String(b.dataset.theme===theme));$('currentTheme').textContent=theme;$('memoryThemeSettings').setAttribute('aria-label','選擇卡牌外觀，目前 '+theme+' '+name);$('themeSelection').textContent='目前選擇：'+theme+' '+name;if(save)try{window.localStorage.setItem(themeKey,theme);}catch{}}
  for(const [key,name] of themes){
    const b=node('button','','theme-option');b.type='button';b.dataset.theme=key;b.setAttribute('aria-label',key+' '+name);b.setAttribute('title',key+' '+name);
    b.append(themeFan(),node('span',key,'theme-letter'));b.onclick=()=>chooseTheme(key,true);$('memoryThemes').appendChild(b);
  }
  $('themeSettingsPreview').appendChild(themeFan());
  chooseTheme(theme);
  function loadArtwork(){
    if(artworkLoading||artworkReady)return;
    const attempt=++artworkAttempt;let remaining=artworkFiles.length;
    artworkLoading=true;$('memoryStartCaption').textContent='準備卡牌中…';$('memoryStart').disabled=true;$('memoryStart').classList.add('is-loading');$('memoryStart').setAttribute('aria-busy','true');$('artworkStatus').hidden=false;$('artworkStatus').textContent='正在準備卡牌…';
    const timeout=setTimeout(()=>finish(false),20000);
    function finish(ok){
      if(attempt!==artworkAttempt||!artworkLoading)return;
      clearTimeout(timeout);artworkLoading=false;artworkReady=ok;$('memoryStartCaption').textContent=ok?'開始救援':'重試載入';$('memoryStart').disabled=false;$('memoryStart').classList.remove('is-loading');$('memoryStart').setAttribute('aria-busy','false');
      $('memoryStart').setAttribute('aria-label',ok?'啟動救援':'重新載入卡牌');$('memoryStart').setAttribute('title',ok?'啟動救援':'重新載入卡牌');$('artworkStatus').hidden=ok;$('artworkStatus').textContent=ok?'卡牌已準備好。':'卡牌圖片暫時無法載入，請點火箭重試。';
    }
    for(const src of artworkFiles){const img=new window.Image();img.onload=()=>{if(--remaining===0)finish(true)};img.onerror=()=>finish(false);img.src=src;}
  }
  function prepareResults(){for(const id of ['resultWinArt','resultLossArt']){const img=$(id);if(img.dataset.src){img.onload=()=>img.classList.add('is-ready');img.onerror=()=>{img.classList.remove('is-ready');img.removeAttribute('src');img.dataset.src='/assets/memory-result-'+(id==='resultWinArt'?'win':'loss')+'.webp';};img.src=img.dataset.src;delete img.dataset.src;}}}
  function clock(ms){if(ms===null)return '∞';const total=Math.ceil(ms/1000);return String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');}
  for(const [level,count] of E.COUNTS.entries()){
    const b=node('button','','count-option'),art=node('span','','control-art art-cards'),number=node('strong',count+'+','count-number'),bars=node('span','','difficulty-bars');
    b.type='button';b.dataset.count=String(count);b.setAttribute('aria-label',count+' 張起，最多 '+(count+E.EXTRA[count])+' 張');b.setAttribute('title',count+' 張起，依畫面補齊完整配對'+(level===0?'，第一次玩可以從這裡開始':''));art.setAttribute('aria-hidden','true');bars.setAttribute('aria-hidden','true');
    for(let i=0;i<5;i++)bars.appendChild(node('i','',i<=level?'lit':''));
    b.append(art,number,bars);b.onclick=()=>{if(selected!==count)manualTime=false;selected=count;setup();savePreferences();};$('memoryCounts').appendChild(b);
  }
  function boardSpace(width,height,fit){if(!fit)return {width:Math.min(1160,Math.max(260,width-72)),height:Math.max(300,height-255),gap:10};const bounds=$('memoryBoard').getBoundingClientRect();return {width:Math.max(1,bounds.width-12),height:Math.max(1,bounds.height-12),gap:4};}
  // Browser chrome changes visible height, but must not choose a different phone deck.
  function portraitPhone(){return window.innerWidth<=600&&window.innerWidth<window.innerHeight;}
  function previewPlan(){
    const width=window.innerWidth,height=window.visualViewport?.height||window.innerHeight,fit=width<=1100||height<=600;
    if(!fit){const space=boardSpace(width,height,false);return E.plan(selected,space.width,space.height,space.gap);}
    // Measure the real mission shell synchronously, before the browser paints.
    // Preserve the home page's height so measuring never shifts its scroll position.
    const body=document.body,game=$('memoryGame'),home=$('memoryHome'),hidden=game.hidden,focused=document.activeElement;
    body.style.setProperty('--measure-page-height',(body.scrollHeight||height)+'px');body.style.setProperty('--mission-viewport',height+'px');
    body.classList.add('measuring-mission');body.classList.add('in-mission');body.classList.add('fit-board');game.hidden=false;const homeHidden=home.hidden;home.hidden=true;
    try{const space=boardSpace(width,height,true);return E.plan(selected,space.width,space.height,space.gap,portraitPhone());}
    finally{game.hidden=hidden;home.hidden=homeHidden;body.classList.remove('measuring-mission');body.classList.remove('in-mission');body.classList.remove('fit-board');if(focused&&document.activeElement!==focused)focused.focus({preventScroll:true});}
  }
  function setup(){
    if(state)return;planned=previewPlan();if(!manualTime)duration=planned.seconds;
    for(const b of $('memoryCounts').children)b.setAttribute('aria-pressed',String(Number(b.dataset.count)===selected));
    $('setupCards').textContent=planned.size;$('setupLayout').textContent=planned.cols+' × '+planned.rows;
    $('setupPlan').setAttribute('aria-label','本次 '+planned.size+' 張，'+planned.size/2+' 組配對，'+planned.cols+' 欄 '+planned.rows+' 列');
    const time=clock(duration===null?null:duration*1000);$('setupTime').textContent=time;$('memoryTimeSettings').setAttribute('aria-label','調整任務時間，目前 '+(duration===null?'不限時':time));$('timeRecommendation').textContent=planned.size+' 張卡牌・建議 '+clock(planned.seconds*1000);
    if(duration===null){const icon=node('span','','cinematic-icon icon-infinity');icon.setAttribute('aria-hidden','true');$('memoryTimeValue').replaceChildren(node('span','不限時','sr-only'),icon);}else $('memoryTimeValue').textContent=time;
    $('timeMinus').disabled=duration===180;$('timePlus').disabled=duration===null;$('timeMinus').setAttribute('aria-label',duration===null?'改為 10 分鐘':'減少 1 分鐘');$('timePlus').setAttribute('aria-label',duration===600?'改為不限時間':'增加 1 分鐘');$('timeMinus').setAttribute('title',$('timeMinus').getAttribute('aria-label'));$('timePlus').setAttribute('title',$('timePlus').getAttribute('aria-label'));$('setupShield').textContent=planned.shields;$('setupPairs').textContent=String(planned.size/2).padStart(2,'0');
  }
  function adjustTime(direction){manualTime=true;duration=direction>0?(duration===null||duration===600?null:Math.min(600,duration+60)):(duration===null?600:Math.max(180,duration-60));setup();savePreferences();}
  const settingPanels=[['memoryTimeSettings','timeSettingsDialog','timeSettingsTitle','timeSettingsClose','timeSettingsDone'],['memoryThemeSettings','themeSettingsDialog','themeSettingsTitle','themeSettingsClose','themeSettingsDone']];
  for(const [triggerId,panelId,titleId,closeId,doneId] of settingPanels){
    const trigger=$(triggerId),panel=$(panelId);
    function close(){if(!panel.open)return;panel.close();trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});}
    trigger.onclick=()=>{if(state||launching||settingPanels.some(([,id])=>$(id).open))return;panel.showModal();trigger.setAttribute('aria-expanded','true');$(titleId).focus({preventScroll:true});};
    $(closeId).onclick=close;$(doneId).onclick=close;
    panel.addEventListener('cancel',event=>{event.preventDefault();close();});
    panel.addEventListener('click',event=>{if(event.target!==panel)return;const rect=panel.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();});
  }
  function clearEffects(){particles=[];if(raf!==null)cancelAnimationFrame(raf);raf=null;if(ctx&&canvasDirty)ctx.clearRect(0,0,window.innerWidth,window.innerHeight);canvasDirty=false;}
  function stop(){clearEffects();if(tickTimer!==null)clearTimeout(tickTimer);tickTimer=null;if(endTimer!==null)clearTimeout(endTimer);endTimer=null;if(launchTimer!==null)clearTimeout(launchTimer);launchTimer=null;launching=false;launchDialog.close();document.body.classList.remove('is-launching');}
  function layout(){
    // Pinch zoom magnifies the current board without changing remembered positions.
    const viewport=window.visualViewport;if(state&&viewport&&viewport.scale!==1)return;
    const width=window.innerWidth,height=viewport?.height||window.innerHeight,fit=!!state&&(width<=1100||height<=600);
    document.body.classList.toggle('fit-board',fit);document.body.style.setProperty('--mission-viewport',height+'px');
    if(state){
      let cols,tileW,gap=fit?4:10;
      if(fit){
        $('memoryBoardHint').hidden=true;
        const bounds=$('memoryBoard').getBoundingClientRect(),available=Math.max(1,bounds.width-12),space=Math.max(1,bounds.height-12);
        // Maximize card size within the actual remaining space, including mobile browser bars.
        const tileSize=count=>Math.max(0,Math.min(128,(available-gap*(count-1))/count,(space-gap*(Math.ceil(state.size/count)-1))/Math.ceil(state.size/count)/1.25));
        if(boardFit&&boardFit.width===width&&Math.abs(boardFit.available-available)<1){cols=boardFit.cols;tileW=tileSize(cols);}
        else{const rectangle=E.rectangle(state.size,available,space,gap,portraitPhone()?E.PHONE_COLUMNS[selected]:0);cols=rectangle.cols;tileW=rectangle.tile;}
        boardFit={width,available,cols};tileW=Math.floor(tileW*100)/100;
      }else{
        boardFit=null;const space=boardSpace(width,height,false),rectangle=E.rectangle(state.size,space.width,space.height,gap);
        cols=rectangle.cols;tileW=rectangle.tile;$('memoryBoardHint').hidden=true;
      }
      $('memoryGrid').style.setProperty('--cols',cols);$('memoryGrid').style.setProperty('--gap',gap+'px');$('memoryGrid').style.setProperty('--grid-width',(cols*tileW+gap*(cols-1))+'px');$('memoryGrid').style.setProperty('--card-height',(tileW*1.25)+'px');
      for(const card of cards)card.classList.toggle('compact',tileW<80);
    }else{boardFit=null;setup();}
    const ratio=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*ratio);canvas.height=Math.round(window.innerHeight*ratio);if(ctx)ctx.setTransform(ratio,0,0,ratio,0,0);
  }
  function buildDeck(){cards=[];$('memoryGrid').replaceChildren();state.deck.forEach((id,index)=>{const b=node('button','','memory-card');b.type='button';b.dataset.index=String(index);b.style.setProperty('--arrival-delay',Math.min(index*12,250)+'ms');const inner=node('span','','card-inner'),back=node('span','','card-side card-back'),front=node('span','','card-side card-front');inner.setAttribute('aria-hidden','true');back.appendChild(node('span','','card-art'));front.append(node('span','','card-art'),equipment(id));inner.append(back,front);b.appendChild(inner);b.onclick=()=>advance({type:'flip',index});$('memoryGrid').appendChild(b);cards.push(b);});layout();}
  function start(){
    if(launching||settingPanels.some(([,id])=>$(id).open))return;if(!artworkReady){loadArtwork();return;}
    run++;stop();sound.suspend();dialog.close();dialogMode='';selected=Number(selected);
    const now=performance.now(),size=state?state.size:planned.size;state=E.act(E.create(size,Math.random,now,duration),{type:'pause'},now).state;
    savePreferences();viewKey='';hudView.clear();resultReport=null;boardFit=null;lowTimeAnnounced=false;document.body.classList.add('in-mission');$('memoryHome').hidden=true;$('memoryGame').hidden=false;$('memoryStatus').textContent='正在前往太空站…';$('deckLabel').textContent=state.size+' 張';prepareResults();
    buildDeck();render();sound.setEnabled($('memorySound').checked);sound.setMusic($('memoryMusic').checked);launching=true;$('memoryGame').scrollIntoView({block:'start',behavior:'auto'});
    if(reduced.matches){finishLaunch();return;}
    document.body.classList.add('is-launching');launchDialog.showModal();$('launchSkip').focus();
    const ticket=run;Promise.resolve(sound.activate()).then(()=>{if(ticket===run&&launching&&!document.hidden)sound.play('launch');});
    launchTimer=setTimeout(()=>{if(ticket===run)finishLaunch();},2400);
  }
  function finishLaunch(background=false){
    if(!launching)return;if(launchTimer!==null)clearTimeout(launchTimer);launchTimer=null;launching=false;launchDialog.close();document.body.classList.remove('is-launching');sound.suspend();
    if(background===true||document.hidden){showDialog('pause');return;}
    sound.setEnabled($('memorySound').checked);sound.setMusic($('memoryMusic').checked);sound.startMusic(true);advance({type:'resume'});$('memoryStatus').textContent='找出兩張相同的模組，重新連接能源。';cards[0]?.focus({preventScroll:true});
  }
  function update(key,value,paint){if(hudView.has(key)&&hudView.get(key)===value)return;hudView.set(key,value);paint(value);}
  function textValue(id,value){update(id,value,value=>{$(id).textContent=value;});}
  function render(){if(!state)return;const timed=state.remainingMs!==null;
    update('clock',clock(state.remainingMs),value=>{sound.setTension(timed?1-state.remainingMs/45000:0);$('timeValue').textContent=value;$('timeValue').setAttribute('aria-label',timed?'剩餘時間 '+value:'不限時間');});
    update('critical',timed&&state.remainingMs<=30000,value=>$('timeValue').parentElement.classList.toggle('critical',value));
    textValue('scoreValue',state.score.toLocaleString('en-US'));textValue('comboValue','×'+state.combo);textValue('shieldValue',state.shields+'/'+state.initialShields);textValue('pairsValue',state.matched.length/2+'/'+state.size/2);textValue('flipsValue',state.flips);
    update('power',state.matched.length/state.size*100,value=>{$('powerFill').style.width=value+'%';$('powerTrack').setAttribute('aria-valuenow',String(Math.round(value)));});
    update('pauseDisabled',!['playing','resolving'].includes(state.phase),value=>{$('memoryPause').disabled=value;});update('paused',state.paused,value=>$('memoryGrid').classList.toggle('obscured',value));
    const key=[state.phase,state.paused,state.open.join(','),state.matched.join(',')].join('|');if(key!==viewKey){viewKey=key;const focused=document.activeElement;cards.forEach((b,i)=>{const matched=state.matched.includes(i),open=state.open.includes(i),visible=matched||open;b.classList.toggle('flipped',visible);b.classList.toggle('matched',matched);b.classList.toggle('miss',open&&state.open.length===2&&state.deck[state.open[0]]!==state.deck[state.open[1]]);b.disabled=matched||state.paused||state.phase!=='playing';b.setAttribute('aria-label','第 '+(i+1)+' 張，'+(matched?'已配對：'+E.SYMBOLS[state.deck[i]][1]:open?E.SYMBOLS[state.deck[i]][1]:'未翻開'));});if(focused?.dataset?.index!==undefined&&focused.disabled&&state.phase==='playing')cards.find(b=>!b.disabled)?.focus({preventScroll:true});}
    if(timed&&state.remainingMs<=30000&&!lowTimeAnnounced&&state.phase==='playing'){lowTimeAnnounced=true;$('memoryStatus').textContent='剩餘 30 秒，留意能源倒數。';}
  }
  function burst(indices,kind){if(reduced.matches||!ctx)return;const color=kind==='match'?'#78ffe0':'#ffb477',at=performance.now();for(const index of indices){const rect=cards[index].getBoundingClientRect();for(let i=0;i<18;i++){const angle=Math.PI*2*i/18,speed=35+Math.random()*65;particles.push({x:rect.left+rect.width/2,y:rect.top+rect.height/2,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,at,color,life:600+Math.random()*220});}}particles=particles.slice(-120);}
  function draw(now){if(!ctx||(!particles.length&&!canvasDirty))return;ctx.clearRect(0,0,window.innerWidth,window.innerHeight);particles=particles.filter(p=>now-p.at<p.life);for(const p of particles){const seconds=(now-p.at)/1000;ctx.globalAlpha=Math.max(0,1-(now-p.at)/p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x+p.vx*seconds,p.y+p.vy*seconds+45*seconds*seconds,3,3);}ctx.globalAlpha=1;canvasDirty=particles.length>0;}
  function advance(action,now=performance.now()){if(!state)return;if(tickTimer!==null)clearTimeout(tickTimer);tickTimer=null;const result=E.act(state,action,now);state=result.state;render();for(const event of result.effects){const ended=['won','lost'].includes(event.kind);if(ended)sound.stopMusic();else sound.play(event.kind);if(event.kind==='match'){burst(event.indices,'match');$('memoryStatus').textContent='模組已連接！'+(state.combo>1?'連續 '+state.combo+' 次配對成功。':'繼續尋找下一組。');}if(event.kind==='miss'){burst(event.indices,'miss');$('memoryStatus').textContent='訊號不相符，護盾消耗 1 點。記住剛剛的位置。';}if(ended){if(!resultReport)resultReport=records.record(state,duration);const ticket=run;endTimer=setTimeout(()=>{endTimer=null;if(ticket===run)showDialog('result')},reduced.matches?0:700);}}schedule();}
  function frame(now){raf=null;draw(now);schedule();}
  function schedule(){
    if(raf===null&&particles.length)raf=requestAnimationFrame(frame);
    if(tickTimer===null&&state&&!state.paused&&['playing','resolving'].includes(state.phase)){
      const clockDelay=state.remainingMs===null?Infinity:(state.remainingMs%1000||1000),resolveDelay=state.phase==='resolving'?state.revealMs:Infinity,delay=Math.min(clockDelay,resolveDelay);
      if(Number.isFinite(delay))tickTimer=setTimeout(()=>{tickTimer=null;advance({type:'tick'});},Math.max(1,delay));
    }
  }
  function pause(mode='pause'){if(launching)return;if(state&&['playing','resolving'].includes(state.phase)){advance({type:'pause'});if(state.phase==='lost')return;if(raf!==null)cancelAnimationFrame(raf);raf=null;clearEffects();sound.suspend();}showDialog(mode);}
  function stat(label,value,note=''){const wrap=node('div');wrap.append(node('span',label),node('strong',String(value)));if(note)wrap.appendChild(node('small',note));$('dialogStats').appendChild(wrap);}
  function showDialog(mode){dialogMode=mode;dialog.classList.toggle('outcome-dialog',mode==='result');dialog.dataset.outcome=mode==='result'?state.phase:'';$('resultScene').hidden=mode!=='result';$('dialogStats').replaceChildren();$('resultProgress').hidden=true;$('survivalReward').hidden=true;$('dialogResume').hidden=false;$('dialogRestart').hidden=!state;$('dialogMenu').hidden=!state;
    if(mode==='result'){
      const won=state.phase==='won',pairs=state.matched.length/2,accuracy=window.OrbitRecords.accuracy({pairs,attempts:state.attempts});
      $('dialogTag').textContent=won?'MISSION COMPLETE':'SIGNAL LOST';$('dialogTitle').textContent=won?'太空站重新上線':'本次救援暫時中止';
      $('dialogCopy').textContent=won?'所有模組已連接。這是你這次的救援成果！':(state.reason==='time'?'任務時間已耗盡。':'護盾已耗盡。')+'已修復 '+pairs+' / '+state.size/2+' 組。可以增加時間或減少卡牌，再來挑戰。';
      stat('配對得分',state.score.toLocaleString('en-US'),'只計算配對與連擊');stat('配對命中率',accuracy===null?'—':accuracy+'%',pairs+' / '+state.attempts+' 次配對嘗試');stat('翻牌次數',state.flips);stat('最高連擊','×'+state.bestCombo);
      $('survivalReward').hidden=!won;$('survivalValue').textContent='+'+state.bonus.toLocaleString('en-US');$('survivalCopy').textContent=(state.remainingMs===null?'不限時・':'時間 +'+(state.bonus-state.shields*10)+'・')+'護盾 +'+state.shields*10+'，獨立於配對得分';
      if(resultReport){$('resultProgress').hidden=false;$('progressTitle').textContent=resultReport.feedback.title;$('progressCopy').textContent=resultReport.feedback.detail;$('progressContext').textContent=state.size+' 張・'+(duration===null?'不限時':clock(duration*1000))+'｜只比較相同設定'+(resultReport.persisted?'・儲存在這台裝置':'・紀錄暫存在本頁');}
      $('dialogResume').hidden=true;$('dialogRestart').textContent='再挑戰一次';
    }
    else if(mode==='help'){$('dialogTag').textContent='MISSION BRIEF';$('dialogTitle').textContent='記住位置，接回能源';$('dialogCopy').textContent='每次翻開兩張卡。符號相同就鎖定完成，不同則在短暫顯示後翻回，並消耗 1 點護盾。每組配對得 100 分，連續成功每次多加 25 分（最高額外 225 分）；配錯會中斷連擊。首頁可用 −／＋ 調整時間，10 分鐘再加一次為不限時。時間或護盾歸零就結束；不限時仍會消耗護盾。通關後，每秒剩餘時間得 2 點生存獎分、每點護盾得 10 點；這項獎勵會另外顯示，不計入配對得分。命中率是成功配對次數除以配對嘗試次數。會在這台裝置記住最近 50 次完成或中止的任務，只比較相同張數與時間的成果。暫停會遮住卡牌並停止倒數。';$('dialogResume').textContent=state?'返回任務':'了解，準備出發';$('dialogRestart').hidden=true;$('dialogMenu').hidden=true;}
    else{$('dialogTag').textContent=mode==='restart'?'RESTART MISSION':'MISSION PAUSED';$('dialogTitle').textContent=mode==='restart'?'重新啟動這次救援？':'任務已暫停';$('dialogCopy').textContent=mode==='restart'?'重新開始會洗牌，時間、護盾和得分都會重置。':'倒數與卡牌暫時停止。準備好後再繼續。';$('dialogResume').textContent='繼續原任務';$('dialogRestart').textContent='重新啟動';}
    if(!dialog.open)dialog.showModal();$('dialogTitle').focus();if(mode==='result'&&!document.hidden)sound.play(state.phase);
  }
  function resume(){dialog.close();if(state?.paused){sound.setEnabled($('memorySound').checked);sound.setMusic($('memoryMusic').checked);sound.startMusic();advance({type:'resume'});cards.find(b=>!b.disabled)?.focus({preventScroll:true});}}
  function menu(){run++;stop();state=null;cards=[];dialog.close();sound.suspend();document.body.classList.remove('in-mission');$('memoryHome').hidden=false;$('memoryGame').hidden=true;setup();layout();$('memoryStart').focus();}
  $('memoryStart').onclick=start;$('memoryPause').onclick=()=>pause();$('memoryRestart').onclick=()=>pause('restart');$('memoryHelp').onclick=()=>pause('help');$('dialogResume').onclick=resume;$('dialogRestart').onclick=start;$('dialogMenu').onclick=menu;
  $('launchSkip').onclick=finishLaunch;launchDialog.addEventListener('cancel',event=>{event.preventDefault();finishLaunch();});
  $('timeMinus').onclick=()=>adjustTime(-1);$('timePlus').onclick=()=>adjustTime(1);
  $('memorySound').onchange=()=>{sound.setEnabled($('memorySound').checked);savePreferences();$('audioStatus').textContent=$('memorySound').checked?'音效已開啟。':'音效已關閉。';};
  $('memoryMusic').onchange=()=>{sound.setMusic($('memoryMusic').checked);savePreferences();$('audioStatus').textContent=$('memoryMusic').checked?'背景音樂已開啟，任務進行時播放。':'背景音樂已關閉。';};
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(dialogMode!=='result')resume();});
  $('memoryGrid').addEventListener('keydown',event=>{const index=Number(event.target.dataset.index);if(!Number.isInteger(index))return;const cols=Number($('memoryGrid').style.getPropertyValue('--cols')),offset=({ArrowRight:1,ArrowLeft:-1,ArrowDown:cols,ArrowUp:-cols})[event.key];if(!offset)return;event.preventDefault();let next=index+offset;while(next>=0&&next<cards.length&&cards[next].disabled)next+=offset;if(cards[next])cards[next].focus();});
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&launching){event.preventDefault();finishLaunch();return;}if(event.key==='Escape'&&!dialog.open&&state&&['playing','resolving'].includes(state.phase)){event.preventDefault();pause();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;if(launching)finishLaunch(true);else if(state&&!state.paused&&['playing','resolving'].includes(state.phase))pause();sound.suspend();});
  window.addEventListener('pagehide',()=>{if(launching)finishLaunch(true);else if(state&&!state.paused&&['playing','resolving'].includes(state.phase))pause();sound.dispose();});window.addEventListener('resize',layout);reduced.addEventListener?.('change',()=>{if(reduced.matches){clearEffects();if(launching)finishLaunch();}});
  window.visualViewport?.addEventListener('resize',layout);
  if(window.ResizeObserver){const observer=new window.ResizeObserver(()=>{if(state)layout();});observer.observe($('memoryBoard'));}
  document.fonts?.ready.then(()=>{if(!state)setup();});
  layout();loadArtwork();
})();
