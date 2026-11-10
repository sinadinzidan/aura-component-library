import { cn } from '../../../lib/utils';

import { HEAT_LEVEL_BG } from './heatLevels';

export type HeatScaleLegendProps = {
  /** Text at the low end: "0" or "Fewer". */
  lowLabel: string;
  /** Text at the high end: "12 alarms" or "More". */
  highLabel: string;
  /** What the colour encodes, printed before the scale: "Alarms per hour". */
  title?: string;
  /** Adds a swatch for cells without data. */
  emptyLabel?: string;
  className?: string;
};

/** The colour key of a heat map: the four density steps between a low and a high label. */
export function HeatScaleLegend({ lowLabel, highLabel, title, emptyLabel, className }: HeatScaleLegendProps) {
  return (
    <div data-slot="heat-scale-legend" className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
      {title ? <span className="text-medium-foreground">{title}</span> : null}
      <span className="flex items-center gap-2 tabular-nums">
        <span>{lowLabel}</span>
        <span aria-hidden="true" className="flex gap-0.5">
          {HEAT_LEVEL_BG.map((level) => (
            <span key={level} data-slot="heat-step" className={cn('h-2.5 w-5 rounded-xs', level)} />
          ))}
        </span>
        <span>{highLabel}</span>
      </span>
      {emptyLabel ? (
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-5 rounded-xs bg-muted-background" />
          <span>{emptyLabel}</span>
        </span>
      ) : null}
    </div>
  );
}
