import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cognite/aura/components/card';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Switch } from '@cognite/aura/components/switch';

import {
  ACCENT_LABELS,
  ACCENTS,
  CONTRAST_LABELS,
  CONTRASTS,
  DEFAULT_THEME,
  SHAPE_LABELS,
  SHAPES,
  SURFACE_LABELS,
  SURFACES,
  THEME_PRESETS,
  themeAttributes,
  type ThemeSettings,
} from '../../../library/themes/themes';
import { definePage } from '../../types';

import source from './themes.tsx?raw';

const APPLY_SNIPPET = `/* styles.css */
@import '@cognite/aura/styles.source.css';
@import './library/themes/themes.css';

<!-- index.html: pick any combination -->
<html class="dark" data-accent="nordic" data-surface="tinted" data-shape="sharp" data-contrast="high">`;

const SCOPE_SNIPPET = `import { themeAttributes } from '@/library/themes/themes';

// Theme one region only, for example a wall-display panel inside a light app.
<section className="dark" {...themeAttributes({ mode: 'dark', accent: 'amber', surface: 'tinted', shape: 'sharp', contrast: 'high' })}>
  …
</section>`;

/** A small, representative screen rendered inside its own theme scope. */
function ThemeSample({ settings, title }: { settings: ThemeSettings; title: string }) {
  return (
    <div
      {...themeAttributes(settings)}
      className={`${settings.mode === 'dark' ? 'dark ' : ''}w-full rounded-xl bg-muted-background p-4 text-base-foreground`}
    >
      <Card>
        <CardHeader>
          <CardTitle as="h4">{title}</CardTitle>
          <CardDescription>1st stage compressor · 23-KA-9101</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Running</Badge>
              <Badge variant="warning">Vibration high</Badge>
              <Badge variant="secondary">Criticality A</Badge>
            </div>
            <div>
              <Label htmlFor={`${title}-setpoint`}>Discharge pressure setpoint</Label>
              <Input id={`${title}-setpoint`} defaultValue="48.5 barg" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-medium-foreground">
                <Switch defaultChecked aria-label="Notify on alarm" /> Notify on alarm
              </label>
              <a href="#trend" onClick={(event) => event.preventDefault()} className="text-sm text-link-foreground">
                Open trend
              </a>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary">Discard</Button>
              <Button>Save changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PresetSample({ presetId }: { presetId: string }) {
  const preset = THEME_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) return null;
  return <ThemeSample settings={preset.settings} title={preset.name} />;
}

function OptionRow({ label, settings }: { label: string; settings: ThemeSettings }) {
  return (
    <div
      {...themeAttributes(settings)}
      className={`${settings.mode === 'dark' ? 'dark ' : ''}flex items-center gap-3 rounded-lg bg-muted-background p-3`}
    >
      <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <Button size="sm">Save changes</Button>
      <Button size="sm" variant="secondary">
        Export
      </Button>
      <Button size="sm" variant="outline">
        Details
      </Button>
      <span className="text-sm text-link-foreground">Open trend</span>
      <div className="ml-auto w-32">
        <Input aria-label={`${label} sample input`} defaultValue="48.5 barg" />
      </div>
    </div>
  );
}

function Snippet({ code }: { code: string }) {
  return (
    <pre className="w-full overflow-x-auto rounded-lg bg-medium-background p-4 font-mono text-xs text-base-foreground">
      {code}
    </pre>
  );
}

function ThemesPresetAura() {
  return <PresetSample presetId="aura" />;
}

function ThemesPresetAuraDark() {
  return <PresetSample presetId="aura-dark" />;
}

function ThemesPresetFjord() {
  return <PresetSample presetId="fjord" />;
}

function ThemesPresetControlRoom() {
  return <PresetSample presetId="control-room" />;
}

function ThemesPresetBlueprint() {
  return <PresetSample presetId="blueprint" />;
}

function ThemesPresetField() {
  return <PresetSample presetId="field" />;
}

function ThemesPresetNordicNight() {
  return <PresetSample presetId="nordic-night" />;
}

function ThemesPresetDusk() {
  return <PresetSample presetId="dusk" />;
}

function ThemesPresetAmberShift() {
  return <PresetSample presetId="amber-shift" />;
}

function ThemesPresetPinkSoft() {
  return <PresetSample presetId="pink-soft" />;
}

function ThemesAccentOptions() {
  return (
    <div className="flex w-full flex-col gap-2">
      {ACCENTS.map((accent) => (
        <OptionRow key={accent} label={ACCENT_LABELS[accent]} settings={{ ...DEFAULT_THEME, accent }} />
      ))}
    </div>
  );
}

function ThemesAccentOptionsDark() {
  return (
    <div className="flex w-full flex-col gap-2">
      {ACCENTS.map((accent) => (
        <OptionRow key={accent} label={ACCENT_LABELS[accent]} settings={{ ...DEFAULT_THEME, mode: 'dark', accent }} />
      ))}
    </div>
  );
}

function ThemesSurfaceOptions() {
  return (
    <div className="flex w-full flex-col gap-2">
      {SURFACES.map((surface) => (
        <OptionRow
          key={surface}
          label={SURFACE_LABELS[surface]}
          settings={{ ...DEFAULT_THEME, accent: 'fjord', surface }}
        />
      ))}
    </div>
  );
}

function ThemesShapeOptions() {
  return (
    <div className="flex w-full flex-col gap-2">
      {SHAPES.map((shape) => (
        <OptionRow key={shape} label={SHAPE_LABELS[shape]} settings={{ ...DEFAULT_THEME, shape }} />
      ))}
    </div>
  );
}

function ThemesContrastOptions() {
  return (
    <div className="flex w-full flex-col gap-2">
      {CONTRASTS.map((contrast) => (
        <OptionRow key={contrast} label={CONTRAST_LABELS[contrast]} settings={{ ...DEFAULT_THEME, contrast }} />
      ))}
    </div>
  );
}

function ThemesApplyGlobally() {
  return <Snippet code={APPLY_SNIPPET} />;
}

function ThemesApplyToRegion() {
  return <Snippet code={SCOPE_SNIPPET} />;
}

export default definePage({
  id: 'themes',
  title: 'Themes',
  summary:
    'Every variant in the library can be shown in any theme. A theme overrides a handful of Aura tokens — accent, surface, shape and contrast — on top of light or dark, so components never change.',
  guidance: {
    use: [
      'Pick one theme per product and keep it; switch only light and dark per user.',
      'Use the Theme menu in the top bar to try a theme on every page of this library.',
      'Theme a single region when it has a different job, such as a wall display.',
      'Choose high contrast for field tablets, bright rooms and wall displays.',
    ],
    avoid: [
      'Overriding tokens outside this stylesheet, or restyling components to fake a theme.',
      'Using an accent to signal status — status colours stay the same in every theme.',
      'Mixing several accents on one screen.',
      'Light presets inside a dark page: light is the root default and cannot be nested.',
    ],
  },
  source,
  sections: [
    {
      id: 'presets',
      title: 'Presets',
      description:
        'Ten curated combinations. Dark presets always preview dark; the others follow the mode you are in.',
      specimens: [
        {
          id: 'ThemesPresetAura',
          title: 'Aura',
          note: 'The default: pick it unless the product has a reason to differ.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ThemesPresetAura,
        },
        {
          id: 'ThemesPresetAuraDark',
          title: 'Aura dark',
          note: 'The default for low-light rooms and users who prefer dark.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ThemesPresetAuraDark,
        },
        {
          id: 'ThemesPresetFjord',
          title: 'Fjord',
          note: 'Brand blue actions and links for customer-facing product surfaces.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesPresetFjord,
        },
        {
          id: 'ThemesPresetControlRoom',
          title: 'Control room',
          note: 'Wall displays and operator consoles: dark, sharp, high contrast.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesPresetControlRoom,
        },
        {
          id: 'ThemesPresetBlueprint',
          title: 'Blueprint',
          note: 'Engineering and configuration tools: sharp corners on blue-tinted surfaces.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesPresetBlueprint,
        },
        {
          id: 'ThemesPresetField',
          title: 'Field',
          note: 'Tablets used outdoors: high contrast and large, soft shapes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesPresetField,
        },
        {
          id: 'ThemesPresetNordicNight',
          title: 'Nordic night',
          note: 'Monitoring views that stay open all shift: teal on tinted dark surfaces.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesPresetNordicNight,
        },
        {
          id: 'ThemesPresetDusk',
          title: 'Dusk',
          note: 'Analytics and AI features that should feel distinct from operations.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesPresetDusk,
        },
        {
          id: 'ThemesPresetAmberShift',
          title: 'Amber shift',
          note: 'Night shifts: warm accents on dark surfaces are easier on adapted eyes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesPresetAmberShift,
        },
        {
          id: 'ThemesPresetPinkSoft',
          title: 'Pink soft',
          note: 'Onboarding and internal tools where a friendlier tone fits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesPresetPinkSoft,
        },
      ],
    },
    {
      id: 'options',
      title: 'Options',
      description: 'The four axes behind the presets. Any combination is valid: 7 accents × 2 surfaces × 3 shapes × 2 contrasts × 2 modes.',
      specimens: [
        {
          id: 'ThemesAccentOptions',
          title: 'Accent',
          note: 'Sets primary actions, links and the focus ring; pick the one that matches the product brand.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesAccentOptions,
        },
        {
          id: 'ThemesAccentOptionsDark',
          title: 'Accent, dark',
          note: 'The same accents in dark mode, where they switch to lighter ramp steps.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesAccentOptionsDark,
        },
        {
          id: 'ThemesSurfaceOptions',
          title: 'Surface',
          note: 'Tinted gives cards, muted areas and secondary buttons the accent hue; neutral keeps them grey.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesSurfaceOptions,
        },
        {
          id: 'ThemesShapeOptions',
          title: 'Shape',
          note: 'Sharp for dense technical tools, soft for touch and friendlier products.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesShapeOptions,
        },
        {
          id: 'ThemesContrastOptions',
          title: 'Contrast',
          note: 'High strengthens borders and secondary text for bright rooms and distance viewing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesContrastOptions,
        },
      ],
    },
    {
      id: 'applying',
      title: 'Applying a theme',
      description: 'One stylesheet and a few attributes. No component code changes.',
      specimens: [
        {
          id: 'ThemesApplyGlobally',
          title: 'Whole app',
          note: 'Import the stylesheet after Aura and set the attributes on the root element.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesApplyGlobally,
        },
        {
          id: 'ThemesApplyToRegion',
          title: 'One region',
          note: 'Spread the attributes on a wrapper to theme only what is inside it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['themes/themes.css', 'themes/themes.ts'],
          Component: ThemesApplyToRegion,
        },
      ],
    },
  ],
});
