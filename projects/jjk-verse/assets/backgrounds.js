// Night background layers, painted with canvas drawing commands. Each layer is 480 x 270 and repeats
// left to right without a seam (shapes near an edge are also drawn on the other side).
// Layers further away move slower when the camera scrolls ("parallax"), which gives a feeling of depth.
import { addPainted, seededRandom } from './pixel.js';

const W = 480, H = 270;

// Draw something at x, and again one layer-width to the left and right, so the layer wraps seamlessly
const wrap = (x, fn) => { fn(x); fn(x - W); fn(x + W); };

export const BG_LAYERS = [
  { key: 'bg_sky', speed: 0 },      // speed: how much the layer moves compared with the level (0 = fixed)
  { key: 'bg_far', speed: 0.1 },
  { key: 'bg_mid', speed: 0.3 },
  { key: 'bg_near', speed: 0.55 },
];

export function addBackgrounds(scene) {
  // Sky: dark blue to purple, stars, and a big moon with a red cursed haze
  addPainted(scene, 'bg_sky', W, H, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#07061a');
    grad.addColorStop(0.55, '#1c1238');
    grad.addColorStop(1, '#3a1a3e');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    const rnd = seededRandom(3);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = rnd() < 0.2 ? '#ffe9c2' : '#c9c2ff';
      g.globalAlpha = 0.4 + rnd() * 0.6;
      g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * 0.6), 1, 1);
    }
    g.globalAlpha = 1;
    const haze = g.createRadialGradient(360, 70, 20, 360, 70, 110);
    haze.addColorStop(0, 'rgba(255,80,110,0.35)');
    haze.addColorStop(1, 'rgba(255,80,110,0)');
    g.fillStyle = haze; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f3e6ff'; g.beginPath(); g.arc(360, 70, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8c6ec';
    for (const [x, y, r] of [[350, 62, 6], [371, 80, 4], [363, 88, 3], [374, 60, 3]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  });

  // Far: mountains and a pagoda on the skyline
  addPainted(scene, 'bg_far', W, H, (g) => {
    g.fillStyle = '#1a1430';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const y = 170 + 22 * Math.sin((x / W) * Math.PI * 4) + 10 * Math.sin((x / W) * Math.PI * 10 + 1);
      g.lineTo(x, y);
    }
    g.lineTo(W, H); g.closePath(); g.fill();
    wrap(110, (x) => {   // pagoda
      for (let i = 0; i < 4; i++) {
        const w = 34 - i * 7, y = 150 - i * 14;
        g.fillRect(x - w / 2, y, w, 3);
        g.fillRect(x - w / 2 + 6, y + 3, w - 12, 11);
      }
      g.fillRect(x - 1, 92, 2, 10);
    });
  });

  // Middle: school buildings with a few lit windows
  addPainted(scene, 'bg_mid', W, H, (g) => {
    const rnd = seededRandom(9);
    const buildings = [[20, 70, 120], [110, 90, 95], [215, 60, 140], [300, 110, 105], [420, 80, 125]];
    for (const [bx, bw, bh] of buildings) {
      wrap(bx, (x) => {
        const top = H - bh;
        g.fillStyle = '#141226'; g.fillRect(x, top, bw, bh);
        g.fillRect(x + bw / 2 - 6, top - 14, 12, 14);   // little clock tower / water tank
        for (let wy = top + 10; wy < H - 20; wy += 14) {
          for (let wx = x + 6; wx < x + bw - 8; wx += 12) {
            const lit = rnd() < 0.18;
            g.fillStyle = lit ? '#e8c86a' : '#221f3a';
            g.fillRect(wx, wy, 6, 7);
          }
        }
      });
    }
  });

  // Near: dark trees and a fence
  addPainted(scene, 'bg_near', W, H, (g) => {
    g.fillStyle = '#0b0a16';
    const rnd = seededRandom(21);
    for (let i = 0; i < 9; i++) {
      const tx = Math.floor(rnd() * W), ty = 175 + rnd() * 30, r = 18 + rnd() * 16;
      wrap(tx, (x) => {
        g.fillRect(x - 3, ty, 6, H - ty);
        for (const [dx, dy, rr] of [[0, -r * 0.6, r], [-r * 0.7, -r * 0.1, r * 0.75], [r * 0.7, -r * 0.1, r * 0.75]]) {
          g.beginPath(); g.arc(x + dx, ty + dy, rr, 0, Math.PI * 2); g.fill();
        }
      });
    }
    g.fillRect(0, 238, W, 3);
    g.fillRect(0, 252, W, 3);
    for (let x = 0; x < W; x += 12) g.fillRect(x, 232, 3, H - 232);
  });
}

// Small round glow (lamps, lit lanterns)
export function addGlow(scene, key, size, colour) {
  addPainted(scene, key, size, size, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, colour);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
}
