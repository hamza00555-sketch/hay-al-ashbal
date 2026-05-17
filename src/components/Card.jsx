import { useRef, useEffect, useState } from 'react';
import styles from './Card.module.css';

function useTilt(ref, enabled) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    function apply(rx, ry) {
      el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const x = (cx - rect.left) / rect.width - 0.5;
      const y = (cy - rect.top) / rect.height - 0.5;
      apply(y * -18, x * 18);
    }
    function onLeave() {
      el.style.transition = 'transform 0.35s ease';
      apply(0, 0);
      setTimeout(() => { if (el) el.style.transition = ''; }, 360);
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onLeave);
    };
  }, [ref, enabled]);
}

export function CardBack({ size = 'normal' }) {
  return (
    <div className={`${styles.cardWrap} ${styles[size]}`}>
      <img src="/cards/back.png" alt="ظهر الكرت" className={styles.cardImg} draggable={false} />
    </div>
  );
}

export function CardFace({ card, size = 'normal', dimmed = false, selected = false, focused = false, onClick }) {
  const ref = useRef(null);
  useTilt(ref, !!onClick && !dimmed);

  return (
    <div
      ref={ref}
      className={[
        styles.cardWrap,
        styles[size],
        dimmed   ? styles.dimmed    : '',
        selected ? styles.selected  : '',
        focused  ? styles.focused   : '',
        onClick  ? styles.clickable : '',
      ].join(' ')}
      onClick={onClick}
    >
      <img src={`/cards/${card.id}.png`} alt={card.name} className={styles.cardImg} draggable={false} />
    </div>
  );
}

export function FlipCard({ card, size = 'normal', onDone }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 80);
    const t2 = setTimeout(() => onDone?.(), 580);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={`${styles.flipOuter} ${styles[size]}`}>
      <div className={`${styles.flipInner} ${flipped ? styles.flipped : ''}`}>
        <div className={styles.flipFront}>
          <img src="/cards/back.png" alt="" className={styles.cardImg} draggable={false} />
        </div>
        <div className={styles.flipBack}>
          <img src={`/cards/${card.id}.png`} alt={card.name} className={styles.cardImg} draggable={false} />
        </div>
      </div>
    </div>
  );
}
