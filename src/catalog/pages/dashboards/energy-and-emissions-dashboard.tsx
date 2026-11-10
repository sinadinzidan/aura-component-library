import { Badge } from '@cognite/aura/components/badge';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { SankeyDiagram } from '../../../library/experiences/journeys/SankeyDiagram';
import type { SankeyDiagramLink, SankeyDiagramNode } from '../../../library/experiences/journeys/SankeyDiagram';
import { sankeyLinkId } from '../../../library/experiences/journeys/sankeyLayout';
import type { SankeySelection } from '../../../library/experiences/journeys/sankeyLayout';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { PLANT_KPIS } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './energy-and-emissions-dashboard.tsx?raw';

type EnergyMode = 'energy' | 'co2';

type EnergyConsumerId = 'turbine' | 'heater' | 'flare' | 'pumps' | 'cooling' | 'utilities';

type EnergyConsumer = {
  id: EnergyConsumerId;
  label: string;
  tag: string;
  source: 'fuel' | 'power';
  /** Energy in, MW, and how much of it ends as useful work. */
  energy: number;
  useful: number;
  /** CO₂, tonnes a day. */
  co2: number;
  /** kWh and kg CO₂ per barrel of oil equivalent exported. */
  energyIntensity: number;
  co2Intensity: number;
  seed: number;
  /** Change over the last 30 days, percent. */
  drift: number;
  idea: { title: string; detail: string; energySaving: number; co2Saving: number; effort: 'Low' | 'Medium' | 'High'; status: 'Proposed' | 'In study' | 'Planned' };
};

/** Nordkapp, 24-hour average for 12 March. 108 MW in: 84 MW fuel gas and 24 MW imported power. */
const ENERGY_CONSUMERS: readonly EnergyConsumer[] = [
  {
    id: 'turbine',
    label: 'Compressor gas turbine',
    tag: '23-GT-9001',
    source: 'fuel',
    energy: 60,
    useful: 21,
    co2: 288,
    energyIntensity: 17.3,
    co2Intensity: 3.47,
    seed: 201,
    drift: 2.1,
    idea: {
      title: 'Recover exhaust heat',
      detail: 'A waste heat recovery unit on the turbine exhaust would supply about 9 MW to the hot oil loop and retire most heater firing.',
      energySaving: 9,
      co2Saving: 52,
      effort: 'High',
      status: 'In study',
    },
  },
  {
    id: 'heater',
    label: 'Hot oil heater',
    tag: '41-FA-4101',
    source: 'fuel',
    energy: 16,
    useful: 13,
    co2: 77,
    energyIntensity: 4.6,
    co2Intensity: 0.93,
    seed: 202,
    drift: -0.6,
    idea: {
      title: 'Retune burner excess air',
      detail: 'Trimming stack oxygen from 4.5% to 3% cuts fuel by about 0.6 MW with no hardware change.',
      energySaving: 0.6,
      co2Saving: 3,
      effort: 'Low',
      status: 'Planned',
    },
  },
  {
    id: 'flare',
    label: 'Flare and pilots',
    tag: '43-FL-4301',
    source: 'fuel',
    energy: 8,
    useful: 0,
    co2: 38,
    energyIntensity: 2.3,
    co2Intensity: 0.46,
    seed: 203,
    drift: 14.8,
    idea: {
      title: 'Restart the recompressor',
      detail: 'Flash gas has gone to flare since the 13:46 trip. Recovering it again removes about 5 MW of flared gas.',
      energySaving: 5,
      co2Saving: 24,
      effort: 'Low',
      status: 'Planned',
    },
  },
  {
    id: 'pumps',
    label: 'Export pumps',
    tag: '27-PA-2001A/B',
    source: 'power',
    energy: 9,
    useful: 7,
    co2: 4,
    energyIntensity: 2.6,
    co2Intensity: 0.05,
    seed: 204,
    drift: 0.4,
    idea: {
      title: 'Fit a variable speed drive',
      detail: 'Export pump A runs throttled. A variable speed drive would save about 1.8 MW at the current rate.',
      energySaving: 1.8,
      co2Saving: 0.8,
      effort: 'Medium',
      status: 'Proposed',
    },
  },
  {
    id: 'cooling',
    label: 'Cooling water',
    tag: '40-PA-4001',
    source: 'power',
    energy: 6,
    useful: 4,
    co2: 2,
    energyIntensity: 1.7,
    co2Intensity: 0.02,
    seed: 205,
    drift: 3.2,
    idea: {
      title: 'Clean the interstage cooler',
      detail: 'Work order WO-104471 restores the approach temperature and saves about 0.4 MW of pumping and 1.5 MW of compressor work.',
      energySaving: 1.9,
      co2Saving: 7.4,
      effort: 'Low',
      status: 'Planned',
    },
  },
  {
    id: 'utilities',
    label: 'Utilities and quarters',
    tag: 'NK-80',
    source: 'power',
    energy: 9,
    useful: 6,
    co2: 4,
    energyIntensity: 2.6,
    co2Intensity: 0.05,
    seed: 206,
    drift: -1.1,
    idea: {
      title: 'Heat the quarters by heat pump',
      detail: 'Replacing direct electric heating in the living quarters saves about 1.2 MW through the winter.',
      energySaving: 1.2,
      co2Saving: 0.5,
      effort: 'Medium',
      status: 'Proposed',
    },
  },
];

