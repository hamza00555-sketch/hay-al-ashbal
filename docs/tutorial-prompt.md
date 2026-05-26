# حي الأشبال — توثيق التوريال الكامل (برومبت لأدوات الذكاء الاصطناعي)

> هذا الملف موجّه لأداة ذكاء اصطناعي أخرى تساعد في تطوير التوريال.  
> يحتوي على: لقطات الشاشة + شرح كل خطوة + نظام التصميم + الأنيميشن + الهيكل التقني.

---

## 1. نظرة عامة على اللعبة

**حي الأشبال** — لعبة ورق عربية مستوحاة من Love Letter (8 بطاقات مختلفة، 2-4 لاعبين).  
المكدس: **React 19 + Vite + CSS Modules + Firebase RTDB**.  
التطبيق مصمم للموبايل بالكامل (أقصى عرض 390px، RTL، فونت Zanjabeel).

### البطاقات الثماني
| رقم | الاسم | القدرة |
|-----|-------|--------|
| 1 | المقهى ☕ | خمّن كرت خصمك — إن أصبت يُقصى |
| 2 | المكتبة 📚 | انظر كرت لاعب آخر سراً |
| 3 | التاجر ⚖️ | قارن كرتك مع كرت لاعب — الأدنى يخرج |
| 4 | الجارة 🛡️ | احمِ نفسك حتى دورك القادم |
| 5 | المهندس 🔧 | أجبر لاعباً على رمي كرته وسحب جديدة |
| 6 | القائد ⚔️ | بادل كرتك مع كرت لاعب آخر |
| 7 | البستان 🌿 | يُلعب إجبارياً إذا كنت تحمل 5 أو 6 |
| 8 | نجمة الحي ⭐ | أقوى كرت — إن خرجت من يدك تخرج أنت |

---

## 2. بنية ملفات التوريال

```
src/
  pages/
    TutorialPage.jsx          ← المكوّن الرئيسي (417 سطر)
    TutorialPage.module.css   ← كل الستايلات (699 سطر)
  tutorial/
    tutorialSteps.js          ← تعريف 13 خطوة (STEPS array)
    tutorialStorage.js        ← localStorage للتتبع (markTutorialDone / hasDoneTutorial)
```

---

## 3. الخطوات الـ 13 — تسلسل كامل

### الفصل 1: أساسيات اللعب (7 خطوات)

#### الخطوة 0 — WELCOME
- **الحالة البصرية**: الشاشة الرئيسية مع overlay شفاف، لا spotlight
- **فقاعة المدرب** (وسط الشاشة): "أهلاً يا شبل! 🦁 سأعلّمك اللعبة خطوة بخطوة"
- **إجراء اللاعب**: يضغط في أي مكان للمتابعة
- **لقطة الشاشة**: `01_welcome.png`

```
[لقطة الشاشة: 01_welcome.png]
الوصف: خلفية بيضاء-زرقاء فاتحة، فقاعة بيضاء في المنتصف مع أيقونة أسد 🦁،
نص ترحيبي بالعربية، كرت خالد في الأعلى (كرت مقلوب)، كرت اللاعب في الأسفل.
نقاط التقدم في الأعلى (المحرز الأصفر = الخطوة الأولى). زر "تخطي" أعلى اليسار.
```

---

#### الخطوة 1 — SHOW_HAND
- **الحالة البصرية**: Spotlight ذهبي على كرت اليد، تعتيم باقي الشاشة
- **فقاعة المدرب** (أسفل): "هذه بطاقتك 🃏 كل لاعب يمسك بطاقة واحدة"
- **Spotlight**: `hand-card` (data-tut attribute)
- **إجراء اللاعب**: يضغط في أي مكان
- **لقطة الشاشة**: `02_show_hand.png`

```
[لقطة الشاشة: 02_show_hand.png]
الوصف: تعتيم 65% على كل الشاشة. حلقة ذهبية متوهجة تُحيط بكرت اللاعب في
الأسفل (كرت المكتبة 2). فقاعة الشرح في الأسفل. لا سهم.
```

---

#### الخطوة 2 — DRAW_CARD
- **الحالة البصرية**: Spotlight على كومة الورق (deck) + سهم يرتد لأعلى/أسفل
- **فقاعة المدرب** (وسط): "اسحب بطاقة من الكومة 👇 اضغط عليها الآن!"
- **Spotlight**: `deck`، **Arrow**: `deck`
- **إجراء اللاعب**: يضغط على الكومة (TAP_DECK) → تُسحب ورقة
- **لقطة الشاشة**: `03_draw_card.png`

