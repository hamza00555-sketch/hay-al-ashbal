# مشكلة تعليق اللعبة الأونلاين — حي الأشبال

## السياق

لعبة أوراق عربية مبنية بـ **React 19 + Vite + Firebase Realtime Database + CSS Modules**.  
مستوحاة من Love Letter (8 بطاقات، 2-4 لاعبين).  
تدعم وضع اللعب ضد AI ووضع الأونلاين (لاعبان على جهازين منفصلين عبر Firebase).

**الملف الرئيسي:** `src/pages/GamePage.jsx` (~1100 سطر)  
**محرك اللعبة:** `src/engine/gameEngine.js` (pure JS state machine — لا يُعدَّل)

---

## المشكلة

**في وضع اللعب الأونلاين:** كل لاعب يلعب دوراً واحداً بنجاح، ثم تتعلق اللعبة في الدور الثاني ولا يحدث شيء.

---

## معمارية المزامنة

كلا اللاعبين يكتبان state إلى Firebase عند دورهم. كل لاعب ينفذ قراراته محلياً ويبثها.

```
Firebase: rooms/{code}/state = { ...gameState, _v: number, _author: playerIdx }
```

- `_v` — رقم إصدار يزيد +1 مع كل حركة
- `_author` — index اللاعب الذي أجرى الحركة (لتصفية الصدى)

### تدفق دور اللاعب المثالي

```
advanceTurn() → phase: 'HAND_COVER'
    ↓ [online/vsAI: يُحوَّل تلقائياً]
phase: 'DRAW'  [750ms animation]
    ↓ [setGs(doDrawCard) — محلي فقط، لا sync لـ Firebase]
phase: 'PLAY'  [اللاعب يختار كرت]
    ↓ [pushNarrative(beats, nextGs)]
narrative beats تعرض (2-3 ثوانٍ)
    ↓ [kickQueue() يفرغ → setGs(pendingGs)]
gs._author = myPlayerIdx → sync effect → writeGameState(Firebase)
    ↓ [Firebase listener على جهاز الخصم]
setGs(sanitizeGs(incoming)) ← يبدأ دور الخصم
```

---

## الكود الحرج

### 1. Narrative Queue (kickQueue + pushNarrative)

```javascript
// في GamePage.jsx

const [currentBeat, setCurrentBeat] = useState(null);
const currentBeatRef = useRef(null);     // mirror لتجنب stale closure في Firebase listener
const [pendingGs,   setPendingGs]   = useState(null);
const beatQueueRef      = useRef([]);
const narrativeTimer    = useRef(null);
const pendingRemoteRef  = useRef(null);  // يخزن state من Firebase يصل أثناء narrative

function kickQueue() {
  clearTimeout(narrativeTimer.current);
  const q = beatQueueRef.current;
  if (q.length === 0) {
    currentBeatRef.current = null;
    setCurrentBeat(null);
    // ⚠️ مشكلة: mutation داخل updater (قد يُشغَّل مرتين في React Strict Mode)
    setPendingGs(prev => {
      const remote = pendingRemoteRef.current;
      if (remote && (remote._v ?? 0) > (prev?._v ?? 0)) {
        pendingRemoteRef.current = null;
        setGs(remote);
      } else {
        pendingRemoteRef.current = null;
        if (prev) setGs(prev);
      }
      return null;
    });
    return;
  }
  const [next, ...rest] = q;
  beatQueueRef.current = rest;
  currentBeatRef.current = next;
  setCurrentBeat(next);
  if (next.durationMs > 0) {
    narrativeTimer.current = setTimeout(kickQueue, next.durationMs);
  }
  // beats بـ durationMs=0 تنتظر تأكيد المستخدم (زر "حسناً" في NarrativeOverlay)
}

function pushNarrative(beats, nextState, actionText = null) {
  const stamped = isOnline ? {
    ...nextState,
    _v:      (nextState._v ?? 0) + 1,
    _author: myPlayerIdx,
    ...(actionText ? { _action: { text: actionText, ts: Date.now() } } : {}),
  } : nextState;
  clearTimeout(narrativeTimer.current);
  beatQueueRef.current = beats;
  setPendingGs(stamped);
  kickQueue();
}
```

### 2. Firebase Receive Effect

