import { SCENE_TOKENS } from './scenePalette';
import type { ScenePalette } from './scenePalette';
import { resolveTokenColors } from './tokenColors';

/** A palette for tests: every token resolves to the same mid grey. Not for product code. */
export function makeTestPalette(): ScenePalette {
  const palette = resolveTokenColors(SCENE_TOKENS, () => 'rgb(128, 128, 128)');
  if (!palette) throw new Error('Test palette failed to resolve.');
  return palette;
}
