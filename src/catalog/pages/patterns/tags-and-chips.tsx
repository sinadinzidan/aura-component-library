import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Label } from '@cognite/aura/components/label';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverHeaderContent,
  PopoverSlot,
  PopoverTitle,
  PopoverTrigger,
} from '@cognite/aura/components/popover';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconEngine,
  IconHexagon,
  IconInnerShadowTopLeft,
  IconMapPin,
  IconPlus,
  IconTag,
  IconTool,
  IconUser,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { ConfirmButton } from '../../../library/actions/ConfirmButton';
import { CopyButton } from '../../../library/actions/CopyButton';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { InlineEditText } from '../../../library/forms/InlineEditText';
import { BreakdownList } from '../../../library/patterns/collections/BreakdownList';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { EntityCard } from '../../../library/patterns/collections/EntityCard';
import { EditableTagList } from '../../../library/patterns/data-entry/EditableTagList';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { Tag } from '../../../library/primitives/tag/Tag';
import { TagGroup } from '../../../library/primitives/tag/TagGroup';
import { TagInput } from '../../../library/primitives/tag/TagInput';
import { TagList } from '../../../library/primitives/tag/TagList';
import { ASSETS, WORK_ORDERS, findAsset } from '../../data/plant';
import type { WorkOrder } from '../../data/plant';
import { definePage } from '../../types';

import source from './tags-and-chips.tsx?raw';

const TAG_CHIP_COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];

const TAG_CHIP_LABELS = ['rotating equipment', 'critical spare', 'vibration', 'bearing', 'turnaround 2026', 'long lead'] as const;

const TAG_CHIP_SUGGESTIONS = ['vibration', 'bearing', 'lube oil', 'anti-surge', 'seal gas'] as const;

const TAG_CHIP_USAGE = [
  { id: 'rotating', label: 'rotating equipment', value: 412 },
  { id: 'vibration', label: 'vibration', value: 286 },
  { id: 'spare', label: 'critical spare', value: 143 },
  { id: 'turnaround', label: 'turnaround 2026', value: 97 },
  { id: 'bearing', label: 'bearing', value: 64 },
  { id: 'lead', label: 'long lead', value: 18 },
] as const;

const TAG_CHIP_ORDER_TAGS: Record<string, readonly string[]> = {
  'WO-104482': ['bearing', 'vibration', 'critical spare', 'night shift', 'scaffolding'],
  'WO-104479': ['instrument', 'spare in stock'],
  'WO-104471': ['cleaning', 'turnaround 2026', 'heat exchanger', 'long lead'],
  'WO-104466': ['vibration'],
};

const TAG_CHIP_ORDERS = WORK_ORDERS.slice(0, 4);

const TAG_CHIP_ORDER_COLUMNS: readonly DataTableColumn<WorkOrder>[] = [
  { id: 'id', header: 'Work order', width: 'w-28', cell: (order) => <span className="font-mono text-xs">{order.id}</span> },
  { id: 'title', header: 'Title', cell: (order) => order.title },
  {
    id: 'tags',
    header: 'Labels',
    width: 'w-64',
    cell: (order) => <TagList label={`Labels on ${order.id}`} tags={TAG_CHIP_ORDER_TAGS[order.id] ?? []} max={2} size="sm" nowrap />,
  },
];

const TAG_CHIP_FILTERS = [
  { value: 'corrective', label: 'Corrective' },
  { value: 'preventive', label: 'Preventive' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'modification', label: 'Modification' },
] as const;

type TagChipManaged = { id: string; name: string; uses: number };

const TAG_CHIP_MANAGED: readonly TagChipManaged[] = [
  { id: 't1', name: 'vibration', uses: 286 },
  { id: 't2', name: 'vibrations', uses: 12 },
  { id: 't3', name: 'critical spare', uses: 143 },
  { id: 't4', name: 'long lead', uses: 18 },
];

