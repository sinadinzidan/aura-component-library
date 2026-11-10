import { Button } from '@cognite/aura/components/button';
import { IconPlayerPlay, IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

export type ReplayProps = {
  /**
   * The animated content. `run` is 0 until the first play, then counts up; the content is
   * remounted on every run, so mount animations (`animate-in`, keyframes) start again. Apply the
   * animation classes only when `run > 0` to keep the resting state still.
   */
  children: (run: number) => ReactNode;
  /** Button label before the first run. */
  playLabel?: string;
  /** Button label after the first run. */
  replayLabel?: string;
  /** Quiet text beside the button, such as the duration and easing being shown. */
  caption?: ReactNode;
  /** Called with the new run number, for example to count plays. */
  onReplay?: (run: number) => void;
  className?: string;
};

/**
 * Runs a motion demo on request. Nothing moves until the user presses the button, and nothing
 * loops: each press plays the animation once by remounting the content.
 */
export function Replay({
  children,
  playLabel = 'Play',
  replayLabel = 'Replay',
  caption,
  onReplay,
  className = '',
}: ReplayProps) {
  const [run, setRun] = useState(0);

  const replay = () => {
    const next = run + 1;
    setRun(next);
    onReplay?.(next);
  };

  return (
    <div data-slot="replay" className={`flex w-full min-w-0 flex-col gap-3 ${className}`.trim()}>
      <div key={run} data-run={run} className="min-w-0">
        {children(run)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={replay}>
          {run === 0 ? <IconPlayerPlay /> : <IconRefresh />}
          {run === 0 ? playLabel : replayLabel}
        </Button>
        {caption ? <p className="min-w-0 text-xs text-muted-foreground">{caption}</p> : null}
      </div>
    </div>
  );
}
