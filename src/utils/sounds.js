// Professional Web Audio API sound engine
// Uses convolution reverb, multi-oscillator synthesis, FM, and chord-based music.

let _ctx = null;
let _rev = null;   // reverb convolver
let _dry = null;   // dry gain → compressor → destination
let _wet = null;   // wet gain (reverb out) → compressor → destination
let _comp = null;

// ── Persistent volume state ───────────────────────────────────────
let _musicVol = parseFloat(localStorage.getItem('v_music') ?? '1.0');
let _sfxVol   = parseFloat(localStorage.getItem('v_sfx')   ?? '1.0');

export function getMusicVol() { return _musicVol; }
export function getSFXVol()   { return _sfxVol;   }

export function setMusicVol(v) {
  _musicVol = Math.max(0, Math.min(1, v));
  localStorage.setItem('v_music', _musicVol);
  if (_gameGain) _gameGain.gain.value = 0.60 * _musicVol;
  if (_menuGain) _menuGain.gain.value = 0.55 * _musicVol;
}

export function setSFXVol(v) {
  _sfxVol = Math.max(0, Math.min(1, v));
  localStorage.setItem('v_sfx', _sfxVol);
  if (_dry) _dry.gain.value = 0.78 * _sfxVol;
  if (_wet) _wet.gain.value = 0.22 * _sfxVol;
}

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

  _wet = _ctx.createGain(); _wet.gain.value = 0.22 * _sfxVol;
  _dry = _ctx.createGain(); _dry.gain.value = 0.78 * _sfxVol;
  _rev.connect(_wet);
  _wet.connect(_comp);
  _dry.connect(_comp);
  return _ctx;
}

// ── Pause audio when tab is hidden, resume when visible ──────────
document.addEventListener('visibilitychange', () => {
  if (!_ctx) return;
  if (document.hidden) {
    _ctx.suspend().catch(() => {});
  } else {
    _ctx.resume().catch(() => {});
  }
});

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

  coinTick() { cd('tick', 35, () => safe(t => {
    osc(1760, 'sine', 0.055, t, t + 0.055, { attack: 0.001, wet: 0.08 });
  })); },

  coinBurst() { safe(t => {
    chord(1047, [0, 4, 7, 12], 'sine', 0.18, t, 0.55, 0.005);
    [0, 0.10, 0.22].forEach((d, i) => {
      osc(1047 * [1, 1.5, 2][i], 'sine', 0.07, t + d, t + d + 0.22, { attack: 0.001, wet: 0.55 });
    });
  }); },
};

// ── Background music (MP3 files) ─────────────────────────────────

let _gameBuffer = null;
let _menuBuffer = null;

async function loadBuffer(url) {
  const c   = ctx();
  const res = await fetch(url);
  const ab  = await res.arrayBuffer();
  return c.decodeAudioData(ab);
}

// ── Menu music ────────────────────────────────────────────────────

let _menuPlaying = false;
let _menuSource  = null;
let _menuGain    = null;

function _stopMenuMusicFade(fadeMs, cb) {
  _menuPlaying = false;

  const doStop = () => {
    if (_menuSource) { try { _menuSource.stop(); } catch(_) {} _menuSource = null; }
    if (_menuGain)   { try { _menuGain.disconnect(); } catch(_) {} _menuGain = null; }
    cb?.();
  };

  if (_menuGain && _ctx && fadeMs > 0) {
    const t = _ctx.currentTime;
    _menuGain.gain.setValueAtTime(_menuGain.gain.value, t);
    _menuGain.gain.linearRampToValueAtTime(0.0001, t + fadeMs / 1000);
    setTimeout(doStop, fadeMs + 80);
  } else {
    doStop();
  }
}

export async function startMenuMusic() {
  if (_menuPlaying) return;
  _menuPlaying = true;
  stopMusic();
  try {
    const c   = ctx();
    const buf = _menuBuffer || await loadBuffer('/music-menu.mp3');
    _menuBuffer = buf;
    if (!_menuPlaying) return;

    _menuGain = c.createGain();
    _menuGain.gain.setValueAtTime(0.0001, c.currentTime);
    _menuGain.gain.linearRampToValueAtTime(0.55 * _musicVol, c.currentTime + 1.8);
    _menuGain.connect(_comp);

    _menuSource = c.createBufferSource();
    _menuSource.buffer = buf;
    _menuSource.loop = true;
    _menuSource.connect(_menuGain);
    _menuSource.start();
  } catch(e) {
    console.warn('[menu-music]', e);
    _menuPlaying = false; // allow retry after user gesture
  }
}

export function stopMenuMusic() { _stopMenuMusicFade(0); }
export function isMenuMusicPlaying() { return _menuPlaying; }

// ── Game music ────────────────────────────────────────────────────

let _musicPlaying = false;
let _gameSource   = null;
let _gameGain     = null;

export function startMusic() {
  if (_musicPlaying) return;
  _musicPlaying = true;
  _stopMenuMusicFade(750, async () => {
    if (!_musicPlaying) return;
    try {
      const c   = ctx();
      const buf = _gameBuffer || await loadBuffer('/music-game.mp3');
      _gameBuffer = buf;
      if (!_musicPlaying) return;

      _gameGain = c.createGain();
      _gameGain.gain.setValueAtTime(0.0001, c.currentTime);
      _gameGain.gain.linearRampToValueAtTime(0.60 * _musicVol, c.currentTime + 1.5);
      _gameGain.connect(_comp);

      _gameSource = c.createBufferSource();
      _gameSource.buffer = buf;
      _gameSource.loop = true;
      _gameSource.connect(_gameGain);
      _gameSource.start();
    } catch(e) { console.warn('[music]', e); }
  });
}

export function stopMusic() {
  _musicPlaying = false;
  if (_gameSource) { try { _gameSource.stop(); } catch(_) {} _gameSource = null; }
  if (_gameGain)   { try { _gameGain.disconnect(); } catch(_) {} _gameGain = null; }
}

export function isMusicPlaying() { return _musicPlaying; }

export function haptic(pattern = [10]) {
  navigator.vibrate?.(pattern);
}
