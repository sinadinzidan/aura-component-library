import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@cognite/aura/components/input-group';
import { Label } from '@cognite/aura/components/label';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowUp, IconCheck, IconPaperclip, IconPencil } from '@cognite/aura/icons';
import { useState } from 'react';

import { CharacterCountTextarea } from '../../../library/forms/CharacterCountTextarea';
import { FormField } from '../../../library/forms/FormField';
import { definePage } from '../../types';

import source from './textarea.tsx?raw';

const HANDOVER_NOTE =
  'Recompressor 23-KA-9103 tripped on high vibration at 13:46. Bearing inspection is under way under WO-104482. Keep the 1st stage compressor below 9,900 rpm until the survey is done.';

const WORK_LOG = [
  '06:10 Isolated 23-KA-9103 and applied lock-out.',
  '06:45 Removed drive-end bearing cover.',
  '07:30 Found scoring on the bearing pad, photos attached.',
  '08:15 Ordered replacement pad set from Stord terminal.',
  '09:00 Cleaned housing and checked oil supply line.',
  '10:20 Waiting for parts, expected on the 14:00 flight.',
].join('\n');

const FINDING_TEMPLATES = [
  { id: 'no-fault', label: 'No fault found', text: 'Inspected and tested. No fault found.' },
  { id: 'replaced', label: 'Part replaced', text: 'Replaced the worn part and tested under load.' },
  { id: 'follow-up', label: 'Needs follow-up', text: 'Temporary fix in place. Follow-up work order needed.' },
] as const;

function TextareaDefault() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-default">Description</Label>
      <Textarea id="textarea-default" placeholder="What does this data set contain?" />
    </div>
  );
}

function TextareaFilled() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-filled">Handover note</Label>
      <Textarea id="textarea-filled" defaultValue={HANDOVER_NOTE} />
    </div>
  );
}

function TextareaWithHelper() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-with-helper">Work description</Label>
      <Textarea id="textarea-with-helper" aria-describedby="textarea-with-helper-hint" />
      <HelperText id="textarea-with-helper-hint">Describe the fault and what you have already checked.</HelperText>
    </div>
  );
}

function TextareaRequired() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-required" required>
        Reason for shelving
      </Label>
      <Textarea id="textarea-required" required />
    </div>
  );
}

function TextareaOptional() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-optional">
        Notes for the technician <span className="ml-1 font-normal">(optional)</span>
      </Label>
      <Textarea id="textarea-optional" />
    </div>
  );
}

function TextareaAutoGrow() {
  const [value, setValue] = useState('Inspected the drive-end bearing.\nFound scoring on the pad.\nReplacement ordered.');

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-auto-grow">Findings</Label>
      <Textarea id="textarea-auto-grow" value={value} onChange={(event) => setValue(event.target.value)} />
      <HelperText>Press Enter to add lines; the field grows with them.</HelperText>
    </div>
  );
}

function TextareaTallStart() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-tall-start">Incident report</Label>
      <Textarea id="textarea-tall-start" className="min-h-40" placeholder="What happened, in order?" />
    </div>
  );
}

function TextareaMaxHeight() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-max-height">Work log</Label>
      <Textarea id="textarea-max-height" className="max-h-28 overflow-y-auto" defaultValue={WORK_LOG} />
    </div>
  );
}

function TextareaSingleRowStart() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-single-row-start">Quick note</Label>
      <Textarea id="textarea-single-row-start" className="min-h-9" rows={1} placeholder="Add a note" />
    </div>
  );
}

function TextareaInvalid() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-invalid" required>
        Reason for shelving
      </Label>
      <Textarea id="textarea-invalid" required defaultValue="Noise" aria-invalid aria-describedby="textarea-invalid-error" />
      <HelperText id="textarea-invalid-error" isError>
        Explain the reason in at least 20 characters so the next shift can follow it.
      </HelperText>
    </div>
  );
}

