import { Button } from '@cognite/aura/components/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@cognite/aura/components/command';
import { Kbd, KbdGroup } from '@cognite/aura/components/kbd';
import { IconSearch } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type CommandPaletteItem = {
  id: string;
  /** Action-oriented label: "Create work order", "Go to alarms". */
  label: string;
  icon?: ReactNode;
  /** Shortcut hint shown at the end of the row, for example "G A". */
  shortcut?: string;
  /** Extra words the search should match. */
  keywords?: string[];
  disabled?: boolean;
  onSelect: () => void;
};

export type CommandPaletteGroup = {
  id: string;
  heading: string;
  items: readonly CommandPaletteItem[];
};

type HotkeyTarget = Pick<Document, 'addEventListener' | 'removeEventListener'>;

type CommandPaletteProps = {
  groups: readonly CommandPaletteGroup[];
  /** Text on the button that opens the palette. */
  triggerLabel?: string;
  /** `sm` for a topbar or toolbar, `default` elsewhere. */
  triggerSize?: 'default' | 'sm';
  placeholder?: string;
  emptyMessage?: string;
  /** Accessible title of the dialog. */
  title?: string;
  /** Letter that opens the palette together with ⌘ or Ctrl. Leave out for no global shortcut. */
  hotkey?: string;
  /** Where the shortcut listens. Defaults to the document; inject a stub in tests. */
  hotkeyTarget?: HotkeyTarget;
};

/**
 * A command palette with its trigger: a search-shaped button that shows the shortcut, the ⌘K /
 * Ctrl+K listener, and a dialog that closes itself after a command runs.
 */
export function CommandPalette({
  groups,
  triggerLabel = 'Search or run a command',
  triggerSize = 'default',
  placeholder = 'Type a command or search',
  emptyMessage = 'No matching commands.',
  title = 'Command palette',
  hotkey,
  hotkeyTarget,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hotkey) return undefined;
    const target = hotkeyTarget ?? document;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== hotkey.toLowerCase() || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setOpen((current) => !current);
    };
    target.addEventListener('keydown', onKeyDown);
    return () => target.removeEventListener('keydown', onKeyDown);
  }, [hotkey, hotkeyTarget]);

  const run = (item: CommandPaletteItem) => {
    setOpen(false);
    item.onSelect();
  };

  return (
    <>
      <Button variant="outline" size={triggerSize} className="w-full justify-start" onClick={() => setOpen(true)}>
        <IconSearch />
        <span className="min-w-0 flex-1 truncate text-left">{triggerLabel}</span>
        {hotkey ? (
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>{hotkey.toUpperCase()}</Kbd>
          </KbdGroup>
        ) : null}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={title} description={placeholder}>
        <CommandInput placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.id} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  keywords={item.keywords}
                  disabled={item.disabled}
                  onSelect={() => run(item)}
                >
                  {item.icon}
                  {item.label}
                  {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
