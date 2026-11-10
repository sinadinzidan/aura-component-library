import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';

import { NEON_FILL, NEON_STROKE, NEON_SVG_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { blockFaces, pointsAttribute } from './perspective';
import type { FloorBlock, GridView } from './perspective';

export type GridBlockProps = {
  view: GridView;
  /** Footprint and height on the floor. Height usually encodes a value such as load. */
  block: FloorBlock;
  /** Short name drawn above the block, usually a tag. */
  label: string;
  /** Figure drawn beside the label, such as "78%". */
  value?: string;
  /** State in words, drawn under the label so the edge colour is never the only signal. */
  status?: string;
  /** Full description for assistive technology. */
  description: string;
  tone?: NeonTone;
  selected?: boolean;
  onSelect?: () => void;
};

/** How far a selected block rises, in user units. */
const LIFT = 16;

/**
 * An outlined, glowing box standing on a `PerspectiveGrid`. Its height carries a value, its edge
 * colour a state, and it is a toggle button: selecting it lifts it off its footprint. Draw
 * blocks far-to-near (`paintOrder`) so nearer ones cover farther ones.
 */
export function GridBlock({ view, block, label, value, status, description, tone = 'accent', selected = false, onSelect }: GridBlockProps) {
  const faces = blockFaces(view, block);
  const topY = Math.min(...faces.top.map((point) => point.y));

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
    }
  };

  return (
    <g
      data-slot="grid-block"
      data-tone={tone}
      data-selected={selected ? 'true' : 'false'}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={description}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(NEON_TONE[tone], 'group cursor-pointer outline-none')}
    >
      <polygon
        data-slot="grid-block-base"
        points={pointsAttribute(faces.base)}
        strokeWidth={1}
        strokeDasharray="4 3"
        className={cn(NEON_STROKE, 'fill-[color-mix(in_oklab,var(--neon)_10%,transparent)]')}
      />
      <g
        data-slot="grid-block-body"
        style={{ transform: selected ? `translateY(-${LIFT}px)` : 'translateY(0px)' }}
        className="motion-safe:transition-transform motion-safe:duration-300"
      >
        <g
          strokeLinejoin="round"
          strokeWidth={selected ? 2 : 1.25}
          className={cn(
            NEON_STROKE,
            NEON_SVG_GLOW,
            'group-hover:stroke-[2px] group-focus-visible:stroke-[3px]',
            selected
              ? 'fill-[color-mix(in_oklab,var(--neon)_30%,var(--base-background))]'
              : 'fill-[color-mix(in_oklab,var(--neon)_12%,var(--base-background))]'
          )}
        >
          {faces.side ? <polygon points={pointsAttribute(faces.side)} /> : null}
          <polygon points={pointsAttribute(faces.front)} />
          <polygon
            points={pointsAttribute(faces.top)}
            className={
              selected
                ? 'fill-[color-mix(in_oklab,var(--neon)_45%,var(--base-background))]'
                : 'fill-[color-mix(in_oklab,var(--neon)_22%,var(--base-background))]'
            }
          />
        </g>
        <text
          x={faces.anchor.x}
          y={topY - (status ? 22 : 9)}
          textAnchor="middle"
          className="fill-base-foreground font-mono text-xs font-semibold [paint-order:stroke] stroke-base-background [stroke-width:3px]"
        >
          {label}
          {value ? (
            <tspan dx={6} className={cn(NEON_FILL, 'font-medium')}>
              {value}
            </tspan>
          ) : null}
        </text>
        {status ? (
          <text
            x={faces.anchor.x}
            y={topY - 8}
            textAnchor="middle"
            className={cn(NEON_FILL, 'font-mono text-[0.6875rem] uppercase tracking-wider [paint-order:stroke] stroke-base-background [stroke-width:3px]')}
          >
            {status}
          </text>
        ) : null}
      </g>
    </g>
  );
}
