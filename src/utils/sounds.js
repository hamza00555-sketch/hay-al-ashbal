// ── Lazy Tone.js initialisation ───────────────────────────────────
// Instruments are created on first use (after a user gesture).
// If Tone.js fails for any reason the game still works — sound is skipped.

let T   = null; // Tone namespace
let I   = null; // instrument cache

async function init() {
  if (I) return I;
  try {
    if (!T) T = await import('tone');
    await T.start();

    const limiter  = new T.Limiter(-1).toDestination();
    const comp     = new T.Compressor({ threshold: -14, ratio: 4, attack: 0.003, release: 0.18 }).connect(limiter);
    const revS     = new T.Reverb({ decay: 0.4, preDelay: 0.01 }).connect(comp);
    revS.wet.value = 0.14;
    const revM     = new T.Reverb({ decay: 1.3, preDelay: 0.02 }).connect(comp);
    revM.wet.value = 0.26;

    const cardNoise = new T.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.10, sustain: 0, release: 0.03 },
      volume: -8,
    }).connect(revS);

    const kick = new T.MembraneSynth({
      pitchDecay: 0.055, octaves: 8,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -6,
    }).connect(comp);

    const pluck = new T.PluckSynth({
      attackNoise: 0.5, dampening: 4000, resonance: 0.98, volume: -11,
    }).connect(revS);

    const chords = new T.PolySynth(T.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.25, release: 1.2 },
      volume: -10,
    }).connect(revM);

    const metal = new T.MetalSynth({
      frequency: 500,
      envelope: { attack: 0.001, decay: 0.28, release: 0.12 },
      harmonicity: 5.1, modulationIndex: 32,
      resonance: 3800, octaves: 1.5, volume: -13,
    }).connect(revS);

    const fmBass = new T.FMSynth({
      harmonicity: 0.5, modulationIndex: 10,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.6, sustain: 0, release: 0.4 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.35, sustain: 0, release: 0.3 },
      volume: -7,
    }).connect(revM);

    const ui = new T.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.03 },
      volume: -15,
    }).connect(revS);

    const amSynth = new T.AMSynth({
      harmonicity: 2.5,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.18, sustain: 0, release: 0.1 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 },
      volume: -14,
    }).connect(revS);

    I = { cardNoise, kick, pluck, chords, metal, fmBass, ui, amSynth };
  } catch (e) {
    console.warn('[sound] init failed:', e);
  }
  return I;
}

