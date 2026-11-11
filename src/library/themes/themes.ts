/**
 * Theme options for Aura-based apps. A theme is a small set of overrides of Aura's own semantic
 * tokens, switched with data attributes on the root element — components and specimens need no
 * changes, because they only ever reference the tokens.
 *
 *   <html class="dark" data-accent="fjord" data-surface="tinted" data-shape="soft" data-contrast="high"
 *         data-density="compact" data-typeface="plex" data-look="console">
 *
 * The look (`data-look`) is the structural half of a theme: it changes how kit components are
 * built, not which tokens they read. See `src/library/looks`.
 *
 * `themes.css` is generated from this file (see themes.test.ts) and is the only thing an app
 * needs to import, after Aura's own stylesheet.
 */

import { DEFAULT_LOOK, parseLook, type LookId } from '../looks/looks';

export const MODES = ['light', 'dark'] as const;
export type Mode = (typeof MODES)[number];

export const ACCENTS = ['mountain', 'fjord', 'sky', 'nordic', 'aurora', 'dusk', 'amber', 'pink'] as const;
export type Accent = (typeof ACCENTS)[number];

export const SURFACES = ['neutral', 'tinted', 'deep'] as const;
export type Surface = (typeof SURFACES)[number];

export const SHAPES = ['sharp', 'default', 'soft'] as const;
export type Shape = (typeof SHAPES)[number];

export const CONTRASTS = ['default', 'high'] as const;
export type Contrast = (typeof CONTRASTS)[number];

export const DENSITIES = ['compact', 'default', 'spacious'] as const;
export type Density = (typeof DENSITIES)[number];

export const TYPEFACES = ['inter', 'grotesk', 'manrope', 'plex', 'sora'] as const;
export type Typeface = (typeof TYPEFACES)[number];

export type ThemeSettings = {
  mode: Mode;
  accent: Accent;
  surface: Surface;
  shape: Shape;
  contrast: Contrast;
  density: Density;
  typeface: Typeface;
  /** Structural design language for kit components. */
  look: LookId;
};

export const DEFAULT_THEME: ThemeSettings = {
  mode: 'light',
  accent: 'mountain',
  surface: 'neutral',
  shape: 'default',
  contrast: 'default',
  density: 'default',
  typeface: 'inter',
  look: DEFAULT_LOOK,
};

export const ACCENT_LABELS: Record<Accent, string> = {
  mountain: 'Mountain',
  fjord: 'Fjord',
  sky: 'Sky',
  nordic: 'Nordic',
  aurora: 'Aurora',
  dusk: 'Dusk',
  amber: 'Amber',
  pink: 'Pink',
};

export const SURFACE_LABELS: Record<Surface, string> = { neutral: 'Neutral', tinted: 'Tinted', deep: 'Deep' };
export const SHAPE_LABELS: Record<Shape, string> = { sharp: 'Sharp', default: 'Default', soft: 'Soft' };
export const CONTRAST_LABELS: Record<Contrast, string> = { default: 'Default', high: 'High' };
export const DENSITY_LABELS: Record<Density, string> = { compact: 'Compact', default: 'Default', spacious: 'Spacious' };
export const TYPEFACE_LABELS: Record<Typeface, string> = {
  inter: 'Inter',
  grotesk: 'Grotesk',
  manrope: 'Manrope',
  plex: 'Plex Sans',
  sora: 'Sora',
};

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  settings: ThemeSettings;
};

