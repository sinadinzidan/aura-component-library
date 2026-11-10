import { Button } from '@cognite/aura/components/button';
import { Combobox } from '@cognite/aura/components/combobox';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { IconX } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { MultiSelectCombobox } from '../../../library/forms/MultiSelectCombobox';
import { ASSETS, PEOPLE, SENSORS, SITES } from '../../data/plant';
import { definePage } from '../../types';

import source from './combobox.tsx?raw';

// Aura's Combobox searches the option `value`, not its label, so values here are the visible text.
const option = (text: string) => ({ value: text, label: text });

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const ASSET_OPTIONS = EQUIPMENT.map((asset) => option(asset.name));

const TAGGED_ASSET_OPTIONS = EQUIPMENT.map((asset) => option(`${asset.tag} · ${asset.name}`));

const ASSET_GROUPS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system').map((area) => ({
  label: area.name,
  options: EQUIPMENT.filter((asset) => asset.parentId === area.id).map((asset) => option(asset.name)),
}));

const SENSOR_OPTIONS = SENSORS.map((sensor) => option(`${sensor.tag} · ${sensor.name}`));

const PEOPLE_OPTIONS = PEOPLE.map((person) => option(person.name));

const SITE_OPTIONS = SITES.map((site) => option(site.name));

const TIME_ZONE_OPTIONS = [
  'Europe/Oslo (UTC+01:00)',
  'Europe/London (UTC+00:00)',
  'America/Houston (UTC−06:00)',
  'Asia/Kuala_Lumpur (UTC+08:00)',
  'Australia/Perth (UTC+08:00)',
].map(option);

const MULTI_ASSET_OPTIONS = EQUIPMENT.map((asset) => ({ value: asset.id, label: asset.name }));

const MULTI_ASSET_GROUPS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system').map((area) => ({
  label: area.name,
  options: EQUIPMENT.filter((asset) => asset.parentId === area.id).map((asset) => ({
    value: asset.id,
    label: asset.name,
  })),
}));

const MULTI_PEOPLE_OPTIONS = PEOPLE.map((person) => ({ value: person.id, label: person.name }));

const STATUS_ITEMS = [
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
];

function ComboboxDefault() {
  return (
    <div className="w-56">
      <Combobox options={ASSET_OPTIONS} aria-label="Asset" className="w-56" />
    </div>
  );
}

function ComboboxWithValue() {
  const [asset, setAsset] = useState('1st stage compressor');
  return (
    <div className="w-56">
      <Combobox options={ASSET_OPTIONS} value={asset} onValueChange={setAsset} aria-label="Asset" className="w-56" />
    </div>
  );
}

function ComboboxCustomText() {
  return (
    <div className="w-56">
      <Combobox
        options={ASSET_OPTIONS}
        aria-label="Asset"
        placeholder="Select an asset"
        searchPlaceholder="Search by name"
        emptyText="No asset matches. Check the spelling."
        className="w-56"
      />
    </div>
  );
}

function ComboboxGrouped() {
  return (
    <div className="w-56">
      <Combobox
        options={ASSET_GROUPS}
        aria-label="Asset"
        placeholder="Select an asset"
        searchPlaceholder="Search assets"
        className="w-56"
      />
    </div>
  );
}

function ComboboxWide() {
  return (
    <div className="w-80 max-w-full">
      <Combobox
        options={SENSOR_OPTIONS}
        aria-label="Time series"
        placeholder="Select a time series"
        searchPlaceholder="Search by tag or name"
        className="w-80"
      />
    </div>
  );
}

function ComboboxWithLabel() {
  const id = useId();
  return (
    <div className="flex w-56 flex-col">
      <Label htmlFor={id}>Asset</Label>
      <Combobox
        id={id}
        options={ASSET_OPTIONS}
        placeholder="Select an asset"
        searchPlaceholder="Search assets"
        aria-describedby={`${id}-help`}
        className="w-56"
      />
      <HelperText id={`${id}-help`}>The work order is planned against this asset.</HelperText>
    </div>
  );
}

function ComboboxTagAndName() {
  const [asset, setAsset] = useState(TAGGED_ASSET_OPTIONS[3].value);
  return (
    <div className="w-72 max-w-full">
      <Combobox
        options={TAGGED_ASSET_OPTIONS}
        value={asset}
        onValueChange={setAsset}
        aria-label="Asset"
        placeholder="Select an asset"
        searchPlaceholder="Search by tag or name"
        className="w-72"
      />
    </div>
  );
}

