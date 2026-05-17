import styles from './EventBanner.module.css';

function fmt(n) { return Math.abs(Math.round(n)).toLocaleString('ar-SA'); }

export default function EventBanner({ event, budget, onPayToResolve }) {
  if (!event) return null;
  const canAfford = budget >= (event.recoveryCost || 0);
  const isPositive = (event.satisfactionMod || 0) > 0 || (event.budgetHit || 0) > 0;

  return (
    <div className={`${styles.banner} ${isPositive ? styles.positive : styles.negative}`}>
      <div className={styles.content}>
        <span className={styles.emoji}>{event.emoji}</span>
        <div className={styles.text}>
          <strong>{event.nameAr}</strong>
          <p>{event.descriptionAr}</p>
          <span className={styles.duration}>يبقى {event.monthsRemaining} شهر</span>
        </div>
      </div>
      {event.canPayToResolve && (
        <button
          className={`${styles.payBtn} ${!canAfford ? styles.disabled : ''}`}
          onClick={onPayToResolve}
          disabled={!canAfford}
        >
          💵 دفع {fmt(event.recoveryCost)} ر.س للحل
        </button>
      )}
    </div>
  );
}
