(function(root){
'use strict';
  const W=480,H=860,R=8,RAIL_RADIUS=4,FLIPPER_RADIUS=7,FLIPPER_LENGTH=65;
  // Staggered triangular cluster: the lower bumper intercepts direct centre shots,
  // while the two upper bumpers leave ball-width exits on either side.
  const bumpers=[{x:200,y:215,r:29},{x:280,y:215,r:29},{x:240,y:287,r:30}];
  const targets=[{x:210,y:148,r:8},{x:240,y:148,r:8},{x:270,y:148,r:8}];
  const scoop={x:365,y:411,r:17},wormhole={x:134,y:159,r:12};
  const bonusBumpers=[{x:106,y:88,r:20},{x:52,y:427,r:9},{x:100,y:427,r:9},{x:76,y:493,r:9}];
  const slings=[[[131,535],[136,620],[181,658]],[[347,535],[342,600],[271,658]]];
  const walls=[[[28,705],[28,565]],[[28,565],[16,490]],[[16,490],[16,350]],[[435,365],[435,800]],[[464,800],[464,140]],[[423,705],[423,535]]];
  // Open U-shaped return channels, sampled once for identical rendering and collisions.
  function smooth(points){const out=[];for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];for(let j=0;j<6;j++){const t=j/6;out.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}}out.push(points.at(-1));return out;}
  // Shooter follows the yellow outer rail to the marked upper-right opening.
  const launchPath=smooth([[448,686],[445,610],[441,520],[437,440],[435,360],[433,280],[426,210],[408,145],[380,100],[347,78],[319,68],[300,65]]);
  const launchDistances=[0];for(let i=1;i<launchPath.length;i++)launchDistances.push(launchDistances[i-1]+Math.hypot(launchPath[i][0]-launchPath[i-1][0],launchPath[i][1]-launchPath[i-1][1]));
  function launchPoint(distance){let i=1;const d=Math.max(0,Math.min(launchDistances.at(-1),distance));while(i<launchPath.length-1&&launchDistances[i]<d)i++;const t=(d-launchDistances[i-1])/(launchDistances[i]-launchDistances[i-1]);return {x:launchPath[i-1][0]+(launchPath[i][0]-launchPath[i-1][0])*t,y:launchPath[i-1][1]+(launchPath[i][1]-launchPath[i-1][1])*t};}
  // Shared outer horseshoe and inner right return rail.
  const sideLanes=[smooth([[77,133],[62,105],[64,66],[89,38],[126,31],[170,32],[222,32],[284,39],[339,61],[402,150],[405,260],[350,350]]),smooth([[311,104],[340,118],[370,232],[345,295],[302,350]])];
  // Only the short left hairpin is raised; it does not wrap around the whole table.
  const ramp=smooth([[190,402],[174,360],[146,321],[111,298],[78,300],[54,319],[49,340],[54,362],[60,374]]);
  const tunnel=[[98,625],[83,574],[67,518],[57,460],[53,398],[52,332],[53,265],[64,203],[84,165],[116,146]];
  function tunnelPoint(progress){const lengths=[0];for(let i=1;i<tunnel.length;i++)lengths.push(lengths[i-1]+Math.hypot(tunnel[i][0]-tunnel[i-1][0],tunnel[i][1]-tunnel[i-1][1]));const d=Math.max(0,Math.min(1,progress))*lengths.at(-1);let i=1;while(i<tunnel.length-1&&lengths[i]<d)i++;const f=(d-lengths[i-1])/(lengths[i]-lengths[i-1]);return {x:tunnel[i-1][0]+(tunnel[i][0]-tunnel[i-1][0])*f,y:tunnel[i-1][1]+(tunnel[i][1]-tunnel[i-1][1])*f};}
  const rampDistances=[0];for(let i=1;i<ramp.length;i++)rampDistances.push(rampDistances[i-1]+Math.hypot(ramp[i][0]-ramp[i-1][0],ramp[i][1]-ramp[i-1][1]));
  function rampPoint(progress){const d=Math.max(0,Math.min(1,progress))*rampDistances.at(-1);let i=1;while(i<ramp.length-1&&rampDistances[i]<d)i++;const t=(d-rampDistances[i-1])/(rampDistances[i]-rampDistances[i-1]);return {x:ramp[i-1][0]+(ramp[i][0]-ramp[i-1][0])*t,y:ramp[i-1][1]+(ramp[i][1]-ramp[i-1][1])*t};}
  // User-drawn left sweep: tucked under the upper hook, then sweeping inward
  // underneath the raised hairpin. Keep four editable anchors for saved designs.
  const leftDeflector=[[66,145],[42,232],[100,367],[132,425]];
  const guides=[leftDeflector,[[60,535],[65,626]],[[65,626],[144,709]],[[392,535],[387,626]],[[387,626],[308,709]],[[65,626],[60,715]]];
  const deflectors=[[[147,117],[169,104],[192,143],[170,156]],[[333,117],[311,104],[288,143],[310,156]],[[153,237],[166,282],[187,316]]];
  // Shared scoring chamber outline, with one lower gate and an elevated feed.
  // Mirror around x=76. Preserve editor node counts and the shared top corner.
  // The extra right-side node is collinear; the 44-unit outlet clears a ball + rails.
  const chamberLeft=[[24,350],[20,397],[24,449],[32,494],[42,526],[54,554]];
  const chamberRight=[[24,350],[128,350],[130,373.5],[132,397],[128,449],[120,494],[110,526],[98,554]];
  const chamberFloor=[...chamberLeft,...chamberRight.slice(1).reverse()];
  const purpleWalls=[chamberLeft,chamberRight].flatMap(p=>p.slice(1).map((b,i)=>[p[i],b]));
  const sideWalls=sideLanes.flatMap(points=>points.slice(1).map((point,i)=>[points[i],point])).concat(guides,purpleWalls,deflectors.flatMap(p=>p.map((a,i)=>[a,p[(i+1)%p.length]])));
  const leftBoundary=[[95,25],[50,40],[38,90],...leftDeflector,[132,462],[26,510],[26,558],[26,715]];
  function componentPoints(c){if(c.id==='guide-2'||c.id==='guide-4'){const pivot=components.find(p=>p.id===(c.id==='guide-2'?'left-flipper':'right-flipper')).pivot,last=c.points.at(-1);return Math.hypot(last[0]-pivot.x,last[1]-pivot.y)>.01?[...c.points,[pivot.x,pivot.y]]:c.points;}if(c.id==='upper-left-loop'){const [o,p]=c.points,r=Math.hypot(p[0]-o[0],p[1]-o[1]);return Array.from({length:49},(_,i)=>{const a=(130+i*280/48)*Math.PI/180;return [o[0]+r*Math.cos(a),o[1]+r*Math.sin(a)];});}if(c.id==='orbit-0')return c.points.slice(24);if(c.id==='right-perimeter')return [...smooth(c.points.slice(0,3)).slice(0,-1),...c.points.slice(2,8),...smooth(c.points.slice(7)).slice(1)];if(c.id==='launch-stop'){const [a,b]=c.points,control=[a[0],b[1]+25];return Array.from({length:19},(_,i)=>{const t=i/18;return [0,1].map(k=>(1-t)*(1-t)*a[k]+2*(1-t)*t*control[k]+t*t*b[k]);});}if(c.id==='guide-0')return smooth(leftBoundary.slice(3,10)).filter(p=>p[1]<=c.points.at(-1)[1]);if(c.id==='left-sling-guide'||c.id==='bowl-left'||c.id==='left-return-inner')return smooth(c.points);if(c.id==='left-perimeter')return [...smooth(c.points.slice(0,4)).slice(0,-1),...smooth(c.points.slice(3,10)),...c.points.slice(10)];return c.points;}
  const rightBoundary=[[430,25],[436,180],[426,280],[350,350],[350,392],[407,419],[414,448],[417,470],[420,500],[423,535],[435,715]];

  const drains=[{id:'center-drain',minY:782,minX:0,maxX:W},{id:'left-drain',minY:715,minX:0,maxX:80},{id:'right-drain',minY:715,minX:400,maxX:W}];
  const components=[
    ...drains.map(shape=>({id:shape.id,type:'drain',shape,layer:0})),
    {id:'top-perimeter',type:'boundary',points:[[95,25],[430,25]],radius:RAIL_RADIUS,layer:0},
    ...walls.map((points,i)=>({id:'wall-'+i,type:i===5?'retired':'rail',points,radius:RAIL_RADIUS,layer:i===5?-1:0})),
    ...sideLanes.map((points,i)=>({id:'orbit-'+i,type:'rail',points,radius:RAIL_RADIUS,restitution:i===1?.86:undefined,layer:0})),
    ...guides.map((points,i)=>({id:'guide-'+i,type:'rail',points,radius:RAIL_RADIUS,layer:0})),
    ...purpleWalls.map((points,i)=>({id:'chamber-'+i,type:'rail',points,radius:RAIL_RADIUS,layer:2})),
    // Keep retired anchors for old design-file indexing, never render or collide them.
    ...deflectors.map((points,i)=>({id:'deflector-'+i,type:i===2?'retired':'polygon',points,radius:RAIL_RADIUS,layer:i===2?-1:0})),
    ...slings.map((points,i)=>({id:'sling-'+i,type:'sling',points,radius:RAIL_RADIUS,layer:0})),
    ...bumpers.map((shape,i)=>({id:'bumper-'+i,type:'bumper',shape,kick:120,layer:0})),
    ...bonusBumpers.map((shape,i)=>({id:'bonus-'+i,type:'bumper',shape,kick:0,layer:i?2:0})),
    ...targets.map((shape,i)=>({id:'rollover-'+i,type:'sensor',shape,layer:0})),
    {id:'scoop',type:'scoop',shape:scoop,layer:0},
    {id:'wormhole-exit',type:'portal',shape:wormhole,layer:0},
    {id:'left-perimeter',type:'boundary',points:leftBoundary,radius:RAIL_RADIUS,layer:0},
    {id:'right-perimeter',type:'boundary',points:rightBoundary,radius:RAIL_RADIUS,layer:0},
    {id:'shooter',type:'track',points:launchPath,halfWidth:14,layer:1},
    {id:'left-ramp',type:'track',points:ramp,halfWidth:15,entryRadius:23,layer:2},
    {id:'left-flipper',type:'flipper',pivot:{x:144,y:709},length:FLIPPER_LENGTH,radius:FLIPPER_RADIUS,layer:0},
    {id:'right-flipper',type:'flipper',pivot:{x:308,y:709},length:FLIPPER_LENGTH,radius:FLIPPER_RADIUS,layer:0},
    {id:'lower-tunnel',type:'retired',points:tunnel,halfWidth:13,entryRadius:22,layer:-1},
    {id:'launch-stop',type:'rail',points:[[169,104],[126,31]],radius:4,layer:0},
    {id:'bowl-left',type:'retired',points:[[170,156],[138,203],[132,258],[148,302],[173,323],[195,334]],radius:4,layer:-1},
    ...[199,225,255,290].map((x,i)=>({id:'rollover-divider-'+i,type:i===0||i===3?'retired':'rail',points:[[x,129],[x,164]],radius:2.5,layer:i===0||i===3?-1:0})),
    {id:'upper-neck-right',type:'rail',points:[[311,104],[347,70]],radius:4,layer:0},
    {id:'left-return-inner',type:'rail',points:[[108,210],[119,270],[162,350],[178,392]],radius:4,restitution:.86,layer:0},
    {id:'upper-left-loop',type:'rail',points:[[106,88],[160,88]],radius:3,restitution:.94,layer:0},
    {id:'orbit-wormhole',type:'orbit-wormhole',shape:{x:369,y:140,r:15},layer:0},
    {id:'inlane-left-inner',type:'rail',points:[[92,565],[92,584],[92,604]],radius:4,layer:0},
    {id:'inlane-right-inner',type:'rail',points:[[360,535],[355,608],[310,640]],radius:4,layer:0},
    {id:'left-sling-guide',type:'rail',points:[[120,565],[125,610],[140,630],[158,642]],radius:4,layer:0}
  ];
  const railColliders=components.filter(c=>c.type==='rail'||c.type==='polygon').flatMap(c=>{
    const points=c.type==='polygon'?[...c.points,c.points[0]]:componentPoints(c);
    return points.slice(1).map((b,i)=>({component:c,a:points[i],b,radius:c.radius}));
  });

const api={componentPoints,W,H,R,RAIL_RADIUS,FLIPPER_RADIUS,FLIPPER_LENGTH,bumpers,targets,scoop,wormhole,bonusBumpers,slings,walls,launchPath,launchDistances,launchPoint,sideLanes,ramp,rampDistances,rampPoint,tunnel,tunnelPoint,guides,deflectors,chamberLeft,chamberRight,chamberFloor,purpleWalls,sideWalls,leftBoundary,rightBoundary,components,railColliders,drains};
root.OrbitPinballTable=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
