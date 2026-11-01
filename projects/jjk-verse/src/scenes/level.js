// The level: builds the map and everything in it, runs the game each frame, and handles
// checkpoints, pick-ups, losing a life (3 lives, then game over) and reaching the exit.
import { LEVELS } from '../levels/index.js';
import { buildLevel, TILE_SIZE } from '../level-builder.js';
import { BG_LAYERS } from '../../assets/backgrounds.js';
import { TILE } from '../../assets/tiles.js';
import { Player } from '../player.js';
import { Crawler } from '../enemies/crawler.js';
import { Flyer } from '../enemies/flyer.js';
import { state, saveLevelResult } from '../state.js';
import * as fx from '../effects.js';
import * as sound from '../sound.js';

const ZOOM = 2;   // the level is drawn 2x bigger, so you see 480 x 270 pixels of it (30 x 17 tiles)

export class LevelScene extends Phaser.Scene {
  constructor() { super('level'); }

  init(data) {
    this.levelNum = data.level || 1;
    this.def = LEVELS[this.levelNum - 1];
  }

  create() {
    this.ended = false;
    this.hitStopT = 0;
    this.elapsed = 0;
    this.talismansFound = 0;
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);

    // Background layers, fixed to the camera. With the zoom, a 480 x 270 layer at the screen centre fills the screen.
    this.bg = BG_LAYERS.map((l, i) => this.add.tileSprite(cam.width / 2, cam.height / 2, 480, 270, l.key).setScrollFactor(0).setDepth(-10 + i));

    // Map and world limits (no floor at the bottom: falling into a pit loses a life)
    const L = buildLevel(this, this.def);
    this.L = L;
    this.layer = L.layer;
    this.physics.world.setBounds(0, 0, L.width, L.height + 400);
    this.physics.world.setBoundsCollision(true, true, true, false);
    cam.setBounds(0, 0, L.width, L.height);

    // Groups of things
    this.enemies = this.add.group();
    this.talismans = this.physics.add.staticGroup();
    this.hearts = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    this.exits = this.physics.add.staticGroup();
    this.talismansTotal = 0;

    for (const t of L.things) this.placeThing(t);

    // Hints: little signs with text, floating in the level
    for (const h of L.hints) {
      this.add.text(h.x * TILE_SIZE, h.y * TILE_SIZE, h.text, {
        fontFamily: 'monospace', fontSize: '8px', color: '#f3ecf7', backgroundColor: '#1a1428', padding: { x: 3, y: 2 }, resolution: 4,
      }).setDepth(3).setAlpha(0.9);
    }

    // Collisions and touches
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.overlap(this.player, this.enemies, (p, e) => { if (e.harmful) p.hurt(1, e.x); });
    this.physics.add.overlap(this.player, this.spikes, (p, s) => {
      if (p.invuln > 0 || p.dead) return;
      p.hurt(1, s.x);
      if (!p.dead) p.setVelocityY(-300);
    });
    this.physics.add.overlap(this.player, this.talismans, (p, t) => this.collectTalisman(t));
    this.physics.add.overlap(this.player, this.hearts, (p, h) => {
      if (p.health >= 3) return;
      p.health += 1;
      sound.heart();
      fx.floatText(this, h.x, h.y - 6, '+1 heart', '#ff9aa8');
      h.destroy();
    });
    this.physics.add.overlap(this.player, this.checkpoints, (p, c) => this.lightCheckpoint(c));
    this.physics.add.overlap(this.player, this.exits, () => this.reachExit());

    // Camera follows the player smoothly, looking a little ahead
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.fadeIn(400);

    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,SPACE,Z,X,C,ESC,M');
    this.input.keyboard.on('keydown-M', () => { this.muted = sound.toggleMute(); });

