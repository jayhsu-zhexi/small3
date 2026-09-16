const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),m={exports:{}};
vm.runInNewContext(fs.readFileSync('assets/pinball-table.js','utf8')+fs.readFileSync('assets/pinball-engine.js','utf8'),{module:m});
const E=m.exports;
for(const side of [0,1])for(const offset of [26,36,46]){
 const s=E.create('practice'),f=s.flippers[side];s.phase='playing';
 s.balls=[{x:f.x+(side?-offset:offset),y:f.y+3,vx:0,vy:120,r:8,lane:false,stuck:0}];
 let struck=false,reached=false;
 for(let i=0;i<180;i++){E.tick(s,1/240,{left:side===0,right:side===1});struck||=s.events.some(e=>e.kind==='flipper');reached||=struck&&s.balls.some(b=>!b.lane&&b.y<600);s.events=[];if(reached)break;}
 assert(struck&&reached,'Flipper '+side+' contact '+offset+' must send ball above lower guides');
}
console.log('PASS: six real left/right flipper strikes clear the lower guide walls.');
