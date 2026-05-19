import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { UNIQUE_CARDS } from '../constants/cards';
import { CardFace, CardBack } from '../components/Card';
import STEPS from '../tutorial/tutorialSteps';
import { markTutorialDone } from '../tutorial/tutorialStorage';
import styles from './TutorialPage.module.css';

// ── Scripted game data ────────────────────────────────────────────
const PLAYER_HAND_CARD  = UNIQUE_CARDS.find(c => c.id === 2); // Library (peek)
const PLAYER_DRAWN_CARD = UNIQUE_CARDS.find(c => c.id === 3); // Merchant (compare)
const OPPONENT = {
  id: 99,
  name: 'خالد',
  hand: [UNIQUE_CARDS.find(c => c.id === 5)],
  profile: { cardImageId: '2', frameShape: 'circle', frameColor: '#60b8ff' },
};
const RULE_CARDS = {
  1: UNIQUE_CARDS.find(c => c.id === 1),
  4: UNIQUE_CARDS.find(c => c.id === 4),
  7: UNIQUE_CARDS.find(c => c.id === 7),
  8: UNIQUE_CARDS.find(c => c.id === 8),
};

// ── Spotlight ─────────────────────────────────────────────────────
function Spotlight({ target, onOverlayClick }) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!target) { setRect(null); return; }
    const el = document.querySelector(`[data-tut="${target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [target]);

  if (!target) {
    return <div className={styles.dimFull} onClick={onOverlayClick} />;
  }

  return (
    <div className={styles.spotOverlay} onClick={onOverlayClick}>
      {rect && (
        <div
          className={styles.spotHole}
          style={{
            position: 'fixed',
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: 16,
            boxShadow: '0 0 0 2000px rgba(0,0,0,0.72)',
            pointerEvents: 'none',
            zIndex: 998,
          }}
        />
      )}
    </div>
  );
}

// ── Arrow ─────────────────────────────────────────────────────────
function TutArrow({ target }) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!target) { setRect(null); return; }
    const el = document.querySelector(`[data-tut="${target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [target]);

  if (!target || !rect) return null;

  return (
    <div
      className={styles.arrow}
      style={{
        top: rect.top - 44,
        left: rect.left + rect.width / 2 - 16,
      }}
    >
      ▼
    </div>
  );
}

// ── Bubble ────────────────────────────────────────────────────────
function TutBubble({ text, pos, showTapHint, hintLevel }) {
  const posClass =
    pos === 'top'    ? styles.bubbleTop    :
    pos === 'center' ? styles.bubbleCenter :
                       styles.bubbleBottom;

  return (
    <div className={`${styles.bubble} ${posClass}`} style={{ zIndex: 1002 }}>
      <div className={styles.bubbleInner}>
        <span className={styles.lionAvatar}>🦁</span>
        <p className={styles.bubbleText}>{text}</p>
      </div>
      {showTapHint && (
        <p className={styles.tapHint}>اضغط للمتابعة ▼</p>
      )}
      {hintLevel === 1 && (
        <p className={styles.softHint}>💡 حاول هنا!</p>
      )}
      {hintLevel === 2 && (
        <p className={styles.strongHint}>👆 اضغط هنا الآن!</p>
      )}
    </div>
  );
}

// ── Reward Screen ─────────────────────────────────────────────────
function RewardScreen({ onComplete, onRetry }) {
  return (
    <div className={styles.rewardScreen}>
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
      <div className={styles.confettiWrap}>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} style={{ '--i': i }} className={styles.confettiPiece} />
        ))}
      </div>
    </div>
  );
}

