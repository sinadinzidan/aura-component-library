import { DEFAULT_THEME } from '../../library/themes/themes';

import { DEFAULT_STATE, parseCatalogState, serializeCatalogState } from './catalogState';

describe(parseCatalogState.name, () => {
  it('returns the default state when nothing was saved', () => {
    expect(parseCatalogState(undefined)).toEqual(DEFAULT_STATE);
  });

  it('returns the default state for malformed JSON', () => {
    expect(parseCatalogState('{not json')).toEqual(DEFAULT_STATE);
  });

  it('returns the default state for JSON that is not an object', () => {
    expect(parseCatalogState('[1,2]')).toEqual(DEFAULT_STATE);
  });

  it('restores a known page and derives its area', () => {
    const state = parseCatalogState(JSON.stringify({ page: 'button', theme: 'dark', specimen: 'ButtonPrimary' }));

    expect(state).toEqual({
      area: 'primitives',
      page: 'button',
      theme: { ...DEFAULT_THEME, mode: 'dark' },
      query: '',
      specimen: 'ButtonPrimary',
    });
  });

  it('drops an unknown page and its open specimen', () => {
    const state = parseCatalogState(JSON.stringify({ page: 'no-such-page', specimen: 'X' }));

    expect(state.page).toBeNull();
    expect(state.specimen).toBeNull();
  });

  it('keeps a known area without a page', () => {
    expect(parseCatalogState(JSON.stringify({ area: 'industrial' })).area).toBe('industrial');
  });

  it('drops an unknown area', () => {
    expect(parseCatalogState(JSON.stringify({ area: 'nope' })).area).toBeNull();
  });

  it('falls back to the default theme for an unknown theme', () => {
    expect(parseCatalogState(JSON.stringify({ theme: 'sepia' })).theme).toEqual(DEFAULT_THEME);
  });

  it('restores full theme settings and defaults invalid options', () => {
    const state = parseCatalogState(JSON.stringify({ theme: { mode: 'dark', accent: 'fjord', shape: 'blobby' } }));

    expect(state.theme).toEqual({ ...DEFAULT_THEME, mode: 'dark', accent: 'fjord' });
  });

  it('round-trips through serializeCatalogState', () => {
    const state = {
      area: 'primitives',
      page: 'badge',
      theme: { ...DEFAULT_THEME, accent: 'nordic' as const, contrast: 'high' as const },
      query: 'status',
      specimen: null,
    };

    expect(parseCatalogState(serializeCatalogState(state))).toEqual(state);
  });

  it('restores the look with the rest of the theme and defaults an unknown one', () => {
    expect(parseCatalogState(JSON.stringify({ theme: { look: 'console', mode: 'dark' } })).theme).toEqual({
      ...DEFAULT_THEME,
      mode: 'dark',
      look: 'console',
    });
    expect(parseCatalogState(JSON.stringify({ theme: { look: 'brutal' } })).theme.look).toBe('studio');
  });
});
