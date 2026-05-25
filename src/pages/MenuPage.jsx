import { SFX } from '../utils/sounds';
import styles from './MenuPage.module.css';

export default function MenuPage({ onStart, onSettings, onTutorial, onOnline }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <img src="/cards/back.webp" alt="حي الأشبال" className={styles.logoImg} />
        </div>

        <div className={styles.tagline}>
          <p>اقرأ اللاعبين · اخدع خصومك · ابقَ آخر صامد</p>
        </div>

        <div className={styles.buttons}>
          <button className={styles.startBtn} onClick={() => { SFX.confirmOk(); onStart(); }}>
            ابدأ اللعب
          </button>
          <button className={styles.onlineBtn} onClick={() => { SFX.confirmOk(); onOnline?.(); }}>
            🌐 العب أونلاين
          </button>
          <button className={styles.tutorialBtn} onClick={() => { SFX.buttonClick(); onTutorial?.(); }}>
            📖 كيف ألعب؟
          </button>
          <button className={styles.settingsBtn} onClick={() => { SFX.buttonClick(); onSettings(); }}>
            ⚙ الملف الشخصي
          </button>
        </div>

        <p className={styles.players}>2 — 4 لاعبين · أونلاين · ضد AI · Pass &amp; Play</p>
      </div>
    </div>
  );
}
