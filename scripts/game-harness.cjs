const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const DAY=86400000;
function boot(saved={}){
  let now=1800000000000,timers=[],fail=false;
  const elements=new Map();
  function el(){const classes=new Set();return {children:[],dataset:{},style:{},textContent:'',checked:false,parentElement:{style:{},after(){}},
    classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x)}},
    appendChild(x){this.children.push(x)},before(){},after(){},remove(){},setAttribute(){},showModal(){this.open=true},close(){this.open=false;this.onclose?.()},set innerHTML(v){this.children=[]},get innerHTML(){return ''}}}
  const get=id=>{if(!elements.has(id))elements.set(id,el());return elements.get(id)};
  const subjects=['math','chinese','focus','english'].map(kind=>{const b=el();b.dataset.kind=kind;return b});
  const document={getElementById:get,createElement:el,body:el(),querySelectorAll:s=>s==='.subject'?subjects:s==='.answer'?get('answers').children:[]};
  class Clock extends Date{static now(){return now}}
  const context=vm.createContext({console,Math,Date:Clock,document,window:{},localStorage:{getItem:k=>saved[k]??null,setItem(k,v){if(fail)throw Error('quota');saved[k]=v}},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){}});
  vm.runInContext(source,context);
  const run=s=>vm.runInContext(s,context);
  const flush=()=>{const pending=timers;timers=[];pending.forEach(fn=>fn())};
  const answer=(correct=true)=>{if(run('previewing'))run('memoryButton.onclick()');run(`answer(current.choices.find(c=>c${correct?'===':'!=='}current.answer),document.getElementById('answers').children.find(b=>b.dataset.choice${correct?'===':'!=='}current.answer))`)};
  return {run,saved,answer,flush,days:n=>now+=n*DAY,fail:()=>fail=true};
}

module.exports={boot};
