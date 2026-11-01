// Pause screen: shown on top of the frozen level.
import { TEXT } from './title.js';

export class PauseScene extends Phaser.Scene {
  constructor() { super('pause'); }

  create() {
    this.add.rectangle(480, 270, 960, 540, 0x07060d, 0.6);
    this.add.text(480, 220, 'PAUSED', { ...TEXT, fontSize: '48px', color: '#ffe27a' }).setOrigin(0.5);
    this.add.text(480, 290, 'Esc or Enter: continue', { ...TEXT, fontSize: '20px' }).setOrigin(0.5);
    this.add.text(480, 322, 'Q: quit to the title screen', { ...TEXT, fontSize: '20px' }).setOrigin(0.5);

    const resume = () => { this.scene.resume('level'); this.scene.stop(); };
    this.input.keyboard.on('keydown-ESC', resume);
    this.input.keyboard.on('keydown-ENTER', resume);
    this.input.keyboard.on('keydown-Q', () => {
      this.scene.stop('hud');
      this.scene.stop('level');
      this.scene.start('title');
    });
  }
}
