(function(root){
'use strict';
const W=480,H=760,R=7,left=20,right=416,slotWidth=44;
const pins=[];for(let row=0;row<9;row++)for(let col=0;col<8;col++){const x=50+col*46+(row%2?23:0);if(x<400)pins.push({x,y:155+row*51,r:4});}
function create(){return {phase:'scan',paused:false,time:0,scan:0,targets:[0,1,2],remaining:10,shots:0,hits:0,score:0,streak:0,best:0,ball:null,result:null,events:[]};}
function stop(s){if(s.paused||s.phase!=='scan')return false;s.phase='ready';s.events.push({kind:'lock'});return true;}
function launch(s,power){if(s.paused||s.phase!=='ready')return false;power=Math.max(0,Math.min(1,Number.isFinite(power)?power:0));s.phase='flight';s.ball={x:451,y:690,vx:0,vy:0,r:R,lane:0,power,weak:power<.22};s.events.push({kind:'launch'});return true;}
function settle(s,slot){if(s.phase!=='flight')return;const hit=s.targets.includes(slot);s.shots++;s.remaining--;if(hit){s.hits++;s.streak++;s.best=Math.max(s.best,s.streak);}else s.streak=0;const gain=hit?100+(s.streak===2?25:s.streak>=3?50:0):0;s.score+=gain;s.result={slot,hit,gain};s.phase='result';s.until=s.time+1.35;s.events.push({kind:hit?'hit':'miss'});}
function tick(s,dt){if(s.paused||s.phase==='over')return;dt=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));const steps=Math.ceil(dt*240);if(!steps)return;const h=dt/steps;for(let k=0;k<steps;k++){s.time+=h;if(s.phase==='scan'){const n=Math.floor(s.time/.12)%9;if(n!==s.scan){s.scan=n;s.targets=[n,(n+1)%9,(n+2)%9];s.events.push({kind:'scan'});}continue;}if(s.phase==='result'){if(s.time>=s.until){s.ball=null;s.phase=s.remaining?'scan':'over';if(!s.remaining)s.events.push({kind:'over'});}continue;}if(s.phase!=='flight')continue;const b=s.ball;if(b.lane!==null){b.lane+=h;if(b.weak){b.y=690-Math.sin(Math.min(1,b.lane/.8)*Math.PI)*b.power*1000;if(b.lane>=.8){s.ball=null;s.phase='ready';s.events.push({kind:'weak'});}continue;}const f=Math.min(1,b.lane/.8);if(f<.82){b.x=451;b.y=690-f/.82*626;}else{const a=(f-.82)/.18*Math.PI/2;b.x=451-65*(1-Math.cos(a));b.y=64-30*Math.sin(a);}if(f===1){b.lane=null;b.vx=-100-b.power*350;b.vy=35;}continue;}
 b.vy+=520*h;b.vx*=Math.exp(-.05*h);b.x+=b.vx*h;b.y+=b.vy*h;
 if(b.x<left+R){b.x=left+R;b.vx=Math.abs(b.vx)*.5;}if(b.x>right-R){b.x=right-R;b.vx=-Math.abs(b.vx)*.5;}if(b.y<R+20){b.y=R+20;b.vy=Math.abs(b.vy)*.5;}
 for(const p of pins){let dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),reach=R+p.r;if(d>=reach)continue;if(d<.001){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d;b.x=p.x+nx*(reach+.01);b.y=p.y+ny*(reach+.01);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=1.55*v*nx;b.vy-=1.55*v*ny;s.events.push({kind:'pin'});}if(Math.abs(nx)<.025&&ny<0&&Math.abs(b.vx)<2)b.vx=3;}
 for(let i=1;i<9;i++){const x=left+i*slotWidth,y=Math.max(644,Math.min(725,b.y)),dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy);if(d<R+2){const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0;b.x=x+nx*(R+2+.01);b.y=y+ny*(R+2+.01);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=1.35*v*nx;b.vy-=1.35*v*ny;}}}
 if(b.y>=717){b.y=717;settle(s,Math.max(0,Math.min(8,Math.floor((b.x-left)/slotWidth))));}
 }}
const api={W,H,R,left,right,slotWidth,pins,create,stop,launch,tick};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NightPinball=api;
})(typeof window==='undefined'?globalThis:window);
