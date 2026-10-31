// The player character: a flat pixel-art picture that always faces the camera (like enemies in Doom).
// It has 3 views (front, side, back) and 18 poses: standing, 8 walking frames, 8 running frames, jumping.
// Legs have a thigh and a shin (so knees bend), arms have an elbow, and the body bobs as the feet land.
import * as THREE from 'three';
import { addOutline, blobShadowTexture, pixelCanvasTexture } from './textures.js';

const CELL_W = 32;   // pixels per pose, across
const CELL_H = 64;   // pixels per pose, down
const ROWS = 3;      // views: 0 front, 1 side (facing right), 2 back

// The list of poses, one column each in the picture sheet
const POSES = [{ type: 'idle' }];
for (let k = 0; k < 8; k++) POSES.push({ type: 'walk', t: k / 8 });
for (let k = 0; k < 8; k++) POSES.push({ type: 'run', t: k / 8 });
POSES.push({ type: 'jump' });
const COLS = POSES.length;
const WALK_START = 1, RUN_START = 9, JUMP_COL = 17;

// Colours. Anime-fighter style: pink spiky hair, dark blue jacket, red hood, red sneakers.
const C = {
  outline: '#16121c',
  hair: '#f39aa0', hairLight: '#ffc4c6', roots: '#4a2f30',
  skin: '#f4cfb0', skinShade: '#d9a88a', mark: '#b07a64', mouth: '#9a5a4a',
  eye: '#2a1a1a', white: '#ffffff', iris: '#7a4a32',
  hood: '#c4262e', hoodDark: '#8e1a20', hoodLight: '#e0474d',
  jacket: '#1f2d55', jacketDark: '#141d3a', jacketLight: '#2f4275',
  pants: '#1b1d29', pantsDark: '#101119',
  shoe: '#c0262c', shoeDark: '#8e1a20', sole: '#f2f2f2',
};

const THIGH = 9, SHIN = 9, UPPER_ARM = 8, FOREARM = 7;   // limb lengths in pixels

// Angles of each limb for a pose (radians, 0 = straight down, positive = forward).
// legs[0]/arms[0] = near side, legs[1]/arms[1] = far side.
function limbAngles(pose) {
  if (pose.type === 'idle') {
    return { legs: [{ hip: 0, knee: 0.05 }, { hip: 0, knee: 0.05 }], arms: [{ up: 0.05, elbow: 0.15 }, { up: -0.05, elbow: 0.15 }], lean: 0 };
  }
  if (pose.type === 'jump') {
    return { legs: [{ hip: 0.75, knee: 1.3 }, { hip: -0.3, knee: 0.6 }], arms: [{ up: 1.1, elbow: 0.7 }, { up: -0.6, elbow: 0.3 }], lean: 0 };
  }
  const run = pose.type === 'run';
  const A = run ? 0.75 : 0.42;      // how far legs swing
  const K = run ? 1.5 : 0.75;       // how much the knee bends while the leg swings forward
  const AA = run ? 0.9 : 0.5;       // how far arms swing
  const E = run ? 1.4 : 0.3;        // elbow bend (runners keep elbows bent)
  const phase = pose.t * Math.PI * 2;
  const leg = (p) => ({ hip: A * Math.sin(p), knee: K * Math.max(0, Math.cos(p)) + (run ? 0.2 : 0.05) });
  return {
    legs: [leg(phase), leg(phase + Math.PI)],
    arms: [{ up: -AA * Math.sin(phase), elbow: E }, { up: AA * Math.sin(phase), elbow: E }],
    lean: run ? 1 : 0,
  };
}

// Where the knee and foot end up, measured from the hip
function legPoints({ hip, knee }) {
  const kx = Math.sin(hip) * THIGH, ky = Math.cos(hip) * THIGH;
  const shin = hip - knee;
  return { kx, ky, fx: kx + Math.sin(shin) * SHIN, fy: ky + Math.cos(shin) * SHIN, shin };
}

