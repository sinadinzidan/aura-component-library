import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSectionHeader,
  ItemSectionHeaderTitle,
  ItemTitle,
} from '@cognite/aura/components/item';
import { Progress } from '@cognite/aura/components/progress';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tabs, TabsLabel, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowRight,
  IconArrowsMaximize,
  IconChartLine,
  IconChevronDown,
  IconChevronUp,
  IconDots,
  IconEngine,
  IconFileText,
  IconPin,
  IconSitemap,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { FormField } from '../../../library/forms/FormField';
import { InlineEditText } from '../../../library/forms/InlineEditText';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { healthStatus, severityStatus, toneFromLimits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { InfoTooltip } from '../../../library/overlays/InfoTooltip';
import { CollapsibleSection } from '../../../library/patterns/structure/CollapsibleSection';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import type { Property } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { ALARMS, ASSETS, PEOPLE, SENSORS, WORK_ORDERS } from '../../data/plant';
import type { Asset, Sensor } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatDateTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './detail-panels.tsx?raw';

const COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];
const AREA = ASSETS.find((asset) => asset.id === COMPRESSOR.parentId) ?? ASSETS[0];
const EQUIPMENT = ASSETS.filter((asset) => asset.parentId === AREA.id);
const READINGS = SENSORS.filter((sensor) => sensor.assetId === COMPRESSOR.id);
const PRESSURE = READINGS[0];
const ORDER = WORK_ORDERS[0];
const ASSET_ORDERS = WORK_ORDERS.filter((order) => order.assetId === COMPRESSOR.id || order.assetId === '23-ka-9103');
const ALARM = ALARMS[1];
const ALARM_SENSOR = SENSORS.find((sensor) => sensor.tag === ALARM.sensorTag) ?? SENSORS[0];
const TECHNICIAN = PEOPLE[3];
const ENGINEER = PEOPLE[2];
const OPERATOR = PEOPLE[0];

const ASSET_PROPERTIES: readonly Property[] = [
  { label: 'Type', value: 'Centrifugal compressor' },
  { label: 'Area', value: AREA.name },
  { label: 'Criticality', value: COMPRESSOR.criticality },
  { label: 'Manufacturer', value: 'Nordic Turbo' },
  { label: 'Model' },
  { label: 'Commissioned', value: '14 Jun 2014' },
  { label: 'Last inspection', value: formatDate(REFERENCE_NOW - 41 * DAY) },
];

const LIMIT_PROPERTIES: readonly Property[] = [
  { label: 'Discharge pressure', value: '40.0 to 52.0 barg' },
  { label: 'Discharge temperature', value: '90.0 to 145.0 °C' },
  { label: 'Drive-end vibration', value: 'Up to 7.1 mm/s' },
];

const MAINTENANCE_PROPERTIES: readonly Property[] = [
  { label: 'Strategy', value: 'Condition based' },
  { label: 'Next overhaul', value: 'Sep 2026' },
  { label: 'Open work orders', value: 1 },
];

const sensorLimits = (sensor: Sensor) => ({ low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });

/** 48 hourly values that end on the sensor's current value. */
const sensorTrend = (sensor: Sensor): number[] => [
  ...makeValues({
    seed: sensor.seed,
    points: 47,
    base: sensor.value,
    amplitude: (sensor.highLimit - sensor.lowLimit) * 0.05,
    noise: (sensor.highLimit - sensor.lowLimit) * 0.03,
    cycles: 2,
    decimals: sensor.decimals,
  }),
  sensor.value,
];

/** Gives a panel the height it would get from the page column it sits in. */
function DetailPanelFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto h-104 w-full max-w-md">{children}</div>;
}

