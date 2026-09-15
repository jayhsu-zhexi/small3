# 星際救援彈珠台

入口 `/pinball`，學習首頁有遊戲連結。延續已核准的深藍金屬、青藍能源、暖金擋板設計。首頁提供任務／練習模式，操作文字保留中文。

球台在首頁與遊玩時均保持正向。左右上方補回彎曲回球通道、斜向導流板，下方加上擋板旁的回球導軌；曲線一次取樣後由顯示與碰撞共用，避免只有裝飾沒有碰撞。能源碰撞器下移以留出通道空間。回球通道保持開口，測試覆蓋左右進球、反彈及離開通道。

任務模式三顆球，依序完成三個任務：碰到三座不同能源碰撞器；按 1→2→3 擊中數字目標（順序錯誤重新計數）；進入救援艙。完成數字任務會增加第二顆球；雙球時掉一顆不扣生命，最後一顆掉落才扣。每次發射後 8 秒救球保護，練習模式不限球數並循環任務。沒有任何學科或樂園存檔變更。

碰撞器 100 分、數字 150 分、三角彈射 25 分、救援艙 300 分；三項任務額外獎勵 1000／1500／2000 分。沒有計時失敗，讓孩子專注球的路徑和目標順序。

手機兩顆擋板按鈕支援多點觸控，按住抬起、鬆開落下。發射按鈕按住蓄力、鬆開發射。鍵盤使用左右方向鍵、空白鍵、P／Escape 暫停。pointercancel、失去捕捉、分頁隱藏與失焦皆清除按鍵狀態。暫停後必須明確按繼續。遊戲結束提供再玩一次、返回主選單。

物理以 480×860 固定座標運作，每秒 120 次更新，再細分至最多 1/240 秒碰撞步進。擋板為旋轉膠囊形碰撞體，碰撞含接觸點角速度，不依畫面寬高改變球速。渲染使用 Canvas 與原始圖集；桌面與手機按可用空間等比縮放球台，操作按鍵放在球台外。減少動態設定關閉尾光與粒子，保留必要球體移動。聲音沿用自製 Web Audio 音樂與太空合成音效，不使用外部音樂。首頁不啟用音訊或持續物理動畫。

自動檢查：完整任務、錯序目標、三球結束、保護期、雙球、練習循環、擋板速度傳遞、長時間碰撞數值穩定，以及實際 UI 邏輯的多點觸控、鍵盤蓄力、取消、暫停、背景中止、結果與選單。整站打包檢查包含新路由及圖片。未進行實體裝置試玩或瀏覽器視覺 QA。

## 正式素材（內建 imagegen）

- `assets/pinball-field.png` → `assets/pinball-field.webp`：971×1619 空白球台底板。
- `assets/pinball-parts.png` → `assets/pinball-parts.webp`：1536×1024 元件圖集，包含碰撞器、擋板、彈珠、三角彈射器、發射器、救援艙。

原始生成圖保存不覆寫，WebP 發布使用品質 90。生成器兩次透明背景請求均回傳不透明棋盤格，因此正式圖集改為深藍實底；Canvas 顯示時沿元件輪廓裁切，沒有把棋盤格當作透明資產發布，也沒有修改其他遊戲圖集。

底板提示詞：

> Use case: stylized-concept. Asset type: production pinball game EMPTY field background texture, portrait 3:5. Reference image is style and materials reference only. Create an orthographic directly top-down flat rectangular board, midnight navy polished ceramic with very faint sparse star specks, a subtle low-contrast orbital space station emblem at exact center, blue planet limb restricted to very bottom 12%, brushed titanium extremely thin perimeter border. Premium blue/cyan/amber material language matching reference. Interior 90% uncluttered dark navy. Border rectangular, no perspective. NO play components, NO ramps, NO rails, NO flippers, NO bumpers, NO plunger, NO balls, NO holes, NO buttons, NO text, NO labels, NO logos or watermark. This must be empty usable gameplay surface; all interactive components will be drawn later in software.

圖集提示詞：

> Use case: stylized-concept. Production pinball sprite atlas 1536x1024. Six isolated objects on perfectly UNIFORM SOLID midnight navy RGB(3,13,25) background. NO checkerboard. EXACTLY 3 columns and 2 rows of invisible equal 512x512 square cells. Every object fits inside a centered 340x340 box in its cell, even the flipper. Each object centered in its own cell. Row1: round cyan glass and titanium bumper; ONE HORIZONTAL straight amber titanium flipper circular pivot LEFT taper tip RIGHT (no diagonal tilt); round polished steel ball. Row2: triangular amber titanium slingshot pad pointing straight UP; vertical blue cylindrical spring plunger; mechanical scoop with round cyan rim. Top-down orthographic, consistent upper-left lighting, detailed premium realistic blue and amber metal. No text, no labels, no grid, no cast shadows, no glow outside silhouette. Reference is materials only; composition obey exact six-cell atlas layout. Solid flat navy background everywhere outside six objects.

