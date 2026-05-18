import { CardFace } from '../components/Card';
import styles from './ResultPage.module.css';

export default function ResultPage({ result, tokens, tokensToWin, onNewMatch, onMenu }) {
  const { winner, players } = result;
  const isDraw = !winner;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.fireworks}>🏆</div>
        <p className={styles.eyebrow}>{isDraw ? 'تعادل في المباراة!' : 'فائز المباراة'}</p>
        <h1 className={styles.title}>
          {isDraw ? 'تعادل!' : `${winner.name}!`}
        </h1>

        {winner?.hand?.[0] && (
          <div className={styles.winCard}>
            <p className={styles.winCardLabel}>الكرت الفائز</p>
            <CardFace card={winner.hand[0]} size="large" />
          </div>
        )}

        <div className={styles.standings}>
          <p className={styles.standingsTitle}>الأوسمة النهائية</p>
          {players.map(p => {
            const count = tokens[p.id] ?? 0;
            return (
              <div key={p.id} className={`${styles.row} ${p.id === winner?.id ? styles.winner : ''}`}>
                <span className={styles.playerName}>{p.name}</span>
                <div className={styles.dots}>
                  {Array.from({ length: tokensToWin }).map((_, i) => (
                    <span
                      key={i}
                      className={[styles.dot, i < count ? styles.dotFilled : ''].join(' ')}
                    />
                  ))}
                </div>
                <span className={styles.tokenCount}>{count}/{tokensToWin}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.buttons}>
          <button className={styles.playAgain} onClick={onNewMatch}>
            مباراة جديدة
          </button>
          <button className={styles.menu} onClick={onMenu}>
            القائمة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
