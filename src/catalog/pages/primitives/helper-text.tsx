import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@cognite/aura/components/input-group';
import { Label } from '@cognite/aura/components/label';
import { Loader } from '@cognite/aura/components/loader';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconAlertTriangle, IconCheck, IconCircleCheck, IconInfoCircle, IconLock } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { CharacterCountTextarea } from '../../../library/forms/CharacterCountTextarea';
import { FormField } from '../../../library/forms/FormField';
import { PasswordInput } from '../../../library/forms/PasswordInput';
import { definePage } from '../../types';

import source from './helper-text.tsx?raw';

const TAG_PATTERN = /^\d{2}-[A-Z]{2}-\d{4,5}[A-Z]?$/;

const TAKEN_PIPELINE_NAMES = ['opcua-nordkapp', 'sap-work-orders'];

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 12 characters', test: (value: string) => value.length >= 12 },
  { id: 'number', label: 'A number', test: (value: string) => /\d/.test(value) },
  { id: 'case', label: 'An uppercase and a lowercase letter', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
] as const;

function HelperTextDefault() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-default">Data set name</Label>
      <Input id="helper-text-default" aria-describedby="helper-text-default-hint" />
      <HelperText id="helper-text-default-hint">Shown in the data catalog.</HelperText>
    </div>
  );
}

function HelperTextError() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-error">Data set name</Label>
      <Input id="helper-text-error" aria-invalid aria-describedby="helper-text-error-message" />
      <HelperText id="helper-text-error-message" isError>
        Enter a name for the data set.
      </HelperText>
    </div>
  );
}

function HelperTextSuccess() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-success">Data set name</Label>
      <Input id="helper-text-success" defaultValue="Vibration surveys" aria-describedby="helper-text-success-message" />
      <HelperText id="helper-text-success-message" isSuccess>
        This name is available.
      </HelperText>
    </div>
  );
}

function HelperTextSuccessWithIcon() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-success-icon">Connection string</Label>
      <Input
        id="helper-text-success-icon"
        defaultValue="opc.tcp://nordkapp-gw-01:4840"
        aria-describedby="helper-text-success-icon-message"
      />
      <HelperText id="helper-text-success-icon-message" isSuccess icon={<IconCircleCheck />}>
        Connected. 1,240 nodes found.
      </HelperText>
    </div>
  );
}

function HelperTextWithIcon() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-with-icon">Retention (days)</Label>
      <Input
        id="helper-text-with-icon"
        type="number"
        inputMode="numeric"
        defaultValue={365}
        aria-describedby="helper-text-with-icon-hint"
      />
      <HelperText id="helper-text-with-icon-hint" icon={<IconInfoCircle />}>
        Applies to data points ingested from now on.
      </HelperText>
    </div>
  );
}

function HelperTextSmall() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-small">Tag filter</Label>
      <Input id="helper-text-small" defaultValue="23-*" aria-describedby="helper-text-small-hint" />
      <HelperText id="helper-text-small-hint" size="xs">
        Use * as a wildcard.
      </HelperText>
    </div>
  );
}

function HelperTextSmallError() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-small-error">Tag filter</Label>
      <Input
        id="helper-text-small-error"
        defaultValue="23-[*"
        aria-invalid
        aria-describedby="helper-text-small-error-message"
      />
      <HelperText id="helper-text-small-error-message" size="xs" isError>
        Remove the bracket. Only letters, numbers, hyphens and * are allowed.
      </HelperText>
    </div>
  );
}

function HelperTextFormatHint() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-format-hint">Functional location</Label>
      <Input id="helper-text-format-hint" aria-describedby="helper-text-format-hint-hint" />
      <HelperText id="helper-text-format-hint-hint">Area, type and sequence, for example 23-KA-9101.</HelperText>
    </div>
  );
}

function HelperTextConstraint() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-constraint">High alarm limit</Label>
      <InputGroup>
        <InputGroupInput
          id="helper-text-constraint"
          type="number"
          inputMode="decimal"
          defaultValue={52}
          aria-describedby="helper-text-constraint-hint"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>barg</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <HelperText id="helper-text-constraint-hint">Between 0 and 60 barg. The trip limit is 55 barg.</HelperText>
    </div>
  );
}

function HelperTextConsequence() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-consequence">External ID</Label>
      <Input
        id="helper-text-consequence"
        defaultValue="nk_vibration_surveys"
        aria-describedby="helper-text-consequence-hint"
      />
      <HelperText id="helper-text-consequence-hint" icon={<IconAlertTriangle />}>
        You cannot change the external ID after the data set is created.
      </HelperText>
    </div>
  );
}

