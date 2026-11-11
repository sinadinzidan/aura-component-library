import { Button } from '@cognite/aura/components/button';
import { CodeBlock } from '@cognite/aura/components/code-block';
import { Switch } from '@cognite/aura/components/switch';
import { IconArrowDownRight, IconArrowUpRight, IconArrowsExchange, IconMinus } from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { StatDelta } from '../../../library/display/StatDelta';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { diffKeyValues } from '../../../library/patterns/content/diffKeyValues';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { changeBetween, countChangeKinds } from '../../../library/patterns/workflows/changeKind';
import { ChangeMarker } from '../../../library/patterns/workflows/ChangeMarker';
import { countDifferences, numericDelta, rowChange } from '../../../library/patterns/workflows/compareRows';
import type { CompareRow } from '../../../library/patterns/workflows/compareRows';
import { CompareTable } from '../../../library/patterns/workflows/CompareTable';
import { DiffValue } from '../../../library/patterns/workflows/DiffValue';
import { MergeChoiceRow } from '../../../library/patterns/workflows/MergeChoiceRow';
import type { MergeSide } from '../../../library/patterns/workflows/MergeChoiceRow';
import { TextDiff } from '../../../library/patterns/workflows/TextDiff';
import { diffStats, wordDiff } from '../../../library/patterns/workflows/wordDiff';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { PLANT_KPIS, SENSORS, findAsset } from '../../data/plant';
import { definePage } from '../../types';

import source from './compare-and-diff.tsx?raw';

/** Vibration anomaly model for the 1st stage compressor: the version in use against the candidate. */
const MODEL_ROWS: readonly CompareRow[] = [
  { id: 'window', label: 'Training window', left: '1 Jul – 31 Dec 2025', right: '1 Aug 2025 – 31 Jan 2026' },
  { id: 'features', label: 'Input signals', left: '6', right: '7', delta: numericDelta(6, 7, 0) },
  { id: 'bearing', label: 'Bearing temperature', right: '23-TT-92541', mono: true },
  { id: 'ambient', label: 'Ambient temperature', left: '20-TT-10001', mono: true },
  { id: 'threshold', label: 'Alert threshold', left: '0.80', right: '0.85', delta: numericDelta(0.8, 0.85, 2) },
  { id: 'precision', label: 'Precision', left: '0.91', right: '0.94', delta: numericDelta(0.91, 0.94, 2) },
  { id: 'recall', label: 'Recall', left: '0.84', right: '0.88', delta: numericDelta(0.84, 0.88, 2) },
  { id: 'false', label: 'False alarms per week', left: '9', right: '2', delta: numericDelta(9, 2, 0) },
  { id: 'algorithm', label: 'Algorithm', left: 'Isolation forest', right: 'Isolation forest' },
  { id: 'owner', label: 'Owner', left: 'Aisha Khan', right: 'Aisha Khan' },
];

const LIMIT_ROWS: readonly CompareRow[] = [
  { id: 'hh', label: 'High-high trip', left: '155.0 °C', right: '155.0 °C' },
  { id: 'h', label: 'High alarm', left: '145.0 °C', right: '148.0 °C', delta: numericDelta(145, 148, 1, '°C') },
  { id: 'l', label: 'Low alarm', left: '90.0 °C', right: '85.0 °C', delta: numericDelta(90, 85, 1, '°C') },
  { id: 'll', label: 'Low-low trip', right: '70.0 °C' },
  { id: 'delay', label: 'Alarm delay', left: '0 s', right: '10 s', delta: numericDelta(0, 10, 0, 's') },
  { id: 'deadband', label: 'Deadband', left: '1.0 °C', right: '1.0 °C' },
];

const STEP_BEFORE = 'Close the suction valve and confirm that the discharge pressure is below 2 barg before opening the casing drain.';
const STEP_AFTER =
  'Close and lock the suction valve, then confirm that the discharge pressure is below 1 barg on 23-PT-92531 before opening the casing drain.';

const CONFIG_BEFORE = `{
  "tag": "23-TT-92532",
  "unit": "°C",
  "limits": {
    "high": 145.0,
    "highHigh": 155.0
  },
  "delaySeconds": 0,
  "priority": "high"
}`;

const CONFIG_AFTER = `{
  "tag": "23-TT-92532",
  "unit": "°C",
  "limits": {
    "low": 85.0,
    "high": 148.0,
    "highHigh": 155.0
  },
  "delaySeconds": 10,
  "priority": "high"
}`;

const SETTINGS_BEFORE = { 'limits.high': '145.0', 'limits.highHigh': '155.0', delaySeconds: '0', priority: 'high', shelvable: 'true' };
const SETTINGS_AFTER = { 'limits.low': '85.0', 'limits.high': '148.0', 'limits.highHigh': '155.0', delaySeconds: '10', priority: 'high' };

