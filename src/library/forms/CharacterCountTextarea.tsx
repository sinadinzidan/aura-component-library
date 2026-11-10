import { HelperText } from '@cognite/aura/components/helper-text';
import { Textarea } from '@cognite/aura/components/textarea';
import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';

type CharacterCountTextareaProps = Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange' | 'maxLength'> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Soft limit: typing past it is allowed, flagged, and reported as an error. */
  maxLength: number;
  /** Hint shown to the left of the count while the value is within the limit. */
  helper?: ReactNode;
};

/**
 * A textarea with a live character count. The limit is soft: text past it is kept, the field
 * turns invalid and the helper says how much to remove, so pasted text is never cut silently.
 */
export function CharacterCountTextarea({
  value,
  onValueChange,
  maxLength,
  helper,
  id,
  ...textareaProps
}: CharacterCountTextareaProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const messageId = `${controlId}-count`;
  const over = value.length - maxLength;
  const isOver = over > 0;

  return (
    <>
      <Textarea
        {...textareaProps}
        id={controlId}
        value={value}
        aria-invalid={isOver ? true : textareaProps['aria-invalid']}
        aria-describedby={messageId}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <div id={messageId} className="flex items-start justify-between gap-4">
        {isOver ? (
          <HelperText isError>
            Shorten the text by {over} {over === 1 ? 'character' : 'characters'}.
          </HelperText>
        ) : (
          <HelperText>{helper}</HelperText>
        )}
        <span
          className={`shrink-0 pt-2 text-sm leading-4.5 tabular-nums ${
            isOver ? 'text-critical-foreground-strong' : 'text-muted-foreground'
          }`}
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </>
  );
}
