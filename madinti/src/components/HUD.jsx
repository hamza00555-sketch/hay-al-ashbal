import SatisfactionBar from './SatisfactionBar.jsx';
import styles from './HUD.module.css';

function fmt(n) {
  return Math.round(n).toLocaleString('ar-SA');
}

export default function HUD({ budget, population, maxPopulation, satisfactionScore, month, autoAdvance, onToggleAuto, onAdvanceMonth, onOpenMenu }) {
  const monthName = `الشهر ${month}`;
  return (
    <div className={styles.hud}>
      <div className={styles.topRow}>
        <div className={styles.stat}>
          <span className={styles.statIcon}>💰</span>
          <span className={styles.statVal}>{fmt(budget)}</span>
          <span className={styles.statUnit}>ر.س</span>
        </div>
        <div className={styles.center}>
          <span className={styles.month}>{monthName}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statVal}>{fmt(population)}</span>
          {maxPopulation > 0 && <span className={styles.statUnit}>/{fmt(maxPopulation)}</span>}
        </div>
      </div>
      <div className={styles.bottomRow}>
        <SatisfactionBar score={satisfactionScore} />
        <div className={styles.controls}>
          <button className={styles.menuBtn} onClick={onOpenMenu} title="القائمة">☰</button>
          <button
            className={`${styles.nextBtn} ${autoAdvance ? styles.autoActive : ''}`}
            onClick={onAdvanceMonth}
          >
            {autoAdvance ? '⏸' : '▶'} التالي
          </button>
          <button
            className={`${styles.autoBtn} ${autoAdvance ? styles.autoActive : ''}`}
            onClick={onToggleAuto}
            title={autoAdvance ? 'إيقاف التلقائي' : 'تشغيل التلقائي'}
          >
            {autoAdvance ? '⏸ تلقائي' : '⏩ تلقائي'}
          </button>
        </div>
      </div>
    </div>
  );
}
