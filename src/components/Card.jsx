import styles from './Card.module.css';

export function CardBack({ size = 'normal' }) {
  return (
    <div className={`${styles.cardWrap} ${styles[size]}`}>
      <img
        src="/cards/back.png"
        alt="ظهر الكرت"
        className={styles.cardImg}
        draggable={false}
      />
    </div>
  );
}

export function CardFace({ card, size = 'normal', dimmed = false, selected = false, onClick }) {
  return (
    <div
      className={`${styles.cardWrap} ${styles[size]} ${dimmed ? styles.dimmed : ''} ${selected ? styles.selected : ''} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      <img
        src={`/cards/${card.id}.png`}
        alt={card.name}
        className={styles.cardImg}
        draggable={false}
      />
    </div>
  );
}
