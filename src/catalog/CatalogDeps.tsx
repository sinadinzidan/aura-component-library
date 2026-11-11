import { createContext, useContext } from 'react';

import { catalogIndex, type CatalogIndex } from './catalogIndex';
import { loadLibrarySource, lookupPageLoader, type LibrarySourceLoader, type PageLoaderLookup } from './pageLoaders';

export type CatalogDeps = {
  index: CatalogIndex;
  lookupPageLoader: PageLoaderLookup;
  loadLibrarySource: LibrarySourceLoader;
  /** How often a failed page load is retried before the error is shown, and the wait between tries. */
  pageLoadRetry: { count: number; delayMs: number };
};

export const defaultCatalogDeps: CatalogDeps = {
  index: catalogIndex,
  lookupPageLoader,
  loadLibrarySource,
  pageLoadRetry: { count: 2, delayMs: 1500 },
};

export const CatalogDepsContext = createContext<CatalogDeps>(defaultCatalogDeps);

export function useCatalogDeps(): CatalogDeps {
  return useContext(CatalogDepsContext);
}