```
[لقطة الشاشة: 03_draw_card.png]
الوصف: Spotlight ذهبي على الكومة في وسط الشاشة. سهم أصفر ▲ يرتد فوق الكومة
(animation arrowBounce 0.9s). فقاعة في الوسط تطلب الضغط. "اضغط في أي مكان
للمتابعة" تظهر فقط للـ TAP_ANYWHERE (لا تظهر هنا لأن الـ trigger هو TAP_DECK).
```

---

#### الخطوة 3 — TWO_CARDS
- **الحالة البصرية**: كرتان في اليد، spotlight على منطقة اليد كاملة
- **فقاعة المدرب** (أسفل): "رائع! 🎉 الآن معك بطاقتان — اختر واحدة للعب"
- **Spotlight**: `hand-area`
- **إجراء اللاعب**: يضغط في أي مكان
- **لقطة الشاشة**: `04_two_cards.png`

```
[لقطة الشاشة: 04_two_cards.png]
الوصف: بعد سحب الكرت — يظهر كرتان في الأسفل (المكتبة + التاجر).
الكرت المسحوب يظهر بتأثير dimmed (شفافية أقل). Spotlight على منطقة اليد.
```

---

#### الخطوة 4 — SELECT_CARD
- **الحالة البصرية**: Spotlight على الكرت الأيسر + سهم يشير إليه
- **فقاعة المدرب** (أسفل): "اضغط على البطاقة اليسرى لتختارها 👆"
- **Spotlight**: `hand-card`، **Arrow**: `hand-card`
- **إجراء اللاعب**: يضغط على الكرت (TAP_HAND) → يُحدد
- **لقطة الشاشة**: `05_select_card.png`

```
[لقطة الشاشة: 05_select_card.png]
الوصف: Spotlight ذهبي على الكرت الأيسر في اليد. سهم ▲ يرتد أسفل الكرت.
```

---

#### الخطوة 5 — PLAY_CARD
- **الحالة البصرية**: نفس الـ Spotlight، لكن الكرت محدد (focused = true → glow أزرق)
- **فقاعة المدرب** (أسفل): "ممتاز! اضغط عليها مرة ثانية للعبها 🎮"
- **Spotlight**: `hand-card`، **Arrow**: `hand-card`
- **إجراء اللاعب**: يضغط مرة ثانية (TAP_PLAY) → تُلعب
- **لقطة الشاشة**: `06_play_card.png`

```
[لقطة الشاشة: 06_play_card.png]
الوصف: الكرت بحالة focused (drop-shadow أزرق يتوهج). نفس الـ Spotlight والسهم.
```

---

#### الخطوة 6 — SEE_RESULT
- **الحالة البصرية**: نتيجة لعب الكرت + زر "حسناً ✓" في الأسفل + سهم يشير للزر
- **فقاعة المدرب** (وسط): "انظر ماذا حدث! 👀 ثم اضغط حسناً"
- **Arrow**: `confirm`
- **إجراء اللاعب**: يضغط زر "حسناً ✓" (TAP_CONFIRM)
- **لقطة الشاشة**: `06_see_result.png`

```
[لقطة الشاشة: 06_see_result.png]
الوصف: منطقة نتيجة في الأسفل: "نظرت في كرت خالد! 👀" + زر أصفر ذهبي.
السهم ▼ يرتد فوق الزر. لا spotlight هنا.
```

---

### الفصل 2: القواعد الخاصة (4 بطاقات)

**هيئة مختلفة:** الشاشة الكاملة كشاشة تعليمية — بطاقة كبيرة + فقاعة + زر "التالي ▶"  
لا overlay، لا spotlight، لا تعتيم.

---

#### الخطوة 7 — TEACH_CARD1 (المقهى)
- **الكرت المعروض**: كرت رقم 1 (المقهى ☕) بحجم large
- **فقاعة المدرب**: "كرت المقهى ☕ خمّن كرت خصمك — لو أصبت يخرج من اللعبة!"
- **لقطة الشاشة**: `07_rule_mqha.png`

