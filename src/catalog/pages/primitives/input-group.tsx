import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { HelperText } from '@cognite/aura/components/helper-text';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupStepper,
  InputGroupText,
  InputGroupTextarea,
} from '@cognite/aura/components/input-group';
import { Kbd } from '@cognite/aura/components/kbd';
import { Label } from '@cognite/aura/components/label';
import { Loader } from '@cognite/aura/components/loader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowUp,
  IconChevronDown,
  IconCircleCheck,
  IconLock,
  IconMail,
  IconPaperclip,
  IconRefresh,
  IconTag,
  IconUser,
} from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { FormField } from '../../../library/forms/FormField';
import { PasswordInput } from '../../../library/forms/PasswordInput';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { definePage } from '../../types';

import source from './input-group.tsx?raw';

const PRESSURE_UNITS = ['barg', 'psig', 'kPa'] as const;

const TAKEN_EXTERNAL_IDS = ['nk_compressor_telemetry', 'nk_work_orders'];

const API_KEYS = ['nk-live-4f7a-91c2-b8d0', 'nk-live-a03e-5d17-c6f4', 'nk-live-72bb-e940-1a3d'] as const;

function InputGroupLeadingIcon() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-leading-icon">Assignee email</Label>
      <InputGroup>
        <InputGroupAddon>
          <IconMail />
        </InputGroupAddon>
        <InputGroupInput id="input-group-leading-icon" type="email" placeholder="name@company.com" />
      </InputGroup>
    </div>
  );
}

function InputGroupTrailingIcon() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-trailing-icon">Owner</Label>
      <InputGroup>
        <InputGroupInput id="input-group-trailing-icon" defaultValue="Ingrid Haugen" />
        <InputGroupAddon align="inline-end">
          <IconUser />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupPrefixText() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-prefix-text">Webhook URL</Label>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id="input-group-prefix-text" placeholder="hooks.company.com/alarms" />
      </InputGroup>
    </div>
  );
}

function InputGroupSuffixText() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-suffix-text">Discharge pressure setpoint</Label>
      <InputGroup>
        <InputGroupInput id="input-group-suffix-text" type="number" inputMode="decimal" defaultValue={48.5} />
        <InputGroupAddon align="inline-end">
          <InputGroupText>barg</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupBothEnds() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-both-ends">Cluster URL</Label>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id="input-group-both-ends" defaultValue="nordkapp" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.cognitedata.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupBlockStart() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-block-start">Tag</Label>
      <InputGroup>
        <InputGroupAddon align="block-start">
          <IconTag />
          <InputGroupText>Functional location</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id="input-group-block-start" defaultValue="23-KA-9101" />
      </InputGroup>
    </div>
  );
}

