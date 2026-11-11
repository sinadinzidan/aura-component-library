import { Button } from '@cognite/aura/components/button';
import { Kbd } from '@cognite/aura/components/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconBell, IconChartLine, IconFolder, IconSearch } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { Pane } from '../../../library/primitives/resizable/Pane';
import { PaneHandle } from '../../../library/primitives/resizable/PaneHandle';
import { ResizablePanes } from '../../../library/primitives/resizable/ResizablePanes';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { ALARMS, ASSETS, SENSORS, findAsset } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './resizable-panes.tsx?raw';

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const SCRIPT_LINES = [
  'select tag, value, unit',
  'from time_series_latest',
  "where asset = '23-KA-9101'",
  'order by tag;',
];

const CONSOLE_LINES = [
  '02:00:03  Connected to historian',
  '02:01:44  Read 182,400 rows',
  '02:04:15  Wrote 182,400 rows',
  '02:04:15  Run finished',
];

const RAIL_ITEMS = [
  { label: 'Search', icon: <IconSearch /> },
  { label: 'Assets', icon: <IconFolder /> },
  { label: 'Alarms', icon: <IconBell /> },
  { label: 'Trends', icon: <IconChartLine /> },
];

function ResizablePrimFrame({ children, height = 'h-72' }: { children: ReactNode; height?: string }) {
  return (
    <div className={`${height} w-full overflow-hidden rounded-xl border border-default bg-base-background`}>
      {children}
    </div>
  );
}

function ResizablePrimBox({
  title,
  detail,
  muted = false,
  children,
}: {
  title: string;
  detail?: string;
  muted?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`flex size-full min-w-0 flex-col gap-1 overflow-auto p-4 ${muted ? 'bg-muted-background' : ''}`}>
      <h3 className="truncate text-sm font-medium text-base-foreground">{title}</h3>
      {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      {children}
    </div>
  );
}

function ResizablePrimAssetList({ onlySelected = false, tagsOnly = false }: { onlySelected?: boolean; tagsOnly?: boolean }) {
  const rows = onlySelected ? EQUIPMENT.slice(0, 3) : EQUIPMENT;
  return (
    <ul className="flex flex-col py-1">
      {rows.map((asset) => (
        <li key={asset.id} className="flex items-center gap-3 px-4 py-1.5 text-sm">
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{asset.tag}</span>
          {tagsOnly ? null : <span className="min-w-0 flex-1 truncate text-base-foreground">{asset.name}</span>}
        </li>
      ))}
    </ul>
  );
}

