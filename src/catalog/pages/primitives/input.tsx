import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { IconPlus } from '@cognite/aura/icons';
import { useState } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { FormField } from '../../../library/forms/FormField';
import { InlineEditText } from '../../../library/forms/InlineEditText';
import { PasswordInput } from '../../../library/forms/PasswordInput';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { definePage } from '../../types';

import source from './input.tsx?raw';

const EXTERNAL_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

const TAKEN_DATA_SET_NAMES = ['compressor telemetry', 'work orders', 'alarm history'];

function InputDefault() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-default">Data set name</Label>
      <Input id="input-default" placeholder="Compressor telemetry" />
    </div>
  );
}

function InputFilled() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-filled">Asset name</Label>
      <Input id="input-filled" defaultValue="1st stage compressor" />
    </div>
  );
}

function InputWithHelper() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-with-helper">External ID</Label>
      <Input id="input-with-helper" defaultValue="nk_compressor_telemetry" aria-describedby="input-with-helper-hint" />
      <HelperText id="input-with-helper-hint">Used in API calls. You cannot change it later.</HelperText>
    </div>
  );
}

function InputRequired() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-required" required>
        Work order title
      </Label>
      <Input id="input-required" required placeholder="Inspect drive-end bearing" />
    </div>
  );
}

function InputOptional() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-optional">
        Cost centre <span className="ml-1 font-normal">(optional)</span>
      </Label>
      <Input id="input-optional" />
    </div>
  );
}

function InputEmail() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-email">Notification email</Label>
      <Input id="input-email" type="email" autoComplete="email" placeholder="name@company.com" />
    </div>
  );
}

function InputNumber() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-number">Estimated hours</Label>
      <Input id="input-number" type="number" inputMode="numeric" min={1} max={40} step={1} defaultValue={8} />
    </div>
  );
}

function InputUrl() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-url">Webhook URL</Label>
      <Input id="input-url" type="url" inputMode="url" placeholder="https://hooks.company.com/alarms" />
    </div>
  );
}

function InputPassword() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-password">Client secret</Label>
      <PasswordInput
        id="input-password"
        autoComplete="off"
        defaultValue="nk-extractor-7f3a91c2"
        showLabel="Show client secret"
        hideLabel="Hide client secret"
      />
    </div>
  );
}

function InputOneTimeCode() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-one-time-code">Verification code</Label>
      <Input
        id="input-one-time-code"
        className="max-w-32"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        aria-describedby="input-one-time-code-hint"
      />
      <HelperText id="input-one-time-code-hint">Enter the 6-digit code from your authenticator app.</HelperText>
    </div>
  );
}

function InputInvalid() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-invalid">External ID</Label>
      <Input id="input-invalid" defaultValue="NK Compressor" aria-invalid aria-describedby="input-invalid-error" />
      <HelperText id="input-invalid-error" isError>
        Use lowercase letters, numbers, hyphens and underscores only.
      </HelperText>
    </div>
  );
}

function InputValidateOnBlur() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const error = !touched
    ? undefined
    : value === ''
      ? 'Enter an external ID.'
      : EXTERNAL_ID_PATTERN.test(value)
        ? undefined
        : 'Use lowercase letters, numbers, hyphens and underscores only.';

  return (
    <div className="w-full max-w-sm">
      <FormField label="External ID" required helper="For example nk_gas_export." error={error}>
        {(control) => (
          <Input
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

function InputSuccess() {
  const [value, setValue] = useState('Vibration surveys');
  const name = value.trim().toLowerCase();
  const taken = TAKEN_DATA_SET_NAMES.includes(name);

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-success">Data set name</Label>
      <Input
        id="input-success"
        value={value}
        aria-invalid={taken ? true : undefined}
        aria-describedby="input-success-message"
        onChange={(event) => setValue(event.target.value)}
      />
      <div id="input-success-message" aria-live="polite">
        {name === '' ? (
          <HelperText>Names are unique within a project.</HelperText>
        ) : taken ? (
          <HelperText isError>A data set with this name exists. Choose another name.</HelperText>
        ) : (
          <HelperText isSuccess>This name is available.</HelperText>
        )}
      </div>
    </div>
  );
}

function InputDisabled() {
  return (
    <div className="group flex w-full max-w-sm flex-col" data-disabled="true">
      <Label htmlFor="input-disabled">Project</Label>
      <Input id="input-disabled" defaultValue="nordkapp-production" disabled aria-describedby="input-disabled-hint" />
      <HelperText id="input-disabled-hint">Only project owners can rename a project.</HelperText>
    </div>
  );
}

function InputReadOnly() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-read-only">Functional location</Label>
      <Input id="input-read-only" defaultValue="23-KA-9101" readOnly aria-describedby="input-read-only-hint" />
      <HelperText id="input-read-only-hint">Synced from the maintenance system.</HelperText>
    </div>
  );
}