const tagChipOneWord = (tag: string) => (tag.length > 24 ? 'Keep labels under 25 characters.' : null);

function TagChipStatic() {
  return <TagList label="Labels" tags={TAG_CHIP_LABELS.slice(0, 3)} />;
}

function TagChipWithIcon() {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      <Tag icon={<IconMapPin />}>Nordkapp</Tag>
      <Tag icon={<IconEngine />}>Compressor</Tag>
      <Tag icon={<IconUser />}>Aisha Khan</Tag>
      <Tag icon={<IconTool />}>Corrective</Tag>
    </div>
  );
}

function TagChipKeywords() {
  return <TagList label="Keywords" tags={['centrifugal', 'dry gas seal', 'API 617', 'anti-surge']} variant="outline" />;
}

function TagChipStatusVsCategory() {
  return (
    <dl className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-4 text-sm">
      <dt className="text-muted-foreground">Status</dt>
      <dd className="flex flex-wrap items-center gap-1.5">
        <Badge variant="success">
          <IconCircleCheck /> Running
        </Badge>
        <Badge variant="inProgress">
          <IconInnerShadowTopLeft /> In progress
        </Badge>
        <Badge variant="warning">
          <IconAlertTriangle /> Maintenance
        </Badge>
        <Badge variant="error">
          <IconHexagon /> Tripped
        </Badge>
        <span className="text-xs text-muted-foreground">One per record. The system sets it.</span>
      </dd>
      <dt className="text-muted-foreground">Category</dt>
      <dd className="flex flex-wrap items-center gap-1.5">
        <Tag size="sm" variant="decorative-2">
          Compressor
        </Tag>
        <Tag size="sm" variant="decorative-3">
          Pump
        </Tag>
        <Tag size="sm" variant="decorative-5">
          Exchanger
        </Tag>
        <Tag size="sm" variant="decorative-6">
          Valve
        </Tag>
        <span className="text-xs text-muted-foreground">A fixed set. Colour only tells kinds apart.</span>
      </dd>
      <dt className="text-muted-foreground">Label</dt>
      <dd className="flex flex-wrap items-center gap-1.5">
        <Tag size="sm">vibration</Tag>
        <Tag size="sm">critical spare</Tag>
        <Tag size="sm">turnaround 2026</Tag>
        <span className="text-xs text-muted-foreground">Free text from people. Always neutral.</span>
      </dd>
    </dl>
  );
}

function TagChipAssetTag() {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="inline-flex items-center gap-1">
        <Tag mono size="lg">
          {TAG_CHIP_COMPRESSOR.tag}
        </Tag>
        <CopyButton variant="ghost" size="icon-sm" text={TAG_CHIP_COMPRESSOR.tag} label="Copy asset tag" iconOnly />
      </span>
      <span className="text-xs text-muted-foreground">{TAG_CHIP_COMPRESSOR.name}</span>
    </div>
  );
}

function TagChipOverflow() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Two shown</span>
        <TagList label="Labels, two shown" tags={TAG_CHIP_LABELS} max={2} nowrap />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Three shown</span>
        <TagList label="Labels, three shown" tags={TAG_CHIP_LABELS} max={3} nowrap />
      </div>
    </div>
  );
}

function TagChipTruncated() {
  const long = 'Recompressor drive-end bearing replacement campaign 2026';

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <Tag tooltip={long} className="max-w-56">
          {long}
        </Tag>
        <Tag>vibration</Tag>
      </div>
      <p className="text-xs text-muted-foreground">Capped at a fixed width; the full label shows on hover and focus.</p>
    </div>
  );
}

function TagChipRemovable() {
  const [tags, setTags] = useState<readonly string[]>(TAG_CHIP_LABELS.slice(0, 3));

  return (
    <div className="flex flex-col items-center gap-3">
      <TagList label="Labels" tags={tags} onRemove={(id) => setTags(tags.filter((other) => other !== id))} className="justify-center" />
      {tags.length < 3 ? (
        <Button variant="ghost" size="sm" onClick={() => setTags(TAG_CHIP_LABELS.slice(0, 3))}>
          Restore labels
        </Button>
      ) : null}
    </div>
  );
}