```javascript
const lastReceivedV = useRef(-1);
useEffect(() => {
  if (!isOnline || !roomCode) return;
  const unsub = listenRoom(roomCode, room => {
    if (!room?.state) return;
    const incoming = room.state;
    const v = incoming._v ?? 0;
    if (v <= lastReceivedV.current) return;           // تجاهل القديم/المكرر
    if ((incoming._author ?? -1) === myPlayerIdx) return; // تجاهل صدى حركتنا
    lastReceivedV.current = v;
    if (incoming._action?.ts && incoming._action.ts !== lastActionTs.current) {
      lastActionTs.current = incoming._action.ts;
      setActionToast(incoming._action.text);
      toastTimer.current = setTimeout(() => setActionToast(null), 3500);
    }
    const sanitized = sanitizeGs(incoming);
    if (beatQueueRef.current.length === 0 && !currentBeatRef.current) {
      setGs(sanitized);
      pendingRemoteRef.current = null;
    } else {
      // narrative تعمل: خزّن state الخصم وطبّقه لما تنتهي
      if (!pendingRemoteRef.current || v > (pendingRemoteRef.current._v ?? 0)) {
        pendingRemoteRef.current = sanitized;
      }
    }
  });
  return () => unsub();
}, [isOnline, roomCode, myPlayerIdx]); // eslint-disable-line react-hooks/exhaustive-deps
```

### 3. Phase Driver (Main Game Loop)

```javascript
useEffect(() => {
  if (turnAnnounce && !onlineWaiting) return; // TurnAnnounce يمنع المتابعة

  if (gs.phase === 'GAME_OVER') { /* ... */ return; }

  if (gs.phase === 'AI_TURN') {
    // في online 2-player لا يوجد AI — هذا فقط في vsAI mode
    const afterDraw = doDrawCard(gs);
    const { state: nextGsRaw, playedCard } = computeAIMove(afterDraw);
    pushNarrative(buildNarrative({...}), nextGsRaw, txt);
    return;
  }

  if (gs.phase === 'DRAW' && !currentPlayer.isAI) {
    if (isOnline && onlineWaiting) return; // ليس دوري
    setIsDrawing(true);
    const t = setTimeout(() => {
      setIsDrawing(false);
      setGs(prev => doDrawCard(prev)); // محلي فقط — لا sync لـ Firebase
    }, 750);
    return () => clearTimeout(t);
  }
}, [gs.phase, gs.currentPlayerIndex, turnAnnounce, onlineWaiting]);
// eslint-disable-line react-hooks/exhaustive-deps
```

### 4. TurnAnnounce Effect

```javascript
useEffect(() => {
  if (gs.currentPlayerIndex === prevPlayerIdxRef.current) return;
  prevPlayerIdxRef.current = gs.currentPlayerIndex;
  const cp = gs.players[gs.currentPlayerIndex];
  if (!cp || cp.isEliminated) return;
  if (isFirstTurnRef.current) { isFirstTurnRef.current = false; return; }

  const isMe = isOnline ? cp.id === humanPlayer?.id : /* pass-and-play logic */;
  if (isOnline && !isMe) return; // لا announce لدور الخصم في online

  setTurnAnnounce({ name: cp.name, profile: cp.profile, isMe, isAI: cp.isAI });
  setTurnBanner(isMe ? 'دورك!' : `دور ${cp.name}`);
  bannerTimer.current = setTimeout(() => setTurnBanner(null), 2200);
  // فقط AI يُرفع تلقائياً بعد 1600ms — البشر يضغطون "ابدأ دورك ▶" يدوياً
  if (cp.isAI) announceTimer.current = setTimeout(() => setTurnAnnounce(null), 1600);
}, [gs.currentPlayerIndex, gs.phase]); // eslint-disable-line react-hooks/exhaustive-deps
```

### 5. ⚠️ HAND_COVER Handler — مصدر المشكلة الرئيسية

```javascript
// هذا الكود داخل render body (ليس داخل useEffect) — هنا المشكلة:

if (gs.phase === 'HAND_COVER') {
  if (isOnline || hasAI) {
    // ⚠️ ANTI-PATTERN: استدعاء setGs داخل render body عبر setTimeout
    // في React 19 concurrent mode، الـ render قد يُشغَّل ثم يُلغى قبل الـ commit
    // هذا يجعل التحويل HAND_COVER → DRAW غير موثوق
    setTimeout(() => setGs(prev => prev.phase === 'HAND_COVER'
      ? { ...prev, phase: 'DRAW' } : prev), 0);
    return null;
  }
  // pass-and-play فقط:
  return (
    <HandCover
      playerName={currentPlayer.name}
      onReveal={() => setGs(gs => ({ ...gs, phase: 'DRAW' }))}
    />
  );
}
```

### 6. TurnAnnounce Render

