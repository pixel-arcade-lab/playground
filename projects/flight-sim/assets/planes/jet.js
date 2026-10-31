// A small jet with an engine flame. Nose points along -z, +y up, +x to its right.
import * as THREE from 'three';
import { mat, slab } from './parts.js';

export function createJetModel() {
  const jet = new THREE.Group();
  const body = mat('#8d97a5'), bodyDS = mat('#8d97a5', { side: THREE.DoubleSide }), dark = mat('#3b414b');
  const accent = mat('#c8513b', { side: THREE.DoubleSide });
  const glass = mat('#1c2a3a', { roughness: 0.15, metalness: 0.6, emissive: '#3a1d12' });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.9, 9, 10), body);
  fuselage.rotation.x = Math.PI / 2;
  jet.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.5, 10), body);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -6.25;
  jet.add(nose);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), glass);
  canopy.scale.set(1, 0.8, 2.4);
  canopy.position.set(0, 0.75, -2.8);
  jet.add(canopy);
  for (const s of [1, -1]) {
    const wing = slab([[0.7 * s, -2.4], [6.4 * s, 2.0], [6.4 * s, 3.0], [0.7 * s, 3.4]], 0.25, bodyDS);
    wing.geometry.rotateX(Math.PI / 2); wing.position.y = -0.25; jet.add(wing);
    const tailWing = slab([[0.6 * s, 3.0], [2.9 * s, 4.6], [2.9 * s, 5.2], [0.6 * s, 5.0]], 0.18, bodyDS);
    tailWing.geometry.rotateX(Math.PI / 2); tailWing.position.y = 0.1; jet.add(tailWing);
    const fin = slab([[3.0, 0], [4.7, 2.8], [5.3, 2.8], [5.0, 0]], 0.16, accent);
    fin.geometry.rotateY(-Math.PI / 2); fin.position.set(0.65 * s, 0.6, 0); fin.rotation.z = -0.3 * s; jet.add(fin);
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 3), dark);
    intake.position.set(1.1 * s, -0.2, -1); jet.add(intake);
  }
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.8, 1, 12), dark);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.z = 4.9;
  jet.add(nozzle);

  // Engine flame (an outer glow and a bright core). Its length follows the throttle.
  const flameGeo = new THREE.ConeGeometry(0.75, 4, 12, 1, true);
  flameGeo.translate(0, 2, 0);
  const flame = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: '#ff9d4d', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  flame.rotation.x = Math.PI / 2;
  flame.position.z = 5.3;
  jet.add(flame);
  const coreGeo = new THREE.ConeGeometry(0.42, 3, 10, 1, true);
  coreGeo.translate(0, 1.5, 0);
  const flameCore = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: '#fff2c4', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  flameCore.rotation.x = Math.PI / 2;
  flameCore.position.z = 5.3;
  jet.add(flameCore);

  // Landing gear (folds away in flight): two main wheels and a nose wheel. Wheel bottoms at y = -2.4.
  const gear = new THREE.Group();
  for (const [gx, gz, wr] of [[1.6, 0.8, 0.4], [-1.6, 0.8, 0.4], [0, -4.5, 0.32]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), dark);
    leg.position.set(gx, -1.4, gz);
    gear.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, 0.25, 12), dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(gx, -2.4 + wr, gz);
    gear.add(wheel);
  }
  jet.add(gear);
  const setGear = (down) => { gear.visible = down; };

  // Show the engine for a given power (0 = idle, 1 = full, more with boost)
  function setPower(power) {
    const len = 0.55 + power * 1.5 + Math.random() * 0.12;
    flame.scale.set(1, len, 1);
    flameCore.scale.set(1, len * 0.7, 1);
    flame.material.opacity = 0.45 + Math.min(power, 1) * 0.45;
  }

  jet.scale.setScalar(0.55);   // a small jet: about 7 m long
  // exhaust: where the boost trail comes out (in the plane's own coordinates, after scaling)
  // gearHeight: from the plane's centre down to the bottom of the wheels (after scaling)
  return { mesh: jet, setPower, setGear, gearHeight: 2.4 * 0.55, exhaust: new THREE.Vector3(0, 0, 3.3), exhaustColor: '#ffa860', exhaustGlow: true };
}
