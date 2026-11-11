import { VIEWER_SHORTCUTS, commandForKey } from './viewerKeymap';

describe('commandForKey', () => {
  it.each([
    ['o', { type: 'mode', mode: 'orbit' }],
    ['P', { type: 'mode', mode: 'pan' }],
    ['z', { type: 'mode', mode: 'zoom' }],
    ['f', { type: 'fit' }],
    ['h', { type: 'home' }],
    ['v', { type: 'tool', tool: 'select' }],
    ['m', { type: 'tool', tool: 'measure' }],
    ['n', { type: 'tool', tool: 'pin' }],
    ['x', { type: 'xray' }],
    ['s', { type: 'section' }],
    ['?', { type: 'help' }],
    ['Escape', { type: 'cancel' }],
    ['1', { type: 'preset', preset: 'top' }],
    ['4', { type: 'preset', preset: 'iso' }],
  ])('maps %s', (key, command) => {
    expect(commandForKey({ key })).toEqual(command);
  });

  it('ignores unknown keys and keys with modifiers', () => {
    expect(commandForKey({ key: 'q' })).toBeNull();
    expect(commandForKey({ key: 'z', ctrlKey: true })).toBeNull();
    expect(commandForKey({ key: 'f', metaKey: true })).toBeNull();
    expect(commandForKey({ key: 'h', altKey: true })).toBeNull();
  });

  it('documents every key it handles', () => {
    const documented = VIEWER_SHORTCUTS.flatMap((shortcut) => shortcut.keys).map((key) => (key === 'Esc' ? 'Escape' : key));
    for (const key of ['o', 'p', 'z', 'f', 'h', 'v', 'm', 'n', 'x', 's', '?', 'Escape', '1', '2', '3', '4']) {
      expect(documented).toContain(key.length === 1 ? key.toUpperCase() : key);
    }
  });
});
