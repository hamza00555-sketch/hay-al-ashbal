import { useState, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UNIQUE_CARDS } from '../constants/cards';
import { CardFace, CardBack } from '../components/Card';
import { markTutorialDone } from '../tutorial/tutorialStorage';
import styles from './TutorialPage.module.css';

// ── Step IDs ───────────────────────────────────────────────────────
const S = {
  WELCOME:       0,
  ROUND_WIN:     1,
  START_TURN:    2,
  DRAW_RESULT:   3,
  PLAY_CAFE:     4,
  CHOOSE_TARGET: 5,
  GUESS_CARD:    6,
  GUESS_RESULT:  7,
  INFO_CARD:     8,
  PROTECTION:    9,
  FORCED_RULE:   10,
  DANGER_STAR:   11,
  MINI_TEST:     12,
  REWARD:        13,
};
const TOTAL = 14;

// ── Scripted cards ─────────────────────────────────────────────────
const C       = id => UNIQUE_CARDS.find(c => c.id === id);
const MAQHA   = C(1);
const MAKTABA = C(2);
const TAJIR   = C(3);
const JARA    = C(4);
const MUHAND  = C(5);
const BUSTAN  = C(7);
const NAJMA   = C(8);

// ── Helpers ────────────────────────────────────────────────────────
function useRect(key) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!key) { setRect(null); return; }
    const el = document.querySelector(`[data-tut="${key}"]`);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [key]);
  return rect;
}

function SpotHole({ k }) {
  const rect = useRect(k);
  if (!k || !rect) return null;
  return (
    <div
      className={styles.spotHole}
      style={{ top: rect.top - 12, left: rect.left - 12, width: rect.width + 24, height: rect.height + 24 }}
    />
  );
}

function SpotClick({ k, onClick }) {
  const rect = useRect(k);
  if (!k || !rect) return null;
  return createPortal(
    <div
      className={styles.spotTarget}
      style={{ top: rect.top - 12, left: rect.left - 12, width: rect.width + 24, height: rect.height + 24 }}
      onClick={e => { e.stopPropagation(); onClick(); }}
    />,
    document.body
  );
}

function Arrow({ k }) {
  const rect = useRect(k);
  if (!k || !rect) return null;
  const above = rect.top > window.innerHeight * 0.5;
  return (
    <div
      className={styles.arrow}
      style={{ top: above ? rect.top - 60 : rect.bottom + 10, left: rect.left + rect.width / 2 - 20 }}
    >
      {above ? '▼' : '▲'}
    </div>
  );
}

function Bubble({ text, pos = 'bottom', tapAny = false }) {
  const cls = [
    styles.bubble,
    pos === 'top'    ? styles.bubbleTop    :
    pos === 'center' ? styles.bubbleCenter : styles.bubbleBottom,
  ].join(' ');
  return (
    <div className={cls}>
      <div className={styles.bubbleInner}>
        <span className={styles.lionAvatar}>🦁</span>
        <p className={styles.bubbleText}>{text}</p>
      </div>
      {tapAny && <p className={styles.tapHint}>اضغط في أي مكان للمتابعة ▼</p>}
    </div>
  );
}

function Dots({ step }) {
  return (
    <div className={styles.progress}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <div
          key={i}
          className={[styles.dot, i < step ? styles.dotDone : '', i === step ? styles.dotCurrent : ''].join(' ')}
        />
      ))}
    </div>
  );
}

function RewardScreen({ onComplete, onRetry }) {
  return (
    <div className={styles.rewardScreen}>
      <div className={styles.confettiWrap}>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} style={{ '--i': i }} className={styles.confettiPiece} />
        ))}
      </div>
      <div className={styles.rewardEmoji}>🏆</div>
      <h1 className={styles.rewardTitle}>أحسنت يا شبل!</h1>
      <p className={styles.rewardText}>أنت الآن جاهز للعب مع الأصحاب 🎉</p>
      <div className={styles.rewardStars}>⭐⭐⭐</div>
      <button className={styles.rewardPlayBtn} onClick={onComplete}>العب الآن! 🎮</button>
      <button className={styles.rewardRetryBtn} onClick={onRetry}>أعد التدريب</button>
    </div>
  );
}

// ── Hand cards per step ────────────────────────────────────────────
function getHandCards(step) {
  if (step === S.FORCED_RULE) return [
    { card: BUSTAN, tutKey: 'garden-card', playable: true  },
    { card: MUHAND, tutKey: null,          playable: false },
  ];
  if (step === S.DANGER_STAR) return [
    { card: NAJMA, tutKey: 'najma-card', playable: false },
    { card: TAJIR, tutKey: 'safe-card',  playable: true  },
  ];
  if (step === S.PROTECTION) return [
    { card: JARA,    tutKey: null, playable: false },
  ];
  if (step === S.INFO_CARD) return [
    { card: MAKTABA, tutKey: null, playable: false },
  ];
  if (step >= S.CHOOSE_TARGET) return [
    { card: MAKTABA, tutKey: null, playable: false },
  ];
  if (step === S.PLAY_CAFE) return [
    { card: MAKTABA, tutKey: null,        playable: false },
    { card: MAQHA,   tutKey: 'cafe-card', playable: true  },
  ];
  if (step === S.DRAW_RESULT) return [
    { card: MAKTABA, tutKey: null, playable: false },
    { card: MAQHA,   tutKey: null, playable: false },
  ];
  // START_TURN
  return [{ card: MAKTABA, tutKey: null, playable: false }];
}

