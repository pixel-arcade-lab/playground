// Sound effects made in code with the browser's audio system (no sound files).
// Browsers only allow sound after a key press or click, so init() is called from the title screen.
let ctx = null, master = null, noise = null;
let muted = false;
const VOLUME = 0.45;

export function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : VOLUME;
  master.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : VOLUME;
  return muted;
}

// ---------- Building blocks ----------
// A tone that slides from one pitch to another and fades out
function tone(type, f0, f1, dur, vol, delay = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}
// A burst of filtered noise (hits, whooshes, explosions)
function hiss(filterType, freq, dur, vol, delay = 0, q = 1) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t); s.stop(t + dur + 0.02);
}

// ---------- Game sounds ----------
export const jump = () => tone('square', 260, 520, 0.12, 0.12);
export const land = () => hiss('lowpass', 500, 0.06, 0.15);
export const dash = () => hiss('bandpass', 1400, 0.16, 0.25, 0, 0.8);
export const punch = () => hiss('bandpass', 900, 0.07, 0.18, 0, 1.5);
export const hit = () => { hiss('lowpass', 1200, 0.08, 0.35); tone('square', 180, 90, 0.08, 0.15); };
export const cue = () => tone('triangle', 1400, 1800, 0.06, 0.12);
export const blackFlash = () => {
  hiss('lowpass', 2500, 0.35, 0.6);
  tone('sawtooth', 120, 40, 0.4, 0.35);
  tone('square', 1800, 600, 0.25, 0.12, 0.02);
};
export const shock = () => { tone('sine', 300, 60, 0.3, 0.35); hiss('bandpass', 600, 0.25, 0.3, 0, 2); };
export const enemyDie = () => { tone('square', 400, 80, 0.25, 0.15); hiss('lowpass', 900, 0.25, 0.25); };
export const hurt = () => { tone('sawtooth', 300, 120, 0.2, 0.2); hiss('lowpass', 800, 0.12, 0.25); };
export const die = () => { tone('square', 500, 60, 0.7, 0.2); };
export const pickup = () => { tone('triangle', 880, 880, 0.08, 0.18); tone('triangle', 1320, 1320, 0.14, 0.18, 0.08); };
export const heart = () => { tone('sine', 520, 520, 0.1, 0.2); tone('sine', 780, 780, 0.16, 0.2, 0.1); };
export const checkpoint = () => [392, 523, 659].forEach((f, i) => tone('triangle', f, f, 0.2, 0.15, i * 0.09));
export const clear = () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone('square', f, f, 0.16, 0.1, i * 0.12));
export const gameOver = () => [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, f, 0.35, 0.18, i * 0.25));
export const select = () => tone('square', 660, 990, 0.08, 0.1);
