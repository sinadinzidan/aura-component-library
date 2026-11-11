import { Button } from '@cognite/aura/components/button';
import { IconArrowLeft, IconArrowRight, IconPlayerPlay } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

export type TourStepperStage = { id: string; label: string };

export type TourStepperProps = {
  stages: readonly TourStepperStage[];
  /** Current stop; −1 for the overview. */
  index: number;
  /** `free` shows a Resume tour button and no current stop. */
  mode: 'tour' | 'free';
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onResume: () => void;
  /** Accessible name of the whole control. */
  label?: string;
  className?: string;
};

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]';

/**
 * The control of a guided tour: one button per stop along a line, Previous and Next at the ends,
 * and — once the user has left the tour to look around — a Resume tour button that flies back.
 * Stops already passed are filled, the current one is marked with `aria-current`.
 */
export function TourStepper({ stages, index, mode, onSelect, onPrevious, onNext, onResume, label = 'Guided tour', className }: TourStepperProps) {
  const following = mode === 'tour';

  return (
    <nav aria-label={label} data-slot="tour-stepper" className={cn('flex items-center gap-3', className)}>
      <Button variant="outline" size="sm" disabled={index <= -1 && following} aria-label="Previous stop" onClick={onPrevious}>
        <IconArrowLeft />
      </Button>
      <ol className="flex min-w-0 flex-1 items-start">
        {stages.map((stage, position) => {
          const current = following && position === index;
          const passed = position < index || (!following && position === index);
          return (
            <li key={stage.id} className="flex min-w-0 flex-1 items-start">
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                onClick={() => onSelect(position)}
                className={cn('flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-1 py-0.5', FOCUS)}
              >
                <span className="flex w-full items-center">
                  <span aria-hidden="true" className={cn('h-0.5 flex-1', position === 0 ? 'bg-transparent' : position <= index ? 'bg-[var(--primary-background)]' : 'bg-emphasized')} />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums',
                      current
                        ? 'border-[var(--primary-background)] bg-[var(--primary-background)] text-primary-foreground shadow-[0_0_12px_color-mix(in_oklab,var(--primary-background)_55%,transparent)]'
                        : passed
                          ? 'border-[var(--primary-background)] text-base-foreground'
                          : 'border-emphasized text-muted-foreground'
                    )}
                  >
                    {position + 1}
                  </span>
                  <span aria-hidden="true" className={cn('h-0.5 flex-1', position === stages.length - 1 ? 'bg-transparent' : position < index ? 'bg-[var(--primary-background)]' : 'bg-emphasized')} />
                </span>
                <span className={cn('max-w-full truncate text-xs', current ? 'font-semibold text-base-foreground' : 'text-muted-foreground')}>{stage.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <Button variant="outline" size="sm" disabled={index >= stages.length - 1 && following} aria-label="Next stop" onClick={onNext}>
        <IconArrowRight />
      </Button>
      {following ? null : (
        <Button size="sm" onClick={onResume}>
          <IconPlayerPlay /> Resume tour
        </Button>
      )}
    </nav>
  );
}
