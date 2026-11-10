import { setSceneCursor } from './sceneCursor';

describe(setSceneCursor.name, () => {
  it('sets and resets the cursor of the canvas', () => {
    const canvas = document.createElement('canvas');

    setSceneCursor(canvas, 'pointer');
    expect(canvas.style.cursor).toBe('pointer');

    setSceneCursor(canvas, '');
    expect(canvas.style.cursor).toBe('');
  });
});
