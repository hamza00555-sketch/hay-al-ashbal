أنا أطور لعبة أوراق عربية على الموبايل بـ React 19 + Vite + CSS Modules.
عندي مشكلة في عرض إطارات PNG فوق صور الأفاتار.

---

## المكون الحالي: PlayerAvatar.jsx

```jsx
export default function PlayerAvatar({
  cardImageId  = '1',
  frameColor   = '#60b8ff',
  frameImageId = null,
  size         = 'md',
  name,
}) {
  const hasPngFrame = !!frameImageId;
  return (
    <div
      className={[styles.outerWrap, styles[`size_${size}`]].join(' ')}
      style={{ '--frame-color': hasPngFrame ? 'transparent' : frameColor }}
    >
      <div className={[
        styles.avatar,
        styles.shape_rounded,
        hasPngFrame ? styles.noBorder : '',
      ].join(' ')}>
        <img src={`/cards/${cardImageId}.webp`} className={styles.img} />
      </div>
      {hasPngFrame && (
        <img src={`/frames/${frameImageId}.webp`} className={styles.frameOverlay} />
      )}
    </div>
  );
}
```

---

## CSS الحالي: PlayerAvatar.module.css

```css
.outerWrap {
  display: inline-flex;
  flex-shrink: 0;
  position: relative;
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--frame-color,#60b8ff) 55%, transparent));
}

.size_sm   { width: 38px;  height: 38px;  }
.size_md   { width: 52px;  height: 52px;  }
.size_lg   { width: 68px;  height: 68px;  }
.size_xl   { width: 88px;  height: 88px;  }
.size_seat { width: 80px;  height: 80px;  }

.avatar {
  width: 100%;
  height: 100%;
  border: 2.5px solid var(--frame-color, #5682B2);
  overflow: hidden;
  background: #EAF2FB;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.shape_rounded { border-radius: 12px; }
.noBorder { border: none; background: transparent; }

.img {
  width: 160%;
  height: 160%;
  object-fit: cover;
  object-position: center 25%;
  pointer-events: none;
}

.frameOverlay {
  position: absolute;
  inset: -30%;
  object-fit: contain;
  pointer-events: none;
  z-index: 0;
}
```

---

## بيانات صور الإطار (قياسات مُحسوبة بـ Python/Pillow)

كل صورة إطار هي PNG مربعة 1254×1254px. الإطار عبارة عن حلقة (ring) بوسطها ثقب شفاف.
القياسات التالية محسوبة بمسح عمود/صف المنتصف لإيجاد حدود الثقب:

| الملف | ثقب داخلي (عرض%) | ثقب داخلي (ارتفاع%) | padding خارجي (كل جهة%) |
|-------|-----------------|---------------------|--------------------------|
| fr_c1 | 65.6%           | 63.6%               | 8.7%                     |
| fr_c2 | 64.8%           | 64.8%               | 6.9%                     |
| fr_c3 | 57.8%           | 57.7%               | 11.2%                    |
| fr_c4 | 63.9%           | 64.0%               | 7.5%                     |
| fr_l1 | 66.7%           | 49.5%               | 8.5%                     |
| fr_l2 | 55.4%           | 51.7%               | 13.4%                    |
| fr_l3 | 51.4%           | 42.6%               | 14.8%                    |
| fr_l4 | 63.6%           | 40.1%               | 8.9%                     |
| fr_r1 | 58.7%           | 57.4%               | 14.1%                    |
| fr_r2 | 56.5%           | 58.7%               | 13.2%                    |
| fr_r3 | 51.9%           | 53.8%               | 17.0%                    |
| fr_r4 | 53.0%           | 50.9%               | 17.0%                    |

---

## المشكلة

**السبب الجذري:** الثقب الداخلي يختلف كثيراً بين الإطارات (51% إلى 67%).
لا توجد قيمة inset واحدة تناسب جميع الإطارات في نفس الوقت.

**محاولات فاشلة:**

1. `inset: -14%; z-index: 2` (الإطار فوق الأفاتار)
   → الإطار يُعرض بـ 113px لأفاتار 88px
   → ثقب fr_l2 = 55.4% × 113 = 62px ← يغطي حواف الأفاتار بـ 13px من كل جهة
   → المستخدم: "الإطار كبير جداً"

2. `inset: -30%; z-index: 0` (الإطار خلف الأفاتار)
   → outerWrap عنده `filter: drop-shadow` = يصنع stacking context
   → z-index: 0 على frameOverlay و z-index: 1 على avatar قد يتصرف بشكل غير متوقع
   → المستخدم: "لازال كبيراً"

---

## ما أريده بالضبط

- صورة الشخصية تظهر كاملة داخل مربع مدبب (border-radius: 12px) بدون أي تغطية
- حلقة الإطار تظهر حول حواف الصورة كـ border خارجي (لا تغطي الصورة)
- الإطار يبدو "أكبر من الصورة بشوية" → حلقته ظاهرة خارج حدود الأفاتار قليلاً
- يعمل مع جميع الأحجام: 38px، 52px، 68px، 80px، 88px
- لا يُزيح عناصر أخرى في الـ layout (overflow visible مقبول)

---

## قيود

- لا يمكن تعديل ملفات صور الإطار
- لا يمكن تخزين scale مخصص لكل إطار (يزيد التعقيد)
- `filter` على outerWrap ضروري ولا يمكن حذفه
- المكون يُستخدم في أماكن كثيرة في التطبيق

---

## السؤال

ما هي الطريقة CSS/JSX المثلى لعرض هذه الإطارات بحيث:
1. تحل مشكلة اختلاف نسبة الثقب (51-67%) بين الإطارات بقيمة واحدة
2. الإطار يحيط بالصورة ولا يغطيها
3. يعمل صح مع `filter` على الـ parent (stacking context)
4. لا يحتاج قيماً مخصصة per-frame

هل هناك نهج مختلف كلياً (مثلاً: تصغير الأفاتار داخل outerWrap، أو استخدام wrapper إضافي، أو mask-image) لم أفكر فيه؟
أعطني الكود الكامل للملفين PlayerAvatar.jsx و PlayerAvatar.module.css بعد الإصلاح.
