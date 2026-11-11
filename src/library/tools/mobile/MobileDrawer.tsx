import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export type DrawerItem = { id: string; label: string; icon: ReactNode; detail?: string };

export type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Name of the drawer for assistive technology: "Main menu". */
  label: string;
  /** Who or what the menu is for: a site, a user. */
  header: ReactNode;
  items: readonly DrawerItem[];
  activeId?: string;
  onSelect: (id: string) => void;
};

/**
 * A side menu that slides over the screen from the left. Place it inside the relatively
 * positioned area it should cover. It closes with the scrim, Escape or after a choice, and moves
 * focus to itself on open.
 */
export function MobileDrawer({ open, onClose, label, header, items, activeId, onSelect }: MobileDrawerProps) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div data-slot="mobile-drawer" className="absolute inset-0 z-30 flex" onKeyDown={onKeyDown}>
      <nav ref={panel} tabIndex={-1} aria-label={label} className="flex h-full w-4/5 max-w-72 flex-col gap-2 bg-base-background py-3 outline-none">
        <div className="px-4 pb-2">{header}</div>
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-current={item.id === activeId ? 'page' : undefined}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className={`flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm outline-none focus-visible:shadow-focus-ring ${item.id === activeId ? 'bg-medium-background font-medium text-base-foreground' : 'text-medium-foreground hover:bg-muted-background'}`}
              >
                <span className="flex shrink-0 [&>svg]:size-5">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.detail ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{item.detail}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button type="button" aria-label="Close menu" tabIndex={-1} onClick={onClose} className="flex-1 cursor-default bg-overlay-background" />
    </div>
  );
}
