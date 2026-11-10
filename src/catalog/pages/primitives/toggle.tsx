import { Toggle } from '@cognite/aura/components/toggle';
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@cognite/aura/components/toolbar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconAlertTriangle,
  IconBellOff,
  IconChartArea,
  IconChartBar,
  IconChartLine,
  IconDownload,
  IconEye,
  IconFilter,
  IconGridDots,
  IconLock,
  IconPin,
  IconRefresh,
  IconStar,
  IconUser,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { ToggleGroup } from '../../../library/actions/ToggleGroup';
import { ALARMS, findAsset, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './toggle.tsx?raw';

const ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active');
const HIGH_ALARMS = ALARMS.filter((alarm) => alarm.severity === 'critical' || alarm.severity === 'high');
const UNASSIGNED_ORDERS = WORK_ORDERS.filter((order) => order.assigneeId === null);
const P3_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done' && order.priority === 'P3');

const OVERLAY_OPTIONS = [
  { value: 'limits', label: 'Limits' },
  { value: 'events', label: 'Events' },
  { value: 'forecast', label: 'Forecast' },
];

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Line chart', icon: <IconChartLine /> },
  { value: 'area', label: 'Area chart', icon: <IconChartArea /> },
  { value: 'bar', label: 'Bar chart', icon: <IconChartBar /> },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', count: ALARMS.filter((alarm) => alarm.severity === 'critical').length },
  { value: 'high', label: 'High', count: ALARMS.filter((alarm) => alarm.severity === 'high').length },
  { value: 'medium', label: 'Medium', count: ALARMS.filter((alarm) => alarm.severity === 'medium').length },
  { value: 'low', label: 'Low', count: ALARMS.filter((alarm) => alarm.severity === 'low').length },
];

const SERIES = [
  { value: 'pressure', label: 'Discharge pressure', reading: '48.6 barg' },
  { value: 'temperature', label: 'Discharge temperature', reading: '141.2 °C' },
  { value: 'vibration', label: 'Drive-end vibration', reading: '6.8 mm/s' },
];

function ToggleDefault() {
  return <Toggle label="Show limits" />;
}

function ToggleDefaultPressed() {
  return <Toggle label="Show limits" defaultPressed />;
}

function ToggleOutline() {
  return <Toggle variant="outline" label="Show limits" />;
}

function ToggleOutlinePressed() {
  return <Toggle variant="outline" label="Show limits" defaultPressed />;
}

function ToggleSizes() {
  return (
    <div className="flex items-center gap-3">
      <Toggle variant="outline" size="sm" label="Small" />
      <Toggle variant="outline" size="lg" label="Large" />
      <Toggle variant="outline" label="Default" />
    </div>
  );
}

function ToggleIconOnly() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle aria-label="Pin to dashboard">
            <IconPin />
          </Toggle>
        }
      />
      <TooltipContent>Pin to dashboard</TooltipContent>
    </Tooltip>
  );
}

function ToggleIconSizes() {
  return (
    <div className="flex items-center gap-3">
      <Toggle variant="outline" size="sm" aria-label="Lock Y axis">
        <IconLock />
      </Toggle>
      <Toggle variant="outline" size="lg" aria-label="Lock Y axis">
        <IconLock />
      </Toggle>
      <Toggle variant="outline" aria-label="Lock Y axis">
        <IconLock />
      </Toggle>
    </div>
  );
}

function ToggleIconAndLabel() {
  return <Toggle variant="outline" icon={<IconEye />} label="Watch asset" />;
}

function ToggleWithCount() {
  return <Toggle variant="outline" icon={<IconFilter />} label="Active" count={ACTIVE_ALARMS.length} defaultPressed />;
}

function ToggleCountCapped() {
  return <Toggle variant="outline" label="Unread" count="99+" />;
}

function ToggleDisabled() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Toggle variant="outline" icon={<IconBellOff />} label="Mute alarms" disabled />
      <p className="text-sm text-muted-foreground">Only a shift supervisor can mute alarms.</p>
    </div>
  );
}

function ToggleDisabledPressed() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Toggle variant="outline" icon={<IconLock />} label="Lock setpoint" defaultPressed disabled />
      <p className="text-sm text-muted-foreground">Locked while the compressor is running.</p>
    </div>
  );
}

function ToggleDisabledWithCount() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Toggle variant="outline" icon={<IconFilter />} label="Shelved" count={0} disabled />
      <p className="text-sm text-muted-foreground">No alarms are shelved.</p>
    </div>
  );
}

