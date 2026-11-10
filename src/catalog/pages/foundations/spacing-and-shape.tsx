import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { IconDownload, IconFilter, IconRefresh } from '@cognite/aura/icons';

import { definePage } from '../../types';

import source from './spacing-and-shape.tsx?raw';

const SPACING_STEPS = [
  { name: 'xs', px: '4px', step: '1', bar: 'w-1', use: 'Tight gaps, icon padding' },
  { name: 'sm', px: '8px', step: '2', bar: 'w-2', use: 'Inline controls, compact padding' },
  { name: 'md', px: '12px', step: '3', bar: 'w-3', use: 'Toolbar items, popover padding' },
  { name: 'lg', px: '16px', step: '4', bar: 'w-4', use: 'Card padding, related groups' },
  { name: 'xl', px: '20px', step: '5', bar: 'w-5', use: 'Sections' },
  { name: '2xl', px: '24px', step: '6', bar: 'w-6', use: 'Page regions, dashboard gaps' },
  { name: '3xl', px: '32px', step: '8', bar: 'w-8', use: 'Large layout gaps' },
] as const;

const STACK_RHYTHM = [
  { classes: 'space-y-8', px: '32px', bar: 'h-8', use: 'Between major page sections' },
  { classes: 'space-y-6', px: '24px', bar: 'h-6', use: 'Between sections within a page' },
  { classes: 'space-y-4', px: '16px', bar: 'h-4', use: 'Between items in a section and form fields' },
] as const;

const RADIUS_STEPS = [
  { name: 'none', px: '0', shape: 'rounded-none', use: 'Dividers, full-bleed' },
  { name: 'xs', px: '2px', shape: 'rounded-xs', use: 'Tight inner chrome' },
  { name: 'sm', px: '4px', shape: 'rounded-sm', use: 'Badges, small controls' },
  { name: 'md', px: '6px', shape: 'rounded-md', use: 'Small tiles, menu items' },
  { name: 'lg', px: '8px', shape: 'rounded-lg', use: 'Buttons, inputs' },
  { name: 'xl', px: '12px', shape: 'rounded-xl', use: 'Cards, dialogs, popovers' },
  { name: '2xl', px: '16px', shape: 'rounded-2xl', use: 'Extra-large surfaces' },
  { name: '3xl', px: '24px', shape: 'rounded-3xl', use: 'Marketing panels' },
  { name: '4xl', px: '32px', shape: 'rounded-4xl', use: 'Largest marketing rounding' },
  { name: 'full', px: '9999px', shape: 'rounded-full', use: 'Pills, avatars' },
] as const;

const BORDER_COLORS = [
  { classes: 'border border-default', token: 'border-default', use: 'Resting outline and dividers' },
  { classes: 'border border-emphasized', token: 'border-emphasized', use: 'Hover or stronger separation' },
  { classes: 'border border-disabled', token: 'border-disabled', use: 'Outline of an inert control' },
] as const;

const HEIGHTS = [
  { px: '20px', box: 'h-5', classes: 'h-5', use: 'Badge, count' },
  { px: '28px', box: 'h-7', classes: 'h-7', use: 'Small button, toolbar control' },
  { px: '36px', box: 'h-9', classes: 'h-9', use: 'Default button, input, select' },
  { px: '40px', box: 'h-10', classes: 'h-10', use: 'Large button' },
] as const;

const MAX_WIDTHS = [
  { classes: 'max-w-sm', px: '384px', bar: 'w-[30%]', use: 'Search inputs, narrow controls' },
  { classes: 'max-w-[37.5rem]', px: '600px', bar: 'w-[47%]', use: 'Continuous body text' },
  { classes: 'max-w-2xl', px: '640px', bar: 'w-[50%]', use: 'Forms, wizard step content' },
  { classes: 'max-w-4xl', px: '896px', bar: 'w-[70%]', use: 'Detail pages' },
  { classes: 'max-w-7xl', px: '1280px', bar: 'w-full', use: 'Dashboards, full-width layouts' },
] as const;

const READINGS = [
  { name: 'Discharge pressure', value: '48.6 barg' },
  { name: 'Suction pressure', value: '12.4 barg' },
  { name: 'Shaft speed', value: '9,840 rpm' },
] as const;

