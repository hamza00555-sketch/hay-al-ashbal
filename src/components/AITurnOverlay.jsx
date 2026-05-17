import { CardBack } from './Card';
import styles from './AITurnOverlay.module.css';

export default function AITurnOverlay({ phase, aiName, card, logText, onDismiss }) {
  if (!phase) return null;

  return (
    <div className={styles.overlay} onClick={phase === 'playing' ? onDismiss : undefined}>
      <div className={styles.banner} onClick={e => e.stopPropagation()}>
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
          <span className={styles.action}>يسحب كرتاً من الحزمة...</span>
        )}

        {phase === 'playing' && card && (
          <>
            <div className={styles.playRow}>
              {/* card stays face-down — player never sees AI's card */}
              <div className={styles.playedCardWrap}>
                <CardBack size="normal" />
              </div>
              <div className={styles.playInfo}>
                <span className={styles.plays}>لعب كرت</span>
                <span className={styles.cardName}>{card.name}</span>
                <span className={styles.ability}>{card.ability}</span>
                {logText && <span className={styles.logText}>{logText}</span>}
              </div>
            </div>
            <button className={styles.continueBtn} onClick={onDismiss}>
              تابع ←
            </button>
          </>
        )}
      </div>
    </div>
  );
}
