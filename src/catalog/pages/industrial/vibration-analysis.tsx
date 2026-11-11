import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconActivity, IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconClipboardList, IconWaveSine } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { MachineTrain, type TrainMachine, type TrainPoint } from '../../../library/kit/vibration-analysis/MachineTrain';
import { OrbitPlot } from '../../../library/kit/vibration-analysis/OrbitPlot';
import {
  ISO_GROUP1_RIGID,
  ISO_ZONES,
  ISO_ZONE_MEANING,
  ISO_ZONE_TONE,
  ISO_ZONE_WORD,
  bandLevels,
  crestFactor,
  findPeaks,
  isoZone,
  machineComponents,
  orbitPoints,
  overall,
  peak,
  readPeak,
  rms,
  synthSpectrum,
  synthWaveform,
  type FrequencyBand,
  type IsoZone,
  type MachineCondition,
  type SpectrumLine,
  type VibrationComponent,
} from '../../../library/kit/vibration-analysis/signal';
import { SpectrumPlot, type SpectrumMarker, type SpectrumMaskStep } from '../../../library/kit/vibration-analysis/SpectrumPlot';
import { WaterfallPlot } from '../../../library/kit/vibration-analysis/WaterfallPlot';
import { WaveformPlot } from '../../../library/kit/vibration-analysis/WaveformPlot';
import { ZoneBar } from '../../../library/kit/vibration-analysis/ZoneBar';
import { LookScope } from '../../../library/looks/LookScope';
import { definePage } from '../../types';

import source from './vibration-analysis.tsx?raw';

const VIB_RUN_HZ = 24.7;

const VIB_BPFO_HZ = 88.6;

const VIB_VANES = 5;

const VIB_MAX_HZ = 400;

const VIB_CONTEXT = { runningHz: VIB_RUN_HZ, bearingHz: VIB_BPFO_HZ, vanes: VIB_VANES };

const VIB_PUMP = '27-PA-2001A · Export pump A';

type VibPointDef = { id: string; label: string; at: number; condition: MachineCondition; seed: number };

type VibReading = { components: VibrationComponent[]; lines: SpectrumLine[]; overall: number; zone: IsoZone };

function vibPumpCondition(severity: number): MachineCondition {
  return {
    unbalance: 1.6 + 2 * severity,
    misalignment: 0.4 + severity,
    vanePass: { vanes: VIB_VANES, amplitude: 1 + 0.9 * severity },
    bearing: severity > 0.05 ? { hz: VIB_BPFO_HZ, amplitude: 2.2 * severity } : undefined,
  };
}

const VIB_POINT_DEFS: readonly VibPointDef[] = [
  { id: 'm-nde', label: 'Motor NDE', at: 0.08, condition: { unbalance: 1.1, misalignment: 0.3 }, seed: 21 },
  { id: 'm-de', label: 'Motor DE', at: 0.36, condition: { unbalance: 1.5, misalignment: 0.7 }, seed: 22 },
  { id: 'p-de', label: 'Pump DE', at: 0.62, condition: vibPumpCondition(1), seed: 23 },
  { id: 'p-nde', label: 'Pump NDE', at: 0.92, condition: { unbalance: 2.3, misalignment: 0.6, vanePass: { vanes: VIB_VANES, amplitude: 1.4 } }, seed: 24 },
];

const VIB_MACHINES: readonly TrainMachine[] = [
  { id: 'motor', label: 'Motor', detail: '315 kW · 1 482 rpm', from: 0, to: 0.44 },
  { id: 'pump', label: 'Pump', detail: 'Five vanes · 412 m³/h', from: 0.54, to: 1 },
];

function vibRead(condition: MachineCondition, seed: number): VibReading {
  const components = machineComponents(VIB_RUN_HZ, condition);
  const level = overall(components);
  return { components, lines: synthSpectrum(components, { maxHz: VIB_MAX_HZ, seed }), overall: level, zone: isoZone(level) };
}

const VIB_READINGS: Record<string, VibReading> = Object.fromEntries(VIB_POINT_DEFS.map((point) => [point.id, vibRead(point.condition, point.seed)]));

const VIB_NOW = VIB_READINGS['p-de'];

const VIB_BASELINE = vibRead(vibPumpCondition(0), 11);

const VIB_POINTS: readonly TrainPoint[] = VIB_POINT_DEFS.map((point) => {
  const reading = VIB_READINGS[point.id];
  return { id: point.id, label: point.label, at: point.at, value: reading.overall, tone: ISO_ZONE_TONE[reading.zone], state: ISO_ZONE_WORD[reading.zone] };
});

const VIB_MARKERS: readonly SpectrumMarker[] = [
  { hz: VIB_RUN_HZ, label: '1×', tone: 'accent' },
  { hz: VIB_RUN_HZ * 2, label: '2×', tone: 'accent' },
  { hz: VIB_BPFO_HZ, label: 'BPFO', tone: 'critical' },
  { hz: VIB_RUN_HZ * VIB_VANES, label: 'Vane pass', tone: 'purple' },
  { hz: VIB_BPFO_HZ * 2, label: '2× BPFO', tone: 'critical' },
];

const VIB_MASK: readonly SpectrumMaskStep[] = [
  { fromHz: 0, toHz: 18, level: 0.8 },
  { fromHz: 18, toHz: 32, level: 4.2 },
  { fromHz: 32, toHz: 82, level: 2.6 },
  { fromHz: 82, toHz: 110, level: 1.2 },
  { fromHz: 110, toHz: 140, level: 2.4 },
  { fromHz: 140, toHz: 400, level: 0.9 },
];

