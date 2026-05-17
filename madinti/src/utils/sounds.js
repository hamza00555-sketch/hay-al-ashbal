let ctx = null;
let musicNodes = [];
let musicGain = null;
let musicPlaying = false;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, type, duration, gainVal, delay = 0) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  g.gain.setValueAtTime(gainVal, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
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
  filter.frequency.value = 1500;
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  g.gain.setValueAtTime(gainVal, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
  src.start(c.currentTime + delay);
  src.stop(c.currentTime + delay + duration + 0.01);
}

export const SFX = {
  build() {
    noise(0.08, 0.2);
    playTone(200, 'sawtooth', 0.05, 0.15, 0.04);
    playTone(600, 'sine', 0.15, 0.12, 0.08);
  },
  demolish() {
    noise(0.3, 0.3);
    playTone(120, 'sawtooth', 0.25, 0.2, 0.05);
  },
  monthAdvance() {
    playTone(440, 'triangle', 0.1, 0.1);
    playTone(550, 'triangle', 0.12, 0.1, 0.1);
  },
  income() {
    playTone(880, 'sine', 0.08, 0.1);
    playTone(1100, 'sine', 0.1, 0.1, 0.08);
  },
  event() {
    playTone(220, 'square', 0.12, 0.12);
    playTone(440, 'square', 0.1, 0.1, 0.14);
    playTone(220, 'square', 0.15, 0.1, 0.26);
  },
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => playTone(f, 'triangle', 0.35, 0.2, i * 0.13));
    playTone(1568, 'sine', 0.5, 0.18, notes.length * 0.13);
  },
  lose() {
    playTone(440, 'sawtooth', 0.25, 0.25);
    playTone(330, 'sawtooth', 0.22, 0.25, 0.2);
    playTone(220, 'sawtooth', 0.3, 0.25, 0.4);
  },
  buttonClick() {
    playTone(600, 'sine', 0.06, 0.1);
  },
  rent() {
    playTone(660, 'sine', 0.1, 0.1);
  },
  sell() {
    playTone(780, 'sine', 0.08, 0.1);
    playTone(980, 'sine', 0.1, 0.1, 0.08);
  },
};

const SCALE = [261, 293, 330, 392, 440, 523, 587, 659];
const MELODY = [0, 2, 4, 2, 0, 4, 2, 0, 2, 4, 7, 4, 2];
const BASS   = [0, 0, 4, 4, 2, 2, 0, 0];

function scheduleMusic() {
  const c = getCtx();
  musicGain = c.createGain();
  musicGain.gain.value = 0.05;
  musicGain.connect(c.destination);

  const bpm = 60;
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
      g.gain.exponentialRampToValueAtTime(0.001, t + i * beat + beat * 0.8);
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
      g.gain.linearRampToValueAtTime(0.5, t + i * beat * 2 + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * beat * 2 + beat * 1.8);
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
