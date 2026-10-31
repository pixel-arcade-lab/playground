// The outdoor Kyoto map: a small temple-school area inspired by old Kyoto.
// Torii gates, a main hall on a stone platform, a five-floor pagoda, a classroom building, a dojo,
// a stone hut over the underground storage, lanterns, a pond, trees, walls and far-away hills.
import * as THREE from 'three';
import {
  rand, pick, dot, addOutline, blobShadowTexture, pixelCanvasTexture, labelMaterial, makeBuilder,
} from './textures.js';

// ---------- Tree pictures (flat sprites, like Doom) ----------
function treeMaterial(kind) {
  const W = 32, H = 48;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const palettes = {
    maple: ['#b3261e', '#d9472b', '#e8722f', '#8c1d18'],
    cherry: ['#f4b6c8', '#f8cfdb', '#e597ae', '#fde4ec'],
    pine: ['#2f5a3a', '#3d6e45', '#24492e', '#4c8052'],
  };
  const colors = palettes[kind];
  const shade = { maple: '#8c1d18', cherry: '#e597ae', pine: '#24492e' }[kind];   // darker colour for the bottom of each clump
  ctx.fillStyle = '#5a3b26'; ctx.fillRect(14, 26, 4, 22);
  ctx.fillStyle = '#3f2919'; ctx.fillRect(14, 26, 1, 22);
  if (kind === 'pine') {
    // Three layers of pointed branches
    for (let layer = 0; layer < 3; layer++) {
      const top = 2 + layer * 9;
      for (let row = 0; row < 12; row++) {
        const half = Math.round((5 + layer * 3) * (row / 11));
        for (let x = 16 - half; x <= 16 + half; x++) dot(ctx, x, top + row, row > 8 ? shade : pick(colors));
      }
    }
  } else {
    // Round clumps of leaves
    for (let n = 0; n < 14; n++) {
      const cx = 16 + (rand() - 0.5) * 16;
      const cy = 14 + (rand() - 0.5) * 14;
      const rad = 4 + rand() * 4;
      for (let y = Math.floor(cy - rad); y <= cy + rad; y++) {
        for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
          if (x < 1 || x > W - 2 || y < 1 || (x - cx) ** 2 + (y - cy) ** 2 > rad * rad) continue;
          dot(ctx, x, y, y > cy + rad * 0.4 ? shade : pick(colors));
        }
      }
    }
  }
  addOutline(ctx, W, H, W, H, '#1c1614');
  return new THREE.SpriteMaterial({ map: pixelCanvasTexture(canvas, false), alphaTest: 0.5 });
}

