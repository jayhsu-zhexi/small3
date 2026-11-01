(function(root){'use strict';
const games=[['vocabulary','單字探險樂園','🦊'],['length','公分毫米小工坊','📏'],['multiply','乘法小學堂','🐻'],['blocks','方塊消消樂','🟪'],['geography','地理探險任務','🧭'],['parcels','包裹小幫手','📦'],['crossing','小熊過馬路','🚦'],['detective','花園小偵探','🔎'],['board','星球探險棋','🎲'],['abacus','珠算練習室','🧮'],['kart','海岸甩尾 · 3D 卡丁車','🏎️'],['pinball','星際救援 · 彈珠台','🚀'],['night-market','夜市彈珠台 · 跑燈挑戰','🎯'],['memory','失聯太空站 · 翻牌配對','🃏'],['vault','金庫密碼 · 聽音轉鎖','🔐'],['survival','VOIDWATCH 基地生存','🛸']].map(([id,title,icon])=>({id,title,icon,href:id==='night-market'?'/pinball-night-market.html':'/'+id}));
function defaults(){return {version:1,revision:0,updatedAt:null,home:{title:'學習星球大冒險',intro:'第一次答對才有星星，拿到 5 顆星就能升級！'},games:games.map(g=>({id:g.id,visible:true,isNew:false}))};}
function validate(value){
 if(!value||value.version!==1||!Number.isSafeInteger(value.revision)||value.revision<0)throw Error('設定版本不正確，請重新載入。');
 const home=value.home;
 if(!home||typeof home.title!=='string'||!home.title.trim()||home.title.trim().length>24||typeof home.intro!=='string'||home.intro.trim().length>90)throw Error('首頁名稱最多 24 字，說明最多 90 字。');
 if(!Array.isArray(value.games)||value.games.length!==games.length)throw Error('遊戲清單不完整。');
 const ids=new Set();
 const list=value.games.map(g=>{if(!g||!games.some(x=>x.id===g.id)||ids.has(g.id)||typeof g.visible!=='boolean'||typeof g.isNew!=='boolean')throw Error('遊戲設定不正確。');ids.add(g.id);return {id:g.id,visible:g.visible,isNew:g.isNew};});
 if(!list.some(g=>g.visible))throw Error('至少保留一款遊戲顯示。');
 return {version:1,revision:value.revision,updatedAt:typeof value.updatedAt==='string'?value.updatedAt:null,home:{title:home.title.trim(),intro:home.intro.trim()},games:list};
}
const api={games,defaults,validate};
if(typeof module!=='undefined')module.exports=api;else root.SiteSettings=api;
})(typeof window==='undefined'?globalThis:window);
