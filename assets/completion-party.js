(function(root){'use strict';
function create(env=root,settings={}){
  let dialog=null,clip=null,perfectClip=null,medal=null,lights=null,sides=null,animations=[],timer=null,previousFocus=null;
  const doc=env.document;
  // Warm the approved sprite sheet before the completion overlay is needed.
  if(typeof env.Image==='function'){const image=new env.Image();image.src='/assets/completion-bear-two-hand.webp';}
  function prepareAudio(){try{if(!clip&&typeof env.Audio==='function'){clip=new env.Audio('/assets/length-complete-h-v1.wav');clip.preload='auto';clip.volume=.85;}if(settings.perfectSound&&!perfectClip&&typeof env.Audio==='function'){perfectClip=new env.Audio('/assets/length-perfect-h-applause-v1.wav');perfectClip.preload='auto';perfectClip.volume=.85;}}catch{}}
  prepareAudio();
  function stopSound(){for(const sound of [clip,perfectClip])if(sound)try{sound.pause();sound.currentTime=0}catch{}}
  function close(){if(timer!==null){env.clearTimeout(timer);timer=null;}animations.forEach(a=>{try{a.cancel()}catch{}});animations=[];stopSound();if(dialog?.open){dialog.close();(doc.querySelector?.('#replay, #anotherRound')||previousFocus)?.focus?.({preventScroll:true});}}
  function animate(el,frames,options){if(typeof el.animate==='function')animations.push(el.animate(frames,options));}
  function show(options={}){
    close();if(!doc?.body)return;
    if(!dialog){
      dialog=doc.createElement('dialog');dialog.className='completion-party';dialog.setAttribute('aria-label','完成十題，熊熊慶祝通關');
      dialog.innerHTML=MARKUP;
      const stage=dialog.querySelector('.bp-stage');
      const normalBear=doc.createElement('div');normalBear.className='bp-normal-bear';normalBear.setAttribute('aria-hidden','true');const mouth=doc.createElement('span');mouth.className='bp-normal-mouth';normalBear.append(mouth);stage.append(normalBear);
      medal=doc.createElement('div');medal.className='bp-perfect-medal';medal.setAttribute('role','img');medal.setAttribute('aria-label','金色100分徽章');
      const score=doc.createElement('span'),unit=doc.createElement('span'),stars=doc.createElement('span');score.className='bp-perfect-score';score.textContent='100';unit.textContent='分';score.append(unit);stars.className='bp-perfect-stars';stars.textContent='★　★　★';stars.setAttribute('aria-hidden','true');medal.append(score,stars);
      lights=doc.createElement('ol');lights.className='bp-perfect-lights';lights.setAttribute('aria-label','十題全部首次答對');for(let i=1;i<=10;i++){const light=doc.createElement('li');light.textContent=String(i);lights.append(light);}stage.append(medal,lights);
      const button=doc.createElement('button');button.type='button';button.className='completion-dismiss';button.textContent='看成果';button.onclick=close;dialog.append(button);
      dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',stopSound);doc.body.append(dialog);
      const confetti=dialog.querySelector('.bp-confetti'),colors=['#e6ae39','#cc7eac','#71bfa7','#80b7db','#b099ce','#efaa77'];
      for(let i=0;i<66;i++){const particle=doc.createElement('i');particle.className=i%4===0?'ribbon':'';particle.style.setProperty('--particle-color',colors[i%colors.length]);confetti.append(particle);}
      sides=doc.createElement('div');sides.className='bp-side-confetti';sides.setAttribute('aria-hidden','true');stage.append(sides);
      for(let i=0;i<48;i++){const particle=doc.createElement('i');particle.className='ribbon streamer';particle.style.setProperty('--particle-color',colors[i%colors.length]);sides.append(particle);}
    }
    const perfect=options.perfect===true;medal.hidden=!perfect;lights.hidden=!perfect;dialog.setAttribute('data-perfect',String(perfect));dialog.setAttribute('aria-label',perfect?'十題全綠，100分小熊慶祝':'完成十題，熊熊慶祝通關');
    dialog.querySelector('.bp-heading h2').textContent=perfect?'全部答對！':'通關成功！';dialog.querySelector('.bp-heading p').hidden=perfect;dialog.querySelector('.bp-caption').hidden=true;sides.hidden=!perfect;
    previousFocus=doc.activeElement;dialog.showModal();
    const stage=dialog.querySelector('.bp-stage'),heading=dialog.querySelector('.bp-heading');
    const reduced=env.matchMedia?.('(prefers-reduced-motion: reduce)').matches,burstAt=1300;
    if(!reduced){
      if(perfect)animate(medal,[{opacity:0,transform:'translateX(-50%) scale(.6)'},{opacity:1,transform:'translateX(-50%) scale(1.05)',offset:.7},{opacity:1,transform:'translateX(-50%) scale(1)'}],{duration:620,easing:'ease-out',fill:'both'});
      {
        const offsets=[0,.15,.25,.35,.525,.65,.8,.925,1];
        animate(dialog.querySelector('.bp-normal-bear'),offsets.map((offset,i)=>{const frame=Math.min(i,7);return {backgroundPosition:`${(frame%4)*100/3}% ${Math.floor(frame/4)*100}%`,offset,easing:'steps(1,end)'}}),{duration:2000,easing:'linear',fill:'both'});
      }
      animate(heading,[{transform:'scale(.9)',opacity:.15},{transform:'scale(1.08)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:700,delay:burstAt,fill:'both'});
    }
    // Measure the visible mouth after opening the dialog, including responsive bear scaling.
    const rect=stage.getBoundingClientRect(),rim=dialog.querySelector('.bp-normal-mouth').getBoundingClientRect(),w=rect.width,h=rect.height,mouth={x:rim.x+rim.width/2-rect.x,y:rim.y+rim.height/2-rect.y};
    [...dialog.querySelector('.bp-confetti').children,...(perfect?sides.children:[])].forEach((particle,i)=>{
      const source=i<66?mouth:{x:(i-66)%2?w-8:8,y:h*.62};
      const across=12+((i*.618034)%1)*(w-24),turn=(i%2?-1:1)*(320+(i*31)%470),drift=(i%2?-1:1)*(8+(i*13)%26),clamp=v=>Math.max(3,Math.min(w-12,v));
      if(reduced){animate(particle,[{opacity:0,transform:`translate(${across}px,${h*.28}px)`},{opacity:.65},{opacity:0}],{duration:1600,delay:burstAt,fill:'both'});return;}
      const transform=(x,y,angle)=>`translate(${x}px,${y}px) rotate(${angle}deg)`;
      animate(particle,[{opacity:0,transform:transform(source.x,source.y,0),offset:0},{opacity:1,transform:transform(source.x,source.y,0),offset:.015},{opacity:1,transform:transform(source.x+(across-source.x)*.55,Math.min(source.y-90,h*.32),turn*.1),offset:.16,easing:'ease-out'},{opacity:1,transform:transform(across,-30-(i%5)*9,turn*.32),offset:.35,easing:'ease-in'},{opacity:1,transform:transform(across+drift*.3,-16,turn*.42),offset:.48,easing:'ease-in'},{opacity:.9,transform:transform(clamp(across+drift*.7),h*.45,turn*.72),offset:.74},{opacity:0,transform:transform(clamp(across+drift),h+24,turn),offset:1}],{duration:3100+(i%6)*115,delay:burstAt+(i%5)*16,easing:'linear',fill:'both'});
    });
    // Preload the music and start it in the same gesture as the bear overlay.
    if(options.sound!==false)try{prepareAudio();const sound=options.perfect&&perfectClip?perfectClip:clip;const playing=sound.play();if(playing?.catch)playing.catch(()=>{});}catch{}
    timer=env.setTimeout(close,5600);
  }
  return {show,close,stopSound,dispose(){close();dialog?.remove();dialog=null;clip=null;perfectClip=null;medal=null;lights=null;sides=null;}};
}
const MARKUP="  <div class=\"bp-stage\" aria-label=\"小熊與彩炮噴彩帶通關動畫\">\n    <div class=\"bp-halo\" aria-hidden=\"true\"></div>\n    <div class=\"bp-dots\" aria-hidden=\"true\"></div>\n    <div class=\"bp-heading\"><span>完成 10 題</span><h2>通關成功！</h2><p>你真棒！</p></div>\n    <div class=\"bp-bear-wrap\" aria-hidden=\"true\">\n      <div class=\"bp-shadow\"></div>\n      <img class=\"bp-bear\" src=\"/assets/multiply-bear.webp\" alt=\"\">\n      <div class=\"bp-popper\"><div class=\"bp-cone\"></div><div class=\"bp-rim\"></div><b>★</b></div>\n      <span class=\"bp-pop\">啪！</span>\n    </div>\n    <div class=\"bp-confetti\" aria-hidden=\"true\"></div>\n    <div class=\"bp-caption\" role=\"status\" aria-live=\"polite\">完成了！你真棒！</div>\n  </div>\n";
if(typeof module!=='undefined')module.exports={create};else root.CompletionParty={create};
})(typeof globalThis!=='undefined'?globalThis:this);
