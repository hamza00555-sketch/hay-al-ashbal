export const RARITY_CONFIG = {
  common:    { label: 'شائع',   color: '#9E9E9E', bg: 'rgba(158,158,158,0.12)' },
  rare:      { label: 'نادر',   color: '#42A5F5', bg: 'rgba(66,165,245,0.12)' },
  epic:      { label: 'ملحمي', color: '#AB47BC', bg: 'rgba(171,71,188,0.12)' },
  legendary: { label: 'أسطوري', color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
};

export const STORE_ITEMS = [
  // ── Common Avatars (350⭐) ──
  { id: 'av_c1', type: 'avatar', rarity: 'common',    price: 350,  name: 'الجريئة',       cardImageId: '1b' },
  { id: 'av_c2', type: 'avatar', rarity: 'common',    price: 350,  name: 'المرشد',        cardImageId: '2b' },
  { id: 'av_c3', type: 'avatar', rarity: 'common',    price: 350,  name: 'الشجاع',        cardImageId: '3b' },
  { id: 'av_c4', type: 'avatar', rarity: 'common',    price: 350,  name: 'الحارس',        cardImageId: '4b' },

  // ── Rare Avatars (1000⭐) ──
  { id: 'av_r1', type: 'avatar', rarity: 'rare',      price: 1000, name: 'الفارسة',       cardImageId: '1c' },
  { id: 'av_r2', type: 'avatar', rarity: 'rare',      price: 1000, name: 'الراهن',        cardImageId: '1d' },
  { id: 'av_r3', type: 'avatar', rarity: 'rare',      price: 1000, name: 'سيد الأوراق',   cardImageId: '5b' },

  // ── Epic Avatars (2200⭐) ──
  { id: 'av_e1', type: 'avatar', rarity: 'epic',      price: 2200, name: 'الحكيم الخفي',  cardImageId: '1e' },
  { id: 'av_e2', type: 'avatar', rarity: 'epic',      price: 2200, name: 'ملكة الحي',     cardImageId: '6' },

  // ── Legendary Avatar (4500⭐) ──
  { id: 'av_l1', type: 'avatar', rarity: 'legendary', price: 4500, name: 'أسطورة الأشبال', cardImageId: '7' },

  // ── Common Frames (500⭐) ──
  { id: 'fr_c1', type: 'frame', rarity: 'common',    price: 500,  name: 'الدائرة الذهبية',   frameShape: 'circle',  frameColor: '#FFD700' },
  { id: 'fr_c2', type: 'frame', rarity: 'common',    price: 500,  name: 'الدائرة الحمراء',   frameShape: 'circle',  frameColor: '#ff7777' },
  { id: 'fr_c3', type: 'frame', rarity: 'common',    price: 500,  name: 'المستدير الأخضر',   frameShape: 'rounded', frameColor: '#77ddaa' },

  // ── Rare Frames (1400⭐) ──
  { id: 'fr_r1', type: 'frame', rarity: 'rare',      price: 1400, name: 'السداسي الأزرق',    frameShape: 'hexagon', frameColor: '#60b8ff' },
  { id: 'fr_r2', type: 'frame', rarity: 'rare',      price: 1400, name: 'البنفسجي الملكي',   frameShape: 'rounded', frameColor: '#bb77ff' },
  { id: 'fr_r3', type: 'frame', rarity: 'rare',      price: 1400, name: 'البرتقالي المتوهج', frameShape: 'circle',  frameColor: '#ff9944' },

  // ── Epic Frames (3000⭐) ──
  { id: 'fr_e1', type: 'frame', rarity: 'epic',      price: 3000, name: 'السداسي الذهبي',    frameShape: 'hexagon', frameColor: '#FFD700' },
  { id: 'fr_e2', type: 'frame', rarity: 'epic',      price: 3000, name: 'الفيروزي',          frameShape: 'rounded', frameColor: '#00CED1' },

  // ── Legendary Frame (6000⭐) ──
  { id: 'fr_l1', type: 'frame', rarity: 'legendary', price: 6000, name: 'تاج الأشبال',       frameShape: 'hexagon', frameColor: '#FFD700', animated: true },
];
