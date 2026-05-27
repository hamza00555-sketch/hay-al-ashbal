import { CardFace } from '../components/Card';
import { SFX } from '../utils/sounds';
import CoinCounter from '../components/CoinCounter';
import styles from './RoundOverScreen.module.css';

export default function RoundOverScreen({ result, config, tokens, tokensToWin, onNextRound, onMenu, isOnlineGuest = false }) {
  const { winner, players, coinsEarned = 0 } = result;
  const isDraw = !winner;

  return (
    <div className={styles.page}>
      <div className={styles.content}>

        <p className={styles.eyebrow}>نهاية الجولة</p>

        <CoinCounter total={coinsEarned} size="normal" />

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
          {isOnlineGuest ? (
            <p className={styles.waitingMsg}>⏳ ينتظر المضيف ليبدأ الجولة التالية...</p>
          ) : (
            <button className={styles.nextBtn} onClick={() => { SFX.confirmOk(); onNextRound(); }}>
              الجولة التالية ←
            </button>
          )}
          <button className={styles.menuBtn} onClick={() => { SFX.buttonClick(); onMenu(); }}>
            القائمة الرئيسية
          </button>
        </div>

      </div>
    </div>
  );
}
