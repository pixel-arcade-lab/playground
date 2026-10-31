// Indoor places. Each room is its own small world (its own "scene") that you enter through a door.
//   Classroom  ⇄  Discussion Room
//   Dojo
//   Stone hut → Underground Stairs → Cursed Tool Storage
//
// Trick used for every room: the walls are drawn only from the INSIDE. So when the camera ends up
// behind a wall (outside the room), that wall becomes see-through and you still see your character.
import * as THREE from 'three';
import { makeBuilder, scaleBoxUV, labelMaterial } from './textures.js';

// Where you appear outside when leaving each building (a little in front of its door)
const OUTSIDE = {
  classroom: { area: 'outdoor', pos: [-20.9, 0, -12], facing: Math.PI / 2 },
  dojo: { area: 'outdoor', pos: [-20.9, 0, 10], facing: Math.PI / 2 },
  hut: { area: 'outdoor', pos: [-35.8, 0, -28], facing: Math.PI / 2 },
};

// Build an empty room: floor, walls, ceiling, invisible wall colliders, basic light.
// sound: what the floor sounds like when walking. mapSpot: which building this room is in, for the map.
function makeRoom(M, { name, w, d, h, floor, wall, ceiling, sound = 'wood', mapSpot, bg = 0x0b0908, fog = null, ambient = 0xfff0dd, ambientI = 0.8 }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.Fog(bg, fog[0], fog[1]);
  scene.add(new THREE.AmbientLight(ambient, ambientI));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x403830, 0.5));

  const group = new THREE.Group();
  scene.add(group);
  const b = makeBuilder(group, M);

  // The room "shell": one big box seen from the inside only
  const inside = (m) => { const c = m.clone(); c.side = THREE.BackSide; c.polygonOffset = false; return c; };
  const geo = new THREE.BoxGeometry(w, h, d);
  scaleBoxUV(geo, w, h, d, 2);
  const shell = new THREE.Mesh(geo, [inside(wall), inside(wall), inside(ceiling), inside(floor), inside(wall), inside(wall)]);
  shell.position.y = h / 2;
  shell.receiveShadow = true;
  group.add(shell);

  // Thick invisible walls just outside, so you can't walk out
  b.collider(0, 0, -d / 2 - 0.5, w + 2, h, 1);
  b.collider(0, 0, d / 2 + 0.5, w + 2, h, 1);
  b.collider(-w / 2 - 0.5, 0, 0, 1, h, d);
  b.collider(w / 2 + 0.5, 0, 0, 1, h, d);

  const doors = [];
  const lights = [];

  // Put a flat picture on the inside of a wall.
  // side: 'n' = back wall (-z), 's' = front wall (+z), 'w' = left wall (-x), 'e' = right wall (+x)
  // along: position along that wall. depth: how far it sits off the wall (to stack items).
  function onWall(side, along, y, pw, ph, mat, depth = 0.02) {
    if (side === 'n') return b.plane(along, y, -d / 2 + depth, pw, ph, 0, mat);
    if (side === 's') return b.plane(along, y, d / 2 - depth, pw, ph, Math.PI, mat);
    if (side === 'w') return b.plane(-w / 2 + depth, y, along, pw, ph, Math.PI / 2, mat);
    return b.plane(w / 2 - depth, y, along, pw, ph, -Math.PI / 2, mat);
  }

  // A door on a wall with a sign above it, plus the "press E" spot in front of it
  function door(side, along, label, sign, to, { y = 0, mat = M.doorWood } = {}) {
    onWall(side, along, y, 1.4, 2.4, mat, 0.03);
    onWall(side, along, y + 2.5, 1.9, 0.5, labelMaterial([sign], { w: 160, h: 42, size: 17 }), 0.03);
    const inset = 0.7;
    const spot = {
      n: [along, -d / 2 + inset], s: [along, d / 2 - inset],
      w: [-w / 2 + inset, along], e: [w / 2 - inset, along],
    }[side];
    doors.push({ x: spot[0], z: spot[1], y, radius: 1.4, label, to, sound: mat === M.ironGate ? 'gate' : 'door' });
  }

  function pointLight(x, y, z, color, intensity, distance) {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(x, y, z);
    scene.add(light);
    lights.push({ light, base: intensity });
    return light;
  }

  return {
    name, scene, group, b, solids: b.solids, blockers: b.blockers, doors, lights, onWall, door, pointLight, w, d, h,
    mapSpot: { x: mapSpot[0], z: mapSpot[1] },
    surfaceAt: () => sound,
    update: null,
  };
}

