const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const box={module:{exports:{}}};vm.runInNewContext(fs.readFileSync('assets/admin-preview.js','utf8'),box);const {create}=box.module.exports;
function mount(){
 const listeners={},frames=new Map();let next=0;const messages=[];
 const env={innerWidth:400,innerHeight:600,scrollY:0,requestAnimationFrame(fn){frames.set(++next,fn);return next;},cancelAnimationFrame(id){frames.delete(id);},scrollBy(x,y){this.scrollY+=y;},addEventListener(type,fn){listeners[type]=fn;}};
 class Node{constructor(tag='div'){this.tagName=tag;this.children=[];this.parentElement=null;this.dataset={};this.attrs={};this.style={};this.events={};this.hidden=false;const set=new Set();this.classList={add:(...xs)=>xs.forEach(x=>set.add(x)),remove:(...xs)=>xs.forEach(x=>set.delete(x)),contains:x=>set.has(x),toggle:(x,on)=>on?set.add(x):set.delete(x)};}
  set className(value){this._class=value;for(const token of value.split(' '))this.classList.add(token);}get className(){return this._class||'';}
  append(...items){for(const child of items){child.detach();child.parentElement=this;this.children.push(child);}}prepend(child){this.insertBefore(child,this.children[0]);}before(child){this.parentElement.insertBefore(child,this);}detach(){if(this.parentElement){const list=this.parentElement.children;list.splice(list.indexOf(this),1);}this.parentElement=null;}remove(){this.detach();}insertBefore(child,before){if(child===before)return;child.detach();child.parentElement=this;const index=this.children.indexOf(before);this.children.splice(index<0?this.children.length:index,0,child);}get nextSibling(){return this.parentElement.children[this.parentElement.children.indexOf(this)+1];}
  setAttribute(key,value){this.attrs[key]=value;}removeAttribute(key){delete this.attrs[key];}addEventListener(type,fn){(this.events[type]||=[]).push(fn);}setPointerCapture(id){this.captured=id;}releasePointerCapture(id){assert.equal(this.captured,id);this.captured=null;}
  fire(type,extra={}){const event={button:0,pointerId:1,isPrimary:true,clientX:30,clientY:30,preventDefault(){},...extra};let target=this;while(target){for(const fn of target.events[type]||[])fn(event);target=target.parentElement;}}
  closest(){return this.dataset.previewGame?this:this.parentElement?.closest();}querySelectorAll(selector){const result=[];const visit=(node,parentMatched)=>{const matched=parentMatched||node.classList.contains(selector.includes('ap-actions')?'ap-actions':'ap-toolbar');if(node.tagName==='button'&&matched)result.push(node);for(const child of node.children)visit(child,matched);};visit(this,false);return result;}
  getBoundingClientRect(){const i=grid.children.indexOf(this),left=(i%2)*200,top=Math.floor(i/2)*200-env.scrollY;return {left,top,width:190,height:190};}
 }
 const grid=new Node();grid.clientWidth=400;const wrapper=new Node();wrapper.append(grid);const body=new Node();body.append(wrapper);
 const doc={body,hidden:false,createElement:tag=>new Node(tag),addEventListener(type,fn){listeners[type]=fn;},elementFromPoint(x,y){return grid.children.find(card=>{const r=card.getBoundingClientRect();return x>=r.left&&x<r.left+r.width&&y>=r.top&&y<r.top+r.height;});}};
 const games=['a','b','c'].map(id=>({id,title:id,icon:'★'})),cards=new Map(games.map(g=>[g.id,new Node('a')]));for(const card of cards.values())grid.append(card);
 const config={games:games.map(g=>({id:g.id,visible:true,isNew:false}))};const controller=create({doc,grid,cards,games,onChange:message=>messages.push(JSON.parse(JSON.stringify(message))),env});controller.sync(config,{version:4});const handle=id=>cards.get(id).children[0].children[0];
 return {controller,env,doc,grid,cards,config,messages,frames,listeners,handle,order:()=>grid.children.map(x=>x.dataset.previewGame)};
}
{
 const m=mount(),h=m.handle('a');h.fire('pointerdown',{pointerType:'touch'});h.fire('pointermove',{clientX:150,clientY:250});assert.equal(m.grid.captured,1,'Stable grid keeps pointer capture across card movement');h.fire('pointerup',{clientX:150,clientY:250});assert.deepEqual(m.order(),['b','c','a']);assert.deepEqual(m.messages,[{action:'reorder',ids:['b','c','a'],version:4}]);assert.equal(m.config.games[0].id,'a','No draft mutation before parent accepts');assert.equal(m.frames.size,0);assert.equal(m.grid.captured,null);
}
for(const cancel of ['pointercancel','lostpointercapture','offscreen','blur','Escape','sync']){
 const m=mount(),h=m.handle('a');h.fire('pointerdown');h.fire('pointermove',{clientX:150,clientY:250});if(cancel==='offscreen')h.fire('pointerup',{clientX:-5,clientY:250});else if(cancel==='blur')m.listeners.blur();else if(cancel==='Escape')m.listeners.keydown({key:'Escape'});else if(cancel==='sync')m.controller.sync(m.config,{version:5});else h.fire(cancel);assert.deepEqual(m.order(),['a','b','c'],cancel);assert.equal(m.messages.length,0,cancel);assert.equal(m.frames.size,0,cancel);
}
{
 const m=mount(),h=m.handle('a');h.fire('pointerdown');m.handle('b').fire('pointerdown',{pointerId:2,isPrimary:false});h.fire('pointermove',{pointerId:2,clientX:150,clientY:250});assert.deepEqual(m.order(),['a','b','c']);h.fire('pointermove',{clientX:30,clientY:590});const [frameId,callback]=[...m.frames.entries()][0];m.frames.delete(frameId);callback();assert.ok(m.env.scrollY>0,'Edge drag scrolls the preview');m.controller.cancel();assert.equal(m.frames.size,0);
}
{
 const m=mount();m.handle('a').fire('keydown',{key:'ArrowDown'});assert.deepEqual(m.messages[0].ids,['b','a','c']);const button=m.cards.get('b').querySelectorAll('.ap-actions button')[1];button.onclick();assert.deepEqual(m.messages[1],{action:'toggle',id:'b',key:'isNew',value:true,version:4});
 m.config.games[1].visible=false;m.controller.sync(m.config,{editable:true,version:5});assert.equal(m.cards.get('b').hidden,false,'Hidden games remain editable');m.controller.sync(m.config,{editable:false,version:6});assert.equal(m.cards.get('b').hidden,true,'Pure preview matches public visibility');m.handle('a').fire('pointerdown');assert.equal(m.frames.size,0);
 m.controller.sync(m.config,{locked:true,version:7});m.handle('a').fire('pointerdown');button.onclick();assert.equal(m.messages.length,2,'Saving locks preview changes');
}
console.log('PASS interactive admin preview: mouse/touch reorder, cancel/lost capture/outside drop/Escape/blur, concurrent pointers, edge scrolling, keyboard sorting, visibility/new toggles, pure preview and save lock.');
