import { act, renderHook } from '@testing-library/react';

import { useSelection } from './useSelection';

const IDS = ['a', 'b', 'c'] as const;

describe(useSelection.name, () => {
  it('starts with the initial selection', () => {
    const { result } = renderHook(() => useSelection(IDS, ['b']));

    expect(result.current.selectedIds).toEqual(['b']);
    expect(result.current.partiallySelected).toBe(true);
    expect(result.current.allSelected).toBe(false);
  });

  it('toggles one id on and off', () => {
    const { result } = renderHook(() => useSelection(IDS));

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(true);

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('forces a state when toggle is given one', () => {
    const { result } = renderHook(() => useSelection(IDS, ['a']));

    act(() => result.current.toggle('a', true));

    expect(result.current.selectedIds).toEqual(['a']);
  });

  it('selects everything, then clears, with toggleAll', () => {
    const { result } = renderHook(() => useSelection(IDS, ['c']));

    act(() => result.current.toggleAll());
    expect(result.current.allSelected).toBe(true);
    expect(result.current.count).toBe(3);

    act(() => result.current.toggleAll());
    expect(result.current.count).toBe(0);
  });

  it('keeps selected ids in list order', () => {
    const { result } = renderHook(() => useSelection(IDS));

    act(() => result.current.toggle('c'));
    act(() => result.current.toggle('a'));

    expect(result.current.selectedIds).toEqual(['a', 'c']);
  });

  it('drops ids that are no longer in the list', () => {
    const { result, rerender } = renderHook(({ ids }: { ids: readonly string[] }) => useSelection(ids, ['a', 'b']), {
      initialProps: { ids: ['a', 'b', 'c'] },
    });

    rerender({ ids: ['b', 'c'] });

    expect(result.current.selectedIds).toEqual(['b']);
  });

  it('replaces and clears the selection', () => {
    const { result } = renderHook(() => useSelection(IDS, ['a']));

    act(() => result.current.replace(['b', 'c']));
    expect(result.current.selectedIds).toEqual(['b', 'c']);

    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });

  it('reports nothing selected for an empty list', () => {
    const { result } = renderHook(() => useSelection([]));

    expect(result.current.allSelected).toBe(false);
    expect(result.current.partiallySelected).toBe(false);
  });
});
