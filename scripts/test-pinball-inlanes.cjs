const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),m={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/pinball-table.js','utf8')+fs.readFileSync('assets/pinball-engine.js','utf8'),{module:m});
const E=m.exports,t=E.table,li=t.components.find(c=>c.id==='inlane-left-inner'),ri=t.components.find(c=>c.id==='inlane-right-inner');
assert.deepEqual(Array.from(t.slings[0],p=>Array.from(p)),[[131,535],[136,620],[181,658]],'Restore the pictured sling; reshape the guide instead');
assert.deepEqual(Array.from(li.points,p=>Array.from(p)),[[92,565],[92,584],[92,604]],'Platform outlet has its own short vertical wall');
assert(t.components.find(c=>c.id==='left-sling-guide').points.at(-1)[1]<t.slings[0].at(-1)[1],'Guide ends above sling tip, outside striking area');
assert.deepEqual(Array.from(t.slings[1],p=>Array.from(p)),[[347,535],[342,600],[271,658]],'Right sling stays unchanged');
assert.deepEqual(Array.from(ri.points,p=>Array.from(p)),[[360,535],[355,608],[310,640]],'Right return stops above striking area');
assert.equal(ri.points[0][1],t.slings[1][0][1],'Right entrance rises to sling tip');
assert.equal(t.guides[3][0][1],t.slings[1][0][1]);
assert.deepEqual(Array.from(t.guides[5].at(-1)),[60,715],'Left outer lane remains divided to drain');
const hole=(t.chamberLeft.at(-1)[0]+t.chamberRight.at(-1)[0])/2;
assert.equal(hole,(t.guides[1][0][0]+li.points[0][0])/2);
assert(li.points[0][0]-t.guides[1][0][0]-8>E.R*2);
for(const x of [68,76,84]){
 const s=E.create('practice');s.phase='playing';s.balls=[{x,y:548,vx:0,vy:150,r:8,lane:false,deck:true,stuck:0}];let dropped=false,flipper=false;
 for(let i=0;i<1800;i++){E.tick(s,1/240);const b=s.balls[0];if(s.events.some(e=>e.kind==='platform-drop')){dropped=true;assert.equal(b.x,hole);assert.equal(b.vx,0);}flipper||=s.events.some(e=>e.kind==='flipper');if(s.events.some(e=>e.kind==='drain'))assert(flipper,'Platform return must meet a flipper before draining');s.events=[];if(flipper)break;}
 assert(dropped&&flipper,'Every sampled platform exit feeds the return lane');
}
console.log('PASS: narrow left sling, unchanged right geometry, aligned platform outlet, and three drop samples reach a flipper.');