```
[لقطة الشاشة: 07_rule_mqha.png]
الوصف: شاشة بيضاء-زرقاء فاتحة. كرت المقهى كبير في الوسط (رسمة + اسم القدرة).
فقاعة الشرح أسفله مع أيقونة الأسد. زر "التالي ▶" أسفل الصفحة.
نقاط التقدم في الأعلى (الخطوة 7 من 13 محددة).
```

---

#### الخطوة 8 — TEACH_CARD4 (الجارة)
- **الكرت المعروض**: كرت رقم 4 (الجارة 🛡️) بحجم large
- **فقاعة المدرب**: "كرت الجارة 🛡️ يحميك! لا أحد يقدر يؤثر فيك حتى دورك القادم"
- **لقطة الشاشة**: `8_rule_jara.png`

---

#### الخطوة 9 — TEACH_CARD7 (البستان)
- **الكرت المعروض**: كرت رقم 7 (البستان 🌿) بحجم large
- **فقاعة المدرب**: "⚠️ لو معك كرت البستان مع 5 أو 6 لازم تلعب البستان أولاً!"
- **لقطة الشاشة**: `9_rule_bustan.png`

---

#### الخطوة 10 — TEACH_CARD8 (نجمة الحي)
- **الكرت المعروض**: كرت رقم 8 (نجمة الحي ⭐) بحجم large
- **فقاعة المدرب**: "خطر! ⭐ نجمة الحي — لو خرجت من يدك لأي سبب تخرج أنت!"
- **لقطة الشاشة**: `10_rule_star.png`

---

### الفصل 3: التدريب والمكافأة (2 خطوات)

#### الخطوة 11 — PRACTICE (مقدمة)
- **الحالة البصرية**: فقاعة مركزية "الآن نجرب معاً! 🎮 العب دوراً بمساعدتي"
- **إجراء اللاعب**: يضغط في أي مكان → ينتقل لـ PracticeMode
- **لقطة الشاشة**: `12_practice_intro.png`

---

#### وضع التدريب — PracticeMode (4 مراحل فرعية)

**المرحلة 0 — اسحب من الكومة**  
- فقاعة: "اسحب من الكومة! 👇"  
- الكومة محددة بـ `.practiceTarget` (خلفية ذهبية + حد + animation pulse)  
- لقطة: `13_practice_deck.png`

**المرحلة 1 — اضغط مرتين على الكرت**  
- فقاعة: "اضغط على البطاقة مرتين للعبها 👆"  
- الكرت محدد بـ `.practiceTarget`  
- الكومة فارغة (dashed border)  
- لقطة: `14_practice_play.png`

**المرحلة 2 — اضغط على خالد**  
- فقاعة: "اضغط على خالد! 👆"  
- مقعد خالد محدد بـ `.practiceTarget`  
- يظهر label "اضغط! 👆" فوق خالد

**المرحلة 3 — النتيجة**  
- فقاعة: "أحسنت! 🎉"  
- نافذة نتيجة: "نظرت في كرت خالد! 👀" + كرت المهندس مكشوف (رقم 5)  
- بعد 1600ms تلقائياً → الخطوة التالية  
- لقطة: `15_practice_result.png`

---

#### الخطوة 12 — REWARD
- **الحالة البصرية**: شاشة كاملة بخلفية داكنة زرقاء، كونفيتي يتساقط
- **عناصر**: 🏆 (rewardPop animation) + "أحسنت يا شبل!" (أصفر ذهبي) + ⭐⭐⭐ + زران
- **لقطة الشاشة**: `16_reward.png`

```
[لقطة الشاشة: 16_reward.png]
الوصف: خلفية gradient من #1F3D5A إلى #2d5a8a (داكن أزرق). كونفيتي ملون يتساقط.
أيقونة الكأس 🏆 بحجم 5rem. عنوان "أحسنت يا شبل!" بالأصفر الذهبي. 3 نجوم.
زر "العب الآن! 🎮" أصفر ذهبي كبير. زر "أعد التدريب" شفاف أبيض.
```

---

## 4. نظام التصميم (Design System)

### 4.1 الألوان
| المتغير | القيمة | الاستخدام |
|--------|--------|----------|
| `--color-bg-deep` | `#EAF2FB` | خلفية الصفحة الرئيسية |
| `--color-bg-mid` | `#d0e6f7` | عناصر الخلفية الثانوية |
| `--color-text` | `#1F3D5A` | النصوص الرئيسية |
| `--color-gold` | `#FFC83D` | الأزرار والعناصر التفاعلية |
| `--color-blue` | `#5682B2` | الحدود والتفاصيل |
| `--color-red` | `#FF8888` | التحذيرات والأخطاء |

