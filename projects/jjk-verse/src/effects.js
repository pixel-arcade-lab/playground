// Short visual effects: sparks, dust, puffs, rings, the Black Flash burst, floating text, flashes.
// Each one creates a small picture, animates it with a "tween" (a smooth change over time) and removes it.

const FX_DEPTH = 30;

export function spark(scene, x, y, scale = 1) {
  const s = scene.add.image(x, y, 'fx_spark').setDepth(FX_DEPTH).setScale(scale).setRotation(Math.random() * 3);
  scene.tweens.add({ targets: s, scale: scale * 2, alpha: 0, duration: 160, onComplete: () => s.destroy() });
}

// Little dots flying out (enemy defeated, landing dust)
export function puff(scene, x, y, colour = 0xffffff, count = 6, speed = 24) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, d = speed * (0.5 + Math.random());
    const p = scene.add.image(x, y, 'fx_dot').setDepth(FX_DEPTH).setTint(colour);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 6, alpha: 0, duration: 380 + Math.random() * 200, onComplete: () => p.destroy() });
  }
}
export const dust = (scene, x, y) => puff(scene, x, y, 0xb9a9c9, 4, 10);

// A growing ring (the delayed punch's second shock)
export function ring(scene, x, y, colour = 0xb48cff, size = 1) {
  const g = scene.add.graphics().setDepth(FX_DEPTH).setPosition(x, y);
  g.lineStyle(2, colour, 1);
  g.strokeCircle(0, 0, 6);
  scene.tweens.add({ targets: g, scale: 3.2 * size, alpha: 0, duration: 320, onComplete: () => g.destroy() });
}

// Black Flash: a black-and-red burst
export function blackFlash(scene, x, y) {
  const b = scene.add.image(x, y, 'fx_bf').setDepth(FX_DEPTH).setScale(0.4).setRotation(Math.random() * 3);
  scene.tweens.add({ targets: b, scale: 1.7, rotation: b.rotation + 0.6, alpha: 0, duration: 340, onComplete: () => b.destroy() });
  ring(scene, x, y, 0xff2a3a, 1.6);
  puff(scene, x, y, 0xff2a3a, 10, 40);
}

// The "punch now!" cue on the fist
export function cue(scene, x, y) {
  const c = scene.add.image(x, y, 'fx_cue').setDepth(FX_DEPTH).setScale(0.6);
  scene.tweens.add({ targets: c, scale: 1.3, duration: 90, yoyo: true, onComplete: () => c.destroy() });
  return c;
}

// Text that rises and fades (e.g. "+1", "Checkpoint")
export function floatText(scene, x, y, text, colour = '#ffe27a') {
  const t = scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize: '8px', color: colour, stroke: '#000000', strokeThickness: 2, resolution: 4,
  }).setOrigin(0.5).setDepth(FX_DEPTH + 1);
  scene.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
}

// A see-through copy of a sprite that fades (dash trail)
export function afterimage(scene, sprite, colour = 0x8a6cff) {
  const a = scene.add.image(sprite.x, sprite.y, sprite.texture.key).setFlipX(sprite.flipX)
    .setDepth(sprite.depth - 1).setAlpha(0.5).setTint(colour);
  scene.tweens.add({ targets: a, alpha: 0, duration: 220, onComplete: () => a.destroy() });
}

// Flash a sprite pure white for a moment (when it gets hit)
export function flashWhite(scene, sprite, ms = 90) {
  sprite.setTint(0xffffff);
  if (sprite.setTintMode) sprite.setTintMode(Phaser.TintModes.FILL);
  scene.time.delayedCall(ms, () => {
    if (!sprite.active) return;
    sprite.clearTint();
    if (sprite.setTintMode) sprite.setTintMode(Phaser.TintModes.MULTIPLY);
  });
}
