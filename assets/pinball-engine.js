(function(root){
  'use strict';
  const W=480,H=860,R=8,RAIL_RADIUS=4,FLIPPER_RADIUS=7,FLIPPER_LENGTH=65;
  const bumpers=[{x:214,y:182,r:21},{x:281,y:165,r:21},{x:245,y:241,r:21}];
  const targets=[{x:214,y:118,r:8},{x:245,y:118,r:8},{x:275,y:118,r:8}];
  const scoop={x:389,y:407,r:17},wormhole={x:389,y:270,r:12};
  const bonusBumpers=[{x:106,y:66,r:23},{x:34,y:414,r:12},{x:82,y:431,r:12},{x:48,y:459,r:12}];
  const slings=[[[132,543],[121,620],[160,642]],[[353,543],[349,615],[316,642]]];
  const walls=[[[28,705],[28,565]],[[28,565],[16,490]],[[16,490],[16,340]],[[16,340],[49,230]],[[435,365],[435,800]],[[464,800],[464,140]],[[423,705],[423,535]]];
  // Open U-shaped return channels, sampled once for identical rendering and collisions.
  function smooth(points){const out=[];for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];for(let j=0;j<6;j++){const t=j/6;out.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}}out.push(points.at(-1));return out;}
  // Shooter follows the yellow outer rail all the way to the crown before entering play.
  const launchPath=smooth([[448,686],[445,610],[441,520],[437,440],[435,360],[433,280],[426,210],[408,145],[380,100],[337,67],[284,48],[230,49],[207,72]]);
  const launchDistances=[0];for(let i=1;i<launchPath.length;i++)launchDistances.push(launchDistances[i-1]+Math.hypot(launchPath[i][0]-launchPath[i-1][0],launchPath[i][1]-launchPath[i-1][1]));
  function launchPoint(distance){let i=1;const d=Math.max(0,Math.min(launchDistances.at(-1),distance));while(i<launchPath.length-1&&launchDistances[i]<d)i++;const t=(d-launchDistances[i-1])/(launchDistances[i]-launchDistances[i-1]);return {x:launchPath[i-1][0]+(launchPath[i][0]-launchPath[i-1][0])*t,y:launchPath[i-1][1]+(launchPath[i][1]-launchPath[i-1][1])*t};}
  // Trace the approved fixed artwork: outer horseshoe and separate inner right return rail.
  const sideLanes=[smooth([[77,133],[58,108],[58,64],[82,29],[118,29],[155,53],[222,40],[290,36],[345,57],[389,106],[419,181],[423,280]]),smooth([[317,99],[344,115],[365,160],[365,218],[347,273]])];
  // Only the short left hairpin is raised; it does not wrap around the whole table.
  const ramp=smooth([[181,376],[163,334],[130,294],[96,269],[65,274],[43,302],[47,335],[69,362],[86,410],[72,465],[62,540],[80,566],[96,590]]);
  const rampDistances=[0];for(let i=1;i<ramp.length;i++)rampDistances.push(rampDistances[i-1]+Math.hypot(ramp[i][0]-ramp[i-1][0],ramp[i][1]-ramp[i-1][1]));
  function rampPoint(progress){const d=Math.max(0,Math.min(1,progress))*rampDistances.at(-1);let i=1;while(i<ramp.length-1&&rampDistances[i]<d)i++;const t=(d-rampDistances[i-1])/(rampDistances[i]-rampDistances[i-1]);return {x:ramp[i-1][0]+(ramp[i][0]-ramp[i-1][0])*t,y:ramp[i-1][1]+(ramp[i][1]-ramp[i-1][1])*t};}
  const guides=[[[64,557],[61,604]],[[61,604],[143,687]],[[395,557],[397,604]],[[397,604],[326,687]],[[74,611],[73,704]]];
  const deflectors=[[[152,85],[194,109],[166,145],[147,132]],[[299,82],[321,94],[294,129],[283,118]],[[151,220],[178,215],[166,254]]];
  const sideWalls=sideLanes.flatMap(points=>points.slice(1).map((point,i)=>[points[i],point])).concat(guides,deflectors.flatMap(p=>p.map((a,i)=>[a,p[(i+1)%p.length]])));
  function create(mode='mission'){if(!['mission','practice'].includes(mode))throw Error('Unknown mode');return {mode,phase:'ready',paused:false,time:0,lives:mode==='practice'?null:3,score:0,stage:0,lit:[false,false,false],sequence:0,completed:0,balls:[ball()],flippers:[{x:148,y:709,a:.36,omega:0},{x:335,y:709,a:Math.PI-.36,omega:0}],saveUntil:0,cooldowns:{},events:[]};}
  function ball(){return {x:launchPath[0][0],y:launchPath[0][1],vx:0,vy:0,r:R,lane:true,stuck:0};}
  function emit(s,kind,x=240,y=400){s.events.push({kind,x,y});}
  function launch(s,power=.7){if(s.paused||s.phase!=='ready')return false;const p=Math.max(0,Math.min(1,Number.isFinite(power)?power:.7)),b=s.balls[0];b.launchDistance=0;b.launchSpeed=620+p*260;b.vy=-b.launchSpeed;s.phase='playing';s.saveUntil=s.time+8;emit(s,'launch',b.x,b.y);return true;}
  function flipperTip(f,index){return {x:f.x+Math.cos(f.a)*FLIPPER_LENGTH,y:f.y+Math.sin(f.a)*FLIPPER_LENGTH};}
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
  const leftBoundary=[[95,25],[58,45],[48,90],[68,150],[49,230],[16,340],[16,490],[28,565],[28,715]];
  function leftLimit(y,r=R){
    for(let i=1;i<leftBoundary.length;i++){const a=leftBoundary[i-1],z=leftBoundary[i];if(y>=a[1]&&y<=z[1]){const dx=z[0]-a[0],dy=z[1]-a[1];return a[0]+(y-a[1])*dx/dy+(r+RAIL_RADIUS+.1)*Math.hypot(dx,dy)/dy;}}
    return r+20;
  }
  function contain(b){
    if(b.y<25+b.r){b.y=25+b.r;if(b.vy<0)b.vy=-b.vy*passiveRestitution(b.vy);}
    const left=leftLimit(b.y,b.r),right=464-b.r;
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
        if(b.rampUntil){const p=rampPoint(1-(b.rampUntil-s.time)/2.4);b.x=p.x;b.y=p.y;if(s.time>=b.rampUntil){b.rampUntil=0;b.x=ramp.at(-1)[0];b.y=ramp.at(-1)[1];b.vx=130;b.vy=200;s.score+=500;emit(s,'orbit',b.x,b.y);}continue;}
        if(b.rampBlocked&&b.y>600)b.rampBlocked=false;
        if(b.captureUntil){if(s.time<b.captureUntil)continue;b.captureUntil=0;b.x=wormhole.x;b.y=wormhole.y;b.vx=0;b.vy=-650;b.stuck=0;b.returning=true;b.scoopBlocked=true;hit(s,'scoop',0);emit(s,'warp',b.x,b.y);if(s.phase==='won')break;continue;}
        // The return rail ejects toward open play instead of dropping into its own scoop.
        if(b.returning&&b.y>315&&b.vy>0){b.returning=false;b.vx=-220;b.vy=230;emit(s,'rail',b.x,b.y);}
        if(b.scoopBlocked&&b.x<330&&b.y>330)b.scoopBlocked=false;
        if(b.lane){
          b.launchDistance=(b.launchDistance||0)+b.launchSpeed*h;
          const p=launchPoint(b.launchDistance);b.x=p.x;b.y=p.y;
          if(b.launchDistance>=launchDistances.at(-1)){b.lane=false;const a=launchPath.at(-2),z=launchPath.at(-1),length=Math.hypot(z[0]-a[0],z[1]-a[1]);b.vx=(z[0]-a[0])/length*b.launchSpeed*.65;b.vy=(z[1]-a[1])/length*b.launchSpeed*.65;b.scoopBlocked=true;emit(s,'rail',b.x,b.y);}
          continue;
        }
        b.vy+=720*h;b.vx*=Math.exp(-.055*h);b.vy*=Math.exp(-.055*h);b.x+=b.vx*h;b.y+=b.vy*h;
        if(!b.rampBlocked&&b.vy<-120&&Math.hypot(b.x-ramp[0][0],b.y-ramp[0][1])<23){b.rampUntil=s.time+2.4;b.rampBlocked=true;b.vx=0;b.vy=0;emit(s,'ramp',b.x,b.y);continue;}
        for(const [a,z] of walls)segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]});
        for(const [a,z] of sideWalls)if(segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]})&&contact(s,'rail',.12))emit(s,'rail',b.x,b.y);
        slings.forEach((points,i)=>{const corrected=ejectInterior(b,points);for(let edge=0;edge<3;edge++){const a=points[edge],z=points[(edge+1)%3],dx=z[0]-a[0],dy=z[1]-a[1],length=Math.hypot(dx,dy),impact=Math.abs((b.vx*-dy+b.vy*dx)/length);if(segment(b,{x:a[0],y:a[1]},{x:z[0],y:z[1]})&&edge===2&&!corrected&&impact>100&&contact(s,'sling'+i,.25)){s.score+=25;emit(s,'sling',b.x,b.y);}}});
        s.flippers.forEach((f,i)=>{if(segment(b,f,flipperTip(f,i),f.omega?.82:null,f.omega,f,FLIPPER_RADIUS)&&contact(s,'flipper'+i,.08))emit(s,'flipper',b.x,b.y);});
        bumpers.forEach((c,i)=>{if(circle(b,c,130)&&contact(s,'b'+i)){hit(s,'bumper',i);emit(s,'bumper',c.x,c.y);}});
        bonusBumpers.forEach((c,i)=>{if(circle(b,c,0)&&contact(s,'bonus'+i)){s.score+=50;emit(s,'bumper',c.x,c.y);}});
        // Rollover switches detect entry without changing the ball's position or velocity.
        b.rollovers ||= [];
        targets.forEach((c,i)=>{const inside=Math.hypot(b.x-c.x,b.y-c.y)<c.r+b.r;if(inside&&!b.rollovers[i]){hit(s,'target',i);emit(s,'target',c.x,c.y);}b.rollovers[i]=inside;});
        if(!b.scoopBlocked&&Math.hypot(b.x-scoop.x,b.y-scoop.y)<scoop.r&&contact(s,'scoop',1.5)){b.x=scoop.x;b.y=scoop.y;b.vx=0;b.vy=0;b.captureUntil=s.time+2;emit(s,'scoop',scoop.x,scoop.y);continue;}
        const speed=Math.hypot(b.vx,b.vy);if(speed>1100){b.vx*=1100/speed;b.vy*=1100/speed;}
        // Resolve the exterior LAST: bumpers and nearby rails can push a ball outward.
        contain(b);
        if(b.y>782||(b.y>715&&(b.x<80||b.x>400))){s.balls=s.balls.filter(other=>other!==b);if(!s.balls.length){const saved=s.time<s.saveUntil;if(!saved&&s.lives!==null)s.lives--;if(s.lives===0){s.phase='lost';emit(s,'lost');}else{s.balls=[ball()];s.phase='ready';emit(s,saved?'saved':'drain');}}}
        if(s.phase==='won'||s.phase==='lost')break;
      }
      if(s.phase==='won'||s.phase==='lost')break;
    }
  }
  const api={W,H,R,RAIL_RADIUS,FLIPPER_RADIUS,FLIPPER_LENGTH,passiveRestitution,leftLimit,launchPath,launchPoint,launchDistances,ramp,rampPoint,bonusBumpers,bumpers,targets,scoop,wormhole,slings,deflectors,walls,sideLanes,guides,sideWalls,create,launch,tick,flipperTip};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitPinball=api;
})(typeof window==='undefined'?{}:window);
