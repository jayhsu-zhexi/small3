# 中文文字與發音

教學頁顯示英文與繁體中文名稱，提供英文發音、慢速英文、中文發音三個分開的按鈕。挑戰題作答前保留英文練習，答對後可重聽中文。完成畫面和已收藏單字都顯示中文名稱，可分開播放英文與中文。

新增 30 個繁體中文音檔：`assets/vocabulary-audio-zh/<word-id>.wav`，由已安裝的 Microsoft Hanhan Desktop（zh-TW）以 Rate=-1 生成，22.05 kHz、16-bit、單聲道。生成文字保存在 `docs/vocabulary-chinese-audio.json`。柳橙與橘色使用不同 ID，中文內容不共用英文 orange 的同一份音檔。

兩種語言共用停止／靜音機制，切換語言、切換題目、離開畫面或將分頁切到背景時會停止上一段發音。

驗證：npm run build 全套測試通過；控制器測試確認 30 個中文 WAV、三種發音切換、完成畫面中文名稱與中英文發音、圖鑑中文按鈕、靜音與離開停止。Chrome 390×690 已操作「中文發音」，頁面無捲動，下一步按鈕底部約 576。實際截圖：docs/previews/vocabulary-chinese.png。
