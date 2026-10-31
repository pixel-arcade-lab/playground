// Shared tools used by the map, the rooms and the character:
// pixel textures, materials (the "paint" for every surface), signs, and helpers to build boxes, roofs and floors.
import * as THREE from 'three';

// Same "random" numbers every time, so everything always looks the same
let seed = 11;
export function rand() {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
}
export const pick = (list) => list[Math.floor(rand() * list.length)];

// ---------- Pixel textures ----------
export function pixelCanvasTexture(canvas, repeat = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;   // keep pixels sharp, no blur
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function pixelTexture(w, h, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  paint(canvas.getContext('2d'), w, h);
  return pixelCanvasTexture(canvas);
}

export const dot = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
export const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

// Fill with a base colour plus random dots of other colours
export function fill(ctx, w, h, base, speckles, count) {
  rect(ctx, 0, 0, w, h, base);
  for (let i = 0; i < count; i++) dot(ctx, Math.floor(rand() * w), Math.floor(rand() * h), pick(speckles));
}

// Put a 1-pixel dark outline around everything drawn, like classic game sprites.
// cellW/cellH: the picture can be split into cells (poses) that should not touch each other.
export function addOutline(ctx, width, height, cellW, cellH, color) {
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const filled = (x, y) => d[(y * width + x) * 4 + 3] > 0;
  const edge = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (filled(x, y)) continue;
      const cx = Math.floor(x / cellW) * cellW;
      const cy = Math.floor(y / cellH) * cellH;
      const near = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(
        ([nx, ny]) => nx >= cx && nx < cx + cellW && ny >= cy && ny < cy + cellH && filled(nx, ny)
      );
      if (near) edge.push(x, y);
    }
  }
  ctx.fillStyle = color;
  for (let i = 0; i < edge.length; i += 2) ctx.fillRect(edge[i], edge[i + 1], 1, 1);
}

// A soft dark circle used as a shadow under feet and trees
export function blobShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

