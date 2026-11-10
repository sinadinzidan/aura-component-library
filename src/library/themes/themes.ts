/**
 * Theme options for Aura-based apps. A theme is a small set of overrides of Aura's own semantic
 * tokens, switched with data attributes on the root element — components and specimens need no
 * changes, because they only ever reference the tokens.
 *
 *   <html class="dark" data-accent="fjord" data-surface="tinted" data-shape="soft" data-contrast="high">
 *
 * `themes.css` is generated from this file (see themes.test.ts) and is the only thing an app
 * needs to import, after Aura's own stylesheet.
 */

export const MODES = ['light', 'dark'] as const;
export type Mode = (typeof MODES)[number];

export const ACCENTS = ['mountain', 'fjord', 'nordic', 'aurora', 'dusk', 'amber', 'pink'] as const;
export type Accent = (typeof ACCENTS)[number];

export const SURFACES = ['neutral', 'tinted'] as const;
export type Surface = (typeof SURFACES)[number];

export const SHAPES = ['sharp', 'default', 'soft'] as const;
export type Shape = (typeof SHAPES)[number];

export const CONTRASTS = ['default', 'high'] as const;
export type Contrast = (typeof CONTRASTS)[number];

export type ThemeSettings = {
  mode: Mode;
  accent: Accent;
  surface: Surface;
  shape: Shape;
  contrast: Contrast;
};

export const DEFAULT_THEME: ThemeSettings = {
  mode: 'light',
  accent: 'mountain',
  surface: 'neutral',
  shape: 'default',
  contrast: 'default',
};

export const ACCENT_LABELS: Record<Accent, string> = {
  mountain: 'Mountain',
  fjord: 'Fjord',
  nordic: 'Nordic',
  aurora: 'Aurora',
  dusk: 'Dusk',
  amber: 'Amber',
  pink: 'Pink',
};

export const SURFACE_LABELS: Record<Surface, string> = { neutral: 'Neutral', tinted: 'Tinted' };
export const SHAPE_LABELS: Record<Shape, string> = { sharp: 'Sharp', default: 'Default', soft: 'Soft' };
export const CONTRAST_LABELS: Record<Contrast, string> = { default: 'Default', high: 'High' };

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  settings: ThemeSettings;
};

/** Named starting points. Every combination of the options is valid; these are the curated ones. */
export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: 'aura',
    name: 'Aura',
    description: 'The design system as shipped: neutral actions on quiet surfaces.',
    settings: DEFAULT_THEME,
  },
  {
    id: 'aura-dark',
    name: 'Aura dark',
    description: 'The default theme for low-light rooms.',
    settings: { ...DEFAULT_THEME, mode: 'dark' },
  },
  {
    id: 'fjord',
    name: 'Fjord',
    description: 'Brand blue actions and links for product surfaces.',
    settings: { ...DEFAULT_THEME, accent: 'fjord' },
  },
  {
    id: 'control-room',
    name: 'Control room',
    description: 'Dark, sharp and high contrast for wall displays and operator consoles.',
    settings: { mode: 'dark', accent: 'nordic', surface: 'neutral', shape: 'sharp', contrast: 'high' },
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Sharp corners and blue-tinted surfaces for engineering tools.',
    settings: { mode: 'light', accent: 'fjord', surface: 'tinted', shape: 'sharp', contrast: 'default' },
  },
  {
    id: 'field',
    name: 'Field',
    description: 'High contrast and soft, large shapes for tablets used outdoors.',
    settings: { mode: 'light', accent: 'aurora', surface: 'neutral', shape: 'soft', contrast: 'high' },
  },
  {
    id: 'nordic-night',
    name: 'Nordic night',
    description: 'Teal on tinted dark surfaces for monitoring views.',
    settings: { mode: 'dark', accent: 'nordic', surface: 'tinted', shape: 'default', contrast: 'default' },
  },
  {
    id: 'dusk',
    name: 'Dusk',
    description: 'Purple accents on soft shapes for analytics and AI features.',
    settings: { mode: 'light', accent: 'dusk', surface: 'tinted', shape: 'soft', contrast: 'default' },
  },
  {
    id: 'amber-shift',
    name: 'Amber shift',
    description: 'Warm accents on dark surfaces for night shifts.',
    settings: { mode: 'dark', accent: 'amber', surface: 'tinted', shape: 'default', contrast: 'default' },
  },
  {
    id: 'pink-soft',
    name: 'Pink soft',
    description: 'A friendly, rounded theme for onboarding and internal tools.',
    settings: { mode: 'light', accent: 'pink', surface: 'tinted', shape: 'soft', contrast: 'default' },
  },
];

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

function block(selector: string, tokens: Record<string, string>): string {
  const lines = Object.entries(tokens).map(([name, value]) => `  --${name}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

const HEADER = `/*
 * Aura theme options. Generated from themes.ts — do not edit by hand.
 * Import after Aura's stylesheet, then set attributes on the root element:
 *   data-accent="mountain|fjord|nordic|aurora|dusk|amber|pink"
 *   data-surface="neutral|tinted"   data-shape="sharp|default|soft"   data-contrast="default|high"
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

  blocks.push(block("[data-contrast='high']", highContrastTokens('light')));
  blocks.push(
    block(".dark[data-contrast='high'],\n.dark [data-contrast='high'],\n[data-contrast='high'] .dark", highContrastTokens('dark'))
  );

  for (const [shape, radii] of Object.entries(SHAPE_RADII)) {
    const tokens = Object.fromEntries(Object.entries(radii).map(([name, px]) => [`radius-${name}`, `${px}px`]));
    blocks.push(block(`[data-shape='${shape}']`, tokens));
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
  };
}

export function sameTheme(a: ThemeSettings, b: ThemeSettings): boolean {
  return (
    a.mode === b.mode &&
    a.accent === b.accent &&
    a.surface === b.surface &&
    a.shape === b.shape &&
    a.contrast === b.contrast
  );
}
