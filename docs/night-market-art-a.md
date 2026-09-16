# 夜市彈珠台 A：經典夜市精品

採用內建 imagegen 產生獨立圖集；沒有使用整張設計稿作為球台底圖。

## 專案素材

- `assets/night-market-materials-a.webp`：四格材質圖集，左上胡桃木、右上深綠台面、左下黃銅、右下深木紋。
- `assets/night-market-sprites-a.webp`：四格透明元件圖集，左上釘座、右上玻璃彈珠、左下琥珀燈、右下螺絲。
- `assets/night-market-art.js`：依現有物理座標繪製元件、碰撞火花、落槽光圈、金色粒子與分數。

PNG 來源位於 `C:/Users/jayhs/.codex/generated_images/01a07fcd-78cb-7d31-86a1-3c39cbfadf14/`，檔名分別為 `exec-7c88f1aa-25a9-4514-98b0-7a91767e17fe.png`、`exec-e4b08186-6b09-4ce7-9093-830cdc1bdfaf.png`。轉存 WebP quality 90，元件保留 alpha。

## 最終生成提示

Material atlas:

Production game material texture atlas for premium traditional Taiwanese night-market marble pinboard. EXACT 2 by 2 grid of FOUR equally sized square swatches filling the whole square image edge-to-edge. No margins, no labels, no gaps, no objects, no lighting cast shadows, no perspective. Top-left: warm medium dark walnut fine horizontal woodgrain, tactile satin furniture finish, subtle irregular real grain, warm reddish chocolate. Top-right: very dark forest green fine enamel/felt playfield, barely perceptible fine speckle texture, even color, refined vintage arcade. Bottom-left: champagne brass softly brushed horizontal metal, subtle grain and warm ochre, not mirror reflective. Bottom-right: deep chocolate stained wood with delicate grain, considerably darker than top-left, refined cabinet. Flat front-on evenly lit scan-like usable textures. All four quadrant edges align precisely at image center. Rich restrained realistic materials, elegant and not grungy. This is a texture resource not a board mockup. High resolution square.

Sprite atlas:

Production 2D sprite atlas on genuinely TRANSPARENT BACKGROUND, square image, EXACT four equal cells in a 2 by 2 grid, no drawn grid lines, each object isolated at the exact center of its quadrant with generous transparent padding, all objects wholly within their own quadrant. Same overhead orthographic camera for all objects. Premium classic Taiwanese night-market pinboard: TOP LEFT a single champagne brass round pin bumper cap, machined beveled concentric collar, short domed stud seen from directly above, perfectly circular silhouette, subtle glint from upper left, rich shaded brass edge. TOP RIGHT a single perfectly round clear GLASS MARBLE viewed overhead, warm white crescent reflections and faint forest-green lower reflections, transparent glass core, circular silhouette with rim refraction, no extra stars. BOTTOM LEFT a single amber incandescent target lamp embedded in a round brass bezel, glowing golden glass center and precision machined ring, straight overhead. BOTTOM RIGHT a single aged champagne brass slotted mounting screw head, round with a straight slot, overhead. No text, no floor, no scene, no rectangular backgrounds, no drop shadows outside each object's own modest silhouette, no glow spilling across cells, no extra ornaments. Each object fills roughly 65 percent of its quadrant width. High-quality photorealistic game cutout assets with consistent warm lighting and physically convincing metal and glass.

## 動效約束

碰撞效果使用引擎提供的釘子位置；入槽使用實際球落點與結算分數。特效最多保留 28 組，軌跡最多 7 點，依遊戲時間更新，因此暫停時凍結。減少動態設定關閉碰撞火花、軌跡與散落粒子，保留得分提示。圖片失敗或尚未載入時使用向量材質替代，不阻擋操作。物理尺寸、95 顆對稱釘子、隨機目標及得分規則維持原狀。
