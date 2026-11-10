import { Button } from '@cognite/aura/components/button';
import { ButtonGroup } from '@cognite/aura/components/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { IconChevronDown } from '@cognite/aura/icons';
import type { ComponentProps, ReactNode } from 'react';

export type SplitButtonOption = {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
};

type SplitButtonProps = {
  /** The default action. */
  children: ReactNode;
  onClick: () => void;
  /** Related actions behind the caret. */
  options: readonly SplitButtonOption[];
  /** Accessible name for the caret, for example "More save options". */
  menuLabel: string;
  variant?: Extract<ComponentProps<typeof Button>['variant'], 'default' | 'secondary' | 'outline'>;
  size?: Extract<ComponentProps<typeof Button>['size'], 'default' | 'sm' | 'lg'>;
  disabled?: boolean;
};

const ICON_SIZE = { default: 'icon', sm: 'icon-sm', lg: 'icon-lg' } as const;

/** One default action plus a short menu of closely related alternatives. */
export function SplitButton({
  children,
  onClick,
  options,
  menuLabel,
  variant = 'default',
  size = 'default',
  disabled = false,
}: SplitButtonProps) {
  return (
    <ButtonGroup>
      <Button variant={variant} size={size} disabled={disabled} onClick={onClick}>
        {children}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant={variant} size={ICON_SIZE[size]} disabled={disabled} aria-label={menuLabel}>
              <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {options.map((option) => (
            <DropdownMenuItem key={option.id} disabled={option.disabled} onClick={option.onSelect}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
