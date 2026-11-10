import { Button } from '@cognite/aura/components/button';
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { StatusDot } from '../StatusDot';

import { liveStatusText } from './liveStatus';

export type LiveToggleProps = {
  /** Whether the view follows new data. */
  live: boolean;
  onLiveChange: (live: boolean) => void;
  /** Timestamp of the newest datapoint on screen. */
  lastUpdated: number;
  /** Current time, injected so the component never reads the clock itself. */
  now: number;
  /** How often live data arrives, e.g. "every 5 s". Shown while live. */
  interval?: string;
  timeZone?: string;
  className?: string;
};

/**
 * Live or paused, and how fresh the data is. While live the dot pulses and the view follows new
 * data; pausing freezes the window so a trend can be inspected, and the text says how far behind
 * it has fallen.
 */
export function LiveToggle({ live, onLiveChange, lastUpdated, now, interval, timeZone = 'UTC', className }: LiveToggleProps) {
  return (
    <div data-slot="live-toggle" data-live={live} className={cn('flex items-center gap-3', className)}>
      <Button variant="outline" size="sm" aria-pressed={live} aria-label={live ? 'Live, pause updates' : 'Paused, resume live updates'} onClick={() => onLiveChange(!live)}>
        {live ? <IconPlayerPauseFilled aria-hidden /> : <IconPlayerPlayFilled aria-hidden />}
        {live ? 'Pause' : 'Go live'}
      </Button>
      <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums" role="status">
        <StatusDot tone={live ? 'success' : 'neutral'} shape={live ? 'dot' : 'ring'} pulse={live} size="sm" />
        <span className="font-medium text-base-foreground">{live ? 'Live' : 'Paused'}</span>
        <span>{liveStatusText({ live, lastUpdated, now, interval, timeZone }).replace(/^Updated /, 'updated ').replace(/^Paused at /, 'since ')}</span>
      </span>
    </div>
  );
}