function InputCharacterLimit() {
  const [value, setValue] = useState('Compressor overview');
  const limit = 40;

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-character-limit">Dashboard title</Label>
      <Input
        id="input-character-limit"
        value={value}
        maxLength={limit}
        aria-describedby="input-character-limit-count"
        onChange={(event) => setValue(event.target.value)}
      />
      <div id="input-character-limit-count" className="flex justify-between gap-4">
        <HelperText>Shown in the dashboard list.</HelperText>
        <HelperText>
          <span className="tabular-nums">
            {value.length}/{limit}
          </span>
        </HelperText>
      </div>
    </div>
  );
}

function InputSizedToContent() {
  return (
    <div className="flex w-full max-w-sm items-start gap-4">
      <div className="flex flex-col">
        <Label htmlFor="input-sized-area">Area</Label>
        <Input id="input-sized-area" className="w-16" defaultValue="23" maxLength={2} inputMode="numeric" />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="input-sized-type">Type</Label>
        <Input id="input-sized-type" className="w-16" defaultValue="KA" maxLength={2} />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="input-sized-sequence">Sequence</Label>
        <Input id="input-sized-sequence" className="w-24" defaultValue="9101" maxLength={5} inputMode="numeric" />
      </div>
    </div>
  );
}

function InputPairedRow() {
  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-4">
      <div className="flex flex-col">
        <Label htmlFor="input-paired-low">Low limit</Label>
        <Input id="input-paired-low" type="number" inputMode="decimal" defaultValue={40} />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="input-paired-high">High limit</Label>
        <Input id="input-paired-high" type="number" inputMode="decimal" defaultValue={52} />
      </div>
    </div>
  );
}

function InputLongValue() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-long-value">Time series external ID</Label>
      <Input id="input-long-value" defaultValue="nordkapp:gas-compression:23-KA-9101:23-PT-92531:discharge-pressure" />
    </div>
  );
}

function InputFieldWrapper() {
  const [name, setName] = useState('');

  return (
    <div className="w-full max-w-sm">
      <FormField label="Pipeline name" required helper="Shown in the pipeline list and in run notifications.">
        {(control) => <Input {...control} value={name} onChange={(event) => setName(event.target.value)} />}
      </FormField>
    </div>
  );
}

function InputWithUnit() {
  const [limit, setLimit] = useState<number | null>(52);
  const outOfRange = limit !== null && (limit < 0 || limit > 60);

  return (
    <div className="w-full max-w-sm">
      <FormField
        label="High alarm limit"
        helper="Between 0 and 60 barg."
        error={outOfRange ? 'Enter a value between 0 and 60 barg.' : undefined}
      >
        {(control) => (
          <UnitNumberInput {...control} unit="barg" value={limit} min={0} max={60} step={0.5} onValueChange={setLimit} />
        )}
      </FormField>
    </div>
  );
}

function InputWithButton() {
  const [email, setEmail] = useState('');

  return (
    <form className="flex w-full max-w-sm flex-col" onSubmit={(event) => event.preventDefault()}>
      <Label htmlFor="input-with-button">Invite by email</Label>
      <div className="flex gap-2">
        <Input
          id="input-with-button"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          <IconPlus /> Invite
        </Button>
      </div>
    </form>
  );
}

function InputCopyReadOnly() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-copy-read-only">Extractor ID</Label>
      <div className="flex gap-2">
        <Input id="input-copy-read-only" defaultValue="extractor-opcua-nordkapp-01" readOnly />
        <CopyButton variant="secondary" text="extractor-opcua-nordkapp-01" label="Copy" />
      </div>
    </div>
  );
}

