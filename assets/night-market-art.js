(function(root){
'use strict';
function create(E,ctx){
 const reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:false};
 function load(src){if(typeof Image==='undefined')return null;const image=new Image();image.src=src;return image;}
 const materials=load('/assets/night-market-materials-a.webp'),sprites=load('/assets/night-market-sprites-a.webp');
 let effects=[],trail=[],lastTime=-1,lastImpact=-1;
 const ready=image=>image&&image.complete&&image.naturalWidth>0;
 function atlas(image,cell,x,y,w,h){if(!ready(image))return false;const sw=image.naturalWidth/2,sh=image.naturalHeight/2;ctx.drawImage(image,cell%2*sw,Math.floor(cell/2)*sh,sw,sh,x,y,w,h);return true;}
 function gradient(x,y,w,h,colors){const g=ctx.createLinearGradient(x,y,x+w,y+h);colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));return g;}
 function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=1.5;ctx.strokeStyle=stroke;ctx.stroke();}}
 function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
 function line(x,y,z,w,color,width=1){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(z,w);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
 function text(str,x,y,size,color){ctx.font='600 '+size+'px "Microsoft JhengHei",serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(str,x,y);}
 function event(e,time){if(e.kind==='launch'||e.kind==='weak'){trail=[];return;}if(!['pin','hit','miss'].includes(e.kind)||!Number.isFinite(e.x)||!Number.isFinite(e.y))return;if(e.kind==='pin'&&(reduced.matches||time-lastImpact<.035))return;if(e.kind==='pin')lastImpact=time;effects.push({...e,at:time,life:e.kind==='pin'?.28:e.kind==='hit'?1.05:.5});if(effects.length>28)effects.shift();}
 function clear(){effects=[];trail=[];lastTime=-1;lastImpact=-1;}
 function draw(s,power=0){ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,560,760);
  // Separate decorative wings sit outside the unchanged 480px physical table.
  round(0,2,560,756,14,'#352315','#bd9959');
  atlas(materials,0,0,2,560,756);ctx.translate(40,0);
  for(const x of [-36,482]){
   round(x,18,34,721,12,gradient(x,18,34,0,['#071d17','#264335','#0c2119']),'#caa768');
   round(x+3,22,28,713,10,'#00000000','#74613b');
   const cx=x+17;
   for(const y of [36,719]){circle(cx,y,5,gradient(cx-5,y-5,10,10,['#ffebaf','#99713a','#382718']));line(cx-2,y-2,cx+2,y+2,'#44321a',1);}
   // Etched lantern chains, shop roofs, lattice windows and floral scrolls.
   line(cx,55,cx,99,'#bd9554',1);
   for(const y of [103,139]){round(cx-9,y,18,23,7,'#65451c','#e3bd74');ctx.beginPath();ctx.ellipse(cx,y+11,4,11,0,0,Math.PI*2);ctx.strokeStyle='#e3bd74';ctx.lineWidth=.8;ctx.stroke();line(cx,y+24,cx,y+31,'#d5ac61',1);}
   for(const [n,ch] of [...(x<0?'台灣夜市':'彈出好運')].entries())text(ch,cx,211+n*24,17,'#dbb778');
   for(const y of [340,441,542]){
    ctx.beginPath();ctx.moveTo(x+4,y+12);ctx.lineTo(cx,y);ctx.lineTo(x+30,y+12);ctx.lineTo(x+27,y+15);ctx.lineTo(x+7,y+15);ctx.closePath();ctx.strokeStyle='#d2a75d';ctx.lineWidth=1;ctx.stroke();
    ctx.strokeRect(x+7,y+15,20,60);
    for(let j=1;j<4;j++)line(x+7+j*5,y+18,x+7+j*5,y+72,'#a78349',.7);
    for(let j=0;j<3;j++)line(x+7,y+26+j*18,x+27,y+26+j*18,'#cba465',.8);
    line(x+3,y+78,x+31,y+78,'#e0b76a',1);
   }
   for(const y of [315,637,675]){ctx.beginPath();ctx.moveTo(cx,y-10);ctx.bezierCurveTo(cx-17,y,cx-9,y+15,cx,y+5);ctx.bezierCurveTo(cx+9,y+15,cx+17,y,cx,y-10);ctx.strokeStyle='#b6914e';ctx.lineWidth=1;ctx.stroke();circle(cx,y,2,'#e4c581');}
  }
  ctx.save();ctx.beginPath();ctx.roundRect(2,2,476,756,19);ctx.clip();ctx.fillStyle='#4c2b19';ctx.fillRect(0,0,480,760);atlas(materials,0,0,0,480,760);ctx.restore();
  round(9,9,462,742,14,'#00000000','#c09a57');round(16,24,410,705,12,'#0a211d','#b58b4c');
  ctx.save();ctx.beginPath();ctx.roundRect(21,29,400,695,9);ctx.clip();ctx.fillStyle='#18382b';ctx.fillRect(21,29,400,695);ctx.globalAlpha=.32;atlas(materials,1,21,29,400,695);ctx.globalAlpha=1;
  const enamel=ctx.createRadialGradient(205,300,20,215,370,370);enamel.addColorStop(0,'#79916b30');enamel.addColorStop(.6,'#17372820');enamel.addColorStop(1,'#020e09bb');ctx.fillStyle=enamel;ctx.fillRect(21,29,400,695);
  // Faint brass engravings recall the reference's night-market street, never solid obstacles.
  ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='#dab36e';ctx.lineWidth=.7;
  for(const [x,y,w,h] of [[25,300,29,74],[29,407,32,94],[380,365,31,83],[375,497,37,98]]){
   ctx.strokeRect(x,y,w,h);ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+w/2,y-12);ctx.lineTo(x+w+3,y);ctx.stroke();
   for(let n=1;n<4;n++)line(x+n*w/4,y+4,x+n*w/4,y+h,'#dab36e',.6);
   line(x,y+19,x+w,y+19,'#dab36e',.7);line(x,y+h-20,x+w,y+h-20,'#dab36e',.7);
  }
  text('夜',39,259,16,'#dab36e');text('市',39,280,16,'#dab36e');text('好',396,452,14,'#dab36e');text('玩',396,473,14,'#dab36e');ctx.restore();ctx.restore();
  // Engraved arch and festival ornaments are decoration, not hidden colliders.
  ctx.beginPath();ctx.moveTo(24,136);ctx.bezierCurveTo(30,9,397,9,412,136);ctx.strokeStyle='#b69557';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(29,137);ctx.bezierCurveTo(35,18,391,18,407,137);ctx.strokeStyle='#dcc68a55';ctx.lineWidth=1;ctx.stroke();
  // Layered brass arch joins the outer side rails without entering the pin lattice.
  ctx.beginPath();ctx.moveTo(13,728);ctx.lineTo(13,143);ctx.bezierCurveTo(13,5,427,5,427,143);ctx.lineTo(427,728);
  ctx.strokeStyle='#19130c';ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle=gradient(13,0,414,0,['#80602e','#ffdb8c','#8f682e','#f1ce86','#77502a']);ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#ffe6a388';ctx.lineWidth=1;ctx.stroke();
  text('復 刻 童 年 ・ 彈 出 好 時 光',218,75,17,'#e6c58d');
  text('TAIWAN NIGHT MARKET',218,96,9,'#b49a68');
  for(const x of [62,374]){line(x,65,x,85,'#ba914b',1);round(x-7,84,14,21,5,'#a04b24','#e3b360');line(x,85,x,104,'#eab763',1);line(x,106,x,115,'#c09144',1);}
  text(s.phase==='scan'?'停下燈號，試試手氣':s.phase==='ready'?'看準亮燈球道，準備發射':'小小彈珠・大大快樂',218,130,11,'#cfbd89');
  // The visible shooter is drawn on the existing physical launch path.
  ctx.beginPath();ctx.moveTo(451,708);ctx.lineTo(451,64);ctx.quadraticCurveTo(451,25,386,34);ctx.lineCap='round';ctx.lineWidth=28;ctx.strokeStyle='#26170d';ctx.stroke();ctx.lineWidth=25;ctx.strokeStyle=gradient(434,0,32,0,['#4d301a','#e3bd76','#73502c']);ctx.stroke();ctx.lineWidth=18;ctx.strokeStyle='#13201c';ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='#b7b79a';ctx.stroke();
  for(let i=0;i<9;i++){const y=714+i*(2.5-power*.6);line(443,y,459,y+1,'#bd9865',1.2);}round(442,738-power*4,18,7,3,'#4d2816','#bd9854');
  for(const p of E.pins){circle(p.x+1,p.y+2,p.r+1,'#010e1099');if(!atlas(sprites,0,p.x-p.r*1.55,p.y-p.r*1.55,p.r*3.1,p.r*3.1)){circle(p.x,p.y,p.r,gradient(p.x-4,p.y-4,7,7,['#fff1b8','#be8937','#593719']));circle(p.x-1,p.y-1,1.2,'#fff1c7');}}
  for(let i=0;i<9;i++){const x=20+i*44,lit=s.targets.includes(i),land=s.phase==='result'&&s.result?.slot===i;
   // Recessed wood floor, dark rear wall and raised brass dividers share physical lane edges.
   round(x+2,644,40,82,1,gradient(x,644,0,82,['#090c08','#22190d','#49331c']),'#80613a');
   ctx.save();ctx.globalAlpha=.3;atlas(materials,3,x+4,674,36,50);ctx.restore();
   ctx.fillStyle=gradient(x,643,12,0,['#000b','#0000']);ctx.fillRect(x+3,644,12,79);
   line(x+4,673,x+40,673,'#b58a4544',1);
   round(x,640,4,86,1,gradient(x,640,4,0,['#6d471f','#ffe0a0','#987039']));
   line(x+5,646,x+5,724,'#0009',2);
   if(i===8)round(x+42,640,4,86,1,gradient(x+42,640,4,0,['#6d471f','#ffe0a0','#987039']));
   if(lit){const glow=ctx.createRadialGradient(x+22,669,2,x+22,682,44);glow.addColorStop(0,'#ffcc4b70');glow.addColorStop(1,'#ffb42200');ctx.fillStyle=glow;ctx.fillRect(x+3,644,38,80);if(!atlas(sprites,2,x+9,648,26,26))circle(x+22,661,5,'#ffe395');text('▼',x+22,631,12,'#ebc873');}
   text(String(i+1),x+22,701,24,lit?'#ffe6a4':'#c5ac77');if(land){ctx.strokeStyle=s.result.hit?'#fff0bb':'#bf9c61';ctx.lineWidth=2;ctx.strokeRect(x+4,645,36,78);}
  }
  round(19,726,399,5,1,gradient(19,726,0,5,['#ffda8e','#7b4c25']));
  const b=s.ball||{x:451,y:690};
  if(!reduced.matches&&s.ball&&s.phase==='flight'&&s.time!==lastTime){trail.push({x:b.x,y:b.y});if(trail.length>7)trail.shift();}else if(!s.ball||s.phase!=='flight')trail=[];lastTime=s.time;
  if(!reduced.matches)for(let i=1;i<trail.length;i++){ctx.globalAlpha=i/trail.length*.24;line(trail[i-1].x,trail[i-1].y,trail[i].x,trail[i].y,'#ffe9b5',2+i*.35);}ctx.globalAlpha=1;
  circle(b.x+1,b.y+3,E.R,'#00000077');const glass=ctx.createRadialGradient(b.x-2,b.y-3,1,b.x,b.y,E.R);glass.addColorStop(0,'#ffffff');glass.addColorStop(.35,'#e9e3c17a');glass.addColorStop(.8,'#567b6777');glass.addColorStop(1,'#e6d6ae');circle(b.x,b.y,E.R,glass);atlas(sprites,1,b.x-E.R*1.55,b.y-E.R*1.55,E.R*3.1,E.R*3.1);
  effects=effects.filter(f=>s.time-f.at<f.life);for(const f of effects){const age=s.time-f.at,t=age/f.life,alpha=1-t;ctx.save();ctx.globalAlpha=alpha;
   if(f.kind==='pin'){circle(f.x,f.y,5+9*t,'#ffd56c30');for(let i=0;i<5;i++){const angle=i*2.4+f.x,dist=5+age*55,x=f.x+Math.cos(angle)*dist,y=f.y+Math.sin(angle)*dist;line(x,y,x+Math.cos(angle)*3,y+Math.sin(angle)*3,'#ffe1a0',1);}}
   else {ctx.beginPath();ctx.ellipse(f.x,Math.min(f.y,709),10+t*14,4+t*6,0,0,Math.PI*2);ctx.strokeStyle=f.kind==='hit'?'#ffdb72':'#ccb785';ctx.lineWidth=2;ctx.stroke();if(f.kind==='hit'){if(!reduced.matches)for(let i=0;i<18;i++){const angle=-Math.PI+i/17*Math.PI,speed=35+(i%4)*13,x=f.x+Math.cos(angle)*speed*age,y=699+Math.sin(angle)*speed*age+55*age*age;ctx.fillStyle=i%2?'#ffe7a0':'#cb8c37';ctx.fillRect(x,y,2,4);}text('+'+f.gain,Math.max(44,Math.min(392,f.x)),665-(reduced.matches?0:t*27),22,'#ffe6a0');}}
   ctx.restore();}
  for(const [x,y] of [[10,13],[469,13],[10,747],[469,747]]){if(!atlas(sprites,3,x-6,y-6,12,12)){circle(x,y,3,'#bf9851');line(x-2,y,x+2,y,'#49321a');}}
  text('TAIWAN NIGHT MARKET',219,747,10,'#d9bc82');ctx.globalAlpha=1;
 }
 return {draw,event,clear,stats:()=>({effects:effects.length,trail:trail.length})};
}
root.NightMarketArt={create};
})(typeof window==='undefined'?globalThis:window);
