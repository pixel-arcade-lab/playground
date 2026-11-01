# JJK Verse — Architecture

A 2D side-scrolling pixel-art platformer in the browser. Plain JavaScript modules, no build step.
**Phaser 4.2.1** (free 2D game library) is loaded from jsDelivr with a `<script>` tag in `index.html` and used as the global `Phaser`.

Run locally from the repo root: `python -m http.server 8000`, then open http://localhost:8000/projects/jjk-verse/.

## Files

| File | Job |
|---|---|
| `index.html` | Loads Phaser and `src/main.js`. |
| `src/main.js` | Game settings: 960 x 540, `pixelArt: true`, arcade physics (gravity 1100), FIT scaling, scene list. Exposes `window.jjk` (the Phaser game) for testing. |
| `src/scenes/boot.js` | Turns every pixel drawing into a texture and creates the animations, then starts the title. |
| `src/scenes/title.js` | Title screen and controls; Enter/Space starts a new game. Also exports `TEXT` (shared text style) and `addScreenBackground()`. |
| `src/scenes/level.js` | The game itself: background, map, placing things from the map, collisions/touches, checkpoints, talismans, hearts, spikes, exit, hit-stop, losing a life / game over, secret walls, pit check, pause key. |
| `src/scenes/hud.js` | Hearts, lives, cursed energy bar (4 parts = 4 delayed punches), talismans, level name, controls line. Reads the level's player every frame. |
| `src/scenes/pause.js` | Pause screen (Esc/Enter continue, Q quit to title). |
| `src/scenes/result.js` | "Level clear!" (talismans, time, best) or "Game over" screen. |
| `src/player.js` | The player (Ren): `MOVE` and `COMBAT` settings, running, jumping, dash, punch combo, delayed punch, Black Flash, hurt, respawn. |
| `src/enemies/enemy.js` | Shared curse behaviour: health, hit flash, knock-back, stun, exorcise (death). |
| `src/enemies/crawler.js`, `flyer.js` | The two curse types. |
| `src/levels/level1.js` | Level 1 as text sections. `src/levels/index.js` lists all levels. |
| `src/level-builder.js` | Joins the text sections, makes the tile map + collisions, returns the things to place and the hints. |
| `src/effects.js` | Sparks, dust, puffs, rings, Black Flash burst, cue, floating text, afterimages, white flash. |
| `src/sound.js` | All sounds made in code (Web Audio). `init()` on the first key press; M toggles mute. |
| `src/state.js` | Lives (3) and saved best results (`localStorage` key `jjkverse.progress`). |
| `assets/pixel.js` | Drawing helpers: text drawing → canvas → Phaser texture; tileset builder; painted textures; seeded random. |
| `assets/sprites/player.js` | Ren's frames, built from head + body + legs parts; animation list. |
| `assets/sprites/curses.js` | Crawler and Flyer drawings (2 frames each). |
| `assets/sprites/items.js` | Talisman, hearts, spikes, lanterns (off/on), torii gate, street lamp, spark, Black Flash cue. |
| `assets/tiles.js` | The 6 tiles (16 x 16) and their numbers (`TILE`). |
| `assets/backgrounds.js` | 4 painted night layers (sky, mountains + pagoda, school buildings, trees + fence), each 480 x 270 and seamless left-right; `BG_LAYERS` with parallax speeds; glows. |

## Key ideas

### Screen and camera
- The game is 960 x 540 and is stretched to fit the window (FIT). The level camera has **zoom 2**, so you see 480 x 270 world pixels (30 x 17 tiles) with chunky, sharp pixels. HUD and menus are separate scenes without zoom, so their text is crisp.
- Background layers are `TileSprite`s fixed to the camera (`scrollFactor 0`) at the screen centre, size 480 x 270 (the zoom makes them fill the screen). Each frame `tilePositionX = camera.scrollX × speed` (parallax).
- The camera follows the player smoothly and looks ~30 px ahead in the facing direction (`followOffset`).

