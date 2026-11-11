import { IconCheck, IconMinus } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type PriceFeature = { label: string; included: boolean };

type PriceCardProps = {
  /** Name of the plan. */
  name: string;
  /** Who it is for, in one line. */
  description: string;
  /** The price as shown: "€ 1 900" or "Let's talk". */
  price: string;
  /** What the price is per: "per site, per month". */
  period?: string;
  features: readonly PriceFeature[];
  /** The plan's one action. */
  action: ReactNode;
  /** The plan most buyers should pick: it takes the accent and a label. */
  featured?: boolean;
  /** Words on the featured label. */
  featuredLabel?: string;
  className?: string;
};

/**
 * One plan on a pricing page: name, price, what is and is not included, and one action. The
 * featured plan is outlined and washed in the accent and labelled in words. Surface, radius and
 * the weight of the price follow the look.
 */
export function PriceCard({ name, description, price, period, features, action, featured = false, featuredLabel = 'Most popular', className }: PriceCardProps) {
  const look = useLook();
  return (
    <section
      aria-label={`${name} plan`}
      data-look={look}
      data-featured={featured ? '' : undefined}
      className={cx(
        'relative flex min-w-0 flex-col gap-5 rounded-(--kit-radius) border border-(--kit-rule) bg-(--kit-surface) p-6 shadow-(--kit-panel-shadow)',
        'data-featured:border-2 data-featured:border-(--kit-line-accent) data-featured:bg-[color-mix(in_oklab,var(--kit-line-accent)_7%,var(--kit-surface))]',
        look === 'glass' && 'backdrop-blur-xl',
        className,
      )}
    >
      {featured ? (
        <span className="absolute -top-3 right-5 rounded-(--kit-track-radius) bg-(--kit-accent) px-2.5 py-1 text-xs font-semibold text-(color:--kit-on-accent)">
          {featuredLabel}
        </span>
      ) : null}
      <div className="min-w-0">
        <h4 className="text-lg font-semibold tracking-tight text-(color:--kit-text)">{name}</h4>
        <p className="text-sm text-(color:--kit-text-2)">{description}</p>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-4xl leading-none font-(--kit-figure-weight) tracking-tight text-(color:--kit-text) tabular-nums">{price}</span>
        {period ? <span className="text-sm text-(color:--kit-text-2)">{period}</span> : null}
      </p>
      <div className="flex [&>*]:w-full">{action}</div>
      <ul className="flex flex-1 flex-col gap-2.5 border-t border-(--kit-rule) pt-5">
        {features.map((feature) => (
          <li key={feature.label} className={cx('flex items-start gap-2.5 text-sm', feature.included ? 'text-(color:--kit-text)' : 'text-(color:--kit-text-3)')}>
            {feature.included ? (
              <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-(color:--kit-line-success)" />
            ) : (
              <IconMinus aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            )}
            <span>
              {feature.label}
              <span className="sr-only">{feature.included ? ' (included)' : ' (not included)'}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
