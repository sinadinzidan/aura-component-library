import { Badge } from '@cognite/aura/components/badge';
import { IconAlertTriangle, IconCircleCheck } from '@cognite/aura/icons';

import { definePage } from '../../types';

import source from './colors.tsx?raw';

type SwatchToken = {
  /** Token name as written in CSS and DESIGN.md. */
  token: string;
  /** Complete Tailwind class that paints the swatch. */
  swatch: string;
  /** Ramp step the token resolves to in the light theme. */
  light: string;
  /** Ramp step the token resolves to in the dark theme. */
  dark: string;
};

type SurfaceToken = {
  token: string;
  foregroundToken: string;
  surface: string;
  foreground: string;
  light: string;
  dark: string;
  use: string;
};

type StatusFamily = {
  name: string;
  meaning: string;
  tint: string;
  tintToken: string;
  tintSteps: string;
  strong: string;
  strongToken: string;
  strongSteps: string;
};

type DecorativeSlot = {
  slot: string;
  ramp: string;
  tile: string;
  background: string;
  hover: string;
  steps: string;
};

type ChartSeries = {
  token: string;
  ramp: string;
  steps: readonly string[];
};

const CHART_STEPS = ['50', '100', '200', '300', '400', '450'] as const;

const SURFACES: readonly SurfaceToken[] = [
  {
    token: 'base-background',
    foregroundToken: 'base-foreground',
    surface: 'bg-base-background',
    foreground: 'text-base-foreground',
    light: 'mountain-white',
    dark: 'mountain-950',
    use: 'The page itself.',
  },
  {
    token: 'muted-background',
    foregroundToken: 'muted-foreground',
    surface: 'bg-muted-background',
    foreground: 'text-muted-foreground',
    light: 'mountain-10',
    dark: 'mountain-900',
    use: 'Secondary chrome and tracks.',
  },
  {
    token: 'medium-background',
    foregroundToken: 'medium-foreground',
    surface: 'bg-medium-background',
    foreground: 'text-medium-foreground',
    light: 'mountain-50',
    dark: 'mountain-800',
    use: 'Inputs and subtle fills.',
  },
  {
    token: 'card-background',
    foregroundToken: 'card-foreground',
    surface: 'bg-card-background',
    foreground: 'text-card-foreground',
    light: 'mountain-10',
    dark: 'mountain-800',
    use: 'Cards that sit on the page.',
  },
  {
    token: 'popover-background',
    foregroundToken: 'popover-foreground',
    surface: 'bg-popover-background',
    foreground: 'text-popover-foreground',
    light: 'mountain-white',
    dark: 'mountain-900',
    use: 'Menus, dialogs, shadowed layers.',
  },
];

const SURFACE_HOVERS: readonly SwatchToken[] = [
  { token: 'base-background-hover', swatch: 'bg-base-background-hover', light: 'mountain-50', dark: 'mountain-800' },
  { token: 'muted-background-hover', swatch: 'bg-muted-background-hover', light: 'mountain-50', dark: 'mountain-800' },
  {
    token: 'medium-background-hover',
    swatch: 'bg-medium-background-hover',
    light: 'mountain-100',
    dark: 'mountain-700',
  },
  { token: 'card-background-hover', swatch: 'bg-card-background-hover', light: 'mountain-50', dark: 'mountain-700' },
  {
    token: 'popover-background-hover',
    swatch: 'bg-popover-background-hover',
    light: 'mountain-50',
    dark: 'mountain-800',
  },
  {
    token: 'base-background-disabled',
    swatch: 'bg-base-background-disabled',
    light: 'mountain-50',
    dark: 'mountain-800',
  },
];

const TEXT_ROLES = [
  { token: 'base-foreground', text: 'text-base-foreground', steps: 'mountain-950 · mountain-10', sample: '1st stage compressor discharge pressure' },
  { token: 'medium-foreground', text: 'text-medium-foreground', steps: 'mountain-700 · mountain-300', sample: 'Updated by the ingestion pipeline' },
  { token: 'muted-foreground', text: 'text-muted-foreground', steps: 'mountain-550 · mountain-400', sample: 'Last synced 4 minutes ago' },
  { token: 'link-foreground', text: 'text-link-foreground', steps: 'fjord-600 · fjord-450', sample: 'Open the data set' },
  {
    token: 'base-foreground-disabled',
    text: 'text-base-foreground-disabled',
    steps: 'mountain-300 · mountain-600',
    sample: 'Archive is not available',
  },
] as const;

const PRIMARY_HOVER: readonly SwatchToken[] = [
  { token: 'primary-background', swatch: 'bg-primary-background', light: 'mountain-900', dark: 'mountain-10' },
  {
    token: 'primary-background-hover',
    swatch: 'bg-primary-background-hover',
    light: 'mountain-650',
    dark: 'mountain-100',
  },
];

const SECONDARY_HOVER: readonly SwatchToken[] = [
  { token: 'secondary-background', swatch: 'bg-secondary-background', light: 'mountain-100', dark: 'mountain-700' },
  {
    token: 'secondary-background-hover',
    swatch: 'bg-secondary-background-hover',
    light: 'mountain-50',
    dark: 'mountain-600',
  },
];

