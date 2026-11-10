import { Skeleton } from '@cognite/aura/components/skeleton';

type SkeletonCardProps = {
  /** Block above the text, for cards that lead with an image, chart or preview. */
  media?: boolean;
  /** Body lines under the title. */
  lines?: number;
  /** Two control-sized blocks at the bottom, for cards with footer actions. */
  actions?: boolean;
  label?: string;
};

/** Placeholder for a content card: optional media, title, body lines and optional actions. */
export function SkeletonCard({ media = false, lines = 2, actions = false, label = 'Loading card' }: SkeletonCardProps) {
  const count = Math.max(0, Math.floor(lines));

  return (
    <div role="status" aria-label={label} className="flex w-full flex-col gap-4 rounded-xl border border-default p-4">
      {media ? <Skeleton data-part="media" className="h-32 w-full" /> : null}
      <div className="flex flex-col gap-2">
        <Skeleton data-part="title" className="h-5 w-1/2" />
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} data-part="line" className={`h-4 ${index === count - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
      {actions ? (
        <div className="flex justify-end gap-2">
          <Skeleton data-part="action" className="h-7 w-16" />
          <Skeleton data-part="action" className="h-7 w-24" />
        </div>
      ) : null}
    </div>
  );
}
