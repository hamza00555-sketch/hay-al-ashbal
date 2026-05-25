import { useState, useEffect } from 'react';
import styles from './LoadingScreen.module.css';

const STEPS = [18, 35, 52, 68, 80, 90];

export default function LoadingScreen() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < STEPS.length) setPct(STEPS[i++]);
      else clearInterval(t);
    }, 320);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.signWrap}>
          <div className={styles.sign}>
            <h1 className={styles.title}>حي الأشبال</h1>
          </div>
          <img src="/bg-front.webp" alt="" className={styles.girls} />
        </div>

        <p className={styles.loadingText}>جاري تجهيز الحي...</p>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${pct}%` }}>
            <span className={styles.pct}>{pct}%</span>
          </div>
        </div>
      </div>

      <div className={styles.townSilhouette} />
    </div>
  );
}
