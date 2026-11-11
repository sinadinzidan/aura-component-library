import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';
import type { Tone } from '../tones';

type ToggleChipProps = {
  /** What the chip switches: a layer, a filter, an option. */
  children: ReactNode;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon?: ReactNode;
  /** A figure at the end, such as the number of parts in the layer. */
  count?: string;
  /** Colour of the pressed state. */
  tone?: Tone;
  size?: 'md' | 'lg';
  className?: string;
};

/**
 * An on/off chip for things that can be combined: scene layers, filters. Its pressed state is a
 * fill in the chip's tone and `aria-pressed`, and its corner radius follows the look. For
 * one-of-many choices use a segmented control instead.
 */
export function ToggleChip({ children, pressed, onPressedChange, icon, count, tone = 'accent', size = 'md', className }: ToggleChipProps) {
  const look = useLook();

  return (
    <button
      type="button"
      data-slot="toggle-chip"
      data-look={look}
      data-tone={tone}
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cx(
        'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--kit-radius-sm)] border font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)] [&_svg]:size-4 [&_svg]:shrink-0',
        size === 'lg' ? 'h-10 px-4 text-sm' : 'h-9 px-3 text-sm',
        pressed
          ? 'border-[color:color-mix(in_oklab,var(--t-ink)_55%,transparent)] bg-[var(--t-soft)] text-[color:var(--t-on-soft)]'
          : 'border-[color:var(--kit-rule)] bg-transparent text-[color:var(--kit-text-2)] hover:border-[color:var(--kit-rule-strong)] hover:text-[color:var(--kit-text)]',
        className
      )}
    >
      {icon}
      <span>{children}</span>
      {count ? <span className="tabular-nums opacity-80">{count}</span> : null}
    </button>
  );
}