中央擋板縮短並同步圖片比例，保留自然落球口；左軌入口加寬成漏斗。救援艙吸球後等待 2 秒遊戲時間，再從右軌下端向上射入，沿軌道回場；暫停時傳送倒數也停止，任務在傳送完成時計分。

右軌下降至出口時向中央導出，離開救援艙範圍前不重複吸球。左右外側移除封路導流板、內移三角反彈板，保留實際落球通道並標示落球方向；回歸測試涵蓋兩側各三個入口位置及無操作傳送後的自然落球。


## 球徑與動線重整
- 彈珠直徑 20、軌道厚度 14、擋板厚度 20；圖像裁切及碰撞共用尺寸，能源塔圖像不再超出實際碰撞圈。
- 回球袋形彎道直線段軌心相距 64，扣除軌道後淨寬 50；左入口向外張開，右側保留救援傳送及向中央導出的出口。
- 能源塔改為 (224,205,r30)、(180,345,r28)、(272,345,r28)，塔間與塔到軌道淨距均至少為球徑加 8，保留上方目標的進球空間。
- 三角反彈板加上與碰撞範圍一致的金屬邊框；保持兩側落球口與中央落球口。
- 新增以彈珠半徑膨脹障礙物的通道連通檢查，從下半場確認可到達兩側彎道、上方目標與救援艙；保留實際射入、回球、落球及不重複吸球的動態測試。


## 街機球台版本
使用者提供經典太空彈珠台照片作為機台結構與視覺密度參考。新版本採原創紫色太空印刷台面、金屬外框、高架環軌與發光方向燈，保持正向俯視操作。高架為独立運動層，向上射入入口後沿共享曲線行進 2.4 秒，完成加 500 分，接回右側回球軌。下方彈珠可從橋下通行；傳送、暫停、球數與既有任務均保留。

圖像使用內建 imagegen 生成，原始檔保存在 assets/pinball-cabinet-v2.png，網頁載入同名 WebP。原圖 937 × 1678，轉為 WebP quality 90，未裁切或改繪。此檔僅為平面印刷底圖，所有實際機械元件在遊戲中獨立繪製與運作。

### 圖像完整提示詞
Use case: stylized-concept
Asset type: production raster underlay artwork for a playable digital pinball field; flat printed artwork only, not a mockup.
Primary request: NEW ORIGINAL premium 1990s space arcade pinball lacquer artwork, portrait aspect ratio 480:860. Orthographic perfectly top-down rectangle, absolutely no perspective. Full-bleed game-ready image.
Scene/backdrop: rich dark indigo and violet base with a painted cosmic nebula and dense fine screenprinted texture. Upper 45% remains predominantly dark to leave room for code-rendered mechanical targets. Lower 25% is uncluttered dark violet.
Subject: an intricate painted spacecraft illustration centered at x50%, y57%; orbital circuit decals; subtle magenta, cyan, and gold arrow paths near the left and right sides; a flat printed central reactor medallion at x50%, y70%. All subjects and details are ink illustrations on one flat surface.
Style/medium: richly illustrated vintage space arcade cabinet print, sophisticated airbrush painting, luminous neon accents, polished lacquer print texture, crisp detailed spacecraft, restrained high-contrast highlights against navy purple. Rich and professional, not sparse vector art.
Composition/framing: portrait 480:860 proportions, edge-to-edge straight rectangular art. Thin metallic cabinet bezel only within outermost 3% perimeter. Large dark readable areas in upper 45% and lower 25% for gameplay overlays.
Constraints: NO physical raised obstacles, NO actual flippers, NO bumpers, NO rails, NO ball, NO UI, NO text, NO logos, NO numbers, NO lettering, NO scoreboard. No device, no surrounding frame, no screenshot, no perspective cabinet render. This image is only the illustrated flat playfield skin beneath separately rendered functional components. The metallic edge is confined to the outermost 3%; everything inside it is FLAT PRINTED ART.


