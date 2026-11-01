# JJK Verse — Plan (draft)

A 2D side-scrolling platformer in the browser, inspired by Jujutsu Kaisen: a young sorcerer runs, jumps and punches through cursed places at night, exploring for secrets and exorcising curses.
Feel inspirations: **Dangerous Dave** (simple tile levels, keys and doors, exploring), **Super Mario** (tight jumping, secrets), **Rayman** (fluid running and punching, lively backgrounds).

Status: **accepted by the user on 2026-11-01**, with one change: 3 lives, then the game restarts (no unlimited retries). Level 1 is built (see `context.md`).

---

## 1. The game in one paragraph
You play a first-year student at a sorcerer school (our own original character, in the City Walker style: inspired by the anime, not a copy). Each level is a cursed place at night: school grounds, an abandoned hospital, a forest shrine, a crowded train station. You run and jump through it, punch cursed spirits, find hidden talismans, and reach the exit. Cursed energy fills up as you fight and powers special moves. Each world ends with a boss curse.

## 2. Core gameplay (what you do every second)
| Action | Idea |
|---|---|
| Run, jump | Responsive, "Mario-feel" jumping: hold longer = jump higher, small grace time after leaving a ledge, a jump pressed slightly early still counts |
| Punch combo | 3-hit combo, short knock-back on enemies |
| Dash | Quick burst forward (also through gaps), short cooldown |
| **Delayed punch** | Inspired by Divergent Fist: hit lands, then a second shock hits a moment later |
| **Black Flash** | Timing mechanic: press punch exactly on a shown beat → screen flashes black/red, big damage, fills cursed energy |
| Cursed energy meter | Fills by hitting enemies; spent on special moves |
| **Domain** (later) | Ultimate: screen turns into a special background for a few seconds and all enemies on screen are hit |
| Explore | Hidden rooms, breakable walls, keys and locked gates (Dave-style), collectible talismans |

## 3. Enemies (cursed spirits)
Start with 3, all simple to code, then grow:
1. **Crawler**: walks back and forth on a platform.
2. **Flyer**: floats in a wave pattern, swoops at the player.
3. **Spitter**: stays still, shoots slow cursed blobs.
4. **Boss** (end of world 1): big curse with 2–3 attack patterns and a health bar.

## 4. Levels (first world)
1. **School grounds at night**: tutorial: run, jump, punch, first crawlers.
2. **Old school building**: keys and locked doors, flyers, first hidden room.
3. **Forest shrine**: vertical climbing, spitters, Black Flash taught here.
4. **Boss**: a cursed spirit in the shrine courtyard.
Later worlds: abandoned hospital, train station (the "Shibuya" idea).

## 5. Look and sound
- **Pixel art**, drawn as text in code files (the same idea as the flight sim's `assets/characters/`). If we later want nicer art, we can switch to PNG sprite sheets drawn in a free pixel editor (Piskel or LibreSprite) without changing the game code.
- **Parallax backgrounds** (several layers moving at different speeds: moon, city skyline, trees) for depth, Rayman-style.
- Night colours: dark blue/purple with red-violet cursed glow.
- **Sounds** made in code (like City Walker and the flight sim): jump, punch, hit, Black Flash, pickup, enemy defeated. Music can come later.

## 6. Technology
- **Phaser 4**: a free, open-source library made for 2D browser games. It gives us, ready-made: sprites and animations, platform physics (gravity, collisions), tile maps, camera that follows the player, keyboard/gamepad input, sound. Loaded from a CDN with a fixed version (latest is 4.x, first released April 2026; the exact version is chosen and checked in step 0). No build tools, same as our other games.
- **Levels as text** in JS files, one character per tile (for example `#` = ground, `^` = spikes, `C` = crawler, `K` = key). Easy to read and change, no extra program needed. (Option for later: the free map editor *Tiled*, which Phaser can read.)
- **Controls (keyboard)**: arrows or A/D to move, Space or W to jump, J punch, K special, L dash, Esc pause. A platformer needs a keyboard; a gamepad can be added later. Phone touch buttons: maybe much later.
- **Save progress** (levels done, talismans found) in the browser's local storage.

## 7. Planned files
```
projects/jjk-verse/
  index.html            loads Phaser and starts the game
  src/main.js           game settings (screen size, physics), list of scenes
  src/scenes/           Title, Level, Pause, GameOver, (Boss)
  src/player.js         movement, combat, cursed energy
  src/enemies/          crawler.js, flyer.js, spitter.js, boss.js
  src/levels/           level1.js, level2.js ... (text maps + settings)
  src/sound.js          sounds made in code
  assets/sprites/       pixel-art drawings (player, enemies, tiles, items)
  assets/backgrounds/   parallax layers
  docs/                 plan.md, architecture.md, context.md
```

## 8. Steps (small, test after each)
| Step | What gets built | What you test |
|---|---|---|
| 0 | Folder, Phaser loading, empty dark scene, card on the home page | Page opens, no errors |
| 1 | **Movement feel** with a plain box on a test level: run, jump, variable jump height, ledge grace time, camera follow | Does jumping feel good? (most important step) |
| 2 | Pixel player with animations: idle, run, jump, fall, land | Looks and animates right |
| 3 | Text-based tile levels: ground, platforms you can jump up through, spikes, checkpoints, exit | Build and finish a small level |
| 4 | Punch combo, crawler + flyer enemies, health, knock-back, death/respawn | Fighting feels punchy |
| 5 | Cursed energy, delayed punch, dash, Black Flash timing | Specials are fun, not too easy |
| 6 | Level 1 complete: parallax background, talismans, sounds | Play from start to exit |
| 7 | Title screen, pause, game over, level select, saving progress | Full game loop works |
| 8 | Keys/locked doors/hidden rooms, spitter, levels 2–3 | Exploring is rewarding |
| 9 | Boss fight | Beatable, fair |
| 10 | Polish: screen shake, hit pause, particles, Domain ultimate | Feels great |

Each step ends with: docs updated, you test, then commit (after you confirm).

## 9. A note on the anime theme
Jujutsu Kaisen's names, characters and art belong to their owners, and this game is public. So, as with City Walker, we use **our own characters and names, inspired by the style** (cursed energy, curses, sorcerer school, black-flash-like timing) rather than copying real characters or logos.

## 10. Open questions for you
1. **Main character**: our own original student (recommended), or someone that looks clearly like Yuji?
2. **Art**: simple pixel art drawn in code (recommended to start), or would you rather draw/pick sprite images yourself?
3. **Game size for the first playable version**: one full level (steps 0–6), then decide?
4. **Levels**: one long adventure with a map you explore freely (Metroid-like), or separate levels with a level select (Mario-like, recommended — simpler)?
5. **Lives**: classic lives and game over, or unlimited retries from the last checkpoint (recommended — more relaxed)?
