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
  let a=pick(limit),b=pick(op==='+'?limit-a:a);
  // Avoid an identical consecutive question, including deterministic RNGs.
  if(s.problem&&s.problem.a===a&&s.problem.b===b&&s.problem.op===op){if(op==='+'){a=(a+1)%(limit+1);b=Math.min(b,limit-a);}else b=(b+1)%(a+1);if(s.problem.a===a&&s.problem.b===b)a=(a+1)%(limit+1);}
  setProblem(s,a,op,b);
 }
 const api={MAX,create,value,move,clear,setProblem,check,free,randomProblem};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AbacusPractice=api;
})(typeof window==='undefined'?globalThis:window);
