# خطة تطوير لعبة حي الأشبال — أربعة محاور

## Context
اللعبة مبنية بـ React 19 + Vite + CSS Modules، بدون مكتبات ألعاب خارجية. المحرك pure JS state machine. الهدف تطوير ثلاثة محاور متوازية: سير اللعب، منظور اللعب، تصميم اللعبة.

---

## المحور الأول — سير اللعب (Game Flow)

### 1. نظام جولات + أوسمة (Multi-Round / Token System)
**الأولوية: الأعلى — كل شيء يبنى عليه**
**التعقيد: Complex**

- `src/App.jsx`: أضف state `tokens: { [playerId]: 0 }` و`tokensToWin`. بعد كل جولة، أضف وسمة للفائز. إذا وصل للحد → `'result'`، وإلا → `'round_over'`
- `src/pages/LobbyPage.jsx`: أضف selector "الأوسمة للفوز" (1 / 3 / 5)
- `src/pages/ResultPage.jsx`: وضعان — ملخص جولة (مع زر "الجولة التالية") + فوز نهائي
- **ملف جديد**: `src/components/TokenDisplay.jsx` — نجوم/دوائر للأوسمة المكتسبة
- **ملف جديد**: `src/pages/RoundOverScreen.jsx` — شاشة انتقال قصيرة بين الجولات

### 2. مستويات صعوبة AI
**التعقيد: Medium**

- `src/ai/aiPlayer.js`: قسّم `computeAIMove` إلى 3 دوال:
  - **Easy**: السلوك الحالي (يلعب أضعف كرت، يستهدف أول لاعب متاح)
  - **Medium**: يتتبع الكروت المرمية من `gameLog` + `discardPile` جميع اللاعبين. يخمّن من الكروت المتبقية فعلياً. Helper: `getRemainingDeck(state)`
  - **Hard**: توزيع احتمالي — يعرف كروت PEEK التي رآها، يستهدف صاحب أعلى قوة باحتمال
- `src/engine/gameEngine.js`: أضف `difficulty` لكل لاعب AI في state
- `src/pages/LobbyPage.jsx`: selector صعوبة (سهل/متوسط/صعب)

### 3. إعداد عدد الخصوم (1، 2، أو 3 AI)
**التعقيد: Quick**

- `src/pages/LobbyPage.jsx`: stepper "عدد الخصوم" في وضع vsAI. أسماء عربية مميزة للـ AI (خالد، سارة، علي). يبني `config.players` ديناميكياً

### 4. تغذية راجعة بعد التأثير (Action Feedback Loop)
**التعقيد: Medium**

- `src/pages/GamePage.jsx`: أضف state `pendingReveal` — يخزّن نتيجة COMPARE أو FORCE_DISCARD قبل تطبيق `nextGs`. اللاعب يُقر برؤيتها ثم يتطبق الحالة
- **ملف جديد**: `src/components/EffectRevealModal.jsx` — يعرض بطاقتين في COMPARE مع تمييز الخاسر، والكرت المرمي + الجديد في FORCE

### 5. نهاية اللعبة بشكل أفضل
**التعقيد: Medium**

- `src/engine/gameEngine.js`: أضف phase `'SHOWDOWN'` عند نفاد الورق مع لاعبين متبقين. كل لاعب يكشف كرته بتسلسل
- `src/pages/GamePage.jsx`: detect اللاعبين المحذوفين حديثاً (مقارنة prev/current) لتشغيل animation الإقصاء
- `src/utils/sounds.js`: أضف `SFX.showdown()` و`SFX.roundWin()`
- **ملف جديد**: `src/components/ShowdownScreen.jsx` — يعرض كروت كل الناجين face-up بتسلسل
- **ملف جديد**: `src/components/VictoryOverlay.jsx` — احتفال CSS confetti عند الفوز النهائي

---

## المحور الثاني — منظور اللعب (Game Perspective)