const VIB_BANDS: readonly FrequencyBand[] = [
  { label: 'Sub-sync', fromHz: 2, toHz: 18, alarm: 0.8 },
  { label: '1×', fromHz: 18, toHz: 32, alarm: 4.2 },
  { label: '2× to 3×', fromHz: 32, toHz: 82, alarm: 2.6 },
  { label: 'Bearing', fromHz: 82, toHz: 110, alarm: 1.2 },
  { label: 'Vane pass', fromHz: 110, toHz: 140, alarm: 2.4 },
  { label: 'High', fromHz: 140, toHz: 400, alarm: 0.9 },
];

const VIB_BAND_SHARE = bandLevels(VIB_NOW.lines, VIB_BANDS).map((level, index) => Math.round((level / VIB_BANDS[index].alarm) * 100));

const VIB_BAND_TONES: Tone[] = VIB_BAND_SHARE.map((share) => (share >= 100 ? 'critical' : share >= 75 ? 'warning' : 'accent'));

const VIB_PEAKS = findPeaks(VIB_NOW.lines, 6, 0.5);

const VIB_WAVE = synthWaveform(VIB_NOW.components, { seconds: 0.2, seed: 5, noise: 0.25, impacts: { hz: VIB_BPFO_HZ, amplitude: 7.5 } });

const VIB_WAVE_SMOOTH = synthWaveform(VIB_BASELINE.components, { seconds: 0.2, seed: 5, noise: 0.15 });

const VIB_WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

const VIB_SEVERITY = [0, 0.02, 0.04, 0.08, 0.14, 0.22, 0.32, 0.44, 0.58, 0.74, 0.88, 1];

const VIB_TREND = VIB_SEVERITY.map((severity) => Number(overall(machineComponents(VIB_RUN_HZ, vibPumpCondition(severity))).toFixed(2)));

const VIB_WATERFALL = [0, 2, 4, 6, 7, 8, 9, 10, 11].map((week) => ({
  label: `Week ${week + 1}`,
  lines: synthSpectrum(machineComponents(VIB_RUN_HZ, vibPumpCondition(VIB_SEVERITY[week])), { maxHz: 300, lines: 240, seed: 40 + week }),
}));

const VIB_ORBITS = [
  { id: 'ellipse', caption: 'Ellipse: unbalance', tone: 'accent', points: orbitPoints({ xAmplitude: 34, yAmplitude: 22, phaseDeg: 80 }) },
  { id: 'banana', caption: 'Banana: misalignment', tone: 'warning', points: orbitPoints({ xAmplitude: 30, yAmplitude: 26, phaseDeg: 70, secondOrder: 0.32 }) },
  { id: 'eight', caption: 'Figure of eight: severe preload', tone: 'critical', points: orbitPoints({ xAmplitude: 22, yAmplitude: 30, phaseDeg: 95, secondOrder: 0.85 }) },
] as const;

const VIB_FAULTS: readonly { id: string; title: string; cue: string; condition: MachineCondition; markers: SpectrumMarker[] }[] = [
  { id: 'unbalance', title: 'Unbalance', cue: 'One tall line at running speed.', condition: { unbalance: 4.2 }, markers: [{ hz: VIB_RUN_HZ, label: '1×', tone: 'accent' }] },
  { id: 'misalignment', title: 'Misalignment', cue: 'Second order as high as the first.', condition: { unbalance: 1.8, misalignment: 3 }, markers: [{ hz: VIB_RUN_HZ * 2, label: '2×', tone: 'warning' }] },
  { id: 'looseness', title: 'Looseness', cue: 'A comb of harmonics and a half order.', condition: { unbalance: 1.6, looseness: 2.6 }, markers: [{ hz: VIB_RUN_HZ * 4.5, label: '3× to 7×', tone: 'purple' }] },
  { id: 'bearing', title: 'Bearing defect', cue: 'Non-synchronous line with harmonics.', condition: { unbalance: 1.4, bearing: { hz: VIB_BPFO_HZ, amplitude: 2.4 } }, markers: [{ hz: VIB_BPFO_HZ, label: 'BPFO', tone: 'critical' }] },
];

function VibZoneIcon({ zone }: { zone: IsoZone }) {
  if (zone === 'D') return <IconAlertOctagon aria-hidden="true" />;
  if (zone === 'C') return <IconAlertTriangle aria-hidden="true" />;
  return <IconCircleCheck aria-hidden="true" />;
}

function VibZonePill({ zone, size }: { zone: IsoZone; size?: 'md' | 'lg' }) {
  return (
    <StatusPill tone={ISO_ZONE_TONE[zone]} icon={<VibZoneIcon zone={zone} />} size={size}>
      Zone {zone} · {ISO_ZONE_WORD[zone]}
    </StatusPill>
  );
}

function VibSheet({ title, subtitle, actions, footer, children }: { title: string; subtitle: string; actions?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <Canvas>
      <Panel title={title} subtitle={subtitle} actions={actions} footer={footer}>
        {children}
      </Panel>
    </Canvas>
  );
}

function VibOverallHeadline({ reading = VIB_NOW }: { reading?: VibReading }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Stat variant="plain" size="md" label="Overall velocity" value={reading.overall} decimals={1} unit="mm/s RMS" />
      <VibZonePill zone={reading.zone} />
    </div>
  );
}