    this.scene.launch('hud', { name: this.def.name });
    this.scene.bringToTop('hud');
  }

  // Create one thing from the map (x = centre of its tile, bottom = bottom of its tile)
  placeThing(t) {
    const { x, bottom } = t;
    switch (t.type) {
      case '@':
        this.player = new Player(this, x, bottom - 12);
        this.respawnPoint = { x, y: bottom - 12 };
        break;
      case 'c': this.enemies.add(new Crawler(this, x, bottom - 6)); break;
      case 'f': this.enemies.add(new Flyer(this, x, bottom - 8)); break;
      case 'T': {
        const s = this.talismans.create(x, bottom - 8, 'talisman').setDepth(5);
        this.tweens.add({ targets: s, y: s.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.talismansTotal++;
        break;
      }
      case 'H': this.hearts.create(x, bottom - 6, 'heart').setDepth(5); break;
      case '^': {
        const s = this.spikes.create(x, bottom - 4, 'spikes').setDepth(4);
        s.body.setSize(14, 6);   // a bit smaller than the picture, so brushing the tips is forgiven
        break;
      }
      case 'P': {
        const c = this.checkpoints.create(x, bottom - 10, 'lantern_off').setDepth(4);
        c.lit = false;
        break;
      }
      case 'E': {
        const g = this.exits.create(x + 8, bottom - 20, 'torii').setDepth(2);   // the gate is 2 tiles wide
        g.body.setSize(12, 40);
        this.add.image(g.x, g.y - 6, 'glow_red').setScale(1.4).setDepth(1).setAlpha(0.6);
        break;
      }
      case 'L':
        this.add.image(x, bottom - 16, 'lamp').setDepth(1);
        this.add.image(x, bottom - 29, 'glow_warm').setDepth(1).setScale(0.9);
        break;
      default:
        console.warn(`Level map: unknown thing "${t.type}" at column ${t.col}, row ${t.row}`);
    }
  }

  collectTalisman(t) {
    this.talismansFound++;
    sound.pickup();
    fx.floatText(this, t.x, t.y - 8, `${this.talismansFound} / ${this.talismansTotal}`);
    fx.puff(this, t.x, t.y, 0xffe27a, 6, 14);
    t.destroy();
  }

  lightCheckpoint(c) {
    if (c.lit) return;
    c.lit = true;
    c.setTexture('lantern_on');
    this.add.image(c.x, c.y - 3, 'glow_warm').setDepth(3).setScale(0.7);
    this.respawnPoint = { x: c.x, y: c.y + 10 - 12 };
    sound.checkpoint();
    fx.floatText(this, c.x, c.y - 16, 'Checkpoint', '#ffcf6a');
  }

  // A short freeze when a punch lands, so hits feel heavy ("hit-stop")
  hitStop(seconds) {
    this.hitStopT = Math.max(this.hitStopT, seconds);
    this.physics.world.pause();
  }

  // ---------- Losing a life ----------
  playerDied(cause) {
    const p = this.player;
    if (p.dead || this.ended) return;
    p.dead = true;
    p.health = 0;
    p.attack = null;
    p.zoneT = 0;
    p.aura.setVisible(false);
    p.body.setAllowGravity(true);
    sound.die();
    if (cause === 'hit') {               // jump up and fall off the screen, like in old platformers
      p.body.checkCollision.none = true;
      p.setVelocity(0, -260);
      p.play('player_hurt');
    }
    state.lives--;
    this.time.delayedCall(1100, () => {
      if (state.lives > 0) {
        this.cameras.main.fadeOut(250);
        this.time.delayedCall(280, () => {
          p.respawn(this.respawnPoint.x, this.respawnPoint.y);
          this.cameras.main.fadeIn(300);
        });
      } else {
        this.ended = true;
        sound.gameOver();
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(550, () => {
          this.scene.stop('hud');
          this.scene.start('result', { type: 'gameover', level: this.levelNum });
        });
      }
    });
  }

  reachExit() {
    if (this.ended || this.player.dead) return;
    this.ended = true;
    this.player.setVelocity(0, this.player.body.velocity.y);
    this.player.play('player_idle');
    sound.clear();
    const best = saveLevelResult(this.levelNum, this.talismansFound, this.elapsed);
    this.time.delayedCall(1400, () => {
      this.scene.stop('hud');
      this.scene.start('result', {
        type: 'clear', level: this.levelNum, talismans: this.talismansFound, total: this.talismansTotal,
        time: this.elapsed, best,
      });
    });
  }

  // ---------- Every frame ----------
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.updateBackground();
    if (this.ended) return;

    if (this.hitStopT > 0) {
      this.hitStopT -= dt;
      if (this.hitStopT <= 0) this.physics.world.resume();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.scene.launch('pause');
      this.scene.pause();
      return;
    }

    this.elapsed += dt;
    const p = this.player;
    p.update(dt, this.keys);
    for (const e of this.enemies.getChildren()) e.update(dt, this.layer, p);

    // Camera looks a little ahead in the direction you face
    const cam = this.cameras.main;
    cam.followOffset.x += (-p.facing * 30 - cam.followOffset.x) * Math.min(1, dt * 3);

    // Secret walls turn see-through while you're inside them
    const inside = this.layer.getTileAtWorldXY(p.x, p.y)?.index === TILE.FAKE_BRICK;
    if (inside !== this.insideSecret) {
      this.insideSecret = inside;
      for (const t of this.L.fakeTiles) t.alpha = inside ? 0.35 : 1;
      if (inside && !this.secretFound) { this.secretFound = true; fx.floatText(this, p.x, p.y - 20, 'Secret room!', '#b8f0ff'); sound.pickup(); }
    }

    // Fell into a pit
    if (!p.dead && p.y > this.L.height + 24) this.playerDied('pit');
  }

  updateBackground() {
    const cam = this.cameras.main;
    this.bg.forEach((l, i) => { l.tilePositionX = cam.scrollX * BG_LAYERS[i].speed; });
  }
}
