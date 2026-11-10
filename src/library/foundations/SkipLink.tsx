import type { MouseEvent } from 'react';

export type SkipLinkProps = {
  /** Id of the main content element to jump to. It needs `tabIndex={-1}` to take focus. */
  targetId: string;
  label?: string;
  /** Finds the target. Injectable for tests and for shadow roots. */
  findTarget?: (id: string) => HTMLElement | null;
  /**
   * `overlay` is the real pattern: hidden until it takes keyboard focus, then shown over the top
   * left of its positioned parent. `inline` keeps it visible, for documentation.
   */
  variant?: 'overlay' | 'inline';
};

const findById = (id: string) => document.getElementById(id);

/**
 * "Skip to content": the first focusable element on a page with a lot of navigation. It moves
 * keyboard focus past the chrome, straight to the main region.
 */
export function SkipLink({
  targetId,
  label = 'Skip to content',
  findTarget = findById,
  variant = 'overlay',
}: SkipLinkProps) {
  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = findTarget(targetId);
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  const shape =
    'rounded-lg bg-primary-background px-3 py-1.5 text-sm font-medium text-primary-foreground outline-none focus-visible:shadow-focus-ring';

  return (
    <a
      data-slot="skip-link"
      href={`#${targetId}`}
      onClick={skip}
      className={
        variant === 'overlay'
          ? `sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-10 ${shape}`
          : `inline-flex ${shape}`
      }
    >
      {label}
    </a>
  );
}
