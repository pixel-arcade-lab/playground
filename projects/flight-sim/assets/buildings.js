// Simple low-poly village buildings. Each function returns a group standing on y = 0, front facing +z.
import * as THREE from 'three';

const mat = (col) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 0.9, metalness: 0 });
const WALLS = ['#e8dcc4', '#d9c39a', '#8a5a3a', '#a8794f', '#efe9dd'].map(mat);   // whitewash and wooden logs
const ROOFS = ['#9a3b2e', '#5b4a3e', '#3f5a73', '#6d7a3a'].map(mat);
const DARK = mat('#3a2d24'), WINDOW = mat('#f2c76b'), STONE = mat('#8a8580'), GOLD = mat('#d9a83a'), WOOD = mat('#6b4a30');

// A small house. Sizes vary with the number "seed" (0..1) so houses don't all look the same.
export function createHouse(seed) {
  const g = new THREE.Group();
  const w = 7 + seed * 4, d = 6 + ((seed * 7) % 1) * 3, h = 4 + ((seed * 13) % 1) * 1.5;
  const wall = WALLS[Math.floor(seed * WALLS.length)], roofMat = ROOFS[Math.floor(((seed * 5) % 1) * ROOFS.length)];
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall);
  box.position.y = h / 2;
  g.add(box);
  // Roof: a three-sided prism laid on its side, so its ridge runs front to back
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, d + 1, 3), roofMat);
  roof.rotation.x = -Math.PI / 2;
  roof.scale.set(w * 0.62, 1, 2.6);        // width, length, height of the roof
  roof.position.y = h + 1.3;
  g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.2), DARK);
  door.position.set(0, 1.2, d / 2 + 0.05);
  g.add(door);
  for (const s of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.2), WINDOW);
    win.position.set(s * w * 0.3, h * 0.6, d / 2 + 0.05);
    g.add(win);
  }
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.9), STONE);
  chimney.position.set(w * 0.25, h + 2, -d * 0.2);
  g.add(chimney);
  return g;
}

// A small church with an onion-shaped golden dome, in the old Russian style
export function createChurch() {
  const g = new THREE.Group();
  const white = mat('#f1ece2');
  const hall = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 14), white);
  hall.position.y = 4;
  g.add(hall);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 6, 8), white);
  tower.position.y = 11;
  g.add(tower);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 10), GOLD);
  dome.scale.set(1, 1.15, 1);
  dome.position.y = 16.5;
  g.add(dome);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4, 10), GOLD);
  tip.position.y = 21;
  g.add(tip);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 0.3), GOLD);
  cross.position.y = 24;
  g.add(cross);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.3), GOLD);
  arm.position.y = 24.4;
  g.add(arm);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2, 3.4, 0.2), DARK);
  door.position.set(0, 1.7, 7.05);
  g.add(door);
  return g;
}

// A stone well with a little roof
export function createWell() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.2, 10), STONE);
  ring.position.y = 0.6;
  g.add(ring);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3, 0.25), WOOD);
    post.position.set(s * 1.4, 1.5, 0);
    g.add(post);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), ROOFS[0]);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 3.6;
  g.add(roof);
  return g;
}

// Airfield: a hangar with a round roof (front opening faces +z)
export function createHangar() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#8f969c', flatShading: true, roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide });
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 30, 16, 1, true, -Math.PI / 2, Math.PI), metal);
  roof.rotation.x = -Math.PI / 2;   // half a tube lying along z, arch upward
  g.add(roof);
  const back = new THREE.Mesh(new THREE.CircleGeometry(12, 16, 0, Math.PI), metal);
  back.position.z = -15;
  g.add(back);
  const inside = new THREE.Mesh(new THREE.CircleGeometry(11.8, 16, 0, Math.PI), DARK);
  inside.position.z = -14.8;
  g.add(inside);
  return g;
}

// Airfield: a small control tower with a glass room on top
export function createTower() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(5, 12, 5), mat('#e8e2d6'));
  base.position.y = 6;
  g.add(base);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 7), new THREE.MeshStandardMaterial({ color: '#3d6a8a', roughness: 0.2, metalness: 0.4, emissive: '#1a2a35' }));
  glass.position.y = 13.5;
  g.add(glass);
  const top = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 8), mat('#c2302a'));
  top.position.y = 15.3;
  g.add(top);
  return g;
}

// Airfield: a striped windsock on a pole
export function createWindsock() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 6), mat('#d8d8d8'));
  pole.position.y = 3.5;
  g.add(pole);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.35, 3.5, 8, 1, true), new THREE.MeshStandardMaterial({ color: '#ff7a1a', side: THREE.DoubleSide, flatShading: true }));
  sock.rotation.z = Math.PI / 2 - 0.15;
  sock.position.set(1.9, 6.8, 0);
  g.add(sock);
  return g;
}

// A haystack for the fields
export function createHaystack() {
  const m = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.4, 8), mat('#d6b35a'));
  m.position.y = 1.7;
  const g = new THREE.Group();
  g.add(m);
  return g;
}
