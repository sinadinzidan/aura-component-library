import { createContext, useContext } from 'react';

import { catalogIndex, type CatalogIndex } from './catalogIndex';
import { loadLibrarySource, lookupPageLoader, type LibrarySourceLoader, type PageLoaderLookup } from './pageLoaders';

export type CatalogDeps = {
  index: CatalogIndex;
  lookupPageLoader: PageLoaderLookup;
  loadLibrarySource: LibrarySourceLoader;
};

export const defaultCatalogDeps: CatalogDeps = { index: catalogIndex, lookupPageLoader, loadLibrarySource };

export const CatalogDepsContext = createContext<CatalogDeps>(defaultCatalogDeps);

export function useCatalogDeps(): CatalogDeps {
  return useContext(CatalogDepsContext);
}
