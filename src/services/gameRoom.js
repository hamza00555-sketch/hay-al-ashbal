import { ref, set, get, update, onValue, remove } from 'firebase/database';
import { db } from './firebase';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion

function genCode() {
  return Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export async function createRoom(uid, playerConfig, tokensToWin) {
  let code;
  for (let i = 0; i < 6; i++) {
    code = genCode();
    const snap = await get(ref(db, `rooms/${code}/status`));
    if (!snap.exists()) break;
  }
  await set(ref(db, `rooms/${code}`), {
    host:          uid,
    status:        'waiting',
    config:        { tokensToWin },
    players:       { [uid]: { ...playerConfig, joinedAt: Date.now() } },
    uidToIdx:      {},
    state:         null,
    tokens:        {},
    roundNum:      1,
    pendingAction: null,
    createdAt:     Date.now(),
  });
  return code;
}

export async function joinRoom(code, uid, playerConfig) {
  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) throw new Error('الغرفة غير موجودة');
  const room = snap.val();
  if (room.status === 'playing') throw new Error('اللعبة بدأت بالفعل');
  if (room.status === 'done')    throw new Error('انتهت هذه الغرفة');
  const count = Object.keys(room.players || {}).length;
  if (count >= 4) throw new Error('الغرفة ممتلئة (4 لاعبين)');
  await update(ref(db, `rooms/${code}/players/${uid}`), { ...playerConfig, joinedAt: Date.now() });
  return room;
}

export async function startGame(code, initialState, uidToIdx, tokensToWin) {
  await update(ref(db, `rooms/${code}`), {
    status:        'playing',
    state:         initialState,
    uidToIdx,
    tokens:        {},
    roundNum:      1,
    pendingAction: null,
    config:        { tokensToWin },
  });
}

export function listenRoom(code, callback) {
  return onValue(ref(db, `rooms/${code}`), snap => callback(snap.val()));
}

// Firebase drops empty arrays (converts [] to null). Restore them after reading.
export function sanitizeGs(raw) {
  if (!raw) return null;
  const toArr = v => (Array.isArray(v) ? v : v != null ? Object.values(v) : []);
  return {
    ...raw,
    gameLog:       Array.isArray(raw.gameLog)       ? raw.gameLog       : [],
    globalDiscard: Array.isArray(raw.globalDiscard) ? raw.globalDiscard : [],
    deck:          toArr(raw.deck),
    players:       toArr(raw.players).map(p => ({
      ...p,
      hand:        toArr(p.hand),
      discardPile: Array.isArray(p.discardPile) ? p.discardPile : [],
      peekMemory:  p.peekMemory ?? {},
    })),
  };
}

// Write game state (called after every action by the active player)
export async function writeGameState(code, state, tokens, roundNum) {
  const upd = { state, pendingAction: null };
  if (tokens   !== undefined) upd.tokens   = tokens;
  if (roundNum !== undefined) upd.roundNum = roundNum;
  await update(ref(db, `rooms/${code}`), upd);
}

// Submit an action (non-active player submits their intended action for validation)
export async function submitPendingAction(code, action) {
  await set(ref(db, `rooms/${code}/pendingAction`), action);
}

export async function endRoom(code) {
  await update(ref(db, `rooms/${code}`), { status: 'done' });
}

// Host writes fresh initialGs to Firebase so guest auto-starts next round.
export async function writeRoundStart(code, gs) {
  await update(ref(db, `rooms/${code}`), { nextRound: gs, status: 'playing' });
}

export async function leaveRoom(code, uid) {
  await remove(ref(db, `rooms/${code}/players/${uid}`));
}

export async function saveUserProfile(uid, name, profile) {
  await update(ref(db, `users/${uid}`), { name, profile });
}

export async function getUserProfile(uid) {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? snap.val() : null;
}
