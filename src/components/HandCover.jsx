import styles from './HandCover.module.css';

export default function HandCover({ playerName, onReveal }) {
  return (
    <div className={styles.cover}>
      <div className={styles.inner}>
        <div className={styles.eyeOff}>🙈</div>
        <p className={styles.pass}>مرّر الجوال لـ</p>
        <h2 className={styles.name}>{playerName}</h2>
        <button className={styles.revealBtn} onClick={onReveal}>
          اضغط لكشف كرتك
        </button>
      </div>
    </div>
  );
}