function ComboboxTruncated() {
  const [sensor, setSensor] = useState(SENSOR_OPTIONS[9].value);
  return (
    <div className="w-48">
      <Combobox
        options={SENSOR_OPTIONS}
        value={sensor}
        onValueChange={setSensor}
        aria-label="Time series"
        searchPlaceholder="Search"
        className="w-48"
      />
    </div>
  );
}

function ComboboxRequired() {
  const id = useId();
  return (
    <div className="flex w-56 flex-col">
      <Label htmlFor={id} required>
        Assignee
      </Label>
      <Combobox
        id={id}
        options={PEOPLE_OPTIONS}
        placeholder="Select a person"
        searchPlaceholder="Search people"
        aria-required="true"
        className="w-56"
      />
    </div>
  );
}

function ComboboxInvalid() {
  const id = useId();
  const [asset, setAsset] = useState('');
  const invalid = asset === '';
  return (
    <div className="flex w-56 flex-col">
      <Label htmlFor={id} required>
        Asset
      </Label>
      <Combobox
        id={id}
        options={ASSET_OPTIONS}
        value={asset}
        onValueChange={setAsset}
        placeholder="Select an asset"
        searchPlaceholder="Search assets"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className="w-56"
      />
      {invalid ? (
        <HelperText id={`${id}-error`} isError>
          Select the asset this work order is for.
        </HelperText>
      ) : null}
    </div>
  );
}

function ComboboxDisabledWithReason() {
  const id = useId();
  return (
    <div className="group flex w-56 flex-col" data-disabled="true">
      <Label htmlFor={id}>Asset</Label>
      <Combobox
        id={id}
        options={ASSET_OPTIONS}
        value="Recompressor"
        disabled
        aria-describedby={`${id}-reason`}
        className="w-56"
      />
      <HelperText id={`${id}-reason`}>The asset cannot change once work has started.</HelperText>
    </div>
  );
}

function ComboboxLoadingOptions() {
  const id = useId();
  return (
    <div className="group flex w-56 flex-col" data-disabled="true" aria-busy="true">
      <Label htmlFor={id}>Time series</Label>
      <Combobox
        id={id}
        options={[]}
        disabled
        placeholder="Loading time series…"
        aria-describedby={`${id}-status`}
        className="w-56"
      />
      <HelperText id={`${id}-status`}>Fetching 13 time series for this asset.</HelperText>
    </div>
  );
}

function ComboboxMultiChips() {
  const id = useId();
  const [assets, setAssets] = useState(['23-ka-9101', '23-ka-9103']);
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor={id}>Assets to compare</Label>
      <MultiSelectCombobox
        id={id}
        options={MULTI_ASSET_OPTIONS}
        value={assets}
        onValueChange={setAssets}
        placeholder="Select assets"
        searchPlaceholder="Search assets"
      />
    </div>
  );
}

function ComboboxMultiEmpty() {
  const id = useId();
  const [people, setPeople] = useState<string[]>([]);
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor={id}>Notify</Label>
      <MultiSelectCombobox
        id={id}
        options={MULTI_PEOPLE_OPTIONS}
        value={people}
        onValueChange={setPeople}
        placeholder="Select people"
        searchPlaceholder="Search people"
        aria-describedby={`${id}-help`}
      />
      <HelperText id={`${id}-help`}>Leave empty to notify nobody.</HelperText>
    </div>
  );
}

function ComboboxMultiGrouped() {
  const id = useId();
  const [assets, setAssets] = useState(['20-va-1001', '27-pa-2001a']);
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor={id}>Assets in scope</Label>
      <MultiSelectCombobox
        id={id}
        options={MULTI_ASSET_GROUPS}
        value={assets}
        onValueChange={setAssets}
        placeholder="Select assets"
        searchPlaceholder="Search assets"
      />
    </div>
  );
}

function ComboboxMultiOverflow() {
  const id = useId();
  const [people, setPeople] = useState(['ih', 'ms', 'ak', 'tb', 'lw']);
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor={id}>Watchers</Label>
      <MultiSelectCombobox
        id={id}
        options={MULTI_PEOPLE_OPTIONS}
        value={people}
        onValueChange={setPeople}
        maxVisibleChips={2}
        searchPlaceholder="Search people"
      />
    </div>
  );
}

