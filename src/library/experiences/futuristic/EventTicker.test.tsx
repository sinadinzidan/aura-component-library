import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EventTicker } from './EventTicker';
import type { TickerItem } from './EventTicker';

const ITEMS: readonly TickerItem[] = [
  { id: 'a', time: '13:46', kind: 'Alarm', text: 'Recompressor tripped on high vibration', tone: 'critical' },
  { id: 'b', time: '13:22', kind: 'Work order', text: 'Inspect recompressor drive-end bearing' },
];

describe(EventTicker.name, () => {
  it('lists every event once for assistive technology', () => {
    render(<EventTicker items={ITEMS} label="Recent events" animated />);

    const group = screen.getByRole('group', { name: 'Recent events' });
    expect(within(group).getAllByRole('listitem')).toHaveLength(2);
    expect(within(group).getByText('Recompressor tripped on high vibration')).toBeInTheDocument();
  });

  it('repeats the run, hidden, so the loop has no gap', () => {
    const { container } = render(<EventTicker items={ITEMS} label="Recent events" animated />);

    expect(container.querySelectorAll('ul')).toHaveLength(2);
    expect(container.querySelectorAll('ul[aria-hidden="true"]')).toHaveLength(1);
  });

  it('toggles between paused and running', async () => {
    render(<EventTicker items={ITEMS} label="Recent events" animated />);

    await userEvent.click(screen.getByRole('button', { name: 'Pause ticker' }));
    expect(screen.getByRole('button', { name: 'Resume ticker' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Resume ticker' }));
    expect(screen.getByRole('button', { name: 'Pause ticker' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('is a static, scrollable strip without motion', () => {
    const { container } = render(<EventTicker items={ITEMS} label="Recent events" animated={false} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelectorAll('ul')).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Recent events' })).toHaveAttribute('tabindex', '0');
  });
});
