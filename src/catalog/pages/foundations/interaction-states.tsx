import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@cognite/aura/components/item';
import { Loader } from '@cognite/aura/components/loader';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Switch } from '@cognite/aura/components/switch';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCheck, IconPlus, IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { FormField } from '../../../library/forms/FormField';
import { DoDont } from '../../../library/foundations/DoDont';
import { StateMatrix } from '../../../library/foundations/StateMatrix';
import { useSimulatedWait } from '../../../library/foundations/useSimulatedWait';
import { formatReading, runStateStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ASSETS, SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './interaction-states.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');
const PRESSURE = SENSORS[0];

const LOOKALIKE = 'Static look-alike';

const BUTTON_COLUMNS = [
  { id: 'default', label: 'Default' },
  { id: 'hover', label: 'Hover', hint: LOOKALIKE },
  { id: 'focus', label: 'Focus-visible', hint: LOOKALIKE },
  { id: 'disabled', label: 'Disabled' },
  { id: 'loading', label: 'Loading' },
];

const FIELD_COLUMNS = [
  { id: 'default', label: 'Empty' },
  { id: 'filled', label: 'Filled' },
  { id: 'focus', label: 'Focus-visible', hint: LOOKALIKE },
  { id: 'invalid', label: 'Invalid' },
  { id: 'readonly', label: 'Read-only' },
  { id: 'disabled', label: 'Disabled' },
];

const CHOICE_COLUMNS = [
  { id: 'off', label: 'Off' },
  { id: 'on', label: 'On / selected' },
  { id: 'mixed', label: 'Mixed' },
  { id: 'disabledOff', label: 'Disabled, off' },
  { id: 'disabledOn', label: 'Disabled, on' },
];

const SURFACE_COLUMNS = [
  { id: 'default', label: 'Default' },
  { id: 'hover', label: 'Hover', hint: LOOKALIKE },
  { id: 'pressed', label: 'Pressed', hint: LOOKALIKE },
  { id: 'focus', label: 'Focus-visible', hint: LOOKALIKE },
  { id: 'selected', label: 'Selected' },
  { id: 'disabled', label: 'Disabled' },
];

const TARGETS = [
  { size: 'icon-sm', px: 28, where: 'Toolbars and table rows, pointer only' },
  { size: 'icon', px: 36, where: 'Default, pointer and keyboard' },
  { size: 'icon-lg', px: 40, where: 'Focused flows and tablets' },
] as const;

const BUSY_VS_DISABLED = [
  { question: 'What it says', busy: 'Wait, work is in progress', disabled: 'You cannot act here' },
  { question: 'Ends by itself', busy: 'Yes, when the work settles', disabled: 'No, the user must change something' },
  { question: 'Keeps focus', busy: 'Yes', disabled: 'No, it leaves the tab order' },
  { question: 'Announced as', busy: 'aria-busy and a "Saving…" name', disabled: 'Dimmed, unavailable' },
] as const;

