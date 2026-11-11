import type { CameraTarget } from '../cameraTargets';

export type Viewpoint = { id: string; name: string; target: CameraTarget };

export type ViewpointState = { items: readonly Viewpoint[]; nextId: number };

export type ViewpointAction =
  | { type: 'save'; target: CameraTarget; name?: string }
  | { type: 'rename'; id: string; name: string }
  | { type: 'delete'; id: string }
  | { type: 'move'; id: string; by: -1 | 1 };

export function createViewpointState(items: readonly Viewpoint[] = []): ViewpointState {
  const highest = items.reduce((max, item) => Math.max(max, Number.parseInt(item.id.replace(/\D/g, ''), 10) || 0), 0);
  return { items, nextId: highest + 1 };
}

/** The first name "Viewpoint n" no saved viewpoint uses. */
export function nextViewpointName(items: readonly Viewpoint[]): string {
  for (let index = items.length + 1; ; index += 1) {
    const name = `Viewpoint ${index}`;
    if (!items.some((item) => item.name === name)) return name;
  }
}

export function viewpointReducer(state: ViewpointState, action: ViewpointAction): ViewpointState {
  switch (action.type) {
    case 'save': {
      const name = action.name?.trim() || nextViewpointName(state.items);
      return { items: [...state.items, { id: `v${state.nextId}`, name, target: action.target }], nextId: state.nextId + 1 };
    }
    case 'rename': {
      const name = action.name.trim();
      if (name === '') return state;
      return { ...state, items: state.items.map((item) => (item.id === action.id ? { ...item, name } : item)) };
    }
    case 'delete':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case 'move': {
      const index = state.items.findIndex((item) => item.id === action.id);
      const swap = index + action.by;
      if (index === -1 || swap < 0 || swap >= state.items.length) return state;
      const items = [...state.items];
      [items[index], items[swap]] = [items[swap], items[index]];
      return { ...state, items };
    }
  }
}