const ENERGY_SOURCE_NODES: readonly SankeyDiagramNode[] = [
  { id: 'fuel', label: 'Fuel gas', column: 0, series: 1 },
  { id: 'power', label: 'Power import', column: 0, series: 2 },
];

const ENERGY_CONSUMER_NODES: readonly SankeyDiagramNode[] = ENERGY_CONSUMERS.map((consumer) => ({ id: consumer.id, label: consumer.label, column: 1 }));

type EnergyFlow = {
  title: string;
  unit: string;
  decimals: number;
  nodes: readonly SankeyDiagramNode[];
  links: readonly SankeyDiagramLink[];
  total: number;
  description: string;
  footnote: string;
  label: string;
};

const ENERGY_FLOWS: Record<EnergyMode, EnergyFlow> = {
  energy: {
    title: 'Energy flow',
    unit: 'MW',
    decimals: 0,
    nodes: [
      ...ENERGY_SOURCE_NODES,
      ...ENERGY_CONSUMER_NODES,
      { id: 'work', label: 'Useful work', column: 2, series: 3 },
      { id: 'heat', label: 'Losses', column: 2 },
    ],
    links: ENERGY_CONSUMERS.flatMap((consumer) => [
      { source: consumer.source, target: consumer.id, value: consumer.energy },
      { source: consumer.id, target: 'work', value: consumer.useful, series: 3 as const },
      { source: consumer.id, target: 'heat', value: consumer.energy - consumer.useful, series: 'neutral' as const },
    ]),
    total: 108,
    description: '24-hour average · select a node or a ribbon to trace its path',
    footnote: 'Of 108 MW in, 51 MW becomes useful work and 57 MW is lost as heat, 39 MW of it up the gas turbine exhaust.',
    label: 'Energy flow from fuel gas and power import, through six consumers, to useful work and losses',
  },
  co2: {
    title: 'CO₂ flow',
    unit: 't/d',
    decimals: 0,
    nodes: [
      ...ENERGY_SOURCE_NODES,
      ...ENERGY_CONSUMER_NODES,
      { id: 'scope1', label: 'Direct, scope 1', column: 2, series: 1 },
      { id: 'scope2', label: 'Indirect, scope 2', column: 2, series: 2 },
    ],
    links: ENERGY_CONSUMERS.flatMap((consumer) => [
      { source: consumer.source, target: consumer.id, value: consumer.co2 },
      { source: consumer.id, target: consumer.source === 'fuel' ? 'scope1' : 'scope2', value: consumer.co2 },
    ]),
    total: 413,
    description: '24-hour total by reporting scope · select a node or a ribbon to trace its path',
    footnote: 'Of 413 t CO₂ a day, 403 t is burnt on site and the gas turbine alone accounts for 288 t; imported power adds 10 t.',
    label: 'CO₂ flow from fuel gas and power import, through six consumers, to direct and indirect emissions',
  },
};

