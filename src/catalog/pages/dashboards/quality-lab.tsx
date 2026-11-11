import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
  IconDroplet,
  IconFlame,
  IconFlask,
  IconHourglass,
  IconRefresh,
  IconTestPipe,
  IconTruckDelivery,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { CapabilityHistogram } from '../../../library/kit/quality-lab/CapabilityHistogram';
import { ControlChart } from '../../../library/kit/quality-lab/ControlChart';
import {
  SPC_RULE_TEXT,
  capability,
  controlLimits,
  findViolations,
  sigmaDistance,
  type SpcCapability,
  type SpcLimits,
  type SpcViolation,
} from '../../../library/kit/quality-lab/spc';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { cx, formatNumber, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { HOUR, MINUTE, REFERENCE_NOW, createRandom, formatDate, formatDateTime, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './quality-lab.tsx?raw';

type QlProductId = 'gas' | 'condensate' | 'water';

type QlProduct = { id: QlProductId; name: string; point: string; tone: Tone; compliance: number };

const QL_PRODUCTS: Record<QlProductId, QlProduct> = {
  gas: { id: 'gas', name: 'Sales gas', point: '27-AP-2110', tone: 'blue', compliance: 98.6 },
  condensate: { id: 'condensate', name: 'Condensate', point: '20-AP-1140', tone: 'amber', compliance: 99.2 },
  water: { id: 'water', name: 'Produced water', point: '20-AP-1161', tone: 'teal', compliance: 96.8 },
};

const QL_BASELINE = 20;

/** Twenty in-control results around `base`, then the five most recent ones as recorded. */
function qlResults(seed: number, base: number, deviation: number, decimals: number, recent: readonly number[]): number[] {
  const random = createRandom(seed);
  const factor = 10 ** decimals;
  const baseline = Array.from({ length: QL_BASELINE }, () => Math.round((base + (random() + random() + random() - 1.5) * 2 * deviation) * factor) / factor);
  return [...baseline, ...recent];
}

type QlParameter = {
  id: string;
  name: string;
  short: string;
  product: QlProductId;
  method: string;
  unit: string;
  decimals: number;
  lsl?: number;
  usl?: number;
  /** Results in time order, two a day; the last is the newest. */
  values: readonly number[];
};

const QL_PARAMETERS: readonly QlParameter[] = [
  { id: 'wobbe', name: 'Wobbe index', short: 'Wobbe', product: 'gas', method: 'ISO 6976', unit: 'MJ/Sm³', decimals: 2, lsl: 48.3, usl: 52.8, values: qlResults(211, 50.6, 0.3, 2, [50.41, 50.9, 50.7, 50.52, 50.84]) },
  { id: 'h2s', name: 'Hydrogen sulphide', short: 'H₂S', product: 'gas', method: 'ASTM D4084', unit: 'ppm', decimals: 2, usl: 3.5, values: qlResults(223, 2.1, 0.25, 2, [2.52, 2.78, 2.66, 2.86, 3.92]) },
  { id: 'dew', name: 'Water dew point', short: 'Dew point', product: 'gas', method: 'ISO 6327', unit: '°C', decimals: 1, usl: -18, values: qlResults(227, -23.4, 0.8, 1, [-23.9, -22.6, -23.1, -23.6, -22.8]) },
  { id: 'rvp', name: 'Reid vapour pressure', short: 'Vapour pressure', product: 'condensate', method: 'ASTM D323', unit: 'kPa', decimals: 1, lsl: 60, usl: 82, values: qlResults(233, 72.5, 1.6, 1, [73, 71.8, 74.4, 72.9, 74.1]) },
  { id: 'density', name: 'Density at 15 °C', short: 'Density', product: 'condensate', method: 'ASTM D4052', unit: 'kg/m³', decimals: 1, lsl: 720, usl: 760, values: qlResults(239, 741, 2.5, 1, [742, 739.5, 741.8, 740.6, 743.2]) },
  { id: 'oiw', name: 'Oil in water', short: 'Oil in water', product: 'water', method: 'OSPAR GC-FID', unit: 'mg/L', decimals: 1, usl: 30, values: qlResults(241, 17.5, 2.2, 1, [20.4, 21.2, 20.1, 22.3, 24.6]) },
  { id: 'ph', name: 'pH', short: 'pH', product: 'water', method: 'ISO 10523', unit: '', decimals: 2, lsl: 6, usl: 8.5, values: qlResults(251, 7.2, 0.15, 2, [7.25, 7.1, 7.3, 7.18, 7.31]) },
];

type QlStage = 'taken' | 'received' | 'analysed' | 'approved';

type QlSample = {
  id: string;
  product: QlProductId;
  stage: QlStage;
  /** How many results back this sample sits in each parameter's history; 0 is the newest. */
  offset: number;
  takenAt: number;
  takenBy: string;
  analyst: string;
};

const QL_SAMPLES: readonly QlSample[] = [
  { id: 'S-260312-16', product: 'gas', stage: 'taken', offset: 0, takenAt: REFERENCE_NOW - 10 * MINUTE, takenBy: 'Tomás Barros', analyst: 'Aisha Khan' },
  { id: 'S-260312-15', product: 'water', stage: 'received', offset: 0, takenAt: REFERENCE_NOW - 25 * MINUTE, takenBy: 'Jonas Nyberg', analyst: 'Aisha Khan' },
  { id: 'S-260312-14', product: 'gas', stage: 'analysed', offset: 0, takenAt: REFERENCE_NOW - 95 * MINUTE, takenBy: 'Tomás Barros', analyst: 'Aisha Khan' },
  { id: 'S-260312-13', product: 'condensate', stage: 'analysed', offset: 0, takenAt: REFERENCE_NOW - 130 * MINUTE, takenBy: 'Jonas Nyberg', analyst: 'Magnus Solberg' },
  { id: 'S-260312-12', product: 'water', stage: 'analysed', offset: 0, takenAt: REFERENCE_NOW - 185 * MINUTE, takenBy: 'Jonas Nyberg', analyst: 'Aisha Khan' },
  { id: 'S-260312-11', product: 'gas', stage: 'approved', offset: 1, takenAt: REFERENCE_NOW - 470 * MINUTE, takenBy: 'Tomás Barros', analyst: 'Magnus Solberg' },
  { id: 'S-260312-10', product: 'condensate', stage: 'approved', offset: 1, takenAt: REFERENCE_NOW - 500 * MINUTE, takenBy: 'Jonas Nyberg', analyst: 'Magnus Solberg' },
];

const QL_STAGES: readonly { id: QlStage; label: string; minutes: number }[] = [
  { id: 'taken', label: 'Taken', minutes: 0 },
  { id: 'received', label: 'Received', minutes: 22 },
  { id: 'analysed', label: 'Analysed', minutes: 66 },
  { id: 'approved', label: 'Approved', minutes: 84 },
];

type QlReading = {
  parameter: QlParameter;
  /** Results up to and including this sample. */
  series: readonly number[];
  labels: readonly string[];
  /** When each result was taken, for the run-rule list. */
  stamps: readonly string[];
  /** `null` until the sample is analysed. */
  result: number | null;
  limits: SpcLimits;
  violations: readonly SpcViolation[];
  capability: SpcCapability;
  state: 'pending' | 'in-spec' | 'run-rule' | 'out-of-spec';
};

function qlParametersOf(product: QlProductId): QlParameter[] {
  return QL_PARAMETERS.filter((parameter) => parameter.product === product);
}

function qlRead(sample: QlSample, parameter: QlParameter): QlReading {
  const series = parameter.values.slice(0, parameter.values.length - sample.offset);
  const times = series.map((_, index) => REFERENCE_NOW - 2 * HOUR - (series.length - 1 - index + sample.offset) * 12 * HOUR);
  const labels = times.map((time) => formatDate(time));
  const limits = controlLimits(parameter.values.slice(0, QL_BASELINE));
  const violations = findViolations(series, limits);
  const analysed = sample.stage === 'analysed' || sample.stage === 'approved';
  const result = analysed ? (series[series.length - 1] ?? null) : null;
  const outside = result !== null && ((parameter.usl !== undefined && result > parameter.usl) || (parameter.lsl !== undefined && result < parameter.lsl));
  const flagged = violations.some((violation) => violation.index === series.length - 1);
  return {
    parameter,
    series,
    labels,
    stamps: times.map((time) => formatDateTime(time)),
    result,
    limits,
    violations,
    capability: capability(limits, { lsl: parameter.lsl, usl: parameter.usl }),
    state: result === null ? 'pending' : outside ? 'out-of-spec' : flagged ? 'run-rule' : 'in-spec',
  };
}

const QL_STATE_TONE: Record<QlReading['state'], Tone> = { pending: 'neutral', 'in-spec': 'success', 'run-rule': 'warning', 'out-of-spec': 'critical' };

const QL_STATE_LABEL: Record<QlReading['state'], string> = {
  pending: 'Awaiting result',
  'in-spec': 'In specification',
  'run-rule': 'Run rule broken',
  'out-of-spec': 'Out of specification',
};

type QlDecision = 'released' | 'retest';

type QlVerdict = { label: string; tone: Tone; icon: ReactNode; open: boolean };

/** What the queue says about a sample: the worst of its readings, or where it is on its way. */
function qlVerdict(sample: QlSample, decision: QlDecision | undefined): QlVerdict {
  if (decision === 'released' || sample.stage === 'approved') return { label: 'Approved', tone: 'success', icon: <IconCircleCheck />, open: false };
  if (decision === 'retest') return { label: 'Retest requested', tone: 'info', icon: <IconRefresh />, open: true };
  if (sample.stage === 'taken') return { label: 'In transit', tone: 'neutral', icon: <IconTruckDelivery />, open: true };
  if (sample.stage === 'received') return { label: 'In analysis', tone: 'neutral', icon: <IconHourglass />, open: true };
  const states = qlParametersOf(sample.product).map((parameter) => qlRead(sample, parameter).state);
  if (states.includes('out-of-spec')) return { label: 'Held, out of spec', tone: 'critical', icon: <IconAlertOctagon />, open: true };
  if (states.includes('run-rule')) return { label: 'Review, run rule', tone: 'warning', icon: <IconAlertTriangle />, open: true };
  return { label: 'Awaiting approval', tone: 'info', icon: <IconHourglass />, open: true };
}

function QlProductIcon({ product }: { product: QlProductId }) {
  if (product === 'gas') return <IconFlame />;
  if (product === 'condensate') return <IconTestPipe />;
  return <IconDroplet />;
}

const qlFigure = (reading: QlReading, value: number): string => `${formatNumber(value, reading.parameter.decimals)}${reading.parameter.unit ? ` ${reading.parameter.unit}` : ''}`;

/** The header sentence: the result against its specification and against the process. */
function qlSentence(reading: QlReading): ReactNode {
  const { parameter, result, limits } = reading;
  if (result === null) {
    return <>No result yet. The chart shows the process up to the previous sample, so the new result can be judged the moment it lands.</>;
  }
  const sigma = sigmaDistance(result, limits);
  const side = sigma >= 0 ? 'above' : 'below';
  const figure = <strong className="font-semibold text-base-foreground">{qlFigure(reading, result)}</strong>;
  const process = `${formatNumber(Math.abs(sigma), 1)} sigma ${side} the centre line`;
  if (parameter.usl !== undefined && result > parameter.usl) {
    return (
      <>
        Result {figure} is {formatNumber(result - parameter.usl, parameter.decimals)} above the upper specification of {formatNumber(parameter.usl, parameter.decimals)}, and {process}.
      </>
    );
  }
  if (parameter.lsl !== undefined && result < parameter.lsl) {
    return (
      <>
        Result {figure} is {formatNumber(parameter.lsl - result, parameter.decimals)} below the lower specification of {formatNumber(parameter.lsl, parameter.decimals)}, and {process}.
      </>
    );
  }
  const room = parameter.usl !== undefined ? `${formatNumber(parameter.usl - result, parameter.decimals)} under the upper specification` : 'inside the specification';
  return (
    <>
      Result {figure} is {room} and {process}.
    </>
  );
}

function QlQueue({
  samples,
  selected,
  decisions,
  onSelect,
}: {
  samples: readonly QlSample[];
  selected: string;
  decisions: Readonly<Record<string, QlDecision>>;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {samples.map((sample) => {
        const product = QL_PRODUCTS[sample.product];
        const verdict = qlVerdict(sample, decisions[sample.id]);
        const active = sample.id === selected;
        return (
          <li key={sample.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(sample.id)}
              className={cx(
                'relative flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:[box-shadow:var(--shadow-focus-ring)]',
                active
                  ? 'border-[var(--kit-accent)] bg-[color-mix(in_oklab,var(--kit-accent)_8%,var(--kit-surface))] shadow-sm'
                  : 'border-transparent hover:bg-[var(--kit-well)]'
              )}
            >
              <IconChip tone={product.tone} size="sm">
                <QlProductIcon product={sample.product} />
              </IconChip>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-base-foreground">{product.name}</span>
                  <span className="text-xs text-medium-foreground tabular-nums">{formatTime(sample.takenAt)}</span>
                </span>
                <span className="text-xs text-medium-foreground">
                  <TagId>{sample.id}</TagId> · {sample.takenBy}
                </span>
                <StatusPill tone={verdict.tone} icon={verdict.icon} className="self-start">
                  {verdict.label}
                </StatusPill>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function QlCompliance() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-medium-foreground">Results in specification, last 30 days</p>
      {Object.values(QL_PRODUCTS).map((product) => (
        <Meter key={product.id} label={product.name} value={product.compliance} min={90} max={100} unit="%" decimals={1} target={{ value: 98, label: 'Target' }} tone={product.compliance < 98 ? 'warning' : 'success'} hideScale />
      ))}
    </div>
  );
}

function QlCustody({ sample, decision, vertical = false }: { sample: QlSample; decision: QlDecision | undefined; vertical?: boolean }) {
  const reached = decision === 'released' ? 3 : QL_STAGES.findIndex((stage) => stage.id === sample.stage);
  const held = reached === 2 && qlVerdict(sample, decision).tone === 'critical';
  return (
    <ol className={vertical ? 'flex flex-col gap-2.5' : 'flex items-stretch'}>
      {QL_STAGES.map((stage, index) => {
        const done = index <= reached;
        const blocked = held && index === 3;
        const mark = (
          <span
            className={cx(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold [&>svg]:size-3.5',
              done ? 'bg-[var(--kit-accent)] text-[var(--kit-on-accent)]' : blocked ? 'bg-critical-background text-critical-foreground' : 'bg-[var(--kit-track)] text-medium-foreground'
            )}
          >
            {done ? <IconCheck aria-hidden="true" /> : index + 1}
          </span>
        );
        const time = done ? formatTime(sample.takenAt + stage.minutes * MINUTE) : blocked ? 'On hold' : 'Pending';
        if (vertical) {
          return (
            <li key={stage.id} className="flex items-center gap-3 text-sm">
              {mark}
              <span className={cx('flex-1 font-medium', done || blocked ? 'text-base-foreground' : 'text-medium-foreground')}>{stage.label}</span>
              <span className={cx('tabular-nums', blocked ? 'font-semibold text-critical-foreground-strong' : 'text-medium-foreground')}>{time}</span>
            </li>
          );
        }
        return (
          <li key={stage.id} className="flex flex-1 flex-col gap-2">
            <span className="flex items-center">
              {mark}
              {index < QL_STAGES.length - 1 ? <span className={cx('mx-2 h-0.5 flex-1 rounded-full', index < reached ? 'bg-[var(--kit-accent)]' : 'bg-[var(--kit-track)]')} /> : null}
            </span>
            <span className="pr-3">
              <span className="block text-sm font-medium text-base-foreground">{stage.label}</span>
              <span className="block text-xs text-medium-foreground tabular-nums">{time}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function QlParameterTabs({ sample, selected, onSelect }: { sample: QlSample; selected: string; onSelect: (id: string) => void }) {
  return (
    <div role="tablist" aria-label="Parameter" className="flex gap-2">
      {qlParametersOf(sample.product).map((parameter) => {
        const reading = qlRead(sample, parameter);
        const active = parameter.id === selected;
        return (
          <button
            key={parameter.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-tone={QL_STATE_TONE[reading.state]}
            onClick={() => onSelect(parameter.id)}
            className={cx(
              'flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left outline-none transition-colors focus-visible:[box-shadow:var(--shadow-focus-ring)]',
              active ? 'border-[var(--kit-accent)] bg-[var(--kit-surface)] shadow-sm' : 'border-[var(--kit-rule)] bg-transparent hover:bg-[var(--kit-surface)]'
            )}
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-base-foreground">{parameter.short}</span>
              <span className="block text-xs text-medium-foreground">{parameter.method}</span>
            </span>
            <span className={cx('text-lg font-semibold tabular-nums', reading.state === 'in-spec' || reading.state === 'pending' ? 'text-base-foreground' : 'text-[var(--t-ink)]')}>
              {reading.result === null ? '—' : formatNumber(reading.result, parameter.decimals)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const QL_LEGEND = [
  { label: 'Result', tone: 'accent', mark: 'line' },
  { label: 'Control limit', tone: 'critical', mark: 'dashed' },
  { label: 'Rule broken', tone: 'critical' },
  { label: 'Zone C', tone: 'success' },
  { label: 'Zones A, B', tone: 'warning' },
] as const;

function QlChartPanel({ reading, height = 256, zones = true, actions }: { reading: QlReading; height?: number; zones?: boolean; actions?: ReactNode }) {
  const { parameter } = reading;
  return (
    <Panel
      className="h-auto shrink-0"
      title={`${parameter.name} control chart`}
      subtitle={`Individual results, two a day. Limits from the ${QL_BASELINE} results before the last five.`}
      actions={actions}
      footer={<Legend items={QL_LEGEND} />}
    >
      <ControlChart
        label={`${parameter.name}: the last ${reading.series.length} results against the control limits and the specification`}
        values={reading.series}
        labels={reading.labels}
        limits={reading.limits}
        spec={{ lsl: parameter.lsl, usl: parameter.usl }}
        violations={reading.violations}
        unit={parameter.unit}
        decimals={parameter.decimals}
        zones={zones}
        height={height}
      />
    </Panel>
  );
}

const QL_CAPABILITY_TONE: Record<SpcCapability['verdict'], Tone> = { capable: 'success', marginal: 'warning', incapable: 'critical' };

const QL_CAPABILITY_LABEL: Record<SpcCapability['verdict'], string> = { capable: 'Capable', marginal: 'Marginal', incapable: 'Not capable' };

function QlCapabilityPanel({ reading }: { reading: QlReading }) {
  const { parameter, capability: result } = reading;
  return (
    <Panel title="Capability" subtitle="Cpk of 1.33 releases without review" actions={<StatusPill tone={QL_CAPABILITY_TONE[result.verdict]}>{QL_CAPABILITY_LABEL[result.verdict]}</StatusPill>}>
      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex items-end gap-6">
          <div data-tone={QL_CAPABILITY_TONE[result.verdict]}>
            <p className="text-xs font-medium text-medium-foreground">Cpk</p>
            <p className="text-5xl font-semibold tracking-tight text-[var(--t-ink)] tabular-nums">{formatNumber(result.cpk, 2)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-medium-foreground">Cp</p>
            <p className="whitespace-nowrap text-2xl font-semibold text-base-foreground tabular-nums">{result.cp === null ? 'One-sided' : formatNumber(result.cp, 2)}</p>
          </div>
        </div>
        <CapabilityHistogram
          label={`${parameter.name}: distribution of results against the specification`}
          values={reading.series}
          limits={reading.limits}
          spec={{ lsl: parameter.lsl, usl: parameter.usl }}
          decimals={parameter.decimals}
          height={84}
        />
      </div>
    </Panel>
  );
}

function QlRulesPanel({ reading }: { reading: QlReading }) {
  const found = [...reading.violations].reverse().slice(0, 3);
  return (
    <Panel title="Run rules" subtitle={found.length === 0 ? 'Western Electric rules 1 to 4' : `${reading.violations.length} broken in the last ${reading.series.length} results`}>
      {found.length === 0 ? (
        <div className="flex flex-1 items-center gap-4 rounded-xl bg-success-background p-4 text-success-foreground">
          <IconCircleCheck className="size-8 shrink-0" aria-hidden="true" />
          <p className="text-sm">
            <strong className="block font-semibold">No rules broken.</strong>
            The process is in statistical control; results vary only by common causes.
          </p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col">
          {found.map((violation) => (
            <ListRow
              key={violation.index}
              tone={violation.rule === 1 ? 'critical' : 'warning'}
              leading={
                <span className="flex size-7 items-center justify-center rounded-full bg-[var(--kit-line-critical)] text-sm font-bold text-[var(--kit-surface)]">{violation.rule}</span>
              }
              title={SPC_RULE_TEXT[violation.rule]}
              meta={`${reading.stamps[violation.index] ?? ''} · ${formatNumber(sigmaDistance(reading.series[violation.index] ?? 0, reading.limits), 1)} sigma from centre`}
              trailing={<span className="font-semibold tabular-nums">{qlFigure(reading, reading.series[violation.index] ?? 0)}</span>}
            />
          ))}
          <li className="mt-auto rounded-xl bg-[var(--kit-well)] p-3 text-sm text-medium-foreground">
            <strong className="font-semibold text-base-foreground">{reading.state === 'out-of-spec' ? 'Hold the batch.' : 'Look for an assignable cause.'}</strong>{' '}
            {reading.state === 'out-of-spec'
              ? 'Retest from a fresh sample; the drift started four results ago, so check the unit upstream as well.'
              : 'The result is inside the specification, but the process has shifted from its baseline.'}
          </li>
        </ul>
      )}
    </Panel>
  );
}

function QlRail({
  filter,
  onFilter,
  selected,
  decisions,
  onSelect,
}: {
  filter: string;
  onFilter: (filter: string) => void;
  selected: QlSample;
  decisions: Readonly<Record<string, QlDecision>>;
  onSelect: (id: string) => void;
}) {
  const open = QL_SAMPLES.filter((sample) => qlVerdict(sample, decisions[sample.id]).open);
  const shown = filter === 'open' ? open : filter === 'done' ? QL_SAMPLES.filter((sample) => !open.includes(sample)) : QL_SAMPLES;
  return (
    <aside aria-label="Sample queue" className="flex w-[304px] shrink-0 flex-col border-r border-[var(--kit-rule)] bg-[var(--kit-surface)]">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <IconChip tone="accent">
          <IconFlask />
        </IconChip>
        <div className="min-w-0">
          <p className="text-base font-semibold text-base-foreground">Nordkapp lab</p>
          <p className="text-xs text-medium-foreground">Thursday 12 March · day shift</p>
        </div>
      </div>
      <div className="px-4 pb-3">
        <SegmentedControl value={filter} onValueChange={(next) => onFilter(String(next))}>
          <SegmentedControlList size="small" aria-label="Queue filter" className="w-full">
            <SegmentedControlButton value="all">All {QL_SAMPLES.length}</SegmentedControlButton>
            <SegmentedControlButton value="open">Open {open.length}</SegmentedControlButton>
            <SegmentedControlButton value="done">Done {QL_SAMPLES.length - open.length}</SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        <QlQueue samples={shown} selected={selected.id} decisions={decisions} onSelect={onSelect} />
      </div>
      <div className="flex flex-col gap-3 border-t border-[var(--kit-rule)] p-4">
        <p className="text-xs font-medium text-medium-foreground">
          Chain of custody · <TagId>{selected.id}</TagId>
        </p>
        <QlCustody vertical sample={selected} decision={decisions[selected.id]} />
      </div>
    </aside>
  );
}

function QlHeader({
  sample,
  reading,
  decision,
  onDecide,
}: {
  sample: QlSample;
  reading: QlReading;
  decision: QlDecision | undefined;
  onDecide: (decision: QlDecision) => void;
}) {
  const product = QL_PRODUCTS[sample.product];
  const settled = decision !== undefined || sample.stage === 'approved';
  const waiting = reading.result === null;
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 text-sm text-medium-foreground">
          {product.name} · <TagId>{sample.id}</TagId> · {formatTime(sample.takenAt)} · <TagId>{product.point}</TagId>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" disabled={settled || waiting} onClick={() => onDecide('retest')}>
            <IconRefresh /> Request retest
          </Button>
          <Button size="sm" disabled={settled || waiting} onClick={() => onDecide('released')}>
            <IconCheck /> {decision === 'released' || sample.stage === 'approved' ? 'Approved' : 'Approve sample'}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-semibold tracking-tight text-base-foreground">{reading.parameter.name}</h2>
        <StatusPill tone={QL_STATE_TONE[reading.state]} size="lg">
          {QL_STATE_LABEL[reading.state]}
        </StatusPill>
      </div>
      <p className="max-w-3xl text-base text-medium-foreground">{qlSentence(reading)}</p>
    </header>
  );
}

function QlWorkbench({ initialSample = 'S-260312-14', initialParameter = 'h2s' }: { initialSample?: string; initialParameter?: string }) {
  const [sampleId, setSampleId] = useState(initialSample);
  const [parameterId, setParameterId] = useState(initialParameter);
  const [filter, setFilter] = useState('all');
  const [decisions, setDecisions] = useState<Readonly<Record<string, QlDecision>>>({});

  const sample = QL_SAMPLES.find((entry) => entry.id === sampleId) ?? QL_SAMPLES[0];
  const parameters = qlParametersOf(sample.product);
  const parameter = parameters.find((entry) => entry.id === parameterId) ?? parameters[0];
  const reading = qlRead(sample, parameter);

  const selectSample = (id: string) => {
    const next = QL_SAMPLES.find((entry) => entry.id === id);
    if (!next) return;
    setSampleId(id);
    // Open the parameter that needs attention first.
    const candidates = qlParametersOf(next.product);
    const worst = candidates.find((entry) => qlRead(next, entry).state === 'out-of-spec') ?? candidates.find((entry) => qlRead(next, entry).state === 'run-rule') ?? candidates[0];
    setParameterId(worst.id);
  };

  return (
    <LookScope look="studio">
      <Canvas padding="none" className="flex h-[980px]">
        <QlRail filter={filter} onFilter={setFilter} selected={sample} decisions={decisions} onSelect={selectSample} />
        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          <QlHeader sample={sample} reading={reading} decision={decisions[sample.id]} onDecide={(decision) => setDecisions((current) => ({ ...current, [sample.id]: decision }))} />
          <QlParameterTabs sample={sample} selected={parameter.id} onSelect={setParameterId} />
          <QlChartPanel reading={reading} />
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
            <QlCapabilityPanel reading={reading} />
            <QlRulesPanel reading={reading} />
          </div>
        </main>
      </Canvas>
    </LookScope>
  );
}

function QualityLabSignature() {
  return <QlWorkbench />;
}

const QL_LATEST: QlSample = { id: 'latest', product: 'gas', stage: 'analysed', offset: 0, takenAt: REFERENCE_NOW, takenBy: '', analyst: '' };

const QL_WALL = QL_PARAMETERS.map((parameter) => qlRead({ ...QL_LATEST, product: parameter.product }, parameter));

function QualityLabParameterWall() {
  const [selected, setSelected] = useState('oiw');
  const [view, setView] = useState('charts');
  const focus = QL_WALL.find((reading) => reading.parameter.id === selected) ?? QL_WALL[0];
  return (
    <LookScope look="studio">
      <Canvas className="flex flex-col gap-5">
        <SectionHeader
          eyebrow="Nordkapp lab · process control"
          title="Seven parameters, two need a look"
          description="Every specified parameter on its own control chart. Select one to see why it is flagged."
          actions={
            <SegmentedControl value={view} onValueChange={(next) => setView(String(next))}>
              <SegmentedControlList size="small" aria-label="Wall view">
                <SegmentedControlButton value="charts">With zones</SegmentedControlButton>
                <SegmentedControlButton value="plain">Lines only</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
          }
        />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 grid grid-cols-3 gap-4">
            {QL_WALL.map((reading) => {
              const product = QL_PRODUCTS[reading.parameter.product];
              const active = reading.parameter.id === selected;
              return (
                <button
                  key={reading.parameter.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(reading.parameter.id)}
                  className={cx(
                    'flex cursor-pointer flex-col gap-2 rounded-2xl border bg-[var(--kit-surface)] p-4 text-left outline-none transition-shadow focus-visible:[box-shadow:var(--shadow-focus-ring)]',
                    active ? 'border-[var(--kit-accent)] shadow-md' : 'border-[var(--kit-rule)] shadow-xs hover:shadow-md'
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <span className="block text-sm font-semibold text-base-foreground">{reading.parameter.short}</span>
                      <span className="block text-xs text-medium-foreground">{product.name}</span>
                    </span>
                    <StatusPill tone={QL_STATE_TONE[reading.state]}>{reading.state === 'in-spec' ? 'In control' : reading.state === 'run-rule' ? 'Run rule' : 'Out of spec'}</StatusPill>
                  </span>
                  <ControlChart
                    compact
                    zones={view === 'charts'}
                    label={`${reading.parameter.name}, last ${reading.series.length} results`}
                    values={reading.series}
                    labels={reading.labels}
                    limits={reading.limits}
                    violations={reading.violations}
                    height={84}
                  />
                  <span className="flex items-baseline justify-between text-xs text-medium-foreground">
                    <span>
                      <span className="text-xl font-semibold text-base-foreground tabular-nums">{formatNumber(reading.result ?? 0, reading.parameter.decimals)}</span> {reading.parameter.unit}
                    </span>
                    <span className="tabular-nums">Cpk {formatNumber(reading.capability.cpk, 2)}</span>
                  </span>
                </button>
              );
            })}
            <div className="col-span-2 flex flex-col justify-center gap-1 rounded-2xl border border-dashed border-[var(--kit-rule-strong)] p-4">
              <p className="text-sm font-semibold text-base-foreground">
                {focus.parameter.name}: {QL_STATE_LABEL[focus.state].toLowerCase()}
              </p>
              <p className="text-sm text-medium-foreground">
                {focus.violations.length === 0
                  ? 'No run rule is broken in the last 25 results. Nothing to do.'
                  : `${SPC_RULE_TEXT[focus.violations[focus.violations.length - 1]?.rule ?? 1]}. Check the sampling point and the last maintenance on the unit before the next sample.`}
              </p>
            </div>
          </div>
          <Panel className="col-span-4" title="Capability league" subtitle="Cpk per parameter; 1.33 releases without review">
            <Bars
              label="Process capability index per parameter against the 1.33 requirement"
              orientation="horizontal"
              categories={QL_WALL.map((reading) => reading.parameter.short)}
              series={[{ id: 'cpk', label: 'Cpk', values: QL_WALL.map((reading) => Math.round(reading.capability.cpk * 100) / 100) }]}
              tones={QL_WALL.map((reading) => QL_CAPABILITY_TONE[reading.capability.verdict])}
              decimals={2}
              showValues
              height={330}
              limit={{ value: 1.33, label: 'Required', tone: 'neutral' }}
            />
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

type QlCertificateRow = { reading: QlReading };

const QL_CERTIFICATE_SAMPLE = QL_SAMPLES[2];

const QL_CERTIFICATE_ROWS: QlCertificateRow[] = qlParametersOf('gas').map((parameter) => ({ reading: qlRead(QL_CERTIFICATE_SAMPLE, parameter) }));

const qlSpecText = (parameter: QlParameter): string =>
  parameter.lsl !== undefined && parameter.usl !== undefined
    ? `${formatNumber(parameter.lsl, parameter.decimals)} to ${formatNumber(parameter.usl, parameter.decimals)}`
    : `max ${formatNumber(parameter.usl ?? 0, parameter.decimals)}`;

const QL_CERTIFICATE_COLUMNS: DataTableColumn<QlCertificateRow>[] = [
  { id: 'parameter', header: 'Parameter', cell: ({ reading }) => reading.parameter.name },
  { id: 'method', header: 'Method', muted: true, nowrap: true, cell: ({ reading }) => reading.parameter.method },
  { id: 'spec', header: 'Specification', numeric: true, cell: ({ reading }) => `${qlSpecText(reading.parameter)} ${reading.parameter.unit}` },
  { id: 'result', header: 'Result', numeric: true, cell: ({ reading }) => <span className="text-lg font-medium">{formatNumber(reading.result ?? 0, reading.parameter.decimals)}</span> },
  { id: 'verdict', header: 'Verdict', nowrap: true, cell: ({ reading }) => <StatusPill tone={QL_STATE_TONE[reading.state]}>{reading.state === 'out-of-spec' ? 'Fail' : 'Pass'}</StatusPill> },
];

function QualityLabCertificate() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <header className="flex items-end justify-between gap-6 border-b-2 border-[var(--kit-rule-strong)] pb-5">
            <div>
              <p className="text-sm text-medium-foreground">Nordkapp laboratory · certificate of analysis</p>
              <h2 className="mt-2 text-5xl font-medium tracking-tight text-base-foreground">Sales gas, not released</h2>
            </div>
            <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
              Held
            </StatusPill>
          </header>
          <dl className="grid grid-cols-4 gap-6 text-sm">
            <div>
              <dt className="text-medium-foreground">Sample</dt>
              <dd className="mt-1 font-medium text-base-foreground">
                <TagId>{QL_CERTIFICATE_SAMPLE.id}</TagId>
              </dd>
            </div>
            <div>
              <dt className="text-medium-foreground">Sampling point</dt>
              <dd className="mt-1 font-medium text-base-foreground">
                <TagId>27-AP-2110</TagId>
              </dd>
            </div>
            <div>
              <dt className="text-medium-foreground">Taken</dt>
              <dd className="mt-1 font-medium text-base-foreground">12 Mar 2026, {formatTime(QL_CERTIFICATE_SAMPLE.takenAt)} UTC</dd>
            </div>
            <div>
              <dt className="text-medium-foreground">Analyst</dt>
              <dd className="mt-1 font-medium text-base-foreground">{QL_CERTIFICATE_SAMPLE.analyst}</dd>
            </div>
          </dl>
          <DataTable label="Results against the export specification" columns={QL_CERTIFICATE_COLUMNS} rows={QL_CERTIFICATE_ROWS} rowKey={(row) => row.reading.parameter.id} rowTone={(row) => (row.reading.state === 'out-of-spec' ? 'critical' : undefined)} />
          <div className="grid grid-cols-5 gap-10">
            <p className="col-span-3 text-base text-medium-foreground">
              <strong className="font-semibold text-base-foreground">Hydrogen sulphide exceeds the export limit.</strong> The result is confirmed by a second injection. The batch stays in the
              export header until a retest passes or the amine contactor is back in control; the control chart has drifted upward for five samples.
            </p>
            <div className="col-span-2 flex flex-col justify-end gap-6 text-sm text-medium-foreground">
              <p className="border-t border-[var(--kit-rule-strong)] pt-2">Analysed by Aisha Khan, 13:31</p>
              <p className="border-t border-[var(--kit-rule)] pt-2">Approval withheld, awaiting retest</p>
            </div>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

const QL_HELD = QL_SAMPLES[2];

const QL_HELD_READING = qlRead(QL_HELD, QL_PARAMETERS[1]);

const QL_STEADY_READING = qlRead(QL_SAMPLES[3], QL_PARAMETERS[3]);

function QlPart({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <LookScope look="studio" className={cx('flex flex-col', className)}>
      <Canvas className="flex min-h-0 flex-1 flex-col justify-center">{children}</Canvas>
    </LookScope>
  );
}

function QualityLabQueue() {
  const [selected, setSelected] = useState('S-260312-14');
  return (
    <QlPart className="h-[660px]">
      <Panel title="Sample queue" subtitle="Today, newest first" padding="tight">
        <QlQueue samples={QL_SAMPLES.slice(0, 5)} selected={selected} decisions={{}} onSelect={setSelected} />
      </Panel>
    </QlPart>
  );
}

function QualityLabControlChart() {
  const [zones, setZones] = useState('on');
  return (
    <QlPart className="h-[660px]">
      <QlChartPanel
        reading={QL_HELD_READING}
        height={440}
        zones={zones === 'on'}
        actions={
          <SegmentedControl value={zones} onValueChange={(next) => setZones(String(next))}>
            <SegmentedControlList size="small" aria-label="Zones">
              <SegmentedControlButton value="on">Zones</SegmentedControlButton>
              <SegmentedControlButton value="off">Limits only</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        }
      />
    </QlPart>
  );
}

function QualityLabCapability() {
  return (
    <QlPart className="h-[340px]">
      <QlCapabilityPanel reading={QL_STEADY_READING} />
    </QlPart>
  );
}

function QualityLabRunRules() {
  return (
    <QlPart className="h-[340px]">
      <QlRulesPanel reading={QL_HELD_READING} />
    </QlPart>
  );
}

function QualityLabCustody() {
  return (
    <QlPart className="h-[372px]">
      <Panel title="Chain of custody" subtitle="Sample S-260312-14, held at approval">
        <div className="flex flex-1 flex-col justify-between gap-4">
          <QlCustody sample={QL_HELD} decision={undefined} />
          <p className="rounded-xl bg-[var(--kit-well)] p-3 text-sm text-medium-foreground">
            <strong className="font-semibold text-base-foreground">Stopped at approval.</strong> Hydrogen sulphide is above the export limit; the sample waits for a retest before it can be released.
          </p>
        </div>
      </Panel>
    </QlPart>
  );
}

function QualityLabParameterTabs() {
  const [selected, setSelected] = useState('h2s');
  return (
    <QlPart className="h-[372px]">
      <Panel title="Parameter switch" subtitle="One tab per analysis, with the result on it">
        <div className="flex flex-1 flex-col justify-between gap-4">
          <QlParameterTabs sample={QL_HELD} selected={selected} onSelect={setSelected} />
          <QlCompliance />
        </div>
      </Panel>
    </QlPart>
  );
}

export default definePage({
  id: 'quality-lab',
  title: 'Quality lab',
  summary:
    'The laboratory workbench: a queue of today’s samples on the left, and for the selected one a control chart that says whether the result is inside the specification and whether the process behind it is still in control.',
  guidance: {
    use: [
      'When the work is a queue handled one item at a time and each item has a history worth a chart.',
      'Judge a result twice: against the specification, and against the process’s own control limits.',
      'Mark run-rule violations on the chart with the rule number, and explain each one in words beside it.',
    ],
    avoid: [
      'Control limits recalculated with the new result included; keep the baseline fixed.',
      'A tile row of lab KPIs above the chart; the header sentence carries the figures.',
      'Status by colour alone: every state has a word and an icon.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Studio look: sample queue rail and a detail canvas led by the control chart.',
      specimens: [
        {
          id: 'QualityLabSignature',
          title: 'Lab workbench',
          note: 'Pick it when an analyst works through samples one by one and must decide to approve, hold or retest.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/quality-lab/ControlChart.tsx', 'kit/quality-lab/CapabilityHistogram.tsx', 'kit/quality-lab/spc.ts', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: QualityLabSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product.',
      specimens: [
        {
          id: 'QualityLabParameterWall',
          title: 'Parameter wall',
          note: 'Pick it for the weekly quality review, when every parameter must be scanned for drift at once.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/quality-lab/ControlChart.tsx', 'kit/Bars.tsx', 'kit/SectionHeader.tsx'],
          Component: QualityLabParameterWall,
        },
        {
          id: 'QualityLabCertificate',
          title: 'Certificate of analysis',
          note: 'Pick it for the document that leaves the lab: one sample, every result against its limit, in the editorial look.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: QualityLabCertificate,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The panels of the workbench on their own.',
      specimens: [
        {
          id: 'QualityLabQueue',
          title: 'Sample queue',
          note: 'Use it as the rail of any one-at-a-time review; the pill says what each item is waiting for.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/IconChip.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: QualityLabQueue,
        },
        {
          id: 'QualityLabControlChart',
          title: 'Control chart',
          note: 'Use it wherever a repeated measurement must be judged against its own history.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/quality-lab/ControlChart.tsx', 'kit/quality-lab/spc.ts', 'kit/Legend.tsx'],
          Component: QualityLabControlChart,
        },
        {
          id: 'QualityLabCapability',
          title: 'Capability',
          note: 'Use it to show how much room the process has inside the specification.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/quality-lab/CapabilityHistogram.tsx', 'kit/quality-lab/spc.ts'],
          Component: QualityLabCapability,
        },
        {
          id: 'QualityLabRunRules',
          title: 'Run rules',
          note: 'Use it next to a control chart so each numbered mark is explained in words.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/quality-lab/spc.ts'],
          Component: QualityLabRunRules,
        },
        {
          id: 'QualityLabCustody',
          title: 'Chain of custody',
          note: 'Use it when a record moves through fixed stages and the reader needs to see where it stopped.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: QualityLabCustody,
        },
        {
          id: 'QualityLabParameterTabs',
          title: 'Parameter switch',
          note: 'Use it when tabs should carry the value they lead to, so the worst one is found without clicking.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx'],
          Component: QualityLabParameterTabs,
        },
      ],
    },
  ],
});
