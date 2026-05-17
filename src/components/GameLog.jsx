import styles from './GameLog.module.css';

export default function GameLog({ entries }) {
  const recent = entries.slice(-4).reverse();
  return (
    <div className={styles.log}>
      {recent.map(e => (
        <div key={e.id} className={styles.entry}>
          {e.reason ?? e.text ?? JSON.stringify(e)}
        </div>
      ))}
    </div>
  );
}
