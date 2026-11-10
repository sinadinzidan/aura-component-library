import { render, screen, within } from '@testing-library/react';

import type { ShortcutGroup } from './filterShortcuts';
import { ShortcutSheet } from './ShortcutSheet';

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

describe(ShortcutSheet.name, () => {
  it('groups shortcuts under their area', () => {
    render(<ShortcutSheet groups={GROUPS} platform="other" />);

    const general = within(screen.getByRole('region', { name: 'General' }));
    expect(general.getByText('Open command palette')).toBeInTheDocument();
    expect(general.getByText('Ctrl')).toBeInTheDocument();
  });

  it('uses the modifier of the platform', () => {
    render(<ShortcutSheet groups={GROUPS} platform="mac" />);

    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.getByText('Command + K')).toHaveClass('sr-only');
  });

  it('reads a sequence as one key after the other', () => {
    render(<ShortcutSheet groups={GROUPS} platform="other" />);

    expect(screen.getByText('G then A')).toBeInTheDocument();
  });

  it('filters by the query', () => {
    render(<ShortcutSheet groups={GROUPS} query="palette" platform="other" />);

    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.queryByText('Go to alarms')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Navigation' })).not.toBeInTheDocument();
  });

  it('says so when nothing matches', () => {
    render(<ShortcutSheet groups={GROUPS} query="export" emptyText="No shortcut for that yet." />);

    expect(screen.getByRole('status')).toHaveTextContent('No shortcut for that yet.');
  });
});
