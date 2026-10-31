// A small Soviet-style propeller trainer (looks a bit like a Yak-52): round engine at the front,
// spinning propeller, straight low wings, two-seat bubble canopy, red star on the tail.
// Nose points along -z, +y up, +x to its right. About 7.7 m long, 9.3 m wing span before scaling.
import * as THREE from 'three';
import { mat, slab, star } from './parts.js';

export function createYakModel() {
  const plane = new THREE.Group();
  const white = mat('#ece6da', { roughness: 0.55, metalness: 0.1 });
  const whiteDS = mat('#ece6da', { roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide });
  const red = mat('#c2302a', { roughness: 0.5, metalness: 0.1 });
  const redDS = mat('#c2302a', { roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide });
  const dark = mat('#2a2a2e', { metalness: 0.4 });
  const glass = mat('#2b4256', { roughness: 0.1, metalness: 0.5, emissive: '#2a1a12', transparent: true, opacity: 0.85 });

  // Body: thick at the front, thin at the tail
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.22, 6.2, 12), white);
  body.rotation.x = -Math.PI / 2;     // the wide end points forward
  body.position.z = 0.3;
  plane.add(body);
  // Red engine cover (cowling) with a dark front, and a pointed spinner in the middle of the propeller
  const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.64, 1.0, 14), red);
  cowl.rotation.x = -Math.PI / 2;
  cowl.position.z = -3.2;
  plane.add(cowl);
  const front = new THREE.Mesh(new THREE.CircleGeometry(0.62, 14), dark);
  front.position.z = -3.71;
  front.rotation.y = Math.PI;
  plane.add(front);
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 10), red);
  spinner.rotation.x = -Math.PI / 2;
  spinner.position.z = -4.0;
  plane.add(spinner);

  // Propeller: two blades, plus a see-through disc that shows when it spins fast
  const prop = new THREE.Group();
  prop.position.z = -3.85;
  for (const s of [1, -1]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.05), dark);
    blade.position.y = 0.6 * s;
    blade.rotation.y = 0.25 * s;
    prop.add(blade);
  }
  plane.add(prop);
  const blur = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), new THREE.MeshBasicMaterial({ color: '#bbbbbb', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  blur.position.z = -3.86;
  plane.add(blur);

  // Canopy (long bubble for two seats, one behind the other)
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), glass);
  canopy.scale.set(0.9, 0.85, 3.0);
  canopy.position.set(0, 0.55, -0.9);
  plane.add(canopy);

  // Wings (low on the body, slightly tilted up toward the tips) with red tips
  for (const s of [1, -1]) {
    const wing = slab([[0.4 * s, -1.4], [4.65 * s, -0.75], [4.65 * s, 0.25], [0.4 * s, 0.5]], 0.18, whiteDS);
    wing.geometry.rotateX(Math.PI / 2);
    wing.position.y = -0.38;
    wing.rotation.z = 0.06 * s;
    plane.add(wing);
    const tip = slab([[3.9 * s, -0.86], [4.66 * s, -0.75], [4.66 * s, 0.25], [3.9 * s, 0.3]], 0.2, redDS);
    tip.geometry.rotateX(Math.PI / 2);
    tip.position.y = -0.38;
    tip.rotation.z = 0.06 * s;
    plane.add(tip);
    // Tail wings
    const tail = slab([[0.15 * s, 2.55], [1.6 * s, 2.85], [1.6 * s, 3.25], [0.15 * s, 3.45]], 0.1, whiteDS);
    tail.geometry.rotateX(Math.PI / 2);
    tail.position.y = 0.1;
    plane.add(tail);
    // Landing wheels under the wings
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.12), dark);
    leg.position.set(1.3 * s, -0.75, -0.6);
    plane.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 12), dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(1.3 * s, -1.05, -0.6);
    plane.add(wheel);
  }
  // Nose wheel
  const noseLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.1), dark);
  noseLeg.position.set(0, -0.8, -2.6);
  plane.add(noseLeg);
  const noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12), dark);
  noseWheel.rotation.z = Math.PI / 2;
  noseWheel.position.set(0, -1.05, -2.6);
  plane.add(noseWheel);

  // Tail fin (red) with a red star on a white circle on both sides
  const fin = slab([[2.35, 0.1], [3.15, 1.45], [3.55, 1.45], [3.5, 0.1]], 0.1, redDS);
  fin.geometry.rotateY(-Math.PI / 2);
  plane.add(fin);
  for (const s of [1, -1]) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), white);
    disc.position.set(0.06 * s, 0.75, 3.1);
    disc.rotation.y = (Math.PI / 2) * s;
    plane.add(disc);
    const st = star(0.22, 0.02, red);
    st.position.set(0.075 * s, 0.75, 3.1);
    st.rotation.y = (Math.PI / 2) * s;
    plane.add(st);
  }
  // Spin the propeller with the engine power
  let angle = 0;
  function setPower(power, dt = 1 / 60) {
    angle += (18 + power * 30) * dt;
    prop.rotation.z = angle;
    blur.material.opacity = 0.12 + Math.min(power, 1.4) * 0.1;
  }

  plane.scale.setScalar(0.8);   // about 6 m long
  // The wheels stay down all the time (fixed gear). Wheel bottoms are at y = -1.3 before scaling.
  return { mesh: plane, setPower, setGear: () => {}, gearHeight: 1.3 * 0.8, exhaust: new THREE.Vector3(0.5, -0.3, -2.2), exhaustColor: '#d9d4cc', exhaustGlow: false };
}
