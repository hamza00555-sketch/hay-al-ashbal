import { CardFace } from './Card';
import styles from './DiscardPile.module.css';

export default function DiscardPile({ cards }) {
  if (!cards || cards.length === 0) {
    return <div className={styles.empty}>المرميات</div>;
  }

  const last3  = cards.slice(-3);
  const angles = [-14, -7, 0];
  const offset = 3 - last3.length;

  return (
    <div className={styles.pile}>
      <span className={styles.label}>المرميات ({cards.length})</span>
      <div className={styles.fan}>
        {last3.map((card, i) => (
          <div
            key={card.uid}
            className={styles.card}
            style={{ '--angle': `${angles[offset + i]}deg`, zIndex: i + 1 }}
          >
            <CardFace card={card} size="small" />
          </div>
        ))}
      </div>
    </div>
  );
}
