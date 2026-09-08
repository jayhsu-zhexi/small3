# 學習星球大冒險

正式入口：https://small3.vercel.app

## 星球探險棋

新遊戲：https://small3.vercel.app/board

24 格環形地圖、三個角色，每局 12 次擲骰；數學硬幣托盤、國語閱讀、英文朗讀選物、森林記憶路線。
完成學習任務獲得 2 建材，獨立首次完成額外獲得 1 星。提示、重試與示範皆可前進，不扣分、不倒退。
驚喜、休息與建設格提供建材；每 4 建材升級一次，三種基地造型，最高 3 級。

`board.html` / `assets/board.css` / `assets/board-ui.js` 是畫面，`assets/board-engine.js` 是純狀態轉換與存檔驗證。
`npm run dev` 與 `npm test` 會從原遊戲題庫產生 `assets/board-bank.js`（不提交生成檔），避免兩份題庫分歧。
狀態和家長紀錄使用 `learning-planet-board-v1` / `learning-planet-board-history-v1`，不改原學科的星星、解鎖與難度。
擲骰落點先保存再播放移動；刷新會回到同一任務。家長紀錄按任務 ID 去重。
備份格式升至 v2，包含探險棋；匯入舊 v1 備份時保留現有探險棋資料。

中央插畫以內建 ImageGen 製作，存於 `assets/board-island.png`。提示：square polished 3D clay floating green island in deep indigo space, friendly blue-and-orange space outpost, large tree, cozy animal house, warm lights, no text or UI.

## 開發與部署

首頁與原學科遊戲入口是 `index.html`，探險棋是 `board.html`，備份工具是 `assets/backup.js`。
Node.js 22.13 以上即可執行，不需安裝第三方套件。

- `npm run dev`：在 http://127.0.0.1:4173 預覽正式遊戲原始碼；修改後重新整理。
- `npm test`：執行出題、闖關、故事、存檔、備份與靜態網站測試。
- `npm run build`：先通過全部測試，再產生 `dist`。
- `npm start`：預覽 `dist`，與部署產物一致。

Vercel 連結 `main`，依 `vercel.json` 執行上述 build；測試失敗會阻止新部署。
GitHub Actions 在 push / pull request 驗證同一流程，Pages 保留手動備援發布。
既有 `app/`、`components/`、Vinext 設定及依賴是早期 React 版本，保留供參考，
不參與本機預覽或正式部署。修改遊戲請從 `index.html` 開始。
`.openai/hosting.json` 保留原 Sites 專案資訊，本次發布目的地為 Vercel。

## 進度備份

首頁「進度備份與正式入口」可下載 JSON，包含四科存檔、學習紀錄、解鎖與三個故事。
匯入會先驗證檔案，顯示摘要；確認後取代這個網址的遊戲資料，其他網站資料不受影響。
匯入前先下載目前進度，方便還原。資料處理只在瀏覽器內完成，不上傳。
不同網址的 localStorage 不共用，請固定使用正式網址；單次部署網址只適合驗收。
舊的不可變部署不會收到新備份介面。舊部署若已有重要紀錄，先保留原網址，
不要清除資料；需要另外協助搬移，不能只靠跳轉保留進度。