```jsx
if (turnAnnounce) {
  return (
    <div
      className={[styles.announceOverlay, turnAnnounce.isMe ? styles.announceMine : styles.announceAI].join(' ')}
      onClick={turnAnnounce.isMe ? () => setTurnAnnounce(null) : undefined}
    >
      <div className={styles.announceCard}>
        <Portrait profile={turnAnnounce.profile} size="human" />
        <h2>{turnAnnounce.isMe ? 'دورك!' : `دور ${turnAnnounce.name}`}</h2>
        {turnAnnounce.isMe ? (
          <button onClick={() => setTurnAnnounce(null)}>ابدأ دورك ▶</button>
        ) : (
          <p>يبدأ خلال ثانية...</p>
        )}
      </div>
    </div>
  );
}
```

### 7. Sync Effect (يكتب لـ Firebase فقط حركاتنا)

```javascript
const lastSyncedV = useRef(-1);
useEffect(() => {
  if (!isOnline || !roomCode) return;
  if ((gs._author ?? -1) !== myPlayerIdx) return; // فقط حركاتنا
  const v = gs._v ?? 0;
  if (v === lastSyncedV.current) return;
  lastSyncedV.current = v;
  writeGameState(roomCode, gs).catch(e => console.warn('[sync]', e));
}, [gs, isOnline, roomCode, myPlayerIdx]); // eslint-disable-line react-hooks/exhaustive-deps
```

### 8. gameEngine.advanceTurn (يُنتج دائماً HAND_COVER للبشر)

```javascript
export function advanceTurn(state) {
  // ... find next active player, skip eliminated ...
  const nextPlayer = next.players[nextIndex];
  return {
    ...next,
    currentPlayerIndex: nextIndex,
    drawnCard: null, peekCard: null, peekTargetName: null,
    phase: nextPlayer.isAI ? 'AI_TURN' : 'HAND_COVER', // ← دائماً HAND_COVER للبشر
  };
}
```

### 9. sanitizeGs (تصحيح Firebase arrays)

```javascript
// src/services/gameRoom.js
export function sanitizeGs(raw) {
  if (!raw) return null;
  const toArr = v => (Array.isArray(v) ? v : v != null ? Object.values(v) : []);
  return {
    ...raw,
    deck:    toArr(raw.deck),
    players: toArr(raw.players).map(p => ({
      ...p,
      hand:        toArr(p.hand),
      discardPile: Array.isArray(p.discardPile) ? p.discardPile : [],
      peekMemory:  p.peekMemory ?? {},
    })),
    gameLog:       Array.isArray(raw.gameLog)       ? raw.gameLog       : [],
    globalDiscard: Array.isArray(raw.globalDiscard) ? raw.globalDiscard : [],
  };
}
```

---

## تشخيص المشكلة

### تسلسل الأحداث الذي يسبب التعليق

```
1. اللاعب A يلعب → pushNarrative → narrative تنتهي → kickQueue يفرغ
2. setGs({ currentPlayerIndex:1, phase:'HAND_COVER', _v:1, _author:0 })
3. sync effect → writeGameState(Firebase)
4. اللاعب B يستقبل → setGs({ phase:'HAND_COVER', currentPlayerIndex:1, _v:1 })

[الجولة الأولى — يعمل ✓]
5a. render body: if (gs.phase === 'HAND_COVER') → setTimeout(DRAW) + return null
5b. effects: TurnAnnounce → setTurnAnnounce({isMe:true})
5c. re-render: if (turnAnnounce) → TurnAnnounce overlay (HAND_COVER block لا يُشغَّل مجدداً)
5d. setTimeout fires → setGs({phase:'DRAW'}) ✓
5e. اللاعب B يضغط "ابدأ دورك" → phase driver → DRAW → PLAY → يلعب ✓

6. اللاعب B يلعب → sync → اللاعب A يستقبل { phase:'HAND_COVER', _v:2 }

[الجولة الثانية — قد يُعلَّق ✗]
7. على جهاز اللاعب A: render body يُنفَّذ
   → إذا كان turnAnnounce مُعيَّناً مسبقاً: يعيد TurnAnnounce overlay قبل HAND_COVER block
   → setTimeout لا يُقيَّد أبداً!
   → أو: في React 19 concurrent mode، الـ render يُشغَّل ثم يُلغى → setTimeout يُقيَّد
     لكن setGs يُستدعى على state قديم بعد إلغاء الـ render

8. اللاعب A يضغط "ابدأ دورك" → gs.phase === 'HAND_COVER' → phase driver لا يتعامل معه
9. ✗ FREEZE — اللعبة معلقة في HAND_COVER إلى الأبد
```

