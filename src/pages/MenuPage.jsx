import { useEffect, useRef } from 'react';
import { SFX } from '../utils/sounds';
import styles from './MenuPage.module.css';

export default function MenuPage({ onStart, onSettings, onTutorial, onOnline }) {
  const panelRef = useRef(null);
  const pageRef  = useRef(null);

  useEffect(() => {
    function update() {
      if (!panelRef.current || !pageRef.current) return;
      const h = panelRef.current.offsetHeight;
      pageRef.current.style.setProperty('--panel-h', `${h}px`);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className={styles.page} ref={pageRef}>

      <img src="/bg-front.webp" alt="" className={styles.front} />

      <div className={styles.panel} ref={panelRef}>
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
