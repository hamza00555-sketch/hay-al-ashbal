import styles from './CoinIcon.module.css';

export default function CoinIcon({ size = 'md' }) {
  return (
    <img
      src="/hay-coin.webp"
      alt=""
      draggable={false}
      className={`${styles.icon} ${styles[size]}`}
    />
  );
}
