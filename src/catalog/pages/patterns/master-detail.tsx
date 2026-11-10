import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { ItemGroup, ItemSectionHeader, ItemSectionHeaderTitle } from '@cognite/aura/components/item';
import { Search } from '@cognite/aura/components/search';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tree } from '@cognite/aura/components/tree';
import {
  IconBellOff,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconEngine,
  IconExternalLink,
  IconHandClick,
  IconTool,
  IconUserPlus,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatReading, healthStatus, runStateStatus, severityStatus } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { MasterDetailLayout } from '../../../library/patterns/collections/MasterDetailLayout';
import { useSelection } from '../../../library/patterns/collections/useSelection';
import { ALARMS, ASSETS, WORK_ORDERS, childrenOf, findAsset, findPerson, sensorsOf } from '../../data/plant';
import type { Alarm, Asset, WorkOrder } from '../../data/plant';
import { formatAgo, formatDate, formatDateTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './master-detail.tsx?raw';

const MASTER_DETAIL_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));
const MASTER_DETAIL_AREAS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system');
const MASTER_DETAIL_COMPRESSION = childrenOf('nk-23');
const MASTER_DETAIL_ALARMS = ALARMS.slice(0, 6);
const MASTER_DETAIL_ORDERS = WORK_ORDERS.slice(0, 6);

const MASTER_DETAIL_ALARM_STATE: Record<Alarm['state'], string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  cleared: 'Cleared',
  shelved: 'Shelved',
};

const MASTER_DETAIL_ORDER_TYPE: Record<WorkOrder['type'], string> = {
  corrective: 'Corrective',
  preventive: 'Preventive',
  inspection: 'Inspection',
  modification: 'Modification',
};

type MasterDetailNode = { id: string; name: string; children: string[] };

/** Site, areas and systems only: the navigation column of the three-column layout. */
const MASTER_DETAIL_TREE: Record<string, MasterDetailNode> = Object.fromEntries(
  ASSETS.filter((asset) => ['site', 'area', 'system'].includes(asset.type)).map((asset) => [
    asset.id,
    {
      id: asset.id,
      name: asset.name,
      children: childrenOf(asset.id)
        .filter((child) => ['area', 'system'].includes(child.type))
        .map((child) => child.id),
    },
  ])
);

/** Header of a pane: title on the left, controls on the right, a rule underneath. */
function MasterDetailPaneHeader({ title, detail, children }: { title: string; detail?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-default px-4 py-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <h3 className="truncate text-sm font-semibold text-base-foreground">{title}</h3>
        {detail ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{detail}</span> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-1">{children}</div> : null}
    </div>
  );
}

function MasterDetailAssetList({
  assets,
  currentId,
  onSelect,
  dense = false,
}: {
  assets: readonly Asset[];
  currentId: string | null;
  onSelect: (id: string) => void;
  dense?: boolean;
}) {
  return (
    <ItemGroup aria-label="Assets" className="p-2">
      {assets.map((asset) => (
        <EntityRow
          key={asset.id}
          density={dense ? 'dense' : 'comfortable'}
          title={asset.name}
          description={dense ? undefined : asset.tag}
          meta={dense ? <StatusDot {...runStateStatus(asset.state)} /> : <StatusBadge status={asset.state} />}
          selected={currentId === asset.id}
          onOpen={() => onSelect(asset.id)}
        />
      ))}
    </ItemGroup>
  );
}

function MasterDetailAssetSummary({ asset }: { asset: Asset }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-xl font-semibold text-base-foreground">{asset.name}</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{asset.tag}</span> · {findAsset(asset.parentId ?? '')?.name}
        </p>
      </div>
      <StatusBadge status={asset.state} />
    </div>
  );
}

function MasterDetailAssetFacts({ asset }: { asset: Asset }) {
  return (
    <MetadataList
      items={[
        { label: 'Health', value: <StatusIndicator {...healthStatus(asset.health)} size="sm" detail={String(asset.healthScore)} /> },
        { label: 'Criticality', value: asset.criticality },
        { label: 'Open work orders', value: WORK_ORDERS.filter((order) => order.assetId === asset.id && order.status !== 'done').length },
        { label: 'Open alarms', value: ALARMS.filter((alarm) => alarm.assetId === asset.id && alarm.state !== 'cleared').length },
      ]}
    />
  );
}