function ResizablePrimTwoPanes() {
  return (
    <ResizablePrimFrame>
      <ResizablePanes>
        <Pane label="Navigation" defaultSize={30} minSize={15} maxSize={50}>
          <ResizablePrimBox title="Navigation" detail="Starts at 30%." muted />
        </Pane>
        <PaneHandle />
        <Pane label="Content" minSize={30}>
          <ResizablePrimBox title="Content" detail="Takes the rest." />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimThreePanes() {
  return (
    <ResizablePrimFrame>
      <ResizablePanes>
        <Pane label="Filters" defaultSize={22} minSize={14}>
          <ResizablePrimBox title="Filters" muted />
        </Pane>
        <PaneHandle />
        <Pane label="Results" defaultSize={50} minSize={25}>
          <ResizablePrimBox title="Results" />
        </Pane>
        <PaneHandle />
        <Pane label="Preview" defaultSize={28} minSize={14}>
          <ResizablePrimBox title="Preview" muted />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimVertical() {
  return (
    <ResizablePrimFrame>
      <ResizablePanes orientation="vertical">
        <Pane label="Chart" defaultSize={65} minSize={30}>
          <ResizablePrimBox title="Chart" detail="Arrow up and down resize a vertical split." />
        </Pane>
        <PaneHandle />
        <Pane label="Table" minSize={20}>
          <ResizablePrimBox title="Table" muted />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimEqualColumns() {
  return (
    <ResizablePrimFrame height="h-56">
      <ResizablePanes>
        <Pane label="Stage 1" minSize={15}>
          <ResizablePrimBox title="Stage 1" detail="Equal share until resized." />
        </Pane>
        <PaneHandle />
        <Pane label="Stage 2" minSize={15}>
          <ResizablePrimBox title="Stage 2" detail="Equal share until resized." muted />
        </Pane>
        <PaneHandle />
        <Pane label="Stage 3" minSize={15}>
          <ResizablePrimBox title="Stage 3" detail="Equal share until resized." />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimLimits() {
  const [sizes, setSizes] = useState<readonly number[]>([35, 65]);
  return (
    <div className="flex w-full flex-col gap-2">
      <ResizablePrimFrame height="h-56">
        <ResizablePanes defaultLayout={[35, 65]} onLayoutChange={setSizes}>
          <Pane label="Sidebar" defaultSize={35} minSize={20} maxSize={50}>
            <ResizablePrimBox title="Sidebar" detail="Between 20% and 50%." muted />
          </Pane>
          <PaneHandle />
          <Pane label="Main" minSize={40}>
            <ResizablePrimBox title="Main" detail="Never below 40%." />
          </Pane>
        </ResizablePanes>
      </ResizablePrimFrame>
      <p className="text-xs text-muted-foreground tabular-nums">
        Sidebar {Math.round(sizes[0])}% · Main {Math.round(sizes[1])}%
      </p>
    </div>
  );
}

function ResizablePrimSideBySide() {
  return (
    <ResizablePrimFrame>
      <ResizablePanes>
        <Pane label="23-KA-9101" minSize={25}>
          <ResizablePrimBox title="23-KA-9101" detail="1st stage compressor · health 72" />
        </Pane>
        <PaneHandle />
        <Pane label="23-KA-9102" minSize={25}>
          <ResizablePrimBox title="23-KA-9102" detail="2nd stage compressor · health 88" muted />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimCollapsibleSidebar() {
  return (
    <ResizablePrimFrame>
      <ResizablePanes>
        <Pane label="Sidebar" defaultSize={26} minSize={16} maxSize={40} collapsible>
          <ResizablePrimBox title="Asset hierarchy" detail="Drag below 8% or press Enter on the handle to collapse." muted />
        </Pane>
        <PaneHandle />
        <Pane label="Content" minSize={40}>
          <ResizablePrimBox title="Compressors" detail="Press Enter on the divider to bring the sidebar back." />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimIconRail() {
  return (
    <ResizablePrimFrame>
      <ResizablePanes>
        <Pane
          label="Workspace"
          defaultSize={24}
          minSize={16}
          maxSize={40}
          collapsible
          collapsedSize={6}
          collapsedContent={
            <nav aria-label="Workspace shortcuts" className="flex h-full flex-col items-center gap-1 bg-muted-background py-2">
              {RAIL_ITEMS.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={item.label}>
                        {item.icon}
                      </Button>
                    }
                  />
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          }
        >
          <nav aria-label="Workspace" className="flex h-full flex-col gap-1 bg-muted-background p-2">
            {RAIL_ITEMS.map((item) => (
              <Button key={item.label} variant="ghost" size="sm" className="justify-start">
                {item.icon} {item.label}
              </Button>
            ))}
          </nav>
        </Pane>
        <PaneHandle />
        <Pane label="Content" minSize={40}>
          <ResizablePrimBox title="Alarms" detail="Collapsing leaves an icon rail instead of hiding the sidebar." />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimCollapsibleBottom() {
  return (
    <ResizablePrimFrame>
      <ResizablePanes orientation="vertical">
        <Pane label="Canvas" minSize={40}>
          <ResizablePrimBox title="Process canvas" />
        </Pane>
        <PaneHandle />
        <Pane label="Console" defaultSize={30} minSize={15} maxSize={60} collapsible>
          <ResizablePrimBox title="Console" muted>
            <pre className="font-mono text-xs leading-5 text-muted-foreground">{CONSOLE_LINES.join('\n')}</pre>
          </ResizablePrimBox>
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimHandleLine() {
  return (
    <ResizablePrimFrame height="h-56">
      <ResizablePanes>
        <Pane label="Left" minSize={20}>
          <ResizablePrimBox title="Line handle" detail="A hairline that thickens on hover." />
        </Pane>
        <PaneHandle variant="line" />
        <Pane label="Right" minSize={20}>
          <ResizablePrimBox title="Right" muted />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimHandleGrip() {
  return (
    <ResizablePrimFrame height="h-56">
      <ResizablePanes>
        <Pane label="Left" minSize={20}>
          <ResizablePrimBox title="Grip handle" detail="A visible pill for first-time discoverability." />
        </Pane>
        <PaneHandle variant="grip" />
        <Pane label="Right" minSize={20}>
          <ResizablePrimBox title="Right" muted />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimMasterDetail() {
  const asset = findAsset('23-ka-9101');
  return (
    <ResizablePrimFrame height="h-80">
      <ResizablePanes>
        <Pane label="Assets" defaultSize={42} minSize={25} maxSize={60}>
          <div className="size-full overflow-y-auto">
            <ResizablePrimAssetList />
          </div>
        </Pane>
        <PaneHandle variant="grip" />
        <Pane label="Asset details" minSize={30}>
          <ResizablePrimBox title={asset?.name ?? 'Asset'} detail={asset?.tag}>
            <div className="pt-3">
              <MetadataList
                items={[
                  { label: 'Type', value: asset?.type },
                  { label: 'Criticality', value: asset?.criticality },
                  { label: 'Health score', value: <span className="tabular-nums">{asset?.healthScore}</span> },
                ]}
              />
            </div>
          </ResizablePrimBox>
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimEditorPreview() {
  return (
    <ResizablePrimFrame height="h-80">
      <ResizablePanes>
        <Pane label="Query" defaultSize={50} minSize={25}>
          <ResizablePrimBox title="Query" muted>
            <pre className="pt-2 font-mono text-xs leading-5 text-base-foreground">{SCRIPT_LINES.join('\n')}</pre>
          </ResizablePrimBox>
        </Pane>
        <PaneHandle />
        <Pane label="Preview" minSize={25}>
          <ResizablePrimBox title="Preview" detail="4 rows">
            <Table density="compact">
              <TableCaption srOnly>Query result</TableCaption>
              <TableBody>
                {SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101')
                  .slice(0, 4)
                  .map((sensor) => (
                    <TableRow key={sensor.id}>
                      <TableCell mono muted>
                        {sensor.tag}
                      </TableCell>
                      <TableCell numeric>
                        {sensor.value.toLocaleString('en-US')} {sensor.unit}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ResizablePrimBox>
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimTreeContentInspector() {
  const asset = findAsset('23-ha-9114');
  return (
    <ResizablePrimFrame height="h-96">
      <ResizablePanes>
        <Pane label="Hierarchy" defaultSize={24} minSize={16} maxSize={40} collapsible>
          <div className="size-full overflow-y-auto bg-muted-background">
            <ResizablePrimAssetList tagsOnly />
          </div>
        </Pane>
        <PaneHandle />
        <Pane label="Signals" defaultSize={50} minSize={30}>
          <ResizablePrimBox title="Signals" detail="Interstage cooler">
            <ul className="flex flex-col gap-1 pt-2 text-sm">
              {SENSORS.slice(0, 6).map((sensor) => (
                <li key={sensor.id} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-base-foreground">{sensor.name}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {sensor.value.toLocaleString('en-US')} {sensor.unit}
                  </span>
                </li>
              ))}
            </ul>
          </ResizablePrimBox>
        </Pane>
        <PaneHandle />
        <Pane label="Inspector" defaultSize={26} minSize={18} maxSize={40} collapsible>
          <ResizablePrimBox title="Inspector" detail={asset?.tag} muted>
            <p className="pt-2 text-sm text-muted-foreground tabular-nums">Health score {asset?.healthScore}</p>
          </ResizablePrimBox>
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimConsoleUnderCanvas() {
  return (
    <ResizablePrimFrame height="h-80">
      <ResizablePanes orientation="vertical">
        <Pane label="Canvas" defaultSize={72} minSize={35}>
          <ResizablePrimBox title="Process canvas" detail="Compressor train NK-23" />
        </Pane>
        <PaneHandle variant="grip" />
        <Pane label="Console" minSize={12} maxSize={50}>
          <ResizablePrimBox title="Console" muted>
            <pre className="font-mono text-xs leading-5 text-muted-foreground">{CONSOLE_LINES.join('\n')}</pre>
          </ResizablePrimBox>
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimIdeLayout() {
  return (
    <ResizablePrimFrame height="h-96">
      <ResizablePanes>
        <Pane label="Explorer" defaultSize={20} minSize={12} maxSize={35} collapsible>
          <div className="size-full overflow-y-auto bg-muted-background">
            <ResizablePrimAssetList onlySelected tagsOnly />
          </div>
        </Pane>
        <PaneHandle />
        <Pane label="Workspace" minSize={40}>
          <ResizablePanes orientation="vertical">
            <Pane label="Editor" defaultSize={65} minSize={30}>
              <ResizablePrimBox title="query.sql">
                <pre className="pt-2 font-mono text-xs leading-5 text-base-foreground">{SCRIPT_LINES.join('\n')}</pre>
              </ResizablePrimBox>
            </Pane>
            <PaneHandle />
            <Pane label="Output" minSize={15} collapsible>
              <ResizablePrimBox title="Output" muted>
                <pre className="font-mono text-xs leading-5 text-muted-foreground">{CONSOLE_LINES.join('\n')}</pre>
              </ResizablePrimBox>
            </Pane>
          </ResizablePanes>
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimPersisted() {
  const [saved, setSaved] = useState<readonly number[]>([30, 70]);
  const [mount, setMount] = useState(0);
  return (
    <div className="flex w-full flex-col gap-2">
      <ResizablePrimFrame height="h-52">
        <ResizablePanes key={mount} defaultLayout={saved} onLayoutChange={setSaved}>
          <Pane label="List" defaultSize={30} minSize={15}>
            <ResizablePrimBox title="List" muted />
          </Pane>
          <PaneHandle />
          <Pane label="Detail" minSize={30}>
            <ResizablePrimBox title="Detail" />
          </Pane>
        </ResizablePanes>
      </ResizablePrimFrame>
      <div className="flex flex-wrap items-center gap-3">
        <code className="font-mono text-xs text-muted-foreground tabular-nums">layout = [{saved.map((size) => Math.round(size)).join(', ')}]</code>
        <Button variant="outline" size="sm" onClick={() => setMount((count) => count + 1)}>
          Remount from saved layout
        </Button>
      </div>
    </div>
  );
}

function ResizablePrimKeyboard() {
  return (
    <div className="flex w-full flex-col gap-3">
      <ResizablePrimFrame height="h-40">
        <ResizablePanes>
          <Pane label="Navigation" defaultSize={30} minSize={15} maxSize={50} collapsible>
            <ResizablePrimBox title="Navigation" muted />
          </Pane>
          <PaneHandle />
          <Pane label="Content" minSize={30}>
            <ResizablePrimBox title="Tab to the divider and try the keys" />
          </Pane>
        </ResizablePanes>
      </ResizablePrimFrame>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <dt>
          <Kbd>←</Kbd> <Kbd>→</Kbd>
        </dt>
        <dd>Resize by 2% (up and down in a vertical split); hold Shift for 10%</dd>
        <dt>
          <Kbd>Home</Kbd> <Kbd>End</Kbd>
        </dt>
        <dd>Jump to the smallest or largest size</dd>
        <dt>
          <Kbd>Enter</Kbd>
        </dt>
        <dd>Collapse or expand a collapsible pane</dd>
        <dt>Double-click</dt>
        <dd>Reset every pane to its default size</dd>
      </dl>
    </div>
  );
}

function ResizablePrimTrendsStacked() {
  return (
    <ResizablePrimFrame height="h-80">
      <ResizablePanes orientation="vertical">
        <Pane label="Discharge pressure" minSize={15}>
          <ResizablePrimBox title="23-PT-92531 Discharge pressure" />
        </Pane>
        <PaneHandle />
        <Pane label="Discharge temperature" minSize={15}>
          <ResizablePrimBox title="23-TT-92532 Discharge temperature" muted />
        </Pane>
        <PaneHandle />
        <Pane label="Drive-end vibration" minSize={15}>
          <ResizablePrimBox title="23-VT-92540 Drive-end vibration" />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimAlarmsAndDetail() {
  return (
    <ResizablePrimFrame height="h-80">
      <ResizablePanes orientation="vertical">
        <Pane label="Alarms" defaultSize={55} minSize={25}>
          <ul className="size-full divide-y divide-default overflow-y-auto">
            {ALARMS.slice(0, 5).map((alarm) => (
              <li key={alarm.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-base-foreground">{alarm.message}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatAgo(alarm.raisedAt)}</span>
              </li>
            ))}
          </ul>
        </Pane>
        <PaneHandle />
        <Pane label="Alarm detail" minSize={20}>
          <ResizablePrimBox title="Recompressor tripped on high vibration" detail="Alarm alm-4812 · 11.6 mm/s against 11.0 mm/s" muted />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimKpiStrip() {
  return (
    <ResizablePrimFrame>
      <ResizablePanes orientation="vertical">
        <Pane label="Key figures" defaultSize={24} minSize={16} maxSize={40}>
          <ResizablePrimBox title="Key figures" detail="Availability 96.4% · OEE 82.7%" muted />
        </Pane>
        <PaneHandle />
        <Pane label="Trend" minSize={40}>
          <ResizablePrimBox title="Gas export" detail="4.38 MSm³/d" />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

function ResizablePrimNarrowMinimum() {
  return (
    <ResizablePrimFrame height="h-56">
      <ResizablePanes>
        <Pane label="Tags" defaultSize={18} minSize={18} maxSize={30}>
          <ResizablePrimBox title="Tags" detail="Fixed range: 18% to 30%." muted />
        </Pane>
        <PaneHandle />
        <Pane label="Trend" minSize={50}>
          <ResizablePrimBox title="Trend" detail="At least half the width." />
        </Pane>
      </ResizablePanes>
    </ResizablePrimFrame>
  );
}

const U = (...names: string[]) => names.map((name) => `primitives/resizable/${name}.tsx`);

export default definePage({
  id: 'resizable-panes',
  title: 'Resizable panes',
  summary:
    'Resizable panes split a view into regions the user can resize with a drag or the keyboard. Each pane has limits, panes can collapse, and sizes are percentages that survive a window resize.',
  guidance: {
    use: [
      'Master-detail, tree plus content, editor plus preview and consoles under a canvas.',
      'Limits on every pane so content never becomes unusable; collapsible for secondary regions.',
      'A grip handle where people may not know the divider moves; a line handle in dense layouts.',
      'Persist the sizes the user chose with onLayoutChange and defaultLayout.',
    ],
    avoid: [
      'Resizing as the only way to see content; make the content usable at its default size.',
      'More than three panes in a row; use nesting and collapsing.',
      'Handles that are only draggable; keyboard resize is required.',
      'Collapsing to nothing for navigation; leave an icon rail.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Splits',
      description: 'Panes and the divider between them.',
      specimens: [
        { id: 'ResizablePrimTwoPanes', title: 'Two panes', note: 'The base case: a navigation pane with limits beside content.', origin: 'custom', size: 'lg', align: 'stretch', uses: U('ResizablePanes', 'Pane', 'PaneHandle'), Component: ResizablePrimTwoPanes },
        { id: 'ResizablePrimThreePanes', title: 'Three panes', note: 'Filters, results and preview, each with its own limits.', origin: 'custom', size: 'full', align: 'stretch', uses: U('ResizablePanes', 'Pane', 'PaneHandle'), Component: ResizablePrimThreePanes },
        { id: 'ResizablePrimVertical', title: 'Vertical split', note: 'A chart over a table; the divider moves with the up and down arrows.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ResizablePanes'), Component: ResizablePrimVertical },
        { id: 'ResizablePrimSideBySide', title: 'Side by side', note: 'Compare two assets at an equal split; either side may grow to 75%.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ResizablePanes'), Component: ResizablePrimSideBySide },
        { id: 'ResizablePrimEqualColumns', title: 'Equal columns', note: 'Three panes with no defaults share the width evenly.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ResizablePanes', 'Pane'), Component: ResizablePrimEqualColumns },
        { id: 'ResizablePrimLimits', title: 'Minimum and maximum', note: 'Limits stop the drag, and the reported sizes update live.', origin: 'custom', size: 'md', align: 'stretch', uses: U('Pane'), Component: ResizablePrimLimits },
        { id: 'ResizablePrimNarrowMinimum', title: 'Narrow range', note: 'A side pane that can only move between 18% and 30%.', origin: 'custom', size: 'md', align: 'stretch', uses: U('Pane'), Component: ResizablePrimNarrowMinimum },
      ],
    },
    {
      id: 'collapse',
      title: 'Collapsing',
      description: 'Make room without losing the pane.',
      specimens: [
        { id: 'ResizablePrimCollapsibleSidebar', title: 'Collapsible sidebar', note: 'Drag past the limit or press Enter on the divider to hide it and bring it back.', origin: 'custom', size: 'lg', align: 'stretch', uses: U('Pane', 'PaneHandle'), Component: ResizablePrimCollapsibleSidebar },
        { id: 'ResizablePrimIconRail', title: 'Collapse to an icon rail', note: 'Navigation shrinks to icons with tooltips instead of disappearing.', origin: 'custom', size: 'lg', align: 'stretch', uses: U('Pane'), Component: ResizablePrimIconRail },
        { id: 'ResizablePrimCollapsibleBottom', title: 'Collapsible bottom panel', note: 'A console that tucks away under a canvas and returns on Enter.', origin: 'custom', size: 'lg', align: 'stretch', uses: U('Pane'), Component: ResizablePrimCollapsibleBottom },
      ],
    },
    {
      id: 'handles',
      title: 'Handle styles',
      description: 'How visible the divider is.',
      specimens: [
        { id: 'ResizablePrimHandleLine', title: 'Line', note: 'A hairline with a wide hit area, for dense layouts.', origin: 'custom', size: 'md', align: 'stretch', uses: U('PaneHandle'), Component: ResizablePrimHandleLine },
        { id: 'ResizablePrimHandleGrip', title: 'Grip', note: 'A visible pill that tells newcomers the divider moves.', origin: 'custom', size: 'md', align: 'stretch', uses: U('PaneHandle'), Component: ResizablePrimHandleGrip },
      ],
    },
    {
      id: 'layouts',
      title: 'Layouts',
      description: 'Resizable panes in working screens.',
      specimens: [
        { id: 'ResizablePrimMasterDetail', title: 'Master-detail', note: 'A list beside the selected record, both scrolling on their own.', origin: 'custom', size: 'lg', align: 'stretch', uses: U('ResizablePanes', 'PaneHandle'), Component: ResizablePrimMasterDetail },
        { id: 'ResizablePrimEditorPreview', title: 'Editor and preview', note: 'A query next to its result; drag to give either more room.', origin: 'custom', size: 'lg', align: 'stretch', uses: [...U('ResizablePanes'), 'primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'], Component: ResizablePrimEditorPreview },
        { id: 'ResizablePrimTreeContentInspector', title: 'Tree, content and inspector', note: 'Three columns where both outer panes collapse.', origin: 'custom', size: 'full', align: 'stretch', uses: U('ResizablePanes', 'Pane'), Component: ResizablePrimTreeContentInspector },
        { id: 'ResizablePrimConsoleUnderCanvas', title: 'Console under a canvas', note: 'A process canvas with run output underneath.', origin: 'custom', size: 'lg', align: 'stretch', uses: U('ResizablePanes', 'PaneHandle'), Component: ResizablePrimConsoleUnderCanvas },
        { id: 'ResizablePrimIdeLayout', title: 'Nested splits', note: 'Explorer beside a vertical editor and output split: groups nest freely.', origin: 'custom', size: 'full', align: 'stretch', uses: U('ResizablePanes', 'Pane', 'PaneHandle'), Component: ResizablePrimIdeLayout },
        { id: 'ResizablePrimTrendsStacked', title: 'Stacked trends', note: 'Three signals share a time axis and the user decides who gets the height.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ResizablePanes'), Component: ResizablePrimTrendsStacked },
        { id: 'ResizablePrimAlarmsAndDetail', title: 'Alarm list over detail', note: 'A list on top and the selected alarm below, for tall narrow screens.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ResizablePanes'), Component: ResizablePrimAlarmsAndDetail },
        { id: 'ResizablePrimKpiStrip', title: 'Key figures over trend', note: 'A capped strip above a trend: the strip can grow to 40% and no more.', origin: 'custom', size: 'md', align: 'stretch', uses: U('Pane'), Component: ResizablePrimKpiStrip },
      ],
    },
    {
      id: 'state',
      title: 'State and keyboard',
      description: 'Persisting sizes and operating the divider.',
      specimens: [
        { id: 'ResizablePrimPersisted', title: 'Persisted sizes', note: 'onLayoutChange reports sizes to store; defaultLayout restores them.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ResizablePanes'), Component: ResizablePrimPersisted },
        { id: 'ResizablePrimKeyboard', title: 'Keyboard instructions', note: 'The keys the divider responds to, next to a live example.', origin: 'custom', size: 'md', align: 'stretch', uses: U('PaneHandle'), Component: ResizablePrimKeyboard },
      ],
    },
  ],
});