function ComboboxMultiCreatable() {
  const id = useId();
  const [labels, setLabels] = useState([
    { value: 'rotating', label: 'Rotating equipment' },
    { value: 'shutdown', label: 'Needs shutdown' },
    { value: 'safety', label: 'Safety critical' },
  ]);
  const [selected, setSelected] = useState(['rotating']);
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor={id}>Labels</Label>
      <MultiSelectCombobox
        id={id}
        options={labels}
        value={selected}
        onValueChange={setSelected}
        placeholder="Add labels"
        searchPlaceholder="Search or create a label"
        aria-describedby={`${id}-help`}
        onCreateOption={(label) => {
          const value = label.toLowerCase().replace(/\s+/g, '-');
          setLabels([...labels, { value, label }]);
          setSelected([...selected, value]);
        }}
      />
      <HelperText id={`${id}-help`}>Type a new name to create a label.</HelperText>
    </div>
  );
}

function ComboboxMultiInvalid() {
  const id = useId();
  const [people, setPeople] = useState<string[]>([]);
  const invalid = people.length === 0;
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor={id} required>
        Approvers
      </Label>
      <MultiSelectCombobox
        id={id}
        options={MULTI_PEOPLE_OPTIONS}
        value={people}
        onValueChange={setPeople}
        placeholder="Select approvers"
        searchPlaceholder="Search people"
        invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
      />
      {invalid ? (
        <HelperText id={`${id}-error`} isError>
          Add at least one approver.
        </HelperText>
      ) : null}
    </div>
  );
}

function ComboboxMultiDisabled() {
  const id = useId();
  return (
    <div className="group flex w-full max-w-sm flex-col" data-disabled="true">
      <Label htmlFor={id}>Assets in scope</Label>
      <MultiSelectCombobox
        id={id}
        options={MULTI_ASSET_OPTIONS}
        value={['23-ka-9101', '23-ka-9102']}
        onValueChange={() => undefined}
        disabled
        aria-describedby={`${id}-reason`}
      />
      <HelperText id={`${id}-reason`}>The scope is locked while the analysis runs.</HelperText>
    </div>
  );
}

function ComboboxWithClear() {
  const [person, setPerson] = useState(PEOPLE_OPTIONS[2].value);
  return (
    <div className="flex w-full max-w-64 items-center gap-2">
      <div className="min-w-0 flex-1">
        <Combobox
          options={PEOPLE_OPTIONS}
          value={person}
          onValueChange={setPerson}
          aria-label="Assignee"
          placeholder="Unassigned"
          searchPlaceholder="Search people"
          className="w-52"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Clear assignee"
        disabled={person === ''}
        onClick={() => setPerson('')}
      >
        <IconX />
      </Button>
    </div>
  );
}

function ComboboxFilterBar() {
  const [asset, setAsset] = useState('');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-56">
        <Combobox
          options={ASSET_GROUPS}
          value={asset}
          onValueChange={setAsset}
          aria-label="Asset"
          placeholder="Any asset"
          searchPlaceholder="Search assets"
          className="w-56"
        />
      </div>
      <Select items={STATUS_ITEMS} clearable>
        <SelectTrigger aria-label="Status" clearLabel="Clear status" className="w-40 min-w-0">
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" disabled={asset === ''} onClick={() => setAsset('')}>
        Reset
      </Button>
    </div>
  );
}

function ComboboxDependent() {
  const id = useId();
  const [site, setSite] = useState('');
  const [asset, setAsset] = useState('');
  const hasAssets = site === 'Nordkapp';
  return (
    <div className="grid w-full max-w-lg grid-cols-2 gap-4">
      <div className="flex min-w-0 flex-col">
        <Label htmlFor={`${id}-site`}>Site</Label>
        <Combobox
          id={`${id}-site`}
          options={SITE_OPTIONS}
          value={site}
          onValueChange={(next) => {
            setSite(next);
            setAsset('');
          }}
          placeholder="Select a site"
          searchPlaceholder="Search sites"
          className="w-60"
        />
      </div>
      <div className="group flex min-w-0 flex-col" data-disabled={hasAssets ? undefined : 'true'}>
        <Label htmlFor={`${id}-asset`}>Asset</Label>
        <Combobox
          id={`${id}-asset`}
          options={hasAssets ? ASSET_GROUPS : []}
          value={asset}
          onValueChange={setAsset}
          disabled={!hasAssets}
          placeholder="Select an asset"
          searchPlaceholder="Search assets"
          aria-describedby={`${id}-asset-help`}
          className="w-60"
        />
        <HelperText id={`${id}-asset-help`}>
          {site === ''
            ? 'Select a site first.'
            : hasAssets
              ? `${EQUIPMENT.length} assets at this site.`
              : 'No assets are modelled for this site yet.'}
        </HelperText>
      </div>
    </div>
  );
}

