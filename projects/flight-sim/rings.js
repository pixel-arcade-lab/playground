// Rings to fly through: a course from the runway, over the village, out to the volcano island
// (past the waterfall and round the volcano) and back to line up for landing.
// Only the next ring counts; it glows yellow. Fly through all of them to finish the course.
import * as THREE from 'three';
import { groundAt, RUNWAY, VILLAGE, VOLCANO } from './world.js';

const RADIUS = 20;   // ring size in metres (inside of the ring)

// Highest ground in a circle around (x, z), so a ring never sits inside a hill
function highestGround(x, z, r) {
  let h = groundAt(x, z);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    h = Math.max(h, groundAt(x + Math.cos(a) * r, z + Math.sin(a) * r));
  }
  return h;
}

// The course: [x, z, metres above the ground]. The runway is on the north side of the main island,
// taking off east toward the volcano island, so the course goes there first, then round the main island.
function courseSpots(waterfall) {
  const D = RUNWAY.dir, L = RUNWAY.halfLen;
  const alongRunway = (d) => [RUNWAY.x + D.x * d, RUNWAY.z + D.z * d];
  return [
    [...alongRunway(L + 450), 40],
    [...alongRunway(L + 1100), 60],
    [3700, -1300, 50],
    [waterfall.x, waterfall.z + 230, 60],                 // in front of the waterfall
    [VOLCANO.x + 1000, VOLCANO.z + 300, 60],
    [VOLCANO.x + 450, VOLCANO.z - 800, 80],
    [VOLCANO.x - 380, VOLCANO.z - 120, 70],               // high up, beside the crater
    [VOLCANO.x - 1500, VOLCANO.z + 200, 50],
    [2600, 300, 70],
    [2200, 1600, 60],
    [300, 2500, 50],
    [VILLAGE.x, VILLAGE.z, 60],
    [-2200, 0, 70],
    [-1500, -1900, 70],
    [...alongRunway(-L - 900), 45],                        // lined up with the runway: now land!
  ];
}

export function createRings(scene, waterfall) {
  const centres = courseSpots(waterfall).map(([x, z, agl]) => new THREE.Vector3(x, highestGround(x, z, 70) + agl, z));
  const start = new THREE.Vector3(RUNWAY.x - RUNWAY.dir.x * RUNWAY.halfLen, RUNWAY.h, RUNWAY.z - RUNWAY.dir.z * RUNWAY.halfLen);
  const finish = new THREE.Vector3(RUNWAY.x, RUNWAY.h, RUNWAY.z);
  const geo = new THREE.TorusGeometry(RADIUS + 1.2, 1.2, 8, 40);
  const rings = centres.map((c, i) => {
    // Each ring faces along the path: from the ring before it toward the ring after it
    const prev = i > 0 ? centres[i - 1] : start, next = i < centres.length - 1 ? centres[i + 1] : finish;
    const normal = new THREE.Vector3().subVectors(next, prev).normalize();
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false }));
    mesh.position.copy(c);
    mesh.lookAt(c.clone().add(normal));
    scene.add(mesh);
    return { centre: c, normal, mesh };
  });

  const state = { next: 0, total: rings.length, time: 0, running: false };
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  let t = 0;

  function paint() {
    rings.forEach((r, i) => {
      r.mesh.visible = i >= state.next;
      r.mesh.material.color.set(i === state.next ? '#ffd23f' : '#ffffff');
      r.mesh.material.opacity = i === state.next ? 0.95 : i === state.next + 1 ? 0.5 : 0.25;
      r.mesh.scale.setScalar(1);
    });
  }

  function reset() { state.next = 0; state.time = 0; state.running = false; paint(); }

  // Called every frame with where the plane was and where it is now.
  // Returns 'ring' when a ring was passed, 'done' when the last one was passed, otherwise null.
  function update(dt, prevPos, pos) {
    t += dt;
    if (state.running) state.time += dt;
    const r = rings[state.next];
    r.mesh.scale.setScalar(1 + Math.sin(t * 4) * 0.04);   // the next ring gently pulses
    // Did the plane cross the ring's flat surface this frame, inside the ring?
    const s0 = a.subVectors(prevPos, r.centre).dot(r.normal);
    const s1 = b.subVectors(pos, r.centre).dot(r.normal);
    if (s0 < 0 && s1 >= 0) {
      b.addScaledVector(r.normal, -s1);     // the crossing point, relative to the ring centre
      if (b.length() < RADIUS + 1.5) {
        if (state.next === 0) state.running = true;
        state.next++;
        if (state.next === rings.length) {
          const time = state.time;
          reset();
          return { event: 'done', time };
        }
        paint();
        return { event: 'ring' };
      }
    }
    return null;
  }

  reset();
  return { state, update, reset, list: rings, nextCentre: () => rings[state.next].centre };
}