// Draw a thick line (a limb) by stamping small squares along it
function limb(r, x0, y0, angle, length, size, color) {
  for (let s = 0; s <= length; s += 0.5) {
    const cx = Math.round(x0 + Math.sin(angle) * s);
    const cy = Math.round(y0 + Math.cos(angle) * s);
    r(cx - Math.floor(size / 2), cy - 1, size, 3, color);
  }
}

// Draw "spikes" of hair going up from row 4. Each spike is [x, height].
function spikes(u, list) {
  for (const [x, h] of list) {
    for (let i = 1; i <= h; i++) u(x, 4 - i, i === h ? 1 : 2, 1, C.hair);
  }
}

// ---------- Side view (facing right) ----------
function drawSide(r, L) {
  const pts = L.legs.map(legPoints);
  // Lift the whole body so the lowest foot touches the ground line. This makes the body bob naturally.
  const drop = Math.max(...pts.map((p) => p.fy));
  const hipY = Math.round(60 - drop);
  const dy = hipY - 41;
  const dx = L.lean;
  const u = (x, y, w, h, c) => r(x + dx, y + dy, w, h, c);   // upper body, moved with the bob and lean
  const hipX = 16;

  function drawLeg(p, angles, pants, shoe) {
    limb(r, hipX, hipY, angles.hip, THIGH, 5, pants);
    limb(r, hipX + p.kx, hipY + p.ky, p.shin, SHIN, 5, pants);
    const fx = Math.round(hipX + p.fx), fy = Math.round(hipY + p.fy);
    r(fx - 2, fy - 1, 7, 2, shoe);
    r(fx - 2, fy + 1, 7, 1, C.sole);
  }
  function drawArm(a, jacket, dark) {
    const sx = 16 + dx, sy = 24 + dy;
    limb(r, sx, sy, a.up, UPPER_ARM, 4, jacket);
    const ex = sx + Math.sin(a.up) * UPPER_ARM, ey = sy + Math.cos(a.up) * UPPER_ARM;
    const fa = a.up + a.elbow;
    limb(r, ex, ey, fa, FOREARM, 4, dark);
    const hx = Math.round(ex + Math.sin(fa) * FOREARM), hy = Math.round(ey + Math.cos(fa) * FOREARM);
    r(hx - 1, hy - 1, 3, 3, C.skin);
  }

  // Far side first (darker), then body, then near side on top
  drawArm(L.arms[1], C.jacketDark, C.jacketDark);
  drawLeg(pts[1], L.legs[1], C.pantsDark, C.shoeDark);

  u(11, 22, 10, 19, C.jacket); u(11, 22, 2, 19, C.jacketDark);
  u(19, 24, 1, 13, C.jacketLight); u(11, 38, 10, 3, C.jacketDark);
  u(11, 17, 9, 5, C.hood); u(9, 19, 4, 9, C.hood); u(9, 26, 4, 2, C.hoodDark);
  u(17, 18, 2, 2, C.hoodDark); u(12, 18, 2, 2, C.hoodLight);

  drawLeg(pts[0], L.legs[0], C.pants, C.shoe);
  drawArm(L.arms[0], C.jacket, C.jacket);

  // Head in profile (leans a little more when running)
  const h = (x, y, w, hh, c) => u(x + dx, y, w, hh, c);
  h(13, 8, 9, 9, C.skin); h(22, 12, 1, 2, C.skin);
  h(11, 8, 3, 8, C.roots);
  h(15, 11, 2, 3, C.skinShade);
  h(18, 10, 3, 1, C.roots);
  h(19, 12, 2, 1, C.eye); h(19, 13, 1, 1, C.white); h(20, 13, 1, 1, C.iris);
  h(19, 14, 2, 1, C.mark); h(20, 15, 2, 1, C.mouth);
  h(11, 4, 10, 5, C.hair); h(19, 8, 3, 1, C.hair); h(21, 9, 1, 1, C.hair);
  spikes(h, [[11, 2], [13, 3], [15, 3], [17, 3], [19, 2]]);
  h(9, 5, 2, 1, C.hair); h(8, 6, 3, 1, C.hair); h(10, 7, 1, 2, C.hair);
  h(14, 5, 4, 1, C.hairLight);
}

