# 地理探險任務（臨時段考遊戲）

本機入口：`http://127.0.0.1:4174/geography`，執行 `node scripts/serve.cjs --port 4174`（`npm run dev` 預設為 4173）。

依 `docs/previews/geography-reference.webp` 製作，背景由原示意圖以 ImageGen 移除文字及控制項後產生，再轉成 WebP。地圖、經緯線、標記、按鈕和文字皆為可互動的 HTML / SVG。

目前三站各 8 題：位置與方向、經緯度定位、地圖判讀。初次進入先顯示示意圖的「找出補給站」，左側可自由切換各站。此為待確認教材範圍的試玩內容，尚未對照特定出版社或學校考試章節。

進度獨立存在 `small3-temporary-geography-v1`，包含完成題目、首次獨立答對、提示與重試紀錄，不併入原學科、樂園或備份。

2026-10-09 重複題修正：經緯度站保留四道座標定位，另四道改為讀取緯線、經線、赤道與比較距離赤道，不再重問相同座標。重新載入、切換任務與下一題只接續未完成的題目；完成的站顯示成果，全程完成後需確認重新開始才會清除進度並重玩。舊存檔保留其餘 20 題的完成紀錄，只重新開放已替換的四題（索引 12–15）。題庫保持三站各八題。

日後移除：刪除 `geography.html`、六個 `assets/geography-*` 檔案；移除 `index.html` 中 `/geography` 卡片、`scripts/build.cjs` 的 geography files.push、`scripts/serve.cjs` 的 geography 路由、`vercel.json` 的兩條路由及排除項、`package.json` 的地理測試及 `scripts/test-geography.cjs`。最後執行 `npm run build`。本機遺留的獨立進度不影響其他遊戲。

## 驗證

已通過完整 npm run build。瀏覽器走完全部 24 題，確認錯答重試、解答、三枚徽章、首次獨立答對紀錄與重新載入保存；另確認手機可直接點選地圖標記。390px 與 320px 排版沒有水平溢出。實際畫面保存為 docs/previews/geography-desktop.jpg 與 geography-mobile.jpg。
