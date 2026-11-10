import { IconCheck, IconCircleCheck, IconCopy, IconPencil, IconTrash } from '@cognite/aura/icons';

import { definePage } from '../../types';

import source from './elevation.tsx?raw';

const SHADOWS = [
  { classes: 'shadow-sm', layers: 'sm', use: 'Tooltips, small floating containers' },
  { classes: 'shadow-default', layers: 'md + sm', use: 'Menus, popovers, hover cards' },
  { classes: 'shadow-md', layers: 'lg + md', use: 'Toasts, temporary elevated elements' },
  { classes: 'shadow-lg', layers: 'xl + lg', use: 'Dialogs without a backdrop' },
  { classes: 'shadow-xl', layers: 'xl + lg, wider spread', use: 'Dialogs with a backdrop' },
] as const;

const SURFACE_LAYERS = [
  { token: 'base-background', role: 'Page', steps: 'mountain-white · mountain-950' },
  { token: 'card-background', role: 'Card on the page', steps: 'mountain-10 · mountain-800' },
  { token: 'popover-background', role: 'Floating layer, with a shadow', steps: 'mountain-white · mountain-900' },
] as const;

const SURFACE_STATES = [
  {
    state: 'Default',
    tile: 'bg-card-background text-card-foreground',
    classes: 'bg-card-background',
    meaning: 'Available, at rest',
  },
  {
    state: 'Hover',
    tile: 'bg-card-background-hover text-card-foreground',
    classes: 'bg-card-background-hover',
    meaning: 'Pointer is over it',
  },
  {
    state: 'Pressed',
    tile: 'bg-medium-background-hover text-card-foreground',
    classes: 'bg-medium-background-hover',
    meaning: 'One step deeper than hover',
  },
  {
    state: 'Selected',
    tile: 'bg-secondary-background text-secondary-foreground',
    classes: 'bg-secondary-background + icon',
    meaning: 'Persistent choice, never colour alone',
  },
  {
    state: 'Disabled',
    tile: 'bg-base-background-disabled text-base-foreground-disabled',
    classes: 'bg-base-background-disabled',
    meaning: 'Present but inert',
  },
] as const;

const ROW_STATES = [
  { name: '1st stage compressor', row: 'text-base-foreground', selected: false, note: 'Default' },
  { name: '2nd stage compressor', row: 'bg-base-background-hover text-base-foreground', selected: false, note: 'Hover' },
  { name: 'Recompressor', row: 'bg-secondary-background text-secondary-foreground', selected: true, note: 'Selected' },
  { name: 'Interstage cooler', row: 'text-base-foreground-disabled', selected: false, note: 'Disabled' },
] as const;

function ElevationShadowScale() {
  return (
    <div className="grid w-full grid-cols-2 gap-6 p-2 md:grid-cols-5">
      {SHADOWS.map((item) => (
        <div key={item.classes} className="flex min-w-0 flex-col gap-4">
          <div className={`h-24 rounded-xl bg-popover-background ${item.classes}`} />
          <div>
            <p className="font-mono text-xs text-base-foreground">{item.classes}</p>
            <p className="mt-1 text-xs text-muted-foreground">Layers: {item.layers}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.use}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ElevationTooltipLevel() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-md bg-popover-background px-2 py-1 shadow-sm">
        <p className="text-xs text-popover-foreground">Refresh data</p>
      </div>
      <p className="font-mono text-xs text-muted-foreground">shadow-sm</p>
    </div>
  );
}

function ElevationMenuLevel() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-48 flex-col rounded-xl bg-popover-background p-1 shadow-default">
        <p className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-popover-foreground">
          <IconPencil className="size-4" aria-hidden="true" /> Rename
        </p>
        <p className="flex items-center gap-2 rounded-md bg-popover-background-hover px-2 py-1.5 text-sm text-popover-foreground">
          <IconCopy className="size-4" aria-hidden="true" /> Duplicate
        </p>
        <p className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-critical-foreground-strong">
          <IconTrash className="size-4" aria-hidden="true" /> Delete
        </p>
      </div>
      <p className="font-mono text-xs text-muted-foreground">shadow-default</p>
    </div>
  );
}

function ElevationToastLevel() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-64 items-start gap-3 rounded-xl bg-popover-background p-3 shadow-md">
        <span className="text-success-foreground-strong">
          <IconCircleCheck className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-popover-foreground">Work order created</p>
          <p className="text-xs text-muted-foreground">WO-104482 is assigned to Tomás Barros.</p>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">shadow-md</p>
    </div>
  );
}

