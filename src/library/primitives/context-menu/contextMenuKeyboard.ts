/** The part of a keyboard event the context-menu shortcut check needs. */
export type ContextMenuKey = { key: string; shiftKey: boolean };

/** True for the keys that open a context menu: the context-menu key and Shift+F10. */
export function isContextMenuKey(event: ContextMenuKey): boolean {
  return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
}

/** The part of a bounding box the anchor calculation needs. */
export type AnchorBox = { left: number; top: number; width: number; height: number };

/**
 * Where a keyboard-opened menu appears: just inside the focused element, near its top-left
 * corner, so the menu visibly belongs to it without covering its label.
 */
export function keyboardAnchorPoint(box: AnchorBox, inset = 12): { x: number; y: number } {
  return {
    x: Math.round(box.left + Math.min(inset, box.width / 2)),
    y: Math.round(box.top + Math.min(box.height, Math.max(box.height / 2, box.height - inset))),
  };
}