const energyConsumer = (id: string): EnergyConsumer | undefined => ENERGY_CONSUMERS.find((consumer) => consumer.id === id);

/** The consumer a selection is about: the node itself, or the consumer end of a ribbon. */
function energyFocus(selection: SankeySelection | null, flow: EnergyFlow): EnergyConsumer | undefined {
  if (!selection) return undefined;
  if (selection.kind === 'node') return energyConsumer(selection.id);
  const link = flow.links.find((candidate) => sankeyLinkId(candidate) === selection.id);
  return link ? (energyConsumer(link.source) ?? energyConsumer(link.target)) : undefined;
}

function energyTrend(consumer: EnergyConsumer, mode: EnergyMode): number[] {
  const base = mode === 'energy' ? consumer.energy : consumer.co2;
  return makeValues({ seed: consumer.seed, points: 30, base, amplitude: base * 0.03, noise: base * 0.012, drift: (base * consumer.drift) / 100, decimals: 1 });
}

function EnergyDashFlowPanel({
  mode,
  selection,
  onSelect,
}: {
  mode: EnergyMode;
  selection: SankeySelection | null;
  onSelect: (selection: SankeySelection) => void;
}) {
  const flow = ENERGY_FLOWS[mode];

  return (
    <DashboardPanel title={flow.title} description={flow.description} footnote={flow.footnote}>
      <SankeyDiagram nodes={flow.nodes} links={flow.links} unit={flow.unit} decimals={flow.decimals} label={flow.label} selection={selection} onSelect={onSelect} />
    </DashboardPanel>
  );
}

