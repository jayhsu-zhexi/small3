const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),m={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/pinball-table.js','utf8')+fs.readFileSync('assets/pinball-engine.js','utf8'),{module:m});
const E=m.exports;
for(const [id,index,old] of [['guide-2',0,[143,687]],['guide-4',1,[326,687]]]){
 const wall=E.table.components.find(c=>c.id===id),pivot=E.create().flippers[index];
 assert.equal(wall.points.at(-1)[0],pivot.x);assert.equal(wall.points.at(-1)[1],pivot.y);
 for(const held of [false,true])for(const fraction of [.2,.5,.8]){
  const s=E.create('practice');s.phase='playing';const x=old[0]+(pivot.x-old[0])*fraction,y=old[1]+(pivot.y-old[1])*fraction;
  s.balls=[{x,y:y-20,vx:0,vy:220,r:E.R,lane:false,stuck:0}];let contact=false;
  for(let i=0;i<80;i++){E.tick(s,1/240,{left:held,right:held});contact||=s.events.some(e=>e.kind==='rail'||e.kind==='flipper');s.events=[];}
  assert(contact,id+' must intercept balls falling through the old gap with flipper raised or resting');
 }
}
console.log('PASS: both guide rails meet flipper pivots and intercept former seam leaks in either flipper state.');
// Old/custom layouts may retain a detached end; the rendered rail must bridge it.
for(const [id,old] of [['guide-2',[143,687]],['guide-4',[326,687]]]){
 const c=E.table.components.find(c=>c.id===id),p=E.table.components.find(c=>c.id===(id==='guide-2'?'left-flipper':'right-flipper')).pivot,original=[...c.points.at(-1)];
 c.points.at(-1).splice(0,2,...old);
 const visible=E.table.componentPoints(c);
 assert.equal(visible.at(-1)[0],p.x);assert.equal(visible.at(-1)[1],p.y);
 const a=visible.at(-2),z=visible.at(-1),dx=z[0]-a[0],dy=z[1]-a[1],len=Math.hypot(dx,dy);
 assert(len>0,'Detached saved end gets a real joining segment');
 E.table.railColliders.push({component:c,a,b:z,radius:c.radius});
 for(const raised of [false,true]){
  const s=E.create('practice');s.phase='playing';let nx=-dy/len,ny=dx/len;if(ny>0){nx=-nx;ny=-ny;}
  s.balls=[{x:(a[0]+z[0])/2+nx*11.5,y:(a[1]+z[1])/2+ny*11.5,vx:-nx*200,vy:-ny*200,r:8,lane:false,stuck:0}];
  E.tick(s,1/240,{left:raised,right:raised});assert(s.events.some(e=>e.kind==='rail'||e.kind==='flipper'),'Joining segment blocks the ball with the flipper raised or resting');
 }
 E.table.railColliders.pop();c.points.at(-1).splice(0,2,...original);
}
console.log('PASS: detached saved guide ends receive matching visible and physical connections to both flipper roots.');
