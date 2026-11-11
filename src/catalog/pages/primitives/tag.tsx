import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import { Label } from '@cognite/aura/components/label';
import { IconAlertTriangle, IconBolt, IconClipboardCheck, IconDroplet, IconFlame, IconPlayerPlay, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { Tag } from '../../../library/primitives/tag/Tag';
import { TagGroup } from '../../../library/primitives/tag/TagGroup';
import type { TagGroupOption } from '../../../library/primitives/tag/TagGroup';
import { TagInput } from '../../../library/primitives/tag/TagInput';
import { TagList } from '../../../library/primitives/tag/TagList';
import { TAG_DECORATIVE_VARIANTS } from '../../../library/primitives/tag/tagVariants';
import { ASSETS, PEOPLE, SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './tag.tsx?raw';

const DISCIPLINES = ['Mechanical', 'Electrical', 'Instrument', 'Process', 'Safety', 'Rotating', 'Civil'] as const;

const ORDER_TYPES: readonly TagGroupOption[] = [
  { value: 'corrective', label: 'Corrective', count: 3 },
  { value: 'preventive', label: 'Preventive', count: 12 },
  { value: 'inspection', label: 'Inspection', count: 5 },
  { value: 'modification', label: 'Modification', count: 1 },
];

const ORDER_TYPES_WITH_GAP: readonly TagGroupOption[] = [
  { value: 'corrective', label: 'Corrective' },
  { value: 'preventive', label: 'Preventive' },
  {
    value: 'inspection',
    label: 'Inspection',
    disabled: true,
    disabledReason: 'No inspections are planned this week',
  },
  { value: 'modification', label: 'Modification' },
];

const WORK_ORDER_LABELS = ['vibration', 'bearing', 'compressor', 'rotating equipment', 'shutdown needed', 'long lead part'];

function TagPrimNeutral() {
  return <Tag>Compressor</Tag>;
}

function TagPrimOutline() {
  return <Tag variant="outline">Compressor</Tag>;
}

function TagPrimDecorative() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TAG_DECORATIVE_VARIANTS.map((variant, index) => (
        <Tag key={variant} variant={variant}>
          {DISCIPLINES[index]}
        </Tag>
      ))}
    </div>
  );
}

function TagPrimColorKey() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DISCIPLINES.slice(0, 5).map((name) => (
        <Tag key={name} colorKey={name}>
          {name}
        </Tag>
      ))}
    </div>
  );
}

function TagPrimStatus() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag status="success" icon={<IconPlayerPlay />}>
        Running
      </Tag>
      <Tag status="warning" icon={<IconAlertTriangle />}>
        Overdue
      </Tag>
      <Tag status="critical" icon={<IconFlame />}>
        Tripped
      </Tag>
      <Tag status="info">Planned</Tag>
      <Tag status="neutral">Standby</Tag>
    </div>
  );
}

function TagPrimSizes() {
  return (
    <div className="flex items-center gap-3">
      <Tag size="sm">Small</Tag>
      <Tag size="md">Medium</Tag>
      <Tag size="lg">Large</Tag>
    </div>
  );
}

function TagPrimMono() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ASSETS.slice(8, 11).map((asset) => (
        <Tag key={asset.id} mono variant="outline">
          {asset.tag}
        </Tag>
      ))}
    </div>
  );
}

function TagPrimLeadingIcon() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag icon={<IconTool />}>Corrective</Tag>
      <Tag icon={<IconClipboardCheck />}>Inspection</Tag>
      <Tag icon={<IconBolt />}>Electrical</Tag>
    </div>
  );
}

function TagPrimLeadingDot() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag variant="decorative-2" dot>
        Gas
      </Tag>
      <Tag variant="decorative-4" dot>
        Condensate
      </Tag>
      <Tag variant="decorative-6" dot>
        Water
      </Tag>
    </div>
  );
}

function TagPrimAvatar() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PEOPLE.slice(0, 3).map((person) => (
        <Tag key={person.id} avatar={<PersonAvatar name={person.name} initials={person.initials} sizes="xxsm" />}>
          {person.name}
        </Tag>
      ))}
    </div>
  );
}

function TagPrimCount() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag count={12}>Preventive</Tag>
      <Tag count={3} variant="outline">
        Corrective
      </Tag>
      <Tag count={1} variant="outline">
        Modification
      </Tag>
    </div>
  );
}

function TagPrimTruncated() {
  return (
    <Tag className="max-w-40" tooltip="Inspect recompressor drive-end bearing">
      Inspect recompressor drive-end bearing
    </Tag>
  );
}

