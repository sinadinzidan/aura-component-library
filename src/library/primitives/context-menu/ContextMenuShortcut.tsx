import { Kbd } from '@cognite/aura/components/kbd';

export type ContextMenuShortcutProps = {
  /** The keys as the user reads them, such as "⌘C" or "Del". */
  children: string;
};

/** The keyboard shortcut of an item, right-aligned. Show it only when the shortcut really works. */
export function ContextMenuShortcut({ children }: ContextMenuShortcutProps) {
  return (
    <span data-slot="context-menu-shortcut" className="ml-auto flex shrink-0 items-center gap-1 pl-4">
      <Kbd>{children}</Kbd>
    </span>
  );
}
