(function (root) {
  'use strict';
  const KEY = 'learning-planet-board-v1', HISTORY_KEY = 'learning-planet-board-history-v1';
  const TOTAL = 12;
  const FACILITIES={slide:['🛝','溜滑梯',4,'小夥伴咻一下滑下來！'],house:['🏡','小兔的家',6,'小兔出門和你打招呼！'],garden:['🌻','蝴蝶花園',8,'蝴蝶飛來看你種的花！'],swing:['🌳','樹下鞦韆',7,'抓穩囉！和朋友一起盪高高。'],seesaw:['⚖️','雙人蹺蹺板',9,'你上我下，和好朋友輪流玩！'],sandbox:['🏖️','沙坑城堡',6,'小小鏟子，堆出大大的沙堡！'],carousel:['🎠','旋轉木馬',12,'坐上木馬，一起繞圈圈！']};
  const DECORATIONS={balloons:['🎈','彩色氣球',2],flowers:['🌷','花花圍籬',3],rainbow:['🌈','彩虹拱門',4]};
  const ANIMALS={dog:['🐶','小狗豆豆',3,'汪！今天想和你一起玩球。'],kitten:['🐱','小貓咪咪',4,'喵～玩累了就曬曬太陽。'],panda:['🐼','小熊貓圓圓',5,'抱抱！一起找個好玩的地方吧。'],fox:['🦊','小狐狸栗栗',6,'嘿！我們來花園探險吧！']};
  function parkOf(s){return s.park?{...s.park,animals:s.park.animals||[]}:{stars:s.stars,facilities:[],decorations:[],animals:[]};}
  function validPark(p){return obj(p)&&(p.animals===undefined||Array.isArray(p.animals)&&new Set(p.animals).size===p.animals.length&&p.animals.every(id=>Object.hasOwn(ANIMALS,id)))&&integer(p.stars,0,100000)&&['facilities','decorations'].every(key=>Array.isArray(p[key])&&new Set(p[key]).size===p[key].length&&p[key].every(id=>Object.hasOwn(key==='facilities'?FACILITIES:DECORATIONS,id)));}
  const TYPES = ['start','math','event','chinese','build','focus','rest','english','build','math','event','chinese','rest','focus','build','english','event','math','rest','chinese','build','focus','event','english'];
  const INFO = {
    start: ['🚀','出發站'], math: ['🧮','數學商店'], chinese: ['📖','故事小屋'],
    english: ['🔤','英文港口'], focus: ['🧠','神祕森林'], event: ['🎁','驚喜格'],
    build: ['🏗️','建設格'], rest: ['🌈','休息格']
  };
  const CHARACTERS = { cat: ['🐱','小橘'], rabbit: ['🐰','小白'], bear: ['🐻','小熊'] };
  const BASES = { space: ['🚀','太空站'], tree: ['🌳','樹屋'], pets: ['🐾','寵物小屋'] };
  const STAGES = ['小小營地','補給小站','探險基地','閃耀家園'];
  const dirs = ['↑','→','↓','←'];
  const integer = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
  const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const text = x => typeof x === 'string' && x.length <= 2000;
  const subject = x => ['math','chinese','english','focus'].includes(x);
  const modes = ['independent','hint','retry','demo'];
  const sample = (n, rng) => Math.min(n - 1, Math.max(0, Math.floor(rng() * n)));
  function shuffle(items, rng) { const result = [...items]; for (let i=result.length-1;i>0;i--) { const j=sample(i+1,rng); [result[i],result[j]]=[result[j],result[i]]; } return result; }
  const clone = x => JSON.parse(JSON.stringify(x));
  function validTask(t) {
    if (!obj(t) || !subject(t.subject) || !text(t.id) || !text(t.title) || !text(t.text) || !text(t.hint) || !integer(t.attempts,0,10000) || typeof t.hintUsed!=='boolean' || typeof t.demoUsed!=='boolean') return false;
    if (t.subject==='math') return t.kind==='money' && integer(t.answer,1,30) && Array.isArray(t.coins) && t.coins.join(',')==='1,5,10';
    if (t.subject==='focus') return t.kind==='memory' && Array.isArray(t.answer) && t.answer.length===3 && t.answer.every(d=>dirs.includes(d)) && typeof t.concealed==='boolean';
    return t.kind==='choice' && text(t.answer) && Array.isArray(t.choices) && t.choices.length===4 && t.choices.every(text) && new Set(t.choices).size===4 && t.choices.includes(t.answer) && (t.subject!=='english'||text(t.word));
  }
  function validEvent(e) { return obj(e) && text(e.id) && subject(e.subject) && modes.includes(e.mode) && text(e.title) && Number.isFinite(e.at); }
  function validState(s) {
    if (!obj(s)||s.version!==1||!text(s.id)||!Object.hasOwn(CHARACTERS,s.character)||!Object.hasOwn(BASES,s.baseStyle)||!integer(s.position,0,23)||!integer(s.turn,0,TOTAL)||!integer(s.dice,0,6)||!integer(s.stars,0,TOTAL)||!integer(s.supplies,0,100000)||!integer(s.baseLevel,0,3)||!integer(s.revision,0,100000)||!['ready','task','encounter','reward','finished'].includes(s.phase)||!Array.isArray(s.events)||s.events.length>TOTAL||!s.events.every(validEvent)||!Array.isArray(s.seen)||s.seen.length>TOTAL||!s.seen.every(text)||!obj(s.input)||!Array.isArray(s.input.sequence)||s.input.sequence.length>3||!s.input.sequence.every(d=>dirs.includes(d))||!obj(s.input.coins)||Object.entries(s.input.coins).some(([k,v])=>!['1','5','10'].includes(k)||!integer(v,0,30))||!Number.isFinite(s.startedAt)) return false;
    if(s.park!==undefined&&!validPark(s.park))return false;
    if (s.phase==='finished'&&s.turn!==TOTAL || s.phase==='ready'&&s.turn===TOTAL || s.turn===0&&s.phase!=='ready') return false;
    if (s.phase==='task'&&!validTask(s.task)) return false;
    if (s.task!==null&&!validTask(s.task)) return false;
    if (s.phase==='encounter'&&(!obj(s.encounter)||!['start','rest','build','event'].includes(s.encounter.kind)||!integer(s.encounter.variant,0,3))) return false;
    if (s.phase==='reward'&&(!obj(s.outcome)||!text(s.outcome.title)||!text(s.outcome.text)||!integer(s.outcome.stars,0,1)||!integer(s.outcome.supplies,0,3))) return false;
    return true;
  }
  function validHistory(h) { return obj(h)&&h.version===1&&Array.isArray(h.events)&&h.events.length<=600&&h.events.every(validEvent)&&Array.isArray(h.games)&&h.games.length<=100&&h.games.every(g=>obj(g)&&text(g.id)&&integer(g.stars,0,TOTAL)&&integer(g.baseLevel,0,3)&&Object.hasOwn(BASES,g.baseStyle)&&Number.isFinite(g.at)); }
  function create(character='cat', now=Date.now()) {
    return { version:1, id:'board-'+now+'-'+Math.random().toString(36).slice(2,9), revision:0, character:Object.hasOwn(CHARACTERS,character)?character:'cat', baseStyle:'space', baseLevel:0, position:0, turn:0, dice:0, stars:0, supplies:0, phase:'ready', task:null, encounter:null, outcome:null, input:{coins:{},sequence:[]}, events:[], seen:[], startedAt:now };
  }
  function taskFor(kind,s,bank,rng) {
    const common={subject:kind,attempts:0,hintUsed:false,demoUsed:false};
    if(kind==='math'){
      const count=2+sample(4,rng),price=2+sample(3,rng);
      return {...common,kind:'money',id:'money:'+count+':'+price,title:'幫小熊買補給',text:'小熊要買 '+count+' 顆蘋果，每顆 '+price+' 元。把剛好的硬幣放到托盤。',answer:count*price,coins:[1,5,10],hint:'先把 '+price+' 元加 '+count+' 次，或算 '+count+' × '+price+'。硬幣可以取回。'};
    }
    if(kind==='focus') return {...common,kind:'memory',id:'memory:'+s.turn,title:'記住森林的路線',text:'先記住三個方向，準備好再藏起路線。然後依序點方向，帶朋友穿過森林。',answer:Array.from({length:3},()=>dirs[sample(4,rng)]),concealed:false,hint:'在心裡把三個方向念一遍，再一步一步走。需要時可以重看路線。'};
    if(kind==='english'){
      const unseen=bank.english.filter(pair=>!s.seen.includes('word:'+pair[0]));
      const pool=unseen.length?unseen:bank.english,item=pool[sample(pool.length,rng)];
      const wrong=shuffle([...new Set(bank.english.map(pair=>pair[1]))].filter(word=>word!==item[1]),rng).slice(0,3);
      return {...common,kind:'choice',id:'word:'+item[0],title:'把補給送上船',text:'港口需要「'+item[0]+'」。可以聽聽英文，再選擇要送上船的物品或動物。',word:item[0],answer:item[1],choices:shuffle([item[1],...wrong],rng),hint:item[0]+' 的意思是「'+item[1]+'」。讀一次，再幫它找到位置。'};
    }
    const unseen=bank.chinese.filter(q=>!s.seen.includes('chinese:'+q[1]));
    const pool=unseen.length?unseen:bank.chinese,q=pool[sample(pool.length,rng)];
    return {...common,kind:'choice',id:'chinese:'+q[1],title:'故事小屋的留言',text:q[1],answer:q[3],choices:shuffle(q[2],rng),hint:q[4]};
  }
  const EVENTS=[
    ['流星送來的禮物','接住一份閃亮建材，替基地添點新東西。',3],
    ['幫小兔搬行李','你願意伸出援手，小兔送你一份建材謝禮。',2],
    ['找到補給寶箱','一起打開旅途中的寶箱，帶走裡面的建材。',3],
    ['星際野餐時間','和朋友分享點心，再帶著建材繼續旅程。',2]
  ];
  function encounter(s) {
    const e=s.encounter;
    return e.kind==='event'?EVENTS[e.variant]:e.kind==='build'?['基地補給到了','收下 2 份建材。累積 4 份就能蓋一座可以玩的溜滑梯。',2]:e.kind==='start'?['回到出發站','繞了一圈，補充建材，再出發看看新的風景。',2]:['在彩虹下休息','伸伸手、看看遠方。收下旅途小禮物，準備好再繼續。',1];
  }
  function reward(s,title,message,supplies,stars=0) { s.supplies+=supplies;s.stars+=stars;s.park.stars+=stars;s.phase='reward';s.outcome={title,text:message,supplies,stars}; }
  function complete(s,mode,now) {
    const t=s.task;
    if(!s.events.some(e=>e.id===s.id+':'+s.turn))s.events.push({id:s.id+':'+s.turn,subject:t.subject,mode,title:t.title,at:now});
    reward(s,mode==='independent'?'第一次就完成了！':'任務完成，繼續探險！',mode==='demo'?'看完示範也是學習。下次再試著自己完成。':mode==='independent'?'得到 2 份建材和 1 顆星星，去樂園看看能蓋什麼吧！':'你願意繼續練習，得到 2 份建材和 1 顆星星。',2,1);
  }
  function act(previous,action,bank,rng=Math.random,now=Date.now()) {
    if(!validState(previous))throw Error('無法讀取這趟旅程');
    const s=clone(previous),t=s.task;s.park=clone(parkOf(s));
    switch(action.type){
      case 'roll':
        if(s.phase!=='ready'||s.turn>=TOTAL)return previous;
        s.dice=1+sample(6,rng);s.position=(s.position+s.dice)%24;s.turn++;s.input={coins:{},sequence:[]};s.outcome=null;s.task=null;s.encounter=null;
        if(subject(TYPES[s.position])){s.task=taskFor(TYPES[s.position],s,bank,rng);s.seen.push(s.task.id);s.phase='task'}
        else{s.encounter={kind:TYPES[s.position],variant:sample(4,rng)};s.phase='encounter'}
        break;
      case 'coin':
        if(s.phase!=='task'||t.kind!=='money'||![1,5,10].includes(action.coin)||![-1,1].includes(action.delta))return previous;
        s.input.coins[action.coin]=Math.min(30,Math.max(0,(s.input.coins[action.coin]||0)+action.delta));break;
      case 'conceal':if(s.phase!=='task'||t.kind!=='memory')return previous;t.concealed=true;s.input.sequence=[];break;
      case 'direction':if(s.phase!=='task'||t.kind!=='memory'||!t.concealed||!dirs.includes(action.value)||s.input.sequence.length>=3)return previous;s.input.sequence.push(action.value);break;
      case 'undo':if(s.phase!=='task'||t.kind!=='memory'||!t.concealed)return previous;s.input.sequence.pop();break;
      case 'hint':
        if(s.phase!=='task')return previous;t.hintUsed=true;
        if(t.kind==='memory'){t.concealed=false;s.input.sequence=[]}break;
      case 'demo':if(s.phase!=='task')return previous;t.demoUsed=true;t.hintUsed=true;complete(s,'demo',now);break;
      case 'answer':{
        if(s.phase!=='task'||t.kind==='memory'&&!t.concealed)return previous;
        if(t.kind==='choice'&&!t.choices.includes(action.value))return previous;
        const correct=t.kind==='money'?Object.entries(s.input.coins).reduce((sum,[c,n])=>sum+Number(c)*n,0)===t.answer:t.kind==='memory'?s.input.sequence.join(',')===t.answer.join(','):action.value===t.answer;
        if(correct)complete(s,t.attempts?'retry':t.hintUsed?'hint':'independent',now);
        else t.attempts++;
        break;
      }
      case 'claim':if(s.phase!=='encounter')return previous;{const e=encounter(s);reward(s,e[0],e[1],e[2]);}break;
      case 'purchase':{
        if(!['ready','reward','finished'].includes(s.phase))return previous;
        const catalog=action.category==='facilities'?FACILITIES:action.category==='decorations'?DECORATIONS:action.category==='animals'?ANIMALS:null;
        if(!catalog||!Object.hasOwn(catalog,action.item)||s.park[action.category].includes(action.item))return previous;
        const cost=catalog[action.item][2],balance=action.category==='facilities'?s.supplies:s.park.stars;if(balance<cost)return previous;
        if(action.category==='facilities')s.supplies-=cost;else s.park.stars-=cost;
        s.park[action.category].push(action.item);break;
      }
      case 'upgrade':if(!['ready','reward','finished'].includes(s.phase)||s.supplies<4||s.baseLevel>=3||!Object.hasOwn(BASES,action.style))return previous;s.supplies-=4;s.baseLevel++;s.baseStyle=action.style;break;
      case 'continue':if(s.phase!=='reward')return previous;s.phase=s.turn===TOTAL?'finished':'ready';s.task=null;s.encounter=null;s.outcome=null;break;
      default:return previous;
    }
    s.revision++;
    return s;
  }
  function archive(history,s,now=Date.now()) {
    const h=validHistory(history)?clone(history):{version:1,events:[],games:[]};
    for(const e of s.events)if(!h.events.some(v=>v.id===e.id))h.events.push(clone(e));
    h.events=h.events.slice(-600);
    if(s.phase==='finished'){
      const game={id:s.id,stars:s.stars,baseLevel:s.baseLevel,baseStyle:s.baseStyle,at:now};
      const i=h.games.findIndex(g=>g.id===s.id);if(i<0)h.games.push(game);else h.games[i]={...game,at:h.games[i].at};
    }
    h.games=h.games.slice(-100);return h;
  }
  function nextJourney(previous,now=Date.now()){if(!validState(previous))throw Error('無法讀取樂園');const s=create(previous.character,now);s.park=clone(parkOf(previous));s.supplies=previous.supplies;s.baseStyle=previous.baseStyle;s.baseLevel=previous.baseLevel;return s;}
  const api={FACILITIES,DECORATIONS,ANIMALS,parkOf,nextJourney,KEY,HISTORY_KEY,TOTAL,TYPES,INFO,CHARACTERS,BASES,STAGES,dirs,create,act,archive,validState,validHistory,encounter};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PlanetBoard=api;
})(typeof window==='undefined'?{}:window);