/** A static copy of a button in a state that cannot be forced by props. Not a control. */
function StateFakeButton({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

/** A static copy of a list row or card in one state. Not a control. */
function StateFakeSurface({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span aria-hidden="true" className={`flex min-h-7 items-center rounded-lg px-2 py-1 text-sm ${className}`}>
      {children}
    </span>
  );
}

function StateRow({ selected, disabled }: { selected?: boolean; disabled?: boolean }) {
  return (
    <ItemGroup>
      <Item selected={selected} disabled={disabled}>
        <ItemContent>
          <ItemTitle>Recompressor</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function StateTab({ selected, disabled }: { selected?: boolean; disabled?: boolean }) {
  return (
    <Tabs value={selected ? 'trend' : 'other'}>
      <TabsList>
        <TabsTrigger value="trend" disabled={disabled}>
          Trend
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function StateGuideButtonMatrix() {
  return (
    <StateMatrix
      caption="Button variants in each interaction state"
      rowHeader="Button"
      columns={BUTTON_COLUMNS}
      rows={[
        {
          id: 'primary',
          label: 'Primary',
          cells: {
            default: <Button>Save changes</Button>,
            hover: (
              <StateFakeButton className="bg-primary-background-hover text-primary-foreground">Save changes</StateFakeButton>
            ),
            focus: (
              <StateFakeButton className="bg-primary-background text-primary-foreground shadow-focus-ring">
                Save changes
              </StateFakeButton>
            ),
            disabled: <Button disabled>Save changes</Button>,
            loading: (
              <Button disabled aria-busy="true">
                <Loader size={16} /> Saving…
              </Button>
            ),
          },
        },
        {
          id: 'secondary',
          label: 'Secondary',
          cells: {
            default: <Button variant="secondary">Export data</Button>,
            hover: (
              <StateFakeButton className="bg-secondary-background-hover text-secondary-foreground">
                Export data
              </StateFakeButton>
            ),
            focus: (
              <StateFakeButton className="bg-secondary-background text-secondary-foreground shadow-focus-ring">
                Export data
              </StateFakeButton>
            ),
            disabled: (
              <Button variant="secondary" disabled>
                Export data
              </Button>
            ),
            loading: (
              <Button variant="secondary" disabled aria-busy="true">
                <Loader size={16} /> Exporting…
              </Button>
            ),
          },
        },
        {
          id: 'ghost',
          label: 'Ghost',
          cells: {
            default: <Button variant="ghost">View details</Button>,
            hover: (
              <StateFakeButton className="bg-base-background-hover text-medium-foreground">View details</StateFakeButton>
            ),
            focus: <StateFakeButton className="text-medium-foreground shadow-focus-ring">View details</StateFakeButton>,
            disabled: (
              <Button variant="ghost" disabled>
                View details
              </Button>
            ),
            loading: (
              <Button variant="ghost" disabled aria-busy="true">
                <Loader size={16} /> Opening…
              </Button>
            ),
          },
        },
        {
          id: 'destructive',
          label: 'Destructive',
          cells: {
            default: <Button variant="destructive">Delete pipeline</Button>,
            hover: (
              <StateFakeButton className="bg-critical-background-hover text-critical-foreground">
                Delete pipeline
              </StateFakeButton>
            ),
            focus: (
              <StateFakeButton className="bg-critical-background text-critical-foreground shadow-focus-ring-destructive">
                Delete pipeline
              </StateFakeButton>
            ),
            disabled: (
              <Button variant="destructive" disabled>
                Delete pipeline
              </Button>
            ),
            loading: (
              <Button variant="destructive" disabled aria-busy="true">
                <Loader size={16} /> Deleting…
              </Button>
            ),
          },
        },
      ]}
    />
  );
}

function StateGuideFieldMatrix() {
  return (
    <StateMatrix
      caption="Text fields in each interaction state"
      rowHeader="Field"
      dense
      columns={FIELD_COLUMNS}
      rows={[
        {
          id: 'input',
          label: 'Input',
          cells: {
            default: <Input aria-label="Tag, empty" placeholder="23-KA-9101" />,
            filled: <Input aria-label="Tag, filled" defaultValue="23-KA-9101" />,
            focus: (
              <span
                aria-hidden="true"
                className="flex h-9 w-full items-center rounded-lg bg-base-background px-3 text-sm text-base-foreground shadow-focus-ring"
              >
                23-KA-9101
              </span>
            ),
            invalid: <Input aria-label="Tag, invalid" aria-invalid="true" defaultValue="23 KA 9101" />,
            readonly: <Input aria-label="Tag, read-only" readOnly defaultValue="23-KA-9101" />,
            disabled: <Input aria-label="Tag, disabled" disabled defaultValue="23-KA-9101" />,
          },
        },
        {
          id: 'textarea',
          label: 'Textarea',
          cells: {
            default: <Textarea aria-label="Note, empty" rows={2} placeholder="Add a shift note" />,
            filled: <Textarea aria-label="Note, filled" rows={2} defaultValue="Bearing checked at 06:00." />,
            focus: (
              <span
                aria-hidden="true"
                className="flex h-16 w-full rounded-lg bg-base-background px-3 py-2 text-sm text-base-foreground shadow-focus-ring"
              >
                Bearing checked
              </span>
            ),
            invalid: <Textarea aria-label="Note, invalid" rows={2} aria-invalid="true" defaultValue="ok" />,
            readonly: <Textarea aria-label="Note, read-only" rows={2} readOnly defaultValue="Bearing checked at 06:00." />,
            disabled: <Textarea aria-label="Note, disabled" rows={2} disabled defaultValue="Bearing checked at 06:00." />,
          },
        },
      ]}
    />
  );
}

function StateGuideChoiceMatrix() {
  return (
    <StateMatrix
      caption="Checkbox, switch and tab in each selection state"
      columns={CHOICE_COLUMNS}
      rows={[
        {
          id: 'checkbox',
          label: 'Checkbox',
          cells: {
            off: (
              <CheckboxItem>
                <CheckboxItemControl />
                <CheckboxItemLabel>Critical</CheckboxItemLabel>
              </CheckboxItem>
            ),
            on: (
              <CheckboxItem>
                <CheckboxItemControl defaultChecked />
                <CheckboxItemLabel>Critical</CheckboxItemLabel>
              </CheckboxItem>
            ),
            mixed: (
              <CheckboxItem>
                <CheckboxItemControl indeterminate />
                <CheckboxItemLabel>All severities</CheckboxItemLabel>
              </CheckboxItem>
            ),
            disabledOff: (
              <CheckboxItem>
                <CheckboxItemControl disabled />
                <CheckboxItemLabel>Critical</CheckboxItemLabel>
              </CheckboxItem>
            ),
            disabledOn: (
              <CheckboxItem>
                <CheckboxItemControl disabled defaultChecked />
                <CheckboxItemLabel>Critical</CheckboxItemLabel>
              </CheckboxItem>
            ),
          },
        },
        {
          id: 'switch',
          label: 'Switch',
          cells: {
            off: <Switch label="Notify" />,
            on: <Switch label="Notify" defaultChecked />,
            disabledOff: <Switch label="Notify" disabled />,
            disabledOn: <Switch label="Notify" disabled defaultChecked />,
          },
        },
        {
          id: 'tab',
          label: 'Tab',
          cells: {
            off: <StateTab />,
            on: <StateTab selected />,
            disabledOff: <StateTab disabled />,
          },
        },
      ]}
    />
  );
}

function StateGuideSurfaceMatrix() {
  return (
    <StateMatrix
      caption="List row and interactive card in each interaction state"
      rowHeader="Surface"
      columns={SURFACE_COLUMNS}
      rows={[
        {
          id: 'row',
          label: 'List row',
          cells: {
            default: <StateRow />,
            hover: <StateFakeSurface className="bg-accent-background text-base-foreground">Recompressor</StateFakeSurface>,
            pressed: (
              <StateFakeSurface className="bg-medium-background-hover text-base-foreground">Recompressor</StateFakeSurface>
            ),
            focus: <StateFakeSurface className="text-base-foreground shadow-focus-ring">Recompressor</StateFakeSurface>,
            selected: <StateRow selected />,
            disabled: <StateRow disabled />,
          },
        },
        {
          id: 'card',
          label: 'Card',
          cells: {
            default: (
              <StateFakeSurface className="bg-card-background px-3 py-2 text-card-foreground">Gas export</StateFakeSurface>
            ),
            hover: (
              <StateFakeSurface className="bg-card-background-hover px-3 py-2 text-card-foreground">
                Gas export
              </StateFakeSurface>
            ),
            pressed: (
              <StateFakeSurface className="bg-medium-background-hover px-3 py-2 text-card-foreground">
                Gas export
              </StateFakeSurface>
            ),
            focus: (
              <StateFakeSurface className="bg-card-background px-3 py-2 text-card-foreground shadow-focus-ring">
                Gas export
              </StateFakeSurface>
            ),
            selected: (
              <StateFakeSurface className="justify-between gap-2 bg-secondary-background px-3 py-2 text-secondary-foreground">
                Gas export <IconCheck className="size-4" />
              </StateFakeSurface>
            ),
            disabled: (
              <StateFakeSurface className="bg-base-background-disabled px-3 py-2 text-base-foreground-disabled">
                Gas export
              </StateFakeSurface>
            ),
          },
        },
      ]}
    />
  );
}

function StateGuideFocusRingDefault() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button variant="secondary">Export data</Button>
        <Input aria-label="Data set name" defaultValue="Nordkapp historian" />
      </div>
      <p className="text-xs text-muted-foreground">
        Press Tab to move through these. The ring is <span className="font-mono text-base-foreground">shadow-focus-ring</span>
        , a shadow, so it follows the radius and never shifts layout.
      </p>
    </div>
  );
}

function StateGuideFocusRingCritical() {
  return (
    <div className="w-full max-w-xs">
      <FormField label="Data set name" error="Use letters, numbers, and hyphens only.">
        {(control) => <Input {...control} defaultValue="Nordkapp historian / v2" />}
      </FormField>
      <p className="mt-3 text-xs text-muted-foreground">
        Focus an invalid field and the ring turns critical:{' '}
        <span className="font-mono text-base-foreground">shadow-focus-ring-destructive</span>.
      </p>
    </div>
  );
}

function StateGuideFocusVisibleOnly() {
  const [last, setLast] = useState('Nothing selected yet');

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setLast('Acknowledged')}>
          Acknowledge
        </Button>
        <Button variant="outline" onClick={() => setLast('Shelved')}>
          Shelve
        </Button>
      </div>
      <p className="text-sm text-base-foreground" aria-live="polite">
        {last}
      </p>
      <p className="text-xs text-muted-foreground">
        Select one with the pointer: no ring. Reach it with Tab: a ring. That is what focus-visible means.
      </p>
    </div>
  );
}

function StateGuideSelectedFocusedHovered() {
  const rows = [
    { name: '1st stage compressor', state: 'Hovered', hint: 'Pointer is over it', className: 'bg-accent-background', check: false },
    { name: '2nd stage compressor', state: 'Focused', hint: 'Keyboard is on it', className: 'shadow-focus-ring', check: false },
    { name: 'Recompressor', state: 'Selected', hint: 'Persistent choice', className: 'bg-secondary-background', check: true },
    {
      name: 'Interstage cooler',
      state: 'Selected and focused',
      hint: 'Both at once, both visible',
      className: 'bg-secondary-background shadow-focus-ring',
      check: true,
    },
  ];

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="Row states, static look-alikes">
        {rows.map((row) => (
          <li key={row.name} className="grid grid-cols-2 items-center gap-4">
            <span
              className={`flex min-h-8 items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm text-base-foreground ${row.className}`}
            >
              {row.name}
              {row.check ? <IconCheck className="size-4" aria-hidden="true" /> : null}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-base-foreground">{row.state}.</span> {row.hint}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Three different signals: a tint for hover, a ring for focus, a fill plus a check for selected.
      </p>
    </div>
  );
}

function StateGuideSelectedNotStatus() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <DoDont kind="do" caption="Neutral fill and a check: reads as a choice.">
        <span className="flex items-center justify-between gap-2 rounded-lg bg-secondary-background px-2 py-1.5 text-sm text-secondary-foreground">
          Gas compression <IconCheck className="size-4" aria-hidden="true" />
        </span>
      </DoDont>
      <DoDont kind="dont" caption="Status colour for selection: reads as healthy, not as chosen.">
        <span className="flex items-center rounded-lg bg-success-background px-2 py-1.5 text-sm text-success-foreground">
          Gas compression
        </span>
      </DoDont>
    </div>
  );
}

function StateGuidePressedFeedback() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <button
        type="button"
        onClick={() => setCount(count + 1)}
        className="flex items-center justify-between gap-3 rounded-lg bg-card-background px-3 py-2 text-left outline-none hover:bg-card-background-hover focus-visible:shadow-focus-ring active:bg-medium-background-hover motion-safe:transition-colors motion-safe:duration-100"
      >
        <span className="text-sm font-medium text-card-foreground">Gas export</span>
        <span className="text-xs text-muted-foreground tabular-nums">Opened {count} times</span>
      </button>
      <p className="text-xs text-muted-foreground">
        Press and hold. The surface goes one step deeper than hover the moment the pointer is down, and nothing moves, so
        a press is never mistaken for a drag.
      </p>
    </div>
  );
}

