import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconX } from '@cognite/aura/icons';
import { useId } from 'react';
import type { ReactNode } from 'react';

type PanelFrameProps = {
  title: string;
  /** One line under the title. */
  description?: ReactNode;
  /** Extra header content under the title row, such as a step indicator. */
  headerExtra?: ReactNode;
  children: ReactNode;
  /** The action row. Usually a `FormActions`. */
  footer?: ReactNode;
  /** Adds a close button to the header. */
  onClose?: () => void;
  closeLabel?: string;
};

/**
 * A static frame with the anatomy of a dialog or side panel: title and close button, a body and
 * an action footer. Use it to lay out the content of an overlay in a page, a preview or a test
 * without opening one; in an app the same content goes inside `Dialog`.
 */
export function PanelFrame({
  title,
  description,
  headerExtra,
  children,
  footer,
  onClose,
  closeLabel = 'Close',
}: PanelFrameProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="flex w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background"
    >
      <header className="flex flex-col gap-4 p-4 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 id={titleId} className="text-base font-semibold text-base-foreground">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
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
        {headerExtra}
      </header>
      <div className="p-4">{children}</div>
      {footer ? <footer className="border-t border-default px-4 py-3">{footer}</footer> : null}
    </section>
  );
}