function VibPeakRows({ selectedHz, onSelect }: { selectedHz: number; onSelect: (hz: number) => void }) {
  return (
    <ul className="flex flex-col">
      {VIB_PEAKS.map((line) => {
        const reading = readPeak(line.hz, VIB_CONTEXT);
        const active = line.hz === selectedHz;
        return (
          <ListRow
            key={line.hz}
            tone={active ? 'accent' : 'neutral'}
            title={
              <button type="button" aria-pressed={active} onClick={() => onSelect(line.hz)} className="cursor-pointer text-left font-semibold outline-none focus-visible:underline">
                {reading.label} at {line.hz.toFixed(1)} Hz
              </button>
            }
            meta={active ? reading.cause : undefined}
            trailing={<span className="font-semibold tabular-nums">{line.amplitude.toFixed(2)} mm/s</span>}
          />
        );
      })}
    </ul>
  );
}

function VibAnalysisSpectrumNamed() {
  return (
    <VibSheet
      title="Velocity spectrum"
      subtitle={`${VIB_PUMP} · pump drive end, horizontal`}
      actions={<StatusPill tone="neutral">Survey 12 March, 09:40</StatusPill>}
      footer={<span>Orders of running speed in blue, the bearing outer-race frequency in red, vane pass in purple.</span>}
    >
      <SpectrumPlot label="Velocity spectrum of the pump drive end, 0 to 400 Hz, with named lines" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} markers={VIB_MARKERS} height={300} headline={<VibOverallHeadline />} />
    </VibSheet>
  );
}

function VibAnalysisSpectrumMask() {
  const over = VIB_BAND_SHARE.filter((share) => share >= 100).length;
  return (
    <VibSheet
      title="Against the alarm mask"
      subtitle="A stepped envelope per frequency band"
      actions={
        <StatusPill tone="critical" icon={<IconAlertOctagon aria-hidden="true" />}>
          {over} bands over
        </StatusPill>
      }
    >
      <SpectrumPlot label="Velocity spectrum against its alarm mask" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} mask={VIB_MASK} height={260} />
    </VibSheet>
  );
}

function VibAnalysisSpectrumCompare() {
  return (
    <VibSheet title="Against the baseline" subtitle="Today over the spectrum taken after overhaul" actions={<StatusPill tone="warning">Overall up 2.4×</StatusPill>}>
      <SpectrumPlot label="Velocity spectrum today compared with the post-overhaul baseline" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} baseline={{ label: 'Baseline, 18 December', lines: VIB_BASELINE.lines }} height={260} />
    </VibSheet>
  );
}

function VibAnalysisSpectrumPick() {
  const [selectedHz, setSelectedHz] = useState(VIB_PEAKS[2]?.hz ?? 0);
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-8" title="Pick a peak" subtitle="Select a dot on the trace or a row in the list">
          <SpectrumPlot label="Velocity spectrum with selectable peaks" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} peaks={VIB_PEAKS} selectedHz={selectedHz} onSelect={setSelectedHz} height={320} />
        </Panel>
        <Panel className="col-span-4" title="Largest peaks" subtitle="Named by order of running speed" footer={<span>Running speed 24.7 Hz · BPFO 88.6 Hz</span>}>
          <VibPeakRows selectedHz={selectedHz} onSelect={setSelectedHz} />
        </Panel>
      </Grid>
    </Canvas>
  );
}

function VibAnalysisWaveform() {
  return (
    <VibSheet title="Time waveform" subtitle="Pump drive end · 200 ms record" footer={<span>Impacts repeat every 11.3 ms, the period of the outer-race frequency.</span>}>
      <div className="flex flex-col gap-5">
        <StatGroup columns={3} joined label="Waveform figures">
          <Stat variant="plain" size="sm" label="RMS" value={rms(VIB_WAVE)} decimals={2} unit="mm/s" />
          <Stat variant="plain" size="sm" label="Peak" value={peak(VIB_WAVE)} decimals={1} unit="mm/s" />
          <Stat variant="plain" size="sm" label="Crest factor" value={crestFactor(VIB_WAVE)} decimals={1} tone="warning" target="Alert above 3.5" />
        </StatGroup>
        <WaveformPlot label="Time waveform of the pump drive end with the RMS band and the peak marked" samples={VIB_WAVE} milliseconds={200} height={220} />
      </div>
    </VibSheet>
  );
}

function VibAnalysisWaveformHealthy() {
  return (
    <VibSheet title="A healthy waveform" subtitle="Same bearing after overhaul · 200 ms record" footer={<span>A smooth, repeating wave: the signal stays close to its RMS band.</span>}>
      <div className="flex flex-col gap-5">
        <StatGroup columns={3} joined label="Waveform figures">
          <Stat variant="plain" size="sm" label="RMS" value={rms(VIB_WAVE_SMOOTH)} decimals={2} unit="mm/s" />
          <Stat variant="plain" size="sm" label="Peak" value={peak(VIB_WAVE_SMOOTH)} decimals={1} unit="mm/s" />
          <Stat variant="plain" size="sm" label="Crest factor" value={crestFactor(VIB_WAVE_SMOOTH)} decimals={1} tone="success" target="Alert above 3.5" />
        </StatGroup>
        <WaveformPlot label="Time waveform of the pump drive end after overhaul" samples={VIB_WAVE_SMOOTH} milliseconds={200} tone="success" height={220} />
      </div>
    </VibSheet>
  );
}

function VibAnalysisOrbits() {
  return (
    <VibSheet title="Shaft orbits" subtitle="Two proximity probes at 90° · one revolution inside the bearing clearance" footer={<span>The dot is the keyphasor mark: where the shaft is when the reference notch passes.</span>}>
      <div className="grid grid-cols-3 items-start justify-items-center gap-6">
        {VIB_ORBITS.map((orbit) => (
          <OrbitPlot key={orbit.id} label={`Shaft orbit, ${orbit.caption}`} points={orbit.points} clearance={120} tone={orbit.tone} caption={orbit.caption} size={220} />
        ))}
      </div>
    </VibSheet>
  );
}

