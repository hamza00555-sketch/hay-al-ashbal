import { useState } from 'react';
import { PACK_DEFS, getLegendaryInfo, openPack } from '../utils/packSystem';
import { RARITY_CONFIG, STORE_ITEMS } from '../utils/storeData';
import { loadProfile, saveProfile } from '../utils/playerProfile';
import { getDailyProgress } from '../utils/economy';
import PlayerAvatar from '../components/PlayerAvatar';
import { SFX } from '../utils/sounds';
import styles from './StorePage.module.css';

export default function StorePage({ onBack }) {
  const [profile, setProfile] = useState(() => loadProfile());
  const [result,  setResult]  = useState(null);
  const [phase,   setPhase]   = useState('idle'); // 'idle' | 'flip' | 'show'
  const [toast,   setToast]   = useState(null);

  const daily         = getDailyProgress();
  const legendaryInfo = getLegendaryInfo(profile.packs ?? {});

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  function handleOpenPack(packId) {
    const price = packId === 'legendary' ? legendaryInfo.price : PACK_DEFS[packId].price;
    if ((profile.coins ?? 0) < price) {
      showToast(`تحتاج ${(price - (profile.coins ?? 0)).toLocaleString('ar-SA')} ⭐ إضافية`, 'error');
      return;
    }
    SFX.confirmOk();
    const res = openPack(packId, profile);
    if (!res) return;

    const earned = res.isDuplicate ? res.coinsCompensation : 0;
    const next = {
      ...profile,
      coins:     (profile.coins ?? 0) - price + earned,
      inventory: res.isDuplicate
        ? (profile.inventory ?? [])
        : [...(profile.inventory ?? []), res.item.id],
      packs: res.newPacksState,
    };
    setProfile(next);
    saveProfile(next);
    setResult(res);
    setPhase('flip');
    setTimeout(() => setPhase('show'), 1000);
  }

  function handleEquip(item) {
    const next = { ...profile };
    if (item.type === 'avatar') next.cardImageId = item.cardImageId;
    else { next.frameShape = item.frameShape; next.frameColor = item.frameColor; }
    setProfile(next);
    saveProfile(next);
    showToast(`تم تجهيز "${item.name}" ✓`);
    closeResult();
  }

  function closeResult() {
    setResult(null);
    setPhase('idle');
  }

  const isEquipped = item =>
    item.type === 'avatar'
      ? profile.cardImageId === item.cardImageId
      : profile.frameShape === item.frameShape && profile.frameColor === item.frameColor;

  function avatarProps(item) {
    return {
      cardImageId: item.type === 'avatar' ? item.cardImageId : (profile.cardImageId ?? '1'),
      frameShape:  item.type === 'frame'  ? item.frameShape  : (profile.frameShape  ?? 'circle'),
      frameColor:  item.type === 'frame'  ? item.frameColor  : (profile.frameColor  ?? '#60b8ff'),
    };
  }

  // Pity label: "X باقي للضمان"
  const pityRemain = legendaryInfo.isPity ? 0 : (4 - legendaryInfo.posInCycle);

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => { SFX.buttonClick(); onBack(); }}>‹ رجوع</button>
        <h2 className={styles.title}>المتجر</h2>
        <div className={styles.coinBadge}>
          <span className={styles.coinStar}>⭐</span>
          <span className={styles.coinAmt}>{(profile.coins ?? 0).toLocaleString('ar-SA')}</span>
        </div>
      </div>

      {/* ── Daily bar ── */}
      <div className={styles.dailyBar}>
        <div className={styles.dailyLabel}>
          <span>نجوم اليوم</span>
          <span>{daily.earned} / {daily.hardCap} ⭐</span>
        </div>
        <div className={styles.dailyTrack}>
          <div
            className={styles.dailyFill}
            style={{
              width: `${Math.min(100, (daily.earned / daily.hardCap) * 100)}%`,
              background: daily.earned >= daily.softCap ? '#ff9944' : '#60b8ff',
            }}
          />
          <div className={styles.softCapMark} style={{ left: `${(daily.softCap / daily.hardCap) * 100}%` }} />
        </div>
      </div>

      {/* ── Pack cards ── */}
      <div className={styles.packs}>

        {/* Basic Pack */}
        <div className={styles.packCard}>
          <div className={styles.packImgWrap}>
            <img src={PACK_DEFS.basic.image} alt="" className={styles.packImg}
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className={styles.packImgPlaceholder}>📦</div>
          </div>
          <div className={styles.packBody}>
            <span className={styles.packName}>{PACK_DEFS.basic.name}</span>
            <div className={styles.packOdds}>
              <span style={{ color: RARITY_CONFIG.common.color }}>شخصية شائعة مضمونة</span>
            </div>
          </div>
          <button
            className={`${styles.packBtn} ${(profile.coins ?? 0) < PACK_DEFS.basic.price ? styles.packBtnOff : ''}`}
            onClick={() => handleOpenPack('basic')}
          >
            ⭐ {PACK_DEFS.basic.price.toLocaleString('ar-SA')}
          </button>
        </div>

        {/* Legendary Pack */}
        <div className={`${styles.packCard} ${styles.packCardLegendary}`}>
          <div className={styles.packImgWrap}>
            <img src={PACK_DEFS.legendary.image} alt="" className={styles.packImg}
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className={styles.packImgPlaceholder}>✨</div>
          </div>
          <div className={styles.packBody}>
            <span className={styles.packName}>{PACK_DEFS.legendary.name}</span>
            <div className={styles.packOdds}>
              <span style={{ color: RARITY_CONFIG.legendary.color }}>شخصية أسطورية حصرية</span>
            </div>
            {/* Pity tracker */}
            <div className={styles.pityRow}>
              <div className={styles.pityDots}>
                {[0, 1, 2, 3].map(i => (
                  <span
                    key={i}
                    className={`${styles.pityDot} ${i < legendaryInfo.posInCycle ? styles.pityDotFilled : ''} ${legendaryInfo.isPity && i === 3 ? styles.pityDotPity : ''}`}
                  />
                ))}
              </div>
              <span className={styles.pityLabel}>
                {legendaryInfo.isPity
                  ? '🎁 الرابع مضمون أسطوري!'
                  : `${pityRemain} باقي للضمان`}
              </span>
            </div>
          </div>
          <button
            className={`${styles.packBtn} ${styles.packBtnLegendary} ${(profile.coins ?? 0) < legendaryInfo.price ? styles.packBtnOff : ''}`}
            onClick={() => handleOpenPack('legendary')}
          >
            {legendaryInfo.isPity
              ? '🎁 مجاني!'
              : `⭐ ${legendaryInfo.price.toLocaleString('ar-SA')}`}
          </button>
        </div>
      </div>

      {/* ── Pack open overlay ── */}
      {phase !== 'idle' && (
        <div className={styles.openOverlay}>
          <div className={styles.openModal}>

            {phase === 'flip' && (
              <div className={styles.flipWrap}>
                <div className={styles.flipCard}>
                  <div className={styles.flipBack}>📦</div>
                </div>
                <p className={styles.flipText}>جاري الفتح...</p>
              </div>
            )}

            {phase === 'show' && result && (() => {
              const item = result.item;
              const rc   = RARITY_CONFIG[item.rarity];
              return (
                <>
                  <div className={`${styles.resultGlow} ${styles[`glow_${item.rarity}`]}`} />
                  <p className={styles.resultRarity} style={{ color: rc.color }}>
                    {rc.label}!
                  </p>
                  <div className={styles.resultAvatar}>
                    <PlayerAvatar {...avatarProps(item)} size="xl" />
                  </div>
                  <h3 className={styles.resultName}>{item.name}</h3>
                  {result.isDuplicate ? (
                    <p className={styles.dupNote}>
                      لديك هذا الكرت! حصلت على {result.coinsCompensation.toLocaleString('ar-SA')} ⭐ تعويضاً
                    </p>
                  ) : (
                    <p className={styles.newNote}>كرت جديد في مجموعتك! 🎉</p>
                  )}
                  <div className={styles.resultBtns}>
                    {!result.isDuplicate && !isEquipped(item) && (
                      <button className={styles.equipNowBtn} onClick={() => handleEquip(item)}>
                        تجهيز الآن
                      </button>
                    )}
                    <button className={styles.closeBtn} onClick={closeResult}>حسناً</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastErr : styles.toastOk}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
