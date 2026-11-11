import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { useMemo, useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { BodePlot } from '../../../library/industrial/condition/BodePlot';
import { amplitudeSpectrum } from '../../../library/industrial/condition/dft';
import type { SpectrumLine } from '../../../library/industrial/condition/dft';
import { FAULT_SIGNATURES, diagnosePeak } from '../../../library/industrial/condition/faults';
import { FaultSignatureCard } from '../../../library/industrial/condition/FaultSignatureCard';
import { bandLevels, findPeaks, harmonicFamily, toAccelerationSpectrum, toOrders } from '../../../library/industrial/condition/harmonics';
import type { FrequencyBand, MaskSegment } from '../../../library/industrial/condition/harmonics';
import { InteractiveSpectrum } from '../../../library/industrial/condition/InteractiveSpectrum';
import { ISO_10816_3, ISO_ZONES, ISO_ZONE_MEANING, ISO_ZONE_TONE, isoZone } from '../../../library/industrial/condition/isoZones';
import { IsoZoneTrend } from '../../../library/industrial/condition/IsoZoneTrend';
import { MachineTrainSketch } from '../../../library/industrial/condition/MachineTrainSketch';
import type { MeasurementPoint } from '../../../library/industrial/condition/MachineTrainSketch';
import { OrbitPlot } from '../../../library/industrial/condition/OrbitPlot';
import { PolarPlot } from '../../../library/industrial/condition/PolarPlot';
import { centrelinePosition, orbitPoints, runUp } from '../../../library/industrial/condition/rotor';
import { ShaftCentrelinePlot } from '../../../library/industrial/condition/ShaftCentrelinePlot';
import { bearingFrequencies, crestFactor, kurtosis, machineComponents, rms, synthesizeSignal } from '../../../library/industrial/condition/signal';
import type { ImpulseTrain, MachineCondition } from '../../../library/industrial/condition/signal';
import { SpectrumPlot } from '../../../library/industrial/condition/SpectrumPlot';
import { WaterfallPlot } from '../../../library/industrial/condition/WaterfallPlot';
import { WaveformPlot } from '../../../library/industrial/condition/WaveformPlot';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { TONE_MARK_BG, TONE_TEXT, formatValue } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { findAsset } from '../../data/plant';
import { DAY, REFERENCE_NOW, formatDate, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './vibration-analysis.tsx?raw';

/** Export pump A, 27-PA-2001A: a 4-pole motor driving a 5-vane pump through a flexible coupling. */
const VIB_ASSET = findAsset('27-pa-2001a');
const VIB_SAMPLE_RATE = 2048;
const VIB_SAMPLES = 1024;
/** 1 440 rpm. */
const VIB_RUNNING_HZ = 24;
const VIB_BEARING = bearingFrequencies({ rollingElements: 9, ballDiameter: 8, pitchDiameter: 40 }, VIB_RUNNING_HZ);
const VIB_VANES = 5;
const VIB_BOUNDARIES = ISO_10816_3.group1Rigid;

const VIB_CREST_ALERT = 3.5;
const VIB_KURTOSIS_ALERT = 3.5;

const VIB_MARKERS = [
  { frequencyHz: VIB_BEARING.bpfo, label: 'BPFO' },
  { frequencyHz: VIB_BEARING.bpfi, label: 'BPFI' },
];
const VIB_CONTEXT = { runningHz: VIB_RUNNING_HZ, bearing: VIB_BEARING, vanes: VIB_VANES };

type VibSpec = { id: string; condition: MachineCondition; impulses: ImpulseTrain[]; noise: number; seed: number };
/** `crest` and `kurtosis` come from the high-passed (above 400 Hz) signal, where bearing impacts are not buried under 1×. */
type VibMeasurement = { samples: number[]; spectrum: SpectrumLine[]; overall: number; crest: number; kurtosis: number };

/** The pump drive end at a given stage of bearing wear, 0 (healthy) to 1 (today). */
function vibPumpSpec(severity: number, id: string, seed: number): VibSpec {
  return {
    id,
    seed,
    noise: 0.25,
    condition: {
      runningHz: VIB_RUNNING_HZ,
      unbalance: 4.2 + 4.1 * severity,
      misalignment: 1.2 + 2.4 * severity,
      vanePass: { vanes: VIB_VANES, amplitude: 0.6 + 0.6 * severity },
      bearingTones: [{ frequencyHz: VIB_BEARING.bpfo, amplitude: 0.1 + 1.3 * severity }],
    },
    impulses: severity > 0 ? [{ rateHz: VIB_BEARING.bpfo, amplitude: 1.9 * severity, ringHz: 600, decay: 380 }] : [],
  };
}

function vibQuietSpec(id: string, seed: number, unbalance: number, misalignment: number): VibSpec {
  return { id, seed, noise: 0.2, condition: { runningHz: VIB_RUNNING_HZ, unbalance, misalignment }, impulses: [] };
}

const VIB_SPECS: Record<string, VibSpec> = {
  'm-nde': vibQuietSpec('m-nde', 3, 2.6, 0.9),
  'm-de': vibQuietSpec('m-de', 4, 3.4, 1.4),
  'p-de': vibPumpSpec(1, 'p-de', 5),
  'p-nde': { ...vibPumpSpec(0.2, 'p-nde', 6), impulses: [] },
};

const vibCache = new Map<string, VibMeasurement>();

/** Generates, transforms and summarises one measurement the first time it is asked for. */
function vibMeasure(spec: VibSpec): VibMeasurement {
  const cached = vibCache.get(spec.id);
  if (cached) return cached;
  const samples = synthesizeSignal({ components: machineComponents(spec.condition), impulses: spec.impulses, noise: spec.noise, seed: spec.seed, sampleRateHz: VIB_SAMPLE_RATE, samples: VIB_SAMPLES });
  const highPassed = synthesizeSignal({ components: [], impulses: spec.impulses, noise: spec.noise * 0.4, seed: spec.seed + 100, sampleRateHz: VIB_SAMPLE_RATE, samples: VIB_SAMPLES });
  const measurement = {
    samples,
    spectrum: amplitudeSpectrum(samples, VIB_SAMPLE_RATE),
    overall: rms(samples),
    crest: crestFactor(highPassed),
    kurtosis: kurtosis(highPassed),
  };
  vibCache.set(spec.id, measurement);
  return measurement;
}

const vibNow = (): VibMeasurement => vibMeasure(VIB_SPECS['p-de']);
const vibBaseline = (): VibMeasurement => vibMeasure(vibPumpSpec(0, 'baseline', 11));

const VIB_WATERFALL_STEPS = [0, 0.1, 0.22, 0.35, 0.5, 0.68, 0.85, 1] as const;

function vibWaterfallMeasure(step: number, index: number): VibMeasurement {
  return step === 1 ? vibNow() : vibMeasure(vibPumpSpec(step, `wf-${index}`, 20 + index));
}

const VIB_MASK: readonly MaskSegment[] = [
  { fromHz: 0, toHz: 18, limit: 2 },
  { fromHz: 18, toHz: 30, limit: 5 },
  { fromHz: 30, toHz: 80, limit: 3 },
  { fromHz: 80, toHz: 200, limit: 0.8 },
  { fromHz: 200, toHz: 600, limit: 0.4 },
];

const VIB_BANDS: readonly FrequencyBand[] = [
  { id: 'sync', label: '1× running speed', fromHz: 20, toHz: 28, alarm: 5.5 },
  { id: 'harmonics', label: '2× to 4× harmonics', fromHz: 44, toHz: 100, alarm: 3.5 },
  { id: 'bearing', label: 'Bearing and vane pass', fromHz: 100, toHz: 400, alarm: 1.2 },
  { id: 'high', label: 'High frequency, 400 to 1 000 Hz', fromHz: 400, toHz: 1000, alarm: 0.6 },
];

const VIB_POINTS: readonly MeasurementPoint[] = [
  { id: 'm-nde', code: '1H', name: 'Motor non-drive end, horizontal', x: 40, y: 44 },
  { id: 'm-de', code: '2H', name: 'Motor drive end, horizontal', x: 160, y: 44 },
  { id: 'p-de', code: '3H', name: 'Pump drive end, horizontal', x: 262, y: 48 },
  { id: 'p-nde', code: '4H', name: 'Pump non-drive end, horizontal', x: 346, y: 150 },
];

function vibPointTone(overall: number): Tone {
  const zone = isoZone(overall, VIB_BOUNDARIES);
  return ISO_ZONE_TONE[zone];
}

function vibPointsWithStatus(): MeasurementPoint[] {
  return VIB_POINTS.map((point) => {
    const overall = vibMeasure(VIB_SPECS[point.id]).overall;
    const zone = isoZone(overall, VIB_BOUNDARIES);
    return { ...point, tone: vibPointTone(overall), status: `${formatValue(overall, 1)} mm/s, zone ${zone}` };
  });
}

/** Sixty days of overall velocity at the pump drive end, ending on today's reading. */
function vibTrend(): { t: number; v: number }[] {
  const target = Math.round(vibNow().overall * 10) / 10;
  const raw = makeSeries({ seed: 14, points: 60, base: target - 2.3, amplitude: 0.25, noise: 0.15, drift: 2.3, cycles: 4, stepMs: DAY, decimals: 1 });
  const shift = target - raw[raw.length - 1].v;
  return raw.map((point, index) => ({ t: point.t, v: Math.round((point.v + (shift * index) / (raw.length - 1)) * 10) / 10 }));
}

function vibTemperature(): { t: number; v: number }[] {
  return makeSeries({ seed: 31, points: 60, base: 62, amplitude: 1.2, noise: 0.5, drift: 14, cycles: 4, stepMs: DAY, decimals: 1 });
}

/** The specimen frame is already a card: the signature card drops its own border. */
const VIB_BARE_CARD = 'border-0 bg-transparent p-0';

const VIB_PUMP_NAME = VIB_ASSET ? `${VIB_ASSET.tag} ${VIB_ASSET.name}` : '27-PA-2001A Export pump A';

function VibAnalysisHeading({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm font-medium text-base-foreground">{title}</span>
      {meta ? <span className="text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
    </div>
  );
}

function VibAnalysisWaveform() {
  const { samples, overall } = vibNow();
  const shown = samples.slice(0, 206);
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Time waveform, pump drive end" meta="100 ms, 2 048 Hz" />
      <WaveformPlot
        label={`Velocity waveform at the pump drive end over 100 milliseconds, RMS ${formatValue(overall, 1)} millimetres per second, impacts at the bearing outer race rate`}
        samples={shown}
        sampleRateHz={VIB_SAMPLE_RATE}
        unit="mm/s"
        runningHz={VIB_RUNNING_HZ}
        level={{ value: overall, label: `RMS ${formatValue(overall, 1)}` }}
        range={20}
      />
      <p className="text-xs text-muted-foreground">Ticks on the baseline mark each shaft revolution. Sharp bursts between them repeat at the bearing outer race rate.</p>
    </div>
  );
}

function VibAnalysisSpectrumHarmonics() {
  const { spectrum } = vibNow();
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Velocity spectrum, pump drive end" meta="Hann window, 2 Hz lines" />
      <SpectrumPlot
        label="Velocity spectrum with the running speed harmonics 1×, 2× and 3× marked and the bearing outer and inner race frequencies labelled; the 1× peak is highest"
        spectrum={spectrum}
        unit="mm/s RMS"
        maxHz={200}
        cursors={harmonicFamily(VIB_RUNNING_HZ, { count: 3 })}
        markers={VIB_MARKERS}
        heightClassName="h-56"
      />
    </div>
  );
}

function VibAnalysisCrestKurtosis() {
  const now = vibNow();
  const base = vibBaseline();
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <KpiTile
        size="compact"
        label="Crest factor"
        value={now.crest}
        decimals={1}
        tone={now.crest > VIB_CREST_ALERT ? 'warning' : 'neutral'}
        status={now.crest > VIB_CREST_ALERT ? { tone: 'warning', label: 'Elevated', shape: 'square' } : { tone: 'success', label: 'Normal', shape: 'dot' }}
        delta={{ reference: base.crest, goodDirection: 'down', caption: 'vs baseline', decimals: 1 }}
        footnote="Peak over RMS above 400 Hz"
      />
      <KpiTile
        size="compact"
        label="Kurtosis"
        value={now.kurtosis}
        decimals={1}
        tone={now.kurtosis > VIB_KURTOSIS_ALERT ? 'warning' : 'neutral'}
        status={now.kurtosis > VIB_KURTOSIS_ALERT ? { tone: 'warning', label: 'Impacts', shape: 'square' } : { tone: 'success', label: 'Normal', shape: 'dot' }}
        delta={{ reference: base.kurtosis, goodDirection: 'down', caption: 'vs baseline', decimals: 1 }}
        footnote="Above 3.5 points to impacts"
      />
    </div>
  );
}

