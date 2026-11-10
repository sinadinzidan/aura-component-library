import fs from 'node:fs';
import path from 'node:path';

import {
  ACCENTS,
  accentTokens,
  buildThemeCss,
  deepSurfaceTokens,
  DEFAULT_THEME,
  highContrastTokens,
  MODES,
  parseThemeSettings,
  sameTheme,
  THEME_PRESETS,
  themeAttributes,
  tintedSurfaceTokens,
  type Accent,
  type Mode,
} from './themes';

const CSS_FILE = path.resolve('src/library/themes/themes.css');
const AURA_COLORS = fs.readFileSync(path.resolve('node_modules/@cognite/aura/dist/colors.css'), 'utf8');

/** Aura's own default mapping for the tokens a theme does not override, per mode. */
const AURA_DEFAULTS: Record<Mode, Record<string, string>> = {
  light: {
    'base-background': 'var(--mountain-white)',
    'muted-background': 'var(--mountain-10)',
    'secondary-background': 'var(--mountain-100)',
    'secondary-foreground': 'var(--mountain-700)',
    'muted-foreground': 'var(--mountain-550)',
    'base-foreground': 'var(--mountain-950)',
  },
  dark: {
    'base-background': 'var(--mountain-950)',
    'muted-background': 'var(--mountain-900)',
    'secondary-background': 'var(--mountain-700)',
    'secondary-foreground': 'var(--mountain-200)',
    'muted-foreground': 'var(--mountain-400)',
    'base-foreground': 'var(--mountain-10)',
  },
};

function rampColor(reference: string): [number, number, number] {
  const name = /var\(--([\w-]+)\)/.exec(reference)?.[1];
  const match = name ? new RegExp(`--${name}:\\s*rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)`).exec(AURA_COLORS) : null;
  if (!match) throw new Error(`${reference} is not a ramp step in Aura's colors.css`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function luminance([red, green, blue]: [number, number, number]): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(rampColor(foreground)), luminance(rampColor(background))].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const COLOURED_ACCENTS = ACCENTS.filter((accent): accent is Exclude<Accent, 'mountain'> => accent !== 'mountain');
const CASES = COLOURED_ACCENTS.flatMap((accent) => MODES.map((mode) => ({ accent, mode })));

describe('theme stylesheet', () => {
  it('matches what themes.ts generates (run with UPDATE_THEMES=1 to regenerate)', () => {
    const generated = buildThemeCss();
    if (process.env.UPDATE_THEMES) fs.writeFileSync(CSS_FILE, generated);

    expect(fs.readFileSync(CSS_FILE, 'utf8')).toBe(generated);
  });

  it('contains no raw colour values', () => {
    expect(buildThemeCss()).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });

  it('only references ramp steps that exist in Aura', () => {
    const references = buildThemeCss().match(/var\(--[a-z]+-(?:\d+|white)\)/g) ?? [];

    expect(references.length).toBeGreaterThan(0);
    for (const reference of new Set(references)) expect(() => rampColor(reference)).not.toThrow();
  });
});

describe.each(CASES)('$accent accent, $mode', ({ accent, mode }) => {
  const tokens = { ...AURA_DEFAULTS[mode], ...accentTokens(accent, mode) };
  const tinted = { ...tokens, ...tintedSurfaceTokens(accent, mode) };

  it('keeps primary button text readable (AA)', () => {
    expect(contrast(tokens['primary-foreground'], tokens['primary-background'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens['primary-foreground'], tokens['primary-background-hover'])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps links readable on the page and on tinted surfaces (AA)', () => {
    expect(contrast(tokens['link-foreground'], tokens['base-background'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tinted['link-foreground'], tinted['muted-background'])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps text readable on tinted surfaces (AA)', () => {
    expect(contrast(tinted['secondary-foreground'], tinted['secondary-background'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tinted['secondary-foreground'], tinted['secondary-background-hover'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tinted['base-foreground'], tinted['card-background'])).toBeGreaterThanOrEqual(7);
    expect(contrast(tinted['muted-foreground'], tinted['muted-background'])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the focus ring visible against the page (3:1)', () => {
    expect(contrast(tokens['ring-default'], tokens['base-background'])).toBeGreaterThanOrEqual(3);
  });
});

describe.each(ACCENTS)('deep surface, %s accent', (accent) => {
  const tokens = { ...AURA_DEFAULTS.dark, ...(accent === 'mountain' ? {} : accentTokens(accent, 'dark')), ...deepSurfaceTokens(accent) };

  it('keeps text readable on the page and on panels', () => {
    expect(contrast(tokens['base-foreground'], tokens['base-background'])).toBeGreaterThanOrEqual(7);
    expect(contrast(tokens['base-foreground'], tokens['card-background'])).toBeGreaterThanOrEqual(7);
    expect(contrast(tokens['muted-foreground'], tokens['card-background'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens['secondary-foreground'], tokens['secondary-background'])).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(MODES)('high contrast, %s', (mode) => {
  const tokens = { ...AURA_DEFAULTS[mode], ...highContrastTokens(mode) };

  it('raises secondary text to AAA', () => {
    expect(contrast(tokens['muted-foreground'], tokens['base-background'])).toBeGreaterThanOrEqual(7);
    expect(contrast(tokens['medium-foreground'], tokens['base-background'])).toBeGreaterThanOrEqual(7);
  });

  it('makes borders visible against the page (3:1 for the emphasized stroke)', () => {
    expect(contrast(tokens.emphasized, tokens['base-background'])).toBeGreaterThanOrEqual(3);
  });
});

describe(parseThemeSettings.name, () => {
  it('returns the default theme for non-objects', () => {
    expect(parseThemeSettings(null)).toEqual(DEFAULT_THEME);
    expect(parseThemeSettings('fjord')).toEqual(DEFAULT_THEME);
  });

  it('keeps valid fields and defaults invalid ones', () => {
    expect(parseThemeSettings({ mode: 'dark', accent: 'nordic', shape: 'round', contrast: 'high' })).toEqual({
      mode: 'dark',
      accent: 'nordic',
      surface: 'neutral',
      shape: 'default',
      contrast: 'high',
      density: 'default',
      typeface: 'inter',
    });
  });
});

describe(themeAttributes.name, () => {
  it('maps settings to root data attributes', () => {
    expect(
      themeAttributes({
        mode: 'dark',
        accent: 'dusk',
        surface: 'tinted',
        shape: 'soft',
        contrast: 'high',
        density: 'compact',
        typeface: 'technical',
      })
    ).toEqual({
      'data-accent': 'dusk',
      'data-surface': 'tinted',
      'data-shape': 'soft',
      'data-contrast': 'high',
      'data-density': 'compact',
      'data-typeface': 'technical',
    });
  });
});

describe('presets', () => {
  it('have unique ids and distinct settings', () => {
    expect(new Set(THEME_PRESETS.map((preset) => preset.id)).size).toBe(THEME_PRESETS.length);
    for (const [index, preset] of THEME_PRESETS.entries()) {
      for (const other of THEME_PRESETS.slice(index + 1)) {
        expect(sameTheme(preset.settings, other.settings), `${preset.id} equals ${other.id}`).toBe(false);
      }
    }
  });

  it('round-trip through parseThemeSettings', () => {
    for (const preset of THEME_PRESETS) expect(parseThemeSettings(preset.settings)).toEqual(preset.settings);
  });
});
