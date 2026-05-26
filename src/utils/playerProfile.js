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
  frameShape:   'circle',
  frameColor:   '#60b8ff',
  frameImageId: null,
  coins:        0,
  inventory:    [],
  packs:        {},
};

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

// Store avatar IDs for AI random picks (imported lazily to avoid circular dep)
const STORE_IDS = [
  'c01','c02','c03','c04','c05','c06','c07','c08','c09','c10','c11','c12','c13','c14','c15',
  'l01','l02','l03','l04','l05','l06','l07','l08','l09','l10','l11','l12','l13','l14','l15','l16',
];

const AI_COLORS = ['#ff9944', '#bb77ff', '#ff7777'];

export function getAIProfile(aiIndex) {
  // Random store avatar every call — changes each game for marketing visibility
  const cardImageId = STORE_IDS[Math.floor(Math.random() * STORE_IDS.length)];
  return { cardImageId, frameShape: 'circle', frameColor: AI_COLORS[aiIndex % AI_COLORS.length] };
}
