// Boot: turns all the pixel-art drawings into textures and animations, then opens the title screen.
import { addDrawing, addTileset, addPainted } from '../../assets/pixel.js';
import { PLAYER_PALETTE, PLAYER_FRAMES, PLAYER_ANIMS } from '../../assets/sprites/player.js';
import { CRAWLER, FLYER } from '../../assets/sprites/curses.js';
import { TALISMAN, HEART, HEART_EMPTY, SPIKES, LANTERN_OFF, LANTERN_ON, TORII, LAMP, SPARK, CUE } from '../../assets/sprites/items.js';
import { TILES, TILE_PALETTE } from '../../assets/tiles.js';
import { addBackgrounds, addGlow } from '../../assets/backgrounds.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    // Player: one texture per frame ("player_idle", "player_runA", ...), then animations ("player_run", ...)
    for (const [name, rows] of Object.entries(PLAYER_FRAMES)) addDrawing(this, `player_${name}`, rows, PLAYER_PALETTE);
    for (const [name, a] of Object.entries(PLAYER_ANIMS)) {
      this.anims.create({ key: `player_${name}`, frames: a.frames.map((f) => ({ key: `player_${f}` })), frameRate: a.fps, repeat: a.loop ? -1 : 0 });
    }

    // Curses
    for (const [name, def, anim] of [['crawler', CRAWLER, 'walk'], ['flyer', FLYER, 'flap']]) {
      def.frames.forEach((rows, i) => addDrawing(this, `${name}_${i}`, rows, def.palette));
      this.anims.create({ key: `${name}_${anim}`, frames: def.frames.map((_, i) => ({ key: `${name}_${i}` })), frameRate: def.fps, repeat: -1 });
    }

    // Items and objects
    const items = { talisman: TALISMAN, heart: HEART, heart_empty: HEART_EMPTY, spikes: SPIKES, lantern_off: LANTERN_OFF,
      lantern_on: LANTERN_ON, torii: TORII, lamp: LAMP, fx_spark: SPARK, fx_cue: CUE };
    for (const [key, d] of Object.entries(items)) addDrawing(this, key, d.rows, d.palette);

    // Tiles, backgrounds, glows
    addTileset(this, 'tiles', TILES, TILE_PALETTE);
    addBackgrounds(this);
    addGlow(this, 'glow_warm', 64, 'rgba(255,200,110,0.55)');
    addGlow(this, 'glow_red', 64, 'rgba(255,60,90,0.5)');
    addPainted(this, 'fx_dot', 3, 3, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 3, 3); });
    // Black Flash burst: jagged black star with a red edge
    addPainted(this, 'fx_bf', 48, 48, (g) => {
      for (const [col, scale] of [['#ff2a3a', 1], ['#120008', 0.78]]) {
        g.fillStyle = col; g.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2, r = (i % 2 ? 9 : 23) * scale;
          g.lineTo(24 + Math.cos(a) * r, 24 + Math.sin(a) * r);
        }
        g.closePath(); g.fill();
      }
    });

    this.scene.start('title');
  }
}
