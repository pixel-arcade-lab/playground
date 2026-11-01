// Turns pixel-art text drawings into textures Phaser can use.
// A drawing is a list of text rows; each letter is one pixel and the palette says its colour ('.' = see-through).
// All rows of one drawing must be the same length (a warning appears in the console if not).

export function drawingToCanvas(rows, palette, name = 'drawing') {
  const w = rows[0].length, h = rows.length;
  rows.forEach((row, i) => {
    if (row.length !== w) console.warn(`Pixel drawing "${name}": row ${i} is ${row.length} pixels wide, expected ${w}`);
  });
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

// Add one drawing to the game as a texture called `key`
export function addDrawing(scene, key, rows, palette) {
  scene.textures.addCanvas(key, drawingToCanvas(rows, palette, key));
}

// Put several square tile drawings side by side in one picture (a "tileset" for the tile map)
export function addTileset(scene, key, tiles, palette, size = 16) {
  const cv = document.createElement('canvas');
  cv.width = size * tiles.length; cv.height = size;
  const g = cv.getContext('2d');
  tiles.forEach((rows, i) => g.drawImage(drawingToCanvas(rows, palette, `${key} tile ${i}`), i * size, 0));
  scene.textures.addCanvas(key, cv);
}

// A texture drawn with normal canvas drawing commands (for glows, backgrounds and effects)
export function addPainted(scene, key, w, h, paint) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  paint(cv.getContext('2d'), w, h);
  scene.textures.addCanvas(key, cv);
}

// Same "random" numbers every time, so drawings made with randomness look the same on every visit
export function seededRandom(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
