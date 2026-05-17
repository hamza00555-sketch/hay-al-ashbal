import styles from './TutorialOverlay.module.css';
import { TUTORIAL_STEPS } from '../constants/tutorial.js';

export default function TutorialOverlay({ step, onNext, onSkip }) {
  if (step === null || step >= TUTORIAL_STEPS.length) return null;
  const current = TUTORIAL_STEPS[step];

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.progress}>
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === step ? styles.activeDot : i < step ? styles.doneDot : ''}`} />
          ))}
        </div>
        <p className={styles.text}>{current.textAr}</p>
        <div className={styles.actions}>
          {current.continueMode === 'button' && (
            <button className={styles.nextBtn} onClick={onNext}>
              {current.isLast ? '🚀 ابدأ!' : 'التالي ←'}
            </button>
          )}
          {current.continueMode === 'action' && (
            <p className={styles.hint}>نفّذ الخطوة أعلاه للمتابعة تلقائياً</p>
          )}
          <button className={styles.skipBtn} onClick={onSkip}>تخطّي التوتوريال</button>
        </div>
      </div>
    </div>
  );
}