function InputGroupBlockEnd() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-block-end">Alarm message</Label>
      <InputGroup>
        <InputGroupInput id="input-group-block-end" defaultValue="Discharge temperature high" />
        <InputGroupAddon align="block-end">
          <InputGroupText>Shown to operators in the alarm list</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupTextButton() {
  const [index, setIndex] = useState(0);

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-text-button">API key</Label>
      <InputGroup>
        <InputGroupInput id="input-group-text-button" readOnly value={API_KEYS[index]} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={() => setIndex((current) => (current + 1) % API_KEYS.length)}>
            <IconRefresh /> Regenerate
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupIconButton() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-icon-button">Work order note</Label>
      <InputGroup>
        <InputGroupInput id="input-group-icon-button" placeholder="Add a note" />
        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger
              render={
                <InputGroupButton size="icon-xs" aria-label="Attach file">
                  <IconPaperclip />
                </InputGroupButton>
              }
            />
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupPrimaryButton() {
  return (
    <form className="flex w-full max-w-sm flex-col" onSubmit={(event) => event.preventDefault()}>
      <Label htmlFor="input-group-primary-button">Invite by email</Label>
      <InputGroup>
        <InputGroupInput id="input-group-primary-button" type="email" placeholder="name@company.com" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" variant="default" size="sm">
            Send invite
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function InputGroupWithStepper() {
  const [hours, setHours] = useState(8);

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-with-stepper">Estimated hours</Label>
      <InputGroup className="max-w-32">
        <InputGroupInput
          id="input-group-with-stepper"
          type="number"
          inputMode="numeric"
          min={1}
          max={40}
          value={hours}
          onChange={(event) => setHours(Number.isNaN(event.target.valueAsNumber) ? 1 : event.target.valueAsNumber)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupStepper
            incrementLabel="Add an hour"
            decrementLabel="Remove an hour"
            incrementDisabled={hours >= 40}
            decrementDisabled={hours <= 1}
            onIncrement={() => setHours((current) => Math.min(40, current + 1))}
            onDecrement={() => setHours((current) => Math.max(1, current - 1))}
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupWithShortcut() {
  return (
    <InputGroup className="max-w-sm">
      <InputGroupInput aria-label="Go to tag" placeholder="Go to tag" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘</Kbd>
        <Kbd>G</Kbd>
      </InputGroupAddon>
    </InputGroup>
  );
}

function InputGroupUnitMenu() {
  const [unit, setUnit] = useState<(typeof PRESSURE_UNITS)[number]>('barg');

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-unit-menu">Trip limit</Label>
      <InputGroup>
        <InputGroupInput id="input-group-unit-menu" type="number" inputMode="decimal" defaultValue={55} />
        <InputGroupAddon align="inline-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <InputGroupButton aria-label={`Unit: ${unit}`}>
                  {unit} <IconChevronDown />
                </InputGroupButton>
              }
            />
            <DropdownMenuContent align="end">
              {PRESSURE_UNITS.map((option) => (
                <DropdownMenuItem key={option} onClick={() => setUnit(option)}>
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupInvalid() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-invalid">High alarm limit</Label>
      <InputGroup>
        <InputGroupInput
          id="input-group-invalid"
          type="number"
          inputMode="decimal"
          defaultValue={72}
          aria-invalid
          aria-describedby="input-group-invalid-error"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>barg</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <HelperText id="input-group-invalid-error" isError>
        Enter a value between 0 and 60 barg.
      </HelperText>
    </div>
  );
}

function InputGroupDisabled() {
  return (
    <div className="group flex w-full max-w-sm flex-col" data-disabled="true">
      <Label htmlFor="input-group-disabled">Trip limit</Label>
      <InputGroup>
        <InputGroupAddon>
          <IconLock />
        </InputGroupAddon>
        <InputGroupInput id="input-group-disabled" defaultValue={55} disabled aria-describedby="input-group-disabled-hint" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>barg</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <HelperText id="input-group-disabled-hint">Trip limits are set in the safety system.</HelperText>
    </div>
  );
}

function InputGroupReadOnly() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-read-only">Time series external ID</Label>
      <InputGroup>
        <InputGroupInput id="input-group-read-only" readOnly defaultValue="23-PT-92531" />
        <InputGroupAddon align="inline-end">
          <CopyButton variant="ghost" size="icon-sm" text="23-PT-92531" label="Copy external ID" iconOnly />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupChecking() {
  const [value, setValue] = useState('nk_vibration_surveys');
  const [checked, setChecked] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setChecked(value), 700);
    return () => window.clearTimeout(handle);
  }, [value]);

  const checking = checked !== value;
  const taken = TAKEN_EXTERNAL_IDS.includes(value);
  const status = value === '' ? 'empty' : checking ? 'checking' : taken ? 'taken' : 'free';

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-checking">External ID</Label>
      <InputGroup>
        <InputGroupInput
          id="input-group-checking"
          value={value}
          aria-invalid={status === 'taken' ? true : undefined}
          aria-describedby="input-group-checking-message"
          onChange={(event) => setValue(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          {status === 'checking' ? <Loader size={16} /> : null}
          {status === 'free' ? (
            <span className="text-success-foreground-strong">
              <IconCircleCheck className="size-4" aria-hidden />
            </span>
          ) : null}
        </InputGroupAddon>
      </InputGroup>
      <div id="input-group-checking-message" aria-live="polite">
        {status === 'taken' ? (
          <HelperText isError>This ID is in use. Enter a different one.</HelperText>
        ) : (
          <HelperText isSuccess={status === 'free'}>
            {status === 'checking' ? 'Checking availability…' : null}
            {status === 'free' ? 'This ID is available.' : null}
            {status === 'empty' ? 'Lowercase letters, numbers and underscores.' : null}
          </HelperText>
        )}
      </div>
    </div>
  );
}

function InputGroupTextareaPlain() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor="input-group-textarea-plain">Handover note</Label>
      <InputGroup>
        <InputGroupTextarea
          id="input-group-textarea-plain"
          placeholder="What should the next shift know?"
          defaultValue="Recompressor tripped on high vibration at 13:46. Bearing inspection is under way."
        />
        <InputGroupAddon align="block-end">
          <InputGroupText>Visible to everyone on Nordkapp</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function InputGroupCommentBox() {
  const [comment, setComment] = useState('');

  return (
    <form className="w-full max-w-sm" onSubmit={(event) => event.preventDefault()}>
      <InputGroup>
        <InputGroupTextarea
          aria-label="Comment on WO-104482"
          placeholder="Comment on WO-104482"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
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
                  aria-label="Send comment"
                  disabled={comment.trim() === ''}
                >
                  <IconArrowUp />
                </InputGroupButton>
              }
            />
            <TooltipContent>Send comment</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function InputGroupTextareaHeader() {
  return (
    <div className="w-full max-w-sm">
      <InputGroup>
        <InputGroupAddon align="block-start">
          <InputGroupText>Reply to Aisha Khan</InputGroupText>
        </InputGroupAddon>
        <InputGroupTextarea aria-label="Reply to Aisha Khan" placeholder="Write a reply" />
      </InputGroup>
    </div>
  );
}

function InputGroupUnitNumber() {
  const [limit, setLimit] = useState<number | null>(7.1);

  return (
    <div className="w-full max-w-sm">
      <FormField label="Vibration alarm limit" helper="Between 0 and 15 mm/s. The trip limit is 11 mm/s.">
        {(control) => (
          <UnitNumberInput {...control} unit="mm/s" value={limit} min={0} max={15} step={0.1} onValueChange={setLimit} />
        )}
      </FormField>
    </div>
  );
}

function InputGroupSecret() {
  return (
    <div className="w-full max-w-sm">
      <FormField label="Client secret" helper="Stored encrypted. You can replace it but not read it back.">
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="off"
            defaultValue="nk-extractor-7f3a91c2"
            showLabel="Show client secret"
            hideLabel="Hide client secret"
          />
        )}
      </FormField>
    </div>
  );
}

function InputGroupRange() {
  return (
    <div className="flex w-full max-w-sm flex-col" role="group" aria-labelledby="input-group-range-label">
      <span id="input-group-range-label" className="pb-2 text-sm font-medium text-muted-foreground">
        Operating range
      </span>
      <div className="flex items-center gap-2">
        <InputGroup>
          <InputGroupInput aria-label="Low limit" type="number" inputMode="decimal" defaultValue={40} />
          <InputGroupAddon align="inline-end">
            <InputGroupText>barg</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <span className="text-sm text-muted-foreground">to</span>
        <InputGroup>
          <InputGroupInput aria-label="High limit" type="number" inputMode="decimal" defaultValue={52} />
          <InputGroupAddon align="inline-end">
            <InputGroupText>barg</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <HelperText>Alarms are raised outside this range.</HelperText>
    </div>
  );
}

function InputGroupLimitsForm() {
  return (
    <form
      className="flex w-full max-w-md flex-col gap-4 self-start rounded-xl bg-card-background p-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <div>
        <h3 className="text-base font-semibold text-base-foreground">Alarm limits</h3>
        <p className="text-sm text-muted-foreground">23-PT-92531 · Discharge pressure</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <Label htmlFor="input-group-limits-low">Low</Label>
          <InputGroup>
            <InputGroupInput id="input-group-limits-low" type="number" inputMode="decimal" defaultValue={40} />
            <InputGroupAddon align="inline-end">
              <InputGroupText>barg</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex flex-col">
          <Label htmlFor="input-group-limits-high">High</Label>
          <InputGroup>
            <InputGroupInput id="input-group-limits-high" type="number" inputMode="decimal" defaultValue={52} />
            <InputGroupAddon align="inline-end">
              <InputGroupText>barg</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex flex-col">
          <Label htmlFor="input-group-limits-trip">High high</Label>
          <InputGroup>
            <InputGroupInput id="input-group-limits-trip" type="number" inputMode="decimal" defaultValue={55} />
            <InputGroupAddon align="inline-end">
              <InputGroupText>barg</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex flex-col">
          <Label htmlFor="input-group-limits-delay">Delay</Label>
          <InputGroup>
            <InputGroupInput id="input-group-limits-delay" type="number" inputMode="numeric" defaultValue={10} />
            <InputGroupAddon align="inline-end">
              <InputGroupText>s</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Save limits</Button>
      </div>
    </form>
  );
}

export default definePage({
  id: 'input-group',
  title: 'Input group',
  summary:
    'An input or textarea with addons inside its frame: icons, prefixes, units, buttons, steppers and shortcuts. The group is one control with one focus ring.',
  docsSlug: 'input-group',
  guidance: {
    use: [
      'A unit, prefix or icon that belongs to the value and should not be typed.',
      'One small action that works on the field itself: copy, attach, regenerate, send.',
      'A stepper for numbers people nudge more often than they type.',
      'Block addons for a footer or header row on a textarea.',
    ],
    avoid: [
      'More than two addons on one side — the value needs the room.',
      'Actions unrelated to the field; put those next to it as normal buttons.',
      'An addon as the only label. The field still needs a Label or an aria-label.',
      'A search icon and clear button built by hand — use Search.',
    ],
  },
  source,
  sections: [
    {
      id: 'addons',
      title: 'Addons',
      description: 'Where an addon can sit: either end of the line, or a row above or below it.',
      specimens: [
        {
          id: 'InputGroupLeadingIcon',
          title: 'Leading icon',
          note: 'An icon that says what kind of value goes in, at a glance.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupLeadingIcon,
        },
        {
          id: 'InputGroupTrailingIcon',
          title: 'Trailing icon',
          note: 'A quiet marker for what the value is, when the start of the line should stay clean.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupTrailingIcon,
        },
        {
          id: 'InputGroupPrefixText',
          title: 'Text prefix',
          note: 'A fixed start, such as a protocol, that the user should not type.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupPrefixText,
        },
        {
          id: 'InputGroupSuffixText',
          title: 'Unit suffix',
          note: 'Any measured value; the unit stays visible while the number is edited.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupSuffixText,
        },
        {
          id: 'InputGroupBothEnds',
          title: 'Prefix and suffix',
          note: 'The editable part of a longer string, such as the cluster name inside a URL.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupBothEnds,
        },
        {
          id: 'InputGroupBlockStart',
          title: 'Row above',
          note: 'Context that is too long for an inline prefix sits on its own row.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupBlockStart,
        },
        {
          id: 'InputGroupBlockEnd',
          title: 'Row below',
          note: 'A footer inside the frame for a note that belongs to this field only.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupBlockEnd,
        },
      ],
    },
    {
      id: 'actions',
      title: 'Buttons and controls',
      description: 'Actions inside the frame work on the field itself.',
      specimens: [
        {
          id: 'InputGroupTextButton',
          title: 'Text button',
          note: 'One action on the value whose name needs spelling out. Click to try.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupTextButton,
        },
        {
          id: 'InputGroupIconButton',
          title: 'Icon button',
          note: 'A familiar action such as attach or copy, with a tooltip and an accessible name.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupIconButton,
        },
        {
          id: 'InputGroupPrimaryButton',
          title: 'Primary button',
          note: 'A one-field form where the field and its submit read as one unit.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupPrimaryButton,
        },
        {
          id: 'InputGroupWithStepper',
          title: 'Stepper',
          note: 'Small whole numbers that are adjusted by one or two steps.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupWithStepper,
        },
        {
          id: 'InputGroupWithShortcut',
          title: 'Keyboard shortcut',
          note: 'A field people jump to from the keyboard; the hint teaches the shortcut.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupWithShortcut,
        },
        {
          id: 'InputGroupUnitMenu',
          title: 'Unit menu',
          note: 'The unit is a choice, and switching it belongs with the number.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupUnitMenu,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'The whole group changes state together; addons follow the control.',
      specimens: [
        {
          id: 'InputGroupInvalid',
          title: 'Invalid',
          note: 'The value is out of range; the error repeats the unit so the fix is unambiguous.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupInvalid,
        },
        {
          id: 'InputGroupDisabled',
          title: 'Disabled with reason',
          note: 'The value is controlled elsewhere and cannot be changed here.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupDisabled,
        },
        {
          id: 'InputGroupReadOnly',
          title: 'Read-only with copy',
          note: 'A generated value people copy; the action stays live while the text is locked.',
          origin: 'custom',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: InputGroupReadOnly,
        },
        {
          id: 'InputGroupChecking',
          title: 'Checking, then confirmed',
          note: 'A server-side check runs after typing pauses; the trailing slot shows progress and result.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupChecking,
        },
      ],
    },
    {
      id: 'textarea',
      title: 'With a textarea',
      description: 'The same frame around multi-line text, with addon rows above and below.',
      specimens: [
        {
          id: 'InputGroupTextareaPlain',
          title: 'Textarea with footer',
          note: 'Multi-line text with a note about audience or visibility inside the frame.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupTextareaPlain,
        },
        {
          id: 'InputGroupCommentBox',
          title: 'Comment box',
          note: 'A composer: attach on the left, send on the right, disabled until there is text.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupCommentBox,
        },
        {
          id: 'InputGroupTextareaHeader',
          title: 'Textarea with header',
          note: 'A reply or quote context that must stay attached to the text being written.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupTextareaHeader,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Groups wired into fields and forms.',
      specimens: [
        {
          id: 'InputGroupUnitNumber',
          title: 'Number with unit and stepper',
          note: 'The default for engineering values: unit, range-aware stepper and typed entry in one.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/UnitNumberInput.tsx', 'forms/FormField.tsx'],
          Component: InputGroupUnitNumber,
        },
        {
          id: 'InputGroupSecret',
          title: 'Secret with show and hide',
          note: 'Passwords and client secrets that people paste and want to verify.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/PasswordInput.tsx', 'forms/FormField.tsx'],
          Component: InputGroupSecret,
        },
        {
          id: 'InputGroupRange',
          title: 'Range',
          note: 'A low and a high value that share one label, one unit and one hint.',
          origin: 'aura',
          align: 'stretch',
          Component: InputGroupRange,
        },
        {
          id: 'InputGroupLimitsForm',
          title: 'Limits form',
          note: 'Several measured values edited together; units line up down the right edge.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: InputGroupLimitsForm,
        },
      ],
    },
  ],
});
