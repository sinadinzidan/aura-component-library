import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconActivity,
  IconAlertCircle,
  IconAlertTriangle,
  IconAlertTriangleFilled,
  IconArrowLeft,
  IconBell,
  IconBolt,
  IconBuildingFactory2,
  IconCalendar,
  IconChartLine,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconCircleX,
  IconClock,
  IconCopy,
  IconDatabase,
  IconDotsVertical,
  IconDownload,
  IconDroplet,
  IconEngine,
  IconExternalLink,
  IconFileText,
  IconFilter,
  IconFlame,
  IconFolder,
  IconGauge,
  IconGridDots,
  IconHome,
  IconInfoCircle,
  IconInfoCircleFilled,
  IconMapPin,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconReload,
  IconSearch,
  IconSettings,
  IconSettingsAutomation,
  IconShare,
  IconTable,
  IconTemperature,
  IconTimeline,
  IconTool,
  IconTrash,
  IconUpload,
  IconX,
} from '@cognite/aura/icons';

import { definePage } from '../../types';

import source from './icons.tsx?raw';

type IconComponent = typeof IconPlus;

type IconEntry = {
  /** Named export from `@cognite/aura/icons`. */
  name: string;
  /** What the icon means in Aura; do not repurpose it. */
  concept: string;
  Icon: IconComponent;
};

const ACTION_ICONS: readonly IconEntry[] = [
  { name: 'IconPlus', concept: 'Add, create', Icon: IconPlus },
  { name: 'IconPencil', concept: 'Edit', Icon: IconPencil },
  { name: 'IconTrash', concept: 'Delete', Icon: IconTrash },
  { name: 'IconCopy', concept: 'Copy', Icon: IconCopy },
  { name: 'IconDownload', concept: 'Download', Icon: IconDownload },
  { name: 'IconUpload', concept: 'Upload', Icon: IconUpload },
  { name: 'IconSearch', concept: 'Search', Icon: IconSearch },
  { name: 'IconFilter', concept: 'Filter', Icon: IconFilter },
  { name: 'IconShare', concept: 'Share', Icon: IconShare },
  { name: 'IconReload', concept: 'Refresh view', Icon: IconReload },
  { name: 'IconRefresh', concept: 'Sync data', Icon: IconRefresh },
  { name: 'IconCheck', concept: 'Save, confirm', Icon: IconCheck },
  { name: 'IconX', concept: 'Close, remove', Icon: IconX },
  { name: 'IconSettings', concept: 'Settings', Icon: IconSettings },
  { name: 'IconBell', concept: 'Notifications', Icon: IconBell },
  { name: 'IconDotsVertical', concept: 'More options', Icon: IconDotsVertical },
];

const NAVIGATION_ICONS: readonly IconEntry[] = [
  { name: 'IconHome', concept: 'Home', Icon: IconHome },
  { name: 'IconArrowLeft', concept: 'Back', Icon: IconArrowLeft },
  { name: 'IconChevronDown', concept: 'Open, expand', Icon: IconChevronDown },
  { name: 'IconChevronUp', concept: 'Close, collapse', Icon: IconChevronUp },
  { name: 'IconChevronRight', concept: 'Next, drill in', Icon: IconChevronRight },
  { name: 'IconChevronLeft', concept: 'Previous', Icon: IconChevronLeft },
  { name: 'IconExternalLink', concept: 'Opens elsewhere', Icon: IconExternalLink },
  { name: 'IconGridDots', concept: 'App switcher', Icon: IconGridDots },
  { name: 'IconMapPin', concept: 'Location, site', Icon: IconMapPin },
];

const DATA_ICONS: readonly IconEntry[] = [
  { name: 'IconDatabase', concept: 'Data set', Icon: IconDatabase },
  { name: 'IconTable', concept: 'Table', Icon: IconTable },
  { name: 'IconChartLine', concept: 'Chart', Icon: IconChartLine },
  { name: 'IconTimeline', concept: 'Time series', Icon: IconTimeline },
  { name: 'IconFileText', concept: 'Document', Icon: IconFileText },
  { name: 'IconFolder', concept: 'Folder', Icon: IconFolder },
  { name: 'IconClock', concept: 'Time', Icon: IconClock },
  { name: 'IconCalendar', concept: 'Date', Icon: IconCalendar },
];

