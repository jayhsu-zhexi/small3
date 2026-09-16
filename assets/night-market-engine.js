(function(root){
 'use strict';
 const values=[10,20,50,100,50,20,10], pegs=[];
 for(let row=0;row<8;row++)for(let col=0;col<(row%2?6:7);col++)pegs.push({x:52+col*52+(row%2?26:0),y:155+row*48,r:6});
 function create(){return {phase:'ready',score:0,count:0,ball:{x:447,y:595,vx:0,vy:0},time:0,power:0,bin:-1,hits:0};}
 function launch(s,power){if(s.phase!=='ready')return false;s.power=Math.max(0,Math.min(1,power));s.phase='launch';s.time=0;s.bin=-1;s.ball={x:447,y:595,vx:0,vy:0};return true;}
 function circle(b,x,y,r,bounce){let dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy);if(d>=r)return; if(d<.0001){dx=.01;dy=-1;d=Math.hypot(dx,dy);}const nx=dx/d,ny=dy/d;b.x=x+nx*r;b.y=y+ny*r;const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=(1+bounce)*v*nx;b.vy-=(1+bounce)*v*ny;} }
 function tick(s,dt){if(s.phase==='ready')return;s.time+=dt;const b=s.ball;
  if(s.phase==='result'){if(s.time>=1.3){s.phase='ready';s.ball={x:447,y:595,vx:0,vy:0};}return;}
  if(s.phase==='launch'){const t=Math.min(1,s.time/.9);if(t<.7){b.x=447;b.y=595-535*t/.7;}else{const a=(t-.7)/.3;b.x=447-55*a;b.y=60-22*Math.sin(a*Math.PI);}if(t===1){s.phase='fall';s.time=0;b.vx=-110-s.power*340;b.vy=-35;}return;}
  b.vy+=500*dt;b.vx*=Math.exp(-.06*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.x<27){b.x=27;b.vx=Math.abs(b.vx)*.65;}if(b.x>403){b.x=403;b.vx=-Math.abs(b.vx)*.65;}if(b.y<30){b.y=30;b.vy=Math.abs(b.vy)*.6;}
  for(const p of pegs){if(Math.hypot(b.x-p.x,b.y-p.y)<14){circle(b,p.x,p.y,14,.65);s.hits++;if(Math.abs(b.vx)<2&&b.y<p.y)b.vx=(s.count%2?1:-1)*9;}}
  for(let i=1;i<7;i++){const x=19+i*56;circle(b,x,555,11,.35);if(b.y>555&&b.y<627&&Math.abs(b.x-x)<11){b.x=x+(b.x<x?-11:11);b.vx=(b.x<x?-1:1)*Math.abs(b.vx)*.35;}}
  if(b.y>=615){s.bin=Math.max(0,Math.min(6,Math.floor((b.x-19)/56)));b.y=615;b.vx=b.vy=0;s.score+=values[s.bin];s.count++;s.phase='result';s.time=0;}
 }
 function step(s,dt){let left=Math.min(.1,Math.max(0,dt));while(left>0){const h=Math.min(left,1/240);tick(s,h);left-=h;}return s;}
 const api={create,launch,step,pegs,values};if(typeof module!=='undefined')module.exports=api;else root.NightMarket=api;
})(typeof window!=='undefined'?window:globalThis);
