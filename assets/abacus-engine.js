(function(root){
 'use strict';
 const MAX=99999;
 function create(){return {digits:[0,0,0,0,0],problem:null,result:null};}
 function value(s){return s.digits.reduce((a,b)=>a*10+b,0);}
 function move(s,col,bead){if(!Number.isInteger(col)||col<0||col>4||!Number.isInteger(bead)||bead<0||bead>4)return;const upper=s.digits[col]>=5,lower=s.digits[col]%5;s.digits[col]=bead===0?(upper?0:5)+lower:(upper?5:0)+(bead<=lower?bead-1:bead);s.result=null;}
 function clear(s){s.digits.fill(0);s.result=null;}
 function parse(input){const str=String(input).trim();if(!/^\d{1,5}$/.test(str))throw Error('請在兩個數字框填入 0～99,999 的整數。');return Number(str);}
 function setProblem(s,a,op,b){a=parse(a);b=parse(b);if(op!=='+'&&op!=='-')throw Error('請選擇加法或減法。');const answer=op==='+'?a+b:a-b;if(answer<0)throw Error('減法的第一個數字要大於或等於第二個數字。');if(answer>MAX)throw Error('答案超過五檔算盤的範圍，請換小一點的數字。');s.problem={a,b,op,answer};clear(s);}
 function check(s){if(!s.problem)return null;s.result=value(s)===s.problem.answer;return s.result;}
 function free(s){s.problem=null;s.result=null;}
 function randomProblem(s,limit=100,operation='mixed',random=Math.random){
  if(![10,20,100,1000,99999].includes(limit)||!['+','-','mixed'].includes(operation))throw Error('請選擇有效的出題範圍與運算。');
  const pick=max=>Math.floor(Math.max(0,Math.min(.999999999,random()))*(max+1));
  const op=operation==='mixed'?(pick(1)?'+':'-'):operation;
  // Both operands are positive; subtraction also keeps a strictly positive answer.
  let total=2+pick(limit-2);
  let a=op==='+'?1+pick(total-2):total,b=op==='+'?total-a:1+pick(total-2);
  // Avoid an identical consecutive question, including deterministic RNGs.
  if(s.problem&&s.problem.a===a&&s.problem.b===b&&s.problem.op===op){total=2+(total-1)%(limit-1);if(op==='+'){a=Math.min(a,total-1);b=total-a;}else{a=total;b=Math.min(b,a-1);}}
  setProblem(s,a,op,b);
 }
 function setSequence(s,numbers,ops){
  if(!Array.isArray(numbers)||numbers.length<2||numbers.length>5||!Array.isArray(ops)||ops.length!==numbers.length-1)throw Error('請選擇 2～5 口，並填入每個數字及加減符號。');
  const terms=numbers.map(parse);let answer=terms[0];
  ops.forEach((op,i)=>{if(op!=='+'&&op!=='-')throw Error('請選擇加法或減法。');answer+=op==='+'?terms[i+1]:-terms[i+1];if(answer<0||answer>MAX)throw Error('第 '+(i+2)+' 口算完須介於 0～99,999，請調整題目。');});
  s.problem={a:terms[0],b:terms[1],op:ops[0],terms,ops:ops.slice(),answer};clear(s);
 }
 function randomSequence(s,limit=100,operation='mixed',count=2,random=Math.random){
  if(!Number.isInteger(count)||count<2||count>5)throw Error('請選擇 2～5 口。');
  if(![10,20,100,1000,99999].includes(limit)||!['+','-','mixed'].includes(operation))throw Error('請選擇有效的出題範圍與運算。');
  if(count===2){randomProblem(s,limit,operation,random);return;}
  const previous=s.problem,signature=p=>JSON.stringify([p.terms||[p.a,p.b],p.ops||[p.op]]),pick=(lo,hi)=>lo+Math.floor(Math.max(0,Math.min(.999999999,random()))*(hi-lo+1));
  for(let attempt=0;attempt<8;attempt++){
   const terms=[operation==='-'?pick(count,limit):operation==='+'?pick(1,limit-count+1):pick(1,limit)],ops=[];let running=terms[0];
   for(let i=1;i<count;i++){const remaining=count-i-1;let op=operation;if(op==='mixed')op=running===1?'+':running===limit?'-':pick(0,1)?'+':'-';const n=op==='+'?pick(1,limit-running-(operation==='+'?remaining:0)):pick(1,running-1-(operation==='-'?remaining:0));terms.push(n);ops.push(op);running+=op==='+'?n:-n;}
   const candidate={terms,ops};if(!previous||signature(candidate)!==signature(previous)){setSequence(s,terms,ops);return;}
  }
  // Deterministic bounded alternative even when an injected RNG always returns one value.
  const terms=Array(count).fill(1),ops=Array(count-1).fill(operation==='-'?'-':'+');terms[0]=operation==='-'?count:1;
  if(previous&&signature({terms,ops})===signature(previous))terms[0]++;
  setSequence(s,terms,ops);
 }
 const api={MAX,create,value,move,clear,setProblem,setSequence,check,free,randomProblem,randomSequence};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AbacusPractice=api;
})(typeof window==='undefined'?globalThis:window);
