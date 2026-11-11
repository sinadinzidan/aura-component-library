import { cn } from '../../../lib/utils';

import { PORT_TYPE_LABEL } from './graphModel';
import type { PortType } from './graphModel';
import { PortGlyph } from './GraphNodeCard';
import { PORT_TYPES } from './graphReducer';

export type PortTypeLegendProps = {
  types?: readonly PortType[];
  /** What each type is for, one line, by type. */
  descriptions?: Partial<Record<PortType, string>>;
  layout?: 'row' | 'column';
  className?: string;
};

/** The key to port shapes: each data type has its own glyph and a name, so no type rests on colour. */
export function PortTypeLegend({ types = PORT_TYPES, descriptions = {}, layout = 'row', className }: PortTypeLegendProps) {
  return (
    <ul data-slot="port-type-legend" aria-label="Port types" className={cn('flex gap-x-5 gap-y-2', layout === 'row' ? 'flex-wrap' : 'flex-col', className)}>
      {types.map((type) => (
        <li key={type} className="flex items-center gap-2">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0">
            <PortGlyph type={type} x={8} y={8} className="fill-base-background stroke-medium-foreground" />
          </svg>
          <span className="flex flex-col">
            <span className="text-sm text-base-foreground">{PORT_TYPE_LABEL[type]}</span>
            {descriptions[type] ? <span className="text-xs text-muted-foreground">{descriptions[type]}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
