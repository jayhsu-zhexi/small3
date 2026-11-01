(function(root){'use strict';
function create(env=root,settings={}){
  let dialog=null,clip=null,perfectClip=null,medal=null,lights=null,animations=[],timer=null,previousFocus=null;
  const doc=env.document;
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
      medal=doc.createElement('div');medal.className='bp-perfect-medal';medal.setAttribute('role','img');medal.setAttribute('aria-label','金色100分徽章');
      const score=doc.createElement('span'),unit=doc.createElement('span'),stars=doc.createElement('span');score.className='bp-perfect-score';score.textContent='100';unit.textContent='分';score.append(unit);stars.className='bp-perfect-stars';stars.textContent='★　★　★';stars.setAttribute('aria-hidden','true');medal.append(score,stars);
      lights=doc.createElement('ol');lights.className='bp-perfect-lights';lights.setAttribute('aria-label','十題全部首次答對');for(let i=1;i<=10;i++){const light=doc.createElement('li');light.textContent=String(i);lights.append(light);}stage.append(medal,lights);
      const button=doc.createElement('button');button.type='button';button.className='completion-dismiss';button.textContent='看成果';button.onclick=close;dialog.append(button);
      dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',stopSound);doc.body.append(dialog);
      const confetti=dialog.querySelector('.bp-confetti'),colors=['#e6ae39','#cc7eac','#71bfa7','#80b7db','#b099ce','#efaa77'];
      for(let i=0;i<66;i++){const particle=doc.createElement('i');particle.className=i%4===0?'ribbon':'';particle.style.setProperty('--particle-color',colors[i%colors.length]);confetti.append(particle);}
    }
    const perfect=options.perfect===true;medal.hidden=!perfect;lights.hidden=!perfect;dialog.setAttribute('data-perfect',String(perfect));dialog.setAttribute('aria-label',perfect?'十題全綠，100分小熊慶祝':'完成十題，熊熊慶祝通關');
    dialog.querySelector('.bp-heading h2').textContent=perfect?'全部答對！':'通關成功！';dialog.querySelector('.bp-heading p').hidden=perfect;dialog.querySelector('.bp-caption').textContent=perfect?'你真棒！':'完成了！你真棒！';
    previousFocus=doc.activeElement;dialog.showModal();
    const stage=dialog.querySelector('.bp-stage'),bear=dialog.querySelector('.bp-bear-wrap'),paw=dialog.querySelector('.bp-paw'),popper=dialog.querySelector('.bp-popper'),string=dialog.querySelector('.bp-string'),heading=dialog.querySelector('.bp-heading'),pop=dialog.querySelector('.bp-pop');
    const reduced=env.matchMedia?.('(prefers-reduced-motion: reduce)').matches,scale=perfect?(stage.clientHeight<420?.75:1):stage.clientHeight<330?.65:stage.clientWidth<380?.92:1;
    if(!reduced){
      if(perfect)animate(medal,[{opacity:0,transform:'translateX(-50%) scale(.6)'},{opacity:1,transform:'translateX(-50%) scale(1.05)',offset:.7},{opacity:1,transform:'translateX(-50%) scale(1)'}],{duration:620,easing:'ease-out',fill:'both'});
      animate(bear,[{transform:`scale(${scale*.85}) translateY(24px)`,opacity:0},{transform:`scale(${scale*1.04}) translateY(-4px)`,opacity:1,offset:.7},{transform:`scale(${scale})`,opacity:1}],{duration:550,easing:'ease-out',fill:'both'});
      animate(paw,[{transform:'translate(0,0) rotate(0)'},{transform:'translate(-16px,7px) rotate(-18deg)'},{transform:'translate(-8px,1px) rotate(-7deg)'},{transform:'translate(0,0) rotate(0)'}],{duration:650,delay:600,easing:'ease-in-out',fill:'both'});
      animate(string,[{transform:'rotate(8deg) scaleX(1)'},{transform:'rotate(15deg) scaleX(1.3)'},{transform:'rotate(8deg) scaleX(1)'}],{duration:550,delay:600,fill:'both'});
      animate(popper,[{transform:'rotate(32deg)'},{transform:'rotate(23deg) translateY(5px)'},{transform:'rotate(36deg) translateY(-7px)'},{transform:'rotate(32deg)'}],{duration:450,delay:850,easing:'ease-out',fill:'both'});
      animate(pop,[{transform:'rotate(12deg) scale(0)',opacity:0},{transform:'rotate(12deg) scale(1.2)',opacity:1,offset:.3},{transform:'rotate(12deg) scale(1)',opacity:0}],{duration:600,delay:950,fill:'both'});
      animate(heading,[{transform:'scale(.9)',opacity:.15},{transform:'scale(1.08)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:700,delay:950,fill:'both'});
    }
    const w=stage.clientWidth,h=stage.clientHeight;
    [...dialog.querySelector('.bp-confetti').children].forEach((particle,i)=>{
      const theta=(-174+(i*137.508)%168)*Math.PI/180,reach=90+(i*43)%170,x=Math.cos(theta)*reach,y=Math.sin(theta)*reach,drift=(i%2?1:-1)*(60+(i*17)%100),turn=(i%2?1:-1)*(260+(i*31)%500),clamp=v=>Math.max(-w*.47,Math.min(w*.47,v));
      if(reduced){animate(particle,[{opacity:0,transform:`translate(${clamp(x)}px,${y*.6}px)`},{opacity:.8},{opacity:0}],{duration:1300,delay:950,fill:'both'});return;}
      animate(particle,[{opacity:0,transform:'translate(64px,26px) rotate(0deg)',offset:0},{opacity:1,offset:.03},{opacity:1,transform:`translate(${clamp(x)}px,${y}px) rotate(${turn*.4}deg)`,offset:.36},{opacity:.85,offset:.8},{opacity:0,transform:`translate(${clamp(x+drift)}px,${h*.6}px) rotate(${turn}deg)`,offset:1}],{duration:2400+(i%5)*100,delay:950+(i%6)*18,easing:'cubic-bezier(.18,.55,.5,1)',fill:'both'});
    });
    // Preload the music and start it in the same gesture as the bear overlay.
    if(options.sound!==false)try{prepareAudio();const sound=options.perfect&&perfectClip?perfectClip:clip;const playing=sound.play();if(playing?.catch)playing.catch(()=>{});}catch{}
    timer=env.setTimeout(close,5100);
  }
  return {show,close,stopSound,dispose(){close();dialog?.remove();dialog=null;clip=null;perfectClip=null;medal=null;lights=null;}};
}
const MARKUP="  <div class=\"bp-stage\" aria-label=\"熊熊拉炮通關動畫\">\n    <div class=\"bp-halo\" aria-hidden=\"true\"></div>\n    <div class=\"bp-dots\" aria-hidden=\"true\"></div>\n    <div class=\"bp-heading\"><span>完成 10 題</span><h2>通關成功！</h2><p>你真棒！</p></div>\n    <div class=\"bp-bear-wrap\" aria-hidden=\"true\">\n      <div class=\"bp-shadow\"></div>\n      <img class=\"bp-bear\" src=\"/assets/multiply-bear.webp\" alt=\"\">\n      <img class=\"bp-paw\" src=\"/assets/multiply-bear.webp\" alt=\"\">\n      <div class=\"bp-string\"></div>\n      <div class=\"bp-popper\"><div class=\"bp-cone\"></div><div class=\"bp-rim\"></div><b>★</b></div>\n      <span class=\"bp-pop\">啪！</span>\n    </div>\n    <div class=\"bp-confetti\" aria-hidden=\"true\"></div>\n    <div class=\"bp-caption\" role=\"status\" aria-live=\"polite\">完成了！你真棒！</div>\n  </div>\n";
if(typeof module!=='undefined')module.exports={create};else root.CompletionParty={create};
})(typeof globalThis!=='undefined'?globalThis:this);