const BORDERS = [
  { token: 'border-default', border: 'border-default', steps: 'mountain-100 · mountain-700', use: 'Inputs, tables, dividers' },
  { token: 'border-emphasized', border: 'border-emphasized', steps: 'mountain-200 · mountain-600', use: 'Hover and stronger separation' },
  { token: 'border-disabled', border: 'border-disabled', steps: 'mountain-50 · mountain-800', use: 'Outline of a disabled control' },
] as const;

const RINGS: readonly SwatchToken[] = [
  { token: 'ring-default', swatch: 'bg-ring-default', light: 'fjord-500', dark: 'fjord-400' },
  { token: 'ring-muted', swatch: 'bg-ring-muted', light: 'gray-200', dark: 'gray-800' },
  { token: 'ring-critical', swatch: 'bg-ring-critical', light: 'red-600', dark: 'red-450' },
  { token: 'ring-critical-muted', swatch: 'bg-ring-critical-muted', light: 'red-100', dark: 'red-900' },
];

const STATUS_FAMILIES: readonly StatusFamily[] = [
  {
    name: 'Success',
    meaning: 'Running',
    tint: 'bg-success-background text-success-foreground',
    tintToken: 'success-background + success-foreground',
    tintSteps: 'green-100 + green-650 · green-900 + green-400',
    strong: 'text-success-foreground-strong',
    strongToken: 'success-foreground-strong',
    strongSteps: 'green-500 · green-400',
  },
  {
    name: 'Warning',
    meaning: 'Degraded',
    tint: 'bg-warning-background text-warning-foreground',
    tintToken: 'warning-background + warning-foreground',
    tintSteps: 'orange-100 + orange-650 · orange-900 + orange-400',
    strong: 'text-warning-foreground-strong',
    strongToken: 'warning-foreground-strong',
    strongSteps: 'orange-500 · orange-400',
  },
  {
    name: 'Critical',
    meaning: 'Tripped',
    tint: 'bg-critical-background text-critical-foreground',
    tintToken: 'critical-background + critical-foreground',
    tintSteps: 'red-100 + red-650 · red-900 + red-400',
    strong: 'text-critical-foreground-strong',
    strongToken: 'critical-foreground-strong',
    strongSteps: 'red-500 · red-400',
  },
  {
    name: 'Info',
    meaning: 'In progress',
    tint: 'bg-info-background text-info-foreground',
    tintToken: 'info-background + info-foreground',
    tintSteps: 'blue-100 + blue-650 · blue-900 + blue-400',
    strong: 'text-info-foreground-strong',
    strongToken: 'info-foreground-strong',
    strongSteps: 'blue-500 · blue-400',
  },
  {
    name: 'Neutral',
    meaning: 'Archived',
    tint: 'bg-neutral-background text-neutral-foreground',
    tintToken: 'neutral-background + neutral-foreground',
    tintSteps: 'mountain-100 + mountain-650 · mountain-900 + mountain-400',
    strong: 'text-neutral-foreground-strong',
    strongToken: 'neutral-foreground-strong',
    strongSteps: 'mountain-550 · mountain-400',
  },
];

const STATUS_HOVERS = [
  { name: 'success', rest: 'bg-success-background', hover: 'bg-success-background-hover', steps: 'green-100 → green-200' },
  { name: 'warning', rest: 'bg-warning-background', hover: 'bg-warning-background-hover', steps: 'orange-100 → orange-200' },
  { name: 'critical', rest: 'bg-critical-background', hover: 'bg-critical-background-hover', steps: 'red-100 → red-200' },
  { name: 'info', rest: 'bg-info-background', hover: 'bg-info-background-hover', steps: 'blue-100 → blue-200' },
  { name: 'neutral', rest: 'bg-neutral-background', hover: 'bg-neutral-background-hover', steps: 'mountain-100 → mountain-200' },
] as const;

const DECORATIVE_SLOTS: readonly DecorativeSlot[] = [
  {
    slot: 'decorative-1',
    ramp: 'Mountain',
    tile: 'bg-decorative-1-background text-decorative-1-foreground',
    background: 'bg-decorative-1-background',
    hover: 'bg-decorative-1-background-hover',
    steps: 'mountain-100 + mountain-700',
  },
  {
    slot: 'decorative-2',
    ramp: 'Fjord',
    tile: 'bg-decorative-2-background text-decorative-2-foreground',
    background: 'bg-decorative-2-background',
    hover: 'bg-decorative-2-background-hover',
    steps: 'fjord-200 + fjord-800',
  },
  {
    slot: 'decorative-3',
    ramp: 'Nordic',
    tile: 'bg-decorative-3-background text-decorative-3-foreground',
    background: 'bg-decorative-3-background',
    hover: 'bg-decorative-3-background-hover',
    steps: 'nordic-200 + nordic-800',
  },
  {
    slot: 'decorative-4',
    ramp: 'Aurora',
    tile: 'bg-decorative-4-background text-decorative-4-foreground',
    background: 'bg-decorative-4-background',
    hover: 'bg-decorative-4-background-hover',
    steps: 'aurora-200 + aurora-800',
  },
  {
    slot: 'decorative-5',
    ramp: 'Dusk',
    tile: 'bg-decorative-5-background text-decorative-5-foreground',
    background: 'bg-decorative-5-background',
    hover: 'bg-decorative-5-background-hover',
    steps: 'dusk-200 + dusk-800',
  },
  {
    slot: 'decorative-6',
    ramp: 'Amber',
    tile: 'bg-decorative-6-background text-decorative-6-foreground',
    background: 'bg-decorative-6-background',
    hover: 'bg-decorative-6-background-hover',
    steps: 'amber-200 + amber-800',
  },
  {
    slot: 'decorative-7',
    ramp: 'Pink',
    tile: 'bg-decorative-7-background text-decorative-7-foreground',
    background: 'bg-decorative-7-background',
    hover: 'bg-decorative-7-background-hover',
    steps: 'pink-200 + pink-800',
  },
];