// ---------- Front and back views ----------
function drawFrontBack(r, L, back) {
  // From the front, a leg swinging forward or back looks shorter, and a bent knee lifts the foot
  const lens = L.legs.map((a) => legPoints(a).fy);
  const drop = Math.max(...lens);
  const hipY = Math.round(60 - drop);
  const dy = hipY - 41;
  const u = (x, y, w, h, c) => r(x, y + dy, w, h, c);

  // Legs (screen-left uses legs[0])
  [[10, lens[0], 0], [17, lens[1], 4]].forEach(([x, len, shadeX]) => {
    const footY = Math.round(hipY + len);
    r(x, hipY, 5, footY - hipY - 1, C.pants);
    r(x + shadeX, hipY, 1, footY - hipY - 1, C.pantsDark);
    r(x - (x < 16 ? 1 : 0), footY - 1, 6, 2, C.shoe);
    r(x - (x < 16 ? 1 : 0), footY + 1, 6, 1, C.sole);
  });

  // Arms: an arm swinging toward or away from the viewer looks shorter
  L.arms.forEach((a, i) => {
    const len = Math.round(Math.cos(a.up) * UPPER_ARM + Math.cos(a.up + a.elbow) * FOREARM);
    const x = i === 0 ? 4 : 24;
    u(x, 23, 4, len, C.jacket);
    u(i === 0 ? 4 : 27, 23, 1, len, C.jacketDark);
    u(x, 23 + len, 4, 3, C.skin);
  });

  // Jacket
  u(7, 23, 18, 3, C.jacket); u(8, 22, 16, 19, C.jacket);
  u(8, 25, 1, 13, C.jacketDark); u(23, 25, 1, 13, C.jacketDark);
  u(8, 38, 16, 3, C.jacketDark);

  if (!back) {
    u(15, 23, 1, 15, C.jacketDark); u(10, 25, 2, 9, C.jacketLight);
    // Hood worn around the neck
    u(11, 17, 10, 1, C.hood); u(9, 18, 14, 4, C.hood); u(10, 22, 12, 1, C.hoodDark);
    u(13, 18, 6, 2, C.hoodDark); u(14, 17, 4, 1, C.skinShade);
    u(10, 18, 2, 2, C.hoodLight); u(9, 21, 14, 1, C.hoodDark);
    // Face
    u(11, 8, 10, 9, C.skin); u(11, 9, 1, 7, C.skinShade); u(20, 9, 1, 7, C.skinShade);
    u(10, 11, 1, 3, C.skinShade); u(21, 11, 1, 3, C.skinShade);           // ears
    u(12, 10, 2, 1, C.roots); u(14, 11, 1, 1, C.roots);                  // eyebrows
    u(18, 10, 2, 1, C.roots); u(17, 11, 1, 1, C.roots);
    u(12, 12, 3, 1, C.eye); u(17, 12, 3, 1, C.eye);                      // eyes
    u(12, 13, 3, 1, C.white); u(17, 13, 3, 1, C.white);
    u(13, 13, 1, 1, C.iris); u(18, 13, 1, 1, C.iris);
    u(12, 14, 2, 1, C.mark); u(18, 14, 2, 1, C.mark);                    // small marks under the eyes
    u(16, 14, 1, 1, C.skinShade); u(15, 15, 2, 1, C.mouth);              // nose, mouth
    // Hair with darker roots at the sides and strands over the forehead
    u(10, 4, 12, 5, C.hair);
    u(10, 6, 1, 5, C.roots); u(21, 6, 1, 5, C.roots);
    for (const x of [11, 12, 14, 15, 17, 19, 20]) u(x, 9, 1, 1, C.hair);
  } else {
    // Hood hanging down the back
    u(9, 17, 14, 4, C.hood); u(10, 21, 12, 8, C.hood); u(11, 29, 10, 1, C.hood);
    u(10, 27, 12, 2, C.hoodDark); u(15, 21, 2, 6, C.hoodDark); u(10, 18, 3, 1, C.hoodLight);
    // Back of the head: dark short hair low, pink hair on top
    u(11, 8, 10, 9, C.roots);
    u(10, 11, 1, 3, C.skin); u(21, 11, 1, 3, C.skin);
    u(10, 4, 12, 8, C.hair);
    for (const x of [11, 13, 16, 18, 20]) u(x, 12, 1, 1, C.hair);
  }
  spikes(u, [[10, 2], [12, 3], [14, 3], [16, 3], [18, 3], [20, 2]]);
  u(8, 5, 2, 1, C.hair); u(9, 6, 1, 2, C.hair); u(22, 5, 2, 1, C.hair); u(22, 6, 1, 2, C.hair);
  u(13, 5, 4, 1, C.hairLight); u(11, 4, 1, 1, C.hairLight);
}

