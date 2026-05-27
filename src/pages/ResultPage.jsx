import { CardFace } from '../components/Card';
import { SFX } from '../utils/sounds';
import CoinCounter from '../components/CoinCounter';
import CoinIcon from '../components/CoinIcon';
import PlayerAvatar from '../components/PlayerAvatar';
import styles from './ResultPage.module.css';

export default function ResultPage({ result, tokens, tokensToWin, onNewMatch, onMenu }) {
  const { winner, players, coinsEarned = 0, rewardBreakdown = [] } = result;
  const isDraw = !winner;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <CoinCounter total={coinsEarned} size="large" />
        <p className={styles.eyebrow}>{isDraw ? 'تعادل في المباراة!' : 'فائز المباراة'}</p>

        {!isDraw && winner?.profile && (
          <div className={styles.winnerAvatar}>
            <PlayerAvatar
              cardImageId={winner.profile.cardImageId ?? '1'}
              frameImageId={winner.profile.frameImageId ?? null}
              frameShape={winner.profile.frameShape ?? 'circle'}
              frameColor={winner.profile.frameColor ?? '#60b8ff'}
              size="human"
            />
          </div>
        )}

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

        {coinsEarned > 0 && (
          <div className={styles.rewardBox}>
            <p className={styles.rewardTitle}>مكافأة الجولة</p>
            {rewardBreakdown.map((b, i) => (
              <div key={i} className={styles.rewardRow}>
                <span>{b.label}</span>
                <span className={styles.rewardAmt}>+{b.amount} <CoinIcon size="sm" /></span>
              </div>
            ))}
            <div className={styles.rewardTotal}>المجموع: {coinsEarned} <CoinIcon size="sm" /></div>
          </div>
        )}

        <div className={styles.buttons}>
          <button className={styles.playAgain} onClick={() => { SFX.confirmOk(); onNewMatch(); }}>
            مباراة جديدة
          </button>
          <button className={styles.menu} onClick={() => { SFX.buttonClick(); onMenu(); }}>
            القائمة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
