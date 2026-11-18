import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import mammoth from 'mammoth';
import type { Habit, HabitLog } from '../types/habit';
import { loadStoredHabits, loadStoredLogs, saveHabits, saveLogs } from './storage';
import { calculateStreakStats } from './streak';
import { CATEGORIES_META } from './utils';

const SYNC_DELIMITER_START = '=== ATOMIC_HABITS_BACKUP_START ===';
const SYNC_DELIMITER_END = '=== ATOMIC_HABITS_BACKUP_END ===';

/**
 * إنشاء وتصدير مستند Word (.docx) شامل يحتوي على التقرير الكامل وسجلات العادات
 */
export async function exportDataAsWordDocx(): Promise<void> {
  const habits = loadStoredHabits();
  const logs = loadStoredLogs();
  const exportDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // تجهيز جدول ملخص العادات
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createStyledCell('اسم العادة', true, '14b8a6', 'ffffff'),
        createStyledCell('التصنيف', true, '14b8a6', 'ffffff'),
        createStyledCell('بيان الهوية ("لماذا؟")', true, '14b8a6', 'ffffff'),
        createStyledCell('السلسلة الحالية', true, '14b8a6', 'ffffff'),
        createStyledCell('الرقم القياسي', true, '14b8a6', 'ffffff'),
        createStyledCell('نسبة الالتزام', true, '14b8a6', 'ffffff'),
      ],
    }),
  ];

  habits.forEach((habit) => {
    const stats = calculateStreakStats(habit.id, logs);
    const categoryLabel = CATEGORIES_META[habit.category]?.label || habit.category;

    tableRows.push(
      new TableRow({
        children: [
          createStyledCell(habit.name, true),
          createStyledCell(categoryLabel),
          createStyledCell(`"${habit.identity}"`),
          createStyledCell(`${stats.currentStreak} يوم`),
          createStyledCell(`${stats.longestStreak} يوم`),
          createStyledCell(`${stats.completionRate}%`),
        ],
      })
    );
  });

  // فقرات القوانين الأربعة لكل عادة
  const habitDetailsParagraphs: Paragraph[] = [];
  habits.forEach((habit, idx) => {
    habitDetailsParagraphs.push(
      new Paragraph({
        text: `${idx + 1}. عادة: ${habit.name}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• الهوية الذاتية: ', bold: true }),
          new TextRun({ text: habit.identity, italics: true }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• القانون الأول (اجعلها واضحة - الإشارة): ', bold: true, color: '2563eb' }),
          new TextRun({ text: habit.cue || 'غير محدد' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• القانون الثاني (اجعلها جذابة - الروتين): ', bold: true, color: '9333ea' }),
          new TextRun({ text: habit.routine || 'غير محدد' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• القانون الثالث (اجعلها سهلة - قاعدة الدقيقتين): ', bold: true, color: 'd97706' }),
          new TextRun({ text: habit.twoMinuteRule || 'غير محدد' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• القانون الرابع (اجعلها مشبعة - المكافأة الفورية): ', bold: true, color: '16a34a' }),
          new TextRun({ text: habit.reward || 'غير محدد' }),
        ],
        spacing: { after: 180 },
      })
    );
  });

  // ترميز البيانات بشكل مدمج داخل المستند لتمكين استيرادها لاحقاً بدقة تامة
  const backupPayload = JSON.stringify({
    version: '2.0-docx',
    exportedAt: new Date().toISOString(),
    habits,
    logs,
  });

  const base64Data = btoa(unescape(encodeURIComponent(backupPayload)));

  // بناء المستند
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'تقرير وتوثيق العادات الذرية (Atomic Habits Report)',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `تاريخ إعداد التقرير: ${exportDate}`, italics: true }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '«أنت لا ترتقي إلى مستوى أهدافك. أنت تهبط إلى مستوى أنظمتك.» — جيمس كلير',
                italics: true,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),
          new Paragraph({
            text: 'جدول العادات ومعدلات الإنجاز والسلاسل الحالية:',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({
            text: 'المخطط الهندسي للعادات (وفق القوانين الأربعة لتغيير السلوك):',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
          }),
          ...habitDetailsParagraphs,
          new Paragraph({
            text: 'بيانات المزامنة والاسترداد التلقائي (Sync Metadata):',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${SYNC_DELIMITER_START}\n${base64Data}\n${SYNC_DELIMITER_END}`,
                size: 14,
                color: '64748b',
              }),
            ],
          }),
        ],
      },
    ],
  });

  // توليد ملف docx وتحميله
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير-العادات-الذرية-${new Date().toISOString().slice(0, 10)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * استيراد وقراءة مستند Word (.docx) واسترجاع العادات وسجلاتها
 */
export async function importDataFromWordDocx(file: File): Promise<{
  success: boolean;
  habits?: Habit[];
  logs?: Record<string, HabitLog>;
  error?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const fullText = result.value;

    // 1. البحث عن كود المزامنة المشفر داخل مستند الـ Word
    if (fullText.includes(SYNC_DELIMITER_START) && fullText.includes(SYNC_DELIMITER_END)) {
      const startIndex = fullText.indexOf(SYNC_DELIMITER_START) + SYNC_DELIMITER_START.length;
      const endIndex = fullText.indexOf(SYNC_DELIMITER_END);
      const rawBase64 = fullText.substring(startIndex, endIndex).trim();

      const decodedJson = decodeURIComponent(escape(atob(rawBase64)));
      const parsed = JSON.parse(decodedJson);

      if (parsed && Array.isArray(parsed.habits)) {
        saveHabits(parsed.habits);
        saveLogs(parsed.logs || {});
        return {
          success: true,
          habits: parsed.habits,
          logs: parsed.logs || {},
        };
      }
    }

    // 2. إذا كان ملف Word عادي يحتوي على نصوص وقوائم، نستخلص العادات من سطور النص
    const lines = fullText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const extractedHabits: Habit[] = [];
    let currentHabit: Partial<Habit> | null = null;

    for (const line of lines) {
      if (line.includes('عادة:') || line.match(/^\d+[\.\-]/)) {
        if (currentHabit && currentHabit.name) {
          extractedHabits.push(createDefaultHabit(currentHabit));
        }
        const namePart = line.replace(/^\d+[\.\-]/, '').replace(/عادة:/, '').trim();
        currentHabit = { name: namePart };
      } else if (currentHabit) {
        if (line.includes('الهوية')) {
          currentHabit.identity = line.split(':')[1]?.trim() || line;
        } else if (line.includes('الإشارة') || line.includes('القانون الأول')) {
          currentHabit.cue = line.split(':')[1]?.trim() || line;
        } else if (line.includes('الروتين') || line.includes('القانون الثاني')) {
          currentHabit.routine = line.split(':')[1]?.trim() || line;
        } else if (line.includes('الدقيقتين') || line.includes('القانون الثالث')) {
          currentHabit.twoMinuteRule = line.split(':')[1]?.trim() || line;
        } else if (line.includes('المكافأة') || line.includes('القانون الرابع')) {
          currentHabit.reward = line.split(':')[1]?.trim() || line;
        }
      }
    }

    if (currentHabit && currentHabit.name) {
      extractedHabits.push(createDefaultHabit(currentHabit));
    }

    if (extractedHabits.length > 0) {
      const existingHabits = loadStoredHabits();
      const merged = [...existingHabits, ...extractedHabits];
      saveHabits(merged);
      return {
        success: true,
        habits: merged,
        logs: loadStoredLogs(),
      };
    }

    return {
      success: false,
      error: 'لم يتم العثور على بيانات عادات مطابقة في مستند Word المرفوع.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطأ أثناء قراءة ملف Word';
    return { success: false, error: message };
  }
}

function createDefaultHabit(partial: Partial<Habit>): Habit {
  return {
    id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: partial.name || 'عادة مستوردة من مستند Word',
    category: partial.category || 'deep_work',
    identity: partial.identity || 'أنا شخص ملتزم ومستمر يومياً.',
    cue: partial.cue || 'موعد يومي محدد',
    routine: partial.routine || partial.name || '',
    twoMinuteRule: partial.twoMinuteRule || 'ابدأ بدقيقتين فقط',
    reward: partial.reward || 'الاحتفال بالتقدم',
    color: '#14b8a6',
    icon: 'Flame',
    frequency: 'daily',
    timeOfDay: 'anytime',
    targetDaysPerWeek: 7,
    createdAt: new Date().toISOString(),
  };
}

function createStyledCell(
  text: string,
  isHeader = false,
  bgColor?: string,
  textColor?: string
): TableCell {
  const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' },
  };

  return new TableCell({
    borders,
    shading: bgColor ? { fill: bgColor } : undefined,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: isHeader,
            color: textColor || (isHeader ? '0f172a' : '334155'),
            size: isHeader ? 20 : 18,
          }),
        ],
      }),
    ],
  });
}
