import type { ReactNode } from 'react';

import type { DotShape, Tone } from '../../industrial/status';

import { SiteMarkSwatch } from './SiteMark';

export type LegendStatus = { id: string; label: string; tone: Tone; shape: DotShape };

export type LegendLine = { id: string; label: string; style: 'pipeline' | 'idle' | 'export' | 'block' };

type MapLegendProps = {
  statuses?: readonly LegendStatus[];
  lines?: readonly LegendLine[];
  /** Explains marker size, for example "Marker size: production". */
  sizeNote?: string;
  title?: string;
  /** Extra rows, for example a cluster key. */
  children?: ReactNode;
};

const LINE_CLASS: Record<LegendLine['style'], string> = {
  pipeline: 'border-t-2 border-medium-foreground',
  idle: 'border-t-2 border-dotted border-medium-foreground',
  export: 'border-t border-dashed border-muted-foreground',
  block: 'border border-emphasized',
};

/** The key to a map: status marks with their shape and label, line styles, and what size means. */
export function MapLegend({ statuses = [], lines = [], sizeNote, title = 'Legend', children }: MapLegendProps) {
  return (
    <section aria-label={title} data-slot="map-legend" className="flex flex-col gap-2 text-xs text-base-foreground">
      <h4 className="font-medium text-medium-foreground">{title}</h4>
      {statuses.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {statuses.map((status) => (
            <li key={status.id} className="flex items-center gap-2">
              <SiteMarkSwatch tone={status.tone} shape={status.shape} radius={5} />
              {status.label}
            </li>
          ))}
        </ul>
      ) : null}
      {lines.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {lines.map((line) => (
            <li key={line.id} className="flex items-center gap-2">
              <span aria-hidden="true" className={`mx-1 block shrink-0 ${line.style === 'block' ? 'h-3 w-6' : 'w-6'} ${LINE_CLASS[line.style]}`} />
              {line.label}
            </li>
          ))}
        </ul>
      ) : null}
      {children}
      {sizeNote ? <p className="text-muted-foreground">{sizeNote}</p> : null}
    </section>
  );
}
