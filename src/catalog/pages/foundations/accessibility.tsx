import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconBell, IconDownload, IconFilter, IconRefresh, IconSearch, IconX } from '@cognite/aura/icons';
import { useState } from 'react';

import { FormField } from '../../../library/forms/FormField';
import { DoDont } from '../../../library/foundations/DoDont';
import { ErrorSummary, type ErrorSummaryItem } from '../../../library/foundations/ErrorSummary';
import { formatCount } from '../../../library/foundations/formatters';
import { KeyboardTable } from '../../../library/foundations/KeyboardTable';
import { LiveStatus } from '../../../library/foundations/LiveStatus';
import { SkipLink } from '../../../library/foundations/SkipLink';
import { useSimulatedWait } from '../../../library/foundations/useSimulatedWait';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatReading, runStateStatus, TONE_DOT } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import { formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './accessibility.tsx?raw';

const PRESSURE = SENSORS[0];
const PRESSURE_SERIES = makeSeries({ seed: PRESSURE.seed, points: 24, base: 47, amplitude: 1.5, noise: 0.4, drift: 1.6 });
const PRESSURE_VALUES = PRESSURE_SERIES.map((point) => point.v);
const PRESSURE_SAMPLES = PRESSURE_SERIES.filter((_, index) => index % 6 === 5);
const COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');
const ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active');
const TAG_FORMAT = /^\d{2}-[A-Z]{2}-\d{4,5}[A-Z]?$/;

const KEYBOARD_PATTERNS = [
  {
    id: 'button',
    component: 'Button, link',
    bindings: [
      { keys: ['Tab'], action: 'Move to it' },
      { keys: ['Enter', 'Space'], action: 'Activate a button' },
      { keys: ['Enter'], action: 'Follow a link' },
    ],
  },
  {
    id: 'checkbox',
    component: 'Checkbox, switch',
    bindings: [
      { keys: ['Tab'], action: 'Move to it' },
      { keys: ['Space'], action: 'Toggle' },
    ],
  },
  {
    id: 'radio',
    component: 'Radio group, segmented control',
    bindings: [
      { keys: ['Tab'], action: 'Enter the group' },
      { keys: ['←', '→'], action: 'Move and select' },
    ],
  },
  {
    id: 'tabs',
    component: 'Tabs',
    bindings: [
      { keys: ['Tab'], action: 'Enter the tab list' },
      { keys: ['←', '→'], action: 'Move between tabs' },
      { keys: ['Home', 'End'], action: 'First or last tab' },
    ],
  },
  {
    id: 'menu',
    component: 'Menu, select, combobox',
    bindings: [
      { keys: ['Enter', 'Space'], action: 'Open' },
      { keys: ['↑', '↓'], action: 'Move between items' },
      { keys: ['Enter'], action: 'Choose' },
      { keys: ['Esc'], action: 'Close and return focus' },
    ],
  },
  {
    id: 'dialog',
    component: 'Dialog, popover',
    bindings: [
      { keys: ['Tab'], action: 'Cycle inside, focus is trapped' },
      { keys: ['Esc'], action: 'Close and return focus to the trigger' },
    ],
  },
  {
    id: 'tree',
    component: 'Tree, accordion',
    bindings: [
      { keys: ['↑', '↓'], action: 'Move between rows' },
      { keys: ['→'], action: 'Expand' },
      { keys: ['←'], action: 'Collapse' },
    ],
  },
  {
    id: 'grid',
    component: 'Data grid',
    bindings: [
      { keys: ['←', '→', '↑', '↓'], action: 'Move between cells' },
      { keys: ['Space'], action: 'Select the row' },
      { keys: ['Enter'], action: 'Open or edit' },
    ],
  },
];

const CONTRAST_PAIRS = [
  { text: 'text-base-foreground', surface: 'bg-base-background', role: 'Body text' },
  { text: 'text-muted-foreground', surface: 'bg-base-background', role: 'Secondary text' },
  { text: 'text-card-foreground', surface: 'bg-card-background', role: 'Text on a card' },
  { text: 'text-primary-foreground', surface: 'bg-primary-background', role: 'Primary action' },
  { text: 'text-critical-foreground', surface: 'bg-critical-background', role: 'Status on its tint' },
  { text: 'text-critical-foreground-strong', surface: 'bg-base-background', role: 'Status on a plain surface' },
] as const;

const OUTLINE = [
  { level: 0, kind: 'banner', text: 'Top bar: product, search, account' },
  { level: 0, kind: 'navigation', text: 'Sidebar: areas of the plant' },
  { level: 0, kind: 'main', text: 'Skip link target' },
  { level: 1, kind: 'h1', text: 'Gas compression' },
  { level: 2, kind: 'h2', text: 'Active alarms' },
  { level: 3, kind: 'h3', text: 'Recompressor tripped on high vibration' },
  { level: 2, kind: 'h2', text: 'Work orders' },
  { level: 0, kind: 'complementary', text: 'Details panel' },
  { level: 2, kind: 'h2', text: 'Asset details' },
] as const;

const ALT_TEXT = [
  { type: 'Informational image', approach: 'Describe the content', example: 'alt="Chart: output up 20 %"' },
  { type: 'Decorative image', approach: 'Empty alt', example: 'alt=""' },
  { type: 'Icon-only control', approach: 'Name the action on the control', example: 'aria-label="Delete report"' },
  { type: 'Icon beside a label', approach: 'Hide the icon', example: 'aria-hidden="true"' },
] as const;

const ANNOUNCE = [
  { scenario: 'Search or list results update', method: 'aria-live="polite"' },
  { scenario: 'Live dashboard value', method: 'aria-live="polite", never assertive' },
  { scenario: 'Form error after submit', method: 'role="alert" and focus the first invalid field' },
  { scenario: 'Toast', method: 'Handled by the toast component' },
  { scenario: 'Dialog opens or closes', method: 'Focus moves in, then back to the trigger' },
] as const;

const RESPONSIBILITY = [
  { concern: 'Focus indicators', aura: 'shadow-focus-ring on interactive elements', you: 'Not hidden by overflow or z-index' },
  { concern: 'Keyboard activation', aura: 'Button: Enter and Space. Input: standard keys', you: 'Custom elements also respond' },
  { concern: 'ARIA roles', aura: 'Correct roles on Dialog, Tabs, SegmentedControl', you: 'Custom components declare correct roles' },
  { concern: 'Colour contrast', aura: 'Token pairs designed for AA', you: 'Page backgrounds do not reduce contrast' },
  { concern: 'Dark mode', aura: 'Semantic tokens adapt', you: 'Custom colours also work in dark mode' },
  { concern: 'Disabled states', aura: 'Communicated to assistive technology', you: 'The reason is accessible' },
  { concern: 'Focus trapping', aura: 'Dialog traps focus while open', you: 'Focus returns to the trigger on close' },
] as const;

const CHECKLIST = [
  'Tab through every element in a logical order',
  'Every button and link works with Enter or Space',
  'Escape closes every dialog, popover and menu',
  'Every field has a visible label; every image has alt text',
  'Every status has a non-colour indicator',
  'Headings go h1, h2, h3 with no skipped level',
  'Dynamic updates are announced',
  'The focus ring is visible on every control',
] as const;

function A11yGuideFocusOrder() {
  const stops = ['Search', 'Filter', 'Export', 'Tag', 'Save'];

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input aria-label="Search alarms" placeholder="Search alarms" />
        </div>
        <Button variant="ghost" size="sm">
          <IconFilter /> Filter
        </Button>
        <Button variant="ghost" size="sm">
          <IconDownload /> Export
        </Button>
      </div>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <FormField label="Tag">{(control) => <Input {...control} defaultValue="23-KA-9103" />}</FormField>
        </div>
        <Button>Save filter</Button>
      </div>
      <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums" aria-label="Tab order">
        {stops.map((stop, index) => (
          <li key={stop}>
            <span className="font-medium text-base-foreground">{index + 1}</span> {stop}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Tab order follows reading order because DOM order does. No positive tabindex, no traps.
      </p>
    </div>
  );
}

function A11yGuideVisibleFocus() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <DoDont kind="do" caption="outline-none only together with the token ring on focus-visible.">
        <span
          aria-hidden="true"
          className="self-start rounded-lg bg-secondary-background px-3 py-1.5 text-sm font-medium text-secondary-foreground shadow-focus-ring"
        >
          Acknowledge alarm
        </span>
        <p className="mt-3 font-mono text-xs text-muted-foreground">outline-none focus-visible:shadow-focus-ring</p>
      </DoDont>
      <DoDont kind="dont" caption="Focus removed and not replaced: keyboard users are lost.">
        <span
          aria-hidden="true"
          className="self-start rounded-lg bg-secondary-background px-3 py-1.5 text-sm font-medium text-secondary-foreground"
        >
          Acknowledge alarm
        </span>
        <p className="mt-3 font-mono text-xs text-muted-foreground">outline-none</p>
      </DoDont>
    </div>
  );
}

function A11yGuideIconNames() {
  const actions = [
    { label: 'Refresh alarms', Icon: IconRefresh },
    { label: 'Filter alarms', Icon: IconFilter },
    { label: 'Open notifications', Icon: IconBell },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        {actions.map(({ label, Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={label}>
                  <Icon />
                </Button>
              }
            />
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <p className="max-w-56 text-center text-xs text-muted-foreground">
        The name is on the control as aria-label; the tooltip shows the same words to everyone else.
      </p>
    </div>
  );
}

function A11yGuideInputLabels() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <FormField label="High limit" helper="In barg.">
        {(control) => <Input {...control} inputMode="decimal" defaultValue="52.0" />}
      </FormField>
      <div className="flex items-center gap-2">
        <IconSearch className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input aria-label="Search assets" placeholder="Search assets" />
      </div>
      <p className="text-xs text-muted-foreground">
        A visible label by default. A search field may rely on its icon, but still needs an accessible name.
      </p>
    </div>
  );
}

function A11yGuideTargetSize() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted-background px-3 py-2">
        <span className="font-mono text-sm text-base-foreground">23-KA-9103</span>
        <button
          type="button"
          aria-label="Remove 23-KA-9103"
          className="relative flex size-4 items-center justify-center rounded-sm text-muted-foreground outline-none before:absolute before:-inset-2 before:rounded-md before:border before:border-dashed before:border-emphasized hover:text-base-foreground focus-visible:shadow-focus-ring"
        >
          <IconX className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        A 16 px icon with its hit area expanded to 32 px by a pseudo-element, drawn dashed here. Never ship a target
        under 24 px.
      </p>
    </div>
  );
}