### 1. كومة الكروت المرمية مرئية في الوسط
**الأولوية: الأعلى — يحسن وضوح اللعب فوراً**
**التعقيد: Medium**

- `src/engine/gameEngine.js`: أضف `globalDiscard: []` في `createInitialState`. كل `resolveCard` يُضيف الكرت المرمي إليها
- `src/pages/GamePage.jsx`: أضف `discardZoneRef`. بدّل `flyState.toRect` ليكون الـ discard zone بدل الـ deck. اعرض `gs.globalDiscard` في الـ arena
- `src/pages/GamePage.module.css`: `.discardZone` مع fan effect (آخر 3 كروت بزوايا مختلفة: -14deg، -7deg، 0deg)
- **ملف جديد (اختياري)**: `src/components/DiscardPile.jsx`

### 2. توسيع مقاعد الجوانب
**التعقيد: Quick**

- `src/pages/GamePage.module.css`:
  - `grid-template-columns: 110px 1fr 110px` (بدلاً من 80px)
  - إزالة `display: none` عن `.seat_left .activeBadge, .seat_right .activeBadge`
  - `max-width: 100px` للأسماء
  - `@media (max-width: 360px)`: تخفيض إلى 72px

### 3. منظور طاولة 3D (CSS Perspective View)
**التعقيد: Medium**

- `src/pages/GamePage.module.css`:
  - `.board`: أضف `perspective: 900px; perspective-origin: 50% 85%;`
  - `.perspectivePane`: `transform: rotateX(12deg); transform-origin: 50% 100%; transform-style: preserve-3d;`
  - `@media (max-height: 600px)`: خفّض إلى `rotateX(6deg)`
- `src/pages/GamePage.jsx`: ضع topZone + leftZone + arena + rightZone داخل `<div className={styles.perspectivePane}>`. humanZone يبقى خارجه
- ملاحظة: `getBoundingClientRect()` يعيد إحداثيات الشاشة بعد الـ transform — fly animation تعمل بشكل صحيح

### 4. عمق الكروت والظلال
**التعقيد: Quick**

- `src/pages/GamePage.module.css`:
  - `.seat_top .seatCardWrap { transform: scale(0.82); }`
  - `.seat_left .seatCardWrap, .seat_right .seatCardWrap { transform: scale(0.90); }`
  - تعزيز الظلال على الديك والـ discard pile

### 5. ملمس سطح الطاولة
**التعقيد: Quick — CSS فقط**

- `src/pages/GamePage.module.css`:
  - `.arena::before`: felt pattern بـ `repeating-linear-gradient(45deg, rgba(255,255,255,0.02)...)`
  - حد مضيء بين humanZone والـ arena (table edge effect)
  - `@keyframes tableGlow` بطيء على حد الـ arena

---

## المحور الثالث — تصميم اللعبة (Game Design)

### 1. نظام CSS Design Tokens
**الأولوية: الأعلى — كل CSS يستفيد منه**
**التعقيد: Medium**

- `src/index.css`: أضف `:root { }` مع جميع الـ tokens:
```css
--color-bg-deep: #0b1b2d;
--color-bg-mid: #1a3a5c;
--color-accent-gold: #FFD700;
--color-accent-blue: #60b8ff;
--font-arabic: 'Zanjabeel', sans-serif;
--space-2: 8px; --space-3: 12px; --space-4: 16px; ...
--radius-md: 10px; --radius-lg: 14px;
--duration-fast: 150ms; --duration-fly: 680ms;
--z-fly: 2000; --z-modal: 150; ...
```
- استبدال جميع القيم الثابتة في كل ملفات CSS بالـ variables (11 ملف)

### 2. تسلسل بصري لقوة الكروت
**التعقيد: Quick-to-Medium**

