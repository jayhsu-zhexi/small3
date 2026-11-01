const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup({supported=true,reject=false,prefixed=false}={}){
 const events={},nodes={},calls=[];
 const get=id=>nodes[id]??=( {textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this[k]=f},showModal(){this.open=true},close(){this.open=false;this.closeEvent?.()},focus(){this.focused=true}} );
 const root={},doc={documentElement:root,getElementById:get,addEventListener(k,f){events[k]=f}};
 const change=()=>events[prefixed?'webkitfullscreenchange':'fullscreenchange']();
 if(supported){doc[prefixed?'webkitFullscreenEnabled':'fullscreenEnabled']=true;root[prefixed?'webkitRequestFullscreen':'requestFullscreen']=async function(options){assert.equal(this,root);calls.push(options);if(reject)throw Error('denied');doc[prefixed?'webkitFullscreenElement':'fullscreenElement']=root;change();};doc[prefixed?'webkitExitFullscreen':'exitFullscreen']=async function(){assert.equal(this,doc);doc[prefixed?'webkitFullscreenElement':'fullscreenElement']=null;change();};}
 vm.runInNewContext(fs.readFileSync('assets/length-fullscreen.js','utf8'),{document:doc});return{nodes,doc,events,calls};
}
(async()=>{
 for(const prefixed of [false,true]){const h=setup({prefixed}),b=h.nodes.fullscreen;assert.equal(b.attrs['aria-pressed'],'false');assert.equal(h.calls.length,0,'Never enter on load');await b.onclick();assert.equal(h.calls.length,1);assert.equal(h.calls[0].navigationUI,'hide');assert.equal(b.attrs['aria-pressed'],'true');assert.equal(h.nodes.fullscreenLabel.textContent,'退出全螢幕');await b.onclick();assert.equal(b.attrs['aria-pressed'],'false');await b.onclick();h.doc[prefixed?'webkitFullscreenElement':'fullscreenElement']=null;h.events[prefixed?'webkitfullscreenchange':'fullscreenchange']();assert.equal(b.attrs['aria-pressed'],'false','External exit updates label');}
 const absent=setup({supported:false});await absent.nodes.fullscreen.onclick();assert(absent.nodes.fullscreenHelp.open);assert.match(absent.nodes.fullscreenHelpText.textContent,/不支援/);
 const denied=setup({reject:true});await denied.nodes.fullscreen.onclick();assert(denied.nodes.fullscreenHelp.open);assert.match(denied.nodes.fullscreenHelpText.textContent,/沒有允許/);assert.equal(denied.nodes.fullscreen.disabled,false);assert.equal(denied.nodes.fullscreen.attrs['aria-pressed'],'false');
 const blocked=setup();blocked.doc.fullscreenEnabled=false;await blocked.nodes.fullscreen.onclick();assert.equal(blocked.calls.length,0);assert(blocked.nodes.fullscreenHelp.open);
 console.log('PASS fullscreen: gesture-only standard/prefixed entry and exit, browser exit synchronization, unsupported/denied feedback, enabled-policy checks and no stuck button.');
})().catch(e=>{console.error(e);process.exitCode=1});
