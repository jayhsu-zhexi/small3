(function(){
  'use strict';
  const E=window.PlanetBoard,$=id=>document.getElementById(id);let state=null,busy=false,broken=false;
  function el(tag,text='',className=''){const n=document.createElement(tag);n.textContent=text;n.className=className;return n;}
  function load(){try{const raw=localStorage.getItem(E.KEY);state=raw?JSON.parse(raw):null;if(state&&!E.validState(state))throw Error();broken=false;}catch{broken=true;$('detectiveSave').textContent='目前讀不到原來的進度，請先回首頁下載備份；不會取代原來的資料。';}}
  function send(type,extra={}){
    if(busy||broken)return;busy=true;
    try{
      const raw=localStorage.getItem(E.KEY),latest=raw?JSON.parse(raw):E.create();if(!E.validState(latest))throw Error('invalid');
      const signature=value=>{const t=value?.detective?.session;return t?[t.id,t.round,t.phase].join(':'):'';};
      if(signature(latest)!==signature(state)){state=latest;$('detectiveSave').textContent='已同步另一個分頁的案件，請看看目前的畫面再繼續。';busy=false;paint();return;}
      const next=E.act(latest,{type,...extra},null);if(next!==latest)localStorage.setItem(E.KEY,JSON.stringify(next));
      state=next;$('detectiveSave').textContent='✓ 已保存。回來會從同一個案件繼續。';
    }catch{$('detectiveSave').textContent='這一步暫時無法存檔，請保持頁面開啟，再按一次試試看。';}
    busy=false;paint();if(type!=='detectiveAnswer'||state?.detective?.session?.phase==='result')$('caseTitle').focus();else $('detectiveScene').children[0]?.children[extra.position]?.focus();
  }
  function grid(values,interactive,changed=[]){
    const board=el('div','','clue-grid');board.setAttribute('role','group');board.setAttribute('aria-label',interactive?'找出有變化的格子':'花園物品與位置');
    values.forEach((id,i)=>{const item=id?E.DETECTIVE_ITEMS[id]:['','草地'],cell=el(interactive?'button':'div','','clue-cell'+(changed.includes(i)?' found':''));
      cell.setAttribute('aria-label','第 '+(i+1)+' 格，'+item[1]+(changed.includes(i)?'，變化的位置':''));
      cell.append(el('small',String(i+1),'cell-number'),el('span',item[0],'clue-icon'),el('span',item[1],'clue-name'));
      if(interactive){cell.type='button';cell.onclick=()=>send('detectiveAnswer',{position:i});}
      board.appendChild(cell);
    });return board;
  }
  function explanation(c){const changed=c.before.map((id,i)=>id!==c.after[i]?i:-1).filter(i=>i>=0),from=changed.find(i=>c.before[i]),to=changed.find(i=>c.after[i]);
    return c.kind==='remove'?E.DETECTIVE_ITEMS[c.before[from]][1]+'原本在第 '+(from+1)+' 格，現在不見了。':c.kind==='add'?'第 '+(to+1)+' 格多了'+E.DETECTIVE_ITEMS[c.after[to]][1]+'。':E.DETECTIVE_ITEMS[c.before[from]][1]+'從第 '+(from+1)+' 格移到第 '+(to+1)+' 格。';
  }
  function records(){const wrap=$('detectiveRecords');wrap.replaceChildren();const list=state?.detective?.records||[];
    if(!list.length){wrap.appendChild(el('p','完成一局後，這裡會留下練習紀錄。'));return;}
    for(const r of list.slice(-10).reverse()){const section=el('section','','record-row');section.appendChild(el('h3',new Date(r.at).toLocaleDateString('zh-TW')+' · 完成 5 個案件'));
      const hints=r.results.reduce((n,c)=>n+c.hints,0),misses=r.results.reduce((n,c)=>n+c.attempts,0);section.appendChild(el('p','重看提示 '+hints+' 次 · 重新嘗試 '+misses+' 次'));
      for(const kind of Object.keys(E.DETECTIVE_KINDS)){const tasks=r.results.filter(c=>c.kind===kind);section.appendChild(el('p',E.DETECTIVE_KINDS[kind]+'線索：'+tasks.length+' 題，'+tasks.filter(c=>c.attempts>0).length+' 題曾重新嘗試。'));}wrap.appendChild(section);
    }
  }
  function paint(){
    const scene=$('detectiveScene'),action=$('caseAction'),hint=$('caseHint');scene.replaceChildren();hint.hidden=true;action.hidden=false;action.disabled=broken;records();
    const t=state?.detective?.session;$('caseFeedback').textContent='';
    if(!t){$('caseProgress').textContent='5 個小案件 · 沒有倒數';$('casePhase').textContent='準備出發';$('caseTitle').textContent='先觀察，再找線索';$('caseInstruction').textContent='先記住物品的位置。藏起原來的花園後，點出有變化的格子。物品不見了，就點它原本的位置。';scene.appendChild(grid(['rabbit',null,'ball',null,'apple',null,'hat',null,null],false));action.textContent='接下第一個案件 →';action.onclick=()=>send('detectiveStart');return;}
    $('caseProgress').textContent='案件 '+(t.round+1)+' / 5';
    if(t.phase==='finished'){
      $('casePhase').textContent='任務完成';$('caseTitle').textContent='五個案件，全都找到了！';$('caseInstruction').textContent='謝謝你仔細觀察！3 顆星星已放進樂園，可以邀請動物或換裝飾。';scene.appendChild(el('div','🦊 ⭐ ⭐ ⭐','detective-reward'));
      scene.appendChild(el('p','這趟重看 '+t.cases.reduce((n,c)=>n+c.hints,0)+' 次、重新嘗試 '+t.cases.reduce((n,c)=>n+c.attempts,0)+' 次。每次停下來看看，都是練習。'));
      const visit=el('a','去樂園看看朋友 →','secondary park-link');visit.href='/board';scene.appendChild(visit);action.textContent='再接 5 個新案件';action.onclick=()=>send('detectiveStart');return;
    }
    const c=t.cases[t.round];
    if(t.phase==='observe'){
      $('casePhase').textContent=c.hints?'重看線索':'觀察';$('caseTitle').textContent=c.hints?'再看看原來的位置':'慢慢看，記住這座花園';$('caseInstruction').textContent='記住有哪些物品、各在哪一格。準備好再按「我看好了」，沒有時間限制。';scene.appendChild(grid(c.before,false));action.textContent='我看好了，找線索 →';action.onclick=()=>send('detectiveLook');
    }else if(t.phase==='search'){
      $('casePhase').textContent='找線索';$('caseTitle').textContent='哪裡和剛剛不一樣？';$('caseInstruction').textContent='點有變化的格子。物品消失就點原本的位置；移動了，原位或新位置都可以。';scene.appendChild(grid(c.after,true));action.hidden=true;hint.hidden=false;hint.onclick=()=>send('detectiveHint');$('caseFeedback').textContent=c.attempts?'這個位置沒有變。可以慢慢找，或再看一次原來的花園。':'';
    }else{
      $('casePhase').textContent='找到線索';$('caseTitle').textContent='找到了！一起看看發生什麼事';$('caseInstruction').textContent=explanation(c);const changed=c.before.map((id,i)=>id!==c.after[i]?i:-1).filter(i=>i>=0),compare=el('div','','comparison');
      for(const [title,values] of [['原來的花園',c.before],['現在的花園',c.after]]){const part=el('section');part.append(el('h3',title),grid(values,false,changed));compare.appendChild(part);}scene.appendChild(compare);$('caseFeedback').textContent='框起來的就是線索。用提示也不會少拿星星。';action.textContent=t.round===4?'完成案件，收下 3 顆星星':'下一個案件 →';action.onclick=()=>send('detectiveNext');
    }
  }
  window.addEventListener('storage',event=>{if(event.key===E.KEY||event.key===null){load();paint();}});window.addEventListener('pageshow',event=>{if(event.persisted){load();paint();}});
  load();paint();
})();
