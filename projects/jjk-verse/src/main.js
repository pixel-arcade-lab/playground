// Starts the game: screen size, physics, and the list of scenes (screens).
// Phaser is loaded in index.html and is available as the global "Phaser".
import { BootScene } from './scenes/boot.js';
import { TitleScene } from './scenes/title.js';
import { LevelScene } from './scenes/level.js';
import { HudScene } from './scenes/hud.js';
import { PauseScene } from './scenes/pause.js';
import { ResultScene } from './scenes/result.js';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: 960,                 // the game is drawn at 960 x 540, then stretched to fit the window
  height: 540,
  backgroundColor: '#07060d',
  pixelArt: true,             // keep pixels sharp (no blurring when scaled up)
  physics: {
    default: 'arcade',        // simple box physics: gravity, walls, floors
    arcade: { gravity: { x: 0, y: 1100 }, debug: false },
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // Scenes are drawn in this order: the HUD and pause screen sit on top of the level
  scene: [BootScene, TitleScene, LevelScene, HudScene, PauseScene, ResultScene],
});

// Handy for testing from the browser console
window.jjk = game;
