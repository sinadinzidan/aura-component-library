import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { cn } from '@cognite/aura/utils';
import type { KeyboardEvent } from 'react';

import { isContextMenuKey, keyboardAnchorPoint } from './contextMenuKeyboard';

export type ContextMenuTriggerProps = ContextMenuPrimitive.Trigger.Props & {
  /**
   * Makes the area itself a tab stop with a focus ring. Set it when the area holds no focusable
   * element of its own (a canvas, a chart point, a plain card), so the keyboard can reach it.
   */
  focusable?: boolean;
};

function isElement(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement;
}

/**
 * The area the menu belongs to. Right-click and long press open the menu at the pointer;
 * Shift+F10 and the context-menu key open it at the focused element inside the area.
 */
export function ContextMenuTrigger({ focusable = false, className, onKeyDown, ...props }: ContextMenuTriggerProps) {
  const openFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isContextMenuKey(event) || !isElement(event.target)) return;
    event.preventDefault();
    const point = keyboardAnchorPoint(event.target.getBoundingClientRect());
    event.target.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: point.x, clientY: point.y })
    );
  };

  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      tabIndex={focusable ? 0 : undefined}
      className={
        focusable && typeof className !== 'function'
          ? cn('outline-none focus-visible:shadow-focus-ring', className)
          : className
      }
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) openFromKeyboard(event);
      }}
      {...props}
    />
  );
}
