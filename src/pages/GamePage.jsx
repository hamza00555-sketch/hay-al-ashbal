import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ref as dbRef, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { writeGameState, listenRoom, sanitizeGs } from '../services/gameRoom';
import {
  createInitialState,
  getCurrentPlayer,
  doDrawCard,
  resolveCard,
  advanceTurn,
  getLegalPlays,
  mustPlayBustan,
} from '../engine/gameEngine';
import { computeAIMove } from '../ai/aiPlayer';
import { buildNarrative, buildActionText } from '../engine/narrativeBuilder';
import { CardFace, CardBack, FlipCard } from '../components/Card';
import ActionModal from '../components/ActionModal';
import HandCover from '../components/HandCover';
import GameLog from '../components/GameLog';
import CardInfoModal from '../components/CardInfoModal';
import NarrativeOverlay from '../components/NarrativeOverlay';
import DiscardPile from '../components/DiscardPile';
import GuideDrawer from '../components/GuideDrawer';
import PlayerAvatar from '../components/PlayerAvatar';
import { SFX, startMusic, stopMusic, haptic } from '../utils/sounds';
import styles from './GamePage.module.css';

const ACTION_TYPE = {
  1: 'GUESS',
  2: 'PEEK',
  3: 'COMPARE',
  5: 'FORCE_DISCARD',
  6: 'SWAP',
};

// ── Seat assignment: clockwise from human's right ────────────────
function assignSeats(players, humanId) {
  const humanIdx = players.findIndex(p => p.id === humanId);
  const opp = [];
  for (let s = 1; s < players.length; s++) {
    opp.push(players[(humanIdx + s) % players.length]);
  }
  if (opp.length === 0) return {};
  if (opp.length === 1) return { top: opp[0] };
  if (opp.length === 2) return { right: opp[0], left: opp[1] };
  return { right: opp[0], top: opp[1], left: opp[2] };
}

// ── Player portrait using card-face avatar ───────────────────────
function Portrait({ profile, size = 'seat', isActive, isEliminated }) {
  const avSize = size === 'human' ? 'lg' : 'md';
  return (
    <div
      className={[
        styles.portrait,
        styles[`portrait_${size}`],
        isActive && !isEliminated ? styles.portraitActive : '',
        isEliminated              ? styles.portraitDead   : '',
      ].join(' ')}
    >
      <PlayerAvatar
        cardImageId={profile?.cardImageId ?? '1'}
        frameShape={profile?.frameShape ?? 'circle'}
        frameColor={isEliminated ? '#555' : (profile?.frameColor ?? '#60b8ff')}
        size={avSize}
      />
    </div>
  );
}

// ── Seat component ───────────────────────────────────────────────
function Seat({ player, position, isActive, eliminating }) {
  return (
    <div className={[
      styles.seat,
      styles[`seat_${position}`],
      isActive            ? styles.seatActive      : '',
      player.isEliminated ? styles.seatDead        : '',
      eliminating         ? styles.seatEliminating : '',
    ].join(' ')}>

      {isActive && !player.isEliminated && (
        <div className={styles.activePing} />
      )}

      <div className={styles.portraitRow}>
        <Portrait
          profile={player.profile}
          size="seat"
          isActive={isActive}
          isEliminated={player.isEliminated}
        />
      </div>

      <div className={styles.seatCardWrap}>
        {player.isEliminated ? (
          <div className={styles.deadMark}>💀</div>
        ) : (
          <>
            <CardBack size="small" />
            {player.isProtected && (
              <span className={styles.shieldBadge}>🛡️</span>
            )}
          </>
        )}
      </div>

      {isActive && !player.isEliminated && (
        <span className={styles.activeBadge}>دوره ◀</span>
      )}

      <span className={styles.seatName} style={{ color: player.profile?.frameColor ?? '#60b8ff' }}>{player.name}</span>
      <span className={styles.seatDiscard}>{player.discardPile.length} رُمي</span>
      {player.isAI && player.difficulty && player.difficulty !== 'easy' && (
        <span className={styles.diffBadge}>
          {{ medium: 'متوسط', hard: 'صعب' }[player.difficulty]}
        </span>
      )}
    </div>
  );
}

// ── Flying card: parabolic arc with glow ────────────────────────
function FlyingCard({ card, fromRect, toRect, onDone }) {
  const ref   = useRef(null);
  const cbRef = useRef(onDone);
  cbRef.current = onDone;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const W = 140, H = 210;
    const sx = fromRect.left + fromRect.width  / 2 - W / 2;
    const sy = fromRect.top  + fromRect.height / 2 - H / 2;
    const ex = toRect.left   + toRect.width    / 2 - W / 2;
    const ey = toRect.top    + toRect.height   / 2 - H / 2;

    const DURATION = 780;
    let startTs = null;
    let raf;

    function frame(ts) {
      if (!startTs) startTs = ts;
      const t = Math.min((ts - startTs) / DURATION, 1);
      const x  = sx + (ex - sx) * t;
      const y  = sy + (ey - sy) * t + Math.sin(t * Math.PI) * -110;
      const sc = 1  + Math.sin(t * Math.PI) * 0.22;
      const rz = Math.sin(t * Math.PI) * -12;
      const gl = Math.sin(t * Math.PI) * 52;
      const op = t > 0.80 ? 1 - (t - 0.80) / 0.20 : 1;
      el.style.transform = `translate(${x - sx}px,${y - sy}px) scale(${sc}) rotateZ(${rz}deg)`;
      el.style.filter    = `drop-shadow(0 0 ${gl}px rgba(70,180,255,.9)) drop-shadow(0 0 ${gl * .55}px rgba(255,220,60,.55))`;
      el.style.opacity   = op;
      if (t < 1) { raf = requestAnimationFrame(frame); }
      else       { cbRef.current?.(); }
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top:  fromRect.top  + fromRect.height / 2 - 105,
        left: fromRect.left + fromRect.width  / 2 - 70,
        width: 140, height: 210,
        zIndex: 2000,
        pointerEvents: 'none',
        willChange: 'transform, filter, opacity',
      }}
    >
      <CardFace card={card} size="large" />
    </div>
  );
}