const TEAM_TILES = [
  { initials: 'OP', team: 'Operations', tile: 'bg-decorative-2-background text-decorative-2-foreground' },
  { initials: 'MN', team: 'Maintenance', tile: 'bg-decorative-3-background text-decorative-3-foreground' },
  { initials: 'RE', team: 'Reliability', tile: 'bg-decorative-5-background text-decorative-5-foreground' },
  { initials: 'HS', team: 'Health and safety', tile: 'bg-decorative-6-background text-decorative-6-foreground' },
] as const;

const CHART_SERIES: readonly ChartSeries[] = [
  {
    token: 'chart-1',
    ramp: 'fjord-alpha',
    steps: ['bg-chart-1-50', 'bg-chart-1-100', 'bg-chart-1-200', 'bg-chart-1-300', 'bg-chart-1-400', 'bg-chart-1-450'],
  },
  {
    token: 'chart-2',
    ramp: 'nordic-alpha',
    steps: ['bg-chart-2-50', 'bg-chart-2-100', 'bg-chart-2-200', 'bg-chart-2-300', 'bg-chart-2-400', 'bg-chart-2-450'],
  },
  {
    token: 'chart-3',
    ramp: 'aurora-alpha',
    steps: ['bg-chart-3-50', 'bg-chart-3-100', 'bg-chart-3-200', 'bg-chart-3-300', 'bg-chart-3-400', 'bg-chart-3-450'],
  },
  {
    token: 'chart-4',
    ramp: 'dusk-alpha',
    steps: ['bg-chart-4-50', 'bg-chart-4-100', 'bg-chart-4-200', 'bg-chart-4-300', 'bg-chart-4-400', 'bg-chart-4-450'],
  },
  {
    token: 'chart-5',
    ramp: 'amber-alpha',
    steps: ['bg-chart-5-50', 'bg-chart-5-100', 'bg-chart-5-200', 'bg-chart-5-300', 'bg-chart-5-400', 'bg-chart-5-450'],
  },
];

const CHART_STATUS_SERIES: readonly ChartSeries[] = [
  {
    token: 'chart-success',
    ramp: 'green-alpha',
    steps: [
      'bg-chart-success-50',
      'bg-chart-success-100',
      'bg-chart-success-200',
      'bg-chart-success-300',
      'bg-chart-success-400',
      'bg-chart-success-450',
    ],
  },
  {
    token: 'chart-warning',
    ramp: 'orange-alpha',
    steps: [
      'bg-chart-warning-50',
      'bg-chart-warning-100',
      'bg-chart-warning-200',
      'bg-chart-warning-300',
      'bg-chart-warning-400',
      'bg-chart-warning-450',
    ],
  },
  {
    token: 'chart-critical',
    ramp: 'red-alpha',
    steps: [
      'bg-chart-critical-50',
      'bg-chart-critical-100',
      'bg-chart-critical-200',
      'bg-chart-critical-300',
      'bg-chart-critical-400',
      'bg-chart-critical-450',
    ],
  },
  {
    token: 'chart-info',
    ramp: 'blue-alpha',
    steps: [
      'bg-chart-info-50',
      'bg-chart-info-100',
      'bg-chart-info-200',
      'bg-chart-info-300',
      'bg-chart-info-400',
      'bg-chart-info-450',
    ],
  },
  {
    token: 'chart-neutral',
    ramp: 'mountain-alpha',
    steps: [
      'bg-chart-neutral-50',
      'bg-chart-neutral-100',
      'bg-chart-neutral-200',
      'bg-chart-neutral-300',
      'bg-chart-neutral-400',
      'bg-chart-neutral-450',
    ],
  },
];

const THROUGHPUT_BARS = [
  { day: 'Mon', height: 'h-[52%]' },
  { day: 'Tue', height: 'h-[64%]' },
  { day: 'Wed', height: 'h-[58%]' },
  { day: 'Thu', height: 'h-[81%]' },
  { day: 'Fri', height: 'h-[73%]' },
  { day: 'Sat', height: 'h-[40%]' },
  { day: 'Sun', height: 'h-[35%]' },
] as const;

const HEAT_MAP: readonly SwatchToken[] = [
  { token: 'heat-map-mild', swatch: 'bg-heat-map-mild', light: 'fjord-100', dark: 'fjord-800' },
  { token: 'heat-map-moderate', swatch: 'bg-heat-map-moderate', light: 'fjord-300', dark: 'fjord-650' },
  { token: 'heat-map-strong', swatch: 'bg-heat-map-strong', light: 'fjord-450', dark: 'fjord-450' },
  { token: 'heat-map-intense', swatch: 'bg-heat-map-intense', light: 'fjord-600', dark: 'fjord-300' },
];

