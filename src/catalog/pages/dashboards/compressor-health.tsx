import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconAlertTriangle, IconCircleCheck, IconEngine, IconSettings, IconWind } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { Spectrum, type SpectrumPeak } from '../../../library/kit/compressor-health/Spectrum';
import { TrainSchematic, type TrainReadout, type TrainStage, type TrainStageId } from '../../../library/kit/compressor-health/TrainSchematic';
import { HeatStrip } from '../../../library/kit/HeatStrip';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SparkLine } from '../../../library/kit/SparkLine';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { LookScope } from '../../../library/looks/LookScope';
import { createRandom, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './compressor-health.tsx?raw';

type ChGauge = { label: string; value: number; min?: number; max: number; unit: string; decimals?: number; tone: Tone };

type ChStage = TrainStage & {
  tag: string;
  state: string;
  health: number;
  /** One sentence a rotating equipment engineer would write. */
  reading: string;
  gauges: ChGauge[];
  /** Running speed in Hz and the amplitudes of the named peaks, mm/s. */
  spectrum: { seed: number; order: number; peaks: { multiple: number; label: string; amplitude: number }[]; alarm: number; probe: string };
  icon: ReactNode;
};

const CH_STAGES: ChStage[] = [
  {
    id: 'turbine',
    label: 'Gas turbine',
    tag: '23-GT-9001',
    tone: 'success',
    state: 'Good',
    health: 85,
    reading: 'Exhaust spread is even across all burners; the 1× peak is small and steady.',
    gauges: [
      { label: 'Load', value: 92, max: 100, unit: '%', tone: 'accent' },
      { label: 'Exhaust temperature', value: 512, min: 300, max: 600, unit: '°C', tone: 'success' },
      { label: 'Vibration', value: 2.4, max: 11, unit: 'mm/s', decimals: 1, tone: 'success' },
      { label: 'Lube oil', value: 61, min: 20, max: 90, unit: '°C', tone: 'success' },
    ],
    spectrum: { seed: 5, order: 100, peaks: [{ multiple: 1, label: '1×', amplitude: 1.8 }, { multiple: 2, label: '2×', amplitude: 0.7 }, { multiple: 7.2, label: 'Blade pass', amplitude: 1.1 }], alarm: 7.1, probe: 'Turbine drive end' },
    icon: <IconWind />,
  },
  {
    id: 'gearbox',
    label: 'Gearbox',
    tag: '23-GB-9002',
    tone: 'success',
    state: 'Good',
    health: 90,
    reading: 'Gear mesh amplitude unchanged since the last oil change; no sidebands.',
    gauges: [
      { label: 'Ratio load', value: 88, max: 100, unit: '%', tone: 'accent' },
      { label: 'Oil temperature', value: 68, min: 20, max: 95, unit: '°C', tone: 'success' },
      { label: 'Vibration', value: 1.9, max: 11, unit: 'mm/s', decimals: 1, tone: 'success' },
      { label: 'Oil pressure', value: 2.6, max: 4, unit: 'bar', decimals: 1, tone: 'success' },
    ],
    spectrum: { seed: 6, order: 100, peaks: [{ multiple: 1, label: 'Input 1×', amplitude: 1.1 }, { multiple: 2.6, label: 'Output 1×', amplitude: 1.4 }, { multiple: 8.2, label: 'Gear mesh', amplitude: 1.7 }], alarm: 7.1, probe: 'Gearbox output bearing' },
    icon: <IconSettings />,
  },
  {
    id: 'lp',
    label: '1st stage compressor',
    tag: '23-KA-9101',
    tone: 'warning',
    state: 'Watch',
    health: 72,
    reading: 'A growing 1× peak with a clean 2× points to unbalance at the drive end, not misalignment.',
    gauges: [
      { label: 'Vibration', value: 6.8, max: 11, unit: 'mm/s', decimals: 1, tone: 'warning' },
      { label: 'Bearing temperature', value: 86, min: 20, max: 120, unit: '°C', tone: 'success' },
      { label: 'Efficiency', value: 79.4, min: 60, max: 90, unit: '%', decimals: 1, tone: 'accent' },
      { label: 'Surge margin', value: 14, max: 40, unit: '%', tone: 'warning' },
    ],
    spectrum: { seed: 7, order: 164, peaks: [{ multiple: 1, label: '1×', amplitude: 5.9 }, { multiple: 2, label: '2×', amplitude: 1.2 }, { multiple: 5, label: 'Vane pass', amplitude: 2.1 }], alarm: 7.1, probe: 'Drive-end bearing' },
    icon: <IconEngine />,
  },
  {
    id: 'hp',
    label: '2nd stage compressor',
    tag: '23-KA-9102',
    tone: 'success',
    state: 'Good',
    health: 88,
    reading: 'All peaks under 2 mm/s. Seal oil filters were changed on Tuesday.',
    gauges: [
      { label: 'Vibration', value: 3.1, max: 11, unit: 'mm/s', decimals: 1, tone: 'success' },
      { label: 'Bearing temperature', value: 74, min: 20, max: 120, unit: '°C', tone: 'success' },
      { label: 'Efficiency', value: 82.1, min: 60, max: 90, unit: '%', decimals: 1, tone: 'accent' },
      { label: 'Surge margin', value: 21, max: 40, unit: '%', tone: 'success' },
    ],
    spectrum: { seed: 8, order: 164, peaks: [{ multiple: 1, label: '1×', amplitude: 1.9 }, { multiple: 2, label: '2×', amplitude: 0.8 }, { multiple: 5, label: 'Vane pass', amplitude: 1.3 }], alarm: 7.1, probe: 'Drive-end bearing' },
    icon: <IconEngine />,
  },
];

const CH_READOUTS: TrainReadout[] = [
  { id: 'exhaust', label: 'Exhaust temperature', value: '512 °C', at: [244, 150], chip: [118, 126] },
  { id: 'suction', label: 'Suction pressure', value: '12.4 barg', at: [352, 90], chip: [290, 34] },
  { id: 'dist', label: 'Discharge temperature', value: '141.2 °C', at: [565, 124], chip: [478, 34], tone: 'warning', state: 'Near limit' },
  { id: 'cooler', label: 'Cooler outlet', value: '38.9 °C', at: [640, 68], chip: [668, 22], tone: 'warning', state: 'High' },
  { id: 'disp', label: 'Discharge pressure', value: '48.6 barg', at: [870, 90], chip: [880, 150] },
  { id: 'speed', label: 'Shaft speed', value: '9 840 rpm', at: [627, 262], chip: [615, 394] },
  { id: 'vib1', label: 'Drive-end vibration', value: '6.8 mm/s', at: [394, 268], chip: [400, 394], tone: 'warning', state: 'Near limit' },
  { id: 'vib2', label: '2nd stage vibration', value: '3.1 mm/s', at: [838, 268], chip: [862, 394], tone: 'success' },
  { id: 'flow', label: 'Gas flow', value: '182 400 Sm³/h', at: [930, 90], chip: [905, 34] },
];

const CH_STATE_TONE: Record<string, Tone> = { Good: 'success', Watch: 'warning' };

function chStage(id: TrainStageId): ChStage {
  return CH_STAGES.find((stage) => stage.id === id) ?? CH_STAGES[0];
}

const CH_MAX_HZ = 1000;

function chBins({ seed, order, peaks }: ChStage['spectrum']): number[] {
  const random = createRandom(seed);
  return Array.from({ length: 201 }, (_, index) => {
    const hz = (index / 200) * CH_MAX_HZ;
    const floor = 0.12 + random() * 0.14 + 0.25 * Math.exp(-hz / 60);
    const lines = peaks.reduce((sum, peak) => sum + peak.amplitude * Math.exp(-(((hz - peak.multiple * order) / 7) ** 2)), 0);
    return Math.round((floor + lines) * 100) / 100;
  });
}

function chPeaks({ order, peaks }: ChStage['spectrum']): SpectrumPeak[] {
  return peaks.map((peak) => ({ frequency: Math.round((peak.multiple * order) / 5) * 5, label: peak.label }));
}

function ChSpectrum({ stage, height = 220 }: { stage: ChStage; height?: number }) {
  return (
    <Spectrum
      label={`Velocity spectrum, ${stage.label.toLowerCase()}, ${stage.spectrum.probe.toLowerCase()}`}
      bins={chBins(stage.spectrum)}
      maxFrequency={CH_MAX_HZ}
      peaks={chPeaks(stage.spectrum)}
      limit={{ value: stage.spectrum.alarm, label: 'Alarm' }}
      tone={stage.tone === 'warning' ? 'warning' : 'accent'}
      height={height}
    />
  );
}

function ChGauges({ stage, size = 104 }: { stage: ChStage; size?: number }) {
  return (
    <div className="grid grid-cols-4 items-start gap-3">
      {stage.gauges.map((gauge) => (
        <RingGauge key={gauge.label} label={gauge.label} value={gauge.value} min={gauge.min} max={gauge.max} unit={gauge.unit} decimals={gauge.decimals} tone={gauge.tone} size={size} />
      ))}
    </div>
  );
}

function ChDock({ selectedId, onSelect }: { selectedId: TrainStageId; onSelect: (id: TrainStageId) => void }) {
  return (
    <div role="toolbar" aria-label="Stage" className="flex items-stretch gap-1.5 rounded-3xl border border-(--kit-rule) bg-(--kit-surface) p-1.5 shadow-2xl backdrop-blur-xl">
      {CH_STAGES.map((stage) => {
        const selected = stage.id === selectedId;
        return (
          <button
            key={stage.id}
            type="button"
            aria-pressed={selected}
            data-tone={stage.tone}
            onClick={() => onSelect(stage.id)}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-(--kit-text) ${selected ? 'bg-(--kit-text) text-(--kit-halo)' : 'text-(--kit-text) hover:bg-(--kit-track)'}`}
          >
            <span aria-hidden="true" className="[&>svg]:size-5">
              {stage.icon}
            </span>
            <span>
              <span className="block text-sm leading-5 font-semibold whitespace-nowrap">{stage.label}</span>
              <span className={`block text-xs leading-4 font-medium tabular-nums ${selected ? '' : 'text-(--t-ink)'}`}>
                {stage.state} · {stage.health}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ChStatePill({ stage, size }: { stage: ChStage; size?: 'md' | 'lg' }) {
  return (
    <StatusPill tone={CH_STATE_TONE[stage.state] ?? 'neutral'} size={size} icon={stage.state === 'Good' ? <IconCircleCheck /> : <IconAlertTriangle />}>
      {stage.state}
    </StatusPill>
  );
}

function CompressorHealthSignature() {
  const [selectedId, setSelectedId] = useState<TrainStageId>('lp');
  const stage = chStage(selectedId);

  return (
    <LookScope look="glass">
      <Canvas className="relative flex flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-(--kit-text-3)">Nordkapp · gas compression · train A</p>
            <p className="text-4xl font-semibold tracking-tight">Compressor health</p>
            <p className="mt-1 max-w-2xl text-base text-(--kit-text-2)">
              Train health is <span className="font-semibold text-(--kit-text) tabular-nums">78 of 100</span>. Drive-end vibration on the 1st stage is{' '}
              <span className="font-semibold text-(--kit-text) tabular-nums">0.3 mm/s under its alarm</span> and rising.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
              Watch
            </StatusPill>
            <StatusPill tone="neutral" size="lg">
              Running · 92 % load
            </StatusPill>
          </div>
        </header>

        <TrainSchematic label="Compressor train A in cross-section with live tags" stages={CH_STAGES} selectedId={selectedId} onSelect={setSelectedId} readouts={CH_READOUTS} className="mt-2 mb-8" />

        <div className="grid grid-cols-12 gap-4">
          <Panel className="col-span-6" title={stage.label} subtitle={`${stage.tag} · health ${stage.health} of 100`} actions={<ChStatePill stage={stage} />} tone={stage.tone === 'warning' ? 'warning' : 'accent'}>
            <div className="flex flex-1 flex-col justify-between gap-5">
              <ChGauges stage={stage} />
              <p className="border-t border-(--kit-rule) pt-3 text-sm text-(--kit-text-2)">{stage.reading}</p>
            </div>
          </Panel>
          <Panel className="col-span-6" title="Vibration spectrum" subtitle={`${stage.spectrum.probe} · velocity, mm/s`}>
            <ChSpectrum stage={stage} height={210} />
          </Panel>
        </div>

        <div className="flex justify-center pt-2">
          <ChDock selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </Canvas>
    </LookScope>
  );
}

const CH_DAYS = ['Fri 6', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11', 'Thu 12'];

const CH_PROBES = {
  de: { label: 'Drive end', tag: '23-VT-92540', values: makeValues({ seed: 91, points: 29, base: 5.6, amplitude: 0.25, noise: 0.12, drift: 1.2, cycles: 3, decimals: 1 }), now: 6.8 },
  nde: { label: 'Non-drive end', tag: '23-VT-92541', values: makeValues({ seed: 92, points: 29, base: 3.4, amplitude: 0.2, noise: 0.1, drift: 0.3, cycles: 3, decimals: 1 }), now: 3.7 },
  axial: { label: 'Axial', tag: '23-ZT-92545', values: makeValues({ seed: 93, points: 29, base: 2.1, amplitude: 0.15, noise: 0.08, drift: 0.1, cycles: 3, decimals: 1 }), now: 2.2 },
};

type ChProbeId = keyof typeof CH_PROBES;

function isChProbe(value: unknown): value is ChProbeId {
  return typeof value === 'string' && value in CH_PROBES;
}

const CH_TREND_LABELS = Array.from({ length: 29 }, (_, index) => CH_DAYS[Math.min(Math.floor(index / 4), 6)]);

const CH_FAULTS: { label: string; value: number; tone: Tone; note: string }[] = [
  { label: 'Unbalance', value: 62, tone: 'warning', note: '1× dominant, phase steady' },
  { label: 'Misalignment', value: 21, tone: 'accent', note: '2× low, axial quiet' },
  { label: 'Bearing wear', value: 12, tone: 'accent', note: 'No sub-synchronous energy' },
  { label: 'Looseness', value: 5, tone: 'accent', note: 'No harmonics above 5×' },
];

function ChFaults() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      {CH_FAULTS.map((fault) => (
        <div key={fault.label}>
          <Meter label={fault.label} value={fault.value} max={100} unit="%" tone={fault.tone} hideScale />
          <p className="mt-1 text-xs text-(--kit-text-3)">{fault.note}</p>
        </div>
      ))}
    </div>
  );
}

function CompressorHealthDiagnostics() {
  const [probeId, setProbeId] = useState<ChProbeId>('de');
  const probe = CH_PROBES[probeId];
  const values = [...probe.values.slice(0, -1), probe.now];

  return (
    <LookScope look="glass">
      <Canvas className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-(--kit-text-3)">
              1st stage compressor · <TagId>23-KA-9101</TagId>
            </p>
            <p className="text-3xl font-semibold tracking-tight">Vibration diagnostics</p>
          </div>
          <SegmentedControl value={probeId} onValueChange={(next) => setProbeId(isChProbe(next) ? next : 'de')}>
            <SegmentedControlList size="small" aria-label="Probe">
              <SegmentedControlButton value="de">Drive end</SegmentedControlButton>
              <SegmentedControlButton value="nde">Non-drive end</SegmentedControlButton>
              <SegmentedControlButton value="axial">Axial</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        </header>
        <div className="grid grid-cols-12 gap-4">
          <Panel className="col-span-8" tone="accent">
            <TrendArea
              label={`${probe.label} vibration over the last seven days against alarm and trip limits`}
              series={[{ id: 'vibration', label: `${probe.label} vibration`, values, tone: probeId === 'de' ? 'warning' : 'accent' }]}
              labels={CH_TREND_LABELS}
              unit="mm/s"
              decimals={1}
              limits={[
                { value: 7.1, label: 'Alarm', tone: 'warning' },
                { value: 11, label: 'Trip', tone: 'critical' },
              ]}
              yDomain={[0, 12]}
              height={330}
              highlightLast
              headline={
                <div>
                  <p className="text-sm text-(--kit-text-3)">
                    {probe.label} · <TagId>{probe.tag}</TagId>
                  </p>
                  <p className="text-5xl font-semibold tracking-tight tabular-nums">
                    {probe.now.toFixed(1)} <span className="text-lg font-medium text-(--kit-text-2)">mm/s</span>
                  </p>
                </div>
              }
            />
          </Panel>
          <Panel className="col-span-4" title="Likely cause" subtitle="From the spectrum shape and phase">
            <ChFaults />
          </Panel>
          <Panel className="col-span-7" title="Bearing temperatures" subtitle="Against the 105 °C alarm">
            <Bars
              label="Bearing temperatures of the 1st stage compressor"
              orientation="horizontal"
              categories={['Drive-end journal', 'Non-drive-end journal', 'Thrust, active', 'Thrust, inactive']}
              series={[{ id: 'temperature', label: 'Temperature', values: [86, 78, 91, 72] }]}
              tones={['accent', 'accent', 'warning', 'accent']}
              unit="°C"
              limit={{ value: 105, label: 'Alarm', tone: 'critical' }}
              showValues
              height={210}
            />
          </Panel>
          <Panel className="col-span-5" title="When it shakes" subtitle="Drive-end vibration by four-hour block, 7 days">
            <div className="flex flex-1 flex-col justify-center">
              <HeatStrip
                label="Drive-end vibration by four-hour block over the last seven days"
                rows={CH_DAYS.map((day, index) => ({ label: day, values: makeValues({ seed: 120 + index, points: 6, base: 5.4 + index * 0.2, amplitude: 0.6, noise: 0.3 }) }))}
                axis={['00:00', '24:00']}
                max={7.5}
                tone="warning"
              />
            </div>
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

function CompressorHealthRound() {
  const [selectedId, setSelectedId] = useState<TrainStageId>('lp');

  return (
    <LookScope look="glass" className="mx-auto w-full max-w-[760px]">
      <Canvas className="flex flex-col gap-4 rounded-[32px]">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-(--kit-text-3)">Operator round · tablet</p>
            <p className="text-2xl font-semibold tracking-tight">Train A, stage by stage</p>
          </div>
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            1 stage to watch
          </StatusPill>
        </header>
        <Panel padding="tight">
          <TrainSchematic label="Compressor train A" stages={CH_STAGES} selectedId={selectedId} onSelect={setSelectedId} hideNames />
        </Panel>
        <ul className="flex flex-col gap-3">
          {CH_STAGES.map((stage) => {
            const selected = stage.id === selectedId;
            const lead = stage.gauges[stage.id === 'lp' || stage.id === 'hp' ? 0 : 2];
            return (
              <li key={stage.id}>
                <button type="button" aria-pressed={selected} onClick={() => setSelectedId(stage.id)} className="block w-full cursor-pointer rounded-3xl text-left outline-none focus-visible:ring-2 focus-visible:ring-(--kit-text)">
                  <Panel padding="tight" tone={selected ? (stage.tone === 'warning' ? 'warning' : 'accent') : 'neutral'}>
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_7rem_auto] items-center gap-4 px-2">
                      <RingGauge label={`${stage.label} health`} value={stage.health} unit="" size={60} tone={stage.tone} hideLabel />
                      <div>
                        <p className="text-base font-semibold">{stage.label}</p>
                        <p className="text-sm text-(--kit-text-2) tabular-nums">
                          {lead.label} {lead.value} {lead.unit}
                        </p>
                      </div>
                      <SparkLine
                        label={`${stage.label} vibration, last 24 hours`}
                        values={makeValues({ seed: stage.spectrum.seed + 40, points: 16, base: lead.value * 0.9, noise: lead.value * 0.03, drift: lead.value * 0.1, decimals: 2 })}
                        tone={stage.tone}
                        className="h-9 w-28"
                        highlightLast
                      />
                      <ChStatePill stage={stage} />
                    </div>
                  </Panel>
                </button>
              </li>
            );
          })}
        </ul>
      </Canvas>
    </LookScope>
  );
}

function CompressorHealthSchematic() {
  const [selectedId, setSelectedId] = useState<TrainStageId>('hp');
  return (
    <LookScope look="glass">
      <Canvas>
        <TrainSchematic label="Compressor train, stages only" stages={CH_STAGES} selectedId={selectedId} onSelect={setSelectedId} />
      </Canvas>
    </LookScope>
  );
}

function CompressorHealthReadouts() {
  return (
    <LookScope look="glass" className="h-full">
      <Canvas className="flex h-full flex-col justify-center gap-3">
        {CH_READOUTS.filter((readout) => ['suction', 'dist', 'vib1', 'vib2'].includes(readout.id)).map((readout) => (
          <div key={readout.id} data-tone={readout.tone ?? 'neutral'} className="flex items-center justify-between gap-3 rounded-xl border border-(--kit-rule) bg-(--kit-surface) px-4 py-2.5 backdrop-blur-xl">
            <span className="text-sm text-(--kit-text-2)">{readout.label}</span>
            <span className="flex items-baseline gap-2 text-base font-semibold tabular-nums">
              {readout.value}
              {readout.state ? <span className="text-xs text-(--t-ink)">{readout.state}</span> : null}
            </span>
          </div>
        ))}
      </Canvas>
    </LookScope>
  );
}

function CompressorHealthGauges() {
  const stage = chStage('lp');
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel title={stage.label} subtitle={`${stage.tag} · four figures that decide the state`} actions={<ChStatePill stage={stage} />} tone="warning">
          <ChGauges stage={stage} size={92} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function CompressorHealthSpectrum() {
  const stage = chStage('gearbox');
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel title="Vibration spectrum" subtitle={`${stage.label} · ${stage.spectrum.probe.toLowerCase()}`}>
          <ChSpectrum stage={stage} height={200} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function CompressorHealthDock() {
  const [selectedId, setSelectedId] = useState<TrainStageId>('turbine');
  return (
    <LookScope look="glass">
      <Canvas className="flex justify-center">
        <ChDock selectedId={selectedId} onSelect={setSelectedId} />
      </Canvas>
    </LookScope>
  );
}

function CompressorHealthFaults() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel title="Likely cause" subtitle="1st stage, drive end">
          <ChFaults />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function CompressorHealthEvents() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Panel title="Train events" subtitle="Last 30 days">
          <ul>
            <ListRow tone="critical" title="Recompressor trip on high vibration" meta={<TagId>23-KA-9103</TagId>} trailing="Today 13:46" />
            <ListRow tone="warning" title="Drive-end vibration above 6.5 mm/s" meta={<TagId>23-VT-92540</TagId>} trailing="Today 12:02" />
            <ListRow tone="info" title="Seal oil filters changed" meta={<TagId>23-KA-9102</TagId>} trailing="Tue 10 Mar" />
            <ListRow tone="info" title="Borescope inspection, hot section" meta={<TagId>23-GT-9001</TagId>} trailing="Wed 11 Mar" />
          </ul>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'compressor-health',
  title: 'Compressor health',
  summary:
    'One compressor train in depth: the machine drawn in cross-section with live tags pinned to it, and ring gauges and a vibration spectrum that follow the selected stage.',
  guidance: {
    use: [
      'When the reader thinks in terms of the machine: put the drawing first and pin values where they are measured.',
      'Let one selection drive everything below the drawing, so the screen always answers “what about this stage?”.',
      'Name the peaks in a spectrum; an unlabelled trace only helps the specialist.',
    ],
    avoid: [
      'KPI tiles above the machine; say the train health in one sentence under the title.',
      'More than about ten pinned tags — the drawing must stay readable under them.',
      'Animating the gas path by default on a screen that is watched for hours.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The train in the glass look with a floating stage dock.',
      specimens: [
        {
          id: 'CompressorHealthSignature',
          title: 'Train cross-section',
          note: 'Pick it for a rotating equipment engineer’s home screen: select a stage on the drawing or in the dock.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/compressor-health/TrainSchematic.tsx', 'kit/compressor-health/Spectrum.tsx', 'kit/RingGauge.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: CompressorHealthSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The diagnostics page behind one stage, and the train as a tablet round.',
      specimens: [
        {
          id: 'CompressorHealthDiagnostics',
          title: 'Vibration diagnostics',
          note: 'Pick it when a stage is on watch and the question is why: trend against limits, likely cause, bearings.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/TrendArea.tsx', 'kit/Meter.tsx', 'kit/Bars.tsx', 'kit/HeatStrip.tsx'],
          Component: CompressorHealthDiagnostics,
        },
        {
          id: 'CompressorHealthRound',
          title: 'Round on a tablet',
          note: 'Pick it for the operator at the machine: one row per stage, the drawing as the index.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/compressor-health/TrainSchematic.tsx', 'kit/RingGauge.tsx', 'kit/SparkLine.tsx'],
          Component: CompressorHealthRound,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the train screen on their own.',
      specimens: [
        {
          id: 'CompressorHealthSchematic',
          title: 'Schematic without tags',
          note: 'Use the bare drawing as a stage picker or an illustration.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/compressor-health/TrainSchematic.tsx'],
          Component: CompressorHealthSchematic,
        },
        {
          id: 'CompressorHealthReadouts',
          title: 'Readout chips',
          note: 'Use them for live tags; a state word appears only when the value is not normal.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: CompressorHealthReadouts,
        },
        {
          id: 'CompressorHealthGauges',
          title: 'Stage gauges',
          note: 'Use four rings for the figures that decide a stage’s state.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/RingGauge.tsx', 'kit/Panel.tsx'],
          Component: CompressorHealthGauges,
        },
        {
          id: 'CompressorHealthSpectrum',
          title: 'Spectrum',
          note: 'Use it wherever a vibration signature needs its peaks named.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/compressor-health/Spectrum.tsx'],
          Component: CompressorHealthSpectrum,
        },
        {
          id: 'CompressorHealthDock',
          title: 'Stage dock',
          note: 'Use a floating dock when navigation must not take space from the drawing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: CompressorHealthDock,
        },
        {
          id: 'CompressorHealthFaults',
          title: 'Likely cause',
          note: 'Use ranked likelihoods to turn a spectrum into a next step.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Meter.tsx'],
          Component: CompressorHealthFaults,
        },
        {
          id: 'CompressorHealthEvents',
          title: 'Train events',
          note: 'Use it to place today’s readings in the machine’s recent history.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/ListRow.tsx'],
          Component: CompressorHealthEvents,
        },
      ],
    },
  ],
});
