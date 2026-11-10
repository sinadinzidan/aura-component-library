import { IconPhoto } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

export type PagePreviewKind = 'document' | 'drawing' | 'photo';

export type PagePreviewProps = {
  kind: PagePreviewKind;
  /** What the preview stands for, e.g. "Preview of NK-23-PR-0012, page 1". */
  label: string;
  /** Visible text under a photo placeholder, e.g. "Photo 1 · Drive-end bearing". */
  caption?: string;
  className?: string;
};

const TEXT_LINES = ['w-11/12', 'w-full', 'w-10/12', 'w-full', 'w-9/12', 'w-full', 'w-11/12', 'w-7/12'] as const;

/**
 * A stand-in for a page, a drawing sheet or a photo where the real thing is not loaded: a
 * token-coloured block with page lines, sheet linework or a photo mark. Not a thumbnail image.
 */
export function PagePreview({ kind, label, caption, className }: PagePreviewProps) {
  if (kind === 'photo') {
    return (
      <div
        role="img"
        aria-label={label}
        data-slot="page-preview"
        data-kind={kind}
        className={cn('flex aspect-4/3 w-full flex-col items-center justify-center gap-1 rounded-lg bg-muted-background p-2 text-muted-foreground', className)}
      >
        <IconPhoto aria-hidden className="size-5" />
        {caption ? <span className="max-w-full truncate text-xs">{caption}</span> : null}
      </div>
    );
  }

  if (kind === 'drawing') {
    return (
      <div role="img" aria-label={label} data-slot="page-preview" data-kind={kind} className={cn('aspect-3/2 w-full rounded-lg bg-muted-background p-2', className)}>
        <svg aria-hidden viewBox="0 0 120 80" fill="none" className="size-full" preserveAspectRatio="xMidYMid meet">
          <rect x="1" y="1" width="118" height="78" className="stroke-chart-neutral-300" strokeWidth="1" />
          <path d="M 12 26 H 40 M 60 26 H 84 V 52 H 108 M 40 52 H 60 M 28 26 V 60" className="stroke-chart-neutral-400" strokeWidth="1.5" />
          <rect x="40" y="16" width="20" height="20" rx="2" className="stroke-chart-neutral-450" strokeWidth="1.5" />
          <circle cx="50" cy="52" r="9" className="stroke-chart-neutral-450" strokeWidth="1.5" />
          <path d="M 22 56 L 34 64 M 34 56 L 22 64" className="stroke-chart-neutral-450" strokeWidth="1.5" />
          <rect x="84" y="62" width="35" height="17" className="stroke-chart-neutral-300" strokeWidth="1" />
          <path d="M 84 68 H 119 M 84 73 H 119" className="stroke-chart-neutral-300" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      data-slot="page-preview"
      data-kind={kind}
      className={cn('flex aspect-3/4 w-full flex-col gap-2 rounded-lg bg-muted-background p-4', className)}
    >
      <span aria-hidden className="h-2 w-1/2 rounded-full bg-chart-neutral-400" />
      <span aria-hidden className="mb-1 h-1.5 w-1/3 rounded-full bg-chart-neutral-200" />
      {TEXT_LINES.map((width, index) => (
        <span key={index} aria-hidden className={cn('h-1.5 rounded-full bg-chart-neutral-200', width)} />
      ))}
    </div>
  );
}
