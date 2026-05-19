// Professional Web Audio API sound engine
// Uses convolution reverb, multi-oscillator synthesis, FM, and chord-based music.

let _ctx = null;
let _rev = null;   // reverb convolver
let _dry = null;   // dry gain → compressor → destination
let _wet = null;   // wet gain (reverb out) → compressor → destination
let _comp = null;

function ctx() {
  if (_ctx && _ctx.state !== 'closed') {
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }
  _ctx  = new (window.AudioContext || window.webkitAudioContext)();
  _comp = _ctx.createDynamicsCompressor();
  _comp.threshold.value = -14;
  _comp.knee.value      = 20;
  _comp.ratio.value     = 4;
  _comp.attack.value    = 0.003;
  _comp.release.value   = 0.12;
  _comp.connect(_ctx.destination);

  // Convolution reverb — synthesised impulse response
  const len = _ctx.sampleRate * 1.8;
  const ir   = _ctx.createBuffer(2, len, _ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    }
  }
  _rev = _ctx.createConvolver();
  _rev.buffer = ir;

  _wet = _ctx.createGain(); _wet.gain.value = 0.22;
  _dry = _ctx.createGain(); _dry.gain.value = 0.78;
  _rev.connect(_wet);
  _wet.connect(_comp);
  _dry.connect(_comp);
  return _ctx;
}

// Route a node to both dry and wet paths
function out(node, wetAmt = 0.22) {
  const c = ctx();
  node.connect(_dry);
  const wg = c.createGain(); wg.gain.value = wetAmt;
  node.connect(_rev);
  return node;
}

// ── Primitive builders ────────────────────────────────────────────

