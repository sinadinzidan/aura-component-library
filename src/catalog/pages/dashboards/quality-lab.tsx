import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconChevronRight } from '@cognite/aura/icons';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { CapabilitySummary } from '../../../library/industrial/domains/CapabilitySummary';
import { ControlChart } from '../../../library/industrial/domains/ControlChart';
import { RUN_RULE_TEXT, capability, mean, runRuleViolations, sampleStdDev } from '../../../library/industrial/domains/spc';
import type { ControlLimits, RunRule } from '../../../library/industrial/domains/spc';
import { StageFlow } from '../../../library/industrial/domains/StageFlow';
import type { Stage } from '../../../library/industrial/domains/StageFlow';
import { formatLimit, formatReading, formatValue } from '../../../library/industrial/status';
import type { StatusDescriptor } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { MINUTE, REFERENCE_NOW, createRandom, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './quality-lab.tsx?raw';

type QualityLabProductId = 'gas' | 'condensate' | 'water';

type QualityLabProduct = {
  id: QualityLabProductId;
  name: string;
  /** Share of results inside specification over the last 30 days, in percent. */
  compliance: number;
  /** Median hours from sampling to approval. */
  turnaround: number;
};

const QUALITY_LAB_PRODUCTS: readonly QualityLabProduct[] = [
  { id: 'gas', name: 'Sales gas', compliance: 98.6, turnaround: 3.4 },
  { id: 'condensate', name: 'Condensate', compliance: 99.2, turnaround: 5.1 },
  { id: 'water', name: 'Produced water', compliance: 96.8, turnaround: 2.7 },
];

type QualityLabParameter = {
  id: string;
  name: string;
  product: QualityLabProductId;
  /** Laboratory method. */
  method: string;
  /** Sampling point tag. */
  point: string;
  unit: string;
  decimals: number;
  lsl: number;
  usl: number;
  /** Centre and half-width of the earlier results the control limits come from. */
  base: number;
  spread: number;
  seed: number;
};

const QUALITY_LAB_PARAMETERS: readonly QualityLabParameter[] = [
  { id: 'wobbe', name: 'Wobbe index', product: 'gas', method: 'ISO 6976', point: '27-AP-2110', unit: 'MJ/Sm³', decimals: 2, lsl: 48.3, usl: 52.8, base: 50.6, spread: 0.55, seed: 211 },
  { id: 'h2s', name: 'Hydrogen sulphide', product: 'gas', method: 'ASTM D4084', point: '27-AP-2110', unit: 'ppm', decimals: 2, lsl: 0, usl: 3.5, base: 2.1, spread: 0.6, seed: 223 },
  { id: 'dew', name: 'Water dew point', product: 'gas', method: 'ISO 6327', point: '27-AP-2112', unit: '°C', decimals: 1, lsl: -30, usl: -18, base: -23.4, spread: 1.6, seed: 227 },
  { id: 'rvp', name: 'Reid vapour pressure', product: 'condensate', method: 'ASTM D323', point: '20-AP-1140', unit: 'kPa', decimals: 1, lsl: 60, usl: 82, base: 72.5, spread: 3.2, seed: 233 },
  { id: 'density', name: 'Density at 15 °C', product: 'condensate', method: 'ASTM D4052', point: '20-AP-1140', unit: 'kg/m³', decimals: 1, lsl: 720, usl: 760, base: 741, spread: 5.5, seed: 239 },
  { id: 'oiw', name: 'Oil in water', product: 'water', method: 'OSPAR GC-FID', point: '20-AP-1161', unit: 'mg/L', decimals: 1, lsl: 0, usl: 30, base: 17.5, spread: 5, seed: 241 },
  { id: 'ph', name: 'pH', product: 'water', method: 'ISO 10523', point: '20-AP-1161', unit: '', decimals: 2, lsl: 6, usl: 8.5, base: 7.2, spread: 0.35, seed: 251 },
];

type QualityLabStageId = 'taken' | 'received' | 'analysed' | 'approved';

type QualityLabSample = {
  id: string;
  parameterId: string;
  /** `null` until the analysis is finished. */
  result: number | null;
  /** The stage the sample is in now. */
  stage: QualityLabStageId;
  /** A result outside specification holds the sample at review. */
  held?: boolean;
  takenAt: number;
  takenBy: string;
  analyst: string;
};

const QUALITY_LAB_SAMPLES: readonly QualityLabSample[] = [
  { id: 'S-260312-14', parameterId: 'h2s', result: 3.92, stage: 'analysed', held: true, takenAt: REFERENCE_NOW - 95 * MINUTE, takenBy: 'Tomás Barros', analyst: 'Aisha Khan' },
  { id: 'S-260312-13', parameterId: 'wobbe', result: 50.84, stage: 'analysed', takenAt: REFERENCE_NOW - 130 * MINUTE, takenBy: 'Tomás Barros', analyst: 'Aisha Khan' },
  { id: 'S-260312-12', parameterId: 'oiw', result: 24.6, stage: 'approved', takenAt: REFERENCE_NOW - 185 * MINUTE, takenBy: 'Jonas Nyberg', analyst: 'Aisha Khan' },
  { id: 'S-260312-11', parameterId: 'rvp', result: null, stage: 'received', takenAt: REFERENCE_NOW - 70 * MINUTE, takenBy: 'Jonas Nyberg', analyst: 'Magnus Solberg' },
  { id: 'S-260312-10', parameterId: 'dew', result: -22.8, stage: 'approved', takenAt: REFERENCE_NOW - 260 * MINUTE, takenBy: 'Tomás Barros', analyst: 'Aisha Khan' },
  { id: 'S-260312-09', parameterId: 'density', result: 743.2, stage: 'approved', takenAt: REFERENCE_NOW - 305 * MINUTE, takenBy: 'Jonas Nyberg', analyst: 'Magnus Solberg' },
  { id: 'S-260312-08', parameterId: 'ph', result: null, stage: 'taken', takenAt: REFERENCE_NOW - 25 * MINUTE, takenBy: 'Jonas Nyberg', analyst: 'Aisha Khan' },
];

const QUALITY_LAB_FILTERS = [
  { id: 'all', label: 'All products' },
  { id: 'gas', label: 'Sales gas' },
  { id: 'condensate', label: 'Condensate' },
  { id: 'water', label: 'Produced water' },
] as const;

const QUALITY_LAB_STAGE_ORDER: readonly QualityLabStageId[] = ['taken', 'received', 'analysed', 'approved'];

const QUALITY_LAB_HISTORY_POINTS = 24;

function qualityLabParameter(parameterId: string): QualityLabParameter {
  return QUALITY_LAB_PARAMETERS.find((parameter) => parameter.id === parameterId) ?? QUALITY_LAB_PARAMETERS[0];
}

function qualityLabProduct(productId: QualityLabProductId): QualityLabProduct {
  return QUALITY_LAB_PRODUCTS.find((product) => product.id === productId) ?? QUALITY_LAB_PRODUCTS[0];
}

/** Earlier results of a parameter: independent draws around its usual value, the same on every load. */
function qualityLabHistory(parameter: QualityLabParameter): number[] {
  const random = createRandom(parameter.seed);
  const factor = 10 ** parameter.decimals;
  return Array.from({ length: QUALITY_LAB_HISTORY_POINTS }, () => {
    const draw = (random() + random() + random()) / 3 - 0.5;
    return Math.round((parameter.base + draw * 2 * parameter.spread) * factor) / factor;
  });
}

/** Control limits from the earlier results, so a new result is judged against the process as it was. */
function qualityLabLimits(history: readonly number[]): ControlLimits {
  const center = mean(history);
  const sigma = sampleStdDev(history);
  return { center, ucl: center + 3 * sigma, lcl: center - 3 * sigma };
}

/** The plotted run: the earlier results, then this sample's result once there is one. */
function qualityLabRun(sample: QualityLabSample): { values: number[]; limits: ControlLimits } {
  const history = qualityLabHistory(qualityLabParameter(sample.parameterId));
  return { values: sample.result === null ? history : [...history, sample.result], limits: qualityLabLimits(history) };
}

function qualityLabInSpec(sample: QualityLabSample): boolean {
  const parameter = qualityLabParameter(sample.parameterId);
  return sample.result === null || (sample.result >= parameter.lsl && sample.result <= parameter.usl);
}

function qualityLabStatus(sample: QualityLabSample): StatusDescriptor {
  if (sample.held) return { tone: 'critical', label: 'Out of spec', shape: 'diamond' };
  if (sample.stage === 'approved') return { tone: 'success', label: 'Approved', shape: 'dot' };
  if (sample.stage === 'analysed') return { tone: 'info', label: 'Awaiting approval', shape: 'ring' };
  if (sample.stage === 'received') return { tone: 'neutral', label: 'In lab', shape: 'square' };
  return { tone: 'neutral', label: 'In transit', shape: 'ring' };
}

function qualityLabStages(sample: QualityLabSample): Stage[] {
  const reached = QUALITY_LAB_STAGE_ORDER.indexOf(sample.stage);
  const at = (index: number, minutes: number): string | undefined =>
    index <= reached ? formatTime(sample.takenAt + minutes * MINUTE) : undefined;
  return [
    { id: 'taken', label: 'Sample taken', detail: `${formatTime(sample.takenAt)} · ${sample.takenBy}` },
    { id: 'received', label: 'Received in lab', detail: at(1, 20) ?? 'Courier on the way' },
    { id: 'analysed', label: 'Analysed', detail: at(2, 65) === undefined ? sample.analyst : `${at(2, 65)} · ${sample.analyst}` },
    { id: 'approved', label: 'Approved', detail: at(3, 90) ?? 'Lab supervisor' },
  ];
}

function qualityLabVisible(filter: string): QualityLabSample[] {
  return QUALITY_LAB_SAMPLES.filter((sample) => filter === 'all' || qualityLabParameter(sample.parameterId).product === filter);
}

/** Where a result sits between its specification limits: a tick on a short scale. */
function QualityLabSpecBar({ sample }: { sample: QualityLabSample }) {
  const parameter = qualityLabParameter(sample.parameterId);
  if (sample.result === null) return <span className="block h-1.5 w-full rounded-full border border-dashed border-default" />;
  const width = parameter.usl - parameter.lsl;
  const fraction = Math.min(1, Math.max(0, (sample.result - (parameter.lsl - width * 0.2)) / (width * 1.4)));
  const inSpec = qualityLabInSpec(sample);

  return (
    <span
      role="img"
      aria-label={`${formatReading(sample.result, parameter.unit, parameter.decimals)}, ${inSpec ? 'inside' : 'outside'} the specification of ${formatLimit(parameter.lsl, 1)} to ${formatLimit(parameter.usl, 1)}`}
      className="relative block h-1.5 w-full rounded-full bg-chart-neutral-100"
    >
      <span className="absolute inset-y-0 left-[14.3%] right-[14.3%] bg-chart-neutral-200" />
      <span
        className={`absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 ${inSpec ? 'bg-base-foreground' : 'bg-chart-critical-450'}`}
        style={{ left: `${fraction * 100}%` }}
      />
    </span>
  );
}

/** The thin band of compliance figures: plain text, no tiles. */
function QualityLabComplianceBand({ filter }: { filter: string }) {
  const visible = qualityLabVisible(filter);
  const products = QUALITY_LAB_PRODUCTS.filter((product) => filter === 'all' || product.id === filter);
  const figures = [
    { label: 'In spec, last 30 days', value: `${formatValue(mean(products.map((product) => product.compliance)), 1)}%` },
    { label: 'Median turnaround', value: `${formatValue(mean(products.map((product) => product.turnaround)), 1)} h` },
    { label: 'Samples in queue', value: String(visible.length) },
    { label: 'Awaiting result', value: String(visible.filter((sample) => sample.result === null).length) },
    { label: 'Awaiting approval', value: String(visible.filter((sample) => sample.stage === 'analysed' && !sample.held).length) },
    { label: 'Out of spec', value: String(visible.filter((sample) => sample.held).length) },
  ];

  return (
    <dl aria-label="Laboratory compliance" className="flex w-full flex-wrap gap-x-8 gap-y-2 border-y border-default py-3">
      {figures.map((figure) => (
        <div key={figure.label} className="flex items-baseline gap-2">
          <dt className="text-xs text-muted-foreground">{figure.label}</dt>
          <dd className="text-sm font-semibold tabular-nums text-base-foreground">{figure.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type QualityLabQueueProps = {
  samples: readonly QualityLabSample[];
  selectedId: string;
  onSelect: (sampleId: string) => void;
};

/** The spine: the sample queue. Selecting a row fills the inspector under it. */
function QualityLabQueuePanel({ samples, selectedId, onSelect }: QualityLabQueueProps) {
  return (
    <DashboardPanel title="Sample queue" description={`${samples.length} samples today, newest first. Select one to inspect it.`}>
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="w-36 pb-2 pl-2 pr-3 font-medium">
              Sample
            </th>
            <th scope="col" className="w-32 pb-2 pr-3 font-medium">
              Product
            </th>
            <th scope="col" className="pb-2 pr-3 font-medium">
              Analysis
            </th>
            <th scope="col" className="w-48 pb-2 pr-3 font-medium">
              Result against spec
            </th>
            <th scope="col" className="w-40 pb-2 pr-2 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {samples.map((sample) => {
            const parameter = qualityLabParameter(sample.parameterId);
            const selected = sample.id === selectedId;
            const inSpec = qualityLabInSpec(sample);
            return (
              <tr
                key={sample.id}
                aria-selected={selected}
                onClick={() => onSelect(sample.id)}
                className={`cursor-pointer border-t border-default align-top ${selected ? 'bg-card-background-hover' : 'hover:bg-card-background-hover'}`}
              >
                <td className={`border-l-2 py-2.5 pl-2 pr-3 ${selected ? 'border-l-base-foreground' : 'border-l-transparent'}`}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Inspect sample ${sample.id}`}
                    className={`rounded-md font-mono text-sm text-base-foreground outline-none focus-visible:shadow-focus-ring ${selected ? 'font-semibold' : ''}`}
                  >
                    {sample.id}
                  </button>
                  <p className="text-xs tabular-nums text-muted-foreground">Taken {formatTime(sample.takenAt)}</p>
                </td>
                <td className="py-2.5 pr-3 text-medium-foreground">{qualityLabProduct(parameter.product).name}</td>
                <td className="py-2.5 pr-3">
                  <p className="text-base-foreground">{parameter.name}</p>
                  <p className="text-xs text-muted-foreground">{parameter.method}</p>
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex flex-col gap-1.5">
                    <p className="flex flex-col">
                      <span className={`font-medium tabular-nums ${inSpec ? 'text-base-foreground' : 'text-critical-foreground-strong'}`}>
                        {sample.result === null ? 'Pending' : formatReading(sample.result, parameter.unit, parameter.decimals)}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        Spec {formatLimit(parameter.lsl, 1)} to {formatLimit(parameter.usl, 1)}
                      </span>
                    </p>
                    <QualityLabSpecBar sample={sample} />
                  </div>
                </td>
                <td className="py-2.5 pr-2">
                  <span className="flex items-start justify-between gap-2">
                    <StatusIndicator {...qualityLabStatus(sample)} size="sm" className="whitespace-normal" />
                    {selected ? <IconChevronRight aria-hidden className="size-4 shrink-0 rotate-90 text-base-foreground" /> : null}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

/** Inspector, part one: the parameter's control chart with this sample as its last point. */
function QualityLabControlPanel({ sample }: { sample: QualityLabSample }) {
  const parameter = qualityLabParameter(sample.parameterId);
  const { values, limits } = qualityLabRun(sample);
  const violations = runRuleViolations(values, limits);
  const rules = [...new Set(violations.map((violation) => violation.rule))].sort((a: RunRule, b: RunRule) => a - b);
  const categories = values.map((_, index) => (index === values.length - 1 && sample.result !== null ? sample.id : `−${values.length - 1 - index}`));

  return (
    <DashboardPanel
      title="Control chart"
      description={`${parameter.name} at ${parameter.point}, last ${values.length} results`}
      footnote={
        violations.length === 0
          ? `In control: all ${values.length} results sit inside the limits and no run rule is broken.`
          : `${violations.length} ${violations.length === 1 ? 'point breaks' : 'points break'} a run rule. Numbers on the chart name the rule.`
      }
    >
      <ControlChart
        label={`${parameter.name}, individual results`}
        values={values}
        limits={limits}
        violations={violations}
        categories={categories}
        unit={parameter.unit}
        decimals={parameter.decimals}
        height={208}
        showSigmaLines
      />
      {rules.length > 0 ? (
        <ul aria-label="Run rules broken" className="flex flex-col gap-1">
          {rules.map((rule) => (
            <li key={rule} className="flex items-baseline gap-2 text-xs text-medium-foreground">
              <span className="w-3 shrink-0 font-medium tabular-nums text-critical-foreground-strong">{rule}</span>
              {RUN_RULE_TEXT[rule]}
            </li>
          ))}
        </ul>
      ) : null}
    </DashboardPanel>
  );
}

/** Inspector, part two: can the process hold the specification at all. */
function QualityLabCapabilityPanel({ sample }: { sample: QualityLabSample }) {
  const parameter = qualityLabParameter(sample.parameterId);
  const { values } = qualityLabRun(sample);
  const result = capability(values, parameter.lsl, parameter.usl);

  return (
    <DashboardPanel
      title="Capability"
      description={`Against ${formatLimit(parameter.lsl, 1)} to ${formatLimit(parameter.usl, 1)}${parameter.unit ? ` ${parameter.unit}` : ''}`}
      footnote={`Cpk ${formatValue(result.cpk, 2)}: the nearest limit is ${formatValue(result.cpk * 3, 1)} standard deviations from the mean.`}
    >
      <CapabilitySummary label={parameter.name} values={values} lsl={parameter.lsl} usl={parameter.usl} unit={parameter.unit} decimals={parameter.decimals} bins={12} height={120} />
    </DashboardPanel>
  );
}

/** Inspector, part three: the selected sample, its result and how far it has come. */
function QualityLabJourneyPanel({ sample }: { sample: QualityLabSample }) {
  const parameter = qualityLabParameter(sample.parameterId);
  const inSpec = qualityLabInSpec(sample);

  return (
    <DashboardPanel title="Selected sample" description={`${qualityLabProduct(parameter.product).name} · ${parameter.name}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">{sample.id}</span>
          {sample.result === null ? (
            <span className="text-2xl font-semibold leading-none text-muted-foreground">Pending</span>
          ) : (
            <ValueReadout value={sample.result} unit={parameter.unit} decimals={parameter.decimals} tone={inSpec ? 'neutral' : 'critical'} />
          )}
        </div>
        <StatusIndicator {...qualityLabStatus(sample)} size="sm" />
      </div>
      <StageFlow
        label={`Sample ${sample.id} journey`}
        stages={qualityLabStages(sample)}
        current={sample.stage}
        complete={sample.stage === 'approved'}
        currentTone={sample.held ? 'critical' : 'neutral'}
        currentNote={sample.held ? `Held: above the ${formatLimit(parameter.usl, 1)} ${parameter.unit} limit` : undefined}
        orientation="vertical"
      />
    </DashboardPanel>
  );
}

/*
 * Archetype: table-first with a live inspector — the queue is the spine and reads top to bottom;
 * the inspector is a wide row under it, not a side rail.
 * Dominant element: the sample queue table.
 * Interaction: selecting a sample row fills the inspector (control chart, capability, journey);
 * the product switch in the header narrows the queue and the compliance band.
 */
function QualityLabDashboard() {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(QUALITY_LAB_SAMPLES[0].id);
  const visible = qualityLabVisible(filter);
  const selected = visible.find((sample) => sample.id === selectedId) ?? visible[0] ?? QUALITY_LAB_SAMPLES[0];
  const held = visible.filter((sample) => sample.held).length;

  return (
    <DashboardFrame
      title="Quality lab"
      subtitle="Nordkapp laboratory · export specifications · updated 14:00 UTC"
      status={
        held > 0 ? (
          <StatusIndicator tone="critical" shape="diamond" label={`${held} sample out of spec`} detail="held for review" />
        ) : (
          <StatusIndicator tone="success" label="All results in spec" />
        )
      }
      actions={
        <SegmentedControl value={filter} onValueChange={(value) => setFilter(String(value))}>
          <SegmentedControlList size="small" aria-label="Product">
            {QUALITY_LAB_FILTERS.map((option) => (
              <SegmentedControlButton key={option.id} value={option.id}>
                {option.label}
              </SegmentedControlButton>
            ))}
          </SegmentedControlList>
        </SegmentedControl>
      }
    >
      <div className="flex flex-col gap-4">
        <QualityLabComplianceBand filter={filter} />
        <QualityLabQueuePanel samples={visible} selectedId={selected.id} onSelect={setSelectedId} />
        <DashboardGrid>
          <DashboardCell span={3}>
            <QualityLabJourneyPanel sample={selected} />
          </DashboardCell>
          <DashboardCell span={5}>
            <QualityLabControlPanel sample={selected} />
          </DashboardCell>
          <DashboardCell span={4}>
            <QualityLabCapabilityPanel sample={selected} />
          </DashboardCell>
        </DashboardGrid>
      </div>
    </DashboardFrame>
  );
}

function QualityLabDashSignature() {
  return (
    <ThemeScope preset="sky" className="w-full">
      <QualityLabDashboard />
    </ThemeScope>
  );
}

function QualityLabDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <QualityLabDashboard />
    </ThemeScope>
  );
}

function QualityLabDashDenseData() {
  return (
    <ThemeScope preset="dense-data" className="w-full">
      <QualityLabDashboard />
    </ThemeScope>
  );
}

function QualityLabDashAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <QualityLabDashboard />
    </ThemeScope>
  );
}

function QualityLabDashComplianceBand() {
  return <QualityLabComplianceBand filter="all" />;
}

function QualityLabDashQueue() {
  const [selectedId, setSelectedId] = useState(QUALITY_LAB_SAMPLES[1].id);
  return <QualityLabQueuePanel samples={QUALITY_LAB_SAMPLES} selectedId={selectedId} onSelect={setSelectedId} />;
}

function QualityLabDashControlInControl() {
  return <QualityLabControlPanel sample={QUALITY_LAB_SAMPLES[1]} />;
}

function QualityLabDashControlViolation() {
  return <QualityLabControlPanel sample={QUALITY_LAB_SAMPLES[0]} />;
}

function QualityLabDashCapability() {
  return <QualityLabCapabilityPanel sample={QUALITY_LAB_SAMPLES[1]} />;
}

function QualityLabDashJourneyApproved() {
  return <QualityLabJourneyPanel sample={QUALITY_LAB_SAMPLES[2]} />;
}

function QualityLabDashJourneyHeld() {
  return <QualityLabJourneyPanel sample={QUALITY_LAB_SAMPLES[0]} />;
}

function QualityLabDashJourneyPending() {
  return <QualityLabJourneyPanel sample={QUALITY_LAB_SAMPLES[3]} />;
}

export default definePage({
  id: 'quality-lab',
  title: 'Quality lab',
  summary:
    'The laboratory bench view: every sample taken today, whether its result meets the export specification, and whether the process behind it is still in control. The queue leads; one selected sample explains itself underneath.',
  guidance: {
    use: [
      'When the work is a queue: samples, inspections or certificates handled one at a time.',
      'When each row has a history worth showing, such as a control chart behind a single result.',
      'Keep the inspector under the table when it needs width for a chart.',
      'State compliance as plain figures above the queue; the table is the content.',
    ],
    avoid: [
      'Tiles for figures nobody acts on — a line of text is enough.',
      'A status column in colour alone; every state has a word and a shape.',
      'Control limits recalculated with the new result included; judge it against the earlier process.',
      'More than one screen of rows; filter by product instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Sky theme. A table-first layout: the queue is the spine and the selected sample fills the row under it.',
      specimens: [
        {
          id: 'QualityLabDashSignature',
          title: 'Quality lab',
          note: 'Pick it when people work through a queue and need the evidence behind one row at a time.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'industrial/domains/ControlChart.tsx',
            'industrial/domains/CapabilitySummary.tsx',
            'industrial/domains/StageFlow.tsx',
            'industrial/domains/spc.ts',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: QualityLabDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'QualityLabDashAura',
          title: 'Aura',
          note: 'Pick it when the lab view sits beside other Aura applications and should not stand out.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: QualityLabDashAura,
        },
        {
          id: 'QualityLabDashDenseData',
          title: 'Dense data',
          note: 'Pick it for analysts who keep the whole queue and the inspector on one screen.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: QualityLabDashDenseData,
        },
        {
          id: 'QualityLabDashAuraDark',
          title: 'Aura dark',
          note: 'Pick it for a lab or control room that runs dark screens around the clock.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: QualityLabDashAuraDark,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, in the states the queue puts it in.',
      specimens: [
        {
          id: 'QualityLabDashComplianceBand',
          title: 'Compliance band',
          note: 'Pick it for figures that give context but are not acted on: one line of text, no tiles.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: QualityLabDashComplianceBand,
        },
        {
          id: 'QualityLabDashQueue',
          title: 'Sample queue',
          note: 'Pick it as the spine of a queue view: one selectable row per sample, result drawn against its spec.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: QualityLabDashQueue,
        },
        {
          id: 'QualityLabDashControlInControl',
          title: 'Control chart, in control',
          note: 'Pick it to show that a result is ordinary: inside the limits with no pattern.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/ControlChart.tsx', 'industrial/domains/spc.ts'],
          Component: QualityLabDashControlInControl,
        },
        {
          id: 'QualityLabDashControlViolation',
          title: 'Control chart, rule broken',
          note: 'Pick it when a result breaks a run rule: the point is numbered and the rule is spelled out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/ControlChart.tsx', 'industrial/domains/spc.ts'],
          Component: QualityLabDashControlViolation,
        },
        {
          id: 'QualityLabDashCapability',
          title: 'Capability',
          note: 'Pick it beside a control chart to answer whether the process can hold the specification.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/CapabilitySummary.tsx'],
          Component: QualityLabDashCapability,
        },
        {
          id: 'QualityLabDashJourneyHeld',
          title: 'Sample held',
          note: 'Pick it when a result fails: the stage it stopped at says why in words.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/StageFlow.tsx', 'industrial/ValueReadout.tsx'],
          Component: QualityLabDashJourneyHeld,
        },
        {
          id: 'QualityLabDashJourneyApproved',
          title: 'Sample approved',
          note: 'Pick it for a finished sample: every stage checked, with who and when.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/StageFlow.tsx', 'industrial/ValueReadout.tsx'],
          Component: QualityLabDashJourneyApproved,
        },
        {
          id: 'QualityLabDashJourneyPending',
          title: 'Sample pending',
          note: 'Pick it while the analysis is running: the result reads pending and later stages stay dashed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/domains/StageFlow.tsx'],
          Component: QualityLabDashJourneyPending,
        },
      ],
    },
  ],
});
