/**
 * Looks: design languages that change the structure of a screen, not only its colour. A look owns
 * canvas, panel, KPI, status, table, chart and control anatomy; the colour theme (mode, accent,
 * shape, density, typeface) still applies on top. Kit components in `src/library/kit` read the
 * active look from `LookScope` and style themselves through `looks.css`.
 */

export const LOOKS = ['studio', 'console', 'poster', 'glass', 'editorial', 'soft', 'blueprint', 'signal'] as const;
export type LookId = (typeof LOOKS)[number];

export const DEFAULT_LOOK: LookId = 'studio';

/** How a look draws plotted data. Read by the kit charts; everything else is CSS. */
export type ChartStyle = {
  /** Fill under a trend line. */
  area: 'gradient' | 'solid' | 'none';
  strokeWidth: number;
  curve: 'monotone' | 'linear' | 'stepAfter';
  grid: 'horizontal' | 'both' | 'none';
  /** A marker on every point, for drawing-style charts. */
  points: boolean;
  /** Corner radius of bars in px. */
  barRadius: number;
  /** Share of the band a bar fills, 0–1. */
  barFill: number;
  /** Ring thickness of donuts and ring gauges, as a share of the radius. */
  ring: number;
  axisLine: boolean;
};

export type LookDefinition = {
  id: LookId;
  label: string;
  /** One line for menus and galleries. */
  description: string;
  /** `dark` looks force dark inside their scope; `any` follows the surrounding mode. */
  mode: 'any' | 'dark';
  /** Accent and typeface the look was drawn with. A scope applies them unless told to inherit. */
  accent: 'mountain' | 'fjord' | 'sky' | 'nordic' | 'aurora' | 'dusk' | 'amber' | 'pink';
  typeface: 'inter' | 'grotesk' | 'manrope' | 'plex' | 'sora';
  /** The page chrome the look is usually paired with in `AppFrame`. */
  chrome: 'sidebar' | 'topbar' | 'rail' | 'masthead' | 'none';
  chart: ChartStyle;
};

export const LOOK_DEFINITIONS: Record<LookId, LookDefinition> = {
  studio: {
    id: 'studio',
    label: 'Studio',
    description: 'Product-grade default: tinted canvas, elevated white cards, coloured icon chips, gradient charts.',
    mode: 'any',
    accent: 'fjord',
    typeface: 'inter',
    chrome: 'sidebar',
    chart: { area: 'gradient', strokeWidth: 2.25, curve: 'monotone', grid: 'horizontal', points: false, barRadius: 5, barFill: 0.62, ring: 0.2, axisLine: false },
  },
  console: {
    id: 'console',
    label: 'Console',
    description: 'Operator HMI: dark edge-to-edge panels on hairlines, title strips, status blocks, dense tables.',
    mode: 'dark',
    accent: 'nordic',
    typeface: 'plex',
    chrome: 'topbar',
    chart: { area: 'none', strokeWidth: 1.75, curve: 'linear', grid: 'both', points: false, barRadius: 0, barFill: 0.72, ring: 0.26, axisLine: true },
  },
  poster: {
    id: 'poster',
    label: 'Poster',
    description: 'Bold blocks: solid colour tiles, huge numerals, thick borders, bar-heavy charts, almost no grey.',
    mode: 'any',
    accent: 'mountain',
    typeface: 'sora',
    chrome: 'masthead',
    chart: { area: 'solid', strokeWidth: 3, curve: 'linear', grid: 'none', points: false, barRadius: 0, barFill: 0.82, ring: 0.42, axisLine: true },
  },
  glass: {
    id: 'glass',
    label: 'Glass',
    description: 'Dark gradient backdrop, translucent blurred panels with light borders, glowing lines and ring gauges.',
    mode: 'dark',
    accent: 'sky',
    typeface: 'manrope',
    chrome: 'rail',
    chart: { area: 'gradient', strokeWidth: 2.5, curve: 'monotone', grid: 'none', points: false, barRadius: 6, barFill: 0.5, ring: 0.14, axisLine: false },
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    description: 'Report style: no cards, typographic columns between rules, very large figures, annotated charts.',
    mode: 'any',
    accent: 'mountain',
    typeface: 'grotesk',
    chrome: 'masthead',
    chart: { area: 'none', strokeWidth: 1.75, curve: 'monotone', grid: 'none', points: false, barRadius: 0, barFill: 0.56, ring: 0.1, axisLine: true },
  },
  soft: {
    id: 'soft',
    label: 'Soft',
    description: 'Friendly: large radii, pastel cards in decorative families, pills, donuts and progress visuals.',
    mode: 'any',
    accent: 'dusk',
    typeface: 'manrope',
    chrome: 'topbar',
    chart: { area: 'gradient', strokeWidth: 3.5, curve: 'monotone', grid: 'none', points: false, barRadius: 999, barFill: 0.5, ring: 0.3, axisLine: false },
  },
  blueprint: {
    id: 'blueprint',
    label: 'Blueprint',
    description: 'Engineering drawing: outlined panels with corner ticks and title blocks on grid paper, line-only charts.',
    mode: 'any',
    accent: 'fjord',
    typeface: 'plex',
    chrome: 'topbar',
    chart: { area: 'none', strokeWidth: 1.5, curve: 'linear', grid: 'both', points: true, barRadius: 0, barFill: 0.5, ring: 0.06, axisLine: true },
  },
  signal: {
    id: 'signal',
    label: 'Signal',
    description: 'Status first: every tile is filled with its state, giant state words and icons, built for wall screens.',
    mode: 'dark',
    accent: 'mountain',
    typeface: 'inter',
    chrome: 'none',
    chart: { area: 'solid', strokeWidth: 3, curve: 'monotone', grid: 'none', points: false, barRadius: 2, barFill: 0.78, ring: 0.34, axisLine: false },
  },
};

export const LOOK_LABELS: Record<LookId, string> = {
  studio: 'Studio',
  console: 'Console',
  poster: 'Poster',
  glass: 'Glass',
  editorial: 'Editorial',
  soft: 'Soft',
  blueprint: 'Blueprint',
  signal: 'Signal',
};

export function isLook(value: unknown): value is LookId {
  return typeof value === 'string' && LOOKS.some((look) => look === value);
}

/** Reads a look from untrusted input, falling back to the default. */
export function parseLook(value: unknown): LookId {
  return isLook(value) ? value : DEFAULT_LOOK;
}
