-- ==============================================================================
-- ATOMIC HABITS - SUPABASE SQL SCHEMA & TABLES
-- انسخ هذا الكود والصقه في SQL Editor في Supabase ثم اضغط Run
-- ==============================================================================

-- 1. إنشاء جدول العادات (Habits)
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'health',
  identity TEXT NOT NULL,
  cue TEXT NOT NULL,
  routine TEXT NOT NULL,
  two_minute_rule TEXT NOT NULL,
  reward TEXT NOT NULL,
  color VARCHAR(32) NOT NULL DEFAULT '#00A896',
  icon VARCHAR(64) NOT NULL DEFAULT 'Flame',
  frequency VARCHAR(32) NOT NULL DEFAULT 'daily',
  time_of_day VARCHAR(32) NOT NULL DEFAULT 'anytime',
  target_days_per_week INT NOT NULL DEFAULT 7,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. إنشاء جدول سجلات الإنجاز اليومية (Habit Logs)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- صيغة YYYY-MM-DD
  status VARCHAR(32) NOT NULL DEFAULT 'neutral', -- done, missed, neutral
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_habit_date UNIQUE (habit_id, date)
);

-- 3. إنشاء الفهارس لسرعة الاستعلام اللحظي
CREATE INDEX IF NOT EXISTS idx_habits_category ON public.habits(category);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_lookup ON public.habit_logs(habit_id, date, status);

-- 4. تفعيل سياسات الأمان والحماية (Row Level Security - RLS)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء سياسات الوصول العام للقراءة والإدخال والتعديل والحذف
DROP POLICY IF EXISTS "Allow public read access on habits" ON public.habits;
CREATE POLICY "Allow public read access on habits" ON public.habits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on habits" ON public.habits;
CREATE POLICY "Allow public insert access on habits" ON public.habits FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on habits" ON public.habits;
CREATE POLICY "Allow public update access on habits" ON public.habits FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access on habits" ON public.habits;
CREATE POLICY "Allow public delete access on habits" ON public.habits FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access on habit_logs" ON public.habit_logs;
CREATE POLICY "Allow public read access on habit_logs" ON public.habit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on habit_logs" ON public.habit_logs;
CREATE POLICY "Allow public insert access on habit_logs" ON public.habit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on habit_logs" ON public.habit_logs;
CREATE POLICY "Allow public update access on habit_logs" ON public.habit_logs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access on habit_logs" ON public.habit_logs;
CREATE POLICY "Allow public delete access on habit_logs" ON public.habit_logs FOR DELETE USING (true);

-- 6. إضافة العادات الذرية النموذجية الأولية
INSERT INTO public.habits (id, name, category, identity, cue, routine, two_minute_rule, reward, color)
VALUES
  (
    'habit-1',
    'جلسة عمل عميق (90 دقيقة)',
    'deep_work',
    'أنا مهندس برمجيات ذو أثر عالٍ وتفكير استراتيجي عميق.',
    'بعد شرب قهوة الصباح وإغلاق Slack والبريد تماماً.',
    'ارتداء سماعات عزل الضوضاء والتركيز على التحدي البرمجي الأساسي دون تشتت.',
    'فتح بيئة التطوير وكتابة السطر الأول فقط.',
    'استراحة شاي منعشة لمدة 10 دقائق وتسجيل تقدم السلسلة.',
    '#3b82f6'
  ),
  (
    'habit-2',
    'رفع كود يومي (Git Commit)',
    'code',
    'أنا مطوّر بنّاء يضيف قيمة برمجية تراكمية ومستمرة كل يوم.',
    'الساعة 11:30 صباحاً قبل التوجه لوجبة الغداء.',
    'إعادة تحسين الكود وكتابة اختبارات نظيفة، ثم عمل Commit واضح ورفعه إلى GitHub.',
    'مراجعة التغييرات (Git diff) وحفظ تعديل صغير واحد.',
    'رؤية المربع الأخضر يضيء في سجل مساهمات GitHub.',
    '#00A896'
  ),
  (
    'habit-3',
    'تمارين لياقة / كارديو (45 دقيقة)',
    'fitness',
    'أنا رياضي أتمتع بطاقة استثنائية وجسد صحي قوي ومقاوم للإجهاد.',
    'الساعة 5:30 مساءً بمجرد إغلاق حاسوب العمل.',
    '45 دقيقة من تمارين الكارديو، الجري، أو رفع الأثقال في الصالة الرياضية.',
    'ارتداء شورت التمرين وربط حذاء الرياضة فوراً.',
    'دش بارد منعش ومشروب بروتين وشعور عارم بالنشاط.',
    '#f97316'
  ),
  (
    'habit-4',
    'قراءة 15 صفحة من كتاب مفيد',
    'reading',
    'أنا طالب علم دائم التطوير ومراكمة النماذج الفكرية والمعرفية.',
    'بعد تناول وجبة العشاء ووضع الهاتف المحمول على الشاحن في غرفة أخرى.',
    'الجلوس في ركن القراءة الهادئ مع كتاب ورقي وقلم تمييز الفوائد.',
    'فتح الكتاب عند الفاصل وقراءة فقرة واحدة فقط.',
    'تدوين فكرة جوهرية واحدة في مفكرتي الذهبية.',
    '#ec4899'
  ),
  (
    'habit-5',
    'هدوء ذهني وتأمل وامتنان',
    'mind',
    'أنا شخص هادئ، واثق، ومتحكم بقراراته وسلوكه اليومي.',
    'فور النهوض من الفراش صباحاً قبل النظر في أي شاشة إلكترونية.',
    '10 دقائق من التنفس العميق المريح، وتدوين 3 نعم ومشاعر امتنان لليوم.',
    'إغماض العينين وأخذ 3 أنفاس عميقة واعية.',
    'سلام داخلي وذهن صافٍ مستعد لليوم الجديد.',
    '#8b5cf6'
  ),
  (
    'habit-6',
    'شرب 3 لترات ماء نقية',
    'health',
    'أنا أعتني بصحتي الخلوية ونشاطي الذهني وصفاء طاقتي اليومية.',
    'إبقاء قارورة ماء سعة 1 لتر ممتلئة أمامي على المكتب طوال الوقت.',
    'إنهاء الزجاجة الأولى قبل 11 ص، والثانية قبل 3 م، والثالثة قبل 7 م.',
    'شرب كأس ماء بارد الآن في هذه اللحظة.',
    'نشاط وحيوية متجددة وتجنب خمول بعد الظهر.',
    '#00A896'
  )
ON CONFLICT (id) DO NOTHING;
