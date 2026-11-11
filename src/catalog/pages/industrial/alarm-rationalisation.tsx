import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemDescription, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconArrowBackUp } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { SIGNAL_TYPES, SIGNAL_TYPE_LABEL, delayInSamples, suggestTuning } from '../../../library/industrial/safety/alarmTuning';
import type { SignalType } from '../../../library/industrial/safety/alarmTuning';
import {
  CONSEQUENCE_SEVERITIES,
  PRIORITY_TARGET,
  RESPONSE_CLASSES,
  RESPONSE_LABEL,
  SEVERITY_LABEL,
  alarmPriority,
  alarmPriorityStatus,
  isDistributionOnTarget,
  matrixCell,
  priorityDistribution,
  rationalise,
  responseClass,
} from '../../../library/industrial/safety/priorityMatrix';
import type { AlarmPriority, ConsequenceSeverity } from '../../../library/industrial/safety/priorityMatrix';
import { RATIONALISATION_COLUMNS } from '../../../library/industrial/safety/rationalisationColumns';
import { RationalisationRow } from '../../../library/industrial/safety/RationalisationRow';
import { compareSettings } from '../../../library/industrial/safety/replayAlarmCount';
import { formatDelta, formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import type { Condition } from '../../../library/industrial/workflows/ConditionList';
import { ConditionList } from '../../../library/industrial/workflows/ConditionList';
import type { StepListItem } from '../../../library/industrial/workflows/StepList';
import { StepList } from '../../../library/industrial/workflows/StepList';
import { MINUTE, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './alarm-rationalisation.tsx?raw';

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

type WorksheetEntry = {
  id: string;
  tag: string;
  alarmType: string;
  cause: string;
  consequence: string;
  severity: ConsequenceSeverity;
  action: string;
  minutes: number;
  current: AlarmPriority;
};

const WORKSHEET: readonly WorksheetEntry[] = [
  { id: 'w1', tag: '23-PT-92531', alarmType: 'High, 52 barg', cause: 'Blocked discharge or closed export valve', consequence: 'Relief valve lifts and gas is released to flare', severity: 'severe', action: 'Open the recycle valve and reduce compressor speed', minutes: 2, current: 'high' },
  { id: 'w2', tag: '23-TT-92532', alarmType: 'High, 145 °C', cause: 'Loss of cooling water to the interstage cooler', consequence: 'Compressor trips on high discharge temperature', severity: 'major', action: 'Start the standby cooling water pump', minutes: 8, current: 'high' },
  { id: 'w3', tag: '23-VT-92540', alarmType: 'High, 7.1 mm/s', cause: 'Bearing wear or rotor imbalance', consequence: 'Machine trip at 11 mm/s and a bearing replacement', severity: 'severe', action: 'Reduce load and call the rotating equipment engineer', minutes: 12, current: 'high' },
  { id: 'w4', tag: '20-PT-10010', alarmType: 'Low, 11 barg', cause: 'Well flow reduced upstream', consequence: 'Lower gas export for the shift', severity: 'major', action: 'Check the inlet choke settings', minutes: 15, current: 'medium' },
  { id: 'w5', tag: '20-LT-10012', alarmType: 'High, 70 %', cause: 'Liquid carry-over from the wells', consequence: 'Separator level drifts, no trip within the shift', severity: 'minor', action: 'Adjust the level controller setpoint', minutes: 45, current: 'low' },
  { id: 'w6', tag: '27-PA-2001B', alarmType: 'Standby test overdue', cause: 'Start test not done in 30 days', consequence: 'None until the pump is needed', severity: 'none', action: 'None. Raise a work order instead', minutes: 600, current: 'low' },
];

const CURRENT_COUNTS: Record<Exclude<AlarmPriority, 'none'>, number> = { low: 312, medium: 171, high: 97 };

function expand(counts: Record<Exclude<AlarmPriority, 'none'>, number>): AlarmPriority[] {
  return [...Array<AlarmPriority>(counts.low).fill('low'), ...Array<AlarmPriority>(counts.medium).fill('medium'), ...Array<AlarmPriority>(counts.high).fill('high')];
}

const PRIORITY_TONE = { low: 'info', medium: 'warning', high: 'critical' } as const;

type BadActor = { tag: string; text: string; activations: number; share: number; category: string; change: string };

const BAD_ACTORS: readonly BadActor[] = [
  { tag: '23-TT-91141', text: 'Cooler outlet temperature high', activations: 412, share: 11.4, category: 'Chattering', change: 'Add a 1 °C deadband and a 60 s on-delay' },
  { tag: '20-LT-10012', text: 'Separator level deviation', activations: 287, share: 7.9, category: 'Chattering', change: 'Widen the deviation limit from 5 % to 8 %' },
  { tag: '40-TT-40015', text: 'Bearing temperature signal lost', activations: 241, share: 6.7, category: 'Stale', change: 'Repair the transmitter, then raise on bad quality once' },
  { tag: '27-PA-2001B', text: 'Standby test overdue', activations: 198, share: 5.5, category: 'Standing', change: 'Remove the alarm and plan the test as a work order' },
  { tag: '23-PT-92530', text: 'Suction pressure low', activations: 164, share: 4.5, category: 'Duplicate', change: 'Remove: the same event raises 23-PT-92531' },
];

const NUISANCE = [
  { id: 'chattering', label: 'Chattering', count: 38, rule: 'Raised three or more times in 10 minutes' },
  { id: 'standing', label: 'Standing', count: 24, rule: 'Active for more than 24 hours' },
  { id: 'stale', label: 'Stale', count: 17, rule: 'Active but not acknowledged for 12 hours' },
  { id: 'duplicate', label: 'Duplicate', count: 9, rule: 'Raised together with another alarm within 1 minute' },
];

const CHATTER_VALUES = makeSeries({ seed: 91141, points: 240, base: 141.5, amplitude: 2.4, noise: 1.6, cycles: 5, stepMs: 10 * MINUTE, min: 130, max: 156, decimals: 1 });
const REPLAY_VALUES = CHATTER_VALUES.map((point) => point.v);

const PHILOSOPHY: readonly Condition[] = [
  { id: 'p1', label: 'Every alarm needs an operator action', detail: '1 alarm has none: 27-PA-2001B', state: 'unmet' },
  { id: 'p2', label: 'Every alarm has a consequence of no action', detail: 'All 6 worksheet alarms have one', state: 'met' },
  { id: 'p3', label: 'Priority follows the matrix, never a request', detail: '3 of 6 differ from the matrix result', state: 'unmet' },
  { id: 'p4', label: 'No alarm for an event the operator cannot influence', detail: 'Checked in the worksheet review', state: 'met' },
  { id: 'p5', label: 'Limits are set from the process, not the instrument range', detail: '2 limits still at the default', state: 'bypassed' },
];

const AGENDA = [
  { time: '09:00', item: 'Review of the last month: top 10 alarms and bad actors', who: 'Magnus Solberg', minutes: 20 },
  { time: '09:20', item: 'Rationalisation of the 1st stage compressor alarms', who: 'Aisha Khan', minutes: 40 },
  { time: '10:00', item: 'Proposed limit and deadband changes: replay results', who: 'Jonas Nyberg', minutes: 30 },
  { time: '10:30', item: 'Shelved and suppressed alarms: renew or remove', who: 'Liv Wold', minutes: 15 },
  { time: '10:45', item: 'Changes for approval and actions', who: 'Ingrid Haugen', minutes: 15 },
];

const SUPPRESSIONS = [
  { tag: '40-TT-40015', kind: 'Out of service', reason: 'Transmitter failed. WO-104479 replaces it', by: 'Jonas Nyberg', approved: 'Liv Wold', since: '12 Mar, 05:10', review: 'Review 13 Mar', overdue: false },
  { tag: '23-GD-9153', kind: 'Suppressed by design', reason: 'Inhibited for hot work PTW-26-0418', by: 'Tomás Barros', approved: 'Liv Wold', since: '12 Mar, 07:00', review: 'Ends 12 Mar, 19:00', overdue: false },
  { tag: '27-PA-2001B', kind: 'Shelved', reason: 'Standby test deferred to the shutdown', by: 'Ingrid Haugen', approved: 'Liv Wold', since: '4 Mar, 10:20', review: 'Overdue 6 d', overdue: true },
  { tag: '20-LT-10012', kind: 'Shelved', reason: 'Level instrument being recalibrated', by: 'Jonas Nyberg', approved: 'Magnus Solberg', since: '12 Mar, 09:00', review: 'Returns 12 Mar, 21:00', overdue: false },
];

const AUDIT = [
  { at: '12 Mar, 13:52', who: 'Aisha Khan', what: 'Changed priority of 23-VT-92540 from High to Medium', why: 'Matrix: severe consequence, 12 min to respond' },
  { at: '12 Mar, 13:31', who: 'Jonas Nyberg', what: 'Proposed limit for 23-TT-91141 from 40.0 to 42.0 °C', why: 'Replay: 74% fewer activations' },
  { at: '12 Mar, 11:05', who: 'Liv Wold', what: 'Approved shelving of 20-LT-10012 for 12 h', why: 'Instrument recalibration, WO-104440' },
  { at: '11 Mar, 16:40', who: 'Magnus Solberg', what: 'Removed alarm 23-PT-92530 (duplicate)', why: 'MoC-0214 approved' },
];

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function isSeverity(value: unknown): value is ConsequenceSeverity {
  return CONSEQUENCE_SEVERITIES.some((severity) => severity === value);
}

function isSignalType(value: unknown): value is SignalType {
  return SIGNAL_TYPES.some((type) => type === value);
}

const SEVERITY_ITEMS = CONSEQUENCE_SEVERITIES.map((severity) => ({ value: severity, label: SEVERITY_LABEL[severity] }));
const SIGNAL_ITEMS = SIGNAL_TYPES.map((type) => ({ value: type, label: SIGNAL_TYPE_LABEL[type] }));

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-base-foreground">{children}</dd>
    </div>
  );
}

