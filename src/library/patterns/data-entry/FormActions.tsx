import type { ReactNode } from 'react';

type FormActionsProps = {
  /** The buttons, least important first: Cancel, then the primary action. */
  children: ReactNode;
  /** A short status at the opposite end from the buttons, such as "Unsaved changes". */
  status?: ReactNode;
  /** Which end the buttons sit at. Dialogs and pages use `end`; short inline forms use `start`. */
  align?: 'start' | 'end';
  /** Pins the footer to the bottom of the nearest scrolling ancestor and draws a line above it. */
  sticky?: boolean;
  /** Accessible name for the group of buttons. */
  label?: string;
};

/**
 * The footer of a form: the actions at one end and an optional status at the other. With `sticky`
 * it stays in view while a long form scrolls underneath, so saving never needs a scroll.
 */
export function FormActions({
  children,
  status,
  align = 'end',
  sticky = false,
  label = 'Form actions',
}: FormActionsProps) {
  const buttons = (
    <div role="group" aria-label={label} className="flex shrink-0 items-center gap-2">
      {children}
    </div>
  );
  const note = status ? (
    <div aria-live="polite" className="min-w-0 text-sm text-muted-foreground">
      {status}
    </div>
  ) : null;

  return (
    <div
      data-sticky={sticky ? 'true' : undefined}
      className={`flex w-full items-center gap-4 ${align === 'end' ? 'justify-between' : 'justify-start'} ${
        sticky ? 'sticky bottom-0 border-t border-default bg-base-background py-3' : ''
      }`}
    >
      {align === 'end' ? (
        <>
          {note ?? <span />}
          {buttons}
        </>
      ) : (
        <>
          {buttons}
          {note}
        </>
      )}
    </div>
  );
}
