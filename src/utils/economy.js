const DAILY_KEY = 'hay_ashbal_daily';

const BASE = {
  easy:   { win: 25, loss: 2 },
  medium: { win: 55, loss: 4 },
  hard:   { win: 85, loss: 6 },
};
const FIRST_WIN_BONUS = 60;
const SOFT_CAP  = 350;
const HARD_CAP  = 550;
const EASY_WIN_DAILY_CAP = 5; // after this, easy win halved

function today() { return new Date().toISOString().slice(0, 10); }

export function loadDailyStats() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d.date === today()) return d;
    }
  } catch {}
  return { date: today(), earned: 0, easyWins: 0, firstWins: {}, losses: 0 };
}

function saveDailyStats(d) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(d)); } catch {}
}

// Returns { coins, breakdown, capped, isFirstWin }
export function calcMatchReward(difficulty, won) {
  const d = loadDailyStats();

  if (d.earned >= HARD_CAP) {
    return { coins: 1, breakdown: [{ label: 'مكافأة رمزية', amount: 1 }], capped: 'hard', isFirstWin: false };
  }

  const softCapped = d.earned >= SOFT_CAP;
  let base = won ? BASE[difficulty].win : BASE[difficulty].loss;

  // Easy win daily cap → halve reward
  if (won && difficulty === 'easy' && d.easyWins >= EASY_WIN_DAILY_CAP) {
    base = Math.floor(base * 0.5);
  }
  if (softCapped) base = Math.floor(base * 0.5);

  const breakdown = [{ label: won ? 'مكافأة الفوز' : 'مكافأة المشاركة', amount: base }];

  const isFirstWin = won && !d.firstWins[difficulty];
  let bonus = 0;
  if (isFirstWin) {
    bonus = FIRST_WIN_BONUS;
    if (softCapped) bonus = Math.floor(bonus * 0.5);
    bonus = Math.min(bonus, HARD_CAP - d.earned - base);
    if (bonus > 0) breakdown.push({ label: 'أول فوز اليوم! 🎉', amount: bonus });
  }

  const total = Math.max(0, Math.min(base + bonus, HARD_CAP - d.earned));
  return { coins: total, breakdown, capped: softCapped ? 'soft' : null, isFirstWin };
}

export function applyMatchReward(coins, difficulty, won, isFirstWin) {
  const d = loadDailyStats();
  d.earned += coins;
  if (won) {
    if (difficulty === 'easy') d.easyWins = (d.easyWins || 0) + 1;
    if (isFirstWin) d.firstWins[difficulty] = true;
  } else {
    d.losses = (d.losses || 0) + 1;
  }
  saveDailyStats(d);
}

export function getDailyProgress() {
  const d = loadDailyStats();
  return { earned: d.earned, softCap: SOFT_CAP, hardCap: HARD_CAP };
}
