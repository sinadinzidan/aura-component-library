import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { ReactNode } from 'react';

type ToolButtonProps = {
  /** What the button does: "Bold", "Insert link". Accessible name and tooltip. */
  label: string;
  /** Shown after the label in the tooltip, for example `Ctrl+B`. */
  shortcut?: string;
  /** Pass `true` or `false` for a toggle; leave out for a plain action. */
  pressed?: boolean;
  disabled?: boolean;
  /** For roving focus inside a toolbar: only one button is in the tab order. */
  tabIndex?: number;
  onClick?: () => void;
  /** The icon. */
  children: ReactNode;
};

/**
 * One icon button in an editor toolbar. The label is both the accessible name and the tooltip,
 * a toggle reports its state with `aria-pressed`, and pressing it never takes focus from the
 * text field, so the selection it acts on stays where it was.
 */
export function ToolButton({ label, shortcut, pressed, disabled = false, tabIndex, onClick, children }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={pressed ? 'secondary' : 'ghost'}
            size="icon-sm"
            aria-label={label}
            aria-pressed={pressed}
            aria-keyshortcuts={shortcut ? shortcut.replace('Ctrl', 'Control') : undefined}
            disabled={disabled}
            tabIndex={tabIndex}
            data-tool=""
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent>
        {label}
        {shortcut ? <span className="pl-2 opacity-70">{shortcut}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}