function HelperTextWithLink() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-with-link">Cron schedule</Label>
      <Input id="helper-text-with-link" defaultValue="0 */6 * * *" aria-describedby="helper-text-with-link-hint" />
      <HelperText id="helper-text-with-link-hint">
        Runs every 6 hours.{' '}
        <a
          className="text-link-foreground underline-offset-2 hover:underline"
          href="https://docs.cognite.com/cdf/functions/"
          target="_blank"
          rel="noreferrer"
        >
          Schedule syntax
        </a>
      </HelperText>
    </div>
  );
}

function HelperTextLongWrapping() {
  return (
    <div className="flex w-full max-w-xs flex-col">
      <Label htmlFor="helper-text-long">Shelving period (hours)</Label>
      <Input
        id="helper-text-long"
        type="number"
        inputMode="numeric"
        defaultValue={8}
        aria-invalid
        aria-describedby="helper-text-long-message"
      />
      <HelperText id="helper-text-long-message" isError>
        Enter 12 hours or less. Alarms on criticality A equipment cannot be shelved for longer than one shift.
      </HelperText>
    </div>
  );
}

function HelperTextWithCount() {
  const [value, setValue] = useState('Scoring on the drive-end bearing pad.');

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-with-count">Summary</Label>
      <CharacterCountTextarea
        id="helper-text-with-count"
        value={value}
        onValueChange={setValue}
        maxLength={80}
        helper="Shown in the work order list."
      />
    </div>
  );
}

function HelperTextSwapsToError() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const error = !touched
    ? undefined
    : value === ''
      ? 'Enter a functional location.'
      : TAG_PATTERN.test(value)
        ? undefined
        : 'Use the format 23-KA-9101: area, type, then sequence.';

  return (
    <div className="w-full max-w-sm">
      <FormField label="Functional location" helper="For example 23-KA-9101." error={error}>
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

function HelperTextAsyncCheck() {
  const [value, setValue] = useState('opcua-nordkapp');
  const [checked, setChecked] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setChecked(value), 700);
    return () => window.clearTimeout(handle);
  }, [value]);

  const checking = checked !== value;
  const taken = TAKEN_PIPELINE_NAMES.includes(value.trim().toLowerCase());

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-async-check">Pipeline name</Label>
      <Input
        id="helper-text-async-check"
        value={value}
        aria-invalid={!checking && taken ? true : undefined}
        aria-describedby="helper-text-async-check-message"
        onChange={(event) => setValue(event.target.value)}
      />
      <div id="helper-text-async-check-message" aria-live="polite">
        {value.trim() === '' ? (
          <HelperText>Names are unique within a project.</HelperText>
        ) : checking ? (
          <HelperText icon={<Loader size={16} />}>Checking availability…</HelperText>
        ) : taken ? (
          <HelperText isError>A pipeline with this name exists. Choose another name.</HelperText>
        ) : (
          <HelperText isSuccess icon={<IconCheck />}>
            This name is available.
          </HelperText>
        )}
      </div>
    </div>
  );
}

function HelperTextDisabledReason() {
  return (
    <div className="group flex w-full max-w-sm flex-col" data-disabled="true">
      <Label htmlFor="helper-text-disabled-reason">Trip limit (barg)</Label>
      <Input
        id="helper-text-disabled-reason"
        defaultValue={55}
        disabled
        aria-describedby="helper-text-disabled-reason-hint"
      />
      <HelperText id="helper-text-disabled-reason-hint" icon={<IconLock />}>
        Trip limits are set in the safety system.
      </HelperText>
    </div>
  );
}

function HelperTextReadOnlySource() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-read-only-source">Criticality</Label>
      <Input
        id="helper-text-read-only-source"
        readOnly
        defaultValue="A"
        aria-describedby="helper-text-read-only-source-hint"
      />
      <HelperText id="helper-text-read-only-source-hint">Synced from the maintenance system every night.</HelperText>
    </div>
  );
}

function HelperTextSaved() {
  const [value, setValue] = useState('Gas compression overview');
  const [saved, setSaved] = useState(true);

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-saved">Dashboard title</Label>
      <Input
        id="helper-text-saved"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setSaved(false);
        }}
        onBlur={() => setSaved(true)}
      />
      <div aria-live="polite">
        {saved ? <HelperText icon={<IconCheck />}>Saved</HelperText> : <HelperText>Saves when you leave the field.</HelperText>}
      </div>
    </div>
  );
}

function HelperTextUnderTextarea() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-under-textarea">Reason for shelving</Label>
      <Textarea id="helper-text-under-textarea" aria-describedby="helper-text-under-textarea-hint" />
      <HelperText id="helper-text-under-textarea-hint">Recorded in the alarm history and shown to the next shift.</HelperText>
    </div>
  );
}