**ألوان خاصة بالتوريال:**
- خلفية فقاعة المدرب: `#ffffff` مع حد `#60b8ff`
- خلفية التعتيم: `rgba(0,0,0,0.65)`
- حلقة Spotlight: ذهبية `rgba(255,215,0,0.9)`
- خلفية شاشة المكافأة: `linear-gradient(160deg, #1F3D5A 0%, #2d5a8a 100%)`

### 4.2 الخطوط
- **الخط الوحيد**: Zanjabeel (OTF، أوزان 100-900) — خط عربي مخصص
- مسار: `/public/fonts/Zanjabeel-*.otf`
- الأحجام المستخدمة: 0.75rem → 2.2rem

### 4.3 البُعد والتباعد
```css
max-width: 390px;    /* أقصى عرض (موبايل) */
min-height: 100svh;  /* ارتفاع الشاشة الكامل */
direction: rtl;      /* اتجاه النص من اليمين لليسار */
```

### 4.4 Border Radius
- فقاعات: `20px`
- أزرار: `16px`
- Spotlight hole: `18px`
- كروت الأوراق: `10-14px`

---

## 5. الأنيميشن (Animations)

### 5.1 قائمة كاملة بكل الـ keyframes

#### `spotPulse` — حلقة Spotlight الذهبية
```css
@keyframes spotPulse {
  0%, 100% {
    box-shadow:
      0 0 0 2000px rgba(0,0,0,0.65),     /* التعتيم */
      0 0 0 3px rgba(255,215,0,0.9),      /* الحلقة الداخلية */
      0 0 16px rgba(255,215,0,0.4);       /* الـ glow الخارجي */
  }
  50% {
    box-shadow:
      0 0 0 2000px rgba(0,0,0,0.65),
      0 0 0 4px rgba(255,215,0,1.0),      /* الحلقة تكبر */
      0 0 32px rgba(255,215,0,0.8);       /* الـ glow يزداد */
  }
}
/* المدة: 1.6s ease-in-out infinite */
```

#### `arrowBounce` — السهم المترجح
```css
@keyframes arrowBounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
/* المدة: 0.9s ease-in-out infinite */
/* اللون: #FFC83D (ذهبي)، حجم الخط: 2rem */
/* يتجه لأعلى إذا كان الهدف في النصف السفلي (▼)، أو لأسفل (▲) */
```

#### `toastFade` — توست الخطأ
```css
@keyframes toastFade {
  0%   { opacity: 1; }
  70%  { opacity: 1; }
  100% { opacity: 0; }
}
/* المدة: 0.7s ease forwards */
/* اللون: rgba(255,107,107,0.95) — أحمر */
/* النص: "✨ اضغط على المكان المضيء!" */
```

#### `phasePulse` — نبضة النصوص التلميحية
```css
@keyframes phasePulse {
  from { opacity: 0.6; }
  to   { opacity: 1; }
}
/* المدة: 1.2s ease-in-out infinite alternate */
/* يُستخدم على: tapHint, drawHint, tapMe, tapMeLabel */
```

#### `tapBtnPulse` — نبضة زر الإجراء (حسناً / التالي)
```css
@keyframes tapBtnPulse {
  from { box-shadow: 0 4px 16px rgba(255,200,61,0.3); }
  to   { box-shadow: 0 4px 24px rgba(255,200,61,0.6); }
}
/* المدة: 1.4s ease-in-out infinite alternate */
/* يُستخدم على: confirmBtn, practiceTarget */
```

#### `deckPulseAnim` — نبضة الكومة
```css
@keyframes deckPulseAnim {
  from {
    filter: drop-shadow(0 0 6px rgba(96,184,255,0.4));
    transform: scale(1);
  }
  to {
    filter: drop-shadow(0 0 20px rgba(96,184,255,0.8));
    transform: scale(1.06);
  }
}
/* المدة: 0.65s ease-in-out infinite alternate */
```

#### `confettiFall` — تساقط الكونفيتي
```css
@keyframes confettiFall {
  0%   { transform: translateY(0) rotate(0deg);          opacity: 1; }
  100% { transform: translateY(110vh) rotate(calc(var(--i) * 55deg)); opacity: 0; }
}
/* 12 قطعة، كل واحدة: calc(1.1s + var(--i) * 0.06s) ease-in calc(var(--i) * 0.08s) forwards */
/* الألوان: hsl(calc(var(--i) * 26deg), 80%, 62%) — طيف متدرج */
```

