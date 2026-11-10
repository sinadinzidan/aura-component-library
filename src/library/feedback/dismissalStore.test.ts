import { createMemoryDismissalStore, createStorageDismissalStore } from './dismissalStore';
import type { KeyValueStorage } from './dismissalStore';

describe(createMemoryDismissalStore.name, () => {
  it('reports an id as dismissed after dismiss', () => {
    const store = createMemoryDismissalStore();

    store.dismiss('trial-notice');

    expect(store.isDismissed('trial-notice')).toBe(true);
  });

  it('starts with the ids it was given', () => {
    const store = createMemoryDismissalStore(['trial-notice']);

    expect(store.isDismissed('trial-notice')).toBe(true);
    expect(store.isDismissed('other')).toBe(false);
  });

  it('forgets an id after restore', () => {
    const store = createMemoryDismissalStore(['trial-notice']);

    store.restore('trial-notice');

    expect(store.isDismissed('trial-notice')).toBe(false);
  });
});

describe(createStorageDismissalStore.name, () => {
  it('writes the dismissal under the prefixed key', () => {
    const storage = fakeStorage();
    const store = createStorageDismissalStore(storage, 'app:');

    store.dismiss('trial-notice');

    expect(storage.setItem).toHaveBeenCalledWith('app:trial-notice', '1');
    expect(store.isDismissed('trial-notice')).toBe(true);
  });

  it('removes the key on restore', () => {
    const storage = fakeStorage();
    const store = createStorageDismissalStore(storage);
    store.dismiss('trial-notice');

    store.restore('trial-notice');

    expect(store.isDismissed('trial-notice')).toBe(false);
  });
});

function fakeStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
  };
}
