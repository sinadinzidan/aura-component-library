import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type AssistantPanelProps = {
  /** Name of the assistant or of the conversation. Also the accessible name of the panel. */
  title: string;
  /** What the assistant can see: "Reading 23-KA-9101 and its alarms". */
  context?: ReactNode;
  /** Leading mark in the header, usually an icon. */
  icon?: ReactNode;
  /** Icon buttons at the end of the header: new conversation, close. */
  actions?: ReactNode;
  /** The thread. It gets the remaining height, so the panel needs a height from its parent. */
  children: ReactNode;
  /** The prompt input, pinned to the bottom. */
  footer?: ReactNode;
  /** `docked` sits flush against a view with a rule on its left; `floating` is a bordered card. */
  variant?: 'docked' | 'floating';
  className?: string;
};

/**
 * The frame of an assistant: a header that says what the assistant is looking at, the thread in
 * the middle and the prompt pinned to the bottom. Docks beside a data view or floats as a card.
 */
export function AssistantPanel({ title, context, icon, actions, children, footer, variant = 'docked', className }: AssistantPanelProps) {
  return (
    <aside
      aria-label={title}
      data-slot="assistant-panel"
      data-variant={variant}
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-col bg-base-background',
        variant === 'docked' ? 'border-l border-default' : 'overflow-hidden rounded-xl border border-default',
        className
      )}
    >
      <header className="flex items-center gap-3 border-b border-default px-4 py-3">
        {icon ? (
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-background text-base-foreground [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-sm font-semibold text-base-foreground">{title}</h3>
          {context ? <p className="truncate text-xs text-muted-foreground">{context}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </header>
      <div data-slot="assistant-panel-body" className="flex min-h-0 flex-1 flex-col px-3 py-3">
        {children}
      </div>
      {footer ? (
        <footer data-slot="assistant-panel-footer" className="px-3 pb-3">
          {footer}
        </footer>
      ) : null}
    </aside>
  );
}
