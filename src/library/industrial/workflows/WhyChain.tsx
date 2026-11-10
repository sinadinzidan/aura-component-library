import { Badge } from '@cognite/aura/components/badge';

import { cn } from '../../../lib/utils';

export type WhyStep = { id: string; question: string; answer: string };

export type WhyChainProps = {
  steps: readonly WhyStep[];
  /** What is being explained, e.g. "Five whys, recompressor trip". */
  label: string;
  /** Marks the last answer. Pass `null` while the chain has not reached a root cause. */
  rootLabel?: string | null;
  className?: string;
};

/**
 * A five-whys chain: each answer becomes the next question, top to bottom, and the last answer is
 * marked as the root cause. Numbered so a discussion can refer to "why 3".
 */
export function WhyChain({ steps, label, rootLabel = 'Root cause', className }: WhyChainProps) {
  return (
    <ol data-slot="why-chain" aria-label={label} className={cn('flex w-full flex-col', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
            {isLast ? null : <span aria-hidden className="absolute top-6 bottom-0 left-3 border-l border-emphasized" />}
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-background text-xs font-medium text-base-foreground tabular-nums">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
              <span className="text-xs text-muted-foreground">{step.question}</span>
              <span className={cn('text-sm text-base-foreground', isLast && rootLabel ? 'font-medium' : undefined)}>{step.answer}</span>
              {isLast && rootLabel ? (
                <span>
                  <Badge variant="warning">{rootLabel}</Badge>
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
