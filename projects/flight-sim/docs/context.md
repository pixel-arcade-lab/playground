# Sky Strike (Flight Sim) — Context

Where the project stands, what was decided and why. Read this with `architecture.md` before continuing work.

## Current state (2026-11-01)
- Live (version 1 only): https://pixel-arcade-lab.github.io/playground/projects/flight-sim/.
- **Version 2 in progress on branch `flight-sim`** (not committed yet; waiting for the user to test).

### Version 2 changes (user's list)
1. **Slower**: user found 600 km/h too fast to enjoy the scenery. Now ~165 km/h (Yak) / ~200 km/h (jet) at the default 50% throttle.
2. **Choice of plane** on the start/crash screen: "Yak" (Soviet-style propeller trainer, like a Yak-52, red/white with a red star; default) and "Jet". Both smaller on screen than before. Prop plane has its own engine sound.
3. **Bigger main island** (radius 2000 → 2700 m) and a **new volcano island** to the north-east with smoke, lava, sea cliffs, a river and a waterfall.
4. **Village** on the main island (houses, church with onion dome, well, roads, fields, haystacks), with pixel **villagers**, **cows**, **sheep**, **deer** in the hills, **birds** and **seagulls**.
5. Character drawings and models live in `assets/` (the user asked for reusable assets, kept separate from the game code).

Tested with simulated input (2026-11-01): no console errors; 90° turn ~2 s for both planes with no height loss; 180° turn ~3.8 s, no height loss; ~144 fps on this machine. Screenshots checked: village, villagers, cows, volcano, crater, waterfall.

### Version 2, second round (user's list, 2026-11-01)
6. **Volcano island coast**: beaches and uneven cliffs (different heights and steepness), more wobbly coastline. South side kept as a fixed cliff for the waterfall.
7. **Rings to fly through** (user chose rings, not loop-the-loop stunts): 15-ring course with counter, timer, next-ring marker, chime, finish tune.
8. **Runway with take-off and landing** (user chose both; key = **Space**). Every flight starts parked on the runway. Hangar, tower, windsock. Jet got retractable wheels.

Bugs found and fixed while testing:
- Right after lift-off the plane counted as "landed" again (wheels still centimetres above the runway). Fixed with `climbedAway`.
- The first runway spot had a 140 m hill just past the end and high ground on the approach (the plane crashed in a landing test). The runway search now also needs low ground for 1.5 km beyond both ends; the runway moved to the north side, taking off east.

Tested with simulated input: take-off (lifts off after 6.7 s at 108 km/h, climbs clear), landing (touchdown 144 km/h, sink 2.9 m/s, stops on the runway, "Landed!" message), too-fast landing → crash with an explaining message, all 15 rings passed in order without crashing, no console errors.

Not yet checked by a person with a real mouse: feel at the new slower speeds, how hard landing is, how hard the rings are.

## Why it was rewritten (version 1)
The user's original single-file version (`flight-sim.html`, repo root, not published) was hard to play: all-or-nothing keyboard steering, no recovery when upside down, turning needed bank + pull together, and the camera rolled with the plane. User asked for mouse-only control and to focus on the flying first.

## Left out on purpose
The original had combat (enemy drones, guns, missiles, radar, health, touch controls). Not ported. The code is still in `flight-sim.html`.

## Decisions and user preferences
- Mouse only for flying (wheel throttle, left boost, right look). The only key is N for sound.
- Desktop with a mouse is the target; touch devices see a "needs a mouse" message.
- User wants a calm sightseeing feel, not rushing. Keep graphics simple (low-poly + pixel characters), focus on gameplay.
- Work step by step: user tests each version, then gives the next list.

## Open points / ideas
- The runway is far from the village (~3.5 km); the ring course visits the village later.
- Ring positions are hand-picked for the current terrain; recheck if the terrain or runway search changes.
- Villagers can't be seen well from high up (they are ~3 m tall sprites); fine at low height.

## Next steps
User tests version 2 on the `flight-sim` branch, then decides: commit, merge into `main`, and publish (confirm first), or more changes.