// ── Main GamePage ────────────────────────────────────────────────
export default function GamePage({
  config, onGameOver, onQuit, roundNumber = 1, tokensToWin = 1, tokens = {},
  // Online mode props
  isOnline = false, isHost = false, myPlayerIdx = 0, roomCode = null,
  initialGs = null,
}) {
  const [gs, setGs] = useState(() => initialGs ?? createInitialState(config.players));

  const [focusedSource, setFocusedSource] = useState(null);
  const [showAction, setShowAction]       = useState(false);
  const [pendingPlay, setPendingPlay]     = useState(null);
  const [infoCard, setInfoCard]           = useState(null);
  const [flyState, setFlyState]           = useState(null);
  const [drawnFlipping, setDrawnFlipping] = useState(false);
  const [isDrawing, setIsDrawing]         = useState(false);
  const [kickBackSource, setKickBackSource] = useState(null);
  const [impactFlash,    setImpactFlash]    = useState(false);

  // ── Narrative queue ──────────────────────────────────────────
  const [currentBeat, setCurrentBeat] = useState(null);
  const currentBeatRef = useRef(null); // mirror for Firebase listener (avoids stale closure)
  const [pendingGs,   setPendingGs]   = useState(null);
  const beatQueueRef      = useRef([]);
  const narrativeTimer    = useRef(null);
  const kickSeqRef        = useRef(0);    // seq counter — prevents stale setTimeout from double-draining
  const pendingRemoteRef  = useRef(null);
  const pendingGsRef      = useRef(null); // mirrors pendingGs — lets kickQueue read it without a setState updater
  const gsRef             = useRef(null); // always-current gs snapshot for Firebase listener (avoids stale closure)

  // TurnBanner (brief flash)
  const [turnBanner, setTurnBanner]   = useState(null);
  const prevPlayerIdxRef = useRef(-1);

  // TurnAnnounce: full-screen "دور علي" before each turn
  const [turnAnnounce, setTurnAnnounce] = useState(null);
  const isFirstTurnRef  = useRef(true);
  const announceTimer   = useRef(null);

  const prevDrawnRef  = useRef(null);
  const handCardRef   = useRef(null);
  const drawnCardRef  = useRef(null);
  const deckRef       = useRef(null);
  const bannerTimer   = useRef(null);

  // Online: action toast shown to the opponent
  const [actionToast,   setActionToast]   = useState(null);
  const lastActionTs  = useRef(-1);
  const toastTimer    = useRef(null);

  // Online: Firebase connection status
  const [isConnected, setIsConnected] = useState(true);

  const [musicOn,      setMusicOn]     = useState(true);
  const [showGuide,    setShowGuide]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [elimIds,       setElimIds]       = useState(new Set());
  const [winFlash,      setWinFlash]      = useState(false);
  const [showShowdown,  setShowShowdown]  = useState(false);
  const [showdownData,  setShowdownData]  = useState(null);
  const prevPlayersRef  = useRef(null);

  const currentPlayer = getCurrentPlayer(gs);
  const hasAI         = gs.players.some(p => p.isAI);
  const humanPlayer   = isOnline
    ? gs.players[myPlayerIdx]
    : (hasAI ? gs.players.find(p => !p.isAI) : currentPlayer);

  // Responsive card size — updates on resize and orientation change (Grok approach)
  function computeHandCardSize(h, w) {
    if (w <= 400 || h < 612) return 'small';
    if (h >= 720) return 'large';
    return 'normal';
  }
  const [handCardSize, setHandCardSize] = useState(
    () => computeHandCardSize(window.innerHeight, window.innerWidth)
  );

  const legalPlays   = gs.drawnCard ? getLegalPlays(currentPlayer.hand[0], gs.drawnCard) : [];
  const bustanForced = gs.drawnCard ? mustPlayBustan(currentPlayer.hand[0], gs.drawnCard) : false;

  const seats    = assignSeats(gs.players, humanPlayer?.id ?? gs.players[0]?.id);
  const activeId = gs.players[gs.currentPlayerIndex]?.id;

  // isLocked: narrative playing OR fly animation OR waiting for online opponent
  const onlineWaiting = isOnline && currentPlayer.id !== humanPlayer?.id;
  const isLocked = !!currentBeat || !!flyState || onlineWaiting;

  // ── Narrative queue driver ───────────────────────────────────
  function kickQueue() {
    const mySeq = ++kickSeqRef.current; // increment before clearTimeout so any in-flight timer is stale
    clearTimeout(narrativeTimer.current);
    const q = beatQueueRef.current;
    if (q.length === 0) {
      currentBeatRef.current = null;
      setCurrentBeat(null);
      // Snapshot both refs BEFORE any setState call — updater functions must be pure
      const remote = pendingRemoteRef.current;
      pendingRemoteRef.current = null;
      const prev = pendingGsRef.current;
      pendingGsRef.current = null;
      setPendingGs(null);
      if (remote && (remote._v ?? 0) > (prev?._v ?? 0)) {
        setGs(remote);
      } else if (prev) {
        setGs(prev);
      }
      return;
    }
    const [next, ...rest] = q;
    beatQueueRef.current = rest;
    currentBeatRef.current = next;
    switch (next.type) {
      case 'AI_THINKING':       SFX.panelPop();                                           break;
      case 'CARD_ANTICIPATE':   SFX.panelPop();                                           break;
      case 'COMPARE_REVEAL':    SFX.compareReveal();                                      break;
      case 'FORCE_RESULT':      SFX.forceDiscard();                                       break;
      case 'SWAP_VISUAL':       SFX.swapVisual();                                         break;
      case 'PROTECTION_FLASH':  SFX.protectionFlash();                                    break;
      case 'HIT_PAUSE':                                                                   break;
      case 'ELIMINATION':
        SFX.eliminate();
        setImpactFlash(true);
        setTimeout(() => setImpactFlash(false), 150);
        break;
      case 'CARD_IMPACT': {
        SFX.panelPop();
        const { hit, card: c } = next.payload;
        if (hit) {
          SFX.correctGuess();
          setImpactFlash(true);
          setTimeout(() => setImpactFlash(false), 150);
        }
        else if (c?.id === 1) SFX.wrongGuess();
        else if (c?.id === 2) SFX.secretView();
        break;
      }
      default: break;
    }
    setCurrentBeat(next); // also tracked in currentBeatRef above
    if (next.durationMs > 0) {
      // Capture seq so this timer is a no-op if kickQueue was called manually (e.g., "تخطى" button)
      narrativeTimer.current = setTimeout(() => {
        if (kickSeqRef.current === mySeq) kickQueue();
      }, next.durationMs);
    }
  }

  // actionMeta: { text, targetIdx? } or null. targetIdx lets the viewer replay the narrative.
  function pushNarrative(beats, nextState, actionMeta = null) {
    const meta = typeof actionMeta === 'string' ? { text: actionMeta } : actionMeta;
    const stamped = isOnline
      ? {
          ...nextState,
          _v:      (nextState._v ?? 0) + 1,
          _author: myPlayerIdx,
          ...(meta ? { _action: { ...meta, ts: Date.now() } } : {}),
        }
      : nextState;
    clearTimeout(narrativeTimer.current);
    beatQueueRef.current = beats;
    pendingGsRef.current = stamped; // keep ref in sync with state
    setPendingGs(stamped);
    kickQueue();
  }

  // Keep gsRef always current — used in Firebase listener to avoid stale closures
  useEffect(() => { gsRef.current = gs; });

  // Cleanup timers on unmount + set --real-vh/vw for accurate Android/iOS layout
  useEffect(() => {
    startMusic();
    function updateLayout() {
      const h = window.innerHeight, w = window.innerWidth;
      document.documentElement.style.setProperty('--real-vh', `${h * 0.01}px`);
      document.documentElement.style.setProperty('--real-vw', `${w * 0.01}px`);
      setHandCardSize(computeHandCardSize(h, w));
    }
    updateLayout();
    window.addEventListener('resize', updateLayout);
    // iOS fires orientationchange before innerHeight updates — wait 150ms (Grok fix)
    const onOrient = () => setTimeout(updateLayout, 150);
    window.addEventListener('orientationchange', onOrient);
    return () => {
      clearTimeout(narrativeTimer.current);
      clearTimeout(announceTimer.current);
      clearTimeout(toastTimer.current);
      clearTimeout(bannerTimer.current);
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', onOrient);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── HAND_COVER → DRAW (online / vsAI) ───────────────────────
  // Must be a useEffect — never a render-body side effect — so the transition
  // is guaranteed to fire after every commit regardless of overlay ordering.
  useEffect(() => {
    if (gs.phase !== 'HAND_COVER') return;
    if (!isOnline && !hasAI) return;
    const t = setTimeout(() => {
      setGs(prev => prev.phase === 'HAND_COVER' ? { ...prev, phase: 'DRAW' } : prev);
    }, 0);
    return () => clearTimeout(t);
  }, [gs.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online: Firebase connection status ──────────────────────
  useEffect(() => {
    if (!isOnline) return;
    const connRef = dbRef(db, '.info/connected');
    const unsub = onValue(connRef, snap => setIsConnected(snap.val() === true));
    return () => unsub();
  }, [isOnline]);

  // ── Online: each player writes their own turns to Firebase ──
  // _author is stamped = myPlayerIdx when we make a move, so echo is skipped on receive.
  const lastSyncedV = useRef(-1);
  useEffect(() => {
    if (!isOnline || !roomCode) return;
    if ((gs._author ?? -1) !== myPlayerIdx) return; // only write my own turns
    const v = gs._v ?? 0;
    if (v === lastSyncedV.current) return;
    lastSyncedV.current = v;
    writeGameState(roomCode, gs).catch(e => console.warn('[sync]', e));
  }, [gs, isOnline, roomCode, myPlayerIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online: receive opponent's turns from Firebase ──
  const lastReceivedV = useRef(-1);
  useEffect(() => {
    if (!isOnline || !roomCode) return;
    const unsub = listenRoom(roomCode, room => {
      if (!room?.state) return;
      const incoming = room.state;
      const v = incoming._v ?? 0;
      if (v <= lastReceivedV.current) return;
      if ((incoming._author ?? -1) === myPlayerIdx) return; // skip own echo
      lastReceivedV.current = v;

      const sanitized  = sanitizeGs(incoming);
      const action     = incoming._action;
      const prevGsSnap = gsRef.current;

      // Did the opponent play a card? (globalDiscard grew)
      const discardBefore = prevGsSnap?.globalDiscard?.length ?? 0;
      const cardPlayed    = sanitized.globalDiscard.length > discardBefore;

      if (cardPlayed && action?.ts && action.ts !== lastActionTs.current) {
        // Build narrative beats so the viewer sees the same animation as the active player
        lastActionTs.current = action.ts;

        // Guard: gsRef not yet initialised (should not happen but prevents a crash)
        if (!prevGsSnap) { setGs(sanitized); return; }

        const playedCard = sanitized.globalDiscard[sanitized.globalDiscard.length - 1];
        const actorIdx   = incoming._author ?? 0;
        const tgtIdx     = action.targetIdx ?? null;
        // Use player ID strings (not numeric indices) so buildNarrative's players.find() resolves correctly
        const actorId    = prevGsSnap.players[actorIdx]?.id ?? null;
        const tgtId      = tgtIdx != null ? prevGsSnap.players[tgtIdx]?.id ?? null : null;
        const targetCardBefore = tgtIdx != null
          ? prevGsSnap.players[tgtIdx]?.hand[0] ?? null
          : null;

        const beats = buildNarrative({
          card:            playedCard,
          actorId,
          actorName:       prevGsSnap.players[actorIdx]?.name ?? '',
          targetId:        tgtId,
          targetName:      tgtIdx != null ? prevGsSnap.players[tgtIdx]?.name ?? null : null,
          targetCardBefore,
          nextGs:          sanitized,
          prevGs:          prevGsSnap,
          isAI:            true,
        })
          .filter(b => b.type !== 'AI_THINKING')
          // Viewer side: auto-advance confirm beats (durationMs=0) after 1.8 s so the viewer
          // doesn't have to tap "حسناً" during the opponent's turn (would cause a permanent freeze)
          .map(b => b.durationMs === 0 ? { ...b, durationMs: 1800 } : b);

        if (beatQueueRef.current.length === 0 && !currentBeatRef.current) {
          beatQueueRef.current = beats;
          pendingGsRef.current = sanitized;
          setPendingGs(sanitized);
          kickQueue();
        } else {
          if (!pendingRemoteRef.current || v > (pendingRemoteRef.current._v ?? 0)) {
            pendingRemoteRef.current = sanitized;
          }
        }
      } else {
        // Turn advance without a new card (e.g. PEEK done, skip) — show toast, apply state
        if (action?.ts && action.ts !== lastActionTs.current) {
          lastActionTs.current = action.ts;
          clearTimeout(toastTimer.current);
          setActionToast(action.text);
          toastTimer.current = setTimeout(() => setActionToast(null), 3500);
        }
        if (beatQueueRef.current.length === 0 && !currentBeatRef.current) {
          setGs(sanitized);
          pendingRemoteRef.current = null;
        } else {
          if (!pendingRemoteRef.current || v > (pendingRemoteRef.current._v ?? 0)) {
            pendingRemoteRef.current = sanitized;
          }
        }
      }
    });
    return () => unsub();
  }, [isOnline, roomCode, myPlayerIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track newly eliminated players for animation + haptic
  useEffect(() => {
    const prev = prevPlayersRef.current;
    prevPlayersRef.current = gs.players;
    if (!prev) return;
    const newElim = gs.players.filter(p => {
      const was = prev.find(x => x.id === p.id);
      return p.isEliminated && was && !was.isEliminated;
    });
    if (newElim.length > 0) {
      haptic([30, 20, 30]);
      setElimIds(new Set(newElim.map(p => p.id)));
      const t = setTimeout(() => setElimIds(new Set()), 900);
      return () => clearTimeout(t);
    }
  }, [gs.players]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TurnAnnounce: full-screen before each turn ───────────────
  useEffect(() => {
    if (gs.currentPlayerIndex === prevPlayerIdxRef.current) return;
    if (gs.phase === 'GAME_OVER') return;
    prevPlayerIdxRef.current = gs.currentPlayerIndex;

    const cp = gs.players[gs.currentPlayerIndex];
    if (!cp || cp.isEliminated) return;

    // Skip announce on first turn (game just started)
    if (isFirstTurnRef.current) {
      isFirstTurnRef.current = false;
      return;
    }

    const isMe = isOnline
      ? cp.id === humanPlayer?.id     // Online: only when it's my turn
      : (!hasAI
          ? true                      // Pass & Play: human always confirms
          : cp.id === humanPlayer?.id // vsAI: only when it's the human's turn
        );

    // Online opponent turns: skip full-screen announce entirely (wait banner is enough)
    if (isOnline && !isMe) return;

    if (isMe) SFX.turnHuman(); else SFX.turnAI();
    setTurnAnnounce({ name: cp.name, profile: cp.profile, isMe, isAI: cp.isAI });

    // Flash TurnBanner for 2.2s (shows even while TurnAnnounce is up, persists after)
    setTurnBanner(isMe ? 'دورك!' : `دور ${cp.name}`);
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setTurnBanner(null), 2200);

    // AI turns: auto-dismiss after 1.6s
    if (cp.isAI) {
      clearTimeout(announceTimer.current);
      announceTimer.current = setTimeout(() => setTurnAnnounce(null), 1600);
    }
  }, [gs.currentPlayerIndex, gs.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flip animation on draw ───────────────────────────────────
  useEffect(() => {
    if (gs.drawnCard && gs.drawnCard !== prevDrawnRef.current) {
      prevDrawnRef.current = gs.drawnCard;
      setDrawnFlipping(true);
      SFX.cardFlip();
    }
    if (!gs.drawnCard) {
      prevDrawnRef.current = null;
      setDrawnFlipping(false);
    }
  }, [gs.drawnCard]);

  // ── Main phase driver ────────────────────────────────────────
  useEffect(() => {
    // In online mode while waiting: don't block phase driver on turnAnnounce
    if (turnAnnounce && !onlineWaiting) return;

    if (gs.phase === 'GAME_OVER') {
      const survivors = gs.players.filter(p => !p.isEliminated);
      if (survivors.length > 1) {
        // Deck ran out with multiple players — show showdown reveal first
        stopMusic();
        setShowdownData({ survivors, winner: gs.winner });
        setShowShowdown(true);
        return;
      }
      SFX.win();
      haptic([20, 10, 20, 10, 40]);
      stopMusic();
      setWinFlash(true);
      setTimeout(() => {
        setWinFlash(false);
        onGameOver({ winner: gs.winner, players: gs.players, log: gs.gameLog });
      }, 1000);
      return;
    }

    if (gs.phase === 'AI_TURN') {
      SFX.aiThink();
      const afterDraw = doDrawCard(gs);
      const { state: nextGsRaw, playedCard, targetId, targetCardBefore } = computeAIMove(afterDraw);
      const targetPlayer = targetId != null ? gs.players.find(p => p.id === targetId) : null;
      const beats = buildNarrative({
        card:             playedCard,
        actorId:          currentPlayer.id,
        actorName:        currentPlayer.name,
        targetId,
        targetName:       targetPlayer?.name ?? null,
        targetCardBefore,
        nextGs:           nextGsRaw,
        prevGs:           afterDraw,
        isAI:             true,
      });
      const txt = isOnline ? buildActionText({ card: playedCard, actorName: currentPlayer.name, targetName: targetPlayer?.name ?? null, nextGs: nextGsRaw, prevGs: afterDraw }) : null;
      pushNarrative(beats, nextGsRaw, txt ? { text: txt, targetIdx: targetId ?? null } : null);
      return;
    }

    if (gs.phase === 'DRAW' && !currentPlayer.isAI) {
      // Online: only draw if it's my turn (I'm the current player)
      if (isOnline && onlineWaiting) return;
      SFX.cardDraw();      setIsDrawing(true);
      const t = setTimeout(() => {
        setIsDrawing(false);
        // Do NOT stamp _author/_v here — DRAW is a local intermediate step.
        // Only pushNarrative (on PLAY) syncs to Firebase, avoiding a spurious broadcast.
        setGs(prev => doDrawCard(prev));
      }, 750);
      return () => clearTimeout(t);
    }
  }, [gs.phase, gs.currentPlayerIndex, turnAnnounce, onlineWaiting]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Skip AI vs AI when human is eliminated ───────────────────────
  useEffect(() => {
    if (!hasAI) return;
    if (gs.phase === 'GAME_OVER') return;
    if (currentBeat || pendingGs || beatQueueRef.current.length > 0) return;
    if (!humanPlayer?.isEliminated) return;

    // Fast-forward remaining AI turns silently to determine the winner
    let s = gs;
    for (let guard = 0; guard < 300 && s.phase !== 'GAME_OVER'; guard++) {
      if (s.phase !== 'AI_TURN') break;
      const afterDraw = doDrawCard(s);
      const { state: next } = computeAIMove(afterDraw);
      s = next;
    }
    if (s.phase === 'GAME_OVER') setGs(s);
  }, [gs, currentBeat, pendingGs, hasAI, humanPlayer?.isEliminated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────
  const handleCardClick = useCallback((source) => {
    if (isLocked) return;
    if (!legalPlays.includes(source)) {
      SFX.errorInvalid();
      haptic([15]);
      return;
    }

    if (focusedSource === source) {
      const card       = source === 'hand' ? currentPlayer.hand[0] : gs.drawnCard;
      const actionType = ACTION_TYPE[card.id];
      SFX.cardPlay();
      haptic([10]);

      const fromRef  = source === 'hand' ? handCardRef : drawnCardRef;
      const fromRect = fromRef.current?.getBoundingClientRect();
      const toRect   = deckRef.current?.getBoundingClientRect();

      const doPlay = () => {
        if (!actionType) {
          const prevGsSnap = gs;
          const nextGsRaw  = resolveCard(gs, card, source, null, null);
          const beats = buildNarrative({
            card,
            actorId:   currentPlayer.id,
            actorName: currentPlayer.name,
            nextGs:    nextGsRaw,
            prevGs:    prevGsSnap,
            isAI:      false,
          });
          const txt = isOnline ? buildActionText({ card, actorName: currentPlayer.name, targetName: null, nextGs: nextGsRaw, prevGs: prevGsSnap }) : null;
          pushNarrative(beats, nextGsRaw, txt ? { text: txt } : null);
        } else {
          setPendingPlay({ card, source });
          setShowAction(true);
        }
        setFocusedSource(null);
      };

      setKickBackSource(source);
      setTimeout(() => {
        setKickBackSource(null);
        if (fromRect && toRect) {
          setFlyState({ card, source, fromRect, toRect, onDone: doPlay });
        } else {
          doPlay();
        }
      }, 70);
    } else {
      SFX.cardSelect();
      haptic([6]);
      setFocusedSource(source);
    }
  }, [gs, legalPlays, currentPlayer, focusedSource, isLocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInfoClick = useCallback((source, e) => {
    e.stopPropagation();
    SFX.buttonClick();
    const card = source === 'hand' ? currentPlayer.hand[0] : gs.drawnCard;
    setInfoCard(card);
  }, [currentPlayer, gs.drawnCard]);

  const handleActionResolve = useCallback(({ targetId, guessedCardId, skip }) => {
    setShowAction(false);
    if (skip || !pendingPlay) {
      setFocusedSource(null);
      const play = pendingPlay;
      setPendingPlay(null);
      // When no valid target exists the chosen card is still discarded (Love Letter rule).
      // Without resolveCard the drawnCard would be silently dropped by advanceTurn — BUG FIX.
      const baseGs = play
        ? (() => {
            const { card: playedCard, source } = play;
            return {
              ...gs,
              players: gs.players.map((p, i) => {
                if (i !== gs.currentPlayerIndex) return p;
                const kept = source === 'hand' ? gs.drawnCard : p.hand[0];
                return { ...p, hand: [kept], discardPile: [...p.discardPile, playedCard] };
              }),
              drawnCard: null,
              globalDiscard: [...(gs.globalDiscard ?? []), playedCard],
            };
          })()
        : gs;
      pushNarrative([], advanceTurn(baseGs));
      return;
    }

    const targetPlayer    = targetId != null ? gs.players.find(p => p.id === targetId) : null;
    const targetCardBefore = targetPlayer?.hand[0] ?? null;

    const nextGsRaw = resolveCard(
      gs, pendingPlay.card, pendingPlay.source, targetId ?? null, guessedCardId ?? null
    );

    // PEEK: full-screen reveal, apply state directly (no narrative)
    if (nextGsRaw.phase === 'PEEK_REVEAL') {
      setGs(nextGsRaw);
      setFocusedSource(null);
      setPendingPlay(null);
      return;
    }

    const beats = buildNarrative({
      card:             pendingPlay.card,
      actorId:          currentPlayer.id,
      actorName:        currentPlayer.name,
      targetId,
      targetName:       targetPlayer?.name ?? null,
      targetCardBefore,
      nextGs:           nextGsRaw,
      prevGs:           gs,
      isAI:             false,
    });
    const txt = isOnline ? buildActionText({ card: pendingPlay.card, actorName: currentPlayer.name, targetName: targetPlayer?.name ?? null, nextGs: nextGsRaw, prevGs: gs }) : null;
    const targetIdx = targetId != null ? gs.players.findIndex(p => p.id === targetId) : null;
    pushNarrative(beats, nextGsRaw, txt ? { text: txt, targetIdx } : null);
    setFocusedSource(null);
    setPendingPlay(null);
  }, [gs, pendingPlay, currentPlayer, isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeekDone = useCallback(() => {
    const next = advanceTurn({ ...gs, phase: 'DONE', peekCard: null, peekTargetName: null });
    if (isOnline) {
      const txt = `👀 ${currentPlayer.name} رأى كرت ${gs.peekTargetName ?? 'خصمه'}`;
      const targetIdx = gs.players.findIndex(p => p.name === gs.peekTargetName);
      setGs({ ...next, _v: (next._v ?? 0) + 1, _author: myPlayerIdx, _action: { text: txt, ts: Date.now(), targetIdx: targetIdx >= 0 ? targetIdx : null } });
    } else {
      setGs(next);
    }
  }, [gs, isOnline, myPlayerIdx, currentPlayer.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMusic = () => {
    SFX.buttonClick();
    if (musicOn) { stopMusic(); setMusicOn(false); }
    else { startMusic(); setMusicOn(true); }
  };

  const handleShowdownDone = useCallback(() => {
    setShowShowdown(false);
    SFX.win();
    haptic([20, 10, 20, 10, 40]);
    setWinFlash(true);
    setTimeout(() => {
      setWinFlash(false);
      onGameOver({ winner: gs.winner, players: gs.players, log: gs.gameLog });
    }, 1000);
  }, [gs.winner, gs.players, gs.gameLog, onGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkipToEnd = useCallback(() => {
    clearTimeout(narrativeTimer.current);
    beatQueueRef.current = [];
    setCurrentBeat(null);
    setPendingGs(null);
    let s = gs;
    for (let guard = 0; guard < 300 && s.phase !== 'GAME_OVER'; guard++) {
      if (s.phase === 'AI_TURN') {
        const afterDraw = doDrawCard(s);
        const { state: next } = computeAIMove(afterDraw);
        s = next;
      } else {
        break;
      }
    }
    if (s.phase === 'GAME_OVER') setGs(s);
  }, [gs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render guards ────────────────────────────────────────────
  // Deck-exhaustion showdown modal: reveal all survivors' cards before win flash
  if (gs.phase === 'GAME_OVER' && showShowdown && showdownData) {
    return (
      <div className={styles.showdownOverlay}>
        <div className={styles.showdownModal}>
          <h2 className={styles.showdownTitle}>انتهت الكروت! 🃏</h2>
          <p className={styles.showdownSub}>يفوز صاحب أعلى بطاقة</p>
          <div className={styles.showdownPlayers}>
            {showdownData.survivors.map(p => (
              <div
                key={p.id}
                className={[
                  styles.showdownPlayer,
                  p.id === showdownData.winner?.id ? styles.showdownWinner : '',
                ].join(' ')}
              >
                <Portrait profile={p.profile} size="seat" isActive={false} isEliminated={false} />
                <span className={styles.showdownName} style={{ color: p.profile?.frameColor ?? '#60b8ff' }}>
                  {p.name}
                </span>
                {p.hand[0] && <CardFace card={p.hand[0]} size="normal" />}
                {p.id === showdownData.winner?.id && (
                  <span className={styles.showdownWinLabel}>🏆 فاز!</span>
                )}
              </div>
            ))}
          </div>
          {showdownData.winner && (
            <p className={styles.showdownReason}>
              {'فاز '}
              <span style={{ color: showdownData.winner.profile?.frameColor ?? '#60b8ff', fontWeight: 700 }}>
                {showdownData.winner.name}
              </span>
              {` لأن معه أعلى بطاقة (قوة ${showdownData.winner.hand[0]?.power ?? '؟'})`}
            </p>
          )}
          <button className={styles.showdownDone} onClick={handleShowdownDone}>حسناً</button>
        </div>
      </div>
    );
  }

  // Show win flash during the 1s delay before onGameOver navigates away
  if (gs.phase === 'GAME_OVER') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: winFlash ? '#fff' : '#0b1b2d', zIndex: 9999 }} />
    );
  }

  // Turn announcement screen
  if (turnAnnounce) {
    return (
      <div
        className={[styles.announceOverlay, turnAnnounce.isMe ? styles.announceMine : styles.announceAI].join(' ')}
        onClick={turnAnnounce.isMe ? () => setTurnAnnounce(null) : undefined}
      >
        <div className={styles.announceCard}>
          <Portrait
            profile={turnAnnounce.profile}
            size="human"
            isActive={false}
            isEliminated={false}
          />
          <h2 className={styles.announceName}>
            {turnAnnounce.isMe ? 'دورك!' : `دور ${turnAnnounce.name}`}
          </h2>
          {turnAnnounce.isMe ? (
            <button className={styles.announceTapBtn} onClick={() => setTurnAnnounce(null)}>
              ابدأ دورك ▶
            </button>
          ) : (
            <p className={styles.announceWait}>يبدأ خلال ثانية...</p>
          )}
        </div>
      </div>
    );
  }

  if (gs.phase === 'HAND_COVER') {
    if (isOnline || hasAI) return null; // useEffect above handles the transition
    return (
      <HandCover
        playerName={currentPlayer.name}
        onReveal={() => setGs(gs => ({ ...gs, phase: 'DRAW' }))}
      />
    );
  }

  if (gs.phase === 'PEEK_REVEAL') {
    // Online: only the active player sees the peek screen; opponent falls through to live board
    if (!isOnline || !onlineWaiting) {
      return (
        <div className={styles.peekScreen}>
          <p className={styles.peekTitle}>كرت {gs.peekTargetName}</p>
          {gs.peekCard && <CardFace card={gs.peekCard} size="large" />}
          <p className={styles.peekNote}>شوفه وحدك، لا تبيّن 😏</p>
          <button className={styles.peekDone} onClick={handlePeekDone}>فهمت</button>
        </div>
      );
    }
    // Opponent: fall through to board render (they'll see the action toast)
  }

  const isMyTurn = currentPlayer.id === humanPlayer?.id;

  const phaseLabel = (() => {
    if (gs.phase === 'DRAW')     return isMyTurn ? 'يسحب الكرت...' : 'يسحب...';
    if (gs.phase === 'AI_TURN')  return 'يفكر...';
    if (gs.phase === 'PLAY') {
      if (!isMyTurn)             return 'يختار...';
      if (focusedSource)         return 'اضغط مجدداً للعب';
      return 'اختر كرتاً للعب';
    }
    return '';
  })();

  return (
    <div className={styles.board} onClick={() => { if (focusedSource) setFocusedSource(null); setShowSettings(false); }}>

      {/* Win flash + confetti */}
      {winFlash && <div className={styles.winFlash} />}
      {winFlash && (
        <div className={styles.confettiWrap}>
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className={styles.confettiPiece} style={{ '--i': i }} />
          ))}
        </div>
      )}
      {impactFlash && <div className={styles.impactFlash} />}

      {/* ── Settings button + dropdown ── */}
      <button
        className={styles.settingsBtn}
        onClick={e => { e.stopPropagation(); SFX.buttonClick(); setShowSettings(s => !s); }}
      >⚙️</button>
      {showSettings && (
        <div className={styles.settingsPanel} onClick={e => e.stopPropagation()}>
          <button className={styles.settingItem} onClick={() => { toggleMusic(); setShowSettings(false); }}>
            <span className={styles.settingIcon}>{musicOn ? '🔊' : '🔇'}</span>
            <span>{musicOn ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}</span>
          </button>
          <button className={styles.settingItem} onClick={() => { SFX.buttonClick(); setShowGuide(true); setShowSettings(false); }}>
            <span className={styles.settingIcon}>📖</span>
            <span>دليل البطاقات</span>
          </button>
          {onQuit && (
            <button className={`${styles.settingItem} ${styles.settingQuit}`} onClick={() => { SFX.buttonClick(); stopMusic(); setShowSettings(false); onQuit(); }}>
              <span className={styles.settingIcon}>🚪</span>
              <span>الخروج من الجولة</span>
            </button>
          )}
        </div>
      )}

      {/* Online: small top banner while opponent is playing */}
      {onlineWaiting && (
        <div className={styles.onlineWaitBanner}>
          <div className={styles.onlineWaitDots}><span/><span/><span/></div>
          <span>دور {currentPlayer.name}</span>
        </div>
      )}

      {/* Online: action toast describing opponent's last move */}
      {actionToast && (
        <div className={styles.actionToast}>{actionToast}</div>
      )}

      {/* Online: disconnection overlay */}
      {isOnline && !isConnected && (
        <div className={styles.disconnectOverlay}>
          <span className={styles.disconnectIcon}>📶</span>
          <p className={styles.disconnectTitle}>انقطع الاتصال</p>
          <p className={styles.disconnectSub}>يحاول إعادة الاتصال...</p>
          <div className={styles.reconnectDots}>
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* Round indicator */}
      <div className={styles.roundBadge}>
        جولة {roundNumber}
        {tokensToWin > 1 && (
          <span className={styles.roundTokens}>
            {gs.players.map(p => {
              const t = tokens[p.id] ?? 0;
              if (t === 0) return null;
              return (
                <span key={p.id} className={styles.roundTokenDot} title={p.name}>
                  {'●'.repeat(t)}
                </span>
              );
            })}
          </span>
        )}
      </div>

      {/* ── TurnBanner ── */}
      {turnBanner && !currentBeat && (
        <div className={[
          styles.turnBanner,
          turnBanner === 'دورك!' ? styles.turnBannerMine : '',
        ].join(' ')}>
          {turnBanner}
        </div>
      )}

      {/* ── Top seat ── */}
      <div className={`${styles.topZone} ${!seats.top ? styles.empty : ''}`}>
        {seats.top && (
          <Seat player={seats.top} position="top" isActive={seats.top.id === activeId} eliminating={elimIds.has(seats.top.id)} />
        )}
      </div>

      {/* ── Left seat ── */}
      <div className={styles.leftZone}>
        {seats.left && (
          <Seat player={seats.left} position="left" isActive={seats.left.id === activeId} eliminating={elimIds.has(seats.left.id)} />
        )}
      </div>

      {/* ── Arena: deck + discard + log ── */}
      <div className={styles.arena}>
        <div className={styles.deckRow}>
          <div ref={deckRef} className={[styles.deckStack, isDrawing ? styles.deckDrawing : ''].join(' ')}>
            {gs.deck.length > 0
              ? <CardBack size="small" />
              : <div className={styles.emptyDeck}>نفد!</div>}
            <span className={styles.deckCount}>{gs.deck.length} كرت</span>
            {isDrawing && <span className={styles.drawHint}>يسحب...</span>}
          </div>
          <DiscardPile cards={gs.globalDiscard ?? []} />
        </div>
        <div className={styles.logArea}>
          <GameLog entries={gs.gameLog} players={gs.players} />
        </div>
      </div>

      {/* ── Right seat ── */}
      <div className={styles.rightZone}>
        {seats.right && (
          <Seat player={seats.right} position="right" isActive={seats.right.id === activeId} eliminating={elimIds.has(seats.right.id)} />
        )}
      </div>

      {/* ── Human zone ── */}
      <div
        className={`${styles.humanZone} ${isMyTurn && !isLocked ? styles.myTurn : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Turn HUD ── */}
        <div className={[
          styles.turnHUD,
          isMyTurn ? styles.turnHUDMine : styles.turnHUDAI,
        ].join(' ')}>
          <Portrait
            profile={currentPlayer.profile}
            size="seat"
            isActive
            isEliminated={false}
          />
          <div className={styles.turnHUDInfo}>
            <span className={styles.turnHUDName}>
              {isMyTurn
                ? <><span style={{ color: humanPlayer?.profile?.frameColor ?? '#60b8ff' }}>{humanPlayer?.name}</span>{' — دورك'}</>
                : <>{'دور '}<span style={{ color: currentPlayer.profile?.frameColor ?? '#60b8ff' }}>{currentPlayer.name}</span></>
              }
            </span>
            {phaseLabel ? (
              <span className={styles.turnHUDPhase}>{phaseLabel}</span>
            ) : null}
          </div>
          {humanPlayer?.isProtected && (
            <span className={styles.protectedBadge}>🛡️ محمي</span>
          )}
        </div>

        {isMyTurn && bustanForced && (
          <div className={styles.ruleWarning}>يجب عليك رمي صاحب البستان!</div>
        )}

        <div className={styles.hand}>
          {humanPlayer?.hand[0] && (
            <CardSlot
              label="في يدك"
              card={humanPlayer.hand[0]}
              source="hand"
              size={handCardSize}
              focused={isMyTurn && focusedSource === 'hand'}
              dimmed={isMyTurn && gs.phase === 'PLAY' && !legalPlays.includes('hand')}
              playable={isMyTurn && gs.phase === 'PLAY' && !isLocked}
              hidden={isMyTurn && flyState?.source === 'hand'}
              kickingBack={isMyTurn && kickBackSource === 'hand'}
              cardRef={handCardRef}
              onCardClick={isMyTurn ? handleCardClick : undefined}
              onInfoClick={isMyTurn ? handleInfoClick : undefined}
            />
          )}
          {isMyTurn && gs.drawnCard && (
            <CardSlot
              label="سحبته الآن"
              card={gs.drawnCard}
              source="drawn"
              size={handCardSize}
              focused={focusedSource === 'drawn'}
              dimmed={!legalPlays.includes('drawn')}
              playable={gs.phase === 'PLAY' && !isLocked}
              flipping={drawnFlipping}
              onFlipDone={() => setDrawnFlipping(false)}
              hidden={flyState?.source === 'drawn'}
              kickingBack={kickBackSource === 'drawn'}
              cardRef={drawnCardRef}
              onCardClick={handleCardClick}
              onInfoClick={handleInfoClick}
            />
          )}
          {!isMyTurn && currentBeat?.type === 'CARD_ANTICIPATE' && (
            <CardBack size={handCardSize} />
          )}
        </div>

        {gs.phase === 'PLAY' && gs.drawnCard && isMyTurn && !focusedSource && !isLocked && (
          <p className={styles.hint}>اضغط كرت لتحديده، ثم مرة ثانية للعب</p>
        )}
        {gs.phase === 'PLAY' && gs.drawnCard && isMyTurn && focusedSource && !isLocked && (
          <>
            <p className={styles.hint}>اضغط مرة ثانية للعب • ℹ️ للمعلومات</p>
            {(() => {
              const c = focusedSource === 'hand' ? currentPlayer.hand[0] : gs.drawnCard;
              return c?.ability ? (
                <div className={styles.cardHint}>{c.ability}</div>
              ) : null;
            })()}
          </>
        )}

        {/* Skip to end: shown when human is eliminated and AI are still playing */}
        {humanPlayer?.isEliminated && hasAI && gs.phase !== 'GAME_OVER' && (
          <button className={styles.skipEndBtn} onClick={handleSkipToEnd}>
            تخطي إلى النهاية ⏭
          </button>
        )}
      </div>

      {/* ── Flying card ── */}
      {flyState && (
        <FlyingCard
          key={flyState.card.uid}
          card={flyState.card}
          fromRect={flyState.fromRect}
          toRect={flyState.toRect}
          onDone={() => {
            const done = flyState.onDone;
            setFlyState(null);
            done?.();
          }}
        />
      )}

      {/* ── Narrative overlay ── */}
      <NarrativeOverlay beat={currentBeat} onConfirm={() => { SFX.confirmOk(); kickQueue(); }} players={gs.players} />

      {/* ── Action modal ── */}
      {showAction && pendingPlay && (
        <ActionModal
          type={ACTION_TYPE[pendingPlay.card.id]}
          players={gs.players}
          currentPlayerId={currentPlayer.id}
          onResolve={handleActionResolve}
        />
      )}

      {infoCard && (
        <CardInfoModal card={infoCard} onClose={() => setInfoCard(null)} />
      )}

      <GuideDrawer open={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}

// ── Card Slot ────────────────────────────────────────────────────
function CardSlot({ label, card, source, focused, dimmed, playable,
                    flipping, onFlipDone, onCardClick, onInfoClick,
                    cardRef, hidden, kickingBack, size = 'large' }) {
  return (
    <div className={styles.cardSlot}>
      <span className={styles.cardLabel}>{label}</span>
      <div
        className={[
          styles.cardWithInfo,
          hidden      ? styles.cardHidden   : '',
          kickingBack ? styles.cardKickBack : '',
        ].join(' ')}
        ref={cardRef}
      >
        {flipping ? (
          <FlipCard card={card} size={size} onDone={onFlipDone} />
        ) : (
          <CardFace
            card={card}
            size={size}
            focused={focused}
            dimmed={dimmed}
            playable={playable && !focused}
            onClick={playable ? () => onCardClick(source) : undefined}
          />
        )}
        {focused && !flipping && (
          <button className={styles.infoBtn} onClick={e => onInfoClick(source, e)}>
            ℹ️
          </button>
        )}
      </div>
    </div>
  );
}
