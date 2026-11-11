import { useCallback, useMemo, useState } from 'react';

export type UseTableSelectionResult = {
  selectedIds: readonly string[];
  count: number;
  isSelected: (id: string) => boolean;
  /** Selects or clears one row. Without `checked` it flips. */
  toggle: (id: string, checked?: boolean) => void;
  /** Selects every selectable row, or clears the selection. Without `checked` it selects all unless all are selected. */
  toggleAll: (checked?: boolean) => void;
  clear: () => void;
  allSelected: boolean;
  /** Some but not all rows are selected: the header checkbox is indeterminate. */
  someSelected: boolean;
  /** Spread onto the header's `TableSelectionCell`, next to its `label`. */
  headerProps: { checked: boolean; indeterminate: boolean; disabled: boolean; onCheckedChange: (checked: boolean) => void };
  /** Spread onto a row's `TableSelectionCell`, next to its `label`. */
  rowProps: (id: string) => { checked: boolean; onCheckedChange: (checked: boolean) => void };
};

/**
 * Row selection for a `Table`: which ids are selected, the select-all state with its
 * indeterminate case, and the props for the header and row checkboxes. `ids` are the rows that
 * can be selected right now, so ids that leave the list drop out of the counts.
 */
export function useTableSelection(ids: readonly string[], initial: readonly string[] = []): UseTableSelectionResult {
  const [selected, setSelected] = useState<readonly string[]>(initial);

  const selectedIds = useMemo(() => ids.filter((id) => selected.includes(id)), [ids, selected]);
  const allSelected = ids.length > 0 && selectedIds.length === ids.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggle = useCallback((id: string, checked?: boolean) => {
    setSelected((current) => {
      const next = checked ?? !current.includes(id);
      if (next === current.includes(id)) return current;
      return next ? [...current, id] : current.filter((other) => other !== id);
    });
  }, []);

  const toggleAll = useCallback(
    (checked?: boolean) => {
      setSelected((current) => {
        const everySelected = ids.length > 0 && ids.every((id) => current.includes(id));
        return (checked ?? !everySelected) ? [...ids] : [];
      });
    },
    [ids]
  );

  const clear = useCallback(() => setSelected([]), []);
  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  return {
    selectedIds,
    count: selectedIds.length,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
    headerProps: { checked: allSelected, indeterminate: someSelected, disabled: ids.length === 0, onCheckedChange: toggleAll },
    rowProps: (id: string) => ({ checked: selectedIds.includes(id), onCheckedChange: (checked: boolean) => toggle(id, checked) }),
  };
}
