import { cn } from '../../../lib/utils';

export type LevelLegendItem = {
  /** What the ring holds: "Equipment". */
  label: string;
  /** Quiet text after the label: a count or the name of the node in the centre. */
  detail?: string;
};

export type LevelLegendProps = {
  /** Centre first, then each ring outwards. */
  items: readonly LevelLegendItem[];
  /** Accessible name of the legend. */
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

const SIZE = 20;
const CENTRE = SIZE / 2;

/**
 * Explains the rings of a sunburst: a small target per level with that ring picked out, the level
 * it holds and an optional detail. The first item is the centre disc.
 */
export function LevelLegend({ items, label = 'Rings', orientation = 'horizontal', className }: LevelLegendProps) {
  const rings = Math.max(items.length - 1, 1);
  const discRadius = 2.5;
  const step = (CENTRE - 1 - discRadius) / rings;

  return (
    <ul
      data-slot="level-legend"
      aria-label={label}
      className={cn('flex', orientation === 'horizontal' ? 'flex-wrap items-center gap-x-5 gap-y-2' : 'flex-col gap-2', className)}
    >
      {items.map((item, index) => (
        <li key={item.label} className="flex items-center gap-2 text-xs text-medium-foreground">
          <svg aria-hidden="true" viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-5 shrink-0">
            <circle
              cx={CENTRE}
              cy={CENTRE}
              r={discRadius}
              className={index === 0 ? 'fill-primary-background' : 'fill-medium-background'}
              data-active={index === 0 ? 'true' : undefined}
            />
            {items.slice(1).map((ring, ringIndex) => (
              <circle
                key={ring.label}
                cx={CENTRE}
                cy={CENTRE}
                r={discRadius + step * (ringIndex + 1) - step / 2 + 0.5}
                fill="none"
                strokeWidth={Math.max(step - 1, 1)}
                data-active={ringIndex + 1 === index ? 'true' : undefined}
                className={ringIndex + 1 === index ? 'stroke-primary-background' : 'stroke-medium-background'}
              />
            ))}
          </svg>
          <span className="text-muted-foreground">{index === 0 ? 'Centre' : `Ring ${index}`}</span>
          <span className="font-medium text-base-foreground">{item.label}</span>
          {item.detail ? <span className="text-muted-foreground tabular-nums">{item.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}
