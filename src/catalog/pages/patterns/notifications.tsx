import { Badge } from '@cognite/aura/components/badge';
import {
  Banner,
  BannerAction,
  BannerActions,
  BannerClose,
  BannerIcon,
  BannerTitle,
} from '@cognite/aura/components/banner';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import { toast } from '@cognite/aura/components/sonner-toast';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconAlertCircleFilled,
  IconAlertTriangle,
  IconAlertTriangleFilled,
  IconBell,
  IconBellOff,
  IconClipboardCheck,
  IconInfoCircleFilled,
  IconRouteOff,
  IconSettings,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { SingleToaster } from '../../../library/feedback/SingleToaster';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { NotificationItem } from '../../../library/patterns/states/NotificationItem';
import { NotificationPanel } from '../../../library/patterns/states/NotificationPanel';
import type { PanelNotification } from '../../../library/patterns/states/NotificationPanel';
import { ALARMS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import type { Alarm, Severity } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './notifications.tsx?raw';

const SEVERITY_LABEL: Record<Severity, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

const SEVERITY_VARIANT: Record<Severity, 'error' | 'warning' | 'secondary'> = {
  critical: 'error',
  high: 'warning',
  medium: 'secondary',
  low: 'secondary',
};

const TRIP_ALARM = ALARMS[0];
const TEMPERATURE_ALARM = ALARMS[1];
const AISHA = findPerson('ak');
const LIV = findPerson('lw');
const BEARING_ORDER = WORK_ORDERS[0];

const alarmMeta = (alarm: Alarm) => `${findAsset(alarm.assetId)?.name ?? alarm.assetId} · ${formatAgo(alarm.raisedAt)}`;

/** Neutral icon tile that says what kind of notification a row is. Colour stays on the severity label. */
function NotificationTile({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-8 items-center justify-center rounded-lg bg-muted-background text-medium-foreground [&>svg]:size-4">
      {children}
    </span>
  );
}

function NotificationSeverity({ severity }: { severity: Severity }) {
  return <Badge variant={SEVERITY_VARIANT[severity]}>{SEVERITY_LABEL[severity]}</Badge>;
}

const INBOX: readonly PanelNotification[] = [
  {
    id: 'trip',
    title: TRIP_ALARM.message,
    description: `${TRIP_ALARM.sensorTag} reached ${TRIP_ALARM.value}. Limit ${TRIP_ALARM.limit}.`,
    meta: alarmMeta(TRIP_ALARM),
    media: (
      <NotificationTile>
        <IconAlertTriangle />
      </NotificationTile>
    ),
    label: <NotificationSeverity severity="critical" />,
    unread: true,
    group: 'Today',
  },
  {
    id: 'mention',
    title: `${AISHA?.name} mentioned you`,
    description: '"Can you confirm the bearing temperature before we restart?"',
    meta: `${BEARING_ORDER.id} · 26 min ago`,
    media: <PersonAvatar name={AISHA?.name ?? 'Aisha Khan'} />,
    unread: true,
    group: 'Today',
  },
  {
    id: 'assigned',
    title: 'Work order assigned to you',
    description: WORK_ORDERS[3].title,
    meta: `${WORK_ORDERS[3].id} · 3 h ago`,
    media: (
      <NotificationTile>
        <IconTool />
      </NotificationTile>
    ),
    unread: false,
    group: 'Today',
  },
  {
    id: 'pipeline',
    title: 'Pipeline run failed',
    description: 'Compressor telemetry ingest stopped at step 3 of 5.',
    meta: 'Data pipelines · Yesterday 22:10',
    media: (
      <NotificationTile>
        <IconRouteOff />
      </NotificationTile>
    ),
    unread: true,
    group: 'Yesterday',
  },
  {
    id: 'maintenance',
    title: 'Maintenance scheduled for Saturday',
    description: 'The project is read-only from 02:00 to 04:00 CET.',
    meta: 'System · Yesterday 09:00',
    media: (
      <NotificationTile>
        <IconSettings />
      </NotificationTile>
    ),
    unread: false,
    group: 'Yesterday',
  },
];

/** Read state for the interactive lists: which ids are still unread, plus the two ways to clear them. */
function useNotificationInbox(initial: readonly PanelNotification[]) {
  const [read, setRead] = useState<readonly string[]>([]);
  const notifications = initial.map((notification) => ({
    ...notification,
    unread: notification.unread && !read.includes(notification.id),
  }));

  return {
    notifications,
    unreadCount: notifications.filter((notification) => notification.unread).length,
    markRead: (id: string) => setRead((current) => [...current, id]),
    markAllRead: () => setRead(initial.map((notification) => notification.id)),
    reset: () => setRead([]),
  };
}

function NotificationBellButton({ count }: { count: number }) {
  const label = count === 0 ? 'Notifications' : `Notifications, ${count} unread`;

  return (
    <span className="relative inline-flex">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={label}>
              <IconBell />
            </Button>
          }
        />
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      {count > 0 ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-background px-1 text-xs font-medium tabular-nums text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </span>
  );
}

function NotificationItemAlarm() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <ul className="w-full">
      <NotificationItem
        title={TRIP_ALARM.message}
        description={`${TRIP_ALARM.sensorTag} reached ${TRIP_ALARM.value}. Limit ${TRIP_ALARM.limit}.`}
        meta={alarmMeta(TRIP_ALARM)}
        media={
          <NotificationTile>
            <IconAlertTriangle />
          </NotificationTile>
        }
        label={<NotificationSeverity severity={TRIP_ALARM.severity} />}
        unread={!acknowledged}
        actions={
          acknowledged ? (
            <>
              <span className="text-xs text-muted-foreground" role="status">
                Acknowledged by you at 14:00
              </span>
              <Button variant="ghost" size="sm" onClick={() => setAcknowledged(false)}>
                Undo
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => setAcknowledged(true)}>
                Acknowledge
              </Button>
              <Button variant="ghost" size="sm">
                View alarm
              </Button>
            </>
          )
        }
      />
    </ul>
  );
}

