# 失聯太空站：首頁第二版

首頁入口：<https://small3.vercel.app/memory>。

任務面板後續改為立體道具圖片與數字操作，最新面板設計及素材提示詞見 `memory-controls-design.md`。

以「太空救援任務艙」重新設計 `/memory` 的開始畫面：大型繁體中文標題、一對發光能源模組，以及下方整合牌數、任務時間、護盾、配對組數與啟動按鈕的操作面板。深海軍藍與冰青色延續遊戲風格，暖琥珀色用於主要啟動按鈕。手機改為直向操作面板，保留可以直接開始遊玩的完整控制。

主視覺由 imagegen 內建生圖工具產生一次，實際尺寸 1672 × 941。圖片只包含場景，所有標題、文字與按鈕都由網頁呈現，可以正常選取與操作。首頁新樣式集中於 `assets/memory-home.css`。

- 圖片：`assets/memory-home-v2.png`
- 第一版視覺稿：`docs/memory-visual.png`
- 遊戲規格與原始素材來源：`docs/memory-design.md`

## 最終生成提示詞

```text
Use case: stylized-concept
Asset type: ONE final full-bleed cinematic website game-start background; artwork only, not a UI mockup.
Primary request: Create polished premium 3D key art for an adventurous, hopeful science-fiction survival memory-matching game set at an orbital research station. Landscape 16:9; target 2048x1152 or higher.
Scene/backdrop: Quiet deep navy orbital space. An enormous beautiful, softly illuminated blue planet fills the distant right background. A beautiful intricate circular orbital research station spans the upper-right, with cool blue sunrise and a few subtle warm amber maintenance lights. Cinematic spatial depth, elegant engineering, atmospheric rim light.
Subject: In the foreground at right-center, exactly TWO clearly matching substantial brushed-metal rectangular energy modules, like thick card-shaped physical slabs, suspended just above an exterior maintenance console. The two modules have the SAME simple bright cyan reactor-ring symbol, visibly identical design and materials, with slight opposing perspectives. Their front faces remain readable. Distinct substantial silhouettes and crafted edge details; physical machinery integrated naturally into the scene, not floating interface cards. These paired objects visually establish the matching-energy-module rescue theme.
Style/medium: Sophisticated premium game concept artwork with polished 3D rendering, detailed but controlled, a convincing sense of scale, strong focal hierarchy.
Composition/framing: Carefully designed wide background. The LEFT 43 percent must be mostly clean very dark navy negative space for a real heading and short instructions to be added later. Keep all dominant visual subjects within the RIGHT 55 percent, with the main paired-module focal group centered approximately at x72 percent, y42 percent. Keep both modules entirely inside that focal region so they remain attractive when the image is cropped to its right half on mobile. The bottom 24 percent should be dark and subdued for a real horizontal mission setup dock to be added later. Keep the top edge subdued for real navigation. The console can emerge subtly from the lower-right, but must not fill the bottom with bright busy detail. Let the planetary limb and orbital station frame the matching modules with restrained cinematic depth.
Lighting/mood: Dramatic cinematic cool-blue rim light, subtle amber maintenance accents; quiet, adventurous, hopeful, suitable for ages 8 and above.
Color palette: Deep navy and midnight blue, ice cyan, a small warm amber accent.
Materials/textures: Brushed metal, precise mechanical seams, softly glowing cyan reactor-ring insets, sophisticated material reflections.
Constraints: ONE finished image. No text, no lettering, no numbers, no buttons, no logos, no watermarks, no borders, no mockup frame, no UI overlay. No people, no horror, no weapons, no distressed horror mood. Preserve the intentional dark left area and dark bottom area.
```
