import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Switch } from '@cognite/aura/components/switch';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { IconDownload, IconFilter } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { StatusBadge } from '../../../library/display/StatusBadge';
import { FormField } from '../../../library/forms/FormField';
import { ThemePreviewTile } from '../../../library/foundations/ThemePreviewTile';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { ASSETS, PLANT_KPIS } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './theme-gallery.tsx?raw';

const LIGHT_ACCENTS = ['aura', 'fjord', 'sky', 'nordic', 'aurora', 'dusk', 'pink-soft'] as const;
const LIGHT_PURPOSE = ['blueprint', 'schematic', 'dense-data', 'field', 'accessible', 'sandstone', 'editorial'] as const;
const DARK_WORKING = [
  'aura-dark',
  'fjord-dark',
  'nordic-night',
  'dusk-night',
  'amber-shift',
  'editorial-dark',
  'control-room',
  'wall-display',
] as const;
const DARK_SPECIAL = ['terminal', 'field-night', 'tron', 'hologram', 'neon-dusk', 'night-vision', 'ember'] as const;

const AVAILABILITY_TREND = makeValues({ seed: 41, points: 14, base: 96.6, amplitude: 0.6, noise: 0.25, drift: -0.4 });
const EXPORT_BARS = makeValues({ seed: 42, points: 14, base: 4.3, amplitude: 0.2, noise: 0.12, decimals: 2 });

const LIST_ASSETS = ASSETS.filter((asset) => asset.parentId === 'nk-23').slice(0, 4);

/** A responsive grid of the same screen in several presets. */
function ThemeGalleryGrid({ presets, children }: { presets: readonly string[]; children: ReactNode }) {
  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {presets.map((preset) => (
        <ThemePreviewTile key={preset} preset={preset}>
          {children}
        </ThemePreviewTile>
      ))}
    </div>
  );
}

/** Screen 1: a small settings form. Label, input, switch and the two button emphases. */
function ThemeGalleryFormScreen() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl bg-card-background p-3">
      <p className="text-sm font-medium text-card-foreground">Limit monitoring</p>
      <FormField label="High limit">{(control) => <Input {...control} defaultValue="52.0 barg" />}</FormField>
      <Switch defaultChecked label="Notify on alarm" />
      <div className="mt-auto flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="secondary">
          Discard
        </Button>
        <Button size="sm">Save</Button>
      </div>
    </div>
  );
}

/** Screen 2: a dashboard block. One KPI tile above one bar chart. */
function ThemeGalleryDashboardScreen() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <KpiTile
        size="compact"
        label="Availability"
        value={PLANT_KPIS.availability.value}
        unit="%"
        decimals={1}
        delta={{ reference: PLANT_KPIS.availability.previous, goodDirection: 'up', decimals: 1 }}
        trend={{ values: AVAILABILITY_TREND, label: 'Availability, last 14 days' }}
      />
      <div className="flex flex-col gap-2 rounded-xl bg-card-background p-3">
        <p className="text-xs text-muted-foreground">Gas export, 14 days</p>
        <Sparkline
          values={EXPORT_BARS}
          variant="bar"
          height={48}
          label="Gas export per day, last 14 days"
          unit="MSm³/d"
          decimals={2}
        />
      </div>
    </div>
  );
}

/** Screen 3: a list with status badges, the most colour-critical screen of the three. */
function ThemeGalleryListScreen() {
  return (
    <ul className="flex min-w-0 flex-1 flex-col rounded-xl bg-card-background px-3 py-1">
      {LIST_ASSETS.map((asset) => (
        <li
          key={asset.id}
          className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-default py-2 last:border-b-0"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-card-foreground">{asset.name}</span>
            <span className="block font-mono text-xs text-muted-foreground">{asset.tag}</span>
          </span>
          <StatusBadge status={asset.state} />
        </li>
      ))}
    </ul>
  );
}

/** Screen 4: a toolbar. Tabs, a count badge, ghost actions and a link. */
function ThemeGalleryToolbarScreen() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl bg-card-background p-3">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" badge={<Badge variant="secondary">4</Badge>}>
            Active
          </TabsTrigger>
          <TabsTrigger value="shelved">Shelved</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost">
          <IconFilter /> Filter
        </Button>
        <Button size="sm" variant="outline">
          <IconDownload /> Export
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        4 alarms need attention. <span className="text-link-foreground underline underline-offset-2">Open alarm list</span>
      </p>
    </div>
  );
}