function TagChipPicker() {
  const [picked, setPicked] = useState<readonly string[]>(['vibration', 'bearing']);
  const toggle = (tag: string, checked: boolean) => setPicked(checked ? [...picked, tag] : picked.filter((other) => other !== tag));

  return (
    <div className="flex flex-col items-center gap-3">
      <TagList label="Picked labels" tags={picked} max={3} />
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm">
              <IconTag /> Edit labels
            </Button>
          }
        />
        <PopoverContent className="w-64">
          <PopoverHeader>
            <PopoverHeaderContent>
              <PopoverTitle>Labels</PopoverTitle>
              <PopoverClose />
            </PopoverHeaderContent>
            <PopoverDescription>Applied to WO-104482 as you tick them.</PopoverDescription>
          </PopoverHeader>
          <PopoverSlot>
            <CheckboxGroup aria-label="Labels for WO-104482">
              {TAG_CHIP_LABELS.map((tag) => (
                <CheckboxItem key={tag}>
                  <CheckboxItemControl checked={picked.includes(tag)} onCheckedChange={(checked) => toggle(tag, checked)} />
                  <CheckboxItemLabel>{tag}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
          </PopoverSlot>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TagChipEmpty() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Labels</span>
      {tags.length === 0 ? <p className="text-sm text-muted-foreground">No labels yet. Labels help the team find this work order.</p> : null}
      <EditableTagList tags={tags} onChange={setTags} label="Labels" addLabel="Add label" />
    </div>
  );
}

function TagChipInput() {
  const [tags, setTags] = useState<string[]>(['vibration', 'bearing']);

  return (
    <div className="flex w-full max-w-md flex-col">
      <Label htmlFor="tag-chip-input">Labels</Label>
      <TagInput id="tag-chip-input" label="Labels" tags={tags} onChange={setTags} placeholder="Type and press Enter" validate={tagChipOneWord} />
      <p className="pt-1.5 text-xs text-muted-foreground">Enter or a comma adds a label. Backspace removes the last one.</p>
    </div>
  );
}

function TagChipInputMax() {
  const [tags, setTags] = useState<string[]>(['23-KA-9101', '23-KA-9102', '23-HA-9114', '23-GT-9001']);

  return (
    <div className="flex w-full max-w-md flex-col">
      <Label htmlFor="tag-chip-input-max">Assets to compare</Label>
      <TagInput id="tag-chip-input-max" label="Assets to compare" tags={tags} onChange={setTags} placeholder="Add an asset tag" maxTags={5} mono />
    </div>
  );
}

function TagChipSuggested() {
  const [tags, setTags] = useState<string[]>(['vibration']);
  const open = TAG_CHIP_SUGGESTIONS.filter((tag) => !tags.includes(tag));

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-col">
        <Label htmlFor="tag-chip-suggested">Labels</Label>
        <TagInput id="tag-chip-suggested" label="Labels" tags={tags} onChange={setTags} />
      </div>
      {open.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Used on similar work orders:</span>
          {open.map((tag) => (
            <Tag key={tag} size="sm" variant="outline" icon={<IconPlus />} onClick={() => setTags([...tags, tag])}>
              <span className="sr-only">Add </span>
              {tag}
            </Tag>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">All suggestions added.</p>
      )}
    </div>
  );
}

function TagChipInlineEdit() {
  const [tags, setTags] = useState<string[]>(['rotating equipment', 'critical spare']);

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Labels on {TAG_CHIP_COMPRESSOR.tag}</span>
      <EditableTagList tags={tags} onChange={setTags} label="Labels" addLabel="Add label" maxTags={4} validate={tagChipOneWord} />
    </div>
  );
}

function TagChipFilterChips() {
  const [types, setTypes] = useState<string[]>(['corrective']);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <TagGroup label="Work order type" options={TAG_CHIP_FILTERS} value={types} onValueChange={setTypes} />
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {types.length === 0 ? 'Showing every type.' : `Showing ${types.length} of ${TAG_CHIP_FILTERS.length} types.`}
      </p>
    </div>
  );
}

function TagChipFilterCounts() {
  const [states, setStates] = useState<string[]>(['active']);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <TagGroup
        label="Alarm state"
        options={[
          { value: 'active', label: 'Active', count: 3 },
          { value: 'acknowledged', label: 'Acknowledged', count: 2 },
          { value: 'shelved', label: 'Shelved', count: 1 },
        ]}
        value={states}
        onValueChange={setStates}
      />
      <p className="text-xs text-muted-foreground">Counts say what a chip will add before it is pressed.</p>
    </div>
  );
}

