import { useState, useEffect } from 'react';
import { listenRoom, startGame, leaveRoom } from '../services/gameRoom';
import { createInitialState } from '../engine/gameEngine';
import { loadProfile, getAIProfile } from '../utils/playerProfile';
import { SFX } from '../utils/sounds';
import styles from './WaitingRoomPage.module.css';

export default function WaitingRoomPage({ user, roomInfo, onGameStart, onLeave }) {
  const { code, isHost, myUid } = roomInfo;

  const [room,    setRoom]    = useState(null);
  const [copied,  setCopied]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    const unsub = listenRoom(code, data => setRoom(data));
    return () => unsub();
  }, [code]);

  // Follow game start (for guests)
  useEffect(() => {
    if (!room || room.status !== 'playing' || !room.state) return;
    if (isHost) return; // host triggers startGame itself
    const uidToIdx = room.uidToIdx || {};
    const myIdx    = uidToIdx[myUid] ?? 0;
    onGameStart({
      initialGs: room.state,
      myPlayerIdx: myIdx,
      uidToIdx,
      roomCode: code,
      isHost: false,
      config: room.config ?? { tokensToWin: 3 },
    });
  }, [room?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      SFX.buttonClick();
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {}
  }

  async function handleStart() {
    if (!room) return;
    const playerEntries = Object.entries(room.players || {});
    if (playerEntries.length < 2) { setErr('لازم لاعبَين على الأقل'); return; }

    setLoading(true);
    setErr('');
    try {
      // Sort by joinedAt to keep consistent order
      const sorted = playerEntries
        .map(([uid, p]) => ({ uid, ...p }))
        .sort((a, b) => a.joinedAt - b.joinedAt);

      const players = sorted.map(p => ({
        name:    p.name   || 'لاعب',
        isAI:    false,
        profile: p.profile || getAIProfile(0),
      }));

      const uidToIdx = {};
      sorted.forEach((p, i) => { uidToIdx[p.uid] = i; });

      const initialGs = createInitialState(players);
      const tokensToWin = room.config?.tokensToWin ?? 3;

      await startGame(code, initialGs, uidToIdx, tokensToWin);

      const myIdx = uidToIdx[myUid] ?? 0;
      onGameStart({
        initialGs,
        myPlayerIdx: myIdx,
        uidToIdx,
        roomCode: code,
        isHost: true,
        config: { tokensToWin },
      });
    } catch (e) {
      setErr(e.message || 'خطأ في بدء اللعبة');
      setLoading(false);
    }
  }

  async function handleLeave() {
    SFX.buttonClick();
    await leaveRoom(code, myUid).catch(() => {});
    onLeave();
  }

  const players = room ? Object.values(room.players || {}) : [];

  return (
    <div className={styles.page} dir="rtl">
      <div className={styles.header}>
        <button className={styles.leaveBtn} onClick={handleLeave}>✕ مغادرة</button>
        <h2 className={styles.title}>انتظار اللاعبين</h2>
      </div>

      {/* Room code */}
      <div className={styles.codeSection}>
        <p className={styles.codeLabel}>شارك الكود مع أصحابك</p>
        <div className={styles.codeBox}>
          <span className={styles.code}>{code}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✓ تم' : '📋 نسخ'}
          </button>
        </div>
      </div>

      {/* Players list */}
      <div className={styles.players}>
        <p className={styles.playersLabel}>اللاعبون ({players.length}/4)</p>
        {players.map((p, i) => (
          <div key={i} className={styles.playerRow}>
            <span className={styles.playerIcon}>🦁</span>
            <span className={styles.playerName}>{p.name || 'لاعب'}</span>
            {i === 0 && <span className={styles.hostBadge}>المضيف</span>}
          </div>
        ))}
        {players.length < 4 && (
          <div className={styles.emptySlot}>
            <span className={styles.emptyIcon}>+</span>
            <span className={styles.emptyText}>ينتظر...</span>
          </div>
        )}
      </div>

      {err && <p className={styles.err}>{err}</p>}

      {isHost && (
        <div className={styles.footer}>
          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={loading || players.length < 2}
          >
            {loading ? '...' : `ابدأ اللعبة (${players.length} لاعبين) ▶`}
          </button>
          {players.length < 2 && (
            <p className={styles.waitHint}>انتظر حتى ينضم لاعب آخر</p>
          )}
        </div>
      )}

      {!isHost && (
        <div className={styles.waitingMsg}>
          <div className={styles.waitDots}>
            <span /><span /><span />
          </div>
          <p>ينتظر المضيف يبدأ اللعبة...</p>
        </div>
      )}
    </div>
  );
}
