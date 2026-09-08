(function () {
  const E=window.PlanetBoard;if(!E)return;
  const details=document.createElement('details');details.className='parent-records';
  const summary=document.createElement('summary');summary.textContent='探險棋 · 家長學習紀錄';details.appendChild(summary);
  const content=document.createElement('div');details.appendChild(content);document.getElementById('menu').appendChild(details);
  function paragraph(text){const p=document.createElement('p');p.className='learning-note';p.textContent=text;content.appendChild(p);}
  function render(){
    content.replaceChildren();
    try{
      const raw=localStorage.getItem(E.HISTORY_KEY),saved=raw?JSON.parse(raw):null;
      if(saved&&!E.validHistory(saved))throw Error('invalid history');
      const current=JSON.parse(localStorage.getItem(E.KEY)||'null');
      const h=current&&E.validState(current)?E.archive(saved,current):saved||{events:[],games:[]};
      paragraph('完成 '+h.games.length+' 趟旅程，累積 '+h.events.length+' 個學習任務。與原本學科闖關分開記錄，不影響解鎖與難度。');
      for(const subject of ['math','chinese','english','focus']){
        const events=h.events.filter(e=>e.subject===subject);
        paragraph(E.INFO[subject][1]+'：獨立 '+events.filter(e=>e.mode==='independent').length+' 次｜提示後完成 '+events.filter(e=>e.mode==='hint').length+' 次｜重試後完成 '+events.filter(e=>e.mode==='retry').length+' 次｜看示範 '+events.filter(e=>e.mode==='demo').length+' 次。');
      }
      paragraph('保留最近 100 趟完整旅程與 600 個任務。這是練習紀錄，不是能力診斷。');
    }catch{paragraph('目前無法讀取探險棋紀錄，請先下載備份並保留原本資料。');}
  }
  details.addEventListener('toggle',()=>{if(details.open)render()});render();
})();
