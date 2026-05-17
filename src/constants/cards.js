export const CARD_IDS = {
  MAQHA: 1,
  MAKTABA: 2,
  TAJIR: 3,
  JARA: 4,
  MUHANDIS: 5,
  QAID: 6,
  BUSTAN: 7,
  NAJMA: 8,
};

export const CARDS = [
  {
    id: 1,
    name: 'صاحب المقهى',
    power: 1,
    count: 5,
    ability: 'خمّن كرت لاعب — إن صح يُقصى',
    description: 'تختار لاعب وتخمن أي شخصية معه. إذا أصبت يخرج فوراً.',
    icon: '☕',
    color: '#7C5A1E',
    bg: '#3D2B0A',
  },
  {
    id: 2,
    name: 'أمين المكتبة',
    power: 2,
    count: 2,
    ability: 'تشاهد كرت لاعب آخر سرًا',
    description: 'اكشف كرت أي لاعب آخر وشوفه وحدك.',
    icon: '📚',
    color: '#2D8A5A',
    bg: '#0D3A25',
  },
  {
    id: 3,
    name: 'التاجر',
    power: 3,
    count: 2,
    ability: 'قارن مع لاعب — الأقل يخرج',
    description: 'قارن كرتك مع كرت لاعب. اللي رقمه أقل يخرج.',
    icon: '⚖️',
    color: '#C05020',
    bg: '#4A1A08',
  },
  {
    id: 4,
    name: 'الجارة اليقظة',
    power: 4,
    count: 2,
    ability: 'حماية حتى دورك القادم',
    description: 'لا يمكن لأحد استهدافك حتى بداية دورك القادم.',
    icon: '🛡️',
    color: '#6B3DAE',
    bg: '#2A1245',
  },
  {
    id: 5,
    name: 'مهندس الكهرباء',
    power: 5,
    count: 2,
    ability: 'أجبر لاعب يرمي كرته ويسحب غيره',
    description: 'لاعب آخر يرمي كرته ويسحب جديد. لو رمى 8: يخرج.',
    icon: '⚡',
    color: '#1A7AB0',
    bg: '#081E30',
  },
  {
    id: 6,
    name: 'قائد الفرقة',
    power: 6,
    count: 1,
    ability: 'بدّل كرتك مع كرت لاعب آخر',
    description: 'تبدل كرتك مع كرت لاعب. التبديل لا يُعتبر رمي.',
    icon: '🔄',
    color: '#9A2E2E',
    bg: '#3A0E0E',
  },
  {
    id: 7,
    name: 'صاحب البستان',
    power: 7,
    count: 1,
    ability: 'يجب رميه إذا معك 5 أو 6',
    description: 'إذا سحبت 5 أو 6 في نفس الدور يجب عليك رمي هذا الكرت.',
    icon: '🌿',
    color: '#3D7A2E',
    bg: '#122508',
  },
  {
    id: 8,
    name: 'نجمة الحي',
    power: 8,
    count: 1,
    ability: 'إذا رُمي لأي سبب: تخرج فوراً',
    description: 'الكرت الأخطر. إذا خرج من يدك لأي سبب تُقصى.',
    icon: '⭐',
    color: '#C8960A',
    bg: '#3D2A00',
  },
];

export function buildDeck() {
  const deck = [];
  for (const card of CARDS) {
    for (let i = 0; i < card.count; i++) {
      deck.push({ ...card, uid: `${card.id}-${i}` });
    }
  }
  return deck;
}
