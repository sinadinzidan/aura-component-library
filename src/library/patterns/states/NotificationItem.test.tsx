import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { NotificationItem } from './NotificationItem';

describe(NotificationItem.name, () => {
  it('shows the title, context and meta line', () => {
    renderItem({ description: 'Vibration reached 11.6 mm/s.' });

    expect(screen.getByText('Recompressor tripped')).toBeInTheDocument();
    expect(screen.getByText('Vibration reached 11.6 mm/s.')).toBeInTheDocument();
    expect(screen.getByText('Gas compression · 14 min ago')).toBeInTheDocument();
  });

  it('marks an unread row in text, not only with the dot', () => {
    renderItem({ unread: true });

    expect(screen.getByText('Unread')).toBeInTheDocument();
  });

  it('has no unread marker once read', () => {
    renderItem({ unread: false, onMarkRead: vi.fn() });

    expect(screen.queryByText('Unread')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mark/ })).not.toBeInTheDocument();
  });

  it('opens its subject when the row is activated', async () => {
    const onOpen = vi.fn();
    renderItem({ onOpen });

    await userEvent.click(screen.getByRole('button', { name: /Recompressor tripped/ }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('marks as read without opening', async () => {
    const onOpen = vi.fn();
    const onMarkRead = vi.fn();
    renderItem({ unread: true, onOpen, onMarkRead });

    await userEvent.click(screen.getByRole('button', { name: 'Mark "Recompressor tripped" as read' }));

    expect(onMarkRead).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});

function renderItem(props: Partial<ComponentProps<typeof NotificationItem>>) {
  return render(
    <TooltipProvider>
      <ul>
        <NotificationItem title="Recompressor tripped" meta="Gas compression · 14 min ago" {...props} />
      </ul>
    </TooltipProvider>
  );
}