function CompareDiffChangeMarkers() {
  return (
    <div className="flex max-w-xs flex-wrap items-center justify-center gap-x-5 gap-y-3">
      <ChangeMarker kind="added" />
      <ChangeMarker kind="removed" />
      <ChangeMarker kind="changed" />
      <ChangeMarker kind="unchanged" />
    </div>
  );
}

function CompareDiffInline() {
  return (
    <dl className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-sm text-muted-foreground">High alarm</dt>
        <dd>
          <DiffValue before="145.0" after="148.0" unit="°C" />
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-sm text-muted-foreground">Assignee</dt>
        <dd>
          <DiffValue before="Tomás Barros" after="Jonas Nyberg" />
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-sm text-muted-foreground">Parent asset</dt>
        <dd>
          <DiffValue before="NK-23" after="NK-27" mono />
        </dd>
      </div>
    </dl>
  );
}

function CompareDiffRowStates() {
  const rows = [
    { id: 'a', label: 'Low-low trip', before: undefined, after: '70.0 °C' },
    { id: 'b', label: 'Shelving allowed', before: 'Yes', after: undefined },
    { id: 'c', label: 'Alarm delay', before: '0 s', after: '10 s' },
    { id: 'd', label: 'Priority', before: 'High', after: 'High' },
  ];
  return (
    <ul className="flex w-full max-w-xs flex-col">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3 border-b border-default py-2 last:border-b-0">
          <span className="flex min-w-0 flex-col">
            <span className="text-sm text-base-foreground">{row.label}</span>
            <DiffValue before={row.before} after={row.after} />
          </span>
          <ChangeMarker kind={changeBetween(row.before, row.after)} />
        </li>
      ))}
    </ul>
  );
}

function CompareDiffDeltaDirections() {
  const deltas = [
    { id: 'up', Icon: IconArrowUpRight, text: '+3.0 °C', note: 'Higher on the right side' },
    { id: 'down', Icon: IconArrowDownRight, text: '−5.0 °C', note: 'Lower on the right side' },
    { id: 'flat', Icon: IconMinus, text: '±0.0 °C', note: 'Same number, compared' },
  ];
  return (
    <ul className="flex w-full max-w-xs flex-col gap-3">
      {deltas.map(({ id, Icon, text, note }) => (
        <li key={id} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-sm tabular-nums text-base-foreground">
            <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            {text}
          </span>
          <span className="text-xs text-muted-foreground">{note}</span>
        </li>
      ))}
    </ul>
  );
}

function CompareDiffSummary() {
  const counts = countChangeKinds(LIMIT_ROWS.map(rowChange));
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <span className="text-sm font-medium text-base-foreground">{countDifferences(LIMIT_ROWS)} of {LIMIT_ROWS.length} settings differ</span>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <li>
          <ChangeMarker kind="changed" label={`${counts.changed} changed`} />
        </li>
        <li>
          <ChangeMarker kind="added" label={`${counts.added} added`} />
        </li>
        <li>
          <ChangeMarker kind="removed" label={`${counts.removed} removed`} />
        </li>
      </ul>
      <span className="text-xs text-muted-foreground">{counts.unchanged} unchanged settings are hidden.</span>
    </div>
  );
}

function CompareDiffNoDifferences() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-2 text-center">
      <ChangeMarker kind="unchanged" label="No differences" />
      <p className="text-sm text-muted-foreground">
        Version 12 and the running configuration are identical. Last compared 12 Mar, 14:00.
      </p>
      <Button variant="ghost" size="sm">
        Show all 10 fields
      </Button>
    </div>
  );
}

function CompareDiffValueTable() {
  return <CompareTable label="Vibration model v12 compared with v13" leftLabel="v12 · in use" rightLabel="v13 · candidate" rows={MODEL_ROWS} />;
}

function CompareDiffFieldList() {
  const rows = MODEL_ROWS.filter((row) => rowChange(row) !== 'unchanged').slice(0, 5);
  return (
    <ul aria-label="Changed fields" className="flex w-full max-w-xs flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-0.5">
          <span className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <ChangeMarker kind={rowChange(row)} iconOnly />
          </span>
          <DiffValue before={row.left} after={row.right} mono={row.mono} />
        </li>
      ))}
    </ul>
  );
}

function CompareDiffOnlyDifferences() {
  const [only, setOnly] = useState(true);
  const differing = countDifferences(LIMIT_ROWS);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
          {only ? `${differing} of ${LIMIT_ROWS.length} settings shown` : `All ${LIMIT_ROWS.length} settings shown`}
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-base-foreground">
          Only show differences
          <Switch checked={only} onCheckedChange={setOnly} />
        </label>
      </div>
      <CompareTable label="Alarm settings for 23-TT-92532" leftLabel="Current" rightLabel="Proposed" fieldLabel="Setting" rows={LIMIT_ROWS} onlyDifferences={only} />
    </div>
  );
}