function TagChipChoiceChips() {
  const [range, setRange] = useState<string[]>(['24h']);

  return (
    <div className="flex flex-col items-center gap-3">
      <TagGroup
        label="Time range"
        selection="single"
        allowEmpty={false}
        options={[
          { value: '8h', label: '8 h' },
          { value: '24h', label: '24 h' },
          { value: '7d', label: '7 d' },
          { value: '30d', label: '30 d' },
        ]}
        value={range}
        onValueChange={setRange}
      />
      <p className="text-xs text-muted-foreground">Exactly one stays pressed.</p>
    </div>
  );
}

function TagChipAppliedFilters() {
  const all = [
    { id: 'site', label: 'Site', value: 'Nordkapp' },
    { id: 'area', label: 'Area', value: 'Gas compression' },
    { id: 'priority', label: 'Priority', value: 'P1, P2' },
    { id: 'label', label: 'Label', value: 'vibration' },
  ] as const;
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const shown = all.filter((chip) => !removed.includes(chip.id));

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-7 flex-wrap items-center gap-2">
        {shown.map((chip) => (
          <Tag
            key={chip.id}
            size="lg"
            label={`${chip.label}: ${chip.value}`}
            removeLabel={`Remove filter ${chip.label}: ${chip.value}`}
            onRemove={() => setRemoved([...removed, chip.id])}
          >
            <span className="font-normal opacity-70">{chip.label}:</span> {chip.value}
          </Tag>
        ))}
        {shown.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setRemoved(all.map((chip) => chip.id))}>
            Clear all
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setRemoved([])}>
            Restore filters
          </Button>
        )}
      </div>
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {shown.length === 0 ? 'No filters applied. Showing all 23 work orders.' : `${shown.length} filters applied.`}
      </p>
    </div>
  );
}

function TagChipFrequencyList() {
  return <BreakdownList label="Most used labels" items={TAG_CHIP_USAGE} ranked layout="inline" />;
}

function TagChipGrouped() {
  return (
    <dl className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6 gap-y-3 text-sm">
      <dt className="flex min-h-5 items-center text-muted-foreground">Discipline</dt>
      <dd>
        <TagList label="Discipline" tags={['Mechanical', 'Instrument']} />
      </dd>
      <dt className="flex min-h-5 items-center text-muted-foreground">Area</dt>
      <dd>
        <TagList label="Area" tags={['NK-23 Gas compression']} />
      </dd>
      <dt className="flex min-h-5 items-center text-muted-foreground">Equipment</dt>
      <dd>
        <TagList label="Equipment" tags={['23-KA-9103', '23-GT-9001', '23-HA-9114']} mono />
      </dd>
      <dt className="flex min-h-5 items-center text-muted-foreground">Labels</dt>
      <dd>
        <TagList label="Labels" tags={TAG_CHIP_LABELS} max={4} />
      </dd>
    </dl>
  );
}

