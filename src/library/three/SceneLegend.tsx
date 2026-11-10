import { cn } from '../../lib/utils';
import type { DotShape, Tone } from '../industrial/status';
import { StatusDot } from '../industrial/StatusDot';

export type SceneLegendItem =
  | { kind: 'status'; label: string; tone: Tone; shape?: DotShape }
  /** The accent-coloured outline of the selected or hovered item. */
  | { kind: 'selection'; label: string }
  /** Flow chevrons on pipes. */
  | { kind: 'flow'; label: string }
  /** The outlined volume of an area. */
  | { kind: 'area'; label: string };

export type SceneLegendProps = {
  items: readonly SceneLegendItem[];
  /** Accessible name of the list. */
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

function Swatch({ item }: { item: SceneLegendItem }) {
  switch (item.kind) {
    case 'status':
      return <StatusDot tone={item.tone} shape={item.shape ?? 'ring'} size="md" />;
    case 'selection':
      return <span className="size-3 rounded-xs border-2 border-[var(--primary-background)]" />;
    case 'area':
      return <span className="size-3 rounded-xs border border-dashed border-[var(--ring-default)] bg-[color-mix(in_oklab,var(--primary-background)_14%,transparent)]" />;
    case 'flow':
      return (
        <svg viewBox="0 0 12 12" className="size-3 fill-[var(--primary-background)]" aria-hidden="true">
          <path d="M2 1.5 10 6 2 10.5z" />
        </svg>
      );
  }
}

/**
 * Explains the marks a 3D scene uses: status rings, selection outline, area volumes and flow
 * chevrons. Every scene that encodes state needs one, because colour in 3D has no tooltip.
 */
export function SceneLegend({ items, label = 'Scene legend', orientation = 'horizontal', className }: SceneLegendProps) {
  return (
    <ul
      aria-label={label}
      data-slot="scene-legend"
      className={cn('flex text-xs text-medium-foreground', orientation === 'horizontal' ? 'flex-wrap items-center gap-x-4 gap-y-1.5' : 'flex-col gap-2', className)}
    >
      {items.map((item) => (
        <li key={`${item.kind}-${item.label}`} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="flex size-3.5 shrink-0 items-center justify-center" aria-hidden="true">
            <Swatch item={item} />
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
