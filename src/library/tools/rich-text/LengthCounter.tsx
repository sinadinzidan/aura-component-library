import { countCharacters, countWords, describeLength, lengthStatus } from './counts';
import type { LengthLimits } from './counts';

type LengthCounterProps = LengthLimits & {
  /** The text being counted. */
  text: string;
  /** Leave out the word count where space is tight. */
  words?: boolean;
};

const STATUS_TEXT = {
  ok: 'text-muted-foreground',
  near: 'text-warning-foreground-strong',
  over: 'text-critical-foreground-strong',
} as const;

const STATUS_NOTE = { ok: '', near: 'Getting long', over: 'Too long' } as const;

/**
 * Word and character count for a text field with a soft and a hard limit. Past the soft limit
 * it says so in words as well as colour; past the hard limit it says by how much.
 */
export function LengthCounter({ text, soft, max, words = true }: LengthCounterProps) {
  const length = countCharacters(text);
  const wordCount = countWords(text);
  const status = lengthStatus(length, { soft, max });

  return (
    <span data-slot="length-counter" data-status={status} className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-muted-foreground">
      {words ? <span>{`${wordCount} ${wordCount === 1 ? 'word' : 'words'}`}</span> : null}
      {words ? <span aria-hidden="true">·</span> : null}
      <span className={STATUS_TEXT[status]}>
        {status !== 'ok' ? <span className="font-medium">{STATUS_NOTE[status]}: </span> : null}
        {describeLength(length, { max })}
      </span>
    </span>
  );
}