function MasterDetailAssetReadings({ asset }: { asset: Asset }) {
  const sensors = sensorsOf(asset.id).slice(0, 4);
  if (sensors.length === 0) return <p className="text-sm text-muted-foreground">No time series are linked to this asset.</p>;

  return (
    <ul aria-label="Latest readings" className="flex flex-col">
      {sensors.map((sensor) => (
        <li key={sensor.id} className="flex items-center gap-4 border-t border-default py-2 text-sm first:border-t-0">
          <span className="min-w-0 flex-1 truncate text-medium-foreground">{sensor.name}</span>
          <Sparkline
            values={makeValues({ seed: sensor.seed, points: 24, base: sensor.value, amplitude: sensor.value * 0.03, noise: sensor.value * 0.012 })}
            label={`${sensor.name}, last 24 hours`}
            unit={sensor.unit}
            decimals={sensor.decimals}
            width={88}
            height={20}
          />
          <span className="w-24 text-right font-medium tabular-nums text-base-foreground">
            {formatReading(sensor.value, sensor.unit, sensor.decimals)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function MasterDetailAssetDetail({ asset }: { asset: Asset }) {
  return (
    <div className="flex flex-col gap-5 p-5">
      <MasterDetailAssetSummary asset={asset} />
      <div className="max-w-md">
        <MasterDetailAssetFacts asset={asset} />
      </div>
      <section className="flex flex-col gap-1">
        <h4 className="text-xs font-medium text-muted-foreground">Latest readings</h4>
        <MasterDetailAssetReadings asset={asset} />
      </section>
    </div>
  );
}

function MasterDetailOrderDetail({ order }: { order: WorkOrder }) {
  const assignee = findPerson(order.assigneeId);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-xl font-semibold text-base-foreground">{order.title}</h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{order.id}</span> · {MASTER_DETAIL_ORDER_TYPE[order.type]}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="max-w-md">
        <MetadataList
          items={[
            { label: 'Asset', value: findAsset(order.assetId)?.name },
            { label: 'Priority', value: order.priority },
            {
              label: 'Assignee',
              value: assignee ? (
                <span className="flex items-center justify-end gap-2">
                  <PersonAvatar name={assignee.name} initials={assignee.initials} sizes="xxsm" />
                  {assignee.name}
                </span>
              ) : undefined,
            },
            { label: 'Due', value: formatDate(order.dueAt) },
            { label: 'Estimate', value: `${order.estimatedHours} h` },
            { label: 'Progress', value: `${order.progress}%` },
          ]}
          emptyValue="Unassigned"
        />
      </div>
    </div>
  );
}

function MasterDetailAlarmDetail({ alarm }: { alarm: Alarm }) {
  const severity = severityStatus(alarm.severity);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-2">
        <StatusIndicator {...severity} label={`${severity.label} severity`} size="sm" />
        <h3 className="text-xl font-semibold text-base-foreground">{alarm.message}</h3>
        <p className="text-sm text-muted-foreground">
          Raised {formatDateTime(alarm.raisedAt)} · {formatAgo(alarm.raisedAt)}
        </p>
      </div>
      <div className="max-w-md">
        <MetadataList
          items={[
            { label: 'State', value: MASTER_DETAIL_ALARM_STATE[alarm.state] },
            { label: 'Tag', value: <span className="font-mono text-xs">{alarm.sensorTag}</span> },
            { label: 'Asset', value: findAsset(alarm.assetId)?.name },
            { label: 'Value', value: <span className="tabular-nums">{alarm.value}</span> },
            { label: 'Limit', value: <span className="tabular-nums">{alarm.limit}</span> },
          ]}
        />
      </div>
    </div>
  );
}

function MasterDetailPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState>
        <EmptyStateIcon>
          <IconHandClick />
        </EmptyStateIcon>
        <EmptyStateTitle as="h3">{title}</EmptyStateTitle>
        <EmptyStateDescription>{description}</EmptyStateDescription>
      </EmptyState>
    </div>
  );
}

function MasterDetailAssets() {
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_EQUIPMENT[3].id);
  const asset = findAsset(currentId) ?? MASTER_DETAIL_EQUIPMENT[0];

  return (
    <MasterDetailLayout
      masterLabel="Assets"
      detailLabel="Asset details"
      master={
        <>
          <MasterDetailPaneHeader title="Equipment" detail={String(MASTER_DETAIL_EQUIPMENT.length)} />
          <MasterDetailAssetList assets={MASTER_DETAIL_EQUIPMENT} currentId={currentId} onSelect={setCurrentId} />
        </>
      }
      detail={<MasterDetailAssetDetail asset={asset} />}
    />
  );
}

function MasterDetailAlarms() {
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_ALARMS[0].id);
  const alarm = MASTER_DETAIL_ALARMS.find((candidate) => candidate.id === currentId) ?? MASTER_DETAIL_ALARMS[0];

  return (
    <MasterDetailLayout
      masterLabel="Alarms"
      detailLabel="Alarm details"
      masterWidth={44}
      master={
        <>
          <MasterDetailPaneHeader title="Alarms" detail={`${MASTER_DETAIL_ALARMS.filter((item) => item.state === 'active').length} active`} />
          <ItemGroup aria-label="Alarms" className="p-2">
            {MASTER_DETAIL_ALARMS.map((item) => {
              const severity = severityStatus(item.severity);
              return (
                <EntityRow
                  key={item.id}
                  leading={<StatusDot tone={severity.tone} shape={severity.shape} label={`${severity.label} severity`} />}
                  title={item.message}
                  description={`${item.sensorTag} · ${MASTER_DETAIL_ALARM_STATE[item.state]}`}
                  meta={<span className="tabular-nums">{formatAgo(item.raisedAt)}</span>}
                  selected={currentId === item.id}
                  onOpen={() => setCurrentId(item.id)}
                />
              );
            })}
          </ItemGroup>
        </>
      }
      detail={
        <>
          <MasterDetailAlarmDetail alarm={alarm} />
          <div className="mt-auto flex shrink-0 items-center justify-end gap-2 border-t border-default px-5 py-3">
            <Button variant="outline" size="sm">
              <IconBellOff /> Shelve
            </Button>
            <Button size="sm" disabled={alarm.state !== 'active'} title={alarm.state !== 'active' ? 'Only active alarms can be acknowledged' : undefined}>
              <IconCheck /> Acknowledge
            </Button>
          </div>
        </>
      }
    />
  );
}