const HEAT_MAP_ROWS = [
  {
    shift: 'Night',
    cells: [
      'bg-heat-map-mild',
      'bg-heat-map-mild',
      'bg-heat-map-moderate',
      'bg-heat-map-mild',
      'bg-heat-map-mild',
      'bg-heat-map-moderate',
      'bg-heat-map-mild',
    ],
  },
  {
    shift: 'Day',
    cells: [
      'bg-heat-map-moderate',
      'bg-heat-map-strong',
      'bg-heat-map-intense',
      'bg-heat-map-strong',
      'bg-heat-map-moderate',
      'bg-heat-map-mild',
      'bg-heat-map-mild',
    ],
  },
  {
    shift: 'Evening',
    cells: [
      'bg-heat-map-mild',
      'bg-heat-map-moderate',
      'bg-heat-map-strong',
      'bg-heat-map-intense',
      'bg-heat-map-strong',
      'bg-heat-map-moderate',
      'bg-heat-map-mild',
    ],
  },
] as const;

const FIXED_DARK_SURFACES = [
  { token: 'popover-background-fixed-dark', swatch: 'bg-popover-background-fixed-dark', step: 'mountain-800' },
  { token: 'base-background-hover-fixed-dark', swatch: 'bg-base-background-hover-fixed-dark', step: 'mountain-700' },
  { token: 'secondary-background-fixed-dark', swatch: 'bg-secondary-background-fixed-dark', step: 'mountain-700' },
  {
    token: 'secondary-background-hover-fixed-dark',
    swatch: 'bg-secondary-background-hover-fixed-dark',
    step: 'mountain-600',
  },
  { token: 'primary-background-fixed-dark', swatch: 'bg-primary-background-fixed-dark', step: 'mountain-10' },
  {
    token: 'primary-background-hover-fixed-dark',
    swatch: 'bg-primary-background-hover-fixed-dark',
    step: 'mountain-100',
  },
] as const;

const FIXED_DARK_TEXT = [
  { token: 'popover-foreground-fixed-dark', text: 'text-popover-foreground-fixed-dark', step: 'mountain-white', sample: 'Asset hierarchy' },
  { token: 'secondary-foreground-fixed-dark', text: 'text-secondary-foreground-fixed-dark', step: 'mountain-200', sample: 'Time series' },
  { token: 'medium-foreground-fixed-dark', text: 'text-medium-foreground-fixed-dark', step: 'mountain-300', sample: 'Work orders' },
  { token: 'muted-foreground-fixed-dark', text: 'text-muted-foreground-fixed-dark', step: 'mountain-400', sample: 'Workspace' },
  {
    token: 'base-foreground-disabled-fixed-dark',
    text: 'text-base-foreground-disabled-fixed-dark',
    step: 'mountain-600',
    sample: 'Simulators',
  },
] as const;

function Swatch({ token, swatch, light, dark }: SwatchToken) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className={`h-14 rounded-lg border border-default ${swatch}`} />
      <div className="min-w-0">
        <p className="font-mono text-xs break-words text-base-foreground">{token}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {light} · {dark}
        </p>
      </div>
    </div>
  );
}

function ThemeKey() {
  return <p className="text-xs text-muted-foreground">Ramp steps read light · dark.</p>;
}

function ChartRamp({ series }: { series: readonly ChartSeries[] }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-[9rem_repeat(6,minmax(0,1fr))] items-end gap-2">
        <span className="text-xs text-muted-foreground">Token · ramp</span>
        {CHART_STEPS.map((step) => (
          <span key={step} className="text-center font-mono text-xs text-muted-foreground">
            {step}
          </span>
        ))}
      </div>
      {series.map((item) => (
        <div key={item.token} className="grid grid-cols-[9rem_repeat(6,minmax(0,1fr))] items-center gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs text-base-foreground">{item.token}-*</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.ramp}</p>
          </div>
          {item.steps.map((step) => (
            <div key={step} className={`h-10 rounded-md ${step}`} title={step} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ColorsSurfaces() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {SURFACES.map((item) => (
          <div key={item.token} className="flex min-w-0 flex-col gap-2">
            <div className={`flex h-28 flex-col justify-between rounded-xl border border-default p-4 ${item.surface}`}>
              <p className={`text-xl font-semibold ${item.foreground}`}>Aa</p>
              <p className={`text-sm ${item.foreground}`}>{item.use}</p>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs break-words text-base-foreground">{item.token}</p>
              <p className="font-mono text-xs break-words text-muted-foreground">{item.foregroundToken}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.light} · {item.dark}
              </p>
            </div>
          </div>
        ))}
      </div>
      <ThemeKey />
    </div>
  );
}

function ColorsSurfaceHovers() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {SURFACE_HOVERS.map((item) => (
          <Swatch key={item.token} {...item} />
        ))}
      </div>
      <ThemeKey />
    </div>
  );
}

function ColorsTextRoles() {
  return (
    <div className="flex w-full flex-col gap-4">
      {TEXT_ROLES.map((role) => (
        <div key={role.token} className="flex flex-col gap-1">
          <p className={`text-base ${role.text}`}>{role.sample}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{role.token}</span> · {role.steps}
          </p>
        </div>
      ))}
    </div>
  );
}

function ColorsPrimary() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex h-20 items-center justify-between rounded-xl bg-primary-background px-4">
        <p className="text-sm font-medium text-primary-foreground">Save changes</p>
        <p className="font-mono text-xs text-primary-foreground">primary-foreground</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {PRIMARY_HOVER.map((item) => (
          <Swatch key={item.token} {...item} />
        ))}
      </div>
    </div>
  );
}

