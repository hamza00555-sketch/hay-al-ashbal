import { useState } from 'react';
import {
  FRAME_COLORS,
  loadProfile, saveProfile,
} from '../utils/playerProfile';
import { redeemCode } from '../utils/redeemCodes';
import { STORE_ITEMS, RARITY_CONFIG } from '../utils/storeData';
import PlayerAvatar from '../components/PlayerAvatar';
import { SFX, getMusicVol, getSFXVol, setMusicVol, setSFXVol } from '../utils/sounds';
import styles from './SettingsPage.module.css';

function formatDate(ms) {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
}

function winRate(wins, played) {
  if (!played) return '—';
  return Math.round((wins / played) * 100) + '%';
}

export default function SettingsPage({ onBack }) {
  const [profile,   setProfile]   = useState(() => loadProfile());
  const [musicVol,  setMusicVolState]  = useState(() => getMusicVol());
  const [sfxVol,    setSFXVolState]    = useState(() => getSFXVol());
  const [codeInput, setCodeInput]    = useState('');
  const [codeMsg,   setCodeMsg]      = useState(null);  // { type:'ok'|'err', text }

  function handleRedeem() {
    if (!codeInput.trim()) return;
    const res = redeemCode(codeInput);
    if (res.ok) {
      SFX.cardSelect();
      setProfile(loadProfile());
      setCodeMsg({ type: 'ok', text: `حصلت على ${res.coins.toLocaleString('ar-SA')} عملة! (${res.label})` });
      setCodeInput('');
    } else {
      const text =
        res.reason === 'used'    ? 'هذا الكود مستخدم من قبل'
      : res.reason === 'invalid' ? 'كود غير صحيح'
      : res.reason === 'empty'   ? 'اكتب الكود أولاً'
      :                            'تعذر استخدام الكود';
      setCodeMsg({ type: 'err', text });
    }
  }

  const inventory = profile.inventory ?? [];

  const ownedAvatars = STORE_ITEMS.filter(
    item => item.type === 'avatar' && inventory.includes(item.id)
  );
  const ownedFrames = STORE_ITEMS.filter(
    item => item.type === 'frame' && inventory.includes(item.id)
  );

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
          frameImageId={profile.frameImageId ?? null}
          size="xl"
        />
      </div>

      <section className={styles.section}>
        <p className={styles.label}>اسمك في اللعبة</p>
        <input
          className={styles.nameInput}
          type="text"
          maxLength={16}
          placeholder="أدخل اسمك..."
          value={profile.name ?? ''}
          onChange={e => update('name', e.target.value)}
        />
      </section>

      {/* ── إحصائيات اللاعب ── */}
      <section className={styles.section}>
        <p className={styles.label}>إحصائياتك</p>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{(profile.stats?.gamesPlayed ?? 0).toLocaleString('ar-SA')}</span>
            <span className={styles.statLabel}>مباريات</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: '#22a060' }}>
              {(profile.stats?.wins ?? 0).toLocaleString('ar-SA')}
            </span>
            <span className={styles.statLabel}>انتصارات</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: '#d0556b' }}>
              {(profile.stats?.losses ?? 0).toLocaleString('ar-SA')}
            </span>
            <span className={styles.statLabel}>خسائر</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {winRate(profile.stats?.wins ?? 0, profile.stats?.gamesPlayed ?? 0)}
            </span>
            <span className={styles.statLabel}>نسبة الفوز</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{(profile.stats?.roundsWon ?? 0).toLocaleString('ar-SA')}</span>
            <span className={styles.statLabel}>جولات فائزة</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValueSm}>{formatDate(profile.registeredAt)}</span>
            <span className={styles.statLabel}>تاريخ التسجيل</span>
          </div>
        </div>
      </section>

      {/* ── الشخصيات المكتسبة من المتجر ── */}
      <section className={styles.section}>
        <p className={styles.label}>شخصياتك المكتسبة</p>
        {ownedAvatars.length === 0 ? (
          <p className={styles.emptyHint}>لم تحصل على شخصيات بعد — افتح الباكسات من المتجر!</p>
        ) : (
          <div className={styles.avatarGrid}>
            {ownedAvatars.map(item => (
              <button
                key={item.id}
                className={[
                  styles.avatarBtn,
                  profile.cardImageId === item.cardImageId ? styles.avatarSelected : '',
                ].join(' ')}
                style={{
                  '--frame-color': profile.cardImageId === item.cardImageId
                    ? profile.frameColor
                    : 'rgba(255,255,255,0.15)',
                  borderColor: RARITY_CONFIG[item.rarity]?.color,
                }}
                onClick={() => { SFX.cardSelect(); update('cardImageId', item.cardImageId); }}
              >
                <img src={`/cards/${item.cardImageId}.webp`} alt={item.name} className={styles.avatarThumb} />
                <span className={styles.rarityDot} style={{ background: RARITY_CONFIG[item.rarity]?.color }} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── لون الإطار ── */}
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

      {/* ── الإطارات المكتسبة ── */}
      <section className={styles.section}>
        <p className={styles.label}>إطاراتك المكتسبة</p>
        {ownedFrames.length === 0 ? (
          <p className={styles.emptyHint}>لم تحصل على إطارات بعد — افتح الباكسات من المتجر!</p>
        ) : (
          <div className={styles.framesGrid}>
            <button
              className={[styles.frameBtn, !profile.frameImageId ? styles.frameActive : ''].join(' ')}
              onClick={() => { SFX.cardSelect(); update('frameImageId', null); }}
            >
              <div className={styles.frameThumbWrap}>
                <PlayerAvatar
                  cardImageId={profile.cardImageId}
                  frameShape={profile.frameShape}
                  frameColor={profile.frameColor}
                  size="sm"
                />
              </div>
              <span className={styles.frameLabel}>بدون</span>
            </button>
            {ownedFrames.map(frame => (
              <button
                key={frame.id}
                className={[styles.frameBtn, profile.frameImageId === frame.frameImageId ? styles.frameActive : ''].join(' ')}
                onClick={() => { SFX.cardSelect(); update('frameImageId', frame.frameImageId); }}
              >
                <div className={styles.frameThumbWrap}>
                  <img
                    src={`/frames/${frame.frameImageId}.webp`}
                    alt={frame.name}
                    className={styles.frameThumbImg}
                  />
                </div>
                <span
                  className={styles.frameLabel}
                  style={{ color: RARITY_CONFIG[frame.rarity]?.color }}
                >
                  {frame.name}
                </span>
              </button>
            ))}
          </div>
        )}
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

      {/* ── سرعة التبويبات أثناء دور الذكاء ── */}
      <section className={styles.section}>
        <p className={styles.label}>سرعة عرض دور الذكاء</p>
        <p className={styles.emptyHint}>تحكّم بسرعة ظهور تبويبات دور الذكاء أثناء اللعب لتلحق تقرأها</p>
        <div className={styles.speedRow}>
          {[
            { id: 'slow',   label: 'بطيء', desc: 'وقت أطول للقراءة' },
            { id: 'normal', label: 'عادي', desc: 'متوازن' },
            { id: 'fast',   label: 'سريع', desc: 'لعب أسرع' },
          ].map(s => (
            <button
              key={s.id}
              className={[
                styles.speedBtn,
                (profile.turnSpeed ?? 'normal') === s.id ? styles.speedActive : '',
              ].join(' ')}
              onClick={() => { SFX.cardSelect(); update('turnSpeed', s.id); }}
            >
              <span className={styles.speedLabel}>{s.label}</span>
              <span className={styles.speedDesc}>{s.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── استبدال كود ── */}
      <section className={styles.section}>
        <p className={styles.label}>استبدال كود</p>
        <p className={styles.emptyHint}>أدخل كود مكافأة لتحصل على عملات مجانية</p>
        <div className={styles.codeRow}>
          <input
            className={styles.codeInput}
            type="text"
            placeholder="ASHBAL"
            maxLength={20}
            value={codeInput}
            onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeMsg(null); }}
            onKeyDown={e => { if (e.key === 'Enter') handleRedeem(); }}
          />
          <button
            className={styles.codeBtn}
            onClick={handleRedeem}
            disabled={!codeInput.trim()}
          >
            استبدال
          </button>
        </div>
        {codeMsg && (
          <p className={codeMsg.type === 'ok' ? styles.codeMsgOk : styles.codeMsgErr}>
            {codeMsg.text}
          </p>
        )}
      </section>
    </div>
  );
}
