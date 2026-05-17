import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createCity, buildBuilding, demolish, rentBuilding, stopRent,
  listForSale, cancelSale, payToResolveEvent, advanceMonth,
} from '../engine/cityEngine.js';
import { STORY_MESSAGES } from '../constants/story.js';
import { TUTORIAL_STEPS } from '../constants/tutorial.js';
import { SFX } from '../utils/sounds.js';

import HUD from '../components/HUD.jsx';
import CityGrid from '../components/CityGrid.jsx';
import BuildingPicker from '../components/BuildingPicker.jsx';
import BuildingInfoPanel from '../components/BuildingInfoPanel.jsx';
import EventBanner from '../components/EventBanner.jsx';
import MonthReport from '../components/MonthReport.jsx';
import StoryModal from '../components/StoryModal.jsx';
import TutorialOverlay from '../components/TutorialOverlay.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

import styles from './GamePage.module.css';

export default function GamePage({ config, onGameOver }) {
  const [state, setState] = useState(() => createCity(config));
  const [storyMessage, setStoryMessage] = useState(null);
  const [confirmDemolish, setConfirmDemolish] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const autoRef = useRef(false);
  const autoTimerRef = useRef(null);

  // Check story triggers after state changes
  const checkStory = useCallback((newState, prevState) => {
    const shown = new Set(newState.shownStoryIds || []);
    for (const msg of STORY_MESSAGES) {
      if (shown.has(msg.id)) continue;
      let triggered = false;
      const { trigger } = msg;

      if (trigger.type === 'month' && newState.month === trigger.value) triggered = true;
      if (trigger.type === 'buildingCount' && Object.keys(newState.buildings).length === trigger.value) triggered = true;
      if (trigger.type === 'population' && newState.population >= trigger.value && (prevState?.population || 0) < trigger.value) triggered = true;
      if (trigger.type === 'satisfactionDrop' && newState.satisfactionScore <= trigger.value && (prevState?.satisfactionScore || 100) > trigger.value) triggered = true;
      if (trigger.type === 'populationPercent') {
        const pct = newState.population / newState.targetPopulation * 100;
        const prevPct = (prevState?.population || 0) / newState.targetPopulation * 100;
        if (pct >= trigger.value && prevPct < trigger.value) triggered = true;
      }
      if (trigger.type === 'budgetThreshold' && newState.budget <= trigger.value && (prevState?.budget || Infinity) > trigger.value) triggered = true;

      if (triggered) {
        setState(s => ({ ...s, shownStoryIds: [...(s.shownStoryIds || []), msg.id] }));
        setStoryMessage(msg);
        return;
      }
    }
  }, []);

  // Tutorial: advance step based on action
  const advanceTutorial = useCallback((actionType, newState) => {
    setState(prev => {
      if (prev.tutorialDone || prev.tutorialStep === null) return prev;
      const step = TUTORIAL_STEPS[prev.tutorialStep];
      if (!step) return prev;
      if (step.continueMode === 'action' && step.action?.type === actionType) {
        const next = prev.tutorialStep + 1;
        if (next >= TUTORIAL_STEPS.length) return { ...prev, tutorialDone: true, tutorialStep: null };
        return { ...prev, tutorialStep: next };
      }
      return prev;
    });
  }, []);

  // Auto advance
  useEffect(() => {
    if (state.autoAdvance && state.phase === 'playing' && !state.pendingMonthReport) {
      autoTimerRef.current = setTimeout(() => {
        handleAdvanceMonth();
      }, state.speed * 1000);
    }
    return () => clearTimeout(autoTimerRef.current);
  }, [state.autoAdvance, state.month, state.phase, state.pendingMonthReport]);

  // Game over redirect
  useEffect(() => {
    if (state.phase !== 'playing') {
      const timer = setTimeout(() => {
        onGameOver({
          phase: state.phase,
          winCondition: state.winCondition,
          loseCondition: state.loseCondition,
          cityName: state.cityName,
          finalBudget: state.budget,
          finalPopulation: state.population,
          finalMonth: state.month,
          satisfactionScore: state.satisfactionScore,
          totalEarned: state.totalEarned,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  function handleCellClick(cellId) {
    SFX.buttonClick();
    if (state.buildMode && state.pendingBuildTypeId) {
      const result = buildBuilding(state, cellId, state.pendingBuildTypeId);
      if (result.error) {
        alert(result.error);
        return;
      }
      SFX.build();
      const prev = state;
      setState(result);
      checkStory(result, prev);
      advanceTutorial('buildBuilding', result);
    } else {
      setState(s => ({
        ...s,
        selectedCellId: s.selectedCellId === cellId ? null : cellId,
        buildMode: false,
        pendingBuildTypeId: null,
      }));
    }
  }

  function handleBuild() {
    SFX.buttonClick();
    setState(s => ({ ...s, buildMode: true, selectedCellId: null }));
  }

  function handleSelectBuilding(typeId) {
    SFX.buttonClick();
    setState(s => ({ ...s, pendingBuildTypeId: typeId, buildMode: true }));
  }

  function handleRent(price) {
    if (state.selectedCellId === null) return;
    const result = rentBuilding(state, state.selectedCellId, price);
    if (result.error) { alert(result.error); return; }
    SFX.rent();
    const prev = state;
    setState({ ...result, selectedCellId: null });
    advanceTutorial('rentBuilding', result);
  }

  function handleStopRent() {
    if (state.selectedCellId === null) return;
    SFX.buttonClick();
    setState({ ...stopRent(state, state.selectedCellId), selectedCellId: null });
  }

  function handleSell(price) {
    if (state.selectedCellId === null) return;
    const result = listForSale(state, state.selectedCellId, price);
    if (result.error) { alert(result.error); return; }
    SFX.sell();
    setState({ ...result, selectedCellId: null });
  }

  function handleCancelSale() {
    if (state.selectedCellId === null) return;
    SFX.buttonClick();
    setState({ ...cancelSale(state, state.selectedCellId), selectedCellId: null });
  }

  function handleDemolishConfirm() {
    const cellId = confirmDemolish;
    setConfirmDemolish(null);
    SFX.demolish();
    setState({ ...demolish(state, cellId), selectedCellId: null });
  }

  function handleAdvanceMonth() {
    SFX.monthAdvance();
    const prev = state;
    const next = advanceMonth(state);
    if (next.monthlyIncome > 0) SFX.income();
    if (next.activeEvent && !prev.activeEvent) SFX.event();
    setState(next);
    checkStory(next, prev);
    advanceTutorial('advanceMonth', next);
  }

  function handleDismissReport() {
    setState(s => ({ ...s, pendingMonthReport: null }));
  }

  function handleToggleAuto() {
    SFX.buttonClick();
    setState(s => ({ ...s, autoAdvance: !s.autoAdvance }));
  }

  function handlePayEvent() {
    const result = payToResolveEvent(state);
    if (result.error) { alert(result.error); return; }
    SFX.buttonClick();
    setState(result);
  }

  const selectedBuilding = state.selectedCellId !== null
    ? (state.buildings[`cell-${state.selectedCellId}`] || null)
    : null;
  const selectedCell = state.selectedCellId !== null ? state.grid[state.selectedCellId] : null;

  return (
    <div className={styles.page}>
      <HUD
        budget={state.budget}
        population={state.population}
        maxPopulation={state.maxPopulation}
        satisfactionScore={state.satisfactionScore}
        month={state.month}
        autoAdvance={state.autoAdvance}
        onToggleAuto={handleToggleAuto}
        onAdvanceMonth={handleAdvanceMonth}
        onOpenMenu={() => setShowLog(s => !s)}
      />

      <div className={styles.main}>
        {state.activeEvent && (
          <EventBanner
            event={state.activeEvent}
            budget={state.budget}
            onPayToResolve={handlePayEvent}
          />
        )}

        <div className={styles.buildBar}>
          <button
            className={`${styles.buildBtn} ${state.buildMode ? styles.activeBuild : ''}`}
            onClick={handleBuild}
            id="buildBtn"
          >
            {state.buildMode ? '✕ إلغاء' : '🏗️ بناء'}
          </button>
          <span className={styles.hint}>
            {state.buildMode && state.pendingBuildTypeId
              ? `اختر موقعاً للـ ${state.pendingBuildTypeId}`
              : state.buildMode
              ? 'اختر نوع المبنى أولاً'
              : 'انقر على خلية للتفاصيل'}
          </span>
        </div>

        <CityGrid
          grid={state.grid}
          buildings={state.buildings}
          selectedCellId={state.selectedCellId}
          onCellClick={handleCellClick}
          buildMode={state.buildMode}
          pendingTypeId={state.pendingBuildTypeId}
        />

        {showLog && (
          <div className={styles.log}>
            <div className={styles.logHeader}>
              <span>📋 سجل الأحداث</span>
              <button onClick={() => setShowLog(false)}>✕</button>
            </div>
            <div className={styles.logList}>
              {[...state.log].reverse().map(entry => (
                <div key={entry.id} className={`${styles.logEntry} ${styles[entry.type]}`}>
                  <span className={styles.logMonth}>شهر {entry.month}</span>
                  <span>{entry.text}</span>
                </div>
              ))}
              {state.log.length === 0 && <p className={styles.emptyLog}>لا توجد أحداث بعد</p>}
            </div>
          </div>
        )}
      </div>

      {state.buildMode && (
        <BuildingPicker
          budget={state.budget}
          buildDiscount={state.buildDiscount}
          onSelect={handleSelectBuilding}
          onClose={() => setState(s => ({ ...s, buildMode: false, pendingBuildTypeId: null }))}
        />
      )}

      {state.selectedCellId !== null && !state.buildMode && (
        <BuildingInfoPanel
          cell={selectedCell}
          building={selectedBuilding}
          state={state}
          onBuild={handleBuild}
          onRent={handleRent}
          onStopRent={handleStopRent}
          onSell={handleSell}
          onCancelSale={handleCancelSale}
          onDemolish={() => setConfirmDemolish(state.selectedCellId)}
          onClose={() => setState(s => ({ ...s, selectedCellId: null }))}
        />
      )}

      {state.pendingMonthReport && (
        <MonthReport report={state.pendingMonthReport} onContinue={handleDismissReport} />
      )}

      {storyMessage && (
        <StoryModal message={storyMessage} onClose={() => setStoryMessage(null)} />
      )}

      {!state.tutorialDone && state.tutorialStep !== null && !state.pendingMonthReport && !storyMessage && (
        <TutorialOverlay
          step={state.tutorialStep}
          onNext={() => setState(s => {
            const next = s.tutorialStep + 1;
            if (next >= TUTORIAL_STEPS.length) return { ...s, tutorialDone: true, tutorialStep: null };
            return { ...s, tutorialStep: next };
          })}
          onSkip={() => setState(s => ({ ...s, tutorialDone: true, tutorialStep: null }))}
        />
      )}

      {confirmDemolish !== null && (
        <ConfirmModal
          title="تأكيد الهدم"
          message="سيُستعاد 30٪ من تكلفة البناء. هذا الإجراء لا يمكن التراجع عنه."
          confirmLabel="🔨 هدم"
          onConfirm={handleDemolishConfirm}
          onCancel={() => setConfirmDemolish(null)}
        />
      )}

      {state.phase !== 'playing' && (
        <div className={styles.endOverlay}>
          <span>{state.phase === 'won' ? '🏆 فزت!' : '💔 انتهت اللعبة'}</span>
        </div>
      )}
    </div>
  );
}
