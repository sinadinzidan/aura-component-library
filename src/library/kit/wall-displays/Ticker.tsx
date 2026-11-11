import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type TickerItem = { id: string; kind: string; text: string; tone?: Tone };

type TickerProps = {
  /** Accessible name: "Site messages". */
  label: string;
  items: readonly TickerItem[];
  /** Words at the end of the strip: when the screen was last refreshed. */
  trailing?: string;
  className?: string;
};

/**
 * The message strip along the bottom of a wall screen. It does not scroll: a moving line cannot be
 * read at a glance, so the strip holds as many whole messages as fit, each with its kind as a tag.
 */
export function Ticker({ label, items, trailing, className }: TickerProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  return (
    <div data-look={look} className={cx('flex items-center gap-6 bg-(--kit-well) px-6 py-3 text-base text-(--kit-text)', className)} style={{ borderTop: look === 'poster' ? '2px solid var(--kit-text)' : '1px solid var(--kit-rule)' }}>
      <ul aria-label={label} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span data-tone={item.tone ?? 'neutral'} className={cx('bg-(--t-solid) px-2 py-0.5 text-sm font-semibold whitespace-nowrap text-(--t-on-solid)', square ? '' : 'rounded-(--kit-radius-sm)')}>
              {item.kind}
            </span>
            <span className="font-medium">{item.text}</span>
          </li>
        ))}
      </ul>
      {trailing ? <span className="shrink-0 text-sm whitespace-nowrap text-(--kit-text-2) tabular-nums">{trailing}</span> : null}
    </div>
  );
}
