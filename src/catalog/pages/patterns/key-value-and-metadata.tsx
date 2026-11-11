import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CodeBlock, CodeBlockCopyButton } from '@cognite/aura/components/code-block';
import { Search } from '@cognite/aura/components/search';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowRight, IconDatabase, IconPlus, IconTimeline } from '@cognite/aura/icons';
import { useState } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { InlineEditText } from '../../../library/forms/InlineEditText';
import { formatReading, formatValue } from '../../../library/industrial/status';
import { InfoTooltip } from '../../../library/overlays/InfoTooltip';
import { ShowMore } from '../../../library/overlays/ShowMore';
import { TruncatedText } from '../../../library/overlays/TruncatedText';
import type { KeyValuePair } from '../../../library/patterns/content/duplicateKeys';
import { KeyValueDiff } from '../../../library/patterns/content/KeyValueDiff';
import { KeyValueEditor } from '../../../library/patterns/content/KeyValueEditor';
import { CollapsibleSection } from '../../../library/patterns/structure/CollapsibleSection';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import type { Property } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { ASSETS, PEOPLE, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { DAY, MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatDateTime, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './key-value-and-metadata.tsx?raw';

const KEY_VALUE_COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];
const KEY_VALUE_AREA = findAsset(KEY_VALUE_COMPRESSOR.parentId ?? '') ?? ASSETS[0];
const KEY_VALUE_PRESSURE = SENSORS[0];
const KEY_VALUE_ORDER = WORK_ORDERS[0];
const KEY_VALUE_ENGINEER = PEOPLE[2];

const KEY_VALUE_ASSET: readonly Property[] = [
  { label: 'Type', value: 'Centrifugal compressor' },
  { label: 'Area', value: KEY_VALUE_AREA.name },
  { label: 'Criticality', value: KEY_VALUE_COMPRESSOR.criticality },
  { label: 'Manufacturer', value: 'Nordic Turbo' },
  { label: 'Commissioned', value: '14 Jun 2014' },
  { label: 'Last inspection', value: formatDate(REFERENCE_NOW - 41 * DAY) },
];

const KEY_VALUE_SERIES_BEFORE: Readonly<Record<string, string>> = {
  unit: 'barg',
  description: 'Discharge pressure, 1st stage compressor',
  highLimit: '52',
  highHighLimit: '55',
  source: 'PI',
  sourceTag: 'NK.23PT92531.PV',
  calibrated: '2025-03-18',
};

const KEY_VALUE_SERIES_AFTER: Readonly<Record<string, string>> = {
  unit: 'barg',
  description: 'Discharge pressure, 1st stage compressor',
  highLimit: '50',
  highHighLimit: '55',
  sourceTag: 'NK.23PT92531.PV',
  calibrated: '2025-11-04',
  owner: 'Rotating equipment',
};

const KEY_VALUE_JSON = JSON.stringify(
  {
    externalId: KEY_VALUE_PRESSURE.tag,
    name: KEY_VALUE_PRESSURE.name,
    unit: KEY_VALUE_PRESSURE.unit,
    isStep: false,
    assetExternalId: KEY_VALUE_COMPRESSOR.tag,
    metadata: KEY_VALUE_SERIES_AFTER,
  },
  null,
  2
);

const KEY_VALUE_TABLE = [
  { key: 'externalId', value: KEY_VALUE_PRESSURE.tag, type: 'string', mono: true },
  { key: 'unit', value: KEY_VALUE_PRESSURE.unit, type: 'string', mono: false },
  { key: 'isStep', value: 'false', type: 'boolean', mono: true },
  { key: 'highLimit', value: '50', type: 'number', mono: false },
  { key: 'highHighLimit', value: '55', type: 'number', mono: false },
  { key: 'calibrated', value: '2025-11-04', type: 'date', mono: false },
  { key: 'owner', value: 'Rotating equipment', type: 'string', mono: false },
] as const;

const KEY_VALUE_TECHNICAL: readonly Property[] = [
  { label: 'Rated power', value: '8,400 kW' },
  { label: 'Design pressure', value: '62.0 barg' },
  { label: 'Design temperature', value: '180 °C' },
  { label: 'Rated speed', value: '10,500 rpm' },
  { label: 'Stages', value: 5 },
  { label: 'Seal type', value: 'Dry gas, tandem' },
  { label: 'Driver', value: '23-GT-9001' },
  { label: 'Lube oil', value: 'ISO VG 32' },
  { label: 'Weight', value: '18,200 kg' },
  { label: 'Serial number', value: 'NT-5-140611-A' },
  { label: 'Purchase order', value: 'PO-2013-00418' },
  { label: 'Warranty', value: 'Expired 2017' },
];

function keyValueMetaMiddle(text: string, head: number, tail: number): string {
  return text.length <= head + tail + 1 ? text : `${text.slice(0, head)}…${text.slice(text.length - tail)}`;
}

function KeyValueMetaTwoColumn() {
  return (
    <div className="w-full max-w-md">
      <PropertyList items={KEY_VALUE_ASSET} />
    </div>
  );
}

function KeyValueMetaStacked() {
  return <PropertyList items={KEY_VALUE_ASSET} layout="stacked" columns={2} />;
}

function KeyValueMetaInlineRow() {
  return (
    <div className="flex w-full flex-col gap-2">
      <h3 className="text-xl font-semibold tracking-tight text-base-foreground">{KEY_VALUE_ORDER.title}</h3>
      <MetadataList
        layout="inline"
        items={[
          { label: 'Work order', value: <span className="font-mono text-xs">{KEY_VALUE_ORDER.id}</span> },
          { label: 'Priority', value: KEY_VALUE_ORDER.priority },
          { label: 'Due', value: formatDateTime(KEY_VALUE_ORDER.dueAt) },
          { label: 'Assignee', value: findPerson(KEY_VALUE_ORDER.assigneeId)?.name },
        ]}
      />
    </div>
  );
}

function KeyValueMetaRightAligned() {
  return (
    <div className="w-full max-w-xs">
      <MetadataList
        items={[
          { label: 'Low limit', value: formatReading(KEY_VALUE_PRESSURE.lowLimit, KEY_VALUE_PRESSURE.unit, 1) },
          { label: 'High limit', value: formatReading(KEY_VALUE_PRESSURE.highLimit, KEY_VALUE_PRESSURE.unit, 1) },
          { label: 'Trip limit', value: formatReading(KEY_VALUE_PRESSURE.highHighLimit ?? 0, KEY_VALUE_PRESSURE.unit, 1) },
          { label: 'Range', value: `${KEY_VALUE_PRESSURE.rangeMin} to ${KEY_VALUE_PRESSURE.rangeMax} ${KEY_VALUE_PRESSURE.unit}` },
        ]}
      />
    </div>
  );
}

function KeyValueMetaFactGrid() {
  return (
    <PropertyList
      layout="stacked"
      columns={3}
      items={[
        { label: 'Functional location', value: <span className="font-mono text-xs">{KEY_VALUE_COMPRESSOR.tag}</span> },
        { label: 'Area', value: KEY_VALUE_AREA.name },
        { label: 'State', value: <StatusBadge status={KEY_VALUE_COMPRESSOR.state} /> },
        { label: 'Health score', value: <span className="tabular-nums">{KEY_VALUE_COMPRESSOR.healthScore} of 100</span> },
        { label: 'Criticality', value: KEY_VALUE_COMPRESSOR.criticality },
        { label: 'Open work orders', value: <span className="tabular-nums">1</span> },
      ]}
    />
  );
}

function KeyValueMetaDense() {
  return (
    <div className="w-full max-w-xs">
      <PropertyList dense items={KEY_VALUE_TECHNICAL.slice(0, 7)} />
    </div>
  );
}

function KeyValueMetaCopyable() {
  return (
    <div className="w-full max-w-md">
      <PropertyList
        items={[
          {
            label: 'External ID',
            value: <span className="font-mono text-xs">{KEY_VALUE_PRESSURE.tag}</span>,
            action: <CopyButton variant="ghost" size="icon-sm" text={KEY_VALUE_PRESSURE.tag} label="Copy external ID" iconOnly />,
          },
          {
            label: 'ID',
            value: <span className="font-mono text-xs tabular-nums">4827151093357264</span>,
            action: <CopyButton variant="ghost" size="icon-sm" text="4827151093357264" label="Copy ID" iconOnly />,
          },
          {
            label: 'Asset tag',
            value: <span className="font-mono text-xs">{KEY_VALUE_COMPRESSOR.tag}</span>,
            action: <CopyButton variant="ghost" size="icon-sm" text={KEY_VALUE_COMPRESSOR.tag} label="Copy asset tag" iconOnly />,
          },
          { label: 'Name', value: KEY_VALUE_PRESSURE.name },
        ]}
      />
    </div>
  );
}

function KeyValueMetaUnitTimestamp() {
  const readings = SENSORS.filter((sensor) => sensor.assetId === KEY_VALUE_COMPRESSOR.id).slice(0, 4);

  return (
    <dl className="flex w-full max-w-md flex-col gap-3 text-sm">
      {readings.map((sensor, index) => (
        <div key={sensor.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-4">
          <dt className="min-w-0 text-muted-foreground">{sensor.name}</dt>
          <dd className="text-right tabular-nums text-base-foreground">
            <span className="font-medium">{formatValue(sensor.value, sensor.decimals)}</span>{' '}
            <span className="text-muted-foreground">{sensor.unit}</span>
          </dd>
          <dd className="w-12 text-right text-xs tabular-nums text-muted-foreground">{formatTime(REFERENCE_NOW - (index + 1) * MINUTE)}</dd>
        </div>
      ))}
    </dl>
  );
}

function KeyValueMetaLongValues() {
  const url = 'https://nordkapp.example.test/files/engineering/nk-23/pids/pid-23-ka-9101-rev-c.pdf';

  return (
    <div className="w-full max-w-md">
      <PropertyList
        items={[
          {
            label: 'Description',
            value:
              'First stage of the export gas compression train. Takes gas from the inlet separator at 12 barg and delivers it to the interstage cooler at 48 barg.',
          },
          {
            label: 'Source tag',
            value: (
              <span className="block max-w-40 font-mono text-xs">
                <TruncatedText text="NK.PROCESS.COMPRESSION.TRAIN1.STAGE1.23PT92531.PV" />
              </span>
            ),
            action: <CopyButton variant="ghost" size="icon-sm" text="NK.PROCESS.COMPRESSION.TRAIN1.STAGE1.23PT92531.PV" label="Copy source tag" iconOnly />,
          },
          {
            label: 'Drawing',
            value: (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={url}
                      className="whitespace-nowrap rounded-sm font-mono text-xs text-link-foreground underline outline-none hover:text-link-foreground-hover focus-visible:shadow-focus-ring"
                      onClick={(event) => event.preventDefault()}
                    >
                      {keyValueMetaMiddle(url, 16, 14)}
                    </a>
                  }
                />
                <TooltipContent>
                  <span className="max-w-64 whitespace-normal break-all">{url}</span>
                </TooltipContent>
              </Tooltip>
            ),
          },
        ]}
      />
    </div>
  );
}

function KeyValueMetaHelpTooltips() {
  return (
    <div className="w-full max-w-md">
      <PropertyList
        items={[
          {
            label: 'Criticality',
            value: 'A',
            hint: <InfoTooltip label="About criticality">A stops production if it fails. B reduces it. C has a spare in place.</InfoTooltip>,
          },
          {
            label: 'Health score',
            value: <span className="tabular-nums">{KEY_VALUE_COMPRESSOR.healthScore} of 100</span>,
            hint: <InfoTooltip label="About health score">Combines vibration, temperature and run hours over the last 30 days.</InfoTooltip>,
          },
          {
            label: 'MTBF',
            value: <span className="tabular-nums">412 h</span>,
            hint: <InfoTooltip label="About MTBF">Mean time between failures: run hours divided by the number of trips this year.</InfoTooltip>,
          },
          { label: 'Strategy', value: 'Condition based' },
        ]}
      />
    </div>
  );
}

function KeyValueMetaMissing() {
  return (
    <div className="w-full max-w-xs">
      <PropertyList
        items={[
          { label: 'Manufacturer', value: 'Nordic Turbo' },
          { label: 'Model' },
          { label: 'Serial number', value: <span className="text-muted-foreground">Not recorded</span> },
          {
            label: 'Datasheet',
            value: (
              <Button variant="ghost" size="sm">
                <IconPlus /> Link datasheet
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}

function KeyValueMetaSourceLine() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <PropertyList
        dense
        items={[
          { label: 'Status', value: <StatusBadge status={KEY_VALUE_ORDER.status} /> },
          { label: 'Estimate', value: <span className="tabular-nums">{KEY_VALUE_ORDER.estimatedHours} h</span> },
        ]}
      />
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-default pt-3 text-xs text-muted-foreground">
        <IconDatabase aria-hidden="true" className="size-3.5" />
        <span>SAP PM</span>
        <IconArrowRight aria-hidden="true" className="size-3" />
        <span className="font-mono">sap-work-orders</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">Synced {formatAgo(REFERENCE_NOW - 12 * MINUTE)}</span>
      </p>
    </div>
  );
}

function KeyValueMetaRichValues() {
  return (
    <div className="w-full max-w-xs">
      <PropertyList
        items={[
          { label: 'State', value: <StatusBadge status={KEY_VALUE_COMPRESSOR.state} /> },
          {
            label: 'Owner',
            value: (
              <span className="inline-flex items-center gap-2">
                <PersonAvatar name={KEY_VALUE_ENGINEER.name} sizes="xxsm" />
                {KEY_VALUE_ENGINEER.name}
              </span>
            ),
          },
          { label: 'Type', value: <Badge variant="decorative-2">Compressor</Badge> },
          {
            label: 'Parent',
            value: (
              <a
                href="#parent"
                className="rounded-sm text-link-foreground underline outline-none hover:text-link-foreground-hover focus-visible:shadow-focus-ring"
                onClick={(event) => event.preventDefault()}
              >
                {KEY_VALUE_AREA.name}
              </a>
            ),
          },
        ]}
      />
    </div>
  );
}

function KeyValueMetaEditor() {
  const [pairs, setPairs] = useState<KeyValuePair[]>([
    { id: 'unit', key: 'unit', value: 'barg' },
    { id: 'source', key: 'sourceTag', value: 'NK.23PT92531.PV' },
    { id: 'owner', key: 'owner', value: 'Rotating equipment' },
  ]);

  return <KeyValueEditor label="Time series metadata" pairs={pairs} onChange={setPairs} />;
}

function KeyValueMetaEditorEmpty() {
  const [pairs, setPairs] = useState<KeyValuePair[]>([]);

  return <KeyValueEditor label="Custom properties" pairs={pairs} onChange={setPairs} maxPairs={3} keyPlaceholder="costCenter" valuePlaceholder="4410" />;
}

function KeyValueMetaInlineEdit() {
  const [name, setName] = useState('Discharge pressure');
  const [description, setDescription] = useState('1st stage compressor outlet');

  return (
    <div className="w-full max-w-md">
      <PropertyList
        items={[
          { label: 'External ID', value: <span className="font-mono text-xs">{KEY_VALUE_PRESSURE.tag}</span> },
          { label: 'Name', value: <InlineEditText value={name} label="name" onSave={setName} /> },
          { label: 'Description', value: <InlineEditText value={description} label="description" onSave={setDescription} /> },
          { label: 'Unit', value: KEY_VALUE_PRESSURE.unit },
        ]}
      />
    </div>
  );
}

function KeyValueMetaDiff() {
  const [changesOnly, setChangesOnly] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3">
      <KeyValueDiff
        label="Changes to 23-PT-92531 metadata"
        before={KEY_VALUE_SERIES_BEFORE}
        after={KEY_VALUE_SERIES_AFTER}
        beforeLabel="18 Mar 2025"
        afterLabel="4 Nov 2025"
        changesOnly={changesOnly}
      />
      <Button variant="ghost" size="sm" className="self-start" onClick={() => setChangesOnly(!changesOnly)}>
        {changesOnly ? 'Show unchanged keys' : 'Hide unchanged keys'}
      </Button>
    </div>
  );
}

function KeyValueMetaJson() {
  return (
    <CodeBlock code={KEY_VALUE_JSON} language="json">
      <Tooltip>
        <TooltipTrigger render={<CodeBlockCopyButton aria-label="Copy JSON" />} />
        <TooltipContent>Copy JSON</TooltipContent>
      </Tooltip>
    </CodeBlock>
  );
}

function KeyValueMetaTable() {
  return (
    <Table label="Metadata of 23-PT-92531">
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {KEY_VALUE_TABLE.map((row) => (
          <TableRow key={row.key}>
            <TableCell rowHeader mono>
              {row.key}
            </TableCell>
            <TableCell mono={row.mono} wrap="wrap">
              <span className="text-base-foreground tabular-nums">{row.value}</span>
            </TableCell>
            <TableCell muted>
              <span className="text-xs">{row.type}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function KeyValueMetaGrouped() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SectionHeader title="Identity" size="sm" as="h3" divider />
        <PropertyList dense items={KEY_VALUE_ASSET.slice(0, 3)} />
      </div>
      <div className="flex flex-col gap-3">
        <SectionHeader title="Design data" size="sm" as="h3" divider />
        <PropertyList dense items={KEY_VALUE_TECHNICAL.slice(0, 4)} />
      </div>
      <div className="flex flex-col gap-3">
        <SectionHeader title="Maintenance" size="sm" as="h3" divider />
        <PropertyList
          dense
          items={[
            { label: 'Strategy', value: 'Condition based' },
            { label: 'Next overhaul', value: 'Sep 2026' },
          ]}
        />
      </div>
    </div>
  );
}

function KeyValueMetaCollapsibleGroups() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <CollapsibleSection title="Identity" count={3} defaultOpen as="h3">
        <div className="pb-3 pt-1">
          <PropertyList dense items={KEY_VALUE_ASSET.slice(0, 3)} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Design data" count={KEY_VALUE_TECHNICAL.length} defaultOpen={false} as="h3">
        <div className="pb-3 pt-1">
          <PropertyList dense items={KEY_VALUE_TECHNICAL} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Maintenance" count={2} defaultOpen={false} as="h3">
        <div className="pb-3 pt-1">
          <PropertyList
            dense
            items={[
              { label: 'Strategy', value: 'Condition based' },
              { label: 'Next overhaul', value: 'Sep 2026' },
            ]}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

function KeyValueMetaSearchable() {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const shown = KEY_VALUE_TECHNICAL.filter((item) => item.label.toLowerCase().includes(needle));

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Search
        aria-label="Filter properties"
        placeholder="Filter properties"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {shown.length} of {KEY_VALUE_TECHNICAL.length} properties
      </p>
      {shown.length > 0 ? (
        <PropertyList dense items={shown} />
      ) : (
        <p className="text-sm text-muted-foreground">No property matches “{query.trim()}”. Check the spelling or clear the filter.</p>
      )}
    </div>
  );
}

function KeyValueMetaShowAll() {
  return (
    <div className="w-full max-w-md">
      <ShowMore
        moreLabel={`Show ${KEY_VALUE_TECHNICAL.length - 4} more properties`}
        lessLabel="Show fewer properties"
        summary={<PropertyList dense items={KEY_VALUE_TECHNICAL.slice(0, 4)} />}
      >
        <div className="pt-1">
          <PropertyList dense items={KEY_VALUE_TECHNICAL.slice(4)} />
        </div>
      </ShowMore>
    </div>
  );
}

function KeyValueMetaRecord() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-medium-background text-medium-foreground">
            <IconTimeline aria-hidden="true" className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-xl font-semibold tracking-tight text-base-foreground">{KEY_VALUE_PRESSURE.name}</h3>
            <MetadataList
              layout="inline"
              items={[
                { label: 'External ID', value: <span className="font-mono text-xs">{KEY_VALUE_PRESSURE.tag}</span> },
                { label: 'Asset', value: KEY_VALUE_COMPRESSOR.name },
                { label: 'Data set', value: 'Compressor telemetry' },
              ]}
            />
          </div>
        </div>
        <CopyButton variant="outline" size="sm" text={KEY_VALUE_PRESSURE.tag} label="Copy external ID" />
      </div>
      <PropertyList
        layout="stacked"
        columns={3}
        items={[
          {
            label: 'Latest value',
            value: (
              <span className="tabular-nums">
                {formatReading(KEY_VALUE_PRESSURE.value, KEY_VALUE_PRESSURE.unit, 1)}{' '}
                <span className="text-xs text-muted-foreground">at {formatTime(REFERENCE_NOW - 2 * MINUTE)}</span>
              </span>
            ),
          },
          { label: 'Operating range', value: <span className="tabular-nums">40.0 to 52.0 barg</span> },
          { label: 'Quality', value: 'Good' },
        ]}
      />
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <SectionHeader title="Definition" size="sm" as="h4" divider />
          <PropertyList
            dense
            items={[
              { label: 'Unit', value: KEY_VALUE_PRESSURE.unit },
              { label: 'Type', value: 'Numeric, continuous' },
              { label: 'Step series', value: 'No' },
              { label: 'Security category' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-3">
          <SectionHeader title="Metadata" count={Object.keys(KEY_VALUE_SERIES_AFTER).length} size="sm" as="h4" divider />
          <PropertyList
            dense
            items={Object.entries(KEY_VALUE_SERIES_AFTER).map(([key, value]) => ({
              label: key,
              value: key === 'sourceTag' ? <span className="font-mono text-xs">{value}</span> : value,
            }))}
          />
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-default pt-3 text-xs text-muted-foreground">
        <IconDatabase aria-hidden="true" className="size-3.5" />
        <span>PI historian</span>
        <IconArrowRight aria-hidden="true" className="size-3" />
        <span className="font-mono">pi-timeseries-live</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">Last datapoint {formatAgo(REFERENCE_NOW - 2 * MINUTE)}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">Metadata updated {formatDate(REFERENCE_NOW - 128 * DAY)}</span>
      </p>
    </div>
  );
}

export default definePage({
  id: 'key-value-and-metadata',
  title: 'Key-value and metadata',
  summary:
    'The properties of a record: which layout fits the space, how identifiers, units and missing values are written, and how free-form metadata is edited, compared and shown as data.',
  guidance: {
    use: [
      'Labels in one column and values in another, so a long list scans as two straight edges.',
      'Monospace and a copy button for identifiers; tabular figures and the unit for readings.',
      'A visible placeholder for a missing value, or the action that fills it.',
      'A source line under synced records: where the values come from and how fresh they are.',
    ],
    avoid: [
      'Truncating a value people need to read in full; wrap it, and truncate only identifiers with a way to copy.',
      'Raw JSON as the only view of metadata that non-developers read.',
      'Label and value in the same weight and colour, so pairs blur together.',
      'A blank cell for a missing value: it looks like a rendering bug.',
    ],
  },
  source,
  sections: [
    {
      id: 'layouts',
      title: 'Layouts',
      description: 'The same pairs arranged for a panel, a card, a header and a wide page.',
      specimens: [
        {
          id: 'KeyValueMetaTwoColumn',
          title: 'Two-column property list',
          note: 'The default in side panels: labels share a column, values start on one edge and may wrap.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx'],
          Component: KeyValueMetaTwoColumn,
        },
        {
          id: 'KeyValueMetaStacked',
          title: 'Stacked label and value',
          note: 'Narrow columns and long values: the label sits above, so the value gets the full width.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx'],
          Component: KeyValueMetaStacked,
        },
        {
          id: 'KeyValueMetaInlineRow',
          title: 'Inline metadata row',
          note: 'Under a page or record title: three or four facts on one line, divided by separators.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: KeyValueMetaInlineRow,
        },
        {
          id: 'KeyValueMetaRightAligned',
          title: 'Label left, value right',
          note: 'Short numeric summaries in a card, where right-aligned values compare by digit.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/MetadataList.tsx', 'industrial/status.ts'],
          Component: KeyValueMetaRightAligned,
        },
        {
          id: 'KeyValueMetaFactGrid',
          title: 'Grid of facts',
          note: 'The top of a record page: six facts in three columns that people read before anything else.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx', 'display/StatusBadge.tsx'],
          Component: KeyValueMetaFactGrid,
        },
        {
          id: 'KeyValueMetaDense',
          title: 'Dense technical list',
          note: 'Long nameplate and design data that people look up rather than read through.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx'],
          Component: KeyValueMetaDense,
        },
      ],
    },
    {
      id: 'values',
      title: 'Values',
      description: 'How single values are written: identifiers, readings, long text, rich content and nothing at all.',
      specimens: [
        {
          id: 'KeyValueMetaCopyable',
          title: 'Copyable identifiers',
          note: 'IDs and external IDs people paste into queries and other systems: monospace with a copy button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx', 'actions/CopyButton.tsx'],
          Component: KeyValueMetaCopyable,
        },
        {
          id: 'KeyValueMetaUnitTimestamp',
          title: 'Value with unit and timestamp',
          note: 'Live readings in a property list: the number carries the weight, unit and time stay quiet and aligned.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/status.ts'],
          Component: KeyValueMetaUnitTimestamp,
        },
        {
          id: 'KeyValueMetaLongValues',
          title: 'Long values',
          note: 'Prose wraps; a long identifier is cut at the end and a URL in the middle, each with the full text one step away.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx', 'overlays/TruncatedText.tsx', 'actions/CopyButton.tsx'],
          Component: KeyValueMetaLongValues,
        },
        {
          id: 'KeyValueMetaHelpTooltips',
          title: 'Definition list with help',
          note: 'Labels that are jargon or computed: an info button beside the label explains it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx', 'overlays/InfoTooltip.tsx'],
          Component: KeyValueMetaHelpTooltips,
        },
        {
          id: 'KeyValueMetaMissing',
          title: 'Missing values',
          note: 'Three honest ways to show nothing: a dash, a reason, or the action that fills the gap.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx'],
          Component: KeyValueMetaMissing,
        },
        {
          id: 'KeyValueMetaRichValues',
          title: 'Values as components',
          note: 'When a value is a state, a person, a category or a link, use the component that already means that.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx', 'display/StatusBadge.tsx', 'display/PersonAvatar.tsx'],
          Component: KeyValueMetaRichValues,
        },
        {
          id: 'KeyValueMetaSourceLine',
          title: 'Source and lineage line',
          note: 'Under properties synced from another system: the source, the pipeline and how fresh the values are.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx', 'display/StatusBadge.tsx'],
          Component: KeyValueMetaSourceLine,
        },
      ],
    },
    {
      id: 'editing',
      title: 'Editing and comparing',
      description: 'Free-form pairs people add and remove, values edited in place, and two versions side by side.',
      specimens: [
        {
          id: 'KeyValueMetaEditor',
          title: 'Editable key-value pairs',
          note: 'Free-form metadata: change either side in place, remove a row, add one at the end. Duplicate keys are flagged.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/KeyValueEditor.tsx', 'patterns/content/duplicateKeys.ts'],
          Component: KeyValueMetaEditor,
        },
        {
          id: 'KeyValueMetaInlineEdit',
          title: 'Edit a value in place',
          note: 'Fixed properties where only some values can change: the editable ones show a pencil.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx', 'forms/InlineEditText.tsx'],
          Component: KeyValueMetaInlineEdit,
        },
        {
          id: 'KeyValueMetaDiff',
          title: 'Key-value diff',
          note: 'Reviewing a change or an audit entry: old and new per key, with the kind of change written out.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/KeyValueDiff.tsx', 'patterns/content/diffKeyValues.ts'],
          Component: KeyValueMetaDiff,
        },
        {
          id: 'KeyValueMetaEditorEmpty',
          title: 'Empty editor with a limit',
          note: 'Optional custom properties: starts empty, and says when the allowed number is reached.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/content/KeyValueEditor.tsx'],
          Component: KeyValueMetaEditorEmpty,
        },
      ],
    },
    {
      id: 'structured',
      title: 'Structured views',
      description: 'Metadata as data, in groups, and assembled into a record.',
      specimens: [
        {
          id: 'KeyValueMetaJson',
          title: 'JSON view',
          note: 'For developers who will paste the record into code: the exact payload, highlighted and copyable.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: KeyValueMetaJson,
        },
        {
          id: 'KeyValueMetaTable',
          title: 'Metadata table',
          note: 'When the type of each value matters, or the list is long enough to need column headers.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: KeyValueMetaTable,
        },
        {
          id: 'KeyValueMetaGrouped',
          title: 'Grouped properties',
          note: 'More than about eight properties: group them under section headers by what people look for.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: KeyValueMetaGrouped,
        },
        {
          id: 'KeyValueMetaCollapsibleGroups',
          title: 'Collapsible groups',
          note: 'Groups of very different length: keep the short, important one open and the rest behind a count.',
          origin: 'custom',
          size: 'md',
          align: 'start',
          uses: ['patterns/structure/PropertyList.tsx', 'patterns/structure/CollapsibleSection.tsx'],
          Component: KeyValueMetaCollapsibleGroups,
        },
        {
          id: 'KeyValueMetaSearchable',
          title: 'Filterable properties',
          note: 'Dozens of properties: a filter on the label, with a count and a clear empty result.',
          origin: 'custom',
          size: 'md',
          align: 'start',
          uses: ['patterns/structure/PropertyList.tsx'],
          Component: KeyValueMetaSearchable,
        },
        {
          id: 'KeyValueMetaShowAll',
          title: 'Show more properties',
          note: 'Cards and previews with room for four rows: the rest stay one click away, with the count on the button.',
          origin: 'custom',
          size: 'md',
          align: 'start',
          uses: ['patterns/structure/PropertyList.tsx', 'overlays/ShowMore.tsx'],
          Component: KeyValueMetaShowAll,
        },
        {
          id: 'KeyValueMetaRecord',
          title: 'Record overview',
          note: 'A time series page: inline facts under the title, a fact grid, grouped properties and the lineage line.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'display/MetadataList.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
            'actions/CopyButton.tsx',
            'industrial/status.ts',
          ],
          Component: KeyValueMetaRecord,
        },
      ],
    },
  ],
});
