// The world: two islands in the sea, under an evening sky.
//   Main island: hills, mountains, forests, and a flat spot for the village (see life.js).
//   Volcano island (to the north-east): a high plateau with sea cliffs, a smoking volcano with lava
//   in its crater, and a river that falls off the cliff as a waterfall.
// The terrain shape comes from "noise" (smooth random numbers), so it looks natural but is the same every time.
import * as THREE from 'three';

export const WATER = 0;             // sea level
export const MAIN_R = 2700;         // main island size (roughly its radius, in metres)
export const VOLCANO = { x: 5300, z: -2700, plateau: 140, coast: 1290 };   // volcano island centre, plateau height, cliff distance

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth01 = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// Same "random" numbers every time
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(11);

// ---------- Noise ----------
function hash(x, z) { const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return h - Math.floor(h); }
function smooth(t) { return t * t * (3 - 2 * t); }
function valueNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  const u = smooth(xf), v = smooth(zf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z) {   // several layers of noise added together: big shapes plus small details
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < 5; i++) { sum += valueNoise(x * freq, z * freq) * amp; norm += amp; amp *= 0.5; freq *= 2; }
  return sum / norm;
}

// ---------- Main island ----------
// Natural height: high in the middle (mountains), falling into the sea at the edges.
function mainNatural(x, z) {
  const warp = (fbm(x * 0.0005 + 40, z * 0.0005 + 40) - 0.5) * 0.6;
  const d = Math.sqrt(x * x + z * z) / MAIN_R + warp;
  const fall = clamp(1 - d * d, 0, 1);
  const n = fbm(x * 0.0016 + 10, z * 0.0016 + 10);
  const ridge = Math.pow(1 - Math.abs(fbm(x * 0.0008 + 3, z * 0.0008 + 7) * 2 - 1), 2);
  return (n * 0.55 + ridge * 0.75 - 0.38) * 480 * fall - (1 - fall) * 50;
}

// The village needs flat, low land. Search the south side of the island (where you start)
// for the gentlest spot between 12 and 60 m high. Done once when the page loads.
export const VILLAGE = (() => {
  let best = null;
  for (let x = -1400; x <= 1400; x += 100) {
    for (let z = 900; z <= 2600; z += 100) {
      const hs = [mainNatural(x, z)];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        hs.push(mainNatural(x + Math.cos(a) * 320, z + Math.sin(a) * 320));
      }
      const mean = hs.reduce((s, h) => s + h, 0) / hs.length;
      if (mean < 12 || mean > 60 || Math.min(...hs) < 4) continue;
      const bumpiness = hs.reduce((s, h) => s + Math.abs(h - mean), 0);
      if (!best || bumpiness < best.score) best = { x, z, h: Math.round(mean), score: bumpiness };
    }
  }
  best = best || { x: 0, z: 1600, h: 25 };
  return { x: best.x, z: best.z, h: best.h, r: 330 };   // r: radius of the perfectly flat part
})();
const VILLAGE_BLEND = 220;   // metres over which the flat village ground blends into the hills