// Make torch / candle lights flicker a little
function flicker(room, time) {
  room.lights.forEach(({ light, base }, i) => {
    light.intensity = base * (0.85 + 0.1 * Math.sin(time * 11 + i * 2.1) + 0.05 * Math.sin(time * 23 + i));
  });
}

// ---------- Classroom ----------
function buildClassroom(M) {
  const R = makeRoom(M, { name: 'Classroom', w: 14, d: 10, h: 4.2, floor: M.floorboards, wall: M.plaster, ceiling: M.wood, mapSpot: [-28, -12] });
  const { b } = R;

  // Wooden panels on the lower part of every wall
  R.onWall('n', 0, 0, 14, 1, M.wood, 0.015);
  R.onWall('s', 0, 0, 14, 1, M.wood, 0.015);
  R.onWall('w', 0, 0, 10, 1, M.wood, 0.015);
  R.onWall('e', 0, 0, 10, 1, M.wood, 0.015);

  // Blackboard with chalk writing
  R.onWall('n', 0, 1.0, 6.2, 2.3, M.darkWood, 0.025);
  R.onWall('n', 0, 1.1, 5.8, 2.1, labelMaterial(['呪力  =  Cursed Energy', 'Lesson 1: Control your flow', 'Practice at the Dojo after class'], {
    w: 320, h: 116, bg: '#2f4a3a', fg: '#e8eee6', size: 18, border: null,
  }), 0.03);

  // Teacher's desk and student desks with chairs
  b.box(0, 0, -3.2, 2.2, 0.9, 0.8, M.darkWood);
  for (const z of [-0.8, 1.4]) {
    for (const x of [-4.5, -1.5, 1.5, 4.5]) {
      b.box(x, 0, z, 1.1, 0.75, 0.6, M.wood);
      b.box(x, 0, z + 0.6, 0.5, 0.45, 0.45, M.darkWood, { solid: false });
      b.box(x, 0.45, z + 0.82, 0.5, 0.55, 0.06, M.darkWood, { solid: false });
    }
  }

  // Windows and ceiling lights
  for (const z of [-3, 0, 3]) R.onWall('e', z, 1.3, 1.8, 1.6, M.window, 0.03);
  for (const x of [-3.5, 3.5]) {
    for (const z of [-2, 2]) b.box(x, 4.1, z, 1.6, 0.08, 0.4, M.lampPanel, { solid: false, shadow: false });
    R.pointLight(x, 3.6, 0, 0xfff3d6, 12, 14);
  }

  R.door('s', 0, 'Go outside', '出口  Exit', OUTSIDE.classroom);
  R.door('w', 0, 'Go to the Discussion Room', '会議室  Discussion', { area: 'discussion', pos: [2.6, 0, 0], facing: -Math.PI / 2 });
  return R;
}

