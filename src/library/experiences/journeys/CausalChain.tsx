import { IconArrowNarrowRight } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

export type CausalLink = {
  id: string;
  /** Formatted time the link became evident: "13:22". */
  time: string;
  title: string;
  detail: string;
};

export type CausalChainProps = {
  links: readonly CausalLink[];
  /** How many links are known so far, from the start of the chain. */
  revealed: number;
  /** Accessible name, e.g. "What led to the trip". */
  label: string;
  /** Shown in place of a link that is not yet known. */
  pendingText?: string;
  className?: string;
};

/**
 * What led to what, left to right. Links fill in as they become known — during a replay, as the
 * playhead passes them — and the ones still ahead stay as dashed placeholders, so the reader sees
 * both the story so far and how much of it is still to come. The latest known link is emphasised.
 */
export function CausalChain({ links, revealed, label, pendingText = 'Not yet evident', className }: CausalChainProps) {
  const known = Math.min(Math.max(revealed, 0), links.length);

  return (
    <div data-slot="causal-chain" className={cn('@container w-full min-w-0', className)}>
      <ol aria-label={label} className="grid grid-cols-1 gap-x-5 gap-y-3 @md:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-6">
        {links.map((link, index) => {
          const isKnown = index < known;
          const isLatest = index === known - 1;
          return (
            <li
              key={link.id}
              data-state={isKnown ? (isLatest ? 'latest' : 'known') : 'pending'}
              aria-current={isLatest ? 'step' : undefined}
              className={cn(
                'relative flex min-w-0 flex-col gap-1 rounded-lg border p-3 transition-colors duration-300 motion-reduce:transition-none',
                isLatest
                  ? 'border-[color:var(--primary-background)] bg-card-background'
                  : isKnown
                    ? 'border-default bg-card-background'
                    : 'border-dashed border-emphasized'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums',
                    isKnown ? 'bg-primary-background text-primary-foreground' : 'border border-emphasized text-muted-foreground'
                  )}
                >
                  {index + 1}
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{isKnown ? link.time : '––:––'}</span>
              </div>
              {isKnown ? (
                <>
                  <p className="text-sm font-medium text-base-foreground">{link.title}</p>
                  <p className="text-xs text-muted-foreground">{link.detail}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{pendingText}</p>
              )}
              {index < links.length - 1 ? (
                <span aria-hidden className={cn('absolute top-3 -right-[1.125rem] [&_svg]:size-4', isKnown ? 'text-base-foreground' : 'text-muted-foreground')}>
                  <IconArrowNarrowRight />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
