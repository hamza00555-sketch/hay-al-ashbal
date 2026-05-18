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
  cardImageId: '1',
  frameShape:  'circle',
  frameColor:  '#60b8ff',
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

const AI_PROFILES = [
  { cardImageId: '3',  frameShape: 'circle',  frameColor: '#ff9944' }, // خالد
  { cardImageId: '5',  frameShape: 'rounded', frameColor: '#bb77ff' }, // سارة
  { cardImageId: '7',  frameShape: 'circle',  frameColor: '#ff7777' }, // علي
];

export function getAIProfile(aiIndex) {
  return AI_PROFILES[aiIndex % AI_PROFILES.length];
}
