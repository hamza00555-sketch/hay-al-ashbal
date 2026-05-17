import styles from './StoryModal.module.css';

export default function StoryModal({ message, onClose }) {
  if (!message) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.character}>
          <span className={styles.avatar}>{message.emoji}</span>
          <strong className={styles.name}>{message.nameAr}</strong>
        </div>
        <div className={styles.bubble}>
          <p>{message.textAr}</p>
        </div>
        <button className={styles.okBtn} onClick={onClose}>موافق</button>
      </div>
    </div>
  );
}
