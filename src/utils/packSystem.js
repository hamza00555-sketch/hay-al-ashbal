import { STORE_ITEMS } from './storeData';

export const PACK_DEFS = {
  basic: {
    id: 'basic',
    name: 'باكس الحي',
    subtitle: 'شخصية شائعة عشوائية',
    desc: 'يعطيك شخصية شائعة عشوائية حصرية.',
    price: 150,
    image: '/packs/pack-basic.webp',
    rarities: ['common'],
    weights:  [100],
  },
  legendary: {
    id: 'legendary',
    name: 'باكس الأسطورة',
    subtitle: 'أسطوري مضمون في الرابع',
    desc: 'شخصية أسطورية حصرية. كل 4 باكسات تضمن واحدة!',
    prices: [100, 200, 400, 0],
    image: '/packs/pack-legendary.webp',
    rarities:    ['legendary'],
    weights:     [100],
    pityWeights: [100],
  },
};

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getLegendaryInfo(packs = {}) {
  const mk = monthKey();
  const purchases = packs.month === mk ? (packs.legendary ?? 0) : 0;
  const posInCycle = purchases % 4; // 0-2 normal, 3 = pity
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

export function openPack(packId, profile) {
  const pack = PACK_DEFS[packId];
  const owned = profile.inventory ?? [];
  const packs = profile.packs ?? {};

  let weights = pack.weights;
  let newPacksState = { ...packs };

  if (packId === 'legendary') {
    const { isPity } = getLegendaryInfo(packs);
    if (isPity) weights = pack.pityWeights;
    const mk = monthKey();
    const prev = packs.month === mk ? (packs.legendary ?? 0) : 0;
    newPacksState = { ...packs, month: mk, legendary: prev + 1 };
  }

  const rarity = weightedPick(pack.rarities, weights);
  const pool = STORE_ITEMS.filter(i => i.rarity === rarity);
  if (pool.length === 0) return null;

  const unowned = pool.filter(i => !owned.includes(i.id));
  const source = unowned.length > 0 ? unowned : pool;
  const item = source[Math.floor(Math.random() * source.length)];

  const isDuplicate = owned.includes(item.id);
  const compRates = { common: 0.2, rare: 0.3, epic: 0.4, legendary: 0.5 };
  const coinsCompensation = isDuplicate
    ? Math.round(item.price * (compRates[item.rarity] ?? 0.2))
    : 0;

  return { item, isDuplicate, coinsCompensation, newPacksState };
}
