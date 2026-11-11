/**
 * The layout engine of the dashboard editor: items on a column grid that never overlap and always
 * pack upward. Everything is pure — a function takes a layout and returns a new one in the same
 * array order, so React keys and DOM nodes stay put while items change place.
 */

export type GridItem = {
  id: string;
  /** Left column, 0-based. */
  x: number;
  /** Top row, 0-based. */
  y: number;
  /** Width in columns. */
  w: number;
  /** Height in rows. */
  h: number;
  minW?: number;
  minH?: number;
};

export type GridSize = { w: number; h: number };

/** True when two items share at least one cell. An item never collides with itself. */
export function collides(a: GridItem, b: GridItem): boolean {
  if (a.id === b.id) return false;
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Reading order: top to bottom, then left to right. */
export function sortItems<T extends GridItem>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x);
}

/** The first row below every item; the height of the grid in rows. */
export function bottom(items: readonly GridItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
}

/** Keeps an item inside the grid and at or above its minimum size. */
export function clampItem<T extends GridItem>(item: T, cols: number): T {
  const w = Math.min(cols, Math.max(item.minW ?? 1, Math.round(item.w)));
  const h = Math.max(item.minH ?? 1, Math.round(item.h));
  const x = Math.min(cols - w, Math.max(0, Math.round(item.x)));
  const y = Math.max(0, Math.round(item.y));
  return { ...item, x, y, w, h };
}

/**
 * Places items one by one in the given order: each is pushed below anything already placed that
 * it overlaps, then floats up until it rests on an item or the top edge.
 */
function settle<T extends GridItem>(order: readonly T[]): T[] {
  const placed: T[] = [];
  for (const item of order) {
    let current = item;
    for (let hit = placed.find((other) => collides(other, current)); hit; hit = placed.find((other) => collides(other, current))) {
      current = { ...current, y: hit.y + hit.h };
    }
    while (current.y > 0) {
      const raised = { ...current, y: current.y - 1 };
      if (placed.some((other) => collides(other, raised))) break;
      current = raised;
    }
    placed.push(current);
  }
  return placed;
}

function inOriginalOrder<T extends GridItem>(original: readonly T[], settled: readonly T[]): T[] {
  const byId = new Map(settled.map((item) => [item.id, item]));
  return original.map((item) => byId.get(item.id) ?? item);
}

/** Removes overlaps and gaps: every item moves up as far as it can, in reading order. */
export function compact<T extends GridItem>(items: readonly T[], cols: number): T[] {
  const clamped = items.map((item) => clampItem(item, cols));
  return inOriginalOrder(items, settle(sortItems(clamped)));
}

const isBefore = (a: GridItem, b: GridItem): boolean => a.y < b.y || (a.y === b.y && a.x < b.x);

/**
 * Moves one item to a cell. Items it lands on are pushed down, unless its top edge has passed
 * their middle — then they slide up and the moved item takes the place below, which is how two
 * stacked items swap. The result is compacted.
 */
export function moveItem<T extends GridItem>(items: readonly T[], id: string, x: number, y: number, cols: number): T[] {
  const current = items.find((item) => item.id === id);
  if (!current) return [...items];
  const anchor = clampItem({ ...current, x, y }, cols);
  const others = sortItems(items.filter((item) => item.id !== id).map((item) => clampItem(item, cols)));
  const goesFirst = (other: T): boolean => (collides(other, anchor) ? other.y + other.h / 2 <= anchor.y : isBefore(other, anchor));
  const before = others.filter(goesFirst);
  const after = others.filter((other) => !goesFirst(other));
  return inOriginalOrder(items, settle([...before, anchor, ...after]));
}

/**
 * Resizes one item from its bottom-right corner. The item keeps its place; whatever the new size
 * covers is pushed down. Width is limited by the right edge of the grid, and both dimensions by
 * the item's minimum size.
 */
export function resizeItem<T extends GridItem>(items: readonly T[], id: string, w: number, h: number, cols: number): T[] {
  const current = items.find((item) => item.id === id);
  if (!current) return [...items];
  const width = Math.min(cols - current.x, Math.max(current.minW ?? 1, Math.round(w)));
  const anchor = clampItem({ ...current, w: width, h }, cols);
  const others = sortItems(items.filter((item) => item.id !== id).map((item) => clampItem(item, cols)));
  const goesFirst = (other: T): boolean => !collides(other, anchor) && isBefore(other, anchor);
  const before = others.filter(goesFirst);
  const after = others.filter((other) => !goesFirst(other));
  return inOriginalOrder(items, settle([...before, anchor, ...after]));
}

/** True when both layouts put every item in the same cell at the same size. */
export function sameLayout(a: readonly GridItem[], b: readonly GridItem[]): boolean {
  if (a.length !== b.length) return false;
  const byId = new Map(b.map((item) => [item.id, item]));
  return a.every((item) => {
    const other = byId.get(item.id);
    return other !== undefined && other.x === item.x && other.y === item.y && other.w === item.w && other.h === item.h;
  });
}

/**
 * Moves an item by whole cells, as the arrow keys do. A vertical step keeps going until the
 * layout actually changes, because one row is often not enough to pass a tall neighbour.
 * Returns the same layout when the item is already at the edge.
 */
export function nudgeItem<T extends GridItem>(items: readonly T[], id: string, dx: number, dy: number, cols: number): T[] {
  const current = items.find((item) => item.id === id);
  if (!current) return [...items];
  if (dx !== 0) {
    const moved = moveItem(items, id, current.x + dx, current.y, cols);
    return sameLayout(moved, items) ? [...items] : moved;
  }
  if (dy === 0) return [...items];
  const limit = bottom(items);
  for (let y = current.y + dy; y >= 0 && y <= limit; y += dy) {
    const moved = moveItem(items, id, current.x, y, cols);
    if (!sameLayout(moved, items)) return moved;
  }
  return [...items];
}

/** The first free cell, in reading order, that fits a new item of the given size. */
export function findSlot(items: readonly GridItem[], size: GridSize, cols: number): { x: number; y: number } {
  const w = Math.min(cols, size.w);
  const limit = bottom(items);
  for (let y = 0; y <= limit; y += 1) {
    for (let x = 0; x <= cols - w; x += 1) {
      const probe: GridItem = { id: '', x, y, w, h: size.h };
      if (!items.some((item) => collides(item, probe))) return { x, y };
    }
  }
  return { x: 0, y: limit };
}

/** Adds an item in the first free slot that fits it. */
export function addItem<T extends GridItem>(items: readonly T[], item: T, cols: number): T[] {
  const slot = findSlot(items, item, cols);
  return compact([...items, clampItem({ ...item, ...slot }, cols)], cols);
}

/** Removes an item and closes the gap it leaves. */
export function removeItem<T extends GridItem>(items: readonly T[], id: string, cols: number): T[] {
  return compact(
    items.filter((item) => item.id !== id),
    cols,
  );
}

/** Stacks every item at full width in reading order, for screens too narrow for the grid. */
export function toSingleColumn<T extends GridItem>(items: readonly T[]): T[] {
  let y = 0;
  const stacked = sortItems(items).map((item) => {
    const next = { ...item, x: 0, y, w: 1 };
    y += item.h;
    return next;
  });
  return inOriginalOrder(items, stacked);
}

/** A sentence for screen readers saying where an item is and how big. */
export function describePlacement(item: GridItem): string {
  return `column ${item.x + 1}, row ${item.y + 1}, ${item.w} wide by ${item.h} tall`;
}
