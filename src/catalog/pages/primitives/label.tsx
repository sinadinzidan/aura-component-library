import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
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
import { Search } from '@cognite/aura/components/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Switch } from '@cognite/aura/components/switch';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconInfoCircle } from '@cognite/aura/icons';
import { useState } from 'react';

import { FormField } from '../../../library/forms/FormField';
import { definePage } from '../../types';

import source from './label.tsx?raw';

const WORK_ORDER_TYPES = ['Corrective', 'Preventive', 'Inspection', 'Modification'] as const;

const NOTIFY_ROLES = [
  { id: 'operator', label: 'Control room operator', defaultChecked: true },
  { id: 'supervisor', label: 'Shift supervisor', defaultChecked: true },
  { id: 'planner', label: 'Maintenance planner', defaultChecked: false },
] as const;

function LabelDefault() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-default">Asset name</Label>
      <Input id="label-default" />
    </div>
  );
}

function LabelRequired() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-required" required>
        Work order title
      </Label>
      <Input id="label-required" required />
    </div>
  );
}

function LabelOptional() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-optional">
        Cost centre <span className="ml-1 font-normal">(optional)</span>
      </Label>
      <Input id="label-optional" />
    </div>
  );
}

function LabelDisabled() {
  return (
    <div className="group flex w-full max-w-sm flex-col" data-disabled="true">
      <Label htmlFor="label-disabled">Project</Label>
      <Input id="label-disabled" defaultValue="nordkapp-production" disabled aria-describedby="label-disabled-hint" />
      <HelperText id="label-disabled-hint">Only project owners can rename a project.</HelperText>
    </div>
  );
}

function LabelWithHelper() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-with-helper">External ID</Label>
      <Input id="label-with-helper" aria-describedby="label-with-helper-hint" />
      <HelperText id="label-with-helper-hint">Lowercase letters, numbers and underscores.</HelperText>
    </div>
  );
}

function LabelWithUnit() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-with-unit">Discharge pressure setpoint (barg)</Label>
      <Input id="label-with-unit" type="number" inputMode="decimal" defaultValue={48.5} />
    </div>
  );
}

function LabelWithInfoTooltip() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <div className="flex items-start gap-1">
        <Label htmlFor="label-with-info-tooltip">Deadband</Label>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label="About deadband"
                className="rounded-sm text-muted-foreground outline-none hover:text-base-foreground focus-visible:shadow-focus-ring"
              >
                <IconInfoCircle className="size-4" aria-hidden />
              </button>
            }
          />
          <TooltipContent>How far the value must move back inside the limit before the alarm clears.</TooltipContent>
        </Tooltip>
      </div>
      <InputGroup>
        <InputGroupInput id="label-with-info-tooltip" type="number" inputMode="decimal" defaultValue={0.5} />
        <InputGroupAddon align="inline-end">
          <InputGroupText>barg</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function LabelWithAction() {
  const [value, setValue] = useState('15');

  return (
    <div className="flex w-full max-w-sm flex-col">
      <div className="flex items-start justify-between gap-4">
        <Label htmlFor="label-with-action">Sampling interval (s)</Label>
        <button
          type="button"
          className="rounded-sm text-sm text-link-foreground outline-none hover:underline focus-visible:shadow-focus-ring"
          onClick={() => setValue('10')}
        >
          Reset to default
        </button>
      </div>
      <Input
        id="label-with-action"
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </div>
  );
}

function LabelWithBadge() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <div className="flex items-start gap-2">
        <Label htmlFor="label-with-badge">Anomaly sensitivity</Label>
        <Badge variant="secondary">Beta</Badge>
      </div>
      <Input id="label-with-badge" type="number" inputMode="decimal" defaultValue={0.8} min={0} max={1} step={0.1} />
    </div>
  );
}

function LabelLongText() {
  return (
    <div className="flex w-full max-w-xs flex-col">
      <Label htmlFor="label-long-text">
        Minimum time between repeated notifications for the same alarm (minutes)
      </Label>
      <Input id="label-long-text" type="number" inputMode="numeric" defaultValue={30} />
    </div>
  );
}

function LabelForTextarea() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-for-textarea">Handover note</Label>
      <Textarea id="label-for-textarea" />
    </div>
  );
}

function LabelForSelect() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-for-select">Work order type</Label>
      <Select defaultValue="Corrective">
        <SelectTrigger id="label-for-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WORK_ORDER_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LabelForSwitch() {
  return <Switch label="Notify on trip" defaultChecked />;
}

