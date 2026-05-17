import styles from './GuessResultOverlay.module.css';

export default function GuessResultOverlay({ result }) {
  if (!result) return null;
  return (
    <div className={styles.overlay}>
      <div className={`${styles.panel} ${result.correct ? styles.correct : styles.wrong}`}>
        <span className={styles.icon}>{result.correct ? '🎯' : '😔'}</span>
        <span className={styles.title}>{result.correct ? 'أصبت!' : 'أخطأت!'}</span>
        <span className={styles.sub}>
          {result.correct
            ? `${result.targetName} أُقصي من اللعبة`
            : 'لا شيء يحدث — تابع'}
        </span>
      </div>
    </div>
  );
}
