import { CardFace } from './Card';
import styles from './NarrativeOverlay.module.css';

const CONFIRM_TYPES = new Set([
  'CARD_IMPACT',
  'COMPARE_REVEAL',
  'FORCE_RESULT',
  'ELIMINATION',
  'SWAP_VISUAL',
  'PROTECTION_FLASH',
]);

export default function NarrativeOverlay({ beat, onConfirm }) {
  if (!beat) return null;
  const { type, payload } = beat;
  const needsConfirm = CONFIRM_TYPES.has(type);

  return (
    // ❌ لا نقر على الخلفية — فقط الأزرار تُقدّم
    <div className={styles.overlay}>
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
            <span className={styles.actorName}>{payload.actorName} يلعب</span>
            <div className={styles.cardGlow}>
              <CardFace card={payload.card} size="normal" />
            </div>
            <span className={styles.cardName}>{payload.card.role ?? payload.card.name}</span>
            <span className={styles.ability}>{payload.card.ability}</span>
            <button className={styles.skipBtn} onClick={onConfirm}>تخطى ▸</button>
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
                  ? <span className={styles.hitText}>تخمين صحيح! {payload.targetName} يخرج 🎯</span>
                  : payload.card.id === 1
                  ? <span className={styles.missText}>تخمين خاطئ — {payload.targetName} آمن 😌</span>
                  : payload.card.id === 2
                  ? <span className={styles.targetText}>شاف كرت {payload.targetName} سراً 👀</span>
                  : <span className={styles.targetText}>استهدف {payload.targetName}</span>
                }
              </span>
            )}
            {payload.card.id === 7 && (
              <span className={styles.missText}>رُمي مجبراً 🌿</span>
            )}
            <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
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
              ? <span className={styles.hitText}>{payload.eliminatedName} يخرج! ❌</span>
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
              {payload.wasEliminated
                ? <div className={styles.unknownCard}>خرج!</div>
                : <div className={styles.unknownCard}>كرت جديد</div>
              }
            </div>
            {payload.wasEliminated ? (
              <>
                <span className={styles.hitText}>{payload.targetName} خرج! ⭐</span>
                <span className={styles.ruleNote}>
                  نجمة الحي: من رُمي كرته لأي سبب يخرج فوراً
                </span>
              </>
            ) : (
              <span className={styles.targetText}>بُدّل كرت {payload.targetName}</span>
            )}
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
            <span className={styles.ability}>الكرتين تبدّلا!</span>
            <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
          </>
        )}

        {type === 'PROTECTION_FLASH' && (
          <>
            <div className={styles.shieldAnim}>🛡️</div>
            <span className={styles.cardName}>{payload.actorName} محمي الآن</span>
            <span className={styles.ability}>لا يمكن استهدافه حتى دوره القادم</span>
            <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
          </>
        )}

        {type === 'ELIMINATION' && (
          <div className={styles.eliminationWrap}>
            <span className={styles.eliminationIcon}>💀</span>
            <span className={styles.eliminationText}>خرج {payload.playerName}!</span>
            <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
          </div>
        )}

      </div>
    </div>
  );
}
