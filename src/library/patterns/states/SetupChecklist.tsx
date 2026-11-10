import { Button } from '@cognite/aura/components/button';
import { Progress } from '@cognite/aura/components/progress';
import { IconCircle, IconCircleCheckFilled } from '@cognite/aura/icons';
import { useId } from 'react';
import type { ReactNode } from 'react';

export type SetupStep = {
  id: string;
  /** Verb + object: "Connect a data source". */
  title: string;
  /** Why the step matters or what it takes. Shown for the current step only. */
  description?: string;
  done: boolean;
  /** Label of the button that starts the step, such as "Connect source". */
  actionLabel?: string;
  /** A short neutral note beside the title, such as "About 5 min" or "Optional". */
  hint?: string;
};

type SetupChecklistProps = {
  title: string;
  description?: string;
  steps: readonly SetupStep[];
  /** Called with the step id when its action button is used. */
  onStepAction: (id: string) => void;
  /** Shown instead of the step list once every step is done. */
  complete?: ReactNode;
  /** Control in the header corner, usually a "Dismiss" button. */
  headerAction?: ReactNode;
};

/**
 * A setup checklist: a title, how far along the user is, and the steps in order. Only the first
 * unfinished step is open, with its explanation and the one button that starts it, so the list
 * always answers "what do I do next?". Completion is derived from the steps passed in.
 */
export function SetupChecklist({ title, description, steps, onStepAction, complete, headerAction }: SetupChecklistProps) {
  const titleId = useId();
  const doneCount = steps.filter((step) => step.done).length;
  const current = steps.find((step) => !step.done);
  const progressText = `${doneCount} of ${steps.length} done`;

  return (
    <section aria-labelledby={titleId} className="flex w-full flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 id={titleId} className="text-base font-medium text-base-foreground">
            {title}
          </h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {headerAction}
      </header>
      <div className="flex items-center gap-3">
        <Progress
          value={doneCount}
          max={Math.max(steps.length, 1)}
          size="sm"
          aria-label={`${title} progress`}
          aria-valuetext={progressText}
          className="flex-1"
        />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{progressText}</span>
      </div>
      {current === undefined && complete ? (
        complete
      ) : (
        <ol className="flex flex-col">
          {steps.map((step) => {
            const isCurrent = step.id === current?.id;
            return (
              <li
                key={step.id}
                aria-current={isCurrent ? 'step' : undefined}
                className="flex items-start gap-3 border-t border-default py-3 first:border-t-0"
              >
                <span className="flex h-5 shrink-0 items-center">
                  {step.done ? (
                    <IconCircleCheckFilled aria-hidden className="size-5 text-success-foreground-strong" />
                  ) : (
                    <IconCircle aria-hidden className="size-5 text-muted-foreground" />
                  )}
                  <span className="sr-only">{step.done ? 'Done:' : 'To do:'}</span>
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      className={`min-w-0 text-sm ${step.done ? 'text-muted-foreground' : isCurrent ? 'font-medium text-base-foreground' : 'text-medium-foreground'}`}
                    >
                      {step.title}
                    </span>
                    {step.hint && !step.done ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{step.hint}</span>
                    ) : null}
                  </div>
                  {isCurrent && step.description ? (
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  ) : null}
                  {isCurrent && step.actionLabel ? (
                    <div>
                      <Button size="sm" onClick={() => onStepAction(step.id)}>
                        {step.actionLabel}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