function A11yGuideStatusNotColour() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <DoDont kind="do" caption="Colour, shape and a word. Readable in greyscale and by a screen reader.">
        <ul className="flex flex-col gap-2">
          {COMPRESSORS.map((asset) => (
            <li key={asset.id} className="flex items-center justify-between gap-3 text-sm text-base-foreground">
              {asset.name}
              <StatusIndicator {...runStateStatus(asset.state)} size="sm" />
            </li>
          ))}
        </ul>
      </DoDont>
      <DoDont kind="dont" caption="A coloured dot alone: invisible to one in twelve men, and to assistive technology.">
        <ul className="flex flex-col gap-2">
          {COMPRESSORS.map((asset) => (
            <li key={asset.id} className="flex items-center justify-between gap-3 text-sm text-base-foreground">
              {asset.name}
              <span aria-hidden="true" className={`size-2 rounded-full ${TONE_DOT[runStateStatus(asset.state).tone]}`} />
            </li>
          ))}
        </ul>
      </DoDont>
    </div>
  );
}

function A11yGuideContrastPairs() {
  return (
    <div className="flex w-full flex-col gap-3">
      <ul className="grid grid-cols-2 gap-3">
        {CONTRAST_PAIRS.map((pair) => (
          <li key={pair.role} className="flex min-w-0 flex-col gap-1">
            <span className={`rounded-lg border border-default px-3 py-2 text-sm font-medium ${pair.surface} ${pair.text}`}>
              {pair.role}
            </span>
            <span className="font-mono text-xs break-all text-muted-foreground">
              {pair.text} / {pair.surface}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Foreground and background tokens are designed as pairs. Keep them together and the pair meets AA in both themes.
        Muted text is for secondary content, never for something the user must read to finish a task.
      </p>
    </div>
  );
}

function A11yGuideChartAlt() {
  const [showTable, setShowTable] = useState(false);
  const first = PRESSURE_VALUES[0];
  const last = PRESSURE_VALUES[PRESSURE_VALUES.length - 1];

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Sparkline
        values={PRESSURE_VALUES}
        label="Discharge pressure, last 24 hours"
        unit={PRESSURE.unit}
        decimals={1}
        variant="area"
        height={56}
        limit={PRESSURE.highLimit}
      />
      <p className="text-sm text-medium-foreground tabular-nums">
        Discharge pressure rose from {formatReading(first, PRESSURE.unit, 1)} to {formatReading(last, PRESSURE.unit, 1)}{' '}
        over 24 hours and stays under the {formatReading(PRESSURE.highLimit, PRESSURE.unit, 0)} limit.
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        aria-expanded={showTable}
        onClick={() => setShowTable(!showTable)}
      >
        {showTable ? 'Hide data table' : 'Show data table'}
      </Button>
      {showTable ? (
        <Table density="compact">
          <TableCaption srOnly>Discharge pressure every 6 hours</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Time (UTC)</TableHead>
              <TableHead numeric>Pressure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRESSURE_SAMPLES.map((point) => (
              <TableRow key={point.t}>
                <TableCell rowHeader numeric align="start">
                  {formatTime(point.t)}
                </TableCell>
                <TableCell numeric>{formatReading(point.v, PRESSURE.unit, 1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}

function A11yGuideTableSemantics() {
  const sensors = SENSORS.slice(0, 4);

  return (
    <div className="flex w-full flex-col gap-3">
      <Table>
        <TableCaption side="top">1st stage compressor, current readings</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Measurement</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead numeric>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sensors.map((sensor) => (
            <TableRow key={sensor.id}>
              <TableCell rowHeader>{sensor.name}</TableCell>
              <TableCell mono muted>
                {sensor.tag}
              </TableCell>
              <TableCell numeric>{formatReading(sensor.value, sensor.unit, sensor.decimals)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="px-3 font-mono text-xs text-muted-foreground">
        &lt;caption&gt; · &lt;th scope=&quot;col&quot;&gt; · &lt;th scope=&quot;row&quot;&gt;
      </p>
    </div>
  );
}

function A11yGuideKeyboardTable() {
  return <KeyboardTable caption="Keyboard patterns by component family" patterns={KEYBOARD_PATTERNS} />;
}

function A11yGuideSkipLink() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="relative flex h-40 overflow-hidden rounded-xl border border-default">
        <SkipLink targetId="a11y-skip-target" />
        <nav aria-label="Sample navigation" className="flex w-32 shrink-0 flex-col gap-1 bg-muted-background p-2">
          {['Overview', 'Alarms', 'Work orders', 'Trends'].map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-md px-2 py-1 text-left text-sm text-medium-foreground outline-none hover:bg-muted-background-hover focus-visible:shadow-focus-ring"
            >
              {item}
            </button>
          ))}
        </nav>
        <div
          id="a11y-skip-target"
          tabIndex={-1}
          className="m-2 flex min-w-0 flex-1 flex-col justify-center rounded-lg p-3 outline-none focus-visible:shadow-focus-ring"
        >
          <p className="text-sm font-medium text-base-foreground">Gas compression</p>
          <p className="text-xs text-muted-foreground">Main content. The skip link lands here.</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Tab into the frame: the link appears first, over the navigation. Enter jumps past four stops to the content.
      </p>
    </div>
  );
}

function A11yGuideDisabledVsAriaDisabled() {
  return (
    <div className="grid w-full grid-cols-2 gap-6">
      <div className="flex flex-col items-start gap-2">
        <Button variant="secondary" disabled>
          Start compressor
        </Button>
        <p className="font-mono text-xs text-base-foreground">disabled</p>
        <p className="text-xs text-muted-foreground">
          Leaves the tab order. Use when the control does not apply and there is nothing to explain.
        </p>
      </div>
      <div className="flex flex-col items-start gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="secondary" aria-disabled="true" onClick={(event) => event.preventDefault()}>
                Start compressor
              </Button>
            }
          />
          <TooltipContent>Reset the trip on 23-KA-9103 first</TooltipContent>
        </Tooltip>
        <p className="font-mono text-xs text-base-foreground">aria-disabled=&quot;true&quot;</p>
        <p className="text-xs text-muted-foreground">
          Stays focusable, so a keyboard user can reach it and read why. You must block the action yourself.
        </p>
      </div>
    </div>
  );
}

function A11yGuideLiveRegion() {
  const load = useSimulatedWait(1500);
  const message =
    load.phase === 'waiting'
      ? 'Loading alarms…'
      : load.phase === 'done'
        ? `${formatCount(ACTIVE_ALARMS.length, 'active alarm')} loaded`
        : '';

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" disabled={load.phase === 'waiting'} onClick={load.start}>
          <IconRefresh /> Refresh alarms
        </Button>
        <LiveStatus message={message} tone={load.phase === 'done' ? 'success' : 'neutral'} />
      </div>
      <p className="text-xs text-muted-foreground">
        The status element is always in the page; only its text changes. That is what makes a screen reader announce
        “Loading alarms”, then the result, without moving focus.
      </p>
    </div>
  );
}

function A11yGuideErrorSummary() {
  const [tag, setTag] = useState('23 KA 9103');
  const [limit, setLimit] = useState('');
  const [errors, setErrors] = useState<readonly ErrorSummaryItem[]>([]);
  const [saved, setSaved] = useState(false);

  const save = () => {
    const found: ErrorSummaryItem[] = [];
    if (!TAG_FORMAT.test(tag.trim())) found.push({ fieldId: 'a11y-tag', message: 'Tag: use the format 23-KA-9103' });
    if (limit.trim() === '' || Number.isNaN(Number(limit))) {
      found.push({ fieldId: 'a11y-limit', message: 'High limit: enter a number in mm/s' });
    }
    setErrors(found);
    setSaved(found.length === 0);
    if (found.length > 0) document.getElementById(found[0].fieldId)?.focus();
  };

  const errorFor = (fieldId: string) => errors.find((error) => error.fieldId === fieldId)?.message.split(': ')[1];

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ErrorSummary errors={errors} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormField id="a11y-tag" label="Tag" error={errorFor('a11y-tag')}>
            {(control) => <Input {...control} value={tag} onChange={(event) => setTag(event.target.value)} />}
          </FormField>
        </div>
        <div>
          <FormField id="a11y-limit" label="High limit" error={errorFor('a11y-limit')}>
            {(control) => (
              <Input {...control} inputMode="decimal" value={limit} onChange={(event) => setLimit(event.target.value)} />
            )}
          </FormField>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save}>Save limits</Button>
        <LiveStatus message={saved ? 'Limits saved' : ''} tone="success" />
      </div>
    </div>
  );
}

function A11yGuideHeadingOutline() {
  return (
    <ul className="flex w-full flex-col gap-1.5" aria-label="Landmarks and headings of a sample page">
      {OUTLINE.map((row) => (
        <li
          key={`${row.kind}-${row.text}`}
          className={`flex items-baseline gap-2 text-sm ${
            row.level === 1 ? 'pl-4' : row.level === 2 ? 'pl-8' : row.level === 3 ? 'pl-12' : ''
          }`}
        >
          <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{row.kind}</span>
          <span className={row.level === 0 ? 'text-muted-foreground' : 'text-base-foreground'}>{row.text}</span>
        </li>
      ))}
    </ul>
  );
}

function A11yGuideAltText() {
  return (
    <Table>
      <TableCaption srOnly>Alt text and naming by image type</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Approach</TableHead>
          <TableHead>Example</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ALT_TEXT.map((row) => (
          <TableRow key={row.type}>
            <TableCell rowHeader>{row.type}</TableCell>
            <TableCell>{row.approach}</TableCell>
            <TableCell mono muted wrap="wrap">
              {row.example}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function A11yGuideAnnouncing() {
  return (
    <dl className="flex w-full flex-col">
      {ANNOUNCE.map((row) => (
        <div key={row.scenario} className="grid grid-cols-2 gap-3 border-b border-default py-2 last:border-b-0">
          <dt className="text-sm text-base-foreground">{row.scenario}</dt>
          <dd className="font-mono text-xs text-muted-foreground">{row.method}</dd>
        </div>
      ))}
    </dl>
  );
}

function A11yGuideReducedMotion() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted-background p-3">
          <p className="text-xs font-medium text-base-foreground">Keep</p>
          <p className="mt-1 text-xs text-muted-foreground">Short fades, colour changes, instant state swaps.</p>
        </div>
        <div className="rounded-lg bg-muted-background p-3">
          <p className="text-xs font-medium text-base-foreground">Remove</p>
          <p className="mt-1 text-xs text-muted-foreground">Sliding, scaling, parallax, pulsing and anything that loops.</p>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">motion-safe:transition-transform motion-reduce:transition-none</p>
      <p className="text-xs text-muted-foreground">
        Movement can cause dizziness and nausea. Prefix it with motion-safe so it only runs for people who have not asked
        for less. See Motion for live examples.
      </p>
    </div>
  );
}

function A11yGuideResponsibility() {
  return (
    <Table>
      <TableCaption srOnly>What Aura handles and what you verify</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Concern</TableHead>
          <TableHead>Aura handles</TableHead>
          <TableHead>You verify</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {RESPONSIBILITY.map((row) => (
          <TableRow key={row.concern}>
            <TableCell rowHeader wrap="nowrap">
              {row.concern}
            </TableCell>
            <TableCell muted>{row.aura}</TableCell>
            <TableCell>{row.you}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function A11yGuideChecklist() {
  const [checked, setChecked] = useState<readonly string[]>([]);

  const toggle = (item: string, isChecked: boolean) => {
    setChecked(isChecked ? [...checked, item] : checked.filter((entry) => entry !== item));
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <CheckboxGroup aria-label="Pre-ship accessibility checklist">
        {CHECKLIST.map((item) => (
          <CheckboxItem key={item}>
            <CheckboxItemControl
              checked={checked.includes(item)}
              onCheckedChange={(isChecked) => toggle(item, isChecked)}
            />
            <CheckboxItemLabel>{item}</CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <LiveStatus
        message={`${checked.length} of ${CHECKLIST.length} checked`}
        tone={checked.length === CHECKLIST.length ? 'success' : 'neutral'}
      />
    </div>
  );
}

export default definePage({
  id: 'accessibility',
  title: 'Accessibility',
  summary:
    'Aura primitives target WCAG AA and handle focus rings, roles and keyboard activation. Composition, copy, focus order and page structure are still yours. These are the patterns to follow and the checks to run before a page ships.',
  guidance: {
    use: [
      'Keyboard alone for every task, with a visible focus ring at every step.',
      'A visible label for every field and a name plus tooltip for every icon-only control.',
      'Colour together with an icon, a shape or a word for every status.',
      'Live regions for async results, and focus moved to the first error after a failed submit.',
    ],
    avoid: [
      'outline-none or ring-0 without the token focus ring.',
      'Meaning carried by colour, hover or motion alone.',
      'Heading tags chosen for size, or skipped levels.',
      'Targets under 24 px, and muted text for content the user must read.',
    ],
  },
  source,
  sections: [
    {
      id: 'focus-and-names',
      title: 'Focus and names',
      description: 'Where am I, and what is this control called.',
      specimens: [
        {
          id: 'A11yGuideFocusOrder',
          title: 'Focus order',
          note: 'Lay controls out in the DOM in the order they are read; then Tab needs no help.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: A11yGuideFocusOrder,
        },
        {
          id: 'A11yGuideVisibleFocus',
          title: 'Visible focus',
          note: 'Any custom interactive element: replace the outline, never just remove it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: A11yGuideVisibleFocus,
        },
        {
          id: 'A11yGuideIconNames',
          title: 'Names for icon-only controls',
          note: 'Every icon button: aria-label for assistive technology, tooltip for everyone else.',
          origin: 'aura',
          Component: A11yGuideIconNames,
        },
        {
          id: 'A11yGuideInputLabels',
          title: 'Labels for inputs',
          note: 'A visible label for forms; an accessible name at least for compact search.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: A11yGuideInputLabels,
        },
        {
          id: 'A11yGuideTargetSize',
          title: 'Target size',
          note: 'Small icons in dense rows: grow the hit area, not the icon.',
          origin: 'aura',
          align: 'stretch',
          Component: A11yGuideTargetSize,
        },
      ],
    },
    {
      id: 'perception',
      title: 'Perception',
      description: 'A screen should still make sense with colour, sight or the chart removed.',
      specimens: [
        {
          id: 'A11yGuideStatusNotColour',
          title: 'Status not by colour alone',
          note: 'Every status, severity and state indicator.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: A11yGuideStatusNotColour,
        },
        {
          id: 'A11yGuideContrastPairs',
          title: 'Contrast pairs',
          note: 'Pick text and surface as a token pair, never one at a time.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: A11yGuideContrastPairs,
        },
        {
          id: 'A11yGuideChartAlt',
          title: 'Charts with a text alternative',
          note: 'Every chart: a name, the key trend in a sentence, and the data on request.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx', 'industrial/status.ts', 'primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: A11yGuideChartAlt,
        },
        {
          id: 'A11yGuideTableSemantics',
          title: 'Tables with caption and scope',
          note: 'Any static table: a caption, column headers and a row header per row.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: A11yGuideTableSemantics,
        },
      ],
    },
    {
      id: 'keyboard',
      title: 'Keyboard',
      description: 'Aura primitives implement these. A custom component has to match its family.',
      specimens: [
        {
          id: 'A11yGuideKeyboardTable',
          title: 'Keyboard patterns',
          note: 'Check a custom control against the row of the family it belongs to.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/KeyboardTable.tsx'],
          Component: A11yGuideKeyboardTable,
        },
        {
          id: 'A11yGuideSkipLink',
          title: 'Skip to content',
          note: 'Pages with a sidebar or long navigation before the main region.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/SkipLink.tsx'],
          Component: A11yGuideSkipLink,
        },
        {
          id: 'A11yGuideDisabledVsAriaDisabled',
          title: 'disabled and aria-disabled',
          note: 'Use aria-disabled when the user needs to reach the control to learn why it is unavailable.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: A11yGuideDisabledVsAriaDisabled,
        },
      ],
    },
    {
      id: 'announcements-and-structure',
      title: 'Announcements, structure and motion',
      description: 'What a screen reader hears, and how the page is organised for it.',
      specimens: [
        {
          id: 'A11yGuideLiveRegion',
          title: 'Live region for async status',
          note: 'Loading, saving and result counts that change without a page load.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/LiveStatus.tsx', 'foundations/useSimulatedWait.ts'],
          Component: A11yGuideLiveRegion,
        },
        {
          id: 'A11yGuideErrorSummary',
          title: 'Error summary linked to fields',
          note: 'Forms with more than one field: after a failed submit, list the errors and move focus. Select Save limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/ErrorSummary.tsx', 'foundations/LiveStatus.tsx', 'forms/FormField.tsx'],
          Component: A11yGuideErrorSummary,
        },
        {
          id: 'A11yGuideHeadingOutline',
          title: 'Headings and landmarks',
          note: 'Sketch this outline for a page before building it: one h1, no skipped levels.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: A11yGuideHeadingOutline,
        },
        {
          id: 'A11yGuideAnnouncing',
          title: 'What to announce, and how',
          note: 'Choose polite or assertive by whether the user must act now.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: A11yGuideAnnouncing,
        },
        {
          id: 'A11yGuideAltText',
          title: 'Alt text and icon naming',
          note: 'Images, illustrations and icons, by the job they do.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: A11yGuideAltText,
        },
        {
          id: 'A11yGuideReducedMotion',
          title: 'Reduced motion',
          note: 'Anything that moves: keep the change, drop the movement.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: A11yGuideReducedMotion,
        },
      ],
    },
    {
      id: 'before-shipping',
      title: 'Before shipping',
      description: 'Then unplug the mouse and do the main task with the keyboard only.',
      specimens: [
        {
          id: 'A11yGuideResponsibility',
          title: 'Aura and you',
          note: 'What the primitives already do, and what stays your job when you compose them.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: A11yGuideResponsibility,
        },
        {
          id: 'A11yGuideChecklist',
          title: 'Pre-ship checklist',
          note: 'Run through it on every new page; it takes five minutes.',
          origin: 'custom',
          align: 'stretch',
          uses: ['foundations/LiveStatus.tsx'],
          Component: A11yGuideChecklist,
        },
      ],
    },
  ],
});
