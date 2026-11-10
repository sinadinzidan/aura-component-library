import { filterShortcuts } from './filterShortcuts';
import type { ShortcutGroup } from './filterShortcuts';

const GROUPS: readonly ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { id: 'palette', label: 'Open command palette', keys: ['mod', 'K'] },
      { id: 'help', label: 'Show keyboard shortcuts', keys: ['?'] },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      {
        id: 'alarms',
        label: 'Go to alarms',
        keys: ['G', 'A'],
        mode: 'sequence',
      },
    ],
  },
];

describe(filterShortcuts.name, () => {
  it('returns every group for an empty query', () => {
    expect(filterShortcuts(GROUPS, '  ')).toEqual(GROUPS);
  });

  it('matches labels without case and drops empty groups', () => {
    const result = filterShortcuts(GROUPS, 'ALARM');

    expect(result).toHaveLength(1);
    expect(result[0].shortcuts.map((entry) => entry.id)).toEqual(['alarms']);
  });

  it('returns nothing when no label matches', () => {
    expect(filterShortcuts(GROUPS, 'export')).toEqual([]);
  });
});
