import { IconCircle, IconCircleCheck } from '@cognite/aura/icons';

export type MergeSide = 'left' | 'right';

export type MergeChoiceRowProps = {
  /** The field in conflict: "High limit". */
  label: string;
  /** Value on each side, already formatted. */
  left: string;
  right: string;
  /** Names of the two sides, for the accessible names: "Yours", "Theirs". */
  leftLabel: string;
  rightLabel: string;
  /** The side to keep. Leave out while the conflict is unresolved. */
  choice?: MergeSide;
  onChoose: (side: MergeSide) => void;
  /** Monospace values, for tags and config. */
  mono?: boolean;
};

/**
 * One conflicting field of a merge: the two candidate values as a pair of buttons, one of which
 * is kept. The kept side gets a checked circle and a stronger outline; the other is struck through,
 * so the outcome reads without colour. Stack rows under shared column headings.
 */
export function MergeChoiceRow({ label, left, right, leftLabel, rightLabel, choice, onChoose, mono = false }: MergeChoiceRowProps) {
  const sides = [
    { side: 'left', value: left, name: leftLabel },
    { side: 'right', value: right, name: rightLabel },
  ] as const;

  return (
    <div data-slot="merge-choice-row" data-choice={choice ?? 'unresolved'} role="group" aria-label={label} className="grid w-full min-w-0 grid-cols-[minmax(6rem,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] items-center gap-2">
      <span className="flex min-w-0 flex-col">
        <span className="text-sm text-base-foreground">{label}</span>
        {choice === undefined ? <span className="text-xs font-medium text-warning-foreground-strong">Choose a side</span> : null}
      </span>
      {sides.map(({ side, value, name }) => {
        const kept = choice === side;
        const dropped = choice !== undefined && !kept;
        return (
          <button
            key={side}
            type="button"
            aria-pressed={kept}
            aria-label={`Keep ${name}: ${value}`}
            className={`flex min-h-9 min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring ${
              kept ? 'border-emphasized font-medium text-base-foreground' : 'border-default'
            } ${dropped ? 'text-muted-foreground' : 'text-base-foreground'}`}
            onClick={() => onChoose(side)}
          >
            {kept ? (
              <IconCircleCheck aria-hidden="true" data-slot="merge-kept" className="size-4 shrink-0" />
            ) : (
              <IconCircle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={`min-w-0 break-words tabular-nums ${mono ? 'font-mono text-xs' : ''} ${dropped ? 'line-through' : ''}`}>{value}</span>
          </button>
        );
      })}
    </div>
  );
}