function ColorsSecondary() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex h-20 items-center justify-between rounded-xl bg-secondary-background px-4">
        <p className="text-sm font-medium text-secondary-foreground">Export data</p>
        <p className="font-mono text-xs text-secondary-foreground">secondary-foreground</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {SECONDARY_HOVER.map((item) => (
          <Swatch key={item.token} {...item} />
        ))}
      </div>
    </div>
  );
}

function ColorsLink() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <p className="text-sm text-base-foreground">
        Read the <span className="text-link-foreground underline">ingestion guide</span> before you connect a source.
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-mono text-link-foreground">link-foreground</span> · fjord-600 · fjord-450
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono text-link-foreground-hover">link-foreground-hover</span> · fjord-700 · fjord-200
        </p>
      </div>
    </div>
  );
}

function ColorsBorders() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
      {BORDERS.map((item) => (
        <div key={item.token} className="flex min-w-0 flex-col gap-2">
          <div className={`flex h-16 items-center rounded-lg border px-3 ${item.border}`}>
            <p className="text-sm text-medium-foreground">{item.use}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-base-foreground">{item.token}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.steps}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorsRing() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {RINGS.map((item) => (
          <Swatch key={item.token} {...item} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Never paint these directly. They exist to be composed by <span className="font-mono">shadow-focus-ring</span>{' '}
        and <span className="font-mono">shadow-focus-ring-destructive</span>.
      </p>
    </div>
  );
}

function ColorsStatusPairings() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)] gap-x-6 gap-y-1">
        <span />
        <p className="text-xs font-medium text-base-foreground">On a tint: background + foreground</p>
        <p className="text-xs font-medium text-base-foreground">On a plain surface: foreground-strong</p>
      </div>
      {STATUS_FAMILIES.map((family) => (
        <div key={family.name} className="grid grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-6">
          <p className="pt-1 text-sm font-medium text-base-foreground">{family.name}</p>
          <div className="flex min-w-0 flex-col gap-2">
            <span className={`w-fit rounded-md px-2 py-1 text-sm font-medium ${family.tint}`}>{family.meaning}</span>
            <div>
              <p className="font-mono text-xs break-words text-base-foreground">{family.tintToken}</p>
              <p className="mt-1 text-xs text-muted-foreground">{family.tintSteps}</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className={`py-1 text-sm font-medium ${family.strong}`}>{family.meaning}</span>
            <div>
              <p className="font-mono text-xs break-words text-base-foreground">{family.strongToken}</p>
              <p className="mt-1 text-xs text-muted-foreground">{family.strongSteps}</p>
            </div>
          </div>
        </div>
      ))}
      <ThemeKey />
    </div>
  );
}

function ColorsStatusHovers() {
  return (
    <div className="flex w-full flex-col gap-3">
      {STATUS_HOVERS.map((item) => (
        <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_3rem_3rem] items-center gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs text-base-foreground">{item.name}-background-hover</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.steps} in light</p>
          </div>
          <div className={`h-8 rounded-md ${item.rest}`} />
          <div className={`h-8 rounded-md ${item.hover}`} />
        </div>
      ))}
    </div>
  );
}

function ColorsStatusOnCard() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-card-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-card-foreground">1st stage compressor</p>
        <span className="rounded-md bg-warning-background px-2 py-1 text-xs font-medium text-warning-foreground">
          Degraded
        </span>
      </div>
      <p className="flex items-center gap-2 text-sm text-warning-foreground-strong">
        <IconAlertTriangle className="size-4" aria-hidden="true" /> Drive-end vibration approaching limit
      </p>
      <p className="flex items-center gap-2 text-sm text-success-foreground-strong">
        <IconCircleCheck className="size-4" aria-hidden="true" /> Suction pressure normal
      </p>
    </div>
  );
}

function ColorsDecorativeSlots() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {DECORATIVE_SLOTS.map((item) => (
          <div key={item.slot} className="flex min-w-0 flex-col gap-2">
            <div className={`flex h-20 flex-col justify-between rounded-xl p-3 ${item.tile}`}>
              <p className="text-xl font-semibold">Aa</p>
              <p className="text-xs font-medium">{item.ramp}</p>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs break-words text-base-foreground">{item.slot}-background</p>
              <p className="font-mono text-xs break-words text-muted-foreground">{item.slot}-foreground</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.steps}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Light theme steps shown. In dark, backgrounds move to step 300 and foregrounds to step 900; slot 1 uses
        mountain-200 + mountain-700.
      </p>
    </div>
  );
}

