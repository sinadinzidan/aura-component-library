import { useCallback, useMemo, useState } from 'react';

export type Selection<Id extends string = string> = {
  /** The selected ids, in the order of `ids`. */
  selectedIds: readonly Id[];
  count: number;
  /** Every id is selected. False for an empty list. */
  allSelected: boolean;
  /** Some, but not all, ids are selected: the "select all" checkbox shows as indeterminate. */
  partiallySelected: boolean;
  isSelected: (id: Id) => boolean;
  /** Flips one id, or forces it with `checked`. */
  toggle: (id: Id, checked?: boolean) => void;
  /** Selects everything, or clears when everything is already selected. Force with `checked`. */
  toggleAll: (checked?: boolean) => void;
  /** Replaces the selection, for example to restore it after an undo. */
  replace: (ids: readonly Id[]) => void;
  clear: () => void;
};

/**
 * Selection state for a list, table or card grid: which ids are picked, whether that is all or
 * only some of them, and the handlers a row checkbox and a "select all" checkbox need. Ids that
 * leave `ids` (filtered out, deleted) drop out of the selection.
 */
export function useSelection<Id extends string>(ids: readonly Id[], initial: readonly Id[] = []): Selection<Id> {
  const [picked, setPicked] = useState<ReadonlySet<Id>>(() => new Set(initial));

  const selectedIds = useMemo(() => ids.filter((id) => picked.has(id)), [ids, picked]);
  const count = selectedIds.length;
  const allSelected = ids.length > 0 && count === ids.length;

  const isSelected = useCallback((id: Id) => picked.has(id), [picked]);

  const toggle = useCallback((id: Id, checked?: boolean) => {
    setPicked((current) => {
      const next = new Set(current);
      const shouldSelect = checked ?? !current.has(id);
      if (shouldSelect) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked?: boolean) => {
      const shouldSelect = checked ?? !allSelected;
      setPicked(shouldSelect ? new Set(ids) : new Set());
    },
    [allSelected, ids]
  );

  const replace = useCallback((next: readonly Id[]) => setPicked(new Set(next)), []);
  const clear = useCallback(() => setPicked(new Set()), []);

  return {
    selectedIds,
    count,
    allSelected,
    partiallySelected: count > 0 && !allSelected,
    isSelected,
    toggle,
    toggleAll,
    replace,
    clear,
  };
}
