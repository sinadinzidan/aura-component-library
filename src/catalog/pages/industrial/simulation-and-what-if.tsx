import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { Label } from '@cognite/aura/components/label';
import { Slider } from '@cognite/aura/components/slider';
import { IconBulb, IconDownload, IconPlayerPlay, IconShare } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { ToggleGroup } from '../../../library/actions/ToggleGroup';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { compressorModel, compressorSensitivity } from '../../../library/industrial/domains2/compressorModel';
import type { CompressorInputs, CompressorResult } from '../../../library/industrial/domains2/compressorModel';
import { ParameterPanel } from '../../../library/industrial/domains2/ParameterPanel';
import type { ModelParameter } from '../../../library/industrial/domains2/ParameterPanel';
import { PercentileBand } from '../../../library/industrial/domains2/PercentileBand';
import { ScenarioCard } from '../../../library/industrial/domains2/ScenarioCard';
import { checkConstraint, percentChange, runStatus } from '../../../library/industrial/domains2/scenarios';
import type { RunStatus } from '../../../library/industrial/domains2/scenarios';
import { TornadoBars } from '../../../library/industrial/domains2/TornadoBars';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { formatDelta, formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './simulation-and-what-if.tsx?raw';

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

function simWhatIfSensor(id: string) {
  const sensor = SENSORS.find((candidate) => candidate.id === id);
  if (!sensor) throw new Error(`Unknown sensor ${id}`);
  return sensor;
}

const DISCHARGE_PRESSURE = simWhatIfSensor('pt-92531');
const SUCTION_PRESSURE = simWhatIfSensor('pt-92530');
const DISCHARGE_TEMPERATURE = simWhatIfSensor('tt-92532');
const GAS_FLOW = simWhatIfSensor('ft-92510');

/** Today's operating point of the 1st stage compressor 23-KA-9101: the baseline every scenario starts from. */
const BASELINE: CompressorInputs = {
  flow: GAS_FLOW.value / 1000,
  suctionPressure: SUCTION_PRESSURE.value,
  dischargePressure: DISCHARGE_PRESSURE.value,
  efficiency: 78,
  suctionTemperature: 28,
};
const BASELINE_RESULT = compressorModel(BASELINE);

/** Rated shaft power of the driver 23-GT-9001, in kW. */
const DRIVER_LIMIT = 11500;
const TEMPERATURE_LIMIT = DISCHARGE_TEMPERATURE.highLimit;

const PARAMETERS: readonly ModelParameter[] = [
  { key: 'flow', label: 'Gas flow', min: 120, max: 210, step: 0.2, unit: 'kSm³/h', decimals: 1, baseline: BASELINE.flow },
  { key: 'dischargePressure', label: 'Discharge pressure', min: 40, max: 55, step: 0.1, unit: 'barg', decimals: 1, baseline: BASELINE.dischargePressure },
  { key: 'suctionPressure', label: 'Suction pressure', min: 10, max: 15, step: 0.1, unit: 'barg', decimals: 1, baseline: BASELINE.suctionPressure },
  { key: 'efficiency', label: 'Isentropic efficiency', min: 70, max: 86, step: 0.5, unit: '%', decimals: 1, baseline: BASELINE.efficiency },
  { key: 'suctionTemperature', label: 'Suction temperature', min: 15, max: 45, step: 1, unit: '°C', baseline: BASELINE.suctionTemperature },
];

/** Reads the panel's key-value state back into typed model inputs. */
function simWhatIfInputs(values: Readonly<Record<string, number>>): CompressorInputs {
  return {
    flow: values.flow ?? BASELINE.flow,
    suctionPressure: values.suctionPressure ?? BASELINE.suctionPressure,
    dischargePressure: values.dischargePressure ?? BASELINE.dischargePressure,
    efficiency: values.efficiency ?? BASELINE.efficiency,
    suctionTemperature: values.suctionTemperature ?? BASELINE.suctionTemperature,
  };
}

type Scenario = { id: string; name: string; description: string; inputs: CompressorInputs; result: CompressorResult; author: string; updated: string; status: RunStatus };

function simWhatIfScenario(id: string, name: string, description: string, changes: Partial<CompressorInputs>, author: string, updated: string, status: RunStatus): Scenario {
  const inputs = { ...BASELINE, ...changes };
  return { id, name, description, inputs, result: compressorModel(inputs), author, updated, status };
}

const THROUGHPUT = simWhatIfScenario('sc-014', 'Higher throughput', 'Push export to 4.75 MSm³/d on one train', { flow: 198, dischargePressure: 50 }, 'Aisha Khan', '12 Mar, 11:20', 'done');
const CLEAN_COOLER = simWhatIfScenario('sc-015', 'Cleaned interstage cooler', 'Effect of WO-104471 on power and temperature', { suctionTemperature: 22, efficiency: 79.5 }, 'Magnus Solberg', '12 Mar, 09:05', 'done');
const BOTH = simWhatIfScenario('sc-016', 'Throughput after cleaning', 'Both changes together', { flow: 198, dischargePressure: 50, suctionTemperature: 22, efficiency: 79.5 }, 'Aisha Khan', '12 Mar, 13:40', 'running');
const LOW_SUCTION = simWhatIfScenario('sc-012', 'Low suction pressure', 'Late-life inlet pressure of 9 barg', { suctionPressure: 9 }, 'Ingrid Haugen', '10 Mar, 15:12', 'failed');
const WINTER = simWhatIfScenario('sc-017', 'Winter sea water', 'Suction at 18 °C from colder cooling water', { suctionTemperature: 18 }, 'Liv Wold', '12 Mar, 13:55', 'queued');
const DRAFT = simWhatIfScenario('sc-018', 'Re-wheeled compressor', 'New impeller, vendor efficiency 83 %', { efficiency: 83 }, 'Aisha Khan', '12 Mar, 13:58', 'draft');
const SCENARIOS: readonly Scenario[] = [THROUGHPUT, CLEAN_COOLER, BOTH, WINTER, LOW_SUCTION, DRAFT];

/** Shaft power in MW against flow for three cases, from the same model. */
const FLOW_STEPS = [120, 135, 150, 165, 180, 195, 210];
const POWER_BY_FLOW = FLOW_STEPS.map((flow) => ({
  flow: String(flow),
  baseline: Math.round(compressorModel({ ...BASELINE, flow }).power / 10) / 100,
  throughput: Math.round(compressorModel({ ...THROUGHPUT.inputs, flow }).power / 10) / 100,
  cleaned: Math.round(compressorModel({ ...CLEAN_COOLER.inputs, flow }).power / 10) / 100,
}));

const SENSITIVITY_RANGES = [
  { key: 'flow', label: 'Gas flow', low: 165, high: 200, lowLabel: '165', highLabel: '200 kSm³/h' },
  { key: 'dischargePressure', label: 'Discharge pressure', low: 46, high: 52, lowLabel: '46', highLabel: '52 barg' },
  { key: 'suctionPressure', label: 'Suction pressure', low: 11, high: 14, lowLabel: '11', highLabel: '14 barg' },
  { key: 'efficiency', label: 'Efficiency', low: 74, high: 82, lowLabel: '74', highLabel: '82 %' },
  { key: 'suctionTemperature', label: 'Suction temperature', low: 20, high: 36, lowLabel: '20', highLabel: '36 °C' },
] as const;

const TORNADO = compressorSensitivity(BASELINE, SENSITIVITY_RANGES).map((row, index) => ({
  id: row.key,
  label: row.label,
  low: row.low / 1000,
  high: row.high / 1000,
  lowLabel: SENSITIVITY_RANGES[index].lowLabel,
  highLabel: SENSITIVITY_RANGES[index].highLabel,
}));

/** Low, median and high case for the throughput scenario: flow and efficiency at the ends of their expected range. */
const RANGE_CASES = {
  p10: compressorModel({ ...THROUGHPUT.inputs, flow: 192, efficiency: 79.5 }),
  p50: THROUGHPUT.result,
  p90: compressorModel({ ...THROUGHPUT.inputs, flow: 204, efficiency: 76.5 }),
};

const ASSUMPTION_LOG = [
  { id: 'a5', when: '12 Mar, 11:18', who: 'Aisha Khan', what: 'Gas flow', from: '182.4', to: '198.0 kSm³/h', why: 'Export nomination for April' },
  { id: 'a4', when: '12 Mar, 11:16', who: 'Aisha Khan', what: 'Discharge pressure', from: '48.6', to: '50.0 barg', why: 'Higher pipeline back-pressure at that rate' },
  { id: 'a3', when: '12 Mar, 09:02', who: 'Magnus Solberg', what: 'Suction temperature', from: '28', to: '22 °C', why: 'Cooler approach after cleaning, vendor data sheet' },
  { id: 'a2', when: '12 Mar, 08:58', who: 'Magnus Solberg', what: 'Efficiency', from: '78.0', to: '79.5 %', why: 'Lower inlet volume flow moves the stage towards its design point' },
  { id: 'a1', when: '11 Mar, 16:30', who: 'Aisha Khan', what: 'Baseline', from: 'Design case', to: 'Measured, 11 Mar', why: 'Use the last full day of plant data' },
];

function Panel({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <Card className="w-full min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
        {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap tabular-nums text-base-foreground">{children}</dd>
    </div>
  );
}

function parameterKey(key: string): keyof CompressorInputs {
  if (key === 'flow' || key === 'suctionPressure' || key === 'dischargePressure' || key === 'efficiency' || key === 'suctionTemperature') return key;
  throw new Error(`Unknown parameter ${key}`);
}

function simWhatIfAssumptions(scenario: Scenario): { label: string; value: string }[] {
  return PARAMETERS.filter((parameter) => simWhatIfInputs({ ...scenario.inputs })[parameterKey(parameter.key)] !== parameter.baseline).map((parameter) => ({
    label: parameter.label,
    value: `${formatValue(simWhatIfInputs({ ...scenario.inputs })[parameterKey(parameter.key)], parameter.decimals ?? 0)} ${parameter.unit ?? ''}`.trim(),
  }));
}

/** The constraints every result is checked against, with the result's distance to each. */
function simWhatIfChecks(inputs: CompressorInputs, result: CompressorResult) {
  return [
    { id: 'power', label: 'Driver power', value: `${formatValue(result.power / 1000, 2)} MW`, bound: `≤ ${formatValue(DRIVER_LIMIT / 1000, 1)} MW`, check: checkConstraint(result.power, { max: DRIVER_LIMIT }) },
    { id: 'temperature', label: 'Discharge temperature', value: `${formatValue(result.dischargeTemperature, 1)} °C`, bound: `≤ ${TEMPERATURE_LIMIT} °C`, check: checkConstraint(result.dischargeTemperature, { max: TEMPERATURE_LIMIT }) },
    { id: 'pressure', label: 'Discharge pressure', value: `${formatValue(inputs.dischargePressure, 1)} barg`, bound: `≤ ${DISCHARGE_PRESSURE.highLimit} barg`, check: checkConstraint(inputs.dischargePressure, { max: DISCHARGE_PRESSURE.highLimit }) },
    { id: 'surge', label: 'Flow above surge line', value: `${formatValue(inputs.flow, 1)} kSm³/h`, bound: `≥ ${GAS_FLOW.lowLimit / 1000} kSm³/h`, check: checkConstraint(inputs.flow, { min: GAS_FLOW.lowLimit / 1000 }) },
  ];
}

function ConstraintList({ inputs, result }: { inputs: CompressorInputs; result: CompressorResult }) {
  return (
    <ul aria-label="Constraint checks" className="flex w-full flex-col">
      {simWhatIfChecks(inputs, result).map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3 border-t border-default py-2 text-xs first:border-t-0 first:pt-0 last:pb-0">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-base-foreground">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {row.value} · limit {row.bound}
            </span>
          </span>
          <StatusIndicator size="sm" tone={row.check.tone} label={row.check.label} shape={row.check.ok ? 'dot' : 'diamond'} />
        </li>
      ))}
    </ul>
  );
}

