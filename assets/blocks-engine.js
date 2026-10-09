(function(root){'use strict';
  const WIDTH=10,HEIGHT=20;
  const SHAPES={I:[[0,1],[1,1],[2,1],[3,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]],O:[[0,0],[1,0],[0,1],[1,1]],S:[[1,0],[2,0],[0,1],[1,1]],T:[[1,0],[0,1],[1,1],[2,1]],Z:[[0,0],[1,0],[1,1],[2,1]]};
  const COLORS={I:'#84c5f2',J:'#96a9ec',L:'#ffc979',O:'#ffda73',S:'#8cd7b5',T:'#bb9aeb',Z:'#f6a09b'};
  class Game {
    constructor(random=Math.random){this.random=random;this.reset()}
    reset(){this.board=Array.from({length:HEIGHT},()=>Array(WIDTH).fill(null));this.bag=[];this.queue=[];this.score=0;this.lines=0;this.level=1;this.status='ready';this.active=null;this.fall=0;this.lockTime=0;this.lockResets=0;this.clearRows=[];this.clearTime=0;this.lastClear=0;while(this.queue.length<3)this.queue.push(this.draw())}
    draw(){if(!this.bag.length){this.bag=Object.keys(SHAPES);for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]]}}return this.bag.pop()}
    start(){if(this.status!=='ready')return false;this.status='playing';this.spawn();return true}
    spawn(){const type=this.queue.shift();this.queue.push(this.draw());this.active={type,cells:SHAPES[type].map(p=>p.slice()),x:3,y:0};this.fall=0;this.lockTime=0;this.lockResets=0;if(!this.fits(this.active))this.status='over'}
    fits(piece){return piece.cells.every(([dx,dy])=>{const x=piece.x+dx,y=piece.y+dy;return x>=0&&x<WIDTH&&y<HEIGHT&&y>=-4&&(y<0||!this.board[y][x])})}
    grounded(){return !this.fits({...this.active,y:this.active.y+1})}
    move(dx,dy=0,soft=false){if(this.status!=='playing')return false;const p={...this.active,x:this.active.x+dx,y:this.active.y+dy};if(!this.fits(p))return false;const grounded=this.grounded();this.active=p;if(dy>0){this.lockTime=0;if(soft)this.score+=dy}else if(grounded&&this.lockResets<15){this.lockTime=0;this.lockResets++}return true}
    rotate(){if(this.status!=='playing'||this.active.type==='O')return false;const size=this.active.type==='I'?4:3,cells=this.active.cells.map(([x,y])=>[size-1-y,x]);const grounded=this.grounded();for(const [dx,dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[0,-2]]){const p={...this.active,cells,x:this.active.x+dx,y:this.active.y+dy};if(this.fits(p)){this.active=p;if(grounded&&this.lockResets<15){this.lockTime=0;this.lockResets++}return true}}return false}
    ghostY(){if(!this.active)return 0;let y=this.active.y;while(this.fits({...this.active,y:y+1}))y++;return y}
    hardDrop(){if(this.status!=='playing')return false;const y=this.ghostY();this.score+=(y-this.active.y)*2;this.active.y=y;this.lock();return true}
    lock(){if(this.active.cells.some(([,dy])=>this.active.y+dy<0)){this.status='over';return}for(const [dx,dy] of this.active.cells)this.board[this.active.y+dy][this.active.x+dx]=this.active.type;this.clearRows=this.board.flatMap((row,i)=>row.every(Boolean)?[i]:[]);if(this.clearRows.length){this.status='clearing';this.clearTime=0;this.active=null}else this.spawn()}
    finishClear(){const n=this.clearRows.length;this.board=this.board.filter((_,i)=>!this.clearRows.includes(i));while(this.board.length<HEIGHT)this.board.unshift(Array(WIDTH).fill(null));this.score+=[0,100,300,500,800][n]*this.level;this.lines+=n;this.lastClear=n;this.level=1+Math.floor(this.lines/10);this.clearRows=[];this.status='playing';this.spawn()}
    interval(){return Math.max(130,900-(this.level-1)*65)}
    advance(ms){if(!Number.isFinite(ms)||ms<=0)return;ms=Math.min(ms,200);if(this.status==='clearing'){this.clearTime+=ms;if(this.clearTime>=300)this.finishClear();return}if(this.status!=='playing')return;this.fall+=ms;while(this.fall>=this.interval()){this.fall-=this.interval();if(!this.move(0,1))break}if(this.grounded()){this.lockTime+=ms;if(this.lockTime>=500)this.lock()}else this.lockTime=0}
    pause(){if(!['playing','clearing'].includes(this.status))return false;this.resumeStatus=this.status;this.status='paused';return true}
    resume(){if(this.status!=='paused')return false;this.status=this.resumeStatus;return true}
  }
  const api={Game,SHAPES,COLORS,WIDTH,HEIGHT};if(typeof module!=='undefined')module.exports=api;else root.CandyBlocks=api;
})(typeof globalThis!=='undefined'?globalThis:this);