// ---------- Discussion room (next to the classroom) ----------
function buildDiscussion(M) {
  const R = makeRoom(M, { name: 'Discussion Room', w: 10, d: 8, h: 3.4, floor: M.tatami, wall: M.shoji, ceiling: M.wood, ambient: 0xffe8c8, sound: 'tatami', mapSpot: [-28, -12] });
  const { b } = R;

  // Low table with cushions around it
  b.box(0, 0, 0, 2.8, 0.45, 1.4, M.darkWood);
  for (const [x, z] of [[-0.9, -1.25], [0.9, -1.25], [-0.9, 1.25], [0.9, 1.25], [-1.95, 0], [1.95, 0]]) {
    b.box(x, 0, z, 0.6, 0.1, 0.6, M.cushion, { solid: false });
  }

  // Hanging scroll ("unity") and a paper floor lamp
  R.onWall('n', 0, 0.7, 1.0, 2.1, labelMaterial(['団結'], { w: 48, h: 112, bg: '#efe6cf', fg: '#1a1414', size: 34, vertical: true, border: '#6e4a2c' }), 0.03);
  b.box(-4.2, 0, -3.2, 0.45, 0.9, 0.45, M.lantern, { solid: false, shadow: false });
  R.pointLight(-4.2, 1.2, -3.2, 0xffc880, 6, 10);
  R.pointLight(0, 3.0, 0, 0xfff0d8, 8, 12);

  R.door('e', 0, 'Back to the Classroom', '教室  Classroom', { area: 'classroom', pos: [-4.8, 0, 0], facing: Math.PI / 2 });
  return R;
}

// ---------- Dojo ----------
function buildDojo(M) {
  const R = makeRoom(M, { name: 'Dojo', w: 16, d: 12, h: 5, floor: M.floorboards, wall: M.wood, ceiling: M.darkWood, mapSpot: [-28, 10] });
  const { b } = R;
  // Softer steps on the tatami training area, wooden steps elsewhere
  R.surfaceAt = (x, z) => (Math.abs(x + 1) <= 4.5 && Math.abs(z + 0.5) <= 3 ? 'tatami' : 'wood');

  // Paper screens on the upper walls, tatami training area in the middle
  R.onWall('n', 0, 2.2, 16, 2.4, M.shoji, 0.015);
  R.onWall('w', 0, 2.2, 12, 2.4, M.shoji, 0.015);
  R.onWall('e', 0, 2.2, 12, 2.4, M.shoji, 0.015);
  b.flat(-1, -0.5, 9, 6, 0.02, M.tatami);

  // Big hanging banner: "dojo"
  R.onWall('n', 0, 1.0, 1.5, 3.2, labelMaterial(['道場'], { w: 56, h: 120, bg: '#efe6cf', fg: '#1a1414', size: 40, vertical: true, border: '#8e1a20' }), 0.03);

  // Rack of wooden practice swords on the left wall
  b.box(-7.8, 0.6, -2, 0.12, 0.1, 3.2, M.darkWood, { solid: false });
  b.box(-7.8, 1.5, -2, 0.12, 0.1, 3.2, M.darkWood, { solid: false });
  for (let i = 0; i < 7; i++) b.box(-7.7, 0.1, -3.4 + i * 0.45, 0.07, 1.15, 0.07, M.wood, { solid: false });
  b.collider(-7.7, 0, -2, 0.6, 1.8, 3.4);

  // Wooden training dummies on the right
  for (const z of [-3, 0, 3]) {
    b.box(5.5, 0, z, 0.32, 1.75, 0.32, M.wood);
    b.box(5.5, 1.15, z, 0.95, 0.12, 0.12, M.wood, { solid: false });
    b.box(5.5, 0.75, z, 0.12, 0.12, 0.8, M.wood, { solid: false });
    b.box(5.5, 1.75, z, 0.36, 0.32, 0.36, M.darkWood, { solid: false });
  }

  // Hanging lamps
  for (const x of [-4, 4]) {
    b.box(x, 4.0, 0, 0.5, 0.6, 0.5, M.lantern, { solid: false, shadow: false });
    R.pointLight(x, 3.6, 0, 0xffd9a0, 14, 16);
  }

  R.door('s', 0, 'Go outside', '出口  Exit', OUTSIDE.dojo);
  return R;
}

