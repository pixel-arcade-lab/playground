// The world: an island with hills and mountains, sea, forests, clouds, an evening sky and a sun.
// The terrain shape comes from "noise" (smooth random numbers), so it looks natural but is the same every time.
import * as THREE from 'three';

export const WORLD = 5000;     // size of the island area in metres
const SEG = 220;               // terrain detail (grid squares per side)
export const WATER = 0;        // sea level

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

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

// ---------- Terrain height ----------
function hash(x, z) { const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return h - Math.floor(h); }
function smooth(t) { return t * t * (3 - 2 * t); }
function valueNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  const u = smooth(xf), v = smooth(zf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z) {   // several layers of noise added together: big shapes plus small details
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < 5; i++) { sum += valueNoise(x * freq, z * freq) * amp; norm += amp; amp *= 0.5; freq *= 2; }
  return sum / norm;
}

// Height of the land at (x, z). High in the middle (mountains), falling into the sea at the edges.
export function heightAt(x, z) {
  const warp = (fbm(x * 0.0005 + 40, z * 0.0005 + 40) - 0.5) * 0.6;
  const d = Math.sqrt(x * x + z * z) / (WORLD * 0.4) + warp;
  const fall = clamp(1 - d * d, 0, 1);
  const n = fbm(x * 0.0016 + 10, z * 0.0016 + 10);
  const ridge = Math.pow(1 - Math.abs(fbm(x * 0.0008 + 3, z * 0.0008 + 7) * 2 - 1), 2);
  return (n * 0.55 + ridge * 0.75 - 0.38) * 480 * fall - (1 - fall) * 50;
}
// Height of whatever is underneath: land, or the sea surface
export const groundAt = (x, z) => Math.max(heightAt(x, z), WATER);

// A soft round glow, used for the sun and for particles
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

export function buildWorld(scene) {
  const FOG = new THREE.Color('#e9976f');
  scene.background = FOG;
  scene.fog = new THREE.Fog(FOG, 700, 4300);

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

  // Terrain: a big flat grid, each point lifted to heightAt() and coloured by height and steepness
  const tGeo = new THREE.PlaneGeometry(WORLD, WORLD, SEG, SEG);
  tGeo.rotateX(-Math.PI / 2);
  {
    const tp = tGeo.attributes.position, colors = [], c = new THREE.Color();
    const sand = new THREE.Color('#d8bf86'), grass = new THREE.Color('#5a8a3c'), forest = new THREE.Color('#2f5a2c');
    const rock = new THREE.Color('#6f645c'), snow = new THREE.Color('#f2eff2');
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), z = tp.getZ(i), h = heightAt(x, z);
      tp.setY(i, h);
      const slope = Math.hypot(heightAt(x + 8, z) - heightAt(x - 8, z), heightAt(x, z + 8) - heightAt(x, z - 8)) / 16;
      if (h < 5) c.copy(sand);
      else if (h < 14) c.copy(sand).lerp(grass, (h - 5) / 9);
      else if (h < 120) c.copy(grass).lerp(forest, (h - 14) / 106);
      else if (h < 220) c.copy(forest).lerp(rock, (h - 120) / 100);
      else if (h < 290) c.copy(rock);
      else c.copy(rock).lerp(snow, Math.min(1, (h - 290) / 40));
      if (h > 10 && slope > 0.7) c.lerp(rock, clamp((slope - 0.7) / 0.5, 0, 1));   // steep slopes are bare rock
      c.offsetHSL(0, 0, (hash(x * 0.02, z * 0.02) - 0.5) * 0.05);
      colors.push(c.r, c.g, c.b);
    }
    tGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    tGeo.computeVertexNormals();
  }
  scene.add(new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 })));

  // Sea
  const water = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000), new THREE.MeshStandardMaterial({ color: '#2d4d80', roughness: 0.7, metalness: 0 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER;
  scene.add(water);

  // Trees: one cone shape copied many times (an "instanced" mesh is fast to draw)
  {
    const treeGeo = new THREE.ConeGeometry(5, 16, 6);
    treeGeo.translate(0, 8, 0);
    const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ color: '#2a5532', flatShading: true, roughness: 1 }), 1400);
    const dummy = new THREE.Object3D();
    let placed = 0;
    for (let t = 0; t < 12000 && placed < 1400; t++) {
      const x = (rand() - 0.5) * WORLD * 0.85, z = (rand() - 0.5) * WORLD * 0.85, h = heightAt(x, z);
      if (h > 12 && h < 170 && fbm(x * 0.004, z * 0.004) > 0.45) {
        const s = 0.7 + rand() * 0.8;
        dummy.position.set(x, h - 1.5, z);
        dummy.scale.set(s, s * (0.9 + rand() * 0.4), s);
        dummy.rotation.y = rand() * 6;
        dummy.updateMatrix();
        trees.setMatrixAt(placed++, dummy.matrix);
      }
    }
    trees.count = placed;
    scene.add(trees);
  }

  // Clouds: groups of soft low-poly puffs
  {
    const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffd9c8', emissive: '#8a5560', flatShading: true, roughness: 1, transparent: true, opacity: 0.9 });
    const puff = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 50; i++) {
      const g = new THREE.Group(), n = 3 + Math.floor(rand() * 4);
      for (let k = 0; k < n; k++) {
        const m = new THREE.Mesh(puff, cloudMat), s = 20 + rand() * 26;
        m.scale.set(s, s * 0.55, s);
        m.position.set((rand() - 0.5) * 70, (rand() - 0.5) * 10, (rand() - 0.5) * 35);
        g.add(m);
      }
      g.position.set((rand() - 0.5) * WORLD * 1.3, 450 + rand() * 300, (rand() - 0.5) * WORLD * 1.3);
      scene.add(g);
    }
  }

  // Keep the sky and sun centred on the camera, so they always look infinitely far away
  function follow(cameraPos) {
    sky.position.copy(cameraPos);
    sun.position.copy(cameraPos).addScaledVector(SUN_DIR, 5200);
  }

  return { follow };
}