function TagPrimRemovable() {
  const [tags, setTags] = useState<string[]>(['vibration', 'bearing', 'compressor']);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <Tag key={tag} onRemove={() => setTags(tags.filter((other) => other !== tag))}>
          {tag}
        </Tag>
      ))}
      {tags.length === 0 ? <span className="text-sm text-muted-foreground">No labels</span> : null}
    </div>
  );
}

function TagPrimSelectable() {
  const [on, setOn] = useState(true);
  return (
    <Tag size="lg" selected={on} onSelectedChange={setOn}>
      Only my orders
    </Tag>
  );
}

function TagPrimChoiceSingle() {
  const [value, setValue] = useState<string[]>(['preventive']);
  return <TagGroup label="Order type" selection="single" allowEmpty={false} options={ORDER_TYPES} value={value} onValueChange={setValue} />;
}

function TagPrimChoiceMultiple() {
  const [value, setValue] = useState<string[]>(['corrective', 'inspection']);
  return <TagGroup label="Order types" options={ORDER_TYPES} value={value} onValueChange={setValue} />;
}

function TagPrimClickable() {
  const [opened, setOpened] = useState('');
  return (
    <div className="flex flex-col items-start gap-2">
      <Tag mono variant="outline" onClick={() => setOpened('23-KA-9101')}>
        23-KA-9101
      </Tag>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {opened ? `Opened ${opened}` : 'Click to open the asset'}
      </p>
    </div>
  );
}

function TagPrimDisabled() {
  const [value, setValue] = useState<string[]>(['corrective']);
  return <TagGroup label="Order type, one unavailable" options={ORDER_TYPES_WITH_GAP} value={value} onValueChange={setValue} />;
}

function TagPrimListOverflow() {
  return <TagList label="Labels" tags={WORK_ORDER_LABELS} max={3} />;
}

function TagPrimListNowrap() {
  return (
    <div className="w-full max-w-xs">
      <TagList label="Labels, one line" tags={WORK_ORDER_LABELS} max={2} nowrap />
    </div>
  );
}

function TagPrimListColoured() {
  return (
    <TagList
      label="Disciplines"
      tags={DISCIPLINES.slice(0, 5).map((name) => ({
        id: name,
        label: name,
        colorKey: name,
      }))}
      max={4}
      size="sm"
    />
  );
}

function TagPrimListRemovable() {
  const [tags, setTags] = useState<string[]>(WORK_ORDER_LABELS.slice(0, 4));
  return <TagList label="Editable labels" tags={tags} onRemove={(id) => setTags(tags.filter((tag) => tag !== id))} />;
}

const FILTERS = [
  { id: 'site', label: 'Site', value: 'Nordkapp' },
  { id: 'type', label: 'Type', value: 'Corrective' },
  { id: 'priority', label: 'Priority', value: 'P1, P2' },
  { id: 'assignee', label: 'Assignee', value: 'Tomás Barros' },
];

function TagPrimFilterChips() {
  const [filters, setFilters] = useState(FILTERS);
  return (
    <div className="flex min-h-7 w-full flex-wrap items-center gap-1.5">
      {filters.map((filter) => (
        <Tag
          key={filter.id}
          size="lg"
          removeLabel={`Remove filter ${filter.label}: ${filter.value}`}
          onRemove={() => setFilters(filters.filter((other) => other.id !== filter.id))}
        >
          {`${filter.label}: ${filter.value}`}
        </Tag>
      ))}
      {filters.length > 0 ? (
        <Button variant="ghost" size="sm" onClick={() => setFilters([])}>
          Clear all
        </Button>
      ) : (
        <>
          <span className="text-sm text-muted-foreground">No filters applied</span>
          <Button variant="ghost" size="sm" onClick={() => setFilters(FILTERS)}>
            Restore filters
          </Button>
        </>
      )}
    </div>
  );
}

function TagPrimInput() {
  const [tags, setTags] = useState<string[]>(['vibration', 'bearing']);
  return (
    <div className="flex w-full max-w-md flex-col">
      <Label htmlFor="tag-prim-input">Work order labels</Label>
      <TagInput id="tag-prim-input" label="Work order labels" tags={tags} onChange={setTags} maxTags={6} placeholder="Add a label" />
    </div>
  );
}

function TagPrimAssetCopy() {
  return (
    <div className="flex items-center gap-1">
      <Tag mono size="lg" variant="outline">
        23-KA-9101
      </Tag>
      <CopyButton text="23-KA-9101" label="Copy asset tag" iconOnly variant="ghost" size="icon-sm" />
    </div>
  );
}

