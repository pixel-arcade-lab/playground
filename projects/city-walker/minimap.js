// The map: a small one in the top-right corner, and a big one (press M, or click the small map while paused).
// It is drawn from the list of shapes and places that map.js records while building the world.
// North is up. The arrow shows where you are and which way you face.

const COLORS = {
  ground: '#5d7b40',
  gravel: '#cdc6b5',
  path: '#9e978a',
  water: '#3d6d88',
  wall: '#e6dfcf',
  building: '#6e4a2c',
  hall: '#6e4a2c',
  platform: '#9b968c',
  pagoda: '#8a3a2a',
  hut: '#4a4744',
  torii: '#cf4a2c',
  'tree-maple': '#c0392b',
  'tree-cherry': '#f4b6c8',
  'tree-pine': '#2f5a3a',
};

export function createMinimap(info) {
  const small = document.getElementById('minimap');
  const bigWrap = document.getElementById('bigmap');
  const big = document.getElementById('bigmap-canvas');
  const half = info.half;

  // Draw the world (everything that never moves) onto a canvas of the given size
  function drawWorld(ctx, size, withLabels) {
    const s = size / (half * 2);
    const X = (x) => (x + half) * s;
    const Z = (z) => (z + half) * s;
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, 0, size, size);
    for (const sh of info.shapes) {
      ctx.fillStyle = COLORS[sh.kind] || '#888';
      if (sh.kind.startsWith('tree')) {
        ctx.beginPath();
        ctx.arc(X(sh.x), Z(sh.z), Math.max(1.5, (sh.w / 2) * s), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(X(sh.x - sh.w / 2), Z(sh.z - sh.d / 2), Math.max(1, sh.w * s), Math.max(1, sh.d * s));
      }
    }
    // Place markers: gold = you can go inside, white = just a place to visit
    for (const p of info.places) {
      const r = withLabels ? 6 : 3;
      ctx.beginPath();
      ctx.arc(X(p.x), Z(p.z), r, 0, Math.PI * 2);
      ctx.fillStyle = p.enter ? '#f2c94c' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = withLabels ? 2 : 1;
      ctx.strokeStyle = '#1a1414';
      ctx.stroke();
      if (withLabels) {
        ctx.font = `bold ${Math.round(size / 42)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // Keep the label inside the map, even for places near the edge
        const halfText = ctx.measureText(p.name).width / 2 + 4;
        const lx = Math.min(size - halfText, Math.max(halfText, X(p.x)));
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(p.name, lx, Z(p.z) - 9);
        ctx.fillStyle = '#fff';
        ctx.fillText(p.name, lx, Z(p.z) - 9);
      }
    }
  }

  // Draw the world once into hidden canvases, then copy it every frame and add the arrow on top
  function prepare(canvas, cssSize, withLabels) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    canvas.style.width = canvas.style.height = cssSize + 'px';
    const background = document.createElement('canvas');
    background.width = canvas.width;
    background.height = canvas.height;
    drawWorld(background.getContext('2d'), canvas.width, withLabels);
    return background;
  }

  let smallBg = prepare(small, 170, false);
  let bigBg = null;
  let bigOpen = false;

  function bigSize() {
    return Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.82);
  }

  function drawPlayer(canvas, background, state, time) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const s = size / (half * 2);
    ctx.drawImage(background, 0, 0);
    const scale = size / 170;   // keep the arrow the same look on both maps
    if (state.inside) {
      // Inside a building: pulse a ring around it
      const x = (state.inside.x + half) * s, z = (state.inside.z + half) * s;
      const pulse = 5 + Math.sin(time * 5) * 2;
      ctx.beginPath();
      ctx.arc(x, z, (pulse + 3) * Math.min(scale, 2.5), 0, Math.PI * 2);
      ctx.lineWidth = 2 * Math.min(scale, 2.5);
      ctx.strokeStyle = '#ff4d4d';
      ctx.stroke();
      return;
    }
    // Outside: an arrow pointing the way you face
    const x = (state.x + half) * s, z = (state.z + half) * s;
    const dirX = Math.sin(state.facing), dirZ = Math.cos(state.facing);
    const len = 7 * Math.min(scale, 2.5), wid = 4.5 * Math.min(scale, 2.5);
    ctx.beginPath();
    ctx.moveTo(x + dirX * len, z + dirZ * len);
    ctx.lineTo(x - dirX * len * 0.6 + dirZ * wid, z - dirZ * len * 0.6 - dirX * wid);
    ctx.lineTo(x - dirX * len * 0.6 - dirZ * wid, z - dirZ * len * 0.6 + dirX * wid);
    ctx.closePath();
    ctx.fillStyle = '#ff4d4d';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }

  function toggleBig(open = !bigOpen) {
    bigOpen = open;
    bigWrap.classList.toggle('open', bigOpen);
    if (bigOpen) bigBg = prepare(big, bigSize(), true);
  }

  small.addEventListener('click', () => toggleBig());
  bigWrap.addEventListener('click', () => toggleBig(false));
  window.addEventListener('resize', () => { if (bigOpen) bigBg = prepare(big, bigSize(), true); });

  // state: { x, z, facing } when outside, or { inside: { x, z } } when inside a building
  function update(state, time) {
    drawPlayer(small, smallBg, state, time);
    if (bigOpen) drawPlayer(big, bigBg, state, time);
  }

  return { update, toggleBig };
}
