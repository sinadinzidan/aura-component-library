/**
 * Pure sizing maths for `ResizablePanes`. Sizes are percentages of the group that always add up
 * to 100. A handle sits between pane `handle` and pane `handle + 1` and only ever moves size
 * between those two.
 */

export type PaneSpec = {
  /** Smallest size while expanded, in percent. */
  minSize: number;
  /** Largest size, in percent. */
  maxSize: number;
  /** Size on first render and after a reset, in percent. */
  defaultSize: number;
  /** Whether the pane can snap shut below its minimum. */
  collapsible: boolean;
  /** Size while collapsed: 0 hides the pane, a few percent leaves an icon rail. */
  collapsedSize: number;
};

export type PaneSpecInput = Partial<PaneSpec>;

export type PaneLayout = {
  sizes: readonly number[];
  collapsed: readonly boolean[];
  /** Size each pane returns to when it is expanded again. */
  restore: readonly number[];
};

export type PaneAction =
  | { type: 'drag'; handle: number; origin: readonly number[]; delta: number }
  | { type: 'nudge'; handle: number; delta: number }
  | { type: 'limit'; handle: number; to: 'min' | 'max' }
  | { type: 'toggle'; pane: number; neighbour: number }
  | { type: 'set'; sizes: readonly number[] }
  | { type: 'reset' };

const EPSILON = 0.001;

