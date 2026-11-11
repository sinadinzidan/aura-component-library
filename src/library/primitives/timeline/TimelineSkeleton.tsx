import { Skeleton } from '@cognite/aura/components/skeleton';

export type TimelineSkeletonProps = {
  /** Match the number of events that are expected. */
  items?: number;
  /** Announced once while the events load. */
  label?: string;
};

const WIDTHS = ['w-2/3', 'w-1/2', 'w-3/4', 'w-2/5'] as const;

/**
 * Placeholder for a vertical timeline while its events load: marker, title and one line per
 * event. Use on the base surface; skeletons disappear on a card in the dark theme.
 */
export function TimelineSkeleton({ items = 4, label = 'Loading timeline' }: TimelineSkeletonProps) {
  return (
    <div data-slot="timeline-skeleton" role="status" aria-label={label} className="flex w-full min-w-0 flex-col">
      {Array.from({ length: items }, (_, index) => (
        <div key={index} aria-hidden="true" className="flex min-w-0 gap-3">
          <div className="flex w-6 shrink-0 flex-col items-center">
            <span className="flex h-6 items-center">
              <Skeleton className="size-2.5" />
            </span>
            {index < items - 1 ? <span className="w-0 flex-1 border-l border-default" /> : null}
          </div>
          <div className={index < items - 1 ? 'flex min-w-0 flex-1 flex-col gap-2 pt-1 pb-5' : 'flex min-w-0 flex-1 flex-col gap-2 pt-1'}>
            <Skeleton className={`h-4 ${WIDTHS[index % WIDTHS.length]}`} />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
