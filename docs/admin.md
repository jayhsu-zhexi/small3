# 管理小屋第一版

- 入口 `/admin`。台灣時間當天 `YYYYMMDD` 為密碼；由伺服器檢查，不在瀏覽器判斷。
- 可調首頁名稱與說明、16 款遊戲的首頁順序、顯示／隱藏及新遊戲標籤。隱藏只影響首頁入口，不封鎖直接遊戲網址。
- 右側為即時草稿預覽；預覽不儲存，按「儲存並套用」才更新。至少保留一款遊戲；名稱24字、說明90字。設定版本避免不同視窗互相覆蓋。
- 不更動孩子的本機進度、題庫、分數與獎勵。第一版不含孩子資料與帳號管理。

## 登入與保護

日期密碼很容易猜到，不適合私密資料管理。依使用者指定保留日期密碼，搭配每個來源十分鐘最多十次登入、伺服器簽名 HttpOnly / SameSite=Strict Cookie、正式環境 Secure Cookie、同站 Origin 與自訂標頭檢查。登入最多八小時且跨台灣午夜失效。簽名金鑰不從日期推算，不能放在前端或公開檔案。

## 本機

`node scripts/serve.cjs --port 4201`，打開 `http://127.0.0.1:4201/admin`。

設定與隨機簽名金鑰保存在被 Git 忽略的 `.local-admin/`，不在公開檔案清單，不進 dist；伺服器重啟仍保留。這是本機共享檔案，不是瀏覽器 localStorage，也不是正式雲端資料。

## Vercel 正式儲存

新增 `api/site.js` 使用 Vercel Node Function，讀寫 Redis REST API。正式環境禁止退回暫存磁碟：缺少連線時回503，前台維持原本首頁，後台不會假裝儲存成功。

由專案的 Storage／Marketplace 接上 Upstash Redis，並設定伺服器環境變數：

- `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`，亦相容 `KV_REST_API_URL`、`KV_REST_API_TOKEN`。
- `ADMIN_SESSION_SECRET`：至少32字元的隨機金鑰，透過 Vercel 環境變數設定；不可提交版本庫。

正式 Redis key `small3:site-settings:v1`、預覽 `small3:site-settings:v1:preview` 保存設定，沒有過期時間；登入限流使用十分鐘過期key。儲存使用 Lua 原子比較 revision 後寫入。變更不需要重新建置前台，下一次開啟首頁讀取共用設定。發布前須在實際 Vercel 帳號確認已有儲存空間、方案與授權，再驗證跨裝置儲存。

查閱官方資料（2026-11-01）：
- Vercel Storage / Marketplace：https://vercel.com/docs/marketplace-storage
- Vercel Redis：https://vercel.com/docs/redis
- Upstash Free方案目前標示250MB、每月500K指令；仍以帳號建立畫面為準：https://upstash.com/pricing/redis
- REST API：https://upstash.com/docs/redis/features/restapi

2026-11-01 已從使用者登入的 Vercel 實際確認：團隊 Hobby，現有 upstash-kv-gray-mountain（Upstash for Redis）為 Free／Available，已連接 fund-nav-bot，尚未連接 small3。新增 Redis 的實際方案清單僅提供 Pay As You Go 與固定月費，無第二個免費選項。使用者已授權連接現有免費資料庫。已從 Vercel 資料庫 Projects 畫面確認 small3 的 Preview、Production 均已連接；fund-nav-bot 原有的 Production、Preview、Development 連接仍保留。方案維持 Free，未新增或購買資料庫。已將 ADMIN_SESSION_SECRET 以 Secret 類型設在 Production、Preview；正式與預覽環境採用不同設定key，預覽修改不會影響正式首頁。發布前以真實雲端讀寫驗證。

## 驗證

`node scripts/test-admin.cjs`：台灣跨日密碼、過期登入、未授權存取、Cookie竄改、跨站拒絕、登入限流、本機重啟保留、公開設定讀取、無效資料、舊版本及同時寫入。

瀏覽器實際操作：登入、調整排序、隱藏、新遊戲標籤、儲存、另一個頁面讀取更新，最後還原測試修改。手機390×700、電腦1440×900、iPad直768×1024／橫1024×768，無水平溢出，儲存列保持可見。以上為瀏覽器模擬，未使用實體iPad。

## 發布檢查
- 日期密碼、伺服器登入與跨日失效、登入限流、CSRF、Cookie竄改、Vercel已解析JSON body、無效設定與同時寫入測試。
- 設定載入／儲存失敗會保留草稿並顯示訊息，重新登入保留未儲存修改；不同視窗版本不一致時拒絕覆蓋。

雲端預覽實測已通過：Vercel Preview Function 正確載入伺服器模組、日期密碼登入、共用 Redis 讀寫、首頁文字／排序／隱藏／新遊戲標籤、新分頁讀取與後台重載保留。測試後還原預覽設定。正式與預覽資料使用不同key，不影響另一個既有專案。