function MasterDetailWorkOrders() {
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_ORDERS[0].id);
  const order = MASTER_DETAIL_ORDERS.find((candidate) => candidate.id === currentId) ?? MASTER_DETAIL_ORDERS[0];

  return (
    <MasterDetailLayout
      masterLabel="Work orders"
      detailLabel="Work order details"
      masterWidth={44}
      master={
        <>
          <MasterDetailPaneHeader title="Work orders" detail={String(MASTER_DETAIL_ORDERS.length)} />
          <ItemGroup aria-label="Work orders" className="p-2">
            {MASTER_DETAIL_ORDERS.map((item) => (
              <EntityRow
                key={item.id}
                leading={<IconTool />}
                title={item.title}
                description={`${item.id} · ${item.priority} · Due ${formatDate(item.dueAt)}`}
                meta={<StatusBadge status={item.status} showIcon={false} />}
                selected={currentId === item.id}
                onOpen={() => setCurrentId(item.id)}
              />
            ))}
          </ItemGroup>
        </>
      }
      detail={<MasterDetailOrderDetail order={order} />}
    />
  );
}

function MasterDetailSelectedRow() {
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_COMPRESSION[1].id);
  const asset = findAsset(currentId) ?? MASTER_DETAIL_COMPRESSION[0];

  return (
    <MasterDetailLayout
      className="h-72"
      masterWidth={48}
      masterLabel="Compression equipment"
      detailLabel="Asset details"
      master={<MasterDetailAssetList assets={MASTER_DETAIL_COMPRESSION} currentId={currentId} onSelect={setCurrentId} dense />}
      detail={
        <div className="flex flex-col gap-4 p-4">
          <MasterDetailAssetSummary asset={asset} />
          <MasterDetailAssetFacts asset={asset} />
        </div>
      }
    />
  );
}

function MasterDetailEmptySelection() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const asset = currentId ? findAsset(currentId) : undefined;

  return (
    <MasterDetailLayout
      className="h-72"
      masterWidth={48}
      masterLabel="Compression equipment"
      detailLabel="Asset details"
      master={<MasterDetailAssetList assets={MASTER_DETAIL_COMPRESSION} currentId={currentId} onSelect={setCurrentId} dense />}
      detail={
        asset ? (
          <div className="flex flex-col gap-4 p-4">
            <MasterDetailAssetSummary asset={asset} />
            <MasterDetailAssetFacts asset={asset} />
          </div>
        ) : (
          <MasterDetailPlaceholder title="No asset selected" description="Select an asset in the list to see its state and readings." />
        )
      }
    />
  );
}

function MasterDetailSearch() {
  const [query, setQuery] = useState('pump');
  const needle = query.trim().toLowerCase();
  const matches = MASTER_DETAIL_EQUIPMENT.filter((asset) => needle === '' || `${asset.name} ${asset.tag}`.toLowerCase().includes(needle));
  const [currentId, setCurrentId] = useState<string>('27-pa-2001a');
  const asset = matches.find((candidate) => candidate.id === currentId);

  return (
    <MasterDetailLayout
      masterLabel="Assets"
      detailLabel="Asset details"
      master={
        <>
          <div className="flex shrink-0 flex-col gap-2 border-b border-default p-3">
            <Search
              aria-label="Search assets"
              placeholder="Search by name or tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
            />
            <span role="status" className="px-1 text-xs tabular-nums text-muted-foreground">
              {matches.length} of {MASTER_DETAIL_EQUIPMENT.length} assets
            </span>
          </div>
          {matches.length > 0 ? (
            <MasterDetailAssetList assets={matches} currentId={currentId} onSelect={setCurrentId} />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No assets match "{query}".</p>
          )}
        </>
      }
      detail={
        asset ? (
          <MasterDetailAssetDetail asset={asset} />
        ) : (
          <MasterDetailPlaceholder title="No asset selected" description="The asset you were viewing is not in the search results." />
        )
      }
    />
  );
}

function MasterDetailGroupedMaster() {
  const [currentId, setCurrentId] = useState<string>('20-va-1001');
  const asset = findAsset(currentId) ?? MASTER_DETAIL_EQUIPMENT[0];

  return (
    <MasterDetailLayout
      masterLabel="Assets by area"
      detailLabel="Asset details"
      master={
        <div className="flex flex-col gap-3 p-2">
          {MASTER_DETAIL_AREAS.map((area) => (
            <section key={area.id} aria-label={area.name}>
              <ItemSectionHeader>
                <ItemSectionHeaderTitle>{area.name}</ItemSectionHeaderTitle>
                <span className="text-xs tabular-nums text-muted-foreground">{childrenOf(area.id).length}</span>
              </ItemSectionHeader>
              <ItemGroup>
                {childrenOf(area.id).map((child) => (
                  <EntityRow
                    key={child.id}
                    density="dense"
                    title={child.name}
                    meta={<StatusBadge status={child.state} showIcon={false} />}
                    selected={currentId === child.id}
                    onOpen={() => setCurrentId(child.id)}
                  />
                ))}
              </ItemGroup>
            </section>
          ))}
        </div>
      }
      detail={<MasterDetailAssetDetail asset={asset} />}
    />
  );
}

