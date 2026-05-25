import { useState } from 'react';
import { STORE_ITEMS, RARITY_CONFIG } from '../utils/storeData';
import { loadProfile, saveProfile } from '../utils/playerProfile';
import { getDailyProgress } from '../utils/economy';
import PlayerAvatar from '../components/PlayerAvatar';
import { SFX } from '../utils/sounds';
import styles from './StorePage.module.css';

const TABS     = [{ id: 'avatar', label: 'صور الشخصية' }, { id: 'frame', label: 'الإطارات' }];
const RARITIES = ['all', 'common', 'rare', 'epic', 'legendary'];
const R_LABEL  = { all: 'الكل', common: 'شائع', rare: 'نادر', epic: 'ملحمي', legendary: 'أسطوري' };

export default function StorePage({ onBack }) {
  const [profile,  setProfile]  = useState(() => loadProfile());
  const [tab,      setTab]      = useState('avatar');
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [toast,    setToast]    = useState(null);

  const daily = getDailyProgress();

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }

  const isOwned    = item => (profile.inventory ?? []).includes(item.id);
  const isEquipped = item => item.type === 'avatar'
    ? profile.cardImageId === item.cardImageId
    : profile.frameShape === item.frameShape && profile.frameColor === item.frameColor;

  function handleBuy(item) {
    if ((profile.coins ?? 0) < item.price) {
      showToast(`تحتاج ${(item.price - (profile.coins ?? 0)).toLocaleString('ar-SA')} ⭐ إضافية`, 'error');
      return;
    }
    setConfirm(item);
  }

  function confirmBuy() {
    const item = confirm;
    const next = {
      ...profile,
      coins:     (profile.coins ?? 0) - item.price,
      inventory: [...(profile.inventory ?? []), item.id],
    };
    if (item.type === 'avatar') next.cardImageId = item.cardImageId;
    else { next.frameShape = item.frameShape; next.frameColor = item.frameColor; }
    setProfile(next);
    saveProfile(next);
    setConfirm(null);
    setSelected(null);
    SFX.confirmOk();
    showToast(`حصلت على "${item.name}"! 🎉`);
  }

  function handleEquip(item) {
    const next = { ...profile };
    if (item.type === 'avatar') next.cardImageId = item.cardImageId;
    else { next.frameShape = item.frameShape; next.frameColor = item.frameColor; }
    setProfile(next);
    saveProfile(next);
    SFX.cardSelect();
    showToast(`تم تجهيز "${item.name}"`);
  }

  function previewProps(item) {
    return {
      cardImageId: item.type === 'avatar' ? item.cardImageId : profile.cardImageId,
      frameShape:  item.type === 'frame'  ? item.frameShape  : profile.frameShape,
      frameColor:  item.type === 'frame'  ? item.frameColor  : profile.frameColor,
    };
  }

  const items = STORE_ITEMS.filter(i => i.type === tab && (filter === 'all' || i.rarity === filter));

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => { SFX.buttonClick(); onBack(); }}>‹ رجوع</button>
        <h2 className={styles.title}>🏪 المتجر</h2>
        <div className={styles.coinBadge}>
          <span>⭐</span>
          <span className={styles.coinAmt}>{(profile.coins ?? 0).toLocaleString('ar-SA')}</span>
        </div>
      </div>

      {/* ── Daily progress ── */}
      <div className={styles.dailyBar}>
        <div className={styles.dailyLabel}>
          <span>نجوم اليوم</span>
          <span>{daily.earned} / {daily.hardCap} ⭐</span>
        </div>
        <div className={styles.dailyTrack}>
          <div
            className={styles.dailyFill}
            style={{ width: `${Math.min(100, (daily.earned / daily.hardCap) * 100)}%`,
                     background: daily.earned >= daily.softCap ? '#ff9944' : '#60b8ff' }}
          />
          <div className={styles.softCapMark} style={{ left: `${(daily.softCap / daily.hardCap) * 100}%` }} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => { SFX.buttonClick(); setTab(t.id); setFilter('all'); }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Rarity filter ── */}
      <div className={styles.filters}>
        {RARITIES.map(r => (
          <button key={r}
            className={`${styles.filterBtn} ${filter === r ? styles.filterActive : ''}`}
            style={filter === r && r !== 'all' ? { background: RARITY_CONFIG[r].color, borderColor: RARITY_CONFIG[r].color, color: '#fff' } : {}}
            onClick={() => setFilter(r)}
          >{R_LABEL[r]}</button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className={styles.grid}>
        {items.map(item => {
          const owned    = isOwned(item);
          const equipped = isEquipped(item);
          const rc       = RARITY_CONFIG[item.rarity];
          const afford   = (profile.coins ?? 0) >= item.price;
          return (
            <div key={item.id}
              className={`${styles.card} ${equipped ? styles.cardEquipped : ''} ${item.rarity === 'legendary' ? styles.cardLegendary : ''}`}
              style={{ '--rc': rc.color }}
              onClick={() => setSelected(item)}
            >
              <div className={styles.cardBar} style={{ background: rc.color }} />
              <div className={styles.cardImg}>
                <PlayerAvatar {...previewProps(item)} size="md" />
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardRarity} style={{ color: rc.color }}>{rc.label}</span>
                <span className={styles.cardName}>{item.name}</span>
                {equipped ? (
                  <span className={styles.equippedTag}>✓ مجهز</span>
                ) : owned ? (
                  <button className={styles.equipBtn} onClick={e => { e.stopPropagation(); handleEquip(item); }}>تجهيز</button>
                ) : (
                  <button
                    className={`${styles.buyBtn} ${!afford ? styles.buyBtnOff : ''}`}
                    onClick={e => { e.stopPropagation(); handleBuy(item); }}
                  >⭐ {item.price.toLocaleString('ar-SA')}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Item detail modal ── */}
      {selected && !confirm && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelected(null)}>✕</button>
            <div className={styles.modalImg}>
              <PlayerAvatar {...previewProps(selected)} size="xl" />
              {selected.rarity === 'legendary' && <div className={styles.legendaryGlow} />}
            </div>
            <span className={styles.modalRarity} style={{ color: RARITY_CONFIG[selected.rarity].color }}>
              {RARITY_CONFIG[selected.rarity].label}
            </span>
            <h3 className={styles.modalName}>{selected.name}</h3>
            {isEquipped(selected) ? (
              <div className={styles.modalEquipped}>✓ مجهز الآن</div>
            ) : isOwned(selected) ? (
              <button className={styles.modalEquipBtn} onClick={() => { handleEquip(selected); setSelected(null); }}>
                تجهيز الآن
              </button>
            ) : (
              <>
                <p className={styles.modalPrice}>⭐ {selected.price.toLocaleString('ar-SA')}</p>
                <p className={styles.modalBal}>رصيدك: {(profile.coins ?? 0).toLocaleString('ar-SA')} ⭐</p>
                <button
                  className={`${styles.modalBuyBtn} ${(profile.coins ?? 0) < selected.price ? styles.modalBuyOff : ''}`}
                  onClick={() => handleBuy(selected)}
                >
                  {(profile.coins ?? 0) >= selected.price
                    ? 'شراء'
                    : `تحتاج ${(selected.price - (profile.coins ?? 0)).toLocaleString('ar-SA')} ⭐ أكثر`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Buy confirm ── */}
      {confirm && (
        <div className={styles.overlay} onClick={() => setConfirm(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>تأكيد الشراء</h3>
            <PlayerAvatar {...previewProps(confirm)} size="lg" />
            <p className={styles.confirmName}>{confirm.name}</p>
            <p className={styles.confirmDeduct}>سيُخصم: ⭐ {confirm.price.toLocaleString('ar-SA')}</p>
            <p className={styles.confirmAfter}>
              رصيدك بعد الشراء: ⭐ {((profile.coins ?? 0) - confirm.price).toLocaleString('ar-SA')}
            </p>
            <div className={styles.confirmBtns}>
              <button className={styles.confirmYes} onClick={confirmBuy}>تأكيد</button>
              <button className={styles.confirmNo}  onClick={() => setConfirm(null)}>إلغاء</button>
            </div>
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
