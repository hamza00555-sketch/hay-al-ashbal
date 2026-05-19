import { useState } from 'react';
import {
  AVATAR_IMAGE_IDS, FRAME_SHAPES, FRAME_COLORS,
  loadProfile, saveProfile,
} from '../utils/playerProfile';
import PlayerAvatar from '../components/PlayerAvatar';
import { SFX } from '../utils/sounds';
import styles from './SettingsPage.module.css';

export default function SettingsPage({ onBack }) {
  const [profile, setProfile] = useState(() => loadProfile());

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
    </div>
  );
}
