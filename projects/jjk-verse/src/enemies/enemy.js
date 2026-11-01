// What every curse has in common: health, getting hit (flash + knock-back + short stun), and being exorcised.
import * as fx from '../effects.js';
import * as sound from '../sound.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, hp) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);
    this.hp = hp;
    this.dead = false;
    this.stun = 0;           // seconds of being stunned after a hit (stunned curses don't hurt you)
    this.knockScale = 1;     // flyers are knocked back less
  }

  // dmg: damage. dir: direction of the punch (1 right, -1 left). power: how far it is knocked back.
  hurt(dmg, dir, power = 1) {
    if (this.dead) return;
    this.hp -= dmg;
    fx.flashWhite(this.scene, this);
    this.stun = 0.35;
    // Light hits only nudge it (so the combo keeps connecting); strong hits throw it up and away
    const up = power >= 1.5 ? -110 * power : -30;
    this.setVelocity(dir * 130 * power * this.knockScale, up * this.knockScale);
    if (this.hp <= 0) this.exorcise();
  }

  exorcise() {
    this.dead = true;
    this.body.enable = false;
    sound.enemyDie();
    fx.puff(this.scene, this.x, this.y, 0xb48cff, 10, 26);
    this.scene.player.gainEnergy(5);
    this.scene.tweens.add({ targets: this, alpha: 0, scaleX: 1.6, scaleY: 0.3, duration: 220, onComplete: () => this.destroy() });
  }

  // True when touching it should hurt the player
  get harmful() { return !this.dead && this.stun <= 0; }
}
