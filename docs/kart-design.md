# COASTLINE KART / 海岸甩尾

## Pre-implementation visual direction

Complete home and race screen mockup is being generated before gameplay implementation. Warm peach sunset, turquoise ocean, mint player kart, cream/coral controls, navy translucent HUD. Original stylized low-poly 3D environment, no existing franchise characters or logos. Generated menu artwork supports the actual WebGL scene rather than replacing playable 3D with a flat image.

Home: full-screen coastal kart illustration, left-aligned title, time-trial/race selection, prominent start, audio and auto-throttle preferences, concise desktop/touch controls, device-local lap record. Race: perspective chase camera behind a detailed open-wheel kart, curving elevated road, red/white curbs and rails, island palms/rocks, boost pickups and cone obstacles. HUD: lap/position/timing along top, minimap top right, speed/drift energy lower right; independent touch steering and driving buttons at bottom.

## Gameplay contract

One closed non-crossing, undulating 3D coastal course. Single-lap time trial or three-lap competition against three simulated rivals. Fixed-step, bounded arcade physics in track coordinates, lateral momentum, steering, braking, drift-release mini boost, pickup boost, wall/cone/kart contacts with cooldown. Follow camera is time-smoothed and aligned to track slope. Lap completion requires traversing the entire course and ordered checkpoints; countdown does not count toward race time. Track movement and physics share the exact sampled centerline used by the rendered surface and minimap.

Keyboard: WASD/arrows, Shift drift, Space boost, Escape pause. Touch: independent left/right steering, throttle/brake, drift and boost. Optional auto-throttle supports small screens but manual steering and brakes remain available. Page hide/blur pauses all timing and audio; resume requires a gesture. No network or microphone needed during play; bounded synth voices and particle pool. Missing WebGL reports an actionable error rather than a blank canvas.

## Validation

Engine simulation for countdown, speed/braking, slopes, drift rewards, collision cooldown, pickups, ordered lap timing, race ranking, pause/resume, reset, finite state, and full mode completions. Controller tests cover keyboard, concurrent pointers and cancellation, visibility and sound lifecycle. Browser visual inspection of actual 3D camera, course, controls, and startup is required before release where supported. Local physical iPad testing remains separate.

## Implementation and validation completed

The course is approximately 855 meters with more than eight meters of elevation change. Three.js 0.160.1 is vendored locally with its MIT license (`assets/vendor/three-LICENSE.txt`), with no runtime CDN dependency. Engine track sampling and renderer road geometry share one coordinate model. The game uses original code-native low-poly karts, animated wheels, a lighthouse island, bridge supports, palms, grounded rocks, a gradient sky, animated water, moving shadow coverage, and generated asphalt texture. The close-range start arch is hidden to prevent camera occlusion. Portrait and landscape use different follow-camera distances. Geometry, effects and voices are bounded.

ImageGen created the full two-screen visual specification first, followed by the actual menu background and in-game asphalt material. Saved assets and complete prompts are in `kart-imagegen-prompts.md`. Generated artwork is used in production rather than only delivered as concepts.

Full regression build passed, including engine-driven complete single-lap and three-lap runs, ordered checkpoints, drift release reward, pickups, rail/cone contact, timing and finish immutability. Controller harness checks independent touch IDs, cancellation, background pause, context loss/restoration, results and restart. Mock audio checks lazy gesture startup, iPad playback policy, bounded voices, mute/disposal and late-resume cancellation. Real browser startup/race rendering and pause controls were inspected, including 390×844 and 1024×768 layout checks; no WebGL console errors were observed. This is not a physical iPad performance or audio validation.

Three.js API reference consulted: https://threejs.org/docs/ . Pinned source distribution: https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js .

## Visual refinement
The initial playful treatment was revised at the user's request. The active menu uses new ImageGen semi-realistic coastal motorsport artwork. Actual WebGL rendering uses subdued graphite/petrol paint, tubular chassis, exposed finned engine, metal rims, seated driver limbs, darker textured asphalt, steel-blue water and softer neutral lighting. Runtime geometry remains optimized and stylized rather than claiming photographic fidelity to the key art. Bridge pier tops sit below the roadway to prevent surface z-fighting; particles use a soft radial alpha texture.

## Image-driven runtime materials
Original ImageGen images now drive rock color/bump, carbon body color/bump, and panoramic sky/environment reflections. The sea shader samples that same sky with moving wave normals. These supplement the existing generated asphalt; they are actual in-game textures, not menu-only artwork. Geometry, collision and camera remain 3D. Texture requests use bounded repeats/anisotropy and are disposed with the renderer.

## Image-based player kart
Player kart now uses three original transparent ImageGen sprites (rear/left/right), selected with heading hysteresis to avoid flicker. This is a 2.5D vehicle presentation inside the true 3D world: the image follows position, road elevation, perspective and depth testing. Contact shadow, restrained chassis vibration, smoke and sparks remain dynamic; wheel rotation is simulated in physics but not separately animated within the static artwork. Opponents remain geometric so arbitrary passing views stay consistent. Missing sprite loads retain the 3D player model. Images and materials are disposed with the renderer. The generated palm candidate was rejected for a background halo and is not shipped.

## Turning animation refinement
Visual heading uses exponential easing independent of physics input. A hysteretic pose selector drives short alpha-weighted texture blends inside one SpriteMaterial shader, preserving transparent edges without multiple overlapping sprite draws. Body lean eases separately and returns smoothly to neutral; reduced-motion mode suppresses lean and transitions. Countdown resets animation state. Tests cover reversal continuity, normalized blend weights, 30/120 Hz consistency, missing-direction fallback and reduced motion.

## Drift and boost feedback
Drifting lays paired road-aligned tyre marks in a fixed 512-segment ring buffer; stopping or teleporting breaks the trail and a new race clears it. Tyre smoke/sparks and blue exhaust particles share a bounded pool. Boost adds blue-white cone flames and one short-range light, including drift-release mini boosts. Reduced motion disables particles and flame pulsation. Audio uses two reusable filtered-noise loops for skid friction and boost whoosh, ramped by actual car state; pause, finish, mute and disposal silence/clean up both. Physics/scoring remain unchanged.

## Four selectable circuits
Track-local engine instances provide coast (original), lagoon (fast sweepers), cliff (larger elevation) and serpent (linked tighter bends). Selection navigates to /kart?track=ID to rebuild GPU resources in a fresh page; invalid IDs fall back to coast. Existing coast best record is preserved while other map records use distinct keys. Minimap auto-fits each circuit. All four tracks pass closed-loop, safe-curvature and complete trial/race tests.
