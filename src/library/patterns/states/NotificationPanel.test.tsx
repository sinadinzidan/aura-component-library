import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationPanel } from './NotificationPanel';
import type { PanelNotification } from './NotificationPanel';

const NOTIFICATIONS: PanelNotification[] = [
  { id: 'a', title: 'Recompressor tripped', meta: '14 min ago', unread: true, group: 'Today' },
  { id: 'b', title: 'Work order assigned to you', meta: '2 h ago', unread: false, group: 'Today' },
  { id: 'c', title: 'Pipeline run failed', meta: 'Yesterday 22:10', unread: true, group: 'Yesterday' },
];

describe(NotificationPanel.name, () => {
  it('lists every notification under its day heading', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows the unread count on the Unread tab', () => {
    renderPanel();

    expect(within(screen.getByRole('tab', { name: /Unread/ })).getByText('2')).toBeInTheDocument();
  });

  it('filters to unread rows', async () => {
    renderPanel();

    await userEvent.click(screen.getByRole('tab', { name: /Unread/ }));

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Work order assigned to you')).not.toBeInTheDocument();
  });

  it('reports which row was marked as read', async () => {
    const { onMarkRead } = renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Mark "Pipeline run failed" as read' }));

    expect(onMarkRead).toHaveBeenCalledWith('c');
  });

  it('marks all as read from the header', async () => {
    const { onMarkAllRead } = renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));

    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('disables mark all and says so when nothing is unread', async () => {
    renderPanel(NOTIFICATIONS.map((notification) => ({ ...notification, unread: false })));

    await userEvent.click(screen.getByRole('tab', { name: /Unread/ }));

    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'You are all caught up' })).toBeInTheDocument();
  });

  it('shows an empty inbox', () => {
    renderPanel([]);

    expect(screen.getByRole('heading', { name: 'No notifications yet' })).toBeInTheDocument();
  });
});

function renderPanel(notifications: PanelNotification[] = NOTIFICATIONS) {
  const onMarkRead = vi.fn();
  const onMarkAllRead = vi.fn();
  render(
    <TooltipProvider>
      <NotificationPanel notifications={notifications} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} />
    </TooltipProvider>
  );
  return { onMarkRead, onMarkAllRead };
}
