import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';

import { CatalogStateProvider } from './CatalogStateProvider';
import type { HostChannel } from './hostChannel';
import { useCatalogViewModel } from './useCatalogViewModel';

describe(useCatalogViewModel.name, () => {
  let channel: HostChannel;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    channel = createChannel(undefined);
    wrapper = createWrapper(channel);
  });

  it('starts on the library home when nothing was saved', () => {
    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    expect(result.current.location).toBeNull();
    expect(result.current.area).toBeNull();
    expect(result.current.state.theme.mode).toBe('light');
  });

  it('seeds page, area and theme from the host initial state', () => {
    wrapper = createWrapper(createChannel(JSON.stringify({ page: 'button', theme: 'dark' })));

    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    expect(result.current.location?.page.title).toBe('Button');
    expect(result.current.area?.id).toBe('primitives');
    expect(result.current.state.theme.mode).toBe('dark');
  });

  it('opens a page and syncs the new state to the host', () => {
    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    act(() => result.current.openPage('badge'));

    expect(result.current.location?.page.id).toBe('badge');
    expect(lastSynced(channel)).toMatchObject({ area: 'primitives', page: 'badge', specimen: null });
  });

  it('ignores an unknown page', () => {
    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    act(() => result.current.openPage('no-such-page'));

    expect(result.current.location).toBeNull();
    expect(channel.sync).not.toHaveBeenCalled();
  });

  it('opens an area overview and clears the page', () => {
    wrapper = createWrapper(createChannel(JSON.stringify({ page: 'button' })));
    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    act(() => result.current.openArea('industrial'));

    expect(result.current.location).toBeNull();
    expect(result.current.area?.id).toBe('industrial');
  });

  it('opens and closes a specimen code view', () => {
    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    act(() => result.current.openSpecimen('button', 'ButtonPrimary'));
    expect(lastSynced(channel)).toMatchObject({ page: 'button', specimen: 'ButtonPrimary' });

    act(() => result.current.closeSpecimen());
    expect(result.current.state.specimen).toBeNull();
    expect(result.current.location?.page.id).toBe('button');
  });

  it('syncs theme and search query changes', () => {
    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    act(() => result.current.setTheme({ mode: 'dark' }));
    act(() => result.current.setTheme({ accent: 'fjord', shape: 'soft' }));
    act(() => result.current.setQuery('gauge'));

    expect(lastSynced(channel)).toMatchObject({
      theme: { mode: 'dark', accent: 'fjord', shape: 'soft', surface: 'neutral', contrast: 'default', density: 'default' },
      query: 'gauge',
    });
  });

  it('returns home from a page', () => {
    wrapper = createWrapper(createChannel(JSON.stringify({ page: 'button' })));
    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    act(() => result.current.goHome());

    expect(result.current.area).toBeNull();
    expect(result.current.location).toBeNull();
  });

  it('opens external links through the host channel', () => {
    const { result } = renderHook(() => useCatalogViewModel(), { wrapper });

    result.current.openExternal('https://docs.example.test/');

    expect(channel.openExternal).toHaveBeenCalledWith('https://docs.example.test/');
  });
});

function createChannel(initialState: string | undefined): HostChannel {
  return { initialState, sync: vi.fn(), openExternal: vi.fn() };
}

function createWrapper(channel: HostChannel): ComponentType<{ children: ReactNode }> {
  return ({ children }) => <CatalogStateProvider channel={channel}>{children}</CatalogStateProvider>;
}

function lastSynced(channel: HostChannel): unknown {
  const calls = vi.mocked(channel.sync).mock.calls;
  return JSON.parse(calls[calls.length - 1][0]);
}