function SimWhatIfScenarioCard() {
  return (
    <div className="w-full max-w-80">
      <ScenarioCard
        name={THROUGHPUT.name}
        description={THROUGHPUT.description}
        status={THROUGHPUT.status}
        assumptions={simWhatIfAssumptions(THROUGHPUT)}
        result={{ label: 'Shaft power', value: THROUGHPUT.result.power / 1000, unit: 'MW', decimals: 2, baseline: BASELINE_RESULT.power / 1000, goodDirection: 'down' }}
        meta={`${THROUGHPUT.author} · ${THROUGHPUT.updated}`}
      />
    </div>
  );
}

function SimWhatIfScenarioDraft() {
  return (
    <div className="w-full max-w-80">
      <ScenarioCard
        name={DRAFT.name}
        description={DRAFT.description}
        status={DRAFT.status}
        statusDetail="not run"
        assumptions={simWhatIfAssumptions(DRAFT)}
        meta={DRAFT.author}
        actions={
          <Button size="sm">
            <IconPlayerPlay /> Run scenario
          </Button>
        }
      />
    </div>
  );
}

function SimWhatIfScenarioRunning() {
  return (
    <div className="w-full max-w-80">
      <ScenarioCard
        name={BOTH.name}
        description={BOTH.description}
        status={BOTH.status}
        statusDetail="62 %"
        assumptions={simWhatIfAssumptions(BOTH)}
        meta={`${BOTH.author} · started 13:40`}
        actions={
          <Button variant="ghost" size="sm">
            Cancel run
          </Button>
        }
      />
    </div>
  );
}