/** An icon-only header action with its tooltip. */
function DetailPanelIconAction({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** The record icon in a panel header. */
function DetailPanelRecordIcon({ children }: { children: ReactNode }) {
  return (
    <Avatar variant="overflow" aria-hidden="true">
      <AvatarIcon>{children}</AvatarIcon>
    </Avatar>
  );
}

/** One reading: name and tag, a small trend and the current value coloured only when abnormal. */
function DetailPanelReading({ sensor }: { sensor: Sensor }) {
  return (
    <li className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-base-foreground">{sensor.name}</p>
        <p className="truncate text-xs text-muted-foreground">{sensor.tag}</p>
      </div>
      <div className="w-16 shrink-0">
        <Sparkline values={sensorTrend(sensor)} label={`${sensor.name}, last 48 hours`} unit={sensor.unit} height={24} />
      </div>
      <div className="flex w-24 shrink-0 justify-end">
        <ValueReadout
          value={sensor.value}
          unit={sensor.unit}
          decimals={sensor.decimals}
          size="xs"
          tone={toneFromLimits(sensor.value, sensorLimits(sensor))}
        />
      </div>
    </li>
  );
}

function DetailPanelPropertyList() {
  return (
    <DetailPanelFrame>
      <SidePanel title={COMPRESSOR.name} description={COMPRESSOR.tag}>
        <PropertyList items={ASSET_PROPERTIES} />
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelStacked() {
  return (
    <DetailPanelFrame>
      <SidePanel title={PRESSURE.name} description={PRESSURE.tag}>
        <PropertyList
          layout="stacked"
          items={[
            {
              label: 'Description',
              value: 'Pressure at the 1st stage compressor discharge flange, downstream of the anti-surge take-off.',
            },
            { label: 'Asset', value: `${COMPRESSOR.tag} · ${COMPRESSOR.name}` },
            { label: 'Unit', value: PRESSURE.unit },
            { label: 'Source', value: 'Process historian, 1 s samples' },
            { label: 'Operating range', value: `${PRESSURE.lowLimit} to ${PRESSURE.highLimit} ${PRESSURE.unit}` },
          ]}
        />
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelCopyable() {
  return (
    <DetailPanelFrame>
      <SidePanel title={PRESSURE.name} description="Time series">
        <PropertyList
          items={[
            {
              label: 'External ID',
              value: <span className="font-mono text-xs">{PRESSURE.tag}</span>,
              hint: <InfoTooltip label="About external ID">The ID this time series has in the source system.</InfoTooltip>,
              action: <CopyButton text={PRESSURE.tag} label="Copy external ID" iconOnly variant="ghost" size="icon-sm" />,
            },
            {
              label: 'Internal ID',
              value: <span className="font-mono text-xs tabular-nums">7302914458120</span>,
              action: <CopyButton text="7302914458120" label="Copy internal ID" iconOnly variant="ghost" size="icon-sm" />,
            },
            {
              label: 'Data set',
              value: <span className="font-mono text-xs">nordkapp-historian</span>,
              action: <CopyButton text="nordkapp-historian" label="Copy data set ID" iconOnly variant="ghost" size="icon-sm" />,
            },
            { label: 'Unit', value: PRESSURE.unit },
            { label: 'Step series', value: 'No' },
            { label: 'Created', value: '2 Mar 2021' },
          ]}
        />
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelGrouped() {
  return (
    <DetailPanelFrame>
      <SidePanel title={COMPRESSOR.name} description={COMPRESSOR.tag}>
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionHeader size="sm" as="h3" title="General" />
            <PropertyList items={ASSET_PROPERTIES.slice(0, 4)} />
          </section>
          <section className="flex flex-col gap-3">
            <SectionHeader size="sm" as="h3" title="Operating limits" />
            <PropertyList items={LIMIT_PROPERTIES} />
          </section>
          <section className="flex flex-col gap-3">
            <SectionHeader size="sm" as="h3" title="Maintenance" />
            <PropertyList items={MAINTENANCE_PROPERTIES} />
          </section>
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelCollapsibleGroups() {
  return (
    <DetailPanelFrame>
      <SidePanel title={COMPRESSOR.name} description={COMPRESSOR.tag} flush>
        <div className="flex flex-col gap-1 p-2">
          <CollapsibleSection title="General">
            <div className="px-3 pb-3 text-base-foreground">
              <PropertyList items={ASSET_PROPERTIES.slice(0, 4)} />
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="Operating limits" count={LIMIT_PROPERTIES.length} defaultOpen={false}>
            <div className="px-3 pb-3 text-base-foreground">
              <PropertyList items={LIMIT_PROPERTIES} />
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="Maintenance" count={MAINTENANCE_PROPERTIES.length} defaultOpen={false}>
            <div className="px-3 pb-3 text-base-foreground">
              <PropertyList items={MAINTENANCE_PROPERTIES} />
            </div>
          </CollapsibleSection>
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelWithTabs() {
  return (
    <DetailPanelFrame>
      <Tabs defaultValue="properties" className="h-full">
        <SidePanel
          title={COMPRESSOR.name}
          description={COMPRESSOR.tag}
          toolbar={
            <TabsList showSeparator className="w-full">
              <TabsTrigger value="properties">
                <TabsLabel>Properties</TabsLabel>
              </TabsTrigger>
              <TabsTrigger value="readings" badge={String(READINGS.length)}>
                <TabsLabel>Readings</TabsLabel>
              </TabsTrigger>
              <TabsTrigger value="work" badge={String(ASSET_ORDERS.length)}>
                <TabsLabel>Work</TabsLabel>
              </TabsTrigger>
            </TabsList>
          }
        >
          <TabsPanel value="properties">
            <PropertyList items={ASSET_PROPERTIES} />
          </TabsPanel>
          <TabsPanel value="readings">
            <ul className="flex flex-col gap-4">
              {READINGS.map((sensor) => (
                <DetailPanelReading key={sensor.id} sensor={sensor} />
              ))}
            </ul>
          </TabsPanel>
          <TabsPanel value="work">
            <ul className="flex flex-col gap-4">
              {ASSET_ORDERS.map((order) => (
                <li key={order.id} className="flex flex-col gap-1">
                  <p className="text-sm text-base-foreground">{order.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.id} · Due {formatDate(order.dueAt)}
                  </p>
                </li>
              ))}
            </ul>
          </TabsPanel>
        </SidePanel>
      </Tabs>
    </DetailPanelFrame>
  );
}

function DetailPanelHeaderActions() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <DetailPanelFrame>
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Panel closed.</p>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Reopen panel
          </Button>
        </div>
      </DetailPanelFrame>
    );
  }

  return (
    <DetailPanelFrame>
      <SidePanel
        leading={
          <DetailPanelRecordIcon>
            <IconEngine />
          </DetailPanelRecordIcon>
        }
        title={COMPRESSOR.name}
        description={COMPRESSOR.tag}
        actions={
          <>
            <DetailPanelIconAction label="Open full page">
              <IconArrowsMaximize />
            </DetailPanelIconAction>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${COMPRESSOR.tag}`}>
                          <IconDots />
                        </Button>
                      }
                    />
                  }
                />
                <TooltipContent>More actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Copy link to asset</DropdownMenuItem>
                <DropdownMenuItem>Show in hierarchy</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Create work order</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        onClose={() => setOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div>
            <StatusBadge status={COMPRESSOR.state} />
          </div>
          <PropertyList items={ASSET_PROPERTIES.slice(0, 5)} />
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelStickyFooter() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <DetailPanelFrame>
      <SidePanel
        title={ALARM.message}
        description={`${ALARM.sensorTag} · Raised ${formatAgo(ALARM.raisedAt)}`}
        footer={
          acknowledged ? (
            <>
              <span role="status" className="mr-auto text-sm text-muted-foreground">
                Acknowledged by you
              </span>
              <Button variant="secondary" onClick={() => setAcknowledged(false)}>
                Undo
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary">Shelve for 1 hour</Button>
              <Button onClick={() => setAcknowledged(true)}>Acknowledge</Button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-6">
          <PropertyList
            items={[
              { label: 'Severity', value: <StatusIndicator {...severityStatus(ALARM.severity)} /> },
              { label: 'Value', value: <span className="tabular-nums">{ALARM.value}</span> },
              { label: 'Limit', value: <span className="tabular-nums">{ALARM.limit}</span> },
              { label: 'Asset', value: `${COMPRESSOR.tag} · ${COMPRESSOR.name}` },
            ]}
          />
          <section className="flex flex-col gap-2">
            <SectionHeader size="sm" as="h3" title="Operator guidance" />
            <p className="text-sm text-medium-foreground">
              Check the interstage cooler outlet temperature and cooling water flow. If the temperature keeps rising,
              reduce load on train 1 and notify the shift supervisor before it reaches the trip limit of 155 °C.
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <SectionHeader size="sm" as="h3" title="Likely causes" />
            <p className="text-sm text-medium-foreground">
              Fouled cooler tube bundle, low cooling water flow, or a recycle valve that is partly open.
            </p>
          </section>
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelRecordNavigation() {
  const [index, setIndex] = useState(0);
  const order = WORK_ORDERS[index];
  const asset = ASSETS.find((candidate) => candidate.id === order.assetId) ?? ASSETS[0];
  const assignee = PEOPLE.find((person) => person.id === order.assigneeId);

  return (
    <DetailPanelFrame>
      <SidePanel
        title={order.id}
        description={`${index + 1} of ${WORK_ORDERS.length} in the list`}
        actions={
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span tabIndex={index === 0 ? 0 : undefined} className="rounded-lg outline-none focus-visible:shadow-focus-ring">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Previous work order"
                      disabled={index === 0}
                      onClick={() => setIndex((current) => current - 1)}
                    >
                      <IconChevronUp />
                    </Button>
                  </span>
                }
              />
              <TooltipContent>{index === 0 ? 'This is the first work order' : 'Previous work order'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    tabIndex={index === WORK_ORDERS.length - 1 ? 0 : undefined}
                    className="rounded-lg outline-none focus-visible:shadow-focus-ring"
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Next work order"
                      disabled={index === WORK_ORDERS.length - 1}
                      onClick={() => setIndex((current) => current + 1)}
                    >
                      <IconChevronDown />
                    </Button>
                  </span>
                }
              />
              <TooltipContent>
                {index === WORK_ORDERS.length - 1 ? 'This is the last work order' : 'Next work order'}
              </TooltipContent>
            </Tooltip>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-base-foreground">{order.title}</p>
          <PropertyList
            items={[
              { label: 'Status', value: <StatusBadge status={order.status} /> },
              { label: 'Priority', value: order.priority },
              { label: 'Asset', value: asset.tag },
              { label: 'Assignee', value: assignee?.name },
              { label: 'Due', value: formatDateTime(order.dueAt) },
            ]}
          />
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelEditable() {
  const [name, setName] = useState('Compression overview');
  const [owner, setOwner] = useState(ENGINEER.name);
  const [refresh, setRefresh] = useState('30 seconds');

  return (
    <DetailPanelFrame>
      <SidePanel title="Dashboard settings" description="Changes are saved as you make them.">
        <PropertyList
          items={[
            { label: 'Name', value: <InlineEditText value={name} onSave={setName} label="dashboard name" /> },
            { label: 'Owner', value: <InlineEditText value={owner} onSave={setOwner} label="owner" /> },
            { label: 'Refresh every', value: <InlineEditText value={refresh} onSave={setRefresh} label="refresh interval" /> },
            { label: 'Created', value: '4 Nov 2025' },
            { label: 'Last edited', value: formatAgo(REFERENCE_NOW - 3 * HOUR) },
          ]}
        />
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelEditForm() {
  const [title, setTitle] = useState(ORDER.title);
  const [hours, setHours] = useState(String(ORDER.estimatedHours));
  const dirty = title !== ORDER.title || hours !== String(ORDER.estimatedHours);
  const reset = () => {
    setTitle(ORDER.title);
    setHours(String(ORDER.estimatedHours));
  };

  return (
    <DetailPanelFrame>
      <SidePanel
        title={`Edit ${ORDER.id}`}
        description="Work order"
        footer={
          <>
            <span role="status" className="mr-auto text-sm text-muted-foreground">
              {dirty ? 'Unsaved changes' : 'No changes yet'}
            </span>
            <Button variant="ghost" onClick={reset}>
              Discard
            </Button>
            <Button onClick={reset}>Save changes</Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          <FormField label="Title" required>
            {(control) => <Input {...control} value={title} onChange={(event) => setTitle(event.target.value)} />}
          </FormField>
          <FormField label="Estimated hours">
            {(control) => <Input {...control} type="number" value={hours} onChange={(event) => setHours(event.target.value)} />}
          </FormField>
          <FormField label="Notes" optional helper="Shown to the technician on the job card.">
            {(control) => <Textarea {...control} rows={3} defaultValue="Isolate and depressurise before opening the bearing housing." />}
          </FormField>
        </form>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelAsset() {
  return (
    <DetailPanelFrame>
      <SidePanel
        leading={
          <DetailPanelRecordIcon>
            <IconEngine />
          </DetailPanelRecordIcon>
        }
        title={COMPRESSOR.name}
        description={`${COMPRESSOR.tag} · ${AREA.name}`}
        status={<StatusBadge status={COMPRESSOR.state} />}
        footer={
          <>
            <Button variant="secondary">Open trend</Button>
            <Button>Create work order</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionHeader
              size="sm"
              as="h3"
              title="Health"
              actions={<StatusIndicator {...healthStatus(COMPRESSOR.health)} size="sm" />}
            />
            <LinearGauge
              label="Health score"
              value={COMPRESSOR.healthScore}
              min={0}
              max={100}
              zones={[
                { from: 0, to: 50, tone: 'critical' },
                { from: 50, to: 80, tone: 'warning' },
                { from: 80, to: 100, tone: 'neutral' },
              ]}
              showScale
            />
          </section>
          <section className="flex flex-col gap-3">
            <SectionHeader size="sm" as="h3" title="Readings" count={READINGS.length} />
            <ul className="flex flex-col gap-3">
              {READINGS.slice(0, 4).map((sensor) => (
                <DetailPanelReading key={sensor.id} sensor={sensor} />
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-3">
            <SectionHeader size="sm" as="h3" title="Properties" />
            <PropertyList items={ASSET_PROPERTIES.slice(0, 4)} dense />
          </section>
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelWorkOrder() {
  return (
    <DetailPanelFrame>
      <SidePanel
        leading={
          <DetailPanelRecordIcon>
            <IconTool />
          </DetailPanelRecordIcon>
        }
        title={ORDER.id}
        description={ORDER.title}
        status={<StatusBadge status={ORDER.status} />}
        footer={
          <>
            <Button variant="secondary">Reassign</Button>
            <Button>Complete work order</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-base-foreground tabular-nums">{ORDER.progress} %</span>
            </div>
            <Progress value={ORDER.progress} size="sm" aria-label={`Progress of ${ORDER.id}`} />
          </div>
          <PropertyList
            items={[
              {
                label: 'Assignee',
                value: (
                  <span className="flex items-center gap-2">
                    <PersonAvatar name={TECHNICIAN.name} sizes="xxsm" /> {TECHNICIAN.name}
                  </span>
                ),
              },
              { label: 'Priority', value: ORDER.priority },
              { label: 'Type', value: 'Corrective' },
              { label: 'Asset', value: '23-KA-9103 · Recompressor' },
              { label: 'Due', value: formatDateTime(ORDER.dueAt) },
              { label: 'Estimate', value: `${ORDER.estimatedHours} h` },
            ]}
          />
          <section className="flex flex-col gap-2">
            <SectionHeader size="sm" as="h3" title="Description" />
            <p className="text-sm text-medium-foreground">
              Recompressor tripped on high drive-end vibration. Open the bearing housing, inspect the journal bearing
              and check coupling alignment before restart.
            </p>
          </section>
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelAlarm() {
  return (
    <DetailPanelFrame>
      <SidePanel
        title={ALARM.message}
        description={ALARM.sensorTag}
        footer={
          <>
            <Button variant="secondary">Open trend</Button>
            <Button>Acknowledge</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <ValueReadout value={146.3} unit={ALARM_SENSOR.unit} decimals={1} size="lg" tone="warning" />
            <StatusIndicator {...severityStatus(ALARM.severity)} detail={formatAgo(ALARM.raisedAt)} />
          </div>
          <RangeIndicator
            label={ALARM_SENSOR.name}
            value={146.3}
            min={ALARM_SENSOR.rangeMin}
            max={ALARM_SENSOR.rangeMax}
            limits={sensorLimits(ALARM_SENSOR)}
            unit={ALARM_SENSOR.unit}
            decimals={1}
            showHeader={false}
          />
          <PropertyList
            dense
            items={[
              { label: 'High limit', value: ALARM.limit },
              { label: 'Trip limit', value: '155.0 °C' },
              { label: 'Asset', value: COMPRESSOR.tag },
              { label: 'State', value: 'Active, not acknowledged' },
            ]}
          />
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelSensor() {
  return (
    <DetailPanelFrame>
      <SidePanel
        leading={
          <DetailPanelRecordIcon>
            <IconChartLine />
          </DetailPanelRecordIcon>
        }
        title={PRESSURE.name}
        description={PRESSURE.tag}
        actions={
          <DetailPanelIconAction label="Pin to trend">
            <IconPin />
          </DetailPanelIconAction>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-4">
              <ValueReadout value={PRESSURE.value} unit={PRESSURE.unit} decimals={PRESSURE.decimals} size="lg" />
              <span className="text-xs text-muted-foreground">Updated {formatAgo(REFERENCE_NOW - MINUTE)}</span>
            </div>
            <Sparkline
              values={sensorTrend(PRESSURE)}
              label={`${PRESSURE.name}, last 48 hours`}
              variant="area"
              unit={PRESSURE.unit}
              limit={PRESSURE.highLimit}
              height={56}
              showLast
            />
          </div>
          <PropertyList
            dense
            items={[
              { label: 'Low limit', value: `${PRESSURE.lowLimit.toFixed(1)} ${PRESSURE.unit}` },
              { label: 'High limit', value: `${PRESSURE.highLimit.toFixed(1)} ${PRESSURE.unit}` },
              { label: 'Trip limit', value: `${(PRESSURE.highHighLimit ?? 0).toFixed(1)} ${PRESSURE.unit}` },
              { label: 'Quality', value: 'Good' },
              { label: 'Asset', value: COMPRESSOR.tag },
            ]}
          />
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelPipelineRun() {
  return (
    <DetailPanelFrame>
      <SidePanel title="Run 4,218" description="Work order sync" status={<Badge variant="success">Succeeded</Badge>}>
        <div className="flex flex-col gap-6">
          <PropertyList
            items={[
              { label: 'Started', value: formatDateTime(REFERENCE_NOW - 6 * MINUTE) },
              { label: 'Duration', value: '42 s' },
              { label: 'Rows read', value: <span className="tabular-nums">1,284</span> },
              { label: 'Rows written', value: <span className="tabular-nums">37</span> },
              { label: 'Rows skipped', value: <span className="tabular-nums">0</span> },
              { label: 'Triggered by', value: 'Schedule' },
            ]}
          />
          <section className="flex flex-col gap-2">
            <SectionHeader size="sm" as="h3" title="Last log lines" />
            <pre className="overflow-x-auto rounded-lg bg-muted-background p-3 font-mono text-xs text-medium-foreground">
              {'13:54:02 Read 1,284 rows from source\n13:54:31 Upserted 37 work orders\n13:54:44 Run finished'}
            </pre>
          </section>
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelBesideList() {
  const [selectedId, setSelectedId] = useState<string | null>(COMPRESSOR.id);
  const selected: Asset | undefined = EQUIPMENT.find((asset) => asset.id === selectedId);

  return (
    <div className="flex h-104 w-full overflow-hidden rounded-xl border border-default bg-base-background">
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <SectionHeader title={AREA.name} count={EQUIPMENT.length} description="Select a row to see its details." />
        <ul className="flex flex-col gap-1">
          {EQUIPMENT.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                aria-pressed={asset.id === selectedId}
                onClick={() => setSelectedId(asset.id)}
                className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left outline-none transition-colors focus-visible:shadow-focus-ring ${
                  asset.id === selectedId ? 'bg-secondary-background' : 'hover:bg-base-background-hover'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-base-foreground">{asset.name}</span>
                  <span className="block text-xs text-muted-foreground">{asset.tag}</span>
                </span>
                <StatusBadge status={asset.state} outline />
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selected ? (
        <div className="w-80 shrink-0">
          <SidePanel
            frame="edge"
            title={selected.name}
            description={selected.tag}
            onClose={() => setSelectedId(null)}
            closeLabel="Close details"
          >
            <div className="flex flex-col gap-4">
              <div>
                <StatusBadge status={selected.state} />
              </div>
              <PropertyList
                items={[
                  { label: 'Type', value: selected.type.charAt(0).toUpperCase() + selected.type.slice(1) },
                  { label: 'Criticality', value: selected.criticality },
                  { label: 'Health', value: <StatusIndicator {...healthStatus(selected.health)} detail={`${selected.healthScore} / 100`} /> },
                  { label: 'Area', value: AREA.name },
                ]}
              />
            </div>
          </SidePanel>
        </div>
      ) : null}
    </div>
  );
}

function DetailPanelRelatedItems() {
  return (
    <DetailPanelFrame>
      <SidePanel title={COMPRESSOR.name} description="Related" flush>
        <div className="flex flex-col gap-4 p-2">
          <div className="flex flex-col gap-1">
            <ItemSectionHeader>
              <ItemSectionHeaderTitle>Work orders</ItemSectionHeaderTitle>
            </ItemSectionHeader>
            <ItemGroup>
              {ASSET_ORDERS.map((order) => (
                <Item key={order.id}>
                  <ItemMedia>
                    <IconTool />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{order.title}</ItemTitle>
                    <ItemDescription>
                      {order.id} · Due {formatDate(order.dueAt)}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </div>
          <div className="flex flex-col gap-1">
            <ItemSectionHeader>
              <ItemSectionHeaderTitle>Documents</ItemSectionHeaderTitle>
            </ItemSectionHeader>
            <ItemGroup>
              <Item>
                <ItemMedia>
                  <IconFileText />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>P&amp;ID, compression train 1</ItemTitle>
                  <ItemDescription>Rev. F · PDF</ItemDescription>
                </ItemContent>
              </Item>
              <Item>
                <ItemMedia>
                  <IconFileText />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Compressor data sheet</ItemTitle>
                  <ItemDescription>Rev. C · PDF</ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </div>
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelRelationships() {
  const relations = [
    { relation: 'Part of', asset: AREA },
    { relation: 'Driven by', asset: ASSETS.find((asset) => asset.id === '23-gt-9001') ?? AREA },
    { relation: 'Feeds', asset: ASSETS.find((asset) => asset.id === '23-ha-9114') ?? AREA },
    { relation: 'Followed by', asset: ASSETS.find((asset) => asset.id === '23-ka-9102') ?? AREA },
  ];

  return (
    <DetailPanelFrame>
      <SidePanel title={COMPRESSOR.name} description="Relationships">
        <dl className="flex flex-col gap-4">
          {relations.map(({ relation, asset }) => (
            <div key={relation} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{relation}</dt>
              <dd className="flex items-center gap-3">
                <IconSitemap aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-base-foreground">{asset.name}</span>
                  <span className="block text-xs text-muted-foreground">{asset.tag}</span>
                </span>
                <DetailPanelIconAction label={`Open ${asset.name}`}>
                  <IconArrowRight />
                </DetailPanelIconAction>
              </dd>
            </div>
          ))}
        </dl>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelActivity() {
  const events = [
    { id: 'e1', person: TECHNICIAN, text: 'started work', at: REFERENCE_NOW - 50 * MINUTE },
    { id: 'e2', person: PEOPLE[1], text: 'assigned Tomás Barros', at: REFERENCE_NOW - 2 * HOUR },
    { id: 'e3', person: PEOPLE[1], text: 'raised priority to P1', at: REFERENCE_NOW - 2 * HOUR - 4 * MINUTE },
    { id: 'e4', person: OPERATOR, text: 'created the work order', at: REFERENCE_NOW - 3 * HOUR },
  ];

  return (
    <DetailPanelFrame>
      <SidePanel title={ORDER.id} description={ORDER.title} status={<StatusBadge status={ORDER.status} />}>
        <div className="flex flex-col gap-6">
          <PropertyList
            dense
            items={[
              { label: 'Assignee', value: TECHNICIAN.name },
              { label: 'Priority', value: ORDER.priority },
              { label: 'Due', value: formatDateTime(ORDER.dueAt) },
            ]}
          />
          <section className="flex flex-col gap-3">
            <SectionHeader size="sm" as="h3" title="Activity" count={events.length} />
            <ol className="flex flex-col gap-4">
              {events.map((event) => (
                <li key={event.id} className="flex items-start gap-3">
                  <PersonAvatar name={event.person.name} sizes="xxsm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-medium-foreground">
                      <span className="font-medium text-base-foreground">{event.person.name}</span> {event.text}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatAgo(event.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

function DetailPanelEmptySelection() {
  return (
    <DetailPanelFrame>
      <aside
        aria-label="Details"
        className="flex h-full items-center justify-center rounded-xl border border-default bg-base-background p-6"
      >
        <EmptyState>
          <EmptyStateIcon>
            <IconSitemap />
          </EmptyStateIcon>
          <EmptyStateTitle as="h3">No asset selected</EmptyStateTitle>
          <EmptyStateDescription>Select an asset in the hierarchy to see its properties and readings.</EmptyStateDescription>
        </EmptyState>
      </aside>
    </DetailPanelFrame>
  );
}

function DetailPanelLoading() {
  return (
    <DetailPanelFrame>
      <aside
        aria-label="Details"
        aria-busy="true"
        className="flex h-full flex-col overflow-hidden rounded-xl border border-default bg-base-background"
      >
        <div className="flex items-center gap-3 border-b border-default p-4">
          <Skeleton className="size-8 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4">
          {['w-32', 'w-24', 'w-10', 'w-28', 'w-20', 'w-36'].map((width) => (
            <div key={width} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className={`h-4 ${width}`} />
            </div>
          ))}
        </div>
      </aside>
    </DetailPanelFrame>
  );
}

function DetailPanelLoadFailed() {
  return (
    <DetailPanelFrame>
      <SidePanel title={COMPRESSOR.name} description={COMPRESSOR.tag}>
        <div className="flex h-full items-center justify-center">
          <RetryBlock
            title="Couldn't load properties"
            description="The asset service did not answer. Readings and alarms are not affected."
            onRetry={() => new Promise<void>((resolve) => window.setTimeout(resolve, 900))}
          />
        </div>
      </SidePanel>
    </DetailPanelFrame>
  );
}

export default definePage({
  id: 'detail-panels',
  title: 'Detail panels',
  summary:
    'Panels that show one record beside the list, tree or canvas it was picked from: its properties, its state and the few actions that belong to it.',
  guidance: {
    use: [
      'To inspect or lightly edit a record without leaving the list it came from.',
      'Name the selection in the header; scroll the body; keep actions in a footer that stays in view.',
      'Labels in one column and values left-aligned beside them, so long lists scan.',
      'A placeholder for every missing value, and a state for nothing selected.',
    ],
    avoid: [
      'A panel for a task that needs the full width. Open the record page instead.',
      'More than one primary action, or page-level actions, in the panel footer.',
      'Boxes around every group. Section headings and space are enough.',
      'Colour on values that are normal. Colour marks the reading that is out of range.',
    ],
  },
  source,
  sections: [
    {
      id: 'property-lists',
      title: 'Property lists',
      description: 'Label and value pairs, the core of every detail panel.',
      specimens: [
        {
          id: 'DetailPanelPropertyList',
          title: 'Key-value list',
          note: 'The default: short labels and short values in two aligned columns.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx'],
          Component: DetailPanelPropertyList,
        },
        {
          id: 'DetailPanelStacked',
          title: 'Stacked',
          note: 'When values are sentences or the panel is narrow: label above, value below at full width.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx'],
          Component: DetailPanelStacked,
        },
        {
          id: 'DetailPanelCopyable',
          title: 'Identifiers with copy',
          note: 'For IDs people paste into queries and tickets: monospace, a copy button and a hint where needed.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'actions/CopyButton.tsx',
            'overlays/InfoTooltip.tsx',
          ],
          Component: DetailPanelCopyable,
        },
      ],
    },
    {
      id: 'sections',
      title: 'Sections inside a panel',
      description: 'Three ways to split a long list of properties.',
      specimens: [
        {
          id: 'DetailPanelGrouped',
          title: 'Grouped with headings',
          note: 'When there are more than eight properties: group them and name each group.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: DetailPanelGrouped,
        },
        {
          id: 'DetailPanelCollapsibleGroups',
          title: 'Collapsible groups',
          note: 'When some groups are rarely needed: open the first, fold the rest and show how much each holds.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx', 'patterns/structure/CollapsibleSection.tsx'],
          Component: DetailPanelCollapsibleGroups,
        },
        {
          id: 'DetailPanelWithTabs',
          title: 'Tabs inside a panel',
          note: 'When the record has distinct kinds of content and only one fits the panel at a time.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'industrial/Sparkline.tsx',
            'industrial/ValueReadout.tsx',
          ],
          Component: DetailPanelWithTabs,
        },
      ],
    },
    {
      id: 'chrome-and-editing',
      title: 'Header, footer and editing',
      description: 'What frames the body, and two ways to change a record from the panel.',
      specimens: [
        {
          id: 'DetailPanelHeaderActions',
          title: 'Header with close and actions',
          note: 'When the panel can be dismissed and the record has a full page of its own.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx', 'display/StatusBadge.tsx'],
          Component: DetailPanelHeaderActions,
        },
        {
          id: 'DetailPanelStickyFooter',
          title: 'Sticky footer actions',
          note: 'When the body scrolls and the decision must stay in reach. Scroll the text to try.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
            'industrial/StatusIndicator.tsx',
          ],
          Component: DetailPanelStickyFooter,
        },
        {
          id: 'DetailPanelRecordNavigation',
          title: 'Step through records',
          note: 'When people review a list row by row: move to the next record without closing the panel.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx', 'display/StatusBadge.tsx'],
          Component: DetailPanelRecordNavigation,
        },
        {
          id: 'DetailPanelEditable',
          title: 'Editable properties',
          note: 'For a few independent fields that save one at a time. Read-only rows stay plain text.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx', 'forms/InlineEditText.tsx'],
          Component: DetailPanelEditable,
        },
        {
          id: 'DetailPanelEditForm',
          title: 'Edit form with footer',
          note: 'When fields depend on each other and should be saved together. Change a field to see the footer react.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'forms/FormField.tsx'],
          Component: DetailPanelEditForm,
        },
      ],
    },
    {
      id: 'records',
      title: 'Records',
      description: 'The panel filled in for an asset, a work order, an alarm, a sensor and a pipeline run.',
      specimens: [
        {
          id: 'DetailPanelAsset',
          title: 'Asset with status and readings',
          note: 'For equipment: run state in the header, health and live readings first, static properties last.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
            'industrial/LinearGauge.tsx',
            'industrial/Sparkline.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'display/StatusBadge.tsx',
          ],
          Component: DetailPanelAsset,
        },
        {
          id: 'DetailPanelWorkOrder',
          title: 'Work order',
          note: 'For a job in flight: progress and who has it first, then the facts, then the next step in the footer.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
            'display/StatusBadge.tsx',
            'display/PersonAvatar.tsx',
          ],
          Component: DetailPanelWorkOrder,
        },
        {
          id: 'DetailPanelAlarm',
          title: 'Alarm',
          note: 'For an event that needs a response: the value against its limits, then one action.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/RangeIndicator.tsx',
            'industrial/StatusIndicator.tsx',
          ],
          Component: DetailPanelAlarm,
        },
        {
          id: 'DetailPanelSensor',
          title: 'Sensor',
          note: 'For a time series picked from a chart or a list: current value, recent trend and its limits.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/Sparkline.tsx',
          ],
          Component: DetailPanelSensor,
        },
        {
          id: 'DetailPanelPipelineRun',
          title: 'Pipeline run',
          note: 'For one run of a job: outcome, counts and the last lines of its log.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/structure/PropertyList.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: DetailPanelPipelineRun,
        },
        {
          id: 'DetailPanelBesideList',
          title: 'Docked beside a list',
          note: 'The panel in place: a column docked to the edge that follows the selected row and can be closed.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
            'display/StatusBadge.tsx',
            'industrial/StatusIndicator.tsx',
          ],
          Component: DetailPanelBesideList,
        },
      ],
    },
    {
      id: 'related-content',
      title: 'Related content',
      description: 'What the record is connected to, and what has happened to it.',
      specimens: [
        {
          id: 'DetailPanelRelatedItems',
          title: 'Related items',
          note: 'For the other records people usually open next, grouped by kind.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx'],
          Component: DetailPanelRelatedItems,
        },
        {
          id: 'DetailPanelRelationships',
          title: 'Relationships',
          note: 'When how the record connects matters: name each relation and link to the other end.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx'],
          Component: DetailPanelRelationships,
        },
        {
          id: 'DetailPanelActivity',
          title: 'Activity and properties',
          note: 'For records that move through a workflow: the key facts, then who did what and when.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
            'display/PersonAvatar.tsx',
            'display/StatusBadge.tsx',
          ],
          Component: DetailPanelActivity,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'The panel before a selection, while loading and when loading fails.',
      specimens: [
        {
          id: 'DetailPanelEmptySelection',
          title: 'Nothing selected',
          note: 'When the panel is always open: say what to select instead of leaving a blank column.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          Component: DetailPanelEmptySelection,
        },
        {
          id: 'DetailPanelLoading',
          title: 'Loading',
          note: 'While the record loads, hold the header and the two columns so nothing jumps.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          Component: DetailPanelLoading,
        },
        {
          id: 'DetailPanelLoadFailed',
          title: 'Load failed',
          note: 'Keep the header so people know what failed, and offer one retry in the body.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'feedback/RetryBlock.tsx'],
          Component: DetailPanelLoadFailed,
        },
      ],
    },
  ],
});
