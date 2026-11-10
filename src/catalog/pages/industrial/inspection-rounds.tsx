import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconBarcode, IconCamera, IconCheck, IconCloudCheck, IconCloudOff, IconCloudUpload, IconMinus, IconX } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue } from '../../../library/industrial/status';
import type { Severity, StatusDescriptor } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { CheckpointRow } from '../../../library/industrial/workflows/CheckpointRow';
import type { CheckpointReading, CheckpointResult } from '../../../library/industrial/workflows/CheckpointRow';
import { PagePreview } from '../../../library/industrial/workflows/PagePreview';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import type { SignOffSigner } from '../../../library/industrial/workflows/SignOffBlock';
import { StepList } from '../../../library/industrial/workflows/StepList';
import type { StepListItem } from '../../../library/industrial/workflows/StepList';
import { TagChip } from '../../../library/industrial/workflows/TagChip';
import { isWithinLimits } from '../../../library/industrial/workflows/workflow';
import { definePage } from '../../types';

import source from './inspection-rounds.tsx?raw';

type Checkpoint = {
  id: string;
  name: string;
  tag: string;
  result: CheckpointResult;
  reading?: CheckpointReading;
  note?: string;
};

/** The compression area morning round, R-23-A, as it stands at 14:00. */
const CHECKPOINTS: readonly Checkpoint[] = [
  { id: 'c1', name: '1st stage lube oil level', tag: '23-KA-9101', result: 'pass', reading: { value: 68, unit: '%', low: 40, high: 90 } },
  { id: 'c2', name: '1st stage seal gas filter differential', tag: '23-KA-9101', result: 'pass', reading: { value: 0.4, unit: 'bar', decimals: 1, high: 1 } },
  { id: 'c3', name: '1st stage drive-end vibration, handheld', tag: '23-KA-9101', result: 'pass', reading: { value: 6.8, unit: 'mm/s', decimals: 1, high: 7.1 } },
  { id: 'c4', name: 'Interstage cooler leak check', tag: '23-HA-9114', result: 'pass' },
  { id: 'c5', name: 'Cooler outlet temperature, local gauge', tag: '23-HA-9114', result: 'fail', reading: { value: 41.5, unit: '°C', decimals: 1, low: 20, high: 40 } },
  { id: 'c6', name: '2nd stage lube oil level', tag: '23-KA-9102', result: 'pass', reading: { value: 72, unit: '%', low: 40, high: 90 } },
  { id: 'c7', name: 'Recompressor bearing housing', tag: '23-KA-9103', result: 'fail', note: 'Oil in sight glass is dark, housing hot to the touch.' },
  { id: 'c8', name: 'Recompressor casing drain valve', tag: '23-KA-9103', result: 'skip', note: 'Area barricaded for the bearing inspection.' },
  { id: 'c9', name: 'Gas turbine enclosure, visual', tag: '23-GT-9001', result: 'pending' },
  { id: 'c10', name: 'Turbine lube oil tank level', tag: '23-GT-9001', result: 'pending' },
  { id: 'c11', name: 'Fuel gas skid leak check', tag: '23-GT-9001', result: 'pending' },
  { id: 'c12', name: 'Housekeeping and escape routes', tag: 'NK-23', result: 'pending' },
];

const countResult = (result: CheckpointResult): number => CHECKPOINTS.filter((checkpoint) => checkpoint.result === result).length;
const DONE = CHECKPOINTS.length - countResult('pending');

type Round = {
  id: string;
  name: string;
  area: string;
  operator: string | null;
  done: number;
  total: number;
  findings: number;
  due: string;
  state: 'in-progress' | 'scheduled' | 'done' | 'overdue';
  overdueBy?: string;
};

const ROUNDS: readonly Round[] = [
  { id: 'R-23-A', name: 'Compression area, morning round', area: 'NK-23', operator: 'Tomás Barros', done: DONE, total: CHECKPOINTS.length, findings: 2, due: 'Today 14:30', state: 'in-progress' },
  { id: 'R-20-A', name: 'Inlet and separation round', area: 'NK-20', operator: 'Ingrid Haugen', done: 0, total: 9, findings: 0, due: 'Today 16:00', state: 'scheduled' },
  { id: 'R-27-W', name: 'Export pumps, weekly', area: 'NK-27', operator: 'Jonas Nyberg', done: 8, total: 8, findings: 1, due: 'Today 12:00', state: 'done' },
  { id: 'R-40-A', name: 'Cooling water round', area: 'NK-40', operator: null, done: 0, total: 6, findings: 0, due: 'Today 10:00', state: 'overdue', overdueBy: '4 h' },
  { id: 'R-FG-M', name: 'Fire and gas detectors, monthly', area: 'NK', operator: 'Jonas Nyberg', done: 14, total: 22, findings: 0, due: '10 Mar', state: 'overdue', overdueBy: '2 d' },
];