### السبب الجذري

`HAND_COVER → DRAW` يحدث داخل **render body** (anti-pattern في React). في React 19:
- الـ render قد يُنفَّذ مرات متعددة (concurrent features)
- إذا جاء `turnAnnounce` قبل تنفيذ HAND_COVER block: التحويل لا يحدث
- الحل: نقل التحويل إلى `useEffect` (يُضمن تنفيذه بعد كل commit)

---

## الإصلاح المطلوب (GamePage.jsx فقط، 3 تغييرات)

### التغيير 1 — أضف useEffect للـ HAND_COVER

أضفه مع باقي الـ useEffects (بعد سطر ~351):

```javascript
// انتقال HAND_COVER → DRAW عبر useEffect (ليس render body)
useEffect(() => {
  if (gs.phase !== 'HAND_COVER') return;
  if (!isOnline && !hasAI) return; // pass-and-play: HandCover component يتعامل معه
  const t = setTimeout(() => {
    setGs(prev => prev.phase === 'HAND_COVER' ? { ...prev, phase: 'DRAW' } : prev);
  }, 0);
  return () => clearTimeout(t);
}, [gs.phase]); // eslint-disable-line react-hooks/exhaustive-deps
```

### التغيير 2 — نظّف render body من الـ side effect

عدّل الـ HAND_COVER block في الـ render (سطر ~786):

```javascript
// قبل:
if (gs.phase === 'HAND_COVER') {
  if (isOnline || hasAI) {
    setTimeout(() => setGs(prev => prev.phase === 'HAND_COVER'
      ? { ...prev, phase: 'DRAW' } : prev), 0);
    return null;
  }
  return (<HandCover playerName={currentPlayer.name} onReveal={...} />);
}

// بعد:
if (gs.phase === 'HAND_COVER') {
  if (isOnline || hasAI) return null; // useEffect يتعامل مع الانتقال
  return (<HandCover playerName={currentPlayer.name} onReveal={...} />);
}
```

### التغيير 3 — أصلح mutation داخل updater في kickQueue

عدّل النهاية من دالة `kickQueue` (سطر ~272):

```javascript
// قبل (mutation داخل updater — anti-pattern):
setPendingGs(prev => {
  const remote = pendingRemoteRef.current;
  if (remote && (remote._v ?? 0) > (prev?._v ?? 0)) {
    pendingRemoteRef.current = null;  // ← mutation داخل updater
    setGs(remote);
  } else {
    pendingRemoteRef.current = null;  // ← mutation داخل updater
    if (prev) setGs(prev);
  }
  return null;
});

// بعد (snapshot الـ ref قبل الـ updater — updater يجب أن يكون pure):
const remote = pendingRemoteRef.current;
pendingRemoteRef.current = null;
setPendingGs(prev => {
  if (remote && (remote._v ?? 0) > (prev?._v ?? 0)) {
    setGs(remote);
  } else {
    if (prev) setGs(prev);
  }
  return null;
});
```

---

## ما لا يحتاج تغييراً

| الملف | الحالة |
|-------|--------|
| `src/engine/gameEngine.js` | ✅ سليم |
| `src/services/gameRoom.js` | ✅ سليم |
| `src/engine/narrativeBuilder.js` | ✅ سليم |
| منطق `_v` / `_author` / `lastReceivedV` | ✅ سليم |
| `pendingRemoteRef` buffering في Firebase listener | ✅ سليم |

---

## التحقق

1. لاعبان يلعبان 5+ أدوار متتالية بدون تعليق
2. بعد كل دور: `HAND_COVER → DRAW` يحدث تلقائياً (لا يتطلب تدخل إضافي)
3. TurnAnnounce يظهر لصاحب الدور، يُرفع بالضغط على "ابدأ دورك ▶"
4. Phase driver يبدأ سحب الورقة (750ms animation) بعد رفع TurnAnnounce
5. اللعبة تصل لـ GAME_OVER بشكل طبيعي

---

## ملاحظة مهمة

هذا مشروع **React 19 + Vite**. جميع الـ effects تستخدم `// eslint-disable-line react-hooks/exhaustive-deps` بوعي لأن الـ logic يعتمد على refs لتجنب stale closures في narrative queue. **لا تضيف deps جديدة للـ effects الموجودة دون فهم كامل للمعمارية.**

`setGs` = `useState` setter، `gs` = game state كامل، `isOnline` = boolean prop، `hasAI` = `gs.players.some(p => p.isAI)`
