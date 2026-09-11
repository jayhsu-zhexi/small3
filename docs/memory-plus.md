# 自動補齊配對

首頁難度改為 16+、24+、32+、40+、52+，可用張數分別為 16–18、24–28、32–36、40–46、52–60，皆為偶數。依卡牌容器的實際可用寬高，在各難度範圍內選取完整矩形中牌面最大的配置；相同大小優先保留較少張數。保留 4:5 卡牌比例與原有 A/B/C 外觀。

手機直向（視窗寬度 ≤600px 且寬小於高）改用穩定配置：16+ 為 16 張／4×4、24+ 為 24 張／4×6、32+ 為 36 張／6×6、40+ 為 42 張／6×7、52+ 為 54 張／6×9。卡牌仍依可用高度縮放，首頁及開局不因網址列收合而切換張數或欄數。這也避免 32 張在高螢幕排成狹長 4×8、兩側大量留白。其他裝置及橫向保留上述自動配置。

已開始的任務轉到手機直向時，只有原本張數能整除建議欄數才套用該欄數；其餘使用原張數的完整矩形，不為套用新排列而補牌。自動測試涵蓋手機首頁多種初始高度、網址列收合、开局、重試與返回選單的 36 張／6×6 一致性。

首頁同步顯示本次實際張數、欄列、配對組數、護盾與時間。手機首頁使用不可見的同步排版量測，沿用實際任務標頭、狀態面板、操作列、安全區域及樣式；量測後立即恢復首頁並保留高度與焦點。桌面使用既有版面寬度與可用高度。

例如卡牌可用區域 358 × 518 像素的 40+ 任務會選 42 張、6 欄 × 7 列、21 組、76 點護盾、建議 5:00。

護盾為基礎護盾 × 實際張數 ÷ 基礎張數，向上取整。建議時間按相同比例增加，向上取到半分鐘。玩家手動調整過的時間（包括不限時）不隨畫面變動；換另一難度重新套用該難度建議時間。偏好新增 manualTime；舊紀錄的自訂時間及不限時會保留，與舊預設相同的時間視為自動模式。

開局固定實際張數和時間；轉向只使用該張數的整數因數重新排版，不新增、移除或重洗牌。網址列高度改變保留欄數。再挑戰一次保留同樣張數、護盾和時間；返回首頁再依當前畫面重新預覽。

每種圖案只有兩張；配完所有實際卡牌才通關。每組 100 分，連擊額外每次增加 25 分、上限 225 分；生存獎分仍分開顯示。最近 50 筆紀錄按實際張數與選定時間比較，保留舊紀錄。

自動測試涵蓋全部允許的張數、配對唯一性、完整通關與分數、10 種直橫向容器尺寸、首頁與开局數字一致、自訂時間保存、轉向／重試不改張數，以及新舊紀錄比較。未執行實體手機或瀏覽器視覺測試。

## 新增立體道具

以內建 imagegen 生成，參考原有 memory-equipment-2 圖集風格。新增頭盔、氧氣背包、機器人、太空靴四種道具，總計 30 種，最多支援 60 張。原始圖保存於 `assets/memory-equipment-3.png`，發布版本 `assets/memory-equipment-3.webp` 保留 1254 × 1254 尺寸，以品質 88 壓縮。2 × 2 圖集使用 CSS 定位，每組圖像一致；開始前等待四張必要圖集載入。

生成提示詞（內建工具，非 CLI）：

> Use case: stylized-concept. Asset type: one square sprite atlas for a children's science-fiction memory game. Input image is STYLE REFERENCE ONLY: match its polished dimensional 3D toy-like equipment, crisp silhouettes, cobalt-blue and white ceramic with orange metal accents, luminous cyan highlights, studio reflections, and flat dark navy background. Generate FOUR NEW objects in a precise invisible 2 by 2 layout of equal square cells. Top left: astronaut helmet with a large shiny gold visor. Top right: oxygen twin-tank backpack, two parallel white and cobalt cylinders with orange straps and visible hose. Bottom left: friendly small hovering robot with two luminous round eyes, rounded body and small side arms. Bottom right: one chunky futuristic space boot with blue armored sole, white upper and orange fastening. Each object centered exactly in its own quadrant, full object visible with generous equal margin on all sides, no overlaps, no contact with center seams. Consistent size, camera angle and visual weight. Solid perfectly uniform dark navy #072644 background across entire square; no floor, no backdrop gradients, no drop shadow outside object. No grid lines, no borders, no cards, no UI, no text, no letters, no numbers, no logos, no watermark. Exactly four distinct objects.
