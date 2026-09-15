(function(root){
  'use strict';
  const W=480,H=860,R=10,RAIL_RADIUS=7,FLIPPER_RADIUS=10,FLIPPER_LENGTH=90;
  const bumpers=[{x:224,y:205,r:30},{x:180,y:345,r:28},{x:272,y:345,r:28}];
  const targets=[{x:142,y:115,r:15},{x:240,y:100,r:15},{x:338,y:115,r:15}];
  const scoop={x:366,y:452,r:24},wormhole={x:378,y:350,r:16};
  const slings=[[[90,595],[102,690],[160,670]],[[357,595],[350,690],[300,670]]];
  const walls=[[[28,770],[28,155]],[[28,155],[44,92]],[[44,92],[100,48]],[[100,48],[375,48]],[[375,48],[421,84]],[[421,84],[451,150]],[[451,150],[451,820]],[[419,210],[419,815]]];
  // Open U-shaped return channels, sampled once for identical rendering and collisions.
  function smooth(points){const out=[];for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];for(let j=0;j<6;j++){const t=j/6;out.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}}out.push(points.at(-1));return out;}
  // Wide rounded return pockets: 64-unit rail spacing leaves 50 units for a 20-unit ball.
  const leftReturn=[[42,500],[42,280],[48,235],[74,215],[100,235],[106,280],[106,420],[128,490]];
  const rightReturn=[[405,370],[405,280],[399,235],[373,215],[347,235],[341,280],[341,370]];
  const sideLanes=[smooth(leftReturn),smooth(rightReturn)];
  // The raised orbit is a separate height layer; balls below it retain ground collisions.
  const ramp=smooth([[135,520],[103,470],[108,420],[140,360],[125,280],[100,190],[75,70],[150,55],[240,55],[365,65],[401,150],[390,230],[378,350]]);
  const rampDistances=[0];for(let i=1;i<ramp.length;i++)rampDistances.push(rampDistances[i-1]+Math.hypot(ramp[i][0]-ramp[i-1][0],ramp[i][1]-ramp[i-1][1]));
  function rampPoint(progress){const d=Math.max(0,Math.min(1,progress))*rampDistances.at(-1);let i=1;while(i<ramp.length-1&&rampDistances[i]<d)i++;const t=(d-rampDistances[i-1])/(rampDistances[i]-rampDistances[i-1]);return {x:ramp[i-1][0]+(ramp[i][0]-ramp[i-1][0])*t,y:ramp[i-1][1]+(ramp[i][1]-ramp[i-1][1])*t};}
  const guides=[[[82,150],[136,181]],[[344,181],[395,150]],[[90,545],[90,690]],[[90,690],[115,718]],[[365,545],[365,690]],[[365,690],[350,718]]];
  const sideWalls=sideLanes.flatMap(points=>points.slice(1).map((point,i)=>[points[i],point])).concat(guides);
  function create(mode='mission'){if(!['mission','practice'].includes(mode))throw Error('Unknown mode');return {mode,phase:'ready',paused:false,time:0,lives:mode==='practice'?null:3,score:0,stage:0,lit:[false,false,false],sequence:0,completed:0,balls:[ball()],flippers:[{x:130,y:732,a:.36,omega:0},{x:350,y:732,a:Math.PI-.36,omega:0}],saveUntil:0,cooldowns:{},events:[]};}
  function ball(){return {x:437,y:790,vx:0,vy:0,r:R,lane:true,stuck:0};}
  function emit(s,kind,x=240,y=400){s.events.push({kind,x,y});}
  function launch(s,power=.7){if(s.paused||s.phase!=='ready')return false;const p=Math.max(0,Math.min(1,Number.isFinite(power)?power:.7)),b=s.balls[0];b.vy=-1090-p*220;s.phase='playing';s.saveUntil=s.time+8;emit(s,'launch',b.x,b.y);return true;}
  function flipperTip(f,index){return {x:f.x+Math.cos(f.a)*FLIPPER_LENGTH,y:f.y+Math.sin(f.a)*FLIPPER_LENGTH};}
  function segment(b,a,z,r=.8,omega=0,pivot=a,radius=RAIL_RADIUS){
    const dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((b.x-a.x)*dx+(b.y-a.y)*dy)/(dx*dx+dy*dy||1))),px=a.x+t*dx,py=a.y+t*dy;
    let nx=b.x-px,ny=b.y-py,d=Math.hypot(nx,ny);const reach=b.r+radius;if(d>=reach)return false;
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
        if(b.rampUntil){const p=rampPoint(1-(b.rampUntil-s.time)/2.4);b.x=p.x;b.y=p.y;if(s.time>=b.rampUntil){b.rampUntil=0;b.x=wormhole.x;b.y=wormhole.y;b.vx=0;b.vy=-650;b.returning=true;b.scoopBlocked=true;s.score+=500;emit(s,'orbit',b.x,b.y);}continue;}
        if(b.rampBlocked&&b.y>600)b.rampBlocked=false;
        if(b.captureUntil){if(s.time<b.captureUntil)continue;b.captureUntil=0;b.x=wormhole.x;b.y=wormhole.y;b.vx=0;b.vy=-650;b.stuck=0;b.returning=true;b.scoopBlocked=true;hit(s,'scoop',0);emit(s,'warp',b.x,b.y);if(s.phase==='won')break;continue;}
        // The return rail ejects toward open play instead of dropping into its own scoop.
        if(b.returning&&b.y>390&&b.vy>0){b.returning=false;b.vx=-300;b.vy=280;emit(s,'rail',b.x,b.y);}
        if(b.scoopBlocked&&b.x<320&&b.y>400)b.scoopBlocked=false;
        b.vy+=720*h;b.vx*=Math.exp(-.055*h);b.vy*=Math.exp(-.055*h);b.x+=b.vx*h;b.y+=b.vy*h;
        if(b.lane){b.x=437;if(b.y<=128){b.lane=false;b.x=397;b.y=125;b.vx=-340;b.vy=-170;}continue;}
        if(!b.rampBlocked&&b.vy<-120&&Math.hypot(b.x-ramp[0][0],b.y-ramp[0][1])<23){b.rampUntil=s.time+2.4;b.rampBlocked=true;b.vx=0;b.vy=0;emit(s,'ramp',b.x,b.y);continue;}
        for(const [a,z] of walls)segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]});
        for(const [a,z] of sideWalls)if(segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]},.88)&&contact(s,'rail',.12))emit(s,'rail',b.x,b.y);
        slings.forEach((points,i)=>{for(let edge=0;edge<3;edge++){const a=points[edge],z=points[(edge+1)%3];if(segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]},1.08)&&contact(s,'sling'+i)){b.vy-=130;b.vx+=i?-70:70;s.score+=25;emit(s,'sling',b.x,b.y);}}});
        s.flippers.forEach((f,i)=>{if(segment(b,f,flipperTip(f,i),.82,f.omega,f,FLIPPER_RADIUS)&&contact(s,'flipper'+i,.08))emit(s,'flipper',b.x,b.y);});
        bumpers.forEach((c,i)=>{if(circle(b,c,130)&&contact(s,'b'+i)){hit(s,'bumper',i);emit(s,'bumper',c.x,c.y);}});
        targets.forEach((c,i)=>{if(circle(b,c,70)&&contact(s,'t'+i,.3)){hit(s,'target',i);emit(s,'target',c.x,c.y);}});
        if(!b.scoopBlocked&&Math.hypot(b.x-scoop.x,b.y-scoop.y)<scoop.r&&contact(s,'scoop',1.5)){b.x=scoop.x;b.y=scoop.y;b.vx=0;b.vy=0;b.captureUntil=s.time+2;emit(s,'scoop',scoop.x,scoop.y);continue;}
        const speed=Math.hypot(b.vx,b.vy);if(speed>1100){b.vx*=1100/speed;b.vy*=1100/speed;}b.stuck=speed<35?b.stuck+h:0;if(b.stuck>3){b.vx=b.x<240?150:-150;b.vy=-220;b.stuck=0;emit(s,'pulse',b.x,b.y);}
        // Numerical guards keep a ball on the table without hiding a normal bottom drain.
        if(b.x<15){b.x=15;b.vx=Math.abs(b.vx);}if(b.x>462){b.x=462;b.vx=-Math.abs(b.vx);}if(b.y<25){b.y=25;b.vy=Math.abs(b.vy);}
        if(b.y>845){s.balls=s.balls.filter(other=>other!==b);if(!s.balls.length){const saved=s.time<s.saveUntil;if(!saved&&s.lives!==null)s.lives--;if(s.lives===0){s.phase='lost';emit(s,'lost');}else{s.balls=[ball()];s.phase='ready';emit(s,saved?'saved':'drain');}}}
        if(s.phase==='won'||s.phase==='lost')break;
      }
      if(s.phase==='won'||s.phase==='lost')break;
    }
  }
  const api={W,H,R,RAIL_RADIUS,FLIPPER_RADIUS,FLIPPER_LENGTH,ramp,rampPoint,bumpers,targets,scoop,wormhole,slings,walls,sideLanes,guides,sideWalls,create,launch,tick,flipperTip};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitPinball=api;
})(typeof window==='undefined'?{}:window);
