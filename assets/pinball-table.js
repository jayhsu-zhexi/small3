(function(root){
'use strict';
  const W=480,H=860,R=8,RAIL_RADIUS=4,FLIPPER_RADIUS=7,FLIPPER_LENGTH=65;
  const bumpers=[{x:214,y:182,r:21},{x:281,y:165,r:21},{x:245,y:241,r:21}];
  const targets=[{x:214,y:118,r:8},{x:245,y:118,r:8},{x:275,y:118,r:8}];
  const scoop={x:389,y:407,r:17},wormhole={x:130,y:100,r:12};
  const bonusBumpers=[{x:106,y:66,r:23},{x:52,y:397,r:10},{x:65,y:433,r:10},{x:60,y:470,r:10}];
  const slings=[[[132,543],[121,620],[160,642]],[[353,543],[349,615],[316,642]]];
  const walls=[[[28,705],[28,565]],[[28,565],[16,490]],[[16,490],[16,350]],[[435,365],[435,800]],[[464,800],[464,140]],[[423,705],[423,535]]];
  // Open U-shaped return channels, sampled once for identical rendering and collisions.
  function smooth(points){const out=[];for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];for(let j=0;j<6;j++){const t=j/6;out.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}}out.push(points.at(-1));return out;}
  // Shooter follows the yellow outer rail to the marked upper-right opening.
  const launchPath=smooth([[448,686],[445,610],[441,520],[437,440],[435,360],[433,280],[426,210],[408,145],[380,100],[337,67],[314,65],[305,70]]);
  const launchDistances=[0];for(let i=1;i<launchPath.length;i++)launchDistances.push(launchDistances[i-1]+Math.hypot(launchPath[i][0]-launchPath[i-1][0],launchPath[i][1]-launchPath[i-1][1]));
  function launchPoint(distance){let i=1;const d=Math.max(0,Math.min(launchDistances.at(-1),distance));while(i<launchPath.length-1&&launchDistances[i]<d)i++;const t=(d-launchDistances[i-1])/(launchDistances[i]-launchDistances[i-1]);return {x:launchPath[i-1][0]+(launchPath[i][0]-launchPath[i-1][0])*t,y:launchPath[i-1][1]+(launchPath[i][1]-launchPath[i-1][1])*t};}
  // Shared outer horseshoe and inner right return rail.
  const sideLanes=[smooth([[77,133],[58,108],[58,64],[82,29],[118,29],[155,53],[222,40],[290,36],[345,57],[389,106],[419,181],[423,280]]),smooth([[317,99],[344,115],[365,160],[365,218],[347,273]])];
  // Only the short left hairpin is raised; it does not wrap around the whole table.
  const ramp=smooth([[181,376],[163,334],[130,294],[96,269],[65,274],[43,302],[47,335],[58,362],[60,374]]);
  const tunnel=[[98,625],[80,580],[62,525],[53,465],[51,400],[51,335],[56,265],[65,195],[84,150],[116,138]];
  function tunnelPoint(progress){const lengths=[0];for(let i=1;i<tunnel.length;i++)lengths.push(lengths[i-1]+Math.hypot(tunnel[i][0]-tunnel[i-1][0],tunnel[i][1]-tunnel[i-1][1]));const d=Math.max(0,Math.min(1,progress))*lengths.at(-1);let i=1;while(i<tunnel.length-1&&lengths[i]<d)i++;const f=(d-lengths[i-1])/(lengths[i]-lengths[i-1]);return {x:tunnel[i-1][0]+(tunnel[i][0]-tunnel[i-1][0])*f,y:tunnel[i-1][1]+(tunnel[i][1]-tunnel[i-1][1])*f};}
  const rampDistances=[0];for(let i=1;i<ramp.length;i++)rampDistances.push(rampDistances[i-1]+Math.hypot(ramp[i][0]-ramp[i-1][0],ramp[i][1]-ramp[i-1][1]));
  function rampPoint(progress){const d=Math.max(0,Math.min(1,progress))*rampDistances.at(-1);let i=1;while(i<ramp.length-1&&rampDistances[i]<d)i++;const t=(d-rampDistances[i-1])/(rampDistances[i]-rampDistances[i-1]);return {x:ramp[i-1][0]+(ramp[i][0]-ramp[i-1][0])*t,y:ramp[i-1][1]+(ramp[i][1]-ramp[i-1][1])*t};}
  const leftDeflector=[[68,150],[74,230],[84,300],[100,350]];
  const guides=[leftDeflector,[[64,557],[61,604]],[[61,604],[143,687]],[[395,557],[397,604]],[[397,604],[326,687]],[[74,611],[73,704]]];
  const deflectors=[[[152,85],[194,109],[166,145],[147,132]],[[299,82],[321,94],[294,129],[283,118]],[[151,220],[178,215],[166,254]]];
  // Shared scoring chamber outline, with one lower gate and an elevated feed.
  const chamberLeft=[[20,350],[18,425],[27,485],[46,535],[65,565],[80,590]];
  const chamberRight=[[20,350],[100,350],[112,400],[112,455],[101,495],[99,530],[104,565],[110,595]];
  const chamberFloor=[...chamberLeft,...chamberRight.slice(1).reverse()];
  const purpleWalls=[chamberLeft,chamberRight].flatMap(p=>p.slice(1).map((b,i)=>[p[i],b]));
  const sideWalls=sideLanes.flatMap(points=>points.slice(1).map((point,i)=>[points[i],point])).concat(guides,purpleWalls,deflectors.flatMap(p=>p.map((a,i)=>[a,p[(i+1)%p.length]])));
  const leftBoundary=[[95,25],[58,45],[48,90],...leftDeflector,[16,350],[16,490],[28,565],[28,715]];
  const rightBoundary=[[430,25],[436,180],[423,280],[388,320],[370,365],[378,388],[407,407],[385,440],[399,485],[423,535],[423,715]];

  const drains=[{id:'center-drain',minY:782,minX:0,maxX:W},{id:'left-drain',minY:715,minX:0,maxX:80},{id:'right-drain',minY:715,minX:400,maxX:W}];
  const components=[
    ...drains.map(shape=>({id:shape.id,type:'drain',shape,layer:0})),
    {id:'top-perimeter',type:'boundary',points:[[95,25],[430,25]],radius:RAIL_RADIUS,layer:0},
    ...walls.map((points,i)=>({id:'wall-'+i,type:'rail',points,radius:RAIL_RADIUS,layer:0})),
    ...sideLanes.map((points,i)=>({id:'orbit-'+i,type:'rail',points,radius:RAIL_RADIUS,layer:0})),
    ...guides.map((points,i)=>({id:'guide-'+i,type:'rail',points,radius:RAIL_RADIUS,layer:0})),
    ...purpleWalls.map((points,i)=>({id:'chamber-'+i,type:'rail',points,radius:RAIL_RADIUS,layer:2})),
    ...deflectors.map((points,i)=>({id:'deflector-'+i,type:'polygon',points,radius:RAIL_RADIUS,layer:0})),
    ...slings.map((points,i)=>({id:'sling-'+i,type:'sling',points,radius:RAIL_RADIUS,layer:0})),
    ...bumpers.map((shape,i)=>({id:'bumper-'+i,type:'bumper',shape,kick:130,layer:0})),
    ...bonusBumpers.map((shape,i)=>({id:'bonus-'+i,type:'bumper',shape,kick:0,layer:i?2:0})),
    ...targets.map((shape,i)=>({id:'rollover-'+i,type:'sensor',shape,layer:0})),
    {id:'scoop',type:'scoop',shape:scoop,layer:0},
    {id:'wormhole-exit',type:'portal',shape:wormhole,layer:0},
    {id:'left-perimeter',type:'boundary',points:leftBoundary,radius:RAIL_RADIUS,layer:0},
    {id:'right-perimeter',type:'boundary',points:rightBoundary,radius:RAIL_RADIUS,layer:0},
    {id:'shooter',type:'track',points:launchPath,halfWidth:14,layer:1},
    {id:'left-ramp',type:'track',points:ramp,halfWidth:18,entryRadius:23,layer:2},
    {id:'left-flipper',type:'flipper',pivot:{x:148,y:709},length:FLIPPER_LENGTH,radius:FLIPPER_RADIUS,layer:0},
    {id:'right-flipper',type:'flipper',pivot:{x:335,y:709},length:FLIPPER_LENGTH,radius:FLIPPER_RADIUS,layer:0},
    {id:'lower-tunnel',type:'track',points:tunnel,halfWidth:13,entryRadius:22,layer:0}
  ];
  const railColliders=components.filter(c=>c.type==='rail'||c.type==='polygon').flatMap(c=>{
    const points=c.type==='polygon'?[...c.points,c.points[0]]:c.points;
    return points.slice(1).map((b,i)=>({component:c,a:points[i],b,radius:c.radius}));
  });

const api={W,H,R,RAIL_RADIUS,FLIPPER_RADIUS,FLIPPER_LENGTH,bumpers,targets,scoop,wormhole,bonusBumpers,slings,walls,launchPath,launchDistances,launchPoint,sideLanes,ramp,rampDistances,rampPoint,tunnel,tunnelPoint,guides,deflectors,chamberLeft,chamberRight,chamberFloor,purpleWalls,sideWalls,leftBoundary,rightBoundary,components,railColliders,drains};
root.OrbitPinballTable=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
