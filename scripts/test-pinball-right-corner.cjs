const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),m={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/pinball-table.js','utf8')+fs.readFileSync('assets/pinball-engine.js','utf8'),{module:m});
const E=m.exports;
for(const y of [515,530,545])for(const vy of [-180,-260,-340]){
 const s=E.create('practice');s.phase='playing';s.balls=[{x:355,y,vx:650,vy,r:8,lane:false,stuck:0}];
 let returned=false,drained=false;
 for(let i=0;i<480;i++){E.tick(s,1/240);const b=s.balls[0];returned||=b&&!b.lane&&b.x<340&&b.vx<0;drained||=s.events.some(e=>e.kind==='drain');s.events=[];if(returned||drained)break;}
 assert(returned&&!drained,'Right corner should return rising shot to playfield: '+y+','+vy);
}
console.log('PASS: nine rising right-corner shots return inward before reaching an outlane.');
