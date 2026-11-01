// End screens: "Level clear!" (with talismans and time) or "Game over" (all 3 lives used).
import { addScreenBackground, TEXT } from './title.js';
import { LEVELS } from '../levels/index.js';
import { state } from '../state.js';
import * as sound from '../sound.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('result'); }

  create(data) {
    addScreenBackground(this);
    this.add.rectangle(480, 270, 960, 540, 0x07060d, 0.55);
    let next;

    if (data.type === 'clear') {
      this.add.text(480, 150, 'LEVEL CLEAR!', { ...TEXT, fontSize: '56px', color: '#ffe27a' }).setOrigin(0.5);
      const lines = [
        `Talismans found: ${data.talismans} / ${data.total}`,
        `Time: ${data.time.toFixed(1)} s`,
        `Best: ${data.best.talismans} talismans, ${data.best.bestTime.toFixed(1)} s`,
      ];
      lines.forEach((l, i) => this.add.text(480, 240 + i * 34, l, { ...TEXT, fontSize: '22px' }).setOrigin(0.5));
      const hasNext = data.level < LEVELS.length;
      this.add.text(480, 400, hasNext ? 'Press Enter for the next level' : 'More levels coming soon! Press Enter for the title screen',
        { ...TEXT, fontSize: '20px', color: '#ffb3c0' }).setOrigin(0.5);
      next = () => (hasNext ? this.scene.start('level', { level: data.level + 1 }) : this.scene.start('title'));
    } else {
      this.add.text(480, 180, 'GAME OVER', { ...TEXT, fontSize: '64px', color: '#ff4a5a' }).setOrigin(0.5);
      this.add.text(480, 260, 'All 3 lives used. The curses win this time...', { ...TEXT, fontSize: '22px' }).setOrigin(0.5);
      this.add.text(480, 360, 'Press Enter to start the game again', { ...TEXT, fontSize: '22px', color: '#ffe27a' }).setOrigin(0.5);
      next = () => { state.newGame(); this.scene.start('level', { level: 1 }); };
    }

    // Wait a moment before accepting Enter, so a key held from playing doesn't skip this screen
    this.time.delayedCall(600, () => this.input.keyboard.once('keydown-ENTER', () => { sound.select(); next(); }));
  }
}
