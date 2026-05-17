import { useState, useEffect, useCallback, useRef } from 'react';
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
import { CardFace, CardBack, FlipCard } from '../components/Card';
import ActionModal from '../components/ActionModal';
import HandCover from '../components/HandCover';
import GameLog from '../components/GameLog';
import CardInfoModal from '../components/CardInfoModal';
import AITurnOverlay from '../components/AITurnOverlay';
import GuessResultOverlay from '../components/GuessResultOverlay';
import { SFX, startMusic, stopMusic } from '../utils/sounds';
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

// ── Seat component ───────────────────────────────────────────────
function Seat({ player, position, isActive }) {
  return (
    <div className={[
      styles.seat,
      styles[`seat_${position}`],
      isActive            ? styles.seatActive : '',
      player.isEliminated ? styles.seatDead   : '',
    ].join(' ')}>

      {isActive && !player.isEliminated && (
        <div className={styles.activePing} />
      )}

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
    </div>
  );
}

// ── Flying card: Yu-Gi-Oh! parabolic arc with glow ───────────────
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

    const DURATION = 680;
    let startTs = null;
    let raf;

    function frame(ts) {
      if (!startTs) startTs = ts;
      const t = Math.min((ts - startTs) / DURATION, 1);

      // Parabolic arc: card rises then descends
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
export default function GamePage({ config, onGameOver }) {
  const [gs, setGs] = useState(() => createInitialState(config.players));

  const [focusedSource, setFocusedSource] = useState(null);
  const [showAction, setShowAction]       = useState(false);
  const [pendingPlay, setPendingPlay]     = useState(null);
  const [infoCard, setInfoCard]           = useState(null);
  const [guessResult, setGuessResult]     = useState(null);
  const [flyState, setFlyState]           = useState(null);

  const [drawnFlipping, setDrawnFlipping] = useState(false);
  const prevDrawnRef = useRef(null);

  const [aiPhase, setAiPhase]               = useState(null);
  const [aiPlayedCard, setAiPlayedCard]     = useState(null);
  const [aiLogText, setAiLogText]           = useState('');
  const [aiPendingState, setAiPendingState] = useState(null);

  const [musicOn, setMusicOn] = useState(false);

  // Refs for fly animation
  const handCardRef  = useRef(null);
  const drawnCardRef = useRef(null);
  const deckRef      = useRef(null);

  const currentPlayer = getCurrentPlayer(gs);
  const hasAI         = gs.players.some(p => p.isAI);
  const humanPlayer   = hasAI ? gs.players.find(p => !p.isAI) : currentPlayer;

  const legalPlays   = gs.drawnCard ? getLegalPlays(currentPlayer.hand[0], gs.drawnCard) : [];
  const bustanForced = gs.drawnCard ? mustPlayBustan(currentPlayer.hand[0], gs.drawnCard) : false;

  const seats    = assignSeats(gs.players, humanPlayer?.id ?? gs.players[0]?.id);
  const activeId = gs.players[gs.currentPlayerIndex]?.id;

  // Flip animation when drawnCard first appears
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

  // Auto-dismiss guess result after 2.8s
  useEffect(() => {
    if (!guessResult) return;
    const t = setTimeout(() => setGuessResult(null), 2800);
    return () => clearTimeout(t);
  }, [guessResult]);

  // Main phase driver
  useEffect(() => {
    if (gs.phase === 'GAME_OVER') {
      SFX.win();
      stopMusic();
      onGameOver({ winner: gs.winner, players: gs.players, log: gs.gameLog });
      return;
    }

    if (gs.phase === 'AI_TURN') {
      setAiPhase('thinking');
      SFX.aiThink();
      const t1 = setTimeout(() => {
        const afterDraw = doDrawCard(gs);
        setAiPhase('drawing');
        SFX.cardDraw();
        const t2 = setTimeout(() => {
          const { state: afterResolve, playedCard } = computeAIMove(afterDraw);
          const lastLog = afterResolve.gameLog[afterResolve.gameLog.length - 1];
          setAiPlayedCard(playedCard);
          setAiLogText(lastLog?.text ?? '');
          setAiPendingState(afterResolve);
          setAiPhase('playing');
          SFX.cardPlay();
        }, 1200);
        return () => clearTimeout(t2);
      }, 1600);
      return () => clearTimeout(t1);
    }

    if (gs.phase === 'DRAW' && !currentPlayer.isAI) {
      SFX.cardDraw();
      const t = setTimeout(() => setGs(doDrawCard), 300);
      return () => clearTimeout(t);
    }
  }, [gs.phase, gs.currentPlayerIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCardClick = useCallback((source) => {
    if (flyState) return; // animation in progress
    if (!legalPlays.includes(source)) return;

    if (focusedSource === source) {
      const card       = source === 'hand' ? currentPlayer.hand[0] : gs.drawnCard;
      const actionType = ACTION_TYPE[card.id];
      SFX.cardPlay();

      const fromRef  = source === 'hand' ? handCardRef : drawnCardRef;
      const fromRect = fromRef.current?.getBoundingClientRect();
      const toRect   = deckRef.current?.getBoundingClientRect();

      const doPlay = () => {
        if (!actionType) {
          setGs(prev => resolveCard(prev, card, source, null, null));
        } else {
          setPendingPlay({ card, source });
          setShowAction(true);
        }
        setFocusedSource(null);
      };

      if (fromRect && toRect) {
        setFlyState({ card, source, fromRect, toRect, onDone: doPlay });
      } else {
        doPlay();
      }
    } else {
      SFX.cardSelect();
      setFocusedSource(source);
    }
  }, [gs, legalPlays, currentPlayer, focusedSource, flyState]);

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
    } else {
      const isGuess    = pendingPlay.card.id === 1 && targetId != null;
      const targetBefore = isGuess ? gs.players.find(p => p.id === targetId) : null;

      const nextGs = resolveCard(
        gs, pendingPlay.card, pendingPlay.source,
        targetId ?? null, guessedCardId ?? null
      );

      if (isGuess && targetBefore) {
        const targetAfter = nextGs.players.find(p => p.id === targetId);
        const correct = !targetBefore.isEliminated && targetAfter?.isEliminated;
        setGuessResult({ correct, targetName: targetBefore.name });
        if (correct) SFX.eliminate();
      }

      setGs(nextGs);
    }
    setFocusedSource(null);
    setPendingPlay(null);
  }, [gs, pendingPlay]);

  const handlePeekDone = useCallback(() => {
    setGs(advanceTurn({ ...gs, phase: 'DONE', peekCard: null, peekTargetName: null }));
  }, [gs]);

  const handleAiDismiss = useCallback(() => {
    if (!aiPendingState) return;
    SFX.buttonClick();
    setAiPhase(null);
    setAiPlayedCard(null);
    setAiLogText('');
    setGs(aiPendingState);
    setAiPendingState(null);
  }, [aiPendingState]);

  const toggleMusic = (e) => {
    e.stopPropagation();
    SFX.buttonClick();
    if (musicOn) { stopMusic(); setMusicOn(false); }
    else { startMusic(); setMusicOn(true); }
  };

  if (gs.phase === 'GAME_OVER') return null;

  if (gs.phase === 'HAND_COVER') {
    return (
      <HandCover
        playerName={currentPlayer.name}
        onReveal={() => setGs(gs => ({ ...gs, phase: 'DRAW' }))}
      />
    );
  }

  if (gs.phase === 'PEEK_REVEAL') {
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

  return (
    <div className={styles.board} onClick={() => focusedSource && setFocusedSource(null)}>

      <button className={styles.musicBtn} onClick={toggleMusic}>
        {musicOn ? '🔊' : '🔇'}
      </button>

      {/* ── Top seat ── */}
      <div className={`${styles.topZone} ${!seats.top ? styles.empty : ''}`}>
        {seats.top && (
          <Seat player={seats.top} position="top" isActive={seats.top.id === activeId} />
        )}
      </div>

      {/* ── Left seat ── */}
      <div className={styles.leftZone}>
        {seats.left && (
          <Seat player={seats.left} position="left" isActive={seats.left.id === activeId} />
        )}
      </div>

      {/* ── Arena: deck + log ── */}
      <div className={styles.arena}>
        <div ref={deckRef} className={styles.deckStack}>
          {gs.deck.length > 0
            ? <CardBack />
            : <div className={styles.emptyDeck}>نفد!</div>}
          <span className={styles.deckCount}>{gs.deck.length} كرت</span>
        </div>
        <div className={styles.logArea}>
          <GameLog entries={gs.gameLog} />
        </div>
      </div>

      {/* ── Right seat ── */}
      <div className={styles.rightZone}>
        {seats.right && (
          <Seat player={seats.right} position="right" isActive={seats.right.id === activeId} />
        )}
      </div>

      {/* ── Human zone ── */}
      <div
        className={`${styles.humanZone} ${isMyTurn ? styles.myTurn : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.turnLabel}>
          {isMyTurn
            ? <span className={styles.myTurnBadge}>دورك ▼</span>
            : <span>دور: <strong>{currentPlayer.name}</strong></span>
          }
          {currentPlayer.isProtected && (
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
                label="كرتك"
                card={currentPlayer.hand[0]}
                source="hand"
                focused={focusedSource === 'hand'}
                dimmed={gs.phase === 'PLAY' && !legalPlays.includes('hand')}
                playable={gs.phase === 'PLAY'}
                hidden={flyState?.source === 'hand'}
                cardRef={handCardRef}
                onCardClick={handleCardClick}
                onInfoClick={handleInfoClick}
              />
              {gs.drawnCard && (
                <CardSlot
                  label="المسحوب"
                  card={gs.drawnCard}
                  source="drawn"
                  focused={focusedSource === 'drawn'}
                  dimmed={!legalPlays.includes('drawn')}
                  playable={gs.phase === 'PLAY'}
                  flipping={drawnFlipping}
                  onFlipDone={() => setDrawnFlipping(false)}
                  hidden={flyState?.source === 'drawn'}
                  cardRef={drawnCardRef}
                  onCardClick={handleCardClick}
                  onInfoClick={handleInfoClick}
                />
              )}
            </>
          ) : (
            <div className={styles.aiHandCover}>
              <CardBack size="large" />
              {aiPhase === 'playing' && <CardBack size="large" />}
            </div>
          )}
        </div>

        {gs.phase === 'PLAY' && gs.drawnCard && isMyTurn && !focusedSource && (
          <p className={styles.hint}>اضغط كرت لتحديده، ثم مرة ثانية للعب</p>
        )}
        {gs.phase === 'PLAY' && gs.drawnCard && isMyTurn && focusedSource && (
          <p className={styles.hint}>اضغط مرة ثانية للعب • ℹ️ للمعلومات</p>
        )}
      </div>

      {/* ── Flying card (Yu-Gi-Oh! arc animation) ── */}
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

      {/* ── Modals & overlays ── */}
      {showAction && pendingPlay && (
        <ActionModal
          type={ACTION_TYPE[pendingPlay.card.id]}
          players={gs.players}
          currentPlayerId={currentPlayer.id}
          onResolve={handleActionResolve}
        />
      )}

      <AITurnOverlay
        phase={aiPhase}
        aiName={gs.players[gs.currentPlayerIndex]?.name ?? 'AI'}
        card={aiPlayedCard}
        logText={aiLogText}
        onDismiss={handleAiDismiss}
      />

      <GuessResultOverlay result={guessResult} />

      {infoCard && (
        <CardInfoModal card={infoCard} onClose={() => setInfoCard(null)} />
      )}
    </div>
  );
}

// ── Card Slot ────────────────────────────────────────────────────
function CardSlot({ label, card, source, focused, dimmed, playable,
                    flipping, onFlipDone, onCardClick, onInfoClick,
                    cardRef, hidden }) {
  return (
    <div className={styles.cardSlot}>
      <span className={styles.cardLabel}>{label}</span>
      <div
        className={`${styles.cardWithInfo} ${hidden ? styles.cardHidden : ''}`}
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