// The runway also needs a long flat strip. Search for the flattest place for a 660 m strip
// (trying several directions), not too close to the village and preferably near it.
export const RUNWAY = (() => {
  const halfLen = 330, minFromVillage = 800;
  let best = null;
  for (let x = -2000; x <= 2000; x += 200) {
    for (let z = -2000; z <= 2600; z += 200) {
      const fromVillage = Math.hypot(x - VILLAGE.x, z - VILLAGE.z);
      if (fromVillage < minFromVillage) continue;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI, dx = Math.cos(a), dz = Math.sin(a);
        const hs = [];
        for (let i = -4; i <= 4; i++) {
          for (const side of [-60, 0, 60]) hs.push(mainNatural(x + dx * i * (halfLen / 4) - dz * side, z + dz * i * (halfLen / 4) + dx * side));
        }
        const mean = hs.reduce((s, h) => s + h, 0) / hs.length;
        if (mean < 8 || mean > 70 || Math.min(...hs) < 4) continue;
        // Beyond both ends the ground must stay low, so planes can climb away and come in to land
        // (below a gentle 4° slope rising from the runway, for 1.5 km)
        let blocked = false;
        for (const end of [-1, 1]) {
          for (let d = 100; d <= 1500 && !blocked; d += 100) {
            const a2 = end * (halfLen + d);
            if (mainNatural(x + dx * a2, z + dz * a2) > mean + 8 + d * 0.07) blocked = true;
          }
        }
        if (blocked) continue;
        const score = hs.reduce((s, h) => s + Math.abs(h - mean), 0) / hs.length + fromVillage / 500;
        if (!best || score < best.score) best = { x, z, dx, dz, h: Math.round(mean), score };
      }
    }
  }
  best = best || { x: 800, z: 1200, dx: 1, dz: 0, h: 30 };
  // dir: the take-off direction. halfWidth: the paved part. flat: half-width of the flattened ground.
  return { x: best.x, z: best.z, dir: { x: best.dx, z: best.dz }, h: best.h, halfLen, halfWidth: 15, flat: 75 };
})();
const RUNWAY_BLEND = 160;
// Position relative to the runway: along = metres along the take-off direction from its centre, across = sideways
export function runwayCoords(x, z) {
  const rx = x - RUNWAY.x, rz = z - RUNWAY.z;
  return { along: rx * RUNWAY.dir.x + rz * RUNWAY.dir.z, across: -rx * RUNWAY.dir.z + rz * RUNWAY.dir.x };
}
export const isOnRunway = (x, z) => {
  const c = runwayCoords(x, z);
  return Math.abs(c.along) < RUNWAY.halfLen + 20 && Math.abs(c.across) < RUNWAY.halfWidth + 10;
};
// In line with the runway, where a plane would be coming in to land
export const isNearRunway = (x, z) => {
  const c = runwayCoords(x, z);
  return Math.abs(c.along) < RUNWAY.halfLen + 1500 && Math.abs(c.across) < 150;
};

function mainIsland(x, z) {
  let h = mainNatural(x, z);
  const dv = Math.hypot(x - VILLAGE.x, z - VILLAGE.z);
  if (dv < VILLAGE.r + VILLAGE_BLEND) h += (VILLAGE.h - h) * smooth01(1 - (dv - VILLAGE.r) / VILLAGE_BLEND);
  // Flatten the runway strip (rounded at the ends)
  const c = runwayCoords(x, z);
  const dr = Math.hypot(Math.max(0, Math.abs(c.along) - RUNWAY.halfLen), Math.abs(c.across));
  if (dr < RUNWAY.flat + RUNWAY_BLEND) h += (RUNWAY.h - h) * smooth01(1 - (dr - RUNWAY.flat) / RUNWAY_BLEND);
  return h;
}

// ---------- Volcano island ----------
const CONE_R = 820, CONE_H = 560, RIM_R = 160, CRATER_DEPTH = 70;
const RIVER = { start: 840, halfWidth: 32, depth: 12 };   // river runs south (+z) from the foot of the volcano
const coneAt = (r) => CONE_H * Math.pow(Math.max(0, 1 - r / CONE_R), 1.6);
// Wobbly coastline with big bays and small bumps
const coastAt = (x, z) => VOLCANO.coast + (fbm(x * 0.0015 + 20, z * 0.0015) - 0.5) * 380 + (fbm(x * 0.005 + 3, z * 0.005 + 3) - 0.5) * 70;

// The coast changes as you go round the island: tall cliffs, low cliffs, or sandy beaches.
// It only depends on the direction from the centre, so it changes smoothly along the coast.
// The south side (where the waterfall is) is always a cliff at the standard plateau height.
function coastStyle(x, z) {
  const a = Math.atan2(z - VOLCANO.z, x - VOLCANO.x);
  const cx = Math.cos(a), cz = Math.sin(a);
  let fromSouth = Math.abs(a - Math.PI / 2);                 // south (+z) is the angle π/2
  if (fromSouth > Math.PI) fromSouth = 2 * Math.PI - fromSouth;
  const keep = smooth01((0.65 - fromSouth) / 0.3);           // 1 near the waterfall, 0 further round
  const beach = smooth01((0.47 - fbm(cx * 1.6 + 30, cz * 1.6 + 30)) / 0.07) * (1 - keep);
  const plateau = 60 + fbm(cx * 2 + 50, cz * 2 + 50) * 200;   // cliff height varies from about 90 to 200 m
  const cliffWidth = 25 + fbm(cx * 3 + 7, cz * 3 + 7) * 70;   // some cliffs sheer, some sloping
  return {
    beach,
    plateau: plateau + (VOLCANO.plateau - plateau) * keep,
    cliffWidth: cliffWidth + (35 - cliffWidth) * keep,
  };
}

