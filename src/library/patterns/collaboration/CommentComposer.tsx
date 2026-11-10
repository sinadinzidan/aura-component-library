import { Button } from '@cognite/aura/components/button';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconLock } from '@cognite/aura/icons';
import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { ShortcutHint } from '../../actions/ShortcutHint';
import type { ShortcutPlatform } from '../../actions/ShortcutHint';

type CommentComposerProps = {
  /** Accessible name of the field: "Comment on WO-104482". */
  label: string;
  /** Called with the trimmed text. The field clears afterwards. */
  onSubmit: (text: string) => void;
  placeholder?: string;
  submitLabel?: string;
  /** Text the field starts with, for a restored draft or an edit. */
  defaultValue?: string;
  /** Called on every change, so the owner can save a draft. */
  onValueChange?: (text: string) => void;
  /** Adds a Cancel button, for a reply or an edit that can be abandoned. */
  onCancel?: () => void;
  /** Controls under the field at the start: attach, mention. */
  tools?: ReactNode;
  /** A quiet status beside the tools, such as "Draft saved". */
  status?: ReactNode;
  /** Files attached to the comment being written, as `AttachmentChip`s. */
  attachments?: ReactNode;
  /** When set, the field is replaced by this sentence: "Only the assignee and planners can comment." */
  readOnlyReason?: string;
  rows?: number;
  /** Fixes the shortcut hint to one platform. Detected when left out. */
  platform?: ShortcutPlatform;
};

/**
 * The box a comment is written in: a textarea, a submit button that stays disabled until there is
 * text, and the shortcut that sends it (Ctrl or ⌘ + Enter). A thread the reader cannot write in
 * shows the reason in the same place instead of a disabled field.
 */
export function CommentComposer({
  label,
  onSubmit,
  placeholder = 'Write a comment',
  submitLabel = 'Comment',
  defaultValue = '',
  onValueChange,
  onCancel,
  tools,
  status,
  attachments,
  readOnlyReason,
  rows = 3,
  platform,
}: CommentComposerProps) {
  const [text, setText] = useState(defaultValue);
  const trimmed = text.trim();

  if (readOnlyReason !== undefined) {
    return (
      <p
        data-slot="comment-composer"
        data-read-only="true"
        className="flex w-full items-start gap-2 rounded-lg bg-muted-background p-3 text-sm text-medium-foreground"
      >
        <IconLock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        {readOnlyReason}
      </p>
    );
  }

  const change = (next: string) => {
    setText(next);
    onValueChange?.(next);
  };

  const submit = () => {
    if (trimmed === '') return;
    onSubmit(trimmed);
    change('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div data-slot="comment-composer" className="flex w-full min-w-0 flex-col gap-2">
      <Textarea
        aria-label={label}
        placeholder={placeholder}
        rows={rows}
        value={text}
        onChange={(event) => change(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {attachments ? <div className="flex min-w-0 flex-wrap gap-2">{attachments}</div> : null}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          {tools}
          {status}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShortcutHint keys={['mod', 'enter']} platform={platform} />
            <span aria-hidden="true">to send</span>
          </span>
          {onCancel ? (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button size="sm" disabled={trimmed === ''} onClick={submit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
