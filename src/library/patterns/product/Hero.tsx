import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type HeroProps = {
  /** The headline. One claim, in plain words. */
  title: string;
  /** Short line or badge above the headline: a category, a release, a status. */
  eyebrow?: ReactNode;
  /** One or two sentences that make the headline concrete. */
  description?: ReactNode;
  /** One primary action, optionally with one quieter action beside it. */
  actions?: ReactNode;
  /** Under the actions: a stats row, a checklist or a line of plain facts. */
  footer?: ReactNode;
  /** A live component or diagram. Beside the text when `align` is `start`, below it when centred. */
  visual?: ReactNode;
  align?: 'center' | 'start';
  /** `compact` opens a page inside the app in the UI typeface; `default` and `display` use the display typeface. */
  size?: 'compact' | 'default' | 'display';
  /** Heading element. A page has one `h1`. */
  as?: 'h1' | 'h2';
  className?: string;
};

const TITLE: Record<NonNullable<HeroProps['size']>, string> = {
  compact: 'text-2xl font-semibold tracking-tight',
  default: 'font-marketing text-4xl font-semibold tracking-tighter',
  display: 'font-marketing text-5xl font-semibold tracking-tighter',
};

const DESCRIPTION: Record<NonNullable<HeroProps['size']>, string> = {
  compact: 'text-sm',
  default: 'text-base',
  display: 'text-lg',
};

/**
 * The opening block of a page: eyebrow, headline, supporting sentence, actions and an optional
 * visual. It lays itself out from the width of its container, so the same hero works full width
 * and in a narrow column. The display typeface is used for the headline only.
 */
export function Hero({
  title,
  eyebrow,
  description,
  actions,
  footer,
  visual,
  align = 'start',
  size = 'default',
  as: Heading = 'h2',
  className,
}: HeroProps) {
  const centred = align === 'center';
  const split = !centred && visual !== undefined;

  return (
    <section data-slot="hero" data-align={align} className={cn('@container w-full', className)}>
      <div
        className={cn(
          'flex w-full flex-col',
          size === 'compact' ? 'gap-6' : 'gap-10',
          centred ? 'items-center' : undefined,
          split ? '@3xl:grid @3xl:grid-cols-2 @3xl:items-center' : undefined
        )}
      >
        <div
          className={cn(
            'flex min-w-0 flex-col',
            size === 'compact' ? 'gap-3' : 'gap-5',
            centred ? 'max-w-2xl items-center text-center' : 'max-w-xl items-start'
          )}
        >
          {eyebrow ? (
            <div data-slot="hero-eyebrow" className="text-sm font-medium text-muted-foreground">
              {eyebrow}
            </div>
          ) : null}
          <Heading className={cn('text-balance text-base-foreground', TITLE[size])}>{title}</Heading>
          {description ? (
            <p className={cn('max-w-prose text-pretty text-medium-foreground', DESCRIPTION[size])}>{description}</p>
          ) : null}
          {actions ? (
            <div data-slot="hero-actions" className={cn('flex flex-wrap items-center gap-2', centred ? 'justify-center' : undefined)}>
              {actions}
            </div>
          ) : null}
          {footer ? (
            <div data-slot="hero-footer" className="w-full">
              {footer}
            </div>
          ) : null}
        </div>
        {visual ? (
          <div data-slot="hero-visual" className={cn('w-full min-w-0', centred ? 'max-w-4xl' : undefined)}>
            {visual}
          </div>
        ) : null}
      </div>
    </section>
  );
}
