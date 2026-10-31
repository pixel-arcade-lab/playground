// The jet: its 3D model, and how it flies.
//
// How the controls work ("mouse aim", like War Thunder):
//   The mouse points at a direction in the world (the aim circle on screen).
//   An autopilot turns the plane toward that direction by itself: it banks (tilts the wings) and pulls
//   the nose round, the way a real pilot turns. So the player only says WHERE to go, never HOW.
import * as THREE from 'three';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------- How the plane handles (change these to tune the feel) ----------
export const FLIGHT = {
  maxPitchRate: 1.5,     // how fast the nose can go up/down (radians per second)
  maxRollRate: 3.2,      // how fast the plane can tilt its wings
  maxYawRate: 0.35,      // small side-to-side nose movement (rudder)
  response: 6,           // how quickly the controls react (higher = snappier)
  pitchGain: 2.2,        // how hard the autopilot pulls toward the aim
  rollGain: 2.5,         // how hard the autopilot banks toward the aim
  aggressiveAngle: 0.25, // radians (~15°): when the aim is further off than this, bank hard into the turn
  minSpeed: 55,          // metres per second (about 200 km/h)
  maxSpeed: 330,
  boostExtra: 110,       // extra speed while boosting
};

// ---------- 3D model ----------
const mat = (col, extra = {}) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 0.6, metalness: 0.2, ...extra });

// A flat shape with some thickness (wings, tail fins)
function slab(points, depth, m) {
  const sh = new THREE.Shape();
  sh.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]);
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geo, m);
}

// The jet points along -z (its nose), with +y up and +x to its right
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

  // Show the flame for a given power (0 = idle, 1 = full, more with boost)
  function setFlame(power) {
    const len = 0.55 + power * 1.5 + Math.random() * 0.12;
    flame.scale.set(1, len, 1);
    flameCore.scale.set(1, len * 0.7, 1);
    flame.material.opacity = 0.45 + Math.min(power, 1) * 0.45;
  }

  return { mesh: jet, setFlame };
}

// ---------- Flight ----------
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const tmpQ = new THREE.Quaternion();
const invQ = new THREE.Quaternion();
const local = new THREE.Vector3();
const right = new THREE.Vector3();
const flatFwd = new THREE.Vector3();
const flatRight = new THREE.Vector3();
const turnTarget = new THREE.Vector3();

export function createFlight() {
  const state = {
    pos: new THREE.Vector3(),
    q: new THREE.Quaternion(),      // which way the plane is turned (its "attitude")
    fwd: new THREE.Vector3(0, 0, -1),
    speed: 150,                     // metres per second
    throttle: 0.6,                  // 0..1
    rates: { pitch: 0, roll: 0, yaw: 0 },
  };

  let turnSide = 1;   // which way to turn when the aim is behind us (remembered, so it doesn't flip back and forth)

  // aimDir: the world direction the player is pointing at. boost: true while holding the left button.
  function step(dt, aimDir, boost) {
    const F = FLIGHT;

    // 0. If the aim is behind the plane, don't loop over the top (that loses lots of height).
    //    Instead aim at a point to the side first, so the plane makes a normal level banked turn.
    let target = aimDir;
    if (aimDir.dot(state.fwd) < -0.2) {
      flatFwd.set(state.fwd.x, 0, state.fwd.z).normalize();
      flatRight.set(-flatFwd.z, 0, flatFwd.x);
      const side = aimDir.dot(flatRight);
      if (Math.abs(side) > 0.1) turnSide = Math.sign(side);
      turnTarget.copy(flatFwd).multiplyScalar(0.3).addScaledVector(flatRight, turnSide);
      turnTarget.y = aimDir.y * 0.5;
      target = turnTarget.normalize();
    }

    // 1. Where is the aim, as seen from the plane? (x = to its right, y = above it, -z = straight ahead)
    invQ.copy(state.q).invert();
    local.copy(target).applyQuaternion(invQ).normalize();
    const angleOff = Math.acos(clamp(-local.z, -1, 1));

    // If the target is still behind us, use the full sideways/up direction (otherwise the numbers get tiny)
    let lx = local.x, ly = local.y;
    if (local.z > 0) {
      const side = Math.hypot(lx, ly);
      if (side < 1e-3) { lx = turnSide; ly = 0; } else { lx /= side; ly /= side; }
    }

    // 2. Autopilot: decide stick inputs from -1 to 1
    right.copy(AX).applyQuaternion(state.q);
    const levelRoll = right.y * 2;                         // roll that brings the wings back to level
    const turnRoll = clamp(lx * F.rollGain, -1, 1);       // roll that banks toward the aim
    const t = clamp(angleOff / F.aggressiveAngle, 0, 1);   // small error → keep wings level; big error → bank into the turn
    const rollCmd = clamp(levelRoll + (turnRoll - levelRoll) * t, -1, 1);
    const pitchCmd = clamp(ly * F.pitchGain, -1, 1);
    const yawCmd = clamp(lx * 2, -1, 1);

    // 3. Turn rates follow the inputs smoothly (a real plane can't snap instantly)
    const k = 1 - Math.exp(-F.response * dt);
    state.rates.pitch += (pitchCmd * F.maxPitchRate - state.rates.pitch) * k;
    state.rates.roll += (rollCmd * F.maxRollRate - state.rates.roll) * k;
    state.rates.yaw += (yawCmd * F.maxYawRate - state.rates.yaw) * k;

    // 4. Rotate the plane around its own axes
    tmpQ.setFromAxisAngle(AX, state.rates.pitch * dt); state.q.multiply(tmpQ);   // nose up/down
    tmpQ.setFromAxisAngle(AZ, -state.rates.roll * dt); state.q.multiply(tmpQ);   // tilt wings
    tmpQ.setFromAxisAngle(AY, -state.rates.yaw * dt); state.q.multiply(tmpQ);    // nose left/right
    state.q.normalize();
    state.fwd.set(0, 0, -1).applyQuaternion(state.q);

    // 5. Speed: throttle pushes toward a target speed; climbing slows you, diving speeds you up
    const targetSpeed = 80 + state.throttle * 170 + (boost ? F.boostExtra : 0);
    state.speed += (targetSpeed - state.speed) * dt * (boost ? 1.2 : 0.6);
    state.speed -= state.fwd.y * 35 * dt;
    state.speed = clamp(state.speed, F.minSpeed, F.maxSpeed + (boost ? F.boostExtra : 0));

    // 6. Move forward
    state.pos.addScaledVector(state.fwd, state.speed * dt);
  }

  function reset(pos, heading) {
    state.pos.copy(pos);
    state.q.setFromAxisAngle(AY, heading);
    state.fwd.set(0, 0, -1).applyQuaternion(state.q);
    state.speed = 150;
    state.throttle = 0.6;
    state.rates.pitch = state.rates.roll = state.rates.yaw = 0;
  }

  return { state, step, reset };
}