function Block({ label }: { label: string }) {
  return (
    <div className="flex h-12 min-w-0 items-center justify-center rounded-lg bg-medium-background px-2">
      <span className="truncate font-mono text-xs text-medium-foreground">{label}</span>
    </div>
  );
}

function SpacingScale() {
  return (
    <div className="flex w-full flex-col gap-3">
      {SPACING_STEPS.map((item) => (
        <div key={item.name} className="grid grid-cols-[3rem_3rem_5rem_minmax(0,1fr)] items-center gap-4">
          <p className="text-sm font-medium text-base-foreground">{item.name}</p>
          <p className="text-sm text-muted-foreground tabular-nums">{item.px}</p>
          <div className="flex items-center">
            <div className={`h-6 rounded-xs bg-info-background ${item.bar}`} />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-xs text-base-foreground">
              gap-{item.step} · p-{item.step}
            </span>{' '}
            · {item.use}
          </p>
        </div>
      ))}
    </div>
  );
}

function SpacingBaseUnit() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-1">
        <div className="size-1 bg-info-foreground-strong" />
        <div className="size-2 bg-info-foreground-strong" />
        <div className="size-3 bg-info-foreground-strong" />
        <div className="size-4 bg-info-foreground-strong" />
        <div className="size-6 bg-info-foreground-strong" />
        <div className="size-8 bg-info-foreground-strong" />
      </div>
      <p className="text-xs text-muted-foreground">One Tailwind unit = 4px. Every size is a multiple.</p>
    </div>
  );
}

function SpacingGapControls() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Save changes</Button>
      </div>
      <p className="font-mono text-xs text-muted-foreground">gap-2 · 8px</p>
    </div>
  );
}

function SpacingGapToolbar() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <div className="w-40">
          <Input aria-label="Search time series" placeholder="Search time series" />
        </div>
        <Button variant="outline">
          <IconFilter /> Filter
        </Button>
        <Button variant="outline">
          <IconDownload /> Export
        </Button>
      </div>
      <p className="font-mono text-xs text-muted-foreground">gap-3 · 12px</p>
    </div>
  );
}

function SpacingGapCards() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-4">
        {READINGS.map((reading) => (
          <div key={reading.name} className="flex min-w-0 flex-col gap-1 rounded-xl bg-card-background p-4">
            <p className="truncate text-xs text-muted-foreground">{reading.name}</p>
            <p className="truncate text-sm font-medium text-card-foreground tabular-nums">{reading.value}</p>
          </div>
        ))}
      </div>
      <p className="font-mono text-xs text-muted-foreground">gap-4 · 16px between cards</p>
    </div>
  );
}

function SpacingGapDashboard() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex h-32 flex-col justify-between rounded-xl bg-card-background p-4">
          <p className="text-sm font-medium text-card-foreground">Gas flow, last 24 hours</p>
          <p className="text-xs text-muted-foreground">Chart panel</p>
        </div>
        <div className="flex h-32 flex-col justify-between rounded-xl bg-card-background p-4">
          <p className="text-sm font-medium text-card-foreground">Active alarms</p>
          <p className="text-xs text-muted-foreground">List panel</p>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">gap-6 · 24px between dashboard panels</p>
    </div>
  );
}

function SpacingStackRhythm() {
  return (
    <div className="flex w-full flex-col gap-4">
      {STACK_RHYTHM.map((item) => (
        <div key={item.classes} className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-4">
          <div className="flex justify-center">
            <div className={`w-6 rounded-xs bg-info-background ${item.bar}`} />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-xs text-base-foreground">{item.classes}</span> · {item.px} · {item.use}
          </p>
        </div>
      ))}
    </div>
  );
}

function SpacingLabelAndField() {
  return (
    <div className="w-full max-w-xs space-y-4">
      <div>
        <Label htmlFor="spacing-field-name">Data set name</Label>
        <Input id="spacing-field-name" defaultValue="Nordkapp historian" />
      </div>
      <div>
        <Label htmlFor="spacing-field-owner">Owner</Label>
        <Input id="spacing-field-owner" defaultValue="Ingrid Haugen" />
      </div>
    </div>
  );
}

