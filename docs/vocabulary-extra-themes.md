# 單字森林：六個可遊玩主題

新增身體、生活用品、交通工具，各 10 個單字；總題庫 60 個。
每次認識 5 個單字，再進行 10 題聽音選圖／看圖選字挑戰。保留既有圖鑑和貼紙紀錄。

身體：eye、ear、nose、mouth、hand、foot、arm、leg、hair、teeth。
生活用品：book、pencil、backpack、cup、chair、table、bed、clock、key、umbrella。
交通工具：car、bus、train、airplane、boat、bicycle、truck、taxi、helicopter、motorcycle。

新增 30 段英文及 30 段繁體中文 WAV，使用 Windows Zira en-US／Hanhan zh-TW，單聲道 22050 Hz。語音名單見 vocabulary-new-audio.json。

三份透明插圖由 imagegen 生成，參考 vocabulary-objects-v2.webp 的繪本風格，使用 5 欄 × 2 列精靈圖；圖片以無損 WebP 打包。生成提示與來源見 vocabulary-extra-art.json。
所有新圖片及音訊列入 scripts/build.cjs 靜態資產清單。圖鑑總數改為由題庫計算。

驗證：六主題選取、每主題 10 字、雙語音訊完整、每輪五字十題、圖鑑紀錄延續與靜態資產打包。