type LimitChange = { id: string; name: string; before?: number; after?: number };

const PRESSURE_LIMITS: readonly LimitChange[] = [
  { id: 'hh', name: 'High-high trip', before: 55, after: 55 },
  { id: 'h', name: 'High alarm', before: 52, after: 50 },
  { id: 'l', name: 'Low alarm', before: 40, after: 42 },
];

function CompareDiffLimitReview() {
  const sensor = SENSORS[0];
  const scale = (value: number) => `${Math.round(((value - sensor.rangeMin) / (sensor.rangeMax - sensor.rangeMin)) * 1000) / 10}%`;
  const band = (low: number, high: number) => ({ left: scale(low), width: `${Math.round(((high - low) / (sensor.rangeMax - sensor.rangeMin)) * 1000) / 10}%` });
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-base-foreground">
          <span className="font-mono">{sensor.tag}</span> {sensor.name}
        </span>
        <span className="text-xs text-muted-foreground">The operating band narrows from 12.0 to 8.0 barg. The trip limit stays.</span>
      </div>
      <div className="flex flex-col gap-2">
        {[
          { id: 'old', label: 'Current', low: 40, high: 52, strong: false },
          { id: 'new', label: 'Proposed', low: 42, high: 50, strong: true },
        ].map((row) => (
          <div key={row.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
            <span className={`text-xs ${row.strong ? 'font-medium text-base-foreground' : 'text-muted-foreground'}`}>{row.label}</span>
            <div role="img" aria-label={`${row.label} operating band, ${row.low} to ${row.high} ${sensor.unit}`} className="relative h-3 rounded-full bg-medium-background">
              <span className={`absolute inset-y-0 rounded-full ${row.strong ? 'bg-chart-1-450' : 'bg-chart-1-200'}`} style={band(row.low, row.high)} />
              <span className="absolute -inset-y-0.5 w-px bg-critical-foreground-strong" style={{ left: scale(55) }} />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
          <span />
          <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{sensor.rangeMin}</span>
            <span>
              {sensor.rangeMax} {sensor.unit}
            </span>
          </div>
        </div>
      </div>
      <Table label={`Limit changes for ${sensor.tag}`}>
        <TableBody>
          {PRESSURE_LIMITS.map((limit) => {
            const before = limit.before?.toFixed(1);
            const after = limit.after?.toFixed(1);
            return (
              <TableRow key={limit.id}>
                <TableCell rowHeader>{limit.name}</TableCell>
                <TableCell align="end">
                  <DiffValue before={before} after={after} unit={sensor.unit} />
                </TableCell>
                <TableCell className="w-28">
                  <ChangeMarker kind={changeBetween(before, after)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CompareDiffTextInline() {
  const stats = diffStats(wordDiff(STEP_BEFORE, STEP_AFTER));
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <span className="text-xs text-muted-foreground">Isolation procedure, step 4 · revision 6 against revision 7</span>
      <TextDiff before={STEP_BEFORE} after={STEP_AFTER} label="Changes to step 4" />
      <span className="text-xs tabular-nums text-muted-foreground">
        {stats.added} words added, {stats.removed} removed
      </span>
    </div>
  );
}

function CompareDiffTextSideBySide() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Revision 6</span>
        <TextDiff before={STEP_BEFORE} after={STEP_AFTER} show="before" label="Step 4, revision 6" />
      </div>
      <div className="flex flex-col gap-1 border-l border-default pl-4">
        <span className="text-xs font-medium text-muted-foreground">Revision 7</span>
        <TextDiff before={STEP_BEFORE} after={STEP_AFTER} show="after" label="Step 4, revision 7" />
      </div>
    </div>
  );
}

function CompareDiffTextReadingMode() {
  const [review, setReview] = useState(false);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-base-foreground">
        Show changes
        <Switch checked={review} onCheckedChange={setReview} />
      </label>
      <TextDiff before={STEP_BEFORE} after={STEP_AFTER} show={review ? 'inline' : 'after'} label="Step 4" />
      <span className="text-xs text-muted-foreground">{review ? 'Reviewing revision 7 against revision 6.' : 'Reading revision 7. Additions stay underlined.'}</span>
    </div>
  );
}

function CompareDiffConfigJson() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Deployed · revision 41</span>
          <CodeBlock code={CONFIG_BEFORE} language="json" showLineNumbers />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Draft · revision 42</span>
          <CodeBlock code={CONFIG_AFTER} language="json" showLineNumbers />
        </div>
      </div>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <ChangeMarker kind="added" /> <span className="font-mono">limits.low</span>
        </li>
        <li className="flex items-center gap-1.5">
          <ChangeMarker kind="changed" /> <span className="font-mono">limits.high</span>, <span className="font-mono">delaySeconds</span>
        </li>
      </ul>
    </div>
  );
}

function CompareDiffKeyValues() {
  const rows = diffKeyValues(SETTINGS_BEFORE, SETTINGS_AFTER);
  return (
    <Table label="Changed keys in the alarm configuration" className="max-w-md">
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead align="end">Value</TableHead>
          <TableHead>Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell rowHeader mono>
              {row.key}
            </TableCell>
            <TableCell align="end">
              <DiffValue before={row.before} after={row.after} mono />
            </TableCell>
            <TableCell>
              <ChangeMarker kind={row.change} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const VERSION_OPTIONS = [
  { value: 'v13', label: 'v13 · candidate · 10 Mar' },
  { value: 'v12', label: 'v12 · in use · 3 Mar' },
  { value: 'v11', label: 'v11 · retired · 14 Jan' },
  { value: 'v10', label: 'v10 · retired · 2 Dec' },
];

function CompareDiffVersionSelector() {
  const [left, setLeft] = useState('v12');
  const [right, setRight] = useState('v13');
  const same = left === right;
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Base</span>
          <OptionSelect aria-label="Base version" options={VERSION_OPTIONS} value={left} onValueChange={setLeft} />
        </div>
        <IconAction
          label="Swap versions"
          size="icon"
          onClick={() => {
            setLeft(right);
            setRight(left);
          }}
        >
          <IconArrowsExchange />
        </IconAction>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Compare with</span>
          <OptionSelect aria-label="Version to compare with" options={VERSION_OPTIONS} value={right} onValueChange={setRight} />
        </div>
      </div>
      <p aria-live="polite" className={`text-xs ${same ? 'text-warning-foreground-strong' : 'text-muted-foreground'}`}>
        {same ? 'Both sides show the same version. Pick another to compare.' : `Showing what changed from ${left} to ${right}.`}
      </p>
    </div>
  );
}

const SCENARIOS = [
  {
    id: 'a',
    name: 'Scenario A',
    title: 'Run to the April shutdown',
    facts: [
      { label: 'Production loss', value: '0 MSm³' },
      { label: 'Failure risk', value: '18%' },
      { label: 'Repair cost', value: '1.2 MNOK' },
      { label: 'Crew days', value: '6' },
    ],
  },
  {
    id: 'b',
    name: 'Scenario B',
    title: 'Replace the bearing now',
    facts: [
      { label: 'Production loss', value: '1.4 MSm³' },
      { label: 'Failure risk', value: '2%' },
      { label: 'Repair cost', value: '0.9 MNOK' },
      { label: 'Crew days', value: '4' },
    ],
  },
];

function CompareDiffScenarioCards() {
  const [picked, setPicked] = useState('b');
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {SCENARIOS.map((scenario) => {
        const selected = picked === scenario.id;
        return (
          <section
            key={scenario.id}
            aria-label={`${scenario.name}: ${scenario.title}`}
            className={`flex flex-col gap-3 rounded-xl border p-4 ${selected ? 'border-emphasized' : 'border-default'}`}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{scenario.name}</span>
              <h3 className="text-sm font-semibold text-base-foreground">{scenario.title}</h3>
            </div>
            <MetadataList items={scenario.facts.map((fact) => ({ label: fact.label, value: <span className="tabular-nums">{fact.value}</span> }))} />
            <Button variant={selected ? 'secondary' : 'outline'} size="sm" aria-pressed={selected} onClick={() => setPicked(scenario.id)}>
              {selected ? 'Selected' : `Select ${scenario.name.toLowerCase()}`}
            </Button>
          </section>
        );
      })}
    </div>
  );
}

/** Readings of the 2nd stage compressor, to set beside the plant's sensors on the 1st stage. */
const SECOND_STAGE: Readonly<Record<string, number>> = {
  'Discharge pressure': 96.2,
  'Suction pressure': 47.9,
  'Discharge temperature': 132.6,
  'Drive-end vibration': 3.1,
  'Shaft speed': 9840,
  'Gas flow': 181900,
};

function CompareDiffAssets() {
  const first = findAsset('23-ka-9101');
  const second = findAsset('23-ka-9102');
  const readings = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101');
  const format = (value: number, decimals: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  return (
    <Table label="1st and 2nd stage compressor, readings side by side">
      <TableHeader>
        <TableRow>
          <TableHead>Reading</TableHead>
          {[first, second].map((asset) => (
            <TableHead key={asset?.id} align="end">
              <span className="flex flex-col items-end gap-1">
                <span className="text-sm text-base-foreground">
                  <span className="font-mono">{asset?.tag}</span> {asset?.name}
                </span>
                {asset ? <StatusBadge status={asset.state} /> : null}
              </span>
            </TableHead>
          ))}
          <TableHead numeric>Difference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell rowHeader>Health score</TableCell>
          <TableCell numeric>{first?.healthScore}</TableCell>
          <TableCell numeric>{second?.healthScore}</TableCell>
          <TableCell numeric muted>
            {numericDelta(first?.healthScore ?? 0, second?.healthScore ?? 0, 0).text}
          </TableCell>
        </TableRow>
        {readings.map((sensor) => {
          const other = SECOND_STAGE[sensor.name];
          const nearLimit = sensor.value > sensor.highLimit * 0.95;
          return (
            <TableRow key={sensor.id}>
              <TableCell rowHeader>{sensor.name}</TableCell>
              <TableCell numeric>
                {format(sensor.value, sensor.decimals)} <span className="text-muted-foreground">{sensor.unit}</span>
                {nearLimit ? <span className="block text-xs font-medium text-warning-foreground-strong">Near high limit</span> : null}
              </TableCell>
              <TableCell numeric>
                {format(other, sensor.decimals)} <span className="text-muted-foreground">{sensor.unit}</span>
              </TableCell>
              <TableCell numeric muted>
                {numericDelta(sensor.value, other, sensor.decimals).text}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function CompareDiffPeriods() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium text-base-foreground">This week against last week</h3>
        <span className="text-xs tabular-nums text-muted-foreground">9–12 Mar compared with 2–5 Mar, same four days</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <StatDelta label="Availability" value={PLANT_KPIS.availability.value} previous={PLANT_KPIS.availability.previous} unit="%" decimals={1} betterWhen="higher" comparison="vs last week" />
        <StatDelta label="Gas export" value={PLANT_KPIS.gasExport.value} previous={PLANT_KPIS.gasExport.previous} unit="MSm³/d" decimals={2} betterWhen="higher" comparison="vs last week" />
        <StatDelta label="Flaring" value={PLANT_KPIS.flaring.value} previous={PLANT_KPIS.flaring.previous} unit="kSm³/d" decimals={1} betterWhen="lower" comparison="vs last week" />
        <StatDelta label="Active alarms" value={PLANT_KPIS.activeAlarms.value} previous={PLANT_KPIS.activeAlarms.previous} betterWhen="lower" comparison="vs last week" />
      </div>
    </div>
  );
}

function CompareDiffDeltaColumn() {
  const kpi = (id: string, name: string, previous: number, value: number, decimals: number, unit: string): CompareRow => ({
    id,
    label: unit ? `${name}, ${unit}` : name,
    left: previous.toFixed(decimals),
    right: value.toFixed(decimals),
    delta: numericDelta(previous, value, decimals),
  });
  return (
    <CompareTable
      label="Plant figures, last week and this week"
      leftLabel="Last week"
      rightLabel="This week"
      fieldLabel="Figure"
      rows={[
        kpi('oee', 'OEE', PLANT_KPIS.oee.previous, PLANT_KPIS.oee.value, 1, '%'),
        kpi('energy', 'Energy intensity', PLANT_KPIS.energyIntensity.previous, PLANT_KPIS.energyIntensity.value, 1, 'kWh/boe'),
        kpi('mtbf', 'MTBF', PLANT_KPIS.mtbf.previous, PLANT_KPIS.mtbf.value, 0, 'h'),
        kpi('orders', 'Open work orders', PLANT_KPIS.openWorkOrders.previous, PLANT_KPIS.openWorkOrders.value, 0, ''),
      ]}
    />
  );
}

const THREE_WAY = [
  { id: 'high', label: 'High alarm', base: '145.0 °C', theirs: '148.0 °C', yours: '147.0 °C', result: undefined },
  { id: 'delay', label: 'Alarm delay', base: '0 s', theirs: '10 s', yours: '0 s', result: '10 s' },
  { id: 'priority', label: 'Priority', base: 'High', theirs: 'High', yours: 'Medium', result: 'Medium' },
  { id: 'deadband', label: 'Deadband', base: '1.0 °C', theirs: '1.0 °C', yours: '1.0 °C', result: '1.0 °C' },
];

function CompareDiffThreeWay() {
  return (
    <Table label="Three-way summary of the alarm configuration">
      <TableHeader>
        <TableRow>
          <TableHead>Setting</TableHead>
          <TableHead numeric>Base</TableHead>
          <TableHead numeric>Theirs</TableHead>
          <TableHead numeric>Yours</TableHead>
          <TableHead>Outcome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {THREE_WAY.map((row) => {
          const side = (value: string) => (value === row.base ? 'text-muted-foreground' : 'font-medium text-base-foreground');
          const both = row.theirs !== row.base && row.yours !== row.base;
          const none = row.theirs === row.base && row.yours === row.base;
          return (
            <TableRow key={row.id}>
              <TableCell rowHeader>{row.label}</TableCell>
              <TableCell numeric muted>
                {row.base}
              </TableCell>
              <TableCell numeric>
                <span className={side(row.theirs)}>{row.theirs}</span>
              </TableCell>
              <TableCell numeric>
                <span className={side(row.yours)}>{row.yours}</span>
              </TableCell>
              <TableCell>
                {both ? (
                  <span className="whitespace-nowrap text-xs font-medium text-warning-foreground-strong">Conflict, choose</span>
                ) : none ? (
                  <ChangeMarker kind="unchanged" />
                ) : (
                  <ChangeMarker kind="changed" label={`Takes ${row.theirs !== row.base ? 'theirs' : 'yours'}`} />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

const CONFLICTS = [
  { id: 'high', label: 'High alarm', left: '147.0 °C', right: '148.0 °C' },
  { id: 'note', label: 'Operator note', left: 'Check cooler outlet first', right: 'Check cooler outlet and fan speed' },
  { id: 'owner', label: 'Owner', left: 'Liv Wold', right: 'Aisha Khan' },
];

function CompareDiffMergeChoice() {
  const [choice, setChoice] = useState<MergeSide | undefined>(undefined);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-[minmax(6rem,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-2 text-xs font-medium text-muted-foreground">
        <span>Setting</span>
        <span>Yours</span>
        <span>Theirs</span>
      </div>
      <MergeChoiceRow label="High alarm" left="147.0 °C" right="148.0 °C" leftLabel="yours" rightLabel="theirs" choice={choice} onChoose={setChoice} />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {choice === undefined ? 'Both of you changed this setting since revision 41.' : `Keeping ${choice === 'left' ? 'your' : 'their'} value. Click the other side to change your mind.`}
      </p>
    </div>
  );
}

function CompareDiffMergeResolve() {
  const [choices, setChoices] = useState<Readonly<Record<string, MergeSide>>>({ owner: 'left' });
  const [applied, setApplied] = useState(false);
  const open = CONFLICTS.length - Object.keys(choices).length;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-base-foreground">Merge alarm configuration</h3>
          <p className="text-sm text-muted-foreground">
            Aisha Khan saved revision 42 while you were editing. 3 settings changed on both sides; 4 others merge on their own.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setChoices(Object.fromEntries(CONFLICTS.map((conflict) => [conflict.id, 'left' as const])))}>
            Keep all yours
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setChoices(Object.fromEntries(CONFLICTS.map((conflict) => [conflict.id, 'right' as const])))}>
            Keep all theirs
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[minmax(6rem,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-2 text-xs font-medium text-muted-foreground">
          <span>Setting</span>
          <span>Yours · draft</span>
          <span>Theirs · revision 42</span>
        </div>
        {CONFLICTS.map((conflict) => (
          <MergeChoiceRow
            key={conflict.id}
            label={conflict.label}
            left={conflict.left}
            right={conflict.right}
            leftLabel="yours"
            rightLabel="theirs"
            choice={choices[conflict.id]}
            onChoose={(side) => {
              setApplied(false);
              setChoices({ ...choices, [conflict.id]: side });
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-default pt-4">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {applied ? 'Saved as revision 43.' : open === 0 ? 'All conflicts resolved.' : `${open} ${open === 1 ? 'conflict' : 'conflicts'} left to resolve.`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setChoices({});
              setApplied(false);
            }}
          >
            Reset choices
          </Button>
          <Button disabled={open > 0} onClick={() => setApplied(true)}>
            Save merged revision
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompareDiffModelVersions() {
  const [left, setLeft] = useState('v12');
  const [right, setRight] = useState('v13');
  const [only, setOnly] = useState(false);
  const known = (left === 'v12' && right === 'v13') || (left === 'v13' && right === 'v12');
  const rows = left === 'v13' ? MODEL_ROWS.map((row) => ({ ...row, left: row.right, right: row.left, delta: undefined })) : MODEL_ROWS;
  const counts = countChangeKinds(rows.map(rowChange));
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-base-foreground">Compare model versions</h3>
          <span className="text-sm text-muted-foreground">
            Vibration anomaly model, <span className="font-mono">23-KA-9101</span> 1st stage compressor
          </span>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-56">
            <OptionSelect aria-label="Base version" options={VERSION_OPTIONS.slice(0, 2)} value={left} onValueChange={setLeft} />
          </div>
          <IconAction
            label="Swap versions"
            size="icon"
            onClick={() => {
              setLeft(right);
              setRight(left);
            }}
          >
            <IconArrowsExchange />
          </IconAction>
          <div className="w-56">
            <OptionSelect aria-label="Version to compare with" options={VERSION_OPTIONS.slice(0, 2)} value={right} onValueChange={setRight} />
          </div>
        </div>
      </div>
      {known ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <li>
                <ChangeMarker kind="changed" label={`${counts.changed} changed`} />
              </li>
              <li>
                <ChangeMarker kind="added" label={`${counts.added} added`} />
              </li>
              <li>
                <ChangeMarker kind="removed" label={`${counts.removed} removed`} />
              </li>
              <li>
                <ChangeMarker kind="unchanged" label={`${counts.unchanged} unchanged`} />
              </li>
            </ul>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-base-foreground">
              Only show differences
              <Switch checked={only} onCheckedChange={setOnly} />
            </label>
          </div>
          <CompareTable label={`Vibration model ${left} compared with ${right}`} leftLabel={left} rightLabel={right} rows={rows} onlyDifferences={only} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary">Keep v12 in use</Button>
            <Button>Request approval for v13</Button>
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">Both sides show the same version. Pick two different versions to compare.</p>
      )}
    </div>
  );
}

export default definePage({
  id: 'compare-and-diff',
  title: 'Compare and diff',
  summary:
    'Two versions, assets or periods set against each other so the difference is the first thing you see: marked in words and icons, measured where it is a number, and resolvable where it is a conflict.',
  guidance: {
    use: [
      'A marker with an icon and a word on every changed line: added, removed, changed.',
      'Before and after on one line for single values; side by side for records with many fields.',
      'A difference column with sign and direction when the values are numbers.',
      'A way to hide what is unchanged, with a count of what is hidden.',
    ],
    avoid: [
      'Red and green tints as the only sign of a change.',
      'Judging a difference as good or bad when the direction has no agreed meaning.',
      'Comparing more than two things side by side on a narrow screen; pick a base and step through.',
      'Auto-resolving a field both sides changed. Show it and ask.',
    ],
  },
  source,
  sections: [
    {
      id: 'markers',
      title: 'Markers and values',
      description: 'The smallest pieces: how one changed value and one changed line are shown.',
      specimens: [
        {
          id: 'CompareDiffChangeMarkers',
          title: 'Change markers',
          note: 'The four kinds of change, each with its own icon and word so they survive without colour.',
          origin: 'custom',
          uses: ['patterns/workflows/ChangeMarker.tsx', 'patterns/workflows/changeKind.ts'],
          Component: CompareDiffChangeMarkers,
        },
        {
          id: 'CompareDiffInline',
          title: 'Before and after inline',
          note: 'One changed value in a row or a sentence: old struck through, an arrow, new in full weight.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/DiffValue.tsx'],
          Component: CompareDiffInline,
        },
        {
          id: 'CompareDiffRowStates',
          title: 'Row states',
          note: 'A list of changes where each line is added, removed, changed or left alone.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/DiffValue.tsx', 'patterns/workflows/ChangeMarker.tsx', 'patterns/workflows/changeKind.ts'],
          Component: CompareDiffRowStates,
        },
        {
          id: 'CompareDiffDeltaDirections',
          title: 'Delta with direction',
          note: 'Numeric differences: a sign, an arrow and the unit. Neutral, because up is not always good.',
          origin: 'custom',
          align: 'stretch',
          Component: CompareDiffDeltaDirections,
        },
        {
          id: 'CompareDiffSummary',
          title: 'Change summary',
          note: 'Above a long comparison: how much differs, by kind, and how much is hidden.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/ChangeMarker.tsx', 'patterns/workflows/compareRows.ts', 'patterns/workflows/changeKind.ts'],
          Component: CompareDiffSummary,
        },
        {
          id: 'CompareDiffNoDifferences',
          title: 'No differences',
          note: 'Two sides that turn out identical: say so, say when it was checked, and offer the full list.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/ChangeMarker.tsx'],
          Component: CompareDiffNoDifferences,
        },
      ],
    },
    {
      id: 'tables',
      title: 'Field by field',
      description: 'Records compared one field per row.',
      specimens: [
        {
          id: 'CompareDiffValueTable',
          title: 'Value comparison table',
          note: 'Two versions of one record: both values, the difference for numbers and a marker per row.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/workflows/CompareTable.tsx', 'patterns/workflows/compareRows.ts', 'patterns/workflows/ChangeMarker.tsx'],
          Component: CompareDiffValueTable,
        },
        {
          id: 'CompareDiffFieldList',
          title: 'Field-level diff list',
          note: 'Narrow panels and review sidebars: only the changed fields, stacked.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/DiffValue.tsx', 'patterns/workflows/ChangeMarker.tsx', 'patterns/workflows/compareRows.ts'],
          Component: CompareDiffFieldList,
        },
        {
          id: 'CompareDiffOnlyDifferences',
          title: 'Only show differences',
          note: 'Long records where most fields match; the count says what the switch hides.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/CompareTable.tsx', 'patterns/workflows/compareRows.ts'],
          Component: CompareDiffOnlyDifferences,
        },
        {
          id: 'CompareDiffLimitReview',
          title: 'Limit change review',
          note: 'Alarm limits before approval: the old and new operating band drawn to scale, then each limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/DiffValue.tsx', 'patterns/workflows/ChangeMarker.tsx', 'patterns/workflows/changeKind.ts', 'primitives/table/Table.tsx'],
          Component: CompareDiffLimitReview,
        },
      ],
    },
    {
      id: 'text-and-config',
      title: 'Text and configuration',
      description: 'Differences inside prose and structured files.',
      specimens: [
        {
          id: 'CompareDiffTextInline',
          title: 'Word-level text diff',
          note: 'A revised sentence or procedure step: removed words struck through, added words underlined.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/TextDiff.tsx', 'patterns/workflows/wordDiff.ts'],
          Component: CompareDiffTextInline,
        },
        {
          id: 'CompareDiffTextSideBySide',
          title: 'Text side by side',
          note: 'When both versions must stay readable as a whole: the old side marks what went, the new side what came.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/TextDiff.tsx', 'patterns/workflows/wordDiff.ts'],
          Component: CompareDiffTextSideBySide,
        },
        {
          id: 'CompareDiffConfigJson',
          title: 'Configuration diff',
          note: 'Two revisions of a JSON configuration in full, with the changed keys listed underneath.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/ChangeMarker.tsx'],
          Component: CompareDiffConfigJson,
        },
        {
          id: 'CompareDiffKeyValues',
          title: 'Changed keys',
          note: 'The same configuration change flattened to keys, for reviewers who do not read JSON.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/diffKeyValues.ts', 'patterns/workflows/DiffValue.tsx', 'patterns/workflows/ChangeMarker.tsx', 'primitives/table/Table.tsx'],
          Component: CompareDiffKeyValues,
        },
        {
          id: 'CompareDiffTextReadingMode',
          title: 'Show changes switch',
          note: 'Readers first, reviewers on demand: the new text, with removals shown only when asked for.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/TextDiff.tsx'],
          Component: CompareDiffTextReadingMode,
        },
      ],
    },
    {
      id: 'side-by-side',
      title: 'Side by side',
      description: 'Choosing two things and reading them against each other.',
      specimens: [
        {
          id: 'CompareDiffVersionSelector',
          title: 'Version selector pair',
          note: 'Pick the base and what to compare it with; swap flips the direction of every difference.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/OptionSelect.tsx', 'patterns/collections/IconAction.tsx'],
          Component: CompareDiffVersionSelector,
        },
        {
          id: 'CompareDiffScenarioCards',
          title: 'Scenario cards',
          note: 'Two options with the same facts in the same order, so the eye compares across.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: CompareDiffScenarioCards,
        },
        {
          id: 'CompareDiffAssets',
          title: 'Assets side by side',
          note: 'Sister machines on the same readings: one column each and the difference between them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'display/StatusBadge.tsx', 'patterns/workflows/compareRows.ts'],
          Component: CompareDiffAssets,
        },
        {
          id: 'CompareDiffPeriods',
          title: 'Period against period',
          note: 'This week against last on a few headline figures, judged only where a direction is agreed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatDelta.tsx'],
          Component: CompareDiffPeriods,
        },
        {
          id: 'CompareDiffDeltaColumn',
          title: 'Delta column',
          note: 'Several figures over two periods in a table; the difference column carries sign and direction.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/CompareTable.tsx', 'patterns/workflows/compareRows.ts'],
          Component: CompareDiffDeltaColumn,
        },
      ],
    },
    {
      id: 'merging',
      title: 'Merging and full comparisons',
      description: 'When both sides changed, and complete comparison screens.',
      specimens: [
        {
          id: 'CompareDiffMergeChoice',
          title: 'Merge choice row',
          note: 'One conflicting field: two candidate values, one of which is kept.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/MergeChoiceRow.tsx'],
          Component: CompareDiffMergeChoice,
        },
        {
          id: 'CompareDiffThreeWay',
          title: 'Three-way summary',
          note: 'Base, theirs and yours: what merges on its own and what needs a decision.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'patterns/workflows/ChangeMarker.tsx'],
          Component: CompareDiffThreeWay,
        },
        {
          id: 'CompareDiffMergeResolve',
          title: 'Resolve conflicts',
          note: 'Someone saved while you were editing: resolve each field, then save. The button waits for the last one.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/MergeChoiceRow.tsx'],
          Component: CompareDiffMergeResolve,
        },
        {
          id: 'CompareDiffModelVersions',
          title: 'Model version comparison',
          note: 'A full comparison view: pick versions, read the summary, hide what matches and act on the result.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/workflows/CompareTable.tsx',
            'patterns/workflows/ChangeMarker.tsx',
            'patterns/workflows/compareRows.ts',
            'patterns/workflows/changeKind.ts',
            'patterns/data-entry/OptionSelect.tsx',
          ],
          Component: CompareDiffModelVersions,
        },
      ],
    },
  ],
});
