import { useState } from 'react';
import { BUILDINGS } from '../constants/buildings.js';
import styles from './BuildingInfoPanel.module.css';

function fmt(n) { return Math.round(n).toLocaleString('ar-SA'); }

export default function BuildingInfoPanel({ cell, building, state, onBuild, onRent, onStopRent, onSell, onCancelSale, onDemolish, onClose }) {
  const [rentPrice, setRentPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [showRentForm, setShowRentForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);

  if (!cell) return null;

  const def = building ? BUILDINGS[building.typeId] : null;
  const isEmpty = !building;

  const marketValue = building ? (() => {
    const age = state.month - building.placedMonth;
    const popPremium = 1 + (state.population / 1000) * 0.2;
    const satMul = Math.max(0.3, state.satisfactionScore / 100);
    const dep = Math.max(0.5, 1 - age * 0.005);
    return Math.round(def.buildCost * popPremium * satMul * dep);
  })() : 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        {isEmpty ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🌿</span>
            <p>أرض فارغة</p>
            <button className={styles.primaryBtn} onClick={onBuild}>
              🏗️ ابنِ هنا
            </button>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <span className={styles.bigEmoji}>{def.emoji}</span>
              <div className={styles.info}>
                <h3>{def.nameAr}</h3>
                <p className={styles.desc}>{def.description}</p>
              </div>
            </div>

            <div className={styles.stats}>
              {def.category === 'residential' && (
                <>
                  <div className={styles.stat}><span>👥 السكان</span><strong>{building.occupants}/{def.capacity}</strong></div>
                  <div className={styles.stat}><span>🏷️ الحالة</span><strong>{building.status === 'owned' ? 'مملوك' : building.status === 'rented' ? '🟢 مُؤجَّر' : '🔴 للبيع'}</strong></div>
                  {building.status === 'rented' && <div className={styles.stat}><span>💰 الإيجار</span><strong>{fmt(building.rentPrice)} ر.س/ساكن</strong></div>}
                  {building.status === 'for_sale' && <div className={styles.stat}><span>🏷️ السعر</span><strong>{fmt(building.purchasePrice)} ر.س</strong></div>}
                </>
              )}
              {def.incomeType === 'monthly' && (
                <div className={styles.stat}><span>💰 الدخل الشهري</span><strong>{fmt(def.monthlyIncome)} ر.س</strong></div>
              )}
              <div className={styles.stat}><span>🔧 الصيانة</span><strong>{fmt(def.maintenancePerMonth)} ر.س/شهر</strong></div>
              <div className={styles.stat}><span>📊 قيمة السوق</span><strong>{fmt(marketValue)} ر.س</strong></div>
              {def.satisfactionBonus > 0 && <div className={styles.stat}><span>😊 نطاق الرضا</span><strong>+{def.satisfactionBonus} (r={def.effectRadius})</strong></div>}
              {def.pollutionPenalty > 0 && <div className={styles.stat} style={{ color: '#ff8a7a' }}><span>☁️ نطاق التلوث</span><strong>-{def.pollutionPenalty} (r={def.pollutionRadius})</strong></div>}
            </div>

            {/* Residential actions */}
            {def.category === 'residential' && building.status === 'owned' && !showRentForm && !showSaleForm && (
              <div className={styles.actions}>
                <button className={styles.primaryBtn} onClick={() => setShowRentForm(true)}>💰 تأجير</button>
                <button className={styles.secondaryBtn} onClick={() => setShowSaleForm(true)}>🏷️ بيع</button>
                <button className={styles.dangerBtn} onClick={onDemolish}>🔨 هدم</button>
              </div>
            )}
            {def.category === 'residential' && building.status === 'rented' && !showSaleForm && (
              <div className={styles.actions}>
                <button className={styles.secondaryBtn} onClick={onStopRent}>🚫 إيقاف التأجير</button>
                <button className={styles.secondaryBtn} onClick={() => setShowSaleForm(true)}>🏷️ بيع</button>
                <button className={styles.dangerBtn} onClick={onDemolish}>🔨 هدم</button>
              </div>
            )}
            {def.category === 'residential' && building.status === 'for_sale' && (
              <div className={styles.actions}>
                <p className={styles.saleNote}>بانتظار المشتري... (يُباع تلقائياً الشهر القادم إذا كان السعر مناسباً)</p>
                <button className={styles.secondaryBtn} onClick={onCancelSale}>❌ إلغاء البيع</button>
              </div>
            )}

            {/* Non-residential actions */}
            {def.category !== 'residential' && !showSaleForm && (
              <div className={styles.actions}>
                <button className={styles.secondaryBtn} onClick={() => setShowSaleForm(true)}>🏷️ بيع</button>
                <button className={styles.dangerBtn} onClick={onDemolish}>🔨 هدم</button>
              </div>
            )}

            {/* Rent form */}
            {showRentForm && (
              <div className={styles.form}>
                <label>سعر الإيجار لكل ساكن (ر.س)</label>
                <p className={styles.formHint}>الحد الأقصى: {fmt(def.baseRentPerResident * 2)} ر.س | الموصى به: {fmt(def.baseRentPerResident)} ر.س</p>
                <input
                  type="number"
                  className={styles.input}
                  value={rentPrice}
                  onChange={e => setRentPrice(e.target.value)}
                  placeholder={String(def.baseRentPerResident)}
                  min={0}
                  max={def.baseRentPerResident * 2}
                />
                <div className={styles.formActions}>
                  <button className={styles.primaryBtn} onClick={() => {
                    const price = Number(rentPrice) || def.baseRentPerResident;
                    onRent(price);
                    setShowRentForm(false);
                  }}>تأكيد التأجير</button>
                  <button className={styles.ghostBtn} onClick={() => setShowRentForm(false)}>إلغاء</button>
                </div>
              </div>
            )}

            {/* Sale form */}
            {showSaleForm && (
              <div className={styles.form}>
                <label>سعر البيع (ر.س)</label>
                <p className={styles.formHint}>قيمة السوق: {fmt(marketValue)} ر.س | الحد الأقصى: {fmt(marketValue * 1.1)} ر.س</p>
                <input
                  type="number"
                  className={styles.input}
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  placeholder={String(marketValue)}
                  min={0}
                  max={Math.round(marketValue * 1.1)}
                />
                <div className={styles.formActions}>
                  <button className={styles.primaryBtn} onClick={() => {
                    const price = Number(salePrice) || marketValue;
                    onSell(price);
                    setShowSaleForm(false);
                  }}>عرض للبيع</button>
                  <button className={styles.ghostBtn} onClick={() => setShowSaleForm(false)}>إلغاء</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