// ── Main component ─────────────────────────────────────────────────
export default function TutorialPage({ onComplete, onSkip, onRetry }) {
  const [step,     setStep]     = useState(0);
  const [wrongTap, setWrongTap] = useState(false);
  const [starWarn, setStarWarn] = useState(false);

  const advance = useCallback(() => setStep(s => s + 1), []);

  function wrongFx() {
    setWrongTap(true);
    setTimeout(() => setWrongTap(false), 700);
  }

  function showStarWarn() {
    setStarWarn(true);
    setTimeout(() => setStarWarn(false), 1600);
  }

  // ── WELCOME ──────────────────────────────────────────────────────
  if (step === S.WELCOME) {
    return (
      <div className={styles.board} dir="rtl">
        <div className={styles.welcomeScreen}>
          <div className={styles.welcomeCard}>
            <div className={styles.welcomeLion}>🦁</div>
            <h1 className={styles.welcomeTitle}>مرحباً بك في<br />حي الأشبال!</h1>
            <p className={styles.welcomeText}>هدفك تبقى للنهاية أو تحتفظ بأعلى كرت!</p>
            <button className={styles.startBtn} onClick={advance}>ابدأ التدريب ▶</button>
            <button className={styles.skipLink} onClick={() => { markTutorialDone(); onSkip(); }}>تخطي التدريب</button>
          </div>
        </div>
      </div>
    );
  }

  // ── REWARD ───────────────────────────────────────────────────────
  if (step === S.REWARD) {
    markTutorialDone();
    return (
      <div className={styles.board} dir="rtl">
        <RewardScreen onComplete={onComplete} onRetry={onRetry} />
      </div>
    );
  }

  // ── ROUND_WIN concept ────────────────────────────────────────────
  if (step === S.ROUND_WIN) {
    return (
      <div className={styles.board} dir="rtl">
        <button className={styles.skipBtn} onClick={() => { markTutorialDone(); onSkip(); }}>تخطي</button>
        <Dots step={step} />
        <div className={styles.dimOverlay} onClick={advance} />
        <Bubble pos="top" text="تفوز بالجولة إذا بقيت الأخير، أو امتلكت أعلى كرت عند نفاد الورق" tapAny />
        <div className={styles.conceptScene}>
          <div className={styles.winPair}>
            <div className={styles.winOption}>
              <span className={styles.winIcon}>🏆</span>
              <span className={styles.winLabel}>آخر لاعب متبقٍ</span>
            </div>
            <div className={styles.orBadge}>أو</div>
            <div className={styles.winOption}>
              <span className={styles.winIcon}>🃏</span>
              <span className={styles.winLabel}>أعلى كرت عند نفاد الورق</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Board steps (2–12) ───────────────────────────────────────────
  const spotMap = {
    [S.START_TURN]:    'deck',
    [S.PLAY_CAFE]:     'cafe-card',
    [S.CHOOSE_TARGET]: 'opponent',
    [S.FORCED_RULE]:   'garden-card',
    [S.DANGER_STAR]:   'safe-card',
  };
  const spotKey   = spotMap[step] ?? null;
  const tapAny    = [S.DRAW_RESULT, S.GUESS_RESULT, S.INFO_CARD, S.PROTECTION].includes(step);
  const showHand  = ![S.GUESS_CARD, S.GUESS_RESULT, S.MINI_TEST].includes(step);
  const handCards = getHandCards(step);

  function handleOverlay() {
    if (tapAny) advance();
    else wrongFx();
  }

  return (
    <div className={styles.board} dir="rtl">
      <button className={styles.skipBtn} onClick={() => { markTutorialDone(); onSkip(); }}>تخطي</button>
      <Dots step={step} />

      {wrongTap && <div className={styles.wrongToast}>✨ اضغط على المكان المضيء!</div>}
      {starWarn && <div className={styles.starWarning}>⭐ خطر! النجمة تُقصيك إن رميتها!</div>}

      {/* Dim overlay — catches wrong taps, advances on tap-any steps */}
      <div className={styles.dimOverlay} onClick={handleOverlay} />

      {/* Spotlight hole */}
      {spotKey && <SpotHole k={spotKey} />}

      {/* Spotlight click targets */}
      {spotKey && step !== S.DANGER_STAR && <SpotClick k={spotKey} onClick={advance} />}
      {step === S.DANGER_STAR && <>
        <SpotClick k="safe-card"  onClick={advance}      />
        <SpotClick k="najma-card" onClick={showStarWarn} />
      </>}

      {/* Arrow pointing at spotlit element */}
      {spotKey && step !== S.GUESS_CARD && <Arrow k={spotKey} />}

      {/* ── Speech bubbles ────────────────────────────────────── */}
      {step === S.START_TURN    && <Bubble pos="top"    text="هذا دورك! اسحب من الكومة 👇" />}
      {step === S.DRAW_RESULT   && <Bubble pos="bottom" text="سحبت كرتاً جديداً! لديك الآن كرتان — اختر أيهما تلعب" tapAny />}
      {step === S.PLAY_CAFE     && <Bubble pos="bottom" text="العب صاحبة المقهى ☕ — ستخمّن كرت خالد!" />}
      {step === S.CHOOSE_TARGET && <Bubble pos="top"    text="الآن اختر خالد هدفاً 👆" />}
      {step === S.GUESS_CARD    && <Bubble pos="top"    text="ماذا يحمل خالد؟ اختر الكرت الصحيح" />}
      {step === S.GUESS_RESULT  && <Bubble pos="top"    text="أصبت! خالد كان يحمل مهندسة الكهرباء — خرج من الجولة! 🎉" tapAny />}
      {step === S.INFO_CARD     && <Bubble pos="bottom" text="أمينة المكتبة 📚 — تشاهد كرت لاعب آخر سراً" tapAny />}
      {step === S.PROTECTION    && <Bubble pos="top"    text="الجارة اليقظة 🛡️ تحميك من تأثيرات الآخرين حتى دورك القادم" tapAny />}
      {step === S.FORCED_RULE   && <Bubble pos="bottom" text="تحذير! معك مهندس الكهرباء — يجب رمي البستان 🌿" />}
      {step === S.DANGER_STAR   && <Bubble pos="bottom" text="خطر! النجمة ⭐ تُقصيك إن رميتها — العب التاجرة بدلاً منها!" />}
      {step === S.MINI_TEST     && <Bubble pos="top"    text="اختبار! أيهما تلعب لتخمّن كرت خالد وتُقصيه؟" />}

      {/* ── Guess options (step 6) ───────────────────────────── */}
      {step === S.GUESS_CARD && (
        <div className={styles.guessScene}>
          {[TAJIR, MUHAND, JARA].map(card => (
            <button
              key={card.id}
              className={styles.guessBtn}
              onClick={e => { e.stopPropagation(); card.id === MUHAND.id ? advance() : wrongFx(); }}
            >
              <CardFace card={card} size="small" />
              <span className={styles.guessLabel}>{card.role}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Guess result (step 7) ────────────────────────────── */}
      {step === S.GUESS_RESULT && (
        <div className={styles.revealScene}>
          <p className={styles.revealLabel}>كرت خالد كان:</p>
          <CardFace card={MUHAND} size="large" />
          <p className={styles.revealResult}>خالد خرج! 💀</p>
          <button className={styles.confirmBtn} onClick={e => { e.stopPropagation(); advance(); }}>
            فهمت ✓
          </button>
        </div>
      )}

      {/* ── Info card (step 8) ───────────────────────────────── */}
      {step === S.INFO_CARD && (
        <div className={styles.infoScene}>
          <CardFace card={MAKTABA} size="large" />
          <p className={styles.infoAbility}>{MAKTABA.ability}</p>
        </div>
      )}

      {/* ── Protection demo (step 9) ─────────────────────────── */}
      {step === S.PROTECTION && (
        <div className={styles.protectionScene}>
          <div className={styles.shieldTarget}>
            <CardBack size="small" />
            <span className={styles.shieldName}>خالد</span>
            <span className={styles.shieldBadge}>🛡️ محمي</span>
          </div>
          <div className={styles.shieldArrow}>←</div>
          <div className={styles.shieldAttack}>
            <span className={styles.shieldBlock}>✗</span>
            <span className={styles.shieldBlockTxt}>مُعاق</span>
          </div>
        </div>
      )}

      {/* ── Mini test (step 12) ──────────────────────────────── */}
      {step === S.MINI_TEST && (
        <div className={styles.testScene}>
          <button className={styles.testCard} onClick={e => { e.stopPropagation(); advance(); }}>
            <CardFace card={MAQHA} size="normal" playable />
            <span className={styles.testLabel}>{MAQHA.role}</span>
          </button>
          <button className={styles.testCard} onClick={e => { e.stopPropagation(); wrongFx(); }}>
            <CardFace card={MAKTABA} size="normal" />
            <span className={styles.testLabel}>{MAKTABA.role}</span>
          </button>
        </div>
      )}

      {/* ── Game board (background, always shown for steps 2–12) */}
      <div className={styles.gameBoard}>
        {/* Opponent */}
        <div className={styles.oppRow} data-tut="opponent">
          <CardBack size="small" />
          <span className={styles.oppName}>خالد</span>
        </div>

        {/* Arena / deck */}
        <div className={styles.arenaRow}>
          <div className={styles.deckSlot} data-tut="deck">
            <CardBack size="normal" />
            <span className={styles.deckLbl}>الكومة</span>
          </div>
        </div>

        {/* Player hand */}
        {showHand && (
          <div className={styles.handRow}>
            {handCards.map(({ card, tutKey, playable }, i) => (
              <div
                key={i}
                className={styles.handSlot}
                {...(tutKey ? { 'data-tut': tutKey } : {})}
              >
                <CardFace card={card} size="normal" playable={playable} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
