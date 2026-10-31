# City Walker — Architecture

A third-person walking game in the browser: a pixel-art character explores a Kyoto-style school, enters rooms through doors, hears footsteps and uses a map. Plain HTML + JavaScript modules, no build step. **Three.js 0.160.0** is loaded from jsDelivr through an import map in `index.html`.

Run locally from the repo root: `python -m http.server 8000`, then open http://localhost:8000/projects/city-walker/. Opening the file directly (file://) does not work because of ES modules.

## Files

| File | Job |
|---|---|
| `index.html` | The game itself: renderer, settings, player movement and collision, camera, doors (prompt + fade "blink"), keyboard/mouse input, main loop. Connects all other files. |
| `textures.js` | Shared tools: seeded random (`rand`, `pick`), pixel textures drawn on canvas, all materials (`makeMaterials()` → `M`), signs (`labelMaterial`), sprite outline (`addOutline`), blob shadow, UV scaling, hip-roof geometry, and `makeBuilder()` (box/flat/plane/roof/collider helpers). |
| `map.js` | `buildKyoto(M)` → the outdoor area (scene, sky, lights, buildings, trees, doors, map shapes, ground types). |
| `rooms.js` | `buildRooms(M)` → indoor areas: classroom, discussion, dojo, stairway, storage. |
| `character.js` | The player sprite: draws an 18-pose × 3-view sprite sheet in code; picks view/pose each frame; reports footsteps. |
| `sound.js` | All sounds made with the Web Audio API (no sound files): footsteps per ground type, jump, land, splash, door, iron gate. |
| `minimap.js` | Small map (top-right) and big map (M key), drawn on canvas from `mapInfo`. |

## Core ideas

### Areas (places)
Everything you can be in is an **area** object. `index.html` keeps `areas = { outdoor, classroom, discussion, dojo, stairway, storage }` and one current `area`. Each area has:
- `name` — shown top-left
- `scene` — its own Three.js scene (own lights, sky/background, fog)
- `solids` — array of `THREE.Box3` the player collides with
- `blockers` — meshes the camera ray-casts against (camera moves closer instead of going through)
- `doors` — `{ x, z, y, radius, label, to: { area, pos: [x,y,z], facing }, sound: 'door' | 'gate' }`
- `surfaceAt(x, z, y)` — ground type for footsteps: `stone | gravel | grass | wood | tatami | water`
- `update(dt, time)` — optional per-frame animation (torch flicker, floating relic)
- outdoor only: `spawn`, `spawnFacing`, `mapInfo`; rooms only: `mapSpot` (their building on the map)

Going through a door: `useDoor()` plays a sound, fades to black, `enterArea(to)` moves the character's root object into the new scene and places the player, then fades back.

### Rooms trick
Each room is one big box drawn with `THREE.BackSide` (only visible from inside). When the camera ends up behind a wall, that wall disappears, so the character is never hidden. Wall decorations use `onWall()` planes that also face inward only. Room walls are not camera blockers.

### Coordinates and angles
- y is up. Outdoor area is about ±48 m (outer walls). **North = −z** (top of the map).
- Every floor is at y = 0 (the stairway's top landing is a 6 m solid box).
- `facing` angle = `atan2(dir.x, dir.z)`: 0 faces +z (south), π faces −z (north), π/2 faces +x (east).
- Camera `view.yaw` = facing + π puts the camera behind the character.

### Player movement and collision (`index.html`)
- Player is a box: radius 0.35, height 1.9. Moves one axis at a time (x, then z, then y) so it slides along walls.
- Steps up to `STEP_HEIGHT` (0.45 m) are climbed automatically.
- Gravity + jump; `onGround` set when landing on a box or the floor.
- **Auto camera:** while moving, `view.yaw` turns toward behind the character. W/A/S/D use `inputYaw`, which only updates when the set of held keys changes, so the camera can swing without bending the path. Mouse movement pauses auto-follow for `MOUSE_PAUSE` seconds.

### Retro look
`renderer.setPixelRatio(1 / PIXEL_SCALE)` draws at one third of the screen size; CSS `image-rendering: pixelated` scales it up with sharp pixels. Textures use `NearestFilter`. Trees and the character are flat sprites (Doom style).

### Character sprite (`character.js`)
- Sheet: 32×64 px per pose; columns = idle, walk 1–8, run 1–8, jump (18); rows = front, side (facing right), back.
- Limbs are drawn from angles (`limbAngles`: thigh/shin, upper arm/forearm); the lowest foot is placed on the ground line, which makes the body bob.
- Each frame the plane turns to face the camera; the view row is chosen from the angle between character facing and camera; side view is mirrored for the other side.
- `update()` returns `{ stepped }` when a foot lands → `index.html` plays a footstep for `area.surfaceAt()`.

## Settings (top of `index.html`)
`PIXEL_SCALE`, `WALK_SPEED` (4), `RUN_SPEED` (8), `JUMP_SPEED`, `GRAVITY`, `STEP_HEIGHT`, `PLAYER_RADIUS`, `PLAYER_HEIGHT`, `MOUSE_SENSITIVITY`, `CAMERA_DISTANCE`, `CAMERA_PITCH`, `CAMERA_FOLLOW`, `MOUSE_PAUSE`.

## Outdoor layout (`map.js`, approx. centres)
Main gate torii (0, 44) · spawn (0, 40) facing north · lantern path x ±4.6 · second torii (0, −14) · main hall on platform (0, −30) with steps at z ≈ −21 · pagoda (24, −22) · classroom building (−28, −12), door on its east side · dojo building (−28, 10), door east · storage hut (−40, −28), door east · shrine (26, 16) with small torii row at x 26, z 36→23 · pond (−22, 32) · outer walls at ±48.

## How to add things
- **New room:** in `rooms.js` write `buildX(M)` using `makeRoom(M, {...})`, add furniture with `b.box(...)`, add doors with `R.door(side, along, label, sign, to)`; register it in `buildRooms`. Add an outdoor entrance in `map.js` with `entrance(...)` (or push to `doors`), and a place in `places` for the map.
- **New outdoor object:** use `box/flat/roof/plane` from the builder; pass `{ solid: false }` for decoration. Call `mark(kind, x, z, w, d)` so it appears on the map.
- **New sound:** add a function in `sound.js` built from `noiseBurst`/`tone`.

## Testing tips
- `window.cityWalker = { player, areas, enterArea, view }` is exposed for the browser console, e.g. `cityWalker.enterArea({ area: 'dojo', pos: [0, 0, 3], facing: Math.PI })`.
- Automated browsers can't capture the mouse; fake it with `Object.defineProperty(document, 'pointerLockElement', { get: () => document.body })` then dispatch `pointerlockchange`.
- A hidden browser tab pauses `requestAnimationFrame`, so the game does not move while hidden.