function EnergyDashInspectorPanel({ mode, selection }: { mode: EnergyMode; selection: SankeySelection | null }) {
  const flow = ENERGY_FLOWS[mode];
  const consumer = energyFocus(selection, flow);

  if (!consumer) {
    const node = flow.nodes.find((candidate) => candidate.id === selection?.id);
    const flows = flow.links.filter((link) => link.source === node?.id || link.target === node?.id).sort((a, b) => b.value - a.value);
    const total = flows.reduce((sum, link) => sum + link.value, 0);
    return (
      <DashboardPanel title={node?.label ?? 'Inspector'} description={node ? `${formatValue((total / flow.total) * 100, 0)}% of the total · by consumer` : 'Nothing selected'}>
        {node ? (
          <>
            <ValueReadout value={total} unit={flow.unit} decimals={flow.decimals} size="lg" />
            <ul className="flex flex-col gap-2 border-t border-default pt-3">
              {flows.map((link) => {
                const other = link.source === node.id ? link.target : link.source;
                return (
                  <li key={sankeyLinkId(link)} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-base-foreground">{flow.nodes.find((candidate) => candidate.id === other)?.label}</span>
                    <span className="tabular-nums text-medium-foreground">
                      {formatValue(link.value, flow.decimals)} {flow.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">Select a consumer for its intensity, trend and abatement idea.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a node or a ribbon in the flow to inspect it.</p>
        )}
      </DashboardPanel>
    );
  }

  const value = mode === 'energy' ? consumer.energy : consumer.co2;
  const trend = energyTrend(consumer, mode);
  const first = trend[0] ?? value;
  const last = trend[trend.length - 1] ?? value;

  return (
    <DashboardPanel title={consumer.label} description={`${consumer.tag} · ${formatValue((value / flow.total) * 100, 0)}% of the plant total`}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{mode === 'energy' ? 'Energy use' : 'CO₂ emitted'}</p>
          <ValueReadout value={value} unit={flow.unit} decimals={flow.decimals} size="lg" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-xs text-muted-foreground">Intensity</p>
          <ValueReadout
            value={mode === 'energy' ? consumer.energyIntensity : consumer.co2Intensity}
            unit={mode === 'energy' ? 'kWh/boe' : 'kg/boe'}
            decimals={mode === 'energy' ? 1 : 2}
            size="sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-default pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">Last 30 days</p>
          <TrendDelta value={last} reference={first} format="percent" goodDirection="down" decimals={1} />
        </div>
        <Sparkline values={trend} label={`${consumer.label}, last 30 days`} variant="area" height={56} showLast unit={flow.unit} decimals={1} />
      </div>

      <div className="flex flex-col gap-1.5 border-t border-default pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Abatement idea</p>
          <Badge variant="secondary">{consumer.idea.status}</Badge>
        </div>
        <p className="text-sm font-medium text-base-foreground">{consumer.idea.title}</p>
        <p className="text-sm text-medium-foreground">{consumer.idea.detail}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Saves {formatValue(consumer.idea.energySaving, 1)} MW · {formatValue(consumer.idea.co2Saving, 1)} t CO₂/d · {consumer.idea.effort.toLowerCase()} effort
        </p>
      </div>
    </DashboardPanel>
  );
}

function EnergyDashBalancePanel({ mode }: { mode: EnergyMode }) {
  return mode === 'energy' ? (
    <DashboardPanel title="Balance" description="Where 108 MW ends up">
      <DistributionBar
        label="Energy balance"
        unit="MW"
        segments={[
          { id: 'work', label: 'Useful work', value: 51, colorClass: 'bg-chart-3-450' },
          { id: 'heat', label: 'Losses', value: 57, colorClass: 'bg-chart-neutral-300' },
        ]}
      />
      <p className="text-xs text-muted-foreground tabular-nums">
        Energy intensity {formatValue(PLANT_KPIS.energyIntensity.value, 1)} kWh/boe against a target of {formatValue(PLANT_KPIS.energyIntensity.target, 1)}.
      </p>
    </DashboardPanel>
  ) : (
    <DashboardPanel title="Balance" description="How 413 t CO₂ a day is reported">
      <DistributionBar
        label="CO₂ by scope"
        unit="t/d"
        segments={[
          { id: 'scope1', label: 'Direct, scope 1', value: 403, colorClass: 'bg-chart-1-450' },
          { id: 'scope2', label: 'Indirect, scope 2', value: 10, colorClass: 'bg-chart-2-450' },
        ]}
      />
      <p className="text-xs text-muted-foreground tabular-nums">Carbon intensity 4.97 kg CO₂/boe, of which the gas turbine is 3.47.</p>
    </DashboardPanel>
  );
}

function EnergyDashShortlistPanel({ selected, onSelect }: { selected: string | undefined; onSelect: (id: EnergyConsumerId) => void }) {
  const ranked = [...ENERGY_CONSUMERS].sort((a, b) => b.idea.co2Saving - a.idea.co2Saving);

  return (
    <DashboardPanel title="Abatement shortlist" description="One idea per consumer, largest CO₂ saving first · select a row to trace it in the flow">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 pl-3.5 font-medium">
              Idea
            </th>
            <th scope="col" className="w-24 pb-2 pr-3 text-right font-medium">
              Energy, MW
            </th>
            <th scope="col" className="w-24 pb-2 pr-3 text-right font-medium">
              CO₂, t/d
            </th>
            <th scope="col" className="w-20 pb-2 pr-3 font-medium">
              Effort
            </th>
            <th scope="col" className="w-24 pb-2 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((consumer) => {
            const isSelected = consumer.id === selected;
            return (
              <tr key={consumer.id} data-selected={isSelected} className={`border-t border-default align-top ${isSelected ? 'bg-[color-mix(in_oklab,var(--primary-background)_10%,transparent)]' : ''}`}>
                <td className={`border-l-2 py-2 pr-3 pl-2 ${isSelected ? 'border-l-[color:var(--primary-background)]' : 'border-l-transparent'}`}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(consumer.id)}
                    className="flex w-full cursor-pointer flex-col rounded-md px-1 text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[color:var(--ring-default)]"
                  >
                    <span className="font-medium text-base-foreground">{consumer.idea.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {consumer.label} · <span className="font-mono">{consumer.tag}</span>
                    </span>
                  </button>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">{formatValue(consumer.idea.energySaving, 1)}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">{formatValue(consumer.idea.co2Saving, 1)}</td>
                <td className="py-2 pr-3 text-medium-foreground">{consumer.idea.effort}</td>
                <td className="py-2 text-medium-foreground">{consumer.idea.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

/** Year to date on 12 March: day 71 of 365, against an annual permit of 160 kt CO₂. */
const ENERGY_PERMIT = { annual: 160, emitted: 29.3, allowance: 31.1, forecast: 150.7 };
const ENERGY_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function EnergyDashPermitPanel() {
  const share = (value: number): string => `${Math.round((value / ENERGY_PERMIT.annual) * 10000) / 100}%`;

  return (
    <DashboardPanel
      title="Emissions against permit"
      description="Year to date, 1 January to 12 March · annual permit 160 kt CO₂"
      footnote="29.3 kt emitted against an allowance of 31.1 kt at an even rate: 6% under pace. At today's rate the year ends at 150.7 kt, 94% of the permit."
    >
      <div className="flex flex-wrap gap-x-10 gap-y-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Emitted to date</p>
          <ValueReadout value={ENERGY_PERMIT.emitted} unit="kt" decimals={1} size="md" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Allowance to date</p>
          <ValueReadout value={ENERGY_PERMIT.allowance} unit="kt" decimals={1} size="md" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Forecast for the year</p>
          <ValueReadout value={ENERGY_PERMIT.forecast} unit="kt" decimals={1} size="md" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Headroom at year end</p>
          <ValueReadout value={ENERGY_PERMIT.annual - ENERGY_PERMIT.forecast} unit="kt" decimals={1} size="md" />
        </div>
      </div>
      <div
        role="img"
        aria-label="Emissions against the annual permit: 29.3 kilotonnes emitted, allowance to date 31.1, forecast 150.7 of 160"
        className="relative mt-2 h-5 w-full rounded-sm bg-chart-neutral-100"
      >
        <div className="absolute inset-y-0 left-0 rounded-sm bg-chart-1-200" style={{ width: share(ENERGY_PERMIT.forecast) }} />
        <div className="absolute inset-y-0 left-0 rounded-sm bg-chart-1-450" style={{ width: share(ENERGY_PERMIT.emitted) }} />
        <div className="absolute -inset-y-1.5 border-l-2 border-base-foreground" style={{ left: share(ENERGY_PERMIT.allowance) }} />
      </div>
      <div aria-hidden className="grid w-full grid-cols-12 text-xs text-muted-foreground">
        {ENERGY_MONTHS.map((month) => (
          <span key={month} className="border-l border-emphasized pl-1">
            {month}
          </span>
        ))}
      </div>
      <ul aria-label="Strip key" className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-xs bg-chart-1-450" /> Emitted
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-xs bg-chart-1-200" /> Forecast to year end
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 border-l-2 border-base-foreground" /> Allowance to date
        </li>
        <li>The full strip is the permit; each month is one twelfth of it.</li>
      </ul>
    </DashboardPanel>
  );
}

function EnergyDashDashboard() {
  // Archetype: flow-first. A diagram of where energy goes is the screen; an inspector explains
  //   whatever is selected in it, and a permit strip runs along the bottom.
  // Dominant element: the Sankey-style flow from fuel gas and power import, through the
  //   consumers, to useful work and losses (or to emission scopes).
  // Interaction: hover or select a node or ribbon to light its whole path and fill the inspector
  //   with that consumer's intensity, trend and abatement idea; pick an idea in the shortlist to
  //   trace it in the flow; switch the diagram between energy (MW) and CO₂ (t/d).
  const [mode, setMode] = useState<EnergyMode>('energy');
  const [selection, setSelection] = useState<SankeySelection | null>({ kind: 'node', id: 'turbine' });
  const focus = energyFocus(selection, ENERGY_FLOWS[mode]);

  const changeMode = (next: EnergyMode) => {
    setMode(next);
    // Sinks differ between the two diagrams, so a selection that does not exist in the new one
    // falls back to the consumer it belonged to.
    const exists = selection?.kind === 'node' && ENERGY_FLOWS[next].nodes.some((node) => node.id === selection.id);
    if (!exists) setSelection({ kind: 'node', id: focus?.id ?? 'turbine' });
  };

  return (
    <DashboardFrame
      title="Energy and emissions"
      subtitle="Nordkapp gas processing plant · 12 March 2026, 24-hour average"
      status={<StatusIndicator tone="success" label="Under permit pace" detail="6% headroom" />}
      actions={
        <SegmentedControl value={mode} onValueChange={(value) => changeMode(value === 'co2' ? 'co2' : 'energy')}>
          <SegmentedControlList size="small" aria-label="Quantity shown in the flow">
            <SegmentedControlButton value="energy">Energy, MW</SegmentedControlButton>
            <SegmentedControlButton value="co2">CO₂, t/d</SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      }
    >
      <DashboardGrid>
        <DashboardCell span={8}>
          <EnergyDashFlowPanel mode={mode} selection={selection} onSelect={setSelection} />
        </DashboardCell>
        <DashboardCell span={4}>
          <div className="flex min-w-0 flex-col gap-4 [&>*:first-child]:flex-1">
            <EnergyDashInspectorPanel mode={mode} selection={selection} />
            <EnergyDashBalancePanel mode={mode} />
          </div>
        </DashboardCell>
        <DashboardCell span={12}>
          <EnergyDashShortlistPanel selected={focus?.id} onSelect={(id) => setSelection({ kind: 'node', id })} />
        </DashboardCell>
        <DashboardCell span={12}>
          <EnergyDashPermitPanel />
        </DashboardCell>
      </DashboardGrid>
    </DashboardFrame>
  );
}

function EnergyDashSignature() {
  return (
    <ThemeScope preset="aurora" className="w-full">
      <EnergyDashDashboard />
    </ThemeScope>
  );
}

function EnergyDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <EnergyDashDashboard />
    </ThemeScope>
  );
}

function EnergyDashNordicNight() {
  return (
    <ThemeScope preset="nordic-night" className="w-full">
      <EnergyDashDashboard />
    </ThemeScope>
  );
}

function EnergyDashBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <EnergyDashDashboard />
    </ThemeScope>
  );
}

function EnergyDashPanelFlow() {
  const [selection, setSelection] = useState<SankeySelection | null>({ kind: 'node', id: 'pumps' });

  return <EnergyDashFlowPanel mode="energy" selection={selection} onSelect={setSelection} />;
}

function EnergyDashPanelInspector() {
  return <EnergyDashInspectorPanel mode="energy" selection={{ kind: 'node', id: 'pumps' }} />;
}

function EnergyDashPanelCarbonFlow() {
  const [selection, setSelection] = useState<SankeySelection | null>(null);

  return <EnergyDashFlowPanel mode="co2" selection={selection} onSelect={setSelection} />;
}

function EnergyDashPanelSourceInspector() {
  return <EnergyDashInspectorPanel mode="co2" selection={{ kind: 'node', id: 'fuel' }} />;
}

function EnergyDashPanelBalance() {
  return <EnergyDashBalancePanel mode="energy" />;
}

function EnergyDashPanelPermit() {
  return <EnergyDashPermitPanel />;
}

function EnergyDashPanelShortlist() {
  const [selected, setSelected] = useState<EnergyConsumerId>('flare');

  return <EnergyDashShortlistPanel selected={selected} onSelect={setSelected} />;
}

export default definePage({
  id: 'energy-and-emissions-dashboard',
  title: 'Energy and emissions',
  summary:
    'Where the energy goes and what it emits. A flow diagram from fuel gas and imported power, through every consumer, to useful work and losses is the screen; select any part of it to see intensity, trend and the best abatement idea, with the year against the emissions permit along the bottom.',
  guidance: {
    use: [
      'For energy management and emissions reporting, where the question is where it all goes.',
      'When a few large consumers dominate and the eye should find them without reading numbers.',
      'Let the same diagram answer in energy and in CO₂; the shapes differ and that is the insight.',
      'Pair every consumer with one concrete abatement idea, sized in MW and tonnes.',
    ],
    avoid: [
      'More than about eight nodes in a column; group the small consumers.',
      'Colouring every consumer. Colour the sources and the outcomes; the middle stays neutral.',
      'A flow diagram for values that do not add up; ribbons promise a balance.',
      'Showing permit status as a gauge. A strip shows pace, forecast and limit on one scale.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Aurora theme. Hover or select a node or a ribbon to light its path and fill the inspector, pick an idea in the shortlist, or switch the flow between energy and CO₂.',
      specimens: [
        {
          id: 'EnergyDashSignature',
          title: 'Energy and emissions',
          note: 'Pick it when the story is a balance: what comes in, who uses it and what is lost or emitted.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'experiences/journeys/SankeyDiagram.tsx',
            'experiences/journeys/sankeyLayout.ts',
            'industrial/operations/DistributionBar.tsx',
            'industrial/Sparkline.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/TrendDelta.tsx',
            'industrial/ValueReadout.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: EnergyDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'EnergyDashAura',
          title: 'Aura',
          note: 'Pick it when the dashboard sits among other Fusion pages and should not stand apart.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: EnergyDashAura,
        },
        {
          id: 'EnergyDashNordicNight',
          title: 'Nordic night',
          note: 'Pick it for a view that stays open all shift: teal on tinted dark surfaces.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: EnergyDashNordicNight,
        },
        {
          id: 'EnergyDashBlueprint',
          title: 'Blueprint',
          note: 'Pick it for process engineers: blue accents, tinted panels and sharp corners.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: EnergyDashBlueprint,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'EnergyDashPanelFlow',
          title: 'Energy flow',
          note: 'Pick it to show a balance from sources through consumers to outcomes, with a selectable path.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'experiences/journeys/SankeyDiagram.tsx', 'experiences/journeys/sankeyLayout.ts'],
          Component: EnergyDashPanelFlow,
        },
        {
          id: 'EnergyDashPanelInspector',
          title: 'Consumer inspector',
          note: 'Pick it beside a diagram to explain the selected consumer: value, intensity, trend and one idea.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/Sparkline.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          Component: EnergyDashPanelInspector,
        },
        {
          id: 'EnergyDashPanelCarbonFlow',
          title: 'CO₂ flow',
          note: 'Pick it for emissions reporting: the same consumers, sized by tonnes and ending in reporting scopes.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'experiences/journeys/SankeyDiagram.tsx', 'experiences/journeys/sankeyLayout.ts'],
          Component: EnergyDashPanelCarbonFlow,
        },
        {
          id: 'EnergyDashPanelSourceInspector',
          title: 'Source inspector',
          note: 'Pick it when a source or an outcome is selected: its total and the flows that make it up.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/ValueReadout.tsx'],
          Component: EnergyDashPanelSourceInspector,
        },
        {
          id: 'EnergyDashPanelPermit',
          title: 'Permit strip',
          note: 'Pick it to show pace against an annual limit: emitted, allowance to date and forecast on one scale.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/ValueReadout.tsx'],
          Component: EnergyDashPanelPermit,
        },
        {
          id: 'EnergyDashPanelBalance',
          title: 'Balance',
          note: 'Pick it as the one-line answer under an inspector: how the total splits into two outcomes.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/operations/DistributionBar.tsx'],
          Component: EnergyDashPanelBalance,
        },
        {
          id: 'EnergyDashPanelShortlist',
          title: 'Abatement shortlist',
          note: 'Pick it to rank improvement ideas by saving, with effort and status, and link each to its consumer.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: EnergyDashPanelShortlist,
        },
      ],
    },
  ],
});
