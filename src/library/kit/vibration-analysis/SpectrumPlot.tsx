import { useId } from 'react';
import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLookDefinition } from '../../looks/useLook';
import { Legend, type LegendItem } from '../Legend';
import { cx, formatNumber, niceTicks, toneLine, type Tone } from '../tones';

import { PlotArea } from './PlotArea';
import type { SpectrumLine } from './signal';

type SpectrumVariant = 'area' | 'line' | 'stems' | 'bars';

const LOOK_VARIANT: Record<LookId, SpectrumVariant> = {
  studio: 'area',
  console: 'line',
  poster: 'bars',
  glass: 'area',
  editorial: 'line',
  soft: 'area',
  blueprint: 'stems',
  signal: 'bars',
};

export type SpectrumMarker = { hz: number; label: string; tone?: Tone };
export type SpectrumMaskStep = { fromHz: number; toHz: number; level: number };

type SpectrumPlotProps = {
  /** What the spectrum is of: "Velocity spectrum, pump drive end". */
  label: string;
  lines: readonly SpectrumLine[];
  maxHz: number;
  unit?: string;
  /** Named frequencies: orders of running speed, bearing and vane-pass lines. */
  markers?: readonly SpectrumMarker[];
  /** A stepped alarm envelope; lines above it are in alarm. */
  mask?: readonly SpectrumMaskStep[];
  /** An earlier spectrum to compare against, drawn dashed behind the current one. */
  baseline?: { label: string; lines: readonly SpectrumLine[] };
  /** Peaks the reader can pick, drawn as dots on their tips. */
  peaks?: readonly SpectrumLine[];
  selectedHz?: number;
  onSelect?: (hz: number) => void;
  tone?: Tone;
  /** Leave out to let the look choose: a filled trace, a line, stems or blocks. */
  variant?: SpectrumVariant;
  /** Top of the y axis; otherwise it fits the data and the mask. */
  yMax?: number;
  height?: number;
  headline?: ReactNode;
  className?: string;
};

function binned(lines: readonly SpectrumLine[], bins: number): SpectrumLine[] {
  const size = Math.max(1, Math.ceil(lines.length / bins));
  const out: SpectrumLine[] = [];
  for (let start = 0; start < lines.length; start += size) {
    const group = lines.slice(start, start + size);
    out.push(group.reduce((top, line) => (line.amplitude > top.amplitude ? line : top), group[0]));
  }
  return out;
}

/**
 * A frequency spectrum with its named lines, an optional alarm mask and a baseline to compare
 * with. The look draws the trace — a gradient fill in studio, a glowing line in glass, thin stems
 * on a blueprint, solid blocks in poster — and peaks can be picked to read them off.
 */
