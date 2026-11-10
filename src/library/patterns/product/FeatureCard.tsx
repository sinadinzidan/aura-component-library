import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type FeatureCardProps = {
  title: string;
  /** What the feature does for the reader, in one or two sentences. */
  description: ReactNode;
  /** An icon. It sits in a neutral tile so a grid of features stays quiet. */
  icon?: ReactNode;
  /** Step number or short marker shown instead of an icon: "1", "A". */
  marker?: string;
  /** Under the description: a link, a list of facts or a live component. */
  children?: ReactNode;
  /** `stacked` puts the icon above the text; `inline` puts it to the left, for lists. */
  layout?: 'stacked' | 'inline';
  /** `plain` sits on the page; `card` gets its own surface, for bento grids. */
  surface?: 'plain' | 'card';
  as?: 'h3' | 'h4';
  className?: string;
};

/**
 * One feature: icon or number, a short title and a sentence. The unit of feature grids, lists and
 * "how it works" steps; every card in a group should use the same layout and surface.
 */
export function FeatureCard({
  title,
  description,
  icon,
  marker,
  children,
  layout = 'stacked',
  surface = 'plain',
  as: Heading = 'h3',
  className,
}: FeatureCardProps) {
  const lead =
    icon || marker ? (
      <span
        aria-hidden="true"
        data-slot="feature-lead"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted-background text-sm font-semibold tabular-nums text-base-foreground [&_svg]:size-5"
      >
        {icon ?? marker}
      </span>
    ) : null;

  return (
    <div
      data-slot="feature-card"
      data-layout={layout}
      className={cn(
        'flex min-w-0',
        layout === 'stacked' ? 'flex-col gap-3' : 'flex-row gap-4',
        surface === 'card' ? 'rounded-xl bg-card-background p-6' : undefined,
        className
      )}
    >
      {lead}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Heading className="text-base font-semibold text-base-foreground">{title}</Heading>
        <p className="text-sm text-pretty text-medium-foreground">{description}</p>
        {children ? <div className="pt-2">{children}</div> : null}
      </div>
    </div>
  );
}
