import { SFX } from '../utils/sounds';
import { loadProfile } from '../utils/playerProfile';
import CoinIcon from '../components/CoinIcon';
import styles from './MenuPage.module.css';

export default function MenuPage({ onStart, onSettings, onTutorial, onOnline, onStore }) {
  const coins = loadProfile().coins ?? 0;
  return (
    <div className={styles.page}>
      <div className={styles.bottom}>
        <img src="/bg-front.webp" alt="" className={styles.front} />
        <div className={styles.panel}>
          <button className={styles.startBtn} onClick={() => { SFX.confirmOk(); onStart(); }}>
            <img src="/icons/i-play.webp" alt="" className={styles.btnIcon} />
            <span>ابدأ اللعب</span>
            <span className={styles.arrow}>›</span>
          </button>

          <div className={styles.row2}>
            <div className={styles.onlineWrap}>
              <button className={`${styles.onlineBtn} ${styles.onlineDisabled}`} aria-disabled="true">
                <img src="/icons/i-online.webp" alt="" className={styles.btnIconSm} />
                <span>اللعب أونلاين</span>
                <span className={styles.arrowSm}>›</span>
              </button>
              <img src="/under-construction.webp" alt="قيد الإنشاء" className={styles.soonOverlay} />
            </div>
            <button className={styles.guideBtn} onClick={() => { SFX.buttonClick(); onTutorial?.(); }}>
              <img src="/icons/i-guide.webp" alt="" className={styles.btnIconSm} />
              <span>كيف تلعب؟</span>
              <span className={styles.arrowSm}>›</span>
            </button>
          </div>

          <div className={styles.row2}>
            <button className={styles.storeBtn} onClick={() => { SFX.confirmOk(); onStore?.(); }}>
              <img src="/icons/i-store.webp" alt="" className={styles.btnIconSm} />
              <span>المتجر</span>
              <span className={styles.storeCoin}><CoinIcon size="md" /> {coins.toLocaleString('ar-SA')}</span>
            </button>
            <button className={styles.settingsBtn} onClick={() => { SFX.buttonClick(); onSettings(); }}>
              <img src="/icons/i-settings.webp" alt="" className={styles.btnIconSm} />
              <span>ملفي</span>
              <span className={styles.arrowSm}>›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
