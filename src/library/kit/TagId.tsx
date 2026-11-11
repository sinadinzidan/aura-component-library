import { useLook } from '../looks/useLook';

import { cx } from './tones';

type TagIdProps = {
  /** The tag, for example `23-KA-9101`. */
  children: string;
  /** `chip` gives the tag a quiet ground so it reads as an identifier inside running text. */
  variant?: 'plain' | 'chip';
  /**
   * `tabular` gives every digit the same width so tags line up down a column. Tables apply it
   * themselves; running text keeps proportional figures, which read as one word.
   */
  figures?: 'proportional' | 'tabular';
  className?: string;
};

/**
 * An asset or instrument tag in the UI typeface — never monospace, which is reserved for code.
 * Layout utilities (`hidden`, `block`, `truncate`) can be passed in `className`.
 */
export function TagId({ children, variant = 'plain', figures, className }: TagIdProps) {
  const look = useLook();
  return (
    <span data-look={look} data-variant={variant} data-figures={figures} className={cx('kit-tag', className)}>
      {children}
    </span>
  );
}