// ---------- Underground stairs (from the stone hut down to the storage) ----------
function buildStairway(M) {
  const R = makeRoom(M, {
    name: 'Underground Stairs', w: 4, d: 24, h: 11, floor: M.darkStone, wall: M.darkStone, ceiling: M.darkStone,
    sound: 'stone', mapSpot: [-40, -28],
    bg: 0x050404, fog: [4, 22], ambient: 0xffd0a0, ambientI: 0.25,
  });
  const { b } = R;

  // Top landing (6 m up), then 19 steps down to the bottom (0 m)
  b.box(0, 0, 10, 4, 6, 4, M.darkStone, { block: false });
  const floorAt = (z) => (z >= 8 ? 6 : Math.max(0, 6 - Math.ceil((8 - z) / 0.8) * 0.3));
  for (let i = 0; i < 19; i++) {
    const top = 6 - (i + 1) * 0.3;
    b.box(0, 0, 8 - 0.4 - i * 0.8, 4, top, 0.8, M.darkStone, { block: false, shadow: false });
  }

  // Torches on alternating walls, following the stairs down
  [[9.5, -1], [4, 1], [0, -1], [-4, 1], [-9.5, -1]].forEach(([z, side]) => {
    const y = floorAt(z) + 2.1;
    b.box(side * 1.92, y, z, 0.12, 0.45, 0.12, M.darkWood, { solid: false });
    b.box(side * 1.86, y + 0.45, z, 0.18, 0.24, 0.18, M.flame, { solid: false, shadow: false });
    R.pointLight(side * 1.4, y + 0.7, z, 0xff8a3a, 7, 10);
  });

  // Paper charms near the bottom gate
  for (const [side, z, y] of [['w', -10.6, 1.2], ['e', -10.2, 1.5], ['w', -9.4, 1.6], ['e', -11.1, 0.9]]) {
    R.onWall(side, z, y, 0.28, 0.7, M.talisman, 0.03);
  }

  R.door('s', 0, 'Go back up outside', '↑ 出口  Exit', OUTSIDE.hut, { y: 6 });
  R.door('n', 0, 'Enter the Cursed Tool Storage', '呪具庫  Cursed Tools',
    { area: 'storage', pos: [0, 0, 4.6], facing: Math.PI }, { mat: M.ironGate });
  R.update = (dt, time) => flicker(R, time);
  return R;
}

