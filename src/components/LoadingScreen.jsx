import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
  return (
    <div className={styles.wrap}>
      <div className={styles.badge}>
        <div className={styles.leaves}>
          <span className={styles.leafL}>🌿</span>
          <span className={styles.leafR}>🌿</span>
        </div>
        <h1 className={styles.title}>حي الأشبال</h1>
      </div>
      <div className={styles.dots}>
        <span /><span /><span />
      </div>
    </div>
  );
}
