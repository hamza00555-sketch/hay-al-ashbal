import { useState } from 'react';
import { CHARACTERS } from '../constants/characters';
import styles from './CharacterSelectPage.module.css';

function CharacterPortrait({ char, selected, onClick }) {
  return (
    <button
      className={[
        styles.charCard,
        selected ? styles.selected : '',
      ].join(' ')}
      style={{ '--char-color': char.color, '--char-bg': char.bgColor }}
      onClick={onClick}
    >
      <div className={styles.portraitWrap}>
        <img
          src={`/characters/${char.id}/portrait.png`}
          alt={char.name}
          className={styles.portraitImg}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        <span className={styles.portraitEmoji}>{char.emoji}</span>
        {selected && <div className={styles.selectedRing} />}
      </div>
      <span className={styles.charName}>{char.name}</span>
      <span className={styles.charPersonality}>{char.personality}</span>
      <span className={styles.charDesc}>{char.description}</span>
    </button>
  );
}

export default function CharacterSelectPage({ onBack, onConfirm }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹ رجوع</button>
        <h2 className={styles.title}>اختر شخصيتك</h2>
        <div style={{ width: 64 }} />
      </div>

      <p className={styles.subtitle}>كل شخصية لها أسلوبها في اللعب</p>

      <div className={styles.grid}>
        {CHARACTERS.map(char => (
          <CharacterPortrait
            key={char.id}
            char={char}
            selected={selected === char.id}
            onClick={() => setSelected(char.id)}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.startBtn}
          disabled={!selected}
          onClick={() => selected && onConfirm(selected)}
        >
          {selected
            ? `ابدأ كـ ${CHARACTERS.find(c => c.id === selected)?.name} ←`
            : 'اختر شخصية أولاً'}
        </button>
      </div>
    </div>
  );
}
