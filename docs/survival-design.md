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
