import { STORE_ITEMS } from './storeData';

export const PACK_DEFS = {
  basic: {
    id: 'basic',
    name: 'باكس الحي',
    subtitle: '٢ شخصية + ١ إطار',
    price: 150,
    image: '/packs/pack-basic.webp',
    avatarRarities: ['common', 'legendary'],
    avatarWeights:  [75, 25],
    frameRarities:  ['common', 'rare', 'legendary'],
    frameWeights:   [65, 30, 5],
    dropRates: [
      { label: 'شخصية', rates: [{ rarity: 'common', pct: 75 }, { rarity: 'legendary', pct: 25 }] },
      { label: 'إطار',  rates: [{ rarity: 'common', pct: 65 }, { rarity: 'rare', pct: 30 }, { rarity: 'legendary', pct: 5 }] },
    ],
  },
  legendary: {
    id: 'legendary',
    name: 'باكس الأسطورة',
    subtitle: '٢ شخصية + ١ إطار — الرابع مضمون أسطوري',
    prices: [100, 200, 400, 0],
    image: '/packs/pack-legendary.webp',
    avatarRarities:    ['common', 'legendary'],
    avatarWeights:     [15, 85],
    avatarPityWeights: [0, 100],
    frameRarities:  ['common', 'rare', 'legendary'],
    frameWeights:   [5, 55, 40],
    dropRates: [
      { label: 'شخصية', rates: [{ rarity: 'common', pct: 15 }, { rarity: 'legendary', pct: 85 }] },
      { label: 'إطار',  rates: [{ rarity: 'common', pct: 5 }, { rarity: 'rare', pct: 55 }, { rarity: 'legendary', pct: 40 }] },
    ],
  },
};

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getLegendaryInfo(packs = {}) {
  const mk = monthKey();
  const purchases = packs.month === mk ? (packs.legendary ?? 0) : 0;
  const posInCycle = purchases % 4;
  const isPity = posInCycle === 3;
  const price = isPity ? 0 : PACK_DEFS.legendary.prices[posInCycle];
  return { price, isPity, purchases, posInCycle };
}

function weightedPick(rarities, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < rarities.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return rarities[i];
  }
  return rarities[rarities.length - 1];
}

function drawItem(pool, owned) {
  if (pool.length === 0) return null;
  const unowned = pool.filter(i => !owned.includes(i.id));
  const source = unowned.length > 0 ? unowned : pool;
  const item = source[Math.floor(Math.random() * source.length)];
  const isDuplicate = owned.includes(item.id);
  return { item, isDuplicate };
}

// Returns { items: [av1, av2, frame], newPacksState }
// Each slot: { item, isDuplicate }
export function openPack(packId, profile) {
  const pack = PACK_DEFS[packId];
  const owned = profile.inventory ?? [];
  const packs = profile.packs ?? {};

  let avatarWeights = pack.avatarWeights;
  let newPacksState = { ...packs };

  if (packId === 'legendary') {
    const { isPity } = getLegendaryInfo(packs);
    if (isPity) avatarWeights = pack.avatarPityWeights;
    const mk = monthKey();
    const prev = packs.month === mk ? (packs.legendary ?? 0) : 0;
    newPacksState = { ...packs, month: mk, legendary: prev + 1 };
  }

  // Draw 2 avatars
  const avatarPool = (rarity) =>
    STORE_ITEMS.filter(i => i.type === 'avatar' && i.rarity === rarity);

  const av1Rarity = weightedPick(pack.avatarRarities, avatarWeights);
  const av1 = drawItem(avatarPool(av1Rarity), owned);

  // For 2nd avatar, exclude 1st if possible
  const ownedAfterAv1 = av1 && !av1.isDuplicate ? [...owned, av1.item.id] : owned;
  const av2Rarity = weightedPick(pack.avatarRarities, avatarWeights);
  const av2 = drawItem(avatarPool(av2Rarity), ownedAfterAv1);

  // Draw 1 frame
  const framePool = (rarity) =>
    STORE_ITEMS.filter(i => i.type === 'frame' && i.rarity === rarity);
  const frRarity = weightedPick(pack.frameRarities, pack.frameWeights);
  const fr = drawItem(framePool(frRarity), owned);

  const items = [av1, av2, fr].filter(Boolean);
  return { items, newPacksState };
}

// All store avatar IDs for AI random picks
export const STORE_AVATAR_IDS = STORE_ITEMS
  .filter(i => i.type === 'avatar')
  .map(i => i.cardImageId);