/** Named starting points. Every combination of the options is valid; these are the curated ones. */
export const THEME_PRESETS: readonly ThemePreset[] = [
  preset('aura', 'Aura', 'The design system as shipped: neutral actions on quiet surfaces.', {}),
  preset('aura-dark', 'Aura dark', 'The default theme for low-light rooms.', { mode: 'dark' }),
  preset('fjord', 'Fjord', 'Brand blue actions and links for product surfaces.', { accent: 'fjord' }),
  preset('fjord-dark', 'Fjord dark', 'Brand blue on dark surfaces.', { mode: 'dark', accent: 'fjord' }),
  preset('control-room', 'Control room', 'Dark, sharp, dense and high contrast for operator consoles.', {
    mode: 'dark',
    accent: 'nordic',
    shape: 'sharp',
    contrast: 'high',
    density: 'compact',
    look: 'console',
  }),
  preset('wall-display', 'Wall display', 'Dark, spacious and high contrast for screens read from across a room.', {
    mode: 'dark',
    accent: 'sky',
    contrast: 'high',
    density: 'spacious',
    look: 'signal',
  }),
  preset('blueprint', 'Blueprint', 'Sharp corners and blue-tinted surfaces for engineering tools.', {
    accent: 'fjord',
    surface: 'tinted',
    shape: 'sharp',
    look: 'blueprint',
  }),
  preset('schematic', 'Schematic', 'Drawing-style, sharp and compact for configuration and tag-heavy tools.', {
    accent: 'sky',
    shape: 'sharp',
    density: 'compact',
    typeface: 'plex',
    look: 'blueprint',
  }),
  preset('terminal', 'Terminal', 'Console look on dark for logs, queries and developer consoles.', {
    mode: 'dark',
    accent: 'aurora',
    shape: 'sharp',
    density: 'compact',
    typeface: 'plex',
    look: 'console',
  }),
  preset('field', 'Field', 'High contrast and large, soft shapes for tablets used outdoors.', {
    accent: 'aurora',
    shape: 'soft',
    contrast: 'high',
    density: 'spacious',
    look: 'poster',
  }),
  preset('field-night', 'Field night', 'The field theme for night rounds.', {
    mode: 'dark',
    accent: 'amber',
    shape: 'soft',
    contrast: 'high',
    density: 'spacious',
    look: 'signal',
  }),
  preset('nordic', 'Nordic', 'Teal actions on neutral surfaces for monitoring products.', { accent: 'nordic' }),
  preset('nordic-night', 'Nordic night', 'Teal on tinted dark surfaces for views that stay open all shift.', {
    mode: 'dark',
    accent: 'nordic',
    surface: 'tinted',
    look: 'glass',
  }),
  preset('aurora', 'Aurora', 'Green accents on tinted surfaces for sustainability and energy views.', {
    accent: 'aurora',
    surface: 'tinted',
    look: 'soft',
  }),
  preset('dusk', 'Dusk', 'Purple accents on soft shapes for analytics and AI features.', {
    accent: 'dusk',
    surface: 'tinted',
    shape: 'soft',
    look: 'soft',
  }),
  preset('dusk-night', 'Dusk night', 'Purple on tinted dark surfaces for AI workspaces.', {
    mode: 'dark',
    accent: 'dusk',
    surface: 'tinted',
    shape: 'soft',
    look: 'glass',
  }),
  preset('amber-shift', 'Amber shift', 'Warm accents on dark surfaces for night shifts.', {
    mode: 'dark',
    accent: 'amber',
    surface: 'tinted',
    look: 'console',
  }),
  preset('sandstone', 'Sandstone', 'Warm tinted surfaces for reports and documents.', {
    accent: 'amber',
    surface: 'tinted',
    density: 'spacious',
    look: 'editorial',
  }),
  preset('pink-soft', 'Pink soft', 'A friendly, rounded theme for onboarding and internal tools.', {
    accent: 'pink',
    surface: 'tinted',
    shape: 'soft',
    look: 'soft',
  }),
  preset('sky', 'Sky', 'Light blue accents for a lighter product tone.', { accent: 'sky', surface: 'tinted' }),
  preset('editorial', 'Editorial', 'Grotesk type and generous space for landing pages and summaries.', {
    typeface: 'grotesk',
    density: 'spacious',
    shape: 'soft',
    look: 'editorial',
  }),
  preset('editorial-dark', 'Editorial dark', 'The editorial theme on dark.', {
    mode: 'dark',
    accent: 'pink',
    typeface: 'grotesk',
    density: 'spacious',
    shape: 'soft',
    look: 'editorial',
  }),
  preset('dense-data', 'Dense data', 'Compact and sharp for large tables and trading-style screens.', {
    shape: 'sharp',
    density: 'compact',
    look: 'console',
  }),
  preset('tron', 'Tron', 'Near-black surfaces, cyan lines and glass panels for futuristic command screens.', {
    mode: 'dark',
    accent: 'sky',
    surface: 'deep',
    shape: 'sharp',
    density: 'compact',
    typeface: 'plex',
    look: 'glass',
  }),
  preset('hologram', 'Hologram', 'Teal on black with soft shapes for 3D and digital-twin views.', {
    mode: 'dark',
    accent: 'nordic',
    surface: 'deep',
    shape: 'soft',
    look: 'glass',
  }),
  preset('neon-dusk', 'Neon dusk', 'Purple on black with grotesk type for showpiece and AI screens.', {
    mode: 'dark',
    accent: 'dusk',
    surface: 'deep',
    typeface: 'grotesk',
    look: 'glass',
  }),
  preset('night-vision', 'Night vision', 'Green on black, sharp and dense, for surveillance-style monitoring.', {
    mode: 'dark',
    accent: 'aurora',
    surface: 'deep',
    shape: 'sharp',
    typeface: 'plex',
    look: 'console',
  }),
  preset('ember', 'Ember', 'Amber on black for furnace, flare and heat-centred screens.', {
    mode: 'dark',
    accent: 'amber',
    surface: 'deep',
    contrast: 'high',
    look: 'signal',
  }),
  preset('accessible', 'Accessible', 'High contrast, default shapes and extra space for maximum legibility.', {
    accent: 'fjord',
    contrast: 'high',
    density: 'spacious',
    look: 'poster',
  }),
];

