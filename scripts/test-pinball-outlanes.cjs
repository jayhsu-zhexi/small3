const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),m={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/pinball-table.js','utf8')+fs.readFileSync('assets/pinball-engine.js','utf8'),{module:m});
const E=m.exports;
for(const x of [41,44,47,407,414,420]){
 const s=E.create();s.phase='playing';s.balls=[{x,y:520,vx:0,vy:150,r:8,lane:false,stuck:0}];let drained=false;
 for(let i=0;i<1200;i++){E.tick(s,1/240);drained||=s.events.some(e=>e.kind==='drain');s.events=[];if(drained)break;}
 assert(drained,'Outer lane must remain open from entrance x='+x);
}
assert.equal(E.table.components.find(c=>c.id==='wall-5').type,'retired');
console.log('PASS: six entrance trajectories reach left/right outlane drains without obstruction.');
