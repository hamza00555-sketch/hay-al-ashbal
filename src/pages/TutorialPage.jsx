import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UNIQUE_CARDS } from '../constants/cards';
import { CardFace, CardBack } from '../components/Card';
import STEPS from '../tutorial/tutorialSteps';
import { markTutorialDone } from '../tutorial/tutorialStorage';
import styles from './TutorialPage.module.css';

// ── Scripted data ─────────────────────────────────────────────────
const PLAYER_HAND_CARD  = UNIQUE_CARDS.find(c => c.id === 2);
const PLAYER_DRAWN_CARD = UNIQUE_CARDS.find(c => c.id === 3);
const OPPONENT = { id: 99, name: 'خالد', hand: [UNIQUE_CARDS.find(c => c.id === 5)] };
const RULE_CARDS = {
  1: UNIQUE_CARDS.find(c => c.id === 1),
  4: UNIQUE_CARDS.find(c => c.id === 4),
  7: UNIQUE_CARDS.find(c => c.id === 7),
  8: UNIQUE_CARDS.find(c => c.id === 8),
};

// ── useRect: get element bounding rect by data-tut attr ───────────
function useRect(target) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!target) { setRect(null); return; }
    const el = document.querySelector(`[data-tut="${target}"]`);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [target]);
  return rect;
}

// ── SpotHole: visual-only golden ring + dim (pointer-events:none) ─
function SpotHole({ target }) {
  const rect = useRect(target);
  if (!target || !rect) return null;
  return (
    <div
      className={styles.spotHole}
      style={{ top: rect.top - 12, left: rect.left - 12, width: rect.width + 24, height: rect.height + 24 }}
    />
  );
}

// ── SpotClickTarget: portal above overlay, intercepts correct tap ─
function SpotClickTarget({ target, onClick }) {
  const rect = useRect(target);
  if (!target || !rect) return null;
  return createPortal(
    <div
      className={styles.spotTarget}
      style={{ top: rect.top - 12, left: rect.left - 12, width: rect.width + 24, height: rect.height + 24 }}
      onClick={e => { e.stopPropagation(); onClick(); }}
    />,
    document.body
  );
}

// ── TutArrow: bouncing arrow pointing at target ───────────────────
function TutArrow({ target }) {
  const rect = useRect(target);
  if (!target || !rect) return null;
  const aboveTarget = rect.top > window.innerHeight * 0.5;
  return (
    <div
      className={styles.arrow}
      style={{
        top:  aboveTarget ? rect.top - 60 : rect.bottom + 10,
        left: rect.left + rect.width / 2 - 20,
      }}
    >
      {aboveTarget ? '▼' : '▲'}
    </div>
  );
}

// ── TutBubble: coach speech bubble ───────────────────────────────
function TutBubble({ text, pos, showTapHint }) {
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
      {showTapHint && <p className={styles.tapHint}>اضغط في أي مكان للمتابعة ▼</p>}
    </div>
  );
}

// ── WrongToast: gentle "wrong area" message ───────────────────────
function WrongToast({ show }) {
  if (!show) return null;
  return (
    <div className={styles.wrongToast}>
      ✨ اضغط على المكان المضيء!
    </div>
  );
}