function MasterDetailFilteredMaster() {
  const [view, setView] = useState('open');
  const orders = WORK_ORDERS.filter((order) => (view === 'open' ? order.status !== 'done' : view === 'mine' ? order.assigneeId === 'tb' : true));
  const [currentId, setCurrentId] = useState<string>(WORK_ORDERS[0].id);
  const order = orders.find((candidate) => candidate.id === currentId);

  return (
    <MasterDetailLayout
      masterLabel="Work orders"
      detailLabel="Work order details"
      masterWidth={44}
      master={
        <>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-default px-3 py-2">
            <SegmentedControl
              value={view}
              onValueChange={(value) => {
                if (typeof value === 'string') setView(value);
              }}
            >
              <SegmentedControlList size="small" aria-label="Work order view">
                <SegmentedControlButton size="small" value="open" tabContent="label-only">
                  Open
                </SegmentedControlButton>
                <SegmentedControlButton size="small" value="mine" tabContent="label-only">
                  Assigned to me
                </SegmentedControlButton>
                <SegmentedControlButton size="small" value="all" tabContent="label-only">
                  All
                </SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
            <span role="status" className="text-xs tabular-nums text-muted-foreground">
              {orders.length}
            </span>
          </div>
          <ItemGroup aria-label="Work orders" className="p-2">
            {orders.map((item) => (
              <EntityRow
                key={item.id}
                title={item.title}
                description={`${item.id} · ${item.priority}`}
                meta={<StatusBadge status={item.status} showIcon={false} />}
                selected={currentId === item.id}
                onOpen={() => setCurrentId(item.id)}
              />
            ))}
          </ItemGroup>
        </>
      }
      detail={
        order ? (
          <MasterDetailOrderDetail order={order} />
        ) : (
          <MasterDetailPlaceholder title="Not in this view" description="The work order you had open is hidden by the current view. Pick another, or switch to All." />
        )
      }
    />
  );
}

function MasterDetailTableMaster() {
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_ORDERS[2].id);
  const order = MASTER_DETAIL_ORDERS.find((candidate) => candidate.id === currentId) ?? MASTER_DETAIL_ORDERS[0];

  return (
    <MasterDetailLayout
      masterLabel="Work orders"
      detailLabel="Work order details"
      masterWidth={58}
      master={
        <div className="p-2">
          <DataTable
            label="Work orders"
            density="dense"
            currentRowId={currentId}
            columns={[
              {
                id: 'title',
                header: 'Work order',
                sortValue: (item) => item.title,
                cell: (item) => (
                  <button
                    type="button"
                    aria-current={currentId === item.id ? 'true' : undefined}
                    onClick={() => setCurrentId(item.id)}
                    className="rounded-sm text-left text-base-foreground outline-none hover:underline focus-visible:shadow-focus-ring"
                  >
                    {item.title}
                  </button>
                ),
              },
              { id: 'priority', header: 'Priority', sortValue: (item) => item.priority, cell: (item) => item.priority },
              { id: 'status', header: 'Status', sortValue: (item) => item.status, cell: (item) => <StatusBadge status={item.status} showIcon={false} /> },
              {
                id: 'due',
                header: 'Due',
                align: 'end',
                sortValue: (item) => item.dueAt,
                cell: (item) => <span className="whitespace-nowrap">{formatDate(item.dueAt)}</span>,
              },
            ]}
            rows={MASTER_DETAIL_ORDERS}
            getRowId={(item) => item.id}
          />
        </div>
      }
      detail={<MasterDetailOrderDetail order={order} />}
    />
  );
}

function MasterDetailMasterLoading() {
  return (
    <MasterDetailLayout
      className="h-72"
      masterWidth={48}
      masterLabel="Assets"
      detailLabel="Asset details"
      master={
        <div className="p-4">
          <SkeletonList rows={4} media={false} trailing label="Loading assets" />
        </div>
      }
      detail={<MasterDetailPlaceholder title="Loading assets" description="The first asset opens here when the list is ready." />}
    />
  );
}

function MasterDetailNoResults() {
  const [query, setQuery] = useState('23-KA-9200');
  const needle = query.trim().toLowerCase();
  const matches = MASTER_DETAIL_COMPRESSION.filter((asset) => needle === '' || `${asset.name} ${asset.tag}`.toLowerCase().includes(needle));
  const [currentId, setCurrentId] = useState<string | null>(null);

  return (
    <MasterDetailLayout
      className="h-72"
      masterWidth={48}
      masterLabel="Assets"
      detailLabel="Asset details"
      master={
        <>
          <div className="shrink-0 border-b border-default p-3">
            <Search
              aria-label="Search compression equipment"
              placeholder="Search by name or tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
            />
          </div>
          {matches.length > 0 ? (
            <MasterDetailAssetList assets={matches} currentId={currentId} onSelect={setCurrentId} dense />
          ) : (
            <div className="flex flex-col items-start gap-2 p-4">
              <p className="text-sm text-medium-foreground">No assets match "{query}".</p>
              <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </div>
          )}
        </>
      }
      detail={<MasterDetailPlaceholder title="Nothing to show" description="Clear the search or try a different tag." />}
    />
  );
}

