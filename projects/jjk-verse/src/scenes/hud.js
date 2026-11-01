// HUD (heads-up display): hearts, lives, cursed energy, talismans, level name. Drawn on top of the level.
import { state } from '../state.js';
import { COMBAT } from '../player.js';
import { TEXT } from './title.js';

export class HudScene extends Phaser.Scene {
  constructor() { super('hud'); }

  create(data) {
    this.level = this.scene.get('level');
    this.hearts = [0, 1, 2].map((i) => this.add.image(28 + i * 26, 28, 'heart').setScale(3));
    this.lives = this.add.text(110, 14, '', { ...TEXT, fontSize: '22px' });
    this.add.text(20, 50, 'CURSED ENERGY', { ...TEXT, fontSize: '12px', color: '#c4a0ff', strokeThickness: 3 });
    this.bar = this.add.graphics();
    this.add.image(880, 30, 'talisman').setScale(2.5);
    this.talis = this.add.text(900, 16, '', { ...TEXT, fontSize: '22px' });
    this.add.text(480, 528, '←→ move · Space jump · Z punch · X delayed punch · C dash · Esc pause · M sound',
      { ...TEXT, fontSize: '13px', color: '#c9bcd4', strokeThickness: 3 }).setOrigin(0.5, 1).setAlpha(0.8);

    // "ZONE" label with a shrinking bar, shown after a Black Flash
    this.zoneText = this.add.text(20, 88, 'ZONE', { ...TEXT, fontSize: '16px', color: '#ff4a5a', strokeThickness: 3 }).setVisible(false);
    this.zoneBar = this.add.graphics();

    // Black Flash: the whole screen goes black for a split second, with red lightning bursting from the middle
    const onBlackFlash = () => this.blackFlashScreen();
    this.level.events.on('blackflash', onBlackFlash);
    this.events.once('shutdown', () => this.level.events.off('blackflash', onBlackFlash));

    // Level name, shown at the start and then fading away
    const name = this.add.text(480, 140, data.name || '', { ...TEXT, fontSize: '30px', color: '#ffe27a' }).setOrigin(0.5);
    this.tweens.add({ targets: name, alpha: 0, delay: 2200, duration: 800 });
  }

  update() {
    const p = this.level.player;
    if (!p) return;
    this.hearts.forEach((h, i) => h.setTexture(i < p.health ? 'heart' : 'heart_empty'));
    this.lives.setText(`Lives x${state.lives}`);
    this.talis.setText(`${this.level.talismansFound}/${this.level.talismansTotal}`);

    // Energy bar in 4 parts: each full part pays for one delayed punch
    const g = this.bar, x = 20, y = 68, w = 200, h = 12;
    g.clear();
    g.fillStyle(0x1a1428, 0.85).fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle(0x8a5cff, 1).fillRect(x, y, w * (p.energy / COMBAT.maxEnergy), h);
    g.fillStyle(0x07060d, 1);
    for (let i = 1; i < 4; i++) g.fillRect(x + (w * i) / 4 - 1, y, 2, h);

    // Zone time left
    const z = this.zoneBar;
    z.clear();
    this.zoneText.setVisible(p.inZone);
    if (p.inZone) {
      z.fillStyle(0xff2a3a, 0.9).fillRect(76, 94, 144 * (p.zoneT / COMBAT.zoneTime), 8);
      this.zoneText.setAlpha(0.7 + 0.3 * Math.sin(p.zoneT * 14));
    }
  }

  blackFlashScreen() {
    const g = this.add.graphics().setDepth(50);
    g.fillStyle(0x000000, 0.88).fillRect(0, 0, 960, 540);
    for (let i = 0; i < 9; i++) {           // jagged red lightning bolts from the centre outwards
      const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
      let x = 480, y = 270;
      g.lineStyle(i % 2 ? 3 : 5, i % 3 ? 0xff2a3a : 0xffffff, 1);
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += Math.cos(a) * 70 + (Math.random() - 0.5) * 50;
        y += Math.sin(a) * 70 + (Math.random() - 0.5) * 50;
        g.lineTo(x, y);
      }
      g.strokePath();
    }
    this.tweens.add({ targets: g, alpha: 0, delay: 110, duration: 220, onComplete: () => g.destroy() });
  }
}
