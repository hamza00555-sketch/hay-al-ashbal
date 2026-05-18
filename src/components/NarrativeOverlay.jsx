import { CardFace } from './Card';
import PlayerAvatar from './PlayerAvatar';
import styles from './NarrativeOverlay.module.css';

const CONFIRM_TYPES = new Set([
  'CARD_IMPACT',
  'COMPARE_REVEAL',
  'FORCE_RESULT',
  'ELIMINATION',
  'SWAP_VISUAL',
  'PROTECTION_FLASH',
]);

function AvatarRow({ players, actorId, targetId }) {
  const actor  = players?.find(p => p.id === actorId);
  const target = players?.find(p => p.id === targetId);
  const ap = actor?.profile;
  const tp = target?.profile;
  const hasTarget = target && targetId != null && targetId !== actorId;

  if (!actor || !ap) return null;

  return (
    <div className={styles.avatarRow}>
      <div className={styles.avatarCell}>
        <PlayerAvatar
          cardImageId={ap.cardImageId}
          frameShape={ap.frameShape}
          frameColor={ap.frameColor}
          size="md"
          name={actor.name}
        />
        <span className={styles.avatarLabel}>{actor.name}</span>
      </div>
      {hasTarget && tp && (
        <>
          <span className={styles.targetArrow}>←</span>
          <div className={styles.avatarCell}>
            <PlayerAvatar
              cardImageId={tp.cardImageId}
              frameShape={tp.frameShape}
              frameColor={tp.frameColor}
              size="md"
              name={target.name}
            />
            <span className={styles.avatarLabel}>{target.name}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function NarrativeOverlay({ beat, onConfirm, players = [] }) {
  if (!beat) return null;
  const { type, payload } = beat;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>

        {type === 'AI_THINKING' && (
          <>
            <AvatarRow players={players} actorId={payload.actorId} />
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
            <AvatarRow players={players} actorId={payload.actorId} />
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
            <AvatarRow players={players} actorId={payload.actorId} targetId={payload.targetId} />
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
            <AvatarRow players={players} actorId={payload.actorId} targetId={payload.targetId} />
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
            <AvatarRow players={players} actorId={payload.actorId} targetId={payload.targetId} />
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
            <AvatarRow players={players} actorId={payload.actorId} targetId={payload.targetId} />
            <span className={styles.swapArrows}>⇄</span>
            <span className={styles.ability}>الكرتين تبدّلا!</span>
            <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
          </>
        )}

        {type === 'PROTECTION_FLASH' && (
          <>
            <AvatarRow players={players} actorId={payload.actorId} />
            <div className={styles.shieldAnim}>🛡️</div>
            <span className={styles.cardName}>{payload.actorName} محمي الآن</span>
            <span className={styles.ability}>لا يمكن استهدافه حتى دوره القادم</span>
            <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
          </>
        )}

        {type === 'ELIMINATION' && (() => {
          const elim = players?.find(p =>
            payload.playerId != null ? p.id === payload.playerId : p.name === payload.playerName
          );
          const ep = elim?.profile;
          return (
            <div className={styles.eliminationWrap}>
              {ep && (
                <PlayerAvatar
                  cardImageId={ep.cardImageId}
                  frameShape={ep.frameShape}
                  frameColor="#888"
                  size="lg"
                  name={elim.name}
                />
              )}
              <span className={styles.eliminationIcon}>💀</span>
              <span className={styles.eliminationText}>خرج {payload.playerName}!</span>
              <button className={styles.confirmBtn} onClick={onConfirm}>حسناً</button>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
