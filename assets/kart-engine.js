(function(root){'use strict';
const MAPS=[
{id:'coast',name:'日落海岸',label:'SUNSET COAST',hint:'經典連續彎 · 入門',radius:110,sx:1.25,sy:1,a:18,b:9,f:3,g:5,rise:5},
{id:'lagoon',name:'翡翠環礁',label:'EMERALD LAGOON',hint:'高速長彎 · 入門',radius:125,sx:1.35,sy:.85,a:10,b:5,f:2,g:4,rise:3},
{id:'cliff',name:'峭壁天際線',label:'CLIFF RUN',hint:'大幅起伏與急彎 · 進階',radius:135,sx:1.1,sy:1,a:24,b:7,f:3,g:4,rise:9},
{id:'serpent',name:'雙蛇灣道',label:'SERPENT BAY',hint:'連續 S 彎 · 挑戰',radius:140,sx:1.2,sy:.9,a:19,b:11,f:4,g:6,rise:6}
];
function forTrack(id='coast'){
const baseMap=MAPS.find(m=>m.id===id)||MAPS[0];
const themes={
coast:{sky:'kart-sky.png',water:'#0e2630',fog:'#a7b3bc',sun:'#fff0dc',intensity:2.4,rock:'#a4a5a0',grass:'#444e40',trees:44},
lagoon:{sky:'kart-sky-lagoon.png',water:'#147a83',fog:'#b9dbe1',sun:'#fff9e5',intensity:2.8,rock:'#d3ccb2',grass:'#557350',trees:55},
cliff:{sky:'kart-sky-cliff.png',water:'#142536',fog:'#85949f',sun:'#d5e3f2',intensity:1.7,rock:'#727d87',grass:'#404b45',trees:0},
serpent:{sky:'kart-sky-serpent.png',water:'#11232e',fog:'#666e91',sun:'#c2c9f0',intensity:1.6,rock:'#737787',grass:'#354648',trees:0}
};
const map={...baseMap,theme:themes[baseMap.id]};
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=(v,n)=>(v%n+n)%n,angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
function buildTrack(){const raw=[],points=[],count=1200;let length=0;
 for(let i=0;i<=count;i++){const a=i/count*TAU,r=map.radius+map.a*Math.sin(map.f*a)+map.b*Math.cos(map.g*a);raw.push({x:Math.cos(a)*r*map.sx,z:Math.sin(a)*r*map.sy,y:map.rise+4+map.rise*Math.sin(2*a)+2*Math.cos(3*a)});if(i)length+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z,raw[i].y-raw[i-1].y);points.push({...raw[i],d:length});}
 return {points,length,width:16,half:8,rail:10};}
const TRACK=buildTrack();
function sample(distance,n=0){const d=wrap(distance,TRACK.length),p=TRACK.points;let lo=0,hi=p.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(p[m].d<=d)lo=m;else hi=m;}const a=p[lo],b=p[hi],t=(d-a.d)/(b.d-a.d),dx=b.x-a.x,dz=b.z-a.z,flat=Math.hypot(dx,dz),heading=Math.atan2(dx,dz);return {x:a.x+(b.x-a.x)*t+Math.cos(heading)*n,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t-Math.sin(heading)*n,heading,slope:(b.y-a.y)/flat};}
function curvature(d){return angle(sample(d+3).heading-sample(d-3).heading)/6;}
const OBSTACLES=[{f:.17,n:-3.8},{f:.29,n:4},{f:.43,n:0},{f:.61,n:-3},{f:.77,n:3.5},{f:.91,n:-1}].map((o,i)=>({...o,d:o.f*TRACK.length,id:i}));
const PICKUPS=[{f:.1,n:2.5},{f:.24,n:-3},{f:.38,n:3},{f:.55,n:0},{f:.7,n:-3},{f:.86,n:3}].map((o,i)=>({...o,d:o.f*TRACK.length,id:i}));
function car(id,d=0,n=0){return {id,d,n,h:0,v:0,lateral:0,boost:0,charges:id?0:1,drift:0,drifting:false,wasDrifting:false,hit:0,wallContact:false,wheel:0,lap:0,lapStart:0,laps:[],checkpoint:1,finished:false,finishTime:null,items:{},cones:{}};}
function create(mode='trial'){mode=mode==='race'?'race':'trial';return {mode,phase:'countdown',previousPhase:null,countdown:3,time:0,totalLaps:mode==='race'?3:1,cars:mode==='race'?[car(0),car(1,-5,-3),car(2,-9,3),car(3,-13,-1)]:[car(0)],events:[],score:0,rank:1};}
function emit(s,kind,data={}){if(s.events.length<48)s.events.push({kind,...data});}
function pause(s){if(s.phase==='racing'||s.phase==='countdown'){s.previousPhase=s.phase;s.phase='paused';s.events=[];}}
function resume(s){if(s.phase==='paused'){s.phase=s.previousPhase;s.previousPhase=null;}}
function ai(c){const curve=curvature(c.d+12),lane=Math.sin(c.d/90+c.id)*3;let target=lane;for(const o of OBSTACLES){const ahead=wrap(o.d-c.d,TRACK.length);if(ahead<35&&Math.abs(target-o.n)<2)target=o.n>0?-3:3;}
 const desired=clamp((target-c.n)*.1,-.35,.35),steer=clamp(-desired/.30,-1,1),speed=clamp(31-c.id*.65-Math.abs(curve)*230,20,31);return {steer,throttle:c.v<speed?1:.1,brake:c.v>speed+3,drift:false,boost:false};}
function hit(s,c,loss=0.65){if(c.hit>0)return;c.v*=loss;c.hit=.65;c.drift=0;if(c.id===0){s.score=Math.max(0,s.score-30);emit(s,'hit');}}
function crossed(old,next,position){const at=position+Math.floor((old-position)/TRACK.length+1)*TRACK.length;return at<=next?at:null;}
function advance(s,c,input,dt,oldTime){if(c.finished)return;const oldD=c.d,oldN=c.n;c.hit=Math.max(0,c.hit-dt);c.boost=Math.max(0,c.boost-dt);const steer=clamp(Number.isFinite(input.steer)?input.steer:0,-1,1),throttle=clamp(Number(input.throttle)||0,0,1),brake=!!input.brake;
 if(input.boost&&c.charges>0&&c.boost<=0){c.charges--;c.boost=2.3;if(!c.id)emit(s,'boost');}
 c.drifting=!!input.drift&&Math.abs(steer)>.15&&c.v>12&&!brake;
 if(c.drifting){c.drift=Math.min(2,c.drift+dt);if(!c.id)s.score+=dt*20;}
 else if(c.wasDrifting){if(c.drift>=.65){c.boost=Math.max(c.boost,1.15+Math.min(1,c.drift)*.3);if(!c.id)emit(s,'miniBoost');}c.drift=0;}c.wasDrifting=c.drifting;
 const slope=sample(c.d).slope,off=Math.abs(c.n)>TRACK.half;
 c.v=clamp(c.v+(throttle*12+(c.boost>0?13:0)-2.2-c.v*.08-(brake?24:0)-slope*7-(off?4:0))*dt,0,c.boost>0?44:33);
 // Track-relative arcade steering: release recenters instead of accumulating yaw.
 const targetHeading=-steer*(c.drifting?.48:.30);c.h+=(targetHeading-c.h)*(1-Math.exp(-dt*(c.drifting?5:9)));
 const lateralGoal=clamp(Math.sin(c.h)*c.v,c.drifting?-7:-5,c.drifting?7:5);c.lateral+=(lateralGoal-c.lateral)*(1-Math.exp(-dt*(c.drifting?5:14)));c.n+=c.lateral*dt;
 if(Math.abs(c.n)<TRACK.rail-1.6)c.wallContact=false;
 if(Math.abs(c.n)>TRACK.rail-.85){c.n=clamp(c.n,-TRACK.rail+.85,TRACK.rail-.85);if(!c.wallContact)hit(s,c,.62);c.wallContact=true;const side=Math.sign(c.n);if(c.lateral*side>0)c.lateral=0;if(c.h*side>0)c.h=0;}
 const ds=Math.max(0,c.v*Math.cos(c.h)*dt/clamp(1-curvature(c.d)*c.n,.7,1.3));c.d+=ds;c.wheel+=c.v*dt;
 for(const o of OBSTACLES){const at=crossed(oldD,c.d,o.d);if(at!==null){const t=(at-oldD)/(ds||1),n=oldN+(c.n-oldN)*t,key=Math.floor(at/TRACK.length);if(Math.abs(n-o.n)<1.45&&c.cones[o.id]!==key){c.cones[o.id]=key;hit(s,c,.48);}}}
 if(c.id===0)for(const o of PICKUPS){const at=crossed(oldD,c.d,o.d);if(at!==null){const t=(at-oldD)/(ds||1),n=oldN+(c.n-oldN)*t,key=Math.floor(at/TRACK.length);if(Math.abs(n-o.n)<1.7&&c.items[o.id]!==key){c.items[o.id]=key;c.charges=Math.min(2,c.charges+1);s.score+=100;emit(s,'pickup',{id:o.id});}}}
 while(c.d>=c.checkpoint*TRACK.length/8){const checkpoint=c.checkpoint++;if(checkpoint%8===0){const at=checkpoint*TRACK.length/8,crossTime=oldTime+dt*clamp((at-oldD)/(ds||1),0,1);c.laps.push(crossTime-c.lapStart);c.lapStart=crossTime;c.lap++;if(c.id===0){s.score+=500;emit(s,'lap',{time:c.laps.at(-1)});}if(c.lap>=s.totalLaps){c.finished=true;c.finishTime=crossTime;c.d=at;break;}}}
}
function ranking(s){return [...s.cars].sort((a,b)=>a.finished&&b.finished?a.finishTime-b.finishTime:a.finished?-1:b.finished?1:b.d-a.d).findIndex(c=>c.id===0)+1;}
function step(s,input={},dt=1/60){if(!['racing','countdown'].includes(s.phase)||!Number.isFinite(dt)||dt<=0)return s;dt=Math.min(.05,dt);s.events=[];
 if(s.phase==='countdown'){s.countdown=Math.max(0,s.countdown-dt);if(s.countdown<1e-8){s.countdown=0;s.phase='racing';emit(s,'go');}return s;}
 const oldTime=s.time;s.time+=dt;for(const c of s.cars)advance(s,c,c.id?ai(c):input,dt,oldTime);
 for(let i=0;i<s.cars.length;i++)for(let j=i+1;j<s.cars.length;j++){const a=s.cars[i],b=s.cars[j],dist=Math.abs(wrap(a.d-b.d+TRACK.length/2,TRACK.length)-TRACK.length/2);if(!a.finished&&!b.finished&&dist<2.2&&Math.abs(a.n-b.n)<1.5){const sign=a.n===b.n?(a.id<b.id?-1:1):Math.sign(a.n-b.n);a.n=clamp(a.n+sign*.18,-9.15,9.15);b.n=clamp(b.n-sign*.18,-9.15,9.15);hit(s,a,.82);hit(s,b,.82);}}
 s.rank=ranking(s);if(s.cars[0].finished){s.phase='finished';s.time=s.cars[0].finishTime;s.score=Math.round(s.score+Math.max(0,2000-s.time*5)+(s.mode==='race'?(5-s.rank)*500:500));emit(s,'finish');}return s;
}
const api={MAPS,map,forTrack,TRACK,OBSTACLES,PICKUPS,sample,curvature,create,step,pause,resume,ai,ranking,clamp,wrap};return api;}
const selected=typeof URLSearchParams!=='undefined'?new URLSearchParams(root.location?.search||'').get('track'):'coast';const api=forTrack(selected);if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Kart=api;
})(typeof window==='undefined'?{}:window);
