(function(root){
  'use strict';
  const table=root.OrbitPinballTable;
  const {W,H,R,RAIL_RADIUS,FLIPPER_RADIUS,FLIPPER_LENGTH,bumpers,targets,scoop,wormhole,bonusBumpers,slings,walls,launchPath,launchDistances,launchPoint,sideLanes,ramp,rampDistances,rampPoint,guides,deflectors,purpleWalls,sideWalls,leftBoundary,rightBoundary,railColliders}=table;
  function create(mode='mission'){if(!['mission','practice'].includes(mode))throw Error('Unknown mode');return {mode,phase:'ready',paused:false,time:0,lives:mode==='practice'?null:3,score:0,stage:0,lit:[false,false,false],sequence:0,completed:0,balls:[ball()],flippers:table.components.filter(c=>c.type==='flipper').map((c,i)=>({...c.pivot,length:c.length,radius:c.radius,a:i?Math.PI-.36:.36,omega:0})),saveUntil:0,cooldowns:{},events:[]};}
  function ball(){return {x:launchPath[0][0],y:launchPath[0][1],vx:0,vy:0,r:R,lane:true,stuck:0};}
  function emit(s,kind,x=240,y=400){s.events.push({kind,x,y});}
  function launch(s,power=.7){if(s.paused||s.phase!=='ready')return false;const p=Math.max(0,Math.min(1,Number.isFinite(power)?power:.7)),b=s.balls[0];b.launchDistance=0;b.launchSpeed=620+p*260;b.vy=-b.launchSpeed;s.phase='playing';s.saveUntil=s.time+8;emit(s,'launch',b.x,b.y);return true;}
  function flipperTip(f,index){return {x:f.x+Math.cos(f.a)*(f.length||FLIPPER_LENGTH),y:f.y+Math.sin(f.a)*(f.length||FLIPPER_LENGTH)};}
  function passiveRestitution(speed){return .18+.32*Math.min(1,Math.abs(speed)/700);}
  function segment(b,a,z,r=null,omega=0,pivot=a,radius=RAIL_RADIUS){
    const dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((b.x-a.x)*dx+(b.y-a.y)*dy)/(dx*dx+dy*dy||1))),px=a.x+t*dx,py=a.y+t*dy;
    let nx=b.x-px,ny=b.y-py,d=Math.hypot(nx,ny);const reach=b.r+radius;if(d>=reach)return false;
    if(d<.00001){nx=-dy;ny=dx;d=Math.hypot(nx,ny)||1;}nx/=d;ny/=d;b.x=px+nx*(reach+.05);b.y=py+ny*(reach+.05);
    const ux=-omega*(py-pivot.y),uy=omega*(px-pivot.x),v=(b.vx-ux)*nx+(b.vy-uy)*ny;
    if(v<0){const bounce=r===null?passiveRestitution(v):r;b.vx-=(1+bounce)*v*nx;b.vy-=(1+bounce)*v*ny;return true;}return false;
  }
  function ejectInterior(b,points){
    const cross=points.map((a,i)=>{const z=points[(i+1)%points.length];return (z[0]-a[0])*(b.y-a[1])-(z[1]-a[1])*(b.x-a[0]);});
    if(!(cross.every(v=>v>=0)||cross.every(v=>v<=0)))return false;
    const center=points.reduce((c,p)=>({x:c.x+p[0]/points.length,y:c.y+p[1]/points.length}),{x:0,y:0});let best;
    points.forEach((a,i)=>{const z=points[(i+1)%points.length],dx=z[0]-a[0],dy=z[1]-a[1],t=Math.max(0,Math.min(1,((b.x-a[0])*dx+(b.y-a[1])*dy)/(dx*dx+dy*dy))),x=a[0]+t*dx,y=a[1]+t*dy,d=Math.hypot(b.x-x,b.y-y);if(!best||d<best.d){let nx=-dy,ny=dx,len=Math.hypot(nx,ny);nx/=len;ny/=len;if(nx*(center.x-x)+ny*(center.y-y)>0){nx=-nx;ny=-ny;}best={x,y,nx,ny,d};}});
    b.x=best.x+best.nx*(b.r+RAIL_RADIUS+.1);b.y=best.y+best.ny*(b.r+RAIL_RADIUS+.1);
    const inward=b.vx*best.nx+b.vy*best.ny;if(inward<0){b.vx-=inward*best.nx;b.vy-=inward*best.ny;}return true;
  }
  function leftLimit(y,r=R){
    for(let i=1;i<leftBoundary.length;i++){const a=leftBoundary[i-1],z=leftBoundary[i];if(z[1]>a[1]&&y>=a[1]&&y<=z[1]){const dx=z[0]-a[0],dy=z[1]-a[1];return a[0]+(y-a[1])*dx/dy+(r+RAIL_RADIUS+.1)*Math.hypot(dx,dy)/dy;}}
    return r+20;
  }
  function rightLimit(y,r=R){for(let i=1;i<rightBoundary.length;i++){const a=rightBoundary[i-1],z=rightBoundary[i];if(y>=a[1]&&y<=z[1])return a[0]+(z[0]-a[0])*(y-a[1])/(z[1]-a[1])-r-RAIL_RADIUS;}return 423-r-RAIL_RADIUS;}
  function contain(b){
    if(b.y<25+b.r){b.y=25+b.r;if(b.vy<0)b.vy=-b.vy*passiveRestitution(b.vy);}
    const left=leftLimit(b.y,b.r),right=rightLimit(b.y,b.r);
    if(b.x<left){b.x=left;if(b.vx<0)b.vx=-b.vx*passiveRestitution(b.vx);}
    if(b.x>right){b.x=right;if(b.vx>0)b.vx=-b.vx*passiveRestitution(b.vx);}
  }
  function circle(b,c,kick){let dx=b.x-c.x,dy=b.y-c.y,d=Math.hypot(dx,dy);if(d>=b.r+c.r)return false;if(d<.001){dx=0;dy=1;d=1;}const nx=dx/d,ny=dy/d;b.x=c.x+nx*(b.r+c.r+.1);b.y=c.y+ny*(b.r+c.r+.1);const v=b.vx*nx+b.vy*ny;if(v<0){const bounce=kick? .85:passiveRestitution(v);b.vx-=(1+bounce)*v*nx;b.vy-=(1+bounce)*v*ny;}b.vx+=nx*kick;b.vy+=ny*kick;return true;}
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
        if(b.rampUntil){const p=rampPoint(1-(b.rampUntil-s.time)/2.4);b.x=p.x;b.y=p.y;if(s.time>=b.rampUntil){b.rampUntil=0;b.deck=true;b.x=ramp.at(-1)[0];b.y=ramp.at(-1)[1];b.vx=20;b.vy=180;s.score+=500;emit(s,'orbit',b.x,b.y);}continue;}
        if(b.dropUntil){if(s.time<b.dropUntil)continue;b.dropUntil=0;b.deck=false;b.vx=130;b.vy=200;emit(s,'platform-drop',b.x,b.y);continue;}
        if(b.deck){
          b.vy+=720*h;b.vx*=Math.exp(-.055*h);b.vy*=Math.exp(-.055*h);b.x+=b.vx*h;b.y+=b.vy*h;
          for(const c of railColliders.filter(c=>c.component.layer===2))segment(b,{x:c.a[0],y:c.a[1]},{x:c.b[0],y:c.b[1]},null,0,undefined,c.radius);
          for(const c of table.components.filter(c=>c.type==='bumper'&&c.layer===2))if(circle(b,c.shape,c.kick)&&contact(s,c.id)){s.score+=50;emit(s,'bumper',c.shape.x,c.shape.y);}
          const a=table.chamberLeft.at(-1),z=table.chamberRight.at(-1),exitY=(a[1]+z[1])/2;
          if(b.vy>0&&b.y>=exitY&&b.x>=Math.min(a[0],z[0])-b.r&&b.x<=Math.max(a[0],z[0])+b.r){b.x=(a[0]+z[0])/2;b.y=exitY+10;b.vx=0;b.vy=0;b.dropUntil=s.time+.28;}
          continue;
        }
        if(b.rampBlocked&&b.y>600)b.rampBlocked=false;
        if(b.captureUntil){if(s.time<b.captureUntil)continue;b.captureUntil=0;b.x=wormhole.x;b.y=wormhole.y;b.vx=-35;b.vy=170;b.stuck=0;b.scoopBlocked=true;hit(s,'scoop',0);emit(s,'warp',b.x,b.y);if(s.phase==='won')break;continue;}
        if(b.scoopBlocked&&b.x<330&&b.y>330)b.scoopBlocked=false;
        if(b.lane){
          b.launchDistance=(b.launchDistance||0)+b.launchSpeed*h;
          const p=launchPoint(b.launchDistance);b.x=p.x;b.y=p.y;
          if(b.launchDistance>=launchDistances.at(-1)){b.lane=false;const a=launchPath.at(-2),z=launchPath.at(-1),length=Math.hypot(z[0]-a[0],z[1]-a[1]);b.vx=(z[0]-a[0])/length*b.launchSpeed*.65;b.vy=(z[1]-a[1])/length*b.launchSpeed*.65;b.scoopBlocked=true;emit(s,'rail',b.x,b.y);}
          continue;
        }
        b.vy+=720*h;b.vx*=Math.exp(-.055*h);b.vy*=Math.exp(-.055*h);b.x+=b.vx*h;b.y+=b.vy*h;
        if(!b.rampBlocked&&b.vy<-120&&Math.hypot(b.x-ramp[0][0],b.y-ramp[0][1])<table.components.find(c=>c.id==='left-ramp').entryRadius){b.rampUntil=s.time+2.4;b.rampBlocked=true;b.vx=0;b.vy=0;emit(s,'ramp',b.x,b.y);continue;}
        for(const c of railColliders.filter(c=>c.component.layer===0))if(segment(b,{x:c.a[0],y:c.a[1]},{x:c.b[0],y:c.b[1]},null,0,undefined,c.radius)&&contact(s,'rail',.12))emit(s,'rail',b.x,b.y);
        slings.forEach((points,i)=>{const corrected=ejectInterior(b,points);for(let edge=0;edge<3;edge++){const a=points[edge],z=points[(edge+1)%3],dx=z[0]-a[0],dy=z[1]-a[1],length=Math.hypot(dx,dy),impact=Math.abs((b.vx*-dy+b.vy*dx)/length);if(segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]})&&edge===2&&!corrected&&impact>100&&contact(s,'sling'+i,.25)){s.score+=25;emit(s,'sling',b.x,b.y);}}});
        s.flippers.forEach((f,i)=>{if(segment(b,f,flipperTip(f,i),f.omega?.82:null,f.omega,f,f.radius||FLIPPER_RADIUS)&&contact(s,'flipper'+i,.08))emit(s,'flipper',b.x,b.y);});
        table.components.filter(c=>c.type==='bumper'&&c.layer===0).forEach(c=>{const main=c.id.startsWith('bumper-'),i=Number(c.id.split('-')[1]);if(circle(b,c.shape,c.kick)&&contact(s,c.id)){if(main)hit(s,'bumper',i);else s.score+=50;emit(s,'bumper',c.shape.x,c.shape.y);}});
        // Rollover switches detect entry without changing the ball's position or velocity.
        b.rollovers ||= [];
        targets.forEach((c,i)=>{const inside=Math.hypot(b.x-c.x,b.y-c.y)<c.r+b.r;if(inside&&!b.rollovers[i]){hit(s,'target',i);emit(s,'target',c.x,c.y);}b.rollovers[i]=inside;});
        if(!b.scoopBlocked&&Math.hypot(b.x-scoop.x,b.y-scoop.y)<scoop.r&&contact(s,'scoop',1.5)){b.x=scoop.x;b.y=scoop.y;b.vx=0;b.vy=0;b.captureUntil=s.time+1;emit(s,'scoop',scoop.x,scoop.y);continue;}
        const speed=Math.hypot(b.vx,b.vy);if(speed>1100){b.vx*=1100/speed;b.vy*=1100/speed;}
        // Resolve the exterior LAST: bumpers and nearby rails can push a ball outward.
        contain(b);
        if(table.drains.some(d=>b.y>d.minY&&b.x>d.minX&&b.x<d.maxX)){s.balls=s.balls.filter(other=>other!==b);if(!s.balls.length){const saved=s.time<s.saveUntil;if(!saved&&s.lives!==null)s.lives--;if(s.lives===0){s.phase='lost';emit(s,'lost');}else{s.balls=[ball()];s.phase='ready';emit(s,saved?'saved':'drain');}}}
        if(s.phase==='won'||s.phase==='lost')break;
      }
      if(s.phase==='won'||s.phase==='lost')break;
    }
  }
  const api={table,W,H,R,RAIL_RADIUS,FLIPPER_RADIUS,FLIPPER_LENGTH,passiveRestitution,purpleWalls,rightLimit,leftLimit,launchPath,launchPoint,launchDistances,ramp,rampPoint,bonusBumpers,bumpers,targets,scoop,wormhole,slings,deflectors,walls,sideLanes,guides,sideWalls,create,launch,tick,flipperTip};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitPinball=api;
})(typeof window==='undefined'?globalThis:window);
