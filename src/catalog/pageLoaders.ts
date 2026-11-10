import { pageModulePath, type PageLocation } from './manifest';
import type { CatalogPage } from './types';

export type PageLoader = () => Promise<CatalogPage>;

/** Looks up how to load a page. Returns null while the page is planned but not built. */
export type PageLoaderLookup = (location: PageLocation) => PageLoader | null;

const pageModules = import.meta.glob<CatalogPage>(['./pages/*/*.tsx', '!./pages/*/*.test.tsx'], {
  import: 'default',
});

export const lookupPageLoader: PageLoaderLookup = (location) => pageModules[pageModulePath(location)] ?? null;

const librarySources = import.meta.glob<string>(['../library/**/*.{ts,tsx}', '!../library/**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
});

/** Loads the source of a reusable library file. `file` is relative to `src/library`. */
export type LibrarySourceLoader = (file: string) => Promise<string | null>;

export const loadLibrarySource: LibrarySourceLoader = async (file) => {
  const load = librarySources[`../library/${file}`];
  return load ? load() : null;
};
