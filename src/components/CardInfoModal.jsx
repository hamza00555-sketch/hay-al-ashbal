import { CardFace } from './Card';
import styles from './CardInfoModal.module.css';

export default function CardInfoModal({ card, onClose }) {
  if (!card) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.cardArea}>
          <CardFace card={card} size="large" />
        </div>
        <div className={styles.info} style={{ borderColor: card.color }}>
          <div className={styles.header}>
            <span className={styles.icon}>{card.icon}</span>
            <span className={styles.name}>{card.name}</span>
            <span className={styles.power} style={{ background: card.color }}>
              {card.power}
            </span>
          </div>
          <p className={styles.ability}>{card.ability}</p>
          <p className={styles.desc}>{card.description}</p>
        </div>
        <button className={styles.close} onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