function SimWhatIfScenarioFailed() {
  return (
    <div className="w-full max-w-80">
      <ScenarioCard
        name={LOW_SUCTION.name}
        description="Pressure ratio 5.0 is outside the compressor map; the solver stopped at the surge line."
        status={LOW_SUCTION.status}
        assumptions={simWhatIfAssumptions(LOW_SUCTION)}
        meta={`${LOW_SUCTION.author} · ${LOW_SUCTION.updated}`}
        actions={
          <Button variant="secondary" size="sm">
            Edit assumptions
          </Button>
        }
      />
    </div>
  );
}

function SimWhatIfSavedList() {
  return (
    <Panel title="Saved scenarios" meta={`23-KA-9101 · ${SCENARIOS.length} scenarios`}>
      <ul aria-label="Saved scenarios" className="flex w-full flex-col">
        {SCENARIOS.map((scenario) => {
          const finished = scenario.status === 'done';
          return (
            <li key={scenario.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-default py-2.5 first:border-t-0 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                <span className="text-sm text-base-foreground">{scenario.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  <span className="font-mono">{scenario.id.toUpperCase()}</span> · {scenario.author} · {scenario.updated}
                </span>
              </div>
              <span className="w-20 text-right">{finished ? <ValueReadout size="xs" value={scenario.result.power / 1000} unit="MW" decimals={2} /> : <span className="text-xs text-muted-foreground">No result</span>}</span>
              <StatusIndicator size="sm" {...runStatus(scenario.status)} className="w-20" />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function SimWhatIfRunStatus() {
  const rows: { status: RunStatus; name: string; detail: string }[] = [
    { status: 'queued', name: WINTER.name, detail: 'Position 2 in the queue · starts in about 3 min' },
    { status: 'running', name: BOTH.name, detail: 'Step 31 of 50 · about 2 min left' },
    { status: 'done', name: THROUGHPUT.name, detail: 'Finished 11:24 · 4 min 10 s' },
    { status: 'failed', name: LOW_SUCTION.name, detail: 'Did not converge after 200 iterations' },
  ];
  return (
    <Panel title="Runs" meta="Queued, running, done and failed">
      <ul aria-label="Simulation runs" className="flex w-full flex-col">
        {rows.map((row) => (
          <li key={row.status} className="flex flex-col gap-2 border-t border-default py-3 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm text-base-foreground">{row.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{row.detail}</span>
              </div>
              <StatusIndicator size="sm" {...runStatus(row.status)} pulse={row.status === 'running'} />
            </div>
            {row.status === 'running' ? <LabelledProgress size="sm" label="Solver progress" value={62} /> : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function SimWhatIfRunProgress() {
  const steps = [
    { id: 'inputs', label: 'Validate inputs', state: 'Done' },
    { id: 'solve', label: 'Solve operating point', state: 'Step 31 of 50' },
    { id: 'checks', label: 'Check constraints', state: 'Waiting' },
    { id: 'report', label: 'Write results', state: 'Waiting' },
  ];
  return (
    <Panel title={BOTH.name} meta="Run started 13:40">
      <LabelledProgress label="Run progress" value={62} hint="About 2 minutes left. You can leave this page; the run continues." />
      <ol aria-label="Run steps" className="flex flex-col gap-1.5 text-xs">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-baseline justify-between gap-3">
            <span className={index === 1 ? 'font-medium text-base-foreground' : index === 0 ? 'text-medium-foreground' : 'text-muted-foreground'}>
              {index + 1}. {step.label}
            </span>
            <span className="tabular-nums text-muted-foreground">{step.state}</span>
          </li>
        ))}
      </ol>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm">
          Cancel run
        </Button>
      </div>
    </Panel>
  );
}

function SimWhatIfParameterPanel() {
  const [values, setValues] = useState<Readonly<Record<string, number>>>({ flow: 198, dischargePressure: 50 });
  const result = compressorModel(simWhatIfInputs(values));
  return (
    <Card className="w-full min-w-0">
      <ParameterPanel
        title="Compressor inputs"
        parameters={PARAMETERS}
        values={values}
        onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        onReset={() => setValues({})}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-default pt-3">
        <span className="text-xs text-muted-foreground">Shaft power with these inputs</span>
        <ValueReadout size="sm" value={result.power / 1000} unit="MW" decimals={2} tone={result.power > DRIVER_LIMIT ? 'critical' : 'neutral'} />
      </div>
    </Card>
  );
}

function SimWhatIfSetpoint() {
  const labelId = useId();
  const [setpoint, setSetpoint] = useState(50);
  const inputs = { ...BASELINE, dischargePressure: setpoint };
  const result = compressorModel(inputs);
  const temperature = checkConstraint(result.dischargeTemperature, { max: TEMPERATURE_LIMIT });
  return (
    <Panel title="What if the discharge setpoint changes" meta="23-PT-92531 · instant estimate">
      <div className="flex flex-col">
        <Label id={labelId}>Discharge pressure setpoint</Label>
        <div className="flex items-center gap-4">
          <Slider aria-labelledby={labelId} value={[setpoint]} onValueChange={(next) => setSetpoint(next[0] ?? setpoint)} min={44} max={55} step={0.1} />
          <ValueReadout size="sm" value={setpoint} unit="barg" decimals={1} className="w-24 justify-end" />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          Now {formatValue(BASELINE.dischargePressure, 1)} barg · high limit {DISCHARGE_PRESSURE.highLimit} barg
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-t border-default pt-4">
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs text-muted-foreground">Shaft power</dt>
          <dd className="flex flex-col gap-1.5">
            <ValueReadout size="md" value={result.power / 1000} unit="MW" decimals={2} />
            <TrendDelta size="sm" value={result.power / 1000} reference={BASELINE_RESULT.power / 1000} decimals={2} goodDirection="down" caption="vs now" />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-xs text-muted-foreground">Discharge temperature</dt>
          <dd className="flex flex-col gap-1.5">
            <ValueReadout size="md" value={result.dischargeTemperature} unit="°C" decimals={1} tone={temperature.ok ? 'neutral' : 'warning'} />
            <TrendDelta size="sm" value={result.dischargeTemperature} reference={BASELINE_RESULT.dischargeTemperature} decimals={1} goodDirection="down" caption="vs now" />
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {temperature.ok
          ? `${formatValue(temperature.margin, 1)} °C below the ${TEMPERATURE_LIMIT} °C high limit at this setpoint.`
          : `${formatValue(-temperature.margin, 1)} °C above the ${TEMPERATURE_LIMIT} °C high limit: this setpoint would raise a temperature alarm.`}
      </p>
    </Panel>
  );
}

function SimWhatIfNumberInputs() {
  const flowId = useId();
  const efficiencyId = useId();
  const [flow, setFlow] = useState<number | null>(198);
  const [efficiency, setEfficiency] = useState<number | null>(78);
  const result = compressorModel({ ...BASELINE, flow: flow ?? BASELINE.flow, efficiency: efficiency ?? BASELINE.efficiency });
  return (
    <Card className="w-full max-w-72 gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <Label htmlFor={flowId}>Gas flow</Label>
          <UnitNumberInput id={flowId} value={flow} onValueChange={setFlow} unit="kSm³/h" min={120} max={210} step={1} />
        </div>
        <div className="flex flex-col">
          <Label htmlFor={efficiencyId}>Isentropic efficiency</Label>
          <UnitNumberInput id={efficiencyId} value={efficiency} onValueChange={setEfficiency} unit="%" min={70} max={86} step={0.5} />
        </div>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-default pt-3">
        <span className="text-xs text-muted-foreground">Shaft power</span>
        <ValueReadout size="sm" value={result.power / 1000} unit="MW" decimals={2} />
      </div>
    </Card>
  );
}

function SimWhatIfScenarioPicker() {
  const options = [
    { id: 'baseline', label: 'Baseline', result: BASELINE_RESULT },
    { id: THROUGHPUT.id, label: 'Throughput', result: THROUGHPUT.result },
    { id: CLEAN_COOLER.id, label: 'Cleaned', result: CLEAN_COOLER.result },
  ];
  const [selected, setSelected] = useState(THROUGHPUT.id);
  const shown = options.find((option) => option.id === selected) ?? options[0];
  return (
    <Card className="w-full max-w-72 gap-4">
      <ToggleGroup
        label="Scenario shown"
        selection="single"
        required
        size="sm"
        options={options.map((option) => ({ value: option.id, label: option.label }))}
        value={[selected]}
        onValueChange={(next) => setSelected(next[0] ?? selected)}
      />
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Shaft power">{formatValue(shown.result.power / 1000, 2)} MW</Fact>
        <Fact label="Discharge temperature">{formatValue(shown.result.dischargeTemperature, 1)} °C</Fact>
        <Fact label="Pressure ratio">{formatValue(shown.result.pressureRatio, 2)}</Fact>
        <Fact label="Specific energy">{formatValue(shown.result.specificEnergy, 1)} kWh/kSm³</Fact>
      </dl>
    </Card>
  );
}

function SimWhatIfCostImpact() {
  const extraMw = (THROUGHPUT.result.power - BASELINE_RESULT.power) / 1000;
  return (
    <div className="w-full max-w-72">
      <KpiTile
        label="Extra fuel gas, per day"
        value={extraMw * 24 * 0.29}
        unit="kSm³"
        decimals={1}
        footnote={`From ${formatDelta(extraMw, 2)} MW shaft power at 0.29 kSm³ per MWh`}
      />
    </div>
  );
}

function SimWhatIfComparisonTiles() {
  const rows = [
    { id: 'power', label: 'Shaft power', unit: 'MW', decimals: 2, baseline: BASELINE_RESULT.power / 1000, scenario: THROUGHPUT.result.power / 1000, goodDirection: 'down' as const },
    { id: 'temperature', label: 'Discharge temperature', unit: '°C', decimals: 1, baseline: BASELINE_RESULT.dischargeTemperature, scenario: THROUGHPUT.result.dischargeTemperature, goodDirection: 'down' as const },
    { id: 'energy', label: 'Specific energy', unit: 'kWh/kSm³', decimals: 1, baseline: BASELINE_RESULT.specificEnergy, scenario: THROUGHPUT.result.specificEnergy, goodDirection: 'down' as const },
  ];
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
      {rows.map((row) => (
        <Card key={row.id} className="w-full min-w-0 gap-3">
          <span className="text-xs text-muted-foreground">{row.label}</span>
          <div className="flex flex-col gap-1">
            <ValueReadout size="md" value={row.scenario} unit={row.unit} decimals={row.decimals} />
            <span className="text-xs text-muted-foreground">{THROUGHPUT.name}</span>
          </div>
          <div className="flex flex-col gap-1 border-t border-default pt-3">
            <ValueReadout size="sm" value={row.baseline} unit={row.unit} decimals={row.decimals} />
            <span className="text-xs text-muted-foreground">Baseline</span>
          </div>
          <TrendDelta size="sm" value={row.scenario} reference={row.baseline} format="percent" decimals={1} goodDirection={row.goodDirection} />
        </Card>
      ))}
    </div>
  );
}

function SimWhatIfConstraints() {
  return (
    <Panel title="Constraint checks" meta={THROUGHPUT.name}>
      <ConstraintList inputs={THROUGHPUT.inputs} result={THROUGHPUT.result} />
    </Panel>
  );
}

function SimWhatIfDeltaTable() {
  const rows = [
    { label: 'Pressure ratio', unit: '', decimals: 2, pick: (result: CompressorResult) => result.pressureRatio },
    { label: 'Shaft power', unit: 'MW', decimals: 2, pick: (result: CompressorResult) => result.power / 1000 },
    { label: 'Discharge temperature', unit: '°C', decimals: 1, pick: (result: CompressorResult) => result.dischargeTemperature },
    { label: 'Specific energy', unit: 'kWh/kSm³', decimals: 1, pick: (result: CompressorResult) => result.specificEnergy },
  ];
  return (
    <Panel title="Result deltas" meta="Against baseline">
      <div className="w-full overflow-x-auto">
        <table aria-label="Scenario results against baseline" className="w-full min-w-120 border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${TH} pl-0`}>
                Result
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Baseline
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Throughput
              </th>
              <th scope="col" className={`${TH} pr-0 text-right`}>
                Cleaned cooler
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const base = row.pick(BASELINE_RESULT);
              return (
                <tr key={row.label} className="border-t border-default">
                  <th scope="row" className={`${TD} pl-0 text-left font-normal text-base-foreground`}>
                    {row.label}
                    {row.unit ? <span className="text-muted-foreground"> · {row.unit}</span> : null}
                  </th>
                  <td className={`${TD} text-right tabular-nums text-medium-foreground`}>{formatValue(base, row.decimals)}</td>
                  {[THROUGHPUT, CLEAN_COOLER].map((scenario, index) => {
                    const value = row.pick(scenario.result);
                    return (
                      <td key={scenario.id} className={`${TD} text-right tabular-nums ${index === 1 ? 'pr-0' : ''}`}>
                        <span className="block text-base-foreground">{formatValue(value, row.decimals)}</span>
                        <span className="block whitespace-nowrap text-xs text-muted-foreground">
                          {formatDelta(value - base, row.decimals)} · {formatDelta(percentChange(value, base), 1)} %
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function SimWhatIfTornado() {
  return (
    <Panel title="Sensitivity of shaft power" meta="One input at a time · MW">
      <TornadoBars label="Shaft power sensitivity to each input" baseline={BASELINE_RESULT.power / 1000} items={TORNADO} unit="MW" decimals={2} />
    </Panel>
  );
}

function SimWhatIfComparisonChart() {
  return (
    <Panel title="Shaft power against flow" meta="MW · three cases from the same model">
      <CategoryChart
        label="Shaft power against gas flow for the baseline, the higher throughput case and the cleaned cooler case; the cleaned cooler saves about 4 percent at every flow"
        rows={POWER_BY_FLOW}
        categoryKey="flow"
        series={[
          { key: 'baseline', label: 'Baseline', type: 'line', color: 'var(--color-chart-neutral-450)', dashed: true },
          { key: 'throughput', label: 'Higher throughput', type: 'line' },
          { key: 'cleaned', label: 'Cleaned cooler', type: 'line' },
        ]}
        references={[{ value: DRIVER_LIMIT / 1000, label: `Driver limit ${formatValue(DRIVER_LIMIT / 1000, 1)}`, tone: 'critical', align: 'left' }]}
        domain={[6, 13]}
        ticks={[6, 8, 10, 12]}
        decimals={2}
        legend
        heightClassName="h-60"
        summary="Flow in kSm³/h along the bottom. The throughput case reaches the driver limit just below 200 kSm³/h."
      />
    </Panel>
  );
}

function SimWhatIfRangeBand() {
  return (
    <Panel title="Result range" meta={THROUGHPUT.name}>
      <div className="flex flex-col gap-5">
        <PercentileBand
          label="Shaft power"
          p10={RANGE_CASES.p10.power / 1000}
          p50={RANGE_CASES.p50.power / 1000}
          p90={RANGE_CASES.p90.power / 1000}
          unit="MW"
          decimals={2}
          reference={{ value: DRIVER_LIMIT / 1000, label: 'Driver limit' }}
        />
        <PercentileBand
          label="Discharge temperature"
          p10={RANGE_CASES.p10.dischargeTemperature}
          p50={RANGE_CASES.p50.dischargeTemperature}
          p90={RANGE_CASES.p90.dischargeTemperature}
          unit="°C"
          reference={{ value: TEMPERATURE_LIMIT, label: 'High limit' }}
        />
      </div>
      <p className="text-xs text-muted-foreground">Low and high cases set flow and efficiency to the ends of their expected range. No random sampling.</p>
    </Panel>
  );
}

function SimWhatIfRecommendation() {
  const saving = (BASELINE_RESULT.power - CLEAN_COOLER.result.power) / 1000;
  return (
    <Card className="w-full max-w-80 gap-3">
      <div className="flex items-center gap-2">
        <IconBulb aria-hidden className="size-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Recommendation from 6 scenarios</span>
      </div>
      <h3 className="text-sm font-medium text-base-foreground">Clean the interstage cooler before raising throughput</h3>
      <p className="text-sm text-medium-foreground">
        Cleaning saves {formatValue(saving, 2)} MW at today&apos;s flow and lowers discharge temperature by {formatValue(BASELINE_RESULT.dischargeTemperature - CLEAN_COOLER.result.dischargeTemperature, 1)} °C. Without it, the throughput case runs
        {' '}
        {formatValue(THROUGHPUT.result.dischargeTemperature - TEMPERATURE_LIMIT, 1)} °C over the discharge temperature limit.
      </p>
      <dl className="flex flex-col gap-1.5 text-xs">
        <Fact label="Depends on">WO-104471</Fact>
        <Fact label="Constraints after both">All respected</Fact>
        <Fact label="Confidence">Model within 3 % of plant data</Fact>
      </dl>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">
          Dismiss
        </Button>
        <Button variant="secondary" size="sm">
          Open scenario
        </Button>
      </div>
    </Card>
  );
}

function SimWhatIfExportRow() {
  return (
    <Panel title="Share and export" meta={`${THROUGHPUT.id.toUpperCase()} · results frozen 12 Mar, 11:24`}>
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
          <span className="text-sm text-base-foreground">{THROUGHPUT.name}</span>
          <span className="text-xs text-muted-foreground">Shared with Gas compression engineers · view only</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton variant="ghost" size="sm" text="https://fusion.example.test/scenarios/sc-014" label="Copy link" />
          <Button variant="ghost" size="sm">
            <IconDownload /> Export results
          </Button>
          <Button variant="secondary" size="sm">
            <IconShare /> Share scenario
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">The export holds inputs, results, constraint checks and the assumptions log, so the numbers can be traced.</p>
    </Panel>
  );
}

function SimWhatIfAssumptionsLog() {
  return (
    <div className="w-full overflow-x-auto">
      <table aria-label="Assumptions log" className="w-full min-w-208 border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              When
            </th>
            <th scope="col" className={TH}>
              Changed by
            </th>
            <th scope="col" className={TH}>
              Assumption
            </th>
            <th scope="col" className={TH}>
              From
            </th>
            <th scope="col" className={TH}>
              To
            </th>
            <th scope="col" className={TH}>
              Reason
            </th>
          </tr>
        </thead>
        <tbody>
          {ASSUMPTION_LOG.map((entry) => (
            <tr key={entry.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap tabular-nums text-medium-foreground`}>{entry.when}</td>
              <td className={`${TD} whitespace-nowrap text-medium-foreground`}>{entry.who}</td>
              <td className={`${TD} whitespace-nowrap text-base-foreground`}>{entry.what}</td>
              <td className={`${TD} whitespace-nowrap tabular-nums text-muted-foreground`}>{entry.from}</td>
              <td className={`${TD} whitespace-nowrap tabular-nums text-base-foreground`}>{entry.to}</td>
              <td className={`${TD} text-medium-foreground`}>{entry.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimWhatIfWorkbench() {
  const [values, setValues] = useState<Readonly<Record<string, number>>>({ ...THROUGHPUT.inputs });
  const inputs = simWhatIfInputs(values);
  const result = compressorModel(inputs);
  const violated = simWhatIfChecks(inputs, result).filter((row) => !row.check.ok).length;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-semibold text-base-foreground">What-if, 1st stage compressor</h3>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono">23-KA-9101</span> · baseline measured 11 March · results update as you move a slider
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="w-full min-w-0 lg:col-span-2">
          <ParameterPanel
            title="Inputs"
            parameters={PARAMETERS}
            values={values}
            onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
            onReset={() => setValues({ ...BASELINE })}
          />
        </Card>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiTile
              size="compact"
              label="Shaft power"
              value={result.power / 1000}
              unit="MW"
              decimals={2}
              tone={result.power > DRIVER_LIMIT ? 'critical' : 'neutral'}
              delta={{ reference: BASELINE_RESULT.power / 1000, goodDirection: 'down', caption: 'vs baseline', decimals: 2 }}
            >
              <LinearGauge showHeader={false} size="sm" label="Shaft power against the driver limit" value={result.power / 1000} max={13} limits={{ high: 11, highHigh: DRIVER_LIMIT / 1000 }} unit="MW" decimals={2} />
            </KpiTile>
            <KpiTile
              size="compact"
              label="Discharge temperature"
              value={result.dischargeTemperature}
              unit="°C"
              decimals={1}
              tone={result.dischargeTemperature > TEMPERATURE_LIMIT ? 'warning' : 'neutral'}
              delta={{ reference: BASELINE_RESULT.dischargeTemperature, goodDirection: 'down', caption: 'vs baseline', decimals: 1 }}
            >
              <LinearGauge
                showHeader={false}
                size="sm"
                label="Discharge temperature against its limits"
                value={result.dischargeTemperature}
                min={100}
                max={170}
                limits={{ high: TEMPERATURE_LIMIT, highHigh: DISCHARGE_TEMPERATURE.highHighLimit }}
                unit="°C"
                decimals={1}
              />
            </KpiTile>
          </div>
          <Card className="w-full min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h4 className="text-sm font-medium text-base-foreground">Constraint checks</h4>
              <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
                {violated === 0 ? 'All respected' : `${violated} violated`}
              </span>
            </div>
            <ConstraintList inputs={inputs} result={result} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default definePage({
  id: 'simulation-and-what-if',
  title: 'Simulation and what-if',
  summary:
    'The kit for scenario and what-if applications: scenarios with their assumptions and run state, parameter panels bound to a model, results compared against a baseline, sensitivity, ranges, constraint checks and the record that makes a result traceable.',
  guidance: {
    use: [
      'Assumptions shown with every result; a number nobody can trace is not worth much.',
      'A baseline in every comparison, drawn quieter than the scenarios.',
      'Ranges (P10, P50, P90) where a single figure would claim more certainty than the model has.',
      'Constraint checks beside the result, so an attractive scenario that breaks a limit is seen at once.',
    ],
    avoid: [
      'Results that change without a visible change to an input.',
      'More than three scenarios on one chart; compare a shortlist.',
      'Status colour for a delta that has no good direction.',
      'Presenting a model estimate with the precision of a measurement.',
    ],
  },
  source,
  sections: [
    {
      id: 'scenarios',
      title: 'Scenarios and runs',
      description: 'A scenario from draft to result, and the runs behind it.',
      specimens: [
        {
          id: 'SimWhatIfScenarioCard',
          title: 'Scenario card',
          note: 'A finished scenario: what was changed, and the headline result against the baseline.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/ScenarioCard.tsx', 'industrial/domains2/scenarios.ts', 'industrial/domains2/compressorModel.ts'],
          Component: SimWhatIfScenarioCard,
        },
        {
          id: 'SimWhatIfScenarioDraft',
          title: 'Scenario draft',
          note: 'Assumptions are set but nothing has been run; the card offers the run.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/ScenarioCard.tsx', 'industrial/domains2/scenarios.ts'],
          Component: SimWhatIfScenarioDraft,
        },
        {
          id: 'SimWhatIfScenarioRunning',
          title: 'Scenario running',
          note: 'A run in progress, with how far it has come and a way to cancel it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/ScenarioCard.tsx', 'industrial/domains2/scenarios.ts'],
          Component: SimWhatIfScenarioRunning,
        },
        {
          id: 'SimWhatIfScenarioFailed',
          title: 'Scenario failed',
          note: 'A run that did not finish: the card says why and points back to the assumptions.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/ScenarioCard.tsx', 'industrial/domains2/scenarios.ts'],
          Component: SimWhatIfScenarioFailed,
        },
        {
          id: 'SimWhatIfSavedList',
          title: 'Saved scenarios list',
          note: 'Every scenario for one asset, with who made it, where its run stands and its headline result.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/domains2/scenarios.ts', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          Component: SimWhatIfSavedList,
        },
        {
          id: 'SimWhatIfRunStatus',
          title: 'Run status',
          note: 'The four run states in one queue: queued, running with progress, done and failed with a reason.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains2/scenarios.ts', 'feedback/LabelledProgress.tsx', 'industrial/StatusIndicator.tsx'],
          Component: SimWhatIfRunStatus,
        },
        {
          id: 'SimWhatIfRunProgress',
          title: 'Run progress with steps',
          note: 'A longer run, where people want to know which step it is on and that they may leave.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: SimWhatIfRunProgress,
        },
      ],
    },
    {
      id: 'parameters',
      title: 'Parameters and instant results',
      description: 'Inputs bound to a small model, so the answer moves as the input does.',
      specimens: [
        {
          id: 'SimWhatIfParameterPanel',
          title: 'Parameter panel',
          note: 'Several inputs with sliders and number fields, each showing its baseline and its change. Move one to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains2/ParameterPanel.tsx', 'industrial/domains2/compressorModel.ts', 'forms/SliderNumberInput.tsx'],
          Component: SimWhatIfParameterPanel,
        },
        {
          id: 'SimWhatIfSetpoint',
          title: 'What-if on a setpoint',
          note: 'One setpoint and its instant consequences, before anyone changes it in the plant. Drag the slider.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains2/compressorModel.ts', 'industrial/domains2/scenarios.ts', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          Component: SimWhatIfSetpoint,
        },
        {
          id: 'SimWhatIfNumberInputs',
          title: 'Number inputs',
          note: 'Two or three inputs people type exactly, with the result underneath.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/UnitNumberInput.tsx', 'industrial/domains2/compressorModel.ts', 'industrial/ValueReadout.tsx'],
          Component: SimWhatIfNumberInputs,
        },
        {
          id: 'SimWhatIfScenarioPicker',
          title: 'Scenario switch',
          note: 'Flipping one readout between the baseline and two scenarios.',
          origin: 'custom',
          align: 'stretch',
          uses: ['actions/ToggleGroup.tsx', 'industrial/domains2/compressorModel.ts'],
          Component: SimWhatIfScenarioPicker,
        },
        {
          id: 'SimWhatIfCostImpact',
          title: 'Consequence tile',
          note: 'A result translated into what it costs, with the conversion stated.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx', 'industrial/domains2/compressorModel.ts'],
          Component: SimWhatIfCostImpact,
        },
      ],
    },
    {
      id: 'comparing',
      title: 'Comparing results',
      description: 'Scenario against baseline, how sure the result is and whether it respects the limits.',
      specimens: [
        {
          id: 'SimWhatIfComparisonTiles',
          title: 'Baseline against scenario tiles',
          note: 'Two or three headline results, each with the scenario value, the baseline and the change.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/domains2/compressorModel.ts', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          Component: SimWhatIfComparisonTiles,
        },
        {
          id: 'SimWhatIfConstraints',
          title: 'Constraint check list',
          note: 'Every limit the result must respect, with the value, the limit and the verdict.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/scenarios.ts', 'industrial/StatusIndicator.tsx'],
          Component: SimWhatIfConstraints,
        },
        {
          id: 'SimWhatIfDeltaTable',
          title: 'Result delta table',
          note: 'Several results across scenarios, with absolute and relative change against the baseline.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains2/scenarios.ts', 'industrial/domains2/compressorModel.ts'],
          Component: SimWhatIfDeltaTable,
        },
        {
          id: 'SimWhatIfTornado',
          title: 'Sensitivity bars',
          note: 'Which input moves the result most, to know where better data is worth having.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/domains2/TornadoBars.tsx', 'industrial/domains2/scenarios.ts', 'industrial/domains2/compressorModel.ts'],
          Component: SimWhatIfTornado,
        },
        {
          id: 'SimWhatIfComparisonChart',
          title: 'Scenario comparison chart',
          note: 'Two or three cases over a swept input, with the limit they must stay under.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/CategoryChart.tsx', 'industrial/domains2/compressorModel.ts'],
          Component: SimWhatIfComparisonChart,
        },
        {
          id: 'SimWhatIfRangeBand',
          title: 'Result range band',
          note: 'A low, median and high case instead of one figure, computed from fixed input cases.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/PercentileBand.tsx', 'industrial/domains2/compressorModel.ts'],
          Component: SimWhatIfRangeBand,
        },
      ],
    },
    {
      id: 'record',
      title: 'Recommend, record and share',
      description: 'What to do with the result, and how others can check it.',
      specimens: [
        {
          id: 'SimWhatIfExportRow',
          title: 'Export and share row',
          note: 'Handing a frozen scenario to others, with what the export contains.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: SimWhatIfExportRow,
        },
        {
          id: 'SimWhatIfRecommendation',
          title: 'Optimisation recommendation',
          note: 'The conclusion drawn from several scenarios, with what it depends on and how far to trust it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/domains2/compressorModel.ts'],
          Component: SimWhatIfRecommendation,
        },
        {
          id: 'SimWhatIfAssumptionsLog',
          title: 'Assumptions log',
          note: 'The audit trail of a study: who changed which assumption, from what, to what and why.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: SimWhatIfAssumptionsLog,
        },
      ],
    },
    {
      id: 'full-blocks',
      title: 'Full blocks',
      description: 'The pieces combined into a working what-if tool.',
      specimens: [
        {
          id: 'SimWhatIfWorkbench',
          title: 'What-if workbench',
          note: 'Inputs on the left, results and constraint checks on the right, all bound to one model. Move a slider.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/domains2/ParameterPanel.tsx', 'industrial/domains2/compressorModel.ts', 'industrial/domains2/scenarios.ts', 'industrial/KpiTile.tsx', 'industrial/LinearGauge.tsx'],
          Component: SimWhatIfWorkbench,
        },
      ],
    },
  ],
});