function StateGuideTouchTargets() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        {TARGETS.map((target) => (
          <div key={target.size} className="flex flex-col items-start gap-2">
            <div className="flex size-14 items-center justify-center rounded-lg border border-dashed border-emphasized">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="secondary" size={target.size} aria-label={`Add row, ${target.px} pixel target`}>
                      <IconPlus />
                    </Button>
                  }
                />
                <TooltipContent>Add row</TooltipContent>
              </Tooltip>
            </div>
            <p className="font-mono text-xs text-base-foreground tabular-nums">
              {target.size} · {target.px} px
            </p>
            <p className="text-xs text-muted-foreground">{target.where}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        The dashed square is 56 px, a comfortable touch area. Never go under 24 px for a pointer target, and keep 8 px
        between neighbours so a gloved finger hits one control.
      </p>
    </div>
  );
}

function StateGuideDisabledWithReason() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button disabled>Deploy function</Button>
      <p className="text-sm text-muted-foreground">Select a schedule before you deploy.</p>
    </div>
  );
}

function StateGuideDisabledTooltip() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="secondary" aria-disabled="true" onClick={(event) => event.preventDefault()}>
              Start compressor
            </Button>
          }
        />
        <TooltipContent>Reset the trip on 23-KA-9103 first</TooltipContent>
      </Tooltip>
      <p className="max-w-56 text-center text-xs text-muted-foreground">
        aria-disabled keeps it in the tab order, so the reason is reachable by keyboard.
      </p>
    </div>
  );
}

