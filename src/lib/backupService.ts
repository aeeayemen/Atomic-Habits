import type { Habit, HabitLog } from '../types/habit';
import { formatISODate } from './utils';

export interface BackupMetadata {
  app: string;
  version: string;
  exportedAt: string;
  userId?: string;
  totalHabits: number;
  totalLogs: number;
}

export interface BackupData {
  metadata: BackupMetadata;
  habits: Habit[];
  habitLogs: HabitLog[];
}

export interface ParsedImportResult {
  success: boolean;
  habits: Habit[];
  habitLogs: HabitLog[];
  metadata?: Partial<BackupMetadata>;
  error?: string;
}

/**
 * 1. Generate JSON Backup File and trigger download
 */
export function exportBackupAsJSON(
  habits: Habit[],
  allLogs: Record<string, HabitLog>,
  userId?: string
): void {
  const activeHabits = habits.filter((h) => !h.archived);
  const habitIdSet = new Set(activeHabits.map((h) => h.id));
  const userLogs = Object.values(allLogs).filter((log) => habitIdSet.has(log.habitId));

  const backupData: BackupData = {
    metadata: {
      app: 'istomic',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userId: userId || 'local-guest',
      totalHabits: activeHabits.length,
      totalLogs: userLogs.length,
    },
    habits: activeHabits,
    habitLogs: userLogs,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const todayStr = formatISODate(new Date());
  downloadBlob(blob, `istomic-backup-${todayStr}.json`);
}

/**
 * 2. Generate UTF-8 BOM CSV Export and trigger download
 * UTF-8 BOM (\uFEFF) ensures Arabic characters render perfectly in Microsoft Excel and Google Sheets.
 */
export function exportBackupAsCSV(
  habits: Habit[],
  allLogs: Record<string, HabitLog>
): void {
  const activeHabits = habits.filter((h) => !h.archived);
  const habitIdSet = new Set(activeHabits.map((h) => h.id));
  const userLogs = Object.values(allLogs).filter((log) => habitIdSet.has(log.habitId));

  const headers = [
    'habit_id',
    'habit_name',
    'habit_type',
    'category',
    'identity',
    'cue',
    'routine',
    'two_minute_rule',
    'reward',
    'frequency',
    'created_at',
    'log_date',
    'status',
    'notes',
    'log_updated_at',
  ];

  const rows: string[] = [];
  rows.push(headers.join(','));

  // Map logs by habitId
  const logsByHabit = new Map<string, HabitLog[]>();
  for (const log of userLogs) {
    if (!logsByHabit.has(log.habitId)) {
      logsByHabit.set(log.habitId, []);
    }
    logsByHabit.get(log.habitId)!.push(log);
  }

  for (const habit of activeHabits) {
    const habitLogs = logsByHabit.get(habit.id) || [];

    if (habitLogs.length === 0) {
      // Single row for habit with empty log fields
      const row = [
        escapeCSV(habit.id),
        escapeCSV(habit.name),
        escapeCSV(habit.type || 'build'),
        escapeCSV(habit.category),
        escapeCSV(habit.identity),
        escapeCSV(habit.cue),
        escapeCSV(habit.routine),
        escapeCSV(habit.twoMinuteRule),
        escapeCSV(habit.reward),
        escapeCSV(habit.frequency),
        escapeCSV(habit.createdAt),
        '', // log_date
        '', // status
        '', // notes
        '', // log_updated_at
      ];
      rows.push(row.join(','));
    } else {
      for (const log of habitLogs) {
        const row = [
          escapeCSV(habit.id),
          escapeCSV(habit.name),
          escapeCSV(habit.type || 'build'),
          escapeCSV(habit.category),
          escapeCSV(habit.identity),
          escapeCSV(habit.cue),
          escapeCSV(habit.routine),
          escapeCSV(habit.twoMinuteRule),
          escapeCSV(habit.reward),
          escapeCSV(habit.frequency),
          escapeCSV(habit.createdAt),
          escapeCSV(log.date),
          escapeCSV(log.status),
          escapeCSV(log.notes || ''),
          escapeCSV(log.updatedAt || ''),
        ];
        rows.push(row.join(','));
      }
    }
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const todayStr = formatISODate(new Date());
  downloadBlob(blob, `istomic-habits-${todayStr}.csv`);
}

/**
 * 3. Parse and Validate JSON Backup file content
 */
export function parseJSONBackup(fileContent: string): ParsedImportResult {
  try {
    const parsed = JSON.parse(fileContent);

    // Support both wrapped format { habits: [...], habitLogs: [...] } and legacy { habits: [...], logs: [...] }
    let rawHabits: unknown[] = [];
    let rawLogs: unknown[] = [];
    let metadata: Partial<BackupMetadata> = {};

    if (Array.isArray(parsed)) {
      rawHabits = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      metadata = parsed.metadata || {};
      rawHabits = Array.isArray(parsed.habits) ? parsed.habits : [];
      rawLogs = Array.isArray(parsed.habitLogs)
        ? parsed.habitLogs
        : Array.isArray(parsed.logs)
        ? parsed.logs
        : [];
    }

    if (rawHabits.length === 0) {
      return {
        success: false,
        habits: [],
        habitLogs: [],
        error: 'الملف لا يحتوي على أي عادات صالحة للاستيراد (مصفوفة العادات فارغة).',
      };
    }

    const validatedHabits: Habit[] = [];
    for (const item of rawHabits) {
      if (typeof item === 'object' && item !== null) {
        const h = item as Partial<Habit>;
        if (h.name && typeof h.name === 'string') {
          validatedHabits.push({
            id: h.id || `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: h.name.trim(),
            type: h.type === 'break' ? 'break' : 'build',
            category: h.category || 'health',
            identity: h.identity || 'أنا شخص ملتزم ومستمر يومياً.',
            cue: h.cue || 'موعد يومي محدد',
            routine: h.routine || h.name,
            twoMinuteRule: h.twoMinuteRule || 'ابدأ بدقيقتين فقط',
            reward: h.reward || 'الاحتفال بالتقدم اليومي',
            color: h.color || (h.type === 'break' ? '#F59E0B' : '#00A896'),
            icon: h.icon || (h.type === 'break' ? 'Shield' : 'Flame'),
            frequency: h.frequency || 'daily',
            timeOfDay: h.timeOfDay || 'anytime',
            targetDaysPerWeek: h.targetDaysPerWeek || 7,
            createdAt: h.createdAt || new Date().toISOString(),
          });
        }
      }
    }

    const validHabitIds = new Set(validatedHabits.map((h) => h.id));
    const validatedLogs: HabitLog[] = [];

    for (const item of rawLogs) {
      if (typeof item === 'object' && item !== null) {
        const l = item as Partial<HabitLog>;
        if (l.habitId && l.date && validHabitIds.has(l.habitId)) {
          validatedLogs.push({
            id: l.id || `${l.habitId}_${l.date}`,
            habitId: l.habitId,
            date: l.date,
            status: l.status === 'done' || l.status === 'missed' ? l.status : 'neutral',
            notes: l.notes || '',
            updatedAt: l.updatedAt || new Date().toISOString(),
          });
        }
      }
    }

    return {
      success: true,
      habits: validatedHabits,
      habitLogs: validatedLogs,
      metadata: {
        app: metadata.app || 'istomic',
        version: metadata.version || '1.0.0',
        exportedAt: metadata.exportedAt || new Date().toISOString(),
        totalHabits: validatedHabits.length,
        totalLogs: validatedLogs.length,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ في معالجة ملف JSON';
    return {
      success: false,
      habits: [],
      habitLogs: [],
      error: `فشل قراءة ملف النسخة الاحتياطية (تنسيق JSON غير صالح): ${msg}`,
    };
  }
}

/**
 * 4. Parse and Validate CSV Backup file content
 */
export function parseCSVBackup(csvText: string): ParsedImportResult {
  try {
    // Strip BOM if present
    const cleanText = csvText.replace(/^\uFEFF/, '').trim();
    if (!cleanText) {
      return { success: false, habits: [], habitLogs: [], error: 'ملف CSV فارغ تماماً.' };
    }

    const lines = parseCSVRows(cleanText);
    if (lines.length < 2) {
      return { success: false, habits: [], habitLogs: [], error: 'الملف لا يحتوي على صفوف بيانات بعد الترويسة.' };
    }

    const headers = lines[0].map((h) => h.trim().toLowerCase());
    const habitMap = new Map<string, Habit>();
    const logsList: HabitLog[] = [];

    const habitIdIdx = headers.indexOf('habit_id');
    const nameIdx = headers.indexOf('habit_name');
    const typeIdx = headers.indexOf('habit_type');
    const catIdx = headers.indexOf('category');
    const identityIdx = headers.indexOf('identity');
    const cueIdx = headers.indexOf('cue');
    const routineIdx = headers.indexOf('routine');
    const twoMinIdx = headers.indexOf('two_minute_rule');
    const rewardIdx = headers.indexOf('reward');
    const freqIdx = headers.indexOf('frequency');
    const createdIdx = headers.indexOf('created_at');
    const logDateIdx = headers.indexOf('log_date');
    const statusIdx = headers.indexOf('status');
    const notesIdx = headers.indexOf('notes');
    const updatedIdx = headers.indexOf('log_updated_at');

    if (nameIdx === -1) {
      return {
        success: false,
        habits: [],
        habitLogs: [],
        error: 'الملف يفتقر إلى عمود اسم العادة الأساسي (habit_name).',
      };
    }

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || row.every((c) => !c.trim())) continue;

      const name = row[nameIdx]?.trim();
      if (!name) continue;

      const habitId = (habitIdIdx !== -1 && row[habitIdIdx]?.trim()) || `habit-${name.replace(/\s+/g, '-').slice(0, 16)}`;
      const type = (typeIdx !== -1 && row[typeIdx]?.trim() === 'break') ? 'break' : 'build';

      if (!habitMap.has(habitId)) {
        habitMap.set(habitId, {
          id: habitId,
          name,
          type,
          category: (catIdx !== -1 && row[catIdx]?.trim()) as Habit['category'] || 'health',
          identity: (identityIdx !== -1 && row[identityIdx]?.trim()) || 'أنا شخص ملتزم ومستمر يومياً.',
          cue: (cueIdx !== -1 && row[cueIdx]?.trim()) || 'موعد يومي محدد',
          routine: (routineIdx !== -1 && row[routineIdx]?.trim()) || name,
          twoMinuteRule: (twoMinIdx !== -1 && row[twoMinIdx]?.trim()) || 'ابدأ بدقيقتين فقط',
          reward: (rewardIdx !== -1 && row[rewardIdx]?.trim()) || 'الاحتفال بالتقدم',
          color: type === 'break' ? '#F59E0B' : '#00A896',
          icon: type === 'break' ? 'Shield' : 'Flame',
          frequency: (freqIdx !== -1 && (row[freqIdx]?.trim() as Habit['frequency'])) || 'daily',
          timeOfDay: 'anytime',
          targetDaysPerWeek: 7,
          createdAt: (createdIdx !== -1 && row[createdIdx]?.trim()) || new Date().toISOString(),
        });
      }

      // Check if this row contains a log entry
      if (logDateIdx !== -1 && row[logDateIdx]?.trim()) {
        const date = row[logDateIdx].trim();
        const rawStatus = statusIdx !== -1 ? row[statusIdx]?.trim() : 'neutral';
        const status = rawStatus === 'done' || rawStatus === 'missed' ? rawStatus : 'neutral';
        const notes = notesIdx !== -1 ? row[notesIdx]?.trim() : '';
        const updatedAt = (updatedIdx !== -1 && row[updatedIdx]?.trim()) || new Date().toISOString();

        logsList.push({
          id: `${habitId}_${date}`,
          habitId,
          date,
          status,
          notes,
          updatedAt,
        });
      }
    }

    const habits = Array.from(habitMap.values());
    if (habits.length === 0) {
      return { success: false, habits: [], habitLogs: [], error: 'لم يتم العثور على أي عادات في ملف CSV.' };
    }

    return {
      success: true,
      habits,
      habitLogs: logsList,
      metadata: {
        app: 'istomic',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        totalHabits: habits.length,
        totalLogs: logsList.length,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ في معالجة ملف CSV';
    return {
      success: false,
      habits: [],
      habitLogs: [],
      error: `فشل قراءة ملف CSV: ${msg}`,
    };
  }
}

// Helper: Escape CSV string according to RFC 4180
function escapeCSV(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper: Robust CSV line parser handling quotes, linebreaks and commas
function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal);
        currentVal = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentVal);
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
        i++; // skip \n
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentVal);
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }

  return rows;
}

// Helper: Download a Blob file client-side
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
