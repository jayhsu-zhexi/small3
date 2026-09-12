(function(root){'use strict';
function spriteView(h,previous='rear'){if(!Number.isFinite(h))return 'rear';if(h<-.18)return 'left';if(h>.18)return 'right';if(Math.abs(h)<.10)return 'rear';return previous;}
// Visual easing is independent of simulation: no added steering/input latency.
function createPose(){return {heading:0,lean:0,view:'rear',weights:{rear:1,left:0,right:0}};}
function advancePose(p,h,dt,reduced=false,ready={rear:true,left:true,right:true}){
 const step=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0)),target=Number.isFinite(h)?Math.max(-1.15,Math.min(1.15,h)):0;
 p.heading+=(target-p.heading)*(reduced?1:1-Math.exp(-step*14));
 p.lean+=((reduced?0:-p.heading*.09)-p.lean)*(reduced?1:1-Math.exp(-step*10));
 p.view=spriteView(p.heading,p.view);const selected=ready[p.view]?p.view:'rear',blend=reduced?1:1-Math.exp(-step*22);
 for(const key of ['rear','left','right'])p.weights[key]+=((key===selected?1:0)-p.weights[key])*blend;
 return p;
}
function createTrail(){return {last:null,count:0,cursor:0};}
function advanceTrail(trail,car,racing){
 if(!racing||!car.drifting||car.v<8){trail.last=null;return [];}
 const here={d:car.d,n:car.n,h:car.h||0},last=trail.last;
 if(!last){trail.last=here;return [];}
 const distance=Math.hypot(here.d-last.d,here.n-last.n);
 if(distance<.35)return [];trail.last=here;if(distance>6)return [];
 return [-1,1].map(side=>{const tyre=p=>({d:p.d-1-Math.sin(p.h)*side*.9,n:p.n-Math.sin(p.h)+Math.cos(p.h)*side*.9});const segment={index:trail.cursor,from:tyre(last),to:tyre(here)};trail.cursor=(trail.cursor+1)%512;trail.count=Math.min(512,trail.count+1);return segment;});
}
function create(canvas,minimap){const T=root.THREE,E=root.Kart,theme=E.map.theme,scene=new T.Scene(),renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'}),camera=new T.PerspectiveCamera(62,1,.1,1100),reduced=root.matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;scene.background=new T.Color('#8a9ca8');scene.fog=new T.Fog(theme.fog,230,650);
scene.add(new T.HemisphereLight('#d9e5ef','#34423e',1.65));const sun=new T.DirectionalLight(theme.sun,theme.intensity);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:160});sun.shadow.bias=-.0005;scene.add(sun,sun.target);
const mats=[],geos=[],imageTextures=[];let disposed=false;const imageLoader=new T.TextureLoader();function texture(name,repeat=1){const tex=imageLoader.load('/assets/kart-'+name+'.png');tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(repeat,repeat);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());imageTextures.push(tex);return tex;}function material(color,extra={}){const m=new T.MeshStandardMaterial({color,roughness:.7,...extra});mats.push(m);return m;}function geo(g){geos.push(g);return g;}const box=geo(new T.BoxGeometry(1,1,1)),cylinder=geo(new T.CylinderGeometry(1,1,1,24)),sphere=geo(new T.SphereGeometry(1,16,12)),cone=geo(new T.ConeGeometry(1,1,8));
const asphalt=material('#34434b'),cream=material('#d6d8d3'),coral=material('#993f35'),black=material('#111719'),metal=material('#8b9a9e',{metalness:.8,roughness:.3}),sand=material('#77786e'),grass=material('#444e40'),trunk=material('#947460'),leaf=material('#334e3d');
function mesh(g,m,x,y,z,sx=1,sy=1,sz=1,parent=scene){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
const rockTexture=texture('rock',2),carbonTexture=texture('carbon',2);
sand.map=rockTexture;sand.bumpMap=rockTexture;sand.bumpScale=.3;sand.color.set(theme.rock);grass.color.set(theme.grass);
const environment=imageLoader.load('/assets/'+theme.sky,tex=>{if(disposed){tex.dispose();return;}tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.SRGBColorSpace;scene.background=tex;scene.environment=tex;});imageTextures.push(environment);
const sea=mesh(geo(new T.PlaneGeometry(1600,1600)),material('#4aafbf',{roughness:.25,metalness:.2}),0,-3,0);sea.rotation.x=-Math.PI/2;const waterMat=new T.ShaderMaterial({uniforms:{time:{value:0},sky:{value:environment},waterTint:{value:new T.Color(theme.water)}},vertexShader:'varying vec3 v;varying vec3 world;void main(){v=position;world=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform float time;uniform sampler2D sky;uniform vec3 waterTint;varying vec3 v;varying vec3 world;void main(){float w=sin(v.x*.7+time*.7)*sin(v.y*.8+time*.4);vec3 n=normalize(vec3(sin(v.x*.32+time*.5)*.055,1.0,cos(v.y*.43+time*.6)*.045));vec3 eye=normalize(world-cameraPosition);vec3 r=reflect(eye,n);vec2 uv=vec2(atan(r.z,r.x)*.15915494+.5,asin(clamp(r.y,-1.0,1.0))*.31830989+.5);vec3 reflection=texture2D(sky,uv).rgb;float fresnel=pow(1.0-max(0.0,dot(-eye,n)),3.0);vec3 c=mix(waterTint,reflection,.25+.55*fresnel);gl_FragColor=vec4(c+w*.008,1.0);}'});mats.push(waterMat);sea.material=waterMat;
mesh(geo(new T.CylinderGeometry(77,94,10,40)),sand,0,-1,0,1,1,.8).receiveShadow=true;mesh(geo(new T.CylinderGeometry(75,77,2,40)),grass,0,5,0,1,1,.8).receiveShadow=true;
function ribbon(left,right,y,mat,colors=false){const positions=[],col=[],uv=[];for(let i=0;i<600;i++){const d=i/600*E.TRACK.length,d2=(i+1)/600*E.TRACK.length,a=E.sample(d,left),b=E.sample(d,right),c=E.sample(d2,left),e=E.sample(d2,right),color=new T.Color(i%6<3?'#d0d0c7':'#934139');for(const [j,v] of [a,c,b,b,c,e].entries()){uv.push([0,0,2,2,0,2][j],([0,1,0,0,1,1][j]+i)*E.TRACK.length/600/8);positions.push(v.x,v.y+y,v.z);col.push(color.r,color.g,color.b);}}
 const g=geo(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(colors)g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();const o=new T.Mesh(g,mat);o.receiveShadow=true;scene.add(o);return o;}
const roadTexture=new T.TextureLoader().load('/assets/kart-asphalt.png',tex=>{tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());asphalt.color.set('#838b90');asphalt.map=tex;asphalt.needsUpdate=true;});ribbon(-8,8,0,asphalt);ribbon(-9.6,-8,.035,material('#ffffff',{vertexColors:true}),true);ribbon(8,9.6,.035,material('#ffffff',{vertexColors:true}),true);ribbon(-10.15,-9.65,.8,metal);ribbon(9.65,10.15,.8,metal);
// Start stripe, lane markers and bridge piers use instancing to keep draw calls bounded.
const dummy=new T.Object3D();function instances(g,m,transforms){const o=new T.InstancedMesh(g,m,transforms.length);transforms.forEach((fn,i)=>{dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);fn(dummy);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);});scene.add(o);o.receiveShadow=true;return o;}
instances(box,cream,Array.from({length:100},(_,i)=>o=>{const p=E.sample(i/100*E.TRACK.length);o.position.set(p.x,p.y+.075,p.z);o.rotation.set(-Math.atan(p.slope),p.heading,0,'YXZ');o.scale.set(.13,.03,2.8);}));
instances(box,metal,Array.from({length:180},(_,i)=>o=>{const p=E.sample(Math.floor(i/2)/90*E.TRACK.length,i%2?9.9:-9.9);o.position.set(p.x,p.y+.42,p.z);o.scale.set(.12,.84,.12);}));
instances(box,sand,Array.from({length:60},(_,i)=>o=>{const p=E.sample(i/60*E.TRACK.length);o.position.set(p.x,(p.y-3)/2,p.z);o.scale.set(2.1,p.y+2.4,2.1);}));
for(let i=0;i<16;i++){const p=E.sample((i%2)*.7,(Math.floor(i/2)-3.5)*2);const tile=mesh(box,(i+Math.floor(i/2))%2?cream:black,p.x,p.y+.055,p.z,2,.05,.7);tile.rotation.y=p.heading;}
const gate=new T.Group(),start=E.sample(0);gate.position.set(start.x,start.y,start.z);gate.rotation.y=start.heading;scene.add(gate);for(const n of [-10,10])mesh(box,coral,n,5,0,.65,10,.65,gate);mesh(box,black,0,9.7,0,21,1.5,.6,gate);
const label=document.createElement('canvas');label.width=1024;label.height=128;const lc=label.getContext('2d');lc.fillStyle='#142b35';lc.fillRect(0,0,1024,128);lc.fillStyle='#ffebc3';lc.font='bold italic 72px sans-serif';lc.textAlign='center';lc.fillText((E.map?.label||'COASTLINE')+' / START',512,90);const bannerTex=new T.CanvasTexture(label),bannerMat=new T.MeshBasicMaterial({map:bannerTex,side:T.DoubleSide});mats.push(bannerMat);mesh(geo(new T.PlaneGeometry(19,1.2)),bannerMat,0,9.7,-.32,1,1,1,gate).rotation.y=Math.PI;
// Fixed side chequered flags stay readable when the overhead banner leaves the view.
for(const side of [-1,1]){
 mesh(box,metal,side*10.6,2.6,0,.09,5.2,.09,gate);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
 const flag=mesh(box,(row+col)%2?black:cream,side*(10.6+col*.38),4.8-row*.38,0,.38,.38,.06,gate);
 }
}
const trees=Array.from({length:theme.trees},(_,i)=>{const a=i*2.399,r=45+(i%7)*4;return {x:Math.cos(a)*r,z:Math.sin(a)*r*.8,h:6+i%4};});
instances(cylinder,trunk,trees.map(p=>o=>{o.position.set(p.x,6+p.h/2,p.z);o.scale.set(.32,p.h,.32);o.rotation.z=.07;}));instances(cone,leaf,trees.flatMap(p=>Array.from({length:5},(_,i)=>o=>{const a=i/5*Math.PI*2;o.position.set(p.x+Math.sin(a)*2,6+p.h,p.z+Math.cos(a)*2);o.rotation.set(Math.cos(a)*1.1,a,Math.sin(a)*1.1);o.scale.set(1,5,.4);}))); 
instances(geo(new T.DodecahedronGeometry(1,1)),sand,Array.from({length:28},(_,i)=>o=>{const a=i*2.399,r=i<14?58:210+(i%4)*22;o.position.set(Math.cos(a)*r,-3+(7+i%5*3)*.35,Math.sin(a)*r);o.rotation.y=a;o.scale.set(8+i%3*4,7+i%5*3,9);}));
// Lighthouse and distant sails give the island a readable coastal silhouette.
mesh(cylinder,cream,0,20,0,4,30,4);mesh(cylinder,coral,0,33,0,4.4,3,4.4);mesh(cone,coral,0,38,0,6,6,6);mesh(cylinder,material('#ffe6a0',{emissive:'#ffc267',emissiveIntensity:.7}),0,35.5,0,3.4,2,3.4);
// Tubular frame, exposed powertrain and seated driver: no toy-block body.
const karts=[],wheels=[];
function tube(parent,a,b,r,mat){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),o=mesh(cylinder,mat,...av.clone().add(bv).multiplyScalar(.5).toArray(),r,v.length(),r,parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
const rubber=material('#141619',{roughness:.96}),suit=material('#272e32',{roughness:.92}),visor=material('#14212b',{metalness:.85,roughness:.12});
function kart(color){const g=new T.Group(),paint=material(color,{map:carbonTexture,bumpMap:carbonTexture,bumpScale:.012,metalness:.45,roughness:.32});scene.add(g);
for(const side of [-1,1]){
 tube(g,[side*.65,.32,-1.3],[side*.65,.32,1.1],.055,metal);
 tube(g,[side*.65,.32,-1.3],[side*.95,.55,-1.5],.055,metal);
 tube(g,[side*.95,.55,-1.5],[side*.95,.55,-1.8],.055,metal);
 mesh(sphere,paint,side*.78,.48,-.05,.3,.22,.85,g);
}
tube(g,[-.95,.55,-1.8],[.95,.55,-1.8],.07,metal);
tube(g,[-.9,.31,1.5],[.9,.31,1.5],.065,metal);
tube(g,[-1.1,.43,-.95],[1.1,.43,-.95],.085,metal);
mesh(box,black,0,.28,.15,1.25,.09,2.25,g);
mesh(sphere,paint,0,.45,1.06,.76,.23,.59,g);
mesh(box,cream,0,.61,1.11,.16,.025,.65,g);
const seat=mesh(sphere,black,0,.65,-.48,.48,.43,.42,g);seat.rotation.x=-.25;
mesh(sphere,suit,0,1.05,-.3,.37,.48,.28,g);
mesh(sphere,cream,0,1.64,-.17,.34,.38,.36,g);
mesh(sphere,visor,0,1.69,.10,.29,.135,.135,g);
tube(g,[-.21,.8,-.18],[-.3,.55,.52],.15,suit);tube(g,[.21,.8,-.18],[.3,.55,.52],.15,suit);
for(const side of [-1,1]){
 tube(g,[side*.32,1.25,-.25],[side*.46,1.01,.1],.10,suit);
 tube(g,[side*.46,1.01,.1],[side*.27,1.05,.48],.085,suit);
 mesh(sphere,rubber,side*.27,1.05,.48,.11,.1,.12,g);
 mesh(sphere,rubber,side*.3,.48,.73,.16,.11,.3,g);
}
tube(g,[0,.35,.6],[0,1,.48],.04,metal);
const steering=mesh(geo(new T.TorusGeometry(.3,.033,8,28)),rubber,0,1.04,.48,1,1,1,g);steering.rotation.x=.5;
mesh(box,metal,.57,.64,-.96,.36,.35,.48,g);
for(let i=0;i<7;i++)mesh(box,metal,.57,.51+i*.047,-.96,.47,.018,.55,g);
mesh(cylinder,black,.58,.87,-.96,.16,.12,.16,g);
const exhaust=mesh(cylinder,metal,-.57,.64,-1.2,.105,.75,.105,g);exhaust.rotation.x=Math.PI/2;
mesh(sphere,black,-.57,.64,-1.59,.075,.075,.025,g);
const wheelParts=[];for(const x of [-1.05,1.05])for(const z of [-.95,.93]){
const axle=new T.Group();axle.position.set(x,.43,z);g.add(axle);
const tyre=mesh(cylinder,rubber,0,0,0,.43,z<0?.47:.34,.43,axle);tyre.rotation.z=Math.PI/2;
const hub=mesh(cylinder,metal,x<0?-.245:.245,0,0,.24,.035,.24,axle);hub.rotation.z=Math.PI/2;
const rim=mesh(geo(new T.TorusGeometry(.29,.025,6,24)),metal,x<0?-.25:.25,0,0,1,1,1,axle);rim.rotation.y=Math.PI/2;
for(let j=0;j<5;j++){const a=j*Math.PI*2/5;mesh(sphere,black,x<0?-.27:.27,Math.cos(a)*.16,Math.sin(a)*.16,.025,.035,.035,axle);}
wheelParts.push({axle,tyre,hub,front:z>0});}
wheels.push(wheelParts);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
['#28616a','#873e34','#9a8444','#535b74'].forEach(c=>karts.push(kart(c)));
// ImageGen vehicle sprites retain world-space depth and the existing physics.
const playerImages={},playerReady={};for(const view of ['rear','left','right']){const tex=imageLoader.load('/assets/kart-player-'+view+'.png',t=>{if(disposed){t.dispose();return;}playerReady[view]=true;});tex.colorSpace=T.SRGBColorSpace;imageTextures.push(tex);playerImages[view]=tex;}
const poseUniforms={poseLeft:{value:playerImages.left},poseRight:{value:playerImages.right},poseWeights:{value:new T.Vector3(1,0,0)}};
const playerSpriteMaterial=new T.SpriteMaterial({map:playerImages.rear,transparent:true,alphaTest:.08,depthWrite:true,toneMapped:false});mats.push(playerSpriteMaterial);
// Blend alpha-weighted texels in one draw call, avoiding layered transparent ghosts.
playerSpriteMaterial.onBeforeCompile=shader=>{
 Object.assign(shader.uniforms,poseUniforms);
 shader.fragmentShader='uniform sampler2D poseLeft;uniform sampler2D poseRight;uniform vec3 poseWeights;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
 #ifdef USE_MAP
 vec4 a=texture2D(map,vMapUv),b=texture2D(poseLeft,vMapUv),c=texture2D(poseRight,vMapUv);
 float alpha=a.a*poseWeights.x+b.a*poseWeights.y+c.a*poseWeights.z;
 vec3 rgb=(a.rgb*a.a*poseWeights.x+b.rgb*b.a*poseWeights.y+c.rgb*c.a*poseWeights.z)/max(alpha,.00001);
 diffuseColor*=vec4(rgb,alpha);
 #endif
 `);
};
playerSpriteMaterial.customProgramCacheKey=()=> 'kart-pose-blend-v1';
const playerSprite=new T.Sprite(playerSpriteMaterial);playerSprite.center.set(.5,.14);playerSprite.scale.set(3.1,3.1,1);playerSprite.visible=false;scene.add(playerSprite);let playerPose=createPose();
const obstacles=E.OBSTACLES.map(o=>{const p=E.sample(o.d,o.n),g=new T.Group();g.position.set(p.x,p.y,p.z);scene.add(g);mesh(box,black,0,.08,0,1.2,.15,1.2,g);mesh(cone,coral,0,.65,0,.48,1.3,.48,g);mesh(cylinder,cream,0,.67,0,.25,.2,.25,g);return g;});
const gold=material('#ffcb5c',{emissive:'#e99821',emissiveIntensity:.45,metalness:.5}),pickups=E.PICKUPS.map(o=>{const p=E.sample(o.d,o.n),g=new T.Group();g.position.set(p.x,p.y+1.5,p.z);scene.add(g);mesh(geo(new T.TorusGeometry(.7,.14,6,16)),gold,0,0,0,1,1,1,g);const bolt=mesh(box,gold,0,0,0,.23,1,.2,g);bolt.rotation.z=-.4;return g;});
const pool=128,particles=[],pg=geo(new T.BufferGeometry()),positions=new Float32Array(pool*3),colors=new Float32Array(pool*3);pg.setAttribute('position',new T.BufferAttribute(positions,3));pg.setAttribute('color',new T.BufferAttribute(colors,3));const particleCanvas=document.createElement('canvas');particleCanvas.width=particleCanvas.height=32;const pc=particleCanvas.getContext('2d'),gradient=pc.createRadialGradient(16,16,0,16,16,16);gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.3,'#ffffffaa');gradient.addColorStop(1,'#ffffff00');pc.fillStyle=gradient;pc.fillRect(0,0,32,32);const particleTexture=new T.CanvasTexture(particleCanvas);const pm=new T.PointsMaterial({map:particleTexture,size:.35,vertexColors:true,transparent:true,opacity:.75,depthWrite:false});mats.push(pm);const points=new T.Points(pg,pm);points.frustumCulled=false;scene.add(points);let emission=0,initialized=false,lastPhase=null;
const contactMaterial=new T.MeshBasicMaterial({map:particleTexture,color:'#000000',transparent:true,opacity:.42,depthWrite:false});mats.push(contactMaterial);const contactShadow=mesh(geo(new T.PlaneGeometry(2.7,3.7)),contactMaterial,0,0,0);contactShadow.rotation.x=-Math.PI/2;
let trail=createTrail();
const skidMaterial=material('#08090a',{transparent:true,opacity:.72,roughness:1,depthWrite:false});
const skidMarks=new T.InstancedMesh(box,skidMaterial,512);skidMarks.count=0;skidMarks.frustumCulled=false;skidMarks.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(skidMarks);
const jet=new T.Group();scene.add(jet);
const flameMat=new T.MeshBasicMaterial({color:'#238dff',transparent:true,opacity:.72,blending:T.AdditiveBlending,depthWrite:false});mats.push(flameMat);
const coreMat=new T.MeshBasicMaterial({color:'#d4f8ff',transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false});mats.push(coreMat);
const flame=mesh(cone,flameMat,0,0,-.85,.3,1.9,.3,jet);flame.rotation.x=-Math.PI/2;
const core=mesh(cone,coreMat,0,0,-.45,.14,1.05,.14,jet);core.rotation.x=-Math.PI/2;
const jetLight=new T.PointLight('#36aaff',0,7,2);jet.add(jetLight);jet.visible=false;
const mapExtent=Math.max(...E.TRACK.points.map(p=>Math.max(Math.abs(p.x),Math.abs(p.z)))),mapScale=Math.min(.44,60/mapExtent);const mini=minimap.getContext('2d'),look=new T.Vector3(),desired=new T.Vector3();
function resize(){const w=canvas.clientWidth||root.innerWidth,h=canvas.clientHeight||root.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function draw(s,dt=0,home=false){waterMat.uniforms.time.value=reduced?0:s.time;const p=s.cars[0];gate.visible=true;if(s.phase==='countdown'&&lastPhase!=='countdown'){particles.length=0;initialized=false;playerPose=createPose();trail=createTrail();skidMarks.count=0;emission=0;}lastPhase=s.phase;
 s.cars.forEach((c,i)=>{const pos=E.sample(c.d,c.n),g=karts[i];g.visible=true;g.position.set(pos.x,pos.y+.06,pos.z);g.rotation.set(-Math.atan(pos.slope),pos.heading+c.h,Math.sin(c.h)*Math.min(c.v/33,1)*-.08,'YXZ');wheels[i].forEach(w=>{w.tyre.rotation.x=c.wheel/.43;w.axle.rotation.y=w.front?c.h*.6:0;});});for(let i=s.cars.length;i<4;i++)karts[i].visible=false;
 const center=E.sample(p.d,p.n);advancePose(playerPose,p.h,dt,reduced,playerReady);poseUniforms.poseWeights.value.set(playerPose.weights.rear,playerPose.weights.left,playerPose.weights.right);playerSprite.visible=!!playerReady.rear;karts[0].visible=!playerSprite.visible;
if(playerSprite.visible){const tex=playerImages.rear;playerSprite.scale.set(3.1,3.1*(tex.image.height/tex.image.width),1);const rear=E.sample(p.d-1,p.n);playerSprite.position.set(rear.x,rear.y+.1+(reduced?0:Math.sin(p.wheel*3)*Math.min(p.v/33,1)*.014),rear.z);playerSpriteMaterial.rotation=playerPose.lean;}
contactShadow.visible=playerSprite.visible;contactShadow.position.set(center.x,center.y+.09,center.z);contactShadow.rotation.set(-Math.PI/2-Math.atan(center.slope),0,-center.heading,'YXZ');
const portrait=camera.aspect<.8,distance=portrait?17:13,height=portrait?9:6.5;desired.set(center.x-Math.sin(center.heading)*distance,center.y+height,center.z-Math.cos(center.heading)*distance);const target=new T.Vector3(center.x+Math.sin(center.heading)*5,center.y+1.2,center.z+Math.cos(center.heading)*5);if(!initialized){camera.position.copy(desired);look.copy(target);initialized=true;}else{camera.position.lerp(desired,1-Math.exp(-dt*7));look.lerp(target,1-Math.exp(-dt*9));}camera.lookAt(look);camera.fov=62+(reduced?0:p.boost>0?7:Math.min(4,p.v*.1));camera.updateProjectionMatrix();sun.position.set(center.x-35,center.y+65,center.z-40);sun.target.position.set(center.x,center.y,center.z);
 const segments=dt>0?advanceTrail(trail,p,s.phase==='racing'):[];for(const mark of segments){const a=E.sample(mark.from.d,mark.from.n),b=E.sample(mark.to.d,mark.to.n),dx=b.x-a.x,dz=b.z-a.z,dy=b.y-a.y,length=Math.hypot(dx,dz);dummy.position.set((a.x+b.x)/2,(a.y+b.y)/2+.025,(a.z+b.z)/2);dummy.rotation.set(-Math.atan2(dy,length),Math.atan2(dx,dz),0,'YXZ');dummy.scale.set(.28,.008,Math.hypot(length,dy)+.06);dummy.updateMatrix();skidMarks.setMatrixAt(mark.index,dummy.matrix);}if(segments.length){skidMarks.count=trail.count;skidMarks.instanceMatrix.needsUpdate=true;}
 jet.visible=s.phase==='racing'&&p.boost>0;if(jet.visible){const nozzle=E.sample(p.d-1.6,p.n+.5);jet.position.set(nozzle.x,nozzle.y+.55,nozzle.z);jet.rotation.set(-Math.atan(nozzle.slope),center.heading+p.h,0,'YXZ');const pulse=reduced?1:1+Math.sin(s.time*37)*.13;jet.scale.set(pulse,pulse,pulse);jetLight.intensity=reduced?1:2.5*pulse;}
 pickups.forEach((g,i)=>{const lap=Math.floor(p.d/E.TRACK.length);g.visible=p.items[i]!==lap;g.rotation.y=s.time*1.4;g.position.y=E.sample(E.PICKUPS[i].d).y+1.5+(reduced?0:Math.sin(s.time*3+i)*.16);});
 if(!reduced&&s.phase==='racing'&&p.v>3){emission+=dt;const interval=p.drifting||p.boost>0?.018:.09;while(emission>interval){emission-=interval;if(particles.length>=pool){emission=0;break;}const side=Math.random()<.5?-1:1,kind=p.boost>0?'jet':p.drifting?(Math.random()<.5?'spark':'smoke'):'exhaust',back=E.sample(p.d-1.5,p.n+(kind==='jet'?.5:side*.9));particles.push({x:back.x,y:back.y+(kind==='jet'?.55:.2),z:back.z,life:kind==='smoke'?.9:.4,max:kind==='smoke'?.9:.4,kind,vx:-Math.sin(center.heading)*(kind==='jet'?9:2)+(Math.random()-.5)*2,vz:-Math.cos(center.heading)*(kind==='jet'?9:2)+(Math.random()-.5)*2});}}else emission=0;
 for(let i=particles.length-1;i>=0;i--){const v=particles[i];v.life-=dt;v.x+=v.vx*dt;v.z+=v.vz*dt;v.y+=dt*(v.kind==='smoke'?1.4:.3);if(v.life<=0)particles.splice(i,1);}particles.forEach((v,i)=>{positions.set([v.x,v.y,v.z],i*3);const fade=v.life/v.max,c=v.kind==='jet'?[.25,.65,1]:v.kind==='spark'?[1,.58,.13]:[.58,.62,.65];colors.set(c.map(n=>n*fade),i*3);});pg.setDrawRange(0,particles.length);pg.attributes.position.needsUpdate=true;pg.attributes.color.needsUpdate=true;
 mini.clearRect(0,0,180,140);mini.lineWidth=5;mini.strokeStyle='#ffe8c2';mini.beginPath();E.TRACK.points.forEach((v,i)=>{const x=90+v.x*mapScale,y=70+v.z*mapScale;i?mini.lineTo(x,y):mini.moveTo(x,y);});mini.closePath();mini.stroke();s.cars.forEach((c,i)=>{const q=E.sample(c.d),x=90+q.x*mapScale,y=70+q.z*mapScale;mini.fillStyle=['#68f5ce','#ff9386','#ffe279','#ccb2ff'][i];mini.beginPath();mini.arc(x,y,i?3:4.5,0,Math.PI*2);mini.fill();});renderer.render(scene,camera);
}
resize();return {draw,resize,dispose(){disposed=true;scene.environment=null;scene.background=null;for(const tex of imageTextures)tex.dispose();skidMarks.dispose();for(const g of geos)g.dispose();for(const m of mats)m.dispose();particleTexture.dispose();roadTexture.dispose();bannerTex.dispose();renderer.dispose();},info:()=>renderer.info.render};}
root.KartRenderer={create,spriteView,createPose,advancePose,createTrail,advanceTrail};})(window);