function SpacingCardPadding() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <div className="rounded-xl bg-info-background p-4">
          <div className="rounded-md bg-card-background p-3">
            <p className="text-sm font-medium text-card-foreground">Export pump A</p>
            <p className="text-xs text-muted-foreground">Running</p>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">p-4 · 16px · default card</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-xl bg-info-background p-6">
          <div className="rounded-md bg-card-background p-3">
            <p className="text-sm font-medium text-card-foreground">Export pump A</p>
            <p className="text-xs text-muted-foreground">Running</p>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">p-6 · 24px · larger card</p>
      </div>
    </div>
  );
}

function SpacingPagePadding() {
  return (
    <div className="grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-4">
      <div className="flex flex-col gap-2">
        <div className="rounded-lg bg-info-background px-6 py-8">
          <div className="flex h-16 items-center justify-center rounded-md bg-base-background">
            <p className="text-xs text-muted-foreground">Content</p>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">px-6 py-8 · desktop</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-lg bg-info-background px-4 py-6">
          <div className="flex h-20 items-center justify-center rounded-md bg-base-background">
            <p className="text-xs text-muted-foreground">Content</p>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">px-4 py-6 · mobile</p>
      </div>
    </div>
  );
}

function SpacingRadiusScale() {
  return (
    <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-5">
      {RADIUS_STEPS.map((item) => (
        <div key={item.name} className="flex min-w-0 flex-col gap-2">
          <div className={`h-20 border border-emphasized bg-medium-background ${item.shape}`} />
          <div>
            <p className="font-mono text-xs text-base-foreground">
              {item.shape} <span className="text-muted-foreground">· {item.px}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.use}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpacingRadiusInUse() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-card-background p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-decorative-2-background text-xs font-semibold text-decorative-2-foreground">
          IH
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-card-foreground">Ingrid Haugen</p>
          <p className="text-xs text-muted-foreground">Control room operator</p>
        </div>
        <Badge variant="success">On shift</Badge>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">
          View profile
        </Button>
        <Button variant="secondary" size="sm">
          Send message
        </Button>
      </div>
    </div>
  );
}

function SpacingRadiusNested() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl bg-card-background p-2">
        <div className="flex h-16 w-40 items-center justify-center rounded-md bg-medium-background">
          <p className="font-mono text-xs text-medium-foreground">rounded-md</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Outer <span className="font-mono">rounded-xl</span>, 8px padding, inner one or two steps down.
      </p>
    </div>
  );
}

function SpacingBorderWidths() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex h-16 items-center rounded-lg border border-default px-3">
          <p className="text-sm text-base-foreground">Default</p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">border · 1px</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex h-16 items-center rounded-lg border-2 border-emphasized px-3">
          <p className="text-sm text-base-foreground">Emphasized</p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">border-2 · 2px</p>
      </div>
    </div>
  );
}

