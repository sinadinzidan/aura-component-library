import { findArea, findPage } from '../manifest';

export type Theme = 'light' | 'dark';

/**
 * Everything a reload or a shared link must restore. `page` wins over `area`; both null is the
 * library home.
 */
export type CatalogState = {
  area: string | null;
  page: string | null;
  theme: Theme;
  query: string;
  /** Specimen whose code view is open. */
  specimen: string | null;
};

export const DEFAULT_STATE: CatalogState = {
  area: null,
  page: null,
  theme: 'light',
  query: '',
  specimen: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Parses saved state, dropping anything malformed or pointing at pages that no longer exist. */
export function parseCatalogState(raw: string | undefined): CatalogState {
  if (!raw) return DEFAULT_STATE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_STATE;
  }
  if (!isRecord(parsed)) return DEFAULT_STATE;

  const pageId = stringOrNull(parsed.page);
  const location = pageId ? findPage(pageId) : null;
  const areaId = stringOrNull(parsed.area);
  const area = location?.area.id ?? (areaId && findArea(areaId) ? areaId : null);

  return {
    area,
    page: location ? location.page.id : null,
    theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_STATE.theme,
    query: typeof parsed.query === 'string' ? parsed.query : '',
    specimen: location ? stringOrNull(parsed.specimen) : null,
  };
}

export function serializeCatalogState(state: CatalogState): string {
  return JSON.stringify(state);
}
