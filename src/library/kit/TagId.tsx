import { useLook } from '../looks/useLook';

import { cx } from './tones';

type TagIdProps = {
  /** The tag, for example `23-KA-9101`. */
  children: string;
  /** `chip` gives the tag a quiet ground so it reads as an identifier inside running text. */
  variant?: 'plain' | 'chip';
  className?: string;
};

/**
 * An asset or instrument tag in the UI typeface with tabular figures — never monospace, which is
 * reserved for code.
 */
export function TagId({ children, variant = 'plain', className }: TagIdProps) {
  const look = useLook();
  return (
    <span data-look={look} data-variant={variant} className={cx('kit-tag', className)}>
      {children}
    </span>
  );
}