function ToggleControlled() {
  const [pressed, setPressed] = useState(true);

  return (
    <div className="flex flex-col items-center gap-3">
      <Toggle variant="outline" icon={<IconRefresh />} label="Auto-refresh" pressed={pressed} onPressedChange={setPressed} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {pressed ? 'Refreshing every 30 seconds.' : 'Paused. Showing data from 14:00.'}
      </p>
    </div>
  );
}

function ToggleGroupMultiple() {
  const [overlays, setOverlays] = useState<string[]>(['limits']);

  return <ToggleGroup label="Chart overlays" options={OVERLAY_OPTIONS} value={overlays} onValueChange={setOverlays} />;
}

function ToggleGroupSingle() {
  const [chartType, setChartType] = useState<string[]>(['line']);

  return (
    <ToggleGroup
      label="Chart type"
      selection="single"
      required
      iconOnly
      options={CHART_TYPE_OPTIONS}
      value={chartType}
      onValueChange={setChartType}
    />
  );
}

function ToggleGroupOutline() {
  const [overlays, setOverlays] = useState<string[]>(['events']);

  return (
    <ToggleGroup
      label="Chart overlays"
      variant="outline"
      size="sm"
      options={OVERLAY_OPTIONS}
      value={overlays}
      onValueChange={setOverlays}
    />
  );
}

function ToggleGroupWithCounts() {
  const [severities, setSeverities] = useState<string[]>(['critical', 'high']);

  return (
    <ToggleGroup
      label="Alarm severity"
      variant="outline"
      size="sm"
      options={SEVERITY_OPTIONS}
      value={severities}
      onValueChange={setSeverities}
    />
  );
}

function ToggleFavorite() {
  const [pinned, setPinned] = useState(false);

  return (
    <div className="flex w-full max-w-xs items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-base-foreground">1st stage compressor</p>
        <p className="text-xs text-muted-foreground">23-KA-9101 · {pinned ? 'In favourites' : 'Not in favourites'}</p>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle aria-label="Add to favourites" pressed={pinned} onPressedChange={setPinned}>
              <IconStar />
            </Toggle>
          }
        />
        <TooltipContent>Add to favourites</TooltipContent>
      </Tooltip>
    </div>
  );
}

function ToggleFilterBar() {
  const [activeOnly, setActiveOnly] = useState(true);
  const [highOnly, setHighOnly] = useState(false);
  const alarms = ALARMS.filter(
    (alarm) => (!activeOnly || ACTIVE_ALARMS.includes(alarm)) && (!highOnly || HIGH_ALARMS.includes(alarm))
  );

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-2">
        <Toggle
          variant="outline"
          size="sm"
          label="Active"
          count={ACTIVE_ALARMS.length}
          pressed={activeOnly}
          onPressedChange={setActiveOnly}
        />
        <Toggle
          variant="outline"
          size="sm"
          icon={<IconAlertTriangle />}
          label="High and critical"
          count={HIGH_ALARMS.length}
          pressed={highOnly}
          onPressedChange={setHighOnly}
        />
        <span className="ml-auto text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {alarms.length} of {ALARMS.length}
        </span>
      </div>
      <ul className="flex h-28 flex-col gap-2 overflow-hidden">
        {alarms.slice(0, 4).map((alarm) => (
          <li key={alarm.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-base-foreground">{alarm.message}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{findAsset(alarm.assetId)?.tag}</span>
          </li>
        ))}
        {alarms.length === 0 ? <li className="text-sm text-muted-foreground">No alarms match these filters.</li> : null}
      </ul>
    </div>
  );
}

function ToggleSeriesLegend() {
  const [visible, setVisible] = useState<string[]>(['pressure', 'temperature']);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ToggleGroup
        label="Visible series"
        size="sm"
        options={SERIES.map(({ value, label }) => ({ value, label }))}
        value={visible}
        onValueChange={setVisible}
      />
      <dl className="flex h-20 flex-col gap-2">
        {SERIES.filter((series) => visible.includes(series.value)).map((series) => (
          <div key={series.value} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">{series.label}</dt>
            <dd className="font-medium text-base-foreground tabular-nums">{series.reading}</dd>
          </div>
        ))}
        {visible.length === 0 ? <p className="text-sm text-muted-foreground">Turn on a series to see its value.</p> : null}
      </dl>
    </div>
  );
}

