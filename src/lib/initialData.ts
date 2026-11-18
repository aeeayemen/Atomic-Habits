import type { Habit, HabitLog } from '../types/habit';
import { formatISODate } from './utils';

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'جلسة عمل عميق (90 دقيقة)',
    category: 'deep_work',
    identity: 'أنا مهندس برمجيات ذو أثر عالٍ وتفكير استراتيجي عميق.',
    cue: 'بعد شرب قهوة الصباح وإغلاق Slack والبريد تماماً.',
    routine: 'ارتداء سماعات عزل الضوضاء والتركيز على التحدي البرمجي الأساسي دون تشتت أو فتح تبويبات إضافية.',
    twoMinuteRule: 'فتح بيئة التطوير وكتابة السطر الأول أو تعليق تخطيط الوظيفة.',
    reward: 'استراحة شاي منعشة لمدة 10 دقائق وتسجيل تقدم السلسلة.',
    color: '#3b82f6',
    icon: 'Brain',
    frequency: 'daily',
    timeOfDay: 'morning',
    targetDaysPerWeek: 7,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'habit-2',
    name: 'رفع كود يومي (Git Commit)',
    category: 'code',
    identity: 'أنا مطوّر بنّاء يضيف قيمة برمجية تراكمية ومستمرة كل يوم.',
    cue: 'الساعة 11:30 صباحاً قبل التوجه لوجبة الغداء.',
    routine: 'إعادة تحسين الكود وكتابة اختبارات نظيفة، ثم عمل Commit واضح ورفعه إلى GitHub.',
    twoMinuteRule: 'مراجعة التغييرات (Git diff) وحفظ تعديل صغير واحد.',
    reward: 'رؤية المربع الأخضر يضيء في سجل مساهمات GitHub.',
    color: '#06b6d4',
    icon: 'Code2',
    frequency: 'daily',
    timeOfDay: 'afternoon',
    targetDaysPerWeek: 7,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'habit-3',
    name: 'تمارين لياقة / كارديو (45 دقيقة)',
    category: 'fitness',
    identity: 'أنا رياضي أتمتع بطاقة استثنائية وجسد صحي قوي ومقاوم للإجهاد.',
    cue: 'الساعة 5:30 مساءً بمجرد إغلاق حاسوب العمل.',
    routine: '45 دقيقة من تمارين الكارديو، الجري، أو رفع الأثقال في الصالة الرياضية.',
    twoMinuteRule: 'ارتداء شورت التمرين وربط حذاء الرياضة فوراً.',
    reward: 'دش بارد منعش ومشروب بروتين وشعور عارم بالنشاط.',
    color: '#f97316',
    icon: 'Dumbbell',
    frequency: 'daily',
    timeOfDay: 'evening',
    targetDaysPerWeek: 6,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'habit-4',
    name: 'قراءة 15 صفحة من كتاب مفيد',
    category: 'reading',
    identity: 'أنا طالب علم دائم التطوير ومراكمة النماذج الفكرية والمعرفية.',
    cue: 'بعد تناول وجبة العشاء ووضع الهاتف المحمول على الشاحن في غرفة أخرى.',
    routine: 'الجلوس في ركن القراءة الهادئ مع كتاب ورقي وقلم تمييز الفوائد.',
    twoMinuteRule: 'فتح الكتاب عند الفاصل وقراءة فقرة واحدة فقط.',
    reward: 'تدوين فكرة جوهرية واحدة في مفكرتي الذهبية.',
    color: '#ec4899',
    icon: 'BookOpen',
    frequency: 'daily',
    timeOfDay: 'evening',
    targetDaysPerWeek: 7,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'habit-5',
    name: 'هدوء ذهني وتأمل وامتنان',
    category: 'mind',
    identity: 'أنا شخص هادئ، واثق، ومتحكم بقراراته وسلوكه اليومي.',
    cue: 'فور النهوض من الفراش صباحاً قبل النظر في أي شاشة إلكترونية.',
    routine: '10 دقائق من التنفس العميق المريح، وتدوين 3 نعم ومشاعر امتنان لليوم.',
    twoMinuteRule: 'إغماض العينين وأخذ 3 أنفاس عميقة واعية.',
    reward: 'سلام داخلي وذهن صافٍ مستعد لليوم الجديد.',
    color: '#8b5cf6',
    icon: 'Sparkles',
    frequency: 'daily',
    timeOfDay: 'morning',
    targetDaysPerWeek: 7,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'habit-6',
    name: 'شرب 3 لترات ماء نقية',
    category: 'health',
    identity: 'أنا أعتني بصحتي الخلوية ونشاطي الذهني وصفاء طاقتي اليومية.',
    cue: 'إبقاء قارورة ماء سعة 1 لتر ممتلئة أمامي على المكتب طوال الوقت.',
    routine: 'إنهاء الزجاجة الأولى قبل 11 ص، والثانية قبل 3 م، والثالثة قبل 7 م.',
    twoMinuteRule: 'شرب كأس ماء بارد الآن في هذه اللحظة.',
    reward: 'نشاط وحيوية متجددة وتجنب خمول بعد الظهر.',
    color: '#10b981',
    icon: 'HeartPulse',
    frequency: 'daily',
    timeOfDay: 'anytime',
    targetDaysPerWeek: 7,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

/**
 * توليد سجلات تجريبية للأيام السابقة
 */
export function generateInitialLogs(habits: Habit[] = INITIAL_HABITS): Record<string, HabitLog> {
  const logs: Record<string, HabitLog> = {};
  const today = new Date();

  habits.forEach((habit, habitIdx) => {
    for (let i = 10; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatISODate(d);
      const logId = `${habit.id}_${dateStr}`;

      let status: 'done' | 'missed' | 'neutral' = 'done';

      if (i === 0) {
        // اليوم: بعضها منجز وبعضها محايد
        status = habitIdx % 2 === 0 ? 'done' : 'neutral';
      } else if (i === 1) {
        // أمس: إظهار عادة مفوّتة لتفعيل جرس "إياك أن تفوّت مرتين"
        status = habitIdx === 2 ? 'missed' : 'done';
      } else if (i === 4 && habitIdx === 1) {
        status = 'missed';
      } else if (i === 6 && habitIdx === 3) {
        status = 'missed';
      }

      logs[logId] = {
        id: logId,
        habitId: habit.id,
        date: dateStr,
        status,
        updatedAt: new Date(d.getTime() + 14 * 3600 * 1000).toISOString(),
      };
    }
  });

  return logs;
}
