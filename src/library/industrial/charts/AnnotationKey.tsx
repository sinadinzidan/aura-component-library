import { cn } from '../../../lib/utils';
import type { Tone } from '../status';

export type AnnotationKind = 'limit' | 'event' | 'region' | 'marker' | 'cursor';

export type AnnotationKeyItem = {
  /** How the annotation is drawn on the chart. */
  kind: AnnotationKind;
  label: string;
  tone?: Tone;
};

export type AnnotationKeyProps = {
  items: readonly AnnotationKeyItem[];
  /** Accessible name of the list. */
  label?: string;
  className?: string;
};

const LINE: Record<Tone, string> = {
  neutral: 'border-chart-neutral-450',
  success: 'border-chart-success-450',
  warning: 'border-chart-warning-450',
  critical: 'border-chart-critical-450',
  info: 'border-chart-info-450',
};

const FILL: Record<Tone, string> = {
  neutral: 'bg-chart-neutral-100',
  success: 'bg-chart-success-100',
  warning: 'bg-chart-warning-100',
  critical: 'bg-chart-critical-100',
  info: 'bg-chart-info-100',
};

const DOT: Record<Tone, string> = {
  neutral: 'bg-chart-neutral-450',
  success: 'bg-chart-success-450',
  warning: 'bg-chart-warning-450',
  critical: 'bg-chart-critical-450',
  info: 'bg-chart-info-450',
};

function Glyph({ kind, tone }: { kind: AnnotationKind; tone: Tone }) {
  switch (kind) {
    case 'limit':
      return <span data-kind={kind} className={cn('h-0 w-4 border-t border-dashed', LINE[tone])} />;
    case 'event':
      return <span data-kind={kind} className={cn('h-3 w-0 border-l border-dotted', LINE[tone])} />;
    case 'cursor':
      return <span data-kind={kind} className={cn('h-3 w-0 border-l', LINE[tone])} />;
    case 'region':
      return <span data-kind={kind} className={cn('h-3 w-4 rounded-xs', FILL[tone])} />;
    case 'marker':
      return <span data-kind={kind} className={cn('size-2 rounded-full', DOT[tone])} />;
  }
}

/**
 * Key for the annotations on a chart: limit lines, event markers, shaded regions, point markers
 * and the cursor, each drawn the way it appears on the plot. Use it whenever a chart carries more
 * than one kind of annotation.
 */
export function AnnotationKey({ items, label = 'Annotations', className }: AnnotationKeyProps) {
  return (
    <ul aria-label={label} data-slot="annotation-key" className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-medium-foreground', className)}>
      {items.map((item) => (
        <li key={`${item.kind}-${item.label}`} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="flex w-4 shrink-0 items-center justify-center">
            <Glyph kind={item.kind} tone={item.tone ?? 'neutral'} />
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