// ---------- Build the outdoor area ----------
export function buildKyoto(M) {
  const scene = new THREE.Scene();

  // Sky: blue at the top, warm near the horizon. Fog uses the horizon colour so far things fade into the sky.
  const HORIZON = '#f1dcc0';
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 1; skyCanvas.height = 64;
  const skyCtx = skyCanvas.getContext('2d');
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 64);
  skyGrad.addColorStop(0, '#5f9bd6');
  skyGrad.addColorStop(0.6, '#a9c8e0');
  skyGrad.addColorStop(1, HORIZON);
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 1, 64);
  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTexture;
  scene.fog = new THREE.Fog(HORIZON, 45, 220);

  // Lights
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x5a6b4a, 1.0));
  const sun = new THREE.DirectionalLight(0xffe6c0, 1.5);
  sun.position.set(40, 60, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
  scene.add(sun);

  const group = new THREE.Group();
  scene.add(group);
  const { solids, blockers, collider, box, flat, plane, roof } = makeBuilder(group, M);
  const doors = [];   // places where a "press E" prompt appears

  // For the map in the corner: shapes seen from above, and named places
  const shapes = [];
  const places = [];
  const mark = (kind, x, z, w, d) => shapes.push({ kind, x, z, w, d });

  // Torii gate. s = size (1 = big main gate)
  function torii(x, z, s) {
    mark('torii', x, z, 5.7 * s, 0.6 * s);
    for (const side of [-1, 1]) {
      box(x + side * 2.6 * s, 0, z, 0.5 * s, 5 * s, 0.5 * s, M.vermilion);
      box(x + side * 2.6 * s, 0, z, 0.62 * s, 0.5 * s, 0.62 * s, M.lacquer, { solid: false });
    }
    box(x, 4.0 * s, z, 7 * s, 0.35 * s, 0.35 * s, M.vermilion, { solid: false });   // lower beam
    box(x, 4.35 * s, z, 0.4 * s, 0.6 * s, 0.25 * s, M.lacquer, { solid: false });   // name plate
    box(x, 4.65 * s, z, 7.8 * s, 0.3 * s, 0.55 * s, M.vermilion, { solid: false }); // top beam
    box(x, 4.95 * s, z, 8.6 * s, 0.4 * s, 0.7 * s, M.lacquer, { solid: false });    // black cap
  }

  // Stone lantern
  function lantern(x, z) {
    box(x, 0, z, 0.8, 0.3, 0.8, M.stone, { solid: false });
    box(x, 0.3, z, 0.3, 0.9, 0.3, M.stone, { solid: false });
    box(x, 1.2, z, 0.7, 0.12, 0.7, M.stone, { solid: false });
    box(x, 1.32, z, 0.5, 0.5, 0.5, M.lantern, { solid: false, shadow: false });
    roof(x, 1.82, z, 0.95, 0.95, 0.4, M.stone);
    box(x, 2.18, z, 0.15, 0.2, 0.15, M.stone, { solid: false });
    collider(x, 0, z, 0.8, 2.4, 0.8);
  }

  // A simple Japanese building: stone base, white walls, wooden frame, tiled roof, sliding doors.
  function house(x, z, w, d, wallH, doorSide) {
    mark('building', x, z, w + 0.6, d + 0.6);
    box(x, 0, z, w + 0.6, 0.4, d + 0.6, M.stone);
    box(x, 0.4, z, w, wallH, d, M.plaster);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(x + (sx * w) / 2, 0.4, z + (sz * d) / 2, 0.35, wallH, 0.35, M.wood, { solid: false });
    }
    box(x, 0.4 + wallH - 0.4, z, w + 0.1, 0.4, d + 0.1, M.wood, { solid: false });
    box(x, 0.4 + wallH, z, w + 2.2, 0.3, d + 2.2, M.roof, { solid: false });
    roof(x, 0.7 + wallH, z, w + 1.8, d + 1.8, Math.min(w, d) * 0.4);
    const along = doorSide === 'z+' ? w : d;
    const count = Math.max(1, Math.floor(along / 3));
    for (let i = 0; i < count; i++) {
      const k = -along / 2 + (along / count) * (i + 0.5);
      if (doorSide === 'z+') box(x + k, 0.4, z + d / 2 + 0.04, 1.6, 2.2, 0.08, M.wood, { solid: false });
      else box(x + w / 2 + 0.04, 0.4, z + k, 0.08, 2.2, 1.6, M.wood, { solid: false });
    }
  }

  // An entrance you can go through, on a wall facing +x at "wallX".
  // Shows a dark doorway, a cloth curtain, a sign, and adds a "press E" spot in front of it.
  function entrance(wallX, z, floorY, label, sign, to) {
    plane(wallX + 0.1, floorY, z, 1.4, 2.3, Math.PI / 2, M.doorDark);
    plane(wallX + 0.16, floorY + 1.6, z, 1.7, 0.75, Math.PI / 2, M.noren);
    plane(wallX + 0.13, floorY + 2.45, z, 1.9, 0.55, Math.PI / 2, labelMaterial([sign], { w: 160, h: 46, size: 18 }));
    doors.push({ x: wallX + 0.9, z, y: 0, radius: 1.4, label, to });
  }

  // Tree sprite with a trunk you can't walk through
  const treeMats = { maple: treeMaterial('maple'), cherry: treeMaterial('cherry'), pine: treeMaterial('pine') };
  const treeShadowMat = new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false });
  function tree(x, z, kind, size = 1) {
    mark('tree-' + kind, x, z, 2.2 * size, 2.2 * size);
    const sprite = new THREE.Sprite(treeMats[kind]);
    sprite.center.set(0.5, 0);
    const sizes = { maple: [5.5, 7], cherry: [6, 7], pine: [5, 8] };
    sprite.scale.set(sizes[kind][0] * size, sizes[kind][1] * size, 1);
    sprite.position.set(x, 0, z);
    group.add(sprite);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.5 * size, 2.5 * size), treeShadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, 0.05, z);
    group.add(shadow);
    collider(x, 0, z, 0.5, 3, 0.5);
  }

  // ---- Ground ----
  const GRAVEL = { x: 0, z: -8, w: 56, d: 70 };          // temple courtyard
  const PATHS = [
    { x: 0, z: 12.55, w: 5, d: 66.9 },                    // main stone path, gate → hall
    { x: 13.25, z: -16, w: 21.5, d: 2.5 },                // path to the pagoda
    { x: 24, z: -17.6, w: 2.5, d: 3.2 },
    { x: 14.9, z: 40, w: 24.8, d: 2.5 },                  // path to the small shrine
    { x: 26, z: 28.5, w: 2.6, d: 21 },
  ];
  flat(0, 0, 400, 400, 0, M.grass);
  flat(GRAVEL.x, GRAVEL.z, GRAVEL.w, GRAVEL.d, 0.015, M.gravel);
  mark('gravel', GRAVEL.x, GRAVEL.z, GRAVEL.w, GRAVEL.d);
  for (const p of PATHS) {
    flat(p.x, p.z, p.w, p.d, 0.03, M.path);
    mark('path', p.x, p.z, p.w, p.d);
  }

  // ---- Outer walls: white plaster with a tiled top ----
  function wall(x, z, w, d) {
    mark('wall', x, z, w, d);
    box(x, 0, z, w, 2.6, d, M.plaster);
    box(x, 0, z, w + 0.05, 0.5, d + 0.05, M.stone, { solid: false });
    box(x, 2.6, z, w + 0.4, 0.35, d + 0.6, M.roof, { solid: false });
  }
  wall(0, -48, 96.8, 0.8);
  wall(48, 0, 0.8, 96.8);
  wall(-48, 0, 0.8, 96.8);
  wall(-26, 48, 44, 0.8);
  wall(26, 48, 44, 0.8);
  box(-4.4, 0, 48, 0.8, 3.2, 1.2, M.wood);
  box(4.4, 0, 48, 0.8, 3.2, 1.2, M.wood);

  // ---- Main gate and lanterns along the path ----
  torii(0, 44, 1);
  torii(0, -14, 0.8);
  for (const z of [36, 28, 20, 12, 4, -4]) {
    lantern(-4.6, z);
    lantern(4.6, z);
  }

  // ---- Main hall on a stone platform ----
  mark('platform', 0, -30, 24, 15);
  mark('hall', 0, -31.5, 18, 9);
  box(0, 0, -30, 24, 1.2, 15, M.stone);
  box(0, 0, -22.1, 8, 0.8, 0.8, M.stone);     // steps
  box(0, 0, -21.3, 8, 0.4, 0.8, M.stone);
  box(0, 1.2, -31.5, 18, 4.4, 9, M.plaster);
  box(0, 1.2 + 4.0, -31.5, 18.2, 0.45, 9.2, M.wood, { solid: false });
  for (const x of [-6, -2, 2, 6]) box(x, 1.2, -26.96, 2.6, 3.4, 0.1, M.wood, { solid: false });
  for (const x of [-10, -6, -2, 2, 6, 10]) box(x, 1.2, -23.2, 0.45, 4.4, 0.45, M.vermilion);
  for (const x of [-10, 10]) box(x, 1.2, -36.6, 0.45, 4.4, 0.45, M.vermilion);
  box(0, 5.6, -30.5, 24, 0.35, 15.5, M.roof, { solid: false });
  roof(0, 5.95, -30.5, 23, 14.5, 4.5);
  box(0, 10.3, -30.5, 9.5, 0.45, 0.7, M.lacquer, { solid: false });
  for (const x of [-4.75, 4.75]) box(x, 10.3, -30.5, 0.5, 0.9, 0.5, M.gold, { solid: false });

  // ---- Five-floor pagoda ----
  const px = 24, pz = -22;
  mark('pagoda', px, pz, 6, 6);
  box(px, 0, pz, 6, 0.8, 6, M.stone);
  let y = 0.8;
  for (let i = 0; i < 5; i++) {
    const s = 4.2 - i * 0.5;
    box(px, y, pz, s, 1.7, s, M.wood, { solid: i === 0 });
    box(px, y + 1.7, pz, s + 2.4, 0.25, s + 2.4, M.roof, { solid: false });
    roof(px, y + 1.95, pz, s + 2.2, s + 2.2, 0.7);
    y += 1.7 + 0.25 + 0.45;
  }
  box(px, y, pz, 0.25, 3.5, 0.25, M.gold, { solid: false });
  for (let i = 0; i < 4; i++) box(px, y + 0.6 + i * 0.7, pz, 0.7, 0.1, 0.7, M.gold, { solid: false });

  // ---- Classroom building and dojo (both open towards the courtyard, +x) ----
  house(-28, -12, 9, 14, 3.4, 'x+');
  entrance(-23.5, -12, 0.4, 'Enter the Classroom', '教室  Classroom',
    { area: 'classroom', pos: [0, 0, 2.6], facing: Math.PI });
  house(-28, 10, 9, 12, 3.4, 'x+');
  entrance(-23.5, 10, 0.4, 'Enter the Dojo', '道場  Dojo',
    { area: 'dojo', pos: [0, 0, 3.6], facing: Math.PI });

  // ---- Small shrine with a row of small torii gates ----
  house(26, 16, 3.6, 3.2, 2.4, 'z+');
  for (let i = 0; i < 7; i++) torii(26, 36 - i * 2.2, 0.55);

  // ---- Stone hut in the corner: stairs down to the underground storage ----
  mark('hut', -40, -28, 4, 4);
  box(-40, 0, -28, 4, 2.8, 4, M.darkStone);
  box(-40, 2.8, -28, 5, 0.25, 5, M.roof, { solid: false });
  roof(-40, 3.05, -28, 4.8, 4.8, 1.3);
  for (const side of [-1, 1]) plane(-37.93, 0.4, -28 + side * 1.1, 0.25, 0.75, Math.PI / 2, M.talisman);
  plane(-38 + 0.1, 0, -28, 1.4, 2.2, Math.PI / 2, M.doorDark);
  plane(-38 + 0.13, 2.25, -28, 1.9, 0.5, Math.PI / 2, labelMaterial(['↓ 倉庫  Storage'], { w: 160, h: 42, size: 17 }));
  doors.push({ x: -37.4, z: -28, y: 0, radius: 1.4, label: 'Go down the stairs', to: { area: 'stairway', pos: [0, 6, 9.6], facing: Math.PI } });

  // ---- Pond with a stone edge ----
  const pondX = -22, pondZ = 32, pondW = 12, pondD = 8;
  flat(pondX, pondZ, pondW, pondD, 0.04, M.water);
  mark('water', pondX, pondZ, pondW, pondD);
  box(pondX, 0, pondZ - pondD / 2, pondW + 1.2, 0.5, 0.6, M.stone);
  box(pondX, 0, pondZ + pondD / 2, pondW + 1.2, 0.5, 0.6, M.stone);
  box(pondX - pondW / 2, 0, pondZ, 0.6, 0.5, pondD, M.stone);
  box(pondX + pondW / 2, 0, pondZ, 0.6, 0.5, pondD, M.stone);
  box(-30, 0, 27, 1.4, 0.9, 1.1, M.stone);
  box(-14, 0, 37.5, 1.0, 0.7, 1.3, M.stone);

  // ---- Trees ----
  const trees = [
    [-15, -30, 'maple', 1.2], [15, -40, 'maple', 1.1], [-16, -20, 'maple'], [32, -8, 'maple'],
    [-16, 0, 'maple'], [16, 4, 'maple'], [-38, 0, 'maple'], [38, 10, 'maple'],
    [-9, 30, 'cherry'], [9, 30, 'cherry'], [-9, 18, 'cherry'], [9, 18, 'cherry'],
    [-12, 42, 'cherry'], [12, 43, 'cherry'], [-30, 40, 'cherry'],
    [36, -38, 'pine', 1.2], [-38, -38, 'pine', 1.2], [40, -20, 'pine'], [-40, 22, 'pine'],
    [38, 40, 'pine'], [-40, 42, 'pine'], [-8, -42, 'pine'], [8, -43, 'pine'],
  ];
  for (const [x, z, kind, size] of trees) tree(x, z, kind, size);

  // ---- Far-away hills around the city (Kyoto sits in a valley) ----
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + rand() * 0.2;
    const dist = 130 + rand() * 40;
    const radius = 25 + rand() * 25;
    const hill = new THREE.Mesh(new THREE.ConeGeometry(radius, 20 + rand() * 25, 7), M.hill);
    hill.position.set(Math.sin(angle) * dist, 8, Math.cos(angle) * dist);
    group.add(hill);
  }

  // ---- Named places for the map (enter: true = you can go inside) ----
  places.push(
    { name: 'Main Gate', x: 0, z: 44 },
    { name: 'Main Hall', x: 0, z: -30 },
    { name: 'Pagoda', x: 24, z: -22 },
    { name: 'Classroom', x: -28, z: -12, enter: true },
    { name: 'Dojo', x: -28, z: 10, enter: true },
    { name: 'Underground Storage', x: -40, z: -28, enter: true },
    { name: 'Shrine & Torii Path', x: 26, z: 24 },
    { name: 'Pond', x: -22, z: 32 },
  );

  // What the ground is made of at a spot, for footstep sounds
  const inside = (r, x, z) => Math.abs(x - r.x) <= r.w / 2 && Math.abs(z - r.z) <= r.d / 2;
  const pond = { x: pondX, z: pondZ, w: pondW, d: pondD };
  function surfaceAt(x, z, y) {
    if (y < 0.3 && inside(pond, x, z)) return 'water';
    if (y > 0.3) return 'stone';               // standing on steps, platforms, building bases
    if (PATHS.some((p) => inside(p, x, z))) return 'stone';
    if (inside(GRAVEL, x, z)) return 'gravel';
    return 'grass';
  }

  return {
    name: 'Kyoto School — Courtyard',
    scene,
    solids,
    blockers,
    doors,
    surfaceAt,
    mapInfo: { half: 50, shapes, places },
    spawn: new THREE.Vector3(0, 0, 40),
    spawnFacing: Math.PI,   // facing north, towards the main hall
  };
}
