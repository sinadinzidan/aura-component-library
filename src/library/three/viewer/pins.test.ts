import { createPinState, pinNumber, pinReducer } from './pins';

describe('pinReducer', () => {
  it('adds a pin, selects it and numbers it', () => {
    const state = pinReducer(createPinState(), { type: 'add', position: [1, 2, 3], partId: 'motor' });
    expect(state.items[0]).toEqual({ id: 'n1', position: [1, 2, 3], partId: 'motor', text: 'New note' });
    expect(state.selectedId).toBe('n1');
    expect(pinNumber(state, 'n1')).toBe(1);
  });

  it('defaults to no part and takes a given text', () => {
    const state = pinReducer(createPinState(), { type: 'add', position: [0, 0, 0], text: 'Check weld' });
    expect(state.items[0]).toMatchObject({ partId: null, text: 'Check weld' });
  });

  it('selects and deselects', () => {
    const state = pinReducer(pinReducer(createPinState(), { type: 'add', position: [0, 0, 0] }), { type: 'select', id: null });
    expect(state.selectedId).toBeNull();
  });

  it('edits text but keeps the old text for a blank edit', () => {
    const state = pinReducer(createPinState(), { type: 'add', position: [0, 0, 0] });
    expect(pinReducer(state, { type: 'edit', id: 'n1', text: ' Weld crack ' }).items[0].text).toBe('Weld crack');
    expect(pinReducer(state, { type: 'edit', id: 'n1', text: '  ' }).items[0].text).toBe('New note');
  });

  it('deletes, clears the selection and renumbers', () => {
    let state = pinReducer(createPinState(), { type: 'add', position: [0, 0, 0] });
    state = pinReducer(state, { type: 'add', position: [1, 0, 0] });
    state = pinReducer(state, { type: 'delete', id: 'n1' });
    expect(state.items).toHaveLength(1);
    expect(pinNumber(state, 'n2')).toBe(1);
    expect(state.selectedId).toBe('n2');
    expect(pinReducer(state, { type: 'delete', id: 'n2' }).selectedId).toBeNull();
  });

  it('continues numbering after seeded ids', () => {
    const state = pinReducer(createPinState([{ id: 'n4', position: [0, 0, 0], text: 'x', partId: null }]), { type: 'add', position: [1, 1, 1] });
    expect(state.items[1].id).toBe('n5');
    expect(pinNumber(state, 'missing')).toBe(0);
  });
});
