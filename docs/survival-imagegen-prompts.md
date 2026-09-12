# VOIDWATCH generated assets

Built-in image_gen mode. Exactly two generation calls.

## Design sheet

Path: exec-feeacb3b-9f3d-487f-8f4f-87fb29a56ecd.png

Use case: ui-mockup
Asset type: complete visual design sheet for a polished top-down sci-fi survival browser game, a design artifact for implementation.
Primary request: Two full screens vertically stacked: game-native home and live gameplay of "VOIDWATCH / 基地生存". Use a wide landscape screen aspect within each half of the tall sheet.
Home screen: dark industrial sci-fi atmosphere, commanding VOIDWATCH title and Traditional Chinese 基地生存 subtitle, five-minute mission intro "撐過五分鐘，守住最後的基地。", clear prominent "開始任務" button, concise WASD movement / mouse aiming and firing instructions plus touch twin-stick instructions. Mission duration 05:00 clearly emphasized. Rich top-down industrial base detail behind well-composed UI, real indie game main menu rather than a marketing website.
Live screen: dark industrial procedural floor corridors, crisp textured steel wall terrain and machinery, cyan armored survivor, orange/red enemy robots, cyan energy projectiles. Clear HP bar at top left, 05:00 countdown at top center, score at top right, minimap and pause control. Top-down orthographic gameplay scene; restrained glow; legible silhouettes.
Color palette: deep navy #07121b, cyan #72ebff, amber #ffbd69, danger coral #ff725e.
Style: polished detailed indie-game textures, readable functional UI, Traditional Chinese wording where feasible. No browser chrome, no photographic device, no watermarks, no gore.

## Production sprite atlas

Path: exec-167c7353-d897-4d76-898b-7eba51845ad2.png

Use case: stylized-concept
Asset type: production gameplay sprite atlas for top-down sci-fi survival browser game VOIDWATCH.
Output dimensions: exactly 1024x1024 pixels. A mathematically rigid 4 columns by 4 rows grid, each cell exactly 256x256 pixels, no gutters, no outer margin, no border, no text or labels.
Camera: top-down orthographic. All actors face right. Consistent realistic stylized detailed metal, cyan/amber rim light, crisp silhouettes.
Transparency: true transparent alpha background surrounding every actor/object in rows 0,1,2, except solid wall tile. No checkerboard painted in. Floor tiles in row 3 fully opaque and fill every pixel of their square cells. Center all other objects within their own cell with alpha padding; never cross cell boundaries.
Cell assignment, strictly left-to-right then top-to-bottom:
Row 0 (y=0..255): cyan armored survivor holding compact sci-fi energy rifle; orange melee four-legged scout robot; red ranged sentry robot; bulky purple heavy robot.
Row 1 (y=256..511): green medical crate with plus symbol; cyan shield battery; gold overdrive power cell with lightning symbol; tiny cyan supply beacon.
Row 2 (y=512..767): dark steel wall block fully filling square; industrial crate; glowing cyan reactor machine; hazard-striped barrier block.
Row 3 (y=768..1023): four seamless full-square dark blue steel floor tile variations with subtle seams/grates and no large symbols.
Dark navy #07121b floor palette, cyan #72ebff, amber #ffbd69, danger coral #ff725e. Functional terrain and entities in one atlas, no gore, no logos, no watermark.

## Inspection notes

Design sheet is 1536 x 1024 and contains the two requested screens stacked. Atlas is 1254 x 1254 despite requested 1024 x 1024; consumers should derive cell size from actual image width / 4 (313.5) or normalize at rendering time. Atlas has 4 x 4 arrangement; actors are oblique rather than strict top-down orthographic. All assigned entities and floor tiles are present.

