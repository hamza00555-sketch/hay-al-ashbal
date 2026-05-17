import { useState } from 'react';
import { CARDS } from '../constants/cards';
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
  const guessableCards = CARDS.filter(c => c.id !== 1);
  const targets = players.filter(p => !p.isEliminated && !p.isProtected && p.id !== currentPlayerId);
  const [targetId, setTargetId] = useState(targets[0]?.id ?? null);

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
        <p className={styles.prompt}>اختر لاعب وخمّن كرته</p>
        <div className={styles.targets}>
          {targets.map(p => (
            <button
              key={p.id}
              className={`${styles.targetBtn} ${targetId === p.id ? styles.active : ''}`}
              onClick={() => setTargetId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className={styles.subPrompt}>أي شخصية معه؟</p>
        <div className={styles.cardGrid}>
          {guessableCards.map(card => (
            <div
              key={card.id}
              className={styles.guessCard}
              onClick={() => targetId && onResolve({ targetId, guessedCardId: card.id })}
            >
              <CardFace card={card} size="small" />
            </div>
          ))}
        </div>
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
