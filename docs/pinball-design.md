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
