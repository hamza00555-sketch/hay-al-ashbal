import styles from './ConfirmModal.module.css';

export default function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <button className={styles.confirmBtn} onClick={onConfirm}>{confirmLabel || 'تأكيد'}</button>
          <button className={styles.cancelBtn} onClick={onCancel}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
