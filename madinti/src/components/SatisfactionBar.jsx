import styles from './SatisfactionBar.module.css';

export default function SatisfactionBar({ score }) {
  const color = score >= 61 ? '#4CAF50' : score >= 31 ? '#FF9800' : '#f44336';
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>الرضا</span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${score}%`, background: color }} />
      </div>
      <span className={styles.pct}>{score}٪</span>
    </div>
  );
}
