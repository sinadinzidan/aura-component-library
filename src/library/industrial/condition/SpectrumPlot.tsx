import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import type { SpectrumLine } from './dft';
import { maskLimitAt, toOrders } from './harmonics';
import type { HarmonicCursor, MaskSegment } from './harmonics';
import { PlotFrame } from './PlotFrame';
import { areaPoints, niceCeiling, polylinePoints } from './plotScale';
import type { PlotScale } from './plotScale';

/** A named frequency on the spectrum, such as a bearing defect frequency. */
export type SpectrumMarker = { frequencyHz: number; label: string };

export type SpectrumPlotProps = {
  /** What the spectrum shows, with the key finding. Becomes the accessible name. */
  label: string;
  spectrum: readonly SpectrumLine[];
  /** Amplitude unit, e.g. "mm/s RMS" or "g RMS". */
  unit: string;
  /** Upper end of the frequency axis. Defaults to the last line. */
  maxHz?: number;
  /** Upper end of the amplitude axis. Defaults to a round value above the highest line. */
  maxAmplitude?: number;
  /** Shaft speed. When set, the frequency axis is labelled in orders of running speed as well. */
  runningHz?: number;
  /** Harmonic cursors: dashed lines labelled on the top row. */
  cursors?: readonly HarmonicCursor[];
  /** Named frequencies: dotted lines labelled on the second row, so they never collide with harmonics. */
  markers?: readonly SpectrumMarker[];
  /** Alarm envelope. Lines above it are redrawn in the critical colour. */
  mask?: readonly MaskSegment[];
  /** An earlier spectrum drawn in quiet grey behind the current one. */
  baseline?: readonly SpectrumLine[];
  /** Readout cursor: a solid line with a dot on the spectrum. */
  cursorHz?: number;
  /** Fill under the spectrum. Off when a baseline is drawn, so both stay readable. */
  area?: boolean;
  /** No axes: the trace alone, for a card. */
  bare?: boolean;
  decimals?: number;
  heightClassName?: string;
  gutterClassName?: string;
  /** Extra HTML over the plot area, positioned with the plot's scale. */
  overlay?: (scale: PlotScale) => ReactNode;
  /** Set when the overlay holds controls. */
  interactive?: boolean;
  className?: string;
};

const LABEL = 'absolute -translate-x-1/2 whitespace-nowrap rounded-xs bg-base-background px-0.5 text-xs leading-none tabular-nums';

function maskPoints(mask: readonly MaskSegment[], scale: PlotScale, lastHz: number): string {
  return mask
    .filter((segment) => segment.fromHz < lastHz)
    .map((segment) => `${scale.x(segment.fromHz)},${scale.y(segment.limit)} ${scale.x(Math.min(segment.toHz, lastHz))},${scale.y(segment.limit)}`)
    .join(' ');
}

/**
 * An FFT amplitude spectrum: amplitude against frequency, with the overlays an analyst reads it
 * against — harmonic cursors, named bearing frequencies, an alarm envelope and a baseline.
 * Plotted data takes the chart colour; only lines that break the envelope take status colour.
 */
