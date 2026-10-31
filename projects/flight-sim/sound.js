// Sounds made in code with the browser's audio system (no sound files):
// an engine sound that follows the throttle (jet hum or propeller buzz), wind that gets louder with speed, and an explosion.
let ctx = null, master = null, noise = null, engine = null, wind = null;
let muted = false;
let engineType = 'prop';   // 'prop' or 'jet'
const VOLUME = 0.5;

// Choose which engine sound to play
export function setEngine(type) { engineType = type; }

// Browsers only allow sound after a click, so this runs on the first click
export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : VOLUME;
  master.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  // Engine: a low buzzing tone plus filtered hiss.
  // For the propeller, a "throb" (the volume pulsing quickly) makes the typical prop-plane buzz.
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  const oscFilter = ctx.createBiquadFilter(); oscFilter.type = 'lowpass'; oscFilter.frequency.value = 400;
  const throb = ctx.createGain(); throb.gain.value = 0.6;
  const throbOsc = ctx.createOscillator(); throbOsc.type = 'sine'; throbOsc.frequency.value = 20;
  const throbDepth = ctx.createGain(); throbDepth.gain.value = 0;
  throbOsc.connect(throbDepth).connect(throb.gain);
  const hiss = ctx.createBufferSource(); hiss.buffer = noise; hiss.loop = true;
  const hissFilter = ctx.createBiquadFilter(); hissFilter.type = 'lowpass'; hissFilter.frequency.value = 600;
  const hissGain = ctx.createGain(); hissGain.gain.value = 1;
  const engineGain = ctx.createGain(); engineGain.gain.value = 0;
  osc.connect(oscFilter).connect(throb).connect(engineGain);
  hiss.connect(hissFilter).connect(hissGain).connect(engineGain);
  engineGain.connect(master);
  osc.start(); hiss.start(); throbOsc.start();
  engine = { osc, oscFilter, hissFilter, hissGain, gain: engineGain, throbOsc, throbDepth };

  // Wind: a separate hiss, brighter and louder as you go faster
  const air = ctx.createBufferSource(); air.buffer = noise; air.loop = true; air.playbackRate.value = 0.7;
  const airFilter = ctx.createBiquadFilter(); airFilter.type = 'bandpass'; airFilter.frequency.value = 500; airFilter.Q.value = 0.6;
  const airGain = ctx.createGain(); airGain.gain.value = 0;
  air.connect(airFilter).connect(airGain).connect(master);
  air.start();
  wind = { filter: airFilter, gain: airGain };
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : VOLUME;
  return muted;
}

// Called every frame. power: 0..1+ (throttle, more with boost). speed01: 0..1. on: false when paused/crashed.
export function updateFlightSound(power, speed01, on) {
  if (!ctx) return;
  const t = ctx.currentTime;
  engine.gain.gain.setTargetAtTime(on ? 0.05 + power * 0.06 : 0, t, 0.1);
  if (engineType === 'prop') {
    engine.osc.frequency.setTargetAtTime(38 + power * 30, t, 0.2);
    engine.oscFilter.frequency.setTargetAtTime(700, t, 0.2);
    engine.throbOsc.frequency.setTargetAtTime(14 + power * 16, t, 0.2);
    engine.throbDepth.gain.setTargetAtTime(0.4, t, 0.1);
    engine.hissFilter.frequency.setTargetAtTime(300 + power * 500, t, 0.2);
    engine.hissGain.gain.setTargetAtTime(0.35, t, 0.1);
  } else {
    engine.osc.frequency.setTargetAtTime(45 + power * 70, t, 0.2);
    engine.oscFilter.frequency.setTargetAtTime(400, t, 0.2);
    engine.throbDepth.gain.setTargetAtTime(0, t, 0.1);
    engine.hissFilter.frequency.setTargetAtTime(400 + power * 1400, t, 0.2);
    engine.hissGain.gain.setTargetAtTime(1, t, 0.1);
  }
  wind.gain.gain.setTargetAtTime(on ? 0.02 + speed01 * 0.12 : 0, t, 0.3);
  wind.filter.frequency.setTargetAtTime(300 + speed01 * 1500, t, 0.3);
}

// A short bright "ding-ding" when you fly through a ring. notes: list of frequencies played one after another.
export function playChime(notes = [880, 1320]) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  notes.forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const g = ctx.createGain();
    const s = t + i * 0.09;
    g.gain.setValueAtTime(0, s);
    g.gain.linearRampToValueAtTime(0.25, s + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, s + 0.35);
    o.connect(g).connect(master);
    o.start(s); o.stop(s + 0.4);
  });
}
// A happy rising tune when the whole course is done
export const playComplete = () => playChime([523, 659, 784, 1047]);

// A soft thump and tyre squeak when the wheels touch the runway
export function playTouchdown() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 3;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + 0.35);
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.4, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  o.connect(og).connect(master);
  o.start(t); o.stop(t + 0.3);
}

export function playExplosion() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 450;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + 1.7);
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.6);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  o.connect(og).connect(master);
  o.start(t); o.stop(t + 0.65);
}
