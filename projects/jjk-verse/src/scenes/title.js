// Title screen: game name, controls, "press Enter to start".
import { BG_LAYERS } from '../../assets/backgrounds.js';
import { state, loadProgress } from '../state.js';
import * as sound from '../sound.js';

export const TEXT = { fontFamily: 'monospace', color: '#f3ecf7', stroke: '#07060d', strokeThickness: 4 };

// The night background layers, covering the whole 960 x 540 screen (each layer is 480 x 270, drawn twice as big)
export function addScreenBackground(scene) {
  return BG_LAYERS.map((l, i) => scene.add.tileSprite(480, 270, 480, 270, l.key).setScale(2).setDepth(-10 + i));
}

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    this.layers = addScreenBackground(this);
    this.t = 0;
    this.add.rectangle(480, 270, 960, 540, 0x07060d, 0.35);

    this.add.text(480, 120, 'JJK VERSE', { ...TEXT, fontSize: '72px', fontStyle: 'bold', color: '#ffffff', stroke: '#c8323c', strokeThickness: 8 }).setOrigin(0.5);
    this.add.text(480, 182, 'Night of Curses', { ...TEXT, fontSize: '24px', color: '#ffb3c0' }).setOrigin(0.5);

    const controls = [
      ['Arrows / A D', 'move'],
      ['Space / W', 'jump (hold for higher)'],
      ['J', 'punch (3-hit combo)'],
      ['K', 'delayed punch (uses cursed energy)'],
      ['L', 'dash'],
      ['Esc', 'pause      M  sound on / off'],
    ];
    controls.forEach(([k, what], i) => {
      this.add.text(330, 250 + i * 26, k, { ...TEXT, fontSize: '18px', color: '#ffe27a' });
      this.add.text(500, 250 + i * 26, what, { ...TEXT, fontSize: '18px' });
    });

    const best = loadProgress()[1];
    if (best) this.add.text(480, 428, `Level 1 best: ${best.talismans} talismans, ${best.bestTime.toFixed(1)} s`, { ...TEXT, fontSize: '16px', color: '#c9bcd4' }).setOrigin(0.5);

    this.prompt = this.add.text(480, 470, 'Press Enter to start', { ...TEXT, fontSize: '26px', color: '#ffe27a' }).setOrigin(0.5);
    this.tweens.add({ targets: this.prompt, alpha: 0.25, duration: 650, yoyo: true, repeat: -1 });

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      sound.init();          // browsers allow sound only after a key press
      sound.select();
      state.newGame();
      this.scene.start('level', { level: 1 });
    };
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
  }

  update(time, delta) {
    this.t += delta / 1000;
    this.layers.forEach((l, i) => { l.tilePositionX = this.t * 12 * BG_LAYERS[i].speed; });   // slow drift
  }
}
