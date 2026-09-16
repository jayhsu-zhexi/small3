(()=>{
 'use strict';
 const E=window.NightMarket,$=id=>document.getElementById(id),canvas=$('table'),ctx=canvas.getContext('2d'),button=$('launch');let s=E.create(),holding=false,charge=0,last=0,previous='ready',acc=0;
 function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function draw(){
  ctx.clearRect(0,0,480,660);ctx.fillStyle='#ffedb5';ctx.fillRect(0,0,480,660);
  ctx.strokeStyle='#c9974d';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(19,628);ctx.lineTo(19,60);ctx.quadraticCurveTo(19,20,60,20);ctx.lineTo(421,20);ctx.quadraticCurveTo(469,20,469,65);ctx.lineTo(469,628);ctx.stroke();
  ctx.fillStyle='#efd798';ctx.fillRect(417,90,46,538);ctx.strokeStyle='#be8f48';ctx.beginPath();ctx.moveTo(411,90);ctx.lineTo(411,628);ctx.stroke();
  ctx.fillStyle='#886038';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText('彈 彈 跳 跳，好 運 到！',216,89);
  for(const p of E.pegs){circle(p.x+1,p.y+3,7,'#bf9f68');circle(p.x,p.y,6,'#278d8a');circle(p.x-1.5,p.y-2,2,'#a3ece0');}
  for(let i=0;i<7;i++){const x=19+i*56;ctx.fillStyle=s.bin===i?'#ffbf36':i%2?'#f4be75':'#f8d899';ctx.fillRect(x+2,555,52,73);ctx.fillStyle=i===3?'#a63529':'#71472b';ctx.font='900 23px system-ui';ctx.fillText(E.values[i],x+28,651);if(i){ctx.strokeStyle='#b67e42';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,558);ctx.lineTo(x,627);ctx.stroke();}}
  ctx.strokeStyle='#a57541';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(19,628);ctx.lineTo(411,628);ctx.stroke();
  ctx.strokeStyle='#b68d56';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<7;i++){ctx.moveTo(437,625+i*3);ctx.lineTo(456,626+i*3);}ctx.stroke();
  const b=s.ball;circle(b.x+2,b.y+3,9,'#0002');const g=ctx.createRadialGradient(b.x-3,b.y-4,1,b.x,b.y,9);g.addColorStop(0,'#ffffff');g.addColorStop(.4,'#e5f7ff');g.addColorStop(1,'#376579');circle(b.x,b.y,8,g);
 }
 function start(){if(s.phase!=='ready'||holding)return;holding=true;charge=0;$('launchText').textContent='放開發射！';}
 function release(){if(!holding)return;holding=false;E.launch(s,charge);charge=0;}
 function cancel(){holding=false;charge=0;if(s.phase==='ready')$('launchText').textContent='按住發射';}
 button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);start();});
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
 button.addEventListener('click',e=>{if(e.detail===0&&s.phase==='ready'){E.launch(s,.5);}});
 window.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target!==$('reset')){e.preventDefault();if(!e.repeat)start();}});
 window.addEventListener('keyup',e=>{if(e.code==='Space'){e.preventDefault();release();}});
 window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{cancel();last=0;});
 $('reset').addEventListener('click',()=>{s=E.create();cancel();previous='';});
 function frame(t){const dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(!document.hidden){if(holding)charge=Math.min(1,charge+dt/.95);acc+=dt;while(acc>=1/120){E.step(s,1/120);acc-=1/120;}if(previous!==s.phase){previous=s.phase;button.disabled=s.phase!=='ready';$('launchText').textContent=s.phase==='ready'?'按住發射':'彈珠旅行中…';$('notice').textContent=s.phase==='result'?'太棒了！得到 '+E.values[s.bin]+' 分！':s.phase==='ready'?'換你囉！按住蓄力，放開發射':'看看彈珠會落在哪一格？';}$('score').textContent=s.score;$('count').textContent=s.count;$('charge').style.width=(charge*100)+'%';draw();}requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
})();
