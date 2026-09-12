(function(root){
  'use strict';
  const TILE=64,W=36,H=28,DURATION=300;
  const MODES=Object.freeze({
    practice:Object.freeze({label:'練習',missions:false,boss:false,initial:8,supply:16,drop:.28,speed:1,damage:1,interval:[2.9,2.5,2.1,1.7,1.3],batch:[1,1,1,1,1]}),
    standard:Object.freeze({label:'標準',missions:true,boss:false,initial:5,supply:22,drop:.2,speed:1.13,damage:1,interval:[2.7,2,1.55,1.25,1],batch:[1,1,2,2,3]}),
    challenge:Object.freeze({label:'挑戰',missions:true,boss:true,initial:3,supply:30,drop:.12,speed:1.24,damage:1.2,interval:[2.2,1.6,1.3,1,.85],batch:[1,2,2,3,3]})
  });
  const WAVE_NAMES=['偵察接觸','衝鋒增援','重裝混編','多路包圍','最後攻勢'];
  function pressure(s){const i=s.wave-1,c=MODES[s.mode];return {interval:c.interval[i],batch:c.batch[i]};}
  function objectives(s){if(!MODES[s.mode].missions)return [];const candidates=s.map.rooms.map((r,i)=>({x:(r.x+.5)*TILE,y:(r.y+.5)*TILE,room:i})).filter(r=>Math.hypot(r.x-s.player.x,r.y-s.player.y)>420);const chosen=[];while(chosen.length<3&&candidates.length){const i=Math.floor(s.rng()*candidates.length),p=candidates.splice(i,1)[0];chosen.push({...p,id:chosen.length+1,progress:0,done:false});}return chosen;}
  function updateObjectives(s,dt){for(const b of s.beacons){if(b.done)continue;if(Math.hypot(b.x-s.player.x,b.y-s.player.y)<62&&!s.player.moving&&line(s.map,s.player.x,s.player.y,b.x,b.y)){b.progress=Math.min(4,b.progress+dt);if(b.progress>=4-1e-8){b.progress=4;b.done=true;s.objectiveScore+=400;emit(s,'beacon',b.x,b.y,{id:b.id});}}} }

  function random(seed){let n=seed>>>0;return ()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  const MAP_TYPES=Object.freeze([
    {id:'research',name:'研究艙群',description:'分岔房間與多條捷徑'},
    {id:'ring',name:'環形反應爐',description:'環狀主路與內部連接艙'},
    {id:'spine',name:'運輸長廊',description:'中央幹道串接兩側支線'},
    {id:'cross',name:'交叉指揮站',description:'中央樞紐向四區延伸'},
    {id:'maze',name:'隔離實驗區',description:'曲折通道與較少捷徑'},
    {id:'cargo',name:'貨運船塢',description:'寬廣艙室與交錯運輸通道'}
  ]);
  function map(seed,requestedType){
    const rng=random(seed),type=MAP_TYPES.find(t=>t.id===requestedType)||MAP_TYPES[Math.floor(rng()*MAP_TYPES.length)],tiles=new Uint8Array(W*H).fill(1),rooms=[],links=[];
    const carve=(x,y)=>{if(x>0&&x<W-1&&y>0&&y<H-1)tiles[y*W+x]=0;};
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){
      const x=5+col*8+Math.floor(rng()*3)-1,y=5+row*8+Math.floor(rng()*3)-1;
      const rx=type.id==='cargo'?3:2+Math.floor(rng()*2),ry=type.id==='cargo'?3:2+Math.floor(rng()*2);
      rooms.push({x,y,rx,ry});for(let a=x-rx;a<=x+rx;a++)for(let b=y-ry;b<=y+ry;b++)carve(a,b);
    }
    function corridor(ai,bi,width=2){const a=rooms[ai],b=rooms[bi];let x=a.x,y=a.y;
      const paint=()=>{for(let dx=0;dx<width;dx++)for(let dy=0;dy<width;dy++)carve(x+dx,y+dy);};
      const horizontal=()=>{while(x!==b.x){x+=Math.sign(b.x-x);paint();}},vertical=()=>{while(y!==b.y){y+=Math.sign(b.y-y);paint();}};
      paint();if(rng()<.5){horizontal();vertical();}else{vertical();horizontal();}links.push([ai,bi]);
    }
    function tree(){const visited=new Set([5]),stack=[5];while(stack.length){const a=stack.at(-1),c=a%4,r=Math.floor(a/4),neighbors=[c>0?a-1:-1,c<3?a+1:-1,r>0?a-4:-1,r<2?a+4:-1].filter(n=>n>=0&&!visited.has(n));if(!neighbors.length){stack.pop();continue;}const b=neighbors[Math.floor(rng()*neighbors.length)];corridor(a,b);visited.add(b);stack.push(b);}}
    if(type.id==='ring'){
      const ring=[0,1,2,3,7,11,10,9,8,4];ring.forEach((a,i)=>corridor(a,ring[(i+1)%ring.length]));corridor(5,6);corridor(5,rng()<.5?1:9);corridor(6,rng()<.5?2:10);
    }else if(type.id==='spine'){
      for(let col=0;col<3;col++)corridor(4+col,5+col,3);
      for(let col=0;col<4;col++){corridor(col,col+4);corridor(col+4,col+8);}
    }else if(type.id==='cross'){
      corridor(5,6,3);corridor(1,5,3);corridor(5,9,3);corridor(2,6,3);corridor(6,10,3);
      for(const [a,b] of [[0,1],[3,2],[4,5],[7,6],[8,9],[11,10]])corridor(a,b);
    }else if(type.id==='cargo'){
      for(let row=0;row<3;row++)for(let col=0;col<3;col++)corridor(row*4+col,row*4+col+1,3);
      for(let row=0;row<2;row++)for(let col=0;col<4;col++)if(col===1||col===2||rng()<.5)corridor(row*4+col,(row+1)*4+col,3);
    }else{tree();const extra=type.id==='maze'?0:5;for(let n=0;n<extra;n++){const a=Math.floor(rng()*12),b=a%4<3?a+1:a-1;corridor(a,b);}}
    const floor=[];for(let i=0;i<tiles.length;i++)if(!tiles[i])floor.push(i);
    const spawnRoom=[5,6][Math.floor(rng()*2)];
    return {seed,type:type.id,name:type.name,description:type.description,tiles,floor,rooms,links,width:W*TILE,height:H*TILE,spawn:{x:(rooms[spawnRoom].x+.5)*TILE,y:(rooms[spawnRoom].y+.5)*TILE}};
  }
  function solid(m,x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx<0||ty<0||tx>=W||ty>=H||m.tiles[ty*W+tx]!==0;}
  function free(m,x,y,r=13){for(let ty=Math.floor((y-r)/TILE);ty<=Math.floor((y+r)/TILE);ty++)for(let tx=Math.floor((x-r)/TILE);tx<=Math.floor((x+r)/TILE);tx++)if(tx<0||ty<0||tx>=W||ty>=H||m.tiles[ty*W+tx]){const cx=Math.max(tx*TILE,Math.min(x,(tx+1)*TILE)),cy=Math.max(ty*TILE,Math.min(y,(ty+1)*TILE));if(Math.hypot(x-cx,y-cy)<r)return false;}return true;}
  function move(m,body,dx,dy){const beforeX=body.x,beforeY=body.y;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));for(let i=0;i<steps;i++){if(free(m,body.x+dx/steps,body.y,body.r))body.x+=dx/steps;if(free(m,body.x,body.y+dy/steps,body.r))body.y+=dy/steps;}const distance=Math.hypot(body.x-beforeX,body.y-beforeY);body.moving=distance>.01;body.stride=(body.stride||0)+distance/(body.kind===2?20:body.kind===0?11:15);if(distance>.01)body.moveAngle=Math.atan2(body.y-beforeY,body.x-beforeX);}
  function line(m,x,y,ex,ey){const distance=Math.hypot(ex-x,ey-y),n=Math.ceil(distance/12);for(let i=0;i<=n;i++)if(solid(m,x+(ex-x)*i/(n||1),y+(ey-y)*i/(n||1)))return false;return true;}
  function create(seed=Date.now(),mode='practice',mapType){mode=Object.hasOwn(MODES,mode)?mode:'practice';const m=map(seed,mapType),rng=random(seed^0xa511e9b3),s={seed,mode,beacons:[],objectiveScore:0,bossSpawned:false,bossDefeated:false,lossReason:'',map:m,rng,phase:'playing',time:0,score:0,killScore:0,kills:0,player:{...m.spawn,r:14,hp:100,shield:25,angle:0,invuln:0,fire:0,dash:0,dashTime:0,boost:0},enemies:[],bullets:[],pickups:[],events:[],spawnTimer:3,supplyTimer:10,flow:null,flowTimer:0,wave:1,nextId:1};for(let i=0;i<MODES[mode].initial;i++)supply(s,i%3,150,1000);s.beacons=objectives(s);return s;}
  function pause(s){if(s.phase==='playing'){s.phase='paused';s.events=[];}}
  function resume(s){if(s.phase==='paused')s.phase='playing';}
  function emit(s,kind,x,y,extra={}){if(s.events.length<64)s.events.push({...extra,kind,x,y});}
  function place(s,min,max){const p=s.player;for(let i=0;i<160;i++){const cell=s.map.floor[Math.floor(s.rng()*s.map.floor.length)],x=(cell%W+.5)*TILE,y=(Math.floor(cell/W)+.5)*TILE,d=Math.hypot(x-p.x,y-p.y);if(d>=min&&d<=max&&free(s.map,x,y,20)&&!s.enemies.some(e=>Math.hypot(e.x-x,e.y-y)<60)&&!s.pickups.some(e=>Math.hypot(e.x-x,e.y-y)<40))return {x,y};}return null;}
  function supply(s,kind=Math.floor(s.rng()*3),min=140,max=550){if(s.pickups.length>=16)return false;const point=place(s,min,max);if(!point)return false;s.pickups.push({...point,kind,age:0,id:s.nextId++});return true;}
  function spawn(s,kind){if(kind===4&&s.bossSpawned)return false;const reserve=MODES[s.mode].boss&&!s.bossSpawned&&kind!==4?1:0;if(s.enemies.length>=38-reserve)return false;const point=place(s,440,1000);if(!point)return false;if(kind===undefined){const roll=s.rng();kind=s.mode==='practice'?(s.time>90&&roll<.2?2:s.time>30&&roll<.48?1:0):s.wave===1?0:roll<.28?3:s.wave>=3&&roll<.5?2:roll<.75?1:0;}const hp=[42,62,150,68,950][kind];s.enemies.push({...point,id:s.nextId++,kind,hp,maxHp:hp,r:kind===2||kind===4?20:14,angle:0,speed:([78,62,46,105,80][kind]+Math.min(28,s.time*.07))*MODES[s.mode].speed,spawn:kind===4?2.4:1.2,fire:.6+s.rng(),charge:0,flash:0,rush:0,windup:0,rushCooldown:1,rushAngle:0});if(kind===4){s.bossSpawned=true;emit(s,'boss',point.x,point.y);}emit(s,'spawn',point.x,point.y);return true;}
  function flow(m,p){const dist=new Int16Array(W*H).fill(-1),start=Math.floor(p.y/TILE)*W+Math.floor(p.x/TILE),queue=[start];dist[start]=0;for(let head=0;head<queue.length;head++){const cell=queue[head],x=cell%W,y=Math.floor(cell/W);for(const n of [x>0?cell-1:-1,x<W-1?cell+1:-1,y>0?cell-W:-1,y<H-1?cell+W:-1])if(n>=0&&!m.tiles[n]&&dist[n]<0){dist[n]=dist[cell]+1;queue.push(n);}}return dist;}
  function target(s,e){const cell=Math.floor(e.y/TILE)*W+Math.floor(e.x/TILE);let best=cell,value=s.flow[cell];for(const n of [cell-1,cell+1,cell-W,cell+W])if(n>=0&&n<W*H&&s.flow[n]>=0&&(value<0||s.flow[n]<value)){best=n;value=s.flow[n];}return {x:(best%W+.5)*TILE,y:(Math.floor(best/W)+.5)*TILE};}
  function damage(s,amount){const p=s.player;if(s.phase!=='playing'||p.invuln>0)return false;amount=Math.round(amount*MODES[s.mode].damage);const blocked=Math.min(p.shield,amount);p.shield-=blocked;p.hp=Math.max(0,p.hp-(amount-blocked));p.invuln=.7;emit(s,'hurt',p.x,p.y);if(!p.hp){s.phase='lost';s.lossReason='health';emit(s,'lost',p.x,p.y);}return true;}
  function pickup(s,item){if(s.phase!=='playing')return false;const p=s.player;if(item.kind===0){if(p.hp>=100)return false;p.hp=Math.min(100,p.hp+38);}else if(item.kind===1){if(p.shield>=75)return false;p.shield=Math.min(75,p.shield+40);}else p.boost=12;emit(s,'pickup',item.x,item.y,{item:item.kind});return true;}
  function fire(s,x,y,a,enemy=false,heavy=false){if(s.bullets.length>=160)return;const speed=enemy?(heavy?165:195):700;s.bullets.push({x:x+Math.cos(a)*21,y:y+Math.sin(a)*21,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:enemy?2.5:.85,enemy,damage:enemy?(heavy?16:11):(s.player.boost>0?32:25)});emit(s,enemy?'enemyShot':'shot',x,y,{angle:a});}
  // Lock a charge direction during warning; never retarget during the rush.
  function charger(s,e,visible,distance,dt){
    e.rushCooldown=Math.max(0,(e.rushCooldown||0)-dt);
    if(e.windup>0){e.windup=Math.max(0,e.windup-dt);e.angle=e.rushAngle;if(!e.windup){e.rush=.8;emit(s,'rush',e.x,e.y);}return true;}
    if(e.rush>0){e.angle=e.rushAngle;e.rush=Math.max(0,e.rush-dt);const parts=Math.ceil(410*dt/6);for(let n=0;n<parts;n++){const x=e.x+Math.cos(e.rushAngle)*410*dt/parts,y=e.y+Math.sin(e.rushAngle)*410*dt/parts;if(!free(s.map,x,y,e.r)){e.rush=0;break;}move(s.map,e,x-e.x,y-e.y);if(Math.hypot(e.x-s.player.x,e.y-s.player.y)<e.r+s.player.r+3)damage(s,26);}if(!e.rush)e.rushCooldown=2.8;return true;}
    if(e.rushCooldown<=0&&visible&&distance>65&&distance<350){e.windup=1;e.rushAngle=e.angle;emit(s,'charge',e.x,e.y);return true;}return false;
  }
  function step(s,input={},dt=1/60){if(s.phase!=='playing')return s;if(!Number.isFinite(dt)||dt<=0)return s;dt=Math.min(dt,.05);s.events=[];const p=s.player;p.moving=false;for(const enemy of s.enemies)enemy.moving=false;s.time=Math.min(DURATION,s.time+dt);const wave=1+Math.min(4,Math.floor(s.time/60));if(wave!==s.wave){s.wave=wave;emit(s,'wave',p.x,p.y,{wave});}
    for(const k of ['invuln','fire','dash','dashTime','boost'])p[k]=Math.max(0,p[k]-dt);
    let mx=Number.isFinite(input.mx)?input.mx:0,my=Number.isFinite(input.my)?input.my:0,length=Math.hypot(mx,my);if(length>1){mx/=length;my/=length;}
    if(input.dash&&p.dash<=0&&length>.1){p.dash=3;p.dashTime=.18;p.invuln=Math.max(p.invuln,.23);emit(s,'dash',p.x,p.y);}
    move(s.map,p,mx*(p.dashTime>0?540:190)*dt,my*(p.dashTime>0?540:190)*dt);
    let aim=Number.isFinite(input.aim)?input.aim:p.angle,shoot=!!input.fire;
    if(input.assist&&!input.manual){let best=null,range=560;for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(e.spawn<=0&&d<range&&line(s.map,p.x,p.y,e.x,e.y)){best=e;range=d;}}if(best){aim=Math.atan2(best.y-p.y,best.x-p.x);shoot=true;}}
    if(input.assist&&!input.manual&&!shoot&&p.moving)aim=p.moveAngle;p.angle=aim;if(shoot&&p.fire<=0){fire(s,p.x,p.y,aim);p.fire=p.boost>0?.115:.23;}
    s.flowTimer-=dt;if(s.flowTimer<=0||!s.flow){s.flow=flow(s.map,p);s.flowTimer=.28;}
    s.spawnTimer-=dt;if(s.spawnTimer<=0){const q=pressure(s);for(let n=0;n<q.batch;n++)spawn(s);s.spawnTimer=q.interval;}if(MODES[s.mode].boss&&s.time>=240&&!s.bossSpawned)spawn(s,4);
    s.supplyTimer-=dt;if(s.supplyTimer<=0){supply(s,p.hp<60?0:Math.floor(s.rng()*3));s.supplyTimer=MODES[s.mode].supply;emit(s,'supply',p.x,p.y);}
    for(const e of s.enemies){e.flash=Math.max(0,e.flash-dt);e.spawn-=dt;if(e.spawn>0)continue;const distance=Math.hypot(p.x-e.x,p.y-e.y),visible=distance<600&&line(s.map,e.x,e.y,p.x,p.y);e.angle=Math.atan2(p.y-e.y,p.x-e.x);e.fire-=dt;
      if(e.kind===3&&charger(s,e,visible,distance,dt))continue;
      if((e.kind===1||e.kind===2||e.kind===4)&&visible&&distance<(e.kind===4?290:340)){if(e.fire<=0&&e.charge<=0)e.charge=.65;if(e.charge>0){e.charge-=dt;if(e.charge<=0){if(e.kind===4){for(const offset of [-.28,-.14,0,.14,.28])fire(s,e.x,e.y,e.angle+offset,true,true);e.fire=1.5;}else{fire(s,e.x,e.y,e.angle,true,e.kind===2);e.fire=e.kind===2?2.5:1.9;}}}}
      else{e.charge=0;const goal=visible?p:target(s,e);let dx=goal.x-e.x,dy=goal.y-e.y,n=Math.hypot(dx,dy);if(n>1){dx/=n;dy/=n;}for(const other of s.enemies)if(other!==e){const ox=e.x-other.x,oy=e.y-other.y,d=Math.hypot(ox,oy);if(d>0&&d<e.r+other.r+5){dx+=ox/d*.45;dy+=oy/d*.45;}}n=Math.hypot(dx,dy)||1;move(s.map,e,dx/n*e.speed*dt,dy/n*e.speed*dt);}
      if(distance<e.r+p.r+3)damage(s,e.kind===4?30:e.kind===2?22:12);
    }
    for(const b of s.bullets){b.life-=dt;if(b.life<=0)continue;const parts=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/7));for(let n=0;n<parts&&b.life>0;n++){b.x+=b.vx*dt/parts;b.y+=b.vy*dt/parts;if(solid(s.map,b.x,b.y)){b.life=0;emit(s,'impact',b.x,b.y);break;}if(b.enemy){if(Math.hypot(b.x-p.x,b.y-p.y)<p.r+3){damage(s,b.damage);b.life=0;}}else for(const e of s.enemies)if(e.hp>0&&e.spawn<=0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+3){e.hp-=b.damage;e.flash=.12;b.life=0;emit(s,'hit',b.x,b.y);if(e.hp<=0){s.kills++;s.killScore+=[100,150,300,200,2000][e.kind];emit(s,'kill',e.x,e.y,{kind:e.kind});if(e.kind===4){s.bossDefeated=true;emit(s,'bossDown',e.x,e.y);}if(s.rng()<MODES[s.mode].drop&&s.pickups.length<16)s.pickups.push({x:e.x,y:e.y,kind:p.hp<55?0:Math.floor(s.rng()*3),age:0,id:s.nextId++});}break;}}}
    s.bullets=s.bullets.filter(b=>b.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);s.pickups=s.pickups.filter(item=>{item.age+=dt;return !(Math.hypot(item.x-p.x,item.y-p.y)<p.r+18&&pickup(s,item))&&item.age<70;});if(s.phase==='playing')updateObjectives(s,dt);s.score=s.killScore+s.objectiveScore+Math.floor(s.time*3);
    if(s.phase==='playing'&&s.time>=DURATION-1e-8){s.time=DURATION;const ready=s.beacons.every(b=>b.done)&&(!MODES[s.mode].boss||s.bossDefeated);s.phase=ready?'won':'lost';if(ready){s.score+=1500+p.hp*10;emit(s,'won',p.x,p.y);}else{s.lossReason=s.beacons.some(b=>!b.done)?'beacons':'boss';emit(s,'lost',p.x,p.y);}}return s;
  }
  const api={TILE,W,H,DURATION,MAP_TYPES,MODES,WAVE_NAMES,pressure,updateObjectives,charger,random,map,solid,free,move,line,create,pause,resume,step,spawn,supply,flow,damage,pickup,fire};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Survival=api;
})(typeof window==='undefined'?{}:window);
