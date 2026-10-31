// Life on the islands: the village (houses, church, well, fields), villagers walking the roads,
// cows and sheep in the pastures, deer in the forests, and flocks of birds and seagulls.
// The look of each character is in assets/characters/; this file decides where they are and how they move.
import * as THREE from 'three';
import { heightAt, VILLAGE, VOLCANO, MAIN_R, fbm } from './world.js';
import { makeKind, makeSprite } from './assets/pixel-sprite.js';
import { createHouse, createChurch, createWell, createHaystack } from './assets/buildings.js';
import { VILLAGER, VILLAGER_LOOKS } from './assets/characters/villager.js';
import { COW } from './assets/characters/cow.js';
import { SHEEP } from './assets/characters/sheep.js';
import { DEER } from './assets/characters/deer.js';
import { BIRD, SEAGULL } from './assets/characters/bird.js';

// Same "random" numbers every time, so the village looks the same on every visit
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(7);
const between = (a, b) => a + rand() * (b - a);

// ---------- Village layout ----------
// Two dirt roads cross in the middle of the village. Positions are given as (u, v):
// u = metres along road A, v = metres along road B, measured from the village centre.
const ROAD_ANGLE = 0.45;
const A = new THREE.Vector2(Math.cos(ROAD_ANGLE), Math.sin(ROAD_ANGLE));    // road A direction (x, z)
const B = new THREE.Vector2(-Math.sin(ROAD_ANGLE), Math.cos(ROAD_ANGLE));   // road B direction
const ROAD_LEN = 150, ROAD_W = 8;
const toWorld = (u, v) => ({ x: VILLAGE.x + A.x * u + B.x * v, z: VILLAGE.z + A.y * u + B.y * v });
const groundMat = (col) => new THREE.MeshStandardMaterial({ color: col, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

// Place an object at (u, v), turned so its front (+z) faces the direction (du, dv)
function place(scene, obj, u, v, du = 0, dv = 1) {
  const p = toWorld(u, v);
  obj.position.set(p.x, VILLAGE.h, p.z);
  const dx = A.x * du + B.x * dv, dz = A.y * du + B.y * dv;
  obj.rotation.y = Math.atan2(dx, dz);
  scene.add(obj);
  return obj;
}
// A flat patch of colour on the ground (road, field), size along u and v
function patch(scene, u, v, sizeU, sizeV, mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sizeU, sizeV), mat);
  m.rotation.order = 'YXZ';
  m.rotation.y = -ROAD_ANGLE;
  m.rotation.x = -Math.PI / 2;
  const p = toWorld(u, v);
  m.position.set(p.x, VILLAGE.h + 0.1, p.z);
  scene.add(m);
  return m;
}

function buildVillage(scene) {
  const dirt = groundMat('#9a7b55');
  patch(scene, 0, 0, ROAD_LEN * 2, ROAD_W, dirt);   // road A
  patch(scene, 0, 0, ROAD_W, ROAD_LEN * 2, dirt);   // road B
  patch(scene, 0, 0, 44, 44, dirt);                 // village square
  place(scene, createWell(), 0, 0);
  place(scene, createChurch(), 34, 34, -1, -1);

  // Houses along both sides of each road, facing the road
  let n = 0;
  for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {        // the four road arms
    for (const side of [-1, 1]) {
      for (const dist of [48, 74, 100, 128]) {
        const seed = rand();
        if (seed < 0.2) continue;                                      // leave some gaps
        if (ax === 1 && ay === 0 && side === 1 && dist < 80) continue;  // room for the church
        if (ax === 0 && ay === 1 && side === 1 && dist < 80) continue;
        const u = ax * dist + ay * side * 17, v = ay * dist + ax * side * 17;
        place(scene, createHouse(seed), u, v, -ay * side, -ax * side);
        n++;
      }
    }
  }

  // Fields in the four corners between the roads
  const fieldColours = ['#d9b85a', '#7aa64a', '#7a5a3a', '#c9a24a', '#8fb35a', '#6e5236'];
  const fields = [];
  let k = 0;
  for (const su of [-1, 1]) {
    for (const sv of [-1, 1]) {
      for (const [u, v] of [[200, 70], [90, 210], [215, 175]]) {
        const fu = su * u, fv = sv * v, w = between(55, 75), d = between(40, 60);
        const colour = fieldColours[k++ % fieldColours.length];
        patch(scene, fu, fv, w, d, groundMat(colour));
        fields.push({ u: fu, v: fv, w, d, colour });
        if (colour === '#d9b85a' || colour === '#c9a24a') {           // haystacks on wheat fields
          for (let i = 0; i < 3; i++) place(scene, createHaystack(), fu + between(-w, w) * 0.35, fv + between(-d, d) * 0.35);
        }
      }
    }
  }
  return fields;
}

// ---------- Characters ----------
const camRight = new THREE.Vector3();
const live = [];   // everything that moves: { update(dt) }