function StateGuideInvalidField() {
  const [value, setValue] = useState('56');
  const [touched, setTouched] = useState(true);
  const number = Number(value);
  const invalid = touched && (value.trim() === '' || Number.isNaN(number) || number > PRESSURE.highLimit);

  return (
    <div className="w-full max-w-xs">
      <FormField
        label="Discharge pressure setpoint"
        helper={`Up to ${formatReading(PRESSURE.highLimit, PRESSURE.unit, 0)}. Checked when you leave the field.`}
        error={invalid ? `Enter a number up to ${formatReading(PRESSURE.highLimit, PRESSURE.unit, 0)}.` : undefined}
      >
        {(control) => (
          <Input
            {...control}
            inputMode="decimal"
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

function StateGuideBusyVsDisabled() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-2">
        <span />
        <div>
          <AsyncButton onAction={() => wait(1600)} pendingLabel="Saving…">
            Save changes
          </AsyncButton>
        </div>
        <div>
          <Button disabled>Save changes</Button>
        </div>
        <span />
        <p className="text-xs font-medium text-base-foreground">Busy. Select it to see.</p>
        <p className="text-xs font-medium text-base-foreground">Disabled</p>
        {BUSY_VS_DISABLED.map((row) => (
          <div key={row.question} className="col-span-3 grid grid-cols-subgrid border-t border-default pt-2">
            <p className="text-xs text-muted-foreground">{row.question}</p>
            <p className="text-xs text-medium-foreground">{row.busy}</p>
            <p className="text-xs text-medium-foreground">{row.disabled}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StateGuideReadOnlyVsDisabled() {
  return (
    <div className="grid w-full grid-cols-2 gap-6">
      <div>
        <FormField label="External ID" helper="Read-only: set by the source system. You can still focus and copy it.">
          {(control) => <Input {...control} readOnly defaultValue="23-PT-92531" />}
        </FormField>
      </div>
      <div>
        <FormField label="High limit" disabled helper="Disabled: turn on limit monitoring to edit.">
          {(control) => <Input {...control} defaultValue={formatReading(PRESSURE.highLimit, PRESSURE.unit, 1)} />}
        </FormField>
      </div>
    </div>
  );
}

function StateGuideLoadingRegion() {
  const load = useSimulatedWait(1600);
  const waiting = load.phase === 'waiting';

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div aria-busy={waiting} className="flex h-16 flex-col justify-center gap-2 rounded-lg border border-default px-3">
        {waiting ? (
          <div role="status" aria-label="Loading reading" className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-24" />
          </div>
        ) : (
          <>
            <p className="text-xs leading-3 text-muted-foreground">{PRESSURE.name}</p>
            <p className="text-base leading-5 font-semibold text-base-foreground tabular-nums">
              {formatReading(load.phase === 'done' ? PRESSURE.value : null, PRESSURE.unit, PRESSURE.decimals)}
            </p>
          </>
        )}
      </div>
      <Button variant="secondary" size="sm" className="self-start" disabled={waiting} onClick={load.start}>
        <IconRefresh /> Refresh reading
      </Button>
    </div>
  );
}

function StateGuidePreferEnabling() {
  const [name, setName] = useState('');
  const [tried, setTried] = useState(false);
  const missing = tried && name.trim() === '';

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <DoDont kind="do" surface="outline" caption="The button stays enabled and tells you what is missing when you try.">
        <div className="flex flex-col gap-3">
          <FormField label="Data set name" required error={missing ? 'Enter a name for the data set.' : undefined}>
            {(control) => <Input {...control} value={name} onChange={(event) => setName(event.target.value)} />}
          </FormField>
          <Button className="self-start" onClick={() => setTried(true)}>
            Create data set
          </Button>
        </div>
      </DoDont>
      <DoDont kind="dont" surface="outline" caption="A disabled primary action with no hint leaves people guessing.">
        <div className="flex flex-col gap-3">
          <FormField label="Data set name" required>
            {(control) => <Input {...control} />}
          </FormField>
          <Button className="self-start" disabled>
            Create data set
          </Button>
        </div>
      </DoDont>
    </div>
  );
}

function StateGuideListStates() {
  const [selected, setSelected] = useState('23-ka-9103');

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul className="flex flex-col gap-1" aria-label="Compressors">
        {COMPRESSORS.map((asset) => {
          const isSelected = asset.id === selected;
          return (
            <li key={asset.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(asset.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left outline-none focus-visible:shadow-focus-ring active:bg-medium-background-hover motion-safe:transition-colors motion-safe:duration-100 ${
                  isSelected ? 'bg-secondary-background' : 'hover:bg-accent-background'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-base-foreground">{asset.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{asset.tag}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <StatusIndicator {...runStateStatus(asset.state)} size="sm" />
                  <IconCheck className={`size-4 text-base-foreground ${isSelected ? '' : 'invisible'}`} aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Every state at once, live: hover, press, Tab to focus, Enter to select. Status keeps its own colour and shape.
      </p>
    </div>
  );
}

function StateGuideFormStates() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-card-background p-4">
      <div>
        <p className="text-sm font-medium text-card-foreground">Limit monitoring</p>
        <p className="text-xs text-muted-foreground">
          {PRESSURE.name} · <span className="font-mono">{PRESSURE.tag}</span>
        </p>
      </div>
      <ItemGroup>
        <Item>
          <ItemContent>
            <ItemTitle>Monitor limits</ItemTitle>
            <ItemDescription>Raise an alarm when the value leaves the band.</ItemDescription>
          </ItemContent>
          <Switch defaultChecked aria-label="Monitor limits" />
        </Item>
      </ItemGroup>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormField label="Low limit">{(control) => <Input {...control} defaultValue="40.0" />}</FormField>
        </div>
        <div>
          <FormField label="High limit" error="Must be above the low limit.">
            {(control) => <Input {...control} defaultValue="38.0" />}
          </FormField>
        </div>
      </div>
      <div>
        <FormField label="Trip limit" helper="Read-only: owned by the safety system.">
          {(control) => <Input {...control} readOnly defaultValue="55.0" />}
        </FormField>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost">Discard</Button>
        <AsyncButton onAction={() => wait(1600)} pendingLabel="Saving…">
          Save limits
        </AsyncButton>
      </div>
    </div>
  );
}

export default definePage({
  id: 'interaction-states',
  title: 'Interaction states',
  summary:
    'Every control says what is possible, what is happening and what the system registered. Aura primitives ship these states; this page shows them side by side, and the rules to follow when you build a control of your own.',
  guidance: {
    use: [
      'The primitive’s own props for disabled, invalid, read-only and selected.',
      'A visible focus ring on every control: default ring, or the critical ring on invalid fields.',
      'A fill plus an icon or check for selected, so it survives without colour.',
      'A reason next to anything disabled, and a busy state for anything that is working.',
    ],
    avoid: [
      'Hover as the only cue: touch and keyboard users never see it.',
      'Status colours for selection or toggles.',
      'Opacity to fake disabled on a custom control; use the disabled tokens.',
      'Disabling the primary action without a visible way to unblock it.',
    ],
  },
  source,
  sections: [
    {
      id: 'matrix',
      title: 'State matrix',
      description:
        'Real components wherever a prop sets the state. Hover, pressed and focus cannot be forced, so those cells are static look-alikes built from the same tokens.',
      specimens: [
        {
          id: 'StateGuideButtonMatrix',
          title: 'Buttons',
          note: 'Check a custom button against this row by row before it ships.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/StateMatrix.tsx'],
          Component: StateGuideButtonMatrix,
        },
        {
          id: 'StateGuideFieldMatrix',
          title: 'Text fields',
          note: 'Invalid, read-only and disabled are three different messages; pick the one that is true.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/StateMatrix.tsx'],
          Component: StateGuideFieldMatrix,
        },
        {
          id: 'StateGuideChoiceMatrix',
          title: 'Checkbox, switch and tab',
          note: 'Controls whose main state is on or off, including the mixed state of a parent checkbox.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/StateMatrix.tsx'],
          Component: StateGuideChoiceMatrix,
        },
        {
          id: 'StateGuideSurfaceMatrix',
          title: 'List row and card',
          note: 'Clickable surfaces: the tokens to use for each state when you build one.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/StateMatrix.tsx'],
          Component: StateGuideSurfaceMatrix,
        },
      ],
    },
    {
      id: 'focus',
      title: 'Focus',
      description: 'The main signal for anyone not using a pointer. Try these with the Tab key.',
      specimens: [
        {
          id: 'StateGuideFocusRingDefault',
          title: 'Default focus ring',
          note: 'Every interactive control, on every surface.',
          origin: 'aura',
          align: 'stretch',
          Component: StateGuideFocusRingDefault,
        },
        {
          id: 'StateGuideFocusRingCritical',
          title: 'Critical focus ring',
          note: 'Invalid fields and destructive controls keep their meaning while focused.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: StateGuideFocusRingCritical,
        },
        {
          id: 'StateGuideFocusVisibleOnly',
          title: 'Focus-visible, not focus',
          note: 'Keyboard users always get a ring; pointer users do not get one on every click.',
          origin: 'aura',
          align: 'stretch',
          Component: StateGuideFocusVisibleOnly,
        },
      ],
    },
    {
      id: 'distinction',
      title: 'Telling states apart',
      description: 'States overlap in real use, so each needs its own signal.',
      specimens: [
        {
          id: 'StateGuideSelectedFocusedHovered',
          title: 'Hovered, focused, selected',
          note: 'When a list can show all three at once, such as a navigable asset list.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: StateGuideSelectedFocusedHovered,
        },
        {
          id: 'StateGuideSelectedNotStatus',
          title: 'Selected is not a status',
          note: 'Selection uses the neutral selected fill, never success or info.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: StateGuideSelectedNotStatus,
        },
        {
          id: 'StateGuidePressedFeedback',
          title: 'Pressed feedback',
          note: 'Confirms the input within a frame, without moving anything.',
          origin: 'aura',
          align: 'stretch',
          Component: StateGuidePressedFeedback,
        },
        {
          id: 'StateGuideTouchTargets',
          title: 'Target sizes',
          note: 'Choose the icon button size by device: 28 px for pointer-only density, 40 px for tablets.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: StateGuideTouchTargets,
        },
      ],
    },
    {
      id: 'unavailable',
      title: 'Unavailable, busy and invalid',
      description: 'Disabled means you cannot act here. Loading means wait. Invalid means fix this.',
      specimens: [
        {
          id: 'StateGuideDisabledWithReason',
          title: 'Disabled with a reason',
          note: 'If an action must be disabled, the text next to it says what unblocks it.',
          origin: 'aura',
          Component: StateGuideDisabledWithReason,
        },
        {
          id: 'StateGuideDisabledTooltip',
          title: 'Disabled, reason in a tooltip',
          note: 'Dense toolbars with no room for a hint; hover or focus it to read why.',
          origin: 'aura',
          Component: StateGuideDisabledTooltip,
        },
        {
          id: 'StateGuideInvalidField',
          title: 'Invalid, checked on blur',
          note: 'Errors appear when the user leaves the field, not on every keystroke.',
          origin: 'custom',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: StateGuideInvalidField,
        },
        {
          id: 'StateGuideBusyVsDisabled',
          title: 'Busy and disabled',
          note: 'Use busy while your own action runs; use disabled when the user has to change something first.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/AsyncButton.tsx'],
          Component: StateGuideBusyVsDisabled,
        },
        {
          id: 'StateGuideReadOnlyVsDisabled',
          title: 'Read-only and disabled',
          note: 'Read-only for values the user may read and copy but not change; disabled for fields that do not apply.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: StateGuideReadOnlyVsDisabled,
        },
        {
          id: 'StateGuideLoadingRegion',
          title: 'Loading region',
          note: 'A region that refreshes marks itself busy and keeps its size.',
          origin: 'custom',
          align: 'stretch',
          uses: ['foundations/useSimulatedWait.ts'],
          Component: StateGuideLoadingRegion,
        },
        {
          id: 'StateGuidePreferEnabling',
          title: 'Enable and explain',
          note: 'Prefer an enabled action that validates over a disabled one that stays silent.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'forms/FormField.tsx'],
          Component: StateGuidePreferEnabling,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'The states working together on real surfaces.',
      specimens: [
        {
          id: 'StateGuideListStates',
          title: 'Selectable list',
          note: 'A custom list that implements hover, pressed, focus and selected with the tokens above.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          Component: StateGuideListStates,
        },
        {
          id: 'StateGuideFormStates',
          title: 'Form with mixed states',
          note: 'One card showing default, invalid, read-only and busy next to each other.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['forms/FormField.tsx', 'actions/AsyncButton.tsx'],
          Component: StateGuideFormStates,
        },
      ],
    },
  ],
});
