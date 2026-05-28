import { useState } from 'react';
import { UNIQUE_CARDS } from '../constants/cards';
import { CardFace } from './Card';
import styles from './ActionModal.module.css';

function TargetModal({ prompt, players, currentPlayerId, onResolve, allowSelf = false }) {
  const targets = players.filter(p => {
    if (p.isEliminated) return false;
    if (p.isProtected) return false;
    if (!allowSelf && p.id === currentPlayerId) return false;
    return true;
  });

  if (targets.length === 0) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <p className={styles.noTarget}>لا يوجد هدف متاح</p>
          <button className={styles.btn} onClick={() => onResolve({ skip: true })}>تخطي</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.prompt}>{prompt}</p>
        <div className={styles.targets}>
          {targets.map(p => (
            <button key={p.id} className={styles.targetBtn} onClick={() => onResolve({ targetId: p.id })}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuessModal({ players, currentPlayerId, onResolve }) {
  const guessableCards = UNIQUE_CARDS.filter(c => c.id !== 1);
  const targets = players.filter(p => !p.isEliminated && !p.isProtected && p.id !== currentPlayerId);
  // Auto-pick the only opponent; otherwise wait for a choice (step 1).
  const [targetId, setTargetId] = useState(targets.length === 1 ? targets[0].id : null);

  if (targets.length === 0) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <p className={styles.noTarget}>لا يوجد هدف متاح</p>
          <button className={styles.btn} onClick={() => onResolve({ skip: true })}>تخطي</button>
        </div>
      </div>
    );
  }

  // ── Step 1: choose the player (cards hidden) ──
  if (targetId == null) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <p className={styles.prompt}>اختر اللاعب اللي تبي تخمّن كرته</p>
          <div className={styles.targets}>
            {targets.map(p => (
              <button key={p.id} className={styles.targetBtn} onClick={() => setTargetId(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: choose the guessed card ──
  const target = targets.find(p => p.id === targetId);
  const canGoBack = targets.length > 1;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.prompt}>أي شخصية مع {target?.name}؟</p>
        <div className={styles.cardGrid}>
          {guessableCards.map(card => (
            <div
              key={card.id}
              className={styles.guessCard}
              onClick={() => onResolve({ targetId, guessedCardId: card.id })}
            >
              <CardFace card={card} size="small" />
            </div>
          ))}
        </div>
        {canGoBack && (
          <button className={styles.btnGhost} onClick={() => setTargetId(null)}>‹ تغيير اللاعب</button>
        )}
      </div>
    </div>
  );
}

export default function ActionModal({ type, players, currentPlayerId, onResolve }) {
  const PROMPTS = {
    PEEK: 'اختر لاعب تشاهد كرته',
    COMPARE: 'اختر لاعب تقارن معه',
    FORCE_DISCARD: 'اختر لاعب يبدل كرته',
    SWAP: 'اختر لاعب تبدل معه',
  };

  if (type === 'GUESS') {
    return <GuessModal players={players} currentPlayerId={currentPlayerId} onResolve={onResolve} />;
  }

  if (PROMPTS[type]) {
    return (
      <TargetModal
        prompt={PROMPTS[type]}
        players={players}
        currentPlayerId={currentPlayerId}
        onResolve={onResolve}
        allowSelf={type === 'FORCE_DISCARD'}
      />
    );
  }

  return null;
}