function osc(freq, type, gainVal, startT, endT, options = {}) {
  const c  = ctx();
  const o  = c.createOscillator();
  const g  = c.createGain();
  o.type   = type;
  o.frequency.setValueAtTime(freq, startT);
  if (options.slide) o.frequency.exponentialRampToValueAtTime(options.slide, endT);
  if (options.detune) o.detune.value = options.detune;
  g.gain.setValueAtTime(0.0001, startT);
  g.gain.linearRampToValueAtTime(gainVal, startT + (options.attack || 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, endT);
  o.connect(g);
  out(g, options.wet ?? 0.28);
  o.start(startT);
  o.stop(endT + 0.05);
  return o;
}

function noiseShot(duration, gainVal, startT, loFreq = 800, hiFreq = 5000) {
  const c = ctx();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const bp  = c.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.value = (loFreq + hiFreq) / 2;
  bp.Q.value = 0.6;
  const g   = c.createGain();
  g.gain.setValueAtTime(gainVal, startT);
  g.gain.exponentialRampToValueAtTime(0.0001, startT + duration);
  src.connect(bp); bp.connect(g); out(g, 0.15);
  src.start(startT); src.stop(startT + duration + 0.05);
}

function multiOsc(freqs, type, gainVal, startT, endT, attack = 0.01) {
  freqs.forEach((f, i) => osc(f, type, gainVal / freqs.length,
    startT, endT, { attack, detune: [-6, 0, 6][i % 3] ?? 0, wet: 0.35 }));
}

function chord(rootFreq, semis, type, gainVal, startT, dur, attack = 0.02) {
  semis.forEach(s => {
    const freq = rootFreq * Math.pow(2, s / 12);
    osc(freq, type, gainVal / semis.length, startT, startT + dur, { attack, wet: 0.4 });
  });
}

function sweep(startFreq, endFreq, type, gainVal, startT, dur) {
  osc(startFreq, type, gainVal, startT, startT + dur, { slide: endFreq });
}

// ── Cooldown helper ──────────────────────────────────────────────
const _cd = {};
function cd(name, ms, fn) {
  if (_cd[name]) return;
  fn();
  _cd[name] = true;
  setTimeout(() => { delete _cd[name]; }, ms);
}

function safe(fn) {
  try { fn(ctx().currentTime); } catch(e) { console.warn('[sfx]', e); }
}

// ── SFX ──────────────────────────────────────────────────────────
export const SFX = {

  cardSelect() { safe(t => {
    osc(659, 'triangle', 0.14, t,        t+0.10, { attack:0.001, wet:0.2 });
    osc(988, 'sine',     0.10, t+0.055,  t+0.14, { attack:0.001, wet:0.2 });
  }); },

  cardPlay() { safe(t => {
    noiseShot(0.10, 0.30, t, 400, 3500);
    sweep(180, 90, 'sine', 0.28, t+0.03, 0.18);
  }); },

  cardFlip() { safe(t => {
    noiseShot(0.12, 0.25, t, 1200, 8000);
    osc(880, 'sine', 0.08, t+0.05, t+0.13, { attack:0.001, wet:0.3 });
  }); },

  cardDraw() { safe(t => {
    noiseShot(0.08, 0.22, t, 600, 4000);
    osc(392, 'triangle', 0.10, t+0.02, t+0.10, { attack:0.003, wet:0.25 });
  }); },

  eliminate() { safe(t => {
    // Rising noise → hard impact → pitch crash
    noiseShot(0.08, 0.35, t, 200, 3000);
    sweep(160, 40, 'sawtooth', 0.35, t+0.05, 0.40);
    sweep(120, 30, 'sawtooth', 0.28, t+0.14, 0.35);
    osc(60,  'sine', 0.30, t+0.08, t+0.50, { attack:0.005, wet:0.4 });
    noiseShot(0.25, 0.18, t+0.06, 100, 800);
  }); },

  win() { safe(t => {
    // Ascending arpeggio + harmony + sparkle
    const root = 261.63;
    [[0,4,7], [4,7,12], [7,12,16]].forEach(([a,b,c], i) => {
      const st = t + i * 0.28;
      chord(root, [a, b, c], 'triangle', 0.22, st, 0.55, 0.015);
    });
    // Sparkle hits
    [0, 0.32, 0.62, 0.90].forEach((d, i) => {
      osc(1047 * Math.pow(1.5, i % 3), 'sine', 0.09, t+d, t+d+0.18, { attack:0.001, wet:0.5 });
    });
  }); },

  aiThink() { safe(t => {
    [0, 0.22, 0.44].forEach((d, i) => {
      osc([349, 440, 523][i], 'sine', 0.07, t+d, t+d+0.12, { attack:0.01, wet:0.3 });
    });
  }); },

  buttonClick() { cd('btn', 50, () => safe(t => {
    osc(880, 'triangle', 0.09, t, t+0.06, { attack:0.001, wet:0.1 });
  })); },

  panelPop() { safe(t => {
    noiseShot(0.04, 0.18, t, 1500, 6000);
    osc(1100, 'sine', 0.09, t, t+0.07, { attack:0.001, wet:0.2 });
    osc(1400, 'sine', 0.06, t+0.03, t+0.09, { attack:0.001, wet:0.2 });
  }); },

  confirmOk() { safe(t => {
    osc(523, 'triangle', 0.12, t,       t+0.12, { attack:0.005, wet:0.25 });
    osc(659, 'sine',     0.10, t+0.07,  t+0.18, { attack:0.005, wet:0.25 });
    osc(784, 'sine',     0.07, t+0.14,  t+0.22, { attack:0.005, wet:0.3  });
  }); },

  turnHuman() { safe(t => {
    chord(440, [0, 4, 7], 'triangle', 0.18, t,      0.22, 0.01);
    chord(523, [0, 4, 7], 'triangle', 0.14, t+0.16, 0.28, 0.01);
  }); },

  turnAI() { safe(t => {
    noiseShot(0.06, 0.12, t, 800, 3000);
    osc(330, 'sine', 0.08, t+0.02, t+0.12, { attack:0.01, wet:0.35 });
  }); },

  compareReveal() { safe(t => {
    // Tension build
    noiseShot(0.06, 0.28, t, 300, 2500);
    chord(196, [0, 6, 10], 'sawtooth', 0.20, t, 0.30, 0.01); // diminished-ish
    sweep(260, 180, 'sawtooth', 0.18, t+0.12, 0.28);
    noiseShot(0.08, 0.22, t+0.22, 200, 1800);
  }); },

  protectionFlash() { safe(t => {
    // Magic shield chord shimmer
    chord(523, [0, 4, 7, 12], 'sine', 0.22, t,      0.45, 0.02);
    chord(659, [0, 4, 7],     'sine', 0.16, t+0.08, 0.40, 0.02);
    // Shimmer overtones
    [0, 0.05, 0.11, 0.18].forEach((d, i) => {
      osc(2093 * [1, 1.25, 1.5, 2][i], 'sine', 0.05, t+d, t+d+0.22, { attack:0.002, wet:0.55 });
    });
  }); },

  swapVisual() { safe(t => {
    // Ascending sweep + descending sweep simultaneously
    sweep(261, 523, 'triangle', 0.12, t,      0.28);
    sweep(523, 261, 'triangle', 0.12, t,      0.28);
    osc(392, 'sine', 0.10, t+0.12, t+0.32, { attack:0.02, wet:0.35 });
    noiseShot(0.06, 0.12, t+0.05, 1000, 5000);
  }); },

  forceDiscard() { safe(t => {
    noiseShot(0.10, 0.28, t, 400, 3000);
    sweep(220, 110, 'triangle', 0.20, t+0.03, 0.25);
    sweep(160, 80,  'sawtooth', 0.15, t+0.14, 0.22);
  }); },

  correctGuess() { safe(t => {
    // Triumphant ascending fanfare
    chord(523, [0, 4, 7],  'triangle', 0.22, t,      0.30, 0.01);
    chord(659, [0, 4, 7],  'triangle', 0.20, t+0.20, 0.35, 0.01);
    chord(784, [0, 4, 7, 12], 'sine', 0.18, t+0.40, 0.50, 0.01);
    // Sparkle
    [0.1, 0.25, 0.42, 0.55].forEach((d, i) => {
      osc([1047,1319,1568,2093][i], 'sine', 0.07, t+d, t+d+0.20, { attack:0.001, wet:0.55 });
    });
    noiseShot(0.05, 0.20, t, 3000, 8000);
  }); },

  wrongGuess() { safe(t => {
    sweep(330, 220, 'triangle', 0.14, t,       0.20);
    sweep(220, 150, 'sawtooth', 0.12, t+0.10,  0.22);
    osc(110, 'sine', 0.10, t+0.08, t+0.38, { attack:0.02, wet:0.3 });
  }); },

  secretView() { safe(t => {
    // Mysterious ascending shimmer
    [0, 0.08, 0.17, 0.26].forEach((d, i) => {
      const freq = 880 * Math.pow(1.25, i);
      osc(freq, 'sine', 0.08, t+d, t+d+0.25, { attack:0.005, wet:0.55 });
    });
    noiseShot(0.06, 0.08, t+0.05, 3000, 9000);
  }); },

  errorInvalid() { cd('error', 300, () => safe(t => {
    sweep(220, 185, 'sawtooth', 0.14, t,      0.10);
    sweep(185, 155, 'sawtooth', 0.12, t+0.07, 0.10);
    noiseShot(0.06, 0.10, t+0.02, 100, 600);
  })); },
};

// ── Background music ──────────────────────────────────────────────
// Two-layer: melody (pentatonic) + bass + soft percussion

// C pentatonic major: C D E G A (and octave up)
const PEN = [261.63, 293.66, 329.63, 392.00, 440.00,
             523.25, 587.33, 659.25, 783.99, 880.00];

// 8-bar melody pattern (indices into PEN, null = rest)
const MELODY = [4,3,2,null,4,4,3,null, 6,5,4,null,6,6,5,null,
                4,3,2,3,4,null,3,null, 2,1,0,null,2,2,1,null];

// Bass (root on beat 1, fifth on beat 3)
const BASS_ROOTS = [0, 0, 3, 3, 0, 0, 3, 5]; // indices into PEN / 2 octave

// Chord pads every 4 beats
const PADS = [
  [0, 4, 7],        // C major
  [0, 4, 7],
  [5, 9, 14],       // G major (using PEN freqs)
  [3, 7, 10],       // A minor
  [0, 4, 7],
  [0, 4, 7],
  [3, 7, 10],
  [5, 9, 12],
];

let _musicPlaying = false;
let _musicTimer   = null;

function scheduleLoop(startT) {
  if (!_musicPlaying) return;
  const c    = ctx();
  const bpm  = 88;
  const beat = 60 / bpm;
  const step = beat / 2; // 8th notes

  // Melody
  MELODY.forEach((idx, i) => {
    if (idx === null) return;
    const t = startT + i * step;
    const f = PEN[idx];
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.75);
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    o.connect(g); g.connect(_dry);
    o.start(t); o.stop(t + step);
  });

  // Bass (quarter notes, two per bar)
  BASS_ROOTS.forEach((ri, i) => {
    const t = startT + i * beat * 2;
    const f = PEN[ri] / 2; // one octave down
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 1.4);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(_dry);
    o.start(t); o.stop(t + beat * 2);

    // Fifth (power chord feel)
    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.0001, t + beat);
    g2.gain.linearRampToValueAtTime(0.07, t + beat + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + beat * 2);
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 1.5;
    o2.connect(g2); g2.connect(_dry);
    o2.start(t + beat); o2.stop(t + beat * 2);
  });

  // Chord pads (every 4 beats = every 2 bass notes)
  const padRoot = 261.63;
  PADS.forEach((semis, i) => {
    const t   = startT + i * beat * 4;
    const dur = beat * 3.5;
    semis.forEach(s => {
      const f  = padRoot * Math.pow(2, s / 12);
      const g  = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.08);
      g.gain.setValueAtTime(0.04, t + dur - 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const o  = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      o.connect(g); g.connect(_wet); // pads go heavy reverb
      o.start(t); o.stop(t + dur + 0.05);
    });
  });

  // Soft hi-hat on every beat
  for (let i = 0; i < MELODY.length; i++) {
    const t = startT + i * step;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.04), c.sampleRate);
    const dat = buf.getChannelData(0);
    for (let j = 0; j < dat.length; j++) dat[j] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const bp  = c.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 7000;
    const g   = c.createGain();
    g.gain.setValueAtTime(i % 4 === 0 ? 0.06 : 0.03, t); // accent on beat
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(bp); bp.connect(g); g.connect(_dry);
    src.start(t); src.stop(t + 0.05);
  }

  // Kick on beat 1 of every 2-bar group
  for (let bar = 0; bar < 4; bar++) {
    const t = startT + bar * beat * 4;
    const kg = c.createGain();
    kg.gain.setValueAtTime(0.22, t);
    kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    const ko = c.createOscillator(); ko.type = 'sine';
    ko.frequency.setValueAtTime(140, t);
    ko.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    ko.connect(kg); kg.connect(_dry);
    ko.start(t); ko.stop(t + 0.30);
  }

  const loopDur = MELODY.length * step;
  _musicTimer = setTimeout(() => scheduleLoop(startT + loopDur), (loopDur - 0.5) * 1000);
}

