const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),m={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/pinball-table.js','utf8')+fs.readFileSync('assets/pinball-engine.js','utf8'),{module:m});
const E=m.exports;
for(const id of ['deflector-0','deflector-1','left-return-inner','orbit-1','sling-0','sling-1']){
 const c=E.table.components.find(c=>c.id===id),p=E.table.componentPoints(c);
 const i=id.startsWith('deflector')?1:id.startsWith('sling')?2:Math.floor((p.length-1)*.65),a=p[i],z=p[(i+1)%p.length],dx=z[0]-a[0],dy=z[1]-a[1],len=Math.hypot(dx,dy),x=(a[0]+z[0])/2,y=(a[1]+z[1])/2;
 let nx=-dy/len,ny=dx/len;
 if(c.type==='polygon'||c.type==='sling'){const center=p.reduce((v,q)=>[v[0]+q[0]/p.length,v[1]+q[1]/p.length],[0,0]);if((center[0]-x)*nx+(center[1]-y)*ny>0){nx=-nx;ny=-ny;}}
 else if((id==='left-return-inner'&&nx<0)||(id==='orbit-1'&&nx>0)){nx=-nx;ny=-ny;}
 function hit(speed,cooldown=false){const s=E.create('practice');s.phase='playing';s.time=2;s.balls=[{x:x+nx*11.7,y:y+ny*11.7,vx:-nx*speed,vy:-ny*speed,r:8,lane:false,stuck:0,springCooldowns:cooldown?{[id.replace('sling-','sling')]:3}:{}}];E.tick(s,1/1000);return s;}
 const fired=hit(350),quiet=hit(20),blocked=hit(350,true);
 assert(fired.events.some(e=>e.kind==='spring'),id+' should fire');
 assert(!quiet.events.some(e=>e.kind==='spring'),id+' must not kick resting balls');
 assert(!blocked.events.some(e=>e.kind==='spring'),id+' must respect cooldown');
 const b=fired.balls[0];assert(b.vx*nx+b.vy*ny>400,id+' should actively propel the ball away');
 assert(Math.hypot(b.vx,b.vy)<800,id+' should limit the kick');
}
console.log('PASS: all six spring faces fire, resting balls stay quiet, and repeated impacts obey cooldowns.');
