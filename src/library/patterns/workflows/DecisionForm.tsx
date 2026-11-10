import { Button } from '@cognite/aura/components/button';
import { Textarea } from '@cognite/aura/components/textarea';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { FormField } from '../../forms/FormField';

export type Decision = 'approve' | 'reject' | 'request-changes';

export type DecisionFormProps = {
  decision: Decision;
  /** Called with the trimmed comment. Never called for a rejection without a reason. */
  onSubmit: (comment: string) => void;
  onCancel?: () => void;
  /** Overrides the submit label, for example "Approve start-up". */
  submitLabel?: string;
  /** Hint under the field. */
  helper?: string;
};

const COPY: Record<Decision, { label: string; submit: string; required: boolean; missing: string }> = {
  approve: { label: 'Comment', submit: 'Approve', required: false, missing: '' },
  reject: {
    label: 'Reason for rejecting',
    submit: 'Reject request',
    required: true,
    missing: 'Give a reason, so the requester knows what to change.',
  },
  'request-changes': {
    label: 'What needs to change',
    submit: 'Request changes',
    required: true,
    missing: 'Say what needs to change before you can approve.',
  },
};

/**
 * The comment step of a decision. Approving takes an optional comment; rejecting or sending a
 * request back requires a reason, and the form says so instead of submitting an empty one.
 * Place it on the base surface, under the request it answers.
 */
export function DecisionForm({ decision, onSubmit, onCancel, submitLabel, helper }: DecisionFormProps) {
  const [comment, setComment] = useState('');
  const [attempted, setAttempted] = useState(false);
  const copy = COPY[decision];
  const missing = copy.required && comment.trim() === '';

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    if (!missing) onSubmit(comment.trim());
  };

  return (
    <form data-slot="decision-form" data-decision={decision} noValidate className="flex w-full flex-col gap-3" onSubmit={submit}>
      <FormField label={copy.label} required={copy.required} optional={!copy.required} helper={helper} error={attempted && missing ? copy.missing : undefined}>
        {(control) => <Textarea {...control} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />}
      </FormField>
      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant={decision === 'reject' ? 'destructive' : 'default'}>
          {submitLabel ?? copy.submit}
        </Button>
      </div>
    </form>
  );
}