const STATUS_ICONS: readonly IconEntry[] = [
  { name: 'IconCircleCheck', concept: 'Success', Icon: IconCircleCheck },
  { name: 'IconAlertTriangle', concept: 'Warning', Icon: IconAlertTriangle },
  { name: 'IconAlertCircle', concept: 'Critical', Icon: IconAlertCircle },
  { name: 'IconCircleX', concept: 'Failed', Icon: IconCircleX },
  { name: 'IconInfoCircle', concept: 'Info', Icon: IconInfoCircle },
  { name: 'IconCircleDashed', concept: 'Draft, pending', Icon: IconCircleDashed },
];

const INDUSTRIAL_ICONS: readonly IconEntry[] = [
  { name: 'IconGauge', concept: 'Pressure, gauge', Icon: IconGauge },
  { name: 'IconBolt', concept: 'Power', Icon: IconBolt },
  { name: 'IconFlame', concept: 'Heat, flare', Icon: IconFlame },
  { name: 'IconDroplet', concept: 'Fluid, flow', Icon: IconDroplet },
  { name: 'IconTemperature', concept: 'Temperature', Icon: IconTemperature },
  { name: 'IconActivity', concept: 'Vibration, signal', Icon: IconActivity },
  { name: 'IconEngine', concept: 'Rotating equipment', Icon: IconEngine },
  { name: 'IconTool', concept: 'Maintenance', Icon: IconTool },
  { name: 'IconSettingsAutomation', concept: 'Automation', Icon: IconSettingsAutomation },
  { name: 'IconBuildingFactory2', concept: 'Plant', Icon: IconBuildingFactory2 },
];

const ICON_SIZES = [
  { classes: 'size-3', px: '12px', use: 'Inside badges and dense chips' },
  { classes: 'size-3.5', px: '14px', use: 'Small controls and metadata' },
  { classes: 'size-4', px: '16px', use: 'Default' },
  { classes: 'size-6', px: '24px', use: 'Empty states and feature tiles' },
] as const;

const ICON_STROKES = [
  { classes: 'stroke-1', value: '1', use: 'Too light at 16px' },
  { classes: 'stroke-[1.5]', value: '1.5', use: 'Default' },
  { classes: 'stroke-2', value: '2', use: 'Tabler default; heavy next to Inter' },
] as const;

const ICON_COLORS = [
  { classes: 'text-base-foreground', token: 'base-foreground', use: 'Icons that act as content' },
  { classes: 'text-medium-foreground', token: 'medium-foreground', use: 'Inside fields and fills' },
  { classes: 'text-muted-foreground', token: 'muted-foreground', use: 'Metadata and decoration' },
  { classes: 'text-link-foreground', token: 'link-foreground', use: 'Next to a link' },
  { classes: 'text-base-foreground-disabled', token: 'base-foreground-disabled', use: 'Inert control' },
] as const;

const STATUS_LINES = [
  { text: 'Calibration complete', classes: 'text-success-foreground-strong', Icon: IconCircleCheck },
  { text: 'Drive-end vibration approaching limit', classes: 'text-warning-foreground-strong', Icon: IconAlertTriangle },
  { text: 'Recompressor tripped on high vibration', classes: 'text-critical-foreground-strong', Icon: IconAlertCircle },
  { text: 'Standby start test scheduled', classes: 'text-info-foreground-strong', Icon: IconInfoCircle },
  { text: 'Work order not started', classes: 'text-neutral-foreground-strong', Icon: IconCircleDashed },
] as const;

const STATUS_CHIPS = [
  { text: 'Running', classes: 'bg-success-background text-success-foreground', Icon: IconCircleCheck },
  { text: 'Degraded', classes: 'bg-warning-background text-warning-foreground', Icon: IconAlertTriangle },
  { text: 'Tripped', classes: 'bg-critical-background text-critical-foreground', Icon: IconAlertCircle },
  { text: 'In progress', classes: 'bg-info-background text-info-foreground', Icon: IconInfoCircle },
] as const;