function NotificationItemMention() {
  return (
    <ul className="w-full">
      <NotificationItem
        title={`${AISHA?.name} mentioned you`}
        description='"Can you confirm the bearing temperature before we restart?"'
        meta={`${BEARING_ORDER.id} · 26 min ago`}
        media={<PersonAvatar name={AISHA?.name ?? 'Aisha Khan'} />}
        unread
        actions={
          <>
            <Button variant="secondary" size="sm">
              Reply
            </Button>
            <Button variant="ghost" size="sm">
              View work order
            </Button>
          </>
        }
      />
    </ul>
  );
}

function NotificationItemAssignment() {
  return (
    <ul className="w-full">
      <NotificationItem
        title="Work order assigned to you"
        description={`${WORK_ORDERS[3].title}. Due in 2 days, estimated ${WORK_ORDERS[3].estimatedHours} hours.`}
        meta={`${WORK_ORDERS[3].id} · Assigned by ${LIV?.name} · 3 h ago`}
        media={
          <NotificationTile>
            <IconTool />
          </NotificationTile>
        }
        label={<Badge variant="secondary">{WORK_ORDERS[3].priority}</Badge>}
        unread
        onOpen={() => undefined}
      />
    </ul>
  );
}

function NotificationItemPipelineFailure() {
  return (
    <ul className="w-full">
      <NotificationItem
        title="Pipeline run failed"
        description="Compressor telemetry ingest stopped at step 3 of 5. The source returned no rows after 21:40."
        meta="Data pipelines · Yesterday 22:10"
        media={
          <NotificationTile>
            <IconRouteOff />
          </NotificationTile>
        }
        label={<Badge variant="error">Failed</Badge>}
        unread
        actions={
          <>
            <Button variant="secondary" size="sm">
              View run
            </Button>
            <Button variant="ghost" size="sm">
              Run again
            </Button>
          </>
        }
      />
    </ul>
  );
}