function HelperTextUnderCheckboxGroup() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label id="helper-text-under-checkbox-group">Notify these roles</Label>
      <CheckboxGroup
        aria-labelledby="helper-text-under-checkbox-group"
        aria-describedby="helper-text-under-checkbox-group-message"
      >
        <CheckboxItem>
          <CheckboxItemControl />
          <CheckboxItemLabel>Control room operator</CheckboxItemLabel>
        </CheckboxItem>
        <CheckboxItem>
          <CheckboxItemControl />
          <CheckboxItemLabel>Shift supervisor</CheckboxItemLabel>
        </CheckboxItem>
      </CheckboxGroup>
      <HelperText id="helper-text-under-checkbox-group-message" isError>
        Select at least one role to notify.
      </HelperText>
    </div>
  );
}

function HelperTextUnderFieldGroup() {
  return (
    <div
      className="flex w-full max-w-sm flex-col"
      role="group"
      aria-labelledby="helper-text-field-group-label"
      aria-describedby="helper-text-field-group-message"
    >
      <Label id="helper-text-field-group-label">Operating range (barg)</Label>
      <div className="flex items-center gap-2">
        <Input aria-label="Low limit" type="number" inputMode="decimal" defaultValue={52} aria-invalid />
        <span className="text-sm text-muted-foreground">to</span>
        <Input aria-label="High limit" type="number" inputMode="decimal" defaultValue={40} aria-invalid />
      </div>
      <HelperText id="helper-text-field-group-message" isError>
        Enter a low limit that is below the high limit.
      </HelperText>
    </div>
  );
}

function HelperTextPasswordRules() {
  const [password, setPassword] = useState('nordkapp2026');

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="helper-text-password-rules">New password</Label>
      <PasswordInput
        id="helper-text-password-rules"
        autoComplete="new-password"
        value={password}
        aria-describedby="helper-text-password-rules-list"
        onChange={(event) => setPassword(event.target.value)}
      />
      <ul id="helper-text-password-rules-list" className="flex flex-col">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.id}>
              <HelperText isSuccess={met} icon={met ? <IconCheck /> : <span className="block size-4" />}>
                {rule.label}
                <span className="sr-only">{met ? ' (met)' : ' (not met)'}</span>
              </HelperText>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HelperTextFormMix() {
  return (
    <div className="w-full max-w-md space-y-4 self-start">
      <h3 className="text-base font-semibold text-base-foreground">Alarm notification</h3>
      <div className="flex flex-col">
        <Label htmlFor="helper-text-form-mix-name">Rule name</Label>
        <Input id="helper-text-form-mix-name" defaultValue="Compressor trips, day shift" />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="helper-text-form-mix-email">Send to</Label>
        <Input
          id="helper-text-form-mix-email"
          type="email"
          defaultValue="controlroom@nordkapp"
          aria-invalid
          aria-describedby="helper-text-form-mix-email-message"
        />
        <HelperText id="helper-text-form-mix-email-message" isError>
          Enter a full email address, such as name@company.com.
        </HelperText>
      </div>
      <div className="flex flex-col">
        <Label htmlFor="helper-text-form-mix-delay">Repeat after (minutes)</Label>
        <Input
          id="helper-text-form-mix-delay"
          type="number"
          inputMode="numeric"
          defaultValue={30}
          aria-describedby="helper-text-form-mix-delay-hint"
        />
        <HelperText id="helper-text-form-mix-delay-hint">Leave empty to notify once per alarm.</HelperText>
      </div>
    </div>
  );
}

