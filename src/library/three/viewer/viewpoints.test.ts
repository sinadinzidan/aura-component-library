import { createViewpointState, nextViewpointName, viewpointReducer } from './viewpoints';

const target = { position: [1, 2, 3], lookAt: [0, 0, 0] } as const;

describe('viewpointReducer', () => {
  it('saves with automatic names', () => {
    let state = viewpointReducer(createViewpointState(), { type: 'save', target });
    state = viewpointReducer(state, { type: 'save', target });
    expect(state.items.map((item) => item.name)).toEqual(['Viewpoint 1', 'Viewpoint 2']);
    expect(state.items.map((item) => item.id)).toEqual(['v1', 'v2']);
  });

  it('uses a given name, trimmed', () => {
    expect(viewpointReducer(createViewpointState(), { type: 'save', target, name: '  Pump side ' }).items[0].name).toBe('Pump side');
  });

  it('skips a name that is taken', () => {
    const state = createViewpointState([{ id: 'v1', name: 'Viewpoint 2', target }]);
    expect(nextViewpointName(state.items)).toBe('Viewpoint 3');
  });

  it('continues numbering after seeded ids', () => {
    const state = viewpointReducer(createViewpointState([{ id: 'v9', name: 'Seed', target }]), { type: 'save', target });
    expect(state.items[1].id).toBe('v10');
  });

  it('renames, ignoring blank names', () => {
    const state = createViewpointState([{ id: 'v1', name: 'Old', target }]);
    expect(viewpointReducer(state, { type: 'rename', id: 'v1', name: ' New ' }).items[0].name).toBe('New');
    expect(viewpointReducer(state, { type: 'rename', id: 'v1', name: '  ' })).toBe(state);
  });

  it('deletes and reorders', () => {
    const state = createViewpointState([
      { id: 'v1', name: 'A', target },
      { id: 'v2', name: 'B', target },
    ]);
    expect(viewpointReducer(state, { type: 'delete', id: 'v1' }).items.map((item) => item.id)).toEqual(['v2']);
    expect(viewpointReducer(state, { type: 'move', id: 'v1', by: 1 }).items.map((item) => item.id)).toEqual(['v2', 'v1']);
    expect(viewpointReducer(state, { type: 'move', id: 'v1', by: -1 })).toBe(state);
    expect(viewpointReducer(state, { type: 'move', id: 'zz', by: 1 })).toBe(state);
  });
});