function ToggleInToolbar() {
  const [grid, setGrid] = useState(true);
  const [locked, setLocked] = useState(false);

  return (
    <Toolbar aria-label="Chart tools">
      <Tooltip>
        <TooltipTrigger
          render={
            <ToolbarButton
              render={
                <Toggle aria-label="Show grid lines" pressed={grid} onPressedChange={setGrid}>
                  <IconGridDots />
                </Toggle>
              }
            />
          }
        />
        <TooltipContent>Show grid lines</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <ToolbarButton
              render={
                <Toggle aria-label="Lock Y axis" pressed={locked} onPressedChange={setLocked}>
                  <IconLock />
                </Toggle>
              }
            />
          }
        />
        <TooltipContent>Lock Y axis</TooltipContent>
      </Tooltip>
      <ToolbarSeparator />
      <ToolbarButton size="icon" aria-label="Download chart">
        <IconDownload />
      </ToolbarButton>
    </Toolbar>
  );
}

function ToggleMyWork() {
  const [unassigned, setUnassigned] = useState(false);
  const orders = unassigned ? UNASSIGNED_ORDERS : WORK_ORDERS.filter((order) => order.status !== 'done');

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-base-foreground">Work orders</p>
        <Toggle
          variant="outline"
          size="sm"
          icon={<IconUser />}
          label="Unassigned"
          count={UNASSIGNED_ORDERS.length}
          pressed={unassigned}
          onPressedChange={setUnassigned}
        />
      </div>
      <ul className="flex h-28 flex-col gap-2 overflow-hidden">
        {orders.slice(0, 4).map((order) => (
          <li key={order.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-base-foreground">{order.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{order.id}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToggleQuickFilters() {
  const [filters, setFilters] = useState<string[]>([]);

  return (
    <div className="flex flex-col items-center gap-3">
      <ToggleGroup
        label="Quick filters"
        variant="outline"
        options={[
          { value: 'unassigned', label: 'Unassigned', count: UNASSIGNED_ORDERS.length },
          { value: 'p3', label: 'Priority 3', count: P3_ORDERS.length },
        ]}
        value={filters}
        onValueChange={setFilters}
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filters.length === 0 ? 'Showing all work orders.' : `${filters.length} quick filter${filters.length === 1 ? '' : 's'} on.`}
      </p>
    </div>
  );
}

export default definePage({
  id: 'toggle',
  title: 'Toggle',
  summary:
    'A toggle is a button that stays pressed. Use it to turn one option, overlay or filter on or off without leaving the view.',
  docsSlug: 'toggle',
  guidance: {
    use: [
      'One binary option with a visible pressed state: pin, lock, show limits.',
      'Filters in a toolbar that switch on or off, with a count of what matches.',
      'The same label pressed and unpressed — the pressed style shows the state.',
      'A toggle group for two to four related toggles that share a value.',
    ],
    avoid: [
      'A setting that takes effect across the app — use a switch.',
      'A one-time command such as refresh or export — use a button.',
      'Switching between peer views — use a segmented control.',
      'Icon-only toggles without an accessible name and a tooltip.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Two looks, each shown unpressed and pressed. Click any of them.',
      specimens: [
        {
          id: 'ToggleDefault',
          title: 'Default',
          note: 'Borderless until pressed; for toolbars where several toggles sit side by side.',
          origin: 'aura',
          Component: ToggleDefault,
        },
        {
          id: 'ToggleDefaultPressed',
          title: 'Default, pressed',
          note: 'Starts pressed when the option is on by default.',
          origin: 'aura',
          Component: ToggleDefaultPressed,
        },
        {
          id: 'ToggleOutline',
          title: 'Outline',
          note: 'A toggle standing on its own, where it must read as a control when off.',
          origin: 'aura',
          Component: ToggleOutline,
        },
        {
          id: 'ToggleOutlinePressed',
          title: 'Outline, pressed',
          note: 'The on state of a standalone toggle, such as an applied filter.',
          origin: 'aura',
          Component: ToggleOutlinePressed,
        },
      ],
    },
    {
      id: 'size-and-content',
      title: 'Size and content',
      description: 'Three heights, with an icon, a label, a count, or a mix.',
      specimens: [
        {
          id: 'ToggleSizes',
          title: 'Sizes',
          note: 'Small (28px), large (32px) and default (36px); match the neighbouring controls.',
          origin: 'aura',
          Component: ToggleSizes,
        },
        {
          id: 'ToggleIconSizes',
          title: 'Icon sizes',
          note: 'Square icon toggles at the same three heights.',
          origin: 'aura',
          Component: ToggleIconSizes,
        },
        {
          id: 'ToggleIconOnly',
          title: 'Icon only with tooltip',
          note: 'A familiar icon in a tight toolbar; the tooltip and name say what it switches.',
          origin: 'aura',
          Component: ToggleIconOnly,
        },
        {
          id: 'ToggleIconAndLabel',
          title: 'Icon and label',
          note: 'When the option is not obvious from an icon alone.',
          origin: 'aura',
          Component: ToggleIconAndLabel,
        },
        {
          id: 'ToggleWithCount',
          title: 'With count',
          note: 'A filter that shows how many items it matches before it is pressed.',
          origin: 'aura',
          Component: ToggleWithCount,
        },
        {
          id: 'ToggleCountCapped',
          title: 'Capped count',
          note: 'Pass the count as text to cap a number that would stretch the control.',
          origin: 'aura',
          Component: ToggleCountCapped,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Unavailable toggles keep their pressed state visible and say why they are blocked.',
      specimens: [
        {
          id: 'ToggleDisabled',
          title: 'Disabled',
          note: 'The option exists but this user cannot change it; say who can.',
          origin: 'aura',
          Component: ToggleDisabled,
        },
        {
          id: 'ToggleDisabledPressed',
          title: 'Disabled, pressed',
          note: 'An option that is on and cannot be turned off right now.',
          origin: 'aura',
          Component: ToggleDisabledPressed,
        },
        {
          id: 'ToggleDisabledWithCount',
          title: 'Disabled, nothing to filter',
          note: 'A filter with no matches stays in place so the toolbar does not jump.',
          origin: 'aura',
          Component: ToggleDisabledWithCount,
        },
        {
          id: 'ToggleControlled',
          title: 'Controlled',
          note: 'When the state lives elsewhere and drives other parts of the view.',
          origin: 'aura',
          Component: ToggleControlled,
        },
      ],
    },
    {
      id: 'groups',
      title: 'Toggle groups',
      description: 'Related toggles that share one value. Aura documents the pattern; the library supplies the component.',
      specimens: [
        {
          id: 'ToggleGroupMultiple',
          title: 'Multiple selection',
          note: 'Independent options that can all be on at once, such as chart overlays.',
          origin: 'custom',
          uses: ['actions/ToggleGroup.tsx'],
          Component: ToggleGroupMultiple,
        },
        {
          id: 'ToggleGroupSingle',
          title: 'Single selection, icons',
          note: 'Two to four exclusive modes where one must always stay selected.',
          origin: 'custom',
          uses: ['actions/ToggleGroup.tsx'],
          Component: ToggleGroupSingle,
        },
        {
          id: 'ToggleGroupOutline',
          title: 'Outline, small',
          note: 'A group outside a toolbar, where each option needs its own edge.',
          origin: 'custom',
          uses: ['actions/ToggleGroup.tsx'],
          Component: ToggleGroupOutline,
        },
        {
          id: 'ToggleGroupWithCounts',
          title: 'With counts',
          note: 'Filter chips over a short fixed set, each showing how much it matches.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/ToggleGroup.tsx'],
          Component: ToggleGroupWithCounts,
        },
        {
          id: 'ToggleSeriesLegend',
          title: 'Series legend',
          note: 'Show or hide series on a chart, so the legend doubles as the control.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/ToggleGroup.tsx'],
          Component: ToggleSeriesLegend,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Toggles wired to the content they control.',
      specimens: [
        {
          id: 'ToggleFavorite',
          title: 'Favourite',
          note: 'Marks one record without opening it; the name stays the same when pressed.',
          origin: 'aura',
          Component: ToggleFavorite,
        },
        {
          id: 'ToggleInToolbar',
          title: 'Inside a toolbar',
          note: 'View options next to commands; rendered through the toolbar so arrow keys reach them.',
          origin: 'aura',
          Component: ToggleInToolbar,
        },
        {
          id: 'ToggleQuickFilters',
          title: 'Quick filters',
          note: 'A pair of saved filters above a list, combinable in any way.',
          origin: 'custom',
          uses: ['actions/ToggleGroup.tsx'],
          Component: ToggleQuickFilters,
        },
        {
          id: 'ToggleFilterBar',
          title: 'Filter bar over a list',
          note: 'Filters that narrow the list below at once and report how much is left.',
          origin: 'custom',
          size: 'md',
          Component: ToggleFilterBar,
        },
        {
          id: 'ToggleMyWork',
          title: 'Scope toggle in a header',
          note: 'One frequent filter promoted next to a list title.',
          origin: 'custom',
          size: 'md',
          Component: ToggleMyWork,
        },
      ],
    },
  ],
});
