import { CardFace } from './Card';
import styles from './AITurnOverlay.module.css';

export default function AITurnOverlay({ phase, aiName, card, logText }) {
  if (!phase) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.banner}>
        <span className={styles.name}>{aiName}</span>

        {phase === 'thinking' && (
          <span className={styles.thinking}>
            يفكر
            <span className={styles.dots}>
              <span /><span /><span />
            </span>
          </span>
        )}

        {phase === 'drawing' && (
          <span className={styles.action}>يسحب كرتاً...</span>
        )}

        {phase === 'playing' && card && (
          <div className={styles.playRow}>
            <CardFace card={card} size="normal" />
            <div className={styles.playInfo}>
              <span className={styles.plays}>يلعب</span>
              <span className={styles.cardName}>{card.name}</span>
              {logText && <span className={styles.logText}>{logText}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