function VibAnalysisWaterfall() {
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-8" title="Twelve weeks of spectra" subtitle="Pump drive end · oldest survey at the back">
          <WaterfallPlot label="Waterfall of pump drive-end spectra over twelve weeks" rows={VIB_WATERFALL} maxHz={300} yMax={4} height={340} />
        </Panel>
        <Panel className="col-span-4" title="What changed" subtitle="Read from the back to the front">
          <ul className="flex flex-1 flex-col justify-between">
            <ListRow leading={<IconChip tone="accent">1×</IconChip>} title="Running speed doubled" meta="1.6 to 3.6 mm/s at 24.7 Hz: unbalance growing since week 5." />
            <ListRow tone="critical" leading={<IconChip tone="critical">BP</IconChip>} title="A new line at 88.6 Hz" meta="Absent until week 5, 2.2 mm/s today, with a harmonic at 177 Hz." />
            <ListRow leading={<IconChip tone="purple">VP</IconChip>} title="Vane pass up by half" meta="1.0 to 1.9 mm/s at 123.5 Hz as the pump runs back on its curve." />
            <ListRow leading={<IconChip tone="neutral">Hz</IconChip>} title="Noise floor unchanged" meta="No broadband rise, so lubrication is still doing its job." />
          </ul>
        </Panel>
      </Grid>
    </Canvas>
  );
}

function VibAnalysisZoneBars() {
  return (
    <VibSheet title="Severity per bearing" subtitle="ISO 10816-3, group 1, rigid foundation" footer={<span>The filled segment is the zone each reading is in.</span>}>
      <div className="flex flex-col gap-6">
        {VIB_POINT_DEFS.map((point) => (
          <ZoneBar key={point.id} label={`${point.label}, horizontal`} value={VIB_READINGS[point.id].overall} />
        ))}
      </div>
    </VibSheet>
  );
}

function VibAnalysisOverallTrend() {
  return (
    <VibSheet title="Overall level, twelve weeks" subtitle="Pump drive end against the zone boundaries" actions={<VibZonePill zone={VIB_NOW.zone} />} footer={<span>At this rate the reading reaches zone D in about three weeks.</span>}>
      <TrendArea
        label="Overall velocity of the pump drive end over twelve weeks against the ISO zone boundaries"
        series={[{ id: 'overall', label: 'Overall velocity', values: VIB_TREND, tone: 'warning' }]}
        labels={VIB_WEEKS}
        unit="mm/s"
        decimals={1}
        yDomain={[0, 8]}
        limits={[
          { value: ISO_GROUP1_RIGID[1], label: 'Alert', tone: 'warning' },
          { value: ISO_GROUP1_RIGID[2], label: 'Danger', tone: 'critical' },
        ]}
        height={372}
      />
    </VibSheet>
  );
}

function VibAnalysisBandAlarms() {
  return (
    <VibSheet title="Band alarms" subtitle="Highest line in each band as a share of its alarm" footer={<span>Two bands over: running speed is close, the bearing band is at almost twice its alarm.</span>}>
      <Bars
        label="Highest spectral line per frequency band as a percentage of the band alarm"
        categories={VIB_BANDS.map((band) => band.label)}
        series={[{ id: 'share', label: 'Share of alarm', values: VIB_BAND_SHARE }]}
        tones={VIB_BAND_TONES}
        unit="%"
        showValues
        limit={{ value: 100, label: 'Alarm', tone: 'critical' }}
        height={300}
      />
    </VibSheet>
  );
}

const VIB_ZONE_COLUMNS: DataTableColumn<IsoZone>[] = [
  { id: 'zone', header: 'Zone', cell: (zone) => <VibZonePill zone={zone} />, nowrap: true },
  { id: 'range', header: 'mm/s RMS', numeric: true, nowrap: true, cell: (zone) => ['Below 2.3', '2.3 to 4.5', '4.5 to 7.1', 'Above 7.1'][ISO_ZONES.indexOf(zone)] },
  { id: 'meaning', header: 'What it means', cell: (zone) => ISO_ZONE_MEANING[zone] },
  { id: 'points', header: 'Bearings', numeric: true, cell: (zone) => VIB_POINT_DEFS.filter((point) => VIB_READINGS[point.id].zone === zone).length },
];

function VibAnalysisZoneKey() {
  return (
    <Canvas>
      <Panel title="Zone key" subtitle="What each ISO zone allows, and how many bearings sit in it" padding="none" footer={<span>Boundaries for machines above 300 kW on rigid foundations.</span>}>
        <DataTable label="ISO 10816-3 zones" columns={VIB_ZONE_COLUMNS} rows={ISO_ZONES} rowKey={(zone) => zone} rowTone={(zone) => ISO_ZONE_TONE[zone]} flush />
      </Panel>
    </Canvas>
  );
}

function VibAnalysisTrain() {
  const [selected, setSelected] = useState('p-de');
  const point = VIB_POINT_DEFS.find((candidate) => candidate.id === selected) ?? VIB_POINT_DEFS[2];
  const reading = VIB_READINGS[point.id];
  return (
    <Canvas>
      <Grid>
        <Panel className="col-span-12" title="Measurement points" subtitle={`${VIB_PUMP} · select a bearing to see its spectrum`} actions={<StatusPill tone="warning">1 bearing in alert</StatusPill>}>
          <div className="px-16">
            <MachineTrain label="Export pump A measurement points" machines={VIB_MACHINES} points={VIB_POINTS} selected={selected} onSelect={setSelected} />
          </div>
        </Panel>
        <Panel className="col-span-12" title={`${point.label}, horizontal`} subtitle="Velocity spectrum, 0 to 400 Hz">
          <SpectrumPlot
            label={`Velocity spectrum at ${point.label}`}
            lines={reading.lines}
            maxHz={VIB_MAX_HZ}
            yMax={4}
            markers={VIB_MARKERS.slice(0, point.id === 'p-de' ? 5 : 2)}
            tone={ISO_ZONE_TONE[reading.zone] === 'success' ? 'accent' : ISO_ZONE_TONE[reading.zone]}
            height={240}
            headline={<VibOverallHeadline reading={reading} />}
          />
        </Panel>
      </Grid>
    </Canvas>
  );
}

