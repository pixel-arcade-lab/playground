# City Walker — Context

Where the project stands, what was decided and why. Read this with `architecture.md` before continuing work.

## Current state (2026-10-31)
- Live: https://kartik-823.github.io/playground/projects/city-walker/
- Working and tested: walking/running/jumping, third-person auto camera, pixel-art character with 8-frame walk/run, Kyoto map, 5 indoor areas with door prompts (E or click) and fade, footstep and door sounds, small + big map.

## How it got here (versions)
1. First-person walker in a box city (WASD, mouse look, jump, wall collision). User: worked, but first person was hard to navigate.
2. Third person with a 3D block character inspired by an anime fighter look (pink spiky hair, dark blue high-collar jacket, red hood, red sneakers). User: looked like Minecraft.
3. Switched to Doom/Street-Fighter style: pixel-art sprite character, pixel textures, low-resolution rendering, Kyoto-style school map, and an auto-following camera.
4. More realistic walk/run animation; doors with prompts into rooms: Classroom ⇄ Discussion Room, Dojo, stone hut → Underground Stairs → Cursed Tool Storage.
5. Sound effects (Web Audio, no files) and the map (small + big, M key).

## Decisions and user preferences
- Character is **inspired by** the anime look, not a copy: own colours, no school badge. Keep it that way.
- Keep things simple and step by step; user tests each version before the next.
- Movement speed and jump height are approved as they are (walk 4, run 8).
- Camera should follow the character automatically (user asked); mouse still works.
- No backend for now. Progress saving, if needed, can use browser storage. A backend (e.g. Supabase/Firebase) only for accounts, leaderboards or multiplayer.
- Next big direction the user mentioned: **activities**, not just walking (ideas discussed: dojo training mini-game, finding hidden talismans, NPC dialogue, quests, inventory).

## Open points / ideas
- Writing on signs and the blackboard can be blurry at low resolution.
- Indoor brightness may need tuning after the user plays more.
- `window.cityWalker` debug handle is still in `index.html` (harmless).

## Next steps
Waiting for the user's choice of the first activity to build.
