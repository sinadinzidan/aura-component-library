import { useLookDefinition } from '../../looks/useLook';
import { cx, formatNumber, niceTicks, toneLine, type Tone } from '../tones';

import { PlotArea } from './PlotArea';
import { peak, rms } from './signal';

type WaveformPlotProps = {
  /** What was measured: "Time waveform, pump drive end". */
  label: string;
  samples: readonly number[];
  /** Length of the record in milliseconds. */
  milliseconds: number;
  unit?: string;
  tone?: Tone;
  /** Shade the ±RMS band and mark the peak, to make the crest factor visible. */
  showLevels?: boolean;
  height?: number;
  className?: string;
};

/**
 * The raw time signal around zero. With levels on, the RMS band is shaded and the peak is marked,
 * so impacts that stand far above the band — a high crest factor — are plain to see.
 */
export function WaveformPlot({ label, samples, milliseconds, unit = 'mm/s', tone = 'accent', showLevels = true, height = 200, className }: WaveformPlotProps) {
  const { id: look, chart } = useLookDefinition();
  const top = niceTicks(Math.max(peak(samples) * 1.1, 0.1), 2).slice(-1)[0] ?? 1;
  const level = rms(samples);
  const highest = peak(samples);
  const y = (value: number) => 50 - (Math.max(-top, Math.min(top, value)) / top) * 50;
  const points = samples.map((value, index) => `${((index / Math.max(samples.length - 1, 1)) * 100).toFixed(2)},${y(value).toFixed(2)}`).join(' ');
  const color = toneLine(tone);
  const peakIndex = samples.findIndex((value) => Math.abs(value) === highest);
  const peakValue = samples[peakIndex] ?? 0;
  const decimals = top < 10 ? 1 : 0;

  return (
    <PlotArea
      label={label}
      height={height}
      className={cx(className)}
      yCaption={unit}
      xCaption="Time, ms"
      yTicks={[-top, -top / 2, 0, top / 2, top].map((tick) => ({ at: (tick + top) / (2 * top), label: formatNumber(tick, decimals) }))}
      xTicks={[0, 0.25, 0.5, 0.75, 1].map((at) => ({ at, label: formatNumber(at * milliseconds) }))}
      overlay={
        showLevels ? (
          <>
            <span className="absolute right-1 rounded-(--kit-radius-sm) bg-(--kit-surface) px-1.5 text-xs leading-5 font-medium text-(--kit-text-2)" style={{ top: `calc(${y(level)}% - 22px)` }}>
              RMS {formatNumber(level, 2)}
            </span>
            <span
              data-tone="warning"
              className={cx('absolute rounded-(--kit-radius-sm) bg-(--t-soft) px-1.5 text-xs leading-5 font-semibold whitespace-nowrap text-(--t-on-soft)', peakIndex / samples.length > 0.8 ? '-translate-x-full' : '')}
              style={{ left: `calc(${(peakIndex / Math.max(samples.length - 1, 1)) * 100}% + ${peakIndex / samples.length > 0.8 ? -8 : 8}px)`, top: peakValue >= 0 ? 0 : undefined, bottom: peakValue < 0 ? 0 : undefined }}
            >
              Peak {formatNumber(highest, 2)}
            </span>
          </>
        ) : null
      }
    >
      {showLevels ? <rect x="0" width="100" y={y(level)} height={y(-level) - y(level)} fill="var(--kit-track)" /> : null}
      <line x1="0" x2="100" y1="50" y2="50" stroke="var(--kit-rule-strong)" vectorEffect="non-scaling-stroke" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={Math.min(chart.strokeWidth, 1.75)} strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={look === 'glass' ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined} />
    </PlotArea>
  );
}