function NotificationItemSystem() {
  return (
    <ul className="w-full">
      <NotificationItem
        title="Maintenance scheduled for Saturday"
        description="The project is read-only from 02:00 to 04:00 CET. Ingestion continues and catches up afterwards."
        meta="System · Yesterday 09:00"
        media={
          <NotificationTile>
            <IconSettings />
          </NotificationTile>
        }
      />
    </ul>
  );
}

function NotificationItemReadStates() {
  const inbox = useNotificationInbox(INBOX.slice(0, 2));

  return (
    <div className="flex w-full flex-col gap-2">
      <ul className="flex w-full flex-col">
        {inbox.notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            meta={notification.meta}
            media={notification.media}
            unread={notification.unread}
            onMarkRead={() => inbox.markRead(notification.id)}
          />
        ))}
      </ul>
      <div className="flex min-h-7 items-center justify-between gap-4 px-2">
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {inbox.unreadCount} unread
        </span>
        {inbox.unreadCount < 2 ? (
          <Button variant="ghost" size="sm" onClick={inbox.reset}>
            Reset example
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function NotificationGroupedByDay() {
  const groups = ['Today', 'Yesterday'] as const;

  return (
    <div className="flex w-full flex-col gap-2">
      {groups.map((group) => (
        <section key={group} className="flex flex-col">
          <h4 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{group}</h4>
          <ul className="flex flex-col">
            {INBOX.filter((notification) => notification.group === group).map((notification) => (
              <NotificationItem
                key={notification.id}
                title={notification.title}
                meta={notification.meta}
                media={notification.media}
                label={notification.label}
                unread={notification.unread}
                onOpen={() => undefined}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function NotificationSeverityList() {
  const alarms = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged').slice(0, 4);

  return (
    <ul className="flex w-full flex-col">
      {alarms.map((alarm) => (
        <NotificationItem
          key={alarm.id}
          title={alarm.message}
          meta={`${alarm.value} · limit ${alarm.limit} · ${formatAgo(alarm.raisedAt)}`}
          label={<NotificationSeverity severity={alarm.severity} />}
          unread={alarm.state === 'active'}
          onOpen={() => undefined}
        />
      ))}
    </ul>
  );
}

function NotificationMarkAllRead() {
  const inbox = useNotificationInbox(INBOX);

  const markAll = () => {
    inbox.markAllRead();
    toast('All notifications marked as read', { action: { label: 'Undo', onClick: inbox.reset } });
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <header className="flex items-center justify-between gap-4 px-2">
        <h4 className="text-sm font-medium text-base-foreground">
          Inbox{' '}
          <span className="font-normal tabular-nums text-muted-foreground" aria-live="polite">
            · {inbox.unreadCount} unread
          </span>
        </h4>
        <Button variant="secondary" size="sm" disabled={inbox.unreadCount === 0} onClick={markAll}>
          <IconClipboardCheck /> Mark all as read
        </Button>
      </header>
      <ul className="flex flex-col">
        {inbox.notifications.slice(0, 4).map((notification) => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            meta={notification.meta}
            media={notification.media}
            label={notification.label}
            unread={notification.unread}
            onMarkRead={() => inbox.markRead(notification.id)}
          />
        ))}
      </ul>
      <SingleToaster />
    </div>
  );
}

function NotificationEmptyInbox() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconBell />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No notifications yet</EmptyStateTitle>
      <EmptyStateDescription>Alarms, mentions and work orders assigned to you appear here.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          Choose what to follow
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function NotificationPanelInline() {
  const inbox = useNotificationInbox(INBOX);

  return (
    <div className="w-full rounded-xl border border-default p-2">
      <NotificationPanel
        notifications={inbox.notifications}
        onOpen={inbox.markRead}
        onMarkRead={inbox.markRead}
        onMarkAllRead={inbox.markAllRead}
        footer={
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm">
              <IconSettings /> Notification settings
            </Button>
            <Button variant="ghost" size="sm" onClick={inbox.reset}>
              Reset example
            </Button>
          </div>
        }
      />
    </div>
  );
}

function NotificationPopoverPanel() {
  const inbox = useNotificationInbox(INBOX);

  return (
    <div className="flex flex-col items-center gap-2">
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline">
              <IconBell /> Open notifications
              {inbox.unreadCount > 0 ? <Badge variant="secondary">{inbox.unreadCount}</Badge> : null}
            </Button>
          }
        />
        <PopoverContent align="center" className="w-96 max-w-[calc(100vw-2rem)]">
          <div className="max-h-96 overflow-y-auto">
            <NotificationPanel
              notifications={inbox.notifications}
              onOpen={inbox.markRead}
              onMarkRead={inbox.markRead}
              onMarkAllRead={inbox.markAllRead}
            />
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {inbox.unreadCount === 0 ? 'Nothing unread' : `${inbox.unreadCount} unread`}
      </p>
    </div>
  );
}

function NotificationBell() {
  return (
    <div className="flex items-end gap-8">
      {[0, 3, 128].map((count) => (
        <div key={count} className="flex flex-col items-center gap-2">
          <NotificationBellButton count={count} />
          <span className="text-xs text-muted-foreground">{count === 0 ? 'None' : count === 3 ? '3 unread' : 'Over 99'}</span>
        </div>
      ))}
    </div>
  );
}

function NotificationTabCounts() {
  return (
    <Tabs defaultValue="alarms">
      <TabsList aria-label="Inbox sections">
        <TabsTrigger value="alarms" badge={4}>
          Alarms
        </TabsTrigger>
        <TabsTrigger value="mentions" badge={1}>
          Mentions
        </TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function NotificationPaused() {
  const [paused, setPaused] = useState(true);

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3 text-center">
      <NotificationTile>{paused ? <IconBellOff /> : <IconBell />}</NotificationTile>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">
          {paused ? 'Notifications paused until 15:00' : 'Notifications are on'}
        </p>
        <p className="text-sm text-muted-foreground">
          {paused ? 'Critical alarms still come through.' : 'You are notified about everything you follow.'}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => setPaused(!paused)}>
        {paused ? 'Resume now' : 'Pause for 1 hour'}
      </Button>
    </div>
  );
}

function NotificationToastAlarm() {
  const show = () =>
    toast.error(TEMPERATURE_ALARM.message, {
      description: `1st stage compressor · ${TEMPERATURE_ALARM.value}, limit ${TEMPERATURE_ALARM.limit}`,
      duration: 8000,
      action: { label: 'View alarm', onClick: () => undefined },
    });

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Raise example alarm
      </Button>
      <SingleToaster />
    </>
  );
}

function NotificationToastUndo() {
  const [archived, setArchived] = useState(false);

  const archive = () => {
    setArchived(true);
    toast('Notification archived', {
      duration: 8000,
      action: { label: 'Undo', onClick: () => setArchived(false) },
    });
  };

  return (
    <>
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {archived ? 'Inbox is empty.' : '"Pipeline run failed" is in your inbox.'}
        </p>
        {archived ? (
          <Button variant="ghost" size="sm" onClick={() => setArchived(false)}>
            Reset example
          </Button>
        ) : (
          <Button variant="secondary" onClick={archive}>
            Archive notification
          </Button>
        )}
      </div>
      <SingleToaster />
    </>
  );
}

function NotificationToastAssignment() {
  const show = () =>
    toast('Work order assigned to you', {
      description: `${WORK_ORDERS[3].id} · ${WORK_ORDERS[3].title}`,
      action: { label: 'Open', onClick: () => undefined },
    });

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Assign example work order
      </Button>
      <SingleToaster />
    </>
  );
}

function NotificationBannerAnnouncement() {
  const [version, setVersion] = useState(0);
  const [closed, setClosed] = useState(false);

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <Banner key={version} variant="info" inset onClose={() => setClosed(true)}>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Charts now compare two time ranges</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>View changes</BannerAction>
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>
      {closed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setVersion(version + 1);
            setClosed(false);
          }}
        >
          Show banner again
        </Button>
      ) : null}
    </div>
  );
}

function NotificationBannerMaintenance() {
  return (
    <div className="w-full">
      <Banner variant="warning" inset>
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Read-only Saturday 02:00 to 04:00 CET</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>View schedule</BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}

function NotificationStickyCritical() {
  const [acknowledged, setAcknowledged] = useState(false);
  const rows = ALARMS.slice(1);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="h-64 overflow-y-auto rounded-xl border border-default" tabIndex={0} role="region" aria-label="Alarm log">
        {acknowledged ? null : (
          <div className="sticky top-0 z-10 bg-base-background p-2">
            <Banner variant="destructive" inset>
              <BannerIcon icon={IconAlertCircleFilled} />
              <BannerTitle>
                <span className="truncate text-base-foreground">
                  {TRIP_ALARM.message}. {TRIP_ALARM.value}, limit {TRIP_ALARM.limit}.
                </span>
              </BannerTitle>
              <BannerActions>
                <BannerAction onClick={() => setAcknowledged(true)}>Acknowledge</BannerAction>
              </BannerActions>
            </Banner>
          </div>
        )}
        <ul className="flex flex-col px-4 py-2 text-sm">
          {rows.map((alarm) => (
            <li key={alarm.id} className="flex items-center gap-4 border-b border-default py-3 last:border-b-0">
              <span className="w-16 shrink-0">
                <NotificationSeverity severity={alarm.severity} />
              </span>
              <span className="min-w-0 flex-1 truncate text-base-foreground">{alarm.message}</span>
              <span className="hidden shrink-0 tabular-nums text-muted-foreground sm:inline">{alarm.sensorTag}</span>
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-h-7 items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">Scroll the log. The critical notice stays in view until it is acknowledged.</p>
        {acknowledged ? (
          <Button variant="ghost" size="sm" onClick={() => setAcknowledged(false)}>
            Reset example
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function NotificationDigestCard() {
  const summary = [
    { label: 'New alarms', value: 3 },
    { label: 'Mentions', value: 1 },
    { label: 'Work orders', value: 2 },
  ];

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl border border-default p-4">
      <header className="flex items-baseline justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">Since your last shift</h4>
        <span className="text-xs text-muted-foreground">Wed 22:00 to Thu 06:00</span>
      </header>
      <dl className="grid grid-cols-3 gap-4">
        {summary.map((entry) => (
          <div key={entry.label} className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{entry.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums text-base-foreground">{entry.value}</dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-col gap-2 border-t border-default pt-4 text-sm">
        {ALARMS.slice(0, 3).map((alarm) => (
          <li key={alarm.id} className="flex items-center gap-3">
            <span className="w-16 shrink-0">
              <NotificationSeverity severity={alarm.severity} />
            </span>
            <span className="min-w-0 flex-1 truncate text-medium-foreground">{alarm.message}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
          </li>
        ))}
      </ul>
      <div>
        <Button variant="secondary" size="sm">
          View all activity
        </Button>
      </div>
    </section>
  );
}

function NotificationPreferences() {
  const [alarms, setAlarms] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [digest, setDigest] = useState(false);

  return (
    <div className="flex w-full flex-col">
      <h4 className="pb-1 text-sm font-medium text-base-foreground">Notify me about</h4>
      <div className="flex flex-col divide-y divide-default">
        <SettingSwitchRow
          label="Critical alarms"
          disabledReason="Always on for control room operators."
          checked
          onCheckedChange={() => undefined}
        />
        <SettingSwitchRow
          label="High and medium alarms"
          description="For assets in the areas you follow."
          checked={alarms}
          onCheckedChange={setAlarms}
        />
        <SettingSwitchRow
          label="Mentions and assignments"
          description="When someone mentions you or assigns you a work order."
          checked={mentions}
          onCheckedChange={setMentions}
        />
        <SettingSwitchRow
          label="Shift digest by email"
          description="One summary at the start of each shift."
          checked={digest}
          onCheckedChange={setDigest}
        />
      </div>
    </div>
  );
}

export default definePage({
  id: 'notifications',
  title: 'Notifications',
  summary:
    'How the product tells people that something happened while they were looking elsewhere: inbox rows, a notification panel, toasts for events, banners for announcements, and the settings that keep it quiet.',
  guidance: {
    use: [
      'A row that leads with what happened, then where and when, and opens its subject.',
      'A severity label on alarm notifications; everything else stays neutral.',
      'A toast for an event the user can ignore, with one action to open or undo.',
      'A banner for announcements and a sticky notice only for what must be acknowledged.',
    ],
    avoid: [
      'Marking unread with colour alone, or counting things the user does not need to act on.',
      'A toast as the only record of something that needs action; it must also be in the inbox.',
      'Colouring every notification by type; status colour is for severity.',
      'A switch for critical alarms that looks optional when it is not.',
    ],
  },
  source,
  sections: [
    {
      id: 'items',
      title: 'Notification rows',
      description: 'One row per kind of event. The leading tile says the kind; only alarms and failures carry colour.',
      specimens: [
        {
          id: 'NotificationItemAlarm',
          title: 'Alarm',
          note: 'A process alarm: lead with the alarm text, label the severity and let it be acknowledged in the row.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx'],
          Component: NotificationItemAlarm,
        },
        {
          id: 'NotificationItemMention',
          title: 'Mention',
          note: 'A person addressed the user: show who, quote the line and offer to reply.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx', 'display/PersonAvatar.tsx'],
          Component: NotificationItemMention,
        },
        {
          id: 'NotificationItemAssignment',
          title: 'Assignment',
          note: 'Work landed on the user: name the work order, who assigned it and when it is due. The row opens it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx'],
          Component: NotificationItemAssignment,
        },
        {
          id: 'NotificationItemPipelineFailure',
          title: 'Pipeline failure',
          note: 'A background job failed: say where it stopped and offer the run log and a rerun.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx'],
          Component: NotificationItemPipelineFailure,
        },
        {
          id: 'NotificationItemSystem',
          title: 'System notice',
          note: 'The platform has news that needs no action: read state, no buttons.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx'],
          Component: NotificationItemSystem,
        },
        {
          id: 'NotificationItemReadStates',
          title: 'Unread and read',
          note: 'Unread rows carry a dot and a stronger title; marking as read is its own control. Click to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx'],
          Component: NotificationItemReadStates,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists',
      description: 'Rows put together into an inbox: grouped, labelled by severity, cleared in one go, or empty.',
      specimens: [
        {
          id: 'NotificationGroupedByDay',
          title: 'Grouped by day',
          note: 'An inbox that spans days: headings split it so timestamps can stay short.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx'],
          Component: NotificationGroupedByDay,
        },
        {
          id: 'NotificationSeverityList',
          title: 'Severity-labelled alarms',
          note: 'A feed of alarms only: the label carries severity, the meta line carries value and limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx'],
          Component: NotificationSeverityList,
        },
        {
          id: 'NotificationMarkAllRead',
          title: 'Mark all as read',
          note: 'Clearing the inbox in one action: confirm with a toast that can undo it. Click to try.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/states/NotificationItem.tsx', 'feedback/SingleToaster.tsx'],
          Component: NotificationMarkAllRead,
        },
        {
          id: 'NotificationEmptyInbox',
          title: 'Empty inbox',
          note: 'A new user with nothing yet: say what will appear and where to choose what to follow.',
          origin: 'custom',
          Component: NotificationEmptyInbox,
        },
      ],
    },
    {
      id: 'panel',
      title: 'Panel and entry points',
      description: 'The inbox as a panel with All and Unread tabs, and the controls that lead to it.',
      specimens: [
        {
          id: 'NotificationPanelInline',
          title: 'Notification panel',
          note: 'The inbox as a side panel: tabs for All and Unread, day groups, mark all as read. Click rows to try.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/states/NotificationPanel.tsx', 'patterns/states/NotificationItem.tsx'],
          Component: NotificationPanelInline,
        },
        {
          id: 'NotificationPopoverPanel',
          title: 'Panel in a popover',
          note: 'The usual home: a header button with the unread count opens the same panel. Click to open.',
          origin: 'custom',
          uses: ['patterns/states/NotificationPanel.tsx'],
          Component: NotificationPopoverPanel,
        },
        {
          id: 'NotificationBell',
          title: 'Bell with count',
          note: 'An icon-only entry point: no dot at zero, the number up to 99, then "99+".',
          origin: 'custom',
          Component: NotificationBell,
        },
        {
          id: 'NotificationTabCounts',
          title: 'Counts on tabs',
          note: 'An inbox split by kind: each tab shows how many unread it holds, and none when it is clear.',
          origin: 'custom',
          Component: NotificationTabCounts,
        },
        {
          id: 'NotificationPaused',
          title: 'Paused',
          note: 'Do-not-disturb is on: say until when, what still comes through, and how to resume.',
          origin: 'custom',
          Component: NotificationPaused,
        },
      ],
    },
    {
      id: 'toasts-and-banners',
      title: 'Toasts and banners',
      description: 'Events that reach the user outside the inbox, from a passing toast to a notice that will not scroll away.',
      specimens: [
        {
          id: 'NotificationToastAlarm',
          title: 'Alarm toast',
          note: 'A new alarm while the user works elsewhere: name it, give the value and link to it. Click to fire.',
          origin: 'custom',
          uses: ['feedback/SingleToaster.tsx'],
          Component: NotificationToastAlarm,
        },
        {
          id: 'NotificationToastUndo',
          title: 'Toast with undo',
          note: 'A notification was archived: confirm it and keep the way back open for a few seconds.',
          origin: 'custom',
          uses: ['feedback/SingleToaster.tsx'],
          Component: NotificationToastUndo,
        },
        {
          id: 'NotificationToastAssignment',
          title: 'Assignment toast',
          note: 'Something was assigned to the user just now: say what, with one action to open it.',
          origin: 'custom',
          uses: ['feedback/SingleToaster.tsx'],
          Component: NotificationToastAssignment,
        },
        {
          id: 'NotificationBannerAnnouncement',
          title: 'Announcement banner',
          note: 'Product news for everyone on the page: one line, one link, dismissible.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: NotificationBannerAnnouncement,
        },
        {
          id: 'NotificationBannerMaintenance',
          title: 'Scheduled maintenance banner',
          note: 'Something planned will limit the product: say when in local time and link to the schedule.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: NotificationBannerMaintenance,
        },
        {
          id: 'NotificationStickyCritical',
          title: 'Sticky critical notice',
          note: 'A trip that must be acknowledged: the notice stays at the top of the region while its content scrolls.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: NotificationStickyCritical,
        },
      ],
    },
    {
      id: 'digests-and-preferences',
      title: 'Digests and preferences',
      description: 'Fewer, better notifications: a summary instead of a stream, and settings that say what cannot be turned off.',
      specimens: [
        {
          id: 'NotificationDigestCard',
          title: 'Activity digest',
          note: 'The start of a shift: counts by kind and the three things that matter most, instead of thirty rows.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: NotificationDigestCard,
        },
        {
          id: 'NotificationPreferences',
          title: 'Notification preferences',
          note: 'Choosing what to be told about: one switch per kind, and a reason on the one that is locked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: NotificationPreferences,
        },
      ],
    },
  ],
});
