/**
 * Geometry and state of image annotation. Shapes live in normalised frame coordinates (0 to 1 from
 * the top-left corner) so they survive any display size. Everything here is pure: the canvas
 * component only translates pointer and key events into actions.
 */

export type NormalPoint = { x: number; y: number };

export type RectShape = { kind: 'rect'; x: number; y: number; w: number; h: number };
export type PointShape = { kind: 'point'; x: number; y: number };
export type AnnotationShape = RectShape | PointShape;

export type Annotation = { id: string; label: string; shape: AnnotationShape };

/** Smallest side of a rectangle, as a fraction of the frame: a click is not a rectangle. */
export const MIN_RECT_SIDE = 0.02;
/** Distance within which a click selects a point, as a fraction of the frame. */
export const POINT_HIT_RADIUS = 0.025;
/** Arrow-key step, as a fraction of the frame. Shift multiplies it. */
export const NUDGE_STEP = 0.01;
export const NUDGE_STEP_LARGE = 0.05;

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** A pointer position within an element as a point in the frame; (0, 0) for a zero-size element. */
export function toNormalPoint(clientX: number, clientY: number, bounds: { left: number; top: number; width: number; height: number }): NormalPoint {
  if (bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0 };
  return { x: clamp01((clientX - bounds.left) / bounds.width), y: clamp01((clientY - bounds.top) / bounds.height) };
}

