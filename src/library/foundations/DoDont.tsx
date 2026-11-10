import { IconCircleCheck, IconCircleX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type DoDontProps = {
  /** `do` marks the correct example, `dont` the one to avoid. */
  kind: 'do' | 'dont';
  /** One sentence saying why, shown under the example. */
  caption?: ReactNode;
  /** Overrides the verdict text, for example a translated one. */
  label?: string;
  /** `muted` is a grey well; `outline` keeps the page surface, for examples that contain fields. */
  surface?: 'muted' | 'outline';
  /** The example itself. */
  children: ReactNode;
  className?: string;
};

/**
 * Frames one example of a guideline as correct or to avoid. The verdict is an icon and a word, so
 * it never depends on colour; put two side by side for a Do / Don't pair.
 */
export function DoDont({ kind, caption, label, surface = 'muted', children, className = '' }: DoDontProps) {
  const isDo = kind === 'do';
  const verdict = label ?? (isDo ? 'Do' : "Don't");

  return (
    <figure data-slot="do-dont" data-kind={kind} className={`flex min-w-0 flex-col gap-3 ${className}`.trim()}>
      <p
        className={`flex items-center gap-1.5 text-xs font-medium ${
          isDo ? 'text-success-foreground-strong' : 'text-critical-foreground-strong'
        }`}
      >
        {isDo ? (
          <IconCircleCheck className="size-4" aria-hidden="true" />
        ) : (
          <IconCircleX className="size-4" aria-hidden="true" />
        )}
        {verdict}
      </p>
      <div
        className={`flex min-w-0 flex-1 flex-col justify-center rounded-lg p-4 ${
          surface === 'outline' ? 'border border-default' : 'bg-muted-background'
        }`}
      >
        {children}
      </div>
      {caption ? <figcaption className="text-xs text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}
