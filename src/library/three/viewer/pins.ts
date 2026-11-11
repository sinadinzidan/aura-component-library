import type { Vec3 } from '../cameraTargets';

/** A note pinned to a point on the model. */
export type Pin = { id: string; position: Vec3; text: string; partId: string | null };

export type PinState = { items: readonly Pin[]; selectedId: string | null; nextId: number };

export type PinAction =
  | { type: 'add'; position: Vec3; partId?: string | null; text?: string }
  | { type: 'select'; id: string | null }
  | { type: 'edit'; id: string; text: string }
  | { type: 'delete'; id: string };

export function createPinState(items: readonly Pin[] = []): PinState {
  const highest = items.reduce((max, item) => Math.max(max, Number.parseInt(item.id.replace(/\D/g, ''), 10) || 0), 0);
  return { items, selectedId: null, nextId: highest + 1 };
}

export function pinReducer(state: PinState, action: PinAction): PinState {
  switch (action.type) {
    case 'add': {
      const id = `n${state.nextId}`;
      const pin: Pin = { id, position: action.position, partId: action.partId ?? null, text: action.text ?? 'New note' };
      return { items: [...state.items, pin], selectedId: id, nextId: state.nextId + 1 };
    }
    case 'select':
      return { ...state, selectedId: action.id };
    case 'edit':
      return { ...state, items: state.items.map((pin) => (pin.id === action.id ? { ...pin, text: action.text.trim() || pin.text } : pin)) };
    case 'delete':
      return { ...state, items: state.items.filter((pin) => pin.id !== action.id), selectedId: state.selectedId === action.id ? null : state.selectedId };
  }
}

/** The pin's number in the list, which is the number on its marker. Pins renumber when one is deleted. */
export const pinNumber = (state: PinState, id: string): number => state.items.findIndex((pin) => pin.id === id) + 1;