// An animal or person that wanders around a home area: walks to a random spot, stops a while, repeats.
// pickSpot() returns a new {x, z} to walk to.
function wanderer(scene, kind, pickSpot, speed, restMin, restMax) {
  const ch = makeSprite(kind);
  const start = pickSpot();
  const pos = new THREE.Vector2(start.x, start.z), target = new THREE.Vector2(start.x, start.z), vel = new THREE.Vector2();
  let rest = between(0, restMax);
  scene.add(ch.sprite);
  const groundY = () => heightAt(pos.x, pos.y);
  ch.sprite.position.set(pos.x, groundY(), pos.y);
  live.push({
    update(dt) {
      if (rest > 0) { rest -= dt; return; }
      vel.subVectors(target, pos);
      const dist = vel.length();
      if (dist < 0.5) {
        rest = between(restMin, restMax);
        const s = pickSpot();
        target.set(s.x, s.z);
        return;
      }
      vel.multiplyScalar(Math.min(speed * dt, dist) / dist);
      pos.add(vel);
      ch.sprite.position.set(pos.x, groundY(), pos.y);
      // Face left or right on screen, depending on which way it walks compared with the camera
      ch.face(vel.x * camRight.x + vel.y * camRight.z < 0);
      ch.animate(dt);
    },
  });
}

// A flock of birds circling around a centre point
function flock(scene, kind, cx, cz, height, radius, count) {
  const dir = rand() < 0.5 ? 1 : -1, angSpeed = (between(7, 11) / radius) * dir;
  for (let i = 0; i < count; i++) {
    const ch = makeSprite(kind);
    ch.sprite.center.set(0.5, 0.5);
    scene.add(ch.sprite);
    const off = between(-0.25, 0.25), r = radius + between(-15, 15), h = height + between(-10, 10), bob = rand() * 6;
    let a = rand() * Math.PI * 2;
    live.push({
      update(dt) {
        a += angSpeed * dt;
        const ang = a + off;
        ch.sprite.position.set(cx + Math.cos(ang) * r, h + Math.sin(a * 3 + bob) * 3, cz + Math.sin(ang) * r);
        ch.animate(dt);
      },
    });
  }
}

export function createLife(scene) {
  const fields = buildVillage(scene);
  const inField = (f, margin = 6) => {
    const p = toWorld(f.u + between(-0.5, 0.5) * (f.w - margin), f.v + between(-0.5, 0.5) * (f.d - margin));
    return { x: p.x, z: p.z };
  };

  // Villagers walk up and down the roads (never through houses)
  const looks = VILLAGER_LOOKS.map((look) => makeKind(VILLAGER, look));
  for (let i = 0; i < 16; i++) {
    const kind = looks[i % looks.length];
    const onA = i % 2 === 0, lane = between(-2.5, 2.5);
    wanderer(scene, kind, () => {
      const t = between(-ROAD_LEN + 10, ROAD_LEN - 10);
      const p = onA ? toWorld(t, lane) : toWorld(lane, t);
      return { x: p.x, z: p.z };
    }, 1.6, 1, 6);
  }
  // A few farmers working in the wheat fields
  const wheat = fields.filter((f) => f.colour === '#d9b85a' || f.colour === '#c9a24a');
  for (let i = 0; i < 5; i++) {
    const f = wheat[i % wheat.length];
    wanderer(scene, looks[(i * 3) % looks.length], () => inField(f), 0.8, 3, 10);
  }

  // Cows and sheep in the green pastures
  const cow = makeKind(COW), sheep = makeKind(SHEEP);
  const pastures = fields.filter((f) => f.colour === '#7aa64a' || f.colour === '#8fb35a');
  pastures.forEach((f, i) => {
    const isCows = i % 2 === 0;
    for (let k = 0; k < (isCows ? 6 : 8); k++) wanderer(scene, isCows ? cow : sheep, () => inField(f), 0.6, 4, 14);
  });
  // Sheep on the volcano island's grass, near the river
  for (let k = 0; k < 9; k++) {
    wanderer(scene, sheep, () => ({ x: VOLCANO.x + between(70, 160), z: VOLCANO.z + between(950, 1100) }), 0.6, 4, 14);
  }

  // Deer in small groups at the edge of the forests, in the hills
  const deer = makeKind(DEER);
  let groups = 0;
  for (let t = 0; t < 4000 && groups < 6; t++) {
    const x = between(-MAIN_R, MAIN_R), z = between(-MAIN_R, MAIN_R), h = heightAt(x, z);
    if (h < 25 || h > 140 || fbm(x * 0.004, z * 0.004) < 0.42) continue;
    if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < 600) continue;
    groups++;
    for (let k = 0; k < 3; k++) wanderer(scene, deer, () => ({ x: x + between(-40, 40), z: z + between(-40, 40) }), 1.2, 2, 9);
  }

  // Birds over the island, and seagulls along the coast and the volcano cliffs
  const bird = makeKind(BIRD), gull = makeKind(BIRD, SEAGULL);
  flock(scene, bird, VILLAGE.x + 150, VILLAGE.z - 250, 140, 90, 7);
  flock(scene, bird, -900, -400, 260, 120, 8);
  flock(scene, bird, 800, 300, 220, 100, 6);
  flock(scene, gull, VILLAGE.x - 200, VILLAGE.z + 600, 60, 80, 6);
  flock(scene, gull, VOLCANO.x, VOLCANO.z + VOLCANO.coast + 80, 90, 110, 8);
  flock(scene, gull, VOLCANO.x - 1200, VOLCANO.z, 70, 90, 6);

  // Called every frame
  function update(dt, camera) {
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    for (const c of live) c.update(dt);
  }
  return { update };
}
