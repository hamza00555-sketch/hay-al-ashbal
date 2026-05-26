export const RARITY_CONFIG = {
  common:    { label: 'شائع',   color: '#9E9E9E', bg: 'rgba(158,158,158,0.12)' },
  rare:      { label: 'نادر',   color: '#42A5F5', bg: 'rgba(66,165,245,0.12)' },
  epic:      { label: 'ملحمي', color: '#AB47BC', bg: 'rgba(171,71,188,0.12)' },
  legendary: { label: 'أسطوري', color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
};

export const STORE_ITEMS = [
  // ── Common Avatars — حصرية الباكسات (c01–c15) ──
  { id: 'av_c01', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ١',  cardImageId: 'c01' },
  { id: 'av_c02', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ٢',  cardImageId: 'c02' },
  { id: 'av_c03', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ٣',  cardImageId: 'c03' },
  { id: 'av_c04', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ٤',  cardImageId: 'c04' },
  { id: 'av_c05', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ٥',  cardImageId: 'c05' },
  { id: 'av_c06', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ٦',  cardImageId: 'c06' },
  { id: 'av_c07', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ٧',  cardImageId: 'c07' },
  { id: 'av_c08', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ٨',  cardImageId: 'c08' },
  { id: 'av_c09', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ٩',  cardImageId: 'c09' },
  { id: 'av_c10', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ١٠', cardImageId: 'c10' },
  { id: 'av_c11', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ١١', cardImageId: 'c11' },
  { id: 'av_c12', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ١٢', cardImageId: 'c12' },
  { id: 'av_c13', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ١٣', cardImageId: 'c13' },
  { id: 'av_c14', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ١٤', cardImageId: 'c14' },
  { id: 'av_c15', type: 'avatar', rarity: 'common', price: 350, name: 'شخصية شائعة ١٥', cardImageId: 'c15' },

  // ── Common Frames (fr_c1–fr_c4) ──
  { id: 'fr_c1', type: 'frame', rarity: 'common', price: 350, name: 'إطار شائع ١', frameImageId: 'fr_c1' },
  { id: 'fr_c2', type: 'frame', rarity: 'common', price: 350, name: 'إطار شائع ٢', frameImageId: 'fr_c2' },
  { id: 'fr_c3', type: 'frame', rarity: 'common', price: 350, name: 'إطار شائع ٣', frameImageId: 'fr_c3' },
  { id: 'fr_c4', type: 'frame', rarity: 'common', price: 350, name: 'إطار شائع ٤', frameImageId: 'fr_c4' },

  // ── Rare Frames (fr_r1–fr_r4) ──
  { id: 'fr_r1', type: 'frame', rarity: 'rare', price: 1400, name: 'إطار نادر ١', frameImageId: 'fr_r1' },
  { id: 'fr_r2', type: 'frame', rarity: 'rare', price: 1400, name: 'إطار نادر ٢', frameImageId: 'fr_r2' },
  { id: 'fr_r3', type: 'frame', rarity: 'rare', price: 1400, name: 'إطار نادر ٣', frameImageId: 'fr_r3' },
  { id: 'fr_r4', type: 'frame', rarity: 'rare', price: 1400, name: 'إطار نادر ٤', frameImageId: 'fr_r4' },

  // ── Legendary Avatars (l01–l16) ──
  { id: 'av_l01', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ١',  cardImageId: 'l01' },
  { id: 'av_l02', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ٢',  cardImageId: 'l02' },
  { id: 'av_l03', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ٣',  cardImageId: 'l03' },
  { id: 'av_l04', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ٤',  cardImageId: 'l04' },
  { id: 'av_l05', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ٥',  cardImageId: 'l05' },
  { id: 'av_l06', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ٦',  cardImageId: 'l06' },
  { id: 'av_l07', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ٧',  cardImageId: 'l07' },
  { id: 'av_l08', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ٨',  cardImageId: 'l08' },
  { id: 'av_l09', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ٩',  cardImageId: 'l09' },
  { id: 'av_l10', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ١٠', cardImageId: 'l10' },
  { id: 'av_l11', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ١١', cardImageId: 'l11' },
  { id: 'av_l12', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ١٢', cardImageId: 'l12' },
  { id: 'av_l13', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ١٣', cardImageId: 'l13' },
  { id: 'av_l14', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ١٤', cardImageId: 'l14' },
  { id: 'av_l15', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ١٥', cardImageId: 'l15' },
  { id: 'av_l16', type: 'avatar', rarity: 'legendary', price: 4500, name: 'شخصية أسطورية ١٦', cardImageId: 'l16' },

  // ── Legendary Frames (fr_l1–fr_l4) ──
  { id: 'fr_l1', type: 'frame', rarity: 'legendary', price: 6000, name: 'إطار أسطوري ١', frameImageId: 'fr_l1' },
  { id: 'fr_l2', type: 'frame', rarity: 'legendary', price: 6000, name: 'إطار أسطوري ٢', frameImageId: 'fr_l2' },
  { id: 'fr_l3', type: 'frame', rarity: 'legendary', price: 6000, name: 'إطار أسطوري ٣', frameImageId: 'fr_l3' },
  { id: 'fr_l4', type: 'frame', rarity: 'legendary', price: 6000, name: 'إطار أسطوري ٤', frameImageId: 'fr_l4' },
];
