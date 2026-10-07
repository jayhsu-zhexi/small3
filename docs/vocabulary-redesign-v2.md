# 原稿外觀重製 v2

驗證：npm run build 通過全套測試；Chrome 已確認首頁、水果主題選擇、正常教學前進和離開／重新探險流程。390×690 教學畫面無捲動（pageWidth=390、pageHeight=690，下一步按鈕底部約 578）。實際手機截圖：docs/previews/vocabulary-home-v2.png、docs/previews/vocabulary-lesson-v2.png。2026-10-07 使用者確認將此新版發布至正式網站。

圖像素材：world（森林）、parts（狐狸／木牌／圖鑑）、themes（主題卡插畫）、objects（透明單字圖示），均存於 assets/vocabulary-*-v2.webp。

透明圖集中四排的實際高度不一致，渲染依原圖 1402×1122 的排界 0、320、610、847、1122 計算背景位置與比例，以免顯示鄰排圖形。森林背景與所有控制／卡片仍分開繪製。

objects 提示詞：Create a TRANSPARENT-background production vocabulary sprite atlas matching the whimsical watercolor storybook soft clay illustration style of the supplied reference, not realistic photography. Exactly FIVE columns and FOUR rows, twenty equally sized square cells, aligned exact grid, no visible borders, no labels, no text. Each subject centered with at least 12 percent completely transparent safe margins. Each cell only specified subject, with no cream backing square, no scenery, no props, only a soft small contact shadow. Row1 cat, dog, rabbit, bear, elephant. Row2 lion, panda, duck, pig, monkey. Row3 apple, banana, orange fruit, grapes, strawberry. Row4 watermelon slice, pineapple, pear, peach, cherry. Adorable recognizable full subjects, matching children's vocabulary app original visual mockup, smooth rounded forms, warm pastel textures, illustration quality. Transparent alpha background is essential.

以最初雙手機設計圖為視覺基準：滿版童話森林、木製標題招牌、較大狐狸、兩欄主題插畫、亮橙色立體按鈕、發音藍色按鈕與葉片裝飾的教學卡。

保留三個已可玩的主題與 30 個單字。原稿另外三個主題在此版本明確標示「準備中」，不能點選，不會假裝已有內容。所有標題、狀態和按鈕仍為可讀取文字；插畫由分開的素材呈現。生成使用內建 ImageGen，參考原設計圖，原始 PNG 保留不覆寫。

## world

檔案：`assets/vocabulary-world-v2.webp`

Create a production background illustration for the children's English learning app in the supplied reference. MATCH the reference illustration style: whimsical watercolor storybook with rounded soft toy forms, hand-painted foliage, warm cream and mint green, sunlight, flowers, charming miniature world; NOT photorealistic. Portrait 9:16 full bleed scene without phone bezel. Top 42 percent: lovely lush forest clearing with blue sky, winding sunny path, wooden fence, stepping stones; leave top 12 percent quiet sky for a wooden title panel and foreground left space for a separate fox. Bottom 58 percent: warm very light creamy clearing, uncluttered for six UI tiles and buttons, with illustrated flowers, bushes, rocks along extreme left and right edges and lush illustrated bottom border. No fox, no animals, no text, no UI, no words, no numbers. Crisp high quality game illustration. Reference is visual style only; do not reproduce its UI.

## parts

檔案：`assets/vocabulary-parts-v2.webp`

Production transparent PNG sprite sheet for the English learning game shown in reference. Match its charming watercolor storybook and soft clay illustration style, NOT realistic fur. Exactly THREE equal square columns and TWO equal square rows, six isolated elements, no borders or text, transparent background, each element entirely contained in its cell with at least 10 percent transparent gutter all around. Top row: 1) full body happy orange fox explorer wearing mint scarf and small backpack, waving, 2) the identical fox jumping with happy closed eyes, 3) identical fox pointing right enthusiastically. Bottom row: 1) blank broad honey-colored wooden hanging title sign with mint leaves and ropes, landscape sign inside square cell, 2) blank small rustic wooden signpost with three stacked planks with foliage at base, 3) ornate open storybook icon in warm tan leather. NO letters, NO words, NO extra props with foxes. All foxes same scale and visual identity. Reference shown for style only.

## themes

檔案：`assets/vocabulary-themes-v2.webp`

Production illustration atlas for the theme-selection cards in the supplied English vocabulary game reference. EXACTLY TWO columns and THREE rows of equally sized rectangular cards; total six cells, clean aligned grid, NO visible border, no text, no labels, no words. Each cell illustration leaves top 25 percent quiet and empty for HTML title labels. Cute watercolor storybook soft rounded toy-like forms, match reference illustration style, cream, pastel blue, mint, honey and peach palette. Row1 left: elephant panda rabbit group with mint forest background; Row1 right: shiny red apple yellow banana grapes orange on pastel yellow orchard background. Row2 left: colorful rainbow arch and fluffy clouds on pastel blue background; Row2 right: adorable child waving with hands near cheeks on soft peach background. Row3 left: cute blue backpack, pencil, teddy mug on yellow background; Row3 right: cute toy car, blue train and plane on sky blue background. Illustrations fill bottom 75 percent, generous safe margins, each subject wholly inside own cell. Atlas full image aspect ratio 1:1, each cell ratio 3:2. Reference is visual style only; no phone or full UI.
