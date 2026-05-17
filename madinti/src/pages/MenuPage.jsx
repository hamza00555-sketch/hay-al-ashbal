import { useEffect } from 'react';
import { startMusic, stopMusic, isMusicPlaying } from '../utils/sounds.js';
import styles from './MenuPage.module.css';

export default function MenuPage({ onStart }) {
  useEffect(() => {
    if (!isMusicPlaying()) startMusic();
    return () => {};
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.skyline}>
        🏭🏬🏢🕌🏡🏫🌳🏠🏪🏗️
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>مدينتي</h1>
        <p className={styles.tagline}>
          ابنِ مدينتك من الصفر<br/>
          اجذب السكان · حقّق الرخاء
        </p>
        <button className={styles.startBtn} onClick={onStart}>
          ابدأ البناء 🏗️
        </button>
      </div>
      <div className={styles.ground}>
        🌿🌿🌿🌿🌿🌿🌿🌿🌿🌿
      </div>
    </div>
  );
}