export function SpectrumPlot({ label, lines, maxHz, unit = 'mm/s', markers = [], mask = [], baseline, peaks = [], selectedHz, onSelect, tone = 'accent', variant, yMax, height = 240, headline, className }: SpectrumPlotProps) {
  const { id: look, chart } = useLookDefinition();
  const gradientId = useId().replace(/:/g, '');
  const kind = variant ?? LOOK_VARIANT[look];
  const highest = Math.max(...lines.map((line) => line.amplitude), ...(baseline?.lines ?? []).map((line) => line.amplitude), ...mask.map((step) => step.level), 0.1);
  const ticks = niceTicks(yMax ?? highest * 1.12, 4);
  const top = ticks[ticks.length - 1] ?? highest;
  const decimals = top < 2 ? 1 : top < 10 && ticks.some((tick) => !Number.isInteger(tick)) ? 1 : 0;
  const x = (hz: number) => Math.min(100, Math.max(0, (hz / maxHz) * 100));
  const y = (amplitude: number) => 100 - Math.min(1, amplitude / top) * 100;
  const trace = (source: readonly SpectrumLine[]) => source.map((line) => `${x(line.hz).toFixed(2)},${y(line.amplitude).toFixed(2)}`).join(' ');
  const color = toneLine(tone);
  const drawn = kind === 'bars' ? binned(lines, 56) : kind === 'stems' ? binned(lines, 110) : lines;
  const band = 100 / drawn.length;
  const hzStep = niceTicks(maxHz, 5);
  const selected = peaks.find((line) => line.hz === selectedHz);
  const sorted = [...markers].sort((a, b) => a.hz - b.hz);
  // Neighbouring marker labels step down a row so they never sit on each other.
  const rows = sorted.reduce<number[]>((acc, marker, index) => {
    const previous = sorted[index - 1];
    acc.push(previous && (marker.hz - previous.hz) / maxHz < 0.075 ? ((acc[index - 1] ?? 0) + 1) % 3 : 0);
    return acc;
  }, []);
  const legend: LegendItem[] = [
    { label: 'Now', tone, mark: kind === 'bars' ? 'swatch' : 'line' },
    ...(baseline ? [{ label: baseline.label, tone: 'neutral', mark: 'dashed' } satisfies LegendItem] : []),
    ...(mask.length > 0 ? [{ label: 'Alarm mask', tone: 'critical', mark: 'dashed' } satisfies LegendItem] : []),
  ];
  const maskPath = mask.map((step, index) => `${index === 0 ? 'M' : 'L'}${x(step.fromHz)} ${y(step.level)} L${x(step.toHz)} ${y(step.level)}`).join(' ');

  return (
    <figure data-look={look} className={cx('flex min-w-0 flex-col gap-3', className)}>
      {headline || legend.length > 1 ? (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>{headline}</div>
          {legend.length > 1 ? <Legend items={legend} /> : null}
        </div>
      ) : null}
      <PlotArea
        label={label}
        height={height}
        yCaption={unit}
        xCaption="Frequency, Hz"
        yTicks={ticks.map((tick) => ({ at: tick / top, label: formatNumber(tick, decimals) }))}
        xTicks={hzStep.filter((tick) => tick <= maxHz).map((tick) => ({ at: tick / maxHz, label: formatNumber(tick) }))}
        overlay={
          <>
            {sorted.map((marker, index) => (
              <span
                key={marker.label}
                data-tone={marker.tone ?? 'neutral'}
                className="absolute -translate-x-1/2 rounded-(--kit-radius-sm) bg-(--t-soft) px-1.5 text-xs leading-5 font-semibold whitespace-nowrap text-(--t-on-soft)"
                style={{ left: `${x(marker.hz)}%`, top: 2 + rows[index] * 22 }}
              >
                {marker.label}
              </span>
            ))}
            {peaks.map((line) => {
              const active = line.hz === selectedHz;
              return (
                <button
                  key={line.hz}
                  type="button"
                  aria-label={`Peak at ${formatNumber(line.hz, 1)} Hz, ${formatNumber(line.amplitude, 2)} ${unit}`}
                  aria-pressed={active}
                  onClick={() => onSelect?.(line.hz)}
                  className="absolute size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:[box-shadow:0_0_0_2px_var(--kit-accent)]"
                  style={{ left: `${x(line.hz)}%`, top: `${y(line.amplitude)}%` }}
                >
                  <span
                    className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: active ? 12 : 9, height: active ? 12 : 9, background: active ? color : 'var(--kit-surface)', border: `2px solid ${color}` }}
                  />
                </button>
              );
            })}
            {selected ? (
              <span
                className={cx('pointer-events-none absolute rounded-(--kit-radius-sm) px-2 text-xs leading-6 font-semibold whitespace-nowrap', x(selected.hz) > 70 ? '-translate-x-full' : '')}
                style={{ left: `calc(${x(selected.hz)}% + ${x(selected.hz) > 70 ? -12 : 12}px)`, top: `max(0px, calc(${y(selected.amplitude)}% - 12px))`, background: color, color: 'var(--kit-surface)' }}
              >
                {formatNumber(selected.hz, 1)} Hz · {formatNumber(selected.amplitude, 2)} {unit}
              </span>
            ) : null}
          </>
        }
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: color, stopOpacity: look === 'glass' ? 0.5 : 0.32 }} />
            <stop offset="1" style={{ stopColor: color, stopOpacity: 0.02 }} />
          </linearGradient>
        </defs>
        {sorted.map((marker) => (
          <line key={marker.label} x1={x(marker.hz)} x2={x(marker.hz)} y1="0" y2="100" stroke={toneLine(marker.tone ?? 'neutral')} strokeDasharray="3 4" strokeOpacity="0.7" vectorEffect="non-scaling-stroke" />
        ))}
        {baseline ? <polyline points={trace(baseline.lines)} fill="none" stroke="var(--kit-line-neutral)" strokeDasharray="5 4" strokeWidth={1.25} vectorEffect="non-scaling-stroke" /> : null}
        {kind === 'area' ? <polygon points={`0,100 ${trace(lines)} 100,100`} fill={`url(#${gradientId})`} /> : null}
        {kind === 'area' || kind === 'line' ? (
          <polyline
            points={trace(lines)}
            fill="none"
            stroke={color}
            strokeWidth={Math.min(chart.strokeWidth, 2)}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={look === 'glass' ? { filter: `drop-shadow(0 0 5px ${color})` } : undefined}
          />
        ) : null}
        {kind === 'stems'
          ? drawn.map((line) => <line key={line.hz} x1={x(line.hz)} x2={x(line.hz)} y1="100" y2={y(line.amplitude)} stroke={color} strokeWidth={chart.strokeWidth} vectorEffect="non-scaling-stroke" />)
          : null}
        {kind === 'bars'
          ? drawn.map((line, index) => <rect key={line.hz} x={index * band + band * 0.12} width={band * 0.76} y={y(line.amplitude)} height={100 - y(line.amplitude)} fill={color} />)
          : null}
        {mask.length > 0 ? <path d={maskPath} fill="none" stroke="var(--kit-line-critical)" strokeWidth={1.5} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" /> : null}
        {selected ? <line x1={x(selected.hz)} x2={x(selected.hz)} y1="0" y2="100" stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" /> : null}
      </PlotArea>
    </figure>
  );
}
