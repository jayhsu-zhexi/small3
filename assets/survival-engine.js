(function(root){
  'use strict';
  const TILE=64,W=36,H=28,DURATION=300;
  function random(seed){let n=seed>>>0;return ()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  function map(seed){const rng=random(seed),tiles=new Uint8Array(W*H).fill(1),rooms=[];
    const carve=(x,y)=>{if(x>0&&x<W-1&&y>0&&y<H-1)tiles[y*W+x]=0;};
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){const x=5+col*8,y=5+row*8,rx=2+Math.floor(rng()*2),ry=2+Math.floor(rng()*2);rooms.push({x,y});for(let a=x-rx;a<=x+rx;a++)for(let b=y-ry;b<=y+ry;b++)carve(a,b);}
    function corridor(a,b){let x=a.x,y=a.y;const paint=()=>{carve(x,y);carve(x+1,y);carve(x,y+1);carve(x+1,y+1);};paint();while(x!==b.x){x+=Math.sign(b.x-x);paint();}while(y!==b.y){y+=Math.sign(b.y-y);paint();}}
    const visited=new Set([5]),stack=[5];while(stack.length){const a=stack.at(-1),c=a%4,r=Math.floor(a/4),neighbors=[c>0?a-1:-1,c<3?a+1:-1,r>0?a-4:-1,r<2?a+4:-1].filter(n=>n>=0&&!visited.has(n));if(!neighbors.length){stack.pop();continue;}const b=neighbors[Math.floor(rng()*neighbors.length)];corridor(rooms[a],rooms[b]);visited.add(b);stack.push(b);}
    for(let n=0;n<6;n++){const a=Math.floor(rng()*12),b=a%4<3?a+1:a-1;corridor(rooms[a],rooms[b]);}
    const floor=[];for(let i=0;i<tiles.length;i++)if(!tiles[i])floor.push(i);
    return {seed,tiles,floor,rooms,width:W*TILE,height:H*TILE,spawn:{x:(rooms[5].x+.5)*TILE,y:(rooms[5].y+.5)*TILE}};
  }
  function solid(m,x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx<0||ty<0||tx>=W||ty>=H||m.tiles[ty*W+tx]!==0;}
  function free(m,x,y,r=13){for(let ty=Math.floor((y-r)/TILE);ty<=Math.floor((y+r)/TILE);ty++)for(let tx=Math.floor((x-r)/TILE);tx<=Math.floor((x+r)/TILE);tx++)if(tx<0||ty<0||tx>=W||ty>=H||m.tiles[ty*W+tx]){const cx=Math.max(tx*TILE,Math.min(x,(tx+1)*TILE)),cy=Math.max(ty*TILE,Math.min(y,(ty+1)*TILE));if(Math.hypot(x-cx,y-cy)<r)return false;}return true;}
  function move(m,body,dx,dy){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));for(let i=0;i<steps;i++){if(free(m,body.x+dx/steps,body.y,body.r))body.x+=dx/steps;if(free(m,body.x,body.y+dy/steps,body.r))body.y+=dy/steps;}}
  function line(m,x,y,ex,ey){const distance=Math.hypot(ex-x,ey-y),n=Math.ceil(distance/12);for(let i=0;i<=n;i++)if(solid(m,x+(ex-x)*i/(n||1),y+(ey-y)*i/(n||1)))return false;return true;}
  function create(seed=Date.now()){const m=map(seed),rng=random(seed^0xa511e9b3),s={seed,map:m,rng,phase:'playing',time:0,score:0,killScore:0,kills:0,player:{...m.spawn,r:14,hp:100,shield:25,angle:0,invuln:0,fire:0,dash:0,dashTime:0,boost:0},enemies:[],bullets:[],pickups:[],events:[],spawnTimer:3,supplyTimer:10,flow:null,flowTimer:0,wave:1,nextId:1};for(let i=0;i<8;i++)supply(s,i%3,150,1000);return s;}
  function pause(s){if(s.phase==='playing'){s.phase='paused';s.events=[];}}
  function resume(s){if(s.phase==='paused')s.phase='playing';}
  function emit(s,kind,x,y,extra={}){if(s.events.length<64)s.events.push({...extra,kind,x,y});}
  function place(s,min,max){const p=s.player;for(let i=0;i<160;i++){const cell=s.map.floor[Math.floor(s.rng()*s.map.floor.length)],x=(cell%W+.5)*TILE,y=(Math.floor(cell/W)+.5)*TILE,d=Math.hypot(x-p.x,y-p.y);if(d>=min&&d<=max&&free(s.map,x,y,20)&&!s.enemies.some(e=>Math.hypot(e.x-x,e.y-y)<60)&&!s.pickups.some(e=>Math.hypot(e.x-x,e.y-y)<40))return {x,y};}return null;}
  function supply(s,kind=Math.floor(s.rng()*3),min=140,max=550){if(s.pickups.length>=16)return false;const point=place(s,min,max);if(!point)return false;s.pickups.push({...point,kind,age:0,id:s.nextId++});return true;}
  function spawn(s,kind){if(s.enemies.length>=38)return false;const point=place(s,440,1000);if(!point)return false;if(kind===undefined){const roll=s.rng();kind=s.time>90&&roll<.2?2:s.time>30&&roll<.48?1:0;}const hp=[42,62,150][kind];s.enemies.push({...point,id:s.nextId++,kind,hp,maxHp:hp,r:kind===2?20:14,angle:0,speed:[78,62,46][kind]+Math.min(28,s.time*.07),spawn:1.2,fire:.6+s.rng(),charge:0,flash:0});emit(s,'spawn',point.x,point.y);return true;}
  function flow(m,p){const dist=new Int16Array(W*H).fill(-1),start=Math.floor(p.y/TILE)*W+Math.floor(p.x/TILE),queue=[start];dist[start]=0;for(let head=0;head<queue.length;head++){const cell=queue[head],x=cell%W,y=Math.floor(cell/W);for(const n of [x>0?cell-1:-1,x<W-1?cell+1:-1,y>0?cell-W:-1,y<H-1?cell+W:-1])if(n>=0&&!m.tiles[n]&&dist[n]<0){dist[n]=dist[cell]+1;queue.push(n);}}return dist;}
  function target(s,e){const cell=Math.floor(e.y/TILE)*W+Math.floor(e.x/TILE);let best=cell,value=s.flow[cell];for(const n of [cell-1,cell+1,cell-W,cell+W])if(n>=0&&n<W*H&&s.flow[n]>=0&&(value<0||s.flow[n]<value)){best=n;value=s.flow[n];}return {x:(best%W+.5)*TILE,y:(Math.floor(best/W)+.5)*TILE};}
  function damage(s,amount){const p=s.player;if(s.phase!=='playing'||p.invuln>0)return false;const blocked=Math.min(p.shield,amount);p.shield-=blocked;p.hp=Math.max(0,p.hp-(amount-blocked));p.invuln=.7;emit(s,'hurt',p.x,p.y);if(!p.hp){s.phase='lost';emit(s,'lost',p.x,p.y);}return true;}
  function pickup(s,item){if(s.phase!=='playing')return false;const p=s.player;if(item.kind===0){if(p.hp>=100)return false;p.hp=Math.min(100,p.hp+38);}else if(item.kind===1){if(p.shield>=75)return false;p.shield=Math.min(75,p.shield+40);}else p.boost=12;emit(s,'pickup',item.x,item.y,{item:item.kind});return true;}
  function fire(s,x,y,a,enemy=false,heavy=false){if(s.bullets.length>=160)return;const speed=enemy?(heavy?165:195):700;s.bullets.push({x:x+Math.cos(a)*21,y:y+Math.sin(a)*21,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:enemy?2.5:.85,enemy,damage:enemy?(heavy?16:11):(s.player.boost>0?32:25)});emit(s,enemy?'enemyShot':'shot',x,y,{angle:a});}
  function step(s,input={},dt=1/60){if(s.phase!=='playing')return s;if(!Number.isFinite(dt)||dt<=0)return s;dt=Math.min(dt,.05);s.events=[];const p=s.player;s.time=Math.min(DURATION,s.time+dt);const wave=1+Math.min(4,Math.floor(s.time/60));if(wave!==s.wave){s.wave=wave;emit(s,'wave',p.x,p.y,{wave});}
    for(const k of ['invuln','fire','dash','dashTime','boost'])p[k]=Math.max(0,p[k]-dt);
    let mx=Number.isFinite(input.mx)?input.mx:0,my=Number.isFinite(input.my)?input.my:0,length=Math.hypot(mx,my);if(length>1){mx/=length;my/=length;}
    if(input.dash&&p.dash<=0&&length>.1){p.dash=3;p.dashTime=.18;p.invuln=Math.max(p.invuln,.23);emit(s,'dash',p.x,p.y);}
    move(s.map,p,mx*(p.dashTime>0?540:190)*dt,my*(p.dashTime>0?540:190)*dt);
    let aim=Number.isFinite(input.aim)?input.aim:p.angle,shoot=!!input.fire;
    if(input.assist&&!input.manual){let best=null,range=560;for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(e.spawn<=0&&d<range&&line(s.map,p.x,p.y,e.x,e.y)){best=e;range=d;}}if(best){aim=Math.atan2(best.y-p.y,best.x-p.x);shoot=true;}}
    p.angle=aim;if(shoot&&p.fire<=0){fire(s,p.x,p.y,aim);p.fire=p.boost>0?.115:.23;}
    s.flowTimer-=dt;if(s.flowTimer<=0||!s.flow){s.flow=flow(s.map,p);s.flowTimer=.28;}
    s.spawnTimer-=dt;if(s.spawnTimer<=0){spawn(s);s.spawnTimer=Math.max(.7,2.9-s.time*.0065);}
    s.supplyTimer-=dt;if(s.supplyTimer<=0){supply(s,p.hp<60?0:Math.floor(s.rng()*3));s.supplyTimer=16;emit(s,'supply',p.x,p.y);}
    for(const e of s.enemies){e.flash=Math.max(0,e.flash-dt);e.spawn-=dt;if(e.spawn>0)continue;const distance=Math.hypot(p.x-e.x,p.y-e.y),visible=distance<600&&line(s.map,e.x,e.y,p.x,p.y);e.angle=Math.atan2(p.y-e.y,p.x-e.x);e.fire-=dt;
      if(e.kind>0&&visible&&distance<340){if(e.fire<=0&&e.charge<=0)e.charge=.65;if(e.charge>0){e.charge-=dt;if(e.charge<=0){fire(s,e.x,e.y,e.angle,true,e.kind===2);e.fire=e.kind===2?2.5:1.9;}}}
      else{e.charge=0;const goal=visible?p:target(s,e);let dx=goal.x-e.x,dy=goal.y-e.y,n=Math.hypot(dx,dy);if(n>1){dx/=n;dy/=n;}for(const other of s.enemies)if(other!==e){const ox=e.x-other.x,oy=e.y-other.y,d=Math.hypot(ox,oy);if(d>0&&d<e.r+other.r+5){dx+=ox/d*.45;dy+=oy/d*.45;}}n=Math.hypot(dx,dy)||1;move(s.map,e,dx/n*e.speed*dt,dy/n*e.speed*dt);}
      if(distance<e.r+p.r+3)damage(s,e.kind===2?22:12);
    }
    for(const b of s.bullets){b.life-=dt;if(b.life<=0)continue;const parts=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/7));for(let n=0;n<parts&&b.life>0;n++){b.x+=b.vx*dt/parts;b.y+=b.vy*dt/parts;if(solid(s.map,b.x,b.y)){b.life=0;emit(s,'impact',b.x,b.y);break;}if(b.enemy){if(Math.hypot(b.x-p.x,b.y-p.y)<p.r+3){damage(s,b.damage);b.life=0;}}else for(const e of s.enemies)if(e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+3){e.hp-=b.damage;e.flash=.12;b.life=0;emit(s,'hit',b.x,b.y);if(e.hp<=0){s.kills++;s.killScore+=[100,150,300][e.kind];emit(s,'kill',e.x,e.y,{kind:e.kind});if(s.rng()<.28&&s.pickups.length<16)s.pickups.push({x:e.x,y:e.y,kind:p.hp<55?0:Math.floor(s.rng()*3),age:0,id:s.nextId++});}break;}}}
    s.bullets=s.bullets.filter(b=>b.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);s.pickups=s.pickups.filter(item=>{item.age+=dt;return !(Math.hypot(item.x-p.x,item.y-p.y)<p.r+18&&pickup(s,item))&&item.age<70;});s.score=s.killScore+Math.floor(s.time*3);
    if(s.phase==='playing'&&s.time>=DURATION-1e-8){s.time=DURATION;s.phase='won';s.score+=1500+p.hp*10;emit(s,'won',p.x,p.y);}return s;
  }
  const api={TILE,W,H,DURATION,random,map,solid,free,move,line,create,pause,resume,step,spawn,supply,flow,damage,pickup,fire};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Survival=api;
})(typeof window==='undefined'?{}:window);
