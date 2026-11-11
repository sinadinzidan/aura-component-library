import { Badge } from '@cognite/aura/components/badge';
import { Kbd } from '@cognite/aura/components/kbd';
import {
  IconChartLine,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconShare,
  IconTool,
  IconTrash,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ContextMenu } from '../../../library/primitives/context-menu/ContextMenu';
import { ContextMenuCheckboxItem } from '../../../library/primitives/context-menu/ContextMenuCheckboxItem';
import { ContextMenuContent } from '../../../library/primitives/context-menu/ContextMenuContent';
import { ContextMenuGroup } from '../../../library/primitives/context-menu/ContextMenuGroup';
import { ContextMenuItem } from '../../../library/primitives/context-menu/ContextMenuItem';
import { ContextMenuLabel } from '../../../library/primitives/context-menu/ContextMenuLabel';
import { ContextMenuMoreButton } from '../../../library/primitives/context-menu/ContextMenuMoreButton';
import { ContextMenuRadioGroup } from '../../../library/primitives/context-menu/ContextMenuRadioGroup';
import { ContextMenuRadioItem } from '../../../library/primitives/context-menu/ContextMenuRadioItem';
import { ContextMenuSeparator } from '../../../library/primitives/context-menu/ContextMenuSeparator';
import { ContextMenuShortcut } from '../../../library/primitives/context-menu/ContextMenuShortcut';
import { ContextMenuSub } from '../../../library/primitives/context-menu/ContextMenuSub';
import { ContextMenuSubContent } from '../../../library/primitives/context-menu/ContextMenuSubContent';
import { ContextMenuSubTrigger } from '../../../library/primitives/context-menu/ContextMenuSubTrigger';
import { ContextMenuTrigger } from '../../../library/primitives/context-menu/ContextMenuTrigger';
import { ALARMS, ASSETS, SENSORS, findAsset } from '../../data/plant';
import { formatAgo, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './context-menu.tsx?raw';

const AREAS = ASSETS.filter((asset) => asset.type === 'area');

const FILES = [
  { name: 'P&ID 23-KA-9101 rev C.pdf', size: '2.4 MB' },
  { name: 'Vibration survey March.xlsx', size: '184 kB' },
];

const TREE = [
  { tag: 'NK-23', name: 'Gas compression', children: ['23-KA-9101', '23-KA-9102', '23-KA-9103'] },
  { tag: 'NK-27', name: 'Gas export', children: ['27-PA-2001A', '27-PA-2001B'] },
];

const TREND = makeValues({ seed: 31, points: 24, base: 48, amplitude: 3, noise: 0.6, decimals: 1 });

const HINT = 'Right-click, long-press, or focus and press Shift+F10';

function ContextMenuPrimResult({ text }: { text: string }) {
  return (
    <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
      {text === '' ? 'No action chosen yet' : `Last action: ${text}`}
    </p>
  );
}

function ContextMenuPrimArea({ children, label }: { children?: ReactNode; label: string }) {
  return (
    <div className="flex w-full flex-col gap-1 rounded-xl bg-muted-background p-4">
      <span className="text-sm font-medium text-base-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{HINT}</span>
      {children}
    </div>
  );
}

function ContextMenuPrimBasic() {
  const [last, setLast] = useState('');
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <ContextMenu>
        <ContextMenuTrigger focusable className="rounded-xl">
          <ContextMenuPrimArea label="23-KA-9101 · 1st stage compressor" />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setLast('Open asset')}>Open asset</ContextMenuItem>
          <ContextMenuItem onClick={() => setLast('Copy tag')}>Copy tag</ContextMenuItem>
          <ContextMenuItem onClick={() => setLast('Show trend')}>Show trend</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <ContextMenuPrimResult text={last} />
    </div>
  );
}

