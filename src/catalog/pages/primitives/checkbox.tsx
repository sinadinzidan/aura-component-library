import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemDescription,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import { IconColumns3 } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { SelectAllCheckboxList } from '../../../library/forms/SelectAllCheckboxList';
import { ALARMS, ASSETS } from '../../data/plant';
import { definePage } from '../../types';

import source from './checkbox.tsx?raw';

const toggleIn = (list: string[], id: string, checked: boolean) =>
  checked ? [...list, id] : list.filter((item) => item !== id);

const SENSOR_COLUMNS = [
  { id: 'tag', label: 'Tag' },
  { id: 'value', label: 'Current value' },
  { id: 'limits', label: 'Operating limits' },
  { id: 'quality', label: 'Signal quality' },
];

const ASSET_TYPE_FACETS = [
  { id: 'compressor', label: 'Compressor' },
  { id: 'pump', label: 'Pump' },
  { id: 'separator', label: 'Separator' },
  { id: 'valve', label: 'Valve' },
].map((facet) => ({ ...facet, count: ASSETS.filter((asset) => asset.type === facet.id).length }));

const DIGEST_SEVERITIES = [
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
];

const ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active');

function CheckboxSingle() {
  return (
    <CheckboxItem>
      <CheckboxItemControl />
      <CheckboxItemLabel>Notify the shift supervisor</CheckboxItemLabel>
    </CheckboxItem>
  );
}