#### `rewardPop` — ظهور الكأس 🏆
```css
@keyframes rewardPop {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
/* المدة: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) — bounce effect */
```

#### `starsPop` — ظهور النجوم ⭐⭐⭐
```css
@keyframes starsPop {
  from { transform: scale(0) rotate(-10deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg);   opacity: 1; }
}
/* المدة: 0.6s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both — delay 0.2s */
```

#### `shakeBoard` — اهتزاز عند الضغط الخاطئ (غير مفعّل حالياً في UI)
```css
@keyframes shakeBoard {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-5px); }
  80%       { transform: translateX(5px); }
}
/* المدة: 0.4s ease */
```

---

## 6. طبقات الـ Z-index

```
z-index 997  → dimOverlay        (خلفية التعتيم — تمنع النقر الخاطئ)
z-index 998  → spotHole          (الحلقة الذهبية المرئية فقط — pointer-events:none)
z-index 1000 → humanZone         (منطقة يد اللاعب)
z-index 1001 → spotTarget        (portal يعترض النقر الصحيح)
z-index 1002 → practiceBubble    (فقاعة وضع التدريب)
z-index 1003 → arrow             (السهم المترجح)
z-index 1005 → bubble            (فقاعة المدرب الرئيسية)
z-index 1010 → wrongToast        (توست الخطأ)
z-index 1100 → skipBtn, progress (زر تخطي + نقاط التقدم)
z-index 2000 → rewardScreen      (شاشة المكافأة)
z-index 2001 → confettiWrap      (الكونفيتي فوق شاشة المكافأة)
```

---

## 7. المكوّنات التقنية

### 7.1 `SpotHole` (visual only)
```jsx
// خلفية التعتيم + الحلقة الذهبية عبر box-shadow فقط
// pointer-events: none — لا تعترض النقر
// يستخدم useRect() للحصول على موضع العنصر [data-tut="x"]
<div
  className={styles.spotHole}
  style={{ top, left, width, height }} // rect + 12px padding
/>
```

### 7.2 `SpotClickTarget` (portal)
```jsx
// createPortal لـ document.body — يُعرض فوق كل شيء
// z-index: 1001 — فوق dimOverlay (997) وspotHole (998)
// شفاف — يعترض فقط النقر الصحيح
createPortal(
  <div className={styles.spotTarget} style={...} onClick={handleTargetClick} />,
  document.body
)
```

### 7.3 `useRect(target)`
```js
// يستخدم useLayoutEffect للحصول على getBoundingClientRect()
// يبحث عن [data-tut="target"] في الـ DOM
// ملاحظة: لا يُحدَّث عند resize — إذا احتجت دعم rotate أضف ResizeObserver
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
```

### 7.4 قائمة `data-tut` attributes المستخدمة
```
data-tut="deck"       → كومة الورق
data-tut="hand-card"  → الكرت في اليد (الأيسر)
data-tut="hand-area"  → منطقة اليد بالكامل
data-tut="drawn-card" → الكرت المسحوب
data-tut="opponent"   → مقعد الخصم
data-tut="confirm"    → منطقة الـ confirm button
```

### 7.5 منطق `handleTargetClick()`
```js
switch (step?.trigger) {
  case 'TAP_ANYWHERE': advance();                     break;
  case 'TAP_DECK':     setDrawn(true); advance();     break;
  case 'TAP_HAND':     setFocused(true); advance();   break;
  case 'TAP_PLAY':     if (focused) advance();        break;
  case 'TAP_CONFIRM':  advance();                     break;
  default:             advance();
}
```

### 7.6 `PracticeMode` — آلية العمل
```js
// State: sub (0-3), drawn (bool), taps (count), result (bool)
// sub=0: الكومة نشطة → onClick: setDrawn(true), setSub(1)
// sub=1: الكرت نشط → onClick: taps++, if taps>=2 setSub(2)
// sub=2: خالد نشط → onClick: setSub(3)
// sub=3: setResult(true) → setTimeout(onDone, 1600ms)
```

---

## 8. البيانات المُبرمجة في التوريال

