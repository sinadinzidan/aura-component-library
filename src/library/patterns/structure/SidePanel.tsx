import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

type SidePanelProps = {
  /** Names the selected record. Also the accessible name of the panel. */
  title: string;
  /** A quiet second line: tag, identifier or type. */
  description?: ReactNode;
  /** Left of the title: an icon or avatar for the record. */
  leading?: ReactNode;
  /** On the title line, usually one status badge. */
  status?: ReactNode;
  /** Header icon buttons, before the close button: open in full page, pin, more. */
  actions?: ReactNode;
  /** Renders a close button when given. */
  onClose?: () => void;
  closeLabel?: string;
  /** A band under the header that does not scroll: tabs or a search field. */
  toolbar?: ReactNode;
  /** The scrolling body. */
  children: ReactNode;
  /** A footer that stays in view, for the actions of an editable panel. */
  footer?: ReactNode;
  /** `card` floats as its own surface; `edge` is a column docked to the right of the content. */
  frame?: 'card' | 'edge';
  /** Removes the body padding for flush lists and empty states. */
  flush?: boolean;
};

/**
 * A detail panel beside a list, tree or canvas: a header that names the selection, a body that
 * scrolls on its own and an optional footer that stays in view. Give it a height from its
 * container (`h-full` inside a sized column); the body takes what is left.
 */
export function SidePanel({
  title,
  description,
  leading,
  status,
  actions,
  onClose,
  closeLabel = 'Close panel',
  toolbar,
  children,
  footer,
  frame = 'card',
  flush = false,
}: SidePanelProps) {
  return (
    <aside
      data-slot="side-panel"
      aria-label={title}
      className={`flex h-full w-full min-w-0 flex-col overflow-hidden bg-base-background ${
        frame === 'card' ? 'rounded-xl border border-default' : 'border-l border-default'
      }`}
    >
      <header className={`flex items-start gap-3 p-4 ${toolbar ? 'pb-3' : 'border-b border-default'}`}>
        {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="min-w-0 truncate text-base font-semibold text-base-foreground">{title}</h2>
            {status}
          </div>
          {description ? <p className="truncate text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions || onClose ? (
          <div className="-my-1 -mr-1 flex shrink-0 items-center gap-1">
            {actions}
            {onClose ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label={closeLabel} onClick={onClose}>
                      <IconX />
                    </Button>
                  }
                />
                <TooltipContent>{closeLabel}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </header>
      {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      <div className={`min-h-0 flex-1 overflow-y-auto ${flush ? '' : 'p-4'}`}>{children}</div>
      {footer ? (
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-default p-4">{footer}</footer>
      ) : null}
    </aside>
  );
}
