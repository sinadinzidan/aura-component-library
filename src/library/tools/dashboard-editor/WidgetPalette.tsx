import { Button } from '@cognite/aura/components/button';
import { IconPlus } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type PaletteWidget = {
  /** Key of the widget type. */
  type: string;
  /** Name of the widget: "Trend chart". */
  label: string;
  /** What it shows, in one line. */
  description: string;
  icon?: ReactNode;
  /** Default size in cells, shown as "6 × 4". */
  w: number;
  h: number;
};

type WidgetPaletteProps = {
  widgets: readonly PaletteWidget[];
  onAdd: (type: string) => void;
  /** How many of each type the dashboard already has, by type key. */
  counts?: Readonly<Record<string, number>>;
  /** Locks the palette and says why, e.g. while the dashboard is read-only. */
  disabledReason?: string;
  /** Accessible name of the list. */
  label?: string;
};

/**
 * The list of widget types that can be added to a dashboard. Each row names the widget, says what
 * it shows and at what size it arrives, and has its own "Add" button, so adding never depends on
 * dragging. New widgets land in the first free slot.
 */
export function WidgetPalette({ widgets, onAdd, counts = {}, disabledReason, label = 'Widgets to add' }: WidgetPaletteProps) {
  return (
    <div data-slot="widget-palette" className="flex w-full min-w-0 flex-col gap-2">
      {disabledReason ? <p className="text-xs text-muted-foreground">{disabledReason}</p> : null}
      <ul aria-label={label} className="flex w-full flex-col divide-y divide-default">
        {widgets.map((widget) => {
          const count = counts[widget.type] ?? 0;
          return (
            <li key={widget.type} className="flex items-center gap-3 py-3">
              {widget.icon ? (
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-background text-medium-foreground [&_svg]:size-4">
                  {widget.icon}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium text-base-foreground">{widget.label}</span>
                <span className="text-xs text-muted-foreground">{widget.description}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {widget.w} × {widget.h} cells{count > 0 ? ` · ${count} on dashboard` : ''}
                </span>
              </span>
              <Button variant="secondary" size="sm" aria-label={`Add ${widget.label}`} disabled={disabledReason !== undefined} onClick={() => onAdd(widget.type)}>
                <IconPlus /> Add
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
