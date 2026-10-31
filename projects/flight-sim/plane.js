// The planes you can choose, and how they fly.
// The 3D models live in assets/planes/; this file holds the handling settings and the flight code.
//
// How the controls work ("mouse aim", like War Thunder):
//   The mouse points at a direction in the world (the aim circle on screen).
//   An autopilot turns the plane toward that direction by itself: it banks (tilts the wings) and pulls
//   the nose round, the way a real pilot turns. So the player only says WHERE to go, never HOW.
import * as THREE from 'three';
import { createJetModel } from './assets/planes/jet.js';
import { createYakModel } from './assets/planes/yak.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------- The planes (change these numbers to tune the feel) ----------
// Speeds are in metres per second (× 3.6 = km/h).
export const PLANE_TYPES = {
  yak: {
    name: 'Yak',
    about: 'Soviet propeller trainer. Slow and gentle, made for sightseeing.',
    createModel: createYakModel,
    engine: 'prop',                 // which engine sound
    camera: { distance: 15, height: 3.2 },
    flight: {
      maxPitchRate: 0.95,   // how fast the nose can go up/down (radians per second)
      maxRollRate: 2.2,     // how fast the plane can tilt its wings
      maxYawRate: 0.3,      // small side-to-side nose movement (rudder)
      response: 4.5,        // how quickly the controls react (higher = snappier)
      pitchGain: 2.2,       // how hard the autopilot pulls toward the aim
      rollGain: 2.5,        // how hard the autopilot banks toward the aim
      aggressiveAngle: 0.25, // radians (~15°): when the aim is further off than this, bank hard into the turn
      slowSpeed: 28,        // speed at 0% throttle (~100 km/h)
      fastSpeed: 64,        // speed at 100% throttle (~230 km/h). 50% throttle ≈ 46 m/s ≈ 165 km/h
      minSpeed: 24,
      maxSpeed: 80,
      boostExtra: 14,       // extra speed while holding the left button (~50 km/h)
      climbDrag: 14,        // how much climbing slows you down (and diving speeds you up)
      takeoffAccel: 4.5,    // speed gained per second on the runway
      rotateSpeed: 30,      // lifts off at this speed (~108 km/h)
      landingSpeed: 42,     // must be slower than this to land (~150 km/h)
      brake: 5,             // speed lost per second after landing
    },
  },
  jet: {
    name: 'Jet',
    about: 'Small jet. A little faster, with an afterburner boost.',
    createModel: createJetModel,
    engine: 'jet',
    camera: { distance: 17, height: 3.4 },
    flight: {
      maxPitchRate: 1.15,
      maxRollRate: 2.8,
      maxYawRate: 0.32,
      response: 5,
      pitchGain: 2.2,
      rollGain: 2.5,
      aggressiveAngle: 0.25,
      slowSpeed: 32,        // ~115 km/h
      fastSpeed: 80,        // ~290 km/h. 50% throttle ≈ 56 m/s ≈ 200 km/h
      minSpeed: 28,
      maxSpeed: 100,
      boostExtra: 30,       // ~110 km/h extra
      climbDrag: 16,
      takeoffAccel: 6,
      rotateSpeed: 38,      // ~137 km/h
      landingSpeed: 55,     // ~198 km/h
      brake: 6,
    },
  },
};

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
    speed: 45,                      // metres per second
    throttle: 0.5,                  // 0..1
    rates: { pitch: 0, roll: 0, yaw: 0 },
    onGround: false,
    rolling: null,                  // on the ground: 'takeoff' (speeding up), 'landing' (braking) or null (parked)
  };
  let F = PLANE_TYPES.yak.flight;   // settings of the chosen plane
  let turnSide = 1;   // which way to turn when the aim is behind us (remembered, so it doesn't flip back and forth)

  const cruise = (throttle) => F.slowSpeed + throttle * (F.fastSpeed - F.slowSpeed);

  // aimDir: the world direction the player is pointing at. boost: true while holding the left button.
  function step(dt, aimDir, boost) {
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

    // 5. Speed: throttle pushes toward a cruise speed; climbing slows you, diving speeds you up
    const targetSpeed = cruise(state.throttle) + (boost ? F.boostExtra : 0);
    state.speed += (targetSpeed - state.speed) * dt * (boost ? 1.0 : 0.5);
    state.speed -= state.fwd.y * F.climbDrag * dt;
    state.speed = clamp(state.speed, F.minSpeed, F.maxSpeed + (boost ? F.boostExtra : 0));

    // 6. Move forward
    state.pos.addScaledVector(state.fwd, state.speed * dt);
  }

  // ---------- On the ground ----------
  // The plane rolls straight ahead, wings level, wheels on the ground. groundAt(x, z) gives the ground height.
  // Returns 'liftoff' when it leaves the ground, 'stopped' when it has braked to a stop.
  function groundStep(dt, groundAt, gearHeight) {
    if (state.rolling === 'takeoff') state.speed += F.takeoffAccel * dt;
    else state.speed = Math.max(0, state.speed - F.brake * dt);
    flatFwd.set(state.fwd.x, 0, state.fwd.z).normalize();
    state.q.setFromAxisAngle(AY, Math.atan2(-flatFwd.x, -flatFwd.z));
    if (state.rolling === 'takeoff') {   // lift the nose a little just before leaving the ground
      const lift = clamp((state.speed - F.rotateSpeed * 0.75) / (F.rotateSpeed * 0.25), 0, 1) * 0.1;
      tmpQ.setFromAxisAngle(AX, lift); state.q.multiply(tmpQ);
    }
    state.fwd.set(0, 0, -1).applyQuaternion(state.q);
    state.pos.x += flatFwd.x * state.speed * dt;
    state.pos.z += flatFwd.z * state.speed * dt;
    state.pos.y = groundAt(state.pos.x, state.pos.z) + gearHeight;
    state.rates.pitch = state.rates.roll = state.rates.yaw = 0;
    if (state.rolling === 'takeoff' && state.speed >= F.rotateSpeed) {
      state.onGround = false; state.rolling = null;
      return 'liftoff';
    }
    if (state.rolling === 'landing' && state.speed === 0) { state.rolling = null; return 'stopped'; }
    return null;
  }
  function startTakeoff() { if (state.onGround) state.rolling = 'takeoff'; }
  function touchdown() { state.onGround = true; state.rolling = 'landing'; }

  // Is a touchdown right now gentle enough to count as a landing? (the caller checks it is on the runway)
  function canLand() {
    right.copy(AX).applyQuaternion(state.q);
    return state.speed <= F.landingSpeed &&     // slow enough
      state.fwd.y * state.speed > -6 &&          // sinking less than 6 m/s
      state.fwd.y > -0.2 &&                      // nose not pointing down steeply
      Math.abs(right.y) < 0.2;                   // wings nearly level
  }

  // Put the plane at pos, turned to heading. onGround: parked (speed 0) instead of flying.
  function reset(pos, heading, onGround = false) {
    state.pos.copy(pos);
    state.q.setFromAxisAngle(AY, heading);
    state.fwd.set(0, 0, -1).applyQuaternion(state.q);
    state.throttle = 0.5;
    state.speed = onGround ? 0 : cruise(state.throttle);
    state.onGround = onGround;
    state.rolling = null;
    state.rates.pitch = state.rates.roll = state.rates.yaw = 0;
  }

  // Switch to the handling settings of another plane
  function setType(type) { F = PLANE_TYPES[type].flight; }

  return { state, step, groundStep, startTakeoff, touchdown, canLand, reset, setType, get settings() { return F; } };
}
