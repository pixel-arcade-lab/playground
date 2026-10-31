// The airfield: a paved runway with white markings, a hangar, a control tower and a windsock.
// Where the runway is (and how flat ground is made for it) is decided in world.js (RUNWAY).
import * as THREE from 'three';
import { RUNWAY } from './world.js';
import { createHangar, createTower, createWindsock } from './assets/buildings.js';

export function buildAirfield(scene) {
  const { x, z, h, dir, halfLen, halfWidth } = RUNWAY;
  const angle = Math.atan2(dir.x, dir.z);   // turns an object's +z to point along the take-off direction
  const group = new THREE.Group();
  group.position.set(x, h, z);
  group.rotation.y = angle;
  scene.add(group);

  // Ground paint (drawn slightly in front of the ground so it never flickers)
  const paint = (col) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const flat = (w, l, m, px, pz, y = 0.08) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, l), m);
    p.rotation.x = -Math.PI / 2;
    p.position.set(px, y, pz);
    group.add(p);
  };
  const asphalt = paint('#4a4a50'), white = paint('#ecebe6');
  flat(halfWidth * 2, halfLen * 2, asphalt, 0, 0);
  flat(halfWidth * 2 + 30, 60, asphalt, halfWidth + 40, 60);          // parking area next to the hangar
  flat(10, 30, asphalt, halfWidth + 10, 60);                         // taxi path to it
  // Centre line dashes
  for (let a = -halfLen + 50; a < halfLen - 40; a += 30) flat(0.8, 15, white, 0, a, 0.12);
  // Stripes at both ends
  for (const end of [-1, 1]) {
    for (let i = -5; i <= 5; i++) if (i !== 0) flat(1.4, 22, white, i * 2.4, end * (halfLen - 18), 0.12);
  }
  // Side lines
  for (const s of [-1, 1]) flat(0.6, halfLen * 2 - 10, white, s * (halfWidth - 1), 0, 0.12);

  // Buildings beside the runway (the +x side of the group)
  const hangar = createHangar();
  hangar.position.set(halfWidth + 40, 0, 60);
  hangar.rotation.y = -Math.PI / 2;    // opening faces the runway
  group.add(hangar);
  const tower = createTower();
  tower.position.set(halfWidth + 30, 0, -40);
  group.add(tower);
  const sock = createWindsock();
  sock.position.set(-halfWidth - 15, 0, halfLen - 60);
  group.add(sock);
}