function InputInlineEdit() {
  const [name, setName] = useState('Gas compression overview');

  return (
    <div className="w-full max-w-sm">
      <InlineEditText value={name} label="dashboard name" onSave={setName} />
    </div>
  );
}

function InputFormCard() {
  return (
    <form
      className="flex w-full max-w-md flex-col gap-4 self-start"
      onSubmit={(event) => event.preventDefault()}
    >
      <h3 className="text-base font-semibold text-base-foreground">Create data set</h3>
      <div className="space-y-4">
        <div className="flex flex-col">
          <Label htmlFor="input-form-name" required>
            Name
          </Label>
          <Input id="input-form-name" required defaultValue="Vibration surveys" />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="input-form-external-id" required>
            External ID
          </Label>
          <Input
            id="input-form-external-id"
            required
            defaultValue="nk_vibration_surveys"
            aria-describedby="input-form-external-id-hint"
          />
          <HelperText id="input-form-external-id-hint">Used in API calls. You cannot change it later.</HelperText>
        </div>
        <div className="flex flex-col">
          <Label htmlFor="input-form-owner">
            Owner <span className="ml-1 font-normal">(optional)</span>
          </Label>
          <Input id="input-form-owner" type="email" placeholder="name@company.com" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create data set</Button>
      </div>
    </form>
  );
}