/** The rectangle between two corners, whichever way it was dragged. */
export function rectFromPoints(a: NormalPoint, b: NormalPoint): RectShape {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { kind: 'rect', x, y, w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
}

/** Whether a drag is large enough to be a rectangle rather than a click. */
export function isUsableRect(rect: RectShape): boolean {
  return rect.w >= MIN_RECT_SIDE && rect.h >= MIN_RECT_SIDE;
}

/** The point inside a shape that labels and handles hang from: its centre. */
export function shapeCentre(shape: AnnotationShape): NormalPoint {
  return shape.kind === 'point' ? { x: shape.x, y: shape.y } : { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
}

export function containsPoint(shape: AnnotationShape, point: NormalPoint, tolerance = POINT_HIT_RADIUS): boolean {
  if (shape.kind === 'point') return Math.hypot(shape.x - point.x, shape.y - point.y) <= tolerance;
  return point.x >= shape.x && point.x <= shape.x + shape.w && point.y >= shape.y && point.y <= shape.y + shape.h;
}

/** The topmost annotation under a point: points beat rectangles, later ones beat earlier ones. */
export function hitTest(annotations: readonly Annotation[], point: NormalPoint, tolerance = POINT_HIT_RADIUS): string | null {
  for (let index = annotations.length - 1; index >= 0; index -= 1) {
    if (annotations[index].shape.kind === 'point' && containsPoint(annotations[index].shape, point, tolerance)) return annotations[index].id;
  }
  for (let index = annotations.length - 1; index >= 0; index -= 1) {
    if (annotations[index].shape.kind === 'rect' && containsPoint(annotations[index].shape, point, tolerance)) return annotations[index].id;
  }
  return null;
}

/** Moves a shape, keeping it inside the frame. */
export function moveShape(shape: AnnotationShape, dx: number, dy: number): AnnotationShape {
  if (shape.kind === 'point') return { kind: 'point', x: clamp01(shape.x + dx), y: clamp01(shape.y + dy) };
  return { ...shape, x: Math.min(1 - shape.w, Math.max(0, shape.x + dx)), y: Math.min(1 - shape.h, Math.max(0, shape.y + dy)) };
}

/** Grows or shrinks a rectangle from its top-left corner, within the frame and above the minimum side. Points are unchanged. */
export function resizeShape(shape: AnnotationShape, dw: number, dh: number): AnnotationShape {
  if (shape.kind === 'point') return shape;
  return {
    ...shape,
    w: Math.min(1 - shape.x, Math.max(MIN_RECT_SIDE, shape.w + dw)),
    h: Math.min(1 - shape.y, Math.max(MIN_RECT_SIDE, shape.h + dh)),
  };
}

/** The shape as percentages, for CSS `left`, `top`, `width` and `height`. */
export function shapeStyle(shape: AnnotationShape): { left: string; top: string; width?: string; height?: string } {
  const percent = (value: number) => `${Math.round(value * 10000) / 100}%`;
  return shape.kind === 'point'
    ? { left: percent(shape.x), top: percent(shape.y) }
    : { left: percent(shape.x), top: percent(shape.y), width: percent(shape.w), height: percent(shape.h) };
}

/** A shape in words for assistive technology: "Rectangle at 20 % across, 30 % down, 15 % by 10 %". */
export function describeShape(shape: AnnotationShape): string {
  const percent = (value: number) => Math.round(value * 100);
  return shape.kind === 'point'
    ? `Point at ${percent(shape.x)} % across, ${percent(shape.y)} % down`
    : `Rectangle at ${percent(shape.x)} % across, ${percent(shape.y)} % down, ${percent(shape.w)} % by ${percent(shape.h)} %`;
}

export type AnnotationState = {
  items: readonly Annotation[];
  selectedId: string | null;
  nextId: number;
  /** Earlier states of `items`, newest last, for undo. */
  history: readonly (readonly Annotation[])[];
};

export type AnnotationAction =
  | { type: 'add'; shape: AnnotationShape; label?: string }
  | { type: 'select'; id: string | null }
  | { type: 'move'; id: string; dx: number; dy: number }
  | { type: 'resize'; id: string; dw: number; dh: number }
  | { type: 'rename'; id: string; label: string }
  | { type: 'delete'; id: string }
  | { type: 'undo' }
  | { type: 'clear' };

const HISTORY_LIMIT = 50;

export function createAnnotationState(items: readonly Annotation[] = []): AnnotationState {
  const highest = items.reduce((max, item) => Math.max(max, Number.parseInt(item.id.replace(/\D/g, ''), 10) || 0), 0);
  return { items, selectedId: null, nextId: highest + 1, history: [] };
}

function pushHistory(state: AnnotationState, items: readonly Annotation[], rest: Partial<AnnotationState> = {}): AnnotationState {
  return { ...state, ...rest, items, history: [...state.history, state.items].slice(-HISTORY_LIMIT) };
}

/** Add, move, resize, rename and delete with a small undo history. Selection changes are not undoable. */
export function annotationReducer(state: AnnotationState, action: AnnotationAction): AnnotationState {
  switch (action.type) {
    case 'add': {
      const id = `a${state.nextId}`;
      const item: Annotation = { id, label: action.label ?? 'Unlabelled', shape: action.shape };
      return pushHistory(state, [...state.items, item], { selectedId: id, nextId: state.nextId + 1 });
    }
    case 'select':
      return state.selectedId === action.id ? state : { ...state, selectedId: action.id };
    case 'move': {
      if (!state.items.some((item) => item.id === action.id)) return state;
      return pushHistory(state, state.items.map((item) => (item.id === action.id ? { ...item, shape: moveShape(item.shape, action.dx, action.dy) } : item)));
    }
    case 'resize': {
      if (!state.items.some((item) => item.id === action.id)) return state;
      return pushHistory(state, state.items.map((item) => (item.id === action.id ? { ...item, shape: resizeShape(item.shape, action.dw, action.dh) } : item)));
    }
    case 'rename': {
      const current = state.items.find((item) => item.id === action.id);
      if (!current || current.label === action.label) return state;
      return pushHistory(state, state.items.map((item) => (item.id === action.id ? { ...item, label: action.label } : item)));
    }
    case 'delete': {
      if (!state.items.some((item) => item.id === action.id)) return state;
      return pushHistory(state, state.items.filter((item) => item.id !== action.id), { selectedId: state.selectedId === action.id ? null : state.selectedId });
    }
    case 'undo': {
      const previous = state.history[state.history.length - 1];
      if (!previous) return state;
      const selectedId = previous.some((item) => item.id === state.selectedId) ? state.selectedId : null;
      return { ...state, items: previous, selectedId, history: state.history.slice(0, -1) };
    }
    case 'clear':
      return state.items.length === 0 ? state : pushHistory(state, [], { selectedId: null });
  }
}