### Levels as text
- One character = one 16 x 16 tile. Sections are joined left to right and lined up at the bottom; rows are padded with empty space. Legend in `level1.js`.
- `#` ground (top tile if nothing above, soil below), `B` brick, `S` stone, `=` one-way wooden platform (collides only from above: `tile.setCollision(false, false, true, false)`), `%` fake brick (no collision; all fake tiles turn see-through while you stand in one, and "Secret room!" shows once).
- Things: `@` start, `c` crawler, `f` flyer, `T` talisman, `H` heart, `P` checkpoint lantern, `E` exit torii (2 tiles wide), `^` spikes, `L` street lamp. Unknown letters log a warning.
- No floor below the map: falling 24 px below it loses a life.

### Player feel (`MOVE`)
Run 125 px/s with acceleration/deceleration; jump 390 px/s (~4 tiles); letting go early cuts the rise (short hop ~1.7 tiles); coyote time 0.1 s; jump buffer 0.12 s; max fall 430. Dash 330 px/s for 0.2 s (~4 tiles), no gravity, one per air time, cooldown 0.5 s, can't be hurt while dashing, purple afterimages.

### Combat (`COMBAT`)
- **Punch (J)**: 3-hit combo. The next punch can start 0.1 s into a punch or within 0.3 s after it. Damage 1, 1, 2. Hit box 20 px in front. Light hits (1, 2) only nudge the curse so the combo keeps connecting (this was a bug in testing: big knock-back made punches 2 and 3 miss); the 3rd punch throws it.
- **Black Flash**: when punch 2 hits, a red/black star cue appears on the fist 0.12 s later for 0.16 s (with a tick sound). Punching during it → 5 damage, red flash, shake, 0.12 s hit-stop, +30 energy, "BLACK FLASH!".
- **Delayed punch (K)**: costs 25 energy; 1 damage now, then a purple shock ring 0.4 s later for 3 more.
- Energy: +8 per normal hit, +5 per curse exorcised, max 100.
- **Hit-stop**: the physics world pauses briefly on hits (0.04 s, Black Flash 0.12 s).
- Curses flash white when hit (v4 tint: `setTint(0xffffff).setTintMode(Phaser.TintModes.FILL)`), are stunned 0.35 s and are harmless while stunned.

### Health and lives
3 hearts. Touching a curse or spikes = 1 heart, knock-back, 1 s blinking safety. 0 hearts or a pit = lose a life (death jump), back to the last lit checkpoint with full hearts. **3 lives**; after the third, Game Over → Enter starts the whole game again (user's choice: no unlimited retries). Hearts `H` restore 1.

### Enemies
- **Crawler** (3 hp): walks 32 px/s, turns at walls and at ledge edges (checks the tile ahead and below; platforms count as ground).
- **Flyer** (2 hp): no gravity, ignores walls. Hovers around home; when you're within 110 px it swoops straight at you (95 px/s, 1 s), then returns; 2 s cooldown.

### Scenes
`boot` → `title` → `level` (+ `hud` on top). Esc → `pause` (level paused). Exit → `result` (clear). Last life lost → `result` (game over). Scene order in `main.js` = drawing order.

## How to add things
- **A level**: create `src/levels/levelN.js` like `level1.js`, add it to `LEVELS` in `src/levels/index.js`. The result screen then offers "next level".
- **A curse**: drawing in `assets/sprites/curses.js`, register its texture/animation in `boot.js`, class in `src/enemies/` (extend `Enemy`, give it `update(dt, layer, player)`), a map letter in `level.js` `placeThing`.
- **A tile**: drawing in `assets/tiles.js` (append to `TILES`, add to `TILE`), handle its letter in `level-builder.js`.
- **A move**: settings in `COMBAT`, input in `Player.update`, frames in `assets/sprites/player.js`.

## Testing tips
- `window.jjk` is the game: `jjk.scene.getScene('level').player`, `.enemies`, `.talismansFound`; `import('./src/state.js')` for lives.
- Keys can be simulated with `window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 39 }))` (and `keyup`); Phaser reads `keyCode`.
- Phaser 4 notes: `roundPixels` now defaults to off (pixelArt turns it on); `setTintFill` was removed (use tint mode); `Geom.Point` removed.
- Testing writes best results to localStorage; clear with `localStorage.removeItem('jjkverse.progress')`.
