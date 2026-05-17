import styles from './MenuPage.module.css';

export default function MenuPage({ onStart }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <img src="/cards/back.png" alt="حي الأشبال" className={styles.logoImg} />
        </div>

        <div className={styles.tagline}>
          <p>اقرأ اللاعبين · اخدع خصومك · ابقَ آخر صامد</p>
        </div>

        <div className={styles.buttons}>
          <button className={styles.startBtn} onClick={onStart}>
            ابدأ اللعب
          </button>
        </div>

        <p className={styles.players}>3 — 6 لاعبين · Pass &amp; Play · ضد AI</p>
      </div>
    </div>
  );
}