const LEGEND = [
  { key: 'Gas', count: 14 },
  { key: 'Condensate', count: 6 },
  { key: 'Water', count: 9 },
  { key: 'Utilities', count: 4 },
];

function TagPrimLegend() {
  return (
    <ul aria-label="Fluid categories" className="flex list-none flex-wrap items-center gap-1.5">
      {LEGEND.map((item) => (
        <li key={item.key}>
          <Tag colorKey={item.key} dot count={item.count}>
            {item.key}
          </Tag>
        </li>
      ))}
    </ul>
  );
}

function TagPrimWorkOrderCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Inspect recompressor drive-end bearing</CardTitle>
          <CardDescription>WO-104482 · 23-KA-9103 Recompressor</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="w-full">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag status="critical" icon={<IconFlame />}>
            P1
          </Tag>
          <Tag status="info">In progress</Tag>
          <Tag colorKey="Rotating" dot>
            Rotating
          </Tag>
          <Tag mono variant="outline">
            23-VT-92740
          </Tag>
        </div>
        <TagList label="Labels" tags={WORK_ORDER_LABELS} max={3} size="sm" variant="outline" />
      </CardContent>
    </Card>
  );
}

function TagPrimSensorTags() {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-sm text-muted-foreground">Time series on 23-KA-9101</p>
      <TagList
        label="Time series"
        mono
        variant="outline"
        tags={SENSORS.slice(0, 6).map((sensor) => ({
          id: sensor.id,
          label: sensor.tag,
        }))}
        max={4}
      />
    </div>
  );
}

function TagPrimDropletDecorative() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag variant="decorative-2" icon={<IconDroplet />}>
        Cooling water
      </Tag>
      <Tag variant="decorative-6" icon={<IconFlame />}>
        Fuel gas
      </Tag>
    </div>
  );
}