// ---------- Cursed Tool Storage (underground) ----------
function buildStorage(M) {
  const R = makeRoom(M, {
    name: 'Cursed Tool Storage', w: 14, d: 14, h: 4.5, floor: M.darkStone, wall: M.darkStone, ceiling: M.darkWood,
    sound: 'stone', mapSpot: [-40, -28],
    bg: 0x07050a, fog: [8, 34], ambient: 0x9a88c0, ambientI: 0.75,
  });
  const { b } = R;

  // Centre: stone pedestal, a sealed box, and a glowing cursed object floating above it
  b.box(0, 0, -1, 1.4, 1.0, 1.4, M.stone);
  b.box(0, 1.0, -1, 0.8, 0.8, 0.8, M.talisman);
  const relic = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), M.cursedGlow);
  relic.position.set(0, 2.6, -1);
  R.group.add(relic);
  R.pointLight(0, 2.4, -1, 0xa060ff, 14, 14);

  // Shelves on the left and right walls, full of sealed boxes and jars
  for (const side of [-1, 1]) {
    for (const z of [-3.5, 2.5]) {
      const x = side * 6.6;
      b.box(side * 6.92, 0, z, 0.08, 2.6, 4, M.darkWood, { solid: false });
      for (const y of [0.1, 0.95, 1.8]) {
        b.box(x, y, z, 0.7, 0.08, 4, M.darkWood, { solid: false });
        for (let k = 0; k < 3; k++) {
          const iz = z - 1.3 + k * 1.3;
          if ((k + y * 10) % 2 < 1) b.box(x, y + 0.08, iz, 0.45, 0.45, 0.45, M.talisman, { solid: false });
          else b.box(x, y + 0.08, iz, 0.35, 0.55, 0.35, M.lacquer, { solid: false });
        }
      }
      for (const dz of [-2, 2]) b.box(x, 0, z + dz, 0.7, 2.6, 0.08, M.darkWood, { solid: false });
      b.collider(x, 0, z, 0.8, 2.6, 4);
    }
  }

  // Weapon rack on the back wall with strange tools
  for (const x of [-4.5, 4.5]) b.box(x, 0, -6.7, 0.15, 2.4, 0.15, M.darkWood, { solid: false });
  for (const y of [0.9, 1.9]) b.box(0, y, -6.7, 9.2, 0.1, 0.1, M.darkWood, { solid: false });
  b.box(-3.5, 0.1, -6.55, 0.07, 2.6, 0.07, M.wood, { solid: false });          // spear
  b.box(-3.5, 2.7, -6.55, 0.14, 0.4, 0.05, M.metal, { solid: false });
  b.box(-2, 0.1, -6.55, 0.08, 2.3, 0.08, M.darkWood, { solid: false });        // staff with rings
  for (const dx of [-0.12, 0.12]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 12), M.gold);
    ring.position.set(-2 + dx, 2.35, -6.55);
    R.group.add(ring);
  }
  b.box(0, 0.4, -6.55, 0.4, 1.9, 0.05, M.metal, { solid: false });             // big blade
  b.box(0, 0.1, -6.55, 0.12, 0.35, 0.12, M.darkWood, { solid: false });
  for (let i = 0; i < 3; i++) b.box(1.8, 0.2 + i * 0.75, -6.55, 0.1, 0.7, 0.1, M.vermilion, { solid: false }); // three-section staff
  for (let i = 0; i < 9; i++) b.box(3.4, 0.4 + i * 0.22, -6.55, 0.12, 0.16, 0.05, M.metal, { solid: false });  // chain
  b.collider(0, 0, -6.55, 9.5, 2.6, 0.7);

  // Paper charms all over the walls
  const charmSpots = [
    ['n', -6, 2.6], ['n', -5.4, 1.8], ['n', 5.6, 2.4], ['n', 6.1, 1.5], ['s', -4, 1.6], ['s', -3.4, 2.3],
    ['s', 3.6, 2.0], ['s', 4.4, 1.3], ['w', -0.5, 2.9], ['w', 0.4, 2.2], ['e', -0.6, 2.6], ['e', 0.5, 1.9],
  ];
  for (const [side, along, y] of charmSpots) R.onWall(side, along, y, 0.28, 0.7, M.talisman, 0.03);

  // Candles in the corners
  for (const [x, z] of [[-5.8, 5.8], [5.8, 5.8], [-5.8, -5.8], [5.8, -5.8]]) {
    b.box(x, 0, z, 0.25, 0.5, 0.25, M.plaster, { solid: false });
    b.box(x, 0.5, z, 0.1, 0.16, 0.1, M.flame, { solid: false, shadow: false });
    R.pointLight(x, 0.9, z, 0xffa050, 4, 7);
  }

  R.door('s', 0, 'Back to the stairs', '↑ 階段  Stairs',
    { area: 'stairway', pos: [0, 0, -9.6], facing: 0 }, { mat: M.ironGate });

  R.update = (dt, time) => {
    relic.rotation.y += dt * 1.2;
    relic.rotation.x = Math.sin(time * 0.8) * 0.3;
    relic.position.y = 2.6 + Math.sin(time * 1.6) * 0.12;
    flicker(R, time);
  };
  return R;
}

export function buildRooms(M) {
  return {
    classroom: buildClassroom(M),
    discussion: buildDiscussion(M),
    dojo: buildDojo(M),
    stairway: buildStairway(M),
    storage: buildStorage(M),
  };
}
