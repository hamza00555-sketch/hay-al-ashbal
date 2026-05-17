import { useEffect } from 'react';
import { SFX, stopMusic } from '../utils/sounds.js';
import styles from './ResultPage.module.css';

function fmt(n) { return Math.round(n).toLocaleString('ar-SA'); }

export default function ResultPage({ result, onPlayAgain, onMenu }) {
  const won = result.phase === 'won';

  useEffect(() => {
    stopMusic();
    if (won) SFX.win();
    else SFX.lose();
  }, [won]);

  const winMsg = result.winCondition === 'population'
    ? `وصلت مدينة "${result.cityName}" إلى ${fmt(result.finalPopulation)} ساكن!`
    : `حققت ثروة ${fmt(result.finalBudget)} ر.س!`;

  const loseMsg = result.loseCondition === 'bankrupt'
    ? 'نفدت خزينة المدينة... الأموال صفر!'
    : 'هجر السكان المدينة... لم يأتِ أحد!';

  return (
    <div className={`${styles.page} ${won ? styles.won : styles.lost}`}>
      <div className={styles.icon}>{won ? '🏆' : '💔'}</div>
      <h1 className={styles.title}>
        {won ? `مدينة ${result.cityName} تزدهر!` : 'المدينة أُهجرت'}
      </h1>
      <p className={styles.subtitle}>{won ? winMsg : loseMsg}</p>

      <div className={styles.stats}>
        <div className={styles.statRow}><span>📅 الشهر الأخير</span><strong>{result.finalMonth}</strong></div>
        <div className={styles.statRow}><span>👥 السكان</span><strong>{fmt(result.finalPopulation)}</strong></div>
        <div className={styles.statRow}><span>💰 الرصيد</span><strong>{fmt(result.finalBudget)} ر.س</strong></div>
        <div className={styles.statRow}><span>😊 الرضا</span><strong>{result.satisfactionScore}٪</strong></div>
        <div className={styles.statRow}><span>📈 إجمالي الدخل</span><strong>{fmt(result.totalEarned)} ر.س</strong></div>
      </div>

      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={onPlayAgain}>🏗️ ابنِ مدينة جديدة</button>
        <button className={styles.secondaryBtn} onClick={onMenu}>🏠 القائمة الرئيسية</button>
      </div>
    </div>
  );
}