- `src/components/Card.jsx`: احسب tier من `card.power` داخلياً. أضف class `.tier-bronze|silver|gold`
- `src/components/Card.module.css`:
  - `.tier-bronze`: border برونزي + glow خفيف (#CD7F32)
  - `.tier-silver`: border فضي + glow متوسط (#C0C0C0)
  - `.tier-gold`: border ذهبي + glow مكثف + `@keyframes shimmer` يتحرك كل 3 ثوانٍ

### 3. التفاصيل الدقيقة (Micro-interactions)

**3a. Animation إقصاء اللاعب** — Quick
```css
@keyframes eliminate {
  20%  { transform: scale(1.2) rotate(-8deg); filter: brightness(2.5); }
  60%  { transform: scale(0.85) rotate(12deg) translateY(-15px); }
  100% { transform: scale(0.7); filter: grayscale(1); opacity: 0.4; }
}
```
- `GamePage.jsx`: تتبع اللاعبين المحذوفين حديثاً بـ `useRef`، أضف class `seatEliminating`

**3b. انفجار درع الحماية** — Quick
- عند لعب كرت 4: `shieldBurstPlayerId` state. الـ Seat يعرض `<div className={styles.shieldBurst}>` يتوسع ويتلاشى (scale 0 → 2.5, opacity 1 → 0)

**3c. جسيمات التخمين الصحيح** — Medium
- `explosionPlayerId` state عند التخمين الصحيح. 8 `<span>` بزوايا مختلفة (`--angle` CSS custom property) يتحركون للخارج

**3d. اهتزاز الجهاز (Haptic)** — Quick
- `src/utils/sounds.js`: `export function haptic(pattern = [10]) { navigator.vibrate?.(pattern); }`
- استدعاؤه مع كل `SFX.*` في GamePage

### 4. مرجع سريع للقدرات (Guide Drawer)
**التعقيد: Medium**

- `src/pages/GamePage.jsx`: زر "?" في أعلى اليمين. state `showGuide`
- **ملف جديد**: `src/components/GuideDrawer.jsx` — drawer ينزلق من اليمين يعرض `UNIQUE_CARDS` بصورة مصغرة + قدرة كل كرت. كل كرت قابل للضغط ليفتح `CardInfoModal`

---

---

## المحور الرابع — وضوح تجربة المستخدم (UX Clarity)

### المشكلة الجوهرية
اللاعبون يفقدون السياق باستمرار: من دوره؟ ماذا حدث؟ لماذا خرج فلان؟ ما الذي تغير؟ هل أنا بحاجة لفعل شيء الآن؟ المرجع: Marvel Snap، Clash Royale، Hearthstone (Supercell UX philosophy).

### أولاً — معمارية `narrativeQueue` (الأساس)
**الأولوية: الأعلى — كل شيء يبنى عليه**
**التعقيد: Complex**

**المشكلة الحالية**: State variables متناثرة (`aiPhase`, `aiPlayedCard`, `aiLogText`, `aiPendingState`, `guessResult`) تجعل التتابع غير قابل للتحكم.

**الحل**: queue من "beats" مُرتبة. اللعبة لا تتقدم حتى تنتهي روايتها.

**هيكل البيت**:
```js
// src/engine/narrativeBuilder.js (ملف جديد)
// beat types: TURN_START | CARD_ANTICIPATE | CARD_IMPACT | CARD_RESULT
//             ELIMINATION | AI_THINKING | COMPARE_REVEAL | PROTECTION_FLASH
//             SWAP_VISUAL | FORCE_RESULT
function beat(type, payload = {}, durationMs = 0) {
  return { type, payload, durationMs };
}
export function buildNarrative(action, prevGs, nextGs) { /* returns Beat[] */ }
```

**State جديد في GamePage.jsx**:
```js
const [narrativeQueue, setNarrativeQueue] = useState([]);   // queue of beats
const [currentBeat,    setCurrentBeat]    = useState(null); // active beat
const [pendingGs,      setPendingGs]      = useState(null); // held next state
const narrativeTimerRef = useRef(null);
```

**Queue driver** (useEffect يراقب `narrativeQueue`):
- يأخذ أول beat من القائمة، يعرضه
- إذا كان `durationMs > 0`: setTimeout يُكمل البيت تلقائياً
- إذا كان `durationMs === 0`: ينتظر تأكيد المستخدم (زر "حسناً")
- عند اكتمال آخر beat مع `pendingGs`: `setGs(pendingGs)`, `setPendingGs(null)`

**تسلسلات البيتس لكل قدرة**:
| الكرت | التسلسل |
|-------|---------|
| 1 — المقهى (Guess) | AI_THINKING(800ms) → CARD_ANTICIPATE(600ms) → CARD_IMPACT(user confirms) → CARD_RESULT(1200ms) |
| 2 — المكتبة (Peek) | CARD_ANTICIPATE(500ms) → CARD_IMPACT(user confirms peek) → CARD_RESULT(800ms) |
| 3 — التاجر (Compare) | CARD_ANTICIPATE(500ms) → COMPARE_REVEAL(user confirms) → ELIMINATION? → CARD_RESULT(1000ms) |
| 4 — الجارة (Protect) | CARD_IMPACT(500ms) → PROTECTION_FLASH(800ms) |
| 5 — المهندس (Force) | CARD_ANTICIPATE(600ms) → FORCE_RESULT(user confirms) → ELIMINATION? → CARD_RESULT(1000ms) |
| 6 — القائد (Swap) | CARD_ANTICIPATE(500ms) → SWAP_VISUAL(900ms) → CARD_RESULT(600ms) |
| 7 — البستان (Discard-only) | CARD_IMPACT(400ms) |
| 8 — النجمة (Star) | CARD_IMPACT(300ms) → ELIMINATION(1500ms) إذا أُجبر على الرمي |

**الملفات المتأثرة**:
- `src/engine/narrativeBuilder.js` ← جديد
- `src/pages/GamePage.jsx` ← استبدال كل `aiPhase`/`aiPendingState` بـ narrativeQueue
- `src/components/NarrativeOverlay.jsx + .module.css` ← جديد

---

### ثانياً — وضوح الدور (Turn Clarity)
**التعقيد: Medium**

**TurnBanner** — شريط علوي يعلن الدور بوضوح:
- `src/components/TurnBanner.jsx` ← جديد
- نص "دورك — العب كرتاً" (أزرق متوهج) vs "دور [اسم اللاعب]" (رمادي)
- `@keyframes bannerSlideIn`: ينزل من الأعلى عند كل تغيير دور (300ms)
- يختفي خلال 2 ثانية في دور AI لكنه يبقى في دور الإنسان حتى يلعب

**Board Dimming** — تعتيم كل شيء ما عدا المنطقة النشطة:
- `src/pages/GamePage.module.css`: `.waitingForAI` على `.board` → overlay شبه شفاف على humanZone
- `src/pages/GamePage.jsx`: className مشروط بناءً على `gs.currentPlayer !== humanId`

**Input Lock** — منع التفاعل أثناء narrative beats:
- `const isLocked = !!currentBeat || gs.currentPlayer !== humanId`
- تمرير `isLocked` لكل clickable elements كـ `disabled` prop

---

### ثالثاً — تغذية راجعة الإجراء (Action Feedback)
**التعقيد: Medium**

**NarrativeOverlay** (المكوّن المركزي للعرض):
- `src/components/NarrativeOverlay.jsx` ← جديد
- يعرض بناءً على `currentBeat.type`:
  - `CARD_ANTICIPATE`: صورة الكرت + نبضة ذهبية + اسم القدرة
  - `COMPARE_REVEAL`: بطاقتان جنباً لجنب + تمييز الخاسر (glow أحمر) + نص "X أقوى من Y"
  - `FORCE_RESULT`: الكرت المرمي + سهم + الكرت الجديد
  - `SWAP_VISUAL`: سهمان يتقاطعان بين لاعبَين
  - `PROTECTION_FLASH`: درع يتوسع (scale 0 → 2.5، opacity 1 → 0)
  - `ELIMINATION`: وميض أحمر + نص "خرج [الاسم]!" + صوت
  - `CARD_RESULT`: ملخص نصي للنتيجة + زر "حسناً"
  - `AI_THINKING`: نقاط متحركة "... يفكر"

**Float Labels** (`getBoundingClientRect()` + `position: fixed`):
- `src/components/FloatLabel.jsx` ← جديد
- يظهر فوق مقعد اللاعب المتأثر لمدة 2 ثانية
- أمثلة: "مكشوف! 🔍"، "محمي! 🛡️"، "خرج! 💀"، "تبادل! 🔀"

**ActionSubtitle** — شريط أسفل Arena يصف ما يحدث الآن:
- `src/pages/GamePage.jsx`: state `actionSubtitle: string`
- نص مثل: "[خالد] لعب كرت التاجر — يقارن مع [اللاعب]"
- يختفي بـ `fadeOut` بعد 3 ثوانٍ

---

### رابعاً — قراءة حالة اللعبة (Game State Readability)
**التعقيد: Quick-to-Medium**

**Seat Badges** — شارات ملونة على كل مقعد:
- `src/pages/GamePage.module.css`: إزالة `display: none` عن `.seat_left .activeBadge, .seat_right .activeBadge`
- درع صغير `🛡️` إذا كان اللاعب محمياً
- "★ دوره" إذا كان النشط
- عداد صغير لعدد الكروت في يد الـ AI (يُظهر أعداداً مخفية بدل الكروت المكشوفة)

**Discard Pile مرئية**:
- `src/engine/gameEngine.js`: أضف `globalDiscard: []` — كل كرت يُلعب يُضاف هنا
- `src/components/DiscardPile.jsx` ← جديد: fan effect (آخر 3 كروت، زوايا -14°، -7°، 0°)
- ضعها في `.arena` بين الورق والـ log

**Hand Slot Labels** — بدل "كرتك" و"السحب":
- `src/pages/GamePage.jsx`: تسميات ديناميكية: "في يدك" و"سحبته للتو"

---

### خامساً — توجيه اللاعب (Player Guidance)
**التعقيد: Medium**

**Playable Card Glow** — فقط الكروت اللعيبة تتوهج:
- `src/pages/GamePage.jsx`: احسب `playableCardUids` قبل العرض
- `src/components/Card.module.css`: `.playable { box-shadow: 0 0 0 2px #ffd700, 0 0 12px rgba(255,215,0,0.4); animation: playablePulse 2s infinite; }`
- `@keyframes playablePulse`: glow يتنفس

**ActionModal Context** — عند تحديد كرت للعب، Modal يعرض:
- `src/components/ActionModal.jsx` ← تعديل: أضف "لماذا تلعب هذا الكرت؟" hint
- مثال لكرت 1 (Guess): "اختر لاعباً واخمن كرته — إن أصبت يُقصى"
- مثال لكرت 7 (Bustan): تحذير مميز "يجب عليك رميه الآن — لديك 5 أو 6"

**Forced Play Indicator**:
- إذا كان `mustPlayCard` = 7: أضف badge "إجباري!" على الكرت بلون برتقالي متوهج

---

### سادساً — الإيقاع والتوقيت (Pacing)
**التعقيد: Quick — تعديلات timing فقط**

| الحدث | التوقيت الحالي | المستهدف |
|-------|----------------|----------|
| AI thinking | فوري | 600-900ms |
| بعد لعب بطاقة | فوري | 400ms anticipation |
| COMPARE reveal | فوري | 1200ms (زمن القراءة) |
| ELIMINATION | فوري | 1500ms (لحظة درامية) |
| تغيير الدور | فوري | 300ms delay + TurnBanner |
| انتهاء اللعبة | فوري | 800ms delay ثم انتقال |

---

### سابعاً — تجربة الجوال (Mobile UX)
**التعقيد: Quick**

- `src/pages/GamePage.module.css`:
  - `@media (max-width: 400px)`: تصغير humanZone gap إلى 6px
  - زيادة tap target size للكروت: `min-height: 44px` على الأزرار
  - NarrativeOverlay: `bottom: calc(env(safe-area-inset-bottom) + 80px)` لتجنب home indicator
- `src/utils/sounds.js`: أضف `haptic(pattern)` يستدعي `navigator.vibrate?.(pattern)`:
  - لعب كرت: `[10]`
  - إقصاء: `[30, 20, 30]`
  - فوز: `[50, 30, 50, 30, 100]`

---

### خريطة التنفيذ الكاملة (5 Sprints)

| Sprint | المهام | الأثر |
|--------|--------|-------|
| **1** | CSS Tokens + عدد الخصوم + توسيع الجوانب | أساس لكل ما يليه |
| **2** | narrativeQueue architecture + TurnBanner + Input Lock | قلب الـ UX |
| **3** | نظام الجولات + كومة المرميات + NarrativeOverlay لكل قدرة | اللعب مفهوم |
| **4** | AI بمستويات + Perspective 3D + DiscardPile + Float Labels | بصرياً منقلب |
| **5** | تسلسل قوة الكروت + Micro-interactions + نهاية اللعبة + Guide Drawer + Mobile UX | صقل نهائي |

## الملفات الحرجة

| الملف | يتأثر بـ |
|-------|---------|
| `src/engine/gameEngine.js` | globalDiscard، SHOWDOWN phase، difficulty field |
| `src/engine/narrativeBuilder.js` | **جديد** — بناء beat sequences |
| `src/pages/GamePage.jsx` | narrativeQueue، pendingGs، flyState، seats |
| `src/pages/GamePage.module.css` | grid، perspective، tokens، animations |
| `src/index.css` | CSS token system (:root) |
| `src/ai/aiPlayer.js` | difficulty levels |
| `src/pages/LobbyPage.jsx` | AI count، difficulty، tokensToWin |
| `src/pages/ResultPage.jsx` | round vs. game over modes |
| `src/App.jsx` | tokens state، round routing |
| `src/components/Card.jsx` | tier classes، playable glow |
| `src/components/Card.module.css` | tier styles، shimmer، playable pulse |

## الملفات الجديدة المطلوبة

```
src/engine/narrativeBuilder.js
src/components/NarrativeOverlay.jsx + .module.css
src/components/TurnBanner.jsx + .module.css
src/components/FloatLabel.jsx + .module.css
src/components/DiscardPile.jsx + .module.css
src/components/TokenDisplay.jsx + .module.css
src/components/EffectRevealModal.jsx + .module.css
src/components/VictoryOverlay.jsx + .module.css
src/components/ShowdownScreen.jsx + .module.css
src/components/GuideDrawer.jsx + .module.css
src/pages/RoundOverScreen.jsx + .module.css
```

## التحقق من النتائج

- بعد Sprint 1: بناء `npm run build` ينجح. اللعبة تعمل بعدد AI مختلف. الجوانب أوسع
- بعد Sprint 2: دور اللاعب واضح. AI thinking يظهر delay. لا تفاعل أثناء narrative
- بعد Sprint 3: كل قدرة لها visual feedback. COMPARE مفهوم. جولات متعددة تعمل
- بعد Sprint 4: الطاولة ثلاثية الأبعاد. الكروت المرمية مرئية. Float labels تظهر
- بعد Sprint 5: الكروت ذات قيمة بصرية. الإقصاء مؤثر. Guide drawer متاح. Haptic feedback
