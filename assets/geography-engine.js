(function(root){
  'use strict';
  const BANK_REVISION=3;
  const routes=[{title:'位置與方向',note:'旋轉方位・路線推理',icon:'△'},{title:'經緯度定位',note:'跨半球比較・座標推理',icon:'✥'},{title:'地圖判讀',note:'比例尺反推・距離應用',icon:'▧'}];
  const longitudes=[-120,-60,0,60,120],latitudes=[40,20,0,-20,-40];
  const points=[{label:'A',lon:60,lat:40},{label:'B',lon:120,lat:20},{label:'C',lon:-60,lat:-20},{label:'D',lon:-120,lat:0}];
  const bank=[];
  const directions=['東北方','東南方','西北方','西南方'],cardinals=['北方','東方','南方','西方'];
  const directionTasks=[
    {title:'更換觀察起點',prompt:'依照地圖，若以港口為起點，瞭望塔位於港口的哪個方向？',answer:'東北方',choices:directions,northAngle:0,from:'港口',to:'瞭望塔',hint:'把觀察中心移到港口，再看瞭望塔相對於港口的水平與垂直位置。',explanation:'瞭望塔在港口的右上方；指北標朝上，所以是東北方。'},
    {title:'更換觀察起點',prompt:'依照地圖，森林位於補給站的哪個方向？',answer:'西南方',choices:directions,northAngle:0,from:'補給站',to:'森林',hint:'方向要從補給站出發判讀，不能一直以營地為中心。',explanation:'從補給站看，森林在左下方；左是西、下是南，所以是西南方。'},
    {title:'旋轉指北標',prompt:'這張地圖的指北標朝右。從瞭望塔前往營地，主要是朝哪個方向移動？',answer:'東方',choices:cardinals,northAngle:90,from:'瞭望塔',to:'營地',hint:'北方在圖面右邊時，依北、東、南、西順時針推算其餘方位。',explanation:'北方朝右，東方就朝下。營地在瞭望塔下方，所以移動方向是東方。'},
    {title:'倒置地圖',prompt:'這張地圖的指北標朝下。補給站位於營地的哪個方向？',answer:'西方',choices:cardinals,northAngle:180,from:'營地',to:'補給站',hint:'先用指北標找北，再推算圖面右邊代表哪個方位。',explanation:'北方朝下時，東方朝左、西方朝右。補給站在營地右邊，所以是西方。'},
    {title:'旋轉後的斜向位置',prompt:'這張地圖的指北標朝左。從森林看，港口位於哪個方向？',answer:'東北方',choices:directions,northAngle:270,from:'森林',to:'港口',hint:'圖面左邊是北、上方是東；再以森林為觀察中心。',explanation:'港口在森林的左上方。左代表北、上代表東，因此是東北方。'},
    {title:'追蹤多段路線',prompt:'探險隊從營地向北走 300 公尺，再向東走 400 公尺，最後向南走 300 公尺。終點位於營地的哪個方向？',answer:'東方',choices:cardinals,northAngle:0,hint:'先把南北方向的路程相互抵銷，再比較東西方向。',explanation:'向北與向南都是 300 公尺，相互抵銷；只剩向東 400 公尺，所以終點在營地東方。'},
    {title:'位置資訊的可靠性',prompt:'營地搬家後，要讓新隊員仍能找到原本的補給站，哪一種資訊最不受營地搬遷影響？',answer:'補給站的經緯度',choices:['補給站在營地東方','從營地步行十分鐘','補給站的經緯度','補給站在營地右邊'],northAngle:0,hint:'想想哪項資訊不依賴營地的位置或旅行方式。',explanation:'經緯度屬於絕對位置。補給站本身沒有移動時，座標不會因營地搬遷而改變；相對方向與步行時間則可能改變。'},
    {title:'抵銷與合併位移',prompt:'從營地向北、向東各走 200 公尺，再向南、向西各走 400 公尺。終點位於營地的哪個方向？',answer:'西南方',choices:directions,northAngle:0,hint:'分別計算南北與東西方向最後各剩下多少路程。',explanation:'南北抵銷後剩向南 200 公尺，東西抵銷後剩向西 200 公尺，所以終點在西南方。'}
  ];
  directionTasks.forEach(q=>bank.push({route:0,kind:'direction',...q}));
  const coordinateTasks=[
    {title:'合併兩條定位線索',kind:'coordinate',prompt:'補給站在東半球與北半球。它的緯度是 A 點的一半，經度是 A 點的兩倍，請找出補給站。',answer:'B',choices:['A','B','C','D'],hint:'先讀出 A 點的經緯度，再把緯度除以 2、經度乘以 2。',explanation:'A 點是北緯 40°、東經 60°，所以目標是北緯 20°、東經 120°，也就是 B 點。'},
    {title:'由基準線找座標',kind:'coordinate',prompt:'目的地位於本初子午線以西 60°，赤道以南 20°。請點選符合兩項條件的位置。',answer:'C',choices:['A','B','C','D'],hint:'本初子午線是經度 0°、赤道是緯度 0°；西與南分別用 W、S 標示。',explanation:'本初子午線以西 60°是西經 60°，赤道以南 20°是南緯 20°，兩線交會在 C 點。'},
    {title:'跨半球判斷方向',kind:'coordinate-reading',prompt:'只根據經緯度判讀，C 點位於 A 點的哪個方向？',answer:'西南方',choices:directions,hint:'比較 C 與 A 的經度及緯度：哪一點較西？哪一點較南？',explanation:'A 是東經 60°、北緯 40°；C 是西經 60°、南緯 20°。C 較西且較南，因此在 A 的西南方。'},
    {title:'跨赤道計算緯度差',kind:'coordinate-reading',prompt:'A 點與 C 點的緯度相差幾度？',answer:'60°',choices:['20°','40°','60°','80°'],hint:'兩點分居赤道兩側，緯度差要把南北兩側的度數相加。',explanation:'A 是北緯 40°，C 是南緯 20°，兩點隔著赤道，緯度差為 40°＋20°＝60°。'},
    {title:'繞地球比較經度差',kind:'coordinate-reading',prompt:'把地球想成完整的一圈，D 點與 B 點之間較小的經度夾角是多少？',answer:'120°',choices:['60°','120°','240°','360°'],hint:'先算經度 0°這一側的跨度，再用 360°扣掉它，比較兩條弧的大小。',explanation:'D 是西經 120°、B 是東經 120°，經過 0°的跨度是 240°；另一側跨過 180°，跨度為 360°－240°＝120°，因此較小夾角為 120°。'},
    {title:'分辨半球與經緯度',kind:'coordinate-reading',prompt:'下列哪一項同時正確描述 C 點的半球與經度？',answer:'南半球，西經 60°',choices:['北半球，西經 60°','南半球，西經 60°','南半球，東經 60°','西半球，南緯 60°'],hint:'先確認 C 在赤道哪一側，再確認它在本初子午線哪一側；不要把經度與緯度交換。',explanation:'C 位於南緯 20°、西經 60°，所以在南半球與西半球；正確的經度描述是西經 60°。'},
    {title:'移動後重新比較',kind:'coordinate-reading',prompt:'A、C 兩隊都沿經線向赤道移動 10°，且都還沒越過赤道。移動後兩隊的緯度相差幾度？',answer:'40°',choices:['20°','40°','60°','80°'],hint:'A 在北半球，向赤道走時北緯減少；C 在南半球，向赤道走時南緯也減少。',explanation:'A 從北緯 40°變成北緯 30°，C 從南緯 20°變成南緯 10°；緯度差為 30°＋10°＝40°。'},
    {title:'規劃跨半球路線',kind:'coordinate-reading',prompt:'從 C 點出發，先沿經線、再沿緯線移動到 A 點。哪一組移動正確？（以經緯度變化量計）',answer:'向北 60°，向東 120°',choices:['向北 20°，向東 60°','向南 60°，向西 120°','向北 60°，向東 120°','向北 40°，向東 120°'],hint:'南緯到北緯要跨過赤道，西經到東經的這條路線要跨過本初子午線。',explanation:'C 的南緯 20°到 A 的北緯 40°需向北 60°；西經 60°到東經 60°需向東 120°。度數是角度變化，不是公里數。'}
  ];
  coordinateTasks.forEach(q=>bank.push({route:1,...q}));
  const scaleTasks=[
    {title:'多段路程與單位換算',calculation:'distance',scale:50000,cm:4,segments:[2.4,1.6],prompt:'比例尺 1：50,000。營地到橋梁在圖上是 2.4 公分，橋梁到補給站是 1.6 公分。沿這條路線走，實際總路程是多少？',answer:'2 公里',choices:['0.2 公里','2 公里','20 公里','200 公里'],hint:'先把兩段圖上路程相加，再乘比例尺分母，最後把公分換成公里。',explanation:'圖上總路程 2.4＋1.6＝4 公分；實際為 4×50,000＝200,000 公分，也就是 2 公里。'},
    {title:'由實際距離反推圖距',calculation:'map-distance',scale:120000,cm:'？',km:3.6,prompt:'比例尺 1：120,000。兩地的實際直線距離為 3.6 公里，在地圖上應相距幾公分？',answer:'3 公分',choices:['0.3 公分','3 公分','30 公分','4.32 公分'],hint:'先把 3.6 公里換成公分，再除以比例尺分母。',explanation:'3.6 公里＝360,000 公分。圖距＝360,000÷120,000＝3 公分。'},
    {title:'反推未知比例尺',calculation:'denominator',scale:null,cm:3,km:1.8,prompt:'地圖上相距 3 公分的兩地，實際相距 1.8 公里。這張地圖的比例尺是哪一個？',answer:'1：60,000',choices:['1：6,000','1：60,000','1：180,000','1：600,000'],hint:'把實際距離換成公分，再除以圖上距離，得到比例尺分母。',explanation:'1.8 公里＝180,000 公分；180,000÷3＝60,000，因此比例尺是 1：60,000。'},
    {title:'地圖放大後的比例尺',calculation:'enlargement',scale:100000,cm:2,factor:2,prompt:'原圖比例尺 1：100,000。把圖面長、寬都放大成原本的 2 倍，數字比例尺應改成哪一個？（圖中標示為放大前）',answer:'1：50,000',choices:['1：25,000','1：50,000','1：100,000','1：200,000'],hint:'同一段實際距離在紙上變成兩倍長，表示每 1 公分代表的實際距離減半。',explanation:'圖上長度乘以 2，比例尺分母就除以 2：100,000÷2＝50,000。數字比例尺需改為 1：50,000。'},
    {title:'比較涵蓋面積',calculation:'area',scale:25000,cm:4,otherScale:100000,prompt:'甲圖比例尺 1：25,000，乙圖 1：100,000。兩張地圖的紙張長、寬相同，忽略地球曲率，乙圖涵蓋的實際面積約是甲圖幾倍？',answer:'16 倍',choices:['2 倍','4 倍','8 倍','16 倍'],hint:'先比較實際長度的倍數；面積需要把長、寬的倍數相乘。',explanation:'乙圖每邊涵蓋的實際長度是甲圖的 100,000÷25,000＝4 倍，面積為 4×4＝16 倍。'},
    {title:'距離與步行時間',calculation:'time',scale:100000,cm:6,speed:4,prompt:'比例尺 1：100,000，路線在圖上長 6 公分。若每小時步行 4 公里、不休息，走完約需幾分鐘？',answer:'90 分鐘',choices:['24 分鐘','60 分鐘','90 分鐘','150 分鐘'],hint:'先算實際公里數，再用距離÷速度算小時，最後乘以 60。',explanation:'實際路程是 6 公里；6÷4＝1.5 小時，1.5×60＝90 分鐘。'},
    {title:'同一路段的兩張地圖',calculation:'comparison',scale:50000,cm:6,otherScale:150000,prompt:'同一路段在甲圖（1：50,000）長 6 公分，在乙圖（1：150,000）應長幾公分？',answer:'2 公分',choices:['2 公分','3 公分','6 公分','18 公分'],hint:'同一路段的實際距離不變。先由甲圖算實距，再除以乙圖分母。',explanation:'實距為 6×50,000＝300,000 公分；乙圖圖距＝300,000÷150,000＝2 公分。'},
    {title:'換算與旅行規劃',calculation:'time',scale:75000,cm:4,speed:5,prompt:'比例尺 1：75,000，路線在圖上長 4 公分。隊伍每小時走 5 公里、不休息，預計幾分鐘抵達？',answer:'36 分鐘',choices:['15 分鐘','24 分鐘','36 分鐘','60 分鐘'],hint:'100,000 公分才是 1 公里；算完距離後，用速度換算分鐘。',explanation:'路程＝4×75,000＝300,000 公分＝3 公里；時間＝3÷5×60＝36 分鐘。'}
  ];
  scaleTasks.forEach(q=>bank.push({route:2,kind:'scale',...q}));
  function fresh(){return {version:1,bankRevision:BANK_REVISION,index:0,answers:{},hinted:[],mistakes:[],previousRounds:[],upgradeNotice:false,selected:null,revealed:false}}
  function valid(s){return !!s&&s.version===1&&Number.isInteger(s.index)&&s.index>=0&&s.index<bank.length&&s.answers&&typeof s.answers==='object'&&!Array.isArray(s.answers)&&Object.entries(s.answers).every(([k,v])=>/^\d+$/.test(k)&&bank[+k]&&typeof v==='boolean')&&['hinted','mistakes'].every(k=>Array.isArray(s[k])&&s[k].every(n=>Number.isInteger(n)&&n>=0&&n<bank.length))}
  function pending(s,route){return bank.map((q,n)=>n).filter(n=>(route===undefined||bank[n].route===route)&&!Object.hasOwn(s.answers,n))}
  function nextPending(s){const indices=pending(s,bank[s.index].route);return indices.find(n=>n>s.index)??indices[0]??null}
  function restore(s){
    if(!valid(s))return fresh();
    const previousRounds=Array.isArray(s.previousRounds)?s.previousRounds.filter(r=>r&&[1,2].includes(r.bankRevision)&&r.answers&&typeof r.answers==='object'&&!Array.isArray(r.answers)&&Object.entries(r.answers).every(([k,v])=>/^\d+$/.test(k)&&+k<24&&typeof v==='boolean')).slice(-3):[];
    if(s.bankRevision!==BANK_REVISION){const result=fresh();result.previousRounds=[...previousRounds,{bankRevision:s.bankRevision===2?2:1,answers:{...s.answers},hinted:[...s.hinted],mistakes:[...s.mistakes]}].slice(-3);result.upgradeNotice=true;return result}
    return {...s,answers:{...s.answers},hinted:[...s.hinted],mistakes:[...s.mistakes],previousRounds,selected:null,revealed:false};
  }
  const api={routes,points,longitudes,latitudes,bank,fresh,valid,pending,nextPending,restore,BANK_REVISION};if(typeof module!=='undefined')module.exports=api;else root.Geography=api;
})(typeof globalThis!=='undefined'?globalThis:this);
