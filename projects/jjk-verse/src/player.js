// Ren, the player: running, jumping, dashing, punching, cursed energy, health.
// Change the numbers in MOVE and COMBAT to tune how the game feels.
import * as fx from './effects.js';
import * as sound from './sound.js';

// Speeds are in pixels per second (1 tile = 16 pixels)
export const MOVE = {
  runSpeed: 125,
  groundAccel: 1500,   // how fast you reach full speed on the ground
  groundDecel: 1900,   // how fast you stop when you let go
  airAccel: 1000,      // steering in the air
  jumpSpeed: 390,      // a full jump is about 4 tiles high
  jumpCut: 0.45,       // letting go of jump early cuts the upward speed to this fraction (short hop)
  coyoteTime: 0.1,     // seconds after walking off a ledge when you can still jump
  jumpBuffer: 0.12,    // a jump pressed this many seconds before landing still happens
  maxFall: 430,
  dashSpeed: 330,
  dashTime: 0.2,       // a dash covers about 4 tiles
  dashCooldown: 0.5,
};

export const COMBAT = {
  maxHealth: 3,
  hurtInvuln: 1.0,      // seconds you can't be hurt again after a hit
  punchTime: 0.24,      // length of one punch
  hitAt: 0.05,          // when in the punch the fist connects
  chainAfter: 0.1,      // the next combo punch can start this soon
  comboWindow: 0.3,     // ...and up to this long after a punch ends
  reach: 16,            // how far in front the punch hits (pixels)
  damage: [1, 1, 2],    // combo punch 1, 2, 3
  energyPerHit: 8,
  maxEnergy: 100,
  // Black Flash: after the 2nd combo punch hits, a red spark appears on the fist after `bfDelay`
  // seconds and stays for `bfWindow` seconds. Punch while it shows → Black Flash.
  bfDelay: 0.12,
  bfWindow: 0.16,
  bfWindowZone: 0.26,   // easier to hit while in the Zone
  bfDamage: 5,
  bfEnergy: 30,
  bfRadius: 64,         // the shockwave also hits every curse this close to you...
  bfSplash: 3,          // ...for this much damage
  // The Zone: after a Black Flash, for `zoneTime` seconds your punches do `zoneBonus` extra damage
  zoneTime: 5,
  zoneBonus: 1,
  // Delayed punch (K): a normal hit now, then a cursed-energy shock a moment later
  delayedCost: 25,
  delayedDamage: 3,
  delayedAfter: 0.4,
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(20);
    this.body.setSize(10, 20).setOffset(3, 4);   // a slim box around the body (the picture is 16 x 24)
    this.body.setMaxVelocityY(MOVE.maxFall);
    this.setCollideWorldBounds(true);

    this.health = COMBAT.maxHealth;
    this.energy = 0;
    this.facing = 1;          // 1 = right, -1 = left
    this.dead = false;
    this.coyote = 0;
    this.buffer = 0;
    this.jumping = false;     // rising from a jump (so letting go can cut it short)
    this.wasOnGround = false;
    this.dashT = 0;
    this.dashCd = 0;
    this.airDashUsed = false;
    this.attack = null;       // the punch in progress: { step, t, hitDone, kind }
    this.comboT = 0;          // time left to chain the next combo punch
    this.lastStep = 0;
    this.bf = null;           // Black Flash chance: { t } since the 2nd punch hit
    this.hurtLock = 0;        // no control for a moment after being hit
    this.invuln = 0;
    this.trailT = 0;
    this.zoneT = 0;           // seconds of the Zone left
    this.aura = scene.add.image(x, y, 'glow_red').setDepth(19).setVisible(false);   // red glow while in the Zone
    this.play('player_idle');
  }

  get inZone() { return this.zoneT > 0; }
  bfWindowLength() { return this.inZone ? COMBAT.bfWindowZone : COMBAT.bfWindow; }

  // keys: the keyboard keys from the level scene. dt: seconds since last frame.
  update(dt, keys) {
    if (this.dead) return;
    const body = this.body;
    const JustDown = Phaser.Input.Keyboard.JustDown;
    const left = keys.LEFT.isDown || keys.A.isDown;
    const right = keys.RIGHT.isDown || keys.D.isDown;
    const input = (right ? 1 : 0) - (left ? 1 : 0);
    const jumpPressed = JustDown(keys.SPACE) || JustDown(keys.W) || JustDown(keys.UP);
    const jumpHeld = keys.SPACE.isDown || keys.W.isDown || keys.UP.isDown;
    const punchPressed = JustDown(keys.Z);
    const specialPressed = JustDown(keys.X);
    const dashPressed = JustDown(keys.C);
    const onGround = body.blocked.down || body.touching.down;

    // Timers
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtLock = Math.max(0, this.hurtLock - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.comboT = Math.max(0, this.comboT - dt);
    this.zoneT = Math.max(0, this.zoneT - dt);
    this.aura.setVisible(this.inZone).setPosition(this.x, this.y);
    if (this.inZone) this.aura.setAlpha(0.45 + 0.25 * Math.sin(this.zoneT * 12)).setScale(0.8 + 0.06 * Math.sin(this.zoneT * 7));
    this.coyote = onGround ? MOVE.coyoteTime : Math.max(0, this.coyote - dt);
    this.buffer = jumpPressed ? MOVE.jumpBuffer : Math.max(0, this.buffer - dt);
    this.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0 ? 0.35 : 1);   // blink while safe
    if (onGround) this.airDashUsed = false;
    if (onGround && !this.wasOnGround && body.velocity.y >= 0) { fx.dust(this.scene, this.x, this.y + 12); sound.land(); }
    this.wasOnGround = onGround;
    this.updateBlackFlash(dt);

    // ----- Dashing: straight line, no gravity -----
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.setVelocity(this.facing * MOVE.dashSpeed, 0);
      this.trailT -= dt;
      if (this.trailT <= 0) { this.trailT = 0.03; fx.afterimage(this.scene, this); }
      if (this.dashT <= 0) {
        body.setAllowGravity(true);
        this.setVelocityX(this.facing * MOVE.runSpeed);
        this.dashCd = MOVE.dashCooldown;
      }
      return;
    }

    // ----- Punches -----
    if (this.attack) this.updateAttack(dt);
    if (this.hurtLock <= 0) {
      if (specialPressed && !this.attack && this.energy >= COMBAT.delayedCost) {
        this.energy -= COMBAT.delayedCost;
        this.startPunch(1, 'delayed');
      } else if (punchPressed) {
        this.tryPunch();
      }
      if (dashPressed && this.dashCd <= 0 && !this.attack && !(this.airDashUsed && !onGround)) this.startDash(input, onGround);
      if (this.dashT > 0) return;
    }

    // ----- Running -----
    if (this.hurtLock <= 0) {
      if (input !== 0 && !this.attack) { this.facing = input; this.setFlipX(input < 0); }
      let target = input * MOVE.runSpeed;
      if (this.attack && onGround) target *= 0.25;     // you plant your feet when punching
      const vx = body.velocity.x;
      const accel = !onGround ? MOVE.airAccel : (input !== 0 ? MOVE.groundAccel : MOVE.groundDecel);
      const step = accel * dt;
      this.setVelocityX(vx < target ? Math.min(vx + step, target) : Math.max(vx - step, target));

      // ----- Jumping -----
      if (this.buffer > 0 && this.coyote > 0) {
        this.setVelocityY(-MOVE.jumpSpeed);
        this.buffer = 0; this.coyote = 0; this.jumping = true;
        sound.jump();
        fx.dust(this.scene, this.x, this.y + 12);
      }
      if (this.jumping && !jumpHeld && body.velocity.y < 0) {   // let go early → shorter jump
        this.setVelocityY(body.velocity.y * MOVE.jumpCut);
        this.jumping = false;
      }
      if (body.velocity.y >= 0) this.jumping = false;
    }

    this.chooseAnimation(onGround);
  }

  chooseAnimation(onGround) {
    if (this.hurtLock > 0) return this.play('player_hurt', true);
    if (this.attack) return;   // the punch sets its own picture
    if (onGround) this.play(Math.abs(this.body.velocity.x) > 20 ? 'player_run' : 'player_idle', true);
    else this.play(this.body.velocity.y < 0 ? 'player_jump' : 'player_fall', true);
  }

  startDash(input, onGround) {
    if (input !== 0) { this.facing = input; this.setFlipX(input < 0); }
    this.dashT = MOVE.dashTime;
    this.body.setAllowGravity(false);
    if (!onGround) this.airDashUsed = true;
    this.play('player_dash', true);
    sound.dash();
  }

  // ---------- Punching ----------
  tryPunch() {
    // Black Flash: the red spark is showing on the fist right now
    if (this.bf && this.bf.t >= COMBAT.bfDelay && this.bf.t <= COMBAT.bfDelay + this.bfWindowLength()) {
      this.bf = null;
      return this.startPunch(3, 'blackflash');
    }
    if (this.attack) {
      if (this.attack.t < COMBAT.chainAfter) return;          // too early, ignore
      this.lastStep = this.attack.step;
      return this.startPunch(this.lastStep % 3 + 1, 'normal');
    }
    this.startPunch(this.comboT > 0 ? this.lastStep % 3 + 1 : 1, 'normal');
  }

  startPunch(step, kind) {
    this.attack = { step, t: 0, hitDone: false, kind };
    this.play(`player_punch${step}`, true);
    if (kind === 'delayed') this.setTint(0xc4a0ff);
    if (this.body.blocked.down) this.setVelocityX(this.facing * 60);   // small step forward
    sound.punch();
  }

  updateAttack(dt) {
    const a = this.attack;
    a.t += dt;
    if (!a.hitDone && a.t >= COMBAT.hitAt) { a.hitDone = true; this.punchHits(a); }
    if (a.t >= COMBAT.punchTime) {
      this.lastStep = a.step;
      this.comboT = COMBAT.comboWindow;
      if (a.kind === 'delayed') this.clearTint();
      this.attack = null;
    }
  }

  // Which curses does this punch touch? Hit them.
  punchHits(a) {
    const scene = this.scene;
    const fistX = this.x + this.facing * 10, fistY = this.y + (a.step === 2 ? -4 : 0);
    const box = new Phaser.Geom.Rectangle(this.facing > 0 ? this.x : this.x - COMBAT.reach - 4, this.y - 12, COMBAT.reach + 4, 22);
    const targets = scene.enemies.getChildren().filter((e) => !e.dead && Phaser.Geom.Intersects.RectangleToRectangle(box, e.getBounds()));
    if (targets.length === 0) return;

    if (a.kind === 'blackflash') {
      for (const e of targets) { e.hurt(COMBAT.bfDamage, this.facing, 2.2); fx.blackFlash(scene, e.x, e.y); }
      // Shockwave: every other curse nearby is hit too, thrown away from you
      for (const e of scene.enemies.getChildren()) {
        if (e.dead || targets.includes(e)) continue;
        if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= COMBAT.bfRadius) {
          e.hurt(COMBAT.bfSplash, e.x < this.x ? -1 : 1, 1.8);
          fx.spark(scene, e.x, e.y, 1.5);
        }
      }
      fx.ring(scene, this.x + this.facing * 12, this.y, 0xff2a3a, 3);
      this.gainEnergy(COMBAT.bfEnergy);
      this.zoneT = COMBAT.zoneTime;
      sound.blackFlash();
      const cam = scene.cameras.main;
      cam.shake(260, 0.016);
      cam.zoomTo(2.35, 70);                                          // camera punches in...
      scene.time.delayedCall(220, () => cam.zoomTo(2, 260));         // ...and eases back out
      scene.hitStop(0.2);
      scene.events.emit('blackflash');                               // the HUD draws the black-and-red screen flash
      fx.floatText(scene, this.x, this.y - 22, 'BLACK FLASH!', '#ff4a5a');
      return;
    }

    const bonus = this.inZone && a.kind === 'normal' ? COMBAT.zoneBonus : 0;
    const dmg = (a.kind === 'delayed' ? 1 : COMBAT.damage[a.step - 1]) + bonus;
    for (const e of targets) {
      e.hurt(dmg, this.facing, a.step === 3 ? 1.6 : 0.35);
      fx.spark(scene, (fistX + e.x) / 2, fistY);
      if (a.kind === 'delayed') {
        // The second shock lands a moment later, wherever the curse is by then
        scene.time.delayedCall(COMBAT.delayedAfter * 1000, () => {
          if (!e.active || e.dead) return;
          fx.ring(scene, e.x, e.y);
          sound.shock();
          e.hurt(COMBAT.delayedDamage, this.facing, 1.4);
        });
      }
    }
    if (a.kind !== 'delayed') this.gainEnergy(COMBAT.energyPerHit * targets.length);
    sound.hit();
    scene.hitStop(0.04);
    if (a.step === 2 && a.kind === 'normal') this.bf = { t: 0, cued: false };   // Black Flash chance opens
  }

  updateBlackFlash(dt) {
    if (!this.bf) return;
    this.bf.t += dt;
    if (!this.bf.cued && this.bf.t >= COMBAT.bfDelay) {
      this.bf.cued = true;
      fx.cue(this.scene, this.x + this.facing * 12, this.y - 2);
      sound.cue();
    }
    if (this.bf.t > COMBAT.bfDelay + this.bfWindowLength()) this.bf = null;   // missed it
  }

  gainEnergy(n) { this.energy = Math.min(COMBAT.maxEnergy, this.energy + n); }

  // ---------- Getting hurt ----------
  // fromX: where the hit came from (you get knocked away from it)
  hurt(amount, fromX) {
    if (this.dead || this.invuln > 0 || this.dashT > 0) return;
    this.health -= amount;
    this.attack = null; this.bf = null; this.clearTint();
    sound.hurt();
    fx.flashWhite(this.scene, this, 100);
    this.scene.cameras.main.shake(120, 0.006);
    if (this.health <= 0) return this.scene.playerDied('hit');
    const away = this.x < fromX ? -1 : 1;
    this.setVelocity(away * 170, -230);
    this.hurtLock = 0.3;
    this.invuln = COMBAT.hurtInvuln;
  }

  // Back to life at (x, y), full health
  respawn(x, y) {
    this.dead = false;
    this.health = COMBAT.maxHealth;
    this.attack = null; this.bf = null; this.dashT = 0; this.hurtLock = 0;
    this.body.setAllowGravity(true);
    this.body.checkCollision.none = false;
    this.setPosition(x, y).setVelocity(0, 0).setAlpha(1).setAngle(0).clearTint();
    this.invuln = 1.5;
    this.zoneT = 0;
    this.aura.setVisible(false);
    this.play('player_idle');
  }
}