function SpacingBorderColors() {
  return (
    <div className="flex w-full flex-col gap-3">
      {BORDER_COLORS.map((item) => (
        <div key={item.token} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${item.classes}`}>
          <p className="font-mono text-xs text-base-foreground">{item.token}</p>
          <p className="text-xs text-muted-foreground">{item.use}</p>
        </div>
      ))}
    </div>
  );
}

function SpacingSeparateWithSpace() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl bg-card-background p-4">
      <p className="text-xs font-medium text-success-foreground-strong">Do</p>
      {READINGS.map((reading) => (
        <div key={reading.name} className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted-foreground">{reading.name}</p>
          <p className="text-sm text-card-foreground tabular-nums">{reading.value}</p>
        </div>
      ))}
    </div>
  );
}

function SpacingBorderEveryRow() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-xl border border-default bg-card-background p-4">
      <p className="text-xs font-medium text-critical-foreground-strong">Don&apos;t</p>
      {READINGS.map((reading) => (
        <div
          key={reading.name}
          className="flex items-baseline justify-between gap-3 rounded-lg border border-emphasized px-3 py-2"
        >
          <p className="text-sm text-muted-foreground">{reading.name}</p>
          <p className="text-sm text-card-foreground tabular-nums">{reading.value}</p>
        </div>
      ))}
    </div>
  );
}

function SpacingComponentHeights() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-end gap-6">
        {HEIGHTS.map((item) => (
          <div key={item.px} className="flex flex-1 flex-col items-start gap-2">
            <div className={`w-full rounded-md bg-info-background ${item.box}`} />
            <p className="text-xs text-muted-foreground">
              <span className="font-mono text-base-foreground">{item.classes}</span> · {item.px}
              <br />
              {item.use}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpacingHeightsInUse() {
  return (
    <div className="flex items-center gap-3">
      <Badge variant="secondary">Draft</Badge>
      <Button variant="secondary" size="sm">
        <IconRefresh /> Sync
      </Button>
      <Button variant="secondary">Save draft</Button>
      <Button size="lg">Publish model</Button>
    </div>
  );
}

function SpacingMaxWidths() {
  return (
    <div className="flex w-full flex-col gap-4">
      {MAX_WIDTHS.map((item) => (
        <div key={item.classes} className="flex flex-col gap-1">
          <div className={`h-6 rounded-sm bg-info-background ${item.bar}`} />
          <p className="text-xs text-muted-foreground">
            <span className="font-mono text-base-foreground">{item.classes}</span> · {item.px} · {item.use}
          </p>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Bars are drawn to scale against max-w-7xl.</p>
    </div>
  );
}

function SpacingGridTwelve() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <Block label="col-span-8" />
        </div>
        <div className="col-span-4">
          <Block label="col-span-4" />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <Block label="col-span-6" />
        </div>
        <div className="col-span-6">
          <Block label="col-span-6" />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Block label="col-span-4" />
        </div>
        <div className="col-span-4">
          <Block label="col-span-4" />
        </div>
        <div className="col-span-4">
          <Block label="col-span-4" />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Block label="col-span-3" />
        </div>
        <div className="col-span-3">
          <Block label="col-span-3" />
        </div>
        <div className="col-span-3">
          <Block label="col-span-3" />
        </div>
        <div className="col-span-3">
          <Block label="col-span-3" />
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">grid grid-cols-12 gap-4</p>
    </div>
  );
}

export default definePage({
  id: 'spacing-and-shape',
  title: 'Spacing and shape',
  summary:
    'Everything sits on a 4px grid. A short spacing scale, one radius scale and two border widths give control heights, cards and page regions a rhythm that lines up without one-off pixel values.',
  guidance: {
    use: [
      'Tailwind spacing steps for every gap, padding and margin: one unit is 4px.',
      'gap-2 between controls, gap-3 in toolbars, gap-4 between cards, gap-6 between dashboard panels.',
      'rounded-lg on controls, rounded-xl on cards and overlays, rounded-sm on badges.',
      'Space and type to separate content before reaching for a border.',
    ],
    avoid: [
      'Arbitrary pixel gutters that fall off the 4px grid.',
      'A gap between a Label, its control and its helper text; they carry their own padding.',
      'Borders around every row or nested outlines inside a card.',
      'Mixing radius steps at random on siblings of the same kind.',
    ],
  },
  source,
  sections: [
    {
      id: 'spacing-scale',
      title: 'Spacing scale',
      description: 'Seven named steps on a 4px base.',
      specimens: [
        {
          id: 'SpacingScale',
          title: 'Scale ruler',
          note: 'Pick the step by how closely two things belong together: tighter means more related.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: SpacingScale,
        },
        {
          id: 'SpacingBaseUnit',
          title: 'Base unit',
          note: 'When a value is not on the named scale, keep it a multiple of 4px.',
          origin: 'aura',
          Component: SpacingBaseUnit,
        },
      ],
    },
    {
      id: 'gaps',
      title: 'Gaps in use',
      description: 'The four gaps that cover most layouts, and vertical rhythm between sections.',
      specimens: [
        {
          id: 'SpacingGapControls',
          title: 'Between controls',
          note: 'Buttons and inline controls that act on the same thing.',
          origin: 'aura',
          Component: SpacingGapControls,
        },
        {
          id: 'SpacingGapToolbar',
          title: 'Toolbar items',
          note: 'A search field and its neighbouring actions in a page toolbar.',
          origin: 'aura',
          size: 'lg',
          Component: SpacingGapToolbar,
        },
        {
          id: 'SpacingGapCards',
          title: 'Card and metric grids',
          note: 'Sibling cards of the same kind, and the content inside a card.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SpacingGapCards,
        },
        {
          id: 'SpacingGapDashboard',
          title: 'Dashboard panels',
          note: 'Charts and panels that are separate regions of a dashboard.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SpacingGapDashboard,
        },
        {
          id: 'SpacingStackRhythm',
          title: 'Vertical rhythm',
          note: 'Three stack distances for page sections, subsections and items.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SpacingStackRhythm,
        },
        {
          id: 'SpacingLabelAndField',
          title: 'Form fields',
          note: 'Fields sit 16px apart; label and control touch because each carries its own padding.',
          origin: 'aura',
          size: 'md',
          Component: SpacingLabelAndField,
        },
      ],
    },
    {
      id: 'padding',
      title: 'Padding',
      description: 'Internal padding for cards and the content area. The tint marks the padding.',
      specimens: [
        {
          id: 'SpacingCardPadding',
          title: 'Card padding',
          note: 'p-4 by default; p-6 for a large card that stands alone.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SpacingCardPadding,
        },
        {
          id: 'SpacingPagePadding',
          title: 'Page padding',
          note: 'The content area inside the shell, on desktop and on narrow screens.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SpacingPagePadding,
        },
      ],
    },
    {
      id: 'radius',
      title: 'Radius',
      description: 'One scale from square to pill. Size of the shape decides the step.',
      specimens: [
        {
          id: 'SpacingRadiusScale',
          title: 'Radius scale',
          note: 'Larger surfaces take larger radii; controls stay at rounded-lg.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: SpacingRadiusScale,
        },
        {
          id: 'SpacingRadiusInUse',
          title: 'Radii together',
          note: 'A card, an avatar, a badge and buttons, each on its own step.',
          origin: 'aura',
          size: 'md',
          Component: SpacingRadiusInUse,
        },
        {
          id: 'SpacingRadiusNested',
          title: 'Nested radius',
          note: 'A rounded shape inside a rounded container, so the corners stay concentric.',
          origin: 'aura',
          size: 'md',
          Component: SpacingRadiusNested,
        },
      ],
    },
    {
      id: 'borders',
      title: 'Borders',
      description: 'Borders are structural signals, not decoration.',
      specimens: [
        {
          id: 'SpacingBorderWidths',
          title: 'Border widths',
          note: '1px for structure; 2px only for stronger separation or an invalid state.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SpacingBorderWidths,
        },
        {
          id: 'SpacingBorderColors',
          title: 'Border colours',
          note: 'Default at rest, emphasized on hover, disabled when the control is inert.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SpacingBorderColors,
        },
        {
          id: 'SpacingSeparateWithSpace',
          title: 'Separate with space',
          note: 'Rows inside a card: alignment and type hierarchy carry the structure.',
          origin: 'aura',
          size: 'md',
          Component: SpacingSeparateWithSpace,
        },
        {
          id: 'SpacingBorderEveryRow',
          title: 'A border on every row',
          note: 'Shown as a counter-example: nested outlines add noise without adding meaning.',
          origin: 'aura',
          size: 'md',
          Component: SpacingBorderEveryRow,
        },
      ],
    },
    {
      id: 'sizing',
      title: 'Sizes and widths',
      description: 'Control heights, content widths and the column grid.',
      specimens: [
        {
          id: 'SpacingComponentHeights',
          title: 'Component heights',
          note: 'Custom controls should land on one of these four heights so they align with primitives.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SpacingComponentHeights,
        },
        {
          id: 'SpacingHeightsInUse',
          title: 'Heights on primitives',
          note: 'Badge, small, default and large buttons sit on the same four steps.',
          origin: 'aura',
          size: 'md',
          Component: SpacingHeightsInUse,
        },
        {
          id: 'SpacingMaxWidths',
          title: 'Content max widths',
          note: 'Cap a region by what it holds: a control, prose, a form, a detail page or a dashboard.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: SpacingMaxWidths,
        },
        {
          id: 'SpacingGridTwelve',
          title: '12-column grid',
          note: 'Split a dashboard or detail page into halves, thirds, quarters or two thirds plus one.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: SpacingGridTwelve,
        },
      ],
    },
  ],
});
