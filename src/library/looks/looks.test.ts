import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_LOOK, isLook, LOOK_DEFINITIONS, LOOK_LABELS, LOOKS, parseLook } from './looks';

const CSS = fs.readFileSync(path.resolve('src/library/looks/looks.css'), 'utf8');
const AURA_COLORS = fs.readFileSync(path.resolve('node_modules/@cognite/aura/dist/colors.css'), 'utf8');
const WITHOUT_COMMENTS = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

describe('looks', () => {
  it('ships at least eight looks with studio as the default', () => {
    expect(LOOKS.length).toBeGreaterThanOrEqual(8);
    expect(DEFAULT_LOOK).toBe('studio');
  });

  it.each(LOOKS)('%s has a definition, a label and a one-line description', (look) => {
    const definition = LOOK_DEFINITIONS[look];

    expect(definition.id).toBe(look);
    expect(definition.label).toBe(LOOK_LABELS[look]);
    expect(definition.description.length).toBeGreaterThan(30);
    expect(definition.description).not.toMatch(/\n/);
  });

  it('gives every look its own chart style', () => {
    const styles = LOOKS.map((look) => JSON.stringify(LOOK_DEFINITIONS[look].chart));

    expect(new Set(styles).size).toBe(LOOKS.length);
  });

  it('never recommends a monospace typeface', () => {
    for (const look of LOOKS) expect(['inter', 'grotesk', 'manrope', 'plex', 'sora']).toContain(LOOK_DEFINITIONS[look].typeface);
  });
});

describe(parseLook.name, () => {
  it('keeps a known look', () => {
    expect(parseLook('console')).toBe('console');
  });

  it('falls back to the default for anything else', () => {
    expect(parseLook('brutal')).toBe(DEFAULT_LOOK);
    expect(parseLook(undefined)).toBe(DEFAULT_LOOK);
    expect(isLook(7)).toBe(false);
  });
});

describe('looks.css', () => {
  it('contains no raw colour values', () => {
    expect(WITHOUT_COMMENTS).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(/);
  });

  it('only references ramp steps that exist in Aura', () => {
    const references = new Set(WITHOUT_COMMENTS.match(/var\(--(?:mountain|fjord|sky|nordic|aurora|dusk|amber|pink|red|orange|green|blue|yellow)-(?:\d+|white|black)\)/g) ?? []);

    expect(references.size).toBeGreaterThan(20);
    for (const reference of references) {
      const name = reference.slice(4, -1);
      expect(AURA_COLORS, name).toContain(`${name}:`);
    }
  });

  it.each(LOOKS)('styles the %s look', (look) => {
    expect(CSS).toContain(`[data-look='${look}']`);
  });

  it('uses no monospace font and no text under 12px', () => {
    expect(WITHOUT_COMMENTS).not.toMatch(/monospace|font-mono|Source Code/);
    const sizes = [...WITHOUT_COMMENTS.matchAll(/font-size:\s*([\d.]+)rem/g)].map((match) => Number(match[1]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(0.75);
  });
});