function WorksheetTable({ rows }: { rows: readonly WorksheetEntry[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Alarm rationalisation worksheet" className="w-full min-w-224 border-collapse text-sm">
        <thead>
          <tr>
            {RATIONALISATION_COLUMNS.map((heading) => (
              <th key={heading} scope="col" className={TH}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RationalisationRow key={row.id} tag={row.tag} alarmType={row.alarmType} cause={row.cause} consequence={row.consequence} severity={row.severity} action={row.action} minutesToRespond={row.minutes} currentPriority={row.current} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlarmRationMasterRecord() {
  return (
    <Card role="group" aria-label="Alarm master record 23-TT-92532" className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-muted-foreground">23-TT-92532 · High</span>
          <h3 className="text-base font-semibold text-base-foreground">Discharge temperature high</h3>
        </div>
        <StatusIndicator variant="badge" {...alarmPriorityStatus('medium')} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Limit">
          <span className="tabular-nums">145.0 °C</span>
        </Field>
        <Field label="Time to respond">
          <span className="tabular-nums">8 min</span>
        </Field>
        <div className="col-span-2">
          <Field label="Consequence of no action">Compressor trips on high discharge temperature at 155 °C. About 6 hours of lost export.</Field>
        </div>
        <div className="col-span-2">
          <Field label="Operator action">Check cooling water flow and start the standby cooler fan.</Field>
        </div>
        <Field label="Owner">Aisha Khan</Field>
        <Field label="Last reviewed">
          <span className="tabular-nums">12 Mar 2026</span>
        </Field>
      </dl>
    </Card>
  );
}

function AlarmRationWorksheetRow() {
  const row = WORKSHEET[1];
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="One worksheet row" className="w-full min-w-224 border-collapse text-sm">
        <thead>
          <tr>
            {RATIONALISATION_COLUMNS.map((heading) => (
              <th key={heading} scope="col" className={TH}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <RationalisationRow tag={row.tag} alarmType={row.alarmType} cause={row.cause} consequence={row.consequence} severity={row.severity} action={row.action} minutesToRespond={row.minutes} currentPriority="medium" />
        </tbody>
      </table>
    </div>
  );
}

function PriorityMatrixGrid({ selected }: { selected?: { severity: ConsequenceSeverity; minutes: number } }) {
  const activeResponse = selected ? responseClass(selected.minutes) : null;
  return (
    <table aria-label="Priority matrix: consequence severity against time to respond" className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th scope="col" className={TH}>
            Time to respond
          </th>
          {CONSEQUENCE_SEVERITIES.map((severity) => (
            <th key={severity} scope="col" className={`${TH} text-center`}>
              {SEVERITY_LABEL[severity]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...RESPONSE_CLASSES].reverse().map((response) => (
          <tr key={response} className="border-t border-default">
            <th scope="row" className="px-3 py-2 text-left text-xs font-normal whitespace-nowrap text-medium-foreground">
              {RESPONSE_LABEL[response]}
            </th>
            {CONSEQUENCE_SEVERITIES.map((severity) => {
              const priority = matrixCell(severity, response);
              const hit = selected !== undefined && activeResponse === response && selected.severity === severity;
              return (
                <td key={severity} data-selected={hit} className={`px-2 py-1.5 text-center ${hit ? 'bg-muted-background outline-2 -outline-offset-2 outline-base-foreground' : ''}`}>
                  <StatusIndicator size="sm" {...alarmPriorityStatus(priority)} />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AlarmRationPriorityMatrix() {
  return (
    <Panel title="Priority matrix" meta="Example for this site">
      <PriorityMatrixGrid />
      <p className="text-xs text-muted-foreground">Priority follows from the consequence of no action and the time the operator has. It is never set by asking how important the alarm feels.</p>
    </Panel>
  );
}

function AlarmRationWorksheetLive() {
  const [severity, setSeverity] = useState<ConsequenceSeverity>('major');
  const [minutes, setMinutes] = useState('8');
  const parsed = Number(minutes);
  const valid = minutes.trim() !== '' && Number.isFinite(parsed) && parsed >= 0;
  const result = valid ? rationalise(severity, parsed) : null;
  return (
    <Panel title="Work out a priority" meta="Changes the result at once">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <Label htmlFor="alarm-ration-severity">Consequence of no action</Label>
          <Select items={SEVERITY_ITEMS} value={severity} onValueChange={(value) => (isSeverity(value) ? setSeverity(value) : undefined)}>
            <SelectTrigger id="alarm-ration-severity" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <Label htmlFor="alarm-ration-minutes">Time to respond, minutes</Label>
          <Input id="alarm-ration-minutes" inputMode="decimal" aria-invalid={!valid} value={minutes} onChange={(event) => setMinutes(event.target.value)} />
          {!valid ? <span className="pt-1 text-xs text-critical-foreground-strong">Enter a number of minutes, 0 or more.</span> : null}
        </div>
      </div>
      <div role="status" className="flex flex-col gap-1.5 border-t border-default pt-3">
        {result ? (
          <>
            <span className="flex items-center gap-3 text-sm text-medium-foreground">
              Resulting priority <StatusIndicator variant="badge" {...alarmPriorityStatus(result.priority)} />
            </span>
            <span className="text-xs text-muted-foreground">Time band: {RESPONSE_LABEL[result.response].toLowerCase()}</span>
            {result.finding ? <span className="text-xs text-base-foreground">{result.finding}</span> : null}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No priority until the time to respond is valid.</span>
        )}
      </div>
    </Panel>
  );
}

function AlarmRationWorksheetTable() {
  return <WorksheetTable rows={WORKSHEET} />;
}

function AlarmRationPriorityDistribution() {
  const shares = priorityDistribution(expand(CURRENT_COUNTS));
  return (
    <Panel title="Priority distribution" meta={`${shares.reduce((sum, entry) => sum + entry.count, 0)} configured alarms`}>
      <DistributionBar
        label="Configured alarms by priority"
        segments={shares.map((entry) => ({ id: entry.priority, label: alarmPriorityStatus(entry.priority).label, value: entry.count, tone: PRIORITY_TONE[entry.priority] }))}
      />
      <p className="text-xs text-muted-foreground">Target is about {PRIORITY_TARGET.low} / {PRIORITY_TARGET.medium} / {PRIORITY_TARGET.high} percent low, medium and high.</p>
    </Panel>
  );
}

function AlarmRationDistributionVsTarget() {
  const shares = priorityDistribution(expand(CURRENT_COUNTS));
  return (
    <Panel title="Distribution against target" meta={isDistributionOnTarget(shares) ? 'On target' : 'Off target'}>
      <table aria-label="Priority share against target" className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} pl-0`}>
              Priority
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Share
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Target
            </th>
            <th scope="col" className={`${TH} pr-0 text-right`}>
              Difference
            </th>
          </tr>
        </thead>
        <tbody>
          {shares.map((entry) => (
            <tr key={entry.priority} className="border-t border-default">
              <th scope="row" className={`${TD} pl-0 text-left font-normal`}>
                <StatusIndicator size="sm" {...alarmPriorityStatus(entry.priority)} />
              </th>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatValue(entry.share, 1)} %</td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{entry.target} %</td>
              <td className={`${TD} pr-0 text-right tabular-nums ${Math.abs(entry.delta) > 5 ? 'font-medium text-warning-foreground-strong' : 'text-medium-foreground'}`}>{formatDelta(entry.delta, 1)} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">Too many high-priority alarms means the priority no longer tells the operator what to do first.</p>
    </Panel>
  );
}

function AlarmRationBeforeAfter() {
  const rows = [
    { label: 'Alarms per operator per hour', before: 14.2, after: 5.6, target: '6 or fewer', decimals: 1 },
    { label: 'Peak alarms in 10 minutes', before: 38, after: 12, target: '10 or fewer', decimals: 0 },
    { label: 'Standing alarms', before: 24, after: 6, target: 'Fewer than 5', decimals: 0 },
    { label: 'Chattering alarms', before: 38, after: 9, target: 'None', decimals: 0 },
    { label: 'High-priority share, %', before: 16.7, after: 6.1, target: '5', decimals: 1 },
  ];
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Alarm system KPIs before and after rationalisation" className="w-full min-w-136 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Measure
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Before
            </th>
            <th scope="col" className={`${TH} text-right`}>
              After
            </th>
            <th scope="col" className={TH}>
              Change
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Target
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-default">
              <th scope="row" className={`${TD} text-left font-normal text-base-foreground`}>
                {row.label}
              </th>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(row.before, row.decimals)}</td>
              <td className={`${TD} text-right tabular-nums font-medium text-base-foreground`}>{formatValue(row.after, row.decimals)}</td>
              <td className={TD}>
                <TrendDelta value={row.after} reference={row.before} decimals={row.decimals} goodDirection="down" size="sm" />
              </td>
              <td className={`${TD} text-right text-xs text-muted-foreground`}>{row.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlarmRationDocumentation() {
  const fields = [
    { label: 'Consequence', done: 561 },
    { label: 'Operator action', done: 548 },
    { label: 'Time to respond', done: 502 },
    { label: 'Limit basis', done: 436 },
  ];
  const total = 580;
  return (
    <Panel title="Documentation completeness" meta={`${total} configured alarms`}>
      <div className="flex flex-col gap-3">
        {fields.map((field) => (
          <LinearGauge key={field.label} label={field.label} value={field.done} max={total} size="sm" showHeader={false} />
        ))}
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        {fields.map((field) => (
          <div key={field.label} className="flex justify-between gap-3">
            <dt className="text-medium-foreground">{field.label}</dt>
            <dd className="tabular-nums text-base-foreground">
              {formatValue((field.done / total) * 100)} % · {total - field.done} missing
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function AlarmRationNuisance() {
  const total = NUISANCE.reduce((sum, entry) => sum + entry.count, 0);
  return (
    <Panel title="Nuisance alarms" meta={`${total} flagged`}>
      <ul className="flex flex-col gap-3">
        {NUISANCE.map((entry) => (
          <li key={entry.id} className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm text-base-foreground">{entry.label}</span>
              <span className="text-xs text-muted-foreground">{entry.rule}</span>
            </div>
            <ValueReadout size="xs" value={entry.count} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function AlarmRationBadActors() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Bad actors with proposed change" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Alarm
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Activations, 30 d
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Share of all
            </th>
            <th scope="col" className={TH}>
              Category
            </th>
            <th scope="col" className={TH}>
              Proposed change
            </th>
          </tr>
        </thead>
        <tbody>
          {BAD_ACTORS.map((actor) => (
            <tr key={actor.tag} className="border-t border-default">
              <th scope="row" className={`${TD} text-left font-normal`}>
                <span className="font-mono text-xs text-base-foreground">{actor.tag}</span>
                <span className="block text-xs text-muted-foreground">{actor.text}</span>
              </th>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{actor.activations}</td>
              <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(actor.share, 1)} %</td>
              <td className={`${TD} text-medium-foreground`}>{actor.category}</td>
              <td className={`${TD} text-base-foreground`}>{actor.change}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlarmRationReplayTrend() {
  const [proposed, setProposed] = useState('144');
  const limit = Number(proposed);
  const comparison = compareSettings(REPLAY_VALUES, { limit: 141 }, { limit: Number.isFinite(limit) ? limit : 141 });
  return (
    <Card className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium text-base-foreground">Current against proposed limit</h3>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">23-TT-91141</span> replayed over the last 40 hours
          </span>
        </div>
        <div className="flex w-48 flex-col">
          <Label htmlFor="alarm-ration-proposed">Proposed limit</Label>
          <Select
            items={[141, 143, 144, 146, 148].map((value) => ({ value: String(value), label: `${value} °C` }))}
            value={proposed}
            onValueChange={(value) => (typeof value === 'string' ? setProposed(value) : undefined)}
          >
            <SelectTrigger id="alarm-ration-proposed" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[141, 143, 144, 146, 148].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} °C
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <TrendChart
        label={`Cooler outlet temperature replayed against a current limit of 141 °C and a proposed limit of ${proposed} °C. The current limit would have alarmed ${comparison.current.count} times, the proposal ${comparison.proposed.count} times.`}
        series={[{ key: 'temperature', label: 'Outlet temperature', points: CHATTER_VALUES.map((point) => ({ t: point.t, v: point.v })) }]}
        limits={[
          { value: 141, label: 'Current 141', tone: 'neutral', align: 'left' },
          { value: limit, label: `Proposed ${proposed}`, tone: 'warning', align: 'right' },
        ]}
        unit="°C"
        heightClassName="h-56"
        maxTicks={6}
      />
      <dl className="grid grid-cols-3 gap-4 border-t border-default pt-3">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Current limit would alarm</dt>
          <dd>
            <ValueReadout size="md" value={comparison.current.count} unit="times" />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Proposed limit would alarm</dt>
          <dd>
            <ValueReadout size="md" value={comparison.proposed.count} unit="times" />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Change</dt>
          <dd className="text-sm text-base-foreground tabular-nums">{comparison.reductionPercent === null ? 'No alarms to compare' : `${formatDelta(-comparison.reductionPercent)} % activations`}</dd>
        </div>
      </dl>
    </Card>
  );
}

function AlarmRationReplayTable() {
  const options = [
    { label: 'Current: limit 141 °C', settings: { limit: 141 } },
    { label: 'Limit 144 °C', settings: { limit: 144 } },
    { label: 'Limit 141 °C, 2 °C deadband', settings: { limit: 141, deadband: 2 } },
    { label: 'Limit 141 °C, deadband and 1 min delay', settings: { limit: 141, deadband: 2, onDelay: 6 } },
  ];
  const baseline = compareSettings(REPLAY_VALUES, options[0].settings, options[0].settings).current.count;
  return (
    <Panel title="Replay of 40 hours" meta="240 samples at 10 min">
      <table aria-label="Alarm activations by setting" className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${TH} pl-0`}>
              Setting
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Activations
            </th>
            <th scope="col" className={`${TH} pr-0 text-right`}>
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {options.map((option) => {
            const count = compareSettings(REPLAY_VALUES, option.settings, option.settings).current.count;
            return (
              <tr key={option.label} className="border-t border-default">
                <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                  {option.label}
                </th>
                <td className={`${TD} text-right tabular-nums text-base-foreground`}>{count}</td>
                <td className={`${TD} pr-0 text-right tabular-nums text-medium-foreground`}>{count === baseline ? 'Baseline' : `${formatDelta(count - baseline)}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function AlarmRationTuning() {
  const [type, setType] = useState<SignalType>('temperature');
  const span = type === 'temperature' ? 180 : type === 'pressure' ? 60 : type === 'flow' ? 250000 : 100;
  const unit = type === 'temperature' ? '°C' : type === 'pressure' ? 'barg' : type === 'flow' ? 'Sm³/h' : '%';
  const tuning = suggestTuning(type, span);
  return (
    <Panel title="Deadband and delay" meta="Starting points">
      <div className="flex flex-col">
        <Label htmlFor="alarm-ration-signal">Signal type</Label>
        <Select items={SIGNAL_ITEMS} value={type} onValueChange={(value) => (isSignalType(value) ? setType(value) : undefined)}>
          <SelectTrigger id="alarm-ration-signal" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIGNAL_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <dl role="status" className="grid grid-cols-3 gap-4 border-t border-default pt-3">
        <Field label="Instrument span">
          <span className="tabular-nums">
            {formatValue(span)} {unit}
          </span>
        </Field>
        <Field label="Deadband">
          <span className="tabular-nums">
            {formatValue(tuning.deadband, 1)} {unit} ({tuning.deadbandPercent} %)
          </span>
        </Field>
        <Field label="On and off delay">
          <span className="tabular-nums">
            {tuning.delaySeconds} s · {delayInSamples(tuning.delaySeconds, 10)} samples at 10 s
          </span>
        </Field>
      </dl>
      <p className="text-xs text-muted-foreground">Check the suggestion against the trend before it goes into a change request.</p>
    </Panel>
  );
}

const SHELVE_REASONS = [
  { value: 'instrument', label: 'Instrument fault, repair planned' },
  { value: 'maintenance', label: 'Equipment in maintenance' },
  { value: 'process', label: 'Known process condition' },
];

function AlarmRationShelving() {
  const [reason, setReason] = useState('instrument');
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<'draft' | 'requested' | 'approved' | 'rejected'>('draft');
  const steps: StepListItem[] = [
    { id: 'request', label: 'Requested by Jonas Nyberg', detail: stage === 'draft' ? 'Not sent' : '12 Mar, 13:58', state: stage === 'draft' ? 'pending' : 'done' },
    { id: 'approve', label: 'Approved by the shift supervisor', detail: stage === 'approved' ? 'Liv Wold · 12 Mar, 14:02' : stage === 'rejected' ? 'Rejected by Liv Wold' : 'Waiting', state: stage === 'approved' ? 'done' : stage === 'rejected' ? 'failed' : stage === 'requested' ? 'active' : 'pending' },
    { id: 'shelved', label: 'Shelved for 12 hours', detail: stage === 'approved' ? 'Returns 13 Mar, 02:00' : undefined, state: stage === 'approved' ? 'done' : 'pending' },
  ];
  return (
    <Panel title="Shelving request" meta={<span className="font-mono">40-TT-40015</span>}>
      <div className="flex flex-col">
        <Label htmlFor="alarm-ration-shelve-reason">Reason</Label>
        <Select items={SHELVE_REASONS} value={reason} onValueChange={(value) => (typeof value === 'string' ? setReason(value) : undefined)} disabled={stage !== 'draft'}>
          <SelectTrigger id="alarm-ration-shelve-reason" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHELVE_REASONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label htmlFor="alarm-ration-shelve-note" className="pt-3">
          What compensates while it is shelved
        </Label>
        <Textarea id="alarm-ration-shelve-note" rows={2} value={note} disabled={stage !== 'draft'} onChange={(event) => setNote(event.target.value)} placeholder="Operator checks the local gauge every hour" />
      </div>
      <StepList label="Shelving approval" steps={steps} showState />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
        <span className="text-xs text-muted-foreground">{stage === 'draft' && note.trim() === '' ? 'Say what compensates before you send the request.' : 'The requester cannot approve their own request.'}</span>
        <div className="flex gap-2">
          {stage === 'draft' ? (
            <Button size="sm" disabled={note.trim() === ''} onClick={() => setStage('requested')}>
              Request shelving
            </Button>
          ) : null}
          {stage === 'requested' ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setStage('rejected')}>
                Reject request
              </Button>
              <Button size="sm" onClick={() => setStage('approved')}>
                Approve shelving
              </Button>
            </>
          ) : null}
          {stage === 'approved' || stage === 'rejected' ? (
            <Button size="sm" variant="secondary" onClick={() => setStage('draft')}>
              Start a new request
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function AlarmRationSuppressionRegister() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Shelved, suppressed and out-of-service alarms" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Alarm
            </th>
            <th scope="col" className={TH}>
              Status
            </th>
            <th scope="col" className={TH}>
              Reason
            </th>
            <th scope="col" className={TH}>
              Requested and approved
            </th>
            <th scope="col" className={TH}>
              Review
            </th>
          </tr>
        </thead>
        <tbody>
          {SUPPRESSIONS.map((row) => (
            <tr key={row.tag} className="border-t border-default">
              <th scope="row" className={`${TD} text-left font-mono text-xs font-normal text-base-foreground`}>
                {row.tag}
              </th>
              <td className={`${TD} text-medium-foreground`}>{row.kind}</td>
              <td className={`${TD} text-base-foreground`}>{row.reason}</td>
              <td className={`${TD} text-xs text-muted-foreground tabular-nums`}>
                {row.by}, approved by {row.approved}
                <span className="block">{row.since}</span>
              </td>
              <td className={TD}>
                {row.overdue ? <StatusIndicator size="sm" tone="warning" shape="square" label={row.review} /> : <span className="text-xs text-medium-foreground tabular-nums">{row.review}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlarmRationMoc() {
  const steps: StepListItem[] = [
    { id: 'raise', label: 'Change raised', detail: 'Aisha Khan · 11 Mar', state: 'done' },
    { id: 'review', label: 'Technical review', detail: 'Replay shows 74% fewer activations', state: 'done' },
    { id: 'approve', label: 'Approval by the alarm review team', detail: 'Waiting for the meeting on 14 Mar', state: 'active' },
    { id: 'implement', label: 'Implemented in the control system', state: 'pending' },
    { id: 'verify', label: 'Verified after 7 days', state: 'pending' },
  ];
  return (
    <Panel title="Management of change" meta={<span className="font-mono">MoC-0217</span>}>
      <p className="text-sm text-base-foreground">
        Raise the limit of <span className="font-mono text-xs">23-TT-91141</span> from 40.0 to 42.0 °C.
      </p>
      <StepList label="Management of change status, MoC-0217" steps={steps} showState />
    </Panel>
  );
}

function AlarmRationPhilosophy() {
  return (
    <Panel title="Alarm philosophy rules" meta="Worksheet check">
      <ConditionList label="Alarm philosophy rules" conditions={PHILOSOPHY} stateLabels={{ met: 'Follows', unmet: 'Breaks rule', bypassed: 'Open' }} />
    </Panel>
  );
}

function AlarmRationAgenda() {
  return (
    <Panel title="Review meeting agenda" meta="14 Mar, 09:00 · 2 hours">
      <ol className="flex flex-col">
        {AGENDA.map((entry, index) => (
          <li key={entry.time} className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-x-3 py-2.5 ${index === 0 ? 'pt-0' : 'border-t border-default'}`}>
            <span className="text-xs tabular-nums text-muted-foreground">{entry.time}</span>
            <span className="flex flex-col">
              <span className="text-sm text-base-foreground">{entry.item}</span>
              <span className="text-xs text-muted-foreground">{entry.who}</span>
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">{entry.minutes} min</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

type BulkRow = { id: string; tag: string; text: string; priority: Exclude<AlarmPriority, 'none'> };

const BULK_ROWS: readonly BulkRow[] = [
  { id: 'b1', tag: '23-PT-92531', text: 'Discharge pressure high', priority: 'high' },
  { id: 'b2', tag: '23-TT-92532', text: 'Discharge temperature high', priority: 'high' },
  { id: 'b3', tag: '23-VT-92540', text: 'Drive-end vibration high', priority: 'high' },
  { id: 'b4', tag: '23-PT-92530', text: 'Suction pressure low', priority: 'medium' },
  { id: 'b5', tag: '23-ST-92501', text: 'Shaft speed high', priority: 'medium' },
  { id: 'b6', tag: '23-FT-92510', text: 'Gas flow low', priority: 'low' },
];

const PRIORITY_ITEMS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function isBulkPriority(value: unknown): value is BulkRow['priority'] {
  return value === 'low' || value === 'medium' || value === 'high';
}

function AlarmRationBulk() {
  const [rows, setRows] = useState<readonly BulkRow[]>(BULK_ROWS);
  const [history, setHistory] = useState<readonly (readonly BulkRow[])[]>([]);
  const [selected, setSelected] = useState<readonly string[]>(['b2', 'b3']);
  const [target, setTarget] = useState<BulkRow['priority']>('medium');
  const [message, setMessage] = useState('');
  const apply = () => {
    setHistory((current) => [...current, rows]);
    setRows((current) => current.map((row) => (selected.includes(row.id) ? { ...row, priority: target } : row)));
    setMessage(`Changed ${selected.length} ${selected.length === 1 ? 'alarm' : 'alarms'} to ${target} priority.`);
    setSelected([]);
  };
  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setRows(previous);
    setHistory((current) => current.slice(0, -1));
    setMessage('Undid the last change.');
  };
  const shares = priorityDistribution(rows.map((row) => row.priority));
  return (
    <Card className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium text-base-foreground">Bulk re-prioritise</h3>
          <span className="text-xs text-muted-foreground tabular-nums">{selected.length} selected of {rows.length}</span>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-40 flex-col">
            <Label htmlFor="alarm-ration-bulk-target">New priority</Label>
            <Select items={PRIORITY_ITEMS} value={target} onValueChange={(value) => (isBulkPriority(value) ? setTarget(value) : undefined)}>
              <SelectTrigger id="alarm-ration-bulk-target" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" disabled={selected.length === 0} onClick={apply}>
            Change priority
          </Button>
          <Button size="sm" variant="ghost" disabled={history.length === 0} onClick={undo}>
            <IconArrowBackUp aria-hidden="true" />
            Undo
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <CheckboxGroup aria-label="Alarms to change" className="gap-3">
          {rows.map((row) => (
            <CheckboxItem key={row.id}>
              <CheckboxItemControl checked={selected.includes(row.id)} onCheckedChange={(checked) => setSelected((current) => (checked ? [...current, row.id] : current.filter((id) => id !== row.id)))} />
              <CheckboxItemLabel>
                <span className="font-mono text-xs">{row.tag}</span> {row.text}
              </CheckboxItemLabel>
              <CheckboxItemDescription>Priority now: {alarmPriorityStatus(row.priority).label.toLowerCase()}</CheckboxItemDescription>
            </CheckboxItem>
          ))}
        </CheckboxGroup>
        <div className="flex flex-col gap-3">
          <span className="text-xs text-muted-foreground">After the change</span>
          {shares.map((entry) => (
            <div key={entry.priority} className="flex items-center justify-between gap-3 text-sm">
              <StatusIndicator size="sm" {...alarmPriorityStatus(entry.priority)} />
              <span className="tabular-nums text-base-foreground">
                {entry.count} · {formatValue(entry.share)} %
              </span>
            </div>
          ))}
          <p role="status" className="text-xs text-muted-foreground">
            {message || 'Select alarms and choose a priority. Changes stay in this review until approved.'}
          </p>
        </div>
      </div>
    </Card>
  );
}

function AlarmRationAuditTrail() {
  return (
    <Panel title="Audit trail" meta="Latest first">
      <ul className="flex flex-col">
        {AUDIT.map((entry, index) => (
          <li key={entry.at} className={`flex flex-col gap-0.5 py-3 ${index === 0 ? 'pt-0' : 'border-t border-default'}`}>
            <span className="text-sm text-base-foreground">{entry.what}</span>
            <span className="text-xs text-muted-foreground">{entry.why}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {entry.who} · {entry.at}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function AlarmRationWorkbench() {
  const [selectedId, setSelectedId] = useState('w2');
  const [severities, setSeverities] = useState<Record<string, ConsequenceSeverity>>({});
  const [times, setTimes] = useState<Record<string, number>>({});
  const entry = WORKSHEET.find((candidate) => candidate.id === selectedId) ?? WORKSHEET[0];
  const severity = severities[entry.id] ?? entry.severity;
  const minutes = times[entry.id] ?? entry.minutes;
  const result = rationalise(severity, minutes);
  const priorities = WORKSHEET.map((row) => alarmPriority(severities[row.id] ?? row.severity, times[row.id] ?? row.minutes));
  const shares = priorityDistribution(priorities);
  return (
    <Card className="w-full min-w-0 gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Rationalisation workbench</h3>
        <span className="text-xs text-muted-foreground">1st stage compressor 23-KA-9101 · {WORKSHEET.length} alarms</span>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <ul aria-label="Alarms in the review" className="flex flex-col">
          {WORKSHEET.map((row, index) => {
            const priority = priorities[index];
            const active = row.id === selectedId;
            return (
              <li key={row.id} className={index === 0 ? '' : 'border-t border-default'}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(row.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring-default ${active ? 'bg-muted-background' : 'hover:bg-muted-background'}`}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-xs text-base-foreground">{row.tag}</span>
                    <span className="truncate text-xs text-muted-foreground">{row.alarmType}</span>
                  </span>
                  <StatusIndicator size="sm" {...alarmPriorityStatus(priority)} />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs text-muted-foreground">{entry.tag}</span>
            <p className="text-sm text-base-foreground">Cause: {entry.cause}</p>
            <p className="text-sm text-base-foreground">Consequence: {entry.consequence}</p>
            <p className="text-sm text-base-foreground">Action: {entry.action}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col">
              <Label htmlFor="alarm-ration-wb-severity">Consequence severity</Label>
              <Select items={SEVERITY_ITEMS} value={severity} onValueChange={(value) => (isSeverity(value) ? setSeverities((current) => ({ ...current, [entry.id]: value })) : undefined)}>
                <SelectTrigger id="alarm-ration-wb-severity" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col">
              <Label htmlFor="alarm-ration-wb-time">Time to respond</Label>
              <Select
                items={[1, 5, 15, 45].map((value) => ({ value: String(value), label: `${value} min` }))}
                value={String(minutes)}
                onValueChange={(value) => (typeof value === 'string' ? setTimes((current) => ({ ...current, [entry.id]: Number(value) })) : undefined)}
              >
                <SelectTrigger id="alarm-ration-wb-time" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 5, 15, 45].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div role="status" className="flex flex-col gap-1.5 border-t border-default pt-3">
            <span className="flex items-center gap-3 text-sm text-medium-foreground">
              Resulting priority <StatusIndicator variant="badge" {...alarmPriorityStatus(result.priority)} />
            </span>
            {result.finding ? <span className="text-xs text-base-foreground">{result.finding}</span> : null}
            <span className="text-xs text-muted-foreground tabular-nums">
              Compressor alarms after this review: {shares.map((share) => `${share.count} ${share.priority}`).join(', ')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AlarmRationOverview() {
  const shares = priorityDistribution(expand(CURRENT_COUNTS));
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="min-w-0">
          <span className="text-xs text-muted-foreground">Alarms per operator per hour</span>
          <ValueReadout size="lg" value={5.6} decimals={1} />
          <TrendDelta value={5.6} reference={14.2} decimals={1} goodDirection="down" caption="since the review" />
        </Card>
        <Card className="min-w-0">
          <span className="text-xs text-muted-foreground">Reviewed alarms</span>
          <ValueReadout size="lg" value={412} unit="of 580" />
          <LinearGauge label="Reviewed alarms" value={412} max={580} size="sm" showHeader={false} />
        </Card>
        <Card className="min-w-0">
          <span className="text-xs text-muted-foreground">Changes waiting for approval</span>
          <ValueReadout size="lg" value={7} />
          <span className="text-xs text-muted-foreground">Next review meeting 14 Mar</span>
        </Card>
        <Card className="min-w-0">
          <span className="text-xs text-muted-foreground">Shelved past their review date</span>
          <ValueReadout size="lg" value={1} tone="warning" />
          <StatusIndicator size="sm" tone="warning" shape="square" label="27-PA-2001B, 6 days" />
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Priority distribution" meta="Target 80 / 15 / 5">
          <DistributionBar label="Configured alarms by priority" segments={shares.map((entry) => ({ id: entry.priority, label: alarmPriorityStatus(entry.priority).label, value: entry.count, tone: PRIORITY_TONE[entry.priority] }))} />
          <div className="w-full">
            <Alert variant="warning">
              <AlertTitle>High priority is {formatValue(shares[2].share, 1)} percent of alarms</AlertTitle>
              <AlertDescription>The target is 5 percent. Review the 97 high-priority alarms against the matrix before the next meeting.</AlertDescription>
            </Alert>
          </div>
        </Panel>
        <Panel title="Top bad actors" meta="Last 30 days">
          <ul className="flex flex-col gap-3">
            {BAD_ACTORS.slice(0, 4).map((actor) => (
              <li key={actor.tag} className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm text-base-foreground">
                    {actor.text} <span className="font-mono text-xs text-muted-foreground">{actor.tag}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{actor.change}</span>
                </div>
                <span className="text-xs tabular-nums text-medium-foreground">{actor.activations}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function AlarmRationMatrixLookup() {
  const [severity, setSeverity] = useState<ConsequenceSeverity>('major');
  const [response, setResponse] = useState('5');
  const minutes = Number(response);
  return (
    <Panel title="Where the alarm falls" meta="Cell outlined">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <Label htmlFor="alarm-ration-lookup-sev">Consequence</Label>
          <Select items={SEVERITY_ITEMS} value={severity} onValueChange={(value) => (isSeverity(value) ? setSeverity(value) : undefined)}>
            <SelectTrigger id="alarm-ration-lookup-sev" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <Label htmlFor="alarm-ration-lookup-time">Time to respond</Label>
          <Select items={[1, 5, 15, 45].map((value) => ({ value: String(value), label: `${value} min` }))} value={response} onValueChange={(value) => (typeof value === 'string' ? setResponse(value) : undefined)}>
            <SelectTrigger id="alarm-ration-lookup-time" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 5, 15, 45].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <PriorityMatrixGrid selected={{ severity, minutes }} />
    </Panel>
  );
}

export default definePage({
  id: 'alarm-rationalisation',
  title: 'Alarm rationalisation',
  summary:
    'The engineering side of alarms, in the manner of ISA-18.2 and EEMUA 191: documenting each alarm, working its priority out from consequence and time to respond, finding bad actors, testing a limit change against history and controlling shelving and change. Priority is computed from a matrix, never typed in.',
  guidance: {
    use: [
      'Record cause, consequence, operator action and time to respond for every alarm, then derive the priority.',
      'Replay recorded data against a proposed limit before it goes into a change request.',
      'Show current and resulting priority side by side, with the reason for each change.',
      'Give every shelved or suppressed alarm an owner, an approver and a review date.',
    ],
    avoid: [
      'Setting a priority because the alarm feels important.',
      'Keeping an alarm that has no operator action: make it an event or a work order.',
      'Fixing chattering by raising the limit alone; look at deadband and delay first.',
      'Hiding a change in a bulk edit with no undo and no audit entry.',
    ],
  },
  source,
  sections: [
    {
      id: 'record',
      title: 'Master record and priority',
      description: 'What is known about one alarm and how its priority follows from it.',
      specimens: [
        {
          id: 'AlarmRationMasterRecord',
          title: 'Alarm master record',
          note: 'Pick it for the record of one alarm: limit, consequence, operator action, response time and owner.',
          origin: 'custom',
          uses: ['industrial/safety/priorityMatrix.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationMasterRecord,
        },
        {
          id: 'AlarmRationPriorityMatrix',
          title: 'Priority matrix',
          note: 'Pick it as the reference that every priority in the worksheet is read from.',
          origin: 'custom',
          uses: ['industrial/safety/priorityMatrix.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationPriorityMatrix,
        },
        {
          id: 'AlarmRationWorksheetRow',
          title: 'Worksheet row',
          note: 'Pick it for one alarm in review: cause to consequence to action, with the priority worked out and compared with today.',
          origin: 'custom',
          uses: ['industrial/safety/RationalisationRow.tsx', 'industrial/safety/rationalisationColumns.ts'],
          size: 'full',
          align: 'stretch',
          Component: AlarmRationWorksheetRow,
        },
        {
          id: 'AlarmRationWorksheetLive',
          title: 'Priority calculator',
          note: 'Pick it to teach the matrix: change severity or time and see the priority and any finding.',
          origin: 'custom',
          uses: ['industrial/safety/priorityMatrix.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationWorksheetLive,
        },
        {
          id: 'AlarmRationMatrixLookup',
          title: 'Matrix with the cell outlined',
          note: 'Pick it to show where one alarm falls: choose the inputs and the cell is outlined.',
          origin: 'custom',
          uses: ['industrial/safety/priorityMatrix.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationMatrixLookup,
        },
        {
          id: 'AlarmRationWorksheetTable',
          title: 'Worksheet table',
          note: 'Pick it for a review session: every alarm of a unit, with the rows that change priority marked.',
          origin: 'custom',
          uses: ['industrial/safety/RationalisationRow.tsx', 'industrial/safety/rationalisationColumns.ts'],
          size: 'full',
          align: 'stretch',
          Component: AlarmRationWorksheetTable,
        },
      ],
    },
    {
      id: 'performance',
      title: 'Distribution and performance',
      description: 'How the alarm system measures against its targets.',
      specimens: [
        {
          id: 'AlarmRationPriorityDistribution',
          title: 'Priority distribution',
          note: 'Pick it for the shape of the system: how many alarms sit at each priority.',
          origin: 'custom',
          uses: ['industrial/operations/DistributionBar.tsx', 'industrial/safety/priorityMatrix.ts'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationPriorityDistribution,
        },
        {
          id: 'AlarmRationDistributionVsTarget',
          title: 'Distribution against target',
          note: 'Pick it to see how far each priority is from the 80 / 15 / 5 guideline.',
          origin: 'custom',
          uses: ['industrial/safety/priorityMatrix.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationDistributionVsTarget,
        },
        {
          id: 'AlarmRationDocumentation',
          title: 'Documentation completeness',
          note: 'Pick it to track the work: how many alarms have each field of their record filled in.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationDocumentation,
        },
        {
          id: 'AlarmRationNuisance',
          title: 'Nuisance categories',
          note: 'Pick it to see what kind of bad behaviour dominates: chattering, standing, stale or duplicate.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationNuisance,
        },
        {
          id: 'AlarmRationBeforeAfter',
          title: 'Before and after KPIs',
          note: 'Pick it to show what a rationalisation achieved against the targets.',
          origin: 'custom',
          uses: ['industrial/TrendDelta.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmRationBeforeAfter,
        },
        {
          id: 'AlarmRationBadActors',
          title: 'Bad-actor review list',
          note: 'Pick it to decide what to fix first: the loudest alarms with a proposed change each.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: AlarmRationBadActors,
        },
      ],
    },
    {
      id: 'limits',
      title: 'Limits, deadband and delay',
      description: 'Testing a change against recorded data before it is made.',
      specimens: [
        {
          id: 'AlarmRationReplayTrend',
          title: 'Current against proposed limit',
          note: 'Pick it to justify a limit change: the same history replayed against both limits, with the counts.',
          origin: 'custom',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/safety/replayAlarmCount.ts', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmRationReplayTrend,
        },
        {
          id: 'AlarmRationReplayTable',
          title: 'Replay of options',
          note: 'Pick it to compare limit, deadband and delay on one signal side by side.',
          origin: 'custom',
          uses: ['industrial/safety/replayAlarmCount.ts'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationReplayTable,
        },
        {
          id: 'AlarmRationTuning',
          title: 'Deadband and delay suggestion',
          note: 'Pick it as a starting point for a chattering alarm, by signal type.',
          origin: 'custom',
          uses: ['industrial/safety/alarmTuning.ts'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationTuning,
        },
      ],
    },
    {
      id: 'control',
      title: 'Shelving, change and records',
      description: 'The controls around changing what an operator sees.',
      specimens: [
        {
          id: 'AlarmRationShelving',
          title: 'Shelving request and approval',
          note: 'Pick it for temporary removal: a reason and a compensating measure, then approval by someone else.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationShelving,
        },
        {
          id: 'AlarmRationMoc',
          title: 'Management of change status',
          note: 'Pick it on an alarm that is being changed: where the change request stands.',
          origin: 'custom',
          uses: ['industrial/workflows/StepList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationMoc,
        },
        {
          id: 'AlarmRationSuppressionRegister',
          title: 'Suppression register',
          note: 'Pick it for audit: every shelved, suppressed or out-of-service alarm with who approved it and when it is reviewed.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmRationSuppressionRegister,
        },
        {
          id: 'AlarmRationPhilosophy',
          title: 'Alarm philosophy checklist',
          note: 'Pick it to check a worksheet against the site rules, each with the evidence.',
          origin: 'custom',
          uses: ['industrial/workflows/ConditionList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRationPhilosophy,
        },
        {
          id: 'AlarmRationAgenda',
          title: 'Review meeting agenda',
          note: 'Pick it to plan the alarm review: items in order, with an owner and a time each.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AlarmRationAgenda,
        },
        {
          id: 'AlarmRationAuditTrail',
          title: 'Audit trail',
          note: 'Pick it for the history of changes: what, why, who and when.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: AlarmRationAuditTrail,
        },
      ],
    },
    {
      id: 'tools',
      title: 'Working tools and overview',
      description: 'The panels used in a rationalisation session.',
      specimens: [
        {
          id: 'AlarmRationBulk',
          title: 'Bulk re-prioritise',
          note: 'Pick it to move many alarms at once, with the distribution after the change and an undo.',
          origin: 'custom',
          uses: ['industrial/safety/priorityMatrix.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmRationBulk,
        },
        {
          id: 'AlarmRationWorkbench',
          title: 'Rationalisation workbench',
          note: 'Pick it for the review itself: choose an alarm, set its consequence and time, and see the priority and the unit total.',
          origin: 'custom',
          uses: ['industrial/safety/priorityMatrix.ts', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmRationWorkbench,
        },
        {
          id: 'AlarmRationOverview',
          title: 'Alarm management overview',
          note: 'Pick it as the top of an alarm management dashboard: headline measures, distribution and bad actors.',
          origin: 'custom',
          uses: ['industrial/operations/DistributionBar.tsx', 'industrial/LinearGauge.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmRationOverview,
        },
      ],
    },
  ],
});
