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

// ── Seating helpers ──────────────────────────────────────────────
// From human's perspective, going clockwise: right → top → left
const POSITION_MAP = {
  1: ['top'],
  2: ['right', 'left'],
  3: ['right', 'top', 'left'],
};

function Seat({ player, position, isActive }) {
  return (
    <div className={[
      styles.seat,
      styles[`seat_${position}`],
      isActive      ? styles.seatActive    : '',
      player.isEliminated ? styles.seatDead : '',
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

function SeatingArea({ players, humanId, activePlayerIndex }) {
  const humanIdx = players.findIndex(p => p.id === humanId);

  // collect opponents in clockwise order starting right of human
  const opponents = [];
  for (let step = 1; step < players.length; step++) {
    opponents.push(players[(humanIdx + step) % players.length]);
  }

  const positions = POSITION_MAP[opponents.length] ?? ['top'];

  return (
    <div className={`${styles.seatingArea} ${styles[`seats${opponents.length}`]}`}>
      {opponents.map((p, i) => (
        <Seat
          key={p.id}
          player={p}
          position={positions[i]}
          isActive={players[activePlayerIndex]?.id === p.id}
        />
      ))}
    </div>
  );
}

// ── Main GamePage ────────────────────────────────────────────────
export default function GamePage({ config, onGameOver }) {
  const [gs, setGs] = useState(() => createInitialState(config.players));

  const [focusedSource, setFocusedSource]     = useState(null);
  const [showAction, setShowAction]           = useState(false);
  const [pendingPlay, setPendingPlay]         = useState(null);
  const [infoCard, setInfoCard]               = useState(null);
  const [guessResult, setGuessResult]         = useState(null);

  const [drawnFlipping, setDrawnFlipping]     = useState(false);
  const prevDrawnRef = useRef(null);

  const [aiPhase, setAiPhase]                 = useState(null);
  const [aiPlayedCard, setAiPlayedCard]       = useState(null);
  const [aiLogText, setAiLogText]             = useState('');
  const [aiPendingState, setAiPendingState]   = useState(null);

  const [musicOn, setMusicOn] = useState(false);

  const currentPlayer = getCurrentPlayer(gs);
  const hasAI    = gs.players.some(p => p.isAI);
  const humanPlayer = hasAI
    ? gs.players.find(p => !p.isAI)
    : currentPlayer;

  const legalPlays = gs.drawnCard
    ? getLegalPlays(currentPlayer.hand[0], gs.drawnCard)
    : [];
  const bustanForced = gs.drawnCard
    ? mustPlayBustan(currentPlayer.hand[0], gs.drawnCard)
    : false;

  // flip animation when drawnCard first appears
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

  // auto-dismiss guess result after 2.8s
  useEffect(() => {
    if (!guessResult) return;
    const t = setTimeout(() => setGuessResult(null), 2800);
    return () => clearTimeout(t);
  }, [guessResult]);

  // main phase effect
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
          // waits for user to tap "تابع"
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
  }, [gs.phase, gs.currentPlayerIndex]);

  const handleCardClick = useCallback((source) => {
    if (!legalPlays.includes(source)) return;

    if (focusedSource === source) {
      const card = source === 'hand' ? currentPlayer.hand[0] : gs.drawnCard;
      const actionType = ACTION_TYPE[card.id];
      SFX.cardPlay();
      if (!actionType) {
        setGs(resolveCard(gs, card, source, null, null));
        setFocusedSource(null);
      } else {
        setPendingPlay({ card, source });
        setShowAction(true);
        setFocusedSource(null);
      }
    } else {
      SFX.cardSelect();
      setFocusedSource(source);
    }
  }, [gs, legalPlays, currentPlayer, focusedSource]);

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
      // detect guess result before applying state
      const isGuess = pendingPlay.card.id === 1 && targetId != null;
      const targetBefore = isGuess
        ? gs.players.find(p => p.id === targetId)
        : null;

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

      {/* ── opponents seating ── */}
      <SeatingArea
        players={gs.players}
        humanId={humanPlayer?.id ?? 0}
        activePlayerIndex={gs.currentPlayerIndex}
      />

      {/* ── middle: deck + log ── */}
      <div className={styles.middle}>
        <div className={styles.deckStack}>
          {gs.deck.length > 0
            ? <CardBack />
            : <div className={styles.emptyDeck}>نفد!</div>}
          <span className={styles.deckCount}>{gs.deck.length} كرت</span>
        </div>
        <div className={styles.logArea}>
          <GameLog entries={gs.gameLog} />
        </div>
      </div>

      {/* ── human player area ── */}
      <div
        className={`${styles.bottom} ${isMyTurn ? styles.myTurn : ''}`}
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
                  onCardClick={handleCardClick}
                  onInfoClick={handleInfoClick}
                />
              )}
            </>
          ) : (
            /* AI turn — show covered cards only */
            <div className={styles.aiHandCover}>
              <CardBack size="large" />
              {/* show second covered card if AI is in play phase */}
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

      {/* ── modals & overlays ── */}
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
                    flipping, onFlipDone, onCardClick, onInfoClick }) {
  return (
    <div className={styles.cardSlot}>
      <span className={styles.cardLabel}>{label}</span>
      <div className={styles.cardWithInfo}>
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
