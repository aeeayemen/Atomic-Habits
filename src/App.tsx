import { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  isSupabaseConfigured,
  getAuthSession,
  onAuthChange,
  signOutUser,
  fetchHabitsFromSupabase,
  fetchLogsFromSupabase,
  upsertHabitToSupabase,
  deleteHabitFromSupabase,
  upsertLogToSupabase,
  seedInitialHabitsForUser,
} from './lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// المكونات التفاعلية
import { LoadingScreen } from './components/LoadingScreen';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { MetricsSummary } from './components/MetricsSummary';
import { NeverMissTwiceBanner } from './components/NeverMissTwiceBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { HabitGrid } from './components/HabitGrid';
import { HabitModal } from './components/HabitModal';
import { HabitDetailDrawer } from './components/HabitDetailDrawer';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { OnboardingTour } from './components/OnboardingTour';
import {
  isLocalNotificationEnabled,
  checkAndSendHabitReminder,
} from './lib/localNotificationService';

export function App() {
  // 1. حالة شاشة التحميل الترحيبية والمصادقة
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // 2. حالة الإعدادات والمظهر
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

  // 3. حالة البيانات (العادات والسجلات)
  const [habits, setHabits] = useState<Habit[]>([]);
  const [allLogs, setAllLogs] = useState<Record<string, HabitLog>>({});

  // 4. حالة التصفح والتنقل
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'rolling'>('week');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 5. حالة النوافذ المنبثقة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isPushActive, setIsPushActive] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // دالة تحميل وتنسيق بيانات المستخدم (من السحابة أو التخزين المؤقت المحلي)
  const loadUserData = useCallback(async (userId: string) => {
    // 1. تحميل سريع من الكاش المحلي للمستخدم أولاً
    const cachedHabits = loadStoredHabits(userId);
    const cachedLogs = loadStoredLogs(userId);

    if (cachedHabits.length > 0) {
      setHabits(cachedHabits);
      setAllLogs(cachedLogs);
    }

    // 2. مزامنة كاملة من Supabase
    if (isSupabaseConfigured) {
      try {
        const [cloudHabits, cloudLogs] = await Promise.all([
          fetchHabitsFromSupabase(userId),
          fetchLogsFromSupabase(userId),
        ]);

        if (cloudHabits && cloudHabits.length > 0) {
          setHabits(cloudHabits);
          saveHabits(cloudHabits, userId);
        } else if (!cachedHabits || cachedHabits.length === 0) {
          // حساب جديد بدون عادات: نزرع له العادات النموذجية
          const starter = await seedInitialHabitsForUser(userId);
          setHabits(starter);
          saveHabits(starter, userId);
        }

        if (cloudLogs) {
          setAllLogs(cloudLogs);
          saveLogs(cloudLogs, userId);
        }
      } catch (err) {
        console.error('Error synchronizing user data from Supabase:', err);
      }
    } else {
      if (cachedHabits.length === 0) {
        setHabits(INITIAL_HABITS);
        saveHabits(INITIAL_HABITS, userId);
        const initLogs = generateInitialLogs(INITIAL_HABITS);
        setAllLogs(initLogs);
        saveLogs(initLogs, userId);
      }
    }
  }, []);

  // الاستماع لحالة المصادقة ومزامنة الجلسة العالمية
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const initialSession = await getAuthSession();
        if (!isMounted) return;

        if (initialSession && initialSession.user) {
          setSession(initialSession);
          setCurrentUser(initialSession.user);
          await loadUserData(initialSession.user.id);
          setIsPushActive(isLocalNotificationEnabled());
        } else {
          setSession(null);
          setCurrentUser(null);
          setIsPushActive(isLocalNotificationEnabled());
        }
      } catch (err) {
        console.error('Error checking initial auth session:', err);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    }

    initAuth();

    // الاشتراك في مستمع تغيرات المصادقة (دخول، خروج، انتهاء التوكن)
    const { unsubscribe } = onAuthChange(async (newSession, newUser) => {
      if (!isMounted) return;
      setSession(newSession);
      setCurrentUser(newUser);

      if (newUser) {
        setIsGuestMode(false);
        await loadUserData(newUser.id);
        setIsPushActive(isLocalNotificationEnabled());
      } else {
        // تم تسجيل الخروج
        setHabits([]);
        setAllLogs({});
        setIsPushActive(isLocalNotificationEnabled());
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadUserData]);

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

  // فحص وإطلاق تذكيرات العادات المحلية في المتصفح دورياً أثناء فتح التطبيق
  useEffect(() => {
    setIsPushActive(isLocalNotificationEnabled());

    // فحص أولي بعد 2 ثانية من فتح التطبيق
    const initialTimer = setTimeout(() => {
      checkAndSendHabitReminder(habits, allLogs);
    }, 2000);

    // فحص دوري كل دقيقة واحدة في الخلفية داخل المتصفح
    const intervalTimer = setInterval(() => {
      checkAndSendHabitReminder(habits, allLogs);
    }, 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [habits, allLogs]);

  // حفظ العادات محلياً وسحابياً للمستخدم الحالي
  const handleUpdateHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
    saveHabits(newHabits, currentUser?.id);
  };

  // حفظ السجلات محلياً وسحابياً للمستخدم الحالي
  const handleUpdateLogs = (newLogs: Record<string, HabitLog>) => {
    setAllLogs(newLogs);
    saveLogs(newLogs, currentUser?.id);
  };

  // معالجة تسجيل الخروج السلس
  const handleSignOut = async () => {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
      await signOutUser();
      setSession(null);
      setCurrentUser(null);
      setIsGuestMode(false);
      setHabits([]);
      setAllLogs({});
    }
  };

  // بدء وضع الزائر للتجربة السريعة المحلية
  const handleContinueAsGuest = () => {
    setIsGuestMode(true);
    const guestHabits = loadStoredHabits('guest');
    if (guestHabits.length > 0) {
      setHabits(guestHabits);
      setAllLogs(loadStoredLogs('guest'));
    } else {
      setHabits(INITIAL_HABITS);
      saveHabits(INITIAL_HABITS, 'guest');
      const initLogs = generateInitialLogs(INITIAL_HABITS);
      setAllLogs(initLogs);
      saveLogs(initLogs, 'guest');
    }
  };

  // نجاح تسجيل الدخول من شاشة المصادقة
  const handleAuthSuccess = async (user: User, userSession: Session) => {
    setCurrentUser(user);
    setSession(userSession);
    setIsGuestMode(false);
    await loadUserData(user.id);
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

  // تبديل حالة السجل اليومي (استجابة فورية 0 ثانية + مزامنة سحابية خاصة بالمستخدم)
  const handleToggleLog = (habitId: string, date: string, nextStatus: HabitStatus) => {
    const logId = `${habitId}_${date}`;
    const updatedLog: HabitLog = {
      id: logId,
      habitId,
      userId: currentUser?.id,
      date,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    const nextLogs = {
      ...allLogs,
      [logId]: updatedLog,
    };

    handleUpdateLogs(nextLogs);

    // مزامنة سحابية خلفية معزولة للمستخدم
    if (isSupabaseConfigured && currentUser) {
      upsertLogToSupabase(updatedLog, currentUser.id).catch(() => {});
    }

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
      const logEntry: HabitLog = {
        id: logId,
        habitId: h.id,
        userId: currentUser?.id,
        date: todayStr,
        status: 'done',
        updatedAt: new Date().toISOString(),
      };
      nextLogs[logId] = logEntry;

      if (isSupabaseConfigured && currentUser) {
        upsertLogToSupabase(logEntry, currentUser.id).catch(() => {});
      }
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

  // حفظ العادة (إضافة جديدة أو تعديل)
  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (editingHabit) {
      const updatedHabit = {
        ...editingHabit,
        ...habitData,
        userId: currentUser?.id,
      } as Habit;
      const updated = habits.map((h) =>
        h.id === editingHabit.id ? updatedHabit : h
      );
      handleUpdateHabits(updated);
      setEditingHabit(null);

      if (isSupabaseConfigured && currentUser) {
        upsertHabitToSupabase(updatedHabit, currentUser.id).catch(() => {});
      }
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        userId: currentUser?.id,
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

      if (isSupabaseConfigured && currentUser) {
        upsertHabitToSupabase(newHabit, currentUser.id).catch(() => {});
      }
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    const remaining = habits.filter((h) => h.id !== habitId);
    handleUpdateHabits(remaining);

    if (isSupabaseConfigured && currentUser) {
      deleteHabitFromSupabase(habitId, currentUser.id).catch(() => {});
    }
  };

  const handleResetData = () => {
    if (confirm('هل ترغب في إعادة ضبط البيانات إلى نموذج العادات الذرية القياسي؟ سيتم استبدال البيانات الحالية.')) {
      handleUpdateHabits(INITIAL_HABITS);
      const initialLogs = generateInitialLogs(INITIAL_HABITS);
      handleUpdateLogs(initialLogs);
      soundManager.playCelebration();

      if (isSupabaseConfigured && currentUser) {
        INITIAL_HABITS.forEach((h) => upsertHabitToSupabase(h, currentUser.id).catch(() => {}));
        Object.values(initialLogs).forEach((l) => upsertLogToSupabase(l, currentUser.id).catch(() => {}));
      }
    }
  };

  // التحقق المبدئي من الجلسة أو انتهاء شاشة الترحيب
  if (isLoading) {
    return <LoadingScreen onLoaded={() => setIsLoading(false)} minDuration={850} />;
  }

  // إذا لم يكن المستخدم مسجلاً ولم يختر وضع الزائر، نعرض صفحة تسجيل الدخول / إنشاء الحساب
  if (!currentUser && !isGuestMode && !isAuthChecking) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F2854] text-slate-900 dark:text-[#F8FAFC] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* الترويسة الرئيسية مع بيانات المستخدم وأزرار التحكم */}
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
            if (currentUser) {
              loadUserData(currentUser.id);
            } else {
              setHabits(loadStoredHabits('guest'));
              setAllLogs(loadStoredLogs('guest'));
            }
          }}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenAuthModal={() => setIsGuestMode(false)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          isPushActive={isPushActive}
          onRestartTour={() => setIsTourOpen(true)}
        />

        {/* بطاقات الإحصائيات الفورية */}
        <div data-tour="tour-metrics">
          <MetricsSummary habits={habits} allLogs={allLogs} />
        </div>

        {/* شريط تنبيه: إياك أن تفوت مرتين */}
        <div data-tour="tour-banner">
          <NeverMissTwiceBanner
            habits={habits}
            allLogs={allLogs}
            onMarkHabitDoneToday={(habitId) => {
              const todayStr = formatISODate(new Date());
              handleToggleLog(habitId, todayStr, 'done');
            }}
          />
        </div>

        {/* تصفيات التصنيف والبحث */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalHabitsCount={habits.length}
        />

        {/* الشبكة اليومية التفاعلية لتتبع العادات */}
        <div data-tour="tour-grid">
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
        </div>

        {/* حكمة العادات الذرية في التذييل */}
        <footer className="pt-6 pb-4 border-t border-slate-200/60 dark:border-[#2A5C9E] text-center">
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] italic">
            "أنت لا ترتقي إلى مستوى أهدافك. أنت تهبط إلى مستوى أنظمتك."
            — جيمس كلير، <span className="font-bold text-slate-700 dark:text-[#F8FAFC]">كتاب العادات الذرية (Atomic Habits)</span>
          </p>
          <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]/80 mt-1">
            مبني بمعمارية Local-First فائقة السرعة استجابة 0 ثانية · مصادقة ومزامنة آمنة Supabase Auth · نظام متعدد المستخدمين RLS · تصدير واستيراد Word (.docx)
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

      {/* نافذة إعدادات وتفعيل تنبيهات المتصفح المحلية */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => {
          setIsNotificationModalOpen(false);
          setIsPushActive(isLocalNotificationEnabled());
        }}
        onStatusChange={(enabled) => setIsPushActive(enabled)}
      />

      {/* الجولة الإرشادية التفاعلية مع شخصية شرارة */}
      <OnboardingTour
        forceOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}

export default App;
