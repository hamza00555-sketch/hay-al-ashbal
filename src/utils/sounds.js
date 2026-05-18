let ctx = null;
let musicNodes = [];
let musicGain = null;
let musicPlaying = false;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, type, duration, gainVal, delay = 0, fadeOut = true) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  g.gain.setValueAtTime(gainVal, c.currentTime + delay);
  if (fadeOut) g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration + 0.01);
}

function noise(duration, gainVal, delay = 0) {
  const c = getCtx();
  const bufSize = c.sampleRate * duration;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  g.gain.setValueAtTime(gainVal, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
  src.start(c.currentTime + delay);
  src.stop(c.currentTime + delay + duration + 0.01);
}

function pv(freq, pct = 0.03) { return freq * (1 + (Math.random() * 2 - 1) * pct); }

const _cd = {};
function cd(name, ms, fn) {
  if (_cd[name]) return;
  fn();
  _cd[name] = true;
  setTimeout(() => { delete _cd[name]; }, ms);
}

export const SFX = {
  cardSelect() {
    playTone(520, 'sine', 0.08, 0.15);
    playTone(780, 'sine', 0.06, 0.08, 0.04);
  },
  cardPlay() {
    noise(0.12, 0.25);
    playTone(220, 'triangle', 0.18, 0.2, 0.05);
  },
  cardFlip() {
    noise(0.15, 0.18);
    playTone(440, 'sine', 0.1, 0.1, 0.06);
    playTone(660, 'sine', 0.08, 0.07, 0.12);
  },
  cardDraw() {
    noise(0.1, 0.2);
    playTone(300, 'triangle', 0.12, 0.12, 0.03);
  },
  eliminate() {
    playTone(200, 'sawtooth', 0.3, 0.3);
    playTone(150, 'sawtooth', 0.25, 0.25, 0.1);
    playTone(100, 'sawtooth', 0.3, 0.2, 0.2);
    noise(0.35, 0.15, 0.05);
  },
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => playTone(f, 'triangle', 0.35, 0.22, i * 0.13));
    playTone(1568, 'sine', 0.5, 0.18, notes.length * 0.13);
  },
  aiThink() {
    playTone(380, 'sine', 0.07, 0.06);
    playTone(480, 'sine', 0.07, 0.05, 0.18);
  },
  buttonClick() {
    cd('btn', 40, () => playTone(pv(600), 'sine', 0.06, 0.10));
  },

  panelPop() {
    noise(0.06, 0.10);
    playTone(pv(900), 'sine', 0.05, 0.10);
    playTone(pv(1100), 'sine', 0.04, 0.07, 0.04);
  },

  confirmOk() {
    playTone(pv(520), 'triangle', 0.09, 0.12);
    playTone(pv(660), 'sine', 0.07, 0.09, 0.05);
  },

  turnHuman() {
    playTone(440, 'triangle', 0.14, 0.14);
    playTone(550, 'triangle', 0.12, 0.13, 0.09);
    playTone(660, 'sine',     0.10, 0.12, 0.18);
  },

  turnAI() {
    noise(0.09, 0.07);
    playTone(320, 'sine', 0.09, 0.07, 0.03);
  },

  compareReveal() {
    noise(0.07, 0.22);
    playTone(200, 'sawtooth', 0.10, 0.20, 0.03);
    noise(0.06, 0.18, 0.13);
    playTone(160, 'sawtooth', 0.09, 0.16, 0.17);
  },

  protectionFlash() {
    playTone(523, 'sine', 0.22, 0.14);
    playTone(659, 'sine', 0.20, 0.12, 0.05);
    playTone(784, 'sine', 0.18, 0.10, 0.10);
    noise(0.10, 0.07, 0.06);
  },

  swapVisual() {
    playTone(380, 'triangle', 0.14, 0.14);
    playTone(560, 'triangle', 0.12, 0.13, 0.09);
    playTone(480, 'sine',     0.10, 0.11, 0.18);
    noise(0.08, 0.07, 0.08);
  },

  forceDiscard() {
    noise(0.11, 0.22);
    playTone(260, 'triangle', 0.13, 0.18, 0.04);
    playTone(130, 'sawtooth', 0.10, 0.16, 0.13);
  },

  correctGuess() {
    noise(0.05, 0.16);
    playTone(440,  'triangle', 0.10, 0.20);
    playTone(659,  'sine',     0.12, 0.17, 0.07);
    playTone(880,  'sine',     0.10, 0.15, 0.14);
    playTone(1046, 'sine',     0.08, 0.13, 0.21);
  },

  wrongGuess() {
    playTone(440, 'triangle', 0.10, 0.09);
    playTone(330, 'triangle', 0.09, 0.08, 0.08);
    noise(0.06, 0.05, 0.04);
  },

  secretView() {
    playTone(880,  'sine', 0.14, 0.07);
    playTone(1100, 'sine', 0.12, 0.06, 0.07);
    playTone(1320, 'sine', 0.10, 0.05, 0.14);
    noise(0.07, 0.04, 0.04);
  },

  errorInvalid() {
    cd('error', 300, () => {
      playTone(200, 'sawtooth', 0.09, 0.13);
      playTone(185, 'sawtooth', 0.07, 0.11, 0.05);
    });
  },
};

// ── Background music ──────────────────────────────────────────────
const SCALE = [261, 293, 330, 349, 392, 440, 494, 523];
const MELODY = [4, 3, 2, 3, 4, 4, 4, 3, 3, 3, 4, 6, 6];
const BASS   = [0, 0, 2, 2, 4, 4, 2, 0];

function scheduleMusic() {
  const c = getCtx();
  musicGain = c.createGain();
  musicGain.gain.value = 0.07;
  musicGain.connect(c.destination);

  const bpm = 72;
  const beat = 60 / bpm;
  let t = c.currentTime + 0.1;

  function scheduleLoop() {
    if (!musicPlaying) return;

    MELODY.forEach((idx, i) => {
      const freq = SCALE[idx % SCALE.length];
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(musicGain);
      g.gain.setValueAtTime(0.001, t + i * beat);
      g.gain.linearRampToValueAtTime(1, t + i * beat + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * beat + beat * 0.85);
      osc.start(t + i * beat);
      osc.stop(t + i * beat + beat);
      musicNodes.push(osc);
    });

    BASS.forEach((idx, i) => {
      const freq = SCALE[idx] / 2;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(musicGain);
      g.gain.setValueAtTime(0.001, t + i * beat * 2);
      g.gain.linearRampToValueAtTime(0.6, t + i * beat * 2 + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * beat * 2 + beat * 1.6);
      osc.start(t + i * beat * 2);
      osc.stop(t + i * beat * 2 + beat * 2);
      musicNodes.push(osc);
    });

    const loopDuration = MELODY.length * beat;
    t += loopDuration;
    setTimeout(scheduleLoop, (loopDuration - 0.5) * 1000);
  }

  scheduleLoop();
}

export function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  scheduleMusic();
}

export function stopMusic() {
  musicPlaying = false;
  musicNodes.forEach(n => { try { n.stop(); } catch (_) {} });
  musicNodes = [];
  if (musicGain) { musicGain.disconnect(); musicGain = null; }
}

export function isMusicPlaying() { return musicPlaying; }

export function haptic(pattern = [10]) {
  navigator.vibrate?.(pattern);
}
