import { Skeleton } from '@cognite/aura/components/skeleton';

type SkeletonTextProps = {
  /** Number of lines the real text usually takes. */
  lines?: number;
  /** Accessible name for the loading region. Pass `null` when a parent region already has one. */
  label?: string | null;
};

const LAST_LINE_WIDTH = 'w-3/5';

/** Placeholder for a paragraph: full-width lines with a shorter last line, like real text. */
export function SkeletonText({ lines = 3, label = 'Loading text' }: SkeletonTextProps) {
  const count = Math.max(1, Math.floor(lines));
  const status = label === null ? {} : { role: 'status', 'aria-label': label };

  return (
    <div {...status} className="flex w-full flex-col gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={`h-4 ${index === count - 1 && count > 1 ? LAST_LINE_WIDTH : 'w-full'}`} />
      ))}
    </div>
  );
}