function TextareaValidateOnBlur() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const length = value.trim().length;

  const error = !touched
    ? undefined
    : length === 0
      ? 'Enter a reason for shelving the alarm.'
      : length < 20
        ? `Add ${20 - length} more characters so the next shift can follow it.`
        : undefined;

  return (
    <div className="w-full max-w-sm">
      <FormField label="Reason for shelving" required helper="At least 20 characters." error={error}>
        {(control) => (
          <Textarea
            {...control}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setTouched(false);
            }}
            onBlur={() => setTouched(true)}
          />
        )}
      </FormField>
    </div>
  );
}

function TextareaDisabled() {
  return (
    <div className="group flex w-full max-w-sm flex-col" data-disabled="true">
      <Label htmlFor="textarea-disabled">Close-out comment</Label>
      <Textarea id="textarea-disabled" disabled aria-describedby="textarea-disabled-hint" />
      <HelperText id="textarea-disabled-hint">Available once the work order is marked as done.</HelperText>
    </div>
  );
}

function TextareaReadOnly() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-read-only">Handover note from Liv Wold</Label>
      <Textarea id="textarea-read-only" readOnly defaultValue={HANDOVER_NOTE} />
    </div>
  );
}

function TextareaCharacterCount() {
  const [value, setValue] = useState('Scoring on the drive-end bearing pad. Replacement ordered.');

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-character-count">Summary</Label>
      <CharacterCountTextarea
        id="textarea-character-count"
        value={value}
        onValueChange={setValue}
        maxLength={140}
        helper="Shown in the work order list."
      />
    </div>
  );
}

function TextareaOverLimit() {
  const [value, setValue] = useState(
    'Scoring on the drive-end bearing pad, most likely from oil starvation during the last start.'
  );

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-over-limit">Summary</Label>
      <CharacterCountTextarea
        id="textarea-over-limit"
        value={value}
        onValueChange={setValue}
        maxLength={80}
        helper="Shown in the work order list."
      />
    </div>
  );
}

function TextareaAutoSaved() {
  const [value, setValue] = useState('Checked oil supply line, no blockage found.');
  const [saved, setSaved] = useState(true);

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-auto-saved">Technician notes</Label>
      <Textarea
        id="textarea-auto-saved"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setSaved(false);
        }}
        onBlur={() => setSaved(true)}
      />
      <div aria-live="polite">
        {saved ? (
          <HelperText icon={<IconCheck />}>Saved</HelperText>
        ) : (
          <HelperText>Unsaved changes. Saves when you leave the field.</HelperText>
        )}
      </div>
    </div>
  );
}

function TextareaCommentActions() {
  const [comment, setComment] = useState('');

  return (
    <form className="flex w-full max-w-sm flex-col gap-2" onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-col">
        <Label htmlFor="textarea-comment-actions">Comment</Label>
        <Textarea
          id="textarea-comment-actions"
          placeholder="Share an update on WO-104482"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setComment('')}>
          Discard
        </Button>
        <Button type="submit" size="sm">
          Add comment
        </Button>
      </div>
    </form>
  );
}