/** Keeps `value` between `min` and `max`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Rounds to two decimals so repeated arithmetic does not drift. */
export function roundSize(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Fills in missing numbers. Panes without a default share what the others leave, and the
 * defaults are scaled so they add up to 100.
 */
export function normalizeSpecs(inputs: readonly PaneSpecInput[]): PaneSpec[] {
  const claimed = inputs.reduce((sum, input) => sum + (input.defaultSize ?? 0), 0);
  const open = inputs.filter((input) => input.defaultSize === undefined).length;
  const share = open > 0 ? Math.max(0, 100 - claimed) / open : 0;
  const specs = inputs.map((input) => {
    const minSize = clamp(input.minSize ?? 10, 0, 100);
    const maxSize = clamp(input.maxSize ?? 100, minSize, 100);
    return {
      minSize,
      maxSize,
      defaultSize: clamp(input.defaultSize ?? share, minSize, maxSize),
      collapsible: input.collapsible ?? false,
      collapsedSize: clamp(input.collapsedSize ?? 0, 0, minSize),
    };
  });
  const scaled = scaleToHundred(specs.map((spec) => spec.defaultSize));
  return specs.map((spec, index) => ({ ...spec, defaultSize: scaled[index] }));
}

/** Scales sizes so they add up to 100. An all-zero list is split evenly. */
export function scaleToHundred(sizes: readonly number[]): number[] {
  if (sizes.length === 0) return [];
  const total = sizes.reduce((sum, size) => sum + size, 0);
  if (total <= 0) return sizes.map(() => roundSize(100 / sizes.length));
  const scaled = sizes.map((size) => roundSize((size / total) * 100));
  const drift = roundSize(100 - scaled.reduce((sum, size) => sum + size, 0));
  scaled[scaled.length - 1] = roundSize(scaled[scaled.length - 1] + drift);
  return scaled;
}

function isCollapsedSize(spec: PaneSpec, size: number): boolean {
  return spec.collapsible && spec.collapsedSize < spec.minSize && Math.abs(size - spec.collapsedSize) < EPSILON;
}

function isValidSize(spec: PaneSpec, size: number): boolean {
  if (isCollapsedSize(spec, size)) return true;
  return size >= spec.minSize - EPSILON && size <= spec.maxSize + EPSILON;
}

/**
 * The layout for a set of panes. Saved `sizes` are used when they match the number of panes;
 * otherwise every pane gets its default. A collapsible pane saved at its collapsed size starts
 * collapsed.
 */
export function createLayout(specs: readonly PaneSpec[], sizes?: readonly number[]): PaneLayout {
  const usable = sizes !== undefined && sizes.length === specs.length && sizes.every((size) => Number.isFinite(size));
  const initial = usable ? scaleToHundred(sizes) : specs.map((spec) => spec.defaultSize);
  return {
    sizes: initial,
    collapsed: specs.map((spec, index) => isCollapsedSize(spec, initial[index])),
    restore: specs.map((spec, index) => (isCollapsedSize(spec, initial[index]) ? spec.defaultSize : initial[index])),
  };
}

function withSizes(specs: readonly PaneSpec[], layout: PaneLayout, changes: Record<number, number>): PaneLayout {
  const sizes = layout.sizes.map((size, index) => (index in changes ? roundSize(changes[index]) : size));
  const collapsed = specs.map((spec, index) => isCollapsedSize(spec, sizes[index]));
  const restore = layout.restore.map((previous, index) => {
    if (collapsed[index]) return layout.collapsed[index] ? previous : layout.sizes[index];
    return sizes[index];
  });
  return { sizes, collapsed, restore };
}

/** The smallest and largest size pane `handle` can take without breaking either neighbour. */
export function handleRange(
  specs: readonly PaneSpec[],
  layout: PaneLayout,
  handle: number
): { min: number; max: number } {
  const before = specs[handle];
  const after = specs[handle + 1];
  const current = layout.sizes[handle];
  if (!before || !after) return { min: current, max: current };
  const total = current + layout.sizes[handle + 1];
  const min = Math.max(before.minSize, total - after.maxSize);
  const max = Math.min(before.maxSize, total - after.minSize);
  return min <= max ? { min: roundSize(min), max: roundSize(max) } : { min: current, max: current };
}

/** Snaps a wanted size to what the pane allows: collapsed below half its minimum, else clamped. */
function fit(spec: PaneSpec, wanted: number, allowCollapse: boolean): number {
  if (allowCollapse && spec.collapsible && spec.collapsedSize < spec.minSize) {
    if (wanted < (spec.minSize + spec.collapsedSize) / 2) return spec.collapsedSize;
  }
  return clamp(wanted, spec.minSize, spec.maxSize);
}

/**
 * Moves a handle so the pane before it becomes `target` percent. Both neighbours keep their
 * limits; with `allowCollapse` a collapsible pane dragged below half its minimum snaps shut and
 * snaps open again when dragged back out. Returns the same layout when nothing can change.
 */
export function resizeAtHandle(
  specs: readonly PaneSpec[],
  layout: PaneLayout,
  handle: number,
  target: number,
  allowCollapse = false
): PaneLayout {
  const before = specs[handle];
  const after = specs[handle + 1];
  if (!before || !after) return layout;
  const total = layout.sizes[handle] + layout.sizes[handle + 1];

  const candidates: number[] = [];
  const first = fit(before, target, allowCollapse);
  candidates.push(total - fit(after, total - first, allowCollapse));
  candidates.push(total - fit(after, total - first, false));
  candidates.push(clamp(target, Math.max(before.minSize, total - after.maxSize), before.maxSize));

  for (const size of candidates) {
    if (isValidSize(before, size) && isValidSize(after, total - size)) {
      if (Math.abs(size - layout.sizes[handle]) < EPSILON) return layout;
      return withSizes(specs, layout, { [handle]: size, [handle + 1]: total - size });
    }
  }
  return layout;
}

/**
 * Collapses pane `pane`, or expands it to the size it had before, moving the difference to
 * `neighbour`. Returns the same layout when the pane is not collapsible or the neighbour cannot
 * absorb the change.
 */
export function toggleCollapsed(
  specs: readonly PaneSpec[],
  layout: PaneLayout,
  pane: number,
  neighbour: number
): PaneLayout {
  const spec = specs[pane];
  const other = specs[neighbour];
  if (!spec || !other || !spec.collapsible || pane === neighbour) return layout;
  const total = layout.sizes[pane] + layout.sizes[neighbour];
  const wanted = layout.collapsed[pane]
    ? clamp(layout.restore[pane], spec.minSize, Math.min(spec.maxSize, total - other.minSize))
    : spec.collapsedSize;
  if (!isValidSize(spec, wanted) || !isValidSize(other, total - wanted)) return layout;
  return withSizes(specs, layout, { [pane]: wanted, [neighbour]: total - wanted });
}

/** The pane a handle collapses with Enter: the one before it when collapsible, else the one after. */
export function collapseTarget(specs: readonly PaneSpec[], handle: number): number | null {
  if (specs[handle]?.collapsible) return handle;
  if (specs[handle + 1]?.collapsible) return handle + 1;
  return null;
}

/** Reducer behind `ResizablePanes`. Every action returns a layout that still adds up to 100. */
export function paneLayoutReducer(specs: readonly PaneSpec[], layout: PaneLayout, action: PaneAction): PaneLayout {
  switch (action.type) {
    case 'drag': {
      if (action.origin.length !== specs.length) return layout;
      const origin = { ...layout, sizes: action.origin };
      const next = resizeAtHandle(specs, origin, action.handle, action.origin[action.handle] + action.delta, true);
      const same = next.sizes.every((size, index) => Math.abs(size - layout.sizes[index]) < EPSILON);
      return same ? layout : withSizes(specs, layout, Object.fromEntries(next.sizes.entries()));
    }
    case 'nudge': {
      const { min, max } = handleRange(specs, layout, action.handle);
      const target = clamp(layout.sizes[action.handle] + action.delta, min, max);
      return resizeAtHandle(specs, layout, action.handle, target);
    }
    case 'limit': {
      const range = handleRange(specs, layout, action.handle);
      return resizeAtHandle(specs, layout, action.handle, action.to === 'min' ? range.min : range.max);
    }
    case 'toggle':
      return toggleCollapsed(specs, layout, action.pane, action.neighbour);
    case 'set':
      return action.sizes.length === specs.length ? createLayout(specs, action.sizes) : layout;
    case 'reset':
      return createLayout(specs);
  }
}
