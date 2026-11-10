import { Badge } from '@cognite/aura/components/badge';
import { IconCheck, IconMinus } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type PlanFeature = {
  id: string;
  label: string;
  /** `false` lists the feature as not part of this plan. */
  included?: boolean;
};

export type PlanCardProps = {
  name: string;
  /** Who the plan is for, in one sentence. */
  description?: string;
  /** Already formatted, with currency: "€ 1,200". Use "Custom" for a quoted plan. */
  price: string;
  /** What the price is per: "per month", "per month, billed annually". */
  period?: string;
  /** Quiet line under the price, such as the yearly total or what the price excludes. */
  priceNote?: string;
  /** Heading of the feature list: "Includes", "Everything in Team, plus". */
  featuresLabel?: string;
  features: readonly PlanFeature[];
  /** Marks the plan with a text label, such as "Recommended". Never by colour alone. */
  highlightLabel?: string;
  /** Marks the plan the workspace is on. */
  current?: boolean;
  /** The one action for this plan, usually a full-width Button. */
  action?: ReactNode;
  className?: string;
};

/**
 * One plan in a pricing row: name, price, what it includes and one action. A highlighted plan
 * gets a stronger outline and a written label; the plan the workspace is on says so in words.
 */
export function PlanCard({
  name,
  description,
  price,
  period,
  priceNote,
  featuresLabel = 'Includes',
  features,
  highlightLabel,
  current = false,
  action,
  className,
}: PlanCardProps) {
  return (
    <section
      aria-label={`${name} plan`}
      data-slot="plan-card"
      data-highlighted={highlightLabel ? 'true' : undefined}
      className={cn(
        'flex h-full min-w-0 flex-col gap-5 rounded-xl border bg-card-background p-6',
        highlightLabel ? 'border-2 border-emphasized' : 'border-default',
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-base-foreground">{name}</h3>
          {highlightLabel ? <Badge>{highlightLabel}</Badge> : null}
          {current && !highlightLabel ? <Badge variant="secondary">Current plan</Badge> : null}
        </div>
        {description ? <p className="text-sm text-medium-foreground">{description}</p> : null}
      </div>

      <div className="flex flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span data-slot="plan-price" className="text-3xl font-semibold tracking-tight tabular-nums text-base-foreground">
            {price}
          </span>
          {period ? <span className="text-sm text-muted-foreground">{period}</span> : null}
        </p>
        <p className="min-h-4 text-xs tabular-nums text-muted-foreground">{priceNote}</p>
      </div>

      {action ? <div className="flex flex-col">{action}</div> : null}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">{featuresLabel}</p>
        <ul className="flex flex-col gap-2">
          {features.map((feature) => {
            const included = feature.included !== false;
            return (
              <li
                key={feature.id}
                data-included={included}
                className={cn('flex items-start gap-2 text-sm', included ? 'text-base-foreground' : 'text-muted-foreground')}
              >
                {included ? (
                  <IconCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <IconMinus aria-hidden className="mt-0.5 size-4 shrink-0" />
                )}
                <span>
                  {included ? null : <span className="sr-only">Not included: </span>}
                  {feature.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
