import { CardFace } from './Card';
import styles from './NarrativeOverlay.module.css';

export default function NarrativeOverlay({ beat, onConfirm }) {
  if (!beat) return null;
  const { type, payload } = beat;
  const needsConfirm = type === 'CARD_IMPACT'    && !payload.isAI
                    || type === 'COMPARE_REVEAL'
                    || type === 'FORCE_RESULT';

  return (
    <div className={styles.overlay} onClick={needsConfirm ? undefined : onConfirm}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>

        {type === 'AI_THINKING' && (
          <>
            <span className={styles.actorName}>{payload.name}</span>
            <span className={styles.thinkRow}>
              يفكر
              <span className={styles.dots}>
                <span /><span /><span />
              </span>
            </span>
          </>
        )}

        {type === 'CARD_ANTICIPATE' && (
          <>
            <span className={styles.actorName}>{payload.actorName}</span>
            <div className={styles.cardGlow}>
              <CardFace card={payload.card} size="normal" />
            </div>
            <span className={styles.cardName}>{payload.card.name}</span>
            <span className={styles.ability}>{payload.card.ability}</span>
          </>
        )}

        {type === 'CARD_IMPACT' && (
          <>
            <span className={styles.actorName}>{payload.actorName}</span>
            <div className={styles.cardGlow}>
              <CardFace card={payload.card} size="normal" />
            </div>
            {payload.targetName && (
              <span className={styles.targetRow}>
                {payload.hit
                  ? <span className={styles.hitText}>تخمين صحيح على {payload.targetName}!</span>
                  : payload.card.id === 1
                  ? <span className={styles.missText}>تخمين خاطئ — {payload.targetName} آمن</span>
                  : <span className={styles.targetText}>استهداف {payload.targetName}</span>
                }
              </span>
            )}
            {payload.card.id === 7 && (
              <span className={styles.missText}>رُمي مجبراً 🌿</span>
            )}
            {needsConfirm && (
              <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
            )}
          </>
        )}

        {type === 'COMPARE_REVEAL' && (
          <>
            <span className={styles.sectionLabel}>مقارنة الكروت</span>
            <div className={styles.compareRow}>
              <div className={[
                styles.compareSlot,
                payload.eliminatedName === payload.actorName ? styles.loser : '',
              ].join(' ')}>
                <CardFace card={payload.actorCard} size="normal" />
                <span className={styles.playerTag}>{payload.actorName}</span>
              </div>
              <span className={styles.vs}>VS</span>
              <div className={[
                styles.compareSlot,
                payload.eliminatedName === payload.targetName ? styles.loser : '',
              ].join(' ')}>
                <CardFace card={payload.targetCard} size="normal" />
                <span className={styles.playerTag}>{payload.targetName}</span>
              </div>
            </div>
            {payload.eliminatedName
              ? <span className={styles.hitText}>{payload.eliminatedName} يخرج!</span>
              : <span className={styles.tieText}>تعادل — لا أحد يخرج</span>
            }
            <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
          </>
        )}

        {type === 'FORCE_RESULT' && (
          <>
            <span className={styles.sectionLabel}>{payload.actorName} أجبر {payload.targetName}</span>
            <div className={styles.forceRow}>
              {payload.discardedCard
                ? <CardFace card={payload.discardedCard} size="normal" />
                : <div className={styles.unknownCard}>؟</div>
              }
              <span className={styles.arrow}>←</span>
              <div className={styles.unknownCard}>كرت جديد</div>
            </div>
            {payload.wasEliminated
              ? <span className={styles.hitText}>{payload.targetName} خرج (كانت النجمة)!</span>
              : <span className={styles.targetText}>بُدّل كرت {payload.targetName}</span>
            }
            <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
          </>
        )}

        {type === 'SWAP_VISUAL' && (
          <>
            <span className={styles.sectionLabel}>تبادل الكروت</span>
            <div className={styles.swapRow}>
              <span className={styles.swapName}>{payload.actorName}</span>
              <span className={styles.swapArrows}>⇄</span>
              <span className={styles.swapName}>{payload.targetName}</span>
            </div>
          </>
        )}

        {type === 'PROTECTION_FLASH' && (
          <>
            <div className={styles.shieldAnim}>🛡️</div>
            <span className={styles.targetText}>{payload.actorName} محمي الآن</span>
          </>
        )}

        {type === 'ELIMINATION' && (
          <div className={styles.eliminationWrap}>
            <span className={styles.eliminationIcon}>💀</span>
            <span className={styles.eliminationText}>خرج {payload.playerName}!</span>
          </div>
        )}

      </div>
    </div>
  );
}
