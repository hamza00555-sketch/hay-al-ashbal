import { useState, useEffect } from 'react';
import { SFX } from '../utils/sounds';
import CoinIcon from './CoinIcon';
import styles from './CoinCounter.module.css';

export default function CoinCounter({ total = 0, size = 'normal' }) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('drop'); // 'drop' | 'shake' | 'float'

  useEffect(() => {
    const dropTimer = setTimeout(() => {
      if (!total) {
        setPhase('float');
        return;
      }
      setPhase('shake');
      let cur = 0;
      const steps = Math.min(total, 40);
      const inc   = Math.ceil(total / steps);
      const iv = setInterval(() => {
        cur = Math.min(cur + inc, total);
        setCount(cur);
        SFX.coinTick();
        if (cur >= total) {
          clearInterval(iv);
          SFX.coinBurst();
          setPhase('float');
        }
      }, 55);
      return () => clearInterval(iv);
    }, 850);

    return () => clearTimeout(dropTimer);
  }, [total]);

  return (
    <div className={`${styles.wrap} ${styles[size]}`}>
      <div className={`${styles.coin} ${styles[phase]}`}>
        <img src="/hay-coin.webp" alt="" draggable={false} className={styles.img} />
      </div>
      {total > 0 && (
        <div className={`${styles.counter} ${phase === 'float' ? styles.counterDone : ''}`}>
          <span>+{count}</span>
          <CoinIcon size="md" />
        </div>
      )}
    </div>
  );
}
