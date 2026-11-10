import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { parseCatalogState, type CatalogState } from './catalogState';
import type { HostChannel } from './hostChannel';

export type CatalogStorage = {
  state: CatalogState;
  setState: (next: CatalogState) => void;
  channel: HostChannel;
};

const CatalogStorageContext = createContext<CatalogStorage | null>(null);

type CatalogStateProviderProps = { channel: HostChannel; children: ReactNode };

/** Single owner of catalog state. Rendered once at the root; view models read it through context. */
export function CatalogStateProvider({ channel, children }: CatalogStateProviderProps) {
  const [state, setState] = useState<CatalogState>(() => parseCatalogState(channel.initialState));
  const storage = useMemo(() => ({ state, setState, channel }), [state, channel]);
  return <CatalogStorageContext.Provider value={storage}>{children}</CatalogStorageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook and provider share one context
export function useCatalogStorage(): CatalogStorage {
  const storage = useContext(CatalogStorageContext);
  if (!storage) throw new Error('useCatalogStorage must be used inside CatalogStateProvider');
  return storage;
}
