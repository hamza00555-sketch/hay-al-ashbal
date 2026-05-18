import { UNIQUE_CARDS } from '../constants/cards';
import { CardFace } from './Card';
import styles from './GuideDrawer.module.css';

export default function GuideDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>دليل الكروت</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.list}>
          {UNIQUE_CARDS.map(card => (
            <div key={card.id} className={styles.item}>
              <div className={styles.cardThumb}>
                <CardFace card={card} size="small" />
                <span className={styles.powerBadge}>{card.power}</span>
              </div>
              <div className={styles.info}>
                <span className={styles.role}>{card.role}</span>
                <span className={styles.ability}>{card.ability}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