// ── ProgressDots ─────────────────────────────────────────────────
function ProgressDots({ stepIdx }) {
  return (
    <div className={styles.progress}>
      {STEPS.map((s, i) => (
        <div
          key={s.id}
          className={[
            styles.dot,
            i < stepIdx  ? styles.dotDone    : '',
            i === stepIdx ? styles.dotCurrent : '',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ── RewardScreen ─────────────────────────────────────────────────
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
      <button className={styles.rewardPlayBtn} onClick={onComplete}>
        العب الآن! 🎮
      </button>
      <button className={styles.rewardRetryBtn} onClick={onRetry}>
        أعد التدريب
      </button>
    </div>
  );
}

// ── PracticeMode ─────────────────────────────────────────────────
function PracticeMode({ onDone }) {
  const [sub, setSub]       = useState(0);
  const [drawn, setDrawn]   = useState(false);
  const [taps, setTaps]     = useState(0);
  const [result, setResult] = useState(false);

  const onDoneCb = useCallback(onDone, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (sub !== 3) return;
    setResult(true);
    const t = setTimeout(onDoneCb, 1600);
    return () => clearTimeout(t);
  }, [sub, onDoneCb]);

  const texts = [
    'اسحب من الكومة! 👇',
    'اضغط على البطاقة مرتين للعبها 👆',
    'اضغط على خالد! 👆',
    'أحسنت! 🎉',
  ];

  return (
    <div className={styles.practiceWrap}>
      <div className={styles.practiceBubble}>
        <span className={styles.lionAvatar}>🦁</span>
        <p className={styles.bubbleText}>{texts[Math.min(sub, 3)]}</p>
      </div>

      {result ? (
        <div className={styles.practiceResult}>
          <p className={styles.practiceResultText}>نظرت في كرت خالد! 👀</p>
          <CardFace card={OPPONENT.hand[0]} size="large" />
        </div>
      ) : (
        <div className={styles.practiceBoard}>
          {/* Opponent */}
          <div
            className={`${styles.practiceOpponent} ${sub === 2 ? styles.practiceTarget : ''}`}
            onClick={() => sub === 2 && setSub(3)}
          >
            <CardBack size="small" />
            <span className={styles.practiceName}>{OPPONENT.name}</span>
            {sub === 2 && <span className={styles.tapMeLabel}>اضغط! 👆</span>}
          </div>

          {/* Deck */}
          <div
            className={`${styles.practiceDeck} ${sub === 0 ? styles.practiceTarget : ''}`}
            onClick={() => { if (sub === 0) { setDrawn(true); setSub(1); } }}
          >
            {drawn
              ? <div className={styles.deckEmpty}>—</div>
              : <CardBack size="small" />}
            <span className={styles.deckLabel}>الكومة</span>
            {sub === 0 && <span className={styles.tapMeLabel}>اضغط! 👇</span>}
          </div>

          {/* Hand */}
          <div className={styles.practiceHand}>
            <div
              className={`${styles.practiceHandCard} ${sub === 1 ? styles.practiceTarget : ''}`}
              onClick={() => {
                if (sub !== 1) return;
                const n = taps + 1;
                setTaps(n);
                if (n >= 2) setSub(2);
              }}
            >
              <CardFace card={PLAYER_HAND_CARD} size="normal" />
              {sub === 1 && <span className={styles.tapMeLabel}>اضغط مرتين! 👆</span>}
            </div>
            {drawn && (
              <div className={styles.practiceHandCard}>
                <CardFace card={PLAYER_DRAWN_CARD} size="normal" dimmed />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main TutorialPage ─────────────────────────────────────────────
export default function TutorialPage({ onComplete, onSkip, onRetry }) {
  const [stepIdx,    setStepIdx]    = useState(0);
  const [drawn,      setDrawn]      = useState(false);
  const [focused,    setFocused]    = useState(false);
  const [wrongTap,   setWrongTap]   = useState(false);
  const [showReward, setShowReward] = useState(false);

  const step = STEPS[stepIdx];

  const advance = useCallback(() => {
    if (stepIdx >= STEPS.length - 1) {
      markTutorialDone();
      setShowReward(true);
      return;
    }
    setStepIdx(i => i + 1);
  }, [stepIdx]);

  // Auto-advance for REWARD step
  useEffect(() => {
    if (step?.isReward) { markTutorialDone(); setShowReward(true); }
  }, [step?.isReward]); // eslint-disable-line react-hooks/exhaustive-deps

  function wrongTapFx() {
    setWrongTap(true);
    setTimeout(() => setWrongTap(false), 700);
  }

  // Dim overlay click: advance if TAP_ANYWHERE, else show wrong tap
  function handleOverlayClick() {
    if (step?.trigger === 'TAP_ANYWHERE') advance();
    else wrongTapFx();
  }

  // Correct action when user taps the spotlighted element
  function handleTargetClick() {
    switch (step?.trigger) {
      case 'TAP_ANYWHERE': advance(); break;
      case 'TAP_DECK':     setDrawn(true); advance(); break;
      case 'TAP_HAND':     setFocused(true); advance(); break;
      case 'TAP_PLAY':     if (focused) advance(); break;
      case 'TAP_CONFIRM':  advance(); break;
      default:             advance();
    }
  }

  // ── Reward ──────────────────────────────────────────────────────
  if (showReward || step?.isReward) {
    return (
      <div className={styles.board} dir="rtl">
        <RewardScreen onComplete={onComplete} onRetry={onRetry} />
      </div>
    );
  }

  // ── Rule card steps (8-11) ──────────────────────────────────────
  if (step?.ruleCard) {
    const card = RULE_CARDS[step.ruleCard.id];
    return (
      <div className={styles.board} dir="rtl">
        <button className={styles.skipBtn} onClick={() => { markTutorialDone(); onSkip(); }}>
          تخطي
        </button>
        <ProgressDots stepIdx={stepIdx} />
        <div className={styles.ruleScreen}>
          <div className={styles.ruleCardWrap}>
            <CardFace card={card} size="large" />
          </div>
          <div className={styles.ruleBubble}>
            <span className={styles.lionAvatar}>🦁</span>
            <p className={styles.bubbleText}>{step.bubble.text}</p>
          </div>
          <button className={styles.nextBtn} onClick={advance}>التالي ▶</button>
        </div>
      </div>
    );
  }

  // ── Practice mode (step 12) ─────────────────────────────────────
  if (step?.isPractice) {
    return (
      <div className={styles.board} dir="rtl">
        <button className={styles.skipBtn} onClick={() => { markTutorialDone(); onSkip(); }}>
          تخطي
        </button>
        <ProgressDots stepIdx={stepIdx} />
        <PracticeMode onDone={advance} />
      </div>
    );
  }

  // ── Normal board steps (0–6) ────────────────────────────────────
  const showDrawnCard = drawn && stepIdx >= 3; // show after DRAW step

  return (
    <div className={styles.board} dir="rtl">
      {/* Skip */}
      <button className={styles.skipBtn} onClick={() => { markTutorialDone(); onSkip(); }}>
        تخطي
      </button>
      <ProgressDots stepIdx={stepIdx} />

      {/* Wrong-tap toast */}
      <WrongToast show={wrongTap} />

      {/*
        DIM OVERLAY (z-index 997, pointer-events: all)
        - Covers whole screen
        - TAP_ANYWHERE → advance
        - Other → showWrongTap
      */}
      <div className={styles.dimOverlay} onClick={handleOverlayClick} />

      {/*
        SPOT HOLE (z-index 998, pointer-events: none)
        - Visual cutout via box-shadow
        - Pulsing gold border on target
      */}
      {step?.spot && <SpotHole target={step.spot} />}

      {/*
        SPOT CLICK TARGET (portal, z-index 1001)
        - Transparent div positioned exactly over the target
        - Intercepts the correct tap
      */}
      {step?.spot && <SpotClickTarget target={step.spot} onClick={handleTargetClick} />}

      {/* Arrow (z-index 1003) */}
      {step?.arrow && <TutArrow target={step.arrow} />}

      {/* Bubble (z-index 1005) */}
      {step?.bubble && (
        <TutBubble
          text={step.bubble.text}
          pos={step.bubble.pos}
          showTapHint={step.trigger === 'TAP_ANYWHERE'}
        />
      )}

      {/* ── Board layout ── */}
      <div className={styles.boardInner}>
        {/* Opponent seat */}
        <div className={styles.opponentSeat} data-tut="opponent">
          <CardBack size="small" />
          <span className={styles.seatName}>{OPPONENT.name}</span>
        </div>

        {/* Arena: deck */}
        <div className={styles.arena}>
          <div className={styles.deckStack} data-tut="deck">
            <CardBack size="normal" />
            <span className={styles.deckCount}>الكومة</span>
          </div>
        </div>

        {/* Player hand */}
        <div className={styles.humanZone}>
          <div className={styles.hand} data-tut="hand-area">
            {/* Hand card (always visible) */}
            <div className={styles.cardSlot} data-tut="hand-card">
              <CardFace
                card={PLAYER_HAND_CARD}
                size="normal"
                focused={focused && step?.id === 'PLAY_CARD'}
              />
            </div>
            {/* Drawn card (appears after step 3) */}
            {showDrawnCard && (
              <div className={styles.cardSlot} data-tut="drawn-card">
                <CardFace card={PLAYER_DRAWN_CARD} size="normal" dimmed />
              </div>
            )}
          </div>
        </div>

        {/* Confirm area: only for SEE_RESULT */}
        {step?.id === 'SEE_RESULT' && (
          <div className={styles.confirmArea} data-tut="confirm">
            <div className={styles.resultMessage}>نظرت في كرت خالد! 👀</div>
            <button className={styles.confirmBtn} onClick={e => { e.stopPropagation(); advance(); }}>
              حسناً ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
