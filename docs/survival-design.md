# VOIDWATCH / 基地生存 — design and implementation brief

## Visual direction established before implementation

A top-down emergency-response game in a derelict space base. Deep navy architecture, cool cyan player and lighting, amber scavenged power, coral enemy fire. Mechanized enemies only; no blood or gore. The complete home/play visual sheet and production atlas are generated before the gameplay implementation and retained with their prompts.

Home: actual base view as the background, compact left-side mission panel with title, 05:00 objective, start, assisted-fire toggle, audio toggle, and mouse/keyboard/touch instructions. No marketing page before the game. Readable Chinese text is rendered as HTML, not baked into art.

Play: full-screen camera-following world. Persistent top HUD contains remaining time, health/shield and score; pause is reachable on every viewport. Bottom left is the movement stick on touch; bottom right is aim/fire plus a dash button. A small tactical map and current threat level sit away from the movement controls. Safe green supply glow and hostile red projectiles remain distinct from cyan player fire. Terminal overlay shows survived time, kills, score and restart; pause hides interactions and suspends time/audio.

Art: original 4×4 atlas containing survivor, three robot classes, three pickups, beacon, walls/crates/reactor/barrier and four floor surfaces. Sprites are top-down, face right and rotate with heading. Sprite generation is separate from the interface design sheet. Lights, targeting, projectiles, collision outlines and particles are functional procedural overlays.

## Functional contract

- Survive 300 active simulation seconds. Pauses and hidden tabs do not consume mission time. Restart generates a new connected base and resets all combat state.
- Connected random rooms and two-tile corridors, with no enemy/item inside solid geometry or immediately on top of the player.
- WASD/arrow movement, pointer aiming and held-button firing; space fires and Shift dashes. On touch, independent movement and aiming sticks support concurrent pointer IDs. Assisted fire is on by default and targets only visible enemies.
- Scouts chase through corridors; sentries approach into firing range and shoot with line of sight; heavy units move slowly and resist more damage. A bounded population and bounded projectiles/particles protect mobile performance.
- Collision and line of sight block both movement and shots through walls. Player damage has a short invulnerability interval. Dash has a visible cooldown and never teleports through walls.
- Medkits restore HP, shields absorb damage, overdrive temporarily increases fire rate. Finite pickups are also emitted as enemy drops; collection at full health does not consume a medkit unnecessarily.
- Time escalates enemy pressure. No network, real-world targets, purchases, login or microphone. Audio starts only from a user interaction, with best-effort iPad playback policy and complete cleanup on pause/exit.
- Score for robot eliminations and active survival time; win bonus is awarded exactly once. Optional local best is device-only and never modifies other games' saves.

## Verification plan

Seeded map connectivity across many seeds; collision boundaries; wall-blocked shots; AI routing and spawn exclusion; shield/invulnerability; all pickups; rate limits; pause/visibility timing; exact 300-second win and terminal immutability; retry reset; multitouch release/cancel; bounded objects after a full simulated run; syntax, public routes, full project build. Browser QA only if explicitly requested, per the current Sites skill.

## Verification completed

Full project build and regression suite passed. Survival tests cover 120 connected map seeds, physics and wall-blocked shots, damage and supplies, normalized movement, dash cooldown, pause/loss/win, and a 300-second stress simulation with test-only invulnerability (peak 38 enemies and 18 projectiles). Actual controller logic runs in a DOM harness covering independent two-finger controls, background cleanup, explicit back-forward resume, results, best score and new-map restart. Actual renderer runs with a mock Canvas at 320×568, 390×844, 1024×768 and 1280×720 with finite-coordinate assertions. Mock Web Audio checks lazy startup, single ambience, mute and cleanup. These are automated checks, not visual browser or physical iPad validation.

Generated production atlas is 1254×1254 with fractional cells derived at runtime; the separate design sheet is retained in this directory. All production image files live in the repository, with no dependency on generation-service URLs.

## Difficulty and rescue expansion

The menu defaults to Standard. Practice retains the gentle survival-only rules, eight starting supplies, and no chargers/objectives/boss. Standard starts with five supplies and adds three reachable, numbered rescue beacons. Challenge starts with three supplies, more pressure, 20% higher incoming damage, and a single 950-HP gatekeeper at 240 seconds. The gatekeeper uses the heavy-robot artwork with a larger scale, purple identifier and five-shot spread. Chargers reuse the scout family artwork with explicit red identification and a locked one-second warning line before a wall-stopped rush. The warning does not follow the player after lock-on; the rush has a recovery cooldown.

Five one-minute tiers increase spawn frequency and group size. Standard and Challenge introduce chargers from tier two and heavy mixed groups from tier three. Global population/projectile/pickup limits remain 38/160/16. Spawning units cannot take damage before their telegraph completes. Challenge reserves a population slot so the boss can spawn even during peak pressure.

Each rescue beacon takes four stationary seconds within its marked radius. Partial progress survives leaving or pausing, with a once-only 400-point completion award. At 300 seconds, missing beacons or a surviving required boss yield a specific failure explanation rather than a false win. Practice has no such gates. Minimap labels 1–3 identify beacons and B identifies the boss. Best scores use independent v2 difficulty keys; the original score is read only as a Practice fallback and is not deleted.

Additional tests cover 150 difficulty/map combinations, unique reachable objectives, monotonic pressure, retained progress and once-only rewards, explicit win/failure gates, charger warning lock and wall collision, one boss and defeat reward, full bounded five-minute Standard/Challenge simulations, renderer handling of new units, and real controller selection/restart/result/score separation. These automated tests do not establish physical-device performance or final difficulty balance; playtesting remains useful.

## Six procedural map families

Research rooms use a randomized spanning tree plus shortcuts; the reactor ring connects the perimeter with inner chambers; the transport spine has a wide main corridor with branches; the command cross has connected central hubs and outer wings; isolation uses a spanning tree without extra shortcut links; the cargo dock has large rooms and multiple wide transport corridors. All families randomize room positions, corridor bends, and the starting central room; most also randomize room sizes and selected links. The existing generated terrain artwork is reused, with the current family name shown beside the minimap.

Within one page session, new games draw from a shuffled six-family bag. Every family appears once per bag, and bag boundaries cannot immediately repeat a family. Refreshing the page starts a fresh bag. A map seed and explicit family reproduce identical geometry for testing. This does not change difficulty, objectives, player collision radius or the five-minute duration.

Regression checks cover 600 seeded maps (100 per family), connectivity, room variation, tile-center clearance for large enemies, reachable objectives, safe spawns, deterministic generation, all six renderer variants, and three full nonrepeating family rotations through the real controller.
