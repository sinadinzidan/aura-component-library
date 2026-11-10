export type UploadStatus = 'queued' | 'uploading' | 'done' | 'failed' | 'cancelled';

export type UploadItem = {
  id: string;
  name: string;
  /** Total size in bytes. */
  size: number;
  /** Bytes sent so far. Kept after a failure, so a retry resumes. */
  loaded: number;
  status: UploadStatus;
  /** Why the upload failed, in words that can be shown as they are. */
  error?: string;
};

export type UploadAction =
  | { type: 'add'; files: readonly { id: string; name: string; size: number }[] }
  /** Bytes arrived for one file. Completes the file when everything is sent. */
  | { type: 'progress'; id: string; bytes: number }
  /** Moves every waiting or running file forward by a share of its size, 0 to 1. */
  | { type: 'advance'; fraction: number }
  | { type: 'fail'; id: string; error: string }
  /** Puts a failed or cancelled file back in the queue, keeping what was already sent. */
  | { type: 'retry'; id: string }
  | { type: 'cancel'; id: string }
  | { type: 'remove'; id: string }
  /** Drops everything that is no longer moving: done, failed and cancelled. */
  | { type: 'clearFinished' };

function isActive(item: UploadItem): boolean {
  return item.status === 'queued' || item.status === 'uploading';
}

function withProgress(item: UploadItem, bytes: number): UploadItem {
  if (!isActive(item) || bytes <= 0) return item;
  const loaded = Math.min(item.size, item.loaded + bytes);
  return { ...item, loaded, status: loaded >= item.size ? 'done' : 'uploading' };
}

/**
 * State of an upload queue as a pure reducer, so the list, the summary and the tests agree on
 * what "cancel", "retry" and "done" mean. Files that are finished, failed or cancelled do not
 * move when progress arrives late.
 */
export function uploadReducer(state: readonly UploadItem[], action: UploadAction): UploadItem[] {
  switch (action.type) {
    case 'add': {
      const known = new Set(state.map((item) => item.id));
      const added = action.files
        .filter((file) => !known.has(file.id))
        .map((file): UploadItem => ({ ...file, loaded: 0, status: 'queued' }));
      return [...state, ...added];
    }
    case 'progress':
      return state.map((item) => (item.id === action.id ? withProgress(item, action.bytes) : item));
    case 'advance':
      return state.map((item) => withProgress(item, Math.ceil(item.size * action.fraction)));
    case 'fail':
      return state.map((item) =>
        item.id === action.id && isActive(item) ? { ...item, status: 'failed', error: action.error } : item
      );
    case 'retry':
      return state.map((item) =>
        item.id === action.id && (item.status === 'failed' || item.status === 'cancelled')
          ? { id: item.id, name: item.name, size: item.size, loaded: item.loaded, status: 'queued' }
          : item
      );
    case 'cancel':
      return state.map((item) => (item.id === action.id && isActive(item) ? { ...item, status: 'cancelled' } : item));
    case 'remove':
      return state.filter((item) => item.id !== action.id);
    case 'clearFinished':
      return state.filter(isActive);
  }
}

export type UploadSummary = {
  total: number;
  active: number;
  done: number;
  failed: number;
  cancelled: number;
  /** Bytes sent and bytes to send, leaving cancelled files out. */
  loadedBytes: number;
  totalBytes: number;
  /** 0 to 100, rounded down so it reads 100 only when everything is sent. */
  percent: number;
  /** Nothing is waiting or running any more. */
  settled: boolean;
};

/** The figures a queue header needs: how many files are where, and how far the whole batch is. */
export function summarizeUploads(items: readonly UploadItem[]): UploadSummary {
  const count = (status: UploadStatus) => items.filter((item) => item.status === status).length;
  const counted = items.filter((item) => item.status !== 'cancelled');
  const loadedBytes = counted.reduce((sum, item) => sum + item.loaded, 0);
  const totalBytes = counted.reduce((sum, item) => sum + item.size, 0);
  const active = count('queued') + count('uploading');

  return {
    total: items.length,
    active,
    done: count('done'),
    failed: count('failed'),
    cancelled: count('cancelled'),
    loadedBytes,
    totalBytes,
    percent: totalBytes === 0 ? 0 : Math.floor((loadedBytes * 100) / totalBytes),
    settled: active === 0,
  };
}
