import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { IconBell, IconCircleCheck } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { NotificationItem } from './NotificationItem';

export type PanelNotification = {
  id: string;
  title: string;
  description?: string;
  meta: string;
  media?: ReactNode;
  label?: ReactNode;
  unread: boolean;
  /** Heading the row is listed under, such as "Today". Rows keep the order they are given in. */
  group?: string;
};

type NotificationPanelProps = {
  notifications: readonly PanelNotification[];
  title?: string;
  onOpen?: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  /** Row under the list, for example a link to notification settings. */
  footer?: ReactNode;
};

type Filter = 'all' | 'unread';

function isFilter(value: unknown): value is Filter {
  return value === 'all' || value === 'unread';
}

function groupsOf(notifications: readonly PanelNotification[]): { heading: string; rows: PanelNotification[] }[] {
  const groups: { heading: string; rows: PanelNotification[] }[] = [];
  for (const notification of notifications) {
    const heading = notification.group ?? '';
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.rows.push(notification);
    else groups.push({ heading, rows: [notification] });
  }
  return groups;
}

/**
 * The content of a notification popover or side panel: a header with "Mark all as read", All and
 * Unread tabs with the unread count, rows grouped under day headings, and an empty state per tab.
 * Read state lives with the caller; the panel only remembers which tab is showing.
 */
export function NotificationPanel({
  notifications,
  title = 'Notifications',
  onOpen,
  onMarkRead,
  onMarkAllRead,
  footer,
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const shown = filter === 'unread' ? notifications.filter((notification) => notification.unread) : notifications;

  return (
    <section aria-label={title} className="flex w-full flex-col">
      <header className="flex items-center justify-between gap-4 px-2 pb-2">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        <Button variant="ghost" size="sm" disabled={unreadCount === 0} onClick={onMarkAllRead}>
          Mark all as read
        </Button>
      </header>
      <div className="px-2">
        <Tabs
          value={filter}
          onValueChange={(value) => {
            if (isFilter(value)) setFilter(value);
          }}
        >
          <TabsList size="small" showSeparator>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread" badge={unreadCount > 0 ? unreadCount : undefined}>
              Unread
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {shown.length === 0 ? (
        <div className="flex justify-center px-4 py-10">
          <EmptyState>
            <EmptyStateIcon>{filter === 'unread' ? <IconCircleCheck /> : <IconBell />}</EmptyStateIcon>
            <EmptyStateTitle as="h4">
              {filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
            </EmptyStateTitle>
            <EmptyStateDescription>
              {filter === 'unread'
                ? 'New alarms, mentions and assignments appear here.'
                : 'Alarms, mentions and assignments for you appear here.'}
            </EmptyStateDescription>
          </EmptyState>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-2">
          {groupsOf(shown).map((group) => (
            <div key={group.heading} className="flex flex-col">
              {group.heading ? (
                <h4 className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{group.heading}</h4>
              ) : null}
              <ul className="flex flex-col">
                {group.rows.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    title={notification.title}
                    description={notification.description}
                    meta={notification.meta}
                    media={notification.media}
                    label={notification.label}
                    unread={notification.unread}
                    onOpen={onOpen ? () => onOpen(notification.id) : undefined}
                    onMarkRead={() => onMarkRead(notification.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {footer ? <footer className="mt-2 border-t border-default px-2 pt-2">{footer}</footer> : null}
    </section>
  );
}
