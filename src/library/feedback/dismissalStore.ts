/** Remembers which messages a person has dismissed, keyed by a stable message id. */
export interface DismissalStore {
  isDismissed(id: string): boolean;
  dismiss(id: string): void;
  restore(id: string): void;
}

/** The subset of the Web Storage API the persistent store needs. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Remembers dismissals until the page reloads. Good for tests and session-only notices. */
export function createMemoryDismissalStore(initiallyDismissed: readonly string[] = []): DismissalStore {
  const dismissed = new Set(initiallyDismissed);
  return {
    isDismissed: (id) => dismissed.has(id),
    dismiss: (id) => {
      dismissed.add(id);
    },
    restore: (id) => {
      dismissed.delete(id);
    },
  };
}

/** Remembers dismissals in a Web Storage area (pass `window.localStorage`) under `prefix + id`. */
export function createStorageDismissalStore(storage: KeyValueStorage, prefix = 'dismissed:'): DismissalStore {
  return {
    isDismissed: (id) => storage.getItem(prefix + id) === '1',
    dismiss: (id) => storage.setItem(prefix + id, '1'),
    restore: (id) => storage.removeItem(prefix + id),
  };
}
