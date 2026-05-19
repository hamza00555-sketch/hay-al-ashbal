import * as Tone from 'tone';

// Resume AudioContext after first user gesture (browser autoplay policy)
if (typeof document !== 'undefined') {
  const resume = () => Tone.start();
  document.addEventListener('click', resume, { once: true });
  document.addEventListener('touchstart', resume, { once: true, passive: true });
}

// ── Shared effects chain ──────────────────────────────────────────
const limiter  = new Tone.Limiter(-1).toDestination();
const comp     = new Tone.Compressor({ threshold: -14, ratio: 4, attack: 0.003, release: 0.18 }).connect(limiter);
const revShort = new Tone.Reverb({ decay: 0.4, wet: 0.14 }).connect(comp);
const revMed   = new Tone.Reverb({ decay: 1.3, wet: 0.26 }).connect(comp);

// ── Instruments ──────────────────────────────────────────────────

// Paper/card rustle
const cardNoise = new Tone.NoiseSynth({
  noise: { type: 'pink' },
  envelope: { attack: 0.001, decay: 0.10, sustain: 0, release: 0.03 },
  volume: -8,
}).connect(revShort);

// Kick/impact thump
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.055,
  octaves: 8,
  envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  volume: -6,
}).connect(comp);

// Plucked string pings — UI and card actions
const pluck = new Tone.PluckSynth({
  attackNoise: 0.5,
  dampening: 4000,
  resonance: 0.98,
  volume: -11,
}).connect(revShort);

// Lush chords — win and protection
const chords = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'triangle8' },
  envelope: { attack: 0.02, decay: 0.4, sustain: 0.25, release: 1.2 },
  volume: -10,
}).connect(revMed);

// Metal shimmer — reveals and gold accents
const metal = new Tone.MetalSynth({
  frequency: 500,
  envelope: { attack: 0.001, decay: 0.28, release: 0.12 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 3800,
  octaves: 1.5,
  volume: -13,
}).connect(revShort);

// FM bass drop — eliminations and ominous events
const fmBass = new Tone.FMSynth({
  harmonicity: 0.5,
  modulationIndex: 10,
  oscillator: { type: 'sawtooth' },
  envelope: { attack: 0.01, decay: 0.6, sustain: 0, release: 0.4 },
  modulation: { type: 'sine' },
  modulationEnvelope: { attack: 0.01, decay: 0.35, sustain: 0, release: 0.3 },
  volume: -7,
}).connect(revMed);

// Bright triangle — turn announcements and UI
const ui = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.03 },
  volume: -15,
}).connect(revShort);

// AM synth — swap/shuffle pulsing feel
const amSynth = new Tone.AMSynth({
  harmonicity: 2.5,
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.005, decay: 0.18, sustain: 0, release: 0.1 },
  modulation: { type: 'square' },
  modulationEnvelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 },
  volume: -14,
}).connect(revShort);

// ── Cooldown helper ──────────────────────────────────────────────
const _cd = {};
function cd(name, ms, fn) {
  if (_cd[name]) return;
  fn();
  _cd[name] = true;
  setTimeout(() => { delete _cd[name]; }, ms);
}