function ColorsDecorativeHovers() {
  return (
    <div className="flex w-full flex-col gap-3">
      {DECORATIVE_SLOTS.map((item) => (
        <div key={item.slot} className="grid grid-cols-[minmax(0,1fr)_3rem_3rem] items-center gap-2">
          <p className="font-mono text-xs break-words text-base-foreground">{item.slot}-background-hover</p>
          <div className={`h-8 rounded-md ${item.background}`} />
          <div className={`h-8 rounded-md ${item.hover}`} />
        </div>
      ))}
    </div>
  );
}

function ColorsDecorativeTeams() {
  return (
    <ul className="flex w-full max-w-xs flex-col gap-3">
      {TEAM_TILES.map((item) => (
        <li key={item.team} className="flex items-center gap-3">
          <span
            className={`flex size-9 items-center justify-center rounded-lg text-xs font-semibold ${item.tile}`}
            aria-hidden="true"
          >
            {item.initials}
          </span>
          <span className="text-sm text-base-foreground">{item.team}</span>
        </li>
      ))}
    </ul>
  );
}

function ColorsChartSeries() {
  return <ChartRamp series={CHART_SERIES} />;
}

function ColorsChartStatusSeries() {
  return <ChartRamp series={CHART_STATUS_SERIES} />;
}