export function createCharacter() {
  // Draw every pose and view onto one picture ("sprite sheet")
  const canvas = document.createElement('canvas');
  canvas.width = CELL_W * COLS;
  canvas.height = CELL_H * ROWS;
  const ctx = canvas.getContext('2d');
  for (let row = 0; row < ROWS; row++) {
    POSES.forEach((pose, col) => {
      const ox = col * CELL_W, oy = row * CELL_H;
      // Only draw inside this pose's cell, so poses never overlap
      const r = (x, y, w, h, c) => {
        const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
        const x1 = Math.min(CELL_W, Math.round(x) + w), y1 = Math.min(CELL_H - 1, Math.round(y) + h);
        if (x1 <= x0 || y1 <= y0) return;
        ctx.fillStyle = c;
        ctx.fillRect(ox + x0, oy + y0, x1 - x0, y1 - y0);
      };
      const L = limbAngles(pose);
      if (row === 1) drawSide(r, L);
      else drawFrontBack(r, L, row === 2);
    });
  }
  addOutline(ctx, canvas.width, canvas.height, CELL_W, CELL_H, C.outline);

  const texture = pixelCanvasTexture(canvas, false);
  texture.repeat.set(1 / COLS, 1 / ROWS);

  // A flat rectangle, 1 m wide and 2 m tall, with its bottom at the feet
  const geometry = new THREE.PlaneGeometry(1, 2);
  geometry.translate(0, 1 - 2 / CELL_H, 0);
  const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide });
  const sprite = new THREE.Mesh(geometry, material);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.55),
    new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;

  const root = new THREE.Group();
  root.add(sprite, shadow);

  let cycle = 0;
  let lastHalf = 0;
  function setFrame(col, row) {
    texture.offset.set(col / COLS, 1 - (row + 1) / ROWS);
  }

  // Called every frame: turn to face the camera and pick the right view and pose
  function update({ pos, facing, camera, dt, moving, running, onGround, groundY }) {
    root.position.copy(pos);

    const camAngle = Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z);
    sprite.rotation.y = camAngle;

    // Angle between where the character faces and where the camera is
    const rel = Math.atan2(Math.sin(camAngle - facing), Math.cos(camAngle - facing));
    const a = Math.abs(rel);
    let row = 1;
    let flip = false;
    if (a < Math.PI / 4) row = 0;                 // camera in front → show face
    else if (a > (3 * Math.PI) / 4) row = 2;      // camera behind → show back
    else flip = rel > 0;                          // camera at the side → face left or right
    sprite.scale.x = flip ? -1 : 1;

    let col = 0;
    let stepped = false;
    if (!onGround) col = JUMP_COL;
    else if (moving) {
      cycle += dt * (running ? 2.4 : 1.6);       // walk cycles per second (each cycle = 2 steps)
      const frame = Math.floor((cycle % 1) * 8);
      col = (running ? RUN_START : WALK_START) + frame;
      // A foot touches the ground twice per cycle: tell the game so it can play a footstep
      const half = Math.floor(cycle * 2 + 0.5);
      if (half !== lastHalf) { stepped = true; lastHalf = half; }
    } else { cycle = 0; lastHalf = 0; }
    setFrame(col, row);

    // Shadow stays on the ground and shrinks when jumping
    const height = Math.max(0, pos.y - groundY);
    shadow.position.y = groundY - pos.y + 0.03;
    const s = Math.max(0.4, 1 - height * 0.3);
    shadow.scale.set(s, s, 1);
    return { stepped };
  }

  setFrame(0, 2);
  return { root, update };
}
