import { CardBack } from './Card';
import styles from './PlayerStatus.module.css';

export default function PlayerStatus({ players, currentPlayerId }) {
  const opponents = players.filter(p => p.id !== currentPlayerId);
  return (
    <div className={styles.row}>
      {opponents.map(p => (
        <div key={p.id} className={`${styles.player} ${p.isEliminated ? styles.eliminated : ''} ${p.id === currentPlayerId ? styles.active : ''}`}>
          <div className={styles.cardWrap}>
            {p.isEliminated
              ? <div className={styles.dead}>💀</div>
              : <CardBack size="small" />}
            {p.isProtected && !p.isEliminated && <span className={styles.shield}>🛡️</span>}
          </div>
          <span className={styles.name}>{p.name}</span>
          <span className={styles.discardCount}>{p.discardPile.length} رُمي</span>
        </div>
      ))}
    </div>
  );
}