function ElevationDialogLevel() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-72 flex-col gap-3 rounded-xl bg-popover-background p-4 shadow-lg">
        <p className="text-sm font-medium text-popover-foreground">Shelve alarm</p>
        <p className="text-sm text-muted-foreground">The alarm stays hidden from the list for eight hours.</p>
        <div className="flex justify-end gap-2">
          <span className="rounded-lg px-3 py-1.5 text-sm text-popover-foreground">Cancel</span>
          <span className="rounded-lg bg-primary-background px-3 py-1.5 text-sm text-primary-foreground">Shelve</span>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">shadow-lg</p>
    </div>
  );
}

function ElevationFocusRing() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex h-9 items-center rounded-lg bg-base-background px-3 shadow-focus-ring">
        <p className="text-sm text-base-foreground">Nordkapp historian</p>
      </div>
      <p className="font-mono text-xs text-muted-foreground">shadow-focus-ring</p>
    </div>
  );
}

function ElevationFocusRingCritical() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex h-9 items-center rounded-lg bg-base-background px-3 shadow-focus-ring-destructive">
        <p className="text-sm text-base-foreground">Nordkapp historian / v2</p>
      </div>
      <p className="text-xs text-critical-foreground-strong">Use letters, numbers and hyphens only.</p>
      <p className="font-mono text-xs text-muted-foreground">shadow-focus-ring-destructive</p>
    </div>
  );
}

function ElevationFocusOnButton() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <span className="flex h-9 items-center rounded-lg bg-primary-background px-3 text-sm font-medium text-primary-foreground shadow-focus-ring">
          Save changes
        </span>
        <span className="flex h-9 items-center rounded-lg bg-secondary-background px-3 text-sm font-medium text-secondary-foreground shadow-focus-ring">
          Export data
        </span>
      </div>
      <p className="text-xs text-muted-foreground">The same ring on every fill.</p>
    </div>
  );
}

function ElevationFocusAnatomy() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-6 p-1">
        <div className="flex flex-col gap-3">
          <div className="h-12 rounded-lg bg-base-background shadow-focus-ring" />
          <p className="text-xs text-muted-foreground">
            1px <span className="font-mono text-base-foreground">ring-default</span> inside, then 2px of{' '}
            <span className="font-mono text-base-foreground">ring-muted</span> showing beyond it.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-12 rounded-lg bg-base-background shadow-focus-ring-destructive" />
          <p className="text-xs text-muted-foreground">
            1px <span className="font-mono text-base-foreground">ring-critical</span> inside, then 2px of{' '}
            <span className="font-mono text-base-foreground">ring-critical-muted</span>.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Rings are shadows, not outlines, so they follow the radius and never shift layout.
      </p>
    </div>
  );
}

function ElevationScrim() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="relative h-56 overflow-hidden rounded-xl bg-base-background">
        <div className="grid grid-cols-3 gap-4 p-4" aria-hidden="true">
          <div className="h-20 rounded-xl bg-card-background" />
          <div className="h-20 rounded-xl bg-card-background" />
          <div className="h-20 rounded-xl bg-card-background" />
          <div className="col-span-3 h-24 rounded-xl bg-card-background" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-base-background-overlay">
          <div className="flex w-64 flex-col gap-2 rounded-xl bg-popover-background p-4 shadow-xl">
            <p className="text-sm font-medium text-popover-foreground">Delete data set</p>
            <p className="text-sm text-muted-foreground">This removes 12 time series and cannot be undone.</p>
          </div>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">bg-base-background-overlay + shadow-xl</p>
    </div>
  );
}

function ElevationSurfaceLayers() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-xl border border-default bg-base-background p-6">
        <div className="rounded-xl bg-card-background p-6">
          <div className="max-w-xs rounded-xl bg-popover-background p-4 shadow-default">
            <p className="text-sm font-medium text-popover-foreground">Popover</p>
            <p className="text-xs text-muted-foreground">Leaves the page plane, so it is the only one with a shadow.</p>
          </div>
          <p className="mt-4 text-sm font-medium text-card-foreground">Card</p>
        </div>
        <p className="mt-4 text-sm font-medium text-base-foreground">Base</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {SURFACE_LAYERS.map((item) => (
          <div key={item.token}>
            <p className="font-mono text-xs text-base-foreground">{item.token}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.steps}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ElevationPinnedColumn() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex overflow-hidden rounded-lg border border-default">
        <div className="relative z-10 flex w-36 flex-col bg-base-background shadow-pinned-column">
          <p className="border-b border-default px-3 py-2 text-xs font-medium text-muted-foreground">Tag</p>
          <p className="px-3 py-2 font-mono text-sm text-base-foreground">23-PT-92531</p>
          <p className="px-3 py-2 font-mono text-sm text-base-foreground">23-TT-92532</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-base-background">
          <p className="border-b border-default px-3 py-2 text-xs font-medium text-muted-foreground">Name</p>
          <p className="truncate px-3 py-2 text-sm text-base-foreground">Discharge pressure</p>
          <p className="truncate px-3 py-2 text-sm text-base-foreground">Discharge temperature</p>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">shadow-pinned-column</p>
    </div>
  );
}