function ContextMenuPrimNamedTarget() {
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl">
        <ContextMenuPrimArea label="Alarm 4812 · Recompressor tripped" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Alarm 4812</ContextMenuLabel>
          <ContextMenuItem>Acknowledge alarm</ContextMenuItem>
          <ContextMenuItem>Open asset 23-KA-9103</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimGroups() {
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl">
        <ContextMenuPrimArea label="Interstage cooler · 23-HA-9114" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>View</ContextMenuLabel>
          <ContextMenuItem>Open asset</ContextMenuItem>
          <ContextMenuItem>Show in hierarchy</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Work</ContextMenuLabel>
          <ContextMenuItem>Create work order</ContextMenuItem>
          <ContextMenuItem>Add inspection note</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimIcons() {
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl">
        <ContextMenuPrimArea label="Nordkapp compressor telemetry" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <IconPencil /> Rename
        </ContextMenuItem>
        <ContextMenuItem>
          <IconCopy /> Duplicate
        </ContextMenuItem>
        <ContextMenuItem>
          <IconShare /> Share
        </ContextMenuItem>
        <ContextMenuItem>
          <IconDownload /> Export as CSV
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimDestructive() {
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl">
        <ContextMenuPrimArea label="Draft alert rule · discharge temperature" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <IconPencil /> Edit rule
        </ContextMenuItem>
        <ContextMenuItem>
          <IconCopy /> Duplicate rule
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <IconTrash /> Delete rule
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimDisabledReason() {
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl">
        <ContextMenuPrimArea label="Recompressor · 23-KA-9103 · tripped" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabledReason="Reset the trip first">Start compressor</ContextMenuItem>
        <ContextMenuItem>Reset trip</ContextMenuItem>
        <ContextMenuItem disabledReason="Requires the planner role">Release permit</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimShortcuts() {
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl">
        <ContextMenuPrimArea label="Time series 23-PT-92531" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          Copy tag <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Add to chart <ContextMenuShortcut>A</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Open details <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Remove <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimCheckboxes() {
  const [columns, setColumns] = useState({ tag: true, unit: true, quality: false });
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl">
        <ContextMenuPrimArea label="Time series table header" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>Columns</ContextMenuLabel>
          <ContextMenuCheckboxItem checked={columns.tag} onCheckedChange={(tag) => setColumns({ ...columns, tag })}>
            Tag
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={columns.unit} onCheckedChange={(unit) => setColumns({ ...columns, unit })}>
            Unit
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={columns.quality}
            onCheckedChange={(quality) => setColumns({ ...columns, quality })}
          >
            Signal quality
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimRadios() {
  const [range, setRange] = useState('24h');
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl">
        <ContextMenuPrimArea label="Trend · time range" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>Time range</ContextMenuLabel>
          <ContextMenuRadioGroup value={range} onValueChange={setRange}>
            <ContextMenuRadioItem value="1h">Last hour</ContextMenuRadioItem>
            <ContextMenuRadioItem value="24h">Last 24 hours</ContextMenuRadioItem>
            <ContextMenuRadioItem value="7d">Last 7 days</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimSubmenu() {
  const [last, setLast] = useState('');
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <ContextMenu>
        <ContextMenuTrigger focusable className="rounded-xl">
          <ContextMenuPrimArea label="Discharge pressure · 23-PT-92531" />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setLast('Open details')}>Open details</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Add to</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={() => setLast('Add to trend view')}>Trend view</ContextMenuItem>
              <ContextMenuItem onClick={() => setLast('Add to dashboard')}>Compressor dashboard</ContextMenuItem>
              <ContextMenuItem onClick={() => setLast('Add to new chart')}>
                <IconPlus /> New chart
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
      <ContextMenuPrimResult text={last} />
    </div>
  );
}

function ContextMenuPrimTableRow() {
  const assets = ASSETS.filter((asset) => asset.type === 'compressor').slice(0, 3);
  return (
    <table className="w-full max-w-md text-left text-sm">
      <caption className="sr-only">Compressors</caption>
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-3 font-medium">Tag</th>
          <th scope="col" className="py-2 pr-3 font-medium">Name</th>
          <th scope="col" className="py-2 text-right font-medium">Health</th>
        </tr>
      </thead>
      <tbody>
        {assets.map((asset) => (
          <ContextMenu key={asset.id}>
            <ContextMenuTrigger
              focusable
              render={<tr className="border-t border-default hover:bg-base-background-hover" />}
            >
              <td className="py-2 pr-3 font-mono text-xs text-base-foreground">{asset.tag}</td>
              <td className="py-2 pr-3 text-base-foreground">{asset.name}</td>
              <td className="py-2 text-right text-muted-foreground tabular-nums">{asset.healthScore}</td>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Open {asset.tag}</ContextMenuItem>
              <ContextMenuItem>
                <IconChartLine /> Show trend
              </ContextMenuItem>
              <ContextMenuItem>
                <IconTool /> Create work order
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </tbody>
    </table>
  );
}

function ContextMenuPrimCard() {
  const asset = findAsset('23-ka-9102');
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-xs rounded-xl bg-card-background p-4">
        <p className="font-mono text-xs text-muted-foreground">{asset?.tag}</p>
        <p className="text-base font-medium text-base-foreground">{asset?.name}</p>
        <p className="pt-2 text-sm text-muted-foreground tabular-nums">Health score {asset?.healthScore}</p>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open asset</ContextMenuItem>
        <ContextMenuItem>Pin to dashboard</ContextMenuItem>
        <ContextMenuItem>Copy link</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimTreeNode() {
  return (
    <ul role="tree" aria-label="Asset hierarchy" className="w-full max-w-xs text-sm">
      {TREE.map((area) => (
        <li key={area.tag} role="treeitem" aria-expanded="true" aria-selected="false">
          <span className="block py-1 font-medium text-base-foreground">
            <span className="font-mono text-xs text-muted-foreground">{area.tag}</span> {area.name}
          </span>
          <ul role="group" className="pl-4">
            {area.children.map((tag) => (
              <li key={tag} role="treeitem" aria-selected="false">
                <ContextMenu>
                  <ContextMenuTrigger
                    focusable
                    className="rounded-md px-2 py-1 font-mono text-xs text-base-foreground hover:bg-base-background-hover"
                  >
                    {tag}
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>Open {tag}</ContextMenuItem>
                    <ContextMenuItem>Expand children</ContextMenuItem>
                    <ContextMenuItem>Copy path</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ContextMenuPrimChartPoint() {
  const [index, setIndex] = useState(TREND.length - 1);
  const width = 320;
  const height = 96;
  const max = Math.max(...TREND);
  const min = Math.min(...TREND);
  const x = (i: number) => (i / (TREND.length - 1)) * width;
  const y = (v: number) => height - 8 - ((v - min) / (max - min || 1)) * (height - 16);
  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = box.width === 0 ? 1 : (event.clientX - box.left) / box.width;
    setIndex(Math.max(0, Math.min(TREND.length - 1, Math.round(ratio * (TREND.length - 1)))));
  };
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <ContextMenu>
        <ContextMenuTrigger focusable className="rounded-xl bg-card-background p-3">
          <svg
            role="img"
            aria-label="Discharge pressure over the last 24 hours, 23-PT-92531"
            viewBox={`0 0 ${width} ${height}`}
            className="h-24 w-full text-chart-1-450"
            onContextMenu={pick}
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points={TREND.map((value, i) => `${x(i)},${y(value)}`).join(' ')}
            />
            <circle cx={x(index)} cy={y(TREND[index])} r="4" fill="currentColor" />
          </svg>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>
              Point {index + 1} · {TREND[index]} barg
            </ContextMenuLabel>
            <ContextMenuItem>Add annotation</ContextMenuItem>
            <ContextMenuItem>Zoom to this hour</ContextMenuItem>
            <ContextMenuItem>Create event</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p className="text-xs text-muted-foreground">Right-click a point, or focus the chart and press Shift+F10.</p>
    </div>
  );
}

function ContextMenuPrimCanvas() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        focusable
        className="relative h-44 w-full max-w-md rounded-xl bg-muted-background"
      >
        <span className="absolute top-3 left-3 text-xs text-muted-foreground">Canvas · {HINT}</span>
        <ContextMenu>
          <ContextMenuTrigger
            focusable
            className="absolute top-14 left-12 rounded-lg bg-card-background px-3 py-2 text-sm text-base-foreground"
          >
            <span className="font-mono text-xs">23-HA-9114</span> Interstage cooler
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel>Interstage cooler</ContextMenuLabel>
              <ContextMenuItem>Edit label</ContextMenuItem>
              <ContextMenuItem>Bring to front</ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">Remove from canvas</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Canvas</ContextMenuLabel>
          <ContextMenuItem>
            <IconPlus /> Add asset here
          </ContextMenuItem>
          <ContextMenuItem>Paste</ContextMenuItem>
          <ContextMenuItem>Fit to screen</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimTag() {
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="rounded-md">
        <Badge variant="secondary" className="font-mono">
          23-KA-9101
        </Badge>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <IconCopy /> Copy tag
        </ContextMenuItem>
        <ContextMenuItem>
          <IconExternalLink /> Open asset
        </ContextMenuItem>
        <ContextMenuItem>Remove tag</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimFile() {
  const [file] = FILES;
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="flex w-full max-w-sm items-center justify-between gap-3 rounded-xl bg-card-background p-3">
        <span className="min-w-0 truncate text-sm text-base-foreground">{file.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{file.size}</span>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Preview</ContextMenuItem>
        <ContextMenuItem>
          <IconDownload /> Download <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <IconTrash /> Delete file
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimMoreButtonRow() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        focusable
        className="flex w-full max-w-md items-center gap-3 rounded-xl bg-card-background py-2 pr-2 pl-4"
      >
        <span className="font-mono text-xs text-muted-foreground">23-KA-9101</span>
        <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">1st stage compressor</span>
        <ContextMenuMoreButton label="More actions for 23-KA-9101" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open asset</ContextMenuItem>
        <ContextMenuItem>Show trend</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete asset</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimMoreButtonCard() {
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="flex w-full max-w-xs flex-col gap-2 rounded-xl bg-card-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-medium text-base-foreground">Compressor dashboard</p>
            <p className="text-xs text-muted-foreground">12 panels · edited 2 hours ago</p>
          </div>
          <ContextMenuMoreButton label="More actions for Compressor dashboard" variant="outline" />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open dashboard</ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuItem>
          <IconShare /> Share
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimKeyboardGuide() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ContextMenu>
        <ContextMenuTrigger focusable className="rounded-xl">
          <ContextMenuPrimArea label="Focus this area, then press the keys below" />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Open asset</ContextMenuItem>
          <ContextMenuItem>Copy tag</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <dt>
          <Kbd>Shift</Kbd> <Kbd>F10</Kbd>
        </dt>
        <dd>Opens the menu at the focused element</dd>
        <dt>
          <Kbd>Menu</Kbd>
        </dt>
        <dd>The context-menu key does the same</dd>
        <dt>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd>
        </dt>
        <dd>Move between items; Enter chooses</dd>
        <dt>
          <Kbd>Esc</Kbd>
        </dt>
        <dd>Closes the menu and returns focus</dd>
        <dt>Long press</dt>
        <dd>Opens it on a touch screen</dd>
      </dl>
    </div>
  );
}

function ContextMenuPrimAlarmRow() {
  const [last, setLast] = useState('');
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <ul className="flex flex-col">
        {ALARMS.slice(0, 3).map((alarm) => (
          <li key={alarm.id}>
            <ContextMenu>
              <ContextMenuTrigger focusable className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-base-background-hover">
                <span className="w-24 shrink-0">
                  <StatusIndicator {...severityStatus(alarm.severity)} size="sm" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{alarm.message}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatAgo(alarm.raisedAt)}</span>
                <ContextMenuMoreButton label={`More actions for alarm ${alarm.id}`} />
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => setLast(`Acknowledge ${alarm.id}`)}>
                  Acknowledge <ContextMenuShortcut>A</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => setLast(`Shelve ${alarm.id}`)}>Shelve</ContextMenuItem>
                <ContextMenuItem onClick={() => setLast(`Create work order for ${alarm.id}`)}>
                  <IconTool /> Create work order
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </li>
        ))}
      </ul>
      <ContextMenuPrimResult text={last} />
    </div>
  );
}

function ContextMenuPrimSelection() {
  const [selected, setSelected] = useState<string[]>(['27-pa-2001a', '27-pa-2001b']);
  const rows = ASSETS.filter((asset) => asset.type === 'pump');
  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const count = selected.length;
  return (
    <ContextMenu>
      <ContextMenuTrigger focusable className="w-full max-w-sm rounded-xl bg-card-background p-2">
        <ul className="flex flex-col">
          {rows.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                aria-pressed={selected.includes(asset.id)}
                onClick={() => toggle(asset.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring aria-pressed:bg-muted-background"
              >
                <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{asset.tag}</span>
                <span className="min-w-0 flex-1 truncate text-base-foreground">{asset.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="px-3 pt-2 text-xs text-muted-foreground">Select rows, then open the menu for the selection.</p>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>{count} selected</ContextMenuLabel>
          <ContextMenuItem disabledReason={count === 0 ? 'Select at least one pump' : undefined}>
            Create work order
          </ContextMenuItem>
          <ContextMenuItem disabledReason={count === 0 ? 'Select at least one pump' : undefined}>
            Export selection
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" disabled={count === 0}>
          Remove {count} from list
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ContextMenuPrimAreaSignals() {
  const area = AREAS[1];
  const signals = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101').slice(0, 3);
  return (
    <ul className="flex w-full max-w-md flex-col">
      {signals.map((sensor) => (
        <li key={sensor.id}>
          <ContextMenu>
            <ContextMenuTrigger focusable className="flex items-baseline gap-3 rounded-lg px-3 py-2 hover:bg-base-background-hover">
              <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{sensor.tag}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{sensor.name}</span>
              <span className="shrink-0 text-sm font-medium text-base-foreground tabular-nums">
                {sensor.value.toLocaleString('en-US')} {sensor.unit}
              </span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuLabel>
                  {sensor.tag} · {area.tag}
                </ContextMenuLabel>
                <ContextMenuItem>Add to chart</ContextMenuItem>
                <ContextMenuItem>Show limits</ContextMenuItem>
                <ContextMenuItem>Copy value</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </li>
      ))}
    </ul>
  );
}

const U = (...names: string[]) => names.map((name) => `primitives/context-menu/${name}.tsx`);

export default definePage({
  id: 'context-menu',
  title: 'Context menu',
  summary:
    'A context menu offers the actions for the thing under the pointer. It opens on right-click, long-press and Shift+F10, and always has a visible way in as well.',
  guidance: {
    use: [
      'Shortcuts to actions that also exist in visible UI: a row menu, a toolbar, a detail view.',
      'Name the target in a label when the menu could be mistaken for another one.',
      'Pair it with a visible "more" button so the actions are discoverable and touch-friendly.',
      'Show disabled items with the reason, so the menu keeps its shape.',
    ],
    avoid: [
      'Being the only way to reach an action; many people never right-click.',
      'More than about eight items or more than one level of submenu.',
      'Actions that need a confirmation form; open an alert dialog from the item.',
      'Mixing items with and without icons in one section.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'Items, groups and the target named in the menu.',
      specimens: [
        { id: 'ContextMenuPrimBasic', title: 'Basic', note: 'Three actions on one area; the result is announced beneath.', origin: 'custom', uses: U('ContextMenu', 'ContextMenuTrigger', 'ContextMenuContent', 'ContextMenuItem'), Component: ContextMenuPrimBasic },
        { id: 'ContextMenuPrimNamedTarget', title: 'Named target', note: 'A label with the alarm id says what the menu acts on.', origin: 'custom', uses: U('ContextMenuLabel', 'ContextMenuGroup'), Component: ContextMenuPrimNamedTarget },
        { id: 'ContextMenuPrimGroups', title: 'Groups and separators', note: 'Split view actions from work actions with labelled sections.', origin: 'custom', uses: U('ContextMenuGroup', 'ContextMenuSeparator', 'ContextMenuLabel'), Component: ContextMenuPrimGroups },
        { id: 'ContextMenuPrimIcons', title: 'With icons', note: 'Icons on every item of a section, never on some of them.', origin: 'custom', uses: U('ContextMenuItem'), Component: ContextMenuPrimIcons },
        { id: 'ContextMenuPrimShortcuts', title: 'With shortcuts', note: 'Show a shortcut only when it really works on this surface.', origin: 'custom', uses: U('ContextMenuShortcut'), Component: ContextMenuPrimShortcuts },
        { id: 'ContextMenuPrimDestructive', title: 'Destructive item', note: 'One red action, last, after a separator.', origin: 'custom', uses: U('ContextMenuItem', 'ContextMenuSeparator'), Component: ContextMenuPrimDestructive },
        { id: 'ContextMenuPrimDisabledReason', title: 'Disabled with reason', note: 'A second line says what would enable the action, so nobody has to guess.', origin: 'custom', uses: U('ContextMenuItem'), Component: ContextMenuPrimDisabledReason },
      ],
    },
    {
      id: 'item-types',
      title: 'Checkboxes, radios and submenus',
      description: 'Menus that hold state or branch.',
      specimens: [
        { id: 'ContextMenuPrimCheckboxes', title: 'Checkbox items', note: 'Independent options such as columns; the menu stays open between toggles.', origin: 'custom', uses: U('ContextMenuCheckboxItem'), Component: ContextMenuPrimCheckboxes },
        { id: 'ContextMenuPrimRadios', title: 'Radio items', note: 'One choice from a few, such as a time range.', origin: 'custom', uses: U('ContextMenuRadioGroup', 'ContextMenuRadioItem'), Component: ContextMenuPrimRadios },
        { id: 'ContextMenuPrimSubmenu', title: 'Submenu', note: 'One level of nesting for a family of destinations.', origin: 'custom', uses: U('ContextMenuSub', 'ContextMenuSubTrigger', 'ContextMenuSubContent'), Component: ContextMenuPrimSubmenu },
      ],
    },
    {
      id: 'targets',
      title: 'Targets',
      description: 'What people right-click in an industrial app.',
      specimens: [
        { id: 'ContextMenuPrimTableRow', title: 'Table row', note: 'Each row owns a menu for its asset; the row is a tab stop.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ContextMenuTrigger', 'ContextMenuContent'), Component: ContextMenuPrimTableRow },
        { id: 'ContextMenuPrimCard', title: 'Card', note: 'Open, pin or copy a link from the card without a corner button.', origin: 'custom', uses: U('ContextMenuTrigger'), Component: ContextMenuPrimCard },
        { id: 'ContextMenuPrimTreeNode', title: 'Tree node', note: 'Hierarchy nodes with open, expand and copy path.', origin: 'custom', uses: U('ContextMenuTrigger'), Component: ContextMenuPrimTreeNode },
        { id: 'ContextMenuPrimChartPoint', title: 'Chart point', note: 'The menu is labelled with the nearest point under the pointer.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ContextMenuTrigger', 'ContextMenuLabel'), Component: ContextMenuPrimChartPoint },
        { id: 'ContextMenuPrimCanvas', title: 'Canvas background and object', note: 'The object has its own menu; the background offers add, paste and fit.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ContextMenuTrigger', 'ContextMenuLabel'), Component: ContextMenuPrimCanvas },
        { id: 'ContextMenuPrimTag', title: 'Tag', note: 'Copy and navigate from a tag chip without taking up space.', origin: 'custom', uses: U('ContextMenuTrigger'), Component: ContextMenuPrimTag },
        { id: 'ContextMenuPrimFile', title: 'File', note: 'File rows: preview, download, rename and a destructive delete.', origin: 'custom', uses: U('ContextMenuShortcut'), Component: ContextMenuPrimFile },
      ],
    },
    {
      id: 'discoverability',
      title: 'Discoverability',
      description: 'A visible way in, and the keyboard path.',
      specimens: [
        { id: 'ContextMenuPrimMoreButtonRow', title: 'Row with a more button', note: 'Required guidance: the same menu opens from a visible button and from right-click.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ContextMenuMoreButton'), Component: ContextMenuPrimMoreButtonRow },
        { id: 'ContextMenuPrimMoreButtonCard', title: 'Card with a more button', note: 'An outline button on a card; touch users never have to long-press.', origin: 'custom', uses: U('ContextMenuMoreButton'), Component: ContextMenuPrimMoreButtonCard },
        { id: 'ContextMenuPrimKeyboardGuide', title: 'Keyboard and touch', note: 'The paths that open and drive a menu, listed beside a live example.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ContextMenuTrigger'), Component: ContextMenuPrimKeyboardGuide },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Menus in believable lists.',
      specimens: [
        { id: 'ContextMenuPrimAlarmRow', title: 'Alarm list', note: 'Acknowledge, shelve or raise work from a row; the more button keeps it reachable.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ContextMenuMoreButton', 'ContextMenuShortcut', 'ContextMenuTrigger'), Component: ContextMenuPrimAlarmRow },
        { id: 'ContextMenuPrimSelection', title: 'Selection-aware menu', note: 'The menu names how many rows it acts on and disables what needs a selection.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ContextMenuLabel', 'ContextMenuItem'), Component: ContextMenuPrimSelection },
        { id: 'ContextMenuPrimAreaSignals', title: 'Signal readouts', note: 'Each reading offers add to chart and show limits, labelled with its tag.', origin: 'custom', size: 'md', align: 'stretch', uses: U('ContextMenuLabel'), Component: ContextMenuPrimAreaSignals },
      ],
    },
  ],
});