function ComboboxTimeZone() {
  const id = useId();
  const [zone, setZone] = useState(TIME_ZONE_OPTIONS[0].value);
  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-base-foreground">
          Time zone
        </label>
        <span className="text-xs text-muted-foreground">Used for every timestamp in this workspace.</span>
      </div>
      <div className="w-56 shrink-0">
        <Combobox
          id={id}
          options={TIME_ZONE_OPTIONS}
          value={zone}
          onValueChange={(next) => setZone(next === '' ? zone : next)}
          searchPlaceholder="Search time zones"
          className="w-56"
        />
      </div>
    </div>
  );
}

function ComboboxWorkOrderForm() {
  const id = useId();
  const [asset, setAsset] = useState('Recompressor');
  const [people, setPeople] = useState(['tb', 'ak']);
  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-muted-background p-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-col">
        <Label htmlFor={`${id}-asset`} required>
          Asset
        </Label>
        <Combobox
          id={`${id}-asset`}
          options={ASSET_GROUPS}
          value={asset}
          onValueChange={setAsset}
          placeholder="Select an asset"
          searchPlaceholder="Search assets"
          className="w-80"
        />
      </div>
      <div className="flex flex-col">
        <Label htmlFor={`${id}-people`}>Assigned to</Label>
        <MultiSelectCombobox
          id={`${id}-people`}
          options={MULTI_PEOPLE_OPTIONS}
          value={people}
          onValueChange={setPeople}
          placeholder="Select people"
          searchPlaceholder="Search people"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={asset === ''}>
          Create work order
        </Button>
      </div>
    </form>
  );
}

