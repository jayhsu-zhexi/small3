const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/geography-engine.js','utf8'),context);const G=context.Geography;
assert.equal(G.bank.length,120);
assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(G.bank.slice(0,72))).digest('hex'),'5fe5c17b000d8846621a89d50e388625cd3c3973da7504ba5484da07eeb67258','All previous 72 question IDs and content stay unchanged');
assert.equal(require("node:crypto").createHash("sha256").update(JSON.stringify(G.bank.slice(0,40))).digest("hex"),"343b3933462e2b2bd9118adab9a19a06d87495d7299130df2ac41d36c478e6cb","Original forty question indices and content stay unchanged");
assert.equal(new Set(G.bank.map(q=>q.prompt)).size,120,'Every question has a distinct prompt');
assert.equal(G.bank.filter(q=>q.kind==='coordinate').length,2);
assert.equal(G.bank.filter(q=>q.kind==='coordinate-reading').length,22);
assert.equal(G.routes.length,5);
for(let r=0;r<G.routes.length;r++)assert.equal(G.bank.filter(q=>q.route===r).length,24);
for(const q of G.bank){assert.equal(new Set(q.choices).size,4);assert(q.choices.includes(q.answer));assert(q.hint&&q.explanation);}
// Independently checked answers, including cross-equator differences, the shorter longitude arc,
// inverse scale, linear enlargement, area ratios and minutes rather than decimal hours.
const expected=['東北方','西南方','東方','西方','東北方','東方','補給站的經緯度','西南方','B','C','西南方','60°','120°','南半球，西經 60°','40°','向北 60°，向東 120°','2 公里','3 公分','1：60,000','1：50,000','16 倍','90 分鐘','2 公分','36 分鐘'];
assert.equal(G.bank.slice(0,24).map(q=>q.answer).join('|'),expected.join('|'),'Original question IDs and answers remain unchanged');
const lesson2Expected=['西北方','北緯 24°、東經 121°','先往西南，再主要往南','臺灣位於中國大陸東南側','甲在回歸線北側，乙在南側','前者相對位置，後者絕對位置','三地皆在臺灣地區，花蓮在本島','板橋區是新北市的一部分','海拔差異會造成氣溫差異','海平面下降，陸地連結增加','位在南北遷徙路線上的中繼位置','乙符合臺灣特有種的條件','交流減少，長期可能演化出特有種','聯繫東北亞與東南亞的海空通道','原料供應與產品出口都可能延誤','多種棲地提供不同生物生存條件'];
assert.equal(G.bank.slice(24,40).map(q=>q.answer).join('|'),lesson2Expected.join('|'));
assert.equal(G.bank.filter(q=>q.kind==='taiwan-region').length,24);assert.equal(G.bank.filter(q=>q.kind==='taiwan-impact').length,24);
assert.equal(G.points.find(p=>p.label==='B').lat,G.points.find(p=>p.label==='A').lat/2);
assert.equal(G.points.find(p=>p.label==='B').lon,G.points.find(p=>p.label==='A').lon*2);
assert(G.points.find(p=>p.label==='C').lat<0&&G.points.find(p=>p.label==='C').lon<0);
assert(G.valid(G.fresh()));assert(!G.valid({...G.fresh(),index:120}));assert(!G.valid({...G.fresh(),answers:{999:true}}));assert(!G.valid({...G.fresh(),hinted:[-1]}));
const progress={...G.fresh(),index:8};progress.answers[8]=true;assert.equal(G.nextPending(progress),9);
progress.answers[10]=false;progress.index=9;assert.equal(G.nextPending(progress),11,'Skip already completed questions');
progress.index=103;progress.answers[103]=true;assert.equal(G.nextPending(progress),9,'Wrap to unfinished questions only');
for(const n of G.routeIndices(1))progress.answers[n]=true;
assert.equal(G.nextPending(progress),null,'Completed route must show results instead of replaying');
for(let n=0;n<120;n++)progress.answers[n]=true;
assert.equal(G.pending(progress).length,0,'A completed journey has no automatic replay');
const originalAnswers=Object.fromEntries(Array.from({length:24},(_,n)=>[n,n!==2]));
const old={...progress,answers:originalAnswers,bankRevision:2,hinted:[1,12],mistakes:[2,13]};const restored=G.restore(old);
assert.equal(Object.keys(restored.answers).length,0);assert.equal(restored.index,0);assert(restored.upgradeNotice);
assert.equal(Object.keys(restored.previousRounds[0].answers).length,24);assert.equal(restored.previousRounds[0].hinted.join(','),'1,12');assert.equal(restored.previousRounds[0].mistakes.join(','),'2,13');assert.equal(Object.keys(old.answers).length,24,'Migration must not mutate input');
assert.equal(G.restore({...old,bankRevision:undefined}).previousRounds[0].bankRevision,1);
assert.equal(G.restore(restored).previousRounds.length,1,'Reload must not archive the same round twice');
assert.equal(Object.keys(G.restore(progress).answers).length,120,'Current saves retain every completed question');
const firstLesson={...G.fresh(),index:23,answers:originalAnswers,lesson1Revision:undefined,lesson2Revision:undefined,hinted:[2],mistakes:[2]};
const expanded=G.restore(firstLesson);assert.equal(Object.keys(expanded.answers).length,24);assert.equal(expanded.answers[2],false);assert.equal(expanded.hinted[0],2);assert.equal(expanded.mistakes[0],2);assert.equal(expanded.previousRounds.length,0);assert(expanded.lesson2Notice);assert.equal(G.pending(expanded).length,96);
const addedExpected=['太平洋 → 東海','巴士海峽','東西兩個海域標籤互換','北緯 23.5°、東經 121°','馬祖 → 澎湖 → 蘭嶼','臺灣地區部分海岸調查','板橋區旅客被重複計算','竹北市列在新竹縣之下','甲在基準西側，乙在東側','不同起點的西北方可能是不同地方','只有乙站','回歸線是緯線，氣候還受多種因素影響','不能，矩形框內也可能有海域','西北方','北緯 23°、東經 122°','向南 3°，向西 2°','補充能量的機會減少，遷徙更困難','甲仍可能是臺灣特有種','甲是特有種，乙少見不等於特有種','臺灣以外的自然分布資料','乙，因為物種種類較多','三種棲地都設樣區並記錄環境條件','可能往較高海拔移動，但不保證成功','候鳥停棲與其他生態功能也有保育價值','不一定，還要看物種的移動能力','檢疫並避免任意放生外來生物','兩者都是外來，乙有入侵危害證據','轉運也需要港口、設施與運輸聯繫','利用港口進行國際轉運','規劃替代航線並保留適當存量','先進口，再出口','比較交通效益與棲地影響，尋找減害方案'];
assert.equal(G.bank.slice(40,72).map(q=>q.answer).join('|'),addedExpected.join('|'));
const firstLessonAddedExpected=['西南方','南方','西方','西方','西南方','東北方','西北方','南方','西北方','西北方','西北方','東方','路程 600 公尺，回到起點','東方','東南方','東北方','B','在赤道上，位於西半球','B 與 C','同在一條緯線，經度不同','北緯 30°、西經 60°','南緯 20°、東經 30°','沿經線向南移動 40°','北緯 10°','西經 10°','同在北緯 20°，經度不同','甲緯度不變，乙經度不變','南緯 45°、西經 170°','30°','西經 120°','A 較小，相差 20°','乙 → 丙 → 甲'];
assert.equal(G.bank.slice(72,104).map(q=>q.answer).join('|'),firstLessonAddedExpected.join('|'));
// Independently calculate units, time, scale changes and area for the new scale problems.
const scaleAddedExpected=[`${15/10*40000/100} 公尺`,`${(2+3-3)*50000/100000} 公里`,`${2.5*80000/100000*2} 公里`,`${4.5/3*60+15} 分鐘`,`每小時 ${8*75000/100000/(90/60)} 公里`,`1：${(60000/0.5).toLocaleString('en-US')}`,`1：${(90000/1.5).toLocaleString('en-US')}`,`${(60000/20000)**2} 倍`,`1：${(800*100/3.2).toLocaleString('en-US')}`,'1：10,000',`${6-6*40000/120000} 公分`,`${6*50000/100000*(4*50000/100000)} 平方公里`,`1：${(80000/(2*0.5)).toLocaleString('en-US')}`,`${6*(100000/2)/100000} 公里`,'直線距離 5 公里，道路距離仍需測量',`${(2/4+4/8)*60} 分鐘`];
assert.equal(G.bank.slice(104).map(q=>q.answer).join('|'),scaleAddedExpected.join('|'));
const oldForty={...G.fresh(),index:31,lesson2Revision:1,answers:Object.fromEntries(Array.from({length:40},(_,n)=>[n,n!==30])),hinted:[25,34],mistakes:[30,36]};
const extended=G.restore(oldForty);assert.equal(Object.keys(extended.answers).length,40);assert.equal(extended.answers[30],false);assert.equal(extended.hinted.join(','),'25,34');assert.equal(extended.mistakes.join(','),'30,36');assert.equal(G.pending(extended).length,80);assert.equal(G.nextPending(extended),40,'Finished 04 continues with its first new question');extended.index=39;assert.equal(G.nextPending(extended),56,'Finished 05 continues with its first new question');assert.equal(extended.lesson2Revision,2);assert(extended.lesson2Notice);assert.equal(extended.previousRounds.length,0);
// Exercise the actual UI handlers with saved progress, including reload and route switching.
function mount(saved){
  const elements=new Map();let stored=JSON.stringify(saved);
  const element=()=>({style:{},children:[],hidden:false,disabled:false,textContent:'',innerHTML:'',setAttribute(){},replaceChildren(){this.children=[]},append(child){this.children.push(child)},querySelectorAll(){return []},showModal(){this.open=true},close(){this.open=false}});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
  const ui={Geography:G,document:{getElementById:get,createElement:element},localStorage:{getItem(){return stored},setItem(key,value){stored=value}}};
  vm.createContext(ui);vm.runInContext(fs.readFileSync('assets/geography-ui.js','utf8'),ui);
  return {get,save:()=>JSON.parse(stored),answer(){const state=JSON.parse(stored),q=G.bank[state.index];get('choices').children.find(b=>b.textContent===q.answer).onclick();get('confirm').onclick()}};
}
let ui=mount(oldForty);assert.equal(ui.save().index,40);assert.equal(ui.get('questionCount').textContent,'第 9 題 / 共 24 題');assert(ui.get('badges').innerHTML.includes('完成 8 / 24 題'));assert.equal((ui.get('badges').innerHTML.match(/badge earned/g)||[]).length,0,'Eight old answers must not finish a twenty-four-question route');ui.answer();ui.get('confirm').onclick();assert.equal(ui.save().index,41);ui=mount(ui.save());assert.equal(ui.save().index,41);ui.get('routes').children[4].onclick();assert.equal(ui.save().index,56);assert.equal(ui.get('questionCount').textContent,'第 9 題 / 共 24 題');assert.equal(Object.keys(ui.save().answers).length,41);
ui=mount({...G.fresh(),index:8});ui.answer();assert.equal(ui.save().answers[8],true);
ui=mount(ui.save());assert.equal(ui.save().index,9,'Reload after answering must continue with an unfinished question');
ui.get('routes').children[1].onclick();assert.equal(ui.save().index,9,'Switching back does not replay answered questions');
ui.get('mobileRoutes').value='4';ui.get('mobileRoutes').onchange();assert.equal(ui.save().index,32,'Mobile picker opens lesson 2');assert.equal(ui.get('mobileRoutes').value,'4');assert.equal(ui.get('mobileRoutes').children.length,5);ui.get('routes').children[1].onclick();assert.equal(ui.get('mobileRoutes').value,'1','Desktop and phone navigation stay in sync');
const mixed={...G.fresh(),index:14,answers:{15:true}};ui=mount(mixed);ui.answer();ui.get('confirm').onclick();assert.equal(ui.save().index,88,'Next skips a completed last question and wraps to unfinished work');
ui=mount(progress);assert.equal(ui.get('result').hidden,false,'A completed save loads the results');
ui.get('routes').children[1].onclick();assert.equal(ui.get('result').hidden,false,'A completed route stays on results');
ui.get('continueRoute').onclick();assert.equal(ui.get('restartDialog').open,true,'Replay requires the restart dialog');assert.equal(Object.keys(ui.save().answers).length,120);
ui.get('acceptRestart').onclick();assert.equal(Object.keys(ui.save().answers).length,0);
ui=mount(old);assert.match(ui.get('feedback').textContent,/舊版成果已保留/);assert.equal(ui.save().bankRevision,3);assert.equal(ui.save().previousRounds.length,1);
ui=mount(ui.save());assert.equal(ui.save().previousRounds.length,1);ui.get('restart').onclick();ui.get('acceptRestart').onclick();assert.equal(ui.save().previousRounds.length,1,'Restart retains archived results');
ui=mount(firstLesson);assert.match(ui.get('feedback').textContent,/任務01～03/);assert.match(ui.get('progressText').textContent,/24 \/ 120/);assert.equal(ui.get('routes').children.length,5);assert(!ui.get('badges').innerHTML.includes('undefined'));assert.equal(ui.save().answers[2],false);assert.equal(ui.save().index,104,'Finished original route continues to its new questions');ui.get('routes').children[3].onclick();assert.equal(ui.save().index,24,'Lesson 2 can still be selected without a reset');
ui.answer();ui.get('confirm').onclick();ui=mount(ui.save());assert.equal(ui.save().index,25);assert.equal(Object.keys(ui.save().answers).length,25);assert(!ui.save().lesson2Notice);
// A fully completed 72-question save keeps its answers and resumes the appended questions.
const oldSeventyTwo={...G.fresh(),lesson1Revision:undefined,index:71,answers:Object.fromEntries(Array.from({length:72},(_,n)=>[n,n!==7])),hinted:[7],mistakes:[7]};
ui=mount(oldSeventyTwo);assert.equal(Object.keys(ui.save().answers).length,72);assert.equal(ui.save().answers[7],false);assert.match(ui.get('feedback').textContent,/120題/);assert.equal((ui.get('badges').innerHTML.match(/badge earned/g)||[]).length,2);
for(const [route,index] of [[0,72],[1,88],[2,104]]){ui.get('routes').children[route].onclick();assert.equal(ui.save().index,index);assert.equal(ui.get('questionCount').textContent,'第 9 題 / 共 24 題');}
ui=mount(ui.save());assert.equal(ui.save().index,104);assert(!ui.save().lesson1Notice);assert.equal(ui.save().hinted.join(','),'7');assert.equal(ui.save().mistakes.join(','),'7');
// Finish the real UI across all five routes, including non-contiguous appended IDs; every question must appear once.
ui=mount(G.fresh());const seen=new Set();
for(let n=0;n<120;n++){const index=ui.save().index;assert(!seen.has(index),'No automatic repeated question');seen.add(index);const route=G.bank[index].route;assert.equal(ui.get('questionCount').textContent,`第 ${G.routeIndices(route).indexOf(index)+1} 題 / 共 ${G.routeIndices(route).length} 題`);assert(ui.get('map').innerHTML.includes('<svg'));assert(!ui.get('map').innerHTML.includes('NaN'));if(index>=2&&index<=4)assert(ui.get('map').innerHTML.includes(`rotate(${G.bank[index].northAngle})`));if(index>=8&&index<16){assert(ui.get('map').innerHTML.includes('120°W'));assert(ui.get('map').innerHTML.includes('40°S'));}if(G.bank[index].route>=3)assert(!ui.get('map').innerHTML.includes('geography-map.webp'),'Real regional diagrams must not reuse fictional coastline artwork');ui.answer();ui.get('confirm').onclick();if(ui.get('result').hidden===false&&n<119)ui.get('continueRoute').onclick();}
assert.equal(seen.size,120);assert.equal(Object.keys(ui.save().answers).length,120);ui.get('continueRoute').onclick();assert(ui.get('restartDialog').open);
ui=mount({...G.fresh(),index:68});assert(ui.get('map').innerHTML.includes('臺灣換船'));assert(!ui.get('map').innerHTML.includes('進口原料 → 生產'),'Transshipment diagram must not imply manufacturing');
ui=mount({...G.fresh(),index:16});assert(ui.get('map').innerHTML.includes('2.4＋1.6'));assert(!ui.get('map').innerHTML.includes('圖上 4 公分'),'Map must not precompute the route sum for the learner');
ui=mount({...G.fresh(),index:104});assert(ui.get('map').innerHTML.includes('圖上 15 毫米'));assert(!ui.get('map').innerHTML.includes('圖上 1.5 公分'),'Do not give away the millimeter conversion');
const {build,files}=require('./build.cjs');assert(files.includes('geography.html'));assert(files.includes('assets/geography-backdrop.webp'));
const {createServer}=require('./serve.cjs');const {once}=require('node:events');
(async()=>{const server=createServer();try{server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;for(const route of ['/geography','/geography/','/geography.html']){const res=await fetch(origin+route);assert.equal(res.status,200);assert.match(await res.text(),/id="missionTitle"/);}for(const asset of ['geography.css','geography-ui.js','geography-engine.js','geography-backdrop.webp'])assert.equal((await fetch(origin+'/assets/'+asset)).status,200);console.log('PASS: geography questions, coordinates, scale conversions, save validation and preview routes');}finally{server.closeAllConnections();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
