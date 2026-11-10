import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconAlertTriangle,
  IconArchive,
  IconBell,
  IconCircleCheck,
  IconExternalLink,
  IconHexagon,
  IconInnerShadowTopLeft,
  IconLock,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { StatusBadge } from '../../../library/display/StatusBadge';
import { ALARMS, ASSETS, WORK_ORDERS } from '../../data/plant';
import type { Severity } from '../../data/plant';
import { definePage } from '../../types';

import source from './badge.tsx?raw';

const COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];

const SEVERITY_BADGE: Record<Severity, { label: string; variant: 'error' | 'warning' | 'archived' }> = {
  critical: { label: 'Critical', variant: 'error' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'archived' },
};

function BadgeSuccess() {
  return <Badge variant="success">Running</Badge>;
}

function BadgeWarning() {
  return <Badge variant="warning">Maintenance due</Badge>;
}

function BadgeError() {
  return <Badge variant="error">Tripped</Badge>;
}

function BadgeInProgress() {
  return <Badge variant="inProgress">In progress</Badge>;
}

function BadgeArchived() {
  return <Badge variant="archived">Decommissioned</Badge>;
}

function BadgeStatusWithIcon() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Badge variant="success">
        <IconCircleCheck /> Healthy
      </Badge>
      <Badge variant="inProgress">
        <IconInnerShadowTopLeft /> Syncing
      </Badge>
      <Badge variant="warning">
        <IconAlertTriangle /> Degraded
      </Badge>
      <Badge variant="error">
        <IconHexagon /> Failed
      </Badge>
      <Badge variant="archived">
        <IconArchive /> Archived
      </Badge>
    </div>
  );
}

function BadgeSecondary() {
  return <Badge variant="secondary">v2.4.1</Badge>;
}

function BadgeDecorative() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Badge variant="decorative-1">Site</Badge>
      <Badge variant="decorative-2">Compressor</Badge>
      <Badge variant="decorative-3">Pump</Badge>
      <Badge variant="decorative-4">Separator</Badge>
      <Badge variant="decorative-5">Exchanger</Badge>
      <Badge variant="decorative-6">Valve</Badge>
      <Badge variant="decorative-7">Turbine</Badge>
    </div>
  );
}

function BadgeOutline() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Badge variant="success" outline>
        Running
      </Badge>
      <Badge variant="warning" outline>
        Waiting
      </Badge>
      <Badge variant="error" outline>
        Tripped
      </Badge>
      <Badge variant="secondary" outline>
        Preventive
      </Badge>
    </div>
  );
}

function BadgeIconOnly() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge variant="secondary" size="icon" tabIndex={0} aria-label="Read-only data set">
            <IconLock />
          </Badge>
        }
      />
      <TooltipContent>Read-only data set</TooltipContent>
    </Tooltip>
  );
}

function BadgeDot() {
  return (
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1.5 text-sm text-base-foreground">
        <Badge variant="success" dot aria-hidden="true" /> Good
      </span>
      <span className="flex items-center gap-1.5 text-sm text-base-foreground">
        <Badge variant="warning" dot aria-hidden="true" /> Uncertain
      </span>
      <span className="flex items-center gap-1.5 text-sm text-base-foreground">
        <Badge variant="error" dot aria-hidden="true" /> Bad
      </span>
    </div>
  );
}

function BadgeDotCount() {
  return (
    <span className="flex items-center gap-2 text-sm text-base-foreground">
      Open work orders
      <Badge variant="secondary" dot>
        12
      </Badge>
    </span>
  );
}

function BadgeDotUrgent() {
  return (
    <span className="flex items-center gap-2 text-sm text-base-foreground">
      Unacknowledged alarms
      <Badge dot urgent>
        3
      </Badge>
    </span>
  );
}

function BadgeOnIconButton() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications, 3 unread" className="relative">
            <IconBell />
            <Badge dot urgent aria-hidden="true" className="absolute -top-1 -right-1">
              3
            </Badge>
          </Button>
        }
      />
      <TooltipContent>Notifications</TooltipContent>
    </Tooltip>
  );
}

