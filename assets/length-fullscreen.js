(()=>{'use strict';
const button=document.getElementById('fullscreen'),label=document.getElementById('fullscreenLabel'),help=document.getElementById('fullscreenHelp'),root=document.documentElement;
let pending=false;
const active=()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement);
function sync(){const on=active();label.textContent=on?'退出全螢幕':'全螢幕';button.setAttribute('aria-label',on?'退出全螢幕':'進入全螢幕');button.setAttribute('aria-pressed',String(on));}
function explain(text){document.getElementById('fullscreenHelpText').textContent=text;help.showModal();}
button.onclick=async()=>{
  if(pending)return;
  const on=active(),action=on?(document.exitFullscreen||document.webkitExitFullscreen):(root.requestFullscreen||root.webkitRequestFullscreen);
  const allowed=root.requestFullscreen?document.fullscreenEnabled:document.webkitFullscreenEnabled;
  if(!action||!on&&allowed===false){
    explain('這個瀏覽器目前不支援全螢幕。仍可使用精簡版面繼續練習；也可以嘗試用 Safari 加入主畫面後開啟。');return;
  }
  pending=true;button.disabled=true;
  try{await action.call(on?document:root,...(on?[]:[{navigationUI:'hide'}]));}
  catch{explain(on?'暫時無法退出全螢幕，請使用瀏覽器的退出按鈕。':'瀏覽器沒有允許全螢幕。請直接點一次全螢幕按鈕重試；若仍無法開啟，可以繼續使用目前的精簡版面。');}
  finally{pending=false;button.disabled=false;sync();}
};
document.getElementById('closeFullscreenHelp').onclick=()=>help.close();
document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
help.addEventListener('close',()=>button.focus({preventScroll:true}));
sync();
})();