function IconGrid({ icons }: { icons: readonly IconEntry[] }) {
  return (
    <ul className="grid w-full grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] content-start gap-x-1 gap-y-5">
      {icons.map(({ name, concept, Icon }) => (
        <li key={name} className="flex min-w-0 flex-col items-start gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-medium-background text-base-foreground">
            <Icon className="size-4 stroke-[1.5]" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-xs break-all text-base-foreground">{name}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{concept}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function IconsDefault() {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-base-foreground">
        <IconGauge className="size-4 stroke-[1.5]" aria-hidden />
      </span>
      <p className="font-mono text-xs text-muted-foreground">size-4 stroke-[1.5]</p>
      <p className="text-xs text-muted-foreground">16px, 1.5px stroke, currentColor</p>
    </div>
  );
}

function IconsSizes() {
  return (
    <div className="grid w-full grid-cols-4 gap-4">
      {ICON_SIZES.map((item) => (
        <div key={item.classes} className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-8 items-center text-base-foreground">
            <IconGauge className={`stroke-[1.5] ${item.classes}`} aria-hidden />
          </span>
          <p className="font-mono text-xs text-base-foreground">{item.classes}</p>
          <p className="text-xs text-muted-foreground">
            {item.px} · {item.use}
          </p>
        </div>
      ))}
    </div>
  );
}

function IconsStroke() {
  return (
    <div className="grid w-full grid-cols-3 gap-4">
      {ICON_STROKES.map((item) => (
        <div key={item.classes} className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-8 items-center text-base-foreground">
            <IconSettingsAutomation className={`size-6 ${item.classes}`} aria-hidden />
          </span>
          <p className="font-mono text-xs text-base-foreground">{item.classes}</p>
          <p className="text-xs text-muted-foreground">{item.use}</p>
        </div>
      ))}
    </div>
  );
}

function IconsFilled() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-6">
        <span className="flex flex-col items-center gap-2 text-base-foreground">
          <IconInfoCircle className="size-6 stroke-[1.5]" aria-hidden />
          <span className="text-xs text-muted-foreground">Outline</span>
        </span>
        <span className="flex flex-col items-center gap-2 text-base-foreground">
          <IconInfoCircleFilled className="size-6" aria-hidden />
          <span className="text-xs text-muted-foreground">Filled</span>
        </span>
      </div>
      <p className="font-mono text-xs text-muted-foreground">IconInfoCircle · IconInfoCircleFilled</p>
    </div>
  );
}

function IconsColorRoles() {
  return (
    <ul className="flex w-full flex-col gap-3">
      {ICON_COLORS.map((item) => (
        <li key={item.token} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-3">
          <span className={item.classes}>
            <IconDatabase className="size-4 stroke-[1.5]" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-xs text-base-foreground">{item.classes}</span> · {item.use}
          </p>
        </li>
      ))}
    </ul>
  );
}

function IconsInheritColor() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="flex items-center gap-2 text-sm text-base-foreground">
        <IconMapPin className="size-4 stroke-[1.5]" aria-hidden /> Nordkapp plant
      </p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconClock className="size-4 stroke-[1.5]" aria-hidden /> Updated 4 minutes ago
      </p>
      <p className="flex items-center gap-2 text-sm text-link-foreground">
        Open in asset explorer <IconExternalLink className="size-4 stroke-[1.5]" aria-hidden />
      </p>
    </div>
  );
}

function IconsWithLabel() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary">
        <IconDownload /> Export data
      </Button>
      <Button>
        <IconPlus /> Add data set
      </Button>
    </div>
  );
}

function IconsTrailing() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline">
        Site <IconChevronDown />
      </Button>
      <Button variant="ghost">
        Open docs <IconExternalLink />
      </Button>
    </div>
  );
}

function IconsIconOnlyButton() {
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Refresh view">
              <IconReload />
            </Button>
          }
        />
        <TooltipContent>Refresh view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Filter alarms">
              <IconFilter />
            </Button>
          }
        />
        <TooltipContent>Filter alarms</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="More options">
              <IconDotsVertical />
            </Button>
          }
        />
        <TooltipContent>More options</TooltipContent>
      </Tooltip>
    </div>
  );
}

function IconsMetadataRow() {
  return (
    <div className="flex w-full max-w-sm flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <IconMapPin className="size-3.5 stroke-[1.5]" aria-hidden /> Gas compression
      </span>
      <span className="flex items-center gap-1">
        <IconTool className="size-3.5 stroke-[1.5]" aria-hidden /> Corrective
      </span>
      <span className="flex items-center gap-1">
        <IconCalendar className="size-3.5 stroke-[1.5]" aria-hidden /> Due in 6 hours
      </span>
    </div>
  );
}