export default definePage({
  id: 'helper-text',
  title: 'Helper text',
  summary:
    'One or two short lines under a form control: a hint before the user types, or the result of validation after. It carries its own top padding and is linked to the control it describes.',
  docsSlug: 'helper-text',
  guidance: {
    use: [
      'Constraints, formats and consequences the user needs before they type.',
      'Inline errors that say what is wrong and how to fix it, on the affected field.',
      'Success only for checks the user could not make themselves, such as availability.',
      'Link it to the control with aria-describedby so it is announced.',
    ],
    avoid: [
      'Repeating the label, or stating the obvious ("Enter your name").',
      'Errors that only say "Invalid value" — name the rule and the fix.',
      'Hint and error stacked together; the error replaces the hint.',
      'Paragraphs. If it needs more than two lines, link to documentation.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Three tones, an optional icon and two sizes.',
      specimens: [
        {
          id: 'HelperTextDefault',
          title: 'Default',
          note: 'A neutral hint that is useful before and while the user types.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextDefault,
        },
        {
          id: 'HelperTextError',
          title: 'Error',
          note: 'Validation failed; the icon is added for you so colour is not the only signal.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextError,
        },
        {
          id: 'HelperTextSuccess',
          title: 'Success',
          note: 'A check passed that the user could not verify themselves.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextSuccess,
        },
        {
          id: 'HelperTextSuccessWithIcon',
          title: 'Success with icon',
          note: 'A result that should be noticed, such as a connection test that passed.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextSuccessWithIcon,
        },
        {
          id: 'HelperTextWithIcon',
          title: 'Hint with icon',
          note: 'A hint that is easy to miss and changes what the user would enter.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextWithIcon,
        },
        {
          id: 'HelperTextSmall',
          title: 'Extra small',
          note: 'Dense panels and filter popovers, where 14px helper text is too loud.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextSmall,
        },
        {
          id: 'HelperTextSmallError',
          title: 'Extra small error',
          note: 'The error tone in the same dense contexts; the icon scales down with it.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextSmallError,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What a good hint or error says.',
      specimens: [
        {
          id: 'HelperTextFormatHint',
          title: 'Format example',
          note: 'The value has a pattern; show one real example rather than describing the rule.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextFormatHint,
        },
        {
          id: 'HelperTextConstraint',
          title: 'Range constraint',
          note: 'A number with limits; state them with the unit so the error rarely appears.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextConstraint,
        },
        {
          id: 'HelperTextConsequence',
          title: 'Caution',
          note: 'A choice that cannot be undone later. Neutral tone with a caution icon; nothing is wrong yet.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextConsequence,
        },
        {
          id: 'HelperTextWithLink',
          title: 'With link',
          note: 'The syntax needs more than a line; echo what the value means and link to the rest.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextWithLink,
        },
        {
          id: 'HelperTextLongWrapping',
          title: 'Two-line error',
          note: 'The fix first, the reason second. The icon stays on the first line.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextLongWrapping,
        },
        {
          id: 'HelperTextWithCount',
          title: 'With character count',
          note: 'A length limit: hint on the left, live count on the right.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/CharacterCountTextarea.tsx'],
          Component: HelperTextWithCount,
        },
      ],
    },
    {
      id: 'states',
      title: 'Changing states',
      description: 'Helper text that responds to what the user does or to the state of the field.',
      specimens: [
        {
          id: 'HelperTextSwapsToError',
          title: 'Hint becomes error',
          note: 'The standard validation flow: the error replaces the hint on blur and clears on edit.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: HelperTextSwapsToError,
        },
        {
          id: 'HelperTextAsyncCheck',
          title: 'Checking, then result',
          note: 'A server-side check: progress, then success or an error with the next step. Edit to try.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextAsyncCheck,
        },
        {
          id: 'HelperTextSaved',
          title: 'Saved status',
          note: 'Fields that save on blur: a quiet persistent status instead of a toast per save.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextSaved,
        },
        {
          id: 'HelperTextDisabledReason',
          title: 'Reason for disabled',
          note: 'Never disable a field silently; say who or what controls it.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextDisabledReason,
        },
        {
          id: 'HelperTextReadOnlySource',
          title: 'Source of a read-only value',
          note: 'The value is owned elsewhere; say where so people know where to change it.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextReadOnlySource,
        },
      ],
    },
    {
      id: 'controls',
      title: 'Under other controls',
      description: 'The same component under textareas, groups and composed fields.',
      specimens: [
        {
          id: 'HelperTextUnderTextarea',
          title: 'Under a textarea',
          note: 'Says who will read the text, which shapes what people write.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextUnderTextarea,
        },
        {
          id: 'HelperTextUnderCheckboxGroup',
          title: 'Under a checkbox group',
          note: 'One message for the whole group, linked from the group rather than each option.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextUnderCheckboxGroup,
        },
        {
          id: 'HelperTextUnderFieldGroup',
          title: 'Under a pair of inputs',
          note: 'The rule is about how two values relate, so one message covers both.',
          origin: 'aura',
          align: 'stretch',
          Component: HelperTextUnderFieldGroup,
        },
        {
          id: 'HelperTextPasswordRules',
          title: 'Rule checklist',
          note: 'Several rules at once: each line turns to success as it is met. Type to try.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/PasswordInput.tsx'],
          Component: HelperTextPasswordRules,
        },
        {
          id: 'HelperTextFormMix',
          title: 'Across a form',
          note: 'Only fields that need it get helper text; spacing between fields stays 16px either way.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: HelperTextFormMix,
        },
      ],
    },
  ],
});
