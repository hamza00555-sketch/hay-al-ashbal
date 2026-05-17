import styles from './MonthReport.module.css';

function fmt(n) { return Math.round(n).toLocaleString('ar-SA'); }
function sign(n) { return n >= 0 ? `+${fmt(n)}` : `-${fmt(Math.abs(n))}`; }

export default function MonthReport({ report, onContinue }) {
  if (!report) return null;
  const { month, commercialIncome, rentIncome, saleIncome, eventBudget, totalIncome, totalExpenses, net, budgetAfter, populationBefore, populationAfter, satisfactionBefore, satisfactionAfter, newEvent } = report;
  const popDelta = populationAfter - populationBefore;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>تقرير الشهر {month}</h2>

        <div className={styles.section}>
          <div className={styles.row}><span>🏪 دخل تجاري وصناعي</span><span className={styles.green}>+{fmt(commercialIncome)}</span></div>
          <div className={styles.row}><span>🏠 إيجارات</span><span className={styles.green}>+{fmt(rentIncome)}</span></div>
          {saleIncome > 0 && <div className={styles.row}><span>🏷️ مبيعات</span><span className={styles.green}>+{fmt(saleIncome)}</span></div>}
          {eventBudget !== 0 && <div className={styles.row}><span>⚡ تأثير الحدث</span><span className={eventBudget > 0 ? styles.green : styles.red}>{sign(eventBudget)}</span></div>}
          <div className={styles.row}><span>🔧 مصاريف الصيانة</span><span className={styles.red}>-{fmt(totalExpenses)}</span></div>
        </div>

        <div className={styles.netRow}>
          <span>صافي الشهر</span>
          <strong className={net >= 0 ? styles.green : styles.red}>{sign(net)} ر.س</strong>
        </div>

        <div className={styles.section}>
          <div className={styles.row}><span>💰 الرصيد الجديد</span><strong>{fmt(budgetAfter)} ر.س</strong></div>
          <div className={styles.row}>
            <span>👥 السكان</span>
            <span>{fmt(populationAfter)} {popDelta !== 0 && <span className={popDelta > 0 ? styles.green : styles.red}>({sign(popDelta)})</span>}</span>
          </div>
          <div className={styles.row}>
            <span>😊 الرضا</span>
            <span>{satisfactionAfter}٪ {satisfactionAfter !== satisfactionBefore && <span className={satisfactionAfter > satisfactionBefore ? styles.green : styles.red}>({sign(satisfactionAfter - satisfactionBefore)})</span>}</span>
          </div>
        </div>

        {newEvent && (
          <div className={styles.eventAlert}>
            <span>{newEvent.emoji}</span>
            <div>
              <strong>{newEvent.nameAr}</strong>
              <p>{newEvent.descriptionAr}</p>
            </div>
          </div>
        )}

        <button className={styles.continueBtn} onClick={onContinue}>متابعة ▶</button>
      </div>
    </div>
  );
}