function play(fn) {
  init().then(inst => { if (inst) try { fn(inst, T.now()); } catch(e) { console.warn('[sound]', e); } });
}

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
  cardSelect()      { play(({ pluck },   n) => { pluck.triggerAttackRelease('E5', n); pluck.triggerAttackRelease('B5', n + 0.06); }); },
  cardPlay()        { play(({ cardNoise, kick }, n) => { cardNoise.triggerAttackRelease('16n', n); kick.triggerAttackRelease('C2', '8n', n + 0.04); }); },
  cardFlip()        { play(({ cardNoise, pluck }, n) => { cardNoise.triggerAttackRelease('8n', n); pluck.triggerAttackRelease('A4', n + 0.07); }); },
  cardDraw()        { play(({ cardNoise, ui }, n) => { cardNoise.triggerAttackRelease('16n', n); ui.triggerAttackRelease('F4', '32n', n + 0.03); }); },

  eliminate()       { play(({ kick, fmBass, metal }, n) => {
    kick.triggerAttackRelease('A1', '4n', n);
    fmBass.triggerAttackRelease('G2', '4n', n + 0.03);
    fmBass.triggerAttackRelease('D2', '4n', n + 0.25);
    metal.triggerAttackRelease('8n', n + 0.13);
  }); },

  win()             { play(({ chords, metal }, n) => {
    chords.triggerAttackRelease(['C4','E4','G4'], '4n', n);
    chords.triggerAttackRelease(['E4','G4','C5'], '4n', n + 0.32);
    chords.triggerAttackRelease(['G4','C5','E5'], '2n', n + 0.64);
    metal.triggerAttackRelease('8n', n + 0.78);
    metal.triggerAttackRelease('8n', n + 0.96);
  }); },

  aiThink()         { play(({ ui }, n) => { ui.triggerAttackRelease('D4','32n',n); ui.triggerAttackRelease('F4','32n',n+0.24); ui.triggerAttackRelease('A4','32n',n+0.48); }); },
  buttonClick()     { cd('btn', 50, () => play(({ pluck }, n) => pluck.triggerAttackRelease('C5', n))); },
  panelPop()        { play(({ cardNoise, pluck }, n) => { cardNoise.triggerAttackRelease('32n', n); pluck.triggerAttackRelease('G5', n + 0.02); }); },
  confirmOk()       { play(({ pluck }, n) => { pluck.triggerAttackRelease('E5', n); pluck.triggerAttackRelease('A5', n + 0.08); }); },

  turnHuman()       { play(({ ui }, n) => { ui.triggerAttackRelease('A4','16n',n); ui.triggerAttackRelease('C5','16n',n+0.11); ui.triggerAttackRelease('E5','16n',n+0.22); }); },
  turnAI()          { play(({ cardNoise, ui }, n) => { cardNoise.triggerAttackRelease('32n', n); ui.triggerAttackRelease('D4','32n', n + 0.04); }); },

  compareReveal()   { play(({ cardNoise, metal, kick }, n) => { cardNoise.triggerAttackRelease('8n',n); metal.triggerAttackRelease('8n',n+0.06); kick.triggerAttackRelease('D2','8n',n+0.15); }); },

  protectionFlash() { play(({ chords, metal }, n) => {
    chords.triggerAttackRelease(['C4','G4'], '4n', n);
    chords.triggerAttackRelease(['E4','B4'], '4n', n + 0.09);
    metal.triggerAttackRelease('8n', n + 0.06);
  }); },

  swapVisual()      { play(({ amSynth }, n) => { amSynth.triggerAttackRelease('G4','16n',n); amSynth.triggerAttackRelease('E4','16n',n+0.16); amSynth.triggerAttackRelease('C5','8n',n+0.32); }); },
  forceDiscard()    { play(({ cardNoise, kick, fmBass }, n) => { cardNoise.triggerAttackRelease('8n',n); kick.triggerAttackRelease('E2','8n',n+0.03); fmBass.triggerAttackRelease('B2','8n',n+0.19); }); },

  correctGuess()    { play(({ metal, chords, pluck }, n) => {
    metal.triggerAttackRelease('16n', n);
    chords.triggerAttackRelease(['E4','G4','B4'], '8n', n + 0.07);
    chords.triggerAttackRelease(['G4','B4','D5'], '4n', n + 0.25);
    pluck.triggerAttackRelease('E6', n + 0.21);
  }); },

  wrongGuess()      { play(({ fmBass }, n) => { fmBass.triggerAttackRelease('C3','8n',n); fmBass.triggerAttackRelease('A2','8n',n+0.14); }); },

  secretView()      { play(({ pluck, metal }, n) => {
    pluck.triggerAttackRelease('A5', n);
    pluck.triggerAttackRelease('C6', n + 0.09);
    pluck.triggerAttackRelease('E6', n + 0.18);
    metal.triggerAttackRelease('16n', n + 0.14);
  }); },

  errorInvalid()    { cd('error', 300, () => play(({ fmBass }, n) => { fmBass.triggerAttackRelease('G2','16n',n); fmBass.triggerAttackRelease('F2','16n',n+0.08); })); },
};

// ── Background music ──────────────────────────────────────────────
const NOTES    = ['C4','D4','E4','F4','G4','A4','B4','C5'];
const MEL_IDX  = [4,3,2,3,4,4,4,3,3,3,4,6,6];
const BASS_IDX = [0,0,2,2,4,4,2,0];
const melNotes  = MEL_IDX.map(i => NOTES[i % NOTES.length]);
const bassNotes = BASS_IDX.map(i => NOTES[i % NOTES.length].replace(/(\d+)/, m => String(parseInt(m) - 1)));

let melSeq   = null;
let bassSeq  = null;
let _musicOn = false;

export async function startMusic() {
  if (_musicOn) return;
  _musicOn = true;
  try {
    if (!T) T = await import('tone');
    await T.start();

    const melSynth = new T.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 },
      volume: -19,
    }).toDestination();

    const bassSynth = new T.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.5, sustain: 0, release: 0.5 },
      volume: -23,
    }).toDestination();

    T.Transport.bpm.value = 72;
    melSeq  = new T.Sequence((t, note) => melSynth.triggerAttackRelease(note, '8n', t),  melNotes,  '8n');
    bassSeq = new T.Sequence((t, note) => bassSynth.triggerAttackRelease(note, '4n', t), bassNotes, '4n');
    melSeq.start(0);
    bassSeq.start(0);
    T.Transport.start();
  } catch(e) {
    console.warn('[music] start failed:', e);
  }
}

export function stopMusic() {
  _musicOn = false;
  try {
    melSeq?.stop();  melSeq?.dispose();  melSeq  = null;
    bassSeq?.stop(); bassSeq?.dispose(); bassSeq = null;
    T?.Transport.stop();
  } catch(_) {}
}

export function isMusicPlaying() { return _musicOn; }

export function haptic(pattern = [10]) {
  navigator.vibrate?.(pattern);
}
