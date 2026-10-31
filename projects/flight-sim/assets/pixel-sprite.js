// Helpers to turn small pixel-art drawings into flat pictures ("sprites") in the 3D world.
// A sprite always turns to face the camera, like a cardboard cut-out, which suits the pixel style.
//
// A character file (see assets/characters/) describes:
//   frames:  list of drawings; each drawing is a list of text rows, one letter = one pixel ('.' = see-through)
//   palette: which colour each letter means
//   height:  how tall it is in the world, in metres
//   frameTime: seconds per animation frame
// All drawings face RIGHT; the left-facing version is made automatically (mirrored).
import * as THREE from 'three';

function drawingToCanvas(rows, palette) {
  const w = rows[0].length, h = rows.length;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const col = palette[row[x]];
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
  });
  return cv;
}

function pixelTexture(canvas, mirrored) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;   // keep hard pixel edges, no blur
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (mirrored) { tex.repeat.x = -1; tex.offset.x = 1; }
  return tex;
}

// Prepare one kind of character (materials are shared by every copy, so many copies are cheap).
// paletteChange lets you recolour it, e.g. { c: '#3a6ea5' } for a blue shirt.
export function makeKind(def, paletteChange = {}) {
  const palette = { ...def.palette, ...paletteChange };
  const make = (rows, mirrored) => new THREE.SpriteMaterial({ map: pixelTexture(drawingToCanvas(rows, palette), mirrored), alphaTest: 0.5 });
  const rows0 = def.frames[0];
  return {
    right: def.frames.map((rows) => make(rows, false)),
    left: def.frames.map((rows) => make(rows, true)),
    height: def.height,
    width: def.height * rows0[0].length / rows0.length,
    frameTime: def.frameTime ?? 0.3,
  };
}

// One copy of a character in the world. Its bottom edge sits at its position (feet on the ground).
export function makeSprite(kind) {
  const sprite = new THREE.Sprite(kind.right[0]);
  sprite.center.set(0.5, 0);
  sprite.scale.set(kind.width, kind.height, 1);
  return {
    sprite,
    kind,
    frame: 0,
    timer: Math.random() * kind.frameTime,
    facingLeft: false,
    // Move the animation forward (only while moving, for walkers)
    animate(dt) {
      this.timer += dt;
      if (this.timer >= kind.frameTime) {
        this.timer -= kind.frameTime;
        this.frame = (this.frame + 1) % kind.right.length;
      }
      this.show();
    },
    face(left) { this.facingLeft = left; this.show(); },
    show() { sprite.material = (this.facingLeft ? kind.left : kind.right)[this.frame]; },
  };
}
