import type { Habit, HabitLog } from '../types/habit';
import {
  isSupabaseConfigured,
  upsertHabitToSupabase,
  deleteHabitFromSupabase,
  upsertLogToSupabase,
} from './supabase';

export type QueueActionType = 'UPSERT_HABIT' | 'DELETE_HABIT' | 'UPSERT_LOG';

export interface QueuedMutation {
  id: string;
  userId: string;
  type: QueueActionType;
  payload: any;
  createdAt: string;
  retryCount: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending';

export interface SyncState {
  isOnline: boolean;
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: string | null;
}

const STORAGE_PREFIX = 'istomic_offline_queue_';
const MAX_RETRY_COUNT = 5;

// Listeners for sync state changes
type StateListener = (state: SyncState) => void;
const listeners = new Set<StateListener>();

let currentSyncState: SyncState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  status: 'synced',
  pendingCount: 0,
  lastSyncedAt: null,
};

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener({ ...currentSyncState });
    } catch (err) {
      console.error('Error in sync state listener:', err);
    }
  }
}

export function subscribeSyncState(listener: StateListener): () => void {
  listeners.add(listener);
  listener({ ...currentSyncState });
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncState(): SyncState {
  return { ...currentSyncState };
}

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

/**
 * Load queue from localStorage for a specific user
 */
export function getQueuedMutations(userId: string): QueuedMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read offline queue from localStorage:', err);
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveQueuedMutations(userId: string, queue: QueuedMutation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(queue));
    currentSyncState.pendingCount = queue.length;
    if (!navigator.onLine) {
      currentSyncState.status = 'offline';
    } else if (queue.length > 0) {
      currentSyncState.status = 'pending';
    } else {
      currentSyncState.status = 'synced';
    }
    notifyListeners();
  } catch (err) {
    console.error('Failed to save offline queue to localStorage:', err);
  }
}

/**
 * Enqueue a mutation with smart deduplication
 */
