import type { ReactNode } from 'react';

export type BottomNavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  /** A small number on the icon: active alarms, tasks due. */
  count?: number;
};

type BottomNavProps = {
  /** Accessible name of the navigation. */
  label: string;
  /** Three to five destinations. More than five belongs in a menu. */
  items: readonly BottomNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

/**
 * Bottom navigation for a phone-width screen: three to five destinations as icon and label, in
 * equal columns within thumb reach. The current destination is marked with `aria-current` and a
 * heavier label as well as colour.
 */
export function BottomNav({ label, items, activeId, onSelect }: BottomNavProps) {
  return (
    <nav aria-label={label} data-slot="bottom-nav" className="w-full border-t border-default bg-base-background">
      <ul className="grid auto-cols-fr grid-flow-col">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className="flex min-w-0">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect(item.id)}
                className={`flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-xs outline-none transition-colors focus-visible:shadow-focus-ring ${
                  active ? 'font-medium text-base-foreground' : 'text-muted-foreground hover:text-base-foreground'
                }`}
              >
                <span className="relative flex [&>svg]:size-5">
                  {item.icon}
                  {item.count === undefined ? null : (
                    <span className="absolute -right-3 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-medium-background px-1 text-xs font-medium tabular-nums text-base-foreground">
                      <span className="sr-only">, </span>
                      {item.count}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
                <span
                  aria-hidden="true"
                  className={`h-0.5 w-6 rounded-full ${active ? 'bg-primary-background' : 'bg-transparent'}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
