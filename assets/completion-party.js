(function(root){'use strict';
function create(env=root,settings={}){
  let dialog=null,clip=null,perfectClip=null,medal=null,lights=null,sides=null,animations=[],timer=null,burstTimer=null,previousFocus=null;
  let bear=null,cheer=null,cheerCanvas=null,cheerConfetti=null,streamers=null,resizeObserver=null,run=0;
  const doc=env.document,art=env.CompletionArt||root.CompletionArt;
  // Load both approved layers while the student is still answering questions.
  const images=art?.loadBearImages(env)||Promise.resolve(null);
  const cheerImages=art?.loadCheerImages(env)||Promise.resolve(null);
  function prepareAudio(){try{if(!clip&&typeof env.Audio==='function'){clip=new env.Audio('/assets/length-complete-h-v1.wav');clip.preload='auto';clip.volume=.85;}if(settings.perfectSound&&!perfectClip&&typeof env.Audio==='function'){perfectClip=new env.Audio('/assets/length-perfect-h-applause-v1.wav');perfectClip.preload='auto';perfectClip.volume=.85;}}catch{}}
  prepareAudio();
  function stopSound(){for(const sound of [clip,perfectClip])if(sound)try{sound.pause();sound.currentTime=0}catch{}}
  function stopEffects(){run++;if(timer!==null){env.clearTimeout(timer);timer=null;}if(burstTimer!==null){env.clearTimeout(burstTimer);burstTimer=null;}bear?.stop();cheer?.stop();streamers?.stop();animations.forEach(a=>{try{a.cancel()}catch{}});animations=[];stopSound();}
  function close(){stopEffects();if(dialog?.open){dialog.close();(doc.querySelector?.('#replay, #anotherRound')||previousFocus)?.focus?.({preventScroll:true});}}
  function animate(el,frames,options){if(typeof el.animate==='function')animations.push(el.animate(frames,options));}
  function show(options={}){
    close();if(!doc?.body)return;
    if(!dialog){
      dialog=doc.createElement('dialog');dialog.className='completion-party';dialog.setAttribute('aria-label','完成十題，熊熊慶祝通關');
      dialog.innerHTML=MARKUP;
      const stage=dialog.querySelector('.bp-stage');
      const normalBear=doc.createElement('div');normalBear.className='bp-normal-bear';normalBear.setAttribute('aria-hidden','true');const mouth=doc.createElement('span');mouth.className='bp-normal-mouth';const canvas=doc.createElement('canvas');canvas.className='bp-bear-canvas';normalBear.append(canvas,mouth);stage.append(normalBear);
      medal=doc.createElement('img');medal.className='bp-perfect-medal';medal.src='/assets/completion-crown-medal-v1.webp';medal.alt='100 分皇冠盾牌金牌';medal.width=480;medal.height=525;
      cheerCanvas=doc.createElement('canvas');cheerCanvas.className='bp-cheer-bear';cheerCanvas.setAttribute('role','img');cheerCanvas.setAttribute('aria-label','小熊微蹲、跳起舉手歡呼，再開心落地');
      cheerConfetti=doc.createElement('canvas');cheerConfetti.className='bp-cheer-confetti';cheerConfetti.setAttribute('aria-hidden','true');stage.append(cheerCanvas,cheerConfetti);
      lights=doc.createElement('ol');lights.className='bp-perfect-lights';lights.setAttribute('aria-label','十題全部首次答對');for(let i=1;i<=10;i++){const light=doc.createElement('li');light.textContent=String(i);lights.append(light);}stage.append(medal,lights);
      const button=doc.createElement('button');button.type='button';button.className='completion-dismiss';button.textContent='看成果';button.onclick=close;dialog.append(button);
      dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{if(!dialog?.open)stopEffects();});doc.body.append(dialog);
      const confetti=dialog.querySelector('.bp-confetti'),colors=['#e6ae39','#cc7eac','#71bfa7','#80b7db','#b099ce','#efaa77'];
      for(let i=0;i<66;i++){const particle=doc.createElement('i');particle.className=i%4===0?'ribbon':'';particle.style.setProperty('--particle-color',colors[i%colors.length]);confetti.append(particle);}
      sides=doc.createElement('canvas');sides.className='bp-side-streamers';sides.setAttribute('aria-hidden','true');stage.append(sides);
      streamers=art?.createStreamers(sides,stage,env);
      if(typeof env.ResizeObserver==='function'){resizeObserver=new env.ResizeObserver(()=>{streamers?.resize();cheer?.resize();});resizeObserver.observe(stage);}
    }
    const perfect=options.perfect===true;medal.hidden=!perfect;lights.hidden=!perfect;dialog.setAttribute('data-perfect',String(perfect));dialog.setAttribute('aria-label',perfect?'十題全綠，100分小熊慶祝':'完成十題，熊熊慶祝通關');
    dialog.querySelector('.bp-heading h2').textContent=perfect?'全部答對！':'通關成功！';dialog.querySelector('.bp-heading p').hidden=perfect;dialog.querySelector('.bp-caption').hidden=true;sides.hidden=!perfect;
    dialog.querySelector('.bp-normal-bear').hidden=perfect;dialog.querySelector('.bp-confetti').hidden=perfect;cheerCanvas.hidden=!perfect;cheerConfetti.hidden=!perfect;
    previousFocus=doc.activeElement;dialog.showModal();
    const stage=dialog.querySelector('.bp-stage'),heading=dialog.querySelector('.bp-heading');
    const reduced=env.matchMedia?.('(prefers-reduced-motion: reduce)').matches,burstAt=820,current=run;
    stage.setAttribute('aria-label',perfect?'皇冠盾牌、小熊歡呼與左右彩帶通關動畫':'小熊與彩炮噴彩帶通關動畫');
    if(!reduced&&!perfect){
      animate(heading,[{transform:'scale(.9)',opacity:.15},{transform:'scale(1.08)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:700,delay:burstAt,fill:'both'});
    }
    function burst(){
    // Measure after the cord reaches full extension, so confetti follows the actual barrel.
    bear?.draw(reduced?0:1);
    const rect=stage.getBoundingClientRect(),rim=dialog.querySelector('.bp-normal-mouth').getBoundingClientRect(),w=rect.width,h=rect.height,mouth={x:rim.x-rect.x,y:rim.y-rect.y};
    const scale=dialog.querySelector('.bp-normal-bear').clientWidth/320,direction=bear?.direction||{x:.8,y:-.6};
    [...dialog.querySelector('.bp-confetti').children].forEach((particle,i)=>{
      const source=mouth;
      const across=12+((i*.618034)%1)*(w-24),turn=(i%2?-1:1)*(320+(i*31)%470),drift=(i%2?-1:1)*(8+(i*13)%26),clamp=v=>Math.max(3,Math.min(w-12,v));
      if(reduced){animate(particle,[{opacity:0,transform:`translate(${across}px,${h*.28}px)`},{opacity:.65},{opacity:0}],{duration:1600,fill:'both'});return;}
      const length=(65+(i%7)*4)*scale,fan=((i%9)-4)*2*scale,launch={x:source.x+direction.x*length-direction.y*fan,y:source.y+direction.y*length+direction.x*fan};
      const transform=(x,y,angle)=>`translate(${x}px,${y}px) rotate(${angle}deg)`;
      animate(particle,[{opacity:0,transform:transform(source.x,source.y,0),offset:0},{opacity:1,transform:transform(source.x,source.y,0),offset:.01},{opacity:1,transform:transform(launch.x,launch.y,turn*.08),offset:.09,easing:'ease-out'},{opacity:1,transform:transform(across,-30-(i%5)*9,turn*.32),offset:.32},{opacity:1,transform:transform(across+drift*.3,-16,turn*.42),offset:.45},{opacity:.9,transform:transform(clamp(across+drift*.7),h*.45,turn*.72),offset:.73},{opacity:0,transform:transform(clamp(across+drift),h+24,turn),offset:1}],{duration:3100+(i%6)*115,delay:(i%5)*16,easing:'linear',fill:'both'});
    });
    }
    (perfect?cheerImages:images).then(loaded=>{
      // A slow image response must never revive a closed or replaced celebration.
      if(current!==run||!dialog?.open)return;
      if(perfect){
        if(!cheer)cheer=art?.createCheer(cheerCanvas,cheerConfetti,stage,loaded,env);
        cheer?.play(reduced);streamers?.play(reduced);
      }else{
        if(!bear)bear=art?.createBear(dialog.querySelector('.bp-bear-canvas'),dialog.querySelector('.bp-normal-mouth'),loaded,env);
        bear?.play(reduced);
        burstTimer=env.setTimeout(()=>{burstTimer=null;if(current===run&&dialog?.open)burst();},burstAt);
      }
      env.clearTimeout(timer);timer=env.setTimeout(close,perfect?9600:5600);
    });
    // Preload the music and start it in the same gesture as the bear overlay.
    if(options.sound!==false)try{prepareAudio();const sound=options.perfect&&perfectClip?perfectClip:clip;const playing=sound.play();if(playing?.catch)playing.catch(()=>{});}catch{}
    timer=env.setTimeout(close,perfect?9600:5600);
  }
  return {show,close,stopSound,dispose(){close();resizeObserver?.disconnect();resizeObserver=null;dialog?.remove();dialog=null;clip=null;perfectClip=null;medal=null;lights=null;sides=null;bear=null;cheer=null;cheerCanvas=null;cheerConfetti=null;streamers=null;}};
}
const MARKUP="  <div class=\"bp-stage\" aria-label=\"小熊與彩炮噴彩帶通關動畫\">\n    <div class=\"bp-halo\" aria-hidden=\"true\"></div>\n    <div class=\"bp-dots\" aria-hidden=\"true\"></div>\n    <div class=\"bp-heading\"><span>完成 10 題</span><h2>通關成功！</h2><p>你真棒！</p></div>\n    <div class=\"bp-bear-wrap\" aria-hidden=\"true\">\n      <div class=\"bp-shadow\"></div>\n      <img class=\"bp-bear\" src=\"/assets/multiply-bear.webp\" alt=\"\">\n      <div class=\"bp-popper\"><div class=\"bp-cone\"></div><div class=\"bp-rim\"></div><b>★</b></div>\n      <span class=\"bp-pop\">啪！</span>\n    </div>\n    <div class=\"bp-confetti\" aria-hidden=\"true\"></div>\n    <div class=\"bp-caption\" role=\"status\" aria-live=\"polite\">完成了！你真棒！</div>\n  </div>\n";
if(typeof module!=='undefined')module.exports={create};else root.CompletionParty={create};
})(typeof globalThis!=='undefined'?globalThis:this);
