import { ShortcutHint } from '../../actions/ShortcutHint';
import type { ShortcutPlatform } from '../../actions/ShortcutHint';

import { filterShortcuts } from './filterShortcuts';
import type { ShortcutGroup } from './filterShortcuts';

type ShortcutSheetProps = {
  groups: readonly ShortcutGroup[];
  /** Filters by what a shortcut does. Wire it to a search field above the sheet. */
  query?: string;
  /** Fixes the modifier keys. Defaults to the platform the app runs on. */
  platform?: ShortcutPlatform;
  /** Groups side by side, for a dialog or a wide help page. */
  columns?: 1 | 2;
  emptyText?: string;
};

/**
 * The keyboard shortcuts of an app as a reference: grouped by area, action on the left and keys
 * on the right, with the right modifier for the platform. Give it a query to make a long sheet
 * searchable.
 */
export function ShortcutSheet({
  groups,
  query = '',
  platform,
  columns = 1,
  emptyText = 'No shortcuts match your search.',
}: ShortcutSheetProps) {
  const shown = filterShortcuts(groups, query);

  if (shown.length === 0) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <div data-slot="shortcut-sheet" className={`grid w-full min-w-0 gap-x-8 gap-y-6 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
      {shown.map((group) => (
        <section key={group.title} aria-label={group.title} className="flex min-w-0 flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{group.title}</h3>
          <dl className="flex flex-col">
            {group.shortcuts.map((entry) => (
              <div key={entry.id} className="flex min-h-8 items-center justify-between gap-4 border-b border-default py-1 last:border-b-0">
                <dt className="min-w-0 text-sm text-base-foreground">{entry.label}</dt>
                <dd className="flex shrink-0 items-center">
                  <ShortcutHint keys={entry.keys} mode={entry.mode} platform={platform} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