function IconsStatusLines() {
  return (
    <ul className="flex w-full flex-col gap-3">
      {STATUS_LINES.map(({ text, classes, Icon }) => (
        <li key={text} className={`flex items-center gap-2 text-sm ${classes}`}>
          <Icon className="size-4 shrink-0 stroke-[1.5]" aria-hidden />
          <span className="min-w-0 truncate">{text}</span>
        </li>
      ))}
    </ul>
  );
}

function IconsStatusChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {STATUS_CHIPS.map(({ text, classes, Icon }) => (
        <span key={text} className={`flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium ${classes}`}>
          <Icon className="size-3.5 stroke-[1.5]" aria-hidden /> {text}
        </span>
      ))}
    </div>
  );
}

function IconsStatusFilled() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-start gap-3 rounded-lg bg-success-background p-3 text-success-foreground">
        <IconCircleCheckFilled className="size-4 shrink-0" aria-hidden />
        <p className="text-sm">Transformation finished. 18,240 rows written.</p>
      </div>
      <div className="flex items-start gap-3 rounded-lg bg-warning-background p-3 text-warning-foreground">
        <IconAlertTriangleFilled className="size-4 shrink-0" aria-hidden />
        <p className="text-sm">Cooler outlet temperature has uncertain quality.</p>
      </div>
    </div>
  );
}

function IconsActions() {
  return <IconGrid icons={ACTION_ICONS} />;
}

function IconsNavigation() {
  return <IconGrid icons={NAVIGATION_ICONS} />;
}

function IconsData() {
  return <IconGrid icons={DATA_ICONS} />;
}

function IconsStatusSet() {
  return <IconGrid icons={STATUS_ICONS} />;
}

function IconsIndustrial() {
  return <IconGrid icons={INDUSTRIAL_ICONS} />;
}

function IconsConsistentSizes() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <p className="text-xs font-medium text-success-foreground-strong">Do</p>
      <ul className="flex flex-col gap-3 text-sm text-base-foreground">
        <li className="flex items-center gap-2">
          <IconGauge className="size-4 stroke-[1.5]" aria-hidden /> Discharge pressure
        </li>
        <li className="flex items-center gap-2">
          <IconTemperature className="size-4 stroke-[1.5]" aria-hidden /> Discharge temperature
        </li>
        <li className="flex items-center gap-2">
          <IconActivity className="size-4 stroke-[1.5]" aria-hidden /> Drive-end vibration
        </li>
      </ul>
    </div>
  );
}

function IconsMixedSizes() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <p className="text-xs font-medium text-critical-foreground-strong">Don&apos;t</p>
      <ul className="flex flex-col gap-3 text-sm text-base-foreground">
        <li className="flex items-center gap-2">
          <IconGauge className="size-6 stroke-2" aria-hidden /> Discharge pressure
        </li>
        <li className="flex items-center gap-2">
          <IconTemperature className="size-3 stroke-1" aria-hidden /> Discharge temperature
        </li>
        <li className="flex items-center gap-2">
          <IconActivity className="size-5 stroke-[1.5]" aria-hidden /> Drive-end vibration
        </li>
      </ul>
    </div>
  );
}

