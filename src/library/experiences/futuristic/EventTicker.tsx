import { Button } from '@cognite/aura/components/button';
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@cognite/aura/icons';
import { useEffect, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';

import { NEON_TEXT, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export type TickerItem = {
  id: string;
  /** Short time text, already formatted: "13:46". */
  time: string;
  /** Kind of event in a word, e.g. "Alarm" or "Work order". Shown with the tone colour. */
  kind: string;
  text: string;
  tone?: NeonTone;
};

export type EventTickerProps = {
  items: readonly TickerItem[];
  /** What the ticker carries, e.g. "Recent events". */
  label: string;
  /** Seconds each item takes to cross. */
  secondsPerItem?: number;
  defaultPaused?: boolean;
  /** Overrides the system motion preference. */
  animated?: boolean;
  className?: string;
};

function TickerRun({ items, hidden }: { items: readonly TickerItem[]; hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden ? 'true' : undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item.id} className={cn(NEON_TONE[item.tone ?? 'accent'], 'flex shrink-0 items-center gap-2 whitespace-nowrap px-4 text-xs')}>
          <span className="font-mono tabular-nums text-muted-foreground">{item.time}</span>
          <span className={cn(NEON_TEXT, 'font-medium uppercase tracking-wider')}>{item.kind}</span>
          <span className="text-base-foreground">{item.text}</span>
          <span aria-hidden="true" className="pl-4 text-muted-foreground">
            {'//'}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * One line of recent events that scrolls slowly from right to left, with a pause button. With
 * reduced motion it does not move: the same line becomes a strip you scroll by hand. Use it for
 * ambient awareness at the edge of a screen, never as the only place an alarm appears.
 */
export function EventTicker({ items, label, secondsPerItem = 7, defaultPaused = false, animated, className }: EventTickerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const moving = animated ?? !reducedMotion;
  const [paused, setPaused] = useState(defaultPaused);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!moving || !track || typeof track.animate !== 'function' || items.length === 0) return undefined;
    const animation = track.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], {
      duration: items.length * secondsPerItem * 1000,
      iterations: Infinity,
      easing: 'linear',
    });
    animationRef.current = animation;
    // Cancelling rejects `finished`; nobody waits for it.
    animation.finished.catch(() => undefined);
    return () => {
      animation.cancel();
      animationRef.current = null;
    };
  }, [moving, items.length, secondsPerItem]);

  useEffect(() => {
    const animation = animationRef.current;
    if (!animation) return;
    if (paused) animation.pause();
    else animation.play();
  }, [paused, moving]);

  return (
    <div data-slot="event-ticker" data-moving={moving ? 'true' : 'false'} className={cn('flex min-w-0 items-center gap-2', className)}>
      {moving ? (
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={paused}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? <IconPlayerPlayFilled /> : <IconPlayerPauseFilled />}
          {paused ? 'Resume ticker' : 'Pause ticker'}
        </Button>
      ) : null}
      <div
        role="group"
        aria-label={label}
        tabIndex={moving ? undefined : 0}
        // Inline so the clipping is explicit: the track is deliberately wider than its window.
        style={{ overflowX: moving ? 'hidden' : 'auto', overflowY: 'hidden' }}
        className="min-w-0 flex-1 py-1"
      >
        <div ref={trackRef} data-slot="event-ticker-track" className="flex w-max">
          <TickerRun items={items} />
          {moving ? <TickerRun items={items} hidden /> : null}
        </div>
      </div>
    </div>
  );
}
