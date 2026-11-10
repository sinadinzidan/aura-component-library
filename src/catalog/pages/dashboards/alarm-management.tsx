import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { AlarmList } from '../../../library/industrial/operations/AlarmList';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue } from '../../../library/industrial/status';
import type { Severity, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, findAsset } from '../../data/plant';
import { HOUR, REFERENCE_NOW, createRandom, formatAgo, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './alarm-management.tsx?raw';

const ALARM_HOURS = 24;

const ALARM_WINDOW_START = REFERENCE_NOW - ALARM_HOURS * HOUR;

/** EEMUA 191 guidance for one operator, expressed per hour. */
const ALARM_ACCEPTABLE = 6;

const ALARM_MANAGEABLE = 12;

type AlarmFlood = { id: string; fromHour: number; toHour: number; cause: string };

/** Periods the alarm system was in flood. Hours are offsets into the 24-hour window, end exclusive. */
const ALARM_FLOODS: readonly AlarmFlood[] = [
  { id: 'changeover', fromHour: 5, toHour: 6, cause: 'Cooling water pump changeover' },
  { id: 'separator', fromHour: 12, toHour: 14, cause: 'Inlet separator level upset' },
  { id: 'trip', fromHour: 23, toHour: 24, cause: 'Recompressor trip' },
];

type AlarmActorSeed = {
  tag: string;
  text: string;
  assetId: string;
  severity: Severity;
  /** Typical annunciations per hour outside a flood. */
  weight: number;
  /** How many times the typical rate the tag reaches in each flood. */
  floods: Readonly<Record<string, number>>;
  seed: number;
  setting: string;
  finding: string;
  action: string;
  /** Re-triggers in the worst ten minutes, for tags that chatter. */
  chatter?: number;
};

const ALARM_ACTOR_SEEDS: readonly AlarmActorSeed[] = [
  { tag: '23-TT-92532', text: 'Discharge temperature high', assetId: '23-ka-9101', severity: 'high', weight: 1.1, floods: { trip: 6 }, seed: 101, setting: 'High 145.0 °C · deadband 0.5 °C · no delay', finding: 'The reading sits within 4 °C of the limit and crosses it on every load swing.', action: 'Widen the deadband to 2 °C and add a 30 s on-delay.', chatter: 14 },
  { tag: '23-VT-92540', text: 'Drive-end vibration approaching limit', assetId: '23-ka-9101', severity: 'high', weight: 0.8, floods: { trip: 5 }, seed: 102, setting: 'High 7.1 mm/s · deadband 0.1 mm/s · delay 5 s', finding: 'A pre-alarm with no defined operator response repeats while the bearing wears.', action: 'Replace with a rate-of-change alarm tied to the vibration survey.' },
  { tag: '20-LT-10012', text: 'Separator level deviation', assetId: '20-va-1001', severity: 'low', weight: 0.7, floods: { separator: 12 }, seed: 103, setting: 'Deviation ±15% · deadband 1% · no delay', finding: 'Slugging moves the level across the deviation band several times a minute.', action: 'Add a 60 s on-delay and suppress while the slug catcher is draining.', chatter: 11 },
  { tag: '23-TT-91141', text: 'Cooler outlet temperature high', assetId: '23-ha-9114', severity: 'medium', weight: 0.6, floods: { changeover: 14, trip: 3 }, seed: 104, setting: 'High 40.0 °C · deadband 0.5 °C · delay 10 s', finding: 'Fouled tubes keep the outlet close to the limit; every pump changeover trips it.', action: 'Clean the tube bundle (WO-104471), then review the limit.' },
  { tag: '40-TT-40015', text: 'Bearing temperature signal lost', assetId: '40-pa-4001', severity: 'medium', weight: 0.5, floods: { changeover: 18 }, seed: 105, setting: 'Bad quality · no deadband · no delay', finding: 'A failing transmitter drops in and out; the alarm is shelved between bursts.', action: 'Replace the transmitter (WO-104479) and remove the shelving.', chatter: 9 },
  { tag: '27-IT-20013', text: 'Motor current high', assetId: '27-pa-2001a', severity: 'medium', weight: 0.4, floods: { separator: 4 }, seed: 106, setting: 'High 95.0 A · deadband 1.0 A · delay 5 s', finding: 'Follows export flow during upsets; the operator cannot act on it separately.', action: 'Group under the export flow alarm during an inlet upset.' },
  { tag: '20-PT-10010', text: 'Separator pressure low', assetId: '20-va-1001', severity: 'high', weight: 0.3, floods: { separator: 9 }, seed: 107, setting: 'Low 11.0 barg · deadband 0.2 barg · delay 5 s', finding: 'Consequential to the level upset and annunciated alongside it.', action: 'Add first-out grouping with 20-LT-10012.' },
  { tag: '23-VT-92740', text: 'Recompressor vibration high', assetId: '23-ka-9103', severity: 'critical', weight: 0.2, floods: { trip: 14 }, seed: 108, setting: 'High-high 11.0 mm/s · deadband 0.2 mm/s · no delay', finding: 'Repeated around the trip as the machine ran down through its critical speed.', action: 'Latch after the first annunciation until the trip is reset.', chatter: 6 },
  { tag: '27-FT-20011', text: 'Export flow low', assetId: '27-pa-2001a', severity: 'medium', weight: 0.25, floods: { separator: 5, trip: 6 }, seed: 109, setting: 'Low 300 m³/h · deadband 5 m³/h · delay 10 s', finding: 'Expected consequence of any upstream upset; tells the operator nothing new.', action: 'Suppress for 10 minutes after an upstream trip.' },
  { tag: '23-PT-92530', text: 'Suction pressure low', assetId: '23-ka-9101', severity: 'medium', weight: 0.2, floods: { trip: 8 }, seed: 110, setting: 'Low 10.0 barg · deadband 0.2 barg · delay 5 s', finding: 'Annunciated after the recompressor trip while the train rebalanced.', action: 'Review the limit against the new minimum-flow line-up.' },
];

/** The thirty-odd tags that alarm now and then, counted together. */
const ALARM_OTHER_SEED: AlarmActorSeed = { tag: 'Other', text: 'All other tags', assetId: 'nk', severity: 'low', weight: 0.9, floods: { changeover: 6, separator: 3, trip: 4 }, seed: 199, setting: '', finding: '', action: '' };

function alarmFloodAt(hour: number): AlarmFlood | undefined {
  return ALARM_FLOODS.find((flood) => hour >= flood.fromHour && hour < flood.toHour);
}

/** Annunciations per hour for one tag: its typical rate, lifted during the floods it takes part in. */
function alarmHourly(actor: AlarmActorSeed): number[] {
  const random = createRandom(actor.seed);
  return Array.from({ length: ALARM_HOURS }, (_, hour) => {
    const flood = alarmFloodAt(hour);
    const lift = flood ? (actor.floods[flood.id] ?? 1) : 1;
    return Math.round(actor.weight * lift * (0.5 + random()));
  });
}

type AlarmActor = AlarmActorSeed & { hourly: readonly number[] };

const ALARM_ACTORS: readonly AlarmActor[] = ALARM_ACTOR_SEEDS.map((actor) => ({ ...actor, hourly: alarmHourly(actor) }));

const ALARM_OTHER: AlarmActor = { ...ALARM_OTHER_SEED, hourly: alarmHourly(ALARM_OTHER_SEED) };

const ALARM_RATE: readonly number[] = Array.from({ length: ALARM_HOURS }, (_, hour) =>
  [...ALARM_ACTORS, ALARM_OTHER].reduce((sum, actor) => sum + actor.hourly[hour], 0)
);

const ALARM_TOTAL = ALARM_RATE.reduce((sum, rate) => sum + rate, 0);

const ALARM_FLOOD_HOURS = ALARM_FLOODS.reduce((sum, flood) => sum + flood.toHour - flood.fromHour, 0);

const ALARM_CHART_ROWS = ALARM_RATE.map((rate, hour) => ({ category: formatTime(ALARM_WINDOW_START + hour * HOUR), rate, hour }));

const ALARM_OPEN = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const ALARM_SHELVED = ALARMS.filter((alarm) => alarm.state === 'shelved');

const ALARM_CHATTERING = ALARM_ACTORS.filter((actor) => actor.chatter !== undefined);

const ALARM_WARNING_BAR = 'var(--color-chart-warning-450)';

const ALARM_MUTED_BAR = 'var(--color-chart-neutral-300)';

const ALARM_FOCUS = 'focus-visible:shadow-focus-ring focus-visible:outline-none';

/** `all` is the whole 24-hour window; otherwise the id of a flood period. */
type AlarmPeriod = string;

function alarmPeriodHours(period: AlarmPeriod): readonly [number, number] {
  const flood = ALARM_FLOODS.find((candidate) => candidate.id === period);
  return flood ? [flood.fromHour, flood.toHour] : [0, ALARM_HOURS];
}

function alarmPeriodLabel(period: AlarmPeriod): string {
  const flood = ALARM_FLOODS.find((candidate) => candidate.id === period);
  if (!flood) return 'Last 24 hours';
  return `${formatTime(ALARM_WINDOW_START + flood.fromHour * HOUR)}–${formatTime(ALARM_WINDOW_START + flood.toHour * HOUR)}`;
}

function alarmCount(actor: AlarmActor, period: AlarmPeriod): number {
  const [from, to] = alarmPeriodHours(period);
  return actor.hourly.slice(from, to).reduce((sum, count) => sum + count, 0);
}

function alarmPeriodTotal(period: AlarmPeriod): number {
  const [from, to] = alarmPeriodHours(period);
  return ALARM_RATE.slice(from, to).reduce((sum, rate) => sum + rate, 0);
}

function alarmRanking(period: AlarmPeriod): AlarmActor[] {
  return [...ALARM_ACTORS].sort((a, b) => alarmCount(b, period) - alarmCount(a, period) || a.tag.localeCompare(b.tag));
}

function alarmShare(count: number, total: number): string {
  return total > 0 ? `${formatValue((count / total) * 100, 0)}%` : '0%';
}

function alarmRateJudgement(rate: number): { tone: Tone; label: string } {
  if (rate <= ALARM_ACCEPTABLE) return { tone: 'neutral', label: 'Acceptable' };
  if (rate <= ALARM_MANAGEABLE) return { tone: 'warning', label: 'Manageable' };
  return { tone: 'critical', label: 'Overloaded' };
}

function isHourRow(row: Record<string, unknown>): row is { hour: number; rate: number } {
  return typeof row.hour === 'number' && typeof row.rate === 'number';
}

function AlarmRatePanel({ period, onPeriodChange }: { period: AlarmPeriod; onPeriodChange: (period: AlarmPeriod) => void }) {
  const [from, to] = alarmPeriodHours(period);
  const overloaded = ALARM_RATE.filter((rate) => rate > ALARM_MANAGEABLE).length;
  const acceptable = ALARM_RATE.filter((rate) => rate <= ALARM_ACCEPTABLE).length;
  const periods = [{ id: 'all', cause: 'Every hour, floods included' }, ...ALARM_FLOODS];

  return (
    <DashboardPanel
      title="Alarm rate"
      description="Annunciated alarms per hour for one operator, against the EEMUA 191 bands"
      footnote={`${acceptable} of 24 hours were in the acceptable band and ${overloaded} were above manageable. All ${overloaded} fall inside the ${ALARM_FLOODS.length} flood periods.`}
    >
      <CategoryChart
        label={`Alarms per hour over the last 24 hours against the acceptable limit of ${ALARM_ACCEPTABLE} and the manageable limit of ${ALARM_MANAGEABLE}; ${overloaded} hours are above manageable`}
        rows={ALARM_CHART_ROWS}
        series={[{ key: 'rate', label: 'Alarms per hour' }]}
        references={[
          { value: ALARM_ACCEPTABLE, label: `Acceptable, up to ${ALARM_ACCEPTABLE}`, align: 'left' },
          { value: ALARM_MANAGEABLE, label: `Manageable, up to ${ALARM_MANAGEABLE}`, tone: 'warning', align: 'left' },
        ]}
        colorOf={(row) => {
          if (!isHourRow(row)) return undefined;
          if (row.hour < from || row.hour >= to) return ALARM_MUTED_BAR;
          return row.rate > ALARM_MANAGEABLE ? ALARM_WARNING_BAR : undefined;
        }}
        domain={[0, 30]}
        ticks={[0, 6, 12, 18, 24, 30]}
        labelEvery={3}
        heightClassName="h-80"
      />
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Flood periods</p>
        <div
          role="img"
          aria-label={`Flood periods across the 24 hours: ${ALARM_FLOODS.map((flood) => `${alarmPeriodLabel(flood.id)}, ${flood.cause}`).join('; ')}`}
          className="relative h-2.5 w-full overflow-hidden rounded-full bg-chart-neutral-100"
        >
          {ALARM_FLOODS.map((flood) => (
            <span
              key={flood.id}
              className={`absolute inset-y-0 ${period === 'all' || period === flood.id ? 'bg-chart-warning-450' : 'bg-chart-neutral-300'}`}
              style={{ left: `${(flood.fromHour / ALARM_HOURS) * 100}%`, width: `${((flood.toHour - flood.fromHour) / ALARM_HOURS) * 100}%` }}
            />
          ))}
        </div>
        <ul aria-label="Period shown" className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {periods.map((entry) => {
            const selected = entry.id === period;
            const [entryFrom, entryTo] = alarmPeriodHours(entry.id);
            const peak = Math.max(...ALARM_RATE.slice(entryFrom, entryTo));
            return (
              <li key={entry.id} className="flex">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onPeriodChange(entry.id)}
                  className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left ${ALARM_FOCUS} ${
                    selected ? 'border-emphasized bg-base-background' : 'border-default hover:bg-muted-background'
                  }`}
                >
                  <span className="text-sm font-medium tabular-nums text-base-foreground">{alarmPeriodLabel(entry.id)}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {alarmPeriodTotal(entry.id)} alarms · peak {peak} per hour
                  </span>
                  <span className="text-xs text-muted-foreground">{entry.cause}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardPanel>
  );
}

type AlarmFigure = { label: string; value: number; unit?: string; decimals: number; tone: Tone; judgement: string; target: string };

const ALARM_FIGURES: readonly AlarmFigure[] = [
  { label: 'Alarms per operator hour', value: ALARM_TOTAL / ALARM_HOURS, decimals: 1, ...judgementOf(ALARM_TOTAL / ALARM_HOURS), target: `Target ${ALARM_ACCEPTABLE} or fewer` },
  { label: 'Standing alarms', value: ALARM_OPEN.length, decimals: 0, tone: 'neutral', judgement: 'On target', target: 'Target under 10' },
  { label: 'Shelved alarms', value: ALARM_SHELVED.length, decimals: 0, tone: 'neutral', judgement: 'Reviewed this shift', target: 'Review due 18:00' },
  { label: 'Average time to acknowledge', value: 3.2, unit: 'min', decimals: 1, tone: 'neutral', judgement: 'On target', target: 'Target 5 min or less' },
  { label: 'Time in flood', value: (ALARM_FLOOD_HOURS / ALARM_HOURS) * 100, unit: '%', decimals: 0, tone: 'critical', judgement: 'Above target', target: 'Target under 1%' },
];

function judgementOf(rate: number): { tone: Tone; judgement: string } {
  const { tone, label } = alarmRateJudgement(rate);
  return { tone, judgement: label };
}

function AlarmFiguresPanel() {
  return (
    <DashboardPanel title="System performance" description="Last 24 hours, one operator">
      <dl className="flex w-full flex-col">
        {ALARM_FIGURES.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-1.5 border-b border-default py-3 first:pt-0 last:border-b-0 last:pb-0">
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd className="flex flex-col gap-1.5">
              <ValueReadout value={figure.value} unit={figure.unit} decimals={figure.decimals} size="md" tone={figure.tone} />
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusIndicator tone={figure.tone} label={figure.judgement} shape={figure.tone === 'neutral' ? 'ring' : 'diamond'} size="sm" />
                <span className="text-xs tabular-nums text-muted-foreground">{figure.target}</span>
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </DashboardPanel>
  );
}

const ALARM_SEVERITY_TONE: Record<Severity, Tone> = { critical: 'critical', high: 'warning', medium: 'info', low: 'neutral' };

const ALARM_SEVERITIES: readonly { id: Severity; label: string }[] = [
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

function AlarmSeverityPanel({ period }: { period: AlarmPeriod }) {
  const segments = ALARM_SEVERITIES.map((severity) => ({
    id: severity.id,
    label: severity.label,
    tone: ALARM_SEVERITY_TONE[severity.id],
    value: [...ALARM_ACTORS, ALARM_OTHER]
      .filter((actor) => actor.severity === severity.id)
      .reduce((sum, actor) => sum + alarmCount(actor, period), 0),
  }));
  return (
    <DashboardPanel
      title="Alarms by severity"
      description={alarmPeriodLabel(period)}
      footnote="Guidance is about 5% critical, 15% high and 80% medium or low."
    >
      <DistributionBar label={`Annunciated alarms by severity, ${alarmPeriodLabel(period)}`} segments={segments} />
    </DashboardPanel>
  );
}

function AlarmBadActorsPanel({ period, selectedTag, onSelect }: { period: AlarmPeriod; selectedTag: string; onSelect: (tag: string) => void }) {
  const total = alarmPeriodTotal(period);
  const ranking = alarmRanking(period);
  const top = ranking.reduce((sum, actor) => sum + alarmCount(actor, period), 0);
  return (
    <DashboardPanel
      title="Bad actors"
      description={`Top 10 tags by annunciations, ${alarmPeriodLabel(period).toLowerCase()} · select a row to inspect it`}
      footnote={`The ten tags account for ${alarmShare(top, total)} of the ${total} alarms in the period.`}
    >
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="w-8 pb-2 font-medium">
              #
            </th>
            <th scope="col" className="pb-2 pr-3 font-medium">
              Tag and alarm
            </th>
            <th scope="col" className="w-16 pb-2 text-right font-medium">
              Count
            </th>
            <th scope="col" className="w-16 pb-2 text-right font-medium">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((actor, index) => {
            const selected = actor.tag === selectedTag;
            const count = alarmCount(actor, period);
            return (
              <tr
                key={actor.tag}
                data-selected={selected ? 'true' : undefined}
                onClick={() => onSelect(actor.tag)}
                className={`cursor-pointer border-t border-default align-top ${selected ? 'bg-base-background' : 'hover:bg-muted-background'}`}
              >
                <td className="py-1.5 pl-1 tabular-nums text-muted-foreground">{index + 1}</td>
                <td className="py-1.5 pr-3">
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={`rounded-xs text-left font-mono text-xs ${ALARM_FOCUS} ${selected ? 'font-medium text-base-foreground' : 'text-medium-foreground'}`}
                  >
                    {actor.tag}
                  </button>
                  <p className="line-clamp-2 text-base-foreground">{actor.text}</p>
                </td>
                <td className="py-1.5 text-right tabular-nums text-base-foreground">{count}</td>
                <td className="py-1.5 pr-1 text-right tabular-nums text-muted-foreground">{alarmShare(count, total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

function AlarmInspectorPanel({ period, tag }: { period: AlarmPeriod; tag: string }) {
  const actor = ALARM_ACTORS.find((candidate) => candidate.tag === tag) ?? ALARM_ACTORS[0];
  const count = alarmCount(actor, period);
  const dayCount = alarmCount(actor, 'all');
  const peakHour = actor.hourly.indexOf(Math.max(...actor.hourly));
  const facts = [
    { label: 'In the period', value: `${count} of ${alarmPeriodTotal(period)} alarms · ${alarmShare(count, alarmPeriodTotal(period))}` },
    { label: 'Last 24 hours', value: `${dayCount} alarms · ${formatValue(dayCount / ALARM_HOURS, 1)} per hour` },
    { label: 'Busiest hour', value: `${formatTime(ALARM_WINDOW_START + peakHour * HOUR)} · ${actor.hourly[peakHour]} alarms` },
    { label: 'Setting', value: actor.setting },
  ];
  return (
    <DashboardPanel title="Alarm inspector" description="Follows the row selected in the table">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-sm text-base-foreground">{actor.tag}</span>
          <SeverityBadge severity={actor.severity} />
        </div>
        <p className="text-base font-medium text-base-foreground">{actor.text}</p>
        <p className="text-xs text-muted-foreground">{findAsset(actor.assetId)?.name}</p>
      </div>
      <Sparkline
        values={actor.hourly}
        label={`${actor.tag} annunciations per hour, last 24 hours`}
        variant="bar"
        height={56}
        decimals={0}
        className="w-full"
      />
      <dl className="flex w-full flex-col">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-0.5 border-t border-default py-2">
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="text-sm tabular-nums text-base-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1 border-t border-default pt-2">
        <p className="text-xs text-muted-foreground">Finding</p>
        <p className="text-sm text-base-foreground">{actor.finding}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">Recommended action</p>
        <p className="text-sm text-base-foreground">{actor.action}</p>
      </div>
    </DashboardPanel>
  );
}

function AlarmChatteringPanel({ selectedTag, onSelect }: { selectedTag: string; onSelect: (tag: string) => void }) {
  return (
    <DashboardPanel title="Chattering alarms" description="Three or more re-triggers inside ten minutes">
      <ul className="flex w-full flex-col gap-1">
        {ALARM_CHATTERING.map((actor) => {
          const selected = actor.tag === selectedTag;
          return (
            <li key={actor.tag}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(actor.tag)}
                className={`flex w-full items-start justify-between gap-3 rounded-lg border p-2 text-left ${ALARM_FOCUS} ${
                  selected ? 'border-emphasized bg-base-background' : 'border-transparent hover:bg-muted-background'
                }`}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm text-base-foreground">{actor.text}</span>
                  <span className="font-mono text-xs text-muted-foreground">{actor.tag}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-sm font-medium tabular-nums text-base-foreground">{actor.chatter}×</span>
                  <span className="text-xs text-muted-foreground">in 10 min</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </DashboardPanel>
  );
}

function AlarmOpenPanel() {
  return (
    <DashboardPanel title="Open alarms" description={`${ALARM_OPEN.length} standing now, most severe first`}>
      <AlarmList
        label="Open alarms"
        alarms={ALARM_OPEN}
        density="compact"
        formatAge={formatAgo}
        getAssetName={(alarm) => findAsset(alarm.assetId)?.name}
      />
    </DashboardPanel>
  );
}

/**
 * Archetype: chart-first — a hero chart with a narrow side rail, then a table with an inspector.
 * Dominant element: the alarm-rate chart with the EEMUA bands and the flood periods under it.
 * Interaction: choosing a flood period recolours the chart and re-ranks the bad actors and the
 * severity split for that period; selecting a table row (or a chattering alarm) loads the inspector.
 */
function AlarmDashboard() {
  const [period, setPeriod] = useState<AlarmPeriod>('all');
  const [tag, setTag] = useState(ALARM_ACTORS[0].tag);
  const average = ALARM_TOTAL / ALARM_HOURS;

  return (
    <DashboardFrame
      title="Alarm management"
      subtitle="Nordkapp control room · last 24 hours to 14:00 UTC"
      status={
        <StatusIndicator
          tone={alarmRateJudgement(average).tone}
          shape="square"
          label={alarmRateJudgement(average).label}
          detail={`${formatValue(average, 1)} alarms per hour`}
        />
      }
    >
      <DashboardGrid>
        <DashboardCell span={9}>
          <AlarmRatePanel period={period} onPeriodChange={setPeriod} />
        </DashboardCell>
        <DashboardCell span={3}>
          <AlarmFiguresPanel />
        </DashboardCell>
        <DashboardCell span={7}>
          <AlarmBadActorsPanel period={period} selectedTag={tag} onSelect={setTag} />
        </DashboardCell>
        <DashboardCell span={5}>
          <AlarmInspectorPanel period={period} tag={tag} />
        </DashboardCell>
        <DashboardCell span={4}>
          <AlarmChatteringPanel selectedTag={tag} onSelect={setTag} />
        </DashboardCell>
        <DashboardCell span={5}>
          <AlarmOpenPanel />
        </DashboardCell>
        <DashboardCell span={3}>
          <AlarmSeverityPanel period={period} />
        </DashboardCell>
      </DashboardGrid>
    </DashboardFrame>
  );
}

function AlarmMgmtSignature() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <AlarmDashboard />
    </ThemeScope>
  );
}

function AlarmMgmtAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <AlarmDashboard />
    </ThemeScope>
  );
}

function AlarmMgmtControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <AlarmDashboard />
    </ThemeScope>
  );
}

function AlarmMgmtAccessible() {
  return (
    <ThemeScope preset="accessible" className="w-full">
      <AlarmDashboard />
    </ThemeScope>
  );
}

function AlarmMgmtRate() {
  const [period, setPeriod] = useState<AlarmPeriod>('all');
  return <AlarmRatePanel period={period} onPeriodChange={setPeriod} />;
}

function AlarmMgmtFigures() {
  return <AlarmFiguresPanel />;
}

function AlarmMgmtBadActors() {
  const [tag, setTag] = useState(ALARM_ACTORS[0].tag);
  return <AlarmBadActorsPanel period="all" selectedTag={tag} onSelect={setTag} />;
}

function AlarmMgmtInspector() {
  return <AlarmInspectorPanel period="all" tag="20-LT-10012" />;
}

function AlarmMgmtSeverity() {
  return <AlarmSeverityPanel period="all" />;
}

function AlarmMgmtChattering() {
  const [tag, setTag] = useState(ALARM_CHATTERING[0].tag);
  return <AlarmChatteringPanel selectedTag={tag} onSelect={setTag} />;
}

function AlarmMgmtOpen() {
  return <AlarmOpenPanel />;
}

export default definePage({
  id: 'alarm-management',
  title: 'Alarm management',
  summary:
    'How the alarm system itself is performing, in the terms of EEMUA 191: the alarm rate an operator faces hour by hour, the flood periods, and the handful of tags that cause most of the load.',
  guidance: {
    use: [
      'For the weekly alarm review and for the engineer who owns alarm rationalisation.',
      'Lead with the rate chart: the bands say at a glance whether the load was acceptable.',
      'Let a flood period filter everything, so the ranking answers "what flooded us then".',
      'Pair the ranking with an inspector, so each bad actor comes with a setting and an action.',
    ],
    avoid: [
      'Using it as the operator’s live alarm list — it measures the system, it does not replace it.',
      'Counting alarms without the operator-hour denominator; totals alone cannot be judged.',
      'Colour on hours inside the bands; only hours above manageable are marked.',
      'A ranking longer than ten: the point is the few tags worth fixing first.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Nordic night theme: teal on tinted dark surfaces. The rate chart leads; pick a flood period under it, then a row in the ranking.',
      specimens: [
        {
          id: 'AlarmMgmtSignature',
          title: 'Alarm management',
          note: 'Pick it to review alarm system performance against EEMUA 191 and decide which tags to fix first.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/charts/CategoryChart.tsx',
            'industrial/operations/AlarmList.tsx',
            'industrial/operations/DistributionBar.tsx',
            'industrial/operations/SeverityBadge.tsx',
            'industrial/Sparkline.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: AlarmMgmtSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'AlarmMgmtAura',
          title: 'Aura',
          note: 'Pick it for the alarm review meeting, on a projector or in a report.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AlarmMgmtAura,
        },
        {
          id: 'AlarmMgmtControlRoom',
          title: 'Control room',
          note: 'Pick it when the review happens at the console: dark, compact and sharp.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AlarmMgmtControlRoom,
        },
        {
          id: 'AlarmMgmtAccessible',
          title: 'Accessible',
          note: 'Pick it for maximum legibility: high contrast and extra space around every figure.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: AlarmMgmtAccessible,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'AlarmMgmtRate',
          title: 'Alarm rate with flood periods',
          note: 'Pick it as the hero when a rate must be judged against bands and its worst periods picked out.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/charts/CategoryChart.tsx'],
          Component: AlarmMgmtRate,
        },
        {
          id: 'AlarmMgmtFigures',
          title: 'Supporting figures',
          note: 'Pick it for a narrow rail of figures that support a chart, each with its target in words.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: AlarmMgmtFigures,
        },
        {
          id: 'AlarmMgmtBadActors',
          title: 'Bad actors ranking',
          note: 'Pick it to rank the ten tags behind most of the load, with rows that select.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: AlarmMgmtBadActors,
        },
        {
          id: 'AlarmMgmtInspector',
          title: 'Alarm inspector',
          note: 'Pick it beside a ranking, so the selected tag shows its setting, pattern and next action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/Sparkline.tsx', 'industrial/operations/SeverityBadge.tsx'],
          Component: AlarmMgmtInspector,
        },
        {
          id: 'AlarmMgmtSeverity',
          title: 'Alarms by severity',
          note: 'Pick it to check the priority split against the recommended distribution.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/DistributionBar.tsx'],
          Component: AlarmMgmtSeverity,
        },
        {
          id: 'AlarmMgmtChattering',
          title: 'Chattering alarms',
          note: 'Pick it to list the tags that re-trigger within minutes, the cheapest ones to fix.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: AlarmMgmtChattering,
        },
        {
          id: 'AlarmMgmtOpen',
          title: 'Open alarms',
          note: 'Pick it to keep the alarms standing right now beside the statistics.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/AlarmList.tsx'],
          Component: AlarmMgmtOpen,
        },
      ],
    },
  ],
});