function LabelForCheckboxGroup() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label id="label-for-checkbox-group">Notify these roles</Label>
      <CheckboxGroup aria-labelledby="label-for-checkbox-group">
        {NOTIFY_ROLES.map((role) => (
          <CheckboxItem key={role.id}>
            <CheckboxItemControl defaultChecked={role.defaultChecked} />
            <CheckboxItemLabel>{role.label}</CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
    </div>
  );
}

function LabelForFieldGroup() {
  return (
    <div className="flex w-full max-w-sm flex-col" role="group" aria-labelledby="label-for-field-group">
      <Label id="label-for-field-group">Operating range (barg)</Label>
      <div className="flex items-center gap-2">
        <Input aria-label="Low limit" type="number" inputMode="decimal" defaultValue={40} />
        <span className="text-sm text-muted-foreground">to</span>
        <Input aria-label="High limit" type="number" inputMode="decimal" defaultValue={52} />
      </div>
    </div>
  );
}

function LabelAccessibleNameOnly() {
  return (
    <div className="w-full max-w-sm">
      <Search aria-label="Search work orders" placeholder="Search work orders" />
    </div>
  );
}

function LabelWithError() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-with-error" required>
        Notification email
      </Label>
      <Input
        id="label-with-error"
        type="email"
        required
        defaultValue="ingrid.haugen@"
        aria-invalid
        aria-describedby="label-with-error-message"
      />
      <HelperText id="label-with-error-message" isError>
        Enter a full email address, such as name@company.com.
      </HelperText>
    </div>
  );
}

function LabelReadOnlyField() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="label-read-only-field">Functional location</Label>
      <Input id="label-read-only-field" readOnly defaultValue="23-KA-9101" />
    </div>
  );
}

function LabelStaticValue() {
  return (
    <dl className="grid w-full max-w-sm grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Functional location</dt>
        <dd className="text-sm text-base-foreground">23-KA-9101</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted-foreground">Criticality</dt>
        <dd className="text-sm text-base-foreground">A</dd>
      </div>
    </dl>
  );
}

function LabelStackedForm() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="flex flex-col">
        <Label htmlFor="label-stacked-title">Title</Label>
        <Input id="label-stacked-title" defaultValue="Inspect recompressor drive-end bearing" />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="label-stacked-asset">Asset</Label>
        <Input id="label-stacked-asset" defaultValue="23-KA-9103" />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="label-stacked-assignee">Assignee</Label>
        <Input id="label-stacked-assignee" defaultValue="Tomás Barros" />
      </div>
    </div>
  );
}

function LabelTwoColumnForm() {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4 self-start">
      <div className="col-span-2 flex flex-col">
        <Label htmlFor="label-two-column-title">Title</Label>
        <Input id="label-two-column-title" defaultValue="Vibration survey, 1st stage compressor" />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="label-two-column-hours">Estimated hours</Label>
        <Input id="label-two-column-hours" type="number" inputMode="numeric" defaultValue={4} />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="label-two-column-priority">Priority</Label>
        <Input id="label-two-column-priority" defaultValue="P2" />
      </div>
    </div>
  );
}

function LabelRequiredLegend() {
  return (
    <form
      className="flex w-full max-w-md flex-col gap-4 self-start"
      onSubmit={(event) => event.preventDefault()}
    >
      <div>
        <h3 className="text-base font-semibold text-base-foreground">Create work order</h3>
        <p className="text-sm text-muted-foreground">Required fields are marked with an asterisk.</p>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col">
          <Label htmlFor="label-legend-title" required>
            Title
          </Label>
          <Input id="label-legend-title" required />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="label-legend-asset" required>
            Asset
          </Label>
          <Input id="label-legend-asset" required placeholder="23-KA-9101" />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="label-legend-notes">Notes for the technician</Label>
          <Textarea id="label-legend-notes" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create work order</Button>
      </div>
    </form>
  );
}

function LabelFieldWrapper() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <FormField label="Pipeline name" required>
        {(control) => <Input {...control} />}
      </FormField>
      <FormField label="Description" optional helper="Shown in the pipeline list.">
        {(control) => <Textarea {...control} />}
      </FormField>
    </div>
  );
}

