import { Search } from '@cognite/aura/components/search';
import { Tree } from '@cognite/aura/components/tree';
import type { TreeProps } from '@cognite/aura/components/tree';
import { useMemo, useState } from 'react';

type FilterableTreeProps<T> = Pick<TreeProps<T>, 'rootItemId' | 'items' | 'getChildren' | 'getItemName' | 'children'> & {
  /** Accessible name of the search field, for example "Search assets". */
  searchLabel: string;
  placeholder?: string;
  /** Extra text to match besides the name, such as a tag or an external ID. */
  getSearchText?: (item: T) => string;
  /** Branches that start open while nothing is typed. */
  defaultExpandedItems?: string[];
  /** Says how many nodes match. Shown under the field and announced politely. */
  formatMatches?: (count: number) => string;
  /** Shown instead of the tree when nothing matches. */
  emptyText?: (query: string) => string;
};

const defaultFormatMatches = (count: number) => (count === 1 ? '1 match' : `${count} matches`);
const defaultEmptyText = (query: string) => `Nothing matches "${query}".`;

/**
 * A Tree with a search field above it. Typing keeps the nodes that match and the branches that
 * lead to them, and opens those branches so every match is visible. Clearing the field brings
 * back the full tree with the branches the user had open.
 */
export function FilterableTree<T>({
  rootItemId,
  items,
  getChildren,
  getItemName,
  children,
  searchLabel,
  placeholder = 'Search',
  getSearchText,
  defaultExpandedItems,
  formatMatches = defaultFormatMatches,
  emptyText = defaultEmptyText,
}: FilterableTreeProps<T>) {
  const [query, setQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>(defaultExpandedItems ?? []);
  const needle = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const kept = new Set<string>();
    const branches: string[] = [];
    let matches = 0;

    const visit = (id: string): boolean => {
      const item = items[id];
      if (item === undefined) return false;
      const text = `${getItemName(item)} ${getSearchText?.(item) ?? ''}`.toLowerCase();
      const isMatch = id !== rootItemId && text.includes(needle);
      // Visit every child, so siblings of a match are still checked.
      const hasMatchBelow = getChildren(item).filter(visit).length > 0;
      if (isMatch) matches += 1;
      if (isMatch || hasMatchBelow) kept.add(id);
      if (hasMatchBelow) branches.push(id);
      return isMatch || hasMatchBelow;
    };

    if (needle !== '') visit(rootItemId);
    return { kept, branches, matches };
  }, [items, rootItemId, getChildren, getItemName, getSearchText, needle]);

  const isFiltering = needle !== '';

  return (
    <div className="flex w-full flex-col gap-2">
      <Search
        aria-label={searchLabel}
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      {isFiltering ? (
        <p role="status" className="px-2 text-xs text-muted-foreground">
          {filtered.matches === 0 ? emptyText(query.trim()) : formatMatches(filtered.matches)}
        </p>
      ) : null}
      {isFiltering && filtered.matches === 0 ? null : (
        <Tree
          // The tree caches children per item, so each query gets a fresh instance.
          key={needle}
          rootItemId={rootItemId}
          items={items}
          getItemName={getItemName}
          getChildren={(item) =>
            isFiltering ? getChildren(item).filter((id) => filtered.kept.has(id)) : getChildren(item)
          }
          expandedItems={isFiltering ? filtered.branches : expandedItems}
          onExpandedItemsChange={isFiltering ? undefined : setExpandedItems}
        >
          {children}
        </Tree>
      )}
    </div>
  );
}
