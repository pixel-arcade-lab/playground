// Flyer: floats around its home spot. When you come close it swoops at you, then flies back. 2 hits.
// It ignores walls and gravity (it's a ghostly curse).
import { Enemy } from './enemy.js';

export class Flyer extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'flyer_0', 2);
    this.body.setAllowGravity(false);
    this.body.setSize(12, 9).setOffset(2, 3);
    this.home = { x, y };
    this.t = Math.random() * 6;
    this.mode = 'hover';     // 'hover', 'swoop' or 'return'
    this.modeT = 0;
    this.cooldown = 1;
    this.knockScale = 0.6;
    this.play('flyer_flap');
  }

  update(dt, layer, player) {
    if (this.dead) return;
    this.t += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.stun > 0) {
      this.stun -= dt;
      this.setVelocity(this.body.velocity.x * 0.9, this.body.velocity.y * 0.9);
      return;
    }
    const toPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (this.mode === 'hover') {
      const tx = this.home.x + Math.sin(this.t * 1.2) * 28, ty = this.home.y + Math.sin(this.t * 2.4) * 6;
      this.setVelocity((tx - this.x) * 3, (ty - this.y) * 3);
      if (toPlayer < 110 && this.cooldown <= 0 && !player.dead) {
        this.mode = 'swoop'; this.modeT = 1.0;
        const a = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.swoop = { x: Math.cos(a) * 95, y: Math.sin(a) * 95 };
      }
    } else if (this.mode === 'swoop') {
      this.setVelocity(this.swoop.x, this.swoop.y);
      this.modeT -= dt;
      if (this.modeT <= 0) { this.mode = 'return'; this.cooldown = 2; }
    } else {
      const a = Phaser.Math.Angle.Between(this.x, this.y, this.home.x, this.home.y);
      this.setVelocity(Math.cos(a) * 60, Math.sin(a) * 60);
      if (Phaser.Math.Distance.Between(this.x, this.y, this.home.x, this.home.y) < 6) this.mode = 'hover';
    }
    this.setFlipX(this.body.velocity.x < 0);
  }
}
