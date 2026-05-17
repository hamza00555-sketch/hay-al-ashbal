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
import PlayerStatus from '../components/PlayerStatus';
import CardInfoModal from '../components/CardInfoModal';
import AITurnOverlay from '../components/AITurnOverlay';
import { SFX, startMusic, stopMusic } from '../utils/sounds';
import styles from './GamePage.module.css';

const ACTION_TYPE = {
  1: 'GUESS',
  2: 'PEEK',
  3: 'COMPARE',
  5: 'FORCE_DISCARD',
  6: 'SWAP',
};

export default function GamePage({ config, onGameOver }) {
  const [gs, setGs] = useState(() => createInitialState(config.players));

  const [focusedSource, setFocusedSource] = useState(null);
  const [showAction, setShowAction]       = useState(false);
  const [pendingPlay, setPendingPlay]     = useState(null);
  const [infoCard, setInfoCard]           = useState(null);

  const [drawnFlipping, setDrawnFlipping] = useState(false);
  const prevDrawnRef = useRef(null);

  const [aiPhase, setAiPhase]         = useState(null);
  const [aiPlayedCard, setAiPlayedCard] = useState(null);
  const [aiLogText, setAiLogText]     = useState('');

  const [musicOn, setMusicOn] = useState(false);

  const currentPlayer = getCurrentPlayer(gs);
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
          setAiPhase('playing');
          SFX.cardPlay();

          const t3 = setTimeout(() => {
            setAiPhase(null);
            setAiPlayedCard(null);
            setAiLogText('');
            setGs(afterResolve);
          }, 1100);
          return () => clearTimeout(t3);
        }, 600);
        return () => clearTimeout(t2);
      }, 700);
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
      setGs(resolveCard(gs, pendingPlay.card, pendingPlay.source, targetId ?? null, guessedCardId ?? null));
    }
    setFocusedSource(null);
    setPendingPlay(null);
  }, [gs, pendingPlay]);

  const handlePeekDone = useCallback(() => {
    setGs(advanceTurn({ ...gs, phase: 'DONE', peekCard: null, peekTargetName: null }));
  }, [gs]);

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

  return (
    <div className={styles.board} onClick={() => focusedSource && setFocusedSource(null)}>

      <button className={styles.musicBtn} onClick={toggleMusic} title={musicOn ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}>
        {musicOn ? '🔊' : '🔇'}
      </button>

      <div className={styles.top}>
        <PlayerStatus players={gs.players} currentPlayerId={currentPlayer.id} />
      </div>

      <div className={styles.middle}>
        <div className={styles.deckArea}>
          <div className={styles.deckStack}>
            {gs.deck.length > 0 ? <CardBack /> : <div className={styles.emptyDeck}>نفد!</div>}
            <span className={styles.deckCount}>{gs.deck.length}</span>
          </div>
        </div>
        <div className={styles.logArea}>
          <GameLog entries={gs.gameLog} />
        </div>
      </div>

      <div className={styles.bottom} onClick={e => e.stopPropagation()}>
        <div className={styles.turnLabel}>
          دور: <strong>{currentPlayer.name}</strong>
          {currentPlayer.isProtected && <span className={styles.protectedBadge}>🛡️ محمي</span>}
        </div>
        {bustanForced && (
          <div className={styles.ruleWarning}>يجب عليك رمي صاحب البستان!</div>
        )}
        <div className={styles.hand}>
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
        </div>
        {gs.phase === 'PLAY' && gs.drawnCard && !focusedSource && (
          <p className={styles.hint}>اضغط كرت لتحديده، ثم مرة ثانية للعب</p>
        )}
        {gs.phase === 'PLAY' && gs.drawnCard && focusedSource && (
          <p className={styles.hint}>اضغط مرة ثانية للعب • اضغط ℹ️ للمعلومات</p>
        )}
      </div>

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
        aiName={gs.players.find(p => p.isAI)?.name ?? 'AI'}
        card={aiPlayedCard}
        logText={aiLogText}
      />

      {infoCard && (
        <CardInfoModal card={infoCard} onClose={() => setInfoCard(null)} />
      )}
    </div>
  );
}

function CardSlot({ label, card, source, focused, dimmed, playable, flipping, onFlipDone, onCardClick, onInfoClick }) {
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
