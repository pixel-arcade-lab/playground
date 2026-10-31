# Sky Strike (Flight Sim) — Context

Where the project stands, what was decided and why. Read this with `architecture.md` before continuing work.

## Current state (2026-10-31)
- **Version 1 done**: free flight with mouse-aim controls over the island. Tested with simulated mouse input:
  - 90° turn: banks, turns in ~2 s, levels wings and holds heading.
  - Aim up: climbs at the aimed angle.
  - Aim behind: level 180° turn in < 3 s with no height loss (first try looped and lost 300 m; fixed with the "turn to the side first" rule).
  - Aim at the ground: PULL UP warning, then crash screen.
- Not yet checked by a person with a real mouse: steering sensitivity and feel.

## Why it was rewritten
The user's original single-file version (`flight-sim.html`, repo root, not published) was hard to play:
1. Keyboard steering was all-or-nothing, so the plane over-rolled easily.
2. No recovery when upside down.
3. Turning needed bank + pull at the same time.
4. Camera rolled with the plane, so the horizon swung around.

User asked: no keyboard flying, mouse control, focus on the flying experience first.

## Left out of v1 (on purpose)
The original had combat: 3 waves of enemy drones, guns, lock-on missiles, radar, health, phone tilt/touch controls. It was left out so the flying could be checked first. The original code for it is still in `flight-sim.html` and can be ported.

## Decisions and user preferences
- Mouse only for flying (wheel throttle, left boost, right look). The only key is N for sound.
- Desktop with a mouse is the target; touch devices see a "needs a mouse" message.
- Keep it step by step: user tests v1, then says what v2 should add or change.

## Next steps
Waiting for the user's list of version 2 changes. Options discussed: bring back combat (left = guns, right = missile), rings to fly through, obstacles.
