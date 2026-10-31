# Sky Strike (Flight Sim) — Architecture

A relaxed flying game in the browser over two islands at sunset, controlled only with the mouse ("mouse aim"). Plain HTML + JavaScript modules, no build step. **Three.js 0.160.0** from jsDelivr through an import map in `index.html`.

Run locally from the repo root: `python -m http.server 8000`, then open http://localhost:8000/projects/flight-sim/.

## Files

| File | Job |
|---|---|
| `index.html` | The game: start/pause/crash screens (with plane choice), mouse input, Space for take-off, camera, on-screen display (speed, altitude, throttle, compass, aim circle, nose cross, ring counter + timer, next-ring marker, warnings, tips), particles (explosion, boost trail), take-off / landing / crash logic (`updatePlane`), main loop. |
| `plane.js` | `PLANE_TYPES` (each plane: name, description, model builder, engine sound, camera distance, `flight` handling settings incl. take-off/landing numbers); `createFlight()` → `{ state, step(dt, aimDir, boost), groundStep(dt, groundAt, gearHeight), startTakeoff(), touchdown(), canLand(), reset(pos, heading, onGround), setType(id), settings }`. |
| `world.js` | Terrain from noise for both islands: `heightAt`, `groundAt`, `farFromLand`; constants `MAIN_R`, `VOLCANO`, `VILLAGE` and `RUNWAY` (both found automatically); `runwayCoords`, `isOnRunway`, `isNearRunway`; `buildWorld(scene)` (sky, sun, lights, terrain, sea, trees, clouds, volcano lava + smoke, river, waterfall) → `{ follow(cameraPos), update(dt), waterfall }`. |
| `airfield.js` | `buildAirfield(scene)`: runway surface and white markings, parking area, hangar, control tower, windsock (all in one group turned along the runway). |
| `rings.js` | `createRings(scene, waterfallPos)` → `{ state: { next, total, time, running }, update(dt, prevPos, pos), reset(), list, nextCentre() }`. The ring course. |
| `life.js` | `createLife(scene)` → `{ update(dt, camera) }`: builds the village (roads, square, well, church, houses, fields, haystacks) and moves the characters: villagers, farmers, cows, sheep, deer, birds, seagulls. |
| `sound.js` | Web Audio, no files: engine (`setEngine('prop' | 'jet')`; prop = low buzz with fast volume "throb"), wind (follows speed), explosion. |
| `assets/pixel-sprite.js` | Turns pixel-art text drawings into sprites: `makeKind(def, recolour)` (shared materials, right- and left-facing), `makeSprite(kind)` → `{ sprite, animate(dt), face(left) }`. |
| `assets/characters/*.js` | One file per character: `villager.js` (+ `VILLAGER_LOOKS` colour sets), `cow.js`, `sheep.js`, `deer.js`, `bird.js` (+ `SEAGULL` colours). |
| `assets/planes/*.js` | 3D plane models: `jet.js`, `yak.js`, shared helpers in `parts.js` (`mat`, `slab`, `star`). Each returns `{ mesh, setPower(power, dt), exhaust, exhaustColor, exhaustGlow }`. |
| `assets/buildings.js` | Low-poly `createHouse(seed)`, `createChurch()` (onion dome), `createWell()`, `createHaystack()`. |

The original visuals (terrain, sky, clouds, trees, jet) came from the user's old single-file "Sky Strike" (`flight-sim.html` in the repo root, not published). Light intensities were multiplied by about π because newer Three.js uses physically based light units.

## Core ideas

### Mouse aim (the key part)
- The mouse moves an **aim direction** (`aim.yaw`, `aim.pitch` in `index.html`; pitch limited to ±1.3 rad). It is a direction in the world, not tied to the plane.
- Every frame `flight.step()` acts as an **autopilot** (in `plane.js`):
  1. Converts the aim direction into the plane's own frame (`local.x` = right, `local.y` = up, `-local.z` = ahead).
  2. **Pitch** command ∝ `local.y`; **yaw** (small rudder) ∝ `local.x`.
  3. **Roll**: blends "level the wings" (`right.y`) with "bank toward the aim" (`local.x`), depending on how far off the aim is (`aggressiveAngle`).
  4. Turn rates follow commands smoothly (`response`), limited by `maxPitchRate/maxRollRate/maxYawRate`.
  5. **Aim behind the plane** (dot < −0.2): instead of looping, it first aims at a point to the side (`turnSide`, remembered) so the plane makes a level banked turn.
- On screen: **white circle** = aim, **yellow cross** = where the nose points now.