function volcanoIsland(x, z) {
  const dx = x - VOLCANO.x, dz = z - VOLCANO.z, r = Math.hypot(dx, dz);
  if (r > 1700) return -60;
  const coast = coastAt(x, z), style = coastStyle(x, z);
  const bumps = fbm(x * 0.004 + 5, z * 0.004 + 5) * 8 * smooth01((coast - 30 - r) / 40);
  // Cliff: drops straight from the plateau into the sea
  const cliffH = -40 + smooth01((coast - r) / style.cliffWidth) * (style.plateau + 40);
  // Beach: sand slopes gently out of the sea, stays low for ~80 m, then grassy hills rise to the plateau
  const beachH = r > coast
    ? 2.5 - (r - coast) * 0.25
    : 2.5 + Math.min(coast - r, 80) * 0.04 + smooth01((coast - 80 - r) / 280) * (style.plateau - 6);
  let h = cliffH + (beachH - cliffH) * style.beach + bumps;
  h += coneAt(Math.max(r, RIM_R));                       // the volcano, flat-topped at the rim...
  h -= CRATER_DEPTH * smooth01((RIM_R - r) / 60);        // ...with a crater dug into the top
  // River bed
  if (dz > RIVER.start - 100 && Math.abs(dx) < RIVER.halfWidth) {
    h -= RIVER.depth * smooth01(1 - Math.abs(dx) / RIVER.halfWidth) * smooth01((dz - RIVER.start + 100) / 80);
  }
  return h;
}
export const isOnVolcanoIsland = (x, z) => Math.hypot(x - VOLCANO.x, z - VOLCANO.z) < 1700;

// ---------- Height of the world ----------
export function heightAt(x, z) { return Math.max(mainIsland(x, z), volcanoIsland(x, z)); }
// Height of whatever is underneath: land, or the sea surface
export const groundAt = (x, z) => Math.max(heightAt(x, z), WATER);
// True when the plane has flown well away from both islands
export const farFromLand = (x, z) => Math.hypot(x, z) > MAIN_R + 1900 && Math.hypot(x - VOLCANO.x, z - VOLCANO.z) > VOLCANO.coast + 1500;

// A soft round glow, used for the sun, smoke and particles
export function glowTexture(stops) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------- Terrain colours ----------
const C = {
  sand: new THREE.Color('#d8bf86'), grass: new THREE.Color('#5a8a3c'), forest: new THREE.Color('#2f5a2c'),
  rock: new THREE.Color('#6f645c'), snow: new THREE.Color('#f2eff2'),
  darkSand: new THREE.Color('#7a6a58'), ash: new THREE.Color('#4a403d'), scorched: new THREE.Color('#6e3b2c'),
};
function colourAt(x, z, h, c) {
  const slope = Math.hypot(heightAt(x + 8, z) - heightAt(x - 8, z), heightAt(x, z + 8) - heightAt(x, z - 8)) / 16;
  if (isOnVolcanoIsland(x, z)) {
    const r = Math.hypot(x - VOLCANO.x, z - VOLCANO.z);
    if (h < 7) c.copy(C.darkSand).lerp(C.sand, coastStyle(x, z).beach);   // light sand on beaches, dark at cliff feet
    else if (h < 12) c.copy(C.sand).lerp(C.grass, (h - 7) / 5);
    else c.copy(C.grass).lerp(C.forest, clamp((h - 20) / 140, 0, 0.6));
    const onCone = smooth01((CONE_R + 60 - r) / 220);    // grass turns to dark ash on the volcano
    c.lerp(C.ash, onCone);
    c.lerp(C.scorched, smooth01((RIM_R + 120 - r) / 140));
    if (h > 10 && slope > 0.8) c.lerp(C.rock, clamp((slope - 0.8) / 0.5, 0, 1) * (1 - onCone));
  } else {
    if (h < 5) c.copy(C.sand);
    else if (h < 14) c.copy(C.sand).lerp(C.grass, (h - 5) / 9);
    else if (h < 120) c.copy(C.grass).lerp(C.forest, (h - 14) / 106);
    else if (h < 220) c.copy(C.forest).lerp(C.rock, (h - 120) / 100);
    else if (h < 290) c.copy(C.rock);
    else c.copy(C.rock).lerp(C.snow, Math.min(1, (h - 290) / 40));
    if (h > 10 && slope > 0.7) c.lerp(C.rock, clamp((slope - 0.7) / 0.5, 0, 1));   // steep slopes are bare rock
  }
  c.offsetHSL(0, 0, (hash(x * 0.02, z * 0.02) - 0.5) * 0.05);
}

