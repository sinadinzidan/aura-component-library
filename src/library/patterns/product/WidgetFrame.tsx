import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@cognite/aura/components/dropdown-menu';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconAlertTriangle, IconDots } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type WidgetStatus = 'ready' | 'loading' | 'empty' | 'error';

export type WidgetAction = {
  id: string;
  label: string;
  onSelect: () => void;
  /** Marks an irreversible action. Keep it last. */
  destructive?: boolean;
};

export type WidgetMessage = {
  title: string;
  description?: string;
  /** One action that moves things forward, usually a small Button. */
  action?: ReactNode;
};

export type WidgetFrameProps = {
  title: string;
  /** One quiet line under the title: the scope or the period. */
  description?: string;
  status?: WidgetStatus;
  /** Items for the "more" menu in the header. Leave out for a widget with no menu. */
  actions?: readonly WidgetAction[];
  /** A small control before the menu, such as a time range switch. */
  headerEnd?: ReactNode;
  /** Pinned to the bottom of the widget: a "View all" link or when the data was updated. */
  footer?: ReactNode;
  /** Replaces the default skeleton while loading. Mirror the layout of the real content. */
  loading?: ReactNode;
  empty?: WidgetMessage;
  error?: WidgetMessage & { onRetry?: () => void };
  children?: ReactNode;
  /** Layout classes for the card, such as a grid span or a height. */
  className?: string;
};

function Message({ title, description, action, alert = false }: WidgetMessage & { alert?: boolean }) {
  return (
    <div
      role={alert ? 'alert' : 'status'}
      data-slot="widget-message"
      className="flex w-full flex-1 flex-col items-center justify-center gap-1 py-4 text-center"
    >
      {alert ? <IconAlertTriangle aria-hidden className="mb-1 size-5 text-critical-foreground-strong" /> : null}
      <p className="text-sm font-medium text-base-foreground">{title}</p>
      {description ? <p className="max-w-xs text-xs text-muted-foreground">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

/**
 * The shell every dashboard widget shares: title, optional scope line, a header control, a "more"
 * menu, the body, and a footer pinned to the bottom. It also owns the three states a widget can be
 * in instead of showing data — loading, empty and failed — so they look the same on every widget
 * and the widget keeps its size while it changes state.
 */
export function WidgetFrame({
  title,
  description,
  status = 'ready',
  actions = [],
  headerEnd,
  footer,
  loading,
  empty = { title: 'Nothing to show yet' },
  error = { title: "Couldn't load this widget" },
  children,
  className,
}: WidgetFrameProps) {
  const { onRetry, ...errorMessage } = error;

  return (
    <Card
      role="group"
      aria-label={title}
      aria-busy={status === 'loading' ? 'true' : undefined}
      data-slot="widget-frame"
      data-status={status}
      className={cn('h-full min-w-0', className)}
    >
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeaderCenter>
        {headerEnd || actions.length > 0 ? (
          <CardHeaderEnd>
            {headerEnd}
            {actions.length > 0 ? (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${title}`}>
                            <IconDots />
                          </Button>
                        }
                      />
                    }
                  />
                  <TooltipContent>More actions</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  {actions.map((action) => (
                    <DropdownMenuItem key={action.id} variant={action.destructive ? 'destructive' : 'default'} onClick={action.onSelect}>
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </CardHeaderEnd>
        ) : null}
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {/* CardContent aligns children to the start; this wrapper makes the body span the card. */}
        <div className="flex h-full w-full min-w-0 flex-1 flex-col gap-3">
          {status === 'loading'
            ? (loading ?? (
                <div data-slot="widget-skeleton" className="flex w-full flex-1 flex-col gap-3">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))
            : null}
          {status === 'empty' ? <Message {...empty} /> : null}
          {status === 'error' ? (
            <Message
              alert
              {...errorMessage}
              action={
                errorMessage.action ??
                (onRetry ? (
                  <Button variant="secondary" size="sm" onClick={onRetry}>
                    Try again
                  </Button>
                ) : undefined)
              }
            />
          ) : null}
          {status === 'ready' ? <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{children}</div> : null}
          {footer && status === 'ready' ? (
            <div data-slot="widget-footer" className="flex w-full items-center justify-between gap-3 text-xs text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
