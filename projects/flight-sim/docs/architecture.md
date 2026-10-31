# Sky Strike (Flight Sim) — Architecture

A jet flying game in the browser over a mountain island at sunset, controlled only with the mouse ("mouse aim"). Plain HTML + JavaScript modules, no build step. **Three.js 0.160.0** from jsDelivr through an import map in `index.html`.

Run locally from the repo root: `python -m http.server 8000`, then open http://localhost:8000/projects/flight-sim/.

## Files

| File | Job |
|---|---|
| `index.html` | The game: start/pause/crash screens, mouse input, camera, on-screen display (speed, altitude, throttle, compass, aim circle, nose cross, warnings), particles (explosion, boost trail), crash check, main loop. |
| `plane.js` | `FLIGHT` handling settings; `createJetModel()` (3D jet + engine flame, `setFlame(power)`); `createFlight()` → `{ state, step(dt, aimDir, boost), reset(pos, heading) }`. |
| `world.js` | Island terrain from noise: `heightAt(x, z)`, `groundAt(x, z)` (land or sea), `buildWorld(scene)` (sky dome, sun, lights, terrain colours, sea, trees, clouds) → `{ follow(cameraPos) }` keeps sky/sun around the camera. |
| `sound.js` | Web Audio, no files: engine hum (follows throttle/boost), wind (follows speed), explosion. |

The visuals (terrain, sky, clouds, trees, jet model) were taken from the user's original single-file "Sky Strike" (`flight-sim.html` in the repo root, not published) and ported to Three.js 0.160 modules. Light intensities were multiplied by about π because newer Three.js uses physically based light units.

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

### Speed
Target speed = 80 + throttle × 170 (+110 while boosting) m/s; climbing slows, diving speeds up; clamped between `minSpeed` and `maxSpeed` (+boost). No stall in v1. The plane moves straight along its nose (arcade model, no lift/drag simulation).

### Camera
Placed `CAMERA_DISTANCE` behind the plane along the aim/look direction and `CAMERA_HEIGHT` above, always with world-up (level horizon), never below the ground. Holding right mouse adds a look offset that slides back when released. Field of view widens with speed.

### Modes
`menu` (camera circles the plane) → click → pointer lock → `flying`. Losing pointer lock (Esc) → `paused`. Ground clearance < 1.5 m → `crashed` (explosion, overlay, click to fly again → `reset()`).

### Warnings
- **PULL UP!**: predicted position 2 s ahead is < 15 m above ground, or time to hit the ground while sinking < 3 s.
- **Turn back to the island**: more than 3600 m from the centre.

### Coordinates
y up. Plane nose = local −z. Heading 0° = −z (north); compass uses `atan2(fwd.x, -fwd.z)`. Island centred at (0, 0), terrain area 5000 m wide, peaks up to ~440 m, sea at y = 0. Start: (0, ground + 220, 2300), heading north toward the island.

## Controls
Move mouse = point · wheel = throttle · hold left = boost · hold right = look around · Esc = pause · N = sound on/off. **No keyboard flying** (user's request).

## Settings
- `index.html`: `MOUSE_SENSITIVITY`, `CAMERA_DISTANCE`, `CAMERA_HEIGHT`, `START`.
- `plane.js` → `FLIGHT`: turn rates, `response`, gains, `aggressiveAngle`, speeds, `boostExtra`.

## Testing tips
- `window.flightSim = { flight, aim, mode }` is exposed for the console.
- Fake mouse capture: `Object.defineProperty(document, 'pointerLockElement', { get: () => document.body })` then dispatch `pointerlockchange`; steer with `document.dispatchEvent(new MouseEvent('mousemove', { movementX, movementY }))`.
- Hidden browser tabs pause the game loop.
