import { Button } from '@cognite/aura/components/button';
import { Progress } from '@cognite/aura/components/progress';
import { IconCheck } from '@cognite/aura/icons';
import { useId } from 'react';

export type SetupChecklistItem = {
  id: string;
  label: string;
  description?: string;
  done: boolean;
  /** Verb + object for the button shown while this is the next open item: "Connect source". */
  actionLabel?: string;
};

type SetupChecklistProps = {
  title: string;
  items: readonly SetupChecklistItem[];
  /** Called with the item id when its action button is pressed. */
  onAction: (id: string) => void;
  /** Builds the count line. */
  formatCount?: (done: number, total: number) => string;
  /** Shown instead of the count once everything is done. */
  completeText?: string;
};

const defaultFormatCount = (done: number, total: number) => `${done} of ${total} complete`;

/**
 * Setup progress as a checklist: a count with a progress bar, then the tasks in order. Finished
 * tasks are ticked and quiet; only the next open task carries an action, so there is always one
 * obvious thing to do.
 */
export function SetupChecklist({
  title,
  items,
  onAction,
  formatCount = defaultFormatCount,
  completeText = 'Setup complete',
}: SetupChecklistProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const doneCount = items.filter((item) => item.done).length;
  const nextItem = items.find((item) => !item.done);
  const countText = nextItem ? formatCount(doneCount, items.length) : completeText;

  return (
    <section aria-labelledby={titleId} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <h3 id={titleId} className="truncate text-base font-semibold text-base-foreground">
            {title}
          </h3>
          <output aria-live="polite" className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {countText}
          </output>
        </div>
        <Progress
          value={doneCount}
          max={Math.max(items.length, 1)}
          size="sm"
          aria-label={title}
          aria-valuetext={countText}
        />
      </div>
      <ol className="flex list-none flex-col gap-3">
        {items.map((item, index) => {
          const isNext = item.id === nextItem?.id;
          return (
            <li
              key={item.id}
              data-state={item.done ? 'done' : isNext ? 'next' : 'open'}
              className="flex items-start gap-3"
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${
                  item.done
                    ? 'bg-medium-background text-base-foreground'
                    : isNext
                      ? 'bg-primary-background text-primary-foreground'
                      : 'border border-emphasized text-muted-foreground'
                }`}
              >
                {item.done ? <IconCheck className="size-3.5" /> : index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={item.done ? 'text-sm text-muted-foreground' : 'text-sm font-medium text-base-foreground'}
                >
                  <span className="sr-only">{item.done ? 'Done: ' : 'To do: '}</span>
                  {item.label}
                </span>
                {item.description && !item.done ? (
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                ) : null}
              </div>
              {isNext && item.actionLabel ? (
                <Button size="sm" onClick={() => onAction(item.id)}>
                  {item.actionLabel}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
