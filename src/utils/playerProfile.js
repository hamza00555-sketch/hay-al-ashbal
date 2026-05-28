const STORAGE_KEY = 'hay_ashbal_profile';

export const AVATAR_IMAGE_IDS = [
  '1', '1b', '1c', '1d', '1e', '2', '2b', '3', '3b', '4', '4b', '5', '5b', '6', '7', '8',
];

export const FRAME_SHAPES = [
  { id: 'circle',  label: 'دائرة' },
  { id: 'rounded', label: 'مستدير' },
  { id: 'hexagon', label: 'سداسي' },
];

export const FRAME_COLORS = [
  '#60b8ff', '#FFD700', '#ff7777', '#77ddaa', '#bb77ff', '#ff9944',
];

export const DEFAULT_PROFILE = {
  name:         '',
  cardImageId:  '1',
  frameShape:   'rounded',
  frameColor:   '#60b8ff',
  frameImageId: null,
  coins:        0,
  inventory:    [],
  packs:        {},
  turnSpeed:    'normal',  // 'slow' | 'normal' | 'fast'
};

// Multiplier applied to AI-turn auto-advance durations during play.
export const TURN_SPEED_FACTORS = { slow: 1.5, normal: 1, fast: 0.55 };

export function getTurnSpeedFactor() {
  const speed = loadProfile().turnSpeed ?? 'normal';
  return TURN_SPEED_FACTORS[speed] ?? 1;
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PROFILE };
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}

const AI_MALE_IDS = [
  'c04','c05','c06','c07','c09','c13',
  'l02','l05','l06','l08','l09','l13',
];
const AI_FEMALE_IDS = [
  'c01','c02','c03','c08','c10','c11','c12','c14','c15',
  'l01','l03','l04','l07','l10','l11','l12','l14','l15','l16',
];

const AI_COLORS = ['#ff9944', '#bb77ff', '#ff7777'];

// aiIndex 0=خالد(m), 1=سارة(f), 2=علي(m)
export function getAIProfile(aiIndex) {
  const pool = aiIndex === 1 ? AI_FEMALE_IDS : AI_MALE_IDS;
  const cardImageId = pool[Math.floor(Math.random() * pool.length)];
  return { cardImageId, frameShape: 'circle', frameColor: AI_COLORS[aiIndex % AI_COLORS.length] };
}