function ElevationFlatCards() {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-xs font-medium text-success-foreground-strong">Do</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-card-background p-4">
          <p className="text-xs text-muted-foreground">Availability</p>
          <p className="text-xl font-semibold text-card-foreground tabular-nums">98.2 %</p>
        </div>
        <div className="rounded-xl bg-card-background p-4">
          <p className="text-xs text-muted-foreground">Open work orders</p>
          <p className="text-xl font-semibold text-card-foreground tabular-nums">5</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">In-page cards are separated by surface colour alone.</p>
    </div>
  );
}

function ElevationShadowedCards() {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-xs font-medium text-critical-foreground-strong">Don&apos;t</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-default bg-card-background p-4 shadow-lg">
          <p className="text-xs text-muted-foreground">Availability</p>
          <p className="text-xl font-semibold text-card-foreground tabular-nums">98.2 %</p>
        </div>
        <div className="rounded-xl border border-default bg-card-background p-4 shadow-lg">
          <p className="text-xs text-muted-foreground">Open work orders</p>
          <p className="text-xl font-semibold text-card-foreground tabular-nums">5</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">A shadow and a border on content that never leaves the page.</p>
    </div>
  );
}

function ElevationWhenToElevate() {
  return (
    <dl className="grid w-full grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
      <div>
        <dt className="text-sm font-medium text-base-foreground">Stay flat</dt>
        <dd className="mt-1 text-sm text-muted-foreground">
          Cards, panels, table containers, form sections, sidebars: anything that is part of the page and scrolls
          with it.
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-base-foreground">Elevate</dt>
        <dd className="mt-1 text-sm text-muted-foreground">
          Tooltips, menus, popovers, toasts, dialogs, pinned columns: anything that floats over other content and
          goes away again.
        </dd>
      </div>
    </dl>
  );
}

