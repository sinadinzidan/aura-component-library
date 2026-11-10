import { useId } from 'react';
import type { ReactNode } from 'react';

type AuthCardProps = {
  /** Names the step: "Sign in to Nordkapp", "Check your email". */
  title: string;
  /** One or two sentences on what to do or what just happened. */
  description?: ReactNode;
  /** A mark above the title: the product logo, or an icon that names the step. */
  icon?: ReactNode;
  /** The step's fields and actions. Spaced `gap-4`. */
  children?: ReactNode;
  /** Secondary route under a rule: "No account? Request access". */
  footer?: ReactNode;
  /** Heading element. A full-page sign-in uses `h1`; a prompt inside an app uses `h2`. */
  as?: 'h1' | 'h2' | 'h3';
};

/**
 * The frame every authentication step shares: a mark, a title, a sentence, the fields, and one
 * secondary route at the bottom. Keeping sign-in, reset and verification in the same frame makes a
 * multi-step flow read as one place rather than a series of unrelated screens.
 */
export function AuthCard({ title, description, icon, children, footer, as: Heading = 'h2' }: AuthCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex w-full flex-col gap-6 rounded-xl border border-default bg-card-background p-6"
    >
      <header className="flex flex-col gap-4">
        {icon ? (
          <span className="flex size-10 items-center justify-center rounded-lg bg-muted-background text-medium-foreground [&>svg]:size-5">
            {icon}
          </span>
        ) : null}
        <div className="flex flex-col gap-1">
          <Heading id={titleId} className="text-xl font-semibold tracking-tight text-base-foreground">
            {title}
          </Heading>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </header>
      {children ? <div className="flex flex-col gap-4">{children}</div> : null}
      {footer ? <footer className="border-t border-default pt-4 text-sm text-muted-foreground">{footer}</footer> : null}
    </section>
  );
}
