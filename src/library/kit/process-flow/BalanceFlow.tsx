import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { massBalance, stackLayout } from './flow';

export type BalanceStream = { id: string; label: string; value: number; tone: Tone };

type BalanceFlowProps = {
  /** What is balanced: "Mass balance across the gas train". */
  label: string;
  inputs: readonly BalanceStream[];
  outputs: readonly BalanceStream[];
  unit: string;
  decimals?: number;
  /** Height of the diagram in px. */
  height?: number;
  /** Largest difference, in per cent of the feed, that still counts as closed. */
  tolerancePercent?: number;
  className?: string;
};

const BAND_OPACITY: Record<LookId, number> = { studio: 0.3, glass: 0.42, soft: 0.42, console: 0.5, poster: 1, signal: 0.85, blueprint: 0.1, editorial: 0.18 };

/**
 * What goes in against what comes out, as bands whose width is the flow. Feeds stack on the left,
 * products on the right, and a closing line says whether the balance closes. Bands are solid
 * blocks in poster, outlined in blueprint and translucent elsewhere.
 */
export function BalanceFlow({ label, inputs, outputs, unit, decimals = 1, height = 240, tolerancePercent = 1, className }: BalanceFlowProps) {
  const look = useLook();
  const balance = massBalance(
    inputs.map((stream) => stream.value),
    outputs.map((stream) => stream.value),
    tolerancePercent
  );
  const left = stackLayout(
    inputs.map((stream) => stream.value),
    height
  );
  const right = stackLayout(
    outputs.map((stream) => stream.value),
    height
  );
  const outlined = look === 'blueprint' || look === 'poster';
  const leftOffsets = inputs.map(() => 0);
  const rightOffsets = outputs.map(() => 0);
  const bands = inputs.flatMap((input, i) =>
    outputs.map((output, j) => {
      const from = left[i].height * (balance.totalOut === 0 ? 0 : output.value / balance.totalOut);
      const to = right[j].height * (balance.totalIn === 0 ? 0 : input.value / balance.totalIn);
      const y1 = left[i].top + leftOffsets[i];
      const y2 = right[j].top + rightOffsets[j];
      leftOffsets[i] += from;
      rightOffsets[j] += to;
      return { key: `${input.id}-${output.id}`, tone: output.tone, d: `M 7 ${y1} C 50 ${y1}, 50 ${y2}, 93 ${y2} L 93 ${y2 + to} C 50 ${y2 + to}, 50 ${y1 + from}, 7 ${y1 + from} Z` };
    })
  );
  const column = (streams: readonly BalanceStream[], layout: readonly { top: number; height: number }[], side: 'in' | 'out', total: number) => (
    <ul aria-label={side === 'in' ? 'In' : 'Out'} className="relative w-full min-w-0" style={{ height }}>
      {streams.map((stream, index) => (
        <li key={stream.id} data-tone={stream.tone} className={cx('absolute flex w-full min-w-0 items-center gap-2', side === 'in' ? 'justify-end text-right' : 'justify-start')} style={{ top: layout[index].top, height: layout[index].height }}>
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2" style={{ justifyContent: side === 'in' ? 'flex-end' : 'flex-start' }}>
            <span className="text-sm font-semibold text-(--kit-text)">{stream.label}</span>
            <span className="text-sm text-(--kit-text-2) tabular-nums">
              {formatNumber(stream.value, decimals)} {unit}
            </span>
            {side === 'out' && total > 0 ? <span className="text-xs text-(--kit-text-3) tabular-nums">{formatNumber((stream.value / total) * 100, 1)} %</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <figure data-look={look} aria-label={label} className={cx('flex w-full min-w-0 flex-col gap-4', className)}>
      <div className="grid min-w-0 items-start gap-3" style={{ gridTemplateColumns: 'minmax(0, 0.7fr) minmax(80px, 1fr) minmax(0, 1.3fr)' }}>
        {column(inputs, left, 'in', balance.totalIn)}
        <svg aria-hidden="true" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
          {bands.map((band) => (
            <path key={band.key} data-tone={band.tone} d={band.d} style={{ fill: 'var(--t-line)', fillOpacity: BAND_OPACITY[look], stroke: outlined ? 'var(--kit-text)' : 'none', strokeWidth: look === 'poster' ? 2 : 1 }} vectorEffect="non-scaling-stroke" />
          ))}
          {inputs.map((stream, index) => (
            <rect key={stream.id} data-tone={stream.tone} x={0} y={left[index].top} width={7} height={left[index].height} style={{ fill: 'var(--t-line)' }} />
          ))}
          {outputs.map((stream, index) => (
            <rect key={stream.id} data-tone={stream.tone} x={93} y={right[index].top} width={7} height={right[index].height} style={{ fill: 'var(--t-line)' }} />
          ))}
        </svg>
        {column(outputs, right, 'out', balance.totalOut)}
      </div>
      <figcaption data-tone={balance.closes ? 'success' : 'warning'} data-slot="balance-closing" className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-(--kit-rule) pt-3 text-sm text-(--kit-text-2) tabular-nums">
        <span>
          In <strong className="font-semibold text-(--kit-text)">{formatNumber(balance.totalIn, decimals)}</strong> {unit}
        </span>
        <span>
          Out <strong className="font-semibold text-(--kit-text)">{formatNumber(balance.totalOut, decimals)}</strong> {unit}
        </span>
        <span className="ml-auto font-semibold" style={{ color: 'var(--t-ink)' }}>
          {balance.closes ? 'Balance closes' : 'Balance open'}, {formatNumber(Math.abs(balance.difference), decimals)} {unit} ({formatNumber(Math.abs(balance.percent), 1)} %) unaccounted
        </span>
      </figcaption>
    </figure>
  );
}