// A square of terrain centred at (cx, cz), each grid point lifted to heightAt() and coloured
function terrainPatch(cx, cz, size, seg) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  geo.translate(cx, 0, cz);
  const p = geo.attributes.position, colors = [], c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = heightAt(x, z);
    p.setY(i, h);
    colourAt(x, z, h, c);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }));
}

export function buildWorld(scene) {
  const FOG = new THREE.Color('#e9976f');
  scene.background = FOG;
  scene.fog = new THREE.Fog(FOG, 1200, 6500);

  // Evening sky: a big ball around the camera, coloured from dark purple (top) to orange (horizon)
  const skyGeo = new THREE.SphereGeometry(6000, 32, 20);
  {
    const p = skyGeo.attributes.position, colors = [], c = new THREE.Color();
    const stops = [[-0.3, '#6a3b4a'], [0, '#f2a06e'], [0.06, '#ef8a6a'], [0.18, '#b76a86'], [0.4, '#5a4f8f'], [1, '#1b2150']]
      .map(([t, h]) => [t, new THREE.Color(h)]);
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / 6000;
      let k = 0;
      while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const [t0, c0] = stops[k], [t1, c1] = stops[k + 1];
      c.copy(c0).lerp(c1, clamp((t - t0) / (t1 - t0), 0, 1));
      colors.push(c.r, c.g, c.b);
    }
    skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -1;
  scene.add(sky);

  // Sun (a glowing picture far away) and lights
  const SUN_DIR = new THREE.Vector3(-0.75, 0.1, -0.65).normalize();
  const sunTex = glowTexture([[0, 'rgba(255,250,225,1)'], [0.1, 'rgba(255,228,165,1)'], [0.28, 'rgba(255,170,100,.45)'], [1, 'rgba(255,120,80,0)']]);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, fog: false, depthWrite: false, transparent: true }));
  sun.scale.set(1600, 1600, 1);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight('#9d86c9', '#3b2b2b', 2.0));
  const sunLight = new THREE.DirectionalLight('#ffb27a', 3.6);
  sunLight.position.copy(SUN_DIR);
  scene.add(sunLight);

  // Terrain: one patch for each island
  scene.add(terrainPatch(0, 0, 7400, 320));
  scene.add(terrainPatch(VOLCANO.x, VOLCANO.z, 3400, 170));

  // Sea
  const water = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), new THREE.MeshStandardMaterial({ color: '#2d4d80', roughness: 0.7, metalness: 0 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER;
  scene.add(water);

  // Trees: one cone shape copied many times (an "instanced" mesh is fast to draw)
  {
    const MAX = 3200;
    const treeGeo = new THREE.ConeGeometry(5, 16, 6);
    treeGeo.translate(0, 8, 0);
    const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ color: '#2a5532', flatShading: true, roughness: 1 }), MAX);
    const dummy = new THREE.Object3D();
    let placed = 0;
    const put = (x, z, h) => {
      const s = 0.7 + rand() * 0.8;
      dummy.position.set(x, h - 1.5, z);
      dummy.scale.set(s, s * (0.9 + rand() * 0.4), s);
      dummy.rotation.y = rand() * 6;
      dummy.updateMatrix();
      trees.setMatrixAt(placed++, dummy.matrix);
    };
    // Main island forests (not in or right around the village)
    for (let t = 0; t < 30000 && placed < 2700; t++) {
      const x = (rand() - 0.5) * 7000, z = (rand() - 0.5) * 7000, h = heightAt(x, z);
      if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < VILLAGE.r + 60) continue;
      const rc = runwayCoords(x, z);
      if (Math.abs(rc.along) < RUNWAY.halfLen + 500 && Math.abs(rc.across) < RUNWAY.flat + 40) continue;   // keep the runway and its approach clear
      if (h > 12 && h < 170 && fbm(x * 0.004, z * 0.004) > 0.45) put(x, z, h);
    }
    // Volcano island: woods on the plateau, away from the volcano and the river
    for (let t = 0; t < 8000 && placed < MAX; t++) {
      const x = VOLCANO.x + (rand() - 0.5) * 2800, z = VOLCANO.z + (rand() - 0.5) * 2800;
      const dx = x - VOLCANO.x, dz = z - VOLCANO.z, r = Math.hypot(dx, dz);
      if (r < CONE_R + 80 || r > coastAt(x, z) - 60 || (Math.abs(dx) < 60 && dz > 0)) continue;
      const h = heightAt(x, z);
      if (h > 14 && fbm(x * 0.005 + 9, z * 0.005) > 0.5) put(x, z, h);
    }
    trees.count = placed;
    scene.add(trees);
  }

  // Clouds: groups of soft low-poly puffs, spread over both islands
  {
    const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffd9c8', emissive: '#8a5560', flatShading: true, roughness: 1, transparent: true, opacity: 0.9 });
    const puff = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 80; i++) {
      const g = new THREE.Group(), n = 3 + Math.floor(rand() * 4);
      for (let k = 0; k < n; k++) {
        const m = new THREE.Mesh(puff, cloudMat), s = 20 + rand() * 26;
        m.scale.set(s, s * 0.55, s);
        m.position.set((rand() - 0.5) * 70, (rand() - 0.5) * 10, (rand() - 0.5) * 35);
        g.add(m);
      }
      g.position.set(1500 + (rand() - 0.5) * 15000, 450 + rand() * 350, -900 + (rand() - 0.5) * 13000);
      scene.add(g);
    }
  }

  // ---------- Volcano: glowing lava in the crater, and smoke rising out of it ----------
  const craterFloor = heightAt(VOLCANO.x, VOLCANO.z);
  const lava = new THREE.Mesh(new THREE.CircleGeometry(RIM_R - 50, 24), new THREE.MeshBasicMaterial({ color: '#ff6a1f' }));
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(VOLCANO.x, craterFloor + 5, VOLCANO.z);
  scene.add(lava);
  const lavaGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,140,60,.9)'], [1, 'rgba(255,90,30,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  lavaGlow.scale.set(420, 260, 1);
  lavaGlow.position.set(VOLCANO.x, craterFloor + 70, VOLCANO.z);
  scene.add(lavaGlow);

  const smokeTex = glowTexture([[0, 'rgba(255,255,255,.9)'], [0.5, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]);
  const smoke = [];
  for (let i = 0; i < 18; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: '#5c5250', transparent: true, depthWrite: false }));
    scene.add(s);
    smoke.push({ s, age: (i / 18) * 14, life: 14, side: (rand() - 0.5) * 60 });
  }

  // ---------- River and waterfall ----------
  // Find where the river reaches the cliff edge (going south from the volcano)
  let edgeZ = RIVER.start;
  while (edgeZ < 1700 && volcanoIsland(VOLCANO.x, VOLCANO.z + edgeZ) > VOLCANO.plateau - 20) edgeZ += 2;
  const riverY = VOLCANO.plateau - 2;
  const riverLen = edgeZ - RIVER.start;
  const river = new THREE.Mesh(new THREE.PlaneGeometry(RIVER.halfWidth * 1.15, riverLen + 30),
    new THREE.MeshStandardMaterial({ color: '#4f86b8', roughness: 0.3, metalness: 0.1 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(VOLCANO.x, riverY, VOLCANO.z + RIVER.start + riverLen / 2 - 10);
  scene.add(river);

  // The waterfall is a ribbon that hugs the cliff a few metres out, with moving white streaks
  const fallTexCanvas = document.createElement('canvas');
  fallTexCanvas.width = 32; fallTexCanvas.height = 64;
  {
    const g = fallTexCanvas.getContext('2d');
    g.fillStyle = '#9cc6e6'; g.fillRect(0, 0, 32, 64);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,.85)' : 'rgba(210,235,255,.7)';
      g.fillRect(Math.floor(rand() * 32), Math.floor(rand() * 64), 1 + Math.floor(rand() * 2), 6 + Math.floor(rand() * 14));
    }
  }
  const fallTex = new THREE.CanvasTexture(fallTexCanvas);
  fallTex.wrapS = fallTex.wrapT = THREE.RepeatWrapping;
  fallTex.magFilter = THREE.NearestFilter;
  fallTex.colorSpace = THREE.SRGBColorSpace;
  fallTex.repeat.set(2, 4);
  const fallGeo = new THREE.BufferGeometry();
  {
    const pos = [], uv = [], idx = [], w = RIVER.halfWidth * 0.55, steps = 40;
    const z0 = edgeZ - 30, z1 = edgeZ + 60;
    for (let i = 0; i <= steps; i++) {
      const dz = z0 + ((z1 - z0) * i) / steps;
      const ground = volcanoIsland(VOLCANO.x, VOLCANO.z + dz);
      const y = Math.max(Math.min(riverY, ground + 4), 0.5);
      pos.push(VOLCANO.x - w, y, VOLCANO.z + dz + 3, VOLCANO.x + w, y, VOLCANO.z + dz + 3);
      uv.push(0, -i / steps, 1, -i / steps);
      if (i < steps) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    fallGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    fallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    fallGeo.setIndex(idx);
    fallGeo.computeVertexNormals();
  }
  scene.add(new THREE.Mesh(fallGeo, new THREE.MeshBasicMaterial({ map: fallTex, side: THREE.DoubleSide })));
  // White foam where the waterfall hits the sea
  const foam = [];
  const foamTex = glowTexture([[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: foamTex, transparent: true, depthWrite: false }));
    const base = new THREE.Vector3(VOLCANO.x + (rand() - 0.5) * 50, 4, VOLCANO.z + edgeZ + 25 + rand() * 40);
    s.position.copy(base);
    scene.add(s);
    foam.push({ s, base, phase: rand() * 6 });
  }

  // ---------- Animation every frame ----------
  let time = 0;
  function update(dt) {
    time += dt;
    fallTex.offset.y += dt * 1.6;   // the streaks run down the waterfall
    lava.material.color.setHSL(0.05 + Math.sin(time * 1.7) * 0.015, 1, 0.5 + Math.sin(time * 2.3) * 0.06);
    for (const p of smoke) {
      p.age = (p.age + dt) % p.life;
      const t = p.age / p.life;
      p.s.position.set(VOLCANO.x + p.side * (1 - t) + t * 260, craterFloor + 20 + t * 420, VOLCANO.z - t * 120);   // drifts with the wind
      const size = 90 + t * 320;
      p.s.scale.set(size, size, 1);
      p.s.material.opacity = 0.6 * Math.sin(Math.PI * Math.min(1, t * 1.3));
    }
    for (const f of foam) {
      const k = 0.5 + 0.5 * Math.sin(time * 3 + f.phase);
      f.s.position.y = f.base.y + k * 4;
      f.s.scale.setScalar(16 + k * 10);
      f.s.material.opacity = 0.5 + k * 0.4;
    }
  }

  // Keep the sky and sun centred on the camera, so they always look infinitely far away
  function follow(cameraPos) {
    sky.position.copy(cameraPos);
    sun.position.copy(cameraPos).addScaledVector(SUN_DIR, 5200);
  }

  return { follow, update, waterfall: new THREE.Vector3(VOLCANO.x, riverY, VOLCANO.z + edgeZ) };
}
