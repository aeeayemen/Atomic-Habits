import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import confetti from 'canvas-confetti';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentMedical } from './lib/icons';
import type { Habit, HabitCategory, HabitLog, HabitStatus, HabitType } from './types/habit';
import {
  loadStoredHabits,
  saveHabits,
  loadStoredLogs,
  saveLogs,
  loadTheme,
  saveTheme,
  loadSoundSetting,
  saveSoundSetting,
  isGuestSessionActive,
  setGuestSessionActive,
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
  upsertLogToSupabase,
  seedInitialHabitsForUser,
} from './lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// المكونات التفاعلية الأساسية (Critical Path Components)
import { LoadingScreen } from './components/LoadingScreen';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { MetricsSummary } from './components/MetricsSummary';
import { NeverMissTwiceBanner } from './components/NeverMissTwiceBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { HabitGrid } from './components/HabitGrid';

// المكونات المفصولة برمجياً عند الطلب (Code-Split via React.lazy)
const HabitModal = lazy(() => import('./components/HabitModal').then((m) => ({ default: m.HabitModal })));
const HabitDetailDrawer = lazy(() => import('./components/HabitDetailDrawer').then((m) => ({ default: m.HabitDetailDrawer })));
const NotificationSettingsModal = lazy(() => import('./components/NotificationSettingsModal').then((m) => ({ default: m.NotificationSettingsModal })));
const OnboardingTour = lazy(() => import('./components/OnboardingTour').then((m) => ({ default: m.OnboardingTour })));
const SlipUpReflectionModal = lazy(() => import('./components/SlipUpReflectionModal').then((m) => ({ default: m.SlipUpReflectionModal })));
const BehavioralAnalyticsCard = lazy(() => import('./components/BehavioralAnalyticsCard').then((m) => ({ default: m.BehavioralAnalyticsCard })));
const WeeklyReflectionCard = lazy(() => import('./components/WeeklyReflectionCard').then((m) => ({ default: m.WeeklyReflectionCard })));
const BackupModal = lazy(() => import('./components/BackupModal').then((m) => ({ default: m.BackupModal })));
const AccountabilityModal = lazy(() => import('./components/AccountabilityModal').then((m) => ({ default: m.AccountabilityModal })));
const FeedbackModal = lazy(() => import('./components/FeedbackModal').then((m) => ({ default: m.FeedbackModal })));
import {
  executeOrQueueMutation,
  initializeOfflineQueueSync,
} from './lib/offlineQueue';
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
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => isGuestSessionActive());

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
  const [selectedType, setSelectedType] = useState<HabitType | 'all'>('all');
  const [archiveView, setArchiveView] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // 5. حالة النوافذ المنبثقة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isAccountabilityModalOpen, setIsAccountabilityModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isPushActive, setIsPushActive] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [reflectionModal, setReflectionModal] = useState<{
    isOpen: boolean;
    habit: Habit | null;
    date: string;
  }>({
    isOpen: false,
    habit: null,
    date: '',
  });

  // دالة تحميل وتنسيق بيانات المستخدم (مزامنة ثنائية ذكية لمنع فقدان البيانات بين المتصفحات)
  const loadUserData = useCallback(async (userId: string) => {
    const isGuest = !userId || userId === 'guest';
    const effectiveUserId = isGuest ? 'guest' : userId;

    // 1. تحميل سريع وفوري من التخزين المؤقت المحلي (0 ثانية تأخير)
    const cachedHabits = loadStoredHabits(effectiveUserId);
    const cachedLogs = loadStoredLogs(effectiveUserId);

    if (cachedHabits.length > 0) {
      setHabits(cachedHabits);
      setAllLogs(cachedLogs);
    }

    // إذا كان في وضع الزائر أو لم يتم ربط Supabase، نكتفي بالتخزين المحلي الآمن
    if (isGuest || !isSupabaseConfigured) {
      if (cachedHabits.length === 0) {
        setHabits(INITIAL_HABITS);
        saveHabits(INITIAL_HABITS, 'guest');
        const initLogs = generateInitialLogs(INITIAL_HABITS);
        setAllLogs(initLogs);
        saveLogs(initLogs, 'guest');
      }
      return;
    }

    // 2. مزامنة سحابية كاملة ثنائية الاتجاه مع Supabase (Two-Way Synchronization)
    try {
      const [cloudHabits, cloudLogs] = await Promise.all([
        fetchHabitsFromSupabase(effectiveUserId),
        fetchLogsFromSupabase(effectiveUserId),
      ]);

      // أ) مزامنة العادات:
      let activeHabits: Habit[] = [];
      if (cloudHabits && cloudHabits.length > 0) {
        // فحص إذا كان هناك عادات محلية أُضيفت أثناء انقطاع الاتصال ولم تُرفع إلى السحابة
        const cloudHabitIds = new Set(cloudHabits.map((h) => h.id));
        const missingHabits = cachedHabits.filter((h) => !cloudHabitIds.has(h.id));

        for (const localH of missingHabits) {
          await upsertHabitToSupabase(localH, effectiveUserId);
        }

        activeHabits = [...cloudHabits, ...missingHabits];
      } else if (cachedHabits && cachedHabits.length > 0) {
        // السحابة فارغة ولكن لدينا عادات محلية: نرفعها فوراً إلى Supabase حتى لا تضيع
        for (const localH of cachedHabits) {
          await upsertHabitToSupabase(localH, effectiveUserId);
        }
        activeHabits = cachedHabits;
      } else {
        // حساب جديد تماماً: نزرع العادات النموذجية
        const starter = await seedInitialHabitsForUser(effectiveUserId);
        activeHabits = starter;
      }

      setHabits(activeHabits);
      saveHabits(activeHabits, effectiveUserId);

      // ب) مزامنة سجلات الإنجاز (Done / Missed):
      // ندمج السجلات المحلية مع السجلات السحابية بذكاء دون مسح البيانات
      const mergedLogs: Record<string, HabitLog> = { ...cachedLogs };

      if (cloudLogs && Object.keys(cloudLogs).length > 0) {
        for (const [key, cloudLog] of Object.entries(cloudLogs)) {
          const localLog = mergedLogs[key];
          if (!localLog) {
            mergedLogs[key] = cloudLog;
          } else {
            // اعتماد السجل الأحدث بناءً على التاريخ والتحديث
            const cloudTime = cloudLog.updatedAt ? new Date(cloudLog.updatedAt).getTime() : 0;
            const localTime = localLog.updatedAt ? new Date(localLog.updatedAt).getTime() : 0;
            mergedLogs[key] = cloudTime >= localTime ? cloudLog : localLog;
          }
        }
      }

      // إذا كانت هناك عادات سحابية بمعرفات متطورة (مثل habit-1-<user_id>)، نضمن ربط السجلات القديمة بها
      activeHabits.forEach((habit) => {
        const baseMatch = habit.id.match(/^(habit-\d+)/);
        if (baseMatch && baseMatch[1] !== habit.id) {
          const basePrefix = `${baseMatch[1]}_`;
          Object.entries(mergedLogs).forEach(([k, log]) => {
            if (k.startsWith(basePrefix)) {
              const datePart = k.slice(basePrefix.length);
              const targetKey = `${habit.id}_${datePart}`;
              if (!mergedLogs[targetKey]) {
                mergedLogs[targetKey] = {
                  ...log,
                  id: targetKey,
                  habitId: habit.id,
                };
              }
            }
          });
        }
      });

      // إذا كانت هناك سجلات محلية لم تُرفع للسحابة بعد، نرفعها لضمان وصولها للمتصفحات الأخرى
      const cloudLogKeys = new Set(
        cloudLogs ? Object.keys(cloudLogs) : []
      );

      for (const log of Object.values(mergedLogs)) {
        const canonicalKey = `${log.habitId}_${log.date}`;
        if (!cloudLogKeys.has(log.id) && !cloudLogKeys.has(canonicalKey)) {
          executeOrQueueMutation(effectiveUserId, 'UPSERT_LOG', log);
        }
      }

      setAllLogs(mergedLogs);
      saveLogs(mergedLogs, effectiveUserId);
    } catch (err) {
      console.error('Error synchronizing user data from Supabase:', err);
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
          setIsGuestMode(false);
          setGuestSessionActive(false);
          await loadUserData(initialSession.user.id);
          setIsPushActive(isLocalNotificationEnabled());
        } else {
          setSession(null);
          setCurrentUser(null);
          if (isGuestSessionActive()) {
            setIsGuestMode(true);
            await loadUserData('guest');
          }
          setIsPushActive(isLocalNotificationEnabled());
        }
      } catch (err) {
        console.error('Error checking initial auth session:', err);
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
          setIsLoading(false);
        }
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
        setGuestSessionActive(false);
        await loadUserData(newUser.id);
        setIsPushActive(isLocalNotificationEnabled());
      } else {
        // تم تسجيل الخروج
        if (!isGuestSessionActive()) {
          setHabits([]);
          setAllLogs({});
        }
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
    const effectiveUserId = currentUser?.id || 'guest';
    setHabits(newHabits);
    saveHabits(newHabits, effectiveUserId);
  };

  // تهيئة طابور العمليات غير المتصلة والمزامنة التلقائية فور عودة الشبكة
  useEffect(() => {
    const cleanup = initializeOfflineQueueSync(() => currentUser?.id);
    return cleanup;
  }, [currentUser]);

  // حفظ السجلات محلياً وسحابياً للمستخدم الحالي
  const handleUpdateLogs = (newLogs: Record<string, HabitLog>) => {
    const effectiveUserId = currentUser?.id || 'guest';
    setAllLogs(newLogs);
    saveLogs(newLogs, effectiveUserId);
  };

  // معالجة تسجيل الخروج السلس
  const handleSignOut = async () => {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
      setGuestSessionActive(false);
      setIsGuestMode(false);
      await signOutUser();
      setSession(null);
      setCurrentUser(null);
      setHabits([]);
      setAllLogs({});
    }
  };

  // بدء وضع الزائر للتجربة السريعة المحلية
  const handleContinueAsGuest = () => {
    setIsGuestMode(true);
    setGuestSessionActive(true);
    loadUserData('guest');
  };

  // نجاح تسجيل الدخول من شاشة المصادقة
  const handleAuthSuccess = async (user: User, userSession: Session) => {
    setGuestSessionActive(false);
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

  // إحصائيات عدد العادات النشطة والمؤرشفة
  const activeHabitsCount = useMemo(
    () => habits.filter((h) => !h.archived && !h.is_archived).length,
    [habits]
  );
  const archivedHabitsCount = useMemo(
    () => habits.filter((h) => Boolean(h.archived || h.is_archived)).length,
    [habits]
  );

  // تصفية العادات حسب حالة الأرشفة والنوع والتصنيف والبحث
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      const isArchived = Boolean(h.archived || h.is_archived);
      if (archiveView === 'active' && isArchived) return false;
      if (archiveView === 'archived' && !isArchived) return false;

      if (selectedType !== 'all' && (h.type || 'build') !== selectedType) return false;
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
  }, [habits, selectedCategory, selectedType, searchQuery, archiveView]);

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

    const nextLogs: Record<string, HabitLog> = {
      ...allLogs,
      [logId]: updatedLog,
    };

    // دعم الربط مع المعرف النموذجي إذا كان المعرف يحتوي على لاحقة مستخدم
    const baseMatch = habitId.match(/^(habit-\d+)/);
    if (baseMatch && baseMatch[1] !== habitId) {
      nextLogs[`${baseMatch[1]}_${date}`] = {
        ...updatedLog,
        id: `${baseMatch[1]}_${date}`,
        habitId: baseMatch[1],
      };
    }

    handleUpdateLogs(nextLogs);

    // مزامنة سحابية مرنة مع طابور العمليات غير المتصلة التلقائي
    if (currentUser?.id) {
      executeOrQueueMutation(currentUser.id, 'UPSERT_LOG', updatedLog);
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

      const baseMatch = h.id.match(/^(habit-\d+)/);
      if (baseMatch && baseMatch[1] !== h.id) {
        nextLogs[`${baseMatch[1]}_${todayStr}`] = {
          ...logEntry,
          id: `${baseMatch[1]}_${todayStr}`,
          habitId: baseMatch[1],
        };
      }

      if (currentUser?.id) {
        executeOrQueueMutation(currentUser.id, 'UPSERT_LOG', logEntry);
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

      if (currentUser?.id) {
        executeOrQueueMutation(currentUser.id, 'UPSERT_HABIT', updatedHabit);
      }
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        userId: currentUser?.id,
        name: habitData.name || 'عادة جديدة',
        type: habitData.type || 'build',
        category: habitData.category || 'health',
        identity: habitData.identity || 'أنا شخص ملتزم ومستمر يومياً.',
        cue: habitData.cue || 'جدول يومي منتظم',
        routine: habitData.routine || habitData.name || '',
        twoMinuteRule: habitData.twoMinuteRule || 'ابدأ بخطوة دقيقتين',
        reward: habitData.reward || 'احتفل بالإنجاز اليومي',
        color: habitData.color || (habitData.type === 'break' ? '#F59E0B' : '#00A896'),
        icon: habitData.type === 'break' ? 'Shield' : 'Flame',
        frequency: habitData.frequency || 'daily',
        timeOfDay: 'anytime',
        targetDaysPerWeek: habitData.targetDaysPerWeek || 7,
        createdAt: new Date().toISOString(),
      };

      handleUpdateHabits([...habits, newHabit]);
      soundManager.playCelebration();

      if (currentUser?.id) {
        executeOrQueueMutation(currentUser.id, 'UPSERT_HABIT', newHabit);
      }
    }
  };

  // حفظ ملاحظات وتأملات الزلة السلوكية لعادات الإقلاع
  const handleSaveReflection = (notes: string) => {
    if (!reflectionModal.habit || !reflectionModal.date) return;
    const { habit, date } = reflectionModal;
    const logId = `${habit.id}_${date}`;

    const updatedLog: HabitLog = {
      id: logId,
      habitId: habit.id,
      userId: currentUser?.id,
      date,
      status: 'missed',
      notes,
      updatedAt: new Date().toISOString(),
    };

    const nextLogs = {
      ...allLogs,
      [logId]: updatedLog,
    };

    handleUpdateLogs(nextLogs);

    if (currentUser?.id) {
      executeOrQueueMutation(currentUser.id, 'UPSERT_LOG', updatedLog);
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    const remaining = habits.filter((h) => h.id !== habitId);
    handleUpdateHabits(remaining);

    if (currentUser?.id) {
      executeOrQueueMutation(currentUser.id, 'DELETE_HABIT', { habitId });
    }
  };

  // أرشفة عادة (إخفاء من القائمة اليومية مع الحفاظ على كامل السجلات والإحصائيات)
  const handleArchiveHabit = (habitId: string) => {
    const target = habits.find((h) => h.id === habitId);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedHabit: Habit = {
      ...target,
      archived: true,
      is_archived: true,
      archivedAt: now,
      archived_at: now,
    };

    const nextHabits = habits.map((h) => (h.id === habitId ? updatedHabit : h));
    handleUpdateHabits(nextHabits);

    if (currentUser?.id) {
      executeOrQueueMutation(currentUser.id, 'UPSERT_HABIT', updatedHabit);
    }
  };

  // استعادة عادة مؤرشفة وإعادتها للقائمة اليومية النشطة
  const handleRestoreHabit = (habitId: string) => {
    const target = habits.find((h) => h.id === habitId);
    if (!target) return;

    const updatedHabit: Habit = {
      ...target,
      archived: false,
      is_archived: false,
      archivedAt: undefined,
      archived_at: undefined,
    };

    const nextHabits = habits.map((h) => (h.id === habitId ? updatedHabit : h));
    handleUpdateHabits(nextHabits);
    soundManager.playSuccess();

    if (currentUser?.id) {
      executeOrQueueMutation(currentUser.id, 'UPSERT_HABIT', updatedHabit);
    }
  };

  // استعادة ومزامنة بيانات النسخة الاحتياطية (JSON / CSV / Word)
  const handleRestoreBackup = async (
    importedHabits: Habit[],
    importedLogs: HabitLog[],
    mode: 'merge' | 'replace'
  ) => {
    // 1. ربط كافة العادات والسجلات بهوية المستخدم الحالي
    const scopedHabits = importedHabits.map((h) => ({
      ...h,
      userId: currentUser?.id,
    }));

    const scopedLogs = importedLogs.map((l) => ({
      ...l,
      userId: currentUser?.id,
    }));

    let nextHabits: Habit[] = [];
    let nextLogs: Record<string, HabitLog> = {};

    if (mode === 'replace') {
      nextHabits = scopedHabits;
      for (const log of scopedLogs) {
        nextLogs[log.id] = log;
      }
    } else {
      // وضع الدمج الذكي (Merge)
      const habitMap = new Map<string, Habit>();
      for (const h of habits) {
        habitMap.set(h.id, h);
      }
      for (const h of scopedHabits) {
        habitMap.set(h.id, h);
      }
      nextHabits = Array.from(habitMap.values());

      nextLogs = { ...allLogs };
      for (const log of scopedLogs) {
        nextLogs[log.id] = log;
      }
    }

    // 2. تحديث الحالة المحلية والتخزين فورياً
    handleUpdateHabits(nextHabits);
    handleUpdateLogs(nextLogs);

    // 3. مزامنة سحابية مرنة مع طابور العمليات غير المتصلة
    if (currentUser?.id) {
      for (const h of scopedHabits) {
        executeOrQueueMutation(currentUser.id, 'UPSERT_HABIT', h);
      }
      for (const l of scopedLogs) {
        executeOrQueueMutation(currentUser.id, 'UPSERT_LOG', l);
      }
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
  if (isLoading && isAuthChecking) {
    return <LoadingScreen onLoaded={() => setIsLoading(false)} minDuration={0} />;
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
      <main id="main-content" role="main" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
            const effectiveUserId = currentUser?.id || 'guest';
            loadUserData(effectiveUserId);
          }}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenAuthModal={() => setIsGuestMode(false)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          isPushActive={isPushActive}
          onRestartTour={() => setIsTourOpen(true)}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onOpenAccountability={() => setIsAccountabilityModalOpen(true)}
          onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        />

        {/* بطاقات الإحصائيات الفورية */}
        <div data-tour="tour-metrics">
          <MetricsSummary
            habits={habits}
            allLogs={allLogs}
            onOpenAccountability={() => setIsAccountabilityModalOpen(true)}
          />
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

        {/* تحليل الأداء والمحفزات السلوكية */}
        <Suspense fallback={<div className="h-28 rounded-2xl bg-slate-100 dark:bg-[#1C4D8D]/20 animate-pulse" />}>
          <div data-tour="tour-analytics">
            <BehavioralAnalyticsCard habits={habits} allLogs={allLogs} />
          </div>
        </Suspense>

        {/* بطاقة التأمل الأسبوعي ومراجعة الزخم */}
        <Suspense fallback={<div className="h-28 rounded-2xl bg-slate-100 dark:bg-[#1C4D8D]/20 animate-pulse" />}>
          <WeeklyReflectionCard
            habits={habits}
            allLogs={allLogs}
            userId={currentUser?.id}
          />
        </Suspense>

        {/* تصفيات التصنيف والنوع والبحث ومفتاح الأرشيف */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalHabitsCount={habits.length}
          archiveView={archiveView}
          onToggleArchiveView={setArchiveView}
          activeCount={activeHabitsCount}
          archivedCount={archivedHabitsCount}
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
            onArchiveHabit={handleArchiveHabit}
            onRestoreHabit={handleRestoreHabit}
            isArchivedView={archiveView === 'archived'}
            onAddNewHabit={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
            onOpenReflection={(habit, date) => {
              setReflectionModal({
                isOpen: true,
                habit,
                date,
              });
            }}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            onPrevPeriod={handlePrevPeriod}
            onNextPeriod={handleNextPeriod}
            onResetToToday={handleResetToToday}
            onMarkAllTodayDone={handleMarkAllTodayDone}
          />
        </div>

        {/* حكمة العادات الذرية في التذييل مع زر ملاحظات التجربة */}
        <footer className="pt-6 pb-4 border-t border-slate-200/60 dark:border-[#2A5C9E] text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] italic">
            "أنت لا ترتقي إلى مستوى أهدافك. أنت تهبط إلى مستوى أنظمتك."
            — جيمس كلير، <span className="font-bold text-slate-700 dark:text-[#F8FAFC]">كتاب العادات الذرية (Atomic Habits)</span>
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(true)}
              aria-label="إرسال ملاحظة أو عائق في التجربة"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#065f8a]/40 dark:border-sky-500/50 bg-[#065f8a]/10 hover:bg-[#065f8a]/20 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-[#065f8a] dark:text-sky-400 text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-2xs"
              title="إرسال ملاحظة أو عائق في التجربة لمطوري التطبيق (Beta Feedback)"
            >
              <FontAwesomeIcon icon={faCommentMedical} className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <span>إرسال ملاحظة / تجربة (Beta Feedback)</span>
                <FontAwesomeIcon icon={faCommentMedical} className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]/80 mt-1">
            مبني بمعمارية Local-First فائقة السرعة استجابة 0 ثانية · مصادقة ومزامنة آمنة Supabase Auth · نظام متعدد المستخدمين RLS · تصدير واستيراد Word (.docx)
          </p>
        </footer>
      </main>

      {/* النوافذ العائمة المنفصلة كودياً (Lazy-Loaded Modals via Suspense) */}
      <Suspense fallback={null}>
        {isModalOpen && (
          <HabitModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingHabit(null);
            }}
            onSave={handleSaveHabit}
            initialHabit={editingHabit}
          />
        )}

        {Boolean(detailHabit) && (
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
            onArchive={handleArchiveHabit}
            onRestore={handleRestoreHabit}
          />
        )}

        {isNotificationModalOpen && (
          <NotificationSettingsModal
            isOpen={isNotificationModalOpen}
            onClose={() => {
              setIsNotificationModalOpen(false);
              setIsPushActive(isLocalNotificationEnabled());
            }}
            onStatusChange={(enabled) => setIsPushActive(enabled)}
          />
        )}

        {reflectionModal.habit && (
          <SlipUpReflectionModal
            isOpen={reflectionModal.isOpen}
            onClose={() => setReflectionModal((prev) => ({ ...prev, isOpen: false }))}
            habitName={reflectionModal.habit.name}
            date={reflectionModal.date}
            existingNotes={allLogs[`${reflectionModal.habit.id}_${reflectionModal.date}`]?.notes}
            onSave={handleSaveReflection}
            onCancelSlipUp={() => {
              if (reflectionModal.habit) {
                handleToggleLog(reflectionModal.habit.id, reflectionModal.date, 'neutral');
              }
            }}
          />
        )}

        {isAccountabilityModalOpen && (
          <AccountabilityModal
            isOpen={isAccountabilityModalOpen}
            onClose={() => setIsAccountabilityModalOpen(false)}
            habits={habits}
            allLogs={allLogs}
            currentUserId={currentUser?.id}
            userName={currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0]}
          />
        )}

        {isFeedbackModalOpen && (
          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            userId={currentUser?.id}
            userEmail={currentUser?.email}
          />
        )}

        {isBackupModalOpen && (
          <BackupModal
            isOpen={isBackupModalOpen}
            onClose={() => setIsBackupModalOpen(false)}
            habits={habits}
            allLogs={allLogs}
            currentUserId={currentUser?.id}
            onRestoreData={handleRestoreBackup}
          />
        )}

        {isTourOpen && (
          <OnboardingTour
            forceOpen={isTourOpen}
            onClose={() => setIsTourOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
