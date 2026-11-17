(function(root){'use strict';
const WORDS=Object.freeze(['one','two','three','four','five','six','seven','eight','nine','ten']);
const RANGES=Object.freeze({first:[1,2,3,4,5],last:[6,7,8,9,10],all:[1,2,3,4,5,6,7,8,9,10]});
const MODES=['mixed','listen','read','spell','match'],LEVELS=['missing','tiles','keyboard'];
const alphabet='abcdefghijklmnopqrstuvwxyz',VERSION=1,ROUND_SIZE=10;
function config(value={}){return {range:Object.hasOwn(RANGES,value.range)?value.range:'all',mode:MODES.includes(value.mode)?value.mode:'mixed',level:LEVELS.includes(value.level)?value.level:'missing'};}
function shuffle(items,rng=Math.random){const copy=items.slice();for(let i=copy.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(rng()*(i+1))));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function word(n){return WORDS[n-1]||'';}
function positions(task,cfg){return cfg.level==='missing'?task.holes:word(task.n).split('').map((_,i)=>i);}
function emptyEntry(task,cfg){const editable=positions(task,cfg);return {draft:word(task.n).split('').map((letter,i)=>editable.includes(i)?'':letter),focus:editable[0],choice:null,attempts:0,solved:false};}
function create(options={},rng=Math.random,reviewNumbers){const cfg=config(options),scope=RANGES[cfg.range];
 const pool=reviewNumbers?[...new Set(reviewNumbers.filter(n=>scope.includes(n)))]:scope.slice();if(!pool.length)throw Error('沒有可練習的數字。');
 if(cfg.mode==='match')return createMatching(cfg,pool,rng);
 const numbers=[];while(numbers.length<ROUND_SIZE){const batch=shuffle(pool,rng);if(batch.length>1&&numbers.at(-1)===batch[0])[batch[0],batch[1]]=[batch[1],batch[0]];numbers.push(...batch);}numbers.length=ROUND_SIZE;
 const types=cfg.mode==='mixed'?shuffle(Array.from({length:ROUND_SIZE},(_,i)=>['listen','read','spell'][i%3]),rng):Array(ROUND_SIZE).fill(cfg.mode);
 const tasks=numbers.map((n,i)=>{const letters=word(n).split(''),holes=shuffle(letters.map((_,j)=>j),rng).slice(0,letters.length>3?2:1).sort((a,b)=>a-b);
  const choices=shuffle([n,...shuffle(scope.filter(x=>x!==n),rng).slice(0,2)],rng);
  let bank;if(cfg.level==='tiles'){bank=shuffle(letters,rng);if(bank.join('')===word(n))bank.push(bank.shift());}else if(cfg.level==='missing'){const required=[...new Set(holes.map(j=>letters[j]))];bank=shuffle([...required,...shuffle(alphabet.split('').filter(c=>!required.includes(c)),rng).slice(0,6-required.length)],rng);}else bank=alphabet.split('');
  return {n,type:types[i],choices,holes,bank};
 });return {version:VERSION,config:cfg,pool,tasks,index:0,phase:'playing',results:[],entry:emptyEntry(tasks[0],cfg)};
}
function current(state){return state.tasks[state.index];}
function active(state){return state.config.mode!=='match'&&state.phase==='playing'&&!state.entry.solved;}
function setFocus(state,index){if(!active(state)||current(state).type!=='spell'||!positions(current(state),state.config).includes(index))return false;state.entry.focus=index;return true;}
function available(state,letter){const task=current(state);if(state.config.level!=='tiles')return task.bank.includes(letter);const used=state.entry.draft.filter((c,i)=>i!==state.entry.focus&&c===letter).length;return word(task.n).split('').filter(c=>c===letter).length>used;}
function put(state,letter){if(!active(state)||current(state).type!=='spell'||typeof letter!=='string')return false;letter=letter.toLowerCase();if(!/^[a-z]$/.test(letter)||!available(state,letter))return false;
 const entry=state.entry,editable=positions(current(state),state.config);entry.draft[entry.focus]=letter;const at=editable.indexOf(entry.focus),order=editable.slice(at+1).concat(editable.slice(0,at));const next=order.find(i=>!entry.draft[i]);if(next!==undefined)entry.focus=next;return true;
}
function erase(state){if(!active(state)||current(state).type!=='spell')return false;const entry=state.entry,editable=positions(current(state),state.config);if(!entry.draft[entry.focus])entry.focus=editable[Math.max(0,editable.indexOf(entry.focus)-1)];entry.draft[entry.focus]='';return true;}
function clear(state){if(!active(state)||current(state).type!=='spell')return false;const clean=emptyEntry(current(state),state.config);state.entry.draft=clean.draft;state.entry.focus=clean.focus;return true;}
function choose(state,n){if(!active(state)||current(state).type==='spell'||!current(state).choices.includes(n))return false;state.entry.choice=n;return true;}
function submit(state){if(!active(state))return 'locked';const task=current(state),entry=state.entry;
 if(task.type==='spell'?entry.draft.some(c=>!c):entry.choice===null)return 'incomplete';
 const correct=task.type==='spell'?entry.draft.join('')===word(task.n):entry.choice===task.n;
 entry.attempts++;if(!correct)return 'wrong';entry.solved=true;state.results.push({n:task.n,type:task.type,attempts:entry.attempts,first:entry.attempts===1});return 'correct';
}
function advance(state){if(state.config.mode==='match')return advanceMatching(state);if(state.phase!=='playing'||!state.entry.solved)return false;if(state.index===ROUND_SIZE-1)state.phase='result';else{state.index++;state.entry=emptyEntry(current(state),state.config);}return true;}
function perfect(state){return state.phase==='result'&&state.results.length===ROUND_SIZE&&(state.config.mode==='match'?matchErrors(state)===0:state.results.every(r=>r.first));}
function mistakes(state){return [...new Set(state.results.filter(r=>!r.first).map(r=>r.n))];}
function createMatching(cfg,pool,rng){
 const boards=[];let deck=[],count=0;
 while(count<ROUND_SIZE){
  if(!deck.length)deck=shuffle(pool,rng);
  const left=deck.splice(0,Math.min(5,ROUND_SIZE-count)),right=shuffle(left,rng);
  if(right.length>1&&right.every((n,i)=>n===left[i]))right.push(right.shift());
  boards.push({left,right,entries:left.map(n=>({n,attempts:0,solved:false}))});count+=left.length;
 }
 return {version:VERSION,config:cfg,pool,boards,index:0,phase:'playing',results:[],selection:{left:null,right:null}};
}
function matchComplete(state){return state.boards[state.index].entries.every(entry=>entry.solved);}
function matchErrors(state){
 // Each mismatch marks two words for review; a successful pair adds one attempt.
 // Derive one count per mismatch so existing saved rounds keep their exact history.
 return state.boards.reduce((total,board)=>total+board.entries.reduce((sum,entry)=>sum+entry.attempts-Number(entry.solved),0),0)/2;
}
function selectMatch(state,side,n){
 if(state.config.mode!=='match'||state.phase!=='playing'||!['left','right'].includes(side))return {status:'locked'};
 const board=state.boards[state.index],entry=board.entries.find(item=>item.n===n);
 if(!entry||entry.solved)return {status:'locked'};
 state.selection[side]=state.selection[side]===n?null:n;
 const {left,right}=state.selection;if(left===null||right===null)return {status:'selected'};
 state.selection={left:null,right:null};
 const number=board.entries.find(item=>item.n===left),label=board.entries.find(item=>item.n===right);
 number.attempts++;
 if(left!==right){label.attempts++;return {status:'wrong',left,right};}
 number.solved=true;
 state.results.push({n:left,type:'match',board:state.index,attempts:number.attempts,first:number.attempts===1});
 return {status:'correct',n:left};
}
function advanceMatching(state){
 if(state.phase!=='playing'||!matchComplete(state))return false;
 if(state.index===state.boards.length-1)state.phase='result';else state.index++;
 state.selection={left:null,right:null};return true;
}
function restoreMatching(raw,cfg){
 const unique=arr=>Array.isArray(arr)&&new Set(arr).size===arr.length,scope=RANGES[cfg.range];
 if(!unique(raw.pool)||!raw.pool.length||raw.pool.some(n=>!scope.includes(n))||!Array.isArray(raw.boards)||!raw.boards.length||raw.boards.length>ROUND_SIZE)throw Error();
 if(!Number.isInteger(raw.index)||raw.index<0||raw.index>=raw.boards.length||!['playing','result'].includes(raw.phase))throw Error();
 const boards=raw.boards.map((board,i)=>{
  if(!board||!unique(board.left)||!board.left.length||board.left.length>5||board.left.some(n=>!raw.pool.includes(n))||!unique(board.right)||board.right.length!==board.left.length||board.right.some(n=>!board.left.includes(n)))throw Error();
  if(!Array.isArray(board.entries)||board.entries.length!==board.left.length)throw Error();
  const entries=board.entries.map((entry,j)=>{
   if(!entry||entry.n!==board.left[j]||typeof entry.solved!=='boolean'||!Number.isSafeInteger(entry.attempts)||entry.attempts<Number(entry.solved)||entry.attempts>10000)throw Error();
   if(i<raw.index&&!entry.solved||i>raw.index&&(entry.solved||entry.attempts))throw Error();
   return {n:entry.n,attempts:entry.attempts,solved:entry.solved};
  });
  const retries=entries.map(entry=>entry.attempts-Number(entry.solved)),total=retries.reduce((sum,count)=>sum+count,0);
  if(total%2!==0||retries.some(count=>count>total/2))throw Error();
  return {left:board.left.slice(),right:board.right.slice(),entries};
 });
 if(boards.reduce((count,board)=>count+board.left.length,0)!==ROUND_SIZE||!raw.pool.every(n=>boards.some(board=>board.left.includes(n))))throw Error();
 if(raw.phase==='result'&&(raw.index!==boards.length-1||!boards.at(-1).entries.every(entry=>entry.solved)))throw Error();
 const selection=raw.selection,board=boards[raw.index];
 if(!selection||!['left','right'].every(side=>selection[side]===null||board.entries.some(entry=>entry.n===selection[side]&&!entry.solved))||selection.left!==null&&selection.right!==null)throw Error();
 if(!Array.isArray(raw.results)||raw.results.length!==boards.reduce((count,item)=>count+item.entries.filter(entry=>entry.solved).length,0))throw Error();
 const seen=new Set();let lastBoard=0;
 const results=raw.results.map(result=>{
  const entry=boards[result?.board]?.entries.find(item=>item.n===result.n),key=result?.board+':'+result?.n;
  if(!result||!Number.isInteger(result.board)||result.board<lastBoard||!entry?.solved||seen.has(key)||result.type!=='match'||result.attempts!==entry.attempts||result.first!==(entry.attempts===1))throw Error();
  seen.add(key);lastBoard=result.board;return {n:result.n,type:'match',board:result.board,attempts:result.attempts,first:result.first};
 });
 return {version:VERSION,config:cfg,pool:raw.pool.slice(),boards,index:raw.index,phase:raw.phase,results,selection:{left:selection.left,right:selection.right}};
}
function restore(raw){try{
 if(typeof raw==='string'){if(raw.length>40000)return null;raw=JSON.parse(raw);}if(!raw||raw.version!==VERSION)return null;
 const cfg=config(raw.config);if(!raw.config||Object.keys(cfg).some(k=>cfg[k]!==raw.config[k]))return null;
 if(cfg.mode==='match')return restoreMatching(raw,cfg);
 const scope=RANGES[cfg.range],unique=arr=>Array.isArray(arr)&&new Set(arr).size===arr.length;
 if(!unique(raw.pool)||!raw.pool.length||raw.pool.some(n=>!scope.includes(n))||!Array.isArray(raw.tasks)||raw.tasks.length!==ROUND_SIZE)return null;
 const tasks=raw.tasks.map(task=>{if(!task||!raw.pool.includes(task.n)||!['listen','read','spell'].includes(task.type)||(cfg.mode!=='mixed'&&task.type!==cfg.mode))throw Error();
  const letters=word(task.n).split('');if(!unique(task.choices)||task.choices.length!==3||!task.choices.includes(task.n)||task.choices.some(n=>!scope.includes(n)))throw Error();
  if(!unique(task.holes)||task.holes.length!==(letters.length>3?2:1)||task.holes.some(i=>!Number.isInteger(i)||i<0||i>=letters.length))throw Error();
  if(!Array.isArray(task.bank)||task.bank.some(c=>typeof c!=='string'||!/^[a-z]$/.test(c)))throw Error();
  if(cfg.level==='tiles'&&task.bank.slice().sort().join('')!==letters.slice().sort().join(''))throw Error();
  if(cfg.level==='keyboard'&&task.bank.join('')!==alphabet)throw Error();
  if(cfg.level==='missing'&&(!unique(task.bank)||task.bank.length!==6||task.holes.some(i=>!task.bank.includes(letters[i]))))throw Error();
  return {n:task.n,type:task.type,choices:task.choices.slice(),holes:task.holes.slice(),bank:task.bank.slice()};
 });
 if(!raw.pool.every(n=>tasks.some(t=>t.n===n))||!Number.isInteger(raw.index)||raw.index<0||raw.index>=ROUND_SIZE||!['playing','result'].includes(raw.phase))return null;
 const task=tasks[raw.index],entry=raw.entry,editable=positions(task,cfg);
 if(!entry||typeof entry.solved!=='boolean'||!Number.isSafeInteger(entry.attempts)||entry.attempts<0||entry.attempts>10000||!editable.includes(entry.focus)||!(entry.choice===null||task.choices.includes(entry.choice)))return null;
 if(!Array.isArray(entry.draft)||entry.draft.length!==word(task.n).length||entry.draft.some((c,i)=>typeof c!=='string'||!/^([a-z])?$/.test(c)||(!editable.includes(i)&&c!==word(task.n)[i])))return null;
 if(entry.draft.some((c,i)=>editable.includes(i)&&c&&!task.bank.includes(c)))return null;
 if(cfg.level==='tiles'&&[...new Set(entry.draft)].some(c=>c&&entry.draft.filter(x=>x===c).length>word(task.n).split('').filter(x=>x===c).length))return null;
 if(entry.solved&&(entry.attempts<1||(task.type==='spell'?entry.draft.join('')!==word(task.n):entry.choice!==task.n)))return null;
 if(raw.phase==='result'&&(raw.index!==ROUND_SIZE-1||!entry.solved))return null;
 if(!Array.isArray(raw.results)||raw.results.length!==raw.index+Number(entry.solved))return null;
 const results=raw.results.map((r,i)=>{if(!r||r.n!==tasks[i].n||r.type!==tasks[i].type||!Number.isSafeInteger(r.attempts)||r.attempts<1||r.attempts>10000||r.first!==(r.attempts===1))throw Error();return {n:r.n,type:r.type,attempts:r.attempts,first:r.first};});
 if(entry.solved&&results.at(-1).attempts!==entry.attempts)return null;
 return {version:VERSION,config:cfg,pool:raw.pool.slice(),tasks,index:raw.index,phase:raw.phase,results,entry:{draft:entry.draft.slice(),focus:entry.focus,choice:entry.choice,attempts:entry.attempts,solved:entry.solved}};
 }catch{return null;}}
const api={WORDS,RANGES,ROUND_SIZE,config,shuffle,word,create,current,positions,setFocus,available,put,erase,clear,choose,submit,advance,perfect,mistakes,restore,selectMatch,matchComplete,matchErrors};
if(typeof module!=='undefined')module.exports=api;else root.NumberBakery=api;
})(typeof globalThis!=='undefined'?globalThis:this);
