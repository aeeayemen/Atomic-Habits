import { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type { Habit, HabitCategory, HabitLog, HabitStatus } from './types/habit';
import {
  loadStoredHabits,
  saveHabits,
  loadStoredLogs,
  saveLogs,
  loadTheme,
  saveTheme,
  loadSoundSetting,
  saveSoundSetting,
} from './lib/storage';
import { INITIAL_HABITS, generateInitialLogs } from './lib/initialData';
import { formatISODate, getWeekColumns, getRollingDays } from './lib/utils';
import { soundManager } from './lib/sound';
import { calculateStreakStats } from './lib/streak';

// المكونات التفاعلية
import { Header } from './components/Header';
import { MetricsSummary } from './components/MetricsSummary';
import { NeverMissTwiceBanner } from './components/NeverMissTwiceBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { HabitGrid } from './components/HabitGrid';
import { HabitModal } from './components/HabitModal';
import { HabitDetailDrawer } from './components/HabitDetailDrawer';

export function App() {
  // 1. حالة الإعدادات والمظهر
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = loadTheme();
    if (typeof document !== 'undefined') {
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return saved;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundSetting());

  // 2. حالة البيانات
  const [habits, setHabits] = useState<Habit[]>(() => loadStoredHabits());
  const [allLogs, setAllLogs] = useState<Record<string, HabitLog>>(() => loadStoredLogs());

  // 3. حالة التصفح والتنقل
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'rolling'>('week');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 4. حالة النوافذ المنبثقة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

  // مزامنة المظهر المظلم / الفاتح مع وثيقة HTML بشكل فوري وموثوق
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    saveTheme(theme);
  }, [theme]);

  // مزامنة إعدادات الصوت
  useEffect(() => {
    soundManager.enabled = soundEnabled;
    saveSoundSetting(soundEnabled);
  }, [soundEnabled]);

  // حفظ العادات
  const handleUpdateHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
    saveHabits(newHabits);
  };

  // حفظ السجلات
  const handleUpdateLogs = (newLogs: Record<string, HabitLog>) => {
    setAllLogs(newLogs);
    saveLogs(newLogs);
  };

  // احتساب أعمدة التواريخ
  const activeDays = useMemo(() => {
    if (viewMode === 'week') {
      return getWeekColumns(anchorDate);
    }
    return getRollingDays(14, anchorDate);
  }, [anchorDate, viewMode]);

  // تصفية العادات حسب التصنيف والبحث
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (h.archived) return false;
      if (selectedCategory !== 'all' && h.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.identity.toLowerCase().includes(q) ||
          h.cue.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [habits, selectedCategory, searchQuery]);

  // تبديل حالة السجل اليومي (استجابة فورية بدون أي تأخير)
  const handleToggleLog = (habitId: string, date: string, nextStatus: HabitStatus) => {
    const logId = `${habitId}_${date}`;
    const updatedLog: HabitLog = {
      id: logId,
      habitId,
      date,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    const nextLogs = {
      ...allLogs,
      [logId]: updatedLog,
    };

    handleUpdateLogs(nextLogs);

    // احتفال بالمفرقعات عند بلوغ أرقام قياسية في السلسلة
    if (nextStatus === 'done') {
      const stats = calculateStreakStats(habitId, nextLogs);
      if ([7, 14, 21, 30, 50, 100].includes(stats.currentStreak)) {
        soundManager.playCelebration();
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00A896', '#02C39A', '#F39C12', '#1C4D8D'],
        });
      }
    }
  };

  // إتمام جميع عادات اليوم دفعة واحدة
  const handleMarkAllTodayDone = () => {
    const todayStr = formatISODate(new Date());
    const nextLogs = { ...allLogs };

    habits.forEach((h) => {
      const logId = `${h.id}_${todayStr}`;
      nextLogs[logId] = {
        id: logId,
        habitId: h.id,
        date: todayStr,
        status: 'done',
        updatedAt: new Date().toISOString(),
      };
    });

    handleUpdateLogs(nextLogs);
    soundManager.playCelebration();

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#00A896', '#02C39A', '#F39C12', '#F8FAFC', '#1C4D8D'],
    });
  };

  // التنقل بين الفترات
  const handlePrevPeriod = () => {
    const next = new Date(anchorDate);
    next.setDate(anchorDate.getDate() - (viewMode === 'week' ? 7 : 14));
    setAnchorDate(next);
  };

  const handleNextPeriod = () => {
    const next = new Date(anchorDate);
    next.setDate(anchorDate.getDate() + (viewMode === 'week' ? 7 : 14));
    setAnchorDate(next);
  };

  const handleResetToToday = () => {
    setAnchorDate(new Date());
  };

  // إدارة العادات
  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (editingHabit) {
      const updated = habits.map((h) =>
        h.id === editingHabit.id ? ({ ...h, ...habitData } as Habit) : h
      );
      handleUpdateHabits(updated);
      setEditingHabit(null);
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        name: habitData.name || 'عادة جديدة',
        category: habitData.category || 'health',
        identity: habitData.identity || 'أنا شخص ملتزم ومستمر يومياً.',
        cue: habitData.cue || 'جدول يومي منتظم',
        routine: habitData.routine || habitData.name || '',
        twoMinuteRule: habitData.twoMinuteRule || 'ابدأ بخطوة دقيقتين',
        reward: habitData.reward || 'احتفل بالإنجاز اليومي',
        color: habitData.color || '#00A896',
        icon: 'Flame',
        frequency: habitData.frequency || 'daily',
        timeOfDay: 'anytime',
        targetDaysPerWeek: habitData.targetDaysPerWeek || 7,
        createdAt: new Date().toISOString(),
      };

      handleUpdateHabits([...habits, newHabit]);
      soundManager.playCelebration();
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    const remaining = habits.filter((h) => h.id !== habitId);
    handleUpdateHabits(remaining);
  };

  const handleResetData = () => {
    if (confirm('هل ترغب في إعادة ضبط البيانات إلى نموذج العادات الذرية القياسي؟ سيتم استبدال البيانات الحالية.')) {
      handleUpdateHabits(INITIAL_HABITS);
      const initialLogs = generateInitialLogs(INITIAL_HABITS);
      handleUpdateLogs(initialLogs);
      soundManager.playCelebration();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F2854] text-slate-900 dark:text-[#F8FAFC] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* الترويسة الرئيسية */}
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onOpenNewHabitModal={() => {
            setEditingHabit(null);
            setIsModalOpen(true);
          }}
          onResetData={handleResetData}
          onDataImported={() => {
            setHabits(loadStoredHabits());
            setAllLogs(loadStoredLogs());
          }}
        />

        {/* بطاقات الإحصائيات الفورية */}
        <MetricsSummary habits={habits} allLogs={allLogs} />

        {/* شريط تنبيه: إياك أن تفوت مرتين */}
        <NeverMissTwiceBanner
          habits={habits}
          allLogs={allLogs}
          onMarkHabitDoneToday={(habitId) => {
            const todayStr = formatISODate(new Date());
            handleToggleLog(habitId, todayStr, 'done');
          }}
        />

        {/* تصفيات التصنيف والبحث */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalHabitsCount={habits.length}
        />

        {/* الشبكة اليومية التفاعلية لتتبع العادات */}
        <HabitGrid
          habits={filteredHabits}
          days={activeDays}
          allLogs={allLogs}
          onToggleLog={handleToggleLog}
          onOpenDetail={(habit) => setDetailHabit(habit)}
          onEditHabit={(habit) => {
            setEditingHabit(habit);
            setIsModalOpen(true);
          }}
          onDeleteHabit={handleDeleteHabit}
          onAddNewHabit={() => {
            setEditingHabit(null);
            setIsModalOpen(true);
          }}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onPrevPeriod={handlePrevPeriod}
          onNextPeriod={handleNextPeriod}
          onResetToToday={handleResetToToday}
          onMarkAllTodayDone={handleMarkAllTodayDone}
        />

        {/* حكمة العادات الذرية في التذييل */}
        <footer className="pt-6 pb-4 border-t border-slate-200/60 dark:border-[#2A5C9E] text-center">
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] italic">
            "أنت لا ترتقي إلى مستوى أهدافك. أنت تهبط إلى مستوى أنظمتك."
            — جيمس كلير، <span className="font-bold text-slate-700 dark:text-[#F8FAFC]">كتاب العادات الذرية (Atomic Habits)</span>
          </p>
          <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]/80 mt-1">
            مبني بمعمارية Local-First فائقة السرعة استجابة 0 ثانية · توثيق زمني دقيق · تصدير واستيراد Word (.docx) · مؤثرات صوتية تفاعلية
          </p>
        </footer>
      </div>

      {/* نافذة إضافة أو تعديل العادة */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
      />

      {/* نافذة تفاصيل العادة العميقة */}
      <HabitDetailDrawer
        isOpen={Boolean(detailHabit)}
        habit={detailHabit}
        allLogs={allLogs}
        onClose={() => setDetailHabit(null)}
        onEdit={(habit) => {
          setEditingHabit(habit);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteHabit}
      />
    </div>
  );
}

export default App;
