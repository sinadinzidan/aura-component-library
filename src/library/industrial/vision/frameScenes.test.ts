import { SYMBOLS } from '../diagrams/symbolPaths';

import { FRAME_HEIGHT, FRAME_SCENES, FRAME_WIDTH, findScene } from './frameScenes';

describe('FRAME_SCENES', () => {
  it('has unique ids and uses only real symbols', () => {
    expect(new Set(FRAME_SCENES.map((scene) => scene.id)).size).toBe(FRAME_SCENES.length);
    for (const scene of FRAME_SCENES) for (const item of scene.items) expect(SYMBOLS[item.kind]).toBeDefined();
  });

  it('keeps every item inside the frame', () => {
    for (const scene of FRAME_SCENES) {
      for (const item of scene.items) {
        expect(item.x - item.size / 2).toBeGreaterThanOrEqual(0);
        expect(item.x + item.size / 2).toBeLessThanOrEqual(FRAME_WIDTH);
        expect(item.y - item.size / 2).toBeGreaterThanOrEqual(0);
        expect(item.y + item.size / 2).toBeLessThanOrEqual(FRAME_HEIGHT);
      }
    }
  });

  it('puts the horizon inside the frame', () => {
    for (const scene of FRAME_SCENES) expect(scene.horizon).toBeGreaterThan(0);
  });

  it('falls back to the first scene for an unknown id', () => {
    expect(findScene('pump-bay').id).toBe('pump-bay');
    expect(findScene('nope').id).toBe(FRAME_SCENES[0].id);
  });
});