export function enqueueMutation(
  userId: string,
  type: QueueActionType,
  payload: any
): void {
  const queue = getQueuedMutations(userId);
  const now = new Date().toISOString();
  const id = `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  let updatedQueue: QueuedMutation[] = [];

  if (type === 'UPSERT_LOG') {
    // Deduplicate: replace previous queued log for the exact same log ID (habitId_date)
    const logId = payload.id || `${payload.habitId}_${payload.date}`;
    const filtered = queue.filter(
      (item) =>
        !(
          item.type === 'UPSERT_LOG' &&
          (item.payload.id === logId ||
            (item.payload.habitId === payload.habitId && item.payload.date === payload.date))
        )
    );
    updatedQueue = [
      ...filtered,
      { id, userId, type, payload, createdAt: now, retryCount: 0 },
    ];
  } else if (type === 'UPSERT_HABIT') {
    // Deduplicate: replace previous upsert for this habit ID
    const habitId = payload.id;
    const filtered = queue.filter(
      (item) => !(item.type === 'UPSERT_HABIT' && item.payload.id === habitId)
    );
    updatedQueue = [
      ...filtered,
      { id, userId, type, payload, createdAt: now, retryCount: 0 },
    ];
  } else if (type === 'DELETE_HABIT') {
    // When deleting, remove any pending upserts for this habit
    const habitId = payload.habitId || payload.id;
    const filtered = queue.filter(
      (item) =>
        !(
          (item.type === 'UPSERT_HABIT' && item.payload.id === habitId) ||
          (item.type === 'DELETE_HABIT' && (item.payload.habitId === habitId || item.payload.id === habitId))
        )
    );
    updatedQueue = [
      ...filtered,
      { id, userId, type, payload: { habitId }, createdAt: now, retryCount: 0 },
    ];
  } else {
    updatedQueue = [...queue, { id, userId, type, payload, createdAt: now, retryCount: 0 }];
  }

  saveQueuedMutations(userId, updatedQueue);
}

/**
 * Safely dispatch an operation to Supabase; enqueues automatically on network failure
 */
export async function executeOrQueueMutation(
  userId: string,
  type: QueueActionType,
  payload: any
): Promise<boolean> {
  // If not configured or guest, we only keep local state
  if (!isSupabaseConfigured || !userId || userId === 'guest') {
    return true;
  }

  // If browser is offline, enqueue immediately without failing
  if (!navigator.onLine) {
    enqueueMutation(userId, type, payload);
    return false;
  }

  try {
    let success = false;
    if (type === 'UPSERT_HABIT') {
      success = await upsertHabitToSupabase(payload as Habit, userId);
    } else if (type === 'DELETE_HABIT') {
      const habitId = payload.habitId || payload.id;
      success = await deleteHabitFromSupabase(habitId, userId);
    } else if (type === 'UPSERT_LOG') {
      success = await upsertLogToSupabase(payload as HabitLog, userId);
    }

    if (success) {
      currentSyncState.lastSyncedAt = new Date().toISOString();
      if (getQueuedMutations(userId).length === 0) {
        currentSyncState.status = 'synced';
      }
      notifyListeners();
      return true;
    } else {
      // Supabase returned failure, enqueue for retry
      enqueueMutation(userId, type, payload);
      return false;
    }
  } catch (err) {
    // Network exception, timeout, etc.
    console.warn(`Mutation ${type} failed over network. Queuing offline mutation:`, err);
    enqueueMutation(userId, type, payload);
    return false;
  }
}

let isProcessingQueue = false;

/**
 * Process pending offline mutations sequentially in chronological order
 */
export async function processOfflineQueue(userId: string): Promise<{
  processed: number;
  remaining: number;
}> {
  if (isProcessingQueue) return { processed: 0, remaining: getQueuedMutations(userId).length };
  if (!isSupabaseConfigured || !userId || userId === 'guest') {
    return { processed: 0, remaining: 0 };
  }

  if (!navigator.onLine) {
    currentSyncState.status = 'offline';
    notifyListeners();
    return { processed: 0, remaining: getQueuedMutations(userId).length };
  }

  const queue = getQueuedMutations(userId);
  if (queue.length === 0) {
    currentSyncState.status = 'synced';
    currentSyncState.pendingCount = 0;
    notifyListeners();
    return { processed: 0, remaining: 0 };
  }

  isProcessingQueue = true;
  currentSyncState.status = 'syncing';
  notifyListeners();

  let processedCount = 0;
  const remainingQueue: QueuedMutation[] = [];

  try {
    for (const item of queue) {
      // If we went offline mid-sync, keep remaining
      if (!navigator.onLine) {
        remainingQueue.push(item);
        continue;
      }

      let success = false;
      try {
        if (item.type === 'UPSERT_HABIT') {
          success = await upsertHabitToSupabase(item.payload as Habit, userId);
        } else if (item.type === 'DELETE_HABIT') {
          const habitId = item.payload.habitId || item.payload.id;
          success = await deleteHabitFromSupabase(habitId, userId);
        } else if (item.type === 'UPSERT_LOG') {
          success = await upsertLogToSupabase(item.payload as HabitLog, userId);
        }
      } catch (err) {
        console.warn(`Retry failed for queue item ${item.id}:`, err);
        success = false;
      }

      if (success) {
        processedCount++;
      } else {
        const nextRetry = item.retryCount + 1;
        if (nextRetry < MAX_RETRY_COUNT) {
          remainingQueue.push({ ...item, retryCount: nextRetry });
        } else {
          console.error(`Queue item ${item.id} exceeded maximum retries (${MAX_RETRY_COUNT}), discarding.`);
        }
      }
    }
  } finally {
    isProcessingQueue = false;
    saveQueuedMutations(userId, remainingQueue);

    currentSyncState.pendingCount = remainingQueue.length;
    currentSyncState.lastSyncedAt = new Date().toISOString();

    if (!navigator.onLine) {
      currentSyncState.status = 'offline';
    } else if (remainingQueue.length > 0) {
      currentSyncState.status = 'pending';
    } else {
      currentSyncState.status = 'synced';
    }

    notifyListeners();
  }

  return { processed: processedCount, remaining: remainingQueue.length };
}

/**
 * Setup global network and visibility event listeners for auto-sync
 */
export function initializeOfflineQueueSync(getUserId: () => string | undefined): () => void {
  const handleOnline = () => {
    currentSyncState.isOnline = true;
    notifyListeners();
    const userId = getUserId();
    if (userId) {
      processOfflineQueue(userId);
    }
  };

  const handleOffline = () => {
    currentSyncState.isOnline = false;
    currentSyncState.status = 'offline';
    notifyListeners();
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      const userId = getUserId();
      if (userId) {
        processOfflineQueue(userId);
      }
    }
  };

  // Periodic background check every 45 seconds if pending items exist
  const intervalTimer = setInterval(() => {
    const userId = getUserId();
    if (userId && navigator.onLine && getQueuedMutations(userId).length > 0) {
      processOfflineQueue(userId);
    }
  }, 45 * 1000);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibility);

  // Initial check on load
  const initialUserId = getUserId();
  if (initialUserId) {
    const queue = getQueuedMutations(initialUserId);
    currentSyncState.pendingCount = queue.length;
    if (!navigator.onLine) {
      currentSyncState.status = 'offline';
    } else if (queue.length > 0) {
      currentSyncState.status = 'pending';
      processOfflineQueue(initialUserId);
    } else {
      currentSyncState.status = 'synced';
    }
    notifyListeners();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibility);
    clearInterval(intervalTimer);
  };
}
