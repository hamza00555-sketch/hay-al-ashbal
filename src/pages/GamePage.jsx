import { useState, useEffect, useCallback } from 'react';
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
import { CardFace, CardBack } from '../components/Card';
import ActionModal from '../components/ActionModal';
import HandCover from '../components/HandCover';
import GameLog from '../components/GameLog';
import PlayerStatus from '../components/PlayerStatus';
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
  const [selectedSource, setSelectedSource] = useState(null);
  const [showAction, setShowAction] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(null);

  const currentPlayer = getCurrentPlayer(gs);
  const legalPlays = gs.drawnCard
    ? getLegalPlays(currentPlayer.hand[0], gs.drawnCard)
    : [];
  const bustanForced = gs.drawnCard
    ? mustPlayBustan(currentPlayer.hand[0], gs.drawnCard)
    : false;

  useEffect(() => {
    if (gs.phase === 'GAME_OVER') {
      onGameOver({ winner: gs.winner, players: gs.players, log: gs.gameLog });
      return;
    }

    if (gs.phase === 'AI_TURN') {
      const delay = setTimeout(() => {
        const afterDraw = doDrawCard(gs);
        const afterResolve = computeAIMove(afterDraw);
        setGs(afterResolve);
      }, 900);
      return () => clearTimeout(delay);
    }

    if (gs.phase === 'DRAW' && !currentPlayer.isAI) {
      const t = setTimeout(() => setGs(doDrawCard), 300);
      return () => clearTimeout(t);
    }
  }, [gs.phase, gs.currentPlayerIndex]);

  const handleCardSelect = useCallback((source) => {
    if (!legalPlays.includes(source)) return;
    const card = source === 'hand' ? currentPlayer.hand[0] : gs.drawnCard;
    const actionType = ACTION_TYPE[card.id];

    if (!actionType) {
      const next = resolveCard(gs, card, source, null, null);
      setGs(next);
      setSelectedSource(null);
    } else {
      setSelectedSource(source);
      setPendingPlay({ card, source });
      setShowAction(true);
    }
  }, [gs, legalPlays, currentPlayer]);

  const handleActionResolve = useCallback(({ targetId, guessedCardId, skip }) => {
    setShowAction(false);
    if (skip || !pendingPlay) {
      const next = advanceTurn(gs);
      setGs(next);
    } else {
      const next = resolveCard(gs, pendingPlay.card, pendingPlay.source, targetId ?? null, guessedCardId ?? null);
      setGs(next);
    }
    setSelectedSource(null);
    setPendingPlay(null);
  }, [gs, pendingPlay]);

  const handlePeekDone = useCallback(() => {
    const next = advanceTurn({ ...gs, phase: 'DONE', peekCard: null, peekTargetName: null });
    setGs(next);
  }, [gs]);

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

  const opponents = gs.players.filter(p => p.id !== currentPlayer.id);

  return (
    <div className={styles.board}>
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

      <div className={styles.bottom}>
        <div className={styles.turnLabel}>
          دور: <strong>{currentPlayer.name}</strong>
          {currentPlayer.isProtected && <span className={styles.protectedBadge}>🛡️ محمي</span>}
        </div>
        {bustanForced && (
          <div className={styles.ruleWarning}>يجب عليك رمي صاحب البستان!</div>
        )}
        <div className={styles.hand}>
          <div className={styles.cardSlot}>
            <span className={styles.cardLabel}>كرتك</span>
            <CardFace
              card={currentPlayer.hand[0]}
              size="large"
              selected={selectedSource === 'hand'}
              dimmed={gs.phase === 'PLAY' && !legalPlays.includes('hand')}
              onClick={gs.phase === 'PLAY' ? () => handleCardSelect('hand') : undefined}
            />
          </div>
          {gs.drawnCard && (
            <div className={styles.cardSlot}>
              <span className={styles.cardLabel}>المسحوب</span>
              <CardFace
                card={gs.drawnCard}
                size="large"
                selected={selectedSource === 'drawn'}
                dimmed={!legalPlays.includes('drawn')}
                onClick={() => handleCardSelect('drawn')}
              />
            </div>
          )}
        </div>
        {gs.phase === 'PLAY' && !gs.drawnCard && (
          <p className={styles.hint}>جاري السحب...</p>
        )}
        {gs.phase === 'PLAY' && gs.drawnCard && (
          <p className={styles.hint}>اختر كرت تلعبه</p>
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
    </div>
  );
}