export function startMusic() {
  if (_musicPlaying) return;
  _musicPlaying = true;
  stopMenuMusic(); // never overlap with menu music
  try {
    const c = ctx();
    scheduleLoop(c.currentTime + 0.1);
  } catch(e) { console.warn('[music]', e); }
}

export function stopMusic() {
  _musicPlaying = false;
  if (_musicTimer) { clearTimeout(_musicTimer); _musicTimer = null; }
}

export function isMusicPlaying() { return _musicPlaying; }

// ── Menu / lobby music (slower, warmer, no drums) ─────────────────
// Uses Hijaz-ish scale: C Db E F G Ab Bb  →  warm Arabic flavour
const HIJ = [261.63, 277.18, 329.63, 349.23, 392.00, 415.30, 466.16, 523.25];
const MENU_MEL  = [4,3,2,null,3,4,null,6, 5,4,3,null,4,null,3,2, 2,1,0,null,1,2,null,4, 3,2,1,null,0,null,null,null];
const MENU_BASS = [0,0,4,4,0,0,3,3];
const MENU_PAD_SEQ = [[0,4,7],[3,7,10],[0,4,7],[5,9,12],[0,4,7],[3,7,10],[0,4,7],[4,7,11]];

let _menuPlaying = false;
let _menuTimer   = null;