export default definePage({
  id: 'tag',
  title: 'Tag',
  summary:
    'A compact label for a category, an identifier or a choice. Static, selectable, removable or clickable, in neutral or decorative colour; status colour only when you ask for it.',
  guidance: {
    use: [
      'Neutral or outline for most tags; decorative colours only to tell categories apart.',
      'Monospace for asset tags and identifiers, so characters are unambiguous.',
      'A tag group for a quick filter: one tab stop, arrow keys move, Space toggles.',
      'A "+N" tag that lists what it hides, so a cell keeps its height.',
    ],
    avoid: [
      'Status colour for a category. It is reachable only through the status prop on purpose.',
      'Long sentences in a tag; truncate with a tooltip or use text.',
      'A remove button without a name: every one says which tag it removes.',
      'Disabling a choice without saying why.',
    ],
  },
  source,
  sections: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Neutral for most, decorative to tell categories apart, status only on request.',
      specimens: [
        {
          id: 'TagPrimNeutral',
          title: 'Neutral',
          note: 'The default for a label that carries no meaning of its own.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimNeutral,
        },
        {
          id: 'TagPrimOutline',
          title: 'Outline',
          note: 'Where many tags repeat and filled chips would be loud.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimOutline,
        },
        {
          id: 'TagPrimSizes',
          title: 'Sizes',
          note: 'Small matches Badge, large matches a small button for filter rows.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimSizes,
        },
        {
          id: 'TagPrimDecorative',
          title: 'Decorative 1 to 7',
          note: 'Seven accents for telling categories apart, never for status.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx', 'primitives/tag/tagVariants.ts'],
          Component: TagPrimDecorative,
        },
        {
          id: 'TagPrimColorKey',
          title: 'Colour from a key',
          note: 'The same category gets the same colour on every screen, without anyone choosing.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimColorKey,
        },
        {
          id: 'TagPrimStatus',
          title: 'Explicit status',
          note: 'A judged state, asked for by name, with a word and an icon as well as colour.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimStatus,
        },
        {
          id: 'TagPrimDropletDecorative',
          title: 'Decorative with icon',
          note: 'An icon helps tell categories apart where colour alone would not.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimDropletDecorative,
        },
      ],
    },
    {
      id: 'content',
      title: 'Sizes and content',
      description: 'Heights 20, 24 and 28 px, and what can sit in front of or after the text.',
      specimens: [
        {
          id: 'TagPrimMono',
          title: 'Monospace',
          note: 'Asset tags and identifiers, where every character matters.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimMono,
        },
        {
          id: 'TagPrimLeadingIcon',
          title: 'Leading icon',
          note: 'An icon for the kind of thing, such as an order type.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimLeadingIcon,
        },
        {
          id: 'TagPrimLeadingDot',
          title: 'Leading dot',
          note: 'Pairs a tag with a series or legend entry in the same colour.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimLeadingDot,
        },
        {
          id: 'TagPrimAvatar',
          title: 'Leading avatar',
          note: 'A person or a team as a tag, such as an assignee.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx', 'display/PersonAvatar.tsx'],
          Component: TagPrimAvatar,
        },
        {
          id: 'TagPrimCount',
          title: 'With count',
          note: 'How many records carry the tag.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimCount,
        },
        {
          id: 'TagPrimTruncated',
          title: 'Truncated with tooltip',
          note: 'A long name capped by width; hover or focus shows all of it.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimTruncated,
        },
        {
          id: 'TagPrimAssetCopy',
          title: 'Asset tag with copy',
          note: 'An identifier people paste into other systems.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx', 'actions/CopyButton.tsx'],
          Component: TagPrimAssetCopy,
        },
      ],
    },
    {
      id: 'interaction',
      title: 'Removing and choosing',
      description: 'Tags that act: remove, toggle, choose one or several, open.',
      specimens: [
        {
          id: 'TagPrimRemovable',
          title: 'Removable',
          note: 'The remove button names its tag. Click each to try.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimRemovable,
        },
        {
          id: 'TagPrimSelectable',
          title: 'Selectable toggle',
          note: 'One on-off filter, with aria-pressed and a check mark when on.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimSelectable,
        },
        {
          id: 'TagPrimClickable',
          title: 'Clickable',
          note: 'A tag that opens the thing it names, such as an asset.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimClickable,
        },
        {
          id: 'TagPrimChoiceSingle',
          title: 'Choice group, single',
          note: 'Pick exactly one. Arrow keys move focus, Space chooses.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/TagGroup.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagPrimChoiceSingle,
        },
        {
          id: 'TagPrimChoiceMultiple',
          title: 'Choice group, multiple',
          note: 'Quick filters that combine; counts say what each would show.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/TagGroup.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagPrimChoiceMultiple,
        },
        {
          id: 'TagPrimDisabled',
          title: 'Disabled with reason',
          note: 'Stays focusable so the reason can be read: hover or tab to Inspection.',
          origin: 'custom',
          size: 'full',
          uses: ['primitives/tag/TagGroup.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagPrimDisabled,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists of tags',
      description: 'Many tags in a small space.',
      specimens: [
        {
          id: 'TagPrimListOverflow',
          title: 'Overflow count',
          note: 'The rest fold into "+N", which lists them on hover and focus.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/TagList.tsx'],
          Component: TagPrimListOverflow,
        },
        {
          id: 'TagPrimListNowrap',
          title: 'One line',
          note: 'A table cell or card header that keeps its height.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagList.tsx'],
          Component: TagPrimListNowrap,
        },
        {
          id: 'TagPrimListColoured',
          title: 'Coloured by key',
          note: 'Categories with stable colours, small for dense rows.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/TagList.tsx'],
          Component: TagPrimListColoured,
        },
        {
          id: 'TagPrimListRemovable',
          title: 'Editable list',
          note: 'Every tag removable; the list keeps its name for assistive technology.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/TagList.tsx'],
          Component: TagPrimListRemovable,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Tags doing a job on a real screen.',
      specimens: [
        {
          id: 'TagPrimFilterChips',
          title: 'Filter chips row',
          note: 'Applied filters, each removable, with one way to clear or restore them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimFilterChips,
        },
        {
          id: 'TagPrimInput',
          title: 'Tag input',
          note: 'Type and press Enter or a comma; paste a list; Backspace removes the last.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/TagInput.tsx', 'primitives/tag/Tag.tsx'],
          Component: TagPrimInput,
        },
        {
          id: 'TagPrimLegend',
          title: 'Category legend',
          note: 'Dot and colour from the same key as the chart series, with counts.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/Tag.tsx'],
          Component: TagPrimLegend,
        },
        {
          id: 'TagPrimWorkOrderCard',
          title: 'Work order card',
          note: 'Status by request, category by colour, identifiers in monospace, labels folded.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/tag/Tag.tsx', 'primitives/tag/TagList.tsx'],
          Component: TagPrimWorkOrderCard,
        },
        {
          id: 'TagPrimSensorTags',
          title: 'Time series tags',
          note: 'Instrument tags in monospace with the overflow listing the rest.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/tag/TagList.tsx'],
          Component: TagPrimSensorTags,
        },
      ],
    },
  ],
});