### Planes and speed
- Two planes in `PLANE_TYPES`: **yak** (default; Soviet propeller trainer, ~165 km/h at 50% throttle) and **jet** (~200 km/h at 50%).
- Cruise speed = `slowSpeed + throttle × (fastSpeed − slowSpeed)` (+ `boostExtra` while boosting). Climbing slows and diving speeds up (`climbDrag`). Clamped between `minSpeed` and `maxSpeed`. No stall. The plane moves straight along its nose (arcade model).
- Both models are created once; `choosePlane(id)` in `index.html` shows one, calls `flight.setType(id)` and `sound.setEngine(...)`. The choice is shown on the start and crash screens, not when paused.
- Models are scaled down (`mesh.scale`), so the plane looks small and more of the scenery is visible.

### Camera
The camera's direction (`camAngles`) follows aim + look smoothly (`CAMERA_SMOOTH`, short way round for yaw), so it never jumps — e.g. at lift-off, when the aim changes from "along the runway" to "climb" (this used to be a visible cut). `reset()` snaps it. Placed `camera.distance` behind the plane (per plane type) along that direction and `camera.height` above, always with world-up (level horizon), never below the ground. Holding right mouse adds a look offset that slides back when released. Field of view widens a little with speed (62°–72°).

### World
- **Main island**: centred at (0, 0), size `MAIN_R` = 2700 m, peaks ~440 m with snow. Terrain mesh 7400 m square, 320 grid squares.
- **Village**: at load time `world.js` searches the south side of the island for the flattest low area (mean height 12–60 m) and flattens a circle (`VILLAGE.r` = 330 m, blends over 220 m) to exactly `VILLAGE.h`. Currently ends up at about (−1300, 1500), height 50. Layout in `life.js` uses road coordinates (u along road A, v along road B, roads turned by `ROAD_ANGLE`).
- **Runway**: at load time `world.js` searches for a 660 m strip (8 directions tried) that is flat, 8–70 m high, at least 800 m from the village, and has **low ground for 1.5 km beyond both ends** (below a 4° slope), so planes can climb away and come in to land. Flattened 75 m each side of the centre line (blends over 160 m). Currently ends up at (400, −2000) on the north side, taking off east (toward the volcano island), height 59. Trees are kept off the runway and its approach.
- **Volcano island**: centre `VOLCANO` (5300, −2700). Wobbly coastline around ~1290 m (big bays + small bumps). `coastStyle(x, z)` changes the coast smoothly going round the island (it depends only on the direction from the centre): **beaches** (sand slopes out of the sea, stays low ~80 m, then grassy hills rise), or **cliffs** of varying height (plateau 90–200 m) and steepness (25–95 m wide drop). The south side (waterfall) is always a 140 m cliff (`VOLCANO.plateau`) so the river and waterfall stay correct. Cone 560 m high with radius 820 m, flat top at the rim (r = 160) and a 70 m crater. Lava = glowing disc + additive glow sprite; smoke = 18 sprites rising and drifting. A river bed is carved going south (+z) from r = 840 to the cliff; the waterfall is a ribbon that follows the cliff 4 m out with a scrolling streak texture, plus foam sprites at the bottom.
- Terrain colours: main island by height and slope; volcano island turns to ash/scorched colours near the cone.
- Fog 1200–6500 m, camera far plane 12000 m.

### Characters (pixel sprites)
- Drawn as text in `assets/characters/`, always facing right; `makeKind` also makes mirrored copies. Sprites are about 1.5–2× life size so they can be seen from the plane.
- `life.js` `wanderer(...)`: walk to a spot from `pickSpot()`, rest a random time, repeat; faces left/right on screen using the camera's right direction. Villagers only pick spots on their own road (so they never walk through houses); animals pick spots inside their field or home area.
- `flock(...)`: birds circling a centre with bobbing and flapping.