function preset(id: string, name: string, description: string, overrides: Partial<ThemeSettings>): ThemePreset {
  return { id, name, description, settings: { ...DEFAULT_THEME, ...overrides } };
}

type TokenMap = Record<string, string>;

/** Token overrides per accent. Values are Aura ramp steps, never raw colours. */
export function accentTokens(accent: Exclude<Accent, 'mountain'>, mode: Mode): TokenMap {
  const step = (value: number) => `var(--${accent}-${value})`;
  if (mode === 'light') {
    return {
      'primary-background': step(700),
      'primary-background-hover': step(800),
      'primary-foreground': 'var(--mountain-white)',
      'ring-default': step(600),
      'link-foreground': step(700),
      'link-foreground-hover': step(800),
    };
  }
  return {
    'primary-background': step(300),
    'primary-background-hover': step(200),
    'primary-foreground': step(950),
    'ring-default': step(400),
    'link-foreground': step(300),
    'link-foreground-hover': step(200),
  };
}

/** Surface overrides for the tinted option: the quiet surfaces pick up the accent's hue. */
export function tintedSurfaceTokens(accent: Exclude<Accent, 'mountain'>, mode: Mode): TokenMap {
  const step = (value: number) => `var(--${accent}-${value})`;
  if (mode === 'light') {
    return {
      'muted-background': step(50),
      'muted-background-hover': step(100),
      'card-background': step(50),
      'card-background-hover': step(100),
      'secondary-background': step(100),
      'secondary-background-hover': step(200),
      'secondary-foreground': step(800),
      // Aura's default tertiary text is tuned for white; one step darker keeps AA on a tint.
      'muted-foreground': 'var(--mountain-650)',
    };
  }
  return {
    'muted-background': step(950),
    'muted-background-hover': step(900),
    'card-background': step(900),
    'card-background-hover': step(800),
    'secondary-background': step(800),
    'secondary-background-hover': step(700),
    'secondary-foreground': step(100),
    // Restates Aura's dark value: the light tinted rule above is more specific than .dark.
    'muted-foreground': 'var(--mountain-400)',
  };
}

/**
 * The deep surface: near-black page with accent-tinted panels and strokes, for futuristic and 3D
 * screens. It only exists in dark mode; in light mode it behaves like neutral.
 */