function ElevationSurfaceStates() {
  return (
    <div className="grid w-full grid-cols-2 content-start gap-4 md:grid-cols-5">
      {SURFACE_STATES.map((item) => (
        <div key={item.state} className="flex min-w-0 flex-col gap-2">
          <div className={`flex h-20 items-center justify-between gap-2 rounded-xl px-4 ${item.tile}`}>
            <p className="text-sm font-medium">{item.state}</p>
            {item.state === 'Selected' ? <IconCheck className="size-4" aria-hidden="true" /> : null}
          </div>
          <div>
            <p className="font-mono text-xs break-words text-base-foreground">{item.classes}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.meaning}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ElevationRowStates() {
  return (
    <ul className="flex w-full max-w-sm flex-col gap-1">
      {ROW_STATES.map((item) => (
        <li key={item.name} className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm ${item.row}`}>
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          <span className="text-xs">{item.note}</span>
          {item.selected ? <IconCheck className="size-4" aria-hidden="true" /> : null}
        </li>
      ))}
    </ul>
  );
}

function ElevationHoverLift() {
  return (
    <div className="flex items-start gap-4 p-2">
      <div className="flex w-36 flex-col gap-1 rounded-xl bg-card-background p-4">
        <p className="text-sm font-medium text-card-foreground">Export pump A</p>
        <p className="text-xs text-muted-foreground">At rest</p>
      </div>
      <div className="flex w-36 flex-col gap-1 rounded-xl bg-card-background-hover p-4 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">Export pump B</p>
        <p className="text-xs text-muted-foreground">Hover</p>
      </div>
    </div>
  );
}

export default definePage({
  id: 'elevation',
  title: 'Elevation',
  summary:
    'Aura is flat. Surface colour, space and type carry structure on the page; shadows are reserved for things that float above it, and the focus ring is a shadow too.',
  guidance: {
    use: [
      'Surface tokens to layer content: base, then card, then popover.',
      'A shadow only on layers that float: tooltips, menus, toasts, dialogs.',
      'shadow-focus-ring on every custom interactive control, and the destructive ring on invalid fields.',
      'A fill step for hover and pressed, plus an icon or label for selected.',
    ],
    avoid: [
      'Shadows on in-page cards and panels.',
      'A border and a shadow and a ring stacked on the same surface.',
      'Removing the focus ring without an equivalent replacement.',
      'Status colour to show that a generic row or toggle is selected.',
    ],
  },
  source,
  sections: [
    {
      id: 'shadows',
      title: 'Shadow scale',
      description: 'Five steps, each tied to a kind of floating surface.',
      specimens: [
        {
          id: 'ElevationShadowScale',
          title: 'Shadow steps',
          note: 'Pick the step by what the surface is, not by how prominent you want it to look.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          Component: ElevationShadowScale,
        },
        {
          id: 'ElevationTooltipLevel',
          title: 'Tooltip level',
          note: 'The smallest floating containers, right next to their trigger.',
          origin: 'aura',
          surface: 'muted',
          Component: ElevationTooltipLevel,
        },
        {
          id: 'ElevationMenuLevel',
          title: 'Menu level',
          note: 'Menus, popovers and hover cards anchored to a control.',
          origin: 'aura',
          surface: 'muted',
          Component: ElevationMenuLevel,
        },
        {
          id: 'ElevationToastLevel',
          title: 'Toast level',
          note: 'Temporary surfaces that appear on their own, away from what caused them.',
          origin: 'aura',
          surface: 'muted',
          Component: ElevationToastLevel,
        },
        {
          id: 'ElevationDialogLevel',
          title: 'Dialog level',
          note: 'A dialog shown without a backdrop behind it.',
          origin: 'aura',
          size: 'md',
          surface: 'muted',
          Component: ElevationDialogLevel,
        },
        {
          id: 'ElevationScrim',
          title: 'Overlay scrim',
          note: 'A modal dialog: the scrim dims the page and the dialog takes the largest shadow.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ElevationScrim,
        },
      ],
    },
    {
      id: 'focus',
      title: 'Focus ring',
      description: 'Shown statically here on look-alikes; real controls show it on keyboard focus.',
      specimens: [
        {
          id: 'ElevationFocusRing',
          title: 'Default ring',
          note: 'Every interactive control you build yourself, on keyboard focus.',
          origin: 'aura',
          size: 'md',
          Component: ElevationFocusRing,
        },
        {
          id: 'ElevationFocusRingCritical',
          title: 'Critical ring',
          note: 'A focused field that is invalid, or a focused destructive action.',
          origin: 'aura',
          size: 'md',
          Component: ElevationFocusRingCritical,
        },
        {
          id: 'ElevationFocusAnatomy',
          title: 'Ring anatomy',
          note: 'Two stacked shadows: a 1px line and a soft 3px halo behind it.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: ElevationFocusAnatomy,
        },
        {
          id: 'ElevationFocusOnButton',
          title: 'Ring on filled controls',
          note: 'The ring does not change with the fill, so focus looks the same everywhere.',
          origin: 'aura',
          Component: ElevationFocusOnButton,
        },
      ],
    },
    {
      id: 'layering',
      title: 'Surface layering',
      description: 'Depth comes from surface colour first.',
      specimens: [
        {
          id: 'ElevationSurfaceLayers',
          title: 'Base, card, popover',
          note: 'Stack surfaces in this order; only the top one, which floats, gets a shadow.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: ElevationSurfaceLayers,
        },
        {
          id: 'ElevationPinnedColumn',
          title: 'Pinned column edge',
          note: 'The last pinned column of a data grid, to show content scrolls beneath it.',
          origin: 'aura',
          align: 'stretch',
          Component: ElevationPinnedColumn,
        },
      ],
    },
    {
      id: 'flat-vs-elevated',
      title: 'Flat or elevated',
      description: 'If it scrolls with the page it stays flat.',
      specimens: [
        {
          id: 'ElevationFlatCards',
          title: 'Flat cards',
          note: 'The default for every card and panel that is part of the page.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ElevationFlatCards,
        },
        {
          id: 'ElevationShadowedCards',
          title: 'Shadowed cards',
          note: 'Shown as a counter-example: elevation here implies the cards float or can be dragged.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ElevationShadowedCards,
        },
        {
          id: 'ElevationWhenToElevate',
          title: 'Which surfaces float',
          note: 'A quick test before adding a shadow to anything.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: ElevationWhenToElevate,
        },
        {
          id: 'ElevationHoverLift',
          title: 'Lift on hover',
          note: 'Sparingly, on a clickable card: a hover fill plus the smallest shadow.',
          origin: 'aura',
          Component: ElevationHoverLift,
        },
      ],
    },
    {
      id: 'states',
      title: 'Interaction states',
      description: 'How a custom surface signals what it can do, using fill steps instead of elevation.',
      specimens: [
        {
          id: 'ElevationSurfaceStates',
          title: 'States of a surface',
          note: 'A clickable card or tile: each state is one token step, never a new colour.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: ElevationSurfaceStates,
        },
        {
          id: 'ElevationRowStates',
          title: 'States of a row',
          note: 'List and menu rows on the base surface, with a check for the selected one.',
          origin: 'aura',
          size: 'sm',
          Component: ElevationRowStates,
        },
      ],
    },
  ],
});