```js
// الكروت المستخدمة في التوريال
const PLAYER_HAND_CARD  = UNIQUE_CARDS.find(c => c.id === 2); // المكتبة
const PLAYER_DRAWN_CARD = UNIQUE_CARDS.find(c => c.id === 3); // التاجر
const OPPONENT = {
  id: 99,
  name: 'خالد',
  hand: [UNIQUE_CARDS.find(c => c.id === 5)] // المهندس (ما يراه اللاعب في نهاية التدريب)
};
// كروت القواعد (الفصل 2): id 1, 4, 7, 8
```

---

## 9. التشابه مع تصميم اللعبة الأصلية

### 9.1 ما هو مشترك (90% تشابه)

| العنصر | التوريال | اللعبة |
|--------|---------|--------|
| الخط | Zanjabeel | Zanjabeel |
| اللون الأساسي | #EAF2FB / #1F3D5A | #EAF2FB / #1F3D5A |
| اللون الذهبي | #FFC83D | #FFC83D |
| اللون الأزرق | #5682B2 / #60b8ff | #5682B2 / #60b8ff |
| الاتجاه | RTL | RTL |
| أقصى عرض | 390px | ~390px موبايل |
| مكوّن الكرت | `<CardFace>` / `<CardBack>` | نفس المكوّن |
| أزرار | FFC83D، border-radius 16px | نفس الستايل |
| فقاعات الشرح | حد #60b8ff، border-radius 20px | NarrativeOverlay نفس النمط |

### 9.2 ما هو مختلف (خاص بالتوريال)

| العنصر | التوريال | اللعبة |
|--------|---------|--------|
| الخلفية | `linear-gradient(#EAF4FF → #F5FAFF)` | صورة خلفية + CSS gradient |
| البورد | `flex-direction: column` بسيط | CSS Grid معقد (3 صفوف، 3 أعمدة) |
| Spotlight | `box-shadow: 0 0 0 2000px` تقنية | لا يوجد في اللعبة |
| المدرب | أسد 🦁 + فقاعة ثابتة | Narrative beats متحركة |
| الشاشة | حد أقصى 390px مرن | حد أقصى 430px |
| شاشة المكافأة | خلفية داكنة #1F3D5A | لا يوجد (ResultPage مختلف) |

### 9.3 المكوّنات المشتركة المُعاد استخدامها
- `<CardFace>` و `<CardBack>` من `src/components/Card.jsx`
- ثوابت البطاقات `UNIQUE_CARDS` من `src/constants/cards.js`
- نفس الـ CSS custom properties من `src/index.css`

---

## 10. تدفق التوريال الكامل (رسم تخطيطي)

```
App.jsx
  └── TutorialPage (onComplete → اللعبة, onSkip → القائمة, onRetry → إعادة)
        │
        ├── [stepIdx 0-6] → Board Steps (بورد مع overlay)
        │     ├── dimOverlay (z:997) ← TAP_ANYWHERE
        │     ├── SpotHole (z:998) ← visual
        │     ├── SpotClickTarget portal (z:1001) ← TAP_TARGET
        │     ├── TutArrow (z:1003)
        │     └── TutBubble (z:1005)
        │
        ├── [stepIdx 7-10] → Rule Card Screens (شاشة كاملة)
        │     ├── CardFace (large)
        │     ├── ruleBubble
        │     └── nextBtn "التالي ▶"
        │
        ├── [stepIdx 11] → Practice Mode
        │     └── PracticeMode component
        │           ├── sub=0: tap deck
        │           ├── sub=1: tap card ×2
        │           ├── sub=2: tap opponent
        │           └── sub=3: result → auto onDone (1600ms)
        │
        └── [stepIdx 12 / showReward=true] → RewardScreen
              ├── confetti (12 pieces)
              ├── 🏆 rewardPop
              ├── ⭐⭐⭐ starsPop
              ├── "العب الآن! 🎮" → onComplete
              └── "أعد التدريب" → onRetry
```

---

## 11. نقاط التقدم (Progress Dots)

```jsx
// 13 نقطة، ثابتة في أعلى الشاشة (z:1100)
// الألوان:
//   dotDone    → #60b8ff (الخطوات المكتملة)
//   dotCurrent → #FFC83D (الخطوة الحالية، حجم 1.35x)
//   default    → rgba(255,255,255,0.4) (الخطوات القادمة)
```

---

## 12. حالات الـ State الرئيسية في TutorialPage

