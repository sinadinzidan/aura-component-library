import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconTrash } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

import { pinNumber } from './pins';
import type { PinState } from './pins';
import { findPart } from './viewerModelLogic';

export type PinListProps = {
  state: PinState;
  onSelect: (id: string | null) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  className?: string;
};

/**
 * The notes pinned on the model, numbered like the markers in the scene. Select one to edit its
 * text; the part it sits on is named under it. This list is the keyboard route to everything a
 * pin does, since the markers themselves live in the canvas.
 */
export function PinList({ state, onSelect, onEdit, onDelete, className }: PinListProps) {
  return (
    <div data-slot="pin-list" className={cn('flex w-full flex-col gap-2', className)}>
      {state.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pins. Choose the pin tool, then click the model where a note belongs.</p>
      ) : (
        <ul aria-label="Pins" className="flex flex-col gap-1">
          {state.items.map((pin) => {
            const selected = pin.id === state.selectedId;
            const part = pin.partId ? findPart(pin.partId) : undefined;
            return (
              <li key={pin.id} className="flex items-start gap-2">
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Pin ${pinNumber(state, pin.id)}, ${pin.text}${part ? `, on ${part.name}` : ''}`}
                  onClick={() => onSelect(selected ? null : pin.id)}
                  className={cn('flex min-w-0 flex-1 items-start gap-2 rounded-md px-1.5 py-1 text-left outline-none hover:bg-secondary-background focus-visible:outline-2 focus-visible:outline-[var(--ring-default)]', selected && 'bg-secondary-background')}
                >
                  <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emphasized font-mono text-xs tabular-nums text-base-foreground">
                    {pinNumber(state, pin.id)}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-base-foreground">{pin.text}</span>
                    {part ? <span className="text-xs text-muted-foreground">{part.name}</span> : null}
                  </span>
                </button>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete pin ${pinNumber(state, pin.id)}`} onClick={() => onDelete(pin.id)}>
                        <IconTrash />
                      </Button>
                    }
                  />
                  <TooltipContent>Delete pin</TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      )}
      {state.items.map((pin) =>
        pin.id === state.selectedId ? (
          <Input key={pin.id} aria-label={`Text of pin ${pinNumber(state, pin.id)}`} defaultValue={pin.text} onBlur={(event) => onEdit(pin.id, event.target.value)} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} />
        ) : null
      )}
    </div>
  );
}