const ROUND_STATE: Record<Round['state'], StatusDescriptor> = {
  'in-progress': { tone: 'info', label: 'In progress', shape: 'ring' },
  scheduled: { tone: 'neutral', label: 'Scheduled', shape: 'ring' },
  done: { tone: 'success', label: 'Completed', shape: 'dot' },
  overdue: { tone: 'critical', label: 'Overdue', shape: 'diamond' },
};

type Finding = { id: string; title: string; tag: string; severity: Severity; checkpoint: string; description: string; workOrder?: string };

const FINDINGS: readonly Finding[] = [
  { id: 'F-0318', title: 'Dark oil and hot bearing housing', tag: '23-KA-9103', severity: 'high', checkpoint: 'Recompressor bearing housing', description: 'Oil in the drive-end sight glass is dark and the housing is too hot to hold a hand on. Consistent with the vibration trip at 13:46.', workOrder: 'WO-104482' },
  { id: 'F-0319', title: 'Cooler outlet above local limit', tag: '23-HA-9114', severity: 'medium', checkpoint: 'Cooler outlet temperature, local gauge', description: 'Local gauge reads 41.5 °C against a 40 °C limit. Tube bundle cleaning is already planned.' },
  { id: 'F-0311', title: 'Weeping gland on pump B suction valve', tag: '27-PA-2001B', severity: 'low', checkpoint: 'Export pump B, visual', description: 'Slight weep at the gland, a few drops a minute. Monitor on next round.' },
];

const ROUTE_STOPS: readonly StepListItem[] = [
  { id: 's1', label: '1st stage', detail: '3 of 3', state: 'done' },
  { id: 's2', label: 'Cooler', detail: '2 of 2', state: 'done' },
  { id: 's3', label: '2nd stage', detail: '1 of 1', state: 'done' },
  { id: 's4', label: 'Recompressor', detail: '1 skipped', state: 'held' },
  { id: 's5', label: 'Gas turbine', detail: '0 of 3', state: 'active' },
  { id: 's6', label: 'Area', detail: '0 of 1', state: 'pending' },
];

const ROUTE_VERTICAL: readonly StepListItem[] = [
  { id: 'v1', label: '1st stage compressor', detail: '23-KA-9101 · 3 checkpoints, all pass', state: 'done', meta: <RouteTime>13:12</RouteTime> },
  { id: 'v2', label: 'Interstage cooler', detail: '23-HA-9114 · 1 pass, 1 fail', state: 'failed', meta: <RouteTime>13:24</RouteTime> },
  { id: 'v3', label: '2nd stage compressor', detail: '23-KA-9102 · 1 checkpoint, pass', state: 'done', meta: <RouteTime>13:31</RouteTime> },
  { id: 'v4', label: 'Recompressor', detail: '23-KA-9103 · 1 fail, 1 skipped', state: 'failed', meta: <RouteTime>13:52</RouteTime> },
  { id: 'v5', label: 'Gas turbine', detail: '23-GT-9001 · 3 checkpoints to go', state: 'active' },
  { id: 'v6', label: 'Housekeeping and escape routes', detail: 'NK-23 · 1 checkpoint', state: 'pending' },
];

const HISTORY: readonly { date: string; value: number; operator: string }[] = [
  { date: '12 Mar', value: 41.5, operator: 'Tomás Barros' },
  { date: '11 Mar', value: 39.8, operator: 'Tomás Barros' },
  { date: '10 Mar', value: 39.1, operator: 'Jonas Nyberg' },
  { date: '9 Mar', value: 38.6, operator: 'Tomás Barros' },
  { date: '8 Mar', value: 38.0, operator: 'Ingrid Haugen' },
  { date: '7 Mar', value: 37.4, operator: 'Tomás Barros' },
];

const SKIP_REASONS = [
  { value: 'access', label: 'No safe access' },
  { value: 'out-of-service', label: 'Equipment out of service' },
  { value: 'permit', label: 'Blocked by a work permit' },
  { value: 'other', label: 'Other' },
];

const SIGNERS: readonly SignOffSigner[] = [
  { id: 'operator', role: 'Field operator', name: 'Tomás Barros', state: 'pending' },
  { id: 'supervisor', role: 'Shift supervisor', name: 'Liv Wold', state: 'pending' },
];

const SYNC: Record<'synced' | 'offline' | 'syncing', { label: string; detail: string; icon: typeof IconCloudCheck; tone: string }> = {
  synced: { label: 'Synced', detail: 'All readings uploaded 13:58', icon: IconCloudCheck, tone: 'text-muted-foreground' },
  offline: { label: 'Saved on this device', detail: '3 readings waiting for a connection', icon: IconCloudOff, tone: 'text-warning-foreground-strong' },
  syncing: { label: 'Syncing', detail: 'Uploading 2 of 3 readings', icon: IconCloudUpload, tone: 'text-info-foreground-strong' },
};

