import { CardFace } from '../components/Card';
import styles from './ResultPage.module.css';

export default function ResultPage({ result, onPlayAgain, onMenu }) {
  const { winner, players } = result;
  const isDraw = !winner;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.fireworks}>🎉</div>
        <h1 className={styles.title}>
          {isDraw ? 'تعادل!' : `فاز ${winner.name}!`}
        </h1>

        {winner?.hand?.[0] && (
          <div className={styles.winCard}>
            <p className={styles.winCardLabel}>الكرت الفائز</p>
            <CardFace card={winner.hand[0]} size="large" />
          </div>
        )}

        <div className={styles.standings}>
          <p className={styles.standingsTitle}>نتائج الجولة</p>
          {players.map(p => (
            <div key={p.id} className={`${styles.row} ${p.id === winner?.id ? styles.winner : ''} ${p.isEliminated ? styles.eliminated : ''}`}>
              <span className={styles.playerName}>{p.name}</span>
              <span className={styles.status}>
                {p.id === winner?.id ? '🏆 فائز' : p.isEliminated ? '💀 مُقصى' : `${p.hand[0]?.power ?? '?'} نقطة`}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.buttons}>
          <button className={styles.playAgain} onClick={onPlayAgain}>
            جولة جديدة
          </button>
          <button className={styles.menu} onClick={onMenu}>
            القائمة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