function VibAnalysisFaultSignatures() {
  return (
    <Canvas>
      <Grid>
        {VIB_FAULTS.map((fault) => (
          <Panel key={fault.id} className="col-span-3" title={fault.title} subtitle={fault.cue}>
            <SpectrumPlot
              label={`Typical spectrum of ${fault.title.toLowerCase()}`}
              lines={synthSpectrum(machineComponents(VIB_RUN_HZ, fault.condition), { maxHz: 300, lines: 200, seed: 7 })}
              maxHz={300}
              yMax={5}
              markers={fault.markers}
              tone={fault.markers[0]?.tone ?? 'accent'}
              height={170}
            />
          </Panel>
        ))}
      </Grid>
    </Canvas>
  );
}

type VibPointRow = { id: string; label: string; reading: VibReading };

const VIB_POINT_ROWS: VibPointRow[] = VIB_POINT_DEFS.map((point) => ({ id: point.id, label: point.label, reading: VIB_READINGS[point.id] }));

const VIB_POINT_COLUMNS: DataTableColumn<VibPointRow>[] = [
  { id: 'point', header: 'Point', cell: (row) => row.label, nowrap: true },
  { id: 'overall', header: 'mm/s', numeric: true, cell: (row) => row.reading.overall.toFixed(1) },
  { id: 'zone', header: 'Zone', nowrap: true, cell: (row) => <StatusPill tone={ISO_ZONE_TONE[row.reading.zone]}>{`${row.reading.zone} · ${ISO_ZONE_WORD[row.reading.zone]}`}</StatusPill> },
];