export default definePage({
  id: 'combobox',
  title: 'Combobox',
  summary:
    'A combobox is a select you can type in. Search narrows a long list, so users who roughly know what they want reach it in a few keystrokes.',
  docsSlug: 'combobox',
  guidance: {
    use: [
      'More than about twelve options, where typing beats scrolling.',
      'Options users know by name: assets, tags, people, time zones.',
      'Groups for long lists with natural sections.',
      'Search placeholder and empty text that say what can be searched.',
    ],
    avoid: [
      'Short lists — use a select, radio group or checkboxes.',
      'Users who do not know the options and need to browse them all.',
      'Thousands of options loaded up front; filter on the server or use a data grid.',
      'Icons or badges in front of option labels; checkmarks sit on the right.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'Single-select triggers. Click any of them to open the searchable list.',
      specimens: [
        {
          id: 'ComboboxDefault',
          title: 'Default',
          note: 'A long flat list with the stock placeholder and search text.',
          origin: 'aura',
          Component: ComboboxDefault,
        },
        {
          id: 'ComboboxWithValue',
          title: 'With value',
          note: 'Controlled, with a selection; picking the same option again clears it.',
          origin: 'aura',
          Component: ComboboxWithValue,
        },
        {
          id: 'ComboboxCustomText',
          title: 'Custom placeholder and empty text',
          note: 'Wording that says what to pick, what the search covers and what to do when nothing matches.',
          origin: 'aura',
          Component: ComboboxCustomText,
        },
        {
          id: 'ComboboxGrouped',
          title: 'Grouped options',
          note: 'A long list with natural sections; search keeps the group headings.',
          origin: 'aura',
          Component: ComboboxGrouped,
        },
        {
          id: 'ComboboxWide',
          title: 'Wide',
          note: 'Long option labels: set the same width on trigger and list so neither truncates.',
          origin: 'aura',
          Component: ComboboxWide,
        },
      ],
    },
    {
      id: 'content',
      title: 'Labels and options',
      description: 'Naming the field and writing options that search well.',
      specimens: [
        {
          id: 'ComboboxWithLabel',
          title: 'Label and helper text',
          note: 'The standard form field: label above, a hint about the consequence below.',
          origin: 'aura',
          Component: ComboboxWithLabel,
        },
        {
          id: 'ComboboxTagAndName',
          title: 'Tag and name options',
          note: 'Items known by a code and a name: put both in the label so either can be searched.',
          origin: 'aura',
          Component: ComboboxTagAndName,
        },
        {
          id: 'ComboboxTruncated',
          title: 'Truncated value',
          note: 'A narrow column: the selected label ends in an ellipsis and stays on one line.',
          origin: 'aura',
          Component: ComboboxTruncated,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Required, invalid, unavailable and waiting for options.',
      specimens: [
        {
          id: 'ComboboxRequired',
          title: 'Required',
          note: 'A field the form cannot be submitted without.',
          origin: 'aura',
          Component: ComboboxRequired,
        },
        {
          id: 'ComboboxInvalid',
          title: 'Invalid',
          note: 'A required combobox left empty on submit; pick an asset to clear the error.',
          origin: 'aura',
          Component: ComboboxInvalid,
        },
        {
          id: 'ComboboxDisabledWithReason',
          title: 'Disabled with reason',
          note: 'A locked field that still shows its value and why it cannot change.',
          origin: 'aura',
          Component: ComboboxDisabledWithReason,
        },
        {
          id: 'ComboboxLoadingOptions',
          title: 'Loading options',
          note: 'Options come from the server; hold the field until they arrive.',
          origin: 'custom',
          Component: ComboboxLoadingOptions,
        },
      ],
    },
    {
      id: 'multi-select',
      title: 'Multi-select with chips',
      description:
        'A reusable multi-select built from the same popover and command list. Picks show as removable chips.',
      specimens: [
        {
          id: 'ComboboxMultiChips',
          title: 'Chips',
          note: 'Several picks from a long list; each chip removes itself and the list stays open while picking.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: ComboboxMultiChips,
        },
        {
          id: 'ComboboxMultiEmpty',
          title: 'Empty with placeholder',
          note: 'An optional multi-select before anything is picked.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: ComboboxMultiEmpty,
        },
        {
          id: 'ComboboxMultiGrouped',
          title: 'Grouped options',
          note: 'Picking across sections of a long list, such as assets from several areas.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: ComboboxMultiGrouped,
        },
        {
          id: 'ComboboxMultiOverflow',
          title: 'Collapsed chips',
          note: 'Many selections in a field that must stay one line high: show two, count the rest.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: ComboboxMultiOverflow,
        },
        {
          id: 'ComboboxMultiCreatable',
          title: 'Create new options',
          note: 'Free-form tags: a search term that matches nothing can be added as a new option.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: ComboboxMultiCreatable,
        },
        {
          id: 'ComboboxMultiInvalid',
          title: 'Invalid',
          note: 'A required multi-select with nothing picked; add one to clear the error.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: ComboboxMultiInvalid,
        },
        {
          id: 'ComboboxMultiDisabled',
          title: 'Disabled with reason',
          note: 'Selections shown for reference; chips lose their remove buttons.',
          origin: 'custom',
          size: 'md',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: ComboboxMultiDisabled,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Comboboxes in filter bars, settings and forms.',
      specimens: [
        {
          id: 'ComboboxFilterBar',
          title: 'Filter bar',
          note: 'A long-list filter next to short-list filters; combobox for assets, select for status.',
          origin: 'custom',
          size: 'lg',
          Component: ComboboxFilterBar,
        },
        {
          id: 'ComboboxWithClear',
          title: 'With clear button',
          note: 'An optional pick such as an assignee: one click returns it to empty.',
          origin: 'custom',
          Component: ComboboxWithClear,
        },
        {
          id: 'ComboboxTimeZone',
          title: 'Settings row',
          note: 'A preference with dozens of options and no empty state, such as a time zone.',
          origin: 'custom',
          size: 'md',
          Component: ComboboxTimeZone,
        },
        {
          id: 'ComboboxDependent',
          title: 'Dependent comboboxes',
          note: 'The second list depends on the first and says why while it is unavailable.',
          origin: 'custom',
          size: 'md',
          Component: ComboboxDependent,
        },
        {
          id: 'ComboboxWorkOrderForm',
          title: 'Single and multi in a form',
          note: 'One asset, several people: the two patterns side by side in a create dialog.',
          origin: 'custom',
          size: 'md',
          Component: ComboboxWorkOrderForm,
        },
      ],
    },
  ],
});
