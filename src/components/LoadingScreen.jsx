import { useState, useEffect } from 'react';
import styles from './LoadingScreen.module.css';

// Slow steps that stop at 88% — jump to 100% when complete
const STEPS = [6, 14, 23, 33, 43, 53, 62, 70, 77, 83, 88];
const INTERVAL_MS = 550;

export default function LoadingScreen({ complete = false }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < STEPS.length) {
        setPct(STEPS[i++]);
      } else {
        clearInterval(t);
      }
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  // When Firebase is ready, jump to 100%
  useEffect(() => {
    if (complete) setPct(100);
  }, [complete]);

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
