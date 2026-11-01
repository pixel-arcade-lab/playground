# JJK Verse — Context

Where the project stands, what was decided and why. Read this with `architecture.md` and `plan.md` before continuing work.

## Current state (2026-11-01)
- **Level 1 playable** (plan steps 0–7 for one level): title screen, the level "School Grounds at Night", HUD, pause, level clear, game over. Card added to the home page and README. Committed to `main` as "JJK verse version 1" (4ea700f) and published.
- Tested with simulated keys in the browser (no console errors):
  - Run 125 px/s; full jump 4.1 tiles; short hop 1.7 tiles.
  - Combo + Black Flash kills a crawler (3 hp → 1 → exorcised), energy 51.
  - Delayed punch: −25 energy, 1 damage, then the shock 0.4 s later finishes it.
  - Dash gap: jump alone falls short; jump + dash (early or at the top) crosses.
  - Wooden platform: jump up through it and stand on it.
  - Secret room: walking along the corridor drops you down (normal path); hopping the 2-tile gap leads through the fake wall to the talisman.
  - Flyer swoops and hurts; spikes; exit → "Level clear"; 3 pit falls → "Game over" → Enter restarts with 3 lives.
- Not yet checked by a person: how the jump and combat **feel**, difficulty, readability of hints.

## User feedback on version 1 (2026-11-01)
- "For a first level, it's fine." Punch and dash feel right.
- Controls felt misplaced → changed J/K/L to **Z/X/C** (punch / delayed punch / dash).
- Black Flash "doesn't do much" → now a full-screen black/red flash, camera zoom, longer freeze, a shockwave that hits all nearby curses, and 5 s of "the Zone" (+1 punch damage, easier timing, red aura). Tested: Black Flash + shockwave exorcised two crawlers; a Zone punch did 2 instead of 1. Committed as "JJK verse version 1.1".

## The user's idea and decisions
- JJK-themed 2D platformer; inspirations: Dangerous Dave, Super Mario, Rayman. Folder `projects/jjk-verse/`.
- Accepted plan defaults (2026-11-01): **original character** (Ren, not Yuji), **pixel art drawn in code**, first goal = **one full level**, **separate levels** with a level select later.
- **Lives: 3, then the game restarts** (user's choice instead of unlimited retries). Checkpoints still exist inside a level.
- Assets kept in `assets/` (drawings, tiles, backgrounds) separate from game code in `src/`, as the user asked for a reusable foundation.
- Phaser **4.2.1** chosen (newest stable on 2026-11-01; read the official v3→v4 migration notes in the npm package before writing code).

## Bugs found while testing (fixed)
- Combo couldn't connect: punch knock-back pushed the curse out of reach. Light hits now only nudge.
- Dash gap was impossible: dash too short and gap 7 tiles. Dash now 330 px/s × 0.2 s; gap 6 tiles.
- Secret room unreachable: a 3-tile drop under a low ceiling right before the fake wall. Now a 2-tile drop, further from the wall.

## Ideas / next steps (from plan.md)
- User plays level 1 and gives feedback (feel, difficulty, look).
- Then: keys and locked doors, spitter curse, levels 2–3, level select, boss, Domain ultimate, polish (particles, music).