function CheckboxGroupVertical() {
  return (
    <CheckboxGroup aria-label="Alarm severities">
      <CheckboxItem>
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Critical</CheckboxItemLabel>
      </CheckboxItem>
      <CheckboxItem>
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>High</CheckboxItemLabel>
      </CheckboxItem>
      <CheckboxItem>
        <CheckboxItemControl />
        <CheckboxItemLabel>Medium</CheckboxItemLabel>
      </CheckboxItem>
      <CheckboxItem>
        <CheckboxItemControl />
        <CheckboxItemLabel>Low</CheckboxItemLabel>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxGroupHorizontal() {
  return (
    <CheckboxGroup orientation="horizontal" aria-label="Work order types" className="gap-4">
      <CheckboxItem>
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Corrective</CheckboxItemLabel>
      </CheckboxItem>
      <CheckboxItem>
        <CheckboxItemControl />
        <CheckboxItemLabel>Preventive</CheckboxItemLabel>
      </CheckboxItem>
      <CheckboxItem>
        <CheckboxItemControl />
        <CheckboxItemLabel>Inspection</CheckboxItemLabel>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxWithDescription() {
  return (
    <CheckboxGroup aria-label="Export contents">
      <CheckboxItem>
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Raw data points</CheckboxItemLabel>
        <CheckboxItemDescription>Every sample at its original resolution.</CheckboxItemDescription>
      </CheckboxItem>
      <CheckboxItem>
        <CheckboxItemControl />
        <CheckboxItemLabel>Hourly aggregates</CheckboxItemLabel>
        <CheckboxItemDescription>Average, minimum and maximum per hour.</CheckboxItemDescription>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxCard() {
  return (
    <CheckboxGroup aria-label="Notification channels">
      <CheckboxItem variant="card">
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Email</CheckboxItemLabel>
        <CheckboxItemDescription>A message for every critical alarm.</CheckboxItemDescription>
      </CheckboxItem>
      <CheckboxItem variant="card">
        <CheckboxItemControl />
        <CheckboxItemLabel>Control room display</CheckboxItemLabel>
        <CheckboxItemDescription>A banner on the shared wall screen.</CheckboxItemDescription>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxCardLabelOnly() {
  return (
    <CheckboxGroup orientation="horizontal" aria-label="Sites" className="w-full">
      <CheckboxItem variant="card" className="w-full">
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Nordkapp</CheckboxItemLabel>
      </CheckboxItem>
      <CheckboxItem variant="card" className="w-full">
        <CheckboxItemControl />
        <CheckboxItemLabel>Valhall Sør</CheckboxItemLabel>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxGroupWithLabel() {
  const id = useId();
  return (
    <div className="flex flex-col">
      <Label id={`${id}-label`}>Include in the shift report</Label>
      <CheckboxGroup aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`}>
        <CheckboxItem>
          <CheckboxItemControl defaultChecked />
          <CheckboxItemLabel>Active alarms</CheckboxItemLabel>
        </CheckboxItem>
        <CheckboxItem>
          <CheckboxItemControl defaultChecked />
          <CheckboxItemLabel>Open work orders</CheckboxItemLabel>
        </CheckboxItem>
        <CheckboxItem>
          <CheckboxItemControl />
          <CheckboxItemLabel>Production figures</CheckboxItemLabel>
        </CheckboxItem>
      </CheckboxGroup>
      <HelperText id={`${id}-help`}>The report is sent at the end of each shift.</HelperText>
    </div>
  );
}

function CheckboxLongLabel() {
  return (
    <div className="w-full max-w-64">
      <CheckboxItem>
        <CheckboxItemControl />
        <CheckboxItemLabel>
          Also close the linked work orders when the alarm has been cleared for 24 hours
        </CheckboxItemLabel>
      </CheckboxItem>
    </div>
  );
}

function CheckboxWithBadge() {
  return (
    <CheckboxGroup aria-label="Detection models">
      <CheckboxItem>
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Vibration anomaly detection</CheckboxItemLabel>
      </CheckboxItem>
      <CheckboxItem>
        <CheckboxItemControl />
        <CheckboxItemLabel className="flex items-center gap-2">
          Bearing wear forecast <Badge variant="secondary">Beta</Badge>
        </CheckboxItemLabel>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxControlOnly() {
  return (
    <div className="flex items-center gap-3">
      <CheckboxItemControl aria-label="Select 1st stage compressor" />
      <span className="font-mono text-sm text-base-foreground">23-KA-9101</span>
      <span className="text-sm text-muted-foreground">1st stage compressor</span>
    </div>
  );
}

function CheckboxControlled() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <CheckboxItem>
        <CheckboxItemControl checked={checked} onCheckedChange={(next) => setChecked(next)} />
        <CheckboxItemLabel>Include shelved alarms</CheckboxItemLabel>
      </CheckboxItem>
      <p className="pl-6 text-xs tabular-nums text-muted-foreground">
        {checked ? 'Showing 5 alarms' : 'Showing 4 alarms'}
      </p>
    </div>
  );
}

function CheckboxIndeterminate() {
  return (
    <CheckboxItem>
      <CheckboxItemControl indeterminate />
      <CheckboxItemLabel>Gas compression (2 of 5 assets)</CheckboxItemLabel>
    </CheckboxItem>
  );
}

function CheckboxInvalid() {
  const id = useId();
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex flex-col">
      <CheckboxItem>
        <CheckboxItemControl
          checked={checked}
          onCheckedChange={(next) => setChecked(next)}
          aria-invalid={checked ? undefined : true}
          aria-describedby={checked ? undefined : `${id}-error`}
        />
        <CheckboxItemLabel>I have isolated the equipment</CheckboxItemLabel>
      </CheckboxItem>
      {checked ? null : (
        <HelperText id={`${id}-error`} isError>
          Confirm isolation before you start the work order.
        </HelperText>
      )}
    </div>
  );
}

function CheckboxGroupInvalid() {
  const id = useId();
  const [selected, setSelected] = useState<string[]>([]);
  const invalid = selected.length === 0;
  return (
    <div className="flex flex-col">
      <Label id={`${id}-label`} required>
        Recipients
      </Label>
      <CheckboxGroup aria-labelledby={`${id}-label`} aria-describedby={invalid ? `${id}-error` : undefined}>
        <CheckboxItem>
          <CheckboxItemControl
            aria-invalid={invalid ? true : undefined}
            checked={selected.includes('operators')}
            onCheckedChange={(checked) => setSelected(toggleIn(selected, 'operators', checked))}
          />
          <CheckboxItemLabel>Control room operators</CheckboxItemLabel>
        </CheckboxItem>
        <CheckboxItem>
          <CheckboxItemControl
            aria-invalid={invalid ? true : undefined}
            checked={selected.includes('planners')}
            onCheckedChange={(checked) => setSelected(toggleIn(selected, 'planners', checked))}
          />
          <CheckboxItemLabel>Maintenance planners</CheckboxItemLabel>
        </CheckboxItem>
      </CheckboxGroup>
      {invalid ? (
        <HelperText id={`${id}-error`} isError>
          Select at least one recipient.
        </HelperText>
      ) : null}
    </div>
  );
}

function CheckboxDisabledWithReason() {
  const id = useId();
  return (
    <div className="flex flex-col">
      <CheckboxItem>
        <CheckboxItemControl disabled aria-describedby={`${id}-reason`} />
        <CheckboxItemLabel>Write set points back to the source</CheckboxItemLabel>
      </CheckboxItem>
      <HelperText id={`${id}-reason`}>Only plant admins can turn on write-back.</HelperText>
    </div>
  );
}

function CheckboxLockedOn() {
  return (
    <CheckboxGroup aria-label="Table columns">
      <CheckboxItem>
        <CheckboxItemControl checked disabled />
        <CheckboxItemLabel>Tag</CheckboxItemLabel>
        <CheckboxItemDescription>Always shown: it identifies the row.</CheckboxItemDescription>
      </CheckboxItem>
      <CheckboxItem>
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Current value</CheckboxItemLabel>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxCardDisabled() {
  return (
    <CheckboxGroup aria-label="Notification channels">
      <CheckboxItem variant="card">
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Email</CheckboxItemLabel>
        <CheckboxItemDescription>A message for every critical alarm.</CheckboxItemDescription>
      </CheckboxItem>
      <CheckboxItem variant="card">
        <CheckboxItemControl disabled />
        <CheckboxItemLabel>SMS</CheckboxItemLabel>
        <CheckboxItemDescription>Add a phone number to your profile first.</CheckboxItemDescription>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxSelectAll() {
  const [columns, setColumns] = useState(['tag', 'value']);
  return (
    <div className="w-full max-w-xs">
      <SelectAllCheckboxList
        label="Visible columns"
        selectAllLabel="All columns"
        options={SENSOR_COLUMNS}
        value={columns}
        onValueChange={setColumns}
      />
    </div>
  );
}

function CheckboxSelectAllLocked() {
  const [areas, setAreas] = useState(['nk-23']);
  return (
    <div className="w-full max-w-xs">
      <SelectAllCheckboxList
        label="Areas in this report"
        selectAllLabel="All areas"
        options={[
          { id: 'nk-20', label: 'Inlet and separation' },
          { id: 'nk-23', label: 'Gas compression' },
          { id: 'nk-27', label: 'Gas export' },
          { id: 'nk-40', label: 'Cooling water', description: 'No access to this area.', disabled: true },
        ]}
        value={areas}
        onValueChange={setAreas}
        formatCount={(selected, total) => `${selected} of ${total} areas`}
      />
    </div>
  );
}

function CheckboxFacetFilter() {
  const [types, setTypes] = useState(['compressor']);
  return (
    <div className="flex w-full max-w-56 flex-col">
      <span id="checkbox-facet-label" className="pb-2 text-xs font-medium text-muted-foreground">
        Asset type
      </span>
      <CheckboxGroup aria-labelledby="checkbox-facet-label">
        {ASSET_TYPE_FACETS.map((facet) => (
          <CheckboxItem key={facet.id}>
            <CheckboxItemControl
              checked={types.includes(facet.id)}
              onCheckedChange={(checked) => setTypes(toggleIn(types, facet.id, checked))}
            />
            <CheckboxItemLabel className="flex items-center justify-between gap-2">
              {facet.label}
              <span className="text-xs font-normal tabular-nums text-muted-foreground">{facet.count}</span>
            </CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
    </div>
  );
}

function CheckboxInPopover() {
  const [columns, setColumns] = useState(['tag', 'value', 'limits']);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconColumns3 /> Columns <Badge variant="secondary">{columns.length}</Badge>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-56">
        <CheckboxGroup aria-label="Visible columns" className="w-full">
          {SENSOR_COLUMNS.map((column) => (
            <CheckboxItem key={column.id}>
              <CheckboxItemControl
                checked={columns.includes(column.id)}
                onCheckedChange={(checked) => setColumns(toggleIn(columns, column.id, checked))}
              />
              <CheckboxItemLabel>{column.label}</CheckboxItemLabel>
            </CheckboxItem>
          ))}
        </CheckboxGroup>
      </PopoverContent>
    </Popover>
  );
}

function CheckboxRowSelection() {
  const [selected, setSelected] = useState([ACTIVE_ALARMS[0].id]);
  const all = selected.length === ACTIVE_ALARMS.length;
  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="flex items-center gap-3 px-2 py-2">
        <CheckboxItemControl
          aria-label="Select all active alarms"
          checked={all}
          indeterminate={selected.length > 0 && !all}
          onCheckedChange={(checked) => setSelected(checked ? ACTIVE_ALARMS.map((alarm) => alarm.id) : [])}
        />
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {selected.length} of {ACTIVE_ALARMS.length} selected
        </span>
      </div>
      {ACTIVE_ALARMS.map((alarm) => (
        <div
          key={alarm.id}
          className={
            selected.includes(alarm.id)
              ? 'flex items-center gap-3 rounded-lg bg-muted-background px-2 py-2'
              : 'flex items-center gap-3 rounded-lg px-2 py-2'
          }
        >
          <CheckboxItemControl
            aria-label={`Select ${alarm.message}`}
            checked={selected.includes(alarm.id)}
            onCheckedChange={(checked) => setSelected(toggleIn(selected, alarm.id, checked))}
          />
          <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{alarm.message}</span>
          <span className="font-mono text-xs text-muted-foreground">{alarm.sensorTag}</span>
        </div>
      ))}
    </div>
  );
}

function CheckboxConfirmDelete() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-muted-background p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-base-foreground">Delete data set “Compressor vibration”</p>
        <p className="text-sm text-muted-foreground">This removes 14 time series and cannot be undone.</p>
      </div>
      <CheckboxItem>
        <CheckboxItemControl checked={confirmed} onCheckedChange={(next) => setConfirmed(next)} />
        <CheckboxItemLabel>I understand that the data is permanently deleted</CheckboxItemLabel>
      </CheckboxItem>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Keep data set</Button>
        <Button variant="destructive" disabled={!confirmed}>
          Delete data set
        </Button>
      </div>
    </div>
  );
}

function CheckboxCardGrid() {
  return (
    <CheckboxGroup aria-label="Data to synchronise" className="w-full max-w-lg grid-cols-2">
      <CheckboxItem variant="card" className="w-full">
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Time series</CheckboxItemLabel>
        <CheckboxItemDescription>Sensor values and their metadata.</CheckboxItemDescription>
      </CheckboxItem>
      <CheckboxItem variant="card" className="w-full">
        <CheckboxItemControl defaultChecked />
        <CheckboxItemLabel>Assets</CheckboxItemLabel>
        <CheckboxItemDescription>The asset hierarchy and its tags.</CheckboxItemDescription>
      </CheckboxItem>
      <CheckboxItem variant="card" className="w-full">
        <CheckboxItemControl />
        <CheckboxItemLabel>Events</CheckboxItemLabel>
        <CheckboxItemDescription>Alarms, trips and shutdowns.</CheckboxItemDescription>
      </CheckboxItem>
      <CheckboxItem variant="card" className="w-full">
        <CheckboxItemControl />
        <CheckboxItemLabel>Files</CheckboxItemLabel>
        <CheckboxItemDescription>Drawings, datasheets and reports.</CheckboxItemDescription>
      </CheckboxItem>
    </CheckboxGroup>
  );
}

function CheckboxDeferredForm() {
  const saved = ['critical', 'high'];
  const [draft, setDraft] = useState(saved);
  const dirty = draft.length !== saved.length || draft.some((id) => !saved.includes(id));
  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="flex flex-col">
        <Label id="checkbox-digest-label">Alarms in the daily digest</Label>
        <CheckboxGroup aria-labelledby="checkbox-digest-label">
          {DIGEST_SEVERITIES.map((severity) => (
            <CheckboxItem key={severity.id}>
              <CheckboxItemControl
                name="severity"
                value={severity.id}
                checked={draft.includes(severity.id)}
                onCheckedChange={(checked) => setDraft(toggleIn(draft, severity.id, checked))}
              />
              <CheckboxItemLabel>{severity.label}</CheckboxItemLabel>
            </CheckboxItem>
          ))}
        </CheckboxGroup>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!dirty}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setDraft(saved)}>
          Discard
        </Button>
        {dirty ? null : <span className="text-sm text-muted-foreground">No unsaved changes.</span>}
      </div>
    </form>
  );
}

export default definePage({
  id: 'checkbox',
  title: 'Checkbox',
  summary:
    'Checkboxes select any number of independent options. The choice takes effect when the form is submitted, not at the moment it is ticked.',
  docsSlug: 'checkbox',
  guidance: {
    use: [
      'Several options that can be on or off independently, such as visible columns or filters.',
      'A single checkbox to confirm agreement before an action.',
      'The indeterminate state on a parent when only some of its children are selected.',
      'Card items for a handful of options that each need a sentence of explanation.',
    ],
    avoid: [
      'One choice out of several — use a radio group.',
      'A setting that applies immediately — use a switch.',
      'Pre-selected options the user did not ask for.',
      'A checkbox with no label; in a table row, give it an aria-label instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'One item, a group, two orientations and the two item variants.',
      specimens: [
        {
          id: 'CheckboxSingle',
          title: 'Single item',
          note: 'One optional extra on a form; a lone checkbox otherwise only confirms agreement.',
          origin: 'aura',
          Component: CheckboxSingle,
        },
        {
          id: 'CheckboxGroupVertical',
          title: 'Vertical group',
          note: 'The default for a list of options: easy to scan and room for long labels.',
          origin: 'aura',
          Component: CheckboxGroupVertical,
        },
        {
          id: 'CheckboxGroupHorizontal',
          title: 'Horizontal group',
          note: 'Two to four short options where vertical space is tight, such as a filter row.',
          origin: 'aura',
          Component: CheckboxGroupHorizontal,
        },
        {
          id: 'CheckboxWithDescription',
          title: 'With description',
          note: 'Options whose label alone does not say what ticking them does.',
          origin: 'aura',
          Component: CheckboxWithDescription,
        },
        {
          id: 'CheckboxCard',
          title: 'Card items',
          note: 'A short list of weighty options where the whole card should be the target.',
          origin: 'aura',
          Component: CheckboxCard,
        },
        {
          id: 'CheckboxCardLabelOnly',
          title: 'Card items, label only',
          note: 'Two or three peer options side by side that need a large target but no explanation.',
          origin: 'aura',
          align: 'stretch',
          Component: CheckboxCardLabelOnly,
        },
      ],
    },
    {
      id: 'content',
      title: 'Labels and content',
      description: 'How the group is named and what an item can carry.',
      specimens: [
        {
          id: 'CheckboxGroupWithLabel',
          title: 'Group label and helper text',
          note: 'A group inside a form: the label names the question, the helper text adds the consequence.',
          origin: 'aura',
          Component: CheckboxGroupWithLabel,
        },
        {
          id: 'CheckboxLongLabel',
          title: 'Wrapping label',
          note: 'Long labels wrap under themselves and the box stays on the first line.',
          origin: 'aura',
          Component: CheckboxLongLabel,
        },
        {
          id: 'CheckboxWithBadge',
          title: 'Label with badge',
          note: 'Flags one option as new, beta or limited without changing its label.',
          origin: 'aura',
          Component: CheckboxWithBadge,
        },
        {
          id: 'CheckboxControlOnly',
          title: 'Control only',
          note: 'Row selection in tables and lists, where the row content is the visible label.',
          origin: 'aura',
          Component: CheckboxControlOnly,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Controlled, partially selected, invalid and unavailable.',
      specimens: [
        {
          id: 'CheckboxControlled',
          title: 'Controlled',
          note: 'When other UI depends on the value; tick it to see the count follow.',
          origin: 'aura',
          Component: CheckboxControlled,
        },
        {
          id: 'CheckboxIndeterminate',
          title: 'Indeterminate',
          note: 'A parent whose children are only partly selected; set from code, never by a click.',
          origin: 'aura',
          Component: CheckboxIndeterminate,
        },
        {
          id: 'CheckboxInvalid',
          title: 'Invalid',
          note: 'A required confirmation that was left unticked on submit.',
          origin: 'aura',
          Component: CheckboxInvalid,
        },
        {
          id: 'CheckboxGroupInvalid',
          title: 'Invalid group',
          note: 'A group that needs at least one selection; the error belongs to the group, not one item.',
          origin: 'aura',
          Component: CheckboxGroupInvalid,
        },
        {
          id: 'CheckboxDisabledWithReason',
          title: 'Disabled with reason',
          note: 'An option the user may not change, with the reason stated next to it.',
          origin: 'aura',
          Component: CheckboxDisabledWithReason,
        },
        {
          id: 'CheckboxLockedOn',
          title: 'Locked on',
          note: 'A mandatory option that stays visible in the list so the set reads as complete.',
          origin: 'aura',
          Component: CheckboxLockedOn,
        },
        {
          id: 'CheckboxCardDisabled',
          title: 'Disabled card item',
          note: 'An unavailable card option; its description says how to unlock it.',
          origin: 'aura',
          Component: CheckboxCardDisabled,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Checkboxes in lists, filters, popovers and confirmation steps.',
      specimens: [
        {
          id: 'CheckboxSelectAll',
          title: 'Select-all list',
          note: 'Five or more options where picking everything or nothing is common.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SelectAllCheckboxList.tsx'],
          Component: CheckboxSelectAll,
        },
        {
          id: 'CheckboxSelectAllLocked',
          title: 'Select-all with a locked option',
          note: 'Some options are out of reach: select all skips them and the count stays honest.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/SelectAllCheckboxList.tsx'],
          Component: CheckboxSelectAllLocked,
        },
        {
          id: 'CheckboxFacetFilter',
          title: 'Facet filter with counts',
          note: 'A filter rail where each option shows how many results it would add.',
          origin: 'custom',
          Component: CheckboxFacetFilter,
        },
        {
          id: 'CheckboxInPopover',
          title: 'Column picker in a popover',
          note: 'Options used now and then; the trigger shows how many are on. Click to open.',
          origin: 'custom',
          Component: CheckboxInPopover,
        },
        {
          id: 'CheckboxCardGrid',
          title: 'Card grid',
          note: 'Four card options in two columns, for a setup step with room to spare.',
          origin: 'aura',
          size: 'md',
          Component: CheckboxCardGrid,
        },
        {
          id: 'CheckboxRowSelection',
          title: 'Row selection',
          note: 'Bulk actions on a list: a header checkbox selects every row and shows partial selection.',
          origin: 'custom',
          size: 'md',
          Component: CheckboxRowSelection,
        },
        {
          id: 'CheckboxConfirmDelete',
          title: 'Confirm before deleting',
          note: 'An irreversible action that should take one deliberate extra step.',
          origin: 'custom',
          size: 'md',
          Component: CheckboxConfirmDelete,
        },
        {
          id: 'CheckboxDeferredForm',
          title: 'Saved with the form',
          note: 'Settings that apply on save: tick freely, then commit or discard.',
          origin: 'custom',
          size: 'md',
          Component: CheckboxDeferredForm,
        },
      ],
    },
  ],
});
