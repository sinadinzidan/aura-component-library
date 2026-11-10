import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { ReactNode } from 'react';

type IconActionProps = {
  /** What the button does, including its object: "Acknowledge alarm". Name and tooltip. */
  label: string;
  /** The icon. */
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Set when the button shows or hides something, so its state is announced. */
  expanded?: boolean;
  size?: 'icon-sm' | 'icon';
  variant?: 'ghost' | 'secondary' | 'outline';
};

/**
 * An icon-only button that cannot be shipped without a name: the one `label` is both the
 * accessible name and the tooltip. For row and card actions where a text button would not fit.
 */
export function IconAction({ label, children, onClick, disabled = false, expanded, size = 'icon-sm', variant = 'ghost' }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant={variant} size={size} aria-label={label} disabled={disabled} aria-expanded={expanded} onClick={onClick}>
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