function BadgeUnreadDot() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications, new activity" className="relative">
            <IconBell />
            <Badge dot urgent aria-hidden="true" className="absolute top-1.5 right-1.5" />
          </Button>
        }
      />
      <TooltipContent>Notifications</TooltipContent>
    </Tooltip>
  );
}

function BadgeClosable() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setVisible(true)}>
        Restore filter
      </Button>
    );
  }

  return (
    <Badge variant="closable" render={<button type="button" />} onClick={() => setVisible(false)}>
      Area: Gas compression <IconX aria-label="Remove filter" />
    </Badge>
  );
}

function BadgeTruncated() {
  return (
    <div className="flex w-full max-w-48 justify-center">
      <Badge variant="secondary" className="block max-w-full truncate" title="Nordkapp gas compression train A">
        Nordkapp gas compression train A
      </Badge>
    </div>
  );
}

function BadgeAsLink() {
  return (
    <Badge
      variant="secondary"
      render={<a href="https://docs.cognite.com/cdf/flows" target="_blank" rel="noreferrer" />}
    >
      WO-104482 <IconExternalLink />
    </Badge>
  );
}

function BadgeFilterTags() {
  const [tags, setTags] = useState(['Corrective', 'Priority P1', 'Gas compression', 'Due this week']);

  return (
    <div className="flex w-full max-w-sm flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="closable"
          render={<button type="button" />}
          onClick={() => setTags(tags.filter((other) => other !== tag))}
        >
          {tag} <IconX aria-label="Remove" />
        </Badge>
      ))}
      {tags.length === 0 ? <span className="text-sm text-muted-foreground">No filters applied.</span> : null}
      {tags.length < 4 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTags(['Corrective', 'Priority P1', 'Gas compression', 'Due this week'])}
        >
          Reset
        </Button>
      ) : null}
    </div>
  );
}

function BadgeTagOverflow() {
  const labels = ['Vibration', 'Bearing', 'Rotating equipment', 'Shutdown scope', 'Safety critical'];
  const shown = labels.slice(0, 2);
  const hidden = labels.slice(2);

  return (
    <div className="flex items-center gap-1.5">
      {shown.map((label) => (
        <Badge key={label} variant="secondary">
          {label}
        </Badge>
      ))}
      <Tooltip>
        <TooltipTrigger
          render={
            <Badge variant="secondary" outline tabIndex={0} aria-label={`${hidden.length} more: ${hidden.join(', ')}`}>
              +{hidden.length}
            </Badge>
          }
        />
        <TooltipContent>{hidden.join(', ')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function BadgeStatusMapped() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <StatusBadge status="running" />
      <StatusBadge status="standby" />
      <StatusBadge status="maintenance" />
      <StatusBadge status="tripped" />
    </div>
  );
}

function BadgeStatusMappedOutline() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <StatusBadge status="open" outline />
      <StatusBadge status="planned" outline />
      <StatusBadge status="in-progress" outline />
      <StatusBadge status="waiting" outline />
      <StatusBadge status="done" outline />
    </div>
  );
}

function BadgeNextToTitle() {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-xl font-semibold text-base-foreground">Anomaly detection</h3>
      <Badge variant="inProgress">Beta</Badge>
    </div>
  );
}

function BadgeAssetHeader() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{COMPRESSOR.tag}</span>
        <Badge variant="decorative-2">Compressor</Badge>
      </div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-xl font-semibold text-base-foreground">{COMPRESSOR.name}</h3>
        <StatusBadge status={COMPRESSOR.state} />
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Criticality {COMPRESSOR.criticality}</Badge>
        <Badge variant="warning">
          <IconAlertTriangle /> Health {COMPRESSOR.healthScore}
        </Badge>
      </div>
    </div>
  );
}

