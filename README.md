<div align="center">

# ⚡ العادات الذرية | Atomic Habits
### محرك الاتساق اليومي وتتبع السلاسل وبناء الهوية الإيجابية
**منصة ويب تفاعلية فائقة الأداء مبنية وفق منهج كتاب "العادات الذرية" لجيمس كلير (James Clear)**

[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Local--First](https://img.shields.io/badge/Architecture-Local--First-00A896?style=for-the-badge)](#معمارية-local-first)
[![RTL Supported](https://img.shields.io/badge/RTL-100%25_Supported-F39C12?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[المميزات](#-أبرز-المميزات) • [منهج العادات الذرية](#-تطبيق-منهجية-العادات-الذرية) • [لوحة الألوان والخط](#-الهوية-البصرية-والتصميم) • [تصدير واستيراد Word](#-تصدير-واستيراد-مستندات-word) • [هيكل المشروع](#-هيكل-المجلدات) • [قاعدة البيانات](#-مخطط-قاعدة-البيانات-database-schema) • [التشغيل والتركيب](#-التشغيل-والتثبيت)

</div>

---

## 📖 نظرة عامة (Overview)

تطبيق **العادات الذرية (Atomic Habits)** هو نظام متقدم لتتبع المهام والعادات اليومية، صُمم خصيصاً للقضاء على التشتت والتركيز على **الاتساق التراكمي (Compound Consistency)**.

بدلاً من مجرد تسجيل المهام التقليدية، يربط التطبيق كل عادة بـ **الهوية الذاتية للمستخدم ("من تريد أن تصبح؟")** ويوفر شبكة تفاعلية ثنائية/ثلاثية لتسجيل الإنجاز بنقرة زر واحدة وبدون أي تأخير، مع ميزة التحذير الذكي **"إياك أن تفوّت مرتين متتاليتين"**.

---

## 🌟 أبرز المميزات (Key Features)

### 1. شبكة التتبع اليومي التفاعلية (Daily Binary/Ternary Grid)
- **دورة التبديل السريع بنقرة واحدة:**
  - ⏳ **قيد الانتظار / محايد** ➔ ✅ **منجز بنجاح** ➔ ❌ **مفوّت / لم يُنجز** ➔ ⏳ **محايد**.
- **اختصار زر الفأرة الأيمن:** تحديد العادة كـ "مفوّتة" مباشرة بضغطة زر واحدة.
- **استجابة فورية (Zero-Latency):** تحديث السلاسل ونسب الاتساق وأشرطة التقدم لحظياً في زمن $O(1)$ دون الحاجة لأي إعادة تحميل للصفحة.
- **طرق عرض متعددة:** التبديل بضغطة زر بين **عرض الأسبوع (7 أيام)** و **العرض المتدحرج (14 يوماً)** مع إمكانية التنقل بين الفترات الزمنية.
- **زر "إنجاز كل مهام اليوم":** لتسجيل جميع عادات اليوم دفعة واحدة مع إطلاق مفرقعات احتفالية.

### 2. تنبيه جيمس كلير الذكي: "إياك أن تفوّت مرتين!" (Never Miss Twice)
> *"الخطأ الأول ليس هو ما يدمرك، بل الانزلاق وتكراره. التفويت لمرة واحدة حادث عارض، أما التفويت لمرتين متتاليتين فهو بداية عادة سلبية جديدة!"*

عند تفويت عادة معينة بالأمس وعدم إنجازها اليوم، يظهر شريط تحذيري ذكي في أعلى الشاشة يحدد العادات المعرضة لكسر السلسلة مع زر **"إنقاذ العادة الآن"** لإعادتك إلى المسار فوراً.

### 3. التلعيب والسلاسل التحفيزية (Gamified Streaks)
- حساب لحظي للسلسلة الحالية (Current Streak)، والرقم القياسي التاريخي (Longest Streak)، ومعدل الالتزام الشهري (30-Day Consistency Rate).
- شارات الإنجاز:
  - 🥉 **سلسلة 3 أيام** — بداية الانطلاق (Bronze).
  - 🥈 **سلسلة 7 أيام** — أسبوع كامل من الالتزام (Silver).
  - 🥇 **سلسلة 14 أيام** — أسبوعان من الانضباط (Gold).
  - 💎 **سلسلة 30 يوماً** — تحول السلوك إلى عادة متجذرة (Diamond).
  - 👑 **سلسلة 100 يوم** — إتقان تام ونمط حياة (Master).
- مفرقعات احتفالية (Confetti) عند كسر الأرقام القياسية وبلوغ المحطات البارزة.

### 4. مؤثرات صوتية مدمجة (Web Audio API)
- توليد موجات صوتية لحظية خفيفة وعالية الدقة (نغمات نجاح، إخفاق، أو احتفال) بدون الحاجة لتحميل ملفات صوتية خارجية وبدون أي بطء.
- زر مخصص لكتم أو تفعيل المؤثرات الصوتية في أي وقت.

---

## 🧠 تطبيق منهجية العادات الذرية (The 4 Laws Framework)

يوفر التطبيق نافذة خاصة لهندسة العادات بناءً على **القوانين الأربعة لتغيير السلوك**:

| القانون | المفهوم في التطبيق | مثال عملي |
| :--- | :--- | :--- |
| **الهوية الذاتية ("لماذا؟")** | تحديد الشخص الذي تسعى لتكونه | *"أنا مهندس برمجيات ذو أثر عالٍ وتفكير استراتيجي عميق."* |
| **القانون 1: اجعلها واضحة** | الإشارة ومحفز تكديس العادات (Cue) | *"بعد شرب قهوة الصباح وإغلاق كافة الإشعارات."* |
| **القانون 2: اجعلها جذابة** | الروتين والسلوك المرغوب (Routine) | *"ارتداء سماعات عزل الضوضاء والعمل على التحدي البرمجي الأساسي."* |
| **القانون 3: اجعلها سهلة** | **قاعدة الدقيقتين للبدء** (2-Minute Rule) | *"فتح بيئة التطوير وكتابة السطر الأول فقط."* |
| **القانون 4: اجعلها مشبعة** | المكافأة الفورية وتسجيل السلسلة (Reward) | *"استراحة شاي منعشة لمدة 10 دقائق ورؤية تقدم السلسلة."* |

---

## 🎨 الهوية البصرية والتصميم (Design System)

تم بناء التطبيق بهوية بصرية حديثة وواجهة متكاملة باللغة العربية (`RTL`) تجمع بين مظهر لوحات التحكم الاحترافية والتباين العالي:

```
┌────────────────────────────────────────────────────────┐
│  Primary Background:     #0F2854 (Deep Navy Blue)      │
│  Cards & Surfaces:       #1C4D8D (Surface Navy)        │
│  Clean Borders:          #2A5C9E (Crisp Border)        │
│  Main Typography:        #F8FAFC (High Contrast Light) │
│  Success Interactive:    #00A896 (Vibrant Teal)        │
│  Success Hover State:    #02C39A (Bright Emerald Teal) │
│  Streak & Gold Accent:   #F39C12 (Amber Gold)          │
│  Typography Font:        'Cairo' (Google Fonts 300-900)│
└────────────────────────────────────────────────────────┘
```

- **الخط المعتمد:** خط **Cairo** المطبق شمولياً على النصوص، العناوين، الأزرار، وحقول الإدخال.
- **دعم الوضع المظلم والفاتح (Dark/Light Mode):** تبديل فوري وسلس عبر زر تفاعلي في الترويسة مع حفظ التفضيل محلياً.

---

## 📑 تصدير واستيراد مستندات Word (.docx)

ودّع ملفات JSON المعقدة! يتيح التطبيق إدارة وتوثيق بياناتك كـ **مستندات Word رسمية**:

- **تصدير Word (`.docx`):**
  - ضغطة زر واحدة لتوليد ملف `تقرير-العادات-الذرية.docx`.
  - يتضمن جداول تفصيلية بمعدلات الإنجاز والسلاسل لكل عادة، ومخطط القوانين الأربعة، مع تضمين كود مزامنة مشفر يسمح باسترجاع البيانات لاحقاً.
- **استيراد Word (`.docx`):**
  - رفع أي مستند Word تم تصديره سابقاً أو يحتوي على عاداتك، ليقوم التطبيق بقراءته واسترجاع العادات والسجلات فوراً بنسبة 100%.

---

## 📂 هيكل المجلدات (Folder Structure)

```
hapits/
├── index.html                           # قالب الويب، خط Cairo، وبيانات الميتا
├── package.json                         # الحزم والتبعيات والسكربتات
├── vite.config.ts                       # إعدادات Vite 8 وتكامل Tailwind CSS v4
├── README.md                            # التوثيق الشامل للمشروع
└── src/
    ├── types/
    │   ├── habit.ts                     # تعريفات TypeScript الكاملة (Habit, HabitLog, StreakStats)
    │   ├── schema.prisma                # مخطط Prisma ORM المعتمد لـ PostgreSQL / MySQL
    │   └── schema.sql                   # استعلامات DDL لقواعد بيانات PostgreSQL
    ├── lib/
    │   ├── initialData.ts               # العادات الذرية الابتدائية وسجلات الأيام النموذجية
    │   ├── sound.ts                     # محرك تخليق المؤثرات الصوتية (Web Audio API)
    │   ├── storage.ts                   # معمارية التخزين المحلي Local-First والذاكرة المستمرة
    │   ├── streak.ts                    # خوارزمية حساب السلاسل وتنبيه إياك أن تفوت مرتين
    │   ├── utils.ts                     # أدوات التواريخ العربية والألوان والتصنيفات
    │   └── wordService.ts               # خدمة تصدير واستيراد مستندات Word (.docx)
    ├── components/
    │   ├── CategoryFilter.tsx           # شريط البحث وتصفية التصنيفات
    │   ├── DayCell.tsx                  # مربع الاختيار التفاعلي ثلاثي الحالات
    │   ├── HabitDetailDrawer.tsx        # درج تفاصيل العادة، الخريطة الحرارية، والقوانين الأربعة
    │   ├── HabitGrid.tsx                # جدول التقويم الأسبوعي والمتدحرج
    │   ├── HabitModal.tsx               # نافذة تصميم وتعديل العادات الذرية
    │   ├── HabitRow.tsx                 # صف العادة اليومية، عداد السلسلة، وشارة الخطر
    │   ├── Header.tsx                   # الترويسة، أزرار المظهر، الصوت، واستيراد/تصدير Word
    │   ├── MetricsSummary.tsx           # بطاقات الإحصائيات (التركيز، السلسلة، القياسي، الالتزام)
    │   └── NeverMissTwiceBanner.tsx     # شريط إنقاذ العادات المعرضة للكسر
    ├── App.tsx                          # المكون الرئيسي وتنسيق الحالة
    ├── main.tsx                         # نقطة الدخول لتطبيق React 19
    └── index.css                        # متغيرات Tailwind v4 وهوية الألوان والخط
```

---

## 🗄️ مخطط قاعدة البيانات (Database Schema)

للمهندسين الراغبين في ربط التطبيق مع خادم خلفي (Backend) كـ **PostgreSQL** أو **Supabase** أو **Prisma**:

### Prisma Schema (`src/types/schema.prisma`):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum HabitCategory {
  DEEP_WORK
  CODE
  HEALTH
  FITNESS
  MIND
  READING
  FINANCE
}

enum HabitStatus {
  DONE
  MISSED
  NEUTRAL
}

model Habit {
  id                String         @id @default(uuid())
  userId            String
  name              String
  category          HabitCategory  @default(HEALTH)
  identity          String         // بيان الهوية ("لماذا؟")
  cue               String         // القانون 1: الإشارة
  routine           String         // القانون 2: الروتين
  twoMinuteRule     String         // القانون 3: قاعدة الدقيقتين
  reward            String         // القانون 4: المكافأة
  color             String         @default("#00A896")
  targetDaysPerWeek Int            @default(7)
  archived          Boolean        @default(false)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  logs              HabitLog[]

  @@index([userId, archived])
  @@index([category])
}

model HabitLog {
  id         String      @id @default(uuid())
  habitId    String
  habit      Habit       @relation(fields: [habitId], references: [id], onDelete: Cascade)
  date       String      // صيغة YYYY-MM-DD لسرعة الفهرسة
  status     HabitStatus @default(NEUTRAL)
  notes      String?     @db.Text
  loggedAt   DateTime    @default(now()) // توثيق زمني دقيق بالمللي ثانية
  updatedAt  DateTime    @updatedAt

  @@unique([habitId, date], name: "habit_day_unique")
  @@index([date])
  @@index([habitId, date, status])
}
```

---

## 🚀 التشغيل والتثبيت (Getting Started)

### المتطلبات المسبقة:
- تثبيت [Node.js](https://nodejs.org/) (الإصدار 18 أو أحدث).
- مدير الحزم `npm` أو `pnpm` أو `yarn`.

### 1. استنساخ المستودع (Clone):
```bash
git clone https://github.com/aeeayemen/Atomic-Habits.git
cd Atomic-Habits
```

### 2. تثبيت الحزم (Install Dependencies):
```bash
npm install
```

### 3. تشغيل خادم التطوير (Development Server):
```bash
npm run dev
```
افتح المتصفح وتوجه إلى: `http://localhost:5173/`

### 4. بناء المشروع للإنتاج (Production Build):
```bash
npm run build
npm run preview
```

---

## 🛠️ حزمة التقنيات المستخدمة (Tech Stack)

- **واجهة المستخدم:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **أداة البناء:** [Vite 8](https://vitejs.dev/)
- **التنسيق والأنماط:** [Tailwind CSS v4](https://tailwindcss.com/)
- **الأيقونات:** [Lucide React](https://lucide.dev/)
- **توليد وقراءة Word:** [docx](https://docx.js.org/) & [mammoth](https://github.com/mwilliamson/mammoth.js)
- **المفرقعات الاحتفالية:** [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **المؤثرات الصوتية:** Web Audio API Native Synthesizer

---

## 📄 الترخيص (License)

هذا المشروع مرخص تحت رخصة **MIT** — لك كامل الحرية في استخدامه وتعديله وتطويره لأغراضك الشخصية أو التجارية.

---

<div align="center">
  <b>«أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك.»</b><br/>
  صُنع بشغف لتعزيز الإنتاجية والانضباط اليومي المستمر 🚀
</div>
