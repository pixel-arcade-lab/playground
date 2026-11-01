// Crawler: walks back and forth, turning round at walls and at the edge of its platform. 3 hits.
import { Enemy } from './enemy.js';

export class Crawler extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'crawler_0', 3);
    this.body.setSize(14, 10).setOffset(1, 2);
    this.dir = -1;
    this.speed = 32;
    this.play('crawler_walk');
  }

  update(dt, layer) {
    if (this.dead) return;
    const b = this.body;
    if (this.stun > 0) {                   // knocked back: slide to a stop
      this.stun -= dt;
      if (b.blocked.down) this.setVelocityX(b.velocity.x * 0.85);
      return;
    }
    if (b.blocked.left) this.dir = 1;
    else if (b.blocked.right) this.dir = -1;
    else if (b.blocked.down) {
      // Look at the ground just ahead: if there's none, turn round instead of walking off
      const ahead = layer.getTileAtWorldXY(this.x + this.dir * 9, b.bottom + 2);
      if (!ahead || !ahead.collides) this.dir *= -1;
    }
    this.setVelocityX(this.dir * this.speed);
  }
}
