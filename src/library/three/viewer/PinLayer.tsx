import { Html } from '@react-three/drei';

import { cn } from '../../../lib/utils';
import { toTuple } from '../cameraTargets';

import { pinNumber } from './pins';
import type { PinState } from './pins';

export type PinLayerProps = {
  state: PinState;
  onSelect?: (id: string) => void;
};

/**
 * Numbered markers for the notes pinned on the model. Selecting one widens it to show its text.
 * The markers are pointer-only: `PinList` is the keyboard and screen reader route to the same pins.
 */
export function PinLayer({ state, onSelect }: PinLayerProps) {
  return (
    <group>
      {state.items.map((pin) => {
        const selected = pin.id === state.selectedId;
        return (
          <Html key={pin.id} position={toTuple(pin.position)} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div data-slot="pin" aria-hidden="true" className="-translate-y-4 font-sans">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onSelect?.(pin.id)}
                className={cn(
                  'pointer-events-auto flex h-5 min-w-5 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border bg-card-background px-1 font-mono text-xs leading-none tabular-nums text-base-foreground',
                  selected ? 'border-[var(--primary-background)] px-2' : 'border-emphasized'
                )}
              >
                <span className="font-semibold">{pinNumber(state, pin.id)}</span>
                {selected ? <span className="font-sans">{pin.text}</span> : null}
              </button>
            </div>
          </Html>
        );
      })}
    </group>
  );
}
