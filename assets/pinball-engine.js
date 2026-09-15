(function(root){
  'use strict';
  const W=480,H=860,R=10;
  const bumpers=[{x:240,y:205,r:33},{x:145,y:310,r:33},{x:328,y:310,r:33}];
  const targets=[{x:142,y:115,r:15},{x:240,y:100,r:15},{x:338,y:115,r:15}];
  const scoop={x:366,y:452,r:24};
  const slings=[[[65,595],[102,690],[160,670]],[[415,595],[378,690],[320,670]]];
  const walls=[[[28,770],[28,155]],[[28,155],[44,92]],[[44,92],[100,48]],[[100,48],[375,48]],[[375,48],[421,84]],[[421,84],[451,150]],[[451,150],[451,820]],[[419,210],[419,815]],[[28,495],[50,565]],[[50,565],[66,585]],[[419,495],[403,565]],[[403,565],[394,585]]];
  function create(mode='mission'){if(!['mission','practice'].includes(mode))throw Error('Unknown mode');return {mode,phase:'ready',paused:false,time:0,lives:mode==='practice'?null:3,score:0,stage:0,lit:[false,false,false],sequence:0,completed:0,balls:[ball()],flippers:[{x:130,y:732,a:.36,omega:0},{x:350,y:732,a:Math.PI-.36,omega:0}],saveUntil:0,cooldowns:{},events:[]};}
  function ball(){return {x:437,y:790,vx:0,vy:0,r:R,lane:true,stuck:0};}
  function emit(s,kind,x=240,y=400){s.events.push({kind,x,y});}
  function launch(s,power=.7){if(s.paused||s.phase!=='ready')return false;const p=Math.max(0,Math.min(1,Number.isFinite(power)?power:.7)),b=s.balls[0];b.vy=-1090-p*220;s.phase='playing';s.saveUntil=s.time+8;emit(s,'launch',b.x,b.y);return true;}
  function flipperTip(f,index){return {x:f.x+Math.cos(f.a)*105,y:f.y+Math.sin(f.a)*105};}
  function segment(b,a,z,r=.8,omega=0,pivot=a){
    const dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((b.x-a.x)*dx+(b.y-a.y)*dy)/(dx*dx+dy*dy||1))),px=a.x+t*dx,py=a.y+t*dy;
    let nx=b.x-px,ny=b.y-py,d=Math.hypot(nx,ny);const reach=b.r+7;if(d>=reach)return false;
    if(d<.00001){nx=-dy;ny=dx;d=Math.hypot(nx,ny)||1;}nx/=d;ny/=d;b.x=px+nx*(reach+.05);b.y=py+ny*(reach+.05);
    const ux=-omega*(py-pivot.y),uy=omega*(px-pivot.x),v=(b.vx-ux)*nx+(b.vy-uy)*ny;
    if(v<0){b.vx-=(1+r)*v*nx;b.vy-=(1+r)*v*ny;return true;}return false;
  }
  function circle(b,c,kick){let dx=b.x-c.x,dy=b.y-c.y,d=Math.hypot(dx,dy);if(d>=b.r+c.r)return false;if(d<.001){dx=0;dy=1;d=1;}const nx=dx/d,ny=dy/d;b.x=c.x+nx*(b.r+c.r+.1);b.y=c.y+ny*(b.r+c.r+.1);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=1.85*v*nx;b.vy-=1.85*v*ny;}b.vx+=nx*kick;b.vy+=ny*kick;return true;}
  function contact(s,key,delay=.16){if((s.cooldowns[key]||0)>s.time)return false;s.cooldowns[key]=s.time+delay;return true;}
  function complete(s){s.score+=1000+s.stage*500;s.completed++;emit(s,'mission');if(s.stage===2){if(s.mode==='mission'){s.phase='won';return;}s.stage=0;s.lit=[false,false,false];s.sequence=0;}else{s.stage++;if(s.stage===2&&s.balls.length<2){s.balls.push({x:240,y:390,vx:-160,vy:-360,r:R,lane:false,stuck:0});emit(s,'multiball');}}}
  function hit(s,kind,index){
    if(kind==='bumper'){s.score+=100;if(s.stage===0){s.lit[index]=true;if(s.lit.every(Boolean))complete(s);}}
    if(kind==='target'){s.score+=150;if(s.stage===1){if(index===s.sequence){s.sequence++;if(s.sequence===3)complete(s);}else{s.sequence=index===0?1:0;emit(s,'order');}}}
    if(kind==='scoop'){s.score+=300;if(s.stage===2)complete(s);}
  }
  function tick(s,dt,input={}){
    if(s.paused||s.phase==='won'||s.phase==='lost')return;
    dt=Math.max(0,Math.min(1/30,Number.isFinite(dt)?dt:0));if(!dt)return;
    const steps=Math.ceil(dt/(1/240)),h=dt/steps;
    for(let n=0;n<steps;n++){
      s.time+=h;
      s.flippers.forEach((f,i)=>{const held=i?input.right:input.left,target=i?Math.PI+(held?.5:-.36):(held?-.5:.36),previous=f.a,speed=held?17:10;f.a+=Math.sign(target-f.a)*Math.min(Math.abs(target-f.a),speed*h);f.omega=(f.a-previous)/h;});
      if(s.phase==='ready')continue;
      for(const b of [...s.balls]){
        b.vy+=720*h;b.vx*=Math.exp(-.055*h);b.vy*=Math.exp(-.055*h);b.x+=b.vx*h;b.y+=b.vy*h;
        if(b.lane){b.x=437;if(b.y<=128){b.lane=false;b.x=397;b.y=125;b.vx=-340;b.vy=-170;}continue;}
        for(const [a,z] of walls)segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]});
        slings.forEach((points,i)=>{for(let edge=0;edge<3;edge++){const a=points[edge],z=points[(edge+1)%3];if(segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]},1.08)&&contact(s,'sling'+i)){b.vy-=130;b.vx+=i?-70:70;s.score+=25;emit(s,'sling',b.x,b.y);}}});
        s.flippers.forEach((f,i)=>{if(segment(b,f,flipperTip(f,i),.82,f.omega,f)&&contact(s,'flipper'+i,.08))emit(s,'flipper',b.x,b.y);});
        bumpers.forEach((c,i)=>{if(circle(b,c,130)&&contact(s,'b'+i)){hit(s,'bumper',i);emit(s,'bumper',c.x,c.y);}});
        targets.forEach((c,i)=>{if(circle(b,c,70)&&contact(s,'t'+i,.3)){hit(s,'target',i);emit(s,'target',c.x,c.y);}});
        if(Math.hypot(b.x-scoop.x,b.y-scoop.y)<scoop.r&&contact(s,'scoop',1.5)){hit(s,'scoop',0);emit(s,'scoop',scoop.x,scoop.y);b.x=330;b.y=470;b.vx=-210;b.vy=150;}
        const speed=Math.hypot(b.vx,b.vy);if(speed>1100){b.vx*=1100/speed;b.vy*=1100/speed;}b.stuck=speed<35?b.stuck+h:0;if(b.stuck>3){b.vx=b.x<240?150:-150;b.vy=-220;b.stuck=0;emit(s,'pulse',b.x,b.y);}
        // Numerical guards keep a ball on the table without hiding a normal bottom drain.
        if(b.x<15){b.x=15;b.vx=Math.abs(b.vx);}if(b.x>462){b.x=462;b.vx=-Math.abs(b.vx);}if(b.y<25){b.y=25;b.vy=Math.abs(b.vy);}
        if(b.y>845){s.balls=s.balls.filter(other=>other!==b);if(!s.balls.length){const saved=s.time<s.saveUntil;if(!saved&&s.lives!==null)s.lives--;if(s.lives===0){s.phase='lost';emit(s,'lost');}else{s.balls=[ball()];s.phase='ready';emit(s,saved?'saved':'drain');}}}
        if(s.phase==='won'||s.phase==='lost')break;
      }
      if(s.phase==='won'||s.phase==='lost')break;
    }
  }
  const api={W,H,R,bumpers,targets,scoop,slings,walls,create,launch,tick,flipperTip};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitPinball=api;
})(typeof window==='undefined'?{}:window);
