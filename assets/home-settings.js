(()=>{'use strict';const S=SiteSettings,menu=document.getElementById('menu'),grid=menu.querySelector('.game-grid');
const cards=new Map(S.games.map(g=>[g.id,menu.querySelector(`.game-library a[href="${g.href}"]`)]));
function apply(value){let config;try{config=S.validate(value);}catch{return;}
 menu.querySelector('h1.title').textContent=config.home.title;menu.querySelector('p.intro').textContent=config.home.intro;
 for(const game of config.games){const card=cards.get(game.id);if(!card)continue;card.hidden=!game.visible;card.classList.toggle('managed-hidden',!game.visible);card.querySelector('.admin-new-badge')?.remove();if(game.isNew){const badge=document.createElement('span');badge.className='admin-new-badge';badge.textContent='新遊戲';card.append(badge);}grid.append(card);}
}
if(new URLSearchParams(location.search).get('admin-preview')==='1'&&parent!==window){
 document.body.classList.add('admin-home-preview');
 document.addEventListener('click',e=>{if(e.target.closest('a,button')){e.preventDefault();e.stopPropagation();}},true);
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='small3-admin-preview')apply(e.data.config);});
 parent.postMessage({type:'small3-admin-preview-ready'},location.origin);
}else fetch('/api/site?action=public',{cache:'no-store',signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(data=>{if(data?.config)apply(data.config);}).catch(()=>{});
})();