### Take-off and landing
- Every flight starts **parked** at the start of the runway (`reset()` → `flight.reset(pos, RUNWAY_HEADING, true)`). `state.onGround` + `state.rolling` (`'takeoff'`, `'landing'` or null).
- **Space** → `startTakeoff()`. `groundStep` speeds up by `takeoffAccel`, keeps the wings level and the wheels on the ground (`groundAt + gearHeight`), lifts the nose a little near `rotateSpeed`, and returns `'liftoff'` at `rotateSpeed`. Then the aim is set 0.2 rad up along the runway and the mouse takes over. On the ground the mouse does not steer (right button look still works); boost is off.
- `climbedAway` (index.html): just after lift-off the wheels are only centimetres above the runway, so touching down is not checked until the plane has been 3 m up (otherwise it would "land" again at once — a bug found in testing).
- **Landing**: when the wheels reach the ground (`clearance < gearHeight + 0.15`): if `isOnRunway` and `canLand()` (speed ≤ `landingSpeed`, sinking < 6 m/s, nose not steeply down, wings within ~11° of level) → `touchdown()`, braking roll (`brake`) to a stop, "Landed! Press Space…". Otherwise → crash (with a message that explains a hard landing on the runway).
- Space during the landing roll = touch-and-go.
- Jet wheels (`setGear`) show when below 80 m and slower than landing speed + 6 m/s; the Yak's wheels are always down. `gearHeight` comes from each model.
- Near the runway (`isNearRunway`, below 250 m), PULL UP is not shown if slow enough to land; instead "Too fast to land" or a landing tip.

### Rings
- 15 rings (`RADIUS` 20 m) in `rings.js` `courseSpots()`: along the runway → volcano island (waterfall, round the volcano, beside the crater) → round the main island → village → lined up with the runway for landing. Each `[x, z, height above ground]`; the ring height uses the highest ground within 70 m. Positions are hand-picked for the current runway/terrain; if those change, check the course again.
- Each ring faces from the previous ring toward the next one. Only the **next** ring counts (yellow, pulsing; the one after is half see-through; passed rings disappear). A pass = the plane crosses the ring's flat surface forwards within the radius, between two frames.
- Timer starts at the first ring. After the last ring: tune + "Course complete! Time m:ss" and the course starts again.
- HUD: counter and timer top right; a yellow diamond marks the next ring with its distance, sticking to the screen edge when the ring is off screen or behind.

### Modes
`menu` (camera circles the parked plane) → click → pointer lock → `flying` (on the ground first). Losing pointer lock (Esc) → `paused`. Touching the ground anywhere except a good runway landing → `crashed` (explosion, overlay with plane choice, click → `reset()` back on the runway).

### Warnings
- **PULL UP!**: predicted position 2.5 s ahead is < 12 m above ground, or time to hit the ground while sinking < 3 s (not shown on a slow runway approach).
- **Turn back to the islands**: `farFromLand()` — more than 1900 m beyond the main island and 1500 m beyond the volcano island's coast.

### Coordinates
y up. Plane nose = local −z. Heading 0° = −z (north); compass uses `atan2(fwd.x, -fwd.z)`. Sea at y = 0. Start: parked 25 m from the start of the runway, facing `RUNWAY.dir`.

## Controls
Space = take off (on the ground only) · move mouse = point · wheel = throttle · hold left = boost · hold right = look around · Esc = pause · N = sound on/off. **No keyboard flying** (user's request); Space is only for take-off.

## How to add things
- **New character**: add `assets/characters/<name>.js` with `{ height, frameTime, palette, frames }` (drawings facing right, all frames the same size), then in `life.js` `makeKind(...)` and `wanderer(...)` or `flock(...)`.
- **New plane**: add a model in `assets/planes/` returning `{ mesh, setPower, exhaust, exhaustColor, exhaustGlow }`, then an entry in `PLANE_TYPES` (the start screen button appears by itself).
- **New building**: add a function to `assets/buildings.js` and `place(...)` it in `life.js`.

## Settings
- `index.html`: `MOUSE_SENSITIVITY`.
- `plane.js` → `PLANE_TYPES[id].flight` (turn rates, `response`, gains, speeds, `boostExtra`, `climbDrag`, `takeoffAccel`, `rotateSpeed`, `landingSpeed`, `brake`) and `.camera`.
- `world.js`: `MAIN_R`, `VOLCANO`, cone/crater/river constants, `coastStyle` ranges, runway search rules, fog.
- `rings.js`: `RADIUS`, `courseSpots()`.

## Testing tips
- `window.flightSim = { flight, aim, camera, choosePlane, rings, VILLAGE, RUNWAY, mode }` is exposed for the console.
- Take-off: `window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))`.
- Ring check: for each `flightSim.rings.list[i]`, put the plane 250 m before `centre` along `-normal`, aim along `normal`, wait until `rings.state.next` changes. Long tests: run them as a background async function in the page and read the result later (the console tool times out after 45 s).
- Fake mouse capture: `Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => document.body })` then dispatch `pointerlockchange`; steer by setting `flightSim.aim.yaw/pitch` or dispatching `mousemove` events with `movementX/Y`.
- To look around freely: set `flightSim.mode = 'crashed'` (stops the plane and camera), then move `flightSim.camera` and call `lookAt`.
- Hidden browser tabs pause the game loop.
