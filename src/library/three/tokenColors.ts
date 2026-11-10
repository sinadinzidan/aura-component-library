/** A resolved token: an opaque colour string three.js understands, plus the token's own alpha. */
export type TokenColor = {
  /** `rgb(r, g, b)` with 0–255 channels. Safe to pass to `THREE.Color` and material `color` props. */
  color: string;
  /** 0–1. Aura's chart tokens carry alpha; give it to the material's `opacity` with `transparent`. */
  opacity: number;
};

/** Token names without the leading `--`, keyed by the role they play in the scene. */
export type TokenMap = Record<string, string>;

export type TokenColors<T extends TokenMap> = { [K in keyof T]: TokenColor };

const clampByte = (value: number): number => Math.min(255, Math.max(0, Math.round(value)));
const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

function parseAlpha(text: string | undefined): number {
  if (text === undefined) return 1;
  const value = Number.parseFloat(text);
  if (!Number.isFinite(value)) return 1;
  return clampUnit(text.trim().endsWith('%') ? value / 100 : value);
}

function parseChannel(text: string, scale: number): number | null {
  const value = Number.parseFloat(text);
  if (!Number.isFinite(value)) return null;
  return text.trim().endsWith('%') ? (value / 100) * 255 : value * scale;
}

/**
 * Splits a computed CSS colour into an opaque colour and an opacity. Understands what browsers
 * return from `getComputedStyle`: `rgb()` / `rgba()` (comma or space separated) and
 * `color(srgb r g b / a)`. Returns `null` for anything else.
 */
export function parseCssColor(value: string): TokenColor | null {
  const text = value.trim().toLowerCase();
  const match = /^(rgba?|color)\(([^)]*)\)$/.exec(text);
  if (!match) return null;

  const isColorFunction = match[1] === 'color';
  const [channelText, alphaText] = match[2].split('/');
  const parts = channelText.split(/[\s,]+/).filter((part) => part !== '');
  if (isColorFunction) {
    if (parts.shift() !== 'srgb') return null;
  }
  if (parts.length < 3) return null;

  const scale = isColorFunction ? 255 : 1;
  const channels = parts.slice(0, 3).map((part) => parseChannel(part, scale));
  const [red, green, blue] = channels;
  if (red === null || green === null || blue === null) return null;

  const opacity = parseAlpha(alphaText ?? parts[3]);
  return { color: `rgb(${clampByte(red)}, ${clampByte(green)}, ${clampByte(blue)})`, opacity };
}

/**
 * Resolves every token in a map with `read`, which returns the computed colour of one token.
 * Returns `null` when any token cannot be read, so callers render nothing rather than a wrong colour.
 */
export function resolveTokenColors<T extends TokenMap>(tokens: T, read: (token: string) => string): TokenColors<T> | null {
  const entries: [string, TokenColor][] = [];
  for (const [key, token] of Object.entries(tokens)) {
    const parsed = parseCssColor(read(token));
    if (!parsed) return null;
    entries.push([key, parsed]);
  }
  const resolved: Record<string, TokenColor> = Object.fromEntries(entries);
  return hasAllKeys(resolved, tokens) ? resolved : null;
}

function hasAllKeys<T extends TokenMap>(value: Record<string, TokenColor>, tokens: T): value is TokenColors<T> {
  return Object.keys(tokens).every((key) => key in value);
}

/** Whether two resolved maps are the same, so a re-read that changed nothing does not re-render. */
export function sameTokenColors(a: Record<string, TokenColor> | null, b: Record<string, TokenColor> | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => b[key] !== undefined && a[key].color === b[key].color && a[key].opacity === b[key].opacity);
}