export function deepSurfaceTokens(accent: Accent): TokenMap {
  const neutral: TokenMap = {
    'base-background': 'var(--mountain-black)',
    'base-background-hover': 'var(--mountain-950)',
    'muted-background': 'var(--mountain-black)',
    'muted-background-hover': 'var(--mountain-950)',
    'medium-background': 'var(--mountain-950)',
    'popover-background': 'var(--mountain-950)',
    'card-background': 'var(--mountain-950)',
    'card-background-hover': 'var(--mountain-900)',
    default: 'var(--mountain-800)',
  };
  if (accent === 'mountain') return neutral;
  const step = (value: number) => `var(--${accent}-${value})`;
  return {
    ...neutral,
    'card-background': step(950),
    'card-background-hover': step(900),
    default: step(800),
    emphasized: step(700),
    'secondary-background': step(900),
    'secondary-background-hover': step(800),
    'secondary-foreground': step(100),
  };
}

export function highContrastTokens(mode: Mode): TokenMap {
  if (mode === 'light') {
    return {
      default: 'var(--mountain-300)',
      emphasized: 'var(--mountain-500)',
      'muted-foreground': 'var(--mountain-700)',
      'medium-foreground': 'var(--mountain-900)',
      'secondary-foreground': 'var(--mountain-950)',
    };
  }
  return {
    default: 'var(--mountain-500)',
    emphasized: 'var(--mountain-400)',
    'muted-foreground': 'var(--mountain-200)',
    'medium-foreground': 'var(--mountain-100)',
    'secondary-foreground': 'var(--mountain-white)',
  };
}

/** Corner radii in px per shape, for the steps Aura's components use. */
export const SHAPE_RADII: Record<Exclude<Shape, 'default'>, Record<string, number>> = {
  sharp: { xs: 0, sm: 1, md: 2, lg: 2, xl: 4, '2xl': 6, '3xl': 8, '4xl': 12 },
  soft: { xs: 4, sm: 6, md: 10, lg: 12, xl: 18, '2xl': 24, '3xl': 32, '4xl': 40 },
};

/**
 * Tailwind's base spacing unit per density. Every padding, gap and control height is a multiple
 * of it, so one variable tightens or loosens the whole interface. Default is 0.25rem (4px).
 */
export const DENSITY_SPACING: Record<Exclude<Density, 'default'>, string> = {
  compact: '0.21875rem',
  spacious: '0.28125rem',
};

/**
 * UI font per typeface: readable sans families only. Monospace is for code blocks, never for the
 * interface. Grotesk ships with Aura; the others are imported in `src/styles.css`.
 */
export const TYPEFACE_FAMILIES: Record<Exclude<Typeface, 'inter'>, string> = {
  grotesk: "'Space Grotesk', 'Inter', sans-serif",
  manrope: "'Manrope Variable', 'Inter', sans-serif",
  plex: "'IBM Plex Sans Variable', 'Inter', sans-serif",
  sora: "'Sora Variable', 'Inter', sans-serif",
};

