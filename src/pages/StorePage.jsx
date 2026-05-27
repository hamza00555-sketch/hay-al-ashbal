import { useState } from 'react';
import { PACK_DEFS, getLegendaryInfo, openPack } from '../utils/packSystem';
import { RARITY_CONFIG, STORE_ITEMS } from '../utils/storeData';
import { loadProfile, saveProfile } from '../utils/playerProfile';
import { getDailyProgress } from '../utils/economy';
import { SFX } from '../utils/sounds';
import CoinIcon from '../components/CoinIcon';
import styles from './StorePage.module.css';

function ItemPreview({ item }) {
  if (item.type === 'avatar') {
    return (
      <img
        src={`/cards/${item.cardImageId}.webp`}
        alt={item.name}
        className={styles.previewImg}
      />
    );
  }
  return (
    <img
      src={`/frames/${item.frameImageId}.webp`}
      alt={item.name}
      className={styles.previewFrame}
    />
  );
}

export default function StorePage({ onBack }) {
  const [profile, setProfile] = useState(() => loadProfile());
  const [results, setResults] = useState(null); // array of 3 slot results
  const [phase,   setPhase]   = useState('idle');
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
      showToast(`تحتاج ${(price - (profile.coins ?? 0)).toLocaleString('ar-SA')} عملة إضافية`, 'error');
      return;
    }
    SFX.confirmOk();
    const res = openPack(packId, profile);
    if (!res || res.items.length === 0) return;

    // Update inventory and coins
    const totalComp = res.items.reduce((s, r) => s + r.coinsCompensation, 0);
    const newInv = [...(profile.inventory ?? [])];
    res.items.forEach(r => {
      if (!r.isDuplicate && !newInv.includes(r.item.id)) newInv.push(r.item.id);
    });
    const next = {
      ...profile,
      coins:     (profile.coins ?? 0) - price + totalComp,
      inventory: newInv,
      packs:     res.newPacksState,
    };
    setProfile(next);
    saveProfile(next);
    setResults(res.items);
    setPhase('flip');
    setTimeout(() => setPhase('show'), 1100);
  }

  function handleEquip(item) {
    const next = { ...profile };
    if (item.type === 'avatar') next.cardImageId = item.cardImageId;
    else next.frameImageId = item.frameImageId;
    setProfile(next);
    saveProfile(next);
    showToast(`تم تجهيز "${item.name}" ✓`);
  }

  function closeResult() {
    setResults(null);
    setPhase('idle');
  }

  const isEquipped = item =>
    item.type === 'avatar'
      ? profile.cardImageId === item.cardImageId
      : profile.frameImageId === item.frameImageId;

  const pityRemain = legendaryInfo.isPity ? 0 : (4 - legendaryInfo.posInCycle);

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => { SFX.buttonClick(); onBack(); }}>‹ رجوع</button>
        <h2 className={styles.title}>المتجر</h2>
        <div className={styles.coinBadge}>
          <CoinIcon size="lg" />
          <span className={styles.coinAmt}>{(profile.coins ?? 0).toLocaleString('ar-SA')}</span>
        </div>
      </div>

      {/* ── Daily bar ── */}
      <div className={styles.dailyBar}>
        <div className={styles.dailyLabel}>
          <span>نجوم اليوم</span>
          <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>{daily.earned} / {daily.hardCap} <CoinIcon size="sm" /></span>
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
            <img src={PACK_DEFS.basic.image} alt="" className={styles.packImg} />
          </div>
          <div className={styles.packBody}>
            <span className={styles.packName}>{PACK_DEFS.basic.name}</span>
            <span className={styles.packSub}>{PACK_DEFS.basic.subtitle}</span>
            <div className={styles.packOdds}>
              <span style={{ color: RARITY_CONFIG.common.color }}>شائع</span>
            </div>
          </div>
          <button
            className={`${styles.packBtn} ${(profile.coins ?? 0) < PACK_DEFS.basic.price ? styles.packBtnOff : ''}`}
            onClick={() => handleOpenPack('basic')}
          >
            <CoinIcon size="sm" /> {PACK_DEFS.basic.price.toLocaleString('ar-SA')}
          </button>
        </div>

        {/* Legendary Pack */}
        <div className={`${styles.packCard} ${styles.packCardLegendary}`}>
          <div className={styles.packImgWrap}>
            <img src={PACK_DEFS.legendary.image} alt="" className={styles.packImg} />
          </div>
          <div className={styles.packBody}>
            <span className={styles.packName}>{PACK_DEFS.legendary.name}</span>
            <span className={styles.packSub}>{PACK_DEFS.legendary.subtitle}</span>
            <div className={styles.packOdds}>
              <span style={{ color: RARITY_CONFIG.rare.color }}>نادر</span>
              <span style={{ color: RARITY_CONFIG.legendary.color }}>أسطوري</span>
            </div>
            <div className={styles.pityRow}>
              <div className={styles.pityDots}>
                {[0, 1, 2, 3].map(i => (
                  <span
                    key={i}
                    className={`${styles.pityDot}
                      ${i < legendaryInfo.posInCycle ? styles.pityDotFilled : ''}
                      ${legendaryInfo.isPity && i === 3 ? styles.pityDotPity : ''}`}
                  />
                ))}
              </div>
              <span className={styles.pityLabel}>
                {legendaryInfo.isPity ? '🎁 الرابع مضمون أسطوري!' : `${pityRemain} باقي للضمان`}
              </span>
            </div>
          </div>
          <button
            className={`${styles.packBtn} ${styles.packBtnLegendary} ${(profile.coins ?? 0) < legendaryInfo.price ? styles.packBtnOff : ''}`}
            onClick={() => handleOpenPack('legendary')}
          >
            {legendaryInfo.isPity ? '🎁 مجاني!' : <><CoinIcon size="sm" /> {legendaryInfo.price.toLocaleString('ar-SA')}</>}
          </button>
        </div>
      </div>

      {/* ── Pack open overlay ── */}
      {phase !== 'idle' && (
        <div className={styles.openOverlay}>
          <div className={styles.openModal}>

            {phase === 'flip' && (
              <div className={styles.flipWrap}>
                <div className={styles.flipCard} />
                <p className={styles.flipText}>جاري الفتح...</p>
              </div>
            )}

            {phase === 'show' && results && (
              <>
                <p className={styles.revealTitle}>حصلت على</p>

                <div className={styles.itemsRow}>
                  {results.map((slot, idx) => {
                    const { item, isDuplicate, coinsCompensation } = slot;
                    const rc = RARITY_CONFIG[item.rarity];
                    const equipped = isEquipped(item);
                    return (
                      <div
                        key={idx}
                        className={styles.itemCard}
                        style={{
                          '--rc': rc.color,
                          animationDelay: `${idx * 0.12}s`,
                        }}
                      >
                        <div className={`${styles.itemGlow} ${styles[`glow_${item.rarity}`]}`} />
                        <span className={styles.itemRarity} style={{ color: rc.color }}>{rc.label}</span>
                        <div className={styles.itemImgWrap}>
                          <ItemPreview item={item} />
                        </div>
                        <span className={styles.itemName}>{item.name}</span>
                        {isDuplicate ? (
                          <span className={styles.dupTag}>+{coinsCompensation} <CoinIcon size="sm" /></span>
                        ) : equipped ? (
                          <span className={styles.equippedTag}>✓ مجهز</span>
                        ) : (
                          <button className={styles.equipSmBtn} onClick={() => handleEquip(item)}>
                            تجهيز
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button className={styles.closeBtn} onClick={closeResult}>حسناً</button>
              </>
            )}
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