function MasterDetailTabs() {
  const [currentId, setCurrentId] = useState<string>('23-ka-9101');
  const asset = findAsset(currentId) ?? MASTER_DETAIL_COMPRESSION[0];
  const orders = WORK_ORDERS.filter((order) => order.assetId === asset.id);
  const alarms = ALARMS.filter((alarm) => alarm.assetId === asset.id);

  return (
    <MasterDetailLayout
      masterLabel="Compression equipment"
      detailLabel="Asset details"
      master={
        <>
          <MasterDetailPaneHeader title="Gas compression" detail={String(MASTER_DETAIL_COMPRESSION.length)} />
          <MasterDetailAssetList assets={MASTER_DETAIL_COMPRESSION} currentId={currentId} onSelect={setCurrentId} />
        </>
      }
      detail={
        <div className="flex flex-col gap-4 p-5">
          <MasterDetailAssetSummary asset={asset} />
          <Tabs defaultValue="overview" className="w-full">
            <TabsList showSeparator className="w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="readings">Readings</TabsTrigger>
              <TabsTrigger value="orders" badge={orders.length > 0 ? orders.length : undefined}>
                Work orders
              </TabsTrigger>
              <TabsTrigger value="alarms" badge={alarms.length > 0 ? alarms.length : undefined}>
                Alarms
              </TabsTrigger>
            </TabsList>
            <TabsPanel value="overview" className="max-w-md pt-4">
              <MasterDetailAssetFacts asset={asset} />
            </TabsPanel>
            <TabsPanel value="readings" className="pt-2">
              <MasterDetailAssetReadings asset={asset} />
            </TabsPanel>
            <TabsPanel value="orders" className="max-w-md pt-4">
              {orders.length > 0 ? (
                <MetadataList items={orders.map((order) => ({ label: order.title, value: <StatusBadge status={order.status} /> }))} />
              ) : (
                <p className="text-sm text-muted-foreground">No work orders on this asset.</p>
              )}
            </TabsPanel>
            <TabsPanel value="alarms" className="max-w-md pt-4">
              {alarms.length > 0 ? (
                <MetadataList items={alarms.map((alarm) => ({ label: alarm.message, value: formatAgo(alarm.raisedAt) }))} />
              ) : (
                <p className="text-sm text-muted-foreground">No alarms on this asset.</p>
              )}
            </TabsPanel>
          </Tabs>
        </div>
      }
    />
  );
}

function MasterDetailStickyFooter() {
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_ORDERS[0].id);
  const order = MASTER_DETAIL_ORDERS.find((candidate) => candidate.id === currentId) ?? MASTER_DETAIL_ORDERS[0];

  return (
    <MasterDetailLayout
      className="h-80"
      masterLabel="Work orders"
      detailLabel="Work order details"
      masterWidth={40}
      master={
        <ItemGroup aria-label="Work orders" className="p-2">
          {MASTER_DETAIL_ORDERS.map((item) => (
            <EntityRow
              key={item.id}
              title={item.title}
              description={item.id}
              selected={currentId === item.id}
              onOpen={() => setCurrentId(item.id)}
            />
          ))}
        </ItemGroup>
      }
      detail={
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MasterDetailOrderDetail order={order} />
            <p className="max-w-prose px-5 pb-5 text-sm text-medium-foreground">
              Isolate the unit and confirm zero energy before opening the bearing housing. Record clearances and photograph
              the journal before cleaning. Replace the bearing if scoring is deeper than the wear limit in the procedure.
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-default px-5 py-3">
            <span className="text-xs text-muted-foreground">Last edited 12 Mar, 13:52</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <IconUserPlus /> Reassign
              </Button>
              <Button size="sm">{order.status === 'in-progress' ? 'Complete work order' : 'Start work'}</Button>
            </div>
          </div>
        </>
      }
    />
  );
}

function MasterDetailHeaderNavigation() {
  const [index, setIndex] = useState(1);
  const alarm = MASTER_DETAIL_ALARMS[index];

  return (
    <MasterDetailLayout
      masterLabel="Alarms"
      detailLabel="Alarm details"
      masterWidth={40}
      master={
        <ItemGroup aria-label="Alarms" className="p-2">
          {MASTER_DETAIL_ALARMS.map((item, itemIndex) => {
            const severity = severityStatus(item.severity);
            return (
              <EntityRow
                key={item.id}
                density="dense"
                leading={<StatusDot tone={severity.tone} shape={severity.shape} label={`${severity.label} severity`} />}
                title={item.message}
                selected={itemIndex === index}
                onOpen={() => setIndex(itemIndex)}
              />
            );
          })}
        </ItemGroup>
      }
      detail={
        <>
          <MasterDetailPaneHeader title={alarm.id.toUpperCase()} detail={`${index + 1} of ${MASTER_DETAIL_ALARMS.length}`}>
            <IconAction label="Previous alarm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              <IconChevronUp />
            </IconAction>
            <IconAction label="Next alarm" disabled={index === MASTER_DETAIL_ALARMS.length - 1} onClick={() => setIndex(index + 1)}>
              <IconChevronDown />
            </IconAction>
            <IconAction label="Open alarm in full page">
              <IconExternalLink />
            </IconAction>
            <IconAction label="Close details">
              <IconX />
            </IconAction>
          </MasterDetailPaneHeader>
          <MasterDetailAlarmDetail alarm={alarm} />
        </>
      }
    />
  );
}

function MasterDetailLoadingDetail() {
  return (
    <MasterDetailLayout
      className="h-72"
      masterWidth={48}
      masterLabel="Compression equipment"
      detailLabel="Asset details"
      master={<MasterDetailAssetList assets={MASTER_DETAIL_COMPRESSION} currentId={MASTER_DETAIL_COMPRESSION[2].id} onSelect={() => undefined} dense />}
      detail={
        <div role="status" aria-label="Loading asset details" className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      }
    />
  );
}

function MasterDetailErrorDetail() {
  return (
    <MasterDetailLayout
      className="h-72"
      masterWidth={48}
      masterLabel="Compression equipment"
      detailLabel="Asset details"
      master={<MasterDetailAssetList assets={MASTER_DETAIL_COMPRESSION} currentId={MASTER_DETAIL_COMPRESSION[2].id} onSelect={() => undefined} dense />}
      detail={
        <div className="flex flex-1 items-center justify-center p-4">
          <RetryBlock
            title="Couldn't load Recompressor"
            description="The list is still up to date."
            onRetry={() => Promise.reject(new Error('Still unavailable'))}
          />
        </div>
      }
    />
  );
}

