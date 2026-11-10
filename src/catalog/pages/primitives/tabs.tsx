import { Button } from '@cognite/aura/components/button';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Switch } from '@cognite/aura/components/switch';
import { Tabs, TabsLabel, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconAlertTriangle,
  IconBell,
  IconChartLine,
  IconFileText,
  IconGauge,
  IconLayoutDashboard,
  IconLock,
  IconPlus,
  IconSettings,
  IconTool,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { PageTabsHeader } from '../../../library/navigation/PageTabsHeader';
import { ALARMS, SENSORS, WORK_ORDERS, findAsset, sensorsOf } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './tabs.tsx?raw';

const COMPRESSOR_ID = '23-ka-9101';
const COMPRESSOR_ALARMS = ALARMS.filter((alarm) => alarm.assetId === COMPRESSOR_ID);
const COMPRESSOR_ORDERS = WORK_ORDERS.filter((order) => order.assetId === COMPRESSOR_ID);

function TabsBasic() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sensors">Sensors</TabsTrigger>
        <TabsTrigger value="alarms">Alarms</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsWithSeparator() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList showSeparator className="w-full">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sensors">Sensors</TabsTrigger>
        <TabsTrigger value="alarms">Alarms</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsFullWidth() {
  return (
    <Tabs defaultValue="day" className="w-full">
      <TabsList fullWidth showSeparator>
        <TabsTrigger value="day">Day</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsVertical() {
  return (
    <Tabs defaultValue="general" orientation="vertical">
      <TabsList orientation="vertical">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="access">Access</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsVerticalSeparator() {
  return (
    <Tabs defaultValue="general" orientation="vertical">
      <TabsList orientation="vertical" showSeparator className="pr-6">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="access">Access</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsSizes() {
  return (
    <div className="flex flex-col items-start gap-6">
      <Tabs defaultValue="trend">
        <TabsList size="small">
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs defaultValue="trend">
        <TabsList size="default">
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

function TabsWithIcons() {
  return (
    <Tabs defaultValue="overview">
      <TabsList size="default">
        <TabsTrigger value="overview">
          <IconLayoutDashboard /> Overview
        </TabsTrigger>
        <TabsTrigger value="trends">
          <IconChartLine /> Trends
        </TabsTrigger>
        <TabsTrigger value="maintenance">
          <IconTool /> Maintenance
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsWithCounts() {
  return (
    <Tabs defaultValue="sensors">
      <TabsList size="default">
        <TabsTrigger value="sensors" badge={sensorsOf(COMPRESSOR_ID).length}>
          Sensors
        </TabsTrigger>
        <TabsTrigger value="alarms" badge={COMPRESSOR_ALARMS.length}>
          Alarms
        </TabsTrigger>
        <TabsTrigger value="orders" badge={COMPRESSOR_ORDERS.length}>
          Work orders
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsWithTextBadge() {
  return (
    <Tabs defaultValue="trends">
      <TabsList size="default">
        <TabsTrigger value="trends">Trends</TabsTrigger>
        <TabsTrigger value="diagnostics" badge="Beta">
          Diagnostics
        </TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsIconsAndCounts() {
  return (
    <Tabs defaultValue="alarms">
      <TabsList size="default">
        <TabsTrigger value="alarms" badge={4}>
          <IconBell /> Alarms
        </TabsTrigger>
        <TabsTrigger value="orders" badge={23}>
          <IconTool /> Work orders
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsTruncatedLabels() {
  return (
    <Tabs defaultValue="first" className="w-full max-w-xs">
      <TabsList showSeparator className="w-full">
        <TabsTrigger value="first" className="max-w-32">
          <TabsLabel>1st stage compressor</TabsLabel>
        </TabsTrigger>
        <TabsTrigger value="second" className="max-w-32">
          <TabsLabel>2nd stage compressor</TabsLabel>
        </TabsTrigger>
        <TabsTrigger value="recompressor" className="max-w-32">
          <TabsLabel>Recompressor</TabsLabel>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function TabsScrollable() {
  return (
    <div className="w-full max-w-xs overflow-x-auto pb-2">
      <Tabs defaultValue={SENSORS[0].id}>
        <TabsList showSeparator>
          {sensorsOf(COMPRESSOR_ID).map((sensor) => (
            <TabsTrigger key={sensor.id} value={sensor.id}>
              {sensor.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function TabsDisabledWithReason() {
  return (
    <Tabs defaultValue="overview">
      <TabsList size="default">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
        <Tooltip>
          <TooltipTrigger
            render={
              <span tabIndex={0} className="inline-flex rounded-md">
                <TabsTrigger value="costs" disabled>
                  <IconLock /> Costs
                </TabsTrigger>
              </span>
            }
          />
          <TooltipContent>Cost data needs the Finance reader role.</TooltipContent>
        </Tooltip>
      </TabsList>
    </Tabs>
  );
}

function TabsControlled() {
  const steps = ['scope', 'isolation', 'approval'];
  const [step, setStep] = useState('scope');
  const index = steps.indexOf(step);

  return (
    <div className="flex flex-col items-center gap-4">
      <Tabs
        value={step}
        onValueChange={(next) => {
          if (typeof next === 'string') setStep(next);
        }}
      >
        <TabsList size="default">
          <TabsTrigger value="scope">Scope</TabsTrigger>
          <TabsTrigger value="isolation">Isolation</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => setStep(steps[index - 1])}>
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={index === steps.length - 1}
          onClick={() => setStep(steps[index + 1])}
        >
          Next section
        </Button>
      </div>
    </div>
  );
}

function TabsLoadingPanel() {
  return (
    <Tabs defaultValue="trends" className="flex w-full max-w-xs flex-col gap-4">
      <TabsList showSeparator className="w-full">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
      </TabsList>
      <TabsPanel value="overview" className="text-sm text-medium-foreground">
        1st stage compressor, running. Health score 72.
      </TabsPanel>
      <TabsPanel value="trends" aria-busy="true" className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-20 w-full" />
      </TabsPanel>
    </Tabs>
  );
}

function TabsEmptyPanel() {
  return (
    <Tabs defaultValue="documents" className="flex w-full max-w-xs flex-col gap-2">
      <TabsList showSeparator className="w-full">
        <TabsTrigger value="sensors" badge={6}>
          Sensors
        </TabsTrigger>
        <TabsTrigger value="documents" badge={0}>
          Documents
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="sensors" className="pt-2 text-sm text-medium-foreground">
        Six sensors report to this compressor.
      </TabsPanel>
      <TabsPanel value="documents">
        <EmptyState>
          <EmptyStateTitle as="h4">No documents linked</EmptyStateTitle>
          <EmptyStateDescription>Link a P&amp;ID or data sheet to find it here.</EmptyStateDescription>
        </EmptyState>
      </TabsPanel>
    </Tabs>
  );
}

function TabsKeepMounted() {
  return (
    <Tabs defaultValue="notes" className="flex w-full max-w-xs flex-col gap-3">
      <TabsList showSeparator className="w-full">
        <TabsTrigger value="notes">Handover notes</TabsTrigger>
        <TabsTrigger value="checklist">Checklist</TabsTrigger>
      </TabsList>
      <TabsPanel value="notes" keepMounted>
        <Label htmlFor="tabs-handover-notes">Notes for the night shift</Label>
        <Textarea id="tabs-handover-notes" defaultValue="Recompressor tripped at 13:46. Bearing inspection under way." />
      </TabsPanel>
      <TabsPanel value="checklist" keepMounted className="text-sm text-medium-foreground">
        Switch back: the draft is still there, because both panels stay mounted.
      </TabsPanel>
    </Tabs>
  );
}

function TabsInCard() {
  const asset = findAsset(COMPRESSOR_ID);

  return (
    <div className="w-full max-w-md rounded-xl bg-base-background p-4">
      <div className="mb-3">
        <h4 className="text-sm font-medium text-base-foreground">{asset?.name}</h4>
        <p className="font-mono text-xs text-muted-foreground">{asset?.tag}</p>
      </div>
      <Tabs defaultValue="alarms" className="flex flex-col gap-3">
        <TabsList showSeparator className="w-full">
          <TabsTrigger value="sensors" badge={sensorsOf(COMPRESSOR_ID).length}>
            Sensors
          </TabsTrigger>
          <TabsTrigger value="alarms" badge={COMPRESSOR_ALARMS.length}>
            Alarms
          </TabsTrigger>
          <TabsTrigger value="orders" badge={COMPRESSOR_ORDERS.length}>
            Work orders
          </TabsTrigger>
        </TabsList>
        <TabsPanel value="sensors">
          <ul className="flex flex-col gap-2 text-sm">
            {sensorsOf(COMPRESSOR_ID)
              .slice(0, 3)
              .map((sensor) => (
                <li key={sensor.id} className="flex justify-between gap-4">
                  <span className="text-base-foreground">{sensor.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {sensor.value} {sensor.unit}
                  </span>
                </li>
              ))}
          </ul>
        </TabsPanel>
        <TabsPanel value="alarms">
          <ul className="flex flex-col gap-2 text-sm">
            {COMPRESSOR_ALARMS.map((alarm) => (
              <li key={alarm.id} className="flex justify-between gap-4">
                <span className="text-base-foreground">{alarm.message}</span>
                <span className="shrink-0 text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
              </li>
            ))}
          </ul>
        </TabsPanel>
        <TabsPanel value="orders">
          <ul className="flex flex-col gap-2 text-sm">
            {COMPRESSOR_ORDERS.map((order) => (
              <li key={order.id} className="flex justify-between gap-4">
                <span className="text-base-foreground">{order.title}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{order.id}</span>
              </li>
            ))}
          </ul>
        </TabsPanel>
      </Tabs>
    </div>
  );
}

function TabsWithToolbarAction() {
  return (
    <Tabs defaultValue="open" className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-4 border-b border-default">
        <TabsList size="default">
          <TabsTrigger value="open" badge={3}>
            Open
          </TabsTrigger>
          <TabsTrigger value="planned" badge={2}>
            Planned
          </TabsTrigger>
          <TabsTrigger value="done" badge={2}>
            Done
          </TabsTrigger>
        </TabsList>
        <Button size="sm" variant="secondary">
          <IconPlus /> Create work order
        </Button>
      </div>
      <TabsPanel value="open" className="text-sm text-medium-foreground">
        Three work orders are open or in progress at Nordkapp.
      </TabsPanel>
      <TabsPanel value="planned" className="text-sm text-medium-foreground">
        Two work orders are planned for the next two weeks.
      </TabsPanel>
      <TabsPanel value="done" className="text-sm text-medium-foreground">
        Two work orders were closed this week.
      </TabsPanel>
    </Tabs>
  );
}

function TabsPageHeader() {
  const [tab, setTab] = useState('overview');
  const asset = findAsset(COMPRESSOR_ID);

  return (
    <PageTabsHeader
      title={asset?.name ?? ''}
      description={`${asset?.tag} · Gas compression · Criticality ${asset?.criticality}`}
      actions={
        <>
          <Button variant="ghost">Share</Button>
          <Button>Create work order</Button>
        </>
      }
      tabs={[
        { value: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
        { value: 'sensors', label: 'Sensors', icon: <IconGauge />, count: sensorsOf(COMPRESSOR_ID).length },
        { value: 'alarms', label: 'Alarms', icon: <IconAlertTriangle />, count: COMPRESSOR_ALARMS.length },
        { value: 'documents', label: 'Documents', icon: <IconFileText />, count: 1284 },
      ]}
      value={tab}
      onValueChange={setTab}
    >
      <TabsPanel value="overview" className="text-sm text-medium-foreground">
        Running at 9,840 rpm. Health score {asset?.healthScore}, watch: drive-end vibration is approaching its limit.
      </TabsPanel>
      <TabsPanel value="sensors" className="text-sm text-medium-foreground">
        Six sensors, all reporting with good quality.
      </TabsPanel>
      <TabsPanel value="alarms" className="text-sm text-medium-foreground">
        Two alarms: discharge temperature high, and drive-end vibration approaching limit.
      </TabsPanel>
      <TabsPanel value="documents" className="text-sm text-medium-foreground">
        1,284 documents are linked to this compressor and its parts.
      </TabsPanel>
    </PageTabsHeader>
  );
}

function TabsVerticalSettings() {
  return (
    <Tabs defaultValue="notifications" orientation="vertical" className="flex w-full gap-6">
      <TabsList orientation="vertical" size="default" showSeparator className="w-44 shrink-0 pr-4">
        <TabsTrigger value="general">
          <IconSettings /> General
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <IconBell /> Notifications
        </TabsTrigger>
        <TabsTrigger value="access">
          <IconUsers /> Access
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="general" className="min-w-0 flex-1 space-y-4">
        <div>
          <Label htmlFor="tabs-site-name">Site name</Label>
          <Input id="tabs-site-name" defaultValue="Nordkapp" />
        </div>
      </TabsPanel>
      <TabsPanel value="notifications" className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="tabs-critical">Critical alarms</Label>
          <Switch id="tabs-critical" defaultChecked />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="tabs-overdue">Overdue work orders</Label>
          <Switch id="tabs-overdue" defaultChecked />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="tabs-digest">Weekly digest</Label>
          <Switch id="tabs-digest" />
        </div>
      </TabsPanel>
      <TabsPanel value="access" className="min-w-0 flex-1 text-sm text-medium-foreground">
        Six people have access to this site.
      </TabsPanel>
    </Tabs>
  );
}

function TabsFullWidthPanel() {
  return (
    <Tabs defaultValue="values" className="flex w-full max-w-xs flex-col gap-3 rounded-xl bg-muted-background p-4">
      <TabsList fullWidth showSeparator>
        <TabsTrigger value="values">Values</TabsTrigger>
        <TabsTrigger value="limits">Limits</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsPanel value="values" className="flex justify-between text-sm">
        <span className="text-muted-foreground">Discharge pressure</span>
        <span className="tabular-nums text-base-foreground">48.6 barg</span>
      </TabsPanel>
      <TabsPanel value="limits" className="flex justify-between text-sm">
        <span className="text-muted-foreground">High limit</span>
        <span className="tabular-nums text-base-foreground">52.0 barg</span>
      </TabsPanel>
      <TabsPanel value="history" className="text-sm text-muted-foreground">
        No limit breaches in the last 30 days.
      </TabsPanel>
    </Tabs>
  );
}

export default definePage({
  id: 'tabs',
  title: 'Tabs',
  summary:
    'Tabs split related content into sections that share one place on the page. Exactly one panel shows at a time, and everything above the tabs stays put.',
  docsSlug: 'tabs',
  guidance: {
    use: [
      'Two to about six sections of one object or page that people switch between often.',
      'Short noun labels; counts as badges when the number helps decide where to go.',
      'Icons on every tab or on none.',
      'Page actions above the tabs, so they do not move when the tab changes.',
    ],
    avoid: [
      'Tabs as a filter over one list — use a segmented control or filter buttons.',
      'A single tab, or tabs for a yes/no choice.',
      'Nesting tabs inside a tab panel.',
      'Sections people need to compare side by side; show them together instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'layout',
      title: 'Layout',
      description: 'Horizontal or vertical, hugging the labels or spanning the container, with or without a rule.',
      specimens: [
        {
          id: 'TabsBasic',
          title: 'Horizontal',
          note: 'The default: small tabs that hug their labels, inside a card or panel.',
          origin: 'aura',
          Component: TabsBasic,
        },
        {
          id: 'TabsWithSeparator',
          title: 'With separator',
          note: 'Tabs that head a region: the rule shows where the tabbed content starts.',
          origin: 'aura',
          align: 'stretch',
          Component: TabsWithSeparator,
        },
        {
          id: 'TabsFullWidth',
          title: 'Full width',
          note: 'Narrow panels and mobile widths, where three or four tabs should fill the row.',
          origin: 'aura',
          align: 'stretch',
          Component: TabsFullWidth,
        },
        {
          id: 'TabsVertical',
          title: 'Vertical',
          note: 'More sections than fit in a row, or settings-style navigation beside the content.',
          origin: 'aura',
          Component: TabsVertical,
        },
        {
          id: 'TabsVerticalSeparator',
          title: 'Vertical with separator',
          note: 'A vertical list that sits directly against its panel and needs a dividing line.',
          origin: 'aura',
          Component: TabsVerticalSeparator,
        },
      ],
    },
    {
      id: 'size-and-content',
      title: 'Size and content',
      description: 'Two heights, with icons, counts and labels of unknown length.',
      specimens: [
        {
          id: 'TabsSizes',
          title: 'Sizes',
          note: 'Small (28px) inside cards and the topbar; default (36px) for page-level tabs.',
          origin: 'aura',
          Component: TabsSizes,
        },
        {
          id: 'TabsWithCounts',
          title: 'With counts',
          note: 'When the number of items behind a tab helps people decide whether to open it.',
          origin: 'aura',
          Component: TabsWithCounts,
        },
        {
          id: 'TabsWithTextBadge',
          title: 'With text badge',
          note: 'Flagging one tab as new or in beta. One badge at most, or it stops meaning anything.',
          origin: 'aura',
          Component: TabsWithTextBadge,
        },
        {
          id: 'TabsWithIcons',
          title: 'With icons',
          note: 'Sections of clearly different kinds; the icon speeds up recognition on return visits.',
          origin: 'aura',
          size: 'md',
          Component: TabsWithIcons,
        },
        {
          id: 'TabsIconsAndCounts',
          title: 'Icons and counts',
          note: 'Queue-like sections, where both the kind and the backlog matter.',
          origin: 'aura',
          size: 'md',
          Component: TabsIconsAndCounts,
        },
        {
          id: 'TabsTruncatedLabels',
          title: 'Truncated labels',
          note: 'Tabs named by data, such as equipment; the full name shows on hover.',
          origin: 'aura',
          Component: TabsTruncatedLabels,
        },
        {
          id: 'TabsScrollable',
          title: 'Scrolls sideways',
          note: 'A last resort when the number of tabs is not known; prefer vertical tabs past six.',
          origin: 'custom',
          Component: TabsScrollable,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Disabled tabs, controlled selection, and what a panel shows while it has nothing yet.',
      specimens: [
        {
          id: 'TabsDisabledWithReason',
          title: 'Disabled with reason',
          note: 'A section that exists but is not available to this user; the tooltip says why.',
          origin: 'custom',
          Component: TabsDisabledWithReason,
        },
        {
          id: 'TabsControlled',
          title: 'Controlled',
          note: 'When something other than the tabs can change the section, such as a Next button or the URL.',
          origin: 'aura',
          Component: TabsControlled,
        },
        {
          id: 'TabsKeepMounted',
          title: 'Keeps panel state',
          note: 'Panels with unsaved input: switching tabs must not throw the draft away.',
          origin: 'aura',
          Component: TabsKeepMounted,
        },
        {
          id: 'TabsLoadingPanel',
          title: 'Panel loading',
          note: 'Tabs stay usable while one panel fetches; the skeleton sits in the panel only.',
          origin: 'custom',
          Component: TabsLoadingPanel,
        },
        {
          id: 'TabsEmptyPanel',
          title: 'Empty panel',
          note: 'Keep the tab and explain the empty section, rather than hiding the tab.',
          origin: 'custom',
          Component: TabsEmptyPanel,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Tabs with their panels, in the places they usually head.',
      specimens: [
        {
          id: 'TabsFullWidthPanel',
          title: 'In a side panel',
          note: 'A narrow detail panel: full-width tabs, one fact group per tab.',
          origin: 'aura',
          Component: TabsFullWidthPanel,
        },
        {
          id: 'TabsWithToolbarAction',
          title: 'With an action on the row',
          note: 'A list page where the create action belongs to all tabs and stays in place.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: TabsWithToolbarAction,
        },
        {
          id: 'TabsInCard',
          title: 'In a card',
          note: 'An object summary with two or three facets; small tabs with counts under the title.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          Component: TabsInCard,
        },
        {
          id: 'TabsVerticalSettings',
          title: 'Settings navigation',
          note: 'Settings with many sections: vertical tabs on the left, the form on the right.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: TabsVerticalSettings,
        },
        {
          id: 'TabsPageHeader',
          title: 'Page header with tabs',
          note: 'The top of a detail page: title, actions and page-level tabs as one unit.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['navigation/PageTabsHeader.tsx'],
          Component: TabsPageHeader,
        },
      ],
    },
  ],
});
