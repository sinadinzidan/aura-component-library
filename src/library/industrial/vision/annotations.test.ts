import {
  MIN_RECT_SIDE,
  annotationReducer,
  clamp01,
  containsPoint,
  createAnnotationState,
  describeShape,
  hitTest,
  isUsableRect,
  moveShape,
  rectFromPoints,
  resizeShape,
  shapeCentre,
  shapeStyle,
  toNormalPoint,
} from './annotations';
import type { Annotation, AnnotationShape, AnnotationState } from './annotations';

const rect = { kind: 'rect', x: 0.2, y: 0.3, w: 0.3, h: 0.2 } as const;
const point = { kind: 'point', x: 0.7, y: 0.6 } as const;

describe('pointer geometry', () => {
  it('clamps to the unit range', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
  });

  it('turns a client position into a frame position', () => {
    expect(toNormalPoint(150, 120, { left: 100, top: 100, width: 200, height: 100 })).toEqual({ x: 0.25, y: 0.2 });
  });

  it('clamps positions outside the frame and survives a zero-size frame', () => {
    expect(toNormalPoint(0, 500, { left: 100, top: 100, width: 200, height: 100 })).toEqual({ x: 0, y: 1 });
    expect(toNormalPoint(5, 5, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
  });
});

describe('rectangles', () => {
  it('builds a rectangle whichever way it was dragged', () => {
    const result = rectFromPoints({ x: 0.6, y: 0.5 }, { x: 0.2, y: 0.1 });
    expect(result).toMatchObject({ kind: 'rect', x: 0.2, y: 0.1 });
    expect(result.w).toBeCloseTo(0.4);
    expect(result.h).toBeCloseTo(0.4);
  });

  it('rejects a click as a rectangle', () => {
    expect(isUsableRect(rectFromPoints({ x: 0.5, y: 0.5 }, { x: 0.505, y: 0.6 }))).toBe(false);
    expect(isUsableRect(rectFromPoints({ x: 0.1, y: 0.1 }, { x: 0.3, y: 0.3 }))).toBe(true);
  });

  it('finds the centre of each shape', () => {
    expect(shapeCentre(rect)).toEqual({ x: 0.35, y: 0.4 });
    expect(shapeCentre(point)).toEqual({ x: 0.7, y: 0.6 });
  });
});

describe('hit testing', () => {
  it('contains points inside a rectangle and near a point', () => {
    expect(containsPoint(rect, { x: 0.3, y: 0.4 })).toBe(true);
    expect(containsPoint(rect, { x: 0.9, y: 0.4 })).toBe(false);
    expect(containsPoint(point, { x: 0.71, y: 0.61 })).toBe(true);
    expect(containsPoint(point, { x: 0.8, y: 0.6 })).toBe(false);
  });

  it('prefers points over rectangles and later annotations over earlier ones', () => {
    const items: Annotation[] = [
      { id: 'a1', label: '', shape: { kind: 'rect', x: 0, y: 0, w: 1, h: 1 } },
      { id: 'a2', label: '', shape: { kind: 'rect', x: 0.4, y: 0.4, w: 0.2, h: 0.2 } },
      { id: 'a3', label: '', shape: { kind: 'point', x: 0.5, y: 0.5 } },
    ];
    expect(hitTest(items, { x: 0.5, y: 0.5 })).toBe('a3');
    expect(hitTest(items, { x: 0.42, y: 0.58 })).toBe('a2');
    expect(hitTest(items, { x: 0.1, y: 0.9 })).toBe('a1');
  });

  it('returns null over empty frame', () => {
    expect(hitTest([{ id: 'a1', label: '', shape: rect }], { x: 0.9, y: 0.9 })).toBeNull();
    expect(hitTest([], { x: 0.5, y: 0.5 })).toBeNull();
  });
});

describe('moving and resizing', () => {
  it('moves a shape and keeps it inside the frame', () => {
    expect(moveShape(rect, 0.1, -0.1)).toEqual({ kind: 'rect', x: 0.30000000000000004, y: 0.19999999999999998, w: 0.3, h: 0.2 });
    expect(moveShape(rect, 5, 5)).toMatchObject({ x: 0.7, y: 0.8 });
    expect(moveShape(rect, -5, -5)).toMatchObject({ x: 0, y: 0 });
    expect(moveShape(point, 1, 1)).toEqual({ kind: 'point', x: 1, y: 1 });
  });

  it('resizes from the top-left corner within the frame and above the minimum', () => {
    expect(resizeShape(rect, 0.1, 0.1)).toMatchObject({ w: 0.4, h: 0.30000000000000004 });
    expect(resizeShape(rect, 5, 5)).toMatchObject({ w: 0.8, h: 0.7 });
    expect(resizeShape(rect, -5, -5)).toMatchObject({ w: MIN_RECT_SIDE, h: MIN_RECT_SIDE });
  });

  it('leaves a point unchanged when resized', () => {
    expect(resizeShape(point, 0.2, 0.2)).toBe(point);
  });
});

describe('formatting', () => {
  it('gives percentage styles', () => {
    expect(shapeStyle(rect)).toEqual({ left: '20%', top: '30%', width: '30%', height: '20%' });
    expect(shapeStyle(point)).toEqual({ left: '70%', top: '60%' });
  });

  it('describes shapes in words', () => {
    expect(describeShape(rect)).toBe('Rectangle at 20 % across, 30 % down, 30 % by 20 %');
    expect(describeShape(point)).toBe('Point at 70 % across, 60 % down');
  });
});

describe('annotationReducer', () => {
  const start = createAnnotationState();
  const add = (state: AnnotationState, shape: AnnotationShape = rect, label?: string) => annotationReducer(state, { type: 'add', shape, label });

  it('adds with sequential ids, selects the new one and labels it', () => {
    const state = add(add(start, rect, 'Corrosion'), point);
    expect(state.items.map((item) => item.id)).toEqual(['a1', 'a2']);
    expect(state.items[0].label).toBe('Corrosion');
    expect(state.items[1].label).toBe('Unlabelled');
    expect(state.selectedId).toBe('a2');
  });

  it('continues numbering after seeded annotations', () => {
    const seeded = createAnnotationState([{ id: 'a7', label: 'Leak', shape: point }]);
    expect(add(seeded).items[1].id).toBe('a8');
  });

  it('selects and deselects without touching history', () => {
    const state = annotationReducer(add(start), { type: 'select', id: null });
    expect(state.selectedId).toBeNull();
    expect(state.history).toHaveLength(1);
  });

  it('moves, resizes and renames the named annotation only', () => {
    let state = add(add(start, rect, 'One'), point, 'Two');
    state = annotationReducer(state, { type: 'move', id: 'a1', dx: 0.1, dy: 0 });
    state = annotationReducer(state, { type: 'resize', id: 'a1', dw: 0.1, dh: 0 });
    state = annotationReducer(state, { type: 'rename', id: 'a2', label: 'Gauge' });
    expect(state.items[0].shape).toMatchObject({ x: 0.30000000000000004, w: 0.4 });
    expect(state.items[1].label).toBe('Gauge');
    expect(state.items[1].shape).toEqual(point);
  });

  it('ignores actions on unknown ids and no-op renames', () => {
    const state = add(start);
    expect(annotationReducer(state, { type: 'move', id: 'zz', dx: 1, dy: 1 })).toBe(state);
    expect(annotationReducer(state, { type: 'resize', id: 'zz', dw: 1, dh: 1 })).toBe(state);
    expect(annotationReducer(state, { type: 'delete', id: 'zz' })).toBe(state);
    expect(annotationReducer(state, { type: 'rename', id: 'a1', label: 'Unlabelled' })).toBe(state);
    expect(annotationReducer(state, { type: 'rename', id: 'zz', label: 'x' })).toBe(state);
  });

  it('deletes and clears the selection of the deleted one', () => {
    const state = annotationReducer(add(add(start)), { type: 'delete', id: 'a2' });
    expect(state.items.map((item) => item.id)).toEqual(['a1']);
    expect(state.selectedId).toBeNull();
  });

  it('keeps the selection when another annotation is deleted', () => {
    const state = annotationReducer(add(add(start)), { type: 'delete', id: 'a1' });
    expect(state.selectedId).toBe('a2');
  });

  it('undoes each change in turn', () => {
    let state = add(start);
    state = annotationReducer(state, { type: 'move', id: 'a1', dx: 0.1, dy: 0 });
    state = annotationReducer(state, { type: 'delete', id: 'a1' });
    state = annotationReducer(state, { type: 'undo' });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].shape).toMatchObject({ x: 0.30000000000000004 });
    state = annotationReducer(state, { type: 'undo' });
    expect(state.items[0].shape).toEqual(rect);
    state = annotationReducer(state, { type: 'undo' });
    expect(state.items).toHaveLength(0);
    expect(annotationReducer(state, { type: 'undo' })).toBe(state);
  });

  it('drops the selection when undo removes the selected annotation', () => {
    const state = annotationReducer(add(start), { type: 'undo' });
    expect(state.selectedId).toBeNull();
  });

  it('clears everything, undoably', () => {
    const cleared = annotationReducer(add(add(start)), { type: 'clear' });
    expect(cleared.items).toHaveLength(0);
    expect(annotationReducer(cleared, { type: 'undo' }).items).toHaveLength(2);
    expect(annotationReducer(start, { type: 'clear' })).toBe(start);
  });

  it('keeps a bounded history', () => {
    let state = add(start);
    for (let index = 0; index < 80; index += 1) state = annotationReducer(state, { type: 'move', id: 'a1', dx: 0.001, dy: 0 });
    expect(state.history.length).toBe(50);
  });
});
