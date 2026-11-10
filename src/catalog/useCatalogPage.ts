import { useQuery } from '@tanstack/react-query';

import { useCatalogDeps } from './CatalogDeps';
import type { PageLocation } from './manifest';
import type { CatalogPage } from './types';

export type CatalogPageResult =
  | { status: 'planned' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; page: CatalogPage };

/** Loads a page module on demand. `planned` means the page is in the manifest but not built yet. */
export function useCatalogPage(location: PageLocation): CatalogPageResult {
  const { lookupPageLoader } = useCatalogDeps();
  const loader = lookupPageLoader(location);
  const query = useQuery({
    queryKey: ['catalog-page', location.page.id],
    queryFn: () => (loader ? loader() : Promise.reject(new Error('Page is not built'))),
    enabled: loader !== null,
    staleTime: Infinity,
    retry: false,
  });

  if (!loader) return { status: 'planned' };
  if (query.isError) return { status: 'error' };
  if (!query.data) return { status: 'loading' };
  return { status: 'ready', page: query.data };
}
