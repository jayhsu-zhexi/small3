const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/geography-engine.js','utf8'),context);const G=context.Geography;
assert.equal(G.bank.length,40);
assert.equal(new Set(G.bank.map(q=>q.prompt)).size,40,'Every question has a distinct prompt');
assert.equal(G.bank.filter(q=>q.kind==='coordinate').length,2);
assert.equal(G.bank.filter(q=>q.kind==='coordinate-reading').length,6);
assert.equal(G.routes.length,5);
for(let r=0;r<G.routes.length;r++)assert.equal(G.bank.filter(q=>q.route===r).length,8);
for(const q of G.bank){assert.equal(new Set(q.choices).size,4);assert(q.choices.includes(q.answer));assert(q.hint&&q.explanation);}
// Independently checked answers, including cross-equator differences, the shorter longitude arc,
// inverse scale, linear enlargement, area ratios and minutes rather than decimal hours.
const expected=['東北方','西南方','東方','西方','東北方','東方','補給站的經緯度','西南方','B','C','西南方','60°','120°','南半球，西經 60°','40°','向北 60°，向東 120°','2 公里','3 公分','1：60,000','1：50,000','16 倍','90 分鐘','2 公分','36 分鐘'];
assert.equal(G.bank.slice(0,24).map(q=>q.answer).join('|'),expected.join('|'),'Original question IDs and answers remain unchanged');
const lesson2Expected=['西北方','北緯 24°、東經 121°','先往西南，再主要往南','臺灣位於中國大陸東南側','甲在回歸線北側，乙在南側','前者相對位置，後者絕對位置','三地皆在臺灣地區，花蓮在本島','板橋區是新北市的一部分','海拔差異會造成氣溫差異','海平面下降，陸地連結增加','位在南北遷徙路線上的中繼位置','乙符合臺灣特有種的條件','交流減少，長期可能演化出特有種','聯繫東北亞與東南亞的海空通道','原料供應與產品出口都可能延誤','多種棲地提供不同生物生存條件'];
assert.equal(G.bank.slice(24).map(q=>q.answer).join('|'),lesson2Expected.join('|'));
assert.equal(G.bank.filter(q=>q.kind==='taiwan-region').length,8);assert.equal(G.bank.filter(q=>q.kind==='taiwan-impact').length,8);
assert.equal(G.points.find(p=>p.label==='B').lat,G.points.find(p=>p.label==='A').lat/2);
assert.equal(G.points.find(p=>p.label==='B').lon,G.points.find(p=>p.label==='A').lon*2);
assert(G.points.find(p=>p.label==='C').lat<0&&G.points.find(p=>p.label==='C').lon<0);
assert(G.valid(G.fresh()));assert(!G.valid({...G.fresh(),index:40}));assert(!G.valid({...G.fresh(),answers:{99:true}}));assert(!G.valid({...G.fresh(),hinted:[-1]}));
const progress={...G.fresh(),index:8};progress.answers[8]=true;assert.equal(G.nextPending(progress),9);
progress.answers[10]=false;progress.index=9;assert.equal(G.nextPending(progress),11,'Skip already completed questions');
progress.index=15;progress.answers[15]=true;assert.equal(G.nextPending(progress),9,'Wrap to unfinished questions only');
for(let n=8;n<16;n++)progress.answers[n]=true;
assert.equal(G.nextPending(progress),null,'Completed route must show results instead of replaying');
for(let n=0;n<40;n++)progress.answers[n]=true;
assert.equal(G.pending(progress).length,0,'A completed journey has no automatic replay');
const originalAnswers=Object.fromEntries(Array.from({length:24},(_,n)=>[n,n!==2]));
const old={...progress,answers:originalAnswers,bankRevision:2,hinted:[1,12],mistakes:[2,13]};const restored=G.restore(old);
assert.equal(Object.keys(restored.answers).length,0);assert.equal(restored.index,0);assert(restored.upgradeNotice);
assert.equal(Object.keys(restored.previousRounds[0].answers).length,24);assert.equal(restored.previousRounds[0].hinted.join(','),'1,12');assert.equal(restored.previousRounds[0].mistakes.join(','),'2,13');assert.equal(Object.keys(old.answers).length,24,'Migration must not mutate input');
assert.equal(G.restore({...old,bankRevision:undefined}).previousRounds[0].bankRevision,1);
assert.equal(G.restore(restored).previousRounds.length,1,'Reload must not archive the same round twice');
assert.equal(Object.keys(G.restore(progress).answers).length,40,'Current saves retain every completed question');
const firstLesson={...G.fresh(),index:23,answers:originalAnswers,lesson2Revision:undefined,hinted:[2],mistakes:[2]};
const expanded=G.restore(firstLesson);assert.equal(Object.keys(expanded.answers).length,24);assert.equal(expanded.answers[2],false);assert.equal(expanded.hinted[0],2);assert.equal(expanded.mistakes[0],2);assert.equal(expanded.previousRounds.length,0);assert(expanded.lesson2Notice);assert.equal(G.pending(expanded).length,16);
// Exercise the actual UI handlers with saved progress, including reload and route switching.
function mount(saved,enter=true){
  const elements=new Map();let stored=JSON.stringify(saved);
  const element=()=>({style:{},children:[],hidden:false,disabled:false,textContent:'',innerHTML:'',setAttribute(){},replaceChildren(){this.children=[]},append(child){this.children.push(child)},querySelectorAll(){return []},showModal(){this.open=true},close(){this.open=false}});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
  const ui={Geography:G,document:{getElementById:get,createElement:element},localStorage:{getItem(){return stored},setItem(key,value){stored=value}}};
  vm.createContext(ui);vm.runInContext(fs.readFileSync('assets/geography-ui.js','utf8'),ui);
  if(enter)get('routes').children[G.bank[G.restore(saved).index].route].onclick();
  return {get,save:()=>JSON.parse(stored),answer(){const state=JSON.parse(stored),q=G.bank[state.index];get('choices').children.find(b=>b.textContent===q.answer).onclick();get('confirm').onclick()}};
}
let ui=mount({...G.fresh(),index:8});ui.answer();assert.equal(ui.save().answers[8],true);
ui=mount(ui.save());assert.equal(ui.save().index,9,'Reload after answering must continue with an unfinished question');
ui.get('routes').children[1].onclick();assert.equal(ui.save().index,9,'Switching back does not replay answered questions');
ui.get('backToTopics').onclick();assert(ui.get('questionView').hidden);assert(!ui.get('topicMenu').hidden);assert.equal(ui.save().answers[8],true,'Returning to menu retains answers');ui.get('routes').children[4].onclick();assert.equal(ui.save().index,32,'Topic menu opens lesson 2');assert(!ui.get('questionView').hidden);assert(ui.get('topicMenu').hidden);
const mixed={...G.fresh(),index:14,answers:{15:true}};ui=mount(mixed);ui.answer();ui.get('confirm').onclick();assert.equal(ui.save().index,8,'Next skips a completed last question and wraps to unfinished work');
ui=mount(progress);assert.equal(ui.get('result').hidden,false,'A completed save loads the results');
ui.get('routes').children[1].onclick();assert.equal(ui.get('result').hidden,false,'A completed route stays on results');
ui.get('continueRoute').onclick();assert.equal(ui.get('restartDialog').open,true,'Replay requires the restart dialog');assert.equal(Object.keys(ui.save().answers).length,40);
ui.get('acceptRestart').onclick();assert.equal(Object.keys(ui.save().answers).length,0);
ui=mount(old);assert.match(ui.get('feedback').textContent,/舊版成果已保留/);assert.equal(ui.save().bankRevision,3);assert.equal(ui.save().previousRounds.length,1);
ui=mount(ui.save());assert.equal(ui.save().previousRounds.length,1);ui.get('restart').onclick();ui.get('acceptRestart').onclick();assert.equal(ui.save().previousRounds.length,1,'Restart retains archived results');
ui=mount(firstLesson);assert.match(ui.get('feedback').textContent,/第2課/);assert.match(ui.get('progressText').textContent,/24 \/ 40/);assert.equal(ui.get('routes').children.length,5);assert(!ui.get('badges').innerHTML.includes('undefined'));assert.equal(ui.save().answers[2],false);ui.get('continueRoute').onclick();assert(!ui.get('topicMenu').hidden,'Finishing a topic returns to selection');ui.get('routes').children[3].onclick();assert.equal(ui.save().index,24,'Lesson 2 starts without resetting previous answers');
ui.answer();ui.get('confirm').onclick();ui=mount(ui.save());assert.equal(ui.save().index,25);assert.equal(Object.keys(ui.save().answers).length,25);assert(!ui.save().lesson2Notice);
const menu=mount({...G.fresh(),index:14,answers:{8:true}},false);assert(menu.get('questionView').hidden,'Reload always starts at topic selection');assert(!menu.get('topicMenu').hidden);assert.equal(menu.get('routes').children.length,5);menu.get('routes').children[1].onclick();assert.equal(menu.save().index,14,'Selected topic resumes its saved unfinished question');menu.get('backToTopics').onclick();menu.get('routes').children[1].onclick();assert.equal(menu.save().index,14);
// Finish the real UI across all five routes; every question must appear once.
ui=mount(G.fresh());const seen=new Set();
for(let n=0;n<40;n++){const index=ui.save().index;assert(!seen.has(index),'No automatic repeated question');seen.add(index);assert(ui.get('map').innerHTML.includes('<svg'));assert(!ui.get('map').innerHTML.includes('NaN'));if(index>=2&&index<=4)assert(ui.get('map').innerHTML.includes(`rotate(${G.bank[index].northAngle})`));if(index>=8&&index<16){assert(ui.get('map').innerHTML.includes('120°W'));assert(ui.get('map').innerHTML.includes('40°S'));}if(index>=24)assert(!ui.get('map').innerHTML.includes('geography-map.webp'),'Real regional diagrams must not reuse fictional coastline artwork');ui.answer();ui.get('confirm').onclick();if(ui.get('result').hidden===false&&n<39){ui.get('continueRoute').onclick();if(!ui.get('topicMenu').hidden){const pending=G.pending(ui.save())[0];ui.get('routes').children[G.bank[pending].route].onclick();}}}
assert.equal(seen.size,40);assert.equal(Object.keys(ui.save().answers).length,40);ui.get('continueRoute').onclick();assert(ui.get('restartDialog').open);
ui=mount({...G.fresh(),index:16});assert(ui.get('map').innerHTML.includes('2.4＋1.6'));assert(!ui.get('map').innerHTML.includes('圖上 4 公分'),'Map must not precompute the route sum for the learner');
const {build,files}=require('./build.cjs');assert(files.includes('geography.html'));assert(files.includes('assets/geography-backdrop.webp'));
const {createServer}=require('./serve.cjs');const {once}=require('node:events');
(async()=>{const server=createServer();try{server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;for(const route of ['/geography','/geography/','/geography.html']){const res=await fetch(origin+route);assert.equal(res.status,200);assert.match(await res.text(),/id="missionTitle"/);}for(const asset of ['geography.css','geography-ui.js','geography-engine.js','geography-backdrop.webp'])assert.equal((await fetch(origin+'/assets/'+asset)).status,200);console.log('PASS: geography questions, coordinates, scale conversions, save validation and preview routes');}finally{server.closeAllConnections();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