```js
const [stepIdx,    setStepIdx]    = useState(0);       // الخطوة الحالية (0-12)
const [drawn,      setDrawn]      = useState(false);   // هل سُحب الكرت؟
const [focused,    setFocused]    = useState(false);   // هل الكرت محدد؟
const [wrongTap,   setWrongTap]   = useState(false);   // إظهار توست الخطأ
const [showReward, setShowReward] = useState(false);   // إظهار شاشة المكافأة
```

---

## 13. نقاط الضعف الحالية وفرص التحسين

### 13.1 مشاكل معروفة
1. **`useRect` لا يتحدث عند تغيير الحجم**: إذا دور الجهاز أثناء التوريال → Spotlight سيكون في مكان خاطئ. الحل: أضف `ResizeObserver` أو `window.addEventListener('resize', ...)`.

2. **PracticeMode يستخدم `useCallback` بـ `[]`**: إذا تغيّر `onDone` من الخارج لن يتحدث. في الواقع مقبول لأن `onDone = advance` لا يتغير.

3. **لا يوجد دعم لمنطقة آمنة (safe area)**: على iPhone مع home indicator، `bottom: 200px` في `bubbleBottom` قد لا يكفي.

4. **التوريال يستخدم كروتاً مُبرمجة فقط (id 2, 3, 5)**: لا يُعرض مجموعة الكروت كاملة في الممارسة.

### 13.2 فرص التحسين المقترحة
1. **إضافة صوت**: زر "حسناً" يُصدر صوت نقرة، الكرت المكشوف يُصدر صوت whoosh
2. **خيار إظهار التوريال مجدداً من القائمة**: زر "التعليمات" في الإعدادات
3. **تعريب PracticeMode**: استخدام بطاقات عشوائية بدل البيانات الثابتة
4. **animation للانتقال بين الفصول**: flash أو slide عند الانتقال من ch1 إلى ch2 وch3
5. **لقطة أفضل للـ DRAW_CARD**: إظهار animation حركة الكرت من الكومة للـ hand
6. **إصلاح `useRect` لـ resize**: مهم لدعم تدوير الجهاز

---

## 14. ملفات اللقطات

> اللقطات مأخوذة بـ Playwright Headless Chromium بحجم 390×844px.  
> مخزّنة في: `docs/tutorial-screenshots/`

| الملف | الخطوة | الوصف |
|-------|--------|-------|
| `00_menu.png` | القائمة | الشاشة الرئيسية — 5 أزرار |
| `01_welcome.png` | WELCOME | فقاعة الترحيب، لا spotlight |
| `02_show_hand.png` | SHOW_HAND | Spotlight على كرت اليد |
| `03_draw_card.png` | DRAW_CARD | Spotlight على الكومة + سهم |
| `04_two_cards.png` | TWO_CARDS | كرتان في اليد |
| `05_select_card.png` | SELECT_CARD | Spotlight + سهم على الكرت الأيسر |
| `06_play_card.png` | PLAY_CARD | الكرت محدد (focused glow) |
| `06_see_result.png` | SEE_RESULT | نتيجة + زر حسناً |
| `07_rule_mqha.png` | TEACH_CARD1 | شاشة كرت المقهى |
| `8_rule_jara.png` | TEACH_CARD4 | شاشة كرت الجارة |
| `9_rule_bustan.png` | TEACH_CARD7 | شاشة كرت البستان |
| `10_rule_star.png` | TEACH_CARD8 | شاشة نجمة الحي |
| `12_practice_started.png` | PRACTICE | بورد التدريب — كومة نشطة |
| `13_practice_deck.png` | PRACTICE sub=0 | كومة محددة بذهبي |
| `14_practice_play.png` | PRACTICE sub=1 | كرت محدد بذهبي |
| `15_practice_result.png` | PRACTICE نتيجة | "نظرت في كرت خالد!" + كرت مكشوف |
| `16_reward.png` | REWARD | شاشة المكافأة + كونفيتي |

---

## 15. كيفية تشغيل التوريال محلياً

```bash
npm run dev        # يشغّل Vite على http://localhost:5173 (أو 5174)
# افتح المتصفح → القائمة الرئيسية → "تعليمات" أو أول دخول
```

أو عبر App.jsx مباشرة إذا `!hasDoneTutorial()` يعرض `TutorialPage` تلقائياً.

---

*آخر تحديث: مايو 2026 — فرع `claude/build-game-gCZK6`*