## 依核准設計圖製作的固定元件版本
本版使用核准圖 exec-5bfd7564-b080-4b3c-9707-616d4368cfc6.png 作為固定元件母圖，透過內建 imagegen 精準移除銀球及兩支活動擋板。原圖和輸出均為909×1731。固定層保存 assets/pinball-approved-field.png，網頁使用同名 WebP (quality 92)。不再沿用上一版太空船底圖與自行重畫的環軌外形。
固定圖保留大迴環、左側短髮夾坡道、右侧發射道、中央三座主撞擊塔、四座輔助塔、反彈三角板及下方內外通道。動態層獨立繪製彈珠與雙擋板；固定坡道遮罩在下層球之上，坡道球則在上層。
碰撞按圖校準：球半徑8，軌道半厚4，擋板長65/半厚7；雙擋板軸心(148,709)、(335,709)。左短坡道入口(181,376)、出口(62,550)，2.4秒通行加500分。右救援艙(389,407)傳送至右迴環並導回中央。三座輔助小塔與左上大塔碰撞加50分。功能測試含全部主撞擊塔、救援次序、側邊/中央落球、短坡道、上下層隔離與暫停。

### 固定圖精準編輯提示詞（內建 imagegen）
Use case: precise-object-edit.
Asset type: fixed-layer background for an existing pinball game.
Input image 1 is the EDIT TARGET: the USER APPROVED complete purple space pinball board. This is a surgical removal edit, not a redesign.
Remove ONLY these three moving objects:
1. The single shiny silver ball sitting over the glowing circular reactor in the lower-middle of the board.
2. The left white/cream bat with thin gold rim at the very bottom, extending diagonally rightward toward the center drain.
3. The right white/cream bat with thin gold rim at the very bottom, extending diagonally leftward toward the center drain.
Remove each moving bat completely, including its gold rim and cast shadow, but KEEP the separate stationary gold mounting bases, the two red circular pivot buttons, silver outer mechanical details, and all other nearby hardware exactly as they are. Inpaint the vacated ball area with matching original glowing reactor artwork. Inpaint the vacated bat regions with continuous matching purple printed playfield artwork.
Strict invariants: preserve EXACT original image dimensions, framing, camera, border/cabinet, every fixed track, rails, bumpers, lights, targets, the left raised purple hairpin ramp and its geometry, fixed flipper bases and RED CIRCULAR PIVOTS, slingshots, outlanes, right plunger lane and spring, all printed art and colors outside these three small removal regions. Do not move, resize, straighten, simplify, recolor, add, or redesign any object. The result must be the same approved board with only the ball and TWO moving flipper bats absent. No new ball, no new flipper bats, no other changes.

發射通道校正：起球位置改為彈簧上方(448,686)，沿固定圖右側通道中心線向上至彎頭，再由朝內出口(366,436)連續進場。蓄力控制沿軌速度，出口沿曲線切線保留速度，沒有座標跳接。測試覆蓋三種蓄力、逐步移動連續性及出口方向。

發射路線依使用者更正：沿右側黃色外軌一路上行至頂冠(y48)，再向左轉、由頂部進入球場(y72)。取消先前中段出口。所有蓄力強度均測試必須到達頂端，不能在右側中途出軌。

右下反彈板卡球修正：僅朝向球場的正面能在有效撞擊速度下加力/加分，背面與底邊採有耗損的被動碰撞；修正板內穿入的推出方向，並將右板背緣碰撞角內收以保留足夠回球寬度。照片位置回歸測試驗證球可到達下方擋板、不反覆刷分且無操作時正常落球。

上方三個目標改為通道感應器：只在球進入時記分，不做圓形障礙碰撞、不施加反彈速度，停留不重複計分。左坡道出口延伸至內側回球道(96,590)，以向內速度回到左擋板；測試確認通道下落方向不反轉且坡道球會先碰到擋板，不會直接落入左外溝。

碰撞規則依使用者統一：一般牆面、軌道、三角板、外側輔助圓點及靜止擋板只做被動碰撞，恢復係數隨法向入射速度從0.18升至0.50，永不主動加能。只有中央三顆彈力球及運動中的擋板主動加力；發射與救援輸送機制保留。移除低速自動向上救援脈衝，改以位置校正維持球在左外牆的場內側。測試覆蓋低中高速度反彈衰減與既有回球路線。

台面外卡球修正：外邊界限制改在所有碰撞計算之後執行，補齊左上到左下連續邊界並保留球半徑安全距離。移除舊救援脈衝提示，頁面載入的遊戲程式加入版本標記。測試從多個左側高度與速度撞擊，逐步檢查球仍在台面邊界內。