const RESULT_OPTIONS: readonly { value: Exclude<CheckpointResult, 'pending'>; label: string; icon: typeof IconCheck }[] = [
  { value: 'pass', label: 'Pass', icon: IconCheck },
  { value: 'fail', label: 'Fail', icon: IconX },
  { value: 'skip', label: 'Skip', icon: IconMinus },
];

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

function RouteTime({ children }: { children: string }) {
  return <span className="text-xs text-muted-foreground tabular-nums">{children}</span>;
}

function SyncLine({ state }: { state: keyof typeof SYNC }) {
  const { label, detail, icon: Icon, tone } = SYNC[state];
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden className={`size-4 shrink-0 ${tone}`} />
      <div className="flex min-w-0 flex-col">
        <span className="text-sm text-base-foreground">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{detail}</span>
      </div>
    </div>
  );
}

/** Pass, fail and skip as three toggle buttons; exactly one can be pressed. */
function ResultButtons({ value, onChange, size = 'default' }: { value: CheckpointResult; onChange: (value: CheckpointResult) => void; size?: 'default' | 'lg' }) {
  return (
    <div role="group" aria-label="Checkpoint result" className="grid w-full grid-cols-3 gap-2">
      {RESULT_OPTIONS.map((option) => {
        const Icon = option.icon;
        const pressed = value === option.value;
        return (
          <Button key={option.value} size={size} variant={pressed ? 'default' : 'outline'} aria-pressed={pressed} className="w-full" onClick={() => onChange(pressed ? 'pending' : option.value)}>
            <Icon /> {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function RoundCard({ round }: { round: Round }) {
  const overdue = round.state === 'overdue';
  return (
    <Card className="w-full max-w-xs gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-base-foreground">{round.name}</span>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">{round.id}</span> · {round.operator ?? 'Not assigned'}
          </span>
        </div>
        <StatusIndicator variant="badge" {...ROUND_STATE[round.state]} />
      </div>
      <LabelledProgress label="Checkpoints" value={round.done} max={round.total} valueText={`${round.done} of ${round.total}`} size="sm" />
      <div className="flex items-center justify-between gap-3 text-xs tabular-nums">
        <span className={overdue ? 'font-medium text-critical-foreground-strong' : 'text-muted-foreground'}>{overdue ? `Due ${round.due} · ${round.overdueBy} late` : `Due ${round.due}`}</span>
        <span className="text-muted-foreground">
          {round.findings} {round.findings === 1 ? 'finding' : 'findings'}
        </span>
      </div>
    </Card>
  );
}

function InspectionRoundCard() {
  return <RoundCard round={ROUNDS[0]} />;
}

function InspectionRoundCardOverdue() {
  return <RoundCard round={ROUNDS[3]} />;
}

function InspectionRoundCardDone() {
  return <RoundCard round={ROUNDS[2]} />;
}

function InspectionRoundSchedule() {
  return (
    <ul aria-label="Rounds scheduled today" className="flex w-full max-w-lg flex-col divide-y divide-default">
      {ROUNDS.slice(0, 4).map((round) => (
        <li key={round.id} className="grid grid-cols-[minmax(0,1fr)_6.5rem_5.5rem] items-center gap-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-base-foreground">{round.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              <span className="font-mono">{round.id}</span> · {round.total} checkpoints · {round.operator ?? 'Not assigned'}
            </span>
          </div>
          <StatusIndicator size="sm" {...ROUND_STATE[round.state]} />
          <span className="text-right text-xs text-muted-foreground tabular-nums">{round.due}</span>
        </li>
      ))}
    </ul>
  );
}

function InspectionRoundOverdue() {
  const overdue = ROUNDS.filter((round) => round.state === 'overdue');
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Overdue rounds</span>
        <span className="text-xs text-muted-foreground tabular-nums">{overdue.length} overdue · longest first</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {[...overdue].reverse().map((round) => (
          <li key={round.id} className="flex items-center gap-3 py-2">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">{round.name}</span>
              <span className="truncate text-xs text-muted-foreground tabular-nums">
                {round.done} of {round.total} checkpoints · {round.operator ?? 'Not assigned'}
              </span>
            </div>
            <span className="shrink-0 text-xs font-medium text-critical-foreground-strong tabular-nums">{round.overdueBy} late</span>
            <Button variant="secondary" size="sm">
              {round.operator ? 'Continue round' : 'Assign round'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InspectionRoundCheckpointRow() {
  return (
    <div className="flex w-full max-w-lg flex-col divide-y divide-default">
      {[CHECKPOINTS[2], CHECKPOINTS[4], CHECKPOINTS[7], CHECKPOINTS[8]].map((checkpoint) => (
        <CheckpointRow
          key={checkpoint.id}
          index={CHECKPOINTS.indexOf(checkpoint) + 1}
          name={checkpoint.name}
          tag={checkpoint.tag}
          result={checkpoint.result}
          reading={checkpoint.reading}
          note={checkpoint.note}
        />
      ))}
    </div>
  );
}

function InspectionRoundReadingEntry() {
  const id = useId();
  const checkpoint = CHECKPOINTS[4];
  const [value, setValue] = useState<number | null>(41.5);
  const outside = value !== null && !isWithinLimits(value, 20, 40);
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-base-foreground">{checkpoint.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{checkpoint.tag}</span>
      </div>
      <div className="flex flex-col">
        <Label htmlFor={id}>Reading</Label>
        <UnitNumberInput id={id} value={value} onValueChange={setValue} unit="°C" step={0.1} aria-describedby={`${id}-limits`} aria-invalid={outside} />
        <p id={`${id}-limits`} role={outside ? 'alert' : undefined} className={`pt-1 text-xs tabular-nums ${outside ? 'font-medium text-warning-foreground-strong' : 'text-muted-foreground'}`}>
          {outside ? 'Outside limits 20–40 °C. Check the gauge, then save it as a finding.' : value === null ? 'Enter the value on the local gauge. Limits 20–40 °C.' : 'Within limits 20–40 °C.'}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">Last round 39.8 °C</span>
        <Button size="sm" variant={outside ? 'secondary' : 'default'} disabled={value === null}>
          {outside ? 'Save as finding' : 'Save reading'}
        </Button>
      </div>
    </div>
  );
}

function InspectionRoundResultControl() {
  const [result, setResult] = useState<CheckpointResult>('pass');
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-base-foreground">Interstage cooler leak check</span>
        <span className="text-xs text-muted-foreground">No visible leaks at flanges or drain.</span>
      </div>
      <ResultButtons value={result} onChange={setResult} />
    </div>
  );
}

function InspectionRoundOfflineSaved() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl bg-muted-background p-3">
      <SyncLine state="offline" />
      <p className="text-xs text-muted-foreground">You can finish the round offline. Readings upload when the tablet is back in range.</p>
    </div>
  );
}

function InspectionRoundSyncStates() {
  return (
    <div className="flex flex-col gap-4">
      <SyncLine state="synced" />
      <SyncLine state="syncing" />
      <SyncLine state="offline" />
    </div>
  );
}

function InspectionRoundChecklist() {
  const id = useId();
  const items = ['Guards and covers in place', 'No oil on the baseplate', 'No unusual noise', 'Local instruments readable'];
  const [checked, setChecked] = useState<readonly string[]>(items.slice(0, 3));
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">2nd stage compressor, visual checks</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {checked.length} of {items.length}
        </span>
      </div>
      <CheckboxGroup aria-label="Visual checks">
        {items.map((item) => (
          <CheckboxItem key={item}>
            <CheckboxItemControl
              checked={checked.includes(item)}
              onCheckedChange={(isChecked) => setChecked((current) => (isChecked ? [...current, item] : current.filter((entry) => entry !== item)))}
            />
            <CheckboxItemLabel>{item}</CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <div className="grid grid-cols-[6rem_6rem_minmax(0,1fr)] items-start gap-3">
        <PagePreview kind="photo" label="Photo 1, pressure gauge 23-PI-9211" caption="Photo 1" />
        <button
          type="button"
          className="flex aspect-4/3 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-emphasized text-xs text-muted-foreground hover:bg-muted-background focus-visible:shadow-focus-ring focus-visible:outline-none"
        >
          <IconCamera aria-hidden className="size-5" />
          Add photo
        </button>
        <div className="flex flex-col">
          <Label htmlFor={id}>Note</Label>
          <Textarea id={id} rows={2} defaultValue="Glass on 23-PI-9211 is fogged; reading taken from the transmitter." />
        </div>
      </div>
    </div>
  );
}

function InspectionRoundTagConfirm() {
  const id = useId();
  const expected = '23-HA-9114';
  const [tag, setTag] = useState('23-HA-9114');
  const entered = tag.trim().toUpperCase();
  const state = entered === '' ? 'empty' : entered === expected ? 'match' : 'mismatch';
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Confirm the equipment</span>
        <span className="text-xs text-muted-foreground">
          Expected <TagChip tag={expected} />
        </span>
      </div>
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-stretch gap-4">
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-emphasized p-3 text-center text-xs text-muted-foreground">
          <IconBarcode aria-hidden className="size-8" />
          Point the camera at the tag plate
        </div>
        <div className="flex flex-col justify-center">
          <Label htmlFor={id}>Or type the tag</Label>
          <Input id={id} value={tag} onChange={(event) => setTag(event.target.value)} aria-invalid={state === 'mismatch'} aria-describedby={`${id}-state`} />
          <p
            id={`${id}-state`}
            role={state === 'mismatch' ? 'alert' : 'status'}
            className={`flex items-center gap-1 pt-1 text-xs ${state === 'match' ? 'text-success-foreground-strong' : state === 'mismatch' ? 'font-medium text-critical-foreground-strong' : 'text-muted-foreground'}`}
          >
            {state === 'match' ? <IconCheck aria-hidden className="size-3.5" /> : null}
            {state === 'mismatch' ? <IconX aria-hidden className="size-3.5" /> : null}
            {state === 'match' ? 'Tag matches. Interstage cooler.' : state === 'mismatch' ? `This is not ${expected}. Check that you are at the right unit.` : 'Scan or type the tag on the equipment.'}
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={state !== 'match'}>
          Start checkpoint
        </Button>
      </div>
    </div>
  );
}

function InspectionRoundHistory() {
  const values = [...HISTORY].reverse().map((entry) => entry.value);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-base-foreground">Cooler outlet temperature, local gauge</span>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">23-HA-9114</span> · last 6 rounds · limit 40 °C
          </span>
        </div>
        <div className="w-28 shrink-0">
          <Sparkline values={values} label="Cooler outlet temperature, last 6 rounds" unit="°C" limit={40} tone="warning" height={32} showLast />
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {HISTORY.map((entry) => {
          const outside = !isWithinLimits(entry.value, 20, 40);
          return (
            <li key={entry.date} className="grid grid-cols-[4rem_minmax(0,1fr)_5rem_4.5rem] items-center gap-3 py-1.5">
              <span className="text-xs text-muted-foreground tabular-nums">{entry.date}</span>
              <span className="truncate text-xs text-muted-foreground">{entry.operator}</span>
              <ValueReadout size="xs" value={entry.value} unit="°C" decimals={1} tone={outside ? 'warning' : 'neutral'} className="justify-end" />
              <span className={`text-right text-xs ${outside ? 'font-medium text-warning-foreground-strong' : 'text-muted-foreground'}`}>{outside ? 'Outside' : 'Within'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function InspectionRoundSkipReason() {
  const id = useId();
  const [reason, setReason] = useState('permit');
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-base-foreground">Skip this checkpoint</span>
        <span className="text-xs text-muted-foreground">
          Recompressor casing drain valve · <span className="font-mono">23-KA-9103</span>
        </span>
      </div>
      <div className="flex flex-col">
        <Label htmlFor={`${id}-reason`}>Reason</Label>
        <Select items={SKIP_REASONS} value={reason} onValueChange={setReason}>
          <SelectTrigger id={`${id}-reason`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKIP_REASONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col">
        <Label htmlFor={`${id}-note`}>Note for the next round</Label>
        <Textarea id={`${id}-note`} rows={2} defaultValue="Area barricaded for the bearing inspection." />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button variant="secondary" size="sm">
          Skip checkpoint
        </Button>
      </div>
    </div>
  );
}

function InspectionRoundStepper() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-base-foreground">{ROUNDS[0].name}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{ROUNDS[0].id}</span> · 6 stops · {CHECKPOINTS.length} checkpoints
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {DONE} of {CHECKPOINTS.length} checked
        </span>
      </div>
      <StepList orientation="horizontal" label="Route progress, compression area round" steps={ROUTE_STOPS} />
    </div>
  );
}

function InspectionRoundSummary() {
  const rows: readonly { label: string; result: CheckpointResult }[] = [
    { label: 'Pass', result: 'pass' },
    { label: 'Fail', result: 'fail' },
    { label: 'Skipped', result: 'skip' },
    { label: 'Not checked', result: 'pending' },
  ];
  return (
    <div className="flex w-full max-w-56 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Findings this round</span>
        <ValueReadout value={2} tone="warning" />
      </div>
      <dl className="flex flex-col gap-2 border-t border-default pt-3">
        {rows.map((row) => (
          <div key={row.result} className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd>
              <ValueReadout size="xs" value={countResult(row.result)} tone={row.result === 'fail' ? 'critical' : 'neutral'} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function InspectionRoundRouteList() {
  return (
    <div className="w-full max-w-lg">
      <StepList label="Route, compression area round" steps={ROUTE_VERTICAL} />
    </div>
  );
}

function InspectionRoundFindingsList() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Findings</span>
        <span className="text-xs text-muted-foreground tabular-nums">{FINDINGS.length} open · 1 with a work order</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {FINDINGS.map((finding) => (
          <li key={finding.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 py-2">
            <SeverityBadge severity={finding.severity} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-base-foreground">{finding.title}</span>
              <span className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{finding.tag}</span> · {finding.id}
              </span>
            </div>
            <span className="text-right font-mono text-xs text-muted-foreground">{finding.workOrder ?? 'No work order'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InspectionRoundFinding() {
  const finding = FINDINGS[1];
  const [workOrder, setWorkOrder] = useState<string | null>(null);
  return (
    <Card className="w-full max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-base-foreground">{finding.title}</span>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">{finding.id}</span> · {finding.checkpoint}
          </span>
        </div>
        <SeverityBadge severity={finding.severity} />
      </div>
      <p className="text-sm text-base-foreground">{finding.description}</p>
      <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3">
        <PagePreview kind="photo" label="Photo of the local temperature gauge on the interstage cooler" caption="Photo 1" />
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Equipment</dt>
          <dd className="font-mono text-base-foreground">{finding.tag}</dd>
          <dt className="text-muted-foreground">Reading</dt>
          <dd className="text-base-foreground tabular-nums">41.5 °C · limit 40 °C</dd>
          <dt className="text-muted-foreground">Found by</dt>
          <dd className="text-base-foreground tabular-nums">Tomás Barros · 13:24</dd>
        </dl>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-default pt-4">
        {workOrder ? (
          <span className="flex items-center gap-2 text-sm text-base-foreground">
            <IconCheck aria-hidden className="size-4 text-success-foreground-strong" />
            Work order <span className="font-mono">{workOrder}</span> created
            <PriorityBadge priority="P3" />
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No work order yet. Related: WO-104471, tube bundle cleaning.</span>
        )}
        <Button size="sm" variant={workOrder ? 'ghost' : 'default'} onClick={() => setWorkOrder(workOrder ? null : 'WO-104491')}>
          {workOrder ? 'Undo' : 'Create work order'}
        </Button>
      </div>
    </Card>
  );
}

function InspectionRoundSignOff() {
  const [signers, setSigners] = useState(SIGNERS);
  const operatorSigned = signers[0].state === 'signed';
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-base-foreground">Sign off the round</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {DONE} of {CHECKPOINTS.length} checked · {countResult('fail')} failed · {countResult('skip')} skipped with a reason
        </span>
      </div>
      <SignOffBlock
        label="Sign-off, compression area round"
        signers={signers}
        currentSignerId="operator"
        onSign={(id) => setSigners((current) => current.map((signer) => (signer.id === id ? { ...signer, state: 'signed', at: '12 Mar, 14:26' } : signer)))}
      />
      <p className="text-xs text-muted-foreground">
        {operatorSigned ? 'Sent to the shift supervisor for countersignature.' : 'Four checkpoints are not checked. Signing now records them as not done.'}
      </p>
    </div>
  );
}

function InspectionRoundTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Round
            </th>
            <th scope="col" className={TH}>
              Operator
            </th>
            <th scope="col" className={TH}>
              State
            </th>
            <th scope="col" className={`${TH} w-40`}>
              Checkpoints
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Findings
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Due
            </th>
          </tr>
        </thead>
        <tbody>
          {ROUNDS.map((round) => (
            <tr key={round.id} className="border-t border-default">
              <td className={TD}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-base-foreground">{round.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{round.id}</span>
                </div>
              </td>
              <td className={TD}>
                {round.operator ? (
                  <span className="flex items-center gap-2 whitespace-nowrap text-base-foreground">
                    <PersonAvatar name={round.operator} sizes="xxsm" />
                    {round.operator}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </td>
              <td className={TD}>
                <StatusIndicator size="sm" {...ROUND_STATE[round.state]} detail={round.overdueBy} />
              </td>
              <td className={TD}>
                <div className="flex items-center gap-2">
                  <div role="img" aria-label={`${round.done} of ${round.total} checkpoints`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted-background">
                    <span className="block h-full rounded-full bg-chart-1-450" style={{ width: `${(round.done / round.total) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                    {round.done}/{round.total}
                  </span>
                </div>
              </td>
              <td className={`${TD} text-right tabular-nums ${round.findings > 0 ? 'font-medium text-base-foreground' : 'text-muted-foreground'}`}>{formatValue(round.findings)}</td>
              <td className={`${TD} text-right whitespace-nowrap text-muted-foreground tabular-nums`}>{round.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InspectionRoundTablet() {
  const id = useId();
  const [currentId, setCurrentId] = useState('c9');
  const [results, setResults] = useState<Record<string, CheckpointResult>>({});
  const current = CHECKPOINTS.find((checkpoint) => checkpoint.id === currentId) ?? CHECKPOINTS[8];
  const resultOf = (checkpoint: Checkpoint): CheckpointResult => results[checkpoint.id] ?? checkpoint.result;
  const done = CHECKPOINTS.filter((checkpoint) => resultOf(checkpoint) !== 'pending').length;
  const index = CHECKPOINTS.indexOf(current);
  return (
    <div className="mx-auto flex h-144 w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-default bg-base-background">
      <header className="flex items-center justify-between gap-4 border-b border-default px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-base-foreground">{ROUNDS[0].name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {done} of {CHECKPOINTS.length} checked · due 14:30
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-warning-foreground-strong">
          <IconCloudOff aria-hidden className="size-4" />
          Offline · saved on this device
        </span>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <nav aria-label="Checkpoints" className="min-h-0 overflow-y-auto border-r border-default p-2">
          <ul className="flex flex-col">
            {CHECKPOINTS.map((checkpoint, position) => (
              <li key={checkpoint.id}>
                <button
                  type="button"
                  aria-current={checkpoint.id === current.id ? 'step' : undefined}
                  onClick={() => setCurrentId(checkpoint.id)}
                  className={`w-full rounded-lg px-2 text-left hover:bg-muted-background focus-visible:shadow-focus-ring focus-visible:outline-none ${checkpoint.id === current.id ? 'bg-muted-background' : ''}`}
                >
                  <CheckpointRow index={position + 1} name={checkpoint.name} tag={checkpoint.tag} result={resultOf(checkpoint)} />
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section aria-label="Current checkpoint" className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground tabular-nums">
              Checkpoint {index + 1} of {CHECKPOINTS.length}
            </span>
            <h3 className="text-xl font-semibold text-base-foreground">{current.name}</h3>
            <span>
              <TagChip tag={current.tag} />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Look for leaks, loose insulation and unusual noise. Record the result, add a photo if anything is off.</p>
          <ResultButtons size="lg" value={resultOf(current)} onChange={(value) => setResults((state) => ({ ...state, [current.id]: value }))} />
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3">
            <button
              type="button"
              className="flex aspect-4/3 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-emphasized text-xs text-muted-foreground hover:bg-muted-background focus-visible:shadow-focus-ring focus-visible:outline-none"
            >
              <IconCamera aria-hidden className="size-5" />
              Add photo
            </button>
            <div className="flex flex-col">
              <Label htmlFor={id}>Note</Label>
              <Textarea id={id} rows={2} placeholder="Optional for a pass, required for a fail or skip" />
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-default pt-4">
            <Button variant="ghost" size="lg" disabled={index === 0} onClick={() => setCurrentId(CHECKPOINTS[index - 1].id)}>
              Previous
            </Button>
            <Button size="lg" disabled={index === CHECKPOINTS.length - 1} onClick={() => setCurrentId(CHECKPOINTS[index + 1].id)}>
              Next checkpoint
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default definePage({
  id: 'inspection-rounds',
  title: 'Inspection rounds',
  summary:
    'Operator rounds from the schedule to the sign-off: routes with checkpoints, the result and reading taken at each, findings that become work orders, and screens sized for a tablet in the field.',
  guidance: {
    use: [
      'Give every checkpoint one of four results in a marker and a word: pass, fail, skipped, not checked.',
      'Judge a reading against its limits as it is typed, and offer the next step when it is outside.',
      'Ask for a reason whenever a checkpoint is skipped.',
      'Say where data is stored when the device is offline, and when it will sync.',
    ],
    avoid: [
      'Small touch targets on field screens; use large buttons for the result.',
      'A finding with no route to a work order.',
      'Hiding unchecked checkpoints at sign-off; count them in the summary.',
      'Red for a round that is merely scheduled; keep critical for overdue.',
    ],
  },
  source,
  sections: [
    {
      id: 'rounds',
      title: 'Rounds',
      description: 'A round as a card, and the day’s rounds as a schedule.',
      specimens: [
        {
          id: 'InspectionRoundCard',
          title: 'Round card',
          note: 'Pick it for a round in progress: route, operator, checkpoints done of total, due time and findings.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: InspectionRoundCard,
        },
        {
          id: 'InspectionRoundCardOverdue',
          title: 'Round card, overdue',
          note: 'Pick the same card when the due time has passed: the state turns critical and says how late it is.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: InspectionRoundCardOverdue,
        },
        {
          id: 'InspectionRoundCardDone',
          title: 'Round card, completed',
          note: 'Pick it in the history: all checkpoints done, with the number of findings it produced.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: InspectionRoundCardDone,
        },
        {
          id: 'InspectionRoundSchedule',
          title: 'Round schedule',
          note: 'Pick it for today’s plan: each round with its size, who walks it, its state and when it is due.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundSchedule,
        },
        {
          id: 'InspectionRoundOverdue',
          title: 'Overdue rounds',
          note: 'Pick it for a supervisor: only what is late, longest first, with the action that moves it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundOverdue,
        },
      ],
    },
    {
      id: 'checkpoints',
      title: 'Checkpoints and readings',
      description: 'What happens at one stop: confirming the equipment, taking a reading, recording the result.',
      specimens: [
        {
          id: 'InspectionRoundCheckpointRow',
          title: 'Checkpoint rows',
          note: 'Pick it as the line for a checkpoint: pass, fail, skipped or not checked, with the reading and its limits.',
          origin: 'custom',
          uses: ['industrial/workflows/CheckpointRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundCheckpointRow,
        },
        {
          id: 'InspectionRoundReadingEntry',
          title: 'Reading entry with limits',
          note: 'Pick it to type a field reading: unit in the field, limits beneath, and a warning the moment it is outside. Change the value to try.',
          origin: 'custom',
          uses: ['forms/UnitNumberInput.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundReadingEntry,
        },
        {
          id: 'InspectionRoundResultControl',
          title: 'Pass, fail, skip',
          note: 'Pick it to record a result with one tap: three equal buttons, the chosen one filled.',
          origin: 'custom',
          align: 'stretch',
          Component: InspectionRoundResultControl,
        },
        {
          id: 'InspectionRoundOfflineSaved',
          title: 'Saved offline',
          note: 'Pick it when the device has no connection: say the data is safe on the device and what happens next.',
          origin: 'custom',
          align: 'stretch',
          Component: InspectionRoundOfflineSaved,
        },
        {
          id: 'InspectionRoundSyncStates',
          title: 'Sync states',
          note: 'Pick one of three lines for the header of a field screen: synced, syncing or saved on the device.',
          origin: 'custom',
          Component: InspectionRoundSyncStates,
        },
        {
          id: 'InspectionRoundChecklist',
          title: 'Checklist with photo and note',
          note: 'Pick it for visual checks at one stop: tick items, attach a photo, add a note.',
          origin: 'custom',
          uses: ['industrial/workflows/PagePreview.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundChecklist,
        },
        {
          id: 'InspectionRoundTagConfirm',
          title: 'Tag confirmation step',
          note: 'Pick it before a checkpoint opens: scan or type the tag, and block the step if it is the wrong unit. Edit the tag to try.',
          origin: 'custom',
          uses: ['industrial/workflows/TagChip.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundTagConfirm,
        },
        {
          id: 'InspectionRoundHistory',
          title: 'Checkpoint history',
          note: 'Pick it beside a reading: the last rounds as a sparkline and a list, so a slow drift is seen in the field.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundHistory,
        },
        {
          id: 'InspectionRoundSkipReason',
          title: 'Skip with a reason',
          note: 'Pick it when a checkpoint cannot be done: a reason from a short list and a note for the next round.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundSkipReason,
        },
      ],
    },
    {
      id: 'progress',
      title: 'Progress, findings and sign-off',
      description: 'Where the round stands, what it found, and how it is closed.',
      specimens: [
        {
          id: 'InspectionRoundStepper',
          title: 'Route progress stepper',
          note: 'Pick it across the top of a round: one step per stop, with done, current, and stops that had a skip.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: InspectionRoundStepper,
        },
        {
          id: 'InspectionRoundSummary',
          title: 'Round summary',
          note: 'Pick it at the end of a round: findings first, then the count of each result.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: InspectionRoundSummary,
        },
        {
          id: 'InspectionRoundRouteList',
          title: 'Route as a list',
          note: 'Pick it when stops need detail: each with its equipment, what was found there and when it was visited.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundRouteList,
        },
        {
          id: 'InspectionRoundFindingsList',
          title: 'Findings list',
          note: 'Pick it to review what rounds found: severity first, and whether a work order exists.',
          origin: 'custom',
          uses: ['industrial/operations/SeverityBadge.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundFindingsList,
        },
        {
          id: 'InspectionRoundFinding',
          title: 'Finding card',
          note: 'Pick it for one defect: severity, description, photo and context, with create work order as the next step. Click to try.',
          origin: 'custom',
          uses: ['industrial/operations/SeverityBadge.tsx', 'industrial/operations/PriorityBadge.tsx', 'industrial/workflows/PagePreview.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundFinding,
        },
        {
          id: 'InspectionRoundSignOff',
          title: 'Sign-off block',
          note: 'Pick it to close a round: the counts being signed for, then operator and supervisor. Click sign off to try.',
          origin: 'custom',
          uses: ['industrial/workflows/SignOffBlock.tsx'],
          size: 'md',
          align: 'stretch',
          Component: InspectionRoundSignOff,
        },
      ],
    },
    {
      id: 'screens',
      title: 'Tables and field screens',
      description: 'All rounds in one table, and a round as it looks on a tablet.',
      specimens: [
        {
          id: 'InspectionRoundTable',
          title: 'Operator-round table',
          note: 'Pick it as the register of rounds: operator, state, checkpoint progress, findings and due time.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: InspectionRoundTable,
        },
        {
          id: 'InspectionRoundTablet',
          title: 'Tablet round screen',
          note: 'Pick it as the field layout: checkpoints on the left, the current one on the right with large result buttons. Tap through to try.',
          origin: 'custom',
          uses: ['industrial/workflows/CheckpointRow.tsx', 'industrial/workflows/TagChip.tsx'],
          size: 'full',
          align: 'stretch',
          Component: InspectionRoundTablet,
        },
      ],
    },
  ],
});
