import type { KeyboardEvent, ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { sectorPath } from './sectorPath';

export type MixSegment = { id: string; label: string; value: number; tone: Tone };

type MixDonutProps = {
  /** What the whole is, for example "Energy in by source". */
  label: string;
  segments: readonly MixSegment[];
  /** Id of the picked segment, or `null` for the whole. */
  selected: string | null;
  /** Called with a segment id, or `null` when the picked segment is picked again. */
  onSelect: (id: string | null) => void;
  unit?: string;
  decimals?: number;
  /** Ring thickness as a share of the radius, 0–1. */
  thickness?: number;
  /** Write each segment's share on the ring when it is at least this many percent. 0 hides them. */
  shareFrom?: number;
  /** The middle of the ring: the total, or the picked segment. Size it in `cqw` units to follow the ring. */
  children?: ReactNode;
  /** Layout classes: the width. The donut is always square. */
  className?: string;
};

const OUTER = 88;
const LIFT = 8;
const GAP = 2.2;

/**
 * Parts of a whole as a ring whose segments are buttons. Picking a segment lifts it out of the
 * ring and quietens the rest, so the surrounding screen can show that part; picking it again
 * returns to the whole. The middle is free for the figure that matters.
 */
export function MixDonut({ label, segments, selected, onSelect, unit = '', decimals = 0, thickness = 0.3, shareFrom = 6, children, className }: MixDonutProps) {
  const look = useLook();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const inner = OUTER * (1 - thickness);
  const suffix = unit ? ` ${unit}` : '';

  const arcs = segments.map((segment, index) => {
    const before = segments.slice(0, index).reduce((sum, earlier) => sum + earlier.value, 0);
    const from = (before / total) * 360;
    const to = ((before + segment.value) / total) * 360;
    const pad = segments.length > 1 ? Math.min(GAP, (to - from) / 4) : 0;
    return { segment, from: from + pad, to: to - pad, middle: (from + to) / 2, share: (segment.value / total) * 100 };
  });

  return (
    <div data-look={look} className={cx('@container relative aspect-square min-w-0', className)}>
      <svg role="group" aria-label={label} viewBox="0 0 200 200" className="size-full overflow-visible">
        {arcs.map(({ segment, from, to, share }) => {
          const active = segment.id === selected;
          const dimmed = selected !== null && !active;
          const pick = () => onSelect(active ? null : segment.id);
          const onKeyDown = (event: KeyboardEvent<SVGPathElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              pick();
            }
          };
          return (
            <path
              key={segment.id}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={`${segment.label}: ${formatNumber(segment.value, decimals)}${suffix}, ${Math.round(share)} percent`}
              data-tone={segment.tone}
              d={sectorPath(from, to, active ? inner - 2 : inner, active ? OUTER + LIFT : OUTER)}
              onClick={pick}
              onKeyDown={onKeyDown}
              className="cursor-pointer outline-none transition-opacity focus-visible:[stroke:var(--kit-text)]"
              style={{ fill: 'var(--t-line)', stroke: 'var(--t-line)', strokeWidth: 3, strokeLinejoin: 'round', opacity: dimmed ? 0.32 : 1 }}
            />
          );
        })}
      </svg>
      {shareFrom > 0
        ? arcs
            .filter(({ share }) => share >= shareFrom)
            .map(({ segment, middle, share }) => {
              const radius = ((inner + OUTER) / 2 + (segment.id === selected ? LIFT / 2 : 0)) / 2;
              const radians = ((middle - 90) * Math.PI) / 180;
              return (
                <span
                  key={segment.id}
                  aria-hidden="true"
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-sm font-bold tabular-nums text-[var(--kit-surface)]"
                  style={{ left: `${(50 + radius * Math.cos(radians)).toFixed(2)}%`, top: `${(50 + radius * Math.sin(radians)).toFixed(2)}%`, opacity: selected !== null && segment.id !== selected ? 0.5 : 1 }}
                >
                  {Math.round(share)}%
                </span>
              );
            })
        : null}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