function ThemeGalleryFormLightAccents() {
  return (
    <ThemeGalleryGrid presets={LIGHT_ACCENTS}>
      <ThemeGalleryFormScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryFormLightPurpose() {
  return (
    <ThemeGalleryGrid presets={LIGHT_PURPOSE}>
      <ThemeGalleryFormScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryFormDarkWorking() {
  return (
    <ThemeGalleryGrid presets={DARK_WORKING}>
      <ThemeGalleryFormScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryFormDarkSpecial() {
  return (
    <ThemeGalleryGrid presets={DARK_SPECIAL}>
      <ThemeGalleryFormScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryDashboardLightAccents() {
  return (
    <ThemeGalleryGrid presets={LIGHT_ACCENTS}>
      <ThemeGalleryDashboardScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryDashboardLightPurpose() {
  return (
    <ThemeGalleryGrid presets={LIGHT_PURPOSE}>
      <ThemeGalleryDashboardScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryDashboardDarkWorking() {
  return (
    <ThemeGalleryGrid presets={DARK_WORKING}>
      <ThemeGalleryDashboardScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryDashboardDarkSpecial() {
  return (
    <ThemeGalleryGrid presets={DARK_SPECIAL}>
      <ThemeGalleryDashboardScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryListLightAccents() {
  return (
    <ThemeGalleryGrid presets={LIGHT_ACCENTS}>
      <ThemeGalleryListScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryListLightPurpose() {
  return (
    <ThemeGalleryGrid presets={LIGHT_PURPOSE}>
      <ThemeGalleryListScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryListDarkWorking() {
  return (
    <ThemeGalleryGrid presets={DARK_WORKING}>
      <ThemeGalleryListScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryListDarkSpecial() {
  return (
    <ThemeGalleryGrid presets={DARK_SPECIAL}>
      <ThemeGalleryListScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryToolbarLightAccents() {
  return (
    <ThemeGalleryGrid presets={LIGHT_ACCENTS}>
      <ThemeGalleryToolbarScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryToolbarLightPurpose() {
  return (
    <ThemeGalleryGrid presets={LIGHT_PURPOSE}>
      <ThemeGalleryToolbarScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryToolbarDarkWorking() {
  return (
    <ThemeGalleryGrid presets={DARK_WORKING}>
      <ThemeGalleryToolbarScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryToolbarDarkSpecial() {
  return (
    <ThemeGalleryGrid presets={DARK_SPECIAL}>
      <ThemeGalleryToolbarScreen />
    </ThemeGalleryGrid>
  );
}

function ThemeGalleryStatusStays() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      {(['aura', 'pink-soft', 'tron', 'ember'] as const).map((preset) => (
        <ThemePreviewTile key={preset} preset={preset}>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="running" />
            <StatusBadge status="maintenance" />
            <StatusBadge status="tripped" />
          </div>
        </ThemePreviewTile>
      ))}
    </div>
  );
}

function ThemeGalleryModeRule() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <ThemePreviewTile preset="fjord">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Save</Button>
            <Badge variant="secondary">Criticality A</Badge>
          </div>
        </ThemePreviewTile>
        <ThemePreviewTile preset="fjord-dark">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Save</Button>
            <Badge variant="secondary">Criticality A</Badge>
          </div>
        </ThemePreviewTile>
      </div>
      <p className="text-xs text-muted-foreground">
        Aura defines light only at the root, so a light preset cannot be forced inside a dark page: it takes the page’s
        mode. A dark preset carries its own mode and is dark everywhere. Switch the page to dark to see the left tile
        follow.
      </p>
    </div>
  );
}

export default definePage({
  id: 'theme-gallery',
  title: 'Theme gallery',
  summary:
    'Four small, representative screens rendered in all 29 presets, so themes can be compared at a glance. Nothing in the screens changes between tiles; only the preset around them does.',
  guidance: {
    use: [
      'Compare candidates here before choosing a theme for a product.',
      'Judge a preset on the list and dashboard screens, where status and data colour must still read.',
      'Check the purpose-built presets on the device they are meant for.',
      'Switch the page between light and dark to see which presets follow.',
    ],
    avoid: [
      'Picking a showpiece preset for a screen people watch all shift.',
      'Mixing presets on one screen, except for a region with a different job.',
      'Reading accent colour as status: badges stay the same in every tile.',
      'Expecting a light preset to stay light inside a dark page.',
    ],
  },
  source,
  sections: [
    {
      id: 'reading',
      title: 'How to read the gallery',
      description: 'Two rules hold in every tile below.',
      specimens: [
        {
          id: 'ThemeGalleryStatusStays',
          title: 'Status never changes',
          note: 'Whatever the accent, running, maintenance and tripped keep their colour, icon and word.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'display/StatusBadge.tsx'],
          Component: ThemeGalleryStatusStays,
        },
        {
          id: 'ThemeGalleryModeRule',
          title: 'Which tiles follow the page',
          note: 'Light presets take the page mode; dark presets are always dark.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/ThemeScope.tsx'],
          Component: ThemeGalleryModeRule,
        },
      ],
    },
    {
      id: 'form',
      title: 'Form card',
      description: 'A label, an input, a switch and two buttons: accent, radius, density and typeface in one glance.',
      specimens: [
        {
          id: 'ThemeGalleryFormLightAccents',
          title: 'Form, accent presets',
          note: 'Choosing a brand accent for a product on neutral or lightly tinted surfaces.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/themes.ts', 'forms/FormField.tsx'],
          Component: ThemeGalleryFormLightAccents,
        },
        {
          id: 'ThemeGalleryFormLightPurpose',
          title: 'Form, purpose-built presets',
          note: 'Engineering tools, field tablets, reports and dense data screens.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/themes.ts', 'forms/FormField.tsx'],
          Component: ThemeGalleryFormLightPurpose,
        },
        {
          id: 'ThemeGalleryFormDarkWorking',
          title: 'Form, dark working presets',
          note: 'Control rooms, night shifts and wall displays that stay open for hours.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/themes.ts', 'forms/FormField.tsx'],
          Component: ThemeGalleryFormDarkWorking,
        },
        {
          id: 'ThemeGalleryFormDarkSpecial',
          title: 'Form, dark specialist presets',
          note: 'Consoles, night rounds and showpiece screens with near-black surfaces.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/themes.ts', 'forms/FormField.tsx'],
          Component: ThemeGalleryFormDarkSpecial,
        },
      ],
    },
    {
      id: 'dashboard',
      title: 'Dashboard block',
      description: 'A KPI tile and a bar chart: data colour and surface layering.',
      specimens: [
        {
          id: 'ThemeGalleryDashboardLightAccents',
          title: 'Dashboard, accent presets',
          note: 'Checking that plotted data stays readable next to each brand accent.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          Component: ThemeGalleryDashboardLightAccents,
        },
        {
          id: 'ThemeGalleryDashboardLightPurpose',
          title: 'Dashboard, purpose-built presets',
          note: 'How density, typeface and contrast change a tile of numbers.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          Component: ThemeGalleryDashboardLightPurpose,
        },
        {
          id: 'ThemeGalleryDashboardDarkWorking',
          title: 'Dashboard, dark working presets',
          note: 'Monitoring views in low light, from default dark to high-contrast wall displays.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          Component: ThemeGalleryDashboardDarkWorking,
        },
        {
          id: 'ThemeGalleryDashboardDarkSpecial',
          title: 'Dashboard, dark specialist presets',
          note: 'Command and digital-twin screens where the chart sits on near-black.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          Component: ThemeGalleryDashboardDarkSpecial,
        },
      ],
    },
    {
      id: 'list',
      title: 'List with status badges',
      description: 'The screen where a theme must not get in the way: status has to read first.',
      specimens: [
        {
          id: 'ThemeGalleryListLightAccents',
          title: 'List, accent presets',
          note: 'Confirming that status badges are not confused with the accent.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'display/StatusBadge.tsx'],
          Component: ThemeGalleryListLightAccents,
        },
        {
          id: 'ThemeGalleryListLightPurpose',
          title: 'List, purpose-built presets',
          note: 'Row height and tag legibility across compact, spacious and monospaced presets.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'display/StatusBadge.tsx'],
          Component: ThemeGalleryListLightPurpose,
        },
        {
          id: 'ThemeGalleryListDarkWorking',
          title: 'List, dark working presets',
          note: 'Asset and alarm lists on dark and tinted dark surfaces.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'display/StatusBadge.tsx'],
          Component: ThemeGalleryListDarkWorking,
        },
        {
          id: 'ThemeGalleryListDarkSpecial',
          title: 'List, dark specialist presets',
          note: 'The hardest case for status colour: saturated accents on black.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'display/StatusBadge.tsx'],
          Component: ThemeGalleryListDarkSpecial,
        },
      ],
    },
    {
      id: 'toolbar',
      title: 'Toolbar',
      description: 'Tabs, a count, quiet actions and a link: where the accent shows up outside the primary button.',
      specimens: [
        {
          id: 'ThemeGalleryToolbarLightAccents',
          title: 'Toolbar, accent presets',
          note: 'Seeing how much of a screen an accent actually touches.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/themes.ts'],
          Component: ThemeGalleryToolbarLightAccents,
        },
        {
          id: 'ThemeGalleryToolbarLightPurpose',
          title: 'Toolbar, purpose-built presets',
          note: 'Control height and spacing in compact and spacious presets.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/themes.ts'],
          Component: ThemeGalleryToolbarLightPurpose,
        },
        {
          id: 'ThemeGalleryToolbarDarkWorking',
          title: 'Toolbar, dark working presets',
          note: 'Selected tab, outline and link contrast on dark surfaces.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/themes.ts'],
          Component: ThemeGalleryToolbarDarkWorking,
        },
        {
          id: 'ThemeGalleryToolbarDarkSpecial',
          title: 'Toolbar, dark specialist presets',
          note: 'Quiet controls on near-black: check that ghost and outline buttons are still found.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/ThemePreviewTile.tsx', 'themes/themes.ts'],
          Component: ThemeGalleryToolbarDarkSpecial,
        },
      ],
    },
  ],
});
