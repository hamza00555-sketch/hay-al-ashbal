import { SFX } from '../utils/sounds';
import styles from './MenuPage.module.css';

export default function MenuPage({ onStart, onSettings, onTutorial, onOnline }) {
  return (
    <div className={styles.page}>

      <div className={styles.logoBadge}>
        <div className={styles.logoLeaves}>
          <span className={styles.leafLeft}>🌿</span>
          <span className={styles.leafRight}>🌿</span>
        </div>
        <h1 className={styles.logoText}>حي الأشبال</h1>
      </div>

      <div className={styles.panel}>
        <button className={styles.startBtn} onClick={() => { SFX.confirmOk(); onStart(); }}>
          <img src="/icons/i-play.webp" alt="" className={styles.btnIcon} />
          <span>ابدأ اللعب</span>
          <span className={styles.arrow}>›</span>
        </button>

        <div className={styles.row2}>
          <button className={styles.onlineBtn} onClick={() => { SFX.confirmOk(); onOnline?.(); }}>
            <img src="/icons/i-online.webp" alt="" className={styles.btnIconSm} />
            <span>اللعب أونلاين</span>
            <span className={styles.arrowSm}>›</span>
          </button>
          <button className={styles.guideBtn} onClick={() => { SFX.buttonClick(); onTutorial?.(); }}>
            <img src="/icons/i-guide.webp" alt="" className={styles.btnIconSm} />
            <span>كيف تلعب؟</span>
            <span className={styles.arrowSm}>›</span>
          </button>
        </div>

        <button className={styles.settingsBtn} onClick={() => { SFX.buttonClick(); onSettings(); }}>
          <img src="/icons/i-settings.webp" alt="" className={styles.btnIconSm} />
          <span>الملف الشخصي</span>
          <span className={styles.arrowSm}>›</span>
        </button>

        <p className={styles.welcome}>مرحباً بك في حي الأشبال!</p>
      </div>

    </div>
  );
}