function scheduleMenuLoop(startT) {
  if (!_menuPlaying) return;
  const c    = ctx();
  const bpm  = 62;
  const beat = 60 / bpm;
  const step = beat / 2;

  // Melody (warm triangle, more reverb)
  MENU_MEL.forEach((idx, i) => {
    if (idx === null) return;
    const t = startT + i * step;
    const f = HIJ[idx % HIJ.length];
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.2);
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    o.connect(g); g.connect(_wet);
    o.start(t); o.stop(t + step * 1.4);
  });

  // Sustained bass (sine, very soft)
  MENU_BASS.forEach((ri, i) => {
    const t = startT + i * beat * 2;
    const f = HIJ[ri % HIJ.length] / 2;
    const dur = beat * 2.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.10);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(_dry);
    o.start(t); o.stop(t + dur + 0.05);
  });

  // Lush pad chords (every 4 beats, heavy reverb)
  const padRoot = 261.63;
  MENU_PAD_SEQ.forEach((semis, i) => {
    const t   = startT + i * beat * 4;
    const dur = beat * 5;
    semis.forEach(s => {
      const f = padRoot * Math.pow(2, s / 12);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.25);
      g.gain.setValueAtTime(0.03, t + dur - 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(_wet);
      o.start(t); o.stop(t + dur + 0.1);
    });
  });

  const loopDur = MENU_MEL.length * step;
  _menuTimer = setTimeout(() => scheduleMenuLoop(startT + loopDur), (loopDur - 0.6) * 1000);
}

export function startMenuMusic() {
  if (_menuPlaying) return;
  _menuPlaying = true;
  stopMusic(); // never overlap with game music
  try { scheduleMenuLoop(ctx().currentTime + 0.15); } catch(e) { console.warn('[menu-music]', e); }
}

export function stopMenuMusic() {
  _menuPlaying = false;
  if (_menuTimer) { clearTimeout(_menuTimer); _menuTimer = null; }
}

export function isMenuMusicPlaying() { return _menuPlaying; }

export function haptic(pattern = [10]) {
  navigator.vibrate?.(pattern);
}
