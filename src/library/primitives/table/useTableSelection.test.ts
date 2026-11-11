import { act, renderHook } from '@testing-library/react';

import { useTableSelection } from './useTableSelection';

const IDS = ['a', 'b', 'c'] as const;

describe(useTableSelection.name, () => {
  it('starts with the initial selection', () => {
    const { result } = renderHook(() => useTableSelection(IDS, ['b']));

    expect(result.current.selectedIds).toEqual(['b']);
    expect(result.current.someSelected).toBe(true);
    expect(result.current.allSelected).toBe(false);
  });

  it('toggles one row', () => {
    const { result } = renderHook(() => useTableSelection(IDS));

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(true);

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('selects every row from the header', () => {
    const { result } = renderHook(() => useTableSelection(IDS, ['a']));

    act(() => result.current.headerProps.onCheckedChange(true));

    expect(result.current.allSelected).toBe(true);
    expect(result.current.headerProps).toMatchObject({
      checked: true,
      indeterminate: false,
    });
  });

  it('clears every row from the header', () => {
    const { result } = renderHook(() => useTableSelection(IDS, ['a', 'b', 'c']));

    act(() => result.current.headerProps.onCheckedChange(false));

    expect(result.current.count).toBe(0);
  });

  it('reports the header as indeterminate when only some rows are selected', () => {
    const { result } = renderHook(() => useTableSelection(IDS, ['a']));

    expect(result.current.headerProps).toMatchObject({
      checked: false,
      indeterminate: true,
    });
  });

  it('ignores selected ids that are no longer in the list', () => {
    const { result } = renderHook(() => useTableSelection(['a'], ['a', 'gone']));

    expect(result.current.selectedIds).toEqual(['a']);
    expect(result.current.allSelected).toBe(true);
  });

  it('disables the header when there are no rows', () => {
    const { result } = renderHook(() => useTableSelection([]));

    expect(result.current.headerProps.disabled).toBe(true);
    expect(result.current.allSelected).toBe(false);
  });

  it('gives each row its own checkbox props', () => {
    const { result } = renderHook(() => useTableSelection(IDS));

    act(() => result.current.rowProps('c').onCheckedChange(true));

    expect(result.current.rowProps('c').checked).toBe(true);
    expect(result.current.rowProps('a').checked).toBe(false);
  });

  it('clears the selection', () => {
    const { result } = renderHook(() => useTableSelection(IDS, ['a', 'b']));

    act(() => result.current.clear());

    expect(result.current.selectedIds).toEqual([]);
  });
});
