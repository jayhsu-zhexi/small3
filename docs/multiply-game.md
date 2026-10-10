# 乘法小學堂

本機入口 http://127.0.0.1:4175/multiply；正式路由 /multiply 已設定，經完整測試與建置後提交，供 GitHub 整合的 Vercel 自動部署。參考圖 docs/previews/multiply-reference.png。

## 功能與教學

暖身練習、進位挑戰、三位數挑戰、生活應用，每輪10題不重複。首次預覽24×3，後續新一輪重新抽題。題型依三年級 N-3-3 二、三位數乘一位數安排，含三位數十位為0，實際學校進度依課本另確認。

直式由個位向左填入，每格數字獨立；進位格可不填，若填入則檢查是否正確。可使用大數字鍵盤或實體鍵盤；手機數字鍵盤固定底部，不喚起另一套螢幕鍵盤。提示按位說明，包含上一位的進位，答錯可重試且保留輸入。答對須按下一題，全部完成後顯示成果；提示／重試不計獨立首次答對。切換已作答的輪次需確認，獨立 localStorage 儲存鍵 small3-multiply-practice-v1，壞存檔回復新一輪，儲存失敗仍可練習。

## 圖像

使用內建 imagegen，以原示意圖為參考：
- 背景提示：移除所有標題、側欄、題目、鍵盤、數字和UI；保留奶油色教室、窗戶、植物、書本與桌面，中央85%留白。輸出 assets/multiply-background.webp。
- 小熊提示：重製參考圖右下角的坐姿棕色毛絨小熊，正面、友善表情、真正透明背景，無文字或其他物件。輸出 assets/multiply-bear.webp。
- 筆盒提示：參考圖的單一藍色開口筆盒，八支可見粉彩色筆，前方空白奶油標籤，透明背景且無文字。輸出 assets/multiply-pencils.webp。
插畫均經WebP壓縮，小熊及筆盒保留透明度；標籤數字由HTML呈現。

## 驗證與限制

已通過 node scripts/test-multiply.cjs --offline（100輪題型／不重複／算式／進位／含0／存檔驗證）、node scripts/test-multiply-ui.cjs（40題各模式流程、數字鍵盤、實體輸入、進位、重試、提示、切換確認、成果與儲存失敗）、node scripts/test-learning.cjs、node scripts/test-backup.cjs。

瀏覽器已實際測試錯答重試、答對不自動換題、答對後重載、10題完成成果與重載、三位數提示、390px與320px手機的固定鍵盤和無橫向溢出。1536px桌面與原設計圖對照調整三欄比例及直式字體。

node scripts/build.cjs 成功輸出 dist，全部公開檔案與來源位元組一致。npm run build 未能完整通過：本次環境拒絕Node連線127.0.0.1（EACCES），導致HTTP路由測試受阻；並未略過正式CI測試。git add 被拒，因 .git/index.lock 唯讀權限，故無commit／push／Vercel部署。新 localhost 瀏覽器網址也遭拒絕存取，沒有改用替代方式繞過。

## 2026-10-10 部署驗證

權限恢復後重新執行 npm run build，完整測試（含 HTTP 路由）與 dist 建置全部通過；git diff --check 通過。先前的 Git 唯讀及連線限制已解除。正式入口 https://small3.vercel.app/multiply；部署完成後另核對公開 HTML、CSS、JS 及插畫與本次來源一致。