export default definePage({
  id: 'icons',
  title: 'Icons',
  summary:
    'System icons are functional shorthand for actions, state and navigation. Aura uses Tabler icons, re-exported from @cognite/aura/icons: one colour, 16px by default, and each name keeps one meaning across the product.',
  guidance: {
    use: [
      'Named imports from @cognite/aura/icons, at 16px with a 1.5px stroke.',
      'currentColor: set the colour on the text or control, not on the glyph.',
      'An icon next to a label to reinforce the verb, with the icon hidden from assistive tech.',
      'aria-label and a Tooltip on every icon-only control.',
    ],
    avoid: [
      'Repurposing an icon for a different meaning than its name.',
      'Mixed sizes or stroke weights in one row, list or toolbar.',
      'Status colour on an icon with no text or label beside it.',
      'Hover or focus styling on the raw icon; states belong to the control.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Size and stroke',
      description: 'One default, four accepted sizes, one stroke weight.',
      specimens: [
        {
          id: 'IconsDefault',
          title: 'Default icon',
          note: 'Start here; change size only to match the density of the component around it.',
          origin: 'aura',
          Component: IconsDefault,
        },
        {
          id: 'IconsSizes',
          title: 'Sizes',
          note: 'Match the icon to its text: 12 and 14 with text-xs, 16 with text-sm, 24 when it stands alone.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: IconsSizes,
        },
        {
          id: 'IconsStroke',
          title: 'Stroke weight',
          note: 'Keep 1.5 everywhere so icons sit at the same visual weight as Inter.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: IconsStroke,
        },
        {
          id: 'IconsFilled',
          title: 'Outline and filled',
          note: 'Outline for actions and navigation; filled inside alerts, toasts and app chrome.',
          origin: 'aura',
          size: 'md',
          Component: IconsFilled,
        },
      ],
    },
    {
      id: 'colour',
      title: 'Colour',
      description: 'Icons take the colour of the text they sit in.',
      specimens: [
        {
          id: 'IconsColorRoles',
          title: 'Colour roles',
          note: 'The same foreground roles as text; the icon never gets a colour of its own.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: IconsColorRoles,
        },
        {
          id: 'IconsInheritColor',
          title: 'Inherited from text',
          note: 'Put the icon inside the text element and it follows base, muted or link colour for free.',
          origin: 'aura',
          size: 'md',
          Component: IconsInheritColor,
        },
      ],
    },
    {
      id: 'pairing',
      title: 'Pairing with text and controls',
      description: 'An icon rarely stands alone.',
      specimens: [
        {
          id: 'IconsWithLabel',
          title: 'Leading icon and label',
          note: 'The icon reinforces the verb; the label still does the talking.',
          origin: 'aura',
          Component: IconsWithLabel,
        },
        {
          id: 'IconsTrailing',
          title: 'Trailing icon',
          note: 'Chevrons and external-link marks that say what happens next.',
          origin: 'aura',
          Component: IconsTrailing,
        },
        {
          id: 'IconsIconOnlyButton',
          title: 'Icon-only with tooltip',
          note: 'Only for widely recognised icons in tight toolbars; always named and explained.',
          origin: 'aura',
          Component: IconsIconOnlyButton,
        },
        {
          id: 'IconsMetadataRow',
          title: 'Metadata row',
          note: 'Small muted icons that help scan a row of facts at text-xs.',
          origin: 'aura',
          size: 'md',
          Component: IconsMetadataRow,
        },
        {
          id: 'IconsStatusChips',
          title: 'Status on a tint',
          note: 'A filled chip: the icon takes the status foreground along with the text.',
          origin: 'aura',
          size: 'md',
          Component: IconsStatusChips,
        },
        {
          id: 'IconsStatusLines',
          title: 'Status with text',
          note: 'Status on a plain surface: icon and text share the strong status colour.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: IconsStatusLines,
        },
        {
          id: 'IconsStatusFilled',
          title: 'Filled status icons',
          note: 'Inside an alert or toast surface, where the filled glyph carries more weight.',
          origin: 'aura',
          size: 'md',
          Component: IconsStatusFilled,
        },
      ],
    },
    {
      id: 'common-set',
      title: 'Common icons',
      description: 'A curated set with the import name of each. Use these before searching for an alternative.',
      specimens: [
        {
          id: 'IconsActions',
          title: 'Actions',
          note: 'Operations that change state or content, in buttons, toolbars and menus.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: IconsActions,
        },
        {
          id: 'IconsNavigation',
          title: 'Navigation',
          note: 'Where you are and where you can go: sidebars, breadcrumbs, pagination, disclosure.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: IconsNavigation,
        },
        {
          id: 'IconsData',
          title: 'Data',
          note: 'Resource types in lists, search results and empty states.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          Component: IconsData,
        },
        {
          id: 'IconsIndustrial',
          title: 'Industrial',
          note: 'Measurement and equipment types on asset, sensor and work order views.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          Component: IconsIndustrial,
        },
        {
          id: 'IconsStatusSet',
          title: 'Status',
          note: 'One glyph per status family, always paired with its colour and a label.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          Component: IconsStatusSet,
        },
      ],
    },
    {
      id: 'consistency',
      title: 'Consistency',
      description: 'Icons in one group share a size and a stroke.',
      specimens: [
        {
          id: 'IconsConsistentSizes',
          title: 'One size per group',
          note: 'Every icon in a list, menu or toolbar at the same size and stroke.',
          origin: 'aura',
          size: 'md',
          Component: IconsConsistentSizes,
        },
        {
          id: 'IconsMixedSizes',
          title: 'Mixed sizes',
          note: 'Shown as a counter-example: uneven icons break the left edge and imply a ranking.',
          origin: 'aura',
          size: 'md',
          Component: IconsMixedSizes,
        },
      ],
    },
  ],
});
