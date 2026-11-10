import { Button } from '@cognite/aura/components/button';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@cognite/aura/components/select';
import {
  IconClock,
  IconDroplet,
  IconGauge,
  IconMapPin,
  IconRefresh,
  IconTemperature,
  IconWaveSine,
} from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { ASSETS, SITES, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './select.tsx?raw';

const SITE_ITEMS = SITES.map((site) => ({ value: site.id, label: site.name }));

const AREA_ITEMS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system').map((asset) => ({
  value: asset.id,
  label: asset.name,
}));

const PRIORITY_ITEMS = [
  { value: 'P1', label: 'P1 – within 24 hours' },
  { value: 'P2', label: 'P2 – within 7 days' },
  { value: 'P3', label: 'P3 – next planned stop' },
  { value: 'P4', label: 'P4 – when convenient' },
];

const STATUS_ITEMS = [
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
].map((status) => ({
  ...status,
  count: WORK_ORDERS.filter((workOrder) => workOrder.status === status.value).length,
}));

const RANGE_ITEMS = [
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const AGGREGATE_ITEMS = [
  { value: 'average', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Count' },
];

const GRANULARITY_ITEMS = [
  { value: '1m', label: '1 minute' },
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
];

const MEASUREMENT_ITEMS = [
  { value: 'pressure', label: 'Pressure', unit: 'barg' },
  { value: 'temperature', label: 'Temperature', unit: '°C' },
  { value: 'flow', label: 'Flow', unit: 'Sm³/h' },
  { value: 'vibration', label: 'Vibration', unit: 'mm/s' },
];

const PAGE_SIZE_ITEMS = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

const SCHEDULE_ITEMS = [
  { value: 'continuous', label: 'Continuous' },
  { value: 'every-15-minutes', label: 'Every 15 minutes, aligned to the quarter hour' },
  { value: 'daily', label: 'Daily at 02:00 Central European Time' },
];

function assetsIn(areaId: string) {
  return ASSETS.filter((asset) => asset.parentId === areaId).map((asset) => ({
    value: asset.id,
    label: `${asset.tag} ${asset.name}`,
  }));
}

function SelectDefault() {
  return (
    <Select items={SITE_ITEMS}>
      <SelectTrigger aria-label="Site">
        <SelectValue placeholder="Select a site" />
      </SelectTrigger>
      <SelectContent>
        {SITE_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SelectWithValue() {
  return (
    <Select items={SITE_ITEMS} defaultValue="nordkapp">
      <SelectTrigger aria-label="Site">
        <SelectValue placeholder="Select a site" />
      </SelectTrigger>
      <SelectContent>
        {SITE_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SelectClearable() {
  return (
    <Select items={AREA_ITEMS} defaultValue="nk-23" clearable>
      <SelectTrigger aria-label="Area" clearLabel="Clear area">
        <SelectValue placeholder="All areas" />
      </SelectTrigger>
      <SelectContent>
        {AREA_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SelectMultiple() {
  return (
    <Select items={AGGREGATE_ITEMS} multiple defaultValue={['average', 'max']}>
      <SelectTrigger aria-label="Aggregates">
        <SelectValue placeholder="Select aggregates" />
      </SelectTrigger>
      <SelectContent>
        {AGGREGATE_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SelectWithLabel() {
  const id = useId();
  return (
    <div className="flex w-full flex-col">
      <Label htmlFor={id}>Granularity</Label>
      <Select items={GRANULARITY_ITEMS} defaultValue="1h">
        <SelectTrigger id={id} aria-describedby={`${id}-help`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRANULARITY_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <HelperText id={`${id}-help`}>Finer granularity takes longer to load.</HelperText>
    </div>
  );
}

function SelectGrouped() {
  return (
    <Select
      items={[
        { value: '23-ka-9101', label: '1st stage compressor' },
        { value: '23-ka-9102', label: '2nd stage compressor' },
        { value: '27-pa-2001a', label: 'Export pump A' },
        { value: '27-pa-2001b', label: 'Export pump B' },
      ]}
      defaultValue="23-ka-9101"
    >
      <SelectTrigger aria-label="Asset">
        <SelectValue placeholder="Select an asset" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Gas compression</SelectLabel>
          <SelectItem value="23-ka-9101">1st stage compressor</SelectItem>
          <SelectItem value="23-ka-9102">2nd stage compressor</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Gas export</SelectLabel>
          <SelectItem value="27-pa-2001a">Export pump A</SelectItem>
          <SelectItem value="27-pa-2001b">Export pump B</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SelectItemIcons() {
  return (
    <Select items={MEASUREMENT_ITEMS} defaultValue="pressure">
      <SelectTrigger aria-label="Measurement">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pressure" icon={<IconGauge />}>
          Pressure
        </SelectItem>
        <SelectItem value="temperature" icon={<IconTemperature />}>
          Temperature
        </SelectItem>
        <SelectItem value="flow" icon={<IconDroplet />}>
          Flow
        </SelectItem>
        <SelectItem value="vibration" icon={<IconWaveSine />}>
          Vibration
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function SelectItemSuffix() {
  return (
    <Select items={MEASUREMENT_ITEMS} defaultValue="pressure">
      <SelectTrigger aria-label="Measurement">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MEASUREMENT_ITEMS.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            suffix={<span className="text-xs text-muted-foreground">{item.unit}</span>}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SelectValueIcon() {
  return (
    <Select items={RANGE_ITEMS} defaultValue="24h">
      <SelectTrigger aria-label="Time range">
        <SelectValue icon={<IconClock />} />
      </SelectTrigger>
      <SelectContent>
        {RANGE_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SelectDisabledOption() {
  return (
    <Select items={GRANULARITY_ITEMS} defaultValue="1h">
      <SelectTrigger aria-label="Granularity">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          value="1m"
          disabled
          suffix={<span className="text-xs text-base-foreground-disabled">Max 24 hours</span>}
        >
          1 minute
        </SelectItem>
        <SelectItem value="1h">1 hour</SelectItem>
        <SelectItem value="1d">1 day</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SelectTruncated() {
  return (
    <div className="w-52">
      <Select items={SCHEDULE_ITEMS} defaultValue="every-15-minutes">
        <SelectTrigger aria-label="Schedule">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCHEDULE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SelectFullWidth() {
  const id = useId();
  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label htmlFor={id}>Priority</Label>
      <Select items={PRIORITY_ITEMS} defaultValue="P2">
        <SelectTrigger id={id} className="max-w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SelectRequired() {
  const id = useId();
  return (
    <div className="flex w-full flex-col">
      <Label htmlFor={id} required>
        Site
      </Label>
      <Select items={SITE_ITEMS} required name="site">
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select a site" />
        </SelectTrigger>
        <SelectContent>
          {SITE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SelectInvalid() {
  const id = useId();
  const [site, setSite] = useState('');
  return (
    <div className="flex w-full flex-col">
      <Label htmlFor={id} required>
        Site
      </Label>
      <Select items={SITE_ITEMS} required value={site} onValueChange={setSite}>
        <SelectTrigger id={id} errorMessage={site === '' ? 'Select the site the work order belongs to.' : undefined}>
          <SelectValue placeholder="Select a site" />
        </SelectTrigger>
        <SelectContent>
          {SITE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SelectDisabledWithReason() {
  const id = useId();
  return (
    <div className="group flex w-full flex-col" data-disabled="true">
      <Label htmlFor={id}>Write mode</Label>
      <Select items={[{ value: 'append', label: 'Append' }]} defaultValue="append" disabled>
        <SelectTrigger id={id} aria-describedby={`${id}-reason`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="append">Append</SelectItem>
        </SelectContent>
      </Select>
      <HelperText id={`${id}-reason`}>Stop the pipeline to change its write mode.</HelperText>
    </div>
  );
}

function SelectReadOnly() {
  const id = useId();
  return (
    <div className="flex w-full flex-col">
      <Label htmlFor={id}>Source system</Label>
      <Select items={[{ value: 'sap', label: 'SAP Plant Maintenance' }]} defaultValue="sap" readOnly>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sap">SAP Plant Maintenance</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function SelectLoadingOptions() {
  const id = useId();
  return (
    <div className="group flex w-full flex-col" data-disabled="true" aria-busy="true">
      <Label htmlFor={id}>Data set</Label>
      <Select disabled>
        <SelectTrigger id={id} aria-describedby={`${id}-status`}>
          <SelectValue placeholder="Loading data sets…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="loading" disabled>
            Loading data sets…
          </SelectItem>
        </SelectContent>
      </Select>
      <HelperText id={`${id}-status`}>Fetching the data sets you can write to.</HelperText>
    </div>
  );
}

function SelectFilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select items={SITE_ITEMS} defaultValue="nordkapp">
        <SelectTrigger aria-label="Site" className="w-40 min-w-0">
          <SelectValue icon={<IconMapPin />} />
        </SelectTrigger>
        <SelectContent>
          {SITE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select items={STATUS_ITEMS} clearable>
        <SelectTrigger aria-label="Status" clearLabel="Clear status" className="w-40 min-w-0">
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ITEMS.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              suffix={<span className="text-xs tabular-nums text-muted-foreground">{item.count}</span>}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select items={RANGE_ITEMS} defaultValue="7d">
        <SelectTrigger aria-label="Due within" className="w-40 min-w-0">
          <SelectValue icon={<IconClock />} />
        </SelectTrigger>
        <SelectContent>
          {RANGE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost">
        <IconRefresh /> Reset
      </Button>
    </div>
  );
}

function SelectMultipleSummary() {
  const id = useId();
  const [sites, setSites] = useState(['nordkapp', 'hammerfest', 'stord']);
  return (
    <div className="flex w-full flex-col">
      <Label htmlFor={id}>Sites in this dashboard</Label>
      <Select items={SITE_ITEMS} multiple clearable value={sites} onValueChange={setSites}>
        <SelectTrigger id={id} clearLabel="Clear sites">
          <SelectValue placeholder="All sites">
            {(value: string[]) =>
              value.length > 2
                ? `${value.length} sites`
                : SITE_ITEMS.filter((item) => value.includes(item.value))
                    .map((item) => item.label)
                    .join(', ')
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SITE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SelectDependent() {
  const id = useId();
  const [area, setArea] = useState('');
  const [asset, setAsset] = useState('');
  const assetItems = assetsIn(area);
  return (
    <div className="grid w-full max-w-lg grid-cols-2 gap-4">
      <div className="flex w-full flex-col">
        <Label htmlFor={`${id}-area`}>Area</Label>
        <Select
          items={AREA_ITEMS}
          value={area}
          onValueChange={(next) => {
            setArea(next);
            setAsset('');
          }}
        >
          <SelectTrigger id={`${id}-area`} className="min-w-0">
            <SelectValue placeholder="Select an area" />
          </SelectTrigger>
          <SelectContent>
            {AREA_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="group flex flex-col" data-disabled={area === '' ? 'true' : undefined}>
        <Label htmlFor={`${id}-asset`}>Asset</Label>
        <Select items={assetItems} value={asset} onValueChange={setAsset} disabled={area === ''}>
          <SelectTrigger id={`${id}-asset`} aria-describedby={`${id}-asset-help`} className="min-w-0">
            <SelectValue placeholder="Select an asset" />
          </SelectTrigger>
          <SelectContent>
            {assetItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <HelperText id={`${id}-asset-help`}>
          {area === '' ? 'Select an area first.' : `${assetItems.length} assets in this area.`}
        </HelperText>
      </div>
    </div>
  );
}

function SelectFormRow() {
  const id = useId();
  return (
    <div className="grid w-full max-w-lg grid-cols-2 gap-4">
      <div className="flex w-full flex-col">
        <Label htmlFor={`${id}-aggregate`}>Aggregate</Label>
        <Select items={AGGREGATE_ITEMS} defaultValue="average">
          <SelectTrigger id={`${id}-aggregate`} className="min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGGREGATE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full flex-col">
        <Label htmlFor={`${id}-granularity`}>Granularity</Label>
        <Select items={GRANULARITY_ITEMS} defaultValue="1h">
          <SelectTrigger id={`${id}-granularity`} className="min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SelectRowsPerPage() {
  const id = useId();
  const [size, setSize] = useState('25');
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        Rows per page
      </label>
      <Select items={PAGE_SIZE_ITEMS} value={size} onValueChange={setSize}>
        <SelectTrigger id={id} className="w-20 min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {PAGE_SIZE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm tabular-nums text-muted-foreground">1–{size} of 243</span>
    </div>
  );
}

function SelectInSentence() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-base-foreground">
      Raise an alarm when the
      <Select items={AGGREGATE_ITEMS} defaultValue="max">
        <SelectTrigger aria-label="Aggregate" className="w-32 min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AGGREGATE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      over the
      <Select items={RANGE_ITEMS} defaultValue="1h">
        <SelectTrigger aria-label="Window" className="w-36 min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      is above 52 barg.
    </div>
  );
}

export default definePage({
  id: 'select',
  title: 'Select',
  summary:
    'A select picks one or several options from a short, familiar list that opens on demand. It keeps a form compact when the options do not need to stay visible.',
  docsSlug: 'select',
  guidance: {
    use: [
      'Roughly five to twelve familiar options, in a form or a filter.',
      'A label and a placeholder that says what to pick, not "Select…".',
      'Groups with labels when the list has natural sections.',
      'Clearable for optional filters, so "no choice" is one click away.',
    ],
    avoid: [
      'More than about twelve options, or any need to search — use a combobox.',
      'Two or three options that fit on screen — use a radio group.',
      'Options that need a sentence of explanation each.',
      'A default the user might submit without noticing.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'Empty, filled, clearable and multi-select triggers. Click any of them to open the list.',
      specimens: [
        {
          id: 'SelectDefault',
          title: 'With placeholder',
          note: 'No safe default exists: the placeholder says what kind of thing to pick.',
          origin: 'aura',
          Component: SelectDefault,
        },
        {
          id: 'SelectWithValue',
          title: 'With default value',
          note: 'One option is right for most users; preselect it and let the rest change it.',
          origin: 'aura',
          Component: SelectWithValue,
        },
        {
          id: 'SelectClearable',
          title: 'Clearable',
          note: 'An optional choice: the clear button returns it to empty without opening the list.',
          origin: 'aura',
          Component: SelectClearable,
        },
        {
          id: 'SelectMultiple',
          title: 'Multiple',
          note: 'Several options from a short list; the list stays open while picking.',
          origin: 'aura',
          Component: SelectMultiple,
        },
      ],
    },
    {
      id: 'content',
      title: 'Labels and options',
      description: 'What the field and its options can carry.',
      specimens: [
        {
          id: 'SelectWithLabel',
          title: 'Label and helper text',
          note: 'The standard form field: label above, a hint about the consequence below.',
          origin: 'aura',
          Component: SelectWithLabel,
        },
        {
          id: 'SelectGrouped',
          title: 'Grouped options',
          note: 'A list with natural sections; group labels make eight options scan like four.',
          origin: 'aura',
          Component: SelectGrouped,
        },
        {
          id: 'SelectItemIcons',
          title: 'Options with icons',
          note: 'Options that have a familiar symbol users recognise faster than the word.',
          origin: 'aura',
          Component: SelectItemIcons,
        },
        {
          id: 'SelectItemSuffix',
          title: 'Options with a suffix',
          note: 'A unit, count or shortcut that helps tell options apart without lengthening labels.',
          origin: 'aura',
          Component: SelectItemSuffix,
        },
        {
          id: 'SelectValueIcon',
          title: 'Icon in the trigger',
          note: 'An unlabelled select in a toolbar: the icon says what kind of value it holds.',
          origin: 'aura',
          Component: SelectValueIcon,
        },
        {
          id: 'SelectDisabledOption',
          title: 'Disabled option',
          note: 'An option that exists but does not apply now; the suffix says why.',
          origin: 'aura',
          Component: SelectDisabledOption,
        },
        {
          id: 'SelectTruncated',
          title: 'Truncated value',
          note: 'A narrow column: long values end in an ellipsis and stay on one line.',
          origin: 'aura',
          Component: SelectTruncated,
        },
        {
          id: 'SelectFullWidth',
          title: 'Full width',
          note: 'A form column where every field shares the same width.',
          origin: 'aura',
          size: 'md',
          align: 'center',
          Component: SelectFullWidth,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Required, invalid, unavailable, read-only and waiting for options.',
      specimens: [
        {
          id: 'SelectRequired',
          title: 'Required',
          note: 'A choice the form cannot be submitted without; no clear button is offered.',
          origin: 'aura',
          Component: SelectRequired,
        },
        {
          id: 'SelectInvalid',
          title: 'Invalid',
          note: 'A required select left empty on submit; pick a site to clear the error.',
          origin: 'aura',
          Component: SelectInvalid,
        },
        {
          id: 'SelectDisabledWithReason',
          title: 'Disabled with reason',
          note: 'A locked field that still shows its value and what would unlock it.',
          origin: 'aura',
          Component: SelectDisabledWithReason,
        },
        {
          id: 'SelectReadOnly',
          title: 'Read-only',
          note: 'A value set elsewhere, shown in a form for context and never editable here.',
          origin: 'aura',
          Component: SelectReadOnly,
        },
        {
          id: 'SelectLoadingOptions',
          title: 'Loading options',
          note: 'Options come from the server; hold the field until they arrive.',
          origin: 'custom',
          Component: SelectLoadingOptions,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Selects in filter bars, forms, pagination and sentences.',
      specimens: [
        {
          id: 'SelectFilterBar',
          title: 'Filter bar',
          note: 'Three or four independent filters above a table, with one way to reset them.',
          origin: 'custom',
          size: 'lg',
          Component: SelectFilterBar,
        },
        {
          id: 'SelectRowsPerPage',
          title: 'Rows per page',
          note: 'A table footer: an inline label, a narrow select and the resulting range.',
          origin: 'custom',
          Component: SelectRowsPerPage,
        },
        {
          id: 'SelectInSentence',
          title: 'In a sentence',
          note: 'Rule builders, where the selects read as the variable parts of a statement.',
          origin: 'custom',
          size: 'md',
          Component: SelectInSentence,
        },
        {
          id: 'SelectMultipleSummary',
          title: 'Multiple with a summary',
          note: 'Many selections in a narrow field: show a count once the names no longer fit.',
          origin: 'custom',
          Component: SelectMultipleSummary,
        },
        {
          id: 'SelectFormRow',
          title: 'Two selects in a row',
          note: 'Closely related fields that are set together and share a line.',
          origin: 'custom',
          size: 'md',
          Component: SelectFormRow,
        },
        {
          id: 'SelectDependent',
          title: 'Dependent selects',
          note: 'The second list depends on the first; it stays disabled, with a reason, until then.',
          origin: 'custom',
          size: 'md',
          Component: SelectDependent,
        },
      ],
    },
  ],
});