function block(selector: string, tokens: Record<string, string>): string {
  const lines = Object.entries(tokens).map(([name, value]) => `  --${name}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

const HEADER = `/*
 * Aura theme options. Generated from themes.ts — do not edit by hand.
 * Import after Aura's stylesheet, then set attributes on the root element:
 *   data-accent="mountain|fjord|sky|nordic|aurora|dusk|amber|pink"
 *   data-surface="neutral|tinted|deep"   data-shape="sharp|default|soft"   data-contrast="default|high"
 *   data-density="compact|default|spacious"   data-typeface="inter|grotesk|manrope|plex|sora"
 *   data-look="studio|console|poster|glass|editorial|soft|blueprint|signal" (styled by looks.css)
 * Light and dark come from Aura's own .dark class.
 */`;

/** The full stylesheet for every theme option. */
export function buildThemeCss(): string {
  const blocks: string[] = [HEADER];

  for (const accent of ACCENTS) {
    if (accent === 'mountain') continue;
    blocks.push(block(`[data-accent='${accent}']`, accentTokens(accent, 'light')));
    blocks.push(block(`.dark[data-accent='${accent}'],\n.dark [data-accent='${accent}'],\n[data-accent='${accent}'] .dark`, accentTokens(accent, 'dark')));
    blocks.push(block(`[data-accent='${accent}'][data-surface='tinted']`, tintedSurfaceTokens(accent, 'light')));
    blocks.push(
      block(
        `.dark[data-accent='${accent}'][data-surface='tinted'],\n.dark [data-accent='${accent}'][data-surface='tinted'],\n[data-accent='${accent}'][data-surface='tinted'] .dark`,
        tintedSurfaceTokens(accent, 'dark')
      )
    );
  }

  for (const accent of ACCENTS) {
    blocks.push(
      block(
        `.dark[data-accent='${accent}'][data-surface='deep'],\n.dark [data-accent='${accent}'][data-surface='deep'],\n[data-accent='${accent}'][data-surface='deep'] .dark`,
        deepSurfaceTokens(accent)
      )
    );
  }

  blocks.push(block("[data-contrast='high']", highContrastTokens('light')));
  blocks.push(
    block(".dark[data-contrast='high'],\n.dark [data-contrast='high'],\n[data-contrast='high'] .dark", highContrastTokens('dark'))
  );

  for (const [shape, radii] of Object.entries(SHAPE_RADII)) {
    const tokens = Object.fromEntries(Object.entries(radii).map(([name, px]) => [`radius-${name}`, `${px}px`]));
    blocks.push(block(`[data-shape='${shape}']`, tokens));
  }

  for (const [density, spacing] of Object.entries(DENSITY_SPACING)) {
    blocks.push(block(`[data-density='${density}']`, { spacing }));
  }

  for (const [typeface, family] of Object.entries(TYPEFACE_FAMILIES)) {
    blocks.push(block(`[data-typeface='${typeface}']`, { 'font-inter': family }));
  }

  return `${blocks.join('\n\n')}\n`;
}

/** Root attributes for a theme. `mode` is applied separately through Aura's `.dark` class. */
export function themeAttributes(settings: ThemeSettings): Record<string, string> {
  return {
    'data-accent': settings.accent,
    'data-surface': settings.surface,
    'data-shape': settings.shape,
    'data-contrast': settings.contrast,
    'data-density': settings.density,
    'data-typeface': settings.typeface,
    'data-look': settings.look,
  };
}

function isOneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && options.some((option) => option === value);
}

/** Reads theme settings from untrusted input, falling back to the default per field. */
export function parseThemeSettings(value: unknown): ThemeSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_THEME;
  const record: Record<string, unknown> = { ...value };
  return {
    mode: isOneOf(MODES, record.mode) ? record.mode : DEFAULT_THEME.mode,
    accent: isOneOf(ACCENTS, record.accent) ? record.accent : DEFAULT_THEME.accent,
    surface: isOneOf(SURFACES, record.surface) ? record.surface : DEFAULT_THEME.surface,
    shape: isOneOf(SHAPES, record.shape) ? record.shape : DEFAULT_THEME.shape,
    contrast: isOneOf(CONTRASTS, record.contrast) ? record.contrast : DEFAULT_THEME.contrast,
    density: isOneOf(DENSITIES, record.density) ? record.density : DEFAULT_THEME.density,
    typeface: isOneOf(TYPEFACES, record.typeface) ? record.typeface : DEFAULT_THEME.typeface,
    look: parseLook(record.look),
  };
}

export function sameTheme(a: ThemeSettings, b: ThemeSettings): boolean {
  return (
    a.mode === b.mode &&
    a.accent === b.accent &&
    a.surface === b.surface &&
    a.shape === b.shape &&
    a.contrast === b.contrast &&
    a.density === b.density &&
    a.typeface === b.typeface &&
    a.look === b.look
  );
}