export default definePage({
  id: 'label',
  title: 'Label',
  summary:
    'The name of a form control, tied to it in code so that clicking the label focuses the control and assistive technology announces it. Not general-purpose text.',
  docsSlug: 'label',
  guidance: {
    use: [
      'One visible label for every input, select, textarea, slider and date picker.',
      'A label for each group of checkboxes, radios or related inputs.',
      'Short noun phrases in sentence case; put units in the label or as a suffix.',
      'One convention per form: mark the required fields, or mark the optional ones.',
    ],
    avoid: [
      'Placeholder text in place of a label — it disappears and is not reliably announced.',
      'A Label on text that names no control; use a heading or plain text.',
      'A gap utility between label and control; the label has 8px of bottom padding.',
      'Hiding a label to save space. If there is truly no room, give an aria-label.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The label and the markers it can carry.',
      specimens: [
        {
          id: 'LabelDefault',
          title: 'Default',
          note: 'Every field: the label sits above the control and is linked with htmlFor and id.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelDefault,
        },
        {
          id: 'LabelRequired',
          title: 'Required',
          note: 'A few fields are mandatory; set required on both the label and the control.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelRequired,
        },
        {
          id: 'LabelOptional',
          title: 'Optional',
          note: 'Most fields are mandatory, so only the exceptions are marked.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelOptional,
        },
        {
          id: 'LabelDisabled',
          title: 'Disabled',
          note: 'The control is disabled; the group wrapper dims the label with it.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelDisabled,
        },
        {
          id: 'LabelWithHelper',
          title: 'With helper text',
          note: 'Keep the label short and move the explanation under the control.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelWithHelper,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What can sit in or next to a label without making it harder to scan.',
      specimens: [
        {
          id: 'LabelWithUnit',
          title: 'With unit',
          note: 'The unit is fixed and there is no room, or no need, for a suffix in the field.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelWithUnit,
        },
        {
          id: 'LabelWithInfoTooltip',
          title: 'With info tooltip',
          note: 'A term some users will not know; the definition is one hover or focus away.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelWithInfoTooltip,
        },
        {
          id: 'LabelWithAction',
          title: 'With trailing action',
          note: 'A small action that belongs to this one field, such as reset to default.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelWithAction,
        },
        {
          id: 'LabelWithBadge',
          title: 'With badge',
          note: 'The setting itself has a status worth flagging, such as beta.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelWithBadge,
        },
        {
          id: 'LabelLongText',
          title: 'Long label',
          note: 'When a label cannot be shortened it wraps; it is never truncated.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelLongText,
        },
      ],
    },
    {
      id: 'controls',
      title: 'What it labels',
      description: 'The same label on other controls, on groups, and the cases with no visible label.',
      specimens: [
        {
          id: 'LabelForTextarea',
          title: 'Textarea',
          note: 'Multi-line fields are labelled exactly like inputs.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelForTextarea,
        },
        {
          id: 'LabelForSelect',
          title: 'Select',
          note: 'The label points at the select trigger, so clicking it focuses the trigger.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelForSelect,
        },
        {
          id: 'LabelForSwitch',
          title: 'Switch',
          note: 'A single on/off setting: the label sits beside the switch, via its label prop.',
          origin: 'aura',
          Component: LabelForSwitch,
        },
        {
          id: 'LabelForCheckboxGroup',
          title: 'Checkbox group',
          note: 'The label names the group; each option keeps its own inline label.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelForCheckboxGroup,
        },
        {
          id: 'LabelForFieldGroup',
          title: 'Group of inputs',
          note: 'Two inputs that answer one question share a label; each still has its own name.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelForFieldGroup,
        },
        {
          id: 'LabelAccessibleNameOnly',
          title: 'No visible label',
          note: 'Only where the control explains itself, such as a toolbar search: use aria-label.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelAccessibleNameOnly,
        },
      ],
    },
    {
      id: 'states',
      title: 'With field states',
      description: 'The label stays neutral; the control and helper text carry the state.',
      specimens: [
        {
          id: 'LabelWithError',
          title: 'Invalid field',
          note: 'The label does not turn red; the ring and the message carry the error.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelWithError,
        },
        {
          id: 'LabelReadOnlyField',
          title: 'Read-only field',
          note: 'A locked value inside an editable form keeps its label and its place.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelReadOnlyField,
        },
        {
          id: 'LabelStaticValue',
          title: 'Static value, no label',
          note: 'Nothing here is editable, so use a description list instead of labels.',
          origin: 'custom',
          align: 'stretch',
          Component: LabelStaticValue,
        },
      ],
    },
    {
      id: 'layouts',
      title: 'In forms',
      description: 'Labels across a whole form: stacking, columns and required conventions.',
      specimens: [
        {
          id: 'LabelStackedForm',
          title: 'Stacked fields',
          note: 'The default form layout: labels on top, 16px between fields.',
          origin: 'aura',
          align: 'stretch',
          Component: LabelStackedForm,
        },
        {
          id: 'LabelFieldWrapper',
          title: 'Field wrapper',
          note: 'Let one component wire ids, required and optional markers so no field forgets them.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: LabelFieldWrapper,
        },
        {
          id: 'LabelTwoColumnForm',
          title: 'Two columns',
          note: 'Short related fields share a row; labels stay above their own control.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: LabelTwoColumnForm,
        },
        {
          id: 'LabelRequiredLegend',
          title: 'Form with required legend',
          note: 'Say once what the asterisk means, then mark required fields consistently.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: LabelRequiredLegend,
        },
      ],
    },
  ],
});