function VibAnalysisLookConsole() {
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Grid>
          <StatGroup columns={4} label="Pump drive end" className="col-span-12">
            <Stat variant="plain" size="lg" tone="warning" label="Overall velocity" value={VIB_NOW.overall} decimals={1} unit="mm/s" target="Alert 4.5 · Danger 7.1" />
            <Stat variant="plain" size="lg" label="1× amplitude" value={3.6} decimals={1} unit="mm/s" target="Baseline 1.6" />
            <Stat variant="plain" size="lg" tone="critical" label="Bearing band" value={2.2} decimals={1} unit="mm/s" target="Alarm 1.2" />
            <Stat variant="plain" size="lg" label="Crest factor" value={crestFactor(VIB_WAVE)} decimals={1} target="Alert 3.5" />
          </StatGroup>
          <Panel className="col-span-4" title="Points" subtitle={VIB_PUMP} padding="none" footer={<span>Route 14 · survey 09:40</span>}>
            <DataTable label="Measurement points" columns={VIB_POINT_COLUMNS} rows={VIB_POINT_ROWS} rowKey={(row) => row.id} rowTone={(row) => ISO_ZONE_TONE[row.reading.zone]} flush />
          </Panel>
          <Panel className="col-span-8" title="Spectrum" subtitle="Pump DE · velocity · alarm mask">
            <SpectrumPlot label="Velocity spectrum against the alarm mask, console trace" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} markers={VIB_MARKERS} mask={VIB_MASK} height={260} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function VibAnalysisLookGlass() {
  return (
    <LookScope look="glass">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Velocity spectrum" subtitle="Pump drive end · a glowing trace on glass" actions={<VibZonePill zone={VIB_NOW.zone} />}>
            <SpectrumPlot label="Velocity spectrum, glass trace" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} markers={VIB_MARKERS} height={300} />
          </Panel>
          <Panel className="col-span-4" title="Shaft orbit" subtitle="Drive-end bearing">
            <div className="flex flex-1 flex-col items-center justify-between gap-4">
              <OrbitPlot label="Shaft orbit at the pump drive end" points={VIB_ORBITS[1].points} clearance={120} tone="accent" caption="Banana: misalignment" size={210} />
              <div className="grid w-full grid-cols-2 justify-items-center gap-4">
                <RingGauge label="Of danger limit" value={Math.round((VIB_NOW.overall / ISO_GROUP1_RIGID[2]) * 100)} tone="warning" size={96} />
                <RingGauge label="Bearing health" value={46} tone="critical" size={96} />
              </div>
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function VibAnalysisLookBlueprint() {
  return (
    <LookScope look="blueprint">
      <Canvas>
        <Grid>
          <Panel className="col-span-8" title="Spectrum, line by line" subtitle="Drawing VA-2001A-03 · stems at every bin">
            <SpectrumPlot label="Velocity spectrum drawn as stems" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} markers={VIB_MARKERS} height={300} />
          </Panel>
          <Panel className="col-span-4" title="Orbit in clearance" subtitle="Clearance circle 120 µm">
            <div className="flex flex-1 flex-col items-center justify-between gap-5">
              <OrbitPlot label="Shaft orbit drawn inside the bearing clearance" points={VIB_ORBITS[0].points} clearance={120} caption="Ellipse: unbalance" size={200} />
              <ZoneBar className="w-full" label="Pump DE" value={VIB_NOW.overall} />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function VibAnalysisLookSignal() {
  return (
    <LookScope look="signal">
      <Canvas>
        <Grid columns={4}>
          {VIB_POINT_ROWS.map((row) => (
            <Stat
              key={row.id}
              size="lg"
              tone={ISO_ZONE_TONE[row.reading.zone]}
              label={row.label}
              state={ISO_ZONE_WORD[row.reading.zone]}
              stateIcon={<VibZoneIcon zone={row.reading.zone} />}
              value={row.reading.overall}
              decimals={1}
              unit="mm/s"
              target={`Zone ${row.reading.zone}`}
            />
          ))}
          <Panel className="col-span-4" title="Export pump A" subtitle="Every bearing carries its state">
            <div className="px-16">
              <MachineTrain label="Export pump A, state per bearing" machines={VIB_MACHINES} points={VIB_POINTS} />
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function VibAnalysisLookPoster() {
  return (
    <LookScope look="poster">
      <Canvas>
        <Grid>
          <Stat className="col-span-4" size="hero" tone="amber" label="Pump drive end" value={VIB_NOW.overall} decimals={1} unit="mm/s" target="Zone C · alert above 4.5" />
          <Panel className="col-span-8" title="Where the energy is" subtitle="Velocity spectrum in blocks, 0 to 400 Hz">
            <SpectrumPlot label="Velocity spectrum drawn as blocks" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} markers={VIB_MARKERS.slice(0, 4)} height={230} />
          </Panel>
          <Panel className="col-span-12" title="Zone per bearing" subtitle="ISO 10816-3">
            <div className="grid grid-cols-4 gap-6">
              {VIB_POINT_DEFS.map((point) => (
                <ZoneBar key={point.id} label={point.label} value={VIB_READINGS[point.id].overall} size="lg" />
              ))}
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function VibAnalysisWorkbench() {
  const [view, setView] = useState('spectrum');
  const [selectedHz, setSelectedHz] = useState(VIB_PEAKS[2]?.hz ?? 0);
  return (
    <Canvas>
      <Grid>
        <SectionHeader
          className="col-span-12"
          eyebrow="Condition monitoring · route 14"
          title="Export pump A, drive-end bearing"
          description="Survey of Thursday 12 March, 09:40. The bearing band has been rising for seven weeks."
          actions={
            <>
              <SegmentedControl value={view} onValueChange={(next) => setView(String(next))}>
                <SegmentedControlList size="small" aria-label="Plot">
                  <SegmentedControlButton value="spectrum">Spectrum</SegmentedControlButton>
                  <SegmentedControlButton value="waveform">Waveform</SegmentedControlButton>
                </SegmentedControlList>
              </SegmentedControl>
              <Button size="sm">
                <IconClipboardList aria-hidden="true" />
                Create work order
              </Button>
            </>
          }
        />
        <Stat className="col-span-3" emphasis="strong" tone="warning" icon={<IconActivity />} label="Overall velocity" value={VIB_NOW.overall} decimals={1} unit="mm/s" delta={{ value: VIB_NOW.overall - VIB_TREND[10], good: 'down', caption: 'in a week' }} target="Zone C · alert" sparkline={VIB_TREND} />
        <Stat className="col-span-3" tone="critical" icon={<IconAlertOctagon />} label="Bearing band" value={2.2} decimals={1} unit="mm/s" delta={{ value: 0.3, good: 'down', caption: 'in a week' }} target="Alarm 1.2" sparkline={VIB_SEVERITY.map((severity) => 2.2 * severity)} />
        <Stat className="col-span-3" icon={<IconWaveSine />} label="Crest factor" value={crestFactor(VIB_WAVE)} decimals={1} delta={{ value: 0.6, good: 'down', caption: 'in a week' }} target="Alert above 3.5" sparkline={VIB_SEVERITY.map((severity) => 1.9 + severity * 1.6)} />
        <Stat className="col-span-3" tone="success" icon={<IconCircleCheck />} label="Bearing temperature" value={61.4} decimals={1} unit="°C" delta={{ value: 0.8, good: 'down', caption: 'in a week' }} target="High 75.0" sparkline={VIB_SEVERITY.map((severity) => 58 + severity * 3.4)} />
        <Panel className="col-span-8" title={view === 'spectrum' ? 'Velocity spectrum' : 'Time waveform'} subtitle="Pump drive end, horizontal" actions={<VibZonePill zone={VIB_NOW.zone} />}>
          {view === 'spectrum' ? (
            <SpectrumPlot label="Velocity spectrum with selectable peaks and the alarm mask" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} mask={VIB_MASK} baseline={{ label: 'Baseline', lines: VIB_BASELINE.lines }} peaks={VIB_PEAKS} selectedHz={selectedHz} onSelect={setSelectedHz} height={320} />
          ) : (
            <WaveformPlot label="Time waveform of the pump drive end" samples={VIB_WAVE} milliseconds={200} height={356} />
          )}
        </Panel>
        <Panel className="col-span-4" title="Peaks" subtitle="Select one to read its likely cause" footer={<span>Recommend bearing replacement at the next window.</span>}>
          <VibPeakRows selectedHz={selectedHz} onSelect={setSelectedHz} />
        </Panel>
      </Grid>
    </Canvas>
  );
}

function VibAnalysisReport() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <Grid>
          <SectionHeader
            className="col-span-12"
            size="lg"
            eyebrow="Vibration report 2026-031 · Aisha Khan, rotating equipment"
            title="Outer-race defect on the export pump drive-end bearing."
            description="Overall velocity has risen from 2.1 to 5.3 mm/s in twelve weeks. A line at 88.6 Hz with a harmonic, and impacts in the waveform, point to the outer race."
          />
          <StatGroup columns={4} label="Report figures" className="col-span-12">
            <Stat variant="plain" size="lg" label="Overall velocity" value={VIB_NOW.overall} decimals={1} unit="mm/s" delta={{ value: VIB_NOW.overall - VIB_TREND[0], good: 'down', caption: 'in twelve weeks' }} />
            <Stat variant="plain" size="lg" label="ISO zone" value="C" target="Limited operation until repair" />
            <Stat variant="plain" size="lg" label="Bearing line" value={2.2} decimals={1} unit="mm/s" target="At 88.6 Hz, alarm 1.2" />
            <Stat variant="plain" size="lg" label="Time to zone D" value="3" unit="weeks" target="At the current rate" />
          </StatGroup>
          <Panel className="col-span-8" title="The spectrum shows a line that running speed cannot explain" subtitle="Velocity in mm/s RMS, pump drive end, against the post-overhaul baseline.">
            <SpectrumPlot label="Velocity spectrum against the baseline, report figure" lines={VIB_NOW.lines} maxHz={VIB_MAX_HZ} markers={VIB_MARKERS} baseline={{ label: 'Baseline', lines: VIB_BASELINE.lines }} height={300} />
          </Panel>
          <Panel className="col-span-4" title="Findings" subtitle="In order of confidence">
            <ol className="flex flex-1 flex-col justify-between gap-4 text-sm leading-6 text-(--kit-text-2)">
              <li>
                <strong className="font-semibold text-(--kit-text)">Bearing defect, high.</strong> 88.6 Hz is 3.59 orders: the outer-race frequency of the 6316 bearing.
              </li>
              <li>
                <strong className="font-semibold text-(--kit-text)">Unbalance, medium.</strong> Running speed is up from 1.6 to 3.6 mm/s, likely impeller wear.
              </li>
              <li>
                <strong className="font-semibold text-(--kit-text)">Hydraulics, low.</strong> Vane pass is raised but inside its band alarm.
              </li>
              <li>
                <strong className="font-semibold text-(--kit-text)">Action.</strong> Replace the bearing within three weeks under <TagId>WO-104466</TagId>; resurvey weekly until then.
              </li>
            </ol>
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'vibration-analysis',
  title: 'Vibration analysis',
  summary:
    'Plots and readouts for condition monitoring of rotating machines: spectra with named lines, waveforms, orbits, waterfalls and ISO severity zones, shown in several looks and composed into an analyst workbench and a report.',
  guidance: {
    use: [
      'Name the lines: orders of running speed, bearing and vane-pass frequencies turn a spectrum into a diagnosis.',
      'Show the overall level on its ISO zones with the letter and the word, not only a colour.',
      'Put a baseline or an alarm mask behind the spectrum so change is visible without memory.',
      'Let the analyst pick a bearing on the machine train and a peak on the trace.',
    ],
    avoid: [
      'A spectrum with no frequency axis, unit or running speed.',
      'Reporting an overall value without saying which zone boundaries apply.',
      'Orbit plots without the clearance circle: the shape means little without its limit.',
      'Monospaced tag ids and tiny tick labels; analysts read these plots for hours.',
    ],
  },
  source,
  sections: [
    {
      id: 'spectra',
      title: 'Spectra',
      description: 'The frequency view: which lines are there, what they are called and how they compare.',
      specimens: [
        {
          id: 'VibAnalysisSpectrumNamed',
          title: 'Named lines',
          note: 'Pick it as the main plot of an analysis view, where every dominant line should carry its name.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/vibration-analysis/SpectrumPlot.tsx', 'kit/vibration-analysis/signal.ts', 'kit/Stat.tsx', 'kit/StatusPill.tsx'],
          Component: VibAnalysisSpectrumNamed,
        },
        {
          id: 'VibAnalysisSpectrumMask',
          title: 'Alarm mask',
          note: 'Pick it when band alarms are configured and the reader needs to see which bands break them.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/vibration-analysis/SpectrumPlot.tsx'],
          Component: VibAnalysisSpectrumMask,
        },
        {
          id: 'VibAnalysisSpectrumCompare',
          title: 'Baseline comparison',
          note: 'Pick it to show what changed since overhaul or since the last survey.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/vibration-analysis/SpectrumPlot.tsx'],
          Component: VibAnalysisSpectrumCompare,
        },
        {
          id: 'VibAnalysisSpectrumPick',
          title: 'Pick a peak',
          note: 'Pick it when the analyst reads peaks one at a time and needs the likely cause next to the trace.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/vibration-analysis/SpectrumPlot.tsx', 'kit/vibration-analysis/signal.ts', 'kit/ListRow.tsx'],
          Component: VibAnalysisSpectrumPick,
        },
        {
          id: 'VibAnalysisFaultSignatures',
          title: 'Fault signatures',
          note: 'Pick it as a reference strip that teaches what each common fault looks like.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/vibration-analysis/SpectrumPlot.tsx', 'kit/vibration-analysis/signal.ts'],
          Component: VibAnalysisFaultSignatures,
        },
      ],
    },
    {
      id: 'time-and-shaft',
      title: 'Time and shaft position',
      description: 'The raw signal, the shaft path inside its bearing and how spectra develop between surveys.',
      specimens: [
        {
          id: 'VibAnalysisWaveform',
          title: 'Waveform with impacts',
          note: 'Pick it to confirm a bearing defect: impacts stand far above the RMS band.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/vibration-analysis/WaveformPlot.tsx', 'kit/StatGroup.tsx'],
          Component: VibAnalysisWaveform,
        },
        {
          id: 'VibAnalysisWaveformHealthy',
          title: 'Healthy waveform',
          note: 'Pick it as the reference next to a suspect record from the same bearing.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/vibration-analysis/WaveformPlot.tsx', 'kit/StatGroup.tsx'],
          Component: VibAnalysisWaveformHealthy,
        },
        {
          id: 'VibAnalysisOrbits',
          title: 'Orbit shapes',
          note: 'Pick it for machines with proximity probes, where the shape of the orbit separates the faults.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/vibration-analysis/OrbitPlot.tsx', 'kit/vibration-analysis/signal.ts'],
          Component: VibAnalysisOrbits,
        },
        {
          id: 'VibAnalysisWaterfall',
          title: 'Waterfall with reading',
          note: 'Pick it to follow one bearing across surveys and say in words what grew and what appeared.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/vibration-analysis/WaterfallPlot.tsx', 'kit/ListRow.tsx', 'kit/IconChip.tsx'],
          Component: VibAnalysisWaterfall,
        },
      ],
    },
    {
      id: 'severity',
      title: 'Severity',
      description: 'How bad it is: overall levels on ISO zones, band alarms and the trend towards the next boundary.',
      specimens: [
        {
          id: 'VibAnalysisZoneBars',
          title: 'Zone bars',
          note: 'Pick it to compare the bearings of one machine on the same ISO scale.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/vibration-analysis/ZoneBar.tsx'],
          Component: VibAnalysisZoneBars,
        },
        {
          id: 'VibAnalysisOverallTrend',
          title: 'Trend against zones',
          note: 'Pick it to show how fast a reading approaches the next zone boundary.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/TrendArea.tsx', 'kit/StatusPill.tsx'],
          Component: VibAnalysisOverallTrend,
        },
        {
          id: 'VibAnalysisBandAlarms',
          title: 'Band alarms',
          note: 'Pick it when alarms are set per frequency band and the worst band should stand out.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Bars.tsx', 'kit/vibration-analysis/signal.ts'],
          Component: VibAnalysisBandAlarms,
        },
        {
          id: 'VibAnalysisZoneKey',
          title: 'Zone key',
          note: 'Pick it wherever zones are used, so the letters are explained on the same screen.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatusPill.tsx', 'kit/vibration-analysis/signal.ts'],
          Component: VibAnalysisZoneKey,
        },
      ],
    },
    {
      id: 'machine',
      title: 'On the machine',
      description: 'Readings placed where they were taken.',
      specimens: [
        {
          id: 'VibAnalysisTrain',
          title: 'Machine train with points',
          note: 'Pick it as the navigation of a machine page: choose a bearing, see its spectrum.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/vibration-analysis/MachineTrain.tsx', 'kit/vibration-analysis/SpectrumPlot.tsx'],
          Component: VibAnalysisTrain,
        },
      ],
    },
    {
      id: 'looks',
      title: 'The same survey in five looks',
      description: 'A look changes how the trace, the orbit and the severity are drawn, not only their colour.',
      specimens: [
        {
          id: 'VibAnalysisLookConsole',
          title: 'Console: dense strips and a line trace',
          note: 'Pick it for a monitoring room where the route table and the spectrum share one screen.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/vibration-analysis/SpectrumPlot.tsx', 'kit/DataTable.tsx', 'kit/StatGroup.tsx'],
          Component: VibAnalysisLookConsole,
        },
        {
          id: 'VibAnalysisLookGlass',
          title: 'Glass: glowing trace, orbit and rings',
          note: 'Pick it for a showcase or a dark diagnostic centre display.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/vibration-analysis/SpectrumPlot.tsx', 'kit/vibration-analysis/OrbitPlot.tsx', 'kit/RingGauge.tsx'],
          Component: VibAnalysisLookGlass,
        },
        {
          id: 'VibAnalysisLookBlueprint',
          title: 'Blueprint: stems and a clearance drawing',
          note: 'Pick it for engineering documentation, where every line of the spectrum is drawn.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/vibration-analysis/SpectrumPlot.tsx', 'kit/vibration-analysis/OrbitPlot.tsx', 'kit/vibration-analysis/ZoneBar.tsx'],
          Component: VibAnalysisLookBlueprint,
        },
        {
          id: 'VibAnalysisLookSignal',
          title: 'Signal: every bearing is its state',
          note: 'Pick it for a workshop wall screen that answers one question: which bearing needs attention.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/Stat.tsx', 'kit/vibration-analysis/MachineTrain.tsx'],
          Component: VibAnalysisLookSignal,
        },
        {
          id: 'VibAnalysisLookPoster',
          title: 'Poster: block spectrum and solid zones',
          note: 'Pick it for a briefing slide where one number and one shape must carry the message.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/Stat.tsx', 'kit/vibration-analysis/SpectrumPlot.tsx', 'kit/vibration-analysis/ZoneBar.tsx'],
          Component: VibAnalysisLookPoster,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that could be dropped into a product.',
      specimens: [
        {
          id: 'VibAnalysisWorkbench',
          title: 'Analyst workbench',
          note: 'Pick it as the working screen of a vibration analyst: figures, plot switch, peaks and the next action.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/vibration-analysis/SpectrumPlot.tsx', 'kit/vibration-analysis/WaveformPlot.tsx', 'kit/Stat.tsx', 'kit/SectionHeader.tsx', 'kit/ListRow.tsx'],
          Component: VibAnalysisWorkbench,
        },
        {
          id: 'VibAnalysisReport',
          title: 'Diagnosis report',
          note: 'Pick it for the written outcome of a survey that goes to the maintenance planner.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['looks/LookScope.tsx', 'kit/vibration-analysis/SpectrumPlot.tsx', 'kit/StatGroup.tsx', 'kit/SectionHeader.tsx', 'kit/TagId.tsx'],
          Component: VibAnalysisReport,
        },
      ],
    },
  ],
});
