import { render, screen, within } from '@testing-library/react';

import { ShellStatusBar } from './ShellStatusBar';

describe(ShellStatusBar.name, () => {
  it('renders each fact as a label with its value', () => {
    render(
      <ShellStatusBar
        items={[
          { id: 'historian', label: 'Historian', value: 'Connected', tone: 'success' },
          { id: 'sample', label: 'Last sample', value: '14:00:05 UTC' },
        ]}
      />
    );

    const bar = screen.getByRole('contentinfo', { name: 'Status bar' });
    expect(within(bar).getByText('Historian')).toBeInTheDocument();
    expect(within(bar).getByText('Connected')).toBeInTheDocument();
    expect(within(bar).getByText('14:00:05 UTC')).toBeInTheDocument();
  });

  it('adds a status dot only to facts with a tone', () => {
    const { container } = render(
      <ShellStatusBar
        items={[
          { id: 'historian', label: 'Historian', value: 'Connected', tone: 'success' },
          { id: 'sample', label: 'Last sample', value: '14:00:05 UTC' },
        ]}
      />
    );

    expect(container.querySelectorAll('[data-slot="status-dot"]')).toHaveLength(1);
  });

  it('renders the end group only when it has items', () => {
    const { container, rerender } = render(<ShellStatusBar items={[{ id: 'a', label: 'Historian', value: 'Connected' }]} />);
    expect(container.querySelectorAll('dl')).toHaveLength(1);

    rerender(
      <ShellStatusBar
        items={[{ id: 'a', label: 'Historian', value: 'Connected' }]}
        endItems={[{ id: 'user', label: 'Operator', value: 'Ingrid Haugen' }]}
      />
    );

    expect(container.querySelectorAll('dl')).toHaveLength(2);
    expect(screen.getByText('Ingrid Haugen')).toBeInTheDocument();
  });

  it('takes a custom accessible name', () => {
    render(<ShellStatusBar label="Console status" items={[]} />);

    expect(screen.getByRole('contentinfo', { name: 'Console status' })).toBeInTheDocument();
  });
});