export function SpectrumPlot({
  label,
  spectrum,
  unit,
  maxHz,
  maxAmplitude,
  runningHz,
  cursors = [],
  markers = [],
  mask,
  baseline,
  cursorHz,
  area,
  bare = false,
  decimals = 1,
  heightClassName = 'h-48',
  gutterClassName,
  overlay,
  interactive = false,
  className,
}: SpectrumPlotProps) {
  const lastHz = maxHz ?? spectrum[spectrum.length - 1]?.frequencyHz ?? 1;
  const visible = spectrum.filter((line) => line.frequencyHz <= lastHz);
  const visibleBaseline = baseline?.filter((line) => line.frequencyHz <= lastHz) ?? [];
  const highest = Math.max(0, ...visible.map((line) => line.amplitude), ...visibleBaseline.map((line) => line.amplitude), ...(mask ?? []).map((segment) => segment.limit));
  const top = maxAmplitude ?? niceCeiling(highest, cursors.length > 0 || markers.length > 0 ? 1.4 : 1.15);
  const xs = visible.map((line) => line.frequencyHz);
  const ys = visible.map((line) => Math.min(line.amplitude, top));
  const fill = area ?? visibleBaseline.length === 0;
  const over = mask
    ? visible.filter((line) => {
        const limit = maskLimitAt(mask, line.frequencyHz);
        return limit !== null && line.amplitude > limit;
      })
    : [];
  const cursorLine = cursorHz === undefined ? undefined : visible.reduce<SpectrumLine | undefined>((best, line) => (!best || Math.abs(line.frequencyHz - cursorHz) < Math.abs(best.frequencyHz - cursorHz) ? line : best), undefined);
  const inRange = (frequencyHz: number): boolean => frequencyHz >= 0 && frequencyHz <= lastHz;
  const orderTicks = runningHz ? Array.from({ length: Math.floor(toOrders(lastHz, runningHz)) }, (_, index) => index + 1).filter((order) => order % Math.max(1, Math.ceil(toOrders(lastHz, runningHz) / 8)) === 0) : [];

  return (
    <div data-slot="spectrum-plot" className={cn('flex w-full min-w-0 flex-col', className)}>
      <PlotFrame
        label={label}
        interactive={interactive}
        bare={bare}
        x={{ domain: [0, lastHz], title: runningHz ? undefined : 'Frequency, Hz', format: (value) => formatValue(value, 0) }}
        y={{ domain: [0, top], title: `Amplitude, ${unit}`, format: (value) => formatValue(value, Number.isInteger(value) ? 0 : top < 1 ? 2 : 1) }}
        heightClassName={heightClassName}
        gutterClassName={gutterClassName}
        overlay={(scale) => (
          <>
            {cursors.filter((cursor) => inRange(cursor.frequencyHz)).map((cursor) => (
              <span key={`h-${cursor.label}`} data-slot="spectrum-cursor-label" className={cn(LABEL, 'top-0 font-medium text-base-foreground')} style={{ left: `${scale.x(cursor.frequencyHz)}%` }}>
                {cursor.label}
              </span>
            ))}
            {markers.filter((marker) => inRange(marker.frequencyHz)).map((marker) => (
              <span key={`m-${marker.label}`} data-slot="spectrum-marker-label" className={cn(LABEL, 'top-4 text-medium-foreground')} style={{ left: `${scale.x(marker.frequencyHz)}%` }}>
                {marker.label}
              </span>
            ))}
            {cursorLine ? (
              <span
                data-slot="spectrum-cursor-dot"
                className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-base-background bg-base-foreground"
                style={{ left: `${scale.x(cursorLine.frequencyHz)}%`, top: `${scale.y(Math.min(cursorLine.amplitude, top))}%` }}
              />
            ) : null}
            {overlay ? overlay(scale) : null}
          </>
        )}
      >
        {(scale) => (
          <>
            {cursors.filter((cursor) => inRange(cursor.frequencyHz)).map((cursor) => (
              <line key={`h-${cursor.label}`} data-slot="spectrum-cursor" x1={scale.x(cursor.frequencyHz)} x2={scale.x(cursor.frequencyHz)} y1={7} y2={100} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-450" />
            ))}
            {markers.filter((marker) => inRange(marker.frequencyHz)).map((marker) => (
              <line key={`m-${marker.label}`} data-slot="spectrum-marker" x1={scale.x(marker.frequencyHz)} x2={scale.x(marker.frequencyHz)} y1={16} y2={100} strokeWidth={1} strokeDasharray="1 3" vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-450" />
            ))}
            {visibleBaseline.length > 0 ? (
              <polyline data-slot="spectrum-baseline" points={polylinePoints(visibleBaseline.map((line) => line.frequencyHz), visibleBaseline.map((line) => Math.min(line.amplitude, top)), scale)} strokeWidth={1.25} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-300" />
            ) : null}
            {fill ? <polygon data-slot="spectrum-area" points={areaPoints(xs, ys, scale, 0)} className="fill-chart-1-100" /> : null}
            <polyline data-slot="spectrum-line" points={polylinePoints(xs, ys, scale)} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-1-450" />
            {mask ? <polyline data-slot="spectrum-mask" points={maskPoints(mask, scale, lastHz)} strokeWidth={1.25} strokeDasharray="5 3" vectorEffect="non-scaling-stroke" className="stroke-chart-warning-450" /> : null}
            {over.map((line) => (
              <line key={line.frequencyHz} data-slot="spectrum-exceedance" x1={scale.x(line.frequencyHz)} x2={scale.x(line.frequencyHz)} y1={scale.y(Math.min(line.amplitude, top))} y2={scale.y(maskLimitAt(mask ?? [], line.frequencyHz) ?? 0)} strokeWidth={2.5} vectorEffect="non-scaling-stroke" className="stroke-chart-critical-450" />
            ))}
            {cursorLine ? (
              <line data-slot="spectrum-readout" x1={scale.x(cursorLine.frequencyHz)} x2={scale.x(cursorLine.frequencyHz)} y1={0} y2={100} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-base-foreground" />
            ) : null}
          </>
        )}
      </PlotFrame>
      {runningHz && !bare ? (
        <div className="flex min-w-0">
          <span aria-hidden="true" className={cn('shrink-0', gutterClassName ?? 'w-10')} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div aria-hidden="true" data-slot="spectrum-orders" className="relative h-4 border-t border-default">
              {orderTicks.map((order) => (
                <span key={order} className="absolute top-1 -translate-x-1/2 text-xs leading-none text-muted-foreground tabular-nums" style={{ left: `${(order * runningHz * 100) / lastHz}%` }}>
                  {order}×
                </span>
              ))}
            </div>
            <span className="pt-1 text-right text-xs text-muted-foreground">Frequency, Hz, and orders of running speed ({formatValue(runningHz, decimals)} Hz)</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
