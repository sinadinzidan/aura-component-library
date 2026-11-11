import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

type EventBadgeProps = {
  /** The mark: a number or a letter that ties a chart marker to its row in a list. */
  children: string;
  tone?: Tone;
  selected?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

const SHAPE: Record<LookId, string> = {
  studio: 'rounded-full bg-(--t-vivid) text-(--t-on-vivid)',
  console: 'bg-(--t-vivid) text-(--t-on-vivid)',
  poster: 'border-2 border-(--kit-text) bg-(--t-pop) text-(--t-on-pop)',
  glass: 'rounded-full bg-(--t-soft) text-(--t-line) ring-1 ring-(--t-line)',
  editorial: 'rounded-full border border-(--kit-text) bg-(--kit-halo) text-(--kit-text)',
  soft: 'rounded-full bg-(--t-soft) text-(--t-on-soft)',
  blueprint: 'rotate-45 border border-(--t-line) bg-(--kit-halo) text-(--t-ink) [&>span]:-rotate-45',
  signal: 'rounded-sm bg-(--t-vivid) text-(--t-on-vivid)',
};

/**
 * The numbered mark of a chart event. The same badge sits on the chart and in the list beside it,
 * so the eye can go from one to the other; its shape belongs to the look.
 */
export function EventBadge({ children, tone = 'accent', selected = false, size = 'md', className }: EventBadgeProps) {
  const look = useLook();
  return (
    <span
      data-look={look}
      data-tone={tone}
      data-selected={selected}
      className={cx(
        'inline-flex shrink-0 items-center justify-center text-xs leading-none font-semibold tabular-nums',
        size === 'md' ? 'size-6' : 'size-5',
        SHAPE[look],
        selected && 'outline-2 outline-offset-2 outline-(--kit-text)',
        className
      )}
    >
      <span>{children}</span>
    </span>
  );
}