function TextareaComposer() {
  const [message, setMessage] = useState('');

  return (
    <form className="w-full max-w-sm" onSubmit={(event) => event.preventDefault()}>
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message to the control room"
          placeholder="Message the control room"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <InputGroupAddon align="block-end">
          <Tooltip>
            <TooltipTrigger
              render={
                <InputGroupButton size="icon-sm" aria-label="Attach file">
                  <IconPaperclip />
                </InputGroupButton>
              }
            />
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  className="ml-auto"
                  aria-label="Send message"
                  disabled={message.trim() === ''}
                >
                  <IconArrowUp />
                </InputGroupButton>
              }
            />
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function TextareaQuickInserts() {
  const [value, setValue] = useState('');

  const insert = (text: string) => setValue((current) => (current === '' ? text : `${current}\n${text}`));

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="textarea-quick-inserts">Findings</Label>
      <Textarea id="textarea-quick-inserts" value={value} onChange={(event) => setValue(event.target.value)} />
      <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Insert a standard finding">
        {FINDING_TEMPLATES.map((template) => (
          <Button key={template.id} variant="outline" size="sm" onClick={() => insert(template.text)}>
            {template.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function TextareaInlineEdit() {
  const [description, setDescription] = useState(
    'Raw vibration and temperature readings from the gas compression train, sampled every second.'
  );
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Description</span>
          <Button variant="ghost" size="sm" onClick={() => setDraft(description)}>
            <IconPencil /> Edit
          </Button>
        </div>
        <p className="text-sm text-base-foreground">{description}</p>
      </div>
    );
  }

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setDescription(draft.trim() === '' ? description : draft.trim());
        setDraft(null);
      }}
    >
      <div className="flex flex-col">
        <Label htmlFor="textarea-inline-edit">Description</Label>
        <Textarea id="textarea-inline-edit" autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Save description
        </Button>
      </div>
    </form>
  );
}

function TextareaHandoverForm() {
  const [note, setNote] = useState(HANDOVER_NOTE);

  return (
    <form
      className="flex w-full max-w-md flex-col gap-4 self-start"
      onSubmit={(event) => event.preventDefault()}
    >
      <h3 className="text-base font-semibold text-base-foreground">Shift handover</h3>
      <div className="space-y-4">
        <div className="flex flex-col">
          <Label htmlFor="textarea-handover-title" required>
            Title
          </Label>
          <Input id="textarea-handover-title" required defaultValue="Day shift, gas compression" />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="textarea-handover-note" required>
            What the next shift needs to know
          </Label>
          <CharacterCountTextarea
            id="textarea-handover-note"
            required
            value={note}
            onValueChange={setNote}
            maxLength={400}
            helper="Open alarms and work orders are attached automatically."
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost">
          Save draft
        </Button>
        <Button type="submit">Hand over shift</Button>
      </div>
    </form>
  );
}

function TextareaConfirmWithReason() {
  const [reason, setReason] = useState('');
  const ready = reason.trim().length >= 20;

  return (
    <form
      className="flex w-full max-w-md flex-col gap-4 self-start"
      onSubmit={(event) => event.preventDefault()}
    >
      <div>
        <h3 className="text-base font-semibold text-base-foreground">Shelve alarm for 8 hours</h3>
        <p className="text-sm text-muted-foreground">Bearing temperature signal lost · 40-TT-40015</p>
      </div>
      <FormField label="Reason" required helper="At least 20 characters. Recorded in the alarm history.">
        {(control) => <Textarea {...control} value={reason} onChange={(event) => setReason(event.target.value)} />}
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={!ready}>
          Shelve alarm
        </Button>
      </div>
    </form>
  );
}

export default definePage({
  id: 'textarea',
  title: 'Textarea',
  summary:
    'A multi-line text field for notes, descriptions, comments and reasons. It starts a few lines tall and grows with what is typed.',
  docsSlug: 'textarea',
  guidance: {
    use: [
      'Free text that can run past one line: handover notes, findings, comments, reasons.',
      'A visible label, and a short example as placeholder when the format is not obvious.',
      'A character count in the helper text when there is a length limit.',
      'A maximum height in dialogs and side panels so long text scrolls instead of pushing the layout.',
    ],
    avoid: [
      'A textarea for one short value — use an input.',
      'Pre-filled default text that people might submit without reading.',
      'A small fixed height when long text is expected.',
      'Messages to an AI assistant — use Prompt input.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The field in its plain forms.',
      specimens: [
        {
          id: 'TextareaDefault',
          title: 'Default',
          note: 'Any multi-line free text; the placeholder prompts, the label names.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaDefault,
        },
        {
          id: 'TextareaFilled',
          title: 'Filled',
          note: 'Editing existing text; the field opens tall enough to show all of it.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaFilled,
        },
        {
          id: 'TextareaWithHelper',
          title: 'With helper text',
          note: 'People need to know what a good answer contains before they write it.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaWithHelper,
        },
        {
          id: 'TextareaRequired',
          title: 'Required',
          note: 'An explanation the action cannot go ahead without.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaRequired,
        },
        {
          id: 'TextareaOptional',
          title: 'Optional',
          note: 'Extra context that is welcome but never blocks the form.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaOptional,
        },
      ],
    },
    {
      id: 'sizing',
      title: 'Sizing',
      description: 'The field grows with its content. Set where it starts and where it stops.',
      specimens: [
        {
          id: 'TextareaAutoGrow',
          title: 'Grows with content',
          note: 'The default behaviour: no scrollbar until you set a maximum height. Type to try.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaAutoGrow,
        },
        {
          id: 'TextareaTallStart',
          title: 'Tall start',
          note: 'Long answers are expected; a tall empty field invites them.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaTallStart,
        },
        {
          id: 'TextareaMaxHeight',
          title: 'Maximum height',
          note: 'Dialogs and side panels, where long text must scroll instead of pushing the layout.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaMaxHeight,
        },
        {
          id: 'TextareaSingleRowStart',
          title: 'Single-row start',
          note: 'Usually one line, sometimes more: starts at input height and grows when needed.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaSingleRowStart,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Validation, limits, saving, and fields that cannot be edited.',
      specimens: [
        {
          id: 'TextareaInvalid',
          title: 'Invalid',
          note: 'The text fails a rule; the message says what is missing and why it matters.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaInvalid,
        },
        {
          id: 'TextareaValidateOnBlur',
          title: 'Validated on blur',
          note: 'Required text with a minimum length, checked when the user leaves the field.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: TextareaValidateOnBlur,
        },
        {
          id: 'TextareaCharacterCount',
          title: 'Character count',
          note: 'There is a length limit and people should see how much room is left.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/CharacterCountTextarea.tsx'],
          Component: TextareaCharacterCount,
        },
        {
          id: 'TextareaOverLimit',
          title: 'Over the limit',
          note: 'Pasted text is kept, not cut; the error says how much to remove.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/CharacterCountTextarea.tsx'],
          Component: TextareaOverLimit,
        },
        {
          id: 'TextareaAutoSaved',
          title: 'Auto-saved',
          note: 'Notes that save without a button: a quiet, persistent status instead of a toast.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaAutoSaved,
        },
        {
          id: 'TextareaDisabled',
          title: 'Disabled with reason',
          note: 'The field will apply later; the helper says what unlocks it.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaDisabled,
        },
        {
          id: 'TextareaReadOnly',
          title: 'Read-only',
          note: 'Text written by someone else that can be read and copied but not changed.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaReadOnly,
        },
      ],
    },
    {
      id: 'with-actions',
      title: 'With actions',
      description: 'A textarea plus the buttons that send, save or fill it.',
      specimens: [
        {
          id: 'TextareaCommentActions',
          title: 'Comment with actions',
          note: 'A comment in a thread: submit and discard sit under the field, right-aligned.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaCommentActions,
        },
        {
          id: 'TextareaComposer',
          title: 'Composer',
          note: 'Chat-like messaging to people, with attach and send inside the frame.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaComposer,
        },
        {
          id: 'TextareaQuickInserts',
          title: 'Quick inserts',
          note: 'Most answers are one of a few standard phrases that people then adjust.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaQuickInserts,
        },
        {
          id: 'TextareaInlineEdit',
          title: 'Inline edit',
          note: 'A description on a detail page that is read far more often than it is edited.',
          origin: 'aura',
          align: 'stretch',
          Component: TextareaInlineEdit,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'In forms',
      description: 'Textareas alongside other fields, in the context where they are used.',
      specimens: [
        {
          id: 'TextareaHandoverForm',
          title: 'Handover form',
          note: 'A short form whose main field is long text with a limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/CharacterCountTextarea.tsx'],
          Component: TextareaHandoverForm,
        },
        {
          id: 'TextareaConfirmWithReason',
          title: 'Confirmation with reason',
          note: 'An action that must be justified: the commit stays disabled, with the rule in view, until it is.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: TextareaConfirmWithReason,
        },
      ],
    },
  ],
});