function ColorsChartGridlines() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className="relative h-40"
        role="img"
        aria-label="Daily throughput for one week, peaking on Thursday and lowest on Sunday"
      >
        <div className="absolute inset-0 flex flex-col justify-between">
          <div className="h-px bg-chart-gridlines" />
          <div className="h-px bg-chart-gridlines" />
          <div className="h-px bg-chart-gridlines" />
          <div className="h-px bg-chart-gridlines" />
          <div className="h-px bg-chart-gridlines" />
        </div>
        <div className="absolute inset-0 flex items-end gap-3 px-3">
          {THROUGHPUT_BARS.map((bar) => (
            <div key={bar.day} className={`flex-1 rounded-t-sm bg-chart-1-400 ${bar.height}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-3 px-3">
        {THROUGHPUT_BARS.map((bar) => (
          <span key={bar.day} className="flex-1 text-center text-xs text-muted-foreground">
            {bar.day}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono text-base-foreground">chart-gridlines</span> · mountain-100 · mountain-800, bars in{' '}
        <span className="font-mono text-base-foreground">chart-1-400</span>
      </p>
    </div>
  );
}

function ColorsHeatMapScale() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {HEAT_MAP.map((item) => (
          <Swatch key={item.token} {...item} />
        ))}
      </div>
      <ThemeKey />
    </div>
  );
}

function ColorsHeatMapGrid() {
  return (
    <div className="flex w-full flex-col gap-2" role="img" aria-label="Alarm density by shift, highest on day shifts midweek">
      {HEAT_MAP_ROWS.map((row) => (
        <div key={row.shift} className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] items-center gap-1">
          <span className="text-xs text-muted-foreground">{row.shift}</span>
          {row.cells.map((cell, index) => (
            <div key={`${row.shift}-${THROUGHPUT_BARS[index].day}`} className={`h-8 rounded-sm ${cell}`} />
          ))}
        </div>
      ))}
      <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] gap-1">
        <span />
        {THROUGHPUT_BARS.map((bar) => (
          <span key={bar.day} className="text-center text-xs text-muted-foreground">
            {bar.day}
          </span>
        ))}
      </div>
    </div>
  );
}

function ColorsFixedDarkSurfaces() {
  return (
    <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3">
      {FIXED_DARK_SURFACES.map((item) => (
        <div key={item.token} className="flex min-w-0 flex-col gap-2">
          <div className={`h-14 rounded-lg border border-secondary-background-hover-fixed-dark ${item.swatch}`} />
          <div className="min-w-0">
            <p className="font-mono text-xs break-words text-popover-foreground-fixed-dark">{item.token}</p>
            <p className="mt-1 text-xs text-muted-foreground-fixed-dark">{item.step} in both themes</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorsFixedDarkText() {
  return (
    <div className="flex w-full flex-col gap-3">
      {FIXED_DARK_TEXT.map((item) => (
        <div key={item.token} className="flex flex-col gap-1">
          <p className={`text-sm font-medium ${item.text}`}>{item.sample}</p>
          <p className="text-xs text-muted-foreground-fixed-dark">
            <span className="font-mono break-words">{item.token}</span> · {item.step}
          </p>
        </div>
      ))}
    </div>
  );
}

function ColorsWhichGroup() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-base-foreground">Status</p>
        <p className="text-sm text-muted-foreground">
          Does the colour say how something is doing? Health, validation, feedback, operational state.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Running</Badge>
          <Badge variant="warning">Degraded</Badge>
          <Badge variant="error">Tripped</Badge>
        </div>
        <p className="font-mono text-xs text-muted-foreground">success-* warning-* critical-* info-* neutral-*</p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-base-foreground">Decorative</p>
        <p className="text-sm text-muted-foreground">
          Does it only tell things apart? Teams, categories, avatars. It must never read as good or bad.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="decorative-2">Operations</Badge>
          <Badge variant="decorative-3">Maintenance</Badge>
          <Badge variant="decorative-5">Reliability</Badge>
        </div>
        <p className="font-mono text-xs text-muted-foreground">decorative-1-* … decorative-7-*</p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-base-foreground">Chart</p>
        <p className="text-sm text-muted-foreground">
          Is it data plotted on an axis or as a series? Lines, bars, areas and their legend keys.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-base-foreground">
            <span className="size-3 rounded-xs bg-chart-1-400" /> Inlet pressure
          </span>
          <span className="flex items-center gap-2 text-xs text-base-foreground">
            <span className="size-3 rounded-xs bg-chart-2-400" /> Outlet pressure
          </span>
        </div>
        <p className="font-mono text-xs text-muted-foreground">chart-1-* … chart-5-*, chart-success-* …</p>
      </div>
    </div>
  );
}

function ColorsStatusExample() {
  return (
    <ul className="flex w-full max-w-xs flex-col gap-3">
      <li className="flex items-center justify-between gap-3">
        <span className="text-sm text-base-foreground">Export pump A</span>
        <Badge variant="success">Running</Badge>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="text-sm text-base-foreground">1st stage compressor</span>
        <Badge variant="warning">Degraded</Badge>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="text-sm text-base-foreground">Recompressor</span>
        <Badge variant="error">Tripped</Badge>
      </li>
    </ul>
  );
}

function ColorsDecorativeExample() {
  return (
    <ul className="flex w-full max-w-xs flex-col gap-3">
      <li className="flex items-center justify-between gap-3">
        <span className="text-sm text-base-foreground">Replace mechanical seal</span>
        <Badge variant="decorative-3">Maintenance</Badge>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="text-sm text-base-foreground">Review trip report</span>
        <Badge variant="decorative-5">Reliability</Badge>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span className="text-sm text-base-foreground">Update shift handover</span>
        <Badge variant="decorative-2">Operations</Badge>
      </li>
    </ul>
  );
}

function ColorsChartExample() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div
        className="flex h-24 items-end gap-2"
        role="img"
        aria-label="Inlet and outlet pressure for four hours; outlet stays below inlet throughout"
      >
        <div className="h-[70%] flex-1 rounded-t-sm bg-chart-1-400" />
        <div className="h-[48%] flex-1 rounded-t-sm bg-chart-2-400" />
        <div className="h-[82%] flex-1 rounded-t-sm bg-chart-1-400" />
        <div className="h-[55%] flex-1 rounded-t-sm bg-chart-2-400" />
        <div className="h-[76%] flex-1 rounded-t-sm bg-chart-1-400" />
        <div className="h-[51%] flex-1 rounded-t-sm bg-chart-2-400" />
        <div className="h-[90%] flex-1 rounded-t-sm bg-chart-1-400" />
        <div className="h-[60%] flex-1 rounded-t-sm bg-chart-2-400" />
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-3 rounded-xs bg-chart-1-400" /> Inlet
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-3 rounded-xs bg-chart-2-400" /> Outlet
        </span>
      </div>
    </div>
  );
}

export default definePage({
  id: 'colors',
  title: 'Colors',
  summary:
    'Colour in Aura behaves like instrumentation: most of the screen is neutral structure, status colour is a signal, and decorative and chart colour each have one job. Every swatch here is a theme token that resolves to a different ramp step in light and dark.',
  guidance: {
    use: [
      'Base, medium, muted, card and popover tokens for 80 to 90 percent of any screen.',
      'A status background with its foreground on a tint; foreground-strong on a plain surface.',
      'Decorative slots to tell categories apart, chart tokens for anything plotted.',
      'Tailwind utilities built from the token name: bg-card-background, text-muted-foreground, border-default.',
    ],
    avoid: [
      'Raw colour values or ramp steps in product UI when a theme token exists.',
      'Status colour for categories, or decorative colour for health.',
      'Chart tokens on badges, tiles or text.',
      'Deprecated names such as text-foreground, bg-background, border-border and destructive-*.',
    ],
  },
  source,
  sections: [
    {
      id: 'surfaces',
      title: 'Surfaces and text',
      description: 'The neutral operating surface. Each background has a foreground made to sit on it.',
      specimens: [
        {
          id: 'ColorsSurfaces',
          title: 'Surface pairs',
          note: 'Pick the surface by role, then use its own foreground for the text on it.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: ColorsSurfaces,
        },
        {
          id: 'ColorsSurfaceHovers',
          title: 'Hover and disabled fills',
          note: 'Each surface has a hover step; use it for rows and tiles that respond to the pointer.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ColorsSurfaceHovers,
        },
        {
          id: 'ColorsTextRoles',
          title: 'Text roles',
          note: 'Step down from base to medium to muted as the text matters less.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ColorsTextRoles,
        },
      ],
    },
    {
      id: 'brand-actions',
      title: 'Brand actions',
      description: 'Fills for the primary and secondary action, and the link colour.',
      specimens: [
        {
          id: 'ColorsPrimary',
          title: 'Primary',
          note: 'The fill behind the single most important action; it inverts between themes.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          Component: ColorsPrimary,
        },
        {
          id: 'ColorsSecondary',
          title: 'Secondary',
          note: 'Quiet fills for supporting actions and selected neutral chips.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          Component: ColorsSecondary,
        },
        {
          id: 'ColorsLink',
          title: 'Link',
          note: 'Only for text that navigates; it is the one blue in running copy.',
          origin: 'aura',
          size: 'sm',
          Component: ColorsLink,
        },
      ],
    },
    {
      id: 'borders-and-focus',
      title: 'Borders and focus ring',
      description: 'Three stroke colours and the four colours the focus ring is composed from.',
      specimens: [
        {
          id: 'ColorsBorders',
          title: 'Border colours',
          note: 'Default for structure, emphasized for hover or stronger separation, disabled for inert outlines.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ColorsBorders,
        },
        {
          id: 'ColorsRing',
          title: 'Ring colours',
          note: 'Reference only: reach for the focus ring shadow utilities, not these tokens.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ColorsRing,
        },
      ],
    },
    {
      id: 'status',
      title: 'Status families',
      description: 'Success, warning, critical, info and neutral share one pairing rule.',
      specimens: [
        {
          id: 'ColorsStatusPairings',
          title: 'Two pairings per family',
          note: 'Use background + foreground for a filled chip, and foreground-strong when there is no tint behind the text.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: ColorsStatusPairings,
        },
        {
          id: 'ColorsStatusHovers',
          title: 'Status hover fills',
          note: 'For a status surface that is itself clickable, such as a dismissible chip.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ColorsStatusHovers,
        },
        {
          id: 'ColorsStatusOnCard',
          title: 'Both pairings on a card',
          note: 'A tinted chip for the headline state, strong text for the lines beneath it.',
          origin: 'aura',
          size: 'md',
          Component: ColorsStatusOnCard,
        },
      ],
    },
    {
      id: 'decorative',
      title: 'Decorative',
      description: 'Seven slots for telling things apart when the difference is not a status.',
      specimens: [
        {
          id: 'ColorsDecorativeSlots',
          title: 'Slots 1 to 7',
          note: 'Assign one slot per category and keep it stable across the product.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: ColorsDecorativeSlots,
        },
        {
          id: 'ColorsDecorativeHovers',
          title: 'Decorative hover fills',
          note: 'When a decorative tile or tag is interactive.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ColorsDecorativeHovers,
        },
        {
          id: 'ColorsDecorativeTeams',
          title: 'Category markers',
          note: 'Small tiles that give each team a recognisable colour without implying health.',
          origin: 'aura',
          size: 'md',
          Component: ColorsDecorativeTeams,
        },
      ],
    },
    {
      id: 'chart',
      title: 'Chart and heat map',
      description: 'Alpha ramps for plotted data. Step 50 is the lightest fill, 450 the strongest line.',
      specimens: [
        {
          id: 'ColorsChartSeries',
          title: 'Series 1 to 5',
          note: 'Assign series in order; use 400 or 450 for lines and bars, 50 to 200 for area fills.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: ColorsChartSeries,
        },
        {
          id: 'ColorsChartStatusSeries',
          title: 'Status series',
          note: 'When the series itself is a status, such as time in alarm, and for neutral baselines.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: ColorsChartStatusSeries,
        },
        {
          id: 'ColorsChartGridlines',
          title: 'Gridlines',
          note: 'Axis grid lines stay in the background so the series carries the colour.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          Component: ColorsChartGridlines,
        },
        {
          id: 'ColorsHeatMapScale',
          title: 'Heat map scale',
          note: 'Four density steps from mild to intense; the order flips lightness in dark.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          Component: ColorsHeatMapScale,
        },
        {
          id: 'ColorsHeatMapGrid',
          title: 'Heat map in use',
          note: 'Density over two dimensions, such as alarms per shift and weekday.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          Component: ColorsHeatMapGrid,
        },
      ],
    },
    {
      id: 'fixed-dark',
      title: 'Fixed-dark chrome',
      description: 'Tokens that stay dark in both themes, for sidebars and other persistent chrome.',
      specimens: [
        {
          id: 'ColorsFixedDarkSurfaces',
          title: 'Fixed-dark fills',
          note: 'Surfaces, hover and action fills inside chrome that never follows the theme.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          surface: 'chrome',
          Component: ColorsFixedDarkSurfaces,
        },
        {
          id: 'ColorsFixedDarkText',
          title: 'Fixed-dark text',
          note: 'The text ladder for dark chrome, from active item down to disabled.',
          origin: 'aura',
          size: 'sm',
          align: 'stretch',
          surface: 'chrome',
          Component: ColorsFixedDarkText,
        },
      ],
    },
    {
      id: 'choosing',
      title: 'Which group do I use',
      description: 'Status, decorative and chart colour never swap roles.',
      specimens: [
        {
          id: 'ColorsWhichGroup',
          title: 'Three questions',
          note: 'Ask what the colour is saying before picking a token group.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: ColorsWhichGroup,
        },
        {
          id: 'ColorsStatusExample',
          title: 'Status, correct',
          note: 'Equipment state: the colour changes when the state changes.',
          origin: 'aura',
          Component: ColorsStatusExample,
        },
        {
          id: 'ColorsDecorativeExample',
          title: 'Decorative, correct',
          note: 'Owning team: the colour identifies a category and never changes with health.',
          origin: 'aura',
          Component: ColorsDecorativeExample,
        },
        {
          id: 'ColorsChartExample',
          title: 'Chart, correct',
          note: 'Two measured series, coloured in series order with matching legend keys.',
          origin: 'aura',
          Component: ColorsChartExample,
        },
      ],
    },
  ],
});
