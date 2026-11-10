import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowsMaximize, IconArrowsMinimize } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type GlassPanelProps = {
  title: string;
  /** Quiet line under the title, such as a tag or a unit. */
  caption?: string;
  /** Brought forward: stronger border and glow. */
  focused?: boolean;
  /** Pushed back because another panel is focused. */
  receded?: boolean;
  /** Adds a focus toggle to the header. Called with the state the user asked for. */
  onFocusChange?: (focused: boolean) => void;
  /** Extra header content before the focus toggle. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

const SURFACE =
  'bg-[color-mix(in_oklab,var(--card-background)_68%,transparent)] backdrop-blur-md shadow-[inset_0_1px_0_color-mix(in_oklab,var(--base-foreground)_10%,transparent)]';
const BORDER_REST = 'border-[color-mix(in_oklab,var(--primary-background)_30%,transparent)]';
const BORDER_FOCUS =
  'border-[color-mix(in_oklab,var(--primary-background)_80%,transparent)] shadow-[0_0_32px_color-mix(in_oklab,var(--primary-background)_28%,transparent),inset_0_1px_0_color-mix(in_oklab,var(--base-foreground)_14%,transparent)]';

/**
 * A frosted panel for screens that float over a live backdrop: translucent surface, blur, a
 * hairline accent border and a soft glow when focused. The surface keeps most of the card colour
 * so text stays readable whatever moves behind it. Pick it only over a backdrop — on a plain
 * page a normal card is quieter and cheaper to paint.
 */
export function GlassPanel({ title, caption, focused = false, receded = false, onFocusChange, actions, className, children }: GlassPanelProps) {
  return (
    <section
      data-slot="glass-panel"
      data-focused={focused}
      data-receded={receded}
      aria-label={title}
      className={cn(
        'relative flex min-h-0 min-w-0 flex-col rounded-xl border transition-[transform,opacity,box-shadow,border-color] duration-300 motion-reduce:transition-none',
        SURFACE,
        focused ? cn(BORDER_FOCUS, 'z-10') : BORDER_REST,
        receded && 'scale-[0.97] opacity-60',
        className
      )}
    >
      <header className="flex min-w-0 items-center justify-between gap-2 px-4 pt-3">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold uppercase tracking-widest text-medium-foreground">{title}</h3>
          {caption ? <p className="truncate font-mono text-xs text-muted-foreground">{caption}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {onFocusChange ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-pressed={focused}
                    aria-label={focused ? `Release ${title}` : `Focus ${title}`}
                    onClick={() => onFocusChange(!focused)}
                  >
                    {focused ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
                  </Button>
                }
              />
              <TooltipContent>{focused ? 'Release panel' : 'Bring panel forward'}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4">{children}</div>
    </section>
  );
}