// ── Practice Mode ─────────────────────────────────────────────────
function PracticeMode({ onDone }) {
  const [sub, setSub] = useState(0);
  const [practiceDrawn, setPracticeDrawn] = useState(false);
  const [practiceFocused, setPracticeFocused] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Sub-step 3: auto-advance after 1s
  useEffect(() => {
    if (sub === 3) {
      setShowResult(true);
      const t = setTimeout(() => onDone(), 1200);
      return () => clearTimeout(t);
    }
  }, [sub, onDone]);

  const subTexts = [
    'اسحب من الكومة!',
    'اضغط البطاقة اليسرى للعبها مرتين',
    'اختر خالد!',
    'أحسنت! 🎉',
  ];

  function handleDeckTap() {
    if (sub !== 0) return;
    setPracticeDrawn(true);
    setSub(1);
  }

  function handleHandTap() {
    if (sub === 1) {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (!practiceFocused) {
        setPracticeFocused(true);
      }
      if (newCount >= 2) {
        setSub(2);
      }
    }
  }

  function handleOpponentTap() {
    if (sub === 2) {
      setSub(3);
    }
  }

  return (
    <div className={styles.practiceWrap}>
      {/* Sub-step bubble */}
      <div className={styles.practiceBubble}>
        <span className={styles.lionAvatar}>🦁</span>
        <p className={styles.bubbleText}>{subTexts[sub]}</p>
      </div>

      {/* Board */}
      {showResult ? (
        <div className={styles.practiceResult}>
          <p className={styles.practiceResultText}>نظرت في كرت خالد! 👀</p>
          <CardFace card={OPPONENT.hand[0]} size="normal" />
        </div>
      ) : (
        <div className={styles.practiceBoard}>
          {/* Opponent */}
          <div
            className={`${styles.practiceOpponent} ${sub === 2 ? styles.practiceTarget : ''}`}
            data-tut="opponent"
            onClick={handleOpponentTap}
          >
            <CardBack size="small" />
            <span className={styles.practiceName}>{OPPONENT.name}</span>
            {sub === 2 && <div className={styles.arrow} style={{ position: 'relative', fontSize: '1.5rem', color: '#FFC83D' }}>👆</div>}
          </div>

          {/* Deck */}
          <div
            className={`${styles.practiceDeck} ${sub === 0 ? styles.deckPulse : ''}`}
            data-tut="deck"
            onClick={handleDeckTap}
          >
            {practiceDrawn ? (
              <div className={styles.emptyDeckSlot}>—</div>
            ) : (
              <CardBack size="small" />
            )}
            <span className={styles.deckLabel}>الكومة</span>
            {sub === 0 && <span className={styles.tapMe}>اضغط! 👆</span>}
          </div>

          {/* Hand */}
          <div className={styles.practiceHand} data-tut="hand-area">
            <div
              className={`${styles.practiceHandCard} ${practiceFocused && sub === 1 ? styles.cardFocused : ''}`}
              data-tut="hand-card"
              onClick={handleHandTap}
            >
              <CardFace
                card={PLAYER_HAND_CARD}
                size="small"
                focused={practiceFocused && sub === 1}
              />
              {sub === 1 && <span className={styles.tapMe}>اضغط! 👆</span>}
            </div>
            {practiceDrawn && (
              <div className={styles.practiceHandCard} data-tut="drawn-card">
                <CardFace card={PLAYER_DRAWN_CARD} size="small" dimmed />
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
  const [stepIdx, setStepIdx]           = useState(0);
  const [drawn, setDrawn]               = useState(false);
  const [focused, setFocused]           = useState(false);
  const [hintLevel, setHintLevel]       = useState(0);
  const [showReward, setShowReward]     = useState(false);
  const [wrongTap, setWrongTap]         = useState(false);
  const hintTimerRef                    = useRef(null);
  const hintTimer2Ref                   = useRef(null);
  const boardRef                        = useRef(null);

  const step = STEPS[stepIdx];

  // Auto-advance for AUTO trigger
  useEffect(() => {
    if (step?.trigger === 'AUTO' && step?.autoDelay !== null) {
      const t = setTimeout(() => advance(), step.autoDelay + 50);
      return () => clearTimeout(t);
    }
  }, [stepIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hint timer: after 6s show soft hint, after 12s show strong hint
  useEffect(() => {
    setHintLevel(0);
    clearTimeout(hintTimerRef.current);
    clearTimeout(hintTimer2Ref.current);

    if (step?.trigger === 'TAP_ANYWHERE' || step?.isReward) return; // no hints needed

    hintTimerRef.current = setTimeout(() => setHintLevel(1), 6000);
    hintTimer2Ref.current = setTimeout(() => setHintLevel(2), 12000);

    return () => {
      clearTimeout(hintTimerRef.current);
      clearTimeout(hintTimer2Ref.current);
    };
  }, [stepIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(() => {
    setHintLevel(0);
    clearTimeout(hintTimerRef.current);
    clearTimeout(hintTimer2Ref.current);
    if (stepIdx >= STEPS.length - 1) {
      markTutorialDone();
      setShowReward(true);
      return;
    }
    setStepIdx(i => i + 1);
  }, [stepIdx]);

  function showWrongTapEffect() {
    setWrongTap(true);
    setTimeout(() => setWrongTap(false), 400);
  }

  function handleDeckTap() {
    if (step.trigger !== 'TAP_DECK') { showWrongTapEffect(); return; }
    setDrawn(true);
    advance();
  }

  function handleHandTap() {
    if (step.trigger === 'TAP_HAND') {
      setFocused(true);
      advance();
      return;
    }
    if (step.trigger === 'TAP_PLAY' && focused) {
      advance();
      return;
    }
    showWrongTapEffect();
  }

  function handleConfirmTap() {
    if (step.trigger === 'TAP_CONFIRM') {
      advance();
      return;
    }
    showWrongTapEffect();
  }

  function handleTapAnywhere() {
    if (step.trigger === 'TAP_ANYWHERE') advance();
  }

  function handleOverlayClick() {
    handleTapAnywhere();
  }

  // Show reward screen
  if (showReward || step?.isReward) {
    return (
      <div className={styles.board} dir="rtl" ref={boardRef}>
        <RewardScreen
          onComplete={onComplete}
          onRetry={() => { markTutorialDone(); onRetry(); }}
        />
      </div>
    );
  }

  // Rule card display (steps 8-11)
  if (step?.ruleCard) {
    const card = RULE_CARDS[step.ruleCard.id];
    return (
      <div className={styles.board} dir="rtl" ref={boardRef} onClick={handleTapAnywhere}>
        {/* Skip */}
        <button className={styles.skipBtn} onClick={e => { e.stopPropagation(); markTutorialDone(); onSkip(); }}>
          تخطي
        </button>
        {/* Progress */}
        <div className={styles.progress}>
          {STEPS.map((s, i) => (
            <div key={s.id} className={[
              styles.dot,
              i < stepIdx ? styles.dotDone : '',
              i === stepIdx ? styles.dotCurrent : '',
            ].join(' ')} />
          ))}
        </div>

        <div className={styles.ruleScreen}>
          <div className={styles.ruleCardWrap} data-tut="rule-card">
            <CardFace card={card} size="large" />
          </div>
          <div className={styles.ruleBubble}>
            <span className={styles.lionAvatar}>🦁</span>
            <p className={styles.bubbleText}>{step.bubble.text}</p>
          </div>
          <button className={styles.nextBtn} onClick={e => { e.stopPropagation(); advance(); }}>
            التالي ▶
          </button>
        </div>
      </div>
    );
  }

  // Practice mode (step 12)
  if (step?.isPractice) {
    return (
      <div className={styles.board} dir="rtl" ref={boardRef}>
        {/* Skip */}
        <button className={styles.skipBtn} onClick={() => { markTutorialDone(); onSkip(); }}>
          تخطي
        </button>
        {/* Progress */}
        <div className={styles.progress}>
          {STEPS.map((s, i) => (
            <div key={s.id} className={[
              styles.dot,
              i < stepIdx ? styles.dotDone : '',
              i === stepIdx ? styles.dotCurrent : '',
            ].join(' ')} />
          ))}
        </div>
        <PracticeMode onDone={advance} />
      </div>
    );
  }

  // Normal board steps (1-7 and WELCOME)
  const isDrawStep    = step?.id === 'DRAW_CARD';
  const showDrawnCard = drawn && stepIdx >= 3; // After drawing

  return (
    <div
      className={`${styles.board} ${wrongTap ? styles.wrongTap : ''}`}
      dir="rtl"
      ref={boardRef}
    >
      {/* Skip button */}
      <button className={styles.skipBtn} onClick={() => { markTutorialDone(); onSkip(); }}>
        تخطي
      </button>

      {/* Progress dots */}
      <div className={styles.progress}>
        {STEPS.map((s, i) => (
          <div key={s.id} className={[
            styles.dot,
            i < stepIdx ? styles.dotDone : '',
            i === stepIdx ? styles.dotCurrent : '',
          ].join(' ')} />
        ))}
      </div>

      {/* Overlay / Spotlight */}
      <Spotlight target={step?.spot ?? null} onOverlayClick={handleOverlayClick} />

      {/* Arrow */}
      {step?.arrow && <TutArrow target={step.arrow} />}

      {/* Speech bubble */}
      {step?.bubble && (
        <TutBubble
          text={step.bubble.text}
          pos={step.bubble.pos}
          showTapHint={step.trigger === 'TAP_ANYWHERE'}
          hintLevel={hintLevel}
        />
      )}

      {/* ── Board layout ── */}
      <div className={styles.boardInner}>
        {/* Opponent seat */}
        <div className={styles.opponentSeat} data-tut="opponent">
          <CardBack size="small" />
          <span className={styles.seatName}>{OPPONENT.name}</span>
        </div>

        {/* Arena / Deck */}
        <div className={styles.arena}>
          <div
            className={`${styles.deckStack} ${isDrawStep ? styles.deckPulse : ''}`}
            data-tut="deck"
            onClick={handleDeckTap}
            style={{ cursor: 'pointer', zIndex: 1000 }}
          >
            <CardBack size="normal" />
            <span className={styles.deckCount}>الكومة</span>
            {isDrawStep && <span className={styles.drawHint}>اسحب! 👇</span>}
          </div>
        </div>

        {/* Player hand */}
        <div className={styles.humanZone}>
          <div className={styles.hand} data-tut="hand-area">
            {/* Hand card (left = always visible) */}
            <div
              className={styles.cardSlot}
              data-tut="hand-card"
              onClick={handleHandTap}
              style={{ cursor: 'pointer', zIndex: 1000 }}
            >
              <CardFace
                card={PLAYER_HAND_CARD}
                size="normal"
                focused={focused && (step?.id === 'PLAY_CARD')}
                selected={focused && (step?.id === 'SELECT_CARD')}
                onClick={handleHandTap}
              />
            </div>

            {/* Drawn card (right, appears after drawing) */}
            {showDrawnCard && (
              <div
                className={styles.cardSlot}
                data-tut="drawn-card"
                style={{ cursor: 'default', zIndex: 1000 }}
              >
                <CardFace
                  card={PLAYER_DRAWN_CARD}
                  size="normal"
                  dimmed
                />
              </div>
            )}
          </div>
        </div>

        {/* Confirm button (for SEE_RESULT step) */}
        {step?.id === 'SEE_RESULT' && (
          <div className={styles.confirmArea}>
            <div className={styles.resultMessage}>
              <span>نظرت في كرت خالد! 👀</span>
            </div>
            <button
              className={styles.confirmBtn}
              data-tut="confirm"
              onClick={handleConfirmTap}
            >
              حسناً ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
