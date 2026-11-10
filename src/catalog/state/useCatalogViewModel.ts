import { useCallback, useMemo } from 'react';

import type { ThemeSettings } from '../../library/themes/themes';
import { findArea, findPage, type ManifestArea, type PageLocation } from '../manifest';

import { serializeCatalogState, type CatalogState } from './catalogState';
import { useCatalogStorage } from './CatalogStateProvider';

export type CatalogViewModel = {
  state: CatalogState;
  /** The open page, or null on the home and area overviews. */
  location: PageLocation | null;
  /** The area being browsed, or null on the library home. */
  area: ManifestArea | null;
  goHome: () => void;
  openArea: (areaId: string) => void;
  openPage: (pageId: string) => void;
  openSpecimen: (pageId: string, specimenId: string) => void;
  closeSpecimen: () => void;
  /** Changes one or more theme options; the rest stay as they are. */
  setTheme: (patch: Partial<ThemeSettings>) => void;
  setQuery: (query: string) => void;
  openExternal: (url: string) => void;
};

/** Stateless: composes the shared catalog storage with navigation commands and host sync. */
export function useCatalogViewModel(): CatalogViewModel {
  const { state, setState, channel } = useCatalogStorage();

  const update = useCallback(
    (patch: Partial<CatalogState>) => {
      const next = { ...state, ...patch };
      setState(next);
      channel.sync(serializeCatalogState(next));
    },
    [state, setState, channel]
  );

  const location = useMemo(() => (state.page ? findPage(state.page) : null), [state.page]);
  const area = useMemo(() => location?.area ?? (state.area ? findArea(state.area) : null), [location, state.area]);

  const goHome = useCallback(() => update({ area: null, page: null, specimen: null }), [update]);

  const openArea = useCallback(
    (areaId: string) => {
      if (findArea(areaId)) update({ area: areaId, page: null, specimen: null });
    },
    [update]
  );

  const openPage = useCallback(
    (pageId: string) => {
      const target = findPage(pageId);
      if (target) update({ area: target.area.id, page: pageId, specimen: null });
    },
    [update]
  );

  const openSpecimen = useCallback(
    (pageId: string, specimenId: string) => {
      const target = findPage(pageId);
      if (target) update({ area: target.area.id, page: pageId, specimen: specimenId });
    },
    [update]
  );

  const closeSpecimen = useCallback(() => update({ specimen: null }), [update]);
  const setTheme = useCallback(
    (patch: Partial<ThemeSettings>) => update({ theme: { ...state.theme, ...patch } }),
    [update, state.theme]
  );
  const setQuery = useCallback((query: string) => update({ query }), [update]);
  const openExternal = useCallback((url: string) => channel.openExternal(url), [channel]);

  return {
    state,
    location,
    area,
    goHome,
    openArea,
    openPage,
    openSpecimen,
    closeSpecimen,
    setTheme,
    setQuery,
    openExternal,
  };
}
