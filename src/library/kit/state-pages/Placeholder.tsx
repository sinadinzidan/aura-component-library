import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type PlaceholderProps = {
  /** `line` for text, `block` for a tile, chart or image, `circle` for an avatar or gauge. */
  shape?: 'line' | 'block' | 'circle';
  /** Layout classes for its size, such as `h-4 w-40` or `size-10`. */
  className?: string;
};

/**
 * A loading placeholder in the shape of the content that will replace it. It is drawn in the
 * look's track colour, so it shows on every surface, and takes the look's corners. Decorative:
 * put one `role="status"` message next to a group of placeholders.
 */
export function Placeholder({ shape = 'line', className }: PlaceholderProps) {
  const look = useLook();
  return (
    <span
      aria-hidden="true"
      data-look={look}
      data-shape={shape}
      className={cx(
        'block shrink-0 bg-[color-mix(in_oklab,var(--kit-text)_11%,transparent)] motion-safe:animate-pulse',
        shape === 'circle' ? 'rounded-full' : shape === 'block' ? 'rounded-(--kit-radius-sm)' : 'h-3.5 rounded-(--kit-track-radius)',
        className,
      )}
    />
  );
}