// ── SFX ──────────────────────────────────────────────────────────
export const SFX = {
  cardSelect() {
    const n = Tone.now();
    pluck.triggerAttackRelease('E5', n);
    pluck.triggerAttackRelease('B5', n + 0.06);
  },

  cardPlay() {
    const n = Tone.now();
    cardNoise.triggerAttackRelease('16n', n);
    kick.triggerAttackRelease('C2', '8n', n + 0.04);
  },

  cardFlip() {
    const n = Tone.now();
    cardNoise.triggerAttackRelease('8n', n);
    pluck.triggerAttackRelease('A4', n + 0.07);
  },

  cardDraw() {
    const n = Tone.now();
    cardNoise.triggerAttackRelease('16n', n);
    ui.triggerAttackRelease('F4', '32n', n + 0.03);
  },

  eliminate() {
    const n = Tone.now();
    kick.triggerAttackRelease('A1', '4n', n);
    fmBass.triggerAttackRelease('G2', '4n', n + 0.03);
    fmBass.triggerAttackRelease('D2', '4n', n + 0.25);
    metal.triggerAttackRelease('8n', n + 0.13);
  },

  win() {
    const n = Tone.now();
    chords.triggerAttackRelease(['C4', 'E4', 'G4'], '4n', n);
    chords.triggerAttackRelease(['E4', 'G4', 'C5'], '4n', n + 0.32);
    chords.triggerAttackRelease(['G4', 'C5', 'E5'], '2n', n + 0.64);
    metal.triggerAttackRelease('8n', n + 0.78);
    metal.triggerAttackRelease('8n', n + 0.96);
  },

  aiThink() {
    const n = Tone.now();
    ui.triggerAttackRelease('D4', '32n', n);
    ui.triggerAttackRelease('F4', '32n', n + 0.24);
    ui.triggerAttackRelease('A4', '32n', n + 0.48);
  },

  buttonClick() {
    cd('btn', 50, () => pluck.triggerAttackRelease('C5', Tone.now()));
  },

  panelPop() {
    const n = Tone.now();
    cardNoise.triggerAttackRelease('32n', n);
    pluck.triggerAttackRelease('G5', n + 0.02);
  },

  confirmOk() {
    const n = Tone.now();
    pluck.triggerAttackRelease('E5', n);
    pluck.triggerAttackRelease('A5', n + 0.08);
  },

  turnHuman() {
    const n = Tone.now();
    ui.triggerAttackRelease('A4', '16n', n);
    ui.triggerAttackRelease('C5', '16n', n + 0.11);
    ui.triggerAttackRelease('E5', '16n', n + 0.22);
  },

  turnAI() {
    const n = Tone.now();
    cardNoise.triggerAttackRelease('32n', n);
    ui.triggerAttackRelease('D4', '32n', n + 0.04);
  },

  compareReveal() {
    const n = Tone.now();
    cardNoise.triggerAttackRelease('8n', n);
    metal.triggerAttackRelease('8n', n + 0.06);
    kick.triggerAttackRelease('D2', '8n', n + 0.15);
  },

  protectionFlash() {
    const n = Tone.now();
    chords.triggerAttackRelease(['C4', 'G4'], '4n', n);
    chords.triggerAttackRelease(['E4', 'B4'], '4n', n + 0.09);
    metal.triggerAttackRelease('8n', n + 0.06);
  },

  swapVisual() {
    const n = Tone.now();
    amSynth.triggerAttackRelease('G4', '16n', n);
    amSynth.triggerAttackRelease('E4', '16n', n + 0.16);
    amSynth.triggerAttackRelease('C5', '8n',  n + 0.32);
  },

  forceDiscard() {
    const n = Tone.now();
    cardNoise.triggerAttackRelease('8n', n);
    kick.triggerAttackRelease('E2', '8n', n + 0.03);
    fmBass.triggerAttackRelease('B2', '8n', n + 0.19);
  },

  correctGuess() {
    const n = Tone.now();
    metal.triggerAttackRelease('16n', n);
    chords.triggerAttackRelease(['E4', 'G4', 'B4'], '8n', n + 0.07);
    chords.triggerAttackRelease(['G4', 'B4', 'D5'], '4n', n + 0.25);
    pluck.triggerAttackRelease('E6', n + 0.21);
  },

  wrongGuess() {
    const n = Tone.now();
    fmBass.triggerAttackRelease('C3', '8n', n);
    fmBass.triggerAttackRelease('A2', '8n', n + 0.14);
  },

  secretView() {
    const n = Tone.now();
    pluck.triggerAttackRelease('A5', n);
    pluck.triggerAttackRelease('C6', n + 0.09);
    pluck.triggerAttackRelease('E6', n + 0.18);
    metal.triggerAttackRelease('16n', n + 0.14);
  },

  errorInvalid() {
    cd('error', 300, () => {
      const n = Tone.now();
      fmBass.triggerAttackRelease('G2', '16n', n);
      fmBass.triggerAttackRelease('F2', '16n', n + 0.08);
    });
  },
};

// ── Background music (Tone.Transport + Sequence) ──────────────────
const NOTES    = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const MEL_IDX  = [4, 3, 2, 3, 4, 4, 4, 3, 3, 3, 4, 6, 6];
const BASS_IDX = [0, 0, 2, 2, 4, 4, 2, 0];

const melNotes  = MEL_IDX.map(i => NOTES[i % NOTES.length]);
const bassNotes = BASS_IDX.map(i => NOTES[i % NOTES.length].replace(/(\d+)/, m => String(parseInt(m) - 1)));

const melSynth = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 },
  volume: -19,
}).connect(revMed);

const bassSynth = new Tone.Synth({
  oscillator: { type: 'sine' },
  envelope: { attack: 0.02, decay: 0.5, sustain: 0, release: 0.5 },
  volume: -23,
}).connect(revMed);

let melSeq   = null;
let bassSeq  = null;
let _musicOn = false;

export function startMusic() {
  if (_musicOn) return;
  _musicOn = true;
  Tone.start();
  Tone.Transport.bpm.value = 72;
  melSeq  = new Tone.Sequence((t, note) => melSynth.triggerAttackRelease(note, '8n', t),  melNotes,  '8n');
  bassSeq = new Tone.Sequence((t, note) => bassSynth.triggerAttackRelease(note, '4n', t), bassNotes, '4n');
  melSeq.start(0);
  bassSeq.start(0);
  Tone.Transport.start();
}

export function stopMusic() {
  _musicOn = false;
  melSeq?.stop();  melSeq?.dispose();  melSeq  = null;
  bassSeq?.stop(); bassSeq?.dispose(); bassSeq = null;
  Tone.Transport.stop();
}

export function isMusicPlaying() { return _musicOn; }

export function haptic(pattern = [10]) {
  navigator.vibrate?.(pattern);
}
