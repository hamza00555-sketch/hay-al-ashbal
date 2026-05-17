import { useState } from 'react';
import { SFX } from '../utils/sounds.js';
import styles from './SetupPage.module.css';

const DIFFICULTIES = [
  {
    id: 'easy',
    nameAr: 'سهل',
    emoji: '🌱',
    color: '#4CAF50',
    budget: '200,000',
    targetPop: '200',
    eventFreq: 'نادرة',
    discount: 'خصم 20٪',
  },
  {
    id: 'medium',
    nameAr: 'متوسط',
    emoji: '🏙️',
    color: '#2196F3',
    budget: '150,000',
    targetPop: '500',
    eventFreq: 'متوسطة',
    discount: '',
  },
  {
    id: 'hard',
    nameAr: 'صعب',
    emoji: '🔥',
    color: '#f44336',
    budget: '100,000',
    targetPop: '800',
    eventFreq: 'كثيرة',
    discount: 'دخل أقل',
  },
];

export default function SetupPage({ onBack, onStartGame }) {
  const [cityName, setCityName] = useState('مدينتي');
  const [difficulty, setDifficulty] = useState('medium');

  function handleStart() {
    SFX.buttonClick();
    onStartGame({ cityName: cityName.trim() || 'مدينتي', difficulty });
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack}>← رجوع</button>
      <h2 className={styles.heading}>إعداد المدينة</h2>

      <div className={styles.field}>
        <label className={styles.label}>اسم مدينتك</label>
        <input
          className={styles.input}
          value={cityName}
          onChange={e => setCityName(e.target.value)}
          maxLength={20}
          placeholder="مدينتي"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>مستوى الصعوبة</label>
        <div className={styles.diffGrid}>
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              className={`${styles.diffCard} ${difficulty === d.id ? styles.activeDiff : ''}`}
              style={difficulty === d.id ? { borderColor: d.color } : {}}
              onClick={() => { SFX.buttonClick(); setDifficulty(d.id); }}
            >
              <span className={styles.diffEmoji}>{d.emoji}</span>
              <strong className={styles.diffName} style={{ color: d.color }}>{d.nameAr}</strong>
              <div className={styles.diffStats}>
                <span>💰 {d.budget} ر.س</span>
                <span>👥 هدف {d.targetPop} ساكن</span>
                <span>⚡ أحداث {d.eventFreq}</span>
                {d.discount && <span className={styles.bonus}>{d.discount}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className={styles.startBtn} onClick={handleStart}>
        ابنِ المدينة 🏗️
      </button>
    </div>
  );
}
