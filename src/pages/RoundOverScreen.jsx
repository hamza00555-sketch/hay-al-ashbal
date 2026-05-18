import { CardFace } from '../components/Card';
import styles from './RoundOverScreen.module.css';

export default function RoundOverScreen({ result, config, tokens, tokensToWin, onNextRound, onMenu }) {
  const { winner, players } = result;
  const isDraw = !winner;

  return (
    <div className={styles.page}>
      <div className={styles.content}>

        <p className={styles.eyebrow}>نهاية الجولة</p>

        <h2 className={styles.title}>
          {isDraw ? 'تعادل!' : `فاز ${winner.name}!`}
        </h2>

        {winner?.hand?.[0] && (
          <div className={styles.winCard}>
            <CardFace card={winner.hand[0]} size="normal" />
          </div>
        )}

        {/* Token track */}
        <div className={styles.tokenSection}>
          <p className={styles.tokenLabel}>الأوسمة (الفوز بـ {tokensToWin})</p>
          <div className={styles.tokenList}>
            {players.map(p => {
              const count = tokens[p.id] ?? 0;
              return (
                <div key={p.id} className={[
                  styles.tokenRow,
                  p.id === winner?.id ? styles.tokenRowWinner : '',
                ].join(' ')}>
                  <span className={styles.tokenName}>{p.name}</span>
                  <div className={styles.tokenDots}>
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
        </div>

        <div className={styles.buttons}>
          <button className={styles.nextBtn} onClick={onNextRound}>
            الجولة التالية ←
          </button>
          <button className={styles.menuBtn} onClick={onMenu}>
            القائمة الرئيسية
          </button>
        </div>

      </div>
    </div>
  );
}