function BadgeInTabs() {
  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active" badge={<Badge variant="secondary">4</Badge>}>
          Active
        </TabsTrigger>
        <TabsTrigger value="acknowledged" badge={<Badge variant="secondary">2</Badge>}>
          Acknowledged
        </TabsTrigger>
        <TabsTrigger value="cleared">Cleared</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function BadgeWorkOrderRows() {
  return (
    <ul className="flex w-full flex-col gap-3">
      {WORK_ORDERS.slice(0, 5).map((order) => (
        <li key={order.id} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">{order.id}</span>
          <span className="min-w-0 flex-1 truncate text-base-foreground">{order.title}</span>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {order.priority}
          </Badge>
          <span className="flex w-28 shrink-0 justify-end">
            <StatusBadge status={order.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function BadgeAlarmSeverity() {
  return (
    <ul className="flex w-full flex-col gap-3">
      {ALARMS.slice(0, 4).map((alarm) => (
        <li key={alarm.id} className="flex items-center gap-3 text-sm">
          <span className="flex w-16 shrink-0">
            <Badge variant={SEVERITY_BADGE[alarm.severity].variant}>{SEVERITY_BADGE[alarm.severity].label}</Badge>
          </span>
          <span className="min-w-0 flex-1 truncate text-base-foreground">{alarm.message}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{alarm.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default definePage({
  id: 'badge',
  title: 'Badge',
  summary:
    'A badge is a compact label for the status, category or count of the thing it sits next to. It informs at a glance and never takes focus from the page.',
  docsSlug: 'badge',
  guidance: {
    use: [
      'Status variants when the badge says how something is doing: success, warning, error, in progress, archived.',
      'Decorative variants for categories and tags that carry no status.',
      'Secondary for counts, versions and other low-emphasis metadata.',
      'One or two words; add an icon so status survives without colour.',
    ],
    avoid: [
      'Decorative colour for status, or status colour for decoration.',
      'A badge for a message that needs explaining or a way to recover — use an Alert.',
      'A badge as the primary action; it may be removable or link, but it is not a button.',
      'More than two or three badges on one row.',
    ],
  },
  source,
  sections: [
    {
      id: 'status',
      title: 'Status',
      description: 'Five semantic variants. Pick by what the state means, and keep the mapping the same everywhere.',
      specimens: [
        {
          id: 'BadgeSuccess',
          title: 'Success',
          note: 'Healthy, running, completed or within limits.',
          origin: 'aura',
          Component: BadgeSuccess,
        },
        {
          id: 'BadgeWarning',
          title: 'Warning',
          note: 'Needs attention soon but is still working.',
          origin: 'aura',
          Component: BadgeWarning,
        },
        {
          id: 'BadgeError',
          title: 'Error',
          note: 'Failed, tripped or outside limits; someone has to act.',
          origin: 'aura',
          Component: BadgeError,
        },
        {
          id: 'BadgeInProgress',
          title: 'In progress',
          note: 'Neutral, ongoing work: syncing, planned, being processed.',
          origin: 'aura',
          Component: BadgeInProgress,
        },
        {
          id: 'BadgeArchived',
          title: 'Archived',
          note: 'No longer active: archived, closed, draft or decommissioned.',
          origin: 'aura',
          Component: BadgeArchived,
        },
        {
          id: 'BadgeStatusWithIcon',
          title: 'Status with icon',
          note: 'Anywhere status must be readable without relying on colour.',
          origin: 'aura',
          Component: BadgeStatusWithIcon,
        },
      ],
    },
    {
      id: 'categories-and-style',
      title: 'Categories and style',
      description: 'Labels that classify rather than judge, and the quieter treatments.',
      specimens: [
        {
          id: 'BadgeSecondary',
          title: 'Secondary',
          note: 'Versions, counts and metadata that should stay in the background.',
          origin: 'aura',
          Component: BadgeSecondary,
        },
        {
          id: 'BadgeDecorative',
          title: 'Decorative categories',
          note: 'Tells categories apart, such as asset types; the colours mean nothing by themselves.',
          origin: 'aura',
          Component: BadgeDecorative,
        },
        {
          id: 'BadgeOutline',
          title: 'Outline',
          note: 'Status in dense tables where a column of filled badges would be too loud.',
          origin: 'aura',
          Component: BadgeOutline,
        },
        {
          id: 'BadgeIconOnly',
          title: 'Icon only',
          note: 'A well-known marker, such as locked, where there is no room for a word.',
          origin: 'aura',
          Component: BadgeIconOnly,
        },
        {
          id: 'BadgeTruncated',
          title: 'Truncated label',
          note: 'User-generated labels of unknown length in a fixed-width column.',
          origin: 'aura',
          Component: BadgeTruncated,
        },
      ],
    },
    {
      id: 'dots-and-counts',
      title: 'Dots and counts',
      description: 'The dot style: an empty badge is an 8px status dot, a number makes it a count pill.',
      specimens: [
        {
          id: 'BadgeDot',
          title: 'Status dot',
          note: 'The lightest status signal, beside a label that names the state.',
          origin: 'aura',
          Component: BadgeDot,
        },
        {
          id: 'BadgeDotCount',
          title: 'Count',
          note: 'A neutral number of items next to a label.',
          origin: 'aura',
          Component: BadgeDotCount,
        },
        {
          id: 'BadgeDotUrgent',
          title: 'Urgent count',
          note: 'A count that wants action now, such as unacknowledged alarms.',
          origin: 'aura',
          Component: BadgeDotUrgent,
        },
        {
          id: 'BadgeOnIconButton',
          title: 'Count on an icon button',
          note: 'Unread notifications on a topbar action; the count is also in the button name.',
          origin: 'aura',
          Component: BadgeOnIconButton,
        },
        {
          id: 'BadgeUnreadDot',
          title: 'Unread dot on an icon button',
          note: 'Something is new but the exact number does not matter.',
          origin: 'aura',
          Component: BadgeUnreadDot,
        },
      ],
    },
    {
      id: 'interactive',
      title: 'Interactive',
      description: 'Badges that can be removed, followed or expanded.',
      specimens: [
        {
          id: 'BadgeClosable',
          title: 'Removable',
          note: 'An applied filter or tag the user can take away. Click to try.',
          origin: 'aura',
          Component: BadgeClosable,
        },
        {
          id: 'BadgeAsLink',
          title: 'Rendered as a link',
          note: 'A reference to another record, such as a work order ID.',
          origin: 'aura',
          Component: BadgeAsLink,
        },
        {
          id: 'BadgeTagOverflow',
          title: 'Tags with overflow',
          note: 'More tags than the cell can hold; the "+N" lists the rest on hover and focus.',
          origin: 'aura',
          Component: BadgeTagOverflow,
        },
        {
          id: 'BadgeFilterTags',
          title: 'Applied filters',
          note: 'The filters behind a result list, each removable, with one reset.',
          origin: 'aura',
          size: 'md',
          Component: BadgeFilterTags,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Badges on the entities whose state they describe.',
      specimens: [
        {
          id: 'BadgeStatusMapped',
          title: 'Run state from data',
          note: 'Maps a status value to variant, icon and label in one place, so screens never disagree.',
          origin: 'custom',
          uses: ['display/StatusBadge.tsx'],
          Component: BadgeStatusMapped,
        },
        {
          id: 'BadgeStatusMappedOutline',
          title: 'Workflow status, outlined',
          note: 'The same mapping in its quieter style for long tables.',
          origin: 'custom',
          uses: ['display/StatusBadge.tsx'],
          Component: BadgeStatusMappedOutline,
        },
        {
          id: 'BadgeNextToTitle',
          title: 'Next to a title',
          note: 'Marks a feature or page as beta, new or draft.',
          origin: 'aura',
          Component: BadgeNextToTitle,
        },
        {
          id: 'BadgeInTabs',
          title: 'In tabs',
          note: 'How many items wait behind each tab.',
          origin: 'aura',
          size: 'md',
          Component: BadgeInTabs,
        },
        {
          id: 'BadgeAssetHeader',
          title: 'Asset header',
          note: 'Type, run state and health on one record: decorative for the category, status for the state.',
          origin: 'custom',
          size: 'md',
          uses: ['display/StatusBadge.tsx'],
          Component: BadgeAssetHeader,
        },
        {
          id: 'BadgeWorkOrderRows',
          title: 'Status column',
          note: 'Per-row status in a list or table, right-aligned so it scans as a column.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: BadgeWorkOrderRows,
        },
        {
          id: 'BadgeAlarmSeverity',
          title: 'Severity column',
          note: 'Leads each alarm with its severity; one alert above would summarise, the badge marks each row.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: BadgeAlarmSeverity,
        },
      ],
    },
  ],
});
