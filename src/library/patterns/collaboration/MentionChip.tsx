type MentionChipProps = {
  /** The person's display name, without the "@". */
  name: string;
  /** The mention is of the person reading. It gets a stronger chip and says "(you)" to screen readers. */
  self?: boolean;
};

/**
 * A person mentioned inside comment text. It reads as part of the sentence, stays on one line
 * and marks a mention of the reader in weight and wording, not only in tint.
 */
export function MentionChip({ name, self = false }: MentionChipProps) {
  return (
    <span
      data-slot="mention"
      data-self={self || undefined}
      className={`rounded-md px-1 py-0.5 whitespace-nowrap ${
        self
          ? 'bg-secondary-background font-semibold text-secondary-foreground'
          : 'bg-muted-background font-medium text-base-foreground'
      }`}
    >
      @{name}
      {self ? <span className="sr-only"> (you)</span> : null}
    </span>
  );
}