// A sign, board or scroll with text on it.
// vertical: true writes one character under the other (like a hanging scroll).
export function labelMaterial(lines, { w = 128, h = 40, bg = '#2b2523', fg = '#f3e6c4', size = 16, vertical = false, border = '#c8a24a' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  }
  ctx.fillStyle = fg;
  ctx.font = `bold ${size}px "Yu Gothic", "Meiryo", "MS Gothic", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rows = vertical ? [...lines[0]] : lines;
  const step = size * 1.2;
  const top = h / 2 - ((rows.length - 1) * step) / 2;
  rows.forEach((text, i) => ctx.fillText(text, w / 2, top + i * step));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: tex });
}

// ---------- Materials ----------
export function makeMaterials() {
  const T = {
    plaster: pixelTexture(16, 16, (c, w, h) => fill(c, w, h, '#e6dfcf', ['#d8d0be', '#efe9dc'], 40)),
    wood: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#6e4a2c', ['#7d5735', '#5f3f25'], 40);
      for (let y = 0; y < h; y++) { dot(c, 0, y, '#4a301b'); dot(c, 8, y, '#4a301b'); }
    }),
    darkWood: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#3f2a1a', ['#4a3220', '#352315'], 30);
      for (let y = 0; y < h; y++) dot(c, 0, y, '#2a1c11');
    }),
    floorboards: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#a87b4f', ['#b58859', '#9a6f45'], 50);
      for (let y = 0; y < h; y++) {
        const band = Math.floor(y / 4);
        for (let x = 0; x < w; x++) {
          if (y % 4 === 3) dot(c, x, y, '#7a5634');
          else if (x === (band * 5 + 3) % 16) dot(c, x, y, '#7a5634');
        }
      }
    }),
    vermilion: pixelTexture(16, 16, (c, w, h) => fill(c, w, h, '#cf4a2c', ['#b93d22', '#e0603c'], 30)),
    lacquer: pixelTexture(16, 16, (c, w, h) => fill(c, w, h, '#2b2523', ['#3a3330', '#221d1b'], 20)),
    roof: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#56606e', ['#5e6977', '#4d5664'], 20);
      for (let y = 0; y < h; y++) {
        const band = Math.floor(y / 4);
        for (let x = 0; x < w; x++) {
          if (y % 4 === 3) dot(c, x, y, '#343b46');
          else if (y % 4 === 0) dot(c, x, y, '#6c7786');
          else if ((x + (band % 2) * 2) % 4 === 0) dot(c, x, y, '#444c58');
        }
      }
    }),
    stone: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#9b968c', ['#a8a398', '#8d887f'], 40);
      for (let x = 0; x < w; x++) { dot(c, x, 0, '#6f6b64'); dot(c, x, 8, '#6f6b64'); }
      for (let y = 0; y < 8; y++) { dot(c, 0, y, '#6f6b64'); dot(c, 8, y + 8, '#6f6b64'); }
    }),
    darkStone: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#4a4744', ['#55524e', '#3e3b39'], 50);
      for (let x = 0; x < w; x++) { dot(c, x, 0, '#2c2a28'); dot(c, x, 8, '#2c2a28'); }
      for (let y = 0; y < 8; y++) { dot(c, 0, y, '#2c2a28'); dot(c, 8, y + 8, '#2c2a28'); }
    }),
    path: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#b4ada0', ['#bfb8ab', '#a69f92'], 40);
      for (let x = 0; x < w; x++) { dot(c, x, 0, '#86807a'); dot(c, x, 8, '#86807a'); }
      for (let y = 0; y < 8; y++) { dot(c, 4, y, '#86807a'); dot(c, 12, y + 8, '#86807a'); }
    }),
    gravel: pixelTexture(16, 16, (c, w, h) => fill(c, w, h, '#cdc6b5', ['#b5ae9d', '#ddd7c8', '#a59e8e'], 110)),
    grass: pixelTexture(16, 16, (c, w, h) => fill(c, w, h, '#5d7b40', ['#4b6834', '#6f8f4c', '#56743b'], 120)),
    water: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#3d6d88', ['#335d75', '#4a7d98'], 40);
      for (let x = 2; x < 7; x++) dot(c, x, 4, '#7fb2c9');
      for (let x = 9; x < 13; x++) dot(c, x, 11, '#7fb2c9');
    }),
    gold: pixelTexture(16, 16, (c, w, h) => fill(c, w, h, '#c8a24a', ['#e0c068', '#a8862f'], 30)),
    tatami: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#c9c27a', ['#bfb86f', '#d3cc86'], 60);
      for (let x = 0; x < w; x += 2) for (let y = 0; y < h; y++) if (rand() < 0.3) dot(c, x, y, '#b8b066');
      for (let x = 0; x < w; x++) { dot(c, x, 0, '#3e5a3a'); dot(c, x, 1, '#3e5a3a'); }
    }),
    shoji: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#f3eee0', ['#ebe5d5', '#f8f4ea'], 20);
      for (let y = 0; y < h; y++) { dot(c, 0, y, '#6e4a2c'); dot(c, 8, y, '#6e4a2c'); }
      for (let x = 0; x < w; x++) { dot(c, x, 0, '#6e4a2c'); dot(c, x, 5, '#6e4a2c'); dot(c, x, 10, '#6e4a2c'); }
    }),
    talisman: pixelTexture(8, 16, (c, w, h) => {
      fill(c, w, h, '#efe4c4', ['#e6d9b4'], 10);
      rect(c, 0, 0, w, 2, '#b3261e');
      for (let y = 4; y < 14; y++) if (rand() < 0.7) dot(c, 3 + Math.floor(rand() * 2), y, '#b3261e');
      dot(c, 2, 6, '#1a1414'); dot(c, 5, 9, '#1a1414'); dot(c, 3, 12, '#1a1414');
    }),
    metal: pixelTexture(16, 16, (c, w, h) => fill(c, w, h, '#7a7f87', ['#8c929b', '#646870'], 30)),
    ironGate: pixelTexture(16, 16, (c, w, h) => {
      rect(c, 0, 0, w, h, '#141212');
      for (let x = 0; x < w; x++) if (x % 4 === 1 || x % 4 === 2) for (let y = 0; y < h; y++) dot(c, x, y, x % 4 === 1 ? '#5a5d63' : '#3e4045');
      for (let x = 0; x < w; x++) { dot(c, x, 2, '#5a5d63'); dot(c, x, 13, '#5a5d63'); }
    }),
    doorWood: pixelTexture(16, 32, (c, w, h) => {
      fill(c, w, h, '#5a3a22', ['#62402a', '#50331e'], 30);
      c.strokeStyle = '#3a2414'; c.lineWidth = 1; c.strokeRect(0.5, 0.5, w - 1, h - 1);
      rect(c, 3, 3, 10, 11, '#6e4a2c');
      rect(c, 3, 18, 10, 11, '#6e4a2c');
      rect(c, 12, 15, 2, 2, '#c8a24a');
    }),
    window: pixelTexture(16, 16, (c, w, h) => {
      fill(c, w, h, '#cfe8f5', ['#e8f6ff', '#bcdcec'], 25);
      c.strokeStyle = '#5a3a22'; c.lineWidth = 1; c.strokeRect(0.5, 0.5, w - 1, h - 1);
      for (let i = 0; i < 16; i++) { dot(c, 8, i, '#5a3a22'); dot(c, i, 8, '#5a3a22'); }
    }),
    books: pixelTexture(16, 16, (c, w, h) => {
      rect(c, 0, 0, w, h, '#3f2a1a');
      const colors = ['#8e2b2b', '#2f4a7a', '#3f6a3a', '#c8a24a', '#6b2f5e', '#d9d0b8'];
      for (const top of [1, 9]) {
        for (let x = 0; x < w; x += 2) {
          const col = pick(colors);
          const tall = 5 + Math.floor(rand() * 2);
          rect(c, x, top + (7 - tall), 2, tall, col);
          dot(c, x, top + (7 - tall), '#1a1414');
        }
      }
    }),
    cushion: pixelTexture(16, 16, (c, w, h) => fill(c, w, h, '#6b2f5e', ['#7d3a6e', '#5a2650'], 20)),
  };
  const lambert = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });
  const onGround = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  return {
    plaster: lambert(T.plaster),
    wood: lambert(T.wood),
    darkWood: lambert(T.darkWood),
    floorboards: lambert(T.floorboards),
    vermilion: lambert(T.vermilion),
    lacquer: lambert(T.lacquer),
    roof: lambert(T.roof, { side: THREE.DoubleSide }),
    stone: lambert(T.stone),
    darkStone: lambert(T.darkStone),
    path: lambert(T.path, onGround),
    gravel: lambert(T.gravel, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    grass: lambert(T.grass),
    water: lambert(T.water, onGround),
    gold: lambert(T.gold),
    tatami: lambert(T.tatami, onGround),
    shoji: lambert(T.shoji, { emissive: 0x2a261c }),
    talisman: lambert(T.talisman, { side: THREE.DoubleSide }),
    metal: lambert(T.metal),
    ironGate: lambert(T.ironGate),
    doorWood: lambert(T.doorWood),
    window: new THREE.MeshBasicMaterial({ map: T.window }),
    books: lambert(T.books),
    cushion: lambert(T.cushion),
    lantern: new THREE.MeshLambertMaterial({ color: 0xffe2a0, emissive: 0xffb347, emissiveIntensity: 0.7 }),
    flame: new THREE.MeshBasicMaterial({ color: 0xffa040 }),
    lampPanel: new THREE.MeshBasicMaterial({ color: 0xfff3d6 }),
    cursedGlow: new THREE.MeshBasicMaterial({ color: 0xb26bff }),
    doorDark: new THREE.MeshBasicMaterial({ color: 0x120d0b }),
    noren: new THREE.MeshLambertMaterial({ color: 0x22325e, side: THREE.DoubleSide }),
    hill: new THREE.MeshLambertMaterial({ color: 0x4f6a52, flatShading: true }),
  };
}

// Make textures repeat by size (one texture tile = "tile" metres) instead of stretching
export function scaleBoxUV(geo, w, h, d, tile) {
  const uv = geo.attributes.uv;
  const sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];   // faces: +x, -x, +y, -y, +z, -z
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * sizes[f][0]) / tile, (uv.getY(k) * sizes[f][1]) / tile);
    }
  }
}

// A Japanese-style "hip" roof: slopes on all 4 sides with a ridge on top. Assumes w >= d.
export function hipRoofGeometry(w, d, h, tile) {
  const hw = w / 2, hd = d / 2, r = (w - d) / 2;
  const A = [-hw, 0, hd], B = [hw, 0, hd], C = [hw, 0, -hd], D = [-hw, 0, -hd];
  const R1 = [-r, h, 0], R2 = [r, h, 0];
  const faces = [[A, B, R2, 'z'], [C, D, R1, 'z'], [B, C, R2, 'x'], [D, A, R1, 'x']];
  if (r > 0) faces.push([A, R2, R1, 'z'], [C, R1, R2, 'z']);
  const slope = Math.hypot(h, hd) / hd;
  const pos = [], uv = [];
  for (const [p, q, s, axis] of faces) {
    for (const v of [p, q, s]) {
      pos.push(...v);
      if (axis === 'z') uv.push(v[0] / tile, ((hd - Math.abs(v[2])) * slope) / tile);
      else uv.push(v[2] / tile, ((hw - Math.abs(v[0])) * slope) / tile);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

// ---------- Building helpers ----------
// Everything built goes into "group". "solids" = boxes the player can't walk through.
// "blockers" = meshes the camera should not go through.
export function makeBuilder(group, M) {
  const solids = [];
  const blockers = [];

  function collider(x, y, z, w, h, d) {
    solids.push(new THREE.Box3(new THREE.Vector3(x - w / 2, y, z - d / 2), new THREE.Vector3(x + w / 2, y + h, z + d / 2)));
  }

  // A box with its bottom at height y
  function box(x, y, z, w, h, d, mat, { solid = true, block = true, tile = 2, shadow = true } = {}) {
    const geo = new THREE.BoxGeometry(w, h, d);
    scaleBoxUV(geo, w, h, d, tile);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (solid) {
      collider(x, y, z, w, h, d);
      if (block) blockers.push(mesh);
    }
    return mesh;
  }

  // A flat patch on the floor
  function flat(x, z, w, d, y, mat, tile = 2) {
    const geo = new THREE.PlaneGeometry(w, d);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * d) / tile);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // A flat upright picture (sign, door, window...). rotY turns it: 0 faces +z, PI/2 faces +x.
  function plane(x, y, z, w, h, rotY, mat) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.rotation.y = rotY;
    group.add(mesh);
    return mesh;
  }

  function roof(x, y, z, w, d, h, mat = M.roof) {
    const mesh = new THREE.Mesh(hipRoofGeometry(Math.max(w, d), Math.min(w, d), h, 2), mat);
    mesh.position.set(x, y, z);
    if (d > w) mesh.rotation.y = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  return { solids, blockers, collider, box, flat, plane, roof };
}
