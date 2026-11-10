import { MessageAction, MessageActions } from '@cognite/aura/components/message';
import {
  IconCheck,
  IconCopy,
  IconRefresh,
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

export type ResponseFeedback = 'up' | 'down';

type ResponseActionsProps = {
  /** Plain text of the response, placed on the clipboard by Copy. */
  text: string;
  /** Shows Regenerate when given. */
  onRegenerate?: () => void;
  /** Shows the thumbs when given. Called with `null` when a rating is taken back. */
  onFeedback?: (feedback: ResponseFeedback | null) => void;
  defaultFeedback?: ResponseFeedback | null;
  writeText?: (text: string) => Promise<void>;
  resetAfterMs?: number;
};

const writeToClipboard = (text: string) => navigator.clipboard.writeText(text);

/**
 * The action row under an assistant response: copy with in-place confirmation, regenerate, and a
 * thumbs rating that toggles. Only the actions with a handler are shown.
 */
export function ResponseActions({
  text,
  onRegenerate,
  onFeedback,
  defaultFeedback = null,
  writeText = writeToClipboard,
  resetAfterMs = 2000,
}: ResponseActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<ResponseFeedback | null>(defaultFeedback);

  useEffect(() => {
    if (!copied) return;
    const handle = window.setTimeout(() => setCopied(false), resetAfterMs);
    return () => window.clearTimeout(handle);
  }, [copied, resetAfterMs]);

  const copy = () => {
    void writeText(text).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  };

  const rate = (value: ResponseFeedback) => {
    const next = feedback === value ? null : value;
    setFeedback(next);
    onFeedback?.(next);
  };

  return (
    <MessageActions>
      <MessageAction size="icon-sm" tooltip={copied ? 'Copied' : 'Copy response'} onClick={copy}>
        {copied ? <IconCheck /> : <IconCopy />}
      </MessageAction>
      {onRegenerate ? (
        <MessageAction size="icon-sm" tooltip="Regenerate response" onClick={onRegenerate}>
          <IconRefresh />
        </MessageAction>
      ) : null}
      {onFeedback ? (
        <>
          <MessageAction
            size="icon-sm"
            tooltip="Good response"
            aria-pressed={feedback === 'up'}
            onClick={() => rate('up')}
          >
            {feedback === 'up' ? <IconThumbUpFilled /> : <IconThumbUp />}
          </MessageAction>
          <MessageAction
            size="icon-sm"
            tooltip="Poor response"
            aria-pressed={feedback === 'down'}
            onClick={() => rate('down')}
          >
            {feedback === 'down' ? <IconThumbDownFilled /> : <IconThumbDown />}
          </MessageAction>
        </>
      ) : null}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </MessageActions>
  );
}