export default definePage({
  id: 'input',
  title: 'Input',
  summary:
    'A single-line text field for short values such as names, identifiers and limits. Every input has a label, and anything the user must know sits in helper text below it.',
  docsSlug: 'input',
  guidance: {
    use: [
      'Short free text that no structured picker covers: names, external IDs, emails, limits.',
      'A visible label on every field, with the type that matches the data.',
      'Helper text for constraints, and an inline error that says how to fix the value.',
      'Read-only instead of disabled when people still need to read or copy the value.',
    ],
    avoid: [
      'Placeholder text as the label, or as a stand-in for a real value.',
      'Validating on every keystroke — check on blur and keep what was typed.',
      'Free text where the answer is one of a known set; use a select or combobox.',
      'A gap between label, input and helper text — they carry their own spacing.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The field in its plain forms: empty, filled, hinted, required and optional.',
      specimens: [
        {
          id: 'InputDefault',
          title: 'Default',
          note: 'Any short free-text value; the placeholder is an example, never the label.',
          origin: 'aura',
          align: 'stretch',
          Component: InputDefault,
        },
        {
          id: 'InputFilled',
          title: 'Filled',
          note: 'Editing an existing record, where the field opens with its current value.',
          origin: 'aura',
          align: 'stretch',
          Component: InputFilled,
        },
        {
          id: 'InputWithHelper',
          title: 'With helper text',
          note: 'The user needs a constraint or consequence before they type.',
          origin: 'aura',
          align: 'stretch',
          Component: InputWithHelper,
        },
        {
          id: 'InputRequired',
          title: 'Required',
          note: 'Forms where only some fields are mandatory; mark those with the asterisk.',
          origin: 'aura',
          align: 'stretch',
          Component: InputRequired,
        },
        {
          id: 'InputOptional',
          title: 'Optional',
          note: 'Forms where most fields are mandatory; mark the few that are not.',
          origin: 'aura',
          align: 'stretch',
          Component: InputOptional,
        },
      ],
    },
    {
      id: 'types',
      title: 'Types',
      description: 'Set the type and input mode so browsers offer the right keyboard, autofill and checks.',
      specimens: [
        {
          id: 'InputEmail',
          title: 'Email',
          note: 'Email addresses: gets the email keyboard, autofill and format validation.',
          origin: 'aura',
          align: 'stretch',
          Component: InputEmail,
        },
        {
          id: 'InputNumber',
          title: 'Number',
          note: 'Whole quantities with a range, such as hours or counts.',
          origin: 'aura',
          align: 'stretch',
          Component: InputNumber,
        },
        {
          id: 'InputUrl',
          title: 'URL',
          note: 'Web addresses such as webhooks and endpoints.',
          origin: 'aura',
          align: 'stretch',
          Component: InputUrl,
        },
        {
          id: 'InputPassword',
          title: 'Password with show and hide',
          note: 'Secrets and passwords, where people need to check what they typed or pasted.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/PasswordInput.tsx'],
          Component: InputPassword,
        },
        {
          id: 'InputOneTimeCode',
          title: 'One-time code',
          note: 'Fixed-length numeric codes; the field is as wide as the code.',
          origin: 'aura',
          align: 'stretch',
          Component: InputOneTimeCode,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'How the field reports a problem, confirms a value, and shows that it cannot be edited.',
      specimens: [
        {
          id: 'InputInvalid',
          title: 'Invalid',
          note: 'The value fails a rule; the message says how to fix it, not only that it is wrong.',
          origin: 'aura',
          align: 'stretch',
          Component: InputInvalid,
        },
        {
          id: 'InputValidateOnBlur',
          title: 'Validated on blur',
          note: 'The default validation timing: check when the user leaves the field. Type and tab away to try.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: InputValidateOnBlur,
        },
        {
          id: 'InputSuccess',
          title: 'Confirmed value',
          note: 'A check the user cannot do themselves, such as whether a name is free.',
          origin: 'aura',
          align: 'stretch',
          Component: InputSuccess,
        },
        {
          id: 'InputDisabled',
          title: 'Disabled with reason',
          note: 'The field does not apply or the user lacks access; the helper says why.',
          origin: 'aura',
          align: 'stretch',
          Component: InputDisabled,
        },
        {
          id: 'InputReadOnly',
          title: 'Read-only',
          note: 'The value is owned elsewhere but people still need to read, select and copy it.',
          origin: 'aura',
          align: 'stretch',
          Component: InputReadOnly,
        },
        {
          id: 'InputCharacterLimit',
          title: 'Character limit',
          note: 'A hard length limit the user should see coming.',
          origin: 'aura',
          align: 'stretch',
          Component: InputCharacterLimit,
        },
      ],
    },
    {
      id: 'width-and-layout',
      title: 'Width and layout',
      description: 'Width hints at the expected answer; related fields share a row.',
      specimens: [
        {
          id: 'InputSizedToContent',
          title: 'Sized to the answer',
          note: 'Short, fixed-length values: a narrow field tells people how much to type.',
          origin: 'aura',
          align: 'stretch',
          Component: InputSizedToContent,
        },
        {
          id: 'InputPairedRow',
          title: 'Paired fields',
          note: 'Two values read together, such as a low and a high limit.',
          origin: 'aura',
          align: 'stretch',
          Component: InputPairedRow,
        },
        {
          id: 'InputLongValue',
          title: 'Long value',
          note: 'Values longer than the field scroll on one line; switch to a textarea if they should wrap.',
          origin: 'aura',
          align: 'stretch',
          Component: InputLongValue,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Inputs wired into fields, paired with actions, and assembled into a form.',
      specimens: [
        {
          id: 'InputFieldWrapper',
          title: 'Field wrapper',
          note: 'The default way to build a field: one component wires label, hint, error and ids.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: InputFieldWrapper,
        },
        {
          id: 'InputWithUnit',
          title: 'Number with unit',
          note: 'Engineering values with a unit and a range, nudged with a stepper or typed.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/UnitNumberInput.tsx', 'forms/FormField.tsx'],
          Component: InputWithUnit,
        },
        {
          id: 'InputWithButton',
          title: 'With submit button',
          note: 'A one-field form such as invite or add, submitted with Enter or the button.',
          origin: 'aura',
          align: 'stretch',
          Component: InputWithButton,
        },
        {
          id: 'InputCopyReadOnly',
          title: 'Read-only with copy',
          note: 'Generated IDs and keys that people paste somewhere else.',
          origin: 'custom',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: InputCopyReadOnly,
        },
        {
          id: 'InputInlineEdit',
          title: 'Inline edit',
          note: 'Renaming a single value in place, without opening a form. Enter saves, Escape cancels.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/InlineEditText.tsx'],
          Component: InputInlineEdit,
        },
        {
          id: 'InputFormCard',
          title: 'Short form',
          note: 'Three or four fields in a dialog or card: 16px between fields, actions bottom right.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: InputFormCard,
        },
      ],
    },
  ],
});
