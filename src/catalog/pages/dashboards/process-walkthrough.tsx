import { Button } from '@cognite/aura/components/button';
import { IconArrowNarrowLeft, IconArrowNarrowRight, IconRoute } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { buildAssetTree, isAbnormal, type TreeNode, type TreeSensor } from '../../../library/kit/miller-columns/assetTree';
import { EXTRA_SENSORS } from '../../../library/kit/miller-columns/plantFixture';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, SENSORS } from '../../data/plant';
import { MINUTE, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './process-walkthrough.tsx?raw';

type PwSymbolKind = 'valve' | 'separator' | 'compressor' | 'exchanger' | 'pump';

type PwStream = { pressure: number; temperature: number };

type PwStation = {
  id: string;
  /** Short name on the strip. */
  name: string;
  assetId: string;
  symbol: PwSymbolKind;
  /** Metres along the train from the inlet flange. */
  chainage: number;
  inlet: PwStream;
  outlet: PwStream;
  /** Gas through the station, MSm³/d. */
  flow: number;
  /** The instrument an operator reads first at this station. */
  keySensorId: string;
  duty: string;
  story: string;
};

/** The gas train from the inlet flange to the export header, in the order the gas meets it. */
const PW_STATIONS: readonly PwStation[] = [
  {
    id: 'inlet',
    name: 'Inlet',
    assetId: '20-xv-1105',
    symbol: 'valve',
    chainage: 0,
    inlet: { pressure: 14.2, temperature: 42 },
    outlet: { pressure: 13.6, temperature: 41 },
    flow: 4.61,
    keySensorId: 'zt-11051',
    duty: 'Isolates the plant from the pipeline',
    story: 'Wet gas arrives from the wells at 14 bar. The shutdown valve is the first thing it meets and the last line of defence: it closes in under four seconds on a plant trip.',
  },
  {
    id: 'separation',
    name: 'Separation',
    assetId: '20-va-1001',
    symbol: 'separator',
    chainage: 18,
    inlet: { pressure: 13.6, temperature: 41 },
    outlet: { pressure: 13.1, temperature: 38 },
    flow: 4.52,
    keySensorId: 'lt-10012',
    duty: 'Knocks out water and condensate',
    story: 'The gas slows down in the vessel and the liquids fall out. The level is held near the middle so that neither gas blows out the bottom nor liquid carries over to the compressors.',
  },
  {
    id: 'stage-1',
    name: '1st stage',
    assetId: '23-ka-9101',
    symbol: 'compressor',
    chainage: 46,
    inlet: { pressure: 12.4, temperature: 36 },
    outlet: { pressure: 48.6, temperature: 141.2 },
    flow: 4.47,
    keySensorId: 'tt-92532',
    duty: 'Lifts the gas from 12 to 49 bar',
    story: 'The first stage does most of the work and shows it: compression heats the gas by more than a hundred degrees. With the recompressor down it runs harder than usual, and discharge temperature is the figure to watch.',
  },
  {
    id: 'cooling',
    name: 'Cooling',
    assetId: '23-ha-9114',
    symbol: 'exchanger',
    chainage: 61,
    inlet: { pressure: 48.6, temperature: 141.2 },
    outlet: { pressure: 47.9, temperature: 38.9 },
    flow: 4.47,
    keySensorId: 'tt-91141',
    duty: 'Takes the heat of compression out',
    story: 'Cooling water brings the gas back under 40 °C so the second stage can compress it again. The tube bundle is fouling: the outlet temperature has drifted to within a degree of its limit.',
  },
  {
    id: 'stage-2',
    name: '2nd stage',
    assetId: '23-ka-9102',
    symbol: 'compressor',
    chainage: 78,
    inlet: { pressure: 47.9, temperature: 38.9 },
    outlet: { pressure: 96.4, temperature: 128.5 },
    flow: 4.43,
    keySensorId: 'pt-92631',
    duty: 'Doubles the pressure to export level',
    story: 'The second stage takes the cooled gas to pipeline pressure. It is the healthiest machine in the train and has six bar in hand before its discharge limit.',
  },
  {
    id: 'export',
    name: 'Export',
    assetId: '27-pa-2001a',
    symbol: 'pump',
    chainage: 112,
    inlet: { pressure: 95.8, temperature: 48 },
    outlet: { pressure: 95.1, temperature: 47 },
    flow: 4.38,
    keySensorId: 'ft-20011',
    duty: 'Meters the gas and sends condensate with it',
    story: 'Dry gas leaves for the pipeline at 95 bar while pump A returns the recovered condensate to the export line. Pump B stands by. What passes the meter here is the number the plant is paid for.',
  },
];

const PW_TREE = buildAssetTree({ assets: ASSETS, sensors: [...SENSORS, ...EXTRA_SENSORS], alarms: ALARMS });

/** Half the width of each symbol in its own 160 × 110 box: where the flow line meets it. */
const PW_SYMBOL_REACH: Record<PwSymbolKind, number> = { valve: 50, separator: 72, compressor: 55, exchanger: 40, pump: 36 };

const PW_SYMBOL_NAME: Record<PwSymbolKind, string> = {
  valve: 'Shutdown valve',
  separator: 'Separator',
  compressor: 'Compressor',
  exchanger: 'Cooler',
  pump: 'Pump',
};

function pwAsset(station: PwStation): TreeNode {
  return PW_TREE.byId.get(station.assetId) ?? PW_TREE.root;
}

function pwKeySensor(station: PwStation): { node: TreeNode; sensor: TreeSensor } | undefined {
  const node = PW_TREE.byId.get(station.keySensorId);
  return node?.sensor ? { node, sensor: node.sensor } : undefined;
}

/** A station's colour: ink while normal, the state colour when the unit or its key instrument is flagged. */
function pwTone(station: PwStation): Tone {
  const asset = pwAsset(station);
  const key = pwKeySensor(station);
  if (asset.tone === 'critical' || key?.node.tone === 'critical') return 'critical';
  if (isAbnormal(asset.tone) || (key && isAbnormal(key.node.tone))) return 'warning';
  return 'accent';
}

function pwSigned(value: number, decimals = 1): string {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value), decimals)}`;
}

/** The last 24 hours of a tag, ending on its current value. */
function pwTrend(sensor: TreeSensor): { values: number[]; labels: string[] } {
  const band = sensor.highLimit - sensor.lowLimit;
  const raw = makeSeries({
    seed: sensor.seed,
    points: 25,
    base: sensor.value,
    amplitude: band * 0.06,
    noise: band * 0.025,
    cycles: 2,
    stepMs: 60 * MINUTE,
    decimals: sensor.decimals,
  });
  const offset = sensor.value - (raw[raw.length - 1]?.v ?? sensor.value);
  return {
    values: raw.map((point) => Number(Math.max(sensor.rangeMin, point.v + offset).toFixed(sensor.decimals))),
    labels: raw.map((point) => formatTime(point.t)),
  };
}

/** The outline of one piece of equipment, drawn around the origin inside a 160 × 110 box. */
function PwSymbolShape({ kind }: { kind: PwSymbolKind }) {
  if (kind === 'valve') {
    return (
      <>
        <path d="M -50 -30 L 50 30 L 50 -30 L -50 30 Z" />
        <path d="M 0 0 V -40 M -20 -40 H 20 M -20 -40 A 20 14 0 0 1 20 -40" />
      </>
    );
  }
  if (kind === 'separator') {
    return (
      <>
        <rect x="-72" y="-28" width="144" height="56" rx="28" />
        <path d="M -62 6 H 62" strokeDasharray="6 4" />
        <path d="M -40 28 V 44 M 40 28 V 44 M -52 44 H -28 M 28 44 H 52 M 30 -28 V -42 M 22 -42 H 38" />
      </>
    );
  }
  if (kind === 'compressor') {
    return (
      <>
        <path d="M -55 -42 L 55 -18 L 55 18 L -55 42 Z" />
        <path d="M -22 -35 V 35 M 14 -27 V 27" />
        <path d="M 0 30 V 46 M -16 46 H 16" />
      </>
    );
  }
  if (kind === 'exchanger') {
    return (
      <>
        <circle r="40" />
        <path d="M -40 0 H -22 L -11 -18 L 11 18 L 22 0 H 40" />
        <path d="M 0 -40 V -52 M 0 40 V 52" strokeDasharray="4 3" />
      </>
    );
  }
  return (
    <>
      <circle r="36" />
      <path d="M -13 -20 L 22 0 L -13 20 Z" />
      <path d="M -24 27 L -34 46 H 34 L 24 27" />
    </>
  );
}

/** A symbol on its flow line at a given pixel width: the small and medium stations of the strip. */
function PwSymbol({ kind, tone, width }: { kind: PwSymbolKind; tone: Tone; width: number }) {
  const reach = PW_SYMBOL_REACH[kind];
  const flagged = tone !== 'accent';
  return (
    <svg data-tone={tone} viewBox="-80 -55 160 110" width={width} height={(width * 110) / 160} aria-hidden="true" className="block shrink-0">
      <path d={`M -80 0 H ${-reach} M ${reach} 0 H 80`} stroke="var(--kit-text)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <g fill="none" stroke={flagged ? 'var(--t-line)' : 'var(--kit-text)'} strokeWidth={flagged ? 2.5 : 1.5} strokeLinejoin="round" strokeLinecap="round">
        <g className="[&_*]:[vector-effect:non-scaling-stroke]">
          <PwSymbolShape kind={kind} />
        </g>
      </g>
    </svg>
  );
}

/**
 * The enlarged station: the symbol at full size on the flow line, with the inlet and outlet
 * conditions at either end, the key instrument on a leader above and the change across the
 * station on a dimension line below.
 */
function PwStationDrawing({ station }: { station: PwStation }) {
  const tone = pwTone(station);
  const flagged = tone !== 'accent';
  const key = pwKeySensor(station);
  const reach = PW_SYMBOL_REACH[station.symbol] * 1.3;
  const ink = 'var(--kit-text)';
  const quiet = 'var(--kit-text-2)';
  const dp = station.outlet.pressure - station.inlet.pressure;
  const dt = station.outlet.temperature - station.inlet.temperature;
  const letters = key ? (key.node.tag.split('-')[1] ?? '') : '';
  const keyFlagged = key ? isAbnormal(key.node.tone) : false;

  return (
    <svg
      data-tone={tone}
      viewBox="0 0 420 320"
      width="420"
      height="320"
      role="img"
      aria-label={`${station.name}: ${station.inlet.pressure} barg in, ${station.outlet.pressure} barg out`}
      className="block shrink-0 text-xs"
    >
      <g stroke={ink} strokeWidth="1.5" fill="none">
        <path d={`M 0 160 H ${210 - reach} M ${210 + reach} 160 H 420`} />
        <path d={`M ${210 - reach - 9} 155 L ${210 - reach} 160 L ${210 - reach - 9} 165 M 411 155 L 420 160 L 411 165`} />
      </g>
      <g transform="translate(210 160) scale(1.3)" fill="none" stroke={flagged ? 'var(--t-line)' : ink} strokeWidth={flagged ? 2 : 1.25} strokeLinejoin="round" strokeLinecap="round">
        <PwSymbolShape kind={station.symbol} />
      </g>

      <g fill={quiet}>
        <text x="12" y="128">In</text>
        <text x="12" y="150" fill={ink} fontSize="15" fontWeight="600" className="tabular-nums">
          {formatNumber(station.inlet.pressure, 1)} barg
        </text>
        <text x="12" y="182" className="tabular-nums">
          {formatNumber(station.inlet.temperature, 1)} °C
        </text>
        <text x="408" y="128" textAnchor="end">
          Out
        </text>
        <text x="408" y="150" textAnchor="end" fill={ink} fontSize="15" fontWeight="600" className="tabular-nums">
          {formatNumber(station.outlet.pressure, 1)} barg
        </text>
        <text x="408" y="182" textAnchor="end" className="tabular-nums">
          {formatNumber(station.outlet.temperature, 1)} °C
        </text>
      </g>

      {key ? (
        <g data-tone={keyFlagged ? key.node.tone : 'accent'}>
          <path d="M 210 62 V 92" stroke={quiet} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="210" cy="44" r="18" fill="var(--kit-halo)" stroke={keyFlagged ? 'var(--t-line)' : ink} strokeWidth={keyFlagged ? 2.5 : 1.25} />
          <path d="M 192 44 H 228" stroke={keyFlagged ? 'var(--t-line)' : ink} strokeWidth="1" />
          <text x="210" y="40" textAnchor="middle" fill={ink} fontWeight="600">
            {letters}
          </text>
          <text x="238" y="34" fill={quiet} className="tabular-nums">
            {key.node.tag}
          </text>
          <text x="238" y="54" fill={keyFlagged ? 'var(--t-ink)' : ink} fontSize="15" fontWeight="600" className="tabular-nums">
            {formatNumber(key.sensor.value, key.sensor.decimals)} {key.sensor.unit}
          </text>
          {keyFlagged ? (
            <text x="238" y="72" fill="var(--t-ink)" fontWeight="600">
              {key.node.stateLabel}
            </text>
          ) : null}
          <text x="182" y="38" textAnchor="end" fill={quiet}>
            {key.node.name}
          </text>
          <text x="182" y="56" textAnchor="end" fill={quiet} className="tabular-nums">
            High limit {formatNumber(key.sensor.highLimit, key.sensor.decimals)}
          </text>
        </g>
      ) : null}

      <g stroke={quiet} strokeWidth="1" fill="none">
        <path d={`M ${210 - reach} 232 V 276 M ${210 + reach} 232 V 276`} />
        <path d={`M ${210 - reach} 268 H ${210 + reach}`} />
        <path d={`M ${210 - reach + 8} 264 L ${210 - reach} 268 L ${210 - reach + 8} 272 M ${210 + reach - 8} 264 L ${210 + reach} 268 L ${210 + reach - 8} 272`} />
      </g>
      <text x="210" y="296" textAnchor="middle" fill={ink} fontSize="13" fontWeight="600" className="tabular-nums">
        Δp {pwSigned(dp)} bar · ΔT {pwSigned(dt)} °C
      </text>
    </svg>
  );
}

type PwWalk = {
  index: number;
  station: PwStation;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
};

function usePwWalk(initial: number): PwWalk {
  const [index, setIndex] = useState(initial);
  const last = PW_STATIONS.length - 1;
  const clamp = (value: number) => Math.min(Math.max(value, 0), last);
  return {
    index,
    station: PW_STATIONS[index] ?? PW_STATIONS[0] ?? PW_FALLBACK,
    goTo: (value) => setIndex(clamp(value)),
    next: () => setIndex((current) => clamp(current + 1)),
    previous: () => setIndex((current) => clamp(current - 1)),
  };
}

const PW_FALLBACK: PwStation = {
  id: 'none',
  name: 'No station',
  assetId: 'nk',
  symbol: 'valve',
  chainage: 0,
  inlet: { pressure: 0, temperature: 0 },
  outlet: { pressure: 0, temperature: 0 },
  flow: 0,
  keySensorId: '',
  duty: '',
  story: '',
};

function PwStationNumber({ index, active }: { index: number; active: boolean }) {
  return (
    <span
      className={`flex size-7 items-center justify-center border border-[color:var(--kit-text)] text-sm font-semibold tabular-nums ${
        active ? 'bg-[var(--kit-text)] text-[color:var(--kit-halo)]' : 'bg-[var(--kit-halo)]'
      }`}
    >
      {index + 1}
    </span>
  );
}

/** The whole train on one line. The current station is drawn large; the others are buttons that take you there. */
function PwStrip({ walk }: { walk: PwWalk }) {
  return (
    <ol className="flex h-80 items-stretch">
      {PW_STATIONS.map((station, index) => {
        const tone = pwTone(station);
        if (index === walk.index) {
          return (
            <li key={station.id} aria-current="step" className="relative flex shrink-0 items-center border-x border-dashed border-[color:var(--kit-rule-strong)] bg-[color-mix(in_oklab,var(--kit-text)_4%,transparent)]">
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <PwStationNumber index={index} active />
                <span className="text-sm font-semibold">{station.name}</span>
              </div>
              <PwStationDrawing station={station} />
            </li>
          );
        }
        return (
          <li key={station.id} className="min-w-0 flex-1">
            <button
              type="button"
              data-station={station.id}
              onClick={() => walk.goTo(index)}
              className="relative flex h-full w-full items-center outline-none hover:bg-[color-mix(in_oklab,var(--kit-text)_4%,transparent)] focus-visible:bg-[color-mix(in_oklab,var(--kit-text)_8%,transparent)]"
            >
              <span aria-hidden="true" className="h-0 flex-1 border-t-[1.5px] border-[color:var(--kit-text)]" />
              <PwSymbol kind={station.symbol} tone={tone} width={68} />
              <span aria-hidden="true" className="h-0 flex-1 border-t-[1.5px] border-[color:var(--kit-text)]" />
              <span className="absolute inset-x-0 bottom-[calc(50%+2.25rem)] flex justify-center">
                <PwStationNumber index={index} active={false} />
              </span>
              <span data-tone={tone} className="absolute inset-x-1 top-[calc(50%+2.25rem)] text-center">
                <span className="block text-sm font-semibold leading-5">{station.name}</span>
                <span className="block text-xs tabular-nums text-[color:var(--kit-text-2)]">{formatNumber(station.outlet.pressure, 1)} barg</span>
                {tone === 'accent' ? null : <span className="block text-xs font-semibold text-[color:var(--t-ink)]">{pwAsset(station).stateLabel}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** A dimension line under the strip: where each station sits along the train, in metres from the inlet. */
function PwChainage({ walk }: { walk: PwWalk }) {
  const total = PW_STATIONS[PW_STATIONS.length - 1]?.chainage ?? 1;
  return (
    <div className="relative mx-6 h-12 border-t border-[color:var(--kit-text)]">
      {PW_STATIONS.map((station, index) => {
        const active = index === walk.index;
        return (
          <button
            key={station.id}
            type="button"
            aria-label={`Station ${index + 1}, ${station.name}, ${station.chainage} metres`}
            aria-current={active ? 'step' : undefined}
            onClick={() => walk.goTo(index)}
            style={{ left: `${(station.chainage / total) * 100}%` }}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center outline-none focus-visible:underline"
          >
            <span aria-hidden="true" className={`block w-0 border-l border-[color:var(--kit-text)] ${active ? 'h-4 border-l-[3px]' : 'h-2.5'}`} />
            <span className={`mt-1 whitespace-nowrap text-xs tabular-nums ${active ? 'font-semibold' : 'text-[color:var(--kit-text-2)]'}`}>{station.chainage} m</span>
          </button>
        );
      })}
    </div>
  );
}

function PwTitleCell({ label, children, grow = false }: { label: string; children: ReactNode; grow?: boolean }) {
  return (
    <div className={`border-l border-[color:var(--kit-text)] px-4 py-2 ${grow ? 'flex-1' : ''}`}>
      <p className="text-xs text-[color:var(--kit-text-2)]">{label}</p>
      <p className="whitespace-nowrap text-sm font-semibold tabular-nums">{children}</p>
    </div>
  );
}

/** The title block of the drawing: what it is, which sheet is open, and the two figures that sum up the train. */
function PwTitleBlock({ walk }: { walk: PwWalk }) {
  const first = PW_STATIONS[0];
  const last = PW_STATIONS[PW_STATIONS.length - 1];
  return (
    <header className="flex items-stretch border border-[color:var(--kit-text)] bg-[var(--kit-halo)]">
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="flex size-9 items-center justify-center border border-[color:var(--kit-text)]">
          <IconRoute aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold leading-5">Process walkthrough</h2>
          <p className="text-xs text-[color:var(--kit-text-2)]">Nordkapp gas train, inlet to export</p>
        </div>
      </div>
      <div className="flex-1" />
      <PwTitleCell label="Drawing">NK-PF-001 rev C</PwTitleCell>
      <PwTitleCell label="Station">
        {walk.index + 1} of {PW_STATIONS.length} · {walk.station.name}
      </PwTitleCell>
      <PwTitleCell label="Pressure, in to out">
        {first ? formatNumber(first.inlet.pressure, 1) : '—'} to {last ? formatNumber(last.outlet.pressure, 1) : '—'} barg
      </PwTitleCell>
      <PwTitleCell label="Export">{last ? formatNumber(last.flow, 2) : '—'} MSm³/d</PwTitleCell>
    </header>
  );
}

/** The bottom dock: one step back, one step on, and what each step leads to. */
function PwDock({ walk }: { walk: PwWalk }) {
  const before = PW_STATIONS[walk.index - 1];
  const after = PW_STATIONS[walk.index + 1];
  return (
    <footer className="flex items-center gap-4 border border-[color:var(--kit-text)] bg-[var(--kit-halo)] px-4 py-2.5">
      <Button variant="outline" size="sm" disabled={!before} onClick={walk.previous}>
        <IconArrowNarrowLeft /> {before ? before.name : 'Start of train'}
      </Button>
      <ol aria-label="Stations" className="flex flex-1 items-center justify-center gap-1.5">
        {PW_STATIONS.map((station, index) => (
          <li key={station.id}>
            <button type="button" aria-label={`Go to ${station.name}`} aria-current={index === walk.index ? 'step' : undefined} onClick={() => walk.goTo(index)}>
              <PwStationNumber index={index} active={index === walk.index} />
            </button>
          </li>
        ))}
      </ol>
      <Button size="sm" disabled={!after} onClick={walk.next}>
        {after ? after.name : 'End of train'} <IconArrowNarrowRight />
      </Button>
    </footer>
  );
}

type PwStreamRow = { id: string; label: string; inlet: string; outlet: string; change: string };

function pwStreamRows(station: PwStation): PwStreamRow[] {
  return [
    {
      id: 'pressure',
      label: 'Pressure, barg',
      inlet: formatNumber(station.inlet.pressure, 1),
      outlet: formatNumber(station.outlet.pressure, 1),
      change: pwSigned(station.outlet.pressure - station.inlet.pressure),
    },
    {
      id: 'temperature',
      label: 'Temperature, °C',
      inlet: formatNumber(station.inlet.temperature, 1),
      outlet: formatNumber(station.outlet.temperature, 1),
      change: pwSigned(station.outlet.temperature - station.inlet.temperature),
    },
    { id: 'flow', label: 'Flow, MSm³/d', inlet: formatNumber(station.flow, 2), outlet: formatNumber(station.flow, 2), change: '0.00' },
  ];
}

const PW_STREAM_COLUMNS: DataTableColumn<PwStreamRow>[] = [
  { id: 'label', header: 'Stream', cell: (row) => row.label, nowrap: true },
  { id: 'in', header: 'In', numeric: true, cell: (row) => row.inlet },
  { id: 'out', header: 'Out', numeric: true, cell: (row) => row.outlet },
  { id: 'change', header: 'Change', numeric: true, cell: (row) => <span className="font-semibold">{row.change}</span> },
];

function PwStreamTable({ station }: { station: PwStation }) {
  return <DataTable label={`Streams at ${station.name}`} columns={PW_STREAM_COLUMNS} rows={pwStreamRows(station)} rowKey={(row) => row.id} />;
}

/** The same three streams as a narrow list: in and out on one line, the change at the end. */
function PwStreamList({ station }: { station: PwStation }) {
  return (
    <dl className="flex flex-1 flex-col justify-between">
      {pwStreamRows(station).map((row) => (
        <div key={row.id} className="border-t border-[color:var(--kit-rule)] py-2.5 first:border-t-0 first:pt-0">
          <dt className="text-xs text-[color:var(--kit-text-2)]">{row.label}</dt>
          <dd className="flex items-baseline justify-between gap-3 tabular-nums">
            <span className="whitespace-nowrap text-lg font-medium">
              {row.inlet} <span className="text-[color:var(--kit-text-3)]">→</span> {row.outlet}
            </span>
            <span className="text-sm font-semibold">{row.change}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** What the station is and does, in words, with the unit's own state. */
function PwStationSheet({ walk }: { walk: PwWalk }) {
  const { station } = walk;
  const asset = pwAsset(station);
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-start gap-4">
        <span className="text-6xl font-medium leading-none tracking-tight tabular-nums">{String(walk.index + 1).padStart(2, '0')}</span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-6">{asset.name}</h3>
          <p className="text-sm text-[color:var(--kit-text-2)]">{station.duty}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TagId variant="chip">{asset.tag}</TagId>
        <StatusPill tone={asset.tone}>{asset.stateLabel}</StatusPill>
        <span className="text-sm tabular-nums text-[color:var(--kit-text-2)]">Health {asset.score}</span>
      </div>
      <p className="text-sm leading-6">{station.story}</p>
    </div>
  );
}

function PwKeyTrend({ station, height = 232 }: { station: PwStation; height?: number }) {
  const key = pwKeySensor(station);
  if (!key) return <p className="text-sm text-[color:var(--kit-text-2)]">No instrument is mapped to this station.</p>;
  const { values, labels } = pwTrend(key.sensor);
  return (
    <TrendLine
      label={`${key.node.name}, ${key.node.tag}, last 24 hours`}
      series={[{ id: 'value', label: key.node.name, values, tone: isAbnormal(key.node.tone) ? key.node.tone : 'accent' }]}
      labels={labels}
      unit={key.sensor.unit}
      decimals={key.sensor.decimals}
      limits={[{ value: key.sensor.highLimit, label: 'High limit', tone: 'warning' }]}
      height={height}
      showLegend={false}
    />
  );
}

/** Pressure and temperature leaving every station: the shape of the whole train in two lines. */
function PwProfile({ height = 250 }: { height?: number }) {
  return (
    <TrendLine
      label="Pressure and temperature leaving each station"
      series={[
        { id: 'pressure', label: 'Pressure out, barg', values: PW_STATIONS.map((station) => station.outlet.pressure), tone: 'accent' },
        { id: 'temperature', label: 'Temperature out, °C', values: PW_STATIONS.map((station) => station.outlet.temperature), tone: 'warning', dashed: true },
      ]}
      labels={PW_STATIONS.map((station) => station.name)}
      decimals={0}
      highlightLast={false}
      height={height}
      showLegend
    />
  );
}

function ProcessWalkthroughSignature() {
  const walk = usePwWalk(2);
  const key = pwKeySensor(walk.station);
  return (
    <LookScope look="blueprint">
      <Canvas className="flex flex-col gap-5">
        <PwTitleBlock walk={walk} />
        <Panel padding="none" title="Flow line" subtitle="Left to right · the open station is drawn at five times scale">
          <PwStrip walk={walk} />
          <PwChainage walk={walk} />
        </Panel>
        <Grid className="gap-5">
          <Panel className="col-span-4" title="Station sheet" subtitle={`Stn ${walk.index + 1} · ${walk.station.chainage} m`}>
            <PwStationSheet walk={walk} />
          </Panel>
          <Panel className="col-span-3" title="Streams" subtitle="In → out">
            <PwStreamList station={walk.station} />
          </Panel>
          <Panel className="col-span-5" title={key ? key.node.name : 'Key instrument'} subtitle={key ? `${key.node.tag} · ${key.sensor.unit}` : 'None'}>
            <PwKeyTrend station={walk.station} />
          </Panel>
        </Grid>
        <PwDock walk={walk} />
      </Canvas>
    </LookScope>
  );
}

type PwSheetRow = { station: PwStation; index: number };

function ProcessWalkthroughFlowSheet() {
  const walk = usePwWalk(3);
  const columns: DataTableColumn<PwSheetRow>[] = [
    { id: 'stn', header: 'Stn', cell: (row) => <PwStationNumber index={row.index} active={row.index === walk.index} />, width: 'w-12' },
    {
      id: 'station',
      header: 'Station',
      cell: (row) => (
        <button type="button" className="text-left font-semibold hover:underline" onClick={() => walk.goTo(row.index)}>
          {pwAsset(row.station).name}
        </button>
      ),
    },
    { id: 'tag', header: 'Tag', nowrap: true, cell: (row) => <TagId>{pwAsset(row.station).tag}</TagId> },
    { id: 'pin', header: 'p in', numeric: true, cell: (row) => formatNumber(row.station.inlet.pressure, 1) },
    { id: 'pout', header: 'p out', numeric: true, cell: (row) => formatNumber(row.station.outlet.pressure, 1) },
    { id: 'tin', header: 'T in', numeric: true, cell: (row) => formatNumber(row.station.inlet.temperature, 1) },
    { id: 'tout', header: 'T out', numeric: true, cell: (row) => formatNumber(row.station.outlet.temperature, 1) },
    { id: 'flow', header: 'Flow', numeric: true, cell: (row) => formatNumber(row.station.flow, 2) },
    { id: 'state', header: 'State', nowrap: true, cell: (row) => <StatusPill tone={pwAsset(row.station).tone}>{pwAsset(row.station).stateLabel}</StatusPill> },
  ];
  return (
    <LookScope look="blueprint">
      <Canvas className="flex flex-col gap-5">
        <PwTitleBlock walk={walk} />
        <Panel padding="none" title="Flow sheet" subtitle="All stations at one scale">
          <ol className="flex items-stretch">
            {PW_STATIONS.map((station, index) => {
              const tone = pwTone(station);
              const active = index === walk.index;
              return (
                <li key={station.id} className="min-w-0 flex-1">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => walk.goTo(index)}
                    className={`flex w-full flex-col items-center gap-2 py-5 outline-none hover:bg-[color-mix(in_oklab,var(--kit-text)_4%,transparent)] ${active ? 'bg-[color-mix(in_oklab,var(--kit-text)_7%,transparent)]' : ''}`}
                  >
                    <PwStationNumber index={index} active={active} />
                    <span className="flex w-full items-center">
                      <span aria-hidden="true" className="h-0 flex-1 border-t-[1.5px] border-[color:var(--kit-text)]" />
                      <PwSymbol kind={station.symbol} tone={tone} width={104} />
                      <span aria-hidden="true" className="h-0 flex-1 border-t-[1.5px] border-[color:var(--kit-text)]" />
                    </span>
                    <span data-tone={tone} className="text-center">
                      <span className="block text-sm font-semibold">{station.name}</span>
                      <span className="block text-xs tabular-nums text-[color:var(--kit-text-2)]">
                        {formatNumber(station.inlet.pressure, 1)} to {formatNumber(station.outlet.pressure, 1)} barg
                      </span>
                      {tone === 'accent' ? null : <span className="block text-xs font-semibold text-[color:var(--t-ink)]">{pwAsset(station).stateLabel}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Panel>
        <Grid className="gap-5">
          <Panel className="col-span-12" title="Stream table" subtitle="barg · °C · MSm³/d">
            <DataTable
              label="Streams at every station"
              columns={columns}
              rows={PW_STATIONS.map((station, index) => ({ station, index }))}
              rowKey={(row) => row.station.id}
              rowTone={(row) => (pwTone(row.station) === 'accent' ? undefined : pwTone(row.station))}
            />
          </Panel>
          <Panel className="col-span-12" title="Profile along the train" subtitle="Leaving each station">
            <PwProfile height={240} />
          </Panel>
        </Grid>
      </Canvas>
    </LookScope>
  );
}

function ProcessWalkthroughTablet() {
  const walk = usePwWalk(1);
  return (
    <LookScope look="blueprint" className="mx-auto w-full max-w-2xl">
      <Canvas className="flex flex-col gap-5">
        <Panel padding="none" title="Process walkthrough" subtitle={`Stn ${walk.index + 1} of ${PW_STATIONS.length}`}>
          <ol>
            {PW_STATIONS.map((station, index) => {
              const tone = pwTone(station);
              if (index === walk.index) {
                return (
                  <li key={station.id} aria-current="step" className="border-y border-dashed border-[color:var(--kit-rule-strong)] bg-[color-mix(in_oklab,var(--kit-text)_4%,transparent)] p-4">
                    <div className="flex justify-center">
                      <PwStationDrawing station={station} />
                    </div>
                    <PwStationSheet walk={walk} />
                  </li>
                );
              }
              return (
                <li key={station.id} className="border-t border-[color:var(--kit-rule)] first:border-t-0">
                  <button type="button" onClick={() => walk.goTo(index)} className="flex w-full items-center gap-4 px-4 py-2 text-left outline-none hover:bg-[color-mix(in_oklab,var(--kit-text)_4%,transparent)]">
                    <PwStationNumber index={index} active={false} />
                    <PwSymbol kind={station.symbol} tone={tone} width={64} />
                    <span data-tone={tone} className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{pwAsset(station).name}</span>
                      <span className="block text-xs text-[color:var(--kit-text-2)]">{station.duty}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{formatNumber(station.outlet.pressure, 1)} barg</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Panel>
        <PwDock walk={walk} />
      </Canvas>
    </LookScope>
  );
}

function ProcessWalkthroughStationDrawing() {
  const station = PW_STATIONS[3] ?? PW_FALLBACK;
  return (
    <LookScope look="blueprint" className="w-full">
      <Panel title="Station drawing" subtitle="Stn 4 · Cooling">
        <div className="flex justify-center">
          <PwStationDrawing station={station} />
        </div>
      </Panel>
    </LookScope>
  );
}

function ProcessWalkthroughSymbols() {
  const kinds: readonly PwSymbolKind[] = ['valve', 'separator', 'compressor', 'exchanger', 'pump'];
  return (
    <LookScope look="blueprint" className="flex w-full">
      <Panel className="flex-1" title="Symbols" subtitle="Ink is normal · colour is a flagged unit">
        <ul className="grid flex-1 grid-cols-3 content-center gap-x-4 gap-y-6">
          {kinds.map((kind) => (
            <li key={kind} className="flex flex-col items-center gap-1.5">
              <PwSymbol kind={kind} tone={kind === 'exchanger' ? 'warning' : 'accent'} width={104} />
              <span className="text-sm font-semibold">{PW_SYMBOL_NAME[kind]}</span>
            </li>
          ))}
          <li className="flex flex-col items-center gap-1.5">
            <PwSymbol kind="compressor" tone="critical" width={104} />
            <span data-tone="critical" className="text-sm font-semibold text-[color:var(--t-ink)]">
              Tripped
            </span>
          </li>
        </ul>
      </Panel>
    </LookScope>
  );
}

function ProcessWalkthroughDock() {
  const walk = usePwWalk(4);
  return (
    <LookScope look="blueprint" className="w-full space-y-4">
      <PwDock walk={walk} />
      <PwChainage walk={walk} />
    </LookScope>
  );
}

function ProcessWalkthroughStreams() {
  const station = PW_STATIONS[2] ?? PW_FALLBACK;
  return (
    <LookScope look="blueprint" className="w-full">
      <Panel title="Streams" subtitle="Stn 3 · 1st stage">
        <PwStreamTable station={station} />
      </Panel>
    </LookScope>
  );
}

function ProcessWalkthroughKeyTrend() {
  const station = PW_STATIONS[1] ?? PW_FALLBACK;
  return (
    <LookScope look="blueprint" className="w-full">
      <Panel title="Separator level" subtitle="20-LT-10012 · % · 24 h">
        <PwKeyTrend station={station} />
      </Panel>
    </LookScope>
  );
}

function ProcessWalkthroughProfile() {
  return (
    <LookScope look="blueprint" className="w-full">
      <Panel title="Profile along the train" subtitle="Leaving each station">
        <PwProfile height={232} />
      </Panel>
    </LookScope>
  );
}

export default definePage({
  id: 'process-walkthrough',
  title: 'Process walkthrough',
  summary:
    'The gas train as an engineering drawing you step through: every station sits on one flow line, and the open one is drawn large with its inlet and outlet conditions, its key instrument and the change across it.',
  guidance: {
    use: [
      'To teach or review a process in the order the fluid meets it.',
      'When what matters at each step is the change across it: pressure, temperature, composition.',
      'With the whole line always visible, so the open station never loses its place.',
    ],
    avoid: [
      'Processes with many branches and recycles; use a P&ID or a process graph.',
      'As a live operating display: a walkthrough shows one station at a time.',
      'Symbols without a name underneath, or state shown by colour without its word.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Step with the dock, or pick any station on the flow line or the chainage rule.',
      specimens: [
        {
          id: 'ProcessWalkthroughSignature',
          title: 'Process walkthrough',
          note: 'Pick it to walk someone through a train station by station without losing the whole line.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/TrendLine.tsx', 'kit/miller-columns/assetTree.ts', 'looks/LookScope.tsx'],
          Component: ProcessWalkthroughSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Every station at one scale with the full stream table, and the walkthrough turned upright for a tablet.',
      specimens: [
        {
          id: 'ProcessWalkthroughFlowSheet',
          title: 'Flow sheet',
          note: 'Pick it to compare stations: nothing is enlarged, and the stream table carries every figure.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/TrendLine.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: ProcessWalkthroughFlowSheet,
        },
        {
          id: 'ProcessWalkthroughTablet',
          title: 'Upright on a tablet',
          note: 'Pick it in the field: the line runs top to bottom and the open station unfolds in place.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: ProcessWalkthroughTablet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The drawing, its symbols and the panels around it.',
      specimens: [
        {
          id: 'ProcessWalkthroughStationDrawing',
          title: 'Station drawing',
          note: 'Inlet and outlet at the ends, the key instrument on a leader, the change on a dimension line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/Panel.tsx'],
          Component: ProcessWalkthroughStationDrawing,
        },
        {
          id: 'ProcessWalkthroughSymbols',
          title: 'Symbols',
          note: 'Five outlines cover the train; a flagged unit is drawn heavier in its state colour and named.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/Panel.tsx'],
          Component: ProcessWalkthroughSymbols,
        },
        {
          id: 'ProcessWalkthroughStreams',
          title: 'Stream table',
          note: 'The same in, out and change for every station, so the eye learns where to look.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/DataTable.tsx'],
          Component: ProcessWalkthroughStreams,
        },
        {
          id: 'ProcessWalkthroughDock',
          title: 'Dock and chainage',
          note: 'The step buttons name where they lead; the rule shows how far along the train you are.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          Component: ProcessWalkthroughDock,
        },
        {
          id: 'ProcessWalkthroughKeyTrend',
          title: 'Key instrument',
          note: 'One trend per station: the tag an operator reads first, against its high limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/TrendLine.tsx'],
          Component: ProcessWalkthroughKeyTrend,
        },
        {
          id: 'ProcessWalkthroughProfile',
          title: 'Train profile',
          note: 'Pressure and temperature leaving each station: the whole process as two lines.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/TrendLine.tsx'],
          Component: ProcessWalkthroughProfile,
        },
      ],
    },
  ],
});
