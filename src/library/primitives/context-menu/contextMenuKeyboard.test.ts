import { isContextMenuKey, keyboardAnchorPoint } from './contextMenuKeyboard';

describe(isContextMenuKey.name, () => {
  it('accepts the context-menu key', () => {
    expect(isContextMenuKey({ key: 'ContextMenu', shiftKey: false })).toBe(true);
  });

  it('accepts Shift+F10', () => {
    expect(isContextMenuKey({ key: 'F10', shiftKey: true })).toBe(true);
  });

  it('rejects F10 alone and other keys', () => {
    expect(isContextMenuKey({ key: 'F10', shiftKey: false })).toBe(false);
    expect(isContextMenuKey({ key: 'Enter', shiftKey: true })).toBe(false);
  });
});

describe(keyboardAnchorPoint.name, () => {
  it('anchors just inside the bottom-left of a large element', () => {
    expect(keyboardAnchorPoint({ left: 100, top: 50, width: 300, height: 200 })).toEqual({ x: 112, y: 238 });
  });

  it('anchors at the middle of an element smaller than the inset', () => {
    expect(keyboardAnchorPoint({ left: 10, top: 10, width: 16, height: 16 })).toEqual({ x: 18, y: 18 });
  });

  it('never leaves the element', () => {
    const point = keyboardAnchorPoint({ left: 0, top: 0, width: 4, height: 4 }, 40);

    expect(point.x).toBeLessThanOrEqual(4);
    expect(point.y).toBeLessThanOrEqual(4);
  });
});