function VibAnalysisOverallTile() {
  const trend = vibTrend();
  const latest = trend[trend.length - 1].v;
  const zone = isoZone(latest, VIB_BOUNDARIES);
  return (
    <KpiTile
      label="Overall velocity · pump DE"
      value={latest}
      unit="mm/s RMS"
      decimals={1}
      tone={ISO_ZONE_TONE[zone]}
      status={{ tone: ISO_ZONE_TONE[zone], label: `Zone ${zone}`, shape: 'square' }}
      delta={{ reference: trend[trend.length - 31].v, goodDirection: 'down', caption: 'vs 30 d ago', decimals: 1 }}
      trend={{ values: trend.map((point) => point.v), label: 'Overall velocity, last 60 days', limit: VIB_BOUNDARIES.cd }}
      className="w-full max-w-xs"
    />
  );
}

function VibAnalysisBandBars() {
  const levels = bandLevels(vibNow().spectrum, VIB_BANDS);
  const top = Math.max(...levels.map((band) => Math.max(band.level, band.alarm ?? 0))) * 1.1;
  return (
    <div className="flex w-full flex-col gap-4">
      <VibAnalysisHeading title="Band energy against alarm" meta="mm/s RMS" />
      <ul aria-label="Vibration level in each frequency band against its alarm" className="flex flex-col gap-4">
        {levels.map((band) => {
          const tone: Tone = band.exceeded ? 'warning' : 'neutral';
          return (
            <li key={band.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-base-foreground">{band.label}</span>
                <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                  <span className={`font-medium ${band.exceeded ? TONE_TEXT.warning : 'text-base-foreground'}`}>{formatValue(band.level, 2)}</span>
                  {band.exceeded ? <span className="text-xs font-medium text-warning-foreground-strong">Above alarm</span> : null}
                </span>
              </div>
              <div aria-hidden="true" className="relative h-2 rounded-full bg-chart-neutral-100">
                <span className={`absolute inset-y-0 left-0 rounded-full ${TONE_MARK_BG[tone]}`} style={{ width: `${(band.level / top) * 100}%` }} />
                <span className="absolute -inset-y-1 w-0.5 rounded-full bg-base-foreground" style={{ left: `${((band.alarm ?? 0) / top) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatValue(band.fromHz, 0)} to {formatValue(band.toHz, 0)} Hz · alarm {formatValue(band.alarm ?? 0, 1)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VibAnalysisSpectrumMask() {
  const { spectrum } = vibNow();
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Spectrum against alarm envelope" meta="Dashed line is the limit" />
      <SpectrumPlot
        label="Velocity spectrum against a stepped alarm envelope; the 1× peak and the bearing outer race peak break through it"
        spectrum={spectrum}
        unit="mm/s RMS"
        maxHz={300}
        mask={VIB_MASK}
        markers={[VIB_MARKERS[0]]}
        heightClassName="h-56"
      />
      <StatusIndicator tone="critical" shape="diamond" label="Envelope exceeded" detail="1× and BPFO lines" size="sm" />
    </div>
  );
}

function VibAnalysisSpectrumCompare() {
  const { spectrum } = vibNow();
  const baseline = vibBaseline().spectrum;
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Baseline against now" meta="Grey: commissioning, blue: today" />
      <SpectrumPlot
        label="Spectrum today compared with the commissioning baseline: the bearing outer race line and its harmonic have grown, 1× has doubled"
        spectrum={spectrum}
        baseline={baseline}
        unit="mm/s RMS"
        maxHz={300}
        markers={VIB_MARKERS}
        cursors={harmonicFamily(VIB_RUNNING_HZ, { count: 2 })}
        heightClassName="h-56"
      />
    </div>
  );
}

function VibAnalysisWaterfall() {
  const traces = VIB_WATERFALL_STEPS.map((step, index) => ({
    id: `wf-${index}`,
    label: formatDate(REFERENCE_NOW - (VIB_WATERFALL_STEPS.length - 1 - index) * 6 * DAY),
    spectrum: vibWaterfallMeasure(step, index).spectrum,
  }));
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Waterfall, pump drive end" meta="Eight surveys, six days apart" />
      <WaterfallPlot
        label="Waterfall of eight spectra over 42 days: the 1× peak holds its place while the bearing outer race line near 86 Hz grows from nothing into the second tallest ridge"
        traces={traces}
        maxHz={200}
        maxAmplitude={8}
        unit="mm/s RMS"
        surfaceClassName="fill-card-background"
      />
    </div>
  );
}

function VibAnalysisAccelerationSpectrum() {
  const spectrum = useMemo(() => toAccelerationSpectrum(vibNow().spectrum), []);
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Acceleration spectrum, to 1 kHz" meta="Same data in g" />
      <SpectrumPlot
        label="Acceleration spectrum to 1 kilohertz: the bearing ring-down near 600 hertz stands out, which the velocity spectrum hides"
        spectrum={spectrum}
        unit="g RMS"
        maxHz={1000}
        heightClassName="h-56"
      />
    </div>
  );
}

function VibAnalysisOrderSpectrum() {
  const { spectrum } = vibNow();
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Spectrum in orders" meta="1× = 24 Hz = 1 440 rpm" />
      <SpectrumPlot
        label="Velocity spectrum with a second axis in orders of running speed, 1× to 8×"
        spectrum={spectrum}
        unit="mm/s RMS"
        maxHz={192}
        runningHz={VIB_RUNNING_HZ}
        heightClassName="h-48"
      />
    </div>
  );
}

const VIB_ORBIT = orbitPoints({ xAmplitude: 38, yAmplitude: 30, phaseDeg: 80, secondOrder: 0.1 });

function VibAnalysisOrbit() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <VibAnalysisHeading title="Orbit, pump drive end" meta="X–Y probes" />
      <OrbitPlot label="Shaft orbit from the X and Y probes: a slightly flattened ellipse reaching 40 micrometres, inside the 45 micrometre alert circle" points={VIB_ORBIT} unit="µm" limit={{ radius: 45, label: 'Alert 45' }} range={50} size={280} />
      <p className="text-xs text-muted-foreground">The dot is the keyphasor pulse. The orbit turns counter-clockwise, with the rotor.</p>
    </div>
  );
}

const VIB_ORBIT_SHAPES = [
  { id: 'balanced', title: 'Unbalance', text: 'Round', points: orbitPoints({ xAmplitude: 30, yAmplitude: 30 }) },
  { id: 'preload', title: 'Preload', text: 'Flat ellipse', points: orbitPoints({ xAmplitude: 40, yAmplitude: 12, phaseDeg: 100 }) },
  { id: 'misalignment', title: 'Misalignment', text: 'Banana or figure of eight', points: orbitPoints({ xAmplitude: 30, yAmplitude: 30, secondOrder: 0.55 }) },
  { id: 'rub', title: 'Rub or whirl', text: 'Inner loop', points: orbitPoints({ xAmplitude: 28, yAmplitude: 28, halfOrder: 0.45, revolutions: 2 }) },
] as const;

function VibAnalysisOrbitShapes() {
  return (
    <ul aria-label="Orbit shapes and what they point to" className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      {VIB_ORBIT_SHAPES.map((shape) => (
        <li key={shape.id} className="flex flex-col gap-2">
          <OrbitPlot label={`${shape.title} orbit: ${shape.text.toLowerCase()}`} points={shape.points} unit="µm" range={50} size={180} />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-base-foreground">{shape.title}</span>
            <span className="text-xs text-muted-foreground">{shape.text}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const VIB_CENTRELINE = [0, 0.1, 0.3, 0.6, 1].map((fraction) => ({ ...centrelinePosition(fraction, { clearance: 120 }), label: formatValue(fraction * 1440, 0) }));

function VibAnalysisShaftCentreline() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <VibAnalysisHeading title="Shaft centreline" meta="Run-up to 1 440 rpm" />
      <ShaftCentrelinePlot label="Shaft centreline during run-up: the journal lifts from the bottom of the 120 micrometre clearance to an eccentricity ratio of 0.45, as expected for a healthy oil wedge" samples={VIB_CENTRELINE} clearance={120} unit="µm" size={280} />
    </div>
  );
}

const VIB_ROTOR = { criticalRpm: 1100, dampingRatio: 0.09, eccentricity: 18 };
const VIB_RUNUP = runUp(VIB_ROTOR, 100, 1800, 90);

function VibAnalysisBode() {
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Run-up, Bode plot" meta="100 to 1 800 rpm" />
      <BodePlot label="Bode plot of a run-up: amplitude peaks near 1 100 rpm where phase passes 90 degrees, 24 percent below the 1 440 rpm operating speed" points={VIB_RUNUP} unit="µm pp" operatingRpm={1440} />
      <p className="text-xs text-muted-foreground tabular-nums">Separation margin {formatValue(((1440 - 1100) / 1440) * 100, 0)} % of operating speed.</p>
    </div>
  );
}

function VibAnalysisPolar() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <VibAnalysisHeading title="Run-up, polar plot" meta="Speeds in rpm" />
      <PolarPlot label="Polar plot of the run-up: a loop through the critical speed near 1 100 rpm, ending at 180 degrees of phase lag" points={VIB_RUNUP} unit="µm pp" labelSpeeds={[500, 1100, 1700]} />
    </div>
  );
}

function VibAnalysisIsoTrend() {
  const trend = vibTrend();
  return (
    <div className="flex w-full flex-col gap-3">
      <VibAnalysisHeading title="Overall velocity, last 60 days" meta="ISO 10816-3, group 1, rigid foundation" />
      <IsoZoneTrend
        label="Overall velocity at the pump drive end over 60 days, rising steadily from zone B into zone C"
        points={trend}
        boundaries={VIB_BOUNDARIES}
        formatTime={formatDate}
        max={10}
        heightClassName="h-64"
      />
    </div>
  );
}

function VibAnalysisZoneKey() {
  const edges = [`up to ${VIB_BOUNDARIES.ab}`, `${VIB_BOUNDARIES.ab} to ${VIB_BOUNDARIES.bc}`, `${VIB_BOUNDARIES.bc} to ${VIB_BOUNDARIES.cd}`, `above ${VIB_BOUNDARIES.cd}`];
  return (
    <table className="w-full text-sm">
      <caption className="pb-2 text-left text-xs text-muted-foreground">ISO 10816-3 zones, mm/s RMS</caption>
      <tbody>
        {ISO_ZONES.map((zone, index) => {
          const tone = ISO_ZONE_TONE[zone];
          return (
            <tr key={zone} className="align-top">
              <th scope="row" className={`w-8 py-2 text-left font-semibold ${tone === 'neutral' ? 'text-base-foreground' : TONE_TEXT[tone]}`}>
                {zone}
              </th>
              <td className="w-24 py-2 tabular-nums text-base-foreground">{edges[index]}</td>
              <td className="py-2 text-medium-foreground">{ISO_ZONE_MEANING[zone]}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function VibAnalysisTemperatureCompanion() {
  const velocity = vibTrend();
  const temperature = vibTemperature();
  return (
    <TrendChart
      label="Overall velocity and bearing temperature at the pump drive end over 60 days: both rise together, velocity to 6.5 millimetres per second and temperature to 76 degrees"
      series={[
        { key: 'velocity', label: 'Overall velocity', points: velocity },
        { key: 'temperature', label: 'Bearing temperature', points: temperature, axis: 'right', dashed: true },
      ]}
      limits={[{ value: VIB_BOUNDARIES.bc, label: 'Zone C 4.5', tone: 'warning' }]}
      yDomain={[0, 10]}
      rightDomain={[40, 100]}
      unit="mm/s"
      rightUnit="°C"
      maxTicks={5}
      legend
      heightClassName="h-60"
      summary="Temperature follows velocity: a lubrication or bearing fault, not unbalance alone."
      className="w-full"
    />
  );
}

function VibAnalysisFaultUnbalance() {
  return <FaultSignatureCard signature={FAULT_SIGNATURES.unbalance} className={VIB_BARE_CARD} />;
}

function VibAnalysisFaultMisalignment() {
  return <FaultSignatureCard signature={FAULT_SIGNATURES.misalignment} className={VIB_BARE_CARD} />;
}

function VibAnalysisFaultLooseness() {
  return <FaultSignatureCard signature={FAULT_SIGNATURES.looseness} className={VIB_BARE_CARD} />;
}

function VibAnalysisFaultBearing() {
  return <FaultSignatureCard signature={FAULT_SIGNATURES['bearing-outer']} maxOrder={11} matched className={VIB_BARE_CARD} />;
}

function VibAnalysisDiagnosis() {
  const { spectrum } = vibNow();
  const limited = spectrum.filter((line) => line.frequencyHz <= 300);
  const peaks = useMemo(() => findPeaks(limited, { threshold: 0.4, limit: 7 }).sort((a, b) => a.frequencyHz - b.frequencyHz), [limited]);
  const [selected, setSelected] = useState(() => peaks.reduce((best, peak) => (peak.amplitude > best.amplitude ? peak : best), peaks[0]).frequencyHz);
  const peak = peaks.find((candidate) => candidate.frequencyHz === selected) ?? peaks[0];
  const diagnosis = diagnosePeak(peak.frequencyHz, VIB_CONTEXT);
  const signature = diagnosis && (diagnosis.faultId === 'unbalance' || diagnosis.faultId === 'misalignment' || diagnosis.faultId === 'looseness') ? FAULT_SIGNATURES[diagnosis.faultId] : null;

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <VibAnalysisHeading title="Spectrum peaks" meta={`${peaks.length} peaks above 0.4 mm/s`} />
        <SpectrumPlot
          label={`Velocity spectrum with the selected peak at ${formatValue(peak.frequencyHz, 1)} hertz marked`}
          spectrum={limited}
          unit="mm/s RMS"
          maxHz={300}
          cursorHz={peak.frequencyHz}
          heightClassName="h-60"
        />
        <ul aria-label="Peaks to diagnose" className="flex flex-wrap gap-2">
          {peaks.map((candidate) => (
            <li key={candidate.frequencyHz}>
              <Button size="sm" variant={candidate.frequencyHz === selected ? 'secondary' : 'ghost'} aria-pressed={candidate.frequencyHz === selected} onClick={() => setSelected(candidate.frequencyHz)}>
                <span className="tabular-nums">{formatValue(candidate.frequencyHz, 0)} Hz</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <section aria-label="Diagnosis" aria-live="polite" className="flex min-w-0 flex-col gap-3 border-t border-default pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Selected peak</span>
          <ValueReadout value={peak.frequencyHz} unit="Hz" decimals={1} size="md" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatValue(toOrders(peak.frequencyHz, VIB_RUNNING_HZ), 2)}× running speed · {formatValue(peak.amplitude, 2)} mm/s RMS
          </span>
        </div>
        {diagnosis ? (
          <>
            <MetadataList
              items={[
                { label: 'Matches', value: diagnosis.frequencyName },
                { label: 'Likely cause', value: diagnosis.cause },
                { label: 'Offset', value: `${formatValue(diagnosis.errorOrders * VIB_RUNNING_HZ, 1)} Hz from nominal` },
              ]}
            />
            <p className="text-sm text-medium-foreground">{diagnosis.nextStep}</p>
            {signature ? <p className="text-xs text-muted-foreground">Typical pattern: {signature.pattern}</p> : null}
          </>
        ) : (
          <p className="text-sm text-medium-foreground">This peak is not at a running-speed order, a bearing defect frequency or the vane-pass frequency. Check for a resonance or a neighbouring machine.</p>
        )}
      </section>
    </div>
  );
}

function VibAnalysisPointSelector() {
  const [pointId, setPointId] = useState('p-de');
  const points = vibPointsWithStatus();
  const point = points.find((candidate) => candidate.id === pointId) ?? points[0];
  const measurement = vibMeasure(VIB_SPECS[point.id]);
  const zone = isoZone(measurement.overall, VIB_BOUNDARIES);
  return (
    <div className="flex w-full flex-col gap-4">
      <MachineTrainSketch label="Side view of the motor and pump with four horizontal measurement points; the pump drive end point is above the alert level" points={points} selectedId={pointId} onSelect={setPointId} />
      <div className="flex items-end justify-between gap-4" aria-live="polite">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-xs text-muted-foreground">{point.code}</span>
          <span className="text-sm text-base-foreground">{point.name}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ValueReadout value={measurement.overall} unit="mm/s" decimals={1} size="sm" tone={ISO_ZONE_TONE[zone]} />
          <span className={`text-xs font-medium ${ISO_ZONE_TONE[zone] === 'neutral' ? 'text-muted-foreground' : TONE_TEXT[ISO_ZONE_TONE[zone]]}`}>Zone {zone}</span>
        </div>
      </div>
    </div>
  );
}

function VibAnalysisPointTable() {
  const points = vibPointsWithStatus();
  const sensors = ['IEPE accelerometer', 'IEPE accelerometer', 'IEPE accelerometer', 'Velocity transducer'];
  return (
    <table className="w-full text-sm">
      <caption className="pb-2 text-left text-xs text-muted-foreground">Measurement points of {VIB_ASSET?.tag ?? '27-PA-2001A'}, latest survey</caption>
      <thead>
        <tr>
          <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Point</th>
          <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Sensor</th>
          <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Overall, mm/s</th>
          <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Zone</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point, index) => {
          const overall = vibMeasure(VIB_SPECS[point.id]).overall;
          const zone = isoZone(overall, VIB_BOUNDARIES);
          return (
            <tr key={point.id}>
              <td className="px-2 py-2.5">
                <span className="font-mono text-xs text-muted-foreground">{point.code}</span> <span className="text-base-foreground">{point.name.replace(', horizontal', '')}</span>
              </td>
              <td className="px-2 py-2.5 text-medium-foreground">{sensors[index]}</td>
              <td className="px-2 py-2.5 text-right tabular-nums text-base-foreground">{formatValue(overall, 1)}</td>
              <td className="px-2 py-2.5">
                <StatusIndicator tone={ISO_ZONE_TONE[zone]} shape={zone === 'D' ? 'diamond' : zone === 'C' ? 'square' : 'dot'} label={`Zone ${zone}`} size="sm" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function VibAnalysisInteractiveSpectrum() {
  const { spectrum } = vibNow();
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-sm text-muted-foreground">Move over the spectrum or use the arrow keys to read a line. Shift and an arrow jumps between peaks; click or press Enter to draw harmonics from a line, Escape to clear them.</p>
      <InteractiveSpectrum
        label="Interactive velocity spectrum of the pump drive end"
        spectrum={spectrum}
        unit="mm/s RMS"
        runningHz={VIB_RUNNING_HZ}
        maxHz={300}
        markers={VIB_MARKERS}
        peakThreshold={0.4}
        harmonics={8}
        initialHz={86}
        initialFundamentalHz={VIB_RUNNING_HZ}
        heightClassName="h-72"
      />
    </div>
  );
}

type VibUnit = 'velocity' | 'acceleration';

function VibAnalysisUnitSwitch() {
  const [unit, setUnit] = useState<VibUnit>('velocity');
  const { spectrum } = vibNow();
  const shown = useMemo(() => (unit === 'velocity' ? spectrum : toAccelerationSpectrum(spectrum)), [unit, spectrum]);
  const label = unit === 'velocity' ? 'mm/s RMS' : 'g RMS';
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VibAnalysisHeading title="Spectrum units" />
        <SegmentedControl
          value={unit}
          onValueChange={(next: unknown) => {
            if (next === 'velocity' || next === 'acceleration') setUnit(next);
          }}
        >
          <SegmentedControlList aria-label="Amplitude unit" size="small">
            <SegmentedControlButton value="velocity" size="small" tabContent="label-only">
              mm/s RMS
            </SegmentedControlButton>
            <SegmentedControlButton value="acceleration" size="small" tabContent="label-only">
              g RMS
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <SpectrumPlot
        key={unit}
        label={`Spectrum of the pump drive end in ${label}, to 800 hertz`}
        spectrum={shown}
        unit={label}
        maxHz={800}
        heightClassName="h-60"
      />
      <p className="text-xs text-muted-foreground">
        {unit === 'velocity' ? 'Velocity weighs running-speed faults, which dominate here.' : 'Acceleration weighs frequency: the same data now shows the high-frequency bearing energy more strongly.'}
      </p>
    </div>
  );
}

type VibView = 'spectrum' | 'waveform';

function VibAnalysisWorkbench() {
  const [pointId, setPointId] = useState('p-de');
  const [view, setView] = useState<VibView>('spectrum');
  const points = vibPointsWithStatus();
  const point = points.find((candidate) => candidate.id === pointId) ?? points[0];
  const measurement = vibMeasure(VIB_SPECS[pointId]);
  const zone = isoZone(measurement.overall, VIB_BOUNDARIES);
  const baseline = vibBaseline();
  const peaks = findPeaks(measurement.spectrum.filter((line) => line.frequencyHz <= 300), { threshold: 0.6, limit: 4 });

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-sm font-medium text-base-foreground">{VIB_ASSET?.tag ?? '27-PA-2001A'}</span>
          <span className="text-xs text-muted-foreground">{VIB_PUMP_NAME} · 1 440 rpm · 5 vanes</span>
        </div>
        <MachineTrainSketch label="Measurement points on the pump train. Choose one to analyse." points={points} selectedId={pointId} onSelect={setPointId} />
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Overall</span>
            <ValueReadout value={measurement.overall} unit="mm/s" decimals={1} size="sm" tone={ISO_ZONE_TONE[zone]} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Crest factor</span>
            <ValueReadout value={measurement.crest} decimals={1} size="sm" tone={measurement.crest > VIB_CREST_ALERT ? 'warning' : 'neutral'} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Kurtosis</span>
            <ValueReadout value={measurement.kurtosis} decimals={1} size="sm" tone={measurement.kurtosis > VIB_KURTOSIS_ALERT ? 'warning' : 'neutral'} />
          </div>
        </div>
        <StatusIndicator
          tone={ISO_ZONE_TONE[zone]}
          shape={zone === 'D' ? 'diamond' : zone === 'C' ? 'square' : 'dot'}
          label={`ISO zone ${zone}`}
          size="sm"
        />
        <p className="text-xs text-muted-foreground">{ISO_ZONE_MEANING[zone]}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-base-foreground">{point.name}</span>
          <SegmentedControl
            value={view}
            onValueChange={(next: unknown) => {
              if (next === 'spectrum' || next === 'waveform') setView(next);
            }}
          >
            <SegmentedControlList aria-label="Plot" size="small">
              <SegmentedControlButton value="spectrum" size="small" tabContent="label-only">
                Spectrum
              </SegmentedControlButton>
              <SegmentedControlButton value="waveform" size="small" tabContent="label-only">
                Waveform
              </SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        </div>
        {view === 'spectrum' ? (
          <SpectrumPlot
            key={pointId}
            label={`Velocity spectrum at ${point.name}, with the commissioning baseline in grey`}
            spectrum={measurement.spectrum}
            baseline={baseline.spectrum}
            unit="mm/s RMS"
            maxHz={250}
            cursors={harmonicFamily(VIB_RUNNING_HZ, { count: 3 })}
            markers={VIB_MARKERS}
            heightClassName="h-64"
          />
        ) : (
          <WaveformPlot
            key={pointId}
            label={`Velocity waveform at ${point.name} over 100 milliseconds`}
            samples={measurement.samples.slice(0, 206)}
            sampleRateHz={VIB_SAMPLE_RATE}
            unit="mm/s"
            runningHz={VIB_RUNNING_HZ}
            level={{ value: measurement.overall, label: `RMS ${formatValue(measurement.overall, 1)}` }}
            range={20}
            heightClassName="h-64"
          />
        )}
        <ul aria-label="Strongest peaks and their likely cause" className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {peaks.map((peak) => {
            const diagnosis = diagnosePeak(peak.frequencyHz, VIB_CONTEXT);
            return (
              <li key={peak.frequencyHz} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="tabular-nums text-base-foreground">
                  {formatValue(peak.frequencyHz, 0)} Hz <span className="text-muted-foreground">{formatValue(peak.amplitude, 1)} mm/s</span>
                </span>
                <span className="truncate text-medium-foreground">{diagnosis ? diagnosis.cause : 'No match'}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default definePage({
  id: 'vibration-analysis',
  title: 'Vibration analysis',
  summary:
    'Condition-monitoring plots for rotating equipment, drawn from synthetic but physically plausible signals: waveform and spectrum with harmonic cursors, alarm envelopes and waterfalls, orbit, Bode and polar plots, ISO zones, fault signatures and a diagnosis from peak to cause.',
  guidance: {
    use: [
      'Show the waveform, the spectrum and the trend together: each hides what another shows.',
      'Label running-speed harmonics and bearing frequencies on the spectrum so peaks can be read without a handbook.',
      'Use ISO zones for overall velocity: they turn a number into a judgement everyone shares.',
      'Offer a unit switch where specialists expect velocity and acceleration.',
    ],
    avoid: [
      'Colouring the spectrum by status: only lines that break an envelope earn it.',
      'Diagnosing from one plot. Link a peak to a candidate cause, then say what to confirm.',
      'Plots without axes in Hz and the unit. A spectrum is read off its scale.',
    ],
  },
  source,
  sections: [
    {
      id: 'signals',
      title: 'Signals and overall levels',
      description: 'The raw waveform, its spectrum and the numbers distilled from them.',
      specimens: [
        {
          id: 'VibAnalysisWaveform',
          title: 'Time waveform',
          note: 'Pick it to see impacts, clipping and beating that a spectrum averages away.',
          origin: 'custom',
          uses: ['industrial/condition/WaveformPlot.tsx', 'industrial/condition/signal.ts', 'industrial/condition/PlotFrame.tsx'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisWaveform,
        },
        {
          id: 'VibAnalysisSpectrumHarmonics',
          title: 'Spectrum with harmonic cursors',
          note: 'Pick it as the default fault-finding view: 1×, 2× and 3× above, bearing frequencies beneath.',
          origin: 'custom',
          uses: ['industrial/condition/SpectrumPlot.tsx', 'industrial/condition/harmonics.ts', 'industrial/condition/dft.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisSpectrumHarmonics,
        },
        {
          id: 'VibAnalysisOverallTile',
          title: 'Overall velocity tile',
          note: 'Pick it on an asset summary: one number with its ISO zone and a 60-day trend.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/condition/isoZones.ts'],
          size: 'sm',
          Component: VibAnalysisOverallTile,
        },
        {
          id: 'VibAnalysisCrestKurtosis',
          title: 'Crest factor and kurtosis',
          note: 'Pick them for early bearing wear: both rise on impacts well before overall velocity moves.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/condition/signal.ts'],
          size: 'lg',
          align: 'stretch',
          Component: VibAnalysisCrestKurtosis,
        },
        {
          id: 'VibAnalysisBandBars',
          title: 'Band energy',
          note: 'Pick it when alarms are set per frequency band rather than on the overall level.',
          origin: 'custom',
          uses: ['industrial/condition/harmonics.ts', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisBandBars,
        },
        {
          id: 'VibAnalysisUnitSwitch',
          title: 'Units switch',
          note: 'Pick it when users move between velocity and acceleration; the axis and unit change together.',
          origin: 'custom',
          uses: ['industrial/condition/SpectrumPlot.tsx', 'industrial/condition/harmonics.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisUnitSwitch,
        },
      ],
    },
    {
      id: 'spectra',
      title: 'Spectrum analysis',
      description: 'Compare a spectrum with limits, with its past and with its own acceleration.',
      specimens: [
        {
          id: 'VibAnalysisSpectrumMask',
          title: 'Alarm envelope',
          note: 'Pick it for automatic screening: lines above the stepped limit are redrawn in the critical colour.',
          origin: 'custom',
          uses: ['industrial/condition/SpectrumPlot.tsx', 'industrial/condition/harmonics.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisSpectrumMask,
        },
        {
          id: 'VibAnalysisSpectrumCompare',
          title: 'Baseline against now',
          note: 'Pick it to show what changed since commissioning, with the baseline in quiet grey.',
          origin: 'custom',
          uses: ['industrial/condition/SpectrumPlot.tsx'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisSpectrumCompare,
        },
        {
          id: 'VibAnalysisOrderSpectrum',
          title: 'Orders of running speed',
          note: 'Pick it on variable-speed machines, where faults sit at fixed orders rather than fixed frequencies.',
          origin: 'custom',
          uses: ['industrial/condition/SpectrumPlot.tsx'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisOrderSpectrum,
        },
        {
          id: 'VibAnalysisAccelerationSpectrum',
          title: 'Acceleration to 1 kHz',
          note: 'Pick it for rolling-element bearings: defect energy sits high, where acceleration is most sensitive.',
          origin: 'custom',
          uses: ['industrial/condition/SpectrumPlot.tsx', 'industrial/condition/harmonics.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisAccelerationSpectrum,
        },
        {
          id: 'VibAnalysisWaterfall',
          title: 'Waterfall',
          note: 'Pick it to show a fault developing: a ridge that grows from survey to survey.',
          origin: 'custom',
          uses: ['industrial/condition/WaterfallPlot.tsx'],
          size: 'full',
          align: 'stretch',
          Component: VibAnalysisWaterfall,
        },
      ],
    },
    {
      id: 'rotor',
      title: 'Shaft and rotor dynamics',
      description: 'Proximity-probe plots for machines on fluid-film bearings.',
      specimens: [
        {
          id: 'VibAnalysisBode',
          title: 'Bode plot',
          note: 'Pick it for run-up and coast-down records: amplitude and phase against speed.',
          origin: 'custom',
          uses: ['industrial/condition/BodePlot.tsx', 'industrial/condition/rotor.ts'],
          size: 'lg',
          align: 'stretch',
          Component: VibAnalysisBode,
        },
        {
          id: 'VibAnalysisPolar',
          title: 'Polar plot',
          note: 'Pick it to tell a true critical speed from a structural resonance: it draws a loop.',
          origin: 'custom',
          uses: ['industrial/condition/PolarPlot.tsx', 'industrial/condition/rotor.ts'],
          size: 'sm',
          align: 'stretch',
          Component: VibAnalysisPolar,
        },
        {
          id: 'VibAnalysisOrbit',
          title: 'Orbit with keyphasor',
          note: 'Pick it to see where the shaft actually moves; the dot ties the picture to rotation.',
          origin: 'custom',
          uses: ['industrial/condition/OrbitPlot.tsx', 'industrial/condition/rotor.ts', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisOrbit,
        },
        {
          id: 'VibAnalysisShaftCentreline',
          title: 'Shaft centreline',
          note: 'Pick it at start-up and after bearing work: it shows the oil wedge forming.',
          origin: 'custom',
          uses: ['industrial/condition/ShaftCentrelinePlot.tsx', 'industrial/condition/rotor.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisShaftCentreline,
        },
        {
          id: 'VibAnalysisOrbitShapes',
          title: 'Orbit shapes',
          note: 'Pick it as a reference beside a live orbit: the shape points at the fault.',
          origin: 'custom',
          uses: ['industrial/condition/OrbitPlot.tsx', 'industrial/condition/rotor.ts'],
          size: 'full',
          align: 'stretch',
          Component: VibAnalysisOrbitShapes,
        },
      ],
    },
    {
      id: 'trend',
      title: 'Trends and limits',
      description: 'Where the machine sits against the standard, and what moves with it.',
      specimens: [
        {
          id: 'VibAnalysisIsoTrend',
          title: 'ISO zone trend',
          note: 'Pick it for the long view: overall velocity against zones A to D, lettered as well as shaded.',
          origin: 'custom',
          uses: ['industrial/condition/IsoZoneTrend.tsx', 'industrial/condition/isoZones.ts'],
          size: 'lg',
          align: 'stretch',
          Component: VibAnalysisIsoTrend,
        },
        {
          id: 'VibAnalysisZoneKey',
          title: 'Zone key',
          note: 'Pick it beside a zone trend: boundaries and meaning for the machine class.',
          origin: 'custom',
          uses: ['industrial/condition/isoZones.ts'],
          size: 'sm',
          align: 'stretch',
          Component: VibAnalysisZoneKey,
        },
        {
          id: 'VibAnalysisTemperatureCompanion',
          title: 'Velocity with bearing temperature',
          note: 'Pick it to separate a lubrication or bearing fault from unbalance: temperature rises only with the former.',
          origin: 'custom',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/condition/isoZones.ts'],
          size: 'full',
          align: 'stretch',
          Component: VibAnalysisTemperatureCompanion,
        },
      ],
    },
    {
      id: 'diagnosis',
      title: 'Fault signatures and diagnosis',
      description: 'What each fault looks like, and a peak linked to its cause.',
      specimens: [
        {
          id: 'VibAnalysisFaultUnbalance',
          title: 'Signature: unbalance',
          note: 'Pick it for the most common fault: a single dominant 1× line.',
          origin: 'custom',
          uses: ['industrial/condition/FaultSignatureCard.tsx', 'industrial/condition/faults.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisFaultUnbalance,
        },
        {
          id: 'VibAnalysisFaultMisalignment',
          title: 'Signature: misalignment',
          note: 'Pick it when 2× rivals 1× and axial readings are high.',
          origin: 'custom',
          uses: ['industrial/condition/FaultSignatureCard.tsx', 'industrial/condition/faults.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisFaultMisalignment,
        },
        {
          id: 'VibAnalysisFaultLooseness',
          title: 'Signature: looseness',
          note: 'Pick it when a spectrum shows a comb of harmonics with half orders between them.',
          origin: 'custom',
          uses: ['industrial/condition/FaultSignatureCard.tsx', 'industrial/condition/faults.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisFaultLooseness,
        },
        {
          id: 'VibAnalysisFaultBearing',
          title: 'Signature: bearing defect',
          note: 'Pick it, marked as a match, to confirm a finding: peaks at a non-integer order and its harmonics.',
          origin: 'custom',
          uses: ['industrial/condition/FaultSignatureCard.tsx', 'industrial/condition/faults.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisFaultBearing,
        },
        {
          id: 'VibAnalysisDiagnosis',
          title: 'Diagnosis panel',
          note: 'Pick a peak and read its likely cause, how far it sits from nominal and what to check next.',
          origin: 'custom',
          uses: ['industrial/condition/faults.ts', 'industrial/condition/SpectrumPlot.tsx', 'display/MetadataList.tsx'],
          size: 'full',
          align: 'stretch',
          Component: VibAnalysisDiagnosis,
        },
      ],
    },
    {
      id: 'tools',
      title: 'Working tools',
      description: 'Interactive views: choose where to measure, read lines with a cursor, switch units, analyse a point end to end.',
      specimens: [
        {
          id: 'VibAnalysisPointSelector',
          title: 'Measurement point selector',
          note: 'Pick it to choose where to look: each point carries its overall level and zone.',
          origin: 'custom',
          uses: ['industrial/condition/MachineTrainSketch.tsx', 'industrial/condition/isoZones.ts'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisPointSelector,
        },
        {
          id: 'VibAnalysisPointTable',
          title: 'Measurement point table',
          note: 'Pick it beside the sketch for the numbers: sensor, overall level and zone for every point.',
          origin: 'custom',
          uses: ['industrial/condition/isoZones.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: VibAnalysisPointTable,
        },
        {
          id: 'VibAnalysisInteractiveSpectrum',
          title: 'Interactive spectrum',
          note: 'Pick it for analysis at the desk: a cursor reads Hz, orders and amplitude, and a click draws a harmonic family.',
          origin: 'custom',
          uses: ['industrial/condition/InteractiveSpectrum.tsx', 'industrial/condition/spectrumCursor.ts'],
          size: 'full',
          align: 'stretch',
          Component: VibAnalysisInteractiveSpectrum,
        },
        {
          id: 'VibAnalysisWorkbench',
          title: 'Analysis workbench',
          note: 'Pick it as the page of a condition-monitoring app: point, levels, plot and diagnosis in one view.',
          origin: 'custom',
          uses: [
            'industrial/condition/MachineTrainSketch.tsx',
            'industrial/condition/SpectrumPlot.tsx',
            'industrial/condition/WaveformPlot.tsx',
            'industrial/condition/faults.ts',
            'industrial/condition/isoZones.ts',
          ],
          size: 'full',
          align: 'stretch',
          Component: VibAnalysisWorkbench,
        },
      ],
    },
  ],
});
