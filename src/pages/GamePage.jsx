import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { buildNarrative } from '../engine/narrativeBuilder';
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

      <span className={styles.seatName}>{player.name}</span>
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
  config, onGameOver, roundNumber = 1, tokensToWin = 1, tokens = {},
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
  const [pendingGs,   setPendingGs]   = useState(null);
  const beatQueueRef  = useRef([]);
  const narrativeTimer = useRef(null);

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

  const [musicOn,      setMusicOn]     = useState(true);
  const [showGuide,    setShowGuide]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [elimIds,     setElimIds]     = useState(new Set());
  const [winFlash,    setWinFlash]    = useState(false);
  const prevPlayersRef  = useRef(null);

  const currentPlayer = getCurrentPlayer(gs);
  const hasAI         = gs.players.some(p => p.isAI);
  // In online mode, "human" is the player at myPlayerIdx; otherwise use existing logic
  const humanPlayer   = isOnline
    ? gs.players[myPlayerIdx]
    : (hasAI ? gs.players.find(p => !p.isAI) : currentPlayer);

  const legalPlays   = gs.drawnCard ? getLegalPlays(currentPlayer.hand[0], gs.drawnCard) : [];
  const bustanForced = gs.drawnCard ? mustPlayBustan(currentPlayer.hand[0], gs.drawnCard) : false;

  const seats    = assignSeats(gs.players, humanPlayer?.id ?? gs.players[0]?.id);
  const activeId = gs.players[gs.currentPlayerIndex]?.id;

  // isLocked: narrative playing OR fly animation OR waiting for online opponent
  const onlineWaiting = isOnline && currentPlayer.id !== humanPlayer?.id;
  const isLocked = !!currentBeat || !!flyState || onlineWaiting;

  // ── Narrative queue driver ───────────────────────────────────
  function kickQueue() {
    clearTimeout(narrativeTimer.current);
    const q = beatQueueRef.current;
    if (q.length === 0) {
      setCurrentBeat(null);
      setPendingGs(prev => {
        if (prev) setGs(prev);
        return null;
      });
      return;
    }
    const [next, ...rest] = q;
    beatQueueRef.current = rest;
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
    setCurrentBeat(next);
    if (next.durationMs > 0) {
      narrativeTimer.current = setTimeout(kickQueue, next.durationMs);
    }
  }

  function pushNarrative(beats, nextState) {
    // Stamp version for online sync
    const stamped = isOnline ? { ...nextState, _v: (nextState._v ?? 0) + 1 } : nextState;
    clearTimeout(narrativeTimer.current);
    beatQueueRef.current = beats;
    setPendingGs(stamped);
    kickQueue();
  }

  // Cleanup timers on unmount
  useEffect(() => {
    startMusic(); // auto-start on game load
    return () => {
      clearTimeout(narrativeTimer.current);
      clearTimeout(announceTimer.current);
    };
  }, []);

  // ── Online: sync gs to Firebase after every change (host only) ──
  const lastSyncedV = useRef(-1);
  useEffect(() => {
    if (!isOnline || !isHost || !roomCode) return;
    const v = gs._v ?? 0;
    if (v === lastSyncedV.current) return;
    lastSyncedV.current = v;
    writeGameState(roomCode, gs).catch(e => console.warn('[sync]', e));
  }, [gs, isOnline, isHost, roomCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online: receive gs from Firebase (non-host, or guest receiving host updates) ──
  const lastReceivedV = useRef(-1);
  useEffect(() => {
    if (!isOnline || isHost || !roomCode) return;
    const unsub = listenRoom(roomCode, room => {
      if (!room?.state) return;
      const incoming = room.state;
      const v = incoming._v ?? 0;
      if (v <= lastReceivedV.current) return;
      lastReceivedV.current = v;
      // Don't update if narrative is playing (wait for it to finish)
      if (beatQueueRef.current.length === 0 && !currentBeat) {
        setGs(sanitizeGs(incoming));
      }
    });
    return () => unsub();
  }, [isOnline, isHost, roomCode]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (isMe) SFX.turnHuman(); else SFX.turnAI();
    setTurnAnnounce({ name: cp.name, profile: cp.profile, isMe, isAI: cp.isAI });

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
    if (turnAnnounce) return; // wait until announcement is dismissed

    if (gs.phase === 'GAME_OVER') {
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
      pushNarrative(beats, nextGsRaw);
      return;
    }

    if (gs.phase === 'DRAW' && !currentPlayer.isAI) {
      // Online: only draw if it's my turn (I'm the current player)
      if (isOnline && onlineWaiting) return;
      SFX.cardDraw();      setIsDrawing(true);
      const t = setTimeout(() => {
        setIsDrawing(false);
        setGs(prev => {
          const next = { ...doDrawCard(prev), _v: (prev._v ?? 0) + 1 };
          return next;
        });
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
          pushNarrative(beats, nextGsRaw);
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
      setGs(advanceTurn(gs));
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
    pushNarrative(beats, nextGsRaw);
    setFocusedSource(null);
    setPendingPlay(null);
  }, [gs, pendingPlay, currentPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeekDone = useCallback(() => {
    const next = advanceTurn({ ...gs, phase: 'DONE', peekCard: null, peekTargetName: null });
    // Increment _v so host sync effect writes post-peek state to Firebase
    setGs(isOnline ? { ...next, _v: (next._v ?? 0) + 1 } : next);
  }, [gs, isOnline]);

  const toggleMusic = () => {
    SFX.buttonClick();
    if (musicOn) { stopMusic(); setMusicOn(false); }
    else { startMusic(); setMusicOn(true); }
  };

  // ── Render guards ────────────────────────────────────────────
  if (gs.phase === 'GAME_OVER') return null;

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
    // Online: skip hand-cover (each player is on their own device, no need to hide screen)
    if (isOnline) {
      setTimeout(() => setGs(prev => prev.phase === 'HAND_COVER'
        ? { ...prev, phase: 'DRAW' } : prev), 0);
      return null;
    }
    return (
      <HandCover
        playerName={currentPlayer.name}
        onReveal={() => setGs(gs => ({ ...gs, phase: 'DRAW' }))}
      />
    );
  }

  if (gs.phase === 'PEEK_REVEAL') {
    // Online guest: shouldn't see the host's peeked card — show waiting overlay
    if (isOnline && onlineWaiting) {
      return (
        <div className={styles.onlineWaitOverlay} style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,25,50,0.9)' }}>
          <div className={styles.onlineWaitDots}><span/><span/><span/></div>
          <p style={{ color: '#fff', marginTop: 12 }}>دور {currentPlayer.name}...</p>
        </div>
      );
    }
    return (
      <div className={styles.peekScreen}>
        <p className={styles.peekTitle}>كرت {gs.peekTargetName}</p>
        {gs.peekCard && <CardFace card={gs.peekCard} size="large" />}
        <p className={styles.peekNote}>شوفه وحدك، لا تبيّن 😏</p>
        <button className={styles.peekDone} onClick={handlePeekDone}>فهمت</button>
      </div>
    );
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
        </div>
      )}

      {/* Online: waiting for opponent overlay */}
      {onlineWaiting && !currentBeat && (
        <div className={styles.onlineWaitOverlay}>
          <div className={styles.onlineWaitDots}><span/><span/><span/></div>
          <p>دور {currentPlayer.name}...</p>
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
              ? <CardBack />
              : <div className={styles.emptyDeck}>نفد!</div>}
            <span className={styles.deckCount}>{gs.deck.length} كرت</span>
            {isDrawing && <span className={styles.drawHint}>يسحب...</span>}
          </div>
          <DiscardPile cards={gs.globalDiscard ?? []} />
        </div>
        <div className={styles.logArea}>
          <GameLog entries={gs.gameLog} />
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
              {isMyTurn ? `${humanPlayer?.name} — دورك` : `دور ${currentPlayer.name}`}
            </span>
            {phaseLabel ? (
              <span className={styles.turnHUDPhase}>{phaseLabel}</span>
            ) : null}
          </div>
          {humanPlayer?.isProtected && (
            <span className={styles.protectedBadge}>🛡️ محمي</span>
          )}
        </div>

        {bustanForced && (
          <div className={styles.ruleWarning}>يجب عليك رمي صاحب البستان!</div>
        )}

        <div className={styles.hand}>
          {isMyTurn ? (
            <>
              <CardSlot
                label="في يدك"
                card={currentPlayer.hand[0]}
                source="hand"
                focused={focusedSource === 'hand'}
                dimmed={gs.phase === 'PLAY' && !legalPlays.includes('hand')}
                playable={gs.phase === 'PLAY' && !isLocked}
                hidden={flyState?.source === 'hand'}
                kickingBack={kickBackSource === 'hand'}
                cardRef={handCardRef}
                onCardClick={handleCardClick}
                onInfoClick={handleInfoClick}
              />
              {gs.drawnCard && (
                <CardSlot
                  label="سحبته الآن"
                  card={gs.drawnCard}
                  source="drawn"
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
            </>
          ) : (
            <div className={styles.aiHandCover}>
              <CardBack size="large" />
              {currentBeat?.type === 'CARD_ANTICIPATE' && <CardBack size="large" />}
            </div>
          )}
        </div>

        {gs.phase === 'PLAY' && gs.drawnCard && isMyTurn && !focusedSource && !isLocked && (
          <p className={styles.hint}>اضغط كرت لتحديده، ثم مرة ثانية للعب</p>
        )}
        {gs.phase === 'PLAY' && gs.drawnCard && isMyTurn && focusedSource && !isLocked && (
          <p className={styles.hint}>اضغط مرة ثانية للعب • ℹ️ للمعلومات</p>
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
                    cardRef, hidden, kickingBack }) {
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
          <FlipCard card={card} size="large" onDone={onFlipDone} />
        ) : (
          <CardFace
            card={card}
            size="large"
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
