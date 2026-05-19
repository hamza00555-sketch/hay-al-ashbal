import { useState } from 'react';
import {
  AVATAR_IMAGE_IDS, FRAME_SHAPES, FRAME_COLORS,
  loadProfile, saveProfile,
} from '../utils/playerProfile';
import PlayerAvatar from '../components/PlayerAvatar';
import { SFX, getMusicVol, getSFXVol, setMusicVol, setSFXVol } from '../utils/sounds';
import styles from './SettingsPage.module.css';

export default function SettingsPage({ onBack }) {
  const [profile,   setProfile]   = useState(() => loadProfile());
  const [musicVol,  setMusicVolState]  = useState(() => getMusicVol());
  const [sfxVol,    setSFXVolState]    = useState(() => getSFXVol());

  function handleMusicVol(v) {
    setMusicVolState(v);
    setMusicVol(v);
  }

  function handleSFXVol(v) {
    setSFXVolState(v);
    setSFXVol(v);
    SFX.cardSelect();
  }

  function update(field, value) {
    const next = { ...profile, [field]: value };
    setProfile(next);
    saveProfile(next);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => { SFX.buttonClick(); onBack(); }}>‹ رجوع</button>
        <h2 className={styles.title}>الملف الشخصي</h2>
      </div>

      <div className={styles.previewRow}>
        <PlayerAvatar
          cardImageId={profile.cardImageId}
          frameShape={profile.frameShape}
          frameColor={profile.frameColor}
          size="xl"
        />
      </div>

      <section className={styles.section}>
        <p className={styles.label}>الشخصية (صورة البطاقة)</p>
        <div className={styles.avatarGrid}>
          {AVATAR_IMAGE_IDS.map(id => (
            <button
              key={id}
              className={[
                styles.avatarBtn,
                profile.cardImageId === id ? styles.avatarSelected : '',
              ].join(' ')}
              style={{
                '--frame-color': profile.cardImageId === id
                  ? profile.frameColor
                  : 'rgba(255,255,255,0.15)',
              }}
              onClick={() => { SFX.cardSelect(); update('cardImageId', id); }}
            >
              <img src={`/cards/${id}.png`} alt={id} className={styles.avatarThumb} />
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>شكل الإطار</p>
        <div className={styles.shapeRow}>
          {FRAME_SHAPES.map(s => (
            <button
              key={s.id}
              className={[
                styles.shapeBtn,
                profile.frameShape === s.id ? styles.shapeActive : '',
              ].join(' ')}
              onClick={() => { SFX.cardSelect(); update('frameShape', s.id); }}
            >
              <PlayerAvatar
                cardImageId={profile.cardImageId}
                frameShape={s.id}
                frameColor={profile.frameColor}
                size="sm"
              />
              <span className={styles.shapeLabel}>{s.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>لون الإطار</p>
        <div className={styles.colorRow}>
          {FRAME_COLORS.map(c => (
            <button
              key={c}
              className={[
                styles.colorBtn,
                profile.frameColor === c ? styles.colorActive : '',
              ].join(' ')}
              style={{ '--c': c }}
              onClick={() => { SFX.buttonClick(); update('frameColor', c); }}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.label}>مستوى الصوت</p>
        <div className={styles.volRow}>
          <span className={styles.volIcon}>🎵</span>
          <span className={styles.volLabel}>الموسيقى</span>
          <input
            type="range" min="0" max="1" step="0.05"
            value={musicVol}
            className={styles.volSlider}
            onChange={e => handleMusicVol(parseFloat(e.target.value))}
          />
          <span className={styles.volPct}>{Math.round(musicVol * 100)}%</span>
        </div>
        <div className={styles.volRow}>
          <span className={styles.volIcon}>🔊</span>
          <span className={styles.volLabel}>المؤثرات</span>
          <input
            type="range" min="0" max="1" step="0.05"
            value={sfxVol}
            className={styles.volSlider}
            onChange={e => handleSFXVol(parseFloat(e.target.value))}
          />
          <span className={styles.volPct}>{Math.round(sfxVol * 100)}%</span>
        </div>
      </section>
    </div>
  );
}
