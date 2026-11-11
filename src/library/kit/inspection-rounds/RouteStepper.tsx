import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type RouteStop = {
  id: string;
  /** Area of the stop: "Compressor hall". */
  name: string;
  /** Progress in words: "4 of 4", "2 of 5". */
  detail: string;
  state: 'done' | 'current' | 'upcoming' | 'issue';
};

type RouteStepperProps = {
  /** Accessible name: "Route progress". */
  label: string;
  stops: readonly RouteStop[];
  className?: string;
};

const STOP_TONE: Record<RouteStop['state'], Tone> = {
  done: 'success',
  current: 'accent',
  upcoming: 'neutral',
  issue: 'critical',
};

const STOP_WORD: Record<RouteStop['state'], string> = {
  done: 'Done',
  current: 'Here now',
  upcoming: 'Ahead',
  issue: 'Finding',
};

/**
 * The areas of a round as stops along a line, in walking order. Finished legs are drawn solid,
 * the leg ahead is dashed, and each stop says its state in a word as well as in colour.
 */
export function RouteStepper({ label, stops, className }: RouteStepperProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'signal';

  return (
    <ol aria-label={label} data-look={look} className={cx('grid min-w-0 text-(--kit-text)', className)} style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}>
      {stops.map((stop, index) => {
        const walked = stop.state === 'done' || stop.state === 'issue';
        return (
          <li key={stop.id} data-tone={STOP_TONE[stop.state]} data-state={stop.state} aria-current={stop.state === 'current' ? 'step' : undefined} className="relative flex flex-col gap-2 pr-3">
            <div aria-hidden="true" className="flex items-center">
              <span
                className={cx(
                  'flex size-9 shrink-0 items-center justify-center text-sm font-semibold tabular-nums',
                  square ? '' : 'rounded-full',
                  stop.state === 'upcoming' ? 'border border-(--kit-rule-strong) text-(--kit-text-2)' : 'bg-(--t-solid) text-(--t-on-solid)',
                  stop.state === 'current' ? 'ring-4 ring-(--t-soft)' : '',
                )}
              >
                {index + 1}
              </span>
              {index < stops.length - 1 ? <span className={cx('ml-2 h-0 flex-1 border-t-2', walked ? 'border-(--t-solid)' : 'border-dashed border-(--kit-rule-strong)')} /> : null}
            </div>
            <div className="min-w-0">
              <p className="text-sm leading-5 font-medium">{stop.name}</p>
              <p className="text-xs leading-5 text-(--kit-text-2) tabular-nums">{stop.detail}</p>
              <p className="text-xs leading-5 font-semibold text-(--t-ink)">{STOP_WORD[stop.state]}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