function MasterDetailThreeColumn() {
  const [areaId, setAreaId] = useState('nk-23');
  const assets = childrenOf(areaId).filter((asset) => !['area', 'system'].includes(asset.type));
  const [currentId, setCurrentId] = useState<string>('23-ka-9103');
  const asset = assets.find((candidate) => candidate.id === currentId);

  return (
    <MasterDetailLayout
      navigationLabel="Plant areas"
      masterLabel="Assets"
      detailLabel="Asset details"
      masterWidth={28}
      navigation={
        <div className="p-2">
          <Tree
            rootItemId="nk"
            items={MASTER_DETAIL_TREE}
            getChildren={(node) => node.children}
            getItemName={(node) => node.name}
          >
            {(item) => {
              const isCurrent = item.getId() === areaId;
              return (
                <button
                  type="button"
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => setAreaId(item.getId())}
                  className={`min-w-0 flex-1 truncate rounded-md text-left text-sm outline-none focus-visible:shadow-focus-ring ${
                    isCurrent ? 'font-medium text-base-foreground' : 'text-medium-foreground'
                  }`}
                >
                  {item.getItemName()}
                </button>
              );
            }}
          </Tree>
        </div>
      }
      master={
        <>
          <MasterDetailPaneHeader title={findAsset(areaId)?.name ?? ''} detail={String(assets.length)} />
          {assets.length > 0 ? (
            <MasterDetailAssetList assets={assets} currentId={currentId} onSelect={setCurrentId} dense />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No equipment in this area.</p>
          )}
        </>
      }
      detail={
        asset ? (
          <MasterDetailAssetDetail asset={asset} />
        ) : (
          <MasterDetailPlaceholder title="No asset selected" description="Pick an asset from this area to see its details." />
        )
      }
    />
  );
}

function MasterDetailResizable() {
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_EQUIPMENT[0].id);
  const asset = findAsset(currentId) ?? MASTER_DETAIL_EQUIPMENT[0];

  return (
    <MasterDetailLayout
      resizable
      masterLabel="Assets"
      detailLabel="Asset details"
      master={<MasterDetailAssetList assets={MASTER_DETAIL_EQUIPMENT} currentId={currentId} onSelect={setCurrentId} />}
      detail={<MasterDetailAssetDetail asset={asset} />}
    />
  );
}

function MasterDetailEqualSplit() {
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_ALARMS[1].id);
  const alarm = MASTER_DETAIL_ALARMS.find((candidate) => candidate.id === currentId) ?? MASTER_DETAIL_ALARMS[0];
  const asset = findAsset(alarm.assetId);

  return (
    <MasterDetailLayout
      masterWidth={50}
      masterLabel="Alarms"
      detailLabel="Affected asset"
      master={
        <>
          <MasterDetailPaneHeader title="Alarms" detail={String(MASTER_DETAIL_ALARMS.length)} />
          <ItemGroup aria-label="Alarms" className="p-2">
            {MASTER_DETAIL_ALARMS.map((item) => {
              const severity = severityStatus(item.severity);
              return (
                <EntityRow
                  key={item.id}
                  leading={<StatusDot tone={severity.tone} shape={severity.shape} label={`${severity.label} severity`} />}
                  title={item.message}
                  description={`${findAsset(item.assetId)?.name ?? ''} · ${item.value} against ${item.limit}`}
                  meta={<span className="tabular-nums">{formatAgo(item.raisedAt)}</span>}
                  selected={currentId === item.id}
                  onOpen={() => setCurrentId(item.id)}
                />
              );
            })}
          </ItemGroup>
        </>
      }
      detail={
        asset ? (
          <>
            <MasterDetailPaneHeader title="Affected asset" />
            <MasterDetailAssetDetail asset={asset} />
          </>
        ) : null
      }
    />
  );
}

function MasterDetailStackedList() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const asset = currentId ? findAsset(currentId) : undefined;

  return (
    <div className="mx-auto w-full max-w-sm">
      <MasterDetailLayout
        mode="stacked"
        className="h-96"
        masterLabel="Assets"
        detailLabel="Asset details"
        detailOpen={asset !== undefined}
        onBack={() => setCurrentId(null)}
        backLabel="Gas compression"
        master={
          <>
            <MasterDetailPaneHeader title="Gas compression" detail={String(MASTER_DETAIL_COMPRESSION.length)} />
            <MasterDetailAssetList assets={MASTER_DETAIL_COMPRESSION} currentId={null} onSelect={setCurrentId} />
          </>
        }
        detail={asset ? <MasterDetailAssetDetail asset={asset} /> : null}
      />
    </div>
  );
}

function MasterDetailStackedDetail() {
  const [currentId, setCurrentId] = useState<string | null>('23-ka-9101');
  const asset = currentId ? findAsset(currentId) : undefined;

  return (
    <div className="mx-auto w-full max-w-sm">
      <MasterDetailLayout
        mode="stacked"
        className="h-96"
        masterLabel="Assets"
        detailLabel="Asset details"
        detailOpen={asset !== undefined}
        onBack={() => setCurrentId(null)}
        backLabel="Gas compression"
        master={
          <>
            <MasterDetailPaneHeader title="Gas compression" detail={String(MASTER_DETAIL_COMPRESSION.length)} />
            <MasterDetailAssetList assets={MASTER_DETAIL_COMPRESSION} currentId={null} onSelect={setCurrentId} />
          </>
        }
        detail={asset ? <MasterDetailAssetDetail asset={asset} /> : null}
      />
    </div>
  );
}

