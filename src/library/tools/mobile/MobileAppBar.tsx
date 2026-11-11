import { IconChevronLeft } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { IconAction } from '../../patterns/collections/IconAction';

export type AppBarAction = {
  id: string;
  /** What it does, with its object: "Search assets". Name and tooltip. */
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

export type MobileAppBarProps = {
  title: string;
  /** Shows a back button. The label names where it goes: "Back to Work orders". */
  backLabel?: string;
  onBack?: () => void;
  /** Replaces the back button, for example a menu button on a root screen. */
  leading?: ReactNode;
  /** Up to two icon actions on the right. */
  actions?: readonly AppBarAction[];
  /** Small text under the title: a tag, a count. */
  subtitle?: string;
};

/**
 * The top bar of a phone screen: a back button or a leading control, the screen title, and up to
 * two icon actions. The title is centred and truncates; every icon has a name and a tooltip.
 */
export function MobileAppBar({ title, backLabel, onBack, leading, actions = [], subtitle }: MobileAppBarProps) {
  return (
    <header data-slot="mobile-app-bar" className="grid min-h-12 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-1 px-1">
      <div className="flex items-center justify-start">
        {onBack ? (
          <IconAction label={backLabel ?? 'Back'} size="icon" onClick={onBack}>
            <IconChevronLeft />
          </IconAction>
        ) : (
          leading
        )}
      </div>
      <div className="min-w-0 text-center">
        <h2 className="truncate text-sm font-semibold text-base-foreground">{title}</h2>
        {subtitle ? <p className="truncate font-mono text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex min-w-12 items-center justify-end">
        {actions.slice(0, 2).map((action) => (
          <IconAction key={action.id} label={action.label} size="icon" onClick={action.onClick}>
            {action.icon}
          </IconAction>
        ))}
      </div>
    </header>
  );
}