function TagChipInTable() {
  return <DataTable label="Work orders with labels" columns={TAG_CHIP_ORDER_COLUMNS} rows={TAG_CHIP_ORDERS} getRowId={(order) => order.id} />;
}

function TagChipOnCard() {
  return (
    <div className="w-full max-w-xs">
      <EntityCard
        title={TAG_CHIP_COMPRESSOR.name}
        description={<span className="font-mono">{TAG_CHIP_COMPRESSOR.tag}</span>}
        icon={<IconEngine />}
        status={<StatusBadge status={TAG_CHIP_COMPRESSOR.state} />}
        footerNote={findAsset(TAG_CHIP_COMPRESSOR.parentId ?? '')?.name}
      >
        <TagList label="Labels" tags={TAG_CHIP_LABELS} max={2} size="sm" />
      </EntityCard>
    </div>
  );
}

function TagChipManagement() {
  const [tags, setTags] = useState<readonly TagChipManaged[]>(TAG_CHIP_MANAGED);
  const [merging, setMerging] = useState<string | null>(null);

  const merge = (fromId: string, intoId: string) => {
    const from = tags.find((tag) => tag.id === fromId);
    if (!from) return;
    setTags(tags.filter((tag) => tag.id !== fromId).map((tag) => (tag.id === intoId ? { ...tag, uses: tag.uses + from.uses } : tag)));
    setMerging(null);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Table label="Labels in this project">
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead numeric className="w-24">
              Used on
            </TableHead>
            <TableHead srOnly className="w-80">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell>
                <InlineEditText
                  value={tag.name}
                  label={`name of label ${tag.name}`}
                  onSave={(name) => setTags(tags.map((other) => (other.id === tag.id ? { ...other, name } : other)))}
                />
              </TableCell>
              <TableCell numeric muted>
                {tag.uses}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {merging === tag.id ? (
                    <>
                      <OptionSelect
                        aria-label={`Merge ${tag.name} into`}
                        size="sm"
                        width="compact"
                        placeholder="Merge into"
                        options={tags.filter((other) => other.id !== tag.id).map((other) => ({ value: other.id, label: other.name }))}
                        onValueChange={(intoId) => merge(tag.id, intoId)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => setMerging(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" disabled={tags.length < 2} onClick={() => setMerging(tag.id)}>
                        Merge
                      </Button>
                      <ConfirmButton size="sm" confirmLabel="Confirm delete" onConfirm={() => setTags(tags.filter((other) => other.id !== tag.id))}>
                        Delete
                      </ConfirmButton>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">Merging moves every use to the other label. Deleting removes the label from every record.</p>
        {tags.length < TAG_CHIP_MANAGED.length ? (
          <Button variant="ghost" size="sm" onClick={() => setTags(TAG_CHIP_MANAGED)}>
            Restore labels
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function TagChipRecordHeader() {
  const [labels, setLabels] = useState<string[]>(['rotating equipment', 'critical spare', 'vibration']);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold tracking-tight text-base-foreground">{TAG_CHIP_COMPRESSOR.name}</h3>
            <StatusBadge status={TAG_CHIP_COMPRESSOR.state} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Tag mono>{TAG_CHIP_COMPRESSOR.tag}</Tag>
              <CopyButton variant="ghost" size="icon-sm" text={TAG_CHIP_COMPRESSOR.tag} label="Copy asset tag" iconOnly />
            </span>
            <Tag variant="decorative-2">Compressor</Tag>
            <Tag icon={<IconMapPin />}>Nordkapp</Tag>
            <Tag>Criticality {TAG_CHIP_COMPRESSOR.criticality}</Tag>
          </div>
        </div>
        <Button variant="secondary">Create work order</Button>
      </div>
      <div className="flex flex-col gap-2 border-t border-default pt-4">
        <span className="text-xs font-medium text-muted-foreground">Labels</span>
        <EditableTagList tags={labels} onChange={setLabels} label="Labels" addLabel="Add label" maxTags={6} />
      </div>
    </div>
  );
}

export default definePage({
  id: 'tags-and-chips',
  title: 'Tags and chips',
  summary:
    'Small labelled shapes that classify, filter and choose. Status, category and free-text labels look different on purpose; chips that act are toggles, not badges.',
  guidance: {
    use: [
      'Status badge variants for state the system sets; decorative variants for a fixed set of categories.',
      'Neutral tags for free-text labels people add, however many there are.',
      'A "+N" chip past two or three tags in a cell or card, with the hidden ones reachable.',
      'Toggles for chips that filter or choose, so pressed state is announced.',
    ],
    avoid: [
      'Giving every label its own colour: colour stops meaning anything.',
      'Status colour on a category, or a category tint on a status.',
      'A tag cloud with font size as frequency; rank them in a list with counts.',
      'Unlimited tags on a record with no way to merge duplicates.',
    ],
  },
  source,
  sections: [
    {
      id: 'static',
      title: 'Static tags',
      description: 'Read-only tags and the difference between a status, a category and a label.',
      specimens: [
        {
          id: 'TagChipStatic',
          title: 'Static tags',
          note: 'Free-text labels on a record that this view cannot change.',
          origin: 'custom',
          uses: ['primitives/tag/TagList.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipStatic,
        },
        {
          id: 'TagChipWithIcon',
          title: 'Tags with icon',
          note: 'When tags of different kinds sit together: the icon says site, type, person or work type.',
          origin: 'custom',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagChipWithIcon,
        },
        {
          id: 'TagChipKeywords',
          title: 'Colourless keyword chips',
          note: 'Search keywords and specifications that should recede behind the content they describe.',
          origin: 'custom',
          uses: ['primitives/tag/TagList.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipKeywords,
        },
        {
          id: 'TagChipStatusVsCategory',
          title: 'Status, category and label',
          note: 'The rule for which variant to use: status colour for state, decorative for kinds, neutral for free text.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagChipStatusVsCategory,
        },
        {
          id: 'TagChipAssetTag',
          title: 'Asset tag with copy',
          note: 'Identifiers people paste into other systems: monospace, with a copy button attached.',
          origin: 'custom',
          uses: ['actions/CopyButton.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipAssetTag,
        },
        {
          id: 'TagChipOverflow',
          title: 'Tag list with overflow',
          note: 'Cells and card headers with a fixed height: show the first few and fold the rest into a count.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagList.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipOverflow,
        },
        {
          id: 'TagChipTruncated',
          title: 'Long label',
          note: 'Labels longer than the space: cap the width deliberately and keep the full text one hover away.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagChipTruncated,
        },
      ],
    },
    {
      id: 'editable',
      title: 'Removable and editable',
      description: 'Adding and removing tags: on the chip, in a field, from suggestions or from a picker.',
      specimens: [
        {
          id: 'TagChipRemovable',
          title: 'Removable tags',
          note: 'A handful of labels that can be taken off one by one; each chip is its own remove button.',
          origin: 'custom',
          uses: ['primitives/tag/TagList.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipRemovable,
        },
        {
          id: 'TagChipPicker',
          title: 'Tag picker popover',
          note: 'A closed set of labels: pick from a list behind a button instead of typing.',
          origin: 'custom',
          uses: ['primitives/tag/TagList.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipPicker,
        },
        {
          id: 'TagChipEmpty',
          title: 'No tags yet',
          note: 'An empty label field says what labels are for and offers the first one.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableTagList.tsx'],
          Component: TagChipEmpty,
        },
        {
          id: 'TagChipInput',
          title: 'Tag input',
          note: 'Free-text labels in a form: type to add, Backspace to remove, paste a comma-separated list.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagInput.tsx', 'primitives/tag/tagText.ts', 'primitives/tag/Tag.tsx'],
          Component: TagChipInput,
        },
        {
          id: 'TagChipInputMax',
          title: 'Maximum number of tags',
          note: 'When more tags would break the view, such as series on a chart: count against the limit as people add.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagInput.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipInputMax,
        },
        {
          id: 'TagChipSuggested',
          title: 'Suggested tags',
          note: 'Keeps vocabulary consistent: offer labels already used on similar records, one click each.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagInput.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipSuggested,
        },
        {
          id: 'TagChipInlineEdit',
          title: 'Edit in place',
          note: 'Labels on a detail page that are read far more often than changed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableTagList.tsx'],
          Component: TagChipInlineEdit,
        },
      ],
    },
    {
      id: 'choosing',
      title: 'Chips that choose',
      description: 'Chips as controls: filters that toggle, one-of-many choices and applied filters.',
      specimens: [
        {
          id: 'TagChipFilterChips',
          title: 'Filter chips',
          note: 'Two to five values of one property that people switch on and off while scanning a list.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagGroup.tsx', 'primitives/tag/Tag.tsx', 'primitives/tag/tagGroupLogic.ts'],
          Component: TagChipFilterChips,
        },
        {
          id: 'TagChipFilterCounts',
          title: 'Filter chips with counts',
          note: 'When the size of each group helps decide what to look at first.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagGroup.tsx', 'primitives/tag/Tag.tsx', 'primitives/tag/tagGroupLogic.ts'],
          Component: TagChipFilterCounts,
        },
        {
          id: 'TagChipChoiceChips',
          title: 'Choice chips',
          note: 'One of a few short options that changes the view at once, such as a time range.',
          origin: 'custom',
          uses: ['primitives/tag/TagGroup.tsx', 'primitives/tag/Tag.tsx', 'primitives/tag/tagGroupLogic.ts'],
          Component: TagChipChoiceChips,
        },
        {
          id: 'TagChipAppliedFilters',
          title: 'Applied filter chips',
          note: 'Under a filter bar: every active filter as "Property: value", removable, with one clear-all.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagChipAppliedFilters,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists and management',
      description: 'Tags in tables and cards, ranked by use, and the screen where duplicates are cleaned up.',
      specimens: [
        {
          id: 'TagChipFrequencyList',
          title: 'Frequency list',
          note: 'Instead of a tag cloud: labels ranked by use with a bar and the exact count.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/BreakdownList.tsx'],
          Component: TagChipFrequencyList,
        },
        {
          id: 'TagChipGrouped',
          title: 'Tags grouped by property',
          note: 'A record with several kinds of tag: one row per property, so kinds never mix in one line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagList.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipGrouped,
        },
        {
          id: 'TagChipInTable',
          title: 'Tags in a table cell',
          note: 'Rows keep one height: two labels and a count, in a column with a fixed width.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'primitives/tag/TagList.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipInTable,
        },
        {
          id: 'TagChipOnCard',
          title: 'Tags on a card',
          note: 'Cards in a grid: status in the header, labels in the body, capped so cards stay the same height.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'primitives/tag/TagList.tsx', 'primitives/tag/Tag.tsx', 'display/StatusBadge.tsx'],
          Component: TagChipOnCard,
        },
        {
          id: 'TagChipManagement',
          title: 'Tag management',
          note: 'The admin view of a vocabulary: rename in place, merge near-duplicates, delete with a second click.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['forms/InlineEditText.tsx', 'actions/ConfirmButton.tsx', 'patterns/data-entry/OptionSelect.tsx', 'primitives/table/Table.tsx'],
          Component: TagChipManagement,
        },
        {
          id: 'TagChipRecordHeader',
          title: 'Record header with every kind of tag',
          note: 'All of it on one asset: status badge, copyable tag, category, facts and editable labels, each in its own treatment.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx', 'actions/CopyButton.tsx', 'patterns/data-entry/EditableTagList.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagChipRecordHeader,
        },
      ],
    },
  ],
});
