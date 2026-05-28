import { loadProfile, saveProfile } from './playerProfile';

// Active codes — keys are uppercased and trimmed. Add new codes here.
export const REDEEM_CODES = {
  WELCOME:    { coins: 500,  label: 'كود الترحيب' },
  SHIBL2026:  { coins: 2000, label: 'كود الإطلاق' },
  GIFT100:    { coins: 100,  label: 'هدية صغيرة' },
  ASHBAL:     { coins: 1000, label: 'كود الأشبال' },
};

function normalize(code) {
  return String(code ?? '').trim().toUpperCase();
}

/**
 * Try to redeem a code. Returns an object:
 *   { ok: true,  coins, label, balance }   — credited
 *   { ok: false, reason: 'invalid' | 'used' | 'empty' }
 */
export function redeemCode(rawCode) {
  const code = normalize(rawCode);
  if (!code) return { ok: false, reason: 'empty' };

  const entry = REDEEM_CODES[code];
  if (!entry) return { ok: false, reason: 'invalid' };

  const profile = loadProfile();
  const used = profile.redeemedCodes ?? [];
  if (used.includes(code)) return { ok: false, reason: 'used' };

  const nextCoins = (profile.coins ?? 0) + entry.coins;
  saveProfile({
    ...profile,
    coins: nextCoins,
    redeemedCodes: [...used, code],
  });

  return { ok: true, coins: entry.coins, label: entry.label, balance: nextCoins };
}
