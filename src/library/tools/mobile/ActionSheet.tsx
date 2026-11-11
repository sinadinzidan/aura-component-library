import { Button } from '@cognite/aura/components/button';
import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export type ActionSheetItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Draws the action as destructive. Say what is lost in the label: "Delete draft". */
  destructive?: boolean;
  onSelect: () => void;
};

export type ActionSheetProps = {
  open: boolean;
  onClose: () => void;
  /** What the actions apply to: "WO-104482". Also the accessible name. */
  title: string;
  actions: readonly ActionSheetItem[];
};

/**
 * A short list of actions for one item, rising from the bottom of the screen above a scrim, with a
 * Cancel that is always last. Place it inside the relatively positioned area it should cover.
 */
export function ActionSheet({ open, onClose, title, actions }: ActionSheetProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div data-slot="action-sheet" className="absolute inset-0 z-30 flex flex-col justify-end" onKeyDown={onKeyDown}>
      <button type="button" aria-label="Close actions" tabIndex={-1} onClick={onClose} className="min-h-0 flex-1 cursor-default bg-overlay-background" />
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="flex flex-col gap-2 rounded-t-2xl bg-base-background p-3 outline-none">
        <p className="px-1 pb-1 text-center text-xs text-muted-foreground">{title}</p>
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.destructive ? 'destructive' : 'secondary'}
            size="lg"
            className="w-full"
            onClick={() => {
              action.onSelect();
              onClose();
            }}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
