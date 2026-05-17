import { useState } from 'react';
import { BUILDINGS, BUILDING_CATEGORIES, BUILDING_ORDER } from '../constants/buildings.js';
import styles from './BuildingPicker.module.css';

const CATS = ['residential', 'commercial', 'service', 'industrial'];

export default function BuildingPicker({ budget, buildDiscount, onSelect, onClose }) {
  const [activeCat, setActiveCat] = useState('residential');

  const filtered = BUILDING_ORDER.filter(id => BUILDINGS[id].category === activeCat);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span>اختر مبنى للبناء</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.tabs}>
          {CATS.map(cat => {
            const catDef = BUILDING_CATEGORIES[cat];
            return (
              <button
                key={cat}
                className={`${styles.tab} ${activeCat === cat ? styles.activeTab : ''}`}
                style={activeCat === cat ? { borderColor: catDef.color, color: catDef.color } : {}}
                onClick={() => setActiveCat(cat)}
              >
                {catDef.emoji} {catDef.nameAr}
              </button>
            );
          })}
        </div>
        <div className={styles.grid}>
          {filtered.map(id => {
            const def = BUILDINGS[id];
            const cost = Math.round(def.buildCost * buildDiscount);
            const canAfford = budget >= cost;
            return (
              <button
                key={id}
                className={`${styles.card} ${!canAfford ? styles.disabled : ''}`}
                onClick={() => canAfford && onSelect(id)}
                disabled={!canAfford}
              >
                <span className={styles.cardEmoji}>{def.emoji}</span>
                <span className={styles.cardName}>{def.nameAr}</span>
                <span className={styles.cardCost}>{cost.toLocaleString('ar-SA')} ر.س</span>
                <span className={styles.cardDesc}>{def.description}</span>
                {def.category === 'residential' && (
                  <span className={styles.cardStat}>🏠 سعة {def.capacity} ساكن</span>
                )}
                {def.incomeType === 'monthly' && (
                  <span className={styles.cardStat}>💰 {def.monthlyIncome.toLocaleString('ar-SA')} ر.س/شهر</span>
                )}
                {def.satisfactionBonus > 0 && (
                  <span className={styles.cardStat}>😊 +{def.satisfactionBonus} رضا (r={def.effectRadius})</span>
                )}
                {def.pollutionPenalty > 0 && (
                  <span className={styles.cardPollution}>⚠️ تلوث -{def.pollutionPenalty} (r={def.pollutionRadius})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
