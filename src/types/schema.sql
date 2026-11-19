-- ==============================================================================
-- ATOMIC HABITS - MULTI-TENANT SUPABASE SQL SCHEMA (ROW-LEVEL SECURITY)
-- قم بنسخ هذا الملف كاملاً ولصقه في Supabase SQL Editor ثم اضغط RUN
-- ==============================================================================

-- 1. تفعيل الامتدادات الضرورية
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. إنشاء جدول العادات (Habits) المرتبط بالمستخدم
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  type VARCHAR(32) NOT NULL DEFAULT 'build', -- 'build' (بناء عادة إيجابية) أو 'break' (الإقلاع عن عادة سلبية)
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

-- في حال كان الجدول موجوداً مسبقاً، نضمن وجود عمود user_id وعمود type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN type VARCHAR(32) NOT NULL DEFAULT 'build';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. إنشاء جدول سجلات الإنجاز اليومية (Habit Logs) المرتبط بالمستخدم والعادة
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  date TEXT NOT NULL, -- صيغة YYYY-MM-DD
  status VARCHAR(32) NOT NULL DEFAULT 'neutral', -- done, missed, neutral
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_habit_date_user UNIQUE (habit_id, date, user_id)
);

-- في حال كان الجدول موجوداً مسبقاً، نضمن وجود عمود user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'habit_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.habit_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

-- 4. إنشاء جدول اشتراكات إشعارات الويب (Web Push Subscriptions)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_endpoint UNIQUE (user_id, endpoint)
);

-- 5. إنشاء الفهارس لسرعة استعلام بيانات المستخدم
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_category ON public.habits(category);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_lookup ON public.habit_logs(habit_id, date, user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions(user_id);

-- 6. تفعيل حماية الصفوف (Row Level Security - RLS)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. حذف السياسات القديمة إن وجدت وتطبيق سياسات عزل المستخدمين الصارمة
DROP POLICY IF EXISTS "Allow public read access on habits" ON public.habits;
DROP POLICY IF EXISTS "Allow public insert access on habits" ON public.habits;
DROP POLICY IF EXISTS "Allow public update access on habits" ON public.habits;
DROP POLICY IF EXISTS "Allow public delete access on habits" ON public.habits;
DROP POLICY IF EXISTS "Allow public read access on habit_logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Allow public insert access on habit_logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Allow public update access on habit_logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Allow public delete access on habit_logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Users can only access their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can only access their own logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can manage their own logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;

-- سياسة جدول العادات: يسمح للمستخدم المسجل فقط بالوصول لعاداته
CREATE POLICY "Users can manage their own habits"
  ON public.habits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- سياسة جدول السجلات: يسمح للمستخدم المسجل فقط بالوصول لسجلاته
CREATE POLICY "Users can manage their own logs"
  ON public.habit_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- سياسة جدول الإشعارات: يسمح للمستخدم المسجل بإدارة اشتراكاته في الإشعارات
CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. مشغل تلقائي (Trigger): إدراج العادات الذرية النموذجية تلقائياً لأي مستخدم جديد فور تسجيل حسابه
CREATE OR REPLACE FUNCTION public.handle_new_user_starter_habits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.habits (id, user_id, name, category, identity, cue, routine, two_minute_rule, reward, color)
  VALUES
    (
      'habit-1-' || NEW.id,
      NEW.id,
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
      'habit-2-' || NEW.id,
      NEW.id,
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
      'habit-3-' || NEW.id,
      NEW.id,
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
      'habit-4-' || NEW.id,
      NEW.id,
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
      'habit-5-' || NEW.id,
      NEW.id,
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
      'habit-6-' || NEW.id,
      NEW.id,
      'شرب 3 لترات ماء نقية',
      'health',
      'أنا أعتني بصحتي الخلوية ونشاطي الذهني وصفاء طاقتي اليومية.',
      'إبقاء قارورة ماء سعة 1 لتر ممتلئة أمامي على المكتب طوال الوقت.',
      'إنهاء الزجاجة الأولى قبل 11 ص، والثانية قبل 3 م، والثالثة قبل 7 م.',
      'شرب كأس ماء بارد الآن في هذه اللحظة.',
      'نشاط وحيوية متجددة وتجنب خمول بعد الظهر.',
      '#00A896'
    )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ربط المشغل بجدول مستخدمي Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_starter_habits();

-- ==============================================================================
-- 9. جدول بطاقات المساءلة الإيجابية ومشاركة الإنجاز (Accountability Check-ins)
-- اختيارية للمستخدم، معزولة برمجياً بـ RLS ومصممة لدعم شريك المساءلة بلا ضغوط
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.accountability_checkins (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  date_str TEXT NOT NULL,
  active_streak INT NOT NULL DEFAULT 0,
  clean_streak INT NOT NULL DEFAULT 0,
  completion_rate INT NOT NULL DEFAULT 0,
  message TEXT,
  highlighted_habit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accountability_user_id ON public.accountability_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_created ON public.accountability_checkins(created_at DESC);

ALTER TABLE public.accountability_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own accountability checkins" ON public.accountability_checkins;
CREATE POLICY "Users can manage their own accountability checkins"
  ON public.accountability_checkins
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 10. جدول ملاحظات التجربة ورصد العوائق (Friend Beta Feedback & Friction Log)
-- يسمح لمختبري النسخة التجريبية بإرسال ملاحظاتهم وعوائق الاستخدام بسلاسة
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.feedback_notes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  category VARCHAR(32) NOT NULL DEFAULT 'ui', -- 'ui', 'flow', 'bug', 'idea'
  message TEXT NOT NULL,
  view_section VARCHAR(64) DEFAULT 'dashboard',
  is_online BOOLEAN DEFAULT TRUE,
  screen_resolution VARCHAR(32),
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback_notes(user_id);

ALTER TABLE public.feedback_notes ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين (المسجلين والزوار) بإرسال الملاحظات
DROP POLICY IF EXISTS "Allow users and testers to submit feedback" ON public.feedback_notes;
CREATE POLICY "Allow users and testers to submit feedback"
  ON public.feedback_notes
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- السماح للمستخدم المسجل بمشاهدة ملاحظاته السابقة
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_notes;
CREATE POLICY "Users can view their own feedback"
  ON public.feedback_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 11. جدول التأمل الأسبوعي (Weekly Reflections)
-- يحفظ نصوص وعهود التأمل الأسبوعي للمستخدم بأمان
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_reflections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  week_key VARCHAR(32) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_week UNIQUE (user_id, week_key)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user ON public.weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_week ON public.weekly_reflections(week_key);

ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own weekly reflections" ON public.weekly_reflections;
CREATE POLICY "Users can manage their own weekly reflections"
  ON public.weekly_reflections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);



