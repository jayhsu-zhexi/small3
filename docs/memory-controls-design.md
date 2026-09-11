# 圖像任務面板

`/memory` 的任務面板改用圖片與數字操作。卡牌圖選擇 16／24／32／40／52 張，計時器、護盾、配對卡牌對應三項任務資訊，火箭及播放符號用於開始。下方以不同卡牌 → 護盾 −1、連續配對 → 星星 +25 示意規則。

圖片都是可操作網頁的素材，沒有把整塊介面製成靜態截圖。數字會隨選擇更新；按鈕保留中文輔助標籤、滑鼠提示與鍵盤焦點。完整玩法仍由原本「玩法」按鈕開啟。

素材：`assets/memory-controls.png`，1536 × 1024、具透明度的 3 欄 × 2 列圖集。使用 imagegen 內建生圖產生一次，再以 CSS 顯示各格圖片；沒有裁切或重畫原圖。

## 最終生成提示詞

```text
Use case: stylized-concept
Asset type: production game UI icon sprite atlas for a navy and ice-cyan sci-fi survival memory game for children aged 8 and up.
Primary request: Generate ONE final image containing exactly SIX isolated game-item motifs in a precise THREE-column by TWO-row atlas. This is a brand-new asset, not an edit or a UI screenshot.
Scene/backdrop: Genuinely transparent background with alpha. No background scene, no solid background, no baked-in checkerboard, no grid lines, no dividers.
Composition/framing: Wide 3:2 canvas, target 1536 x 1024 pixels, exactly six equally sized SQUARE cells of 512 x 512 pixels arranged 3 columns and 2 rows. Each icon is perfectly centered in its own cell, with at least 12% empty padding on every side, equal apparent scale, no object or glow crossing into another cell. Positions by reading order:
1. Top-left: a fan of THREE thick metal memory cards with glowing cyan reactor-ring backs.
2. Top-middle: a futuristic ROUND STOPWATCH with clearly recognizable clock hands, a blue rim, and a small amber crown.
3. Top-right: a substantial protective SHIELD of silver and blue metal with a luminous cyan core.
4. Bottom-left: TWO IDENTICAL MATCHING card-shaped reactor modules side-by-side, unmistakably a matching pair, green-cyan glow.
5. Bottom-middle: a friendly compact ROCKET pointing diagonally up-right, bright warm amber/orange exhaust, launch energy, clean silhouette.
6. Bottom-right: a faceted FIVE-POINT GOLDEN REWARD STAR with restrained cyan rim light.
Style/medium: Consistent polished premium 3D game-item illustration, soft bevels, strong silhouettes, frontal or shallow isometric views, isolated graphic objects only. Readable at 80 pixels. Friendly and suitable for 8-year-olds.
Color palette and materials: Brushed silver and navy metal, cool luminous cyan, golden amber accents. Soft studio lighting with dimensional shading on the objects themselves.
Constraints: Exactly six motifs in the specified positions, one image only. No text, numbers, letters, labels, captions, logos, watermarks, buttons, interface panels, background scene, borders, grid lines, or extra objects. Preserve genuine transparency.
```
