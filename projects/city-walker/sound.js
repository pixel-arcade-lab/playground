// Sound effects made with the browser's built-in audio system (the "Web Audio API").
// There are no sound files: every sound is created in code from noise and simple tones,
// so there is nothing to download and nothing to license.
let ctx = null;
let master = null;
let noise = null;
let muted = false;
const VOLUME = 0.7;

// Browsers only allow sound after the player clicks, so this is called on the first click.
export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : VOLUME;
  master.connect(ctx.destination);
  // One second of random "hiss", reused for footsteps, splashes, doors...
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : VOLUME;
  return muted;
}

const ready = () => ctx && !muted;
const vary = (v, amount = 0.15) => v * (1 + (Math.random() * 2 - 1) * amount);   // small random change, so sounds don't repeat exactly

// Volume shape: very quick rise, then fade out
function envelope(gainNode, t, peak, duration) {
  gainNode.gain.setValueAtTime(0.0001, t);
  gainNode.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.01, duration / 4));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
}

// A short burst of filtered hiss (good for steps, rustles, splashes)
function noiseBurst({ time = 0, duration = 0.08, type = 'bandpass', freq = 1000, freqEnd = null, q = 1, gain = 0.3 }) {
  const t = ctx.currentTime + time;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, t);
  if (freqEnd) filter.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  filter.Q.value = q;
  const g = ctx.createGain();
  envelope(g, t, gain, duration);
  src.connect(filter).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duration + 0.02);
}

// A short tone (good for thumps, bubbles, metal)
function tone({ time = 0, duration = 0.1, freq = 200, freqEnd = null, type = 'sine', gain = 0.2 }) {
  const t = ctx.currentTime + time;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  const g = ctx.createGain();
  envelope(g, t, gain, duration);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function bubble(time) {
  tone({ time, duration: 0.06, freq: vary(500, 0.4), freqEnd: vary(1200, 0.3), gain: 0.05 });
}

// One footstep. surface: 'stone', 'gravel', 'grass', 'wood', 'tatami' or 'water'
export function playStep(surface, running) {
  if (!ready()) return;
  const loud = running ? 1.3 : 1;
  switch (surface) {
    case 'stone':
      noiseBurst({ duration: 0.05, freq: vary(2200), q: 1.2, gain: 0.16 * loud });
      tone({ duration: 0.05, freq: vary(160), freqEnd: 90, gain: 0.12 * loud });
      break;
    case 'gravel':
      for (let i = 0; i < 4; i++) {
        noiseBurst({ time: i * 0.015 + Math.random() * 0.01, duration: 0.03, type: 'highpass', freq: vary(3000), q: 0.7, gain: 0.1 * loud });
      }
      break;
    case 'grass':
      noiseBurst({ duration: 0.09, type: 'lowpass', freq: vary(1200), q: 0.5, gain: 0.14 * loud });
      noiseBurst({ time: 0.03, duration: 0.06, type: 'highpass', freq: 4000, gain: 0.03 * loud });
      break;
    case 'wood':
      tone({ duration: 0.09, freq: vary(130), freqEnd: 75, gain: 0.28 * loud });
      noiseBurst({ duration: 0.04, freq: vary(700), q: 2, gain: 0.1 * loud });
      break;
    case 'tatami':
      noiseBurst({ duration: 0.07, type: 'lowpass', freq: vary(600), q: 0.7, gain: 0.16 * loud });
      break;
    case 'water':
      noiseBurst({ duration: 0.18, freq: vary(900), freqEnd: 2500, q: 1, gain: 0.18 * loud });
      bubble(0.04);
      bubble(0.09);
      break;
  }
}

export function playJump() {
  if (!ready()) return;
  noiseBurst({ duration: 0.15, freq: 500, freqEnd: 1400, q: 0.8, gain: 0.06 });
}

export function playLand(surface) {
  if (!ready()) return;
  if (surface === 'water') return playSplash();
  tone({ duration: 0.12, freq: 110, freqEnd: 55, gain: 0.25 });
  playStep(surface, true);
}

export function playSplash() {
  if (!ready()) return;
  noiseBurst({ duration: 0.45, freq: 600, freqEnd: 3000, q: 0.7, gain: 0.3 });
  for (let i = 0; i < 6; i++) bubble(0.05 + i * 0.05);
}

// Wooden sliding door: a soft slide, then a small knock when it stops
export function playDoor() {
  if (!ready()) return;
  noiseBurst({ duration: 0.4, freq: 350, freqEnd: 900, q: 1.5, gain: 0.15 });
  tone({ time: 0.38, duration: 0.12, freq: 140, freqEnd: 80, gain: 0.22 });
}

// Heavy iron gate: a metal clang that rings out
export function playGate() {
  if (!ready()) return;
  for (const [f, g] of [[180, 0.16], [431, 0.09], [877, 0.06], [1490, 0.035]]) {
    tone({ duration: 1.2, freq: vary(f, 0.02), type: 'triangle', gain: g });
  }
  noiseBurst({ duration: 0.08, type: 'highpass', freq: 2000, gain: 0.12 });
}
