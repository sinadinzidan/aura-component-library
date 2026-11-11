import { IconX } from '@cognite/aura/icons';

import type { DotShape, Tone } from '../../industrial/status';
import { IconAction } from '../../patterns/collections/IconAction';

import { SiteMarkSwatch } from './SiteMark';

type MapInfoCardProps = {
  title: string;
  /** One line under the title, such as the region and kind. */
  subtitle?: string;
  status?: { label: string; tone: Tone; shape: DotShape };
  rows: readonly { label: string; value: string }[];
  /** A sentence of context, such as today's note. */
  note?: string;
  onClose?: () => void;
};

/** The card for a selected site: name, status with its mark, a few figures and a close button. */
export function MapInfoCard({ title, subtitle, status, rows, note, onClose }: MapInfoCardProps) {
  return (
    <section aria-label={`${title} details`} data-slot="map-info-card" className="flex w-full flex-col gap-3 rounded-xl border border-default bg-card-background p-3">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-sm font-semibold text-base-foreground">{title}</h3>
          {subtitle ? <span className="truncate text-xs text-muted-foreground">{subtitle}</span> : null}
        </div>
        {onClose ? (
          <IconAction label={`Close ${title}`} onClick={onClose}>
            <IconX />
          </IconAction>
        ) : null}
      </div>
      {status ? (
        <span className="flex items-center gap-2 text-sm text-base-foreground">
          <SiteMarkSwatch tone={status.tone} shape={status.shape} radius={5} />
          {status.label}
        </span>
      ) : null}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="col-span-2 flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="tabular-nums text-base-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="text-xs text-medium-foreground">{note}</p> : null}
    </section>
  );
}