function MasterDetailKeyboard() {
  const [index, setIndex] = useState(2);
  const asset = MASTER_DETAIL_EQUIPMENT[index];
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'j') setIndex(Math.min(index + 1, MASTER_DETAIL_EQUIPMENT.length - 1));
    else if (event.key === 'ArrowUp' || event.key === 'k') setIndex(Math.max(index - 1, 0));
    else return;
    event.preventDefault();
  };

  return (
    <MasterDetailLayout
      masterLabel="Assets"
      detailLabel="Asset details"
      master={
        <>
          {/* Arrow keys move the current row from anywhere inside the list. */}
          <div role="presentation" onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-y-auto">
            <ItemGroup aria-label="Assets" className="p-2">
              {MASTER_DETAIL_EQUIPMENT.map((item, itemIndex) => (
                <EntityRow
                  key={item.id}
                  density="dense"
                  leading={<IconEngine />}
                  title={item.name}
                  meta={<span className="font-mono">{item.tag}</span>}
                  selected={itemIndex === index}
                  onOpen={() => setIndex(itemIndex)}
                />
              ))}
            </ItemGroup>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-default px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShortcutHint keys={['↑']} platform="mac" />
              <ShortcutHint keys={['↓']} platform="mac" /> Move
            </span>
            <span className="flex items-center gap-1.5">
              <ShortcutHint keys={['enter']} platform="mac" /> Open
            </span>
            <span className="flex items-center gap-1.5">
              <ShortcutHint keys={['esc']} platform="mac" /> Close
            </span>
          </div>
        </>
      }
      detail={<MasterDetailAssetDetail asset={asset} />}
    />
  );
}

function MasterDetailMultiSelect() {
  const selection = useSelection(
    MASTER_DETAIL_ORDERS.map((order) => order.id),
    [MASTER_DETAIL_ORDERS[1].id, MASTER_DETAIL_ORDERS[3].id, MASTER_DETAIL_ORDERS[4].id]
  );
  const [currentId, setCurrentId] = useState<string>(MASTER_DETAIL_ORDERS[1].id);
  const picked = MASTER_DETAIL_ORDERS.filter((order) => selection.isSelected(order.id));
  const current = MASTER_DETAIL_ORDERS.find((order) => order.id === currentId) ?? MASTER_DETAIL_ORDERS[0];

  return (
    <MasterDetailLayout
      masterLabel="Work orders"
      detailLabel={picked.length > 1 ? 'Selected work orders' : 'Work order details'}
      masterWidth={44}
      master={
        <>
          <MasterDetailPaneHeader title="Work orders" detail={selection.count > 0 ? `${selection.count} selected` : String(MASTER_DETAIL_ORDERS.length)}>
            {selection.count > 0 ? (
              <Button variant="ghost" size="sm" onClick={selection.clear}>
                Clear
              </Button>
            ) : null}
          </MasterDetailPaneHeader>
          <ItemGroup aria-label="Work orders" className="p-2">
            {MASTER_DETAIL_ORDERS.map((order) => (
              <EntityRow
                key={order.id}
                title={order.title}
                description={order.id}
                meta={<StatusBadge status={order.status} showIcon={false} />}
                selected={selection.isSelected(order.id) || (selection.count === 0 && currentId === order.id)}
                onOpen={() => setCurrentId(order.id)}
                selection={{
                  checked: selection.isSelected(order.id),
                  onChange: (checked) => selection.toggle(order.id, checked),
                  label: `Select ${order.id}`,
                }}
              />
            ))}
          </ItemGroup>
        </>
      }
      detail={
        picked.length > 1 ? (
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold text-base-foreground">{picked.length} work orders selected</h3>
              <p className="text-sm tabular-nums text-muted-foreground">
                {picked.reduce((sum, order) => sum + order.estimatedHours, 0)} h estimated in total
              </p>
            </div>
            <div className="max-w-md">
              <MetadataList items={picked.map((order) => ({ label: order.id, value: <StatusBadge status={order.status} /> }))} />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm">
                <IconUserPlus /> Assign {picked.length}
              </Button>
              <Button variant="outline" size="sm">
                Change status
              </Button>
            </div>
          </div>
        ) : (
          <MasterDetailOrderDetail order={picked[0] ?? current} />
        )
      }
    />
  );
}

