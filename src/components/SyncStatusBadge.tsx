import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudArrowUp,
  faTriangleExclamation,
  faSpinner,
  faRotate,
  faCheck,
} from '../lib/icons';
import {
  subscribeSyncState,
  processOfflineQueue,
  type SyncState,
} from '../lib/offlineQueue';
import { soundManager } from '../lib/sound';

interface SyncStatusBadgeProps {
  userId?: string;
  className?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  userId,
  className = '',
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    status: 'synced',
    pendingCount: 0,
    lastSyncedAt: null,
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || !syncState.isOnline || isManualSyncing) return;

    try {
      setIsManualSyncing(true);
      const res = await processOfflineQueue(userId);
      if (res.processed > 0) {
        soundManager.playCelebration();
      }
    } finally {
      setIsManualSyncing(false);
    }
  };

  const isSyncing = syncState.status === 'syncing' || isManualSyncing;

  // 1. حالة المزامنة النشطة (Syncing)
  if (isSyncing) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00A896]/15 border border-[#00A896]/40 text-[#00A896] dark:text-[#02C39A] text-[11px] font-bold select-none ${className}`}
        title="جاري مزامنة التغييرات المحلية مع Supabase..."
      >
        <FontAwesomeIcon icon={faSpinner} spin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">
          جاري المزامنة {syncState.pendingCount > 0 ? `(${syncState.pendingCount})` : ''}...
        </span>
      </div>
    );
  }

  // 2. حالة عدم الاتصال (Offline)
  if (!syncState.isOnline || syncState.status === 'offline') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold select-none ${className}`}
        title="أنت تعمل الآن في وضع عدم الاتصال. بياناتك محفوظة محلياً بأمان وستُزامن تلقائياً فور عودة الإنترنت."
      >
        <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>
          غير متصل
          {syncState.pendingCount > 0 && ` • ${syncState.pendingCount} معلقة`}
        </span>
      </div>
    );
  }

  // 3. حالة وجود عناصر بانتظار المزامنة بالرغم من توفر الإنترنت (Pending Queue)
  if (syncState.pendingCount > 0) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold select-none ${className}`}
        title="توجد تغييرات محفوظة محلياً بانتظار الرفع إلى السحابة."
      >
        <FontAwesomeIcon icon={faCloudArrowUp} className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{syncState.pendingCount} معلقة</span>
        {userId && (
          <button
            type="button"
            onClick={handleManualSync}
            className="mr-1 p-0.5 rounded hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer flex items-center gap-0.5"
            title="مزامنة التغييرات المعلقة الآن"
            aria-label="مزامنة التغييرات المعلقة الآن"
          >
            <FontAwesomeIcon icon={faRotate} className="w-3 h-3" aria-hidden="true" />
            <span className="text-[10px] underline">مزامنة الآن</span>
          </button>
        )}
      </div>
    );
  }

  // 4. حالة المزامنة الكاملة والاتصال المستقر (Fully Synced)
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold select-none ${className}`}
      title={
        syncState.lastSyncedAt
          ? `كافة العادات والسجلات متزامنة سحابياً (آخر مزامنة: ${new Date(
              syncState.lastSyncedAt
            ).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})`
          : 'كافة البيانات متزامنة سحابياً بأمان'
      }
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="hidden sm:inline">متزامن سحابياً</span>
      <FontAwesomeIcon icon={faCheck} className="w-3 h-3 sm:hidden" aria-hidden="true" />
    </div>
  );
};