export default definePage({
  id: 'master-detail',
  title: 'Master-detail',
  summary:
    'A list beside the record selected in it, so people can move through many records without losing their place. Covers the split, what each pane holds, and how it behaves when narrow, loading or empty.',
  guidance: {
    use: [
      'Use it when people work through a list one record at a time: triaging alarms, reviewing work orders.',
      'Highlight the row that is open and keep the list scrolled where it was.',
      'Give the detail pane an empty state for "nothing selected" and its own loading and error states.',
      'Stack the panes with a back button when the container is narrow.',
    ],
    avoid: [
      'A detail pane for records that need the full page; link to a detail page.',
      'Reloading or re-sorting the list when a row is opened.',
      'More than three columns.',
      'Putting the only primary action in the list when it acts on the open record.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'List and detail',
      description: 'The basic split for the records industrial apps triage most.',
      specimens: [
        {
          id: 'MasterDetailAssets',
          title: 'Asset list and detail',
          note: 'Equipment on the left; state, key facts and latest readings of the selected asset on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'display/MetadataList.tsx', 'industrial/Sparkline.tsx'],
          Component: MasterDetailAssets,
        },
        {
          id: 'MasterDetailAlarms',
          title: 'Alarm list and detail',
          note: 'Triage alarms top to bottom: the detail says what tripped and holds the acknowledge action.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'industrial/StatusDot.tsx', 'display/MetadataList.tsx'],
          Component: MasterDetailAlarms,
        },
        {
          id: 'MasterDetailWorkOrders',
          title: 'Work order list and detail',
          note: 'A planner reviews orders one by one without leaving the list.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: MasterDetailWorkOrders,
        },
        {
          id: 'MasterDetailSelectedRow',
          title: 'Selected row highlighting',
          note: 'The open row keeps a filled background and aria-current, so the two panes read as one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailSelectedRow,
        },
        {
          id: 'MasterDetailEmptySelection',
          title: 'Empty selection',
          note: 'Before anything is picked, the detail pane says what will appear and how to get it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailEmptySelection,
        },
      ],
    },
    {
      id: 'master',
      title: 'Master pane',
      description: 'Finding and narrowing the list.',
      specimens: [
        {
          id: 'MasterDetailSearch',
          title: 'Search in the master',
          note: 'Search sits above the list with a result count; the detail keeps showing the open record while it still matches.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailSearch,
        },
        {
          id: 'MasterDetailFilteredMaster',
          title: 'View switch in the master',
          note: 'A small segmented control swaps saved views of the list without touching the detail layout.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailFilteredMaster,
        },
        {
          id: 'MasterDetailGroupedMaster',
          title: 'Grouped master',
          note: 'Section headers split a long list by area, with dense rows to keep more in view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailGroupedMaster,
        },
        {
          id: 'MasterDetailTableMaster',
          title: 'Table as master',
          note: 'When rows need columns and sorting, a wider table is the master and the detail takes the rest.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/DataTable.tsx'],
          Component: MasterDetailTableMaster,
        },
        {
          id: 'MasterDetailMasterLoading',
          title: 'Loading the list',
          note: 'Skeleton rows in the master while the first page loads; the detail waits with a short message.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'feedback/SkeletonList.tsx'],
          Component: MasterDetailMasterLoading,
        },
        {
          id: 'MasterDetailNoResults',
          title: 'No results',
          note: 'A search that matches nothing says so in the master and offers to clear it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailNoResults,
        },
      ],
    },
    {
      id: 'detail',
      title: 'Detail pane',
      description: 'What the selected record shows and how it loads.',
      specimens: [
        {
          id: 'MasterDetailTabs',
          title: 'Tabs in the detail',
          note: 'Split a rich record into facets; the tab stays put as the user moves down the list.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'display/MetadataList.tsx'],
          Component: MasterDetailTabs,
        },
        {
          id: 'MasterDetailStickyFooter',
          title: 'Sticky action footer',
          note: 'The actions for the open record stay at the bottom of the pane while its content scrolls.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'display/MetadataList.tsx'],
          Component: MasterDetailStickyFooter,
        },
        {
          id: 'MasterDetailHeaderNavigation',
          title: 'Detail header with navigation',
          note: 'Previous, next, open in full and close in the pane header, with the position in the list.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'patterns/collections/IconAction.tsx'],
          Component: MasterDetailHeaderNavigation,
        },
        {
          id: 'MasterDetailLoadingDetail',
          title: 'Loading detail',
          note: 'The row highlights at once and the pane shows a skeleton until the record arrives.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailLoadingDetail,
        },
        {
          id: 'MasterDetailErrorDetail',
          title: 'Detail failed to load',
          note: 'Only the pane fails: the list stays usable and the pane offers a retry.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'feedback/RetryBlock.tsx'],
          Component: MasterDetailErrorDetail,
        },
      ],
    },
    {
      id: 'layouts',
      title: 'Layouts',
      description: 'More columns, movable splits and narrow containers.',
      specimens: [
        {
          id: 'MasterDetailThreeColumn',
          title: 'Three columns',
          note: 'A hierarchy scopes the list and the list drives the detail: tree, then assets, then one asset.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailThreeColumn,
        },
        {
          id: 'MasterDetailResizable',
          title: 'Resizable split',
          note: 'A handle between the panes, draggable and movable with the arrow keys, for lists with long names.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailResizable,
        },
        {
          id: 'MasterDetailEqualSplit',
          title: 'Equal split',
          note: 'Half and half when the list rows carry as much as the detail, such as alarms beside the affected asset.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'industrial/StatusDot.tsx'],
          Component: MasterDetailEqualSplit,
        },
        {
          id: 'MasterDetailStackedList',
          title: 'Stacked, list first',
          note: 'In a narrow container the list takes the full width and a row opens the detail in its place.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailStackedList,
        },
        {
          id: 'MasterDetailStackedDetail',
          title: 'Stacked, detail with back',
          note: 'The detail replaces the list and a back button named after the list returns to it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: MasterDetailStackedDetail,
        },
      ],
    },
    {
      id: 'power',
      title: 'Power use',
      description: 'Moving fast through many records.',
      specimens: [
        {
          id: 'MasterDetailKeyboard',
          title: 'Keyboard hint row',
          note: 'A quiet footer under the list teaches the keys that move, open and close.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'actions/ShortcutHint.tsx'],
          Component: MasterDetailKeyboard,
        },
        {
          id: 'MasterDetailMultiSelect',
          title: 'Multi-select summary',
          note: 'With several rows ticked, the detail pane summarises the selection and holds the bulk actions.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/MasterDetailLayout.tsx', 'patterns/collections/EntityRow.tsx', 'patterns/collections/useSelection.ts'],
          Component: MasterDetailMultiSelect,
        },
      ],
    },
  ],
});
