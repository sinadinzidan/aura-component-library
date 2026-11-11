import {
  addItem,
  bottom,
  clampItem,
  collides,
  compact,
  describePlacement,
  findSlot,
  moveItem,
  nudgeItem,
  removeItem,
  resizeItem,
  sameLayout,
  sortItems,
  toSingleColumn,
} from './gridLayout';
import type { GridItem } from './gridLayout';

const COLS = 12;

const item = (id: string, x: number, y: number, w: number, h: number, extra: Partial<GridItem> = {}): GridItem => ({ id, x, y, w, h, ...extra });

const at = (items: readonly GridItem[], id: string): Pick<GridItem, 'x' | 'y' | 'w' | 'h'> => {
  const found = items.find((entry) => entry.id === id);
  if (!found) throw new Error(`No item ${id}`);
  return { x: found.x, y: found.y, w: found.w, h: found.h };
};

const overlaps = (items: readonly GridItem[]): boolean => items.some((a) => items.some((b) => collides(a, b)));

describe(collides.name, () => {
  it('is true when two items share a cell', () => {
    expect(collides(item('a', 0, 0, 4, 2), item('b', 3, 1, 4, 2))).toBe(true);
  });

  it('is false when items only touch at an edge', () => {
    expect(collides(item('a', 0, 0, 4, 2), item('b', 4, 0, 4, 2))).toBe(false);
    expect(collides(item('a', 0, 0, 4, 2), item('b', 0, 2, 4, 2))).toBe(false);
  });

  it('is false for an item against itself', () => {
    const a = item('a', 0, 0, 4, 2);
    expect(collides(a, { ...a })).toBe(false);
  });
});

describe(sortItems.name, () => {
  it('orders by row, then column, without touching the input', () => {
    const items = [item('c', 0, 2, 4, 2), item('b', 6, 0, 4, 2), item('a', 0, 0, 4, 2)];

    expect(sortItems(items).map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
    expect(items.map((entry) => entry.id)).toEqual(['c', 'b', 'a']);
  });
});

describe(bottom.name, () => {
  it('is the first row below every item', () => {
    expect(bottom([item('a', 0, 0, 4, 2), item('b', 4, 1, 4, 4)])).toBe(5);
  });

  it('is zero for an empty grid', () => {
    expect(bottom([])).toBe(0);
  });
});

describe(clampItem.name, () => {
  it('pulls an item back inside the right edge', () => {
    expect(clampItem(item('a', 10, 0, 4, 2), COLS)).toMatchObject({ x: 8, w: 4 });
  });

  it('never lets a position go negative', () => {
    expect(clampItem(item('a', -3, -2, 4, 2), COLS)).toMatchObject({ x: 0, y: 0 });
  });

  it('holds the minimum size', () => {
    expect(clampItem(item('a', 0, 0, 1, 1, { minW: 3, minH: 2 }), COLS)).toMatchObject({ w: 3, h: 2 });
  });

  it('caps the width at the number of columns', () => {
    expect(clampItem(item('a', 2, 0, 20, 2), COLS)).toMatchObject({ x: 0, w: 12 });
  });
});

describe(compact.name, () => {
  it('moves items up into empty rows', () => {
    const result = compact([item('a', 0, 3, 4, 2), item('b', 4, 5, 4, 2)], COLS);

    expect(at(result, 'a').y).toBe(0);
    expect(at(result, 'b').y).toBe(0);
  });

  it('stops an item on top of the one below it', () => {
    const result = compact([item('a', 0, 0, 4, 2), item('b', 0, 6, 4, 2)], COLS);

    expect(at(result, 'b').y).toBe(2);
  });

  it('separates overlapping items by pushing the later one down', () => {
    const result = compact([item('a', 0, 0, 6, 2), item('b', 3, 0, 6, 2)], COLS);

    expect(overlaps(result)).toBe(false);
    expect(at(result, 'a').y).toBe(0);
    expect(at(result, 'b').y).toBe(2);
  });

  it('keeps the order of the input array', () => {
    const result = compact([item('b', 0, 4, 4, 2), item('a', 0, 0, 4, 2)], COLS);

    expect(result.map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it('leaves a packed layout unchanged', () => {
    const packed = [item('a', 0, 0, 6, 2), item('b', 6, 0, 6, 2), item('c', 0, 2, 12, 3)];

    expect(sameLayout(compact(packed, COLS), packed)).toBe(true);
  });
});

describe(moveItem.name, () => {
  const stacked = [item('a', 0, 0, 4, 2), item('b', 0, 2, 4, 2), item('c', 4, 0, 4, 2)];

  it('moves an item sideways into free space', () => {
    const result = moveItem(stacked, 'a', 8, 0, COLS);

    expect(at(result, 'a')).toMatchObject({ x: 8, y: 0 });
  });

  it('compacts the items the moved one leaves behind', () => {
    const result = moveItem(stacked, 'a', 8, 0, COLS);

    expect(at(result, 'b').y).toBe(0);
  });

  it('pushes down the item it lands on', () => {
    const result = moveItem(stacked, 'a', 4, 0, COLS);

    expect(at(result, 'a')).toMatchObject({ x: 4, y: 0 });
    expect(at(result, 'c')).toMatchObject({ x: 4, y: 2 });
    expect(overlaps(result)).toBe(false);
  });

  it('pushes a whole column down, not just the first neighbour', () => {
    const column = [item('a', 0, 0, 4, 2), item('b', 4, 0, 4, 2), item('c', 4, 2, 4, 2)];

    const result = moveItem(column, 'a', 4, 0, COLS);

    expect(at(result, 'b').y).toBe(2);
    expect(at(result, 'c').y).toBe(4);
  });

  it('does not swap while the top edge is above the middle of the item below', () => {
    const result = moveItem(stacked, 'a', 0, 1, COLS);

    expect(sameLayout(result, stacked)).toBe(true);
  });

  it('swaps with the item below once the top edge passes its middle', () => {
    const result = moveItem(stacked, 'a', 0, 3, COLS);

    expect(at(result, 'b').y).toBe(0);
    expect(at(result, 'a').y).toBe(2);
  });

  it('swaps with the item above when dragged to its row', () => {
    const result = moveItem(stacked, 'b', 0, 0, COLS);

    expect(at(result, 'b').y).toBe(0);
    expect(at(result, 'a').y).toBe(2);
  });

  it('floats an item dropped into empty space up to the nearest support', () => {
    const result = moveItem(stacked, 'c', 8, 9, COLS);

    expect(at(result, 'c')).toMatchObject({ x: 8, y: 0 });
  });

  it('clamps a move past the right edge', () => {
    const result = moveItem(stacked, 'a', 30, 0, COLS);

    expect(at(result, 'a').x).toBe(8);
  });

  it('never produces an overlap', () => {
    const busy = [item('a', 0, 0, 6, 3), item('b', 6, 0, 6, 2), item('c', 6, 2, 3, 4), item('d', 0, 3, 6, 2), item('e', 9, 2, 3, 2)];

    for (let x = 0; x < COLS; x += 1) {
      for (let y = 0; y < 8; y += 1) {
        expect(overlaps(moveItem(busy, 'c', x, y, COLS))).toBe(false);
      }
    }
  });

  it('returns the layout unchanged for an unknown id', () => {
    expect(moveItem(stacked, 'missing', 2, 2, COLS)).toEqual(stacked);
  });

  it('keeps the array order', () => {
    expect(moveItem(stacked, 'c', 0, 0, COLS).map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
  });
});

describe(resizeItem.name, () => {
  const row = [item('a', 0, 0, 4, 2), item('b', 4, 0, 4, 2), item('c', 0, 2, 4, 2)];

  it('grows an item and pushes its right-hand neighbour down', () => {
    const result = resizeItem(row, 'a', 6, 2, COLS);

    expect(at(result, 'a')).toMatchObject({ x: 0, y: 0, w: 6 });
    expect(at(result, 'b').y).toBe(2);
    expect(overlaps(result)).toBe(false);
  });

  it('grows an item downward and pushes the item below', () => {
    const result = resizeItem(row, 'a', 4, 4, COLS);

    expect(at(result, 'c').y).toBe(4);
  });

  it('keeps the resized item in place when it grows into an item that started above it', () => {
    const tall = [item('a', 0, 1, 4, 2), item('b', 4, 0, 4, 4), item('floor', 0, 0, 4, 1)];

    const result = resizeItem(tall, 'a', 6, 2, COLS);

    expect(at(result, 'a')).toMatchObject({ x: 0, y: 1, w: 6 });
    expect(at(result, 'b').y).toBe(3);
  });

  it('lets the items below move up when an item shrinks', () => {
    const result = resizeItem([item('a', 0, 0, 4, 4), item('c', 0, 4, 4, 2)], 'a', 4, 2, COLS);

    expect(at(result, 'c').y).toBe(2);
  });

  it('stops at the right edge of the grid', () => {
    const result = resizeItem([item('a', 8, 0, 4, 2)], 'a', 9, 2, COLS);

    expect(at(result, 'a')).toMatchObject({ x: 8, w: 4 });
  });

  it('stops at the minimum size', () => {
    const result = resizeItem([item('a', 0, 0, 4, 3, { minW: 3, minH: 2 })], 'a', 1, 1, COLS);

    expect(at(result, 'a')).toMatchObject({ w: 3, h: 2 });
  });

  it('returns the layout unchanged for an unknown id', () => {
    expect(resizeItem(row, 'missing', 2, 2, COLS)).toEqual(row);
  });
});

describe(nudgeItem.name, () => {
  const stacked = [item('a', 0, 0, 4, 2), item('b', 0, 2, 4, 3), item('c', 4, 0, 4, 2)];

  it('moves one column to the right', () => {
    expect(at(nudgeItem([item('a', 0, 0, 4, 2)], 'a', 1, 0, COLS), 'a').x).toBe(1);
  });

  it('returns the same layout at the left edge', () => {
    expect(sameLayout(nudgeItem(stacked, 'a', -1, 0, COLS), stacked)).toBe(true);
  });

  it('steps down past a taller neighbour in one press', () => {
    const result = nudgeItem(stacked, 'a', 0, 1, COLS);

    expect(at(result, 'b').y).toBe(0);
    expect(at(result, 'a').y).toBe(3);
  });

  it('steps up past the item above in one press', () => {
    const result = nudgeItem(stacked, 'b', 0, -1, COLS);

    expect(at(result, 'b').y).toBe(0);
    expect(at(result, 'a').y).toBe(3);
  });

  it('returns the same layout when nothing is below', () => {
    expect(sameLayout(nudgeItem(stacked, 'b', 0, 1, COLS), stacked)).toBe(true);
  });

  it('returns the same layout at the top', () => {
    expect(sameLayout(nudgeItem(stacked, 'a', 0, -1, COLS), stacked)).toBe(true);
  });
});

describe(findSlot.name, () => {
  it('uses the first gap in reading order', () => {
    expect(findSlot([item('a', 0, 0, 4, 2), item('b', 8, 0, 4, 2)], { w: 4, h: 2 }, COLS)).toEqual({ x: 4, y: 0 });
  });

  it('goes below everything when no gap is wide enough', () => {
    expect(findSlot([item('a', 0, 0, 6, 2), item('b', 6, 0, 6, 2)], { w: 8, h: 2 }, COLS)).toEqual({ x: 0, y: 2 });
  });

  it('starts at the top-left of an empty grid', () => {
    expect(findSlot([], { w: 4, h: 2 }, COLS)).toEqual({ x: 0, y: 0 });
  });
});

describe(addItem.name, () => {
  it('adds the item in the first free slot', () => {
    const result = addItem([item('a', 0, 0, 8, 2)], item('new', 0, 0, 4, 2), COLS);

    expect(at(result, 'new')).toMatchObject({ x: 8, y: 0 });
  });

  it('does not move the items already there', () => {
    const existing = [item('a', 0, 0, 12, 2)];

    const result = addItem(existing, item('new', 0, 0, 4, 2), COLS);

    expect(at(result, 'a')).toMatchObject({ x: 0, y: 0 });
    expect(at(result, 'new')).toMatchObject({ x: 0, y: 2 });
  });
});

describe(removeItem.name, () => {
  it('closes the gap the removed item leaves', () => {
    const result = removeItem([item('a', 0, 0, 4, 2), item('b', 0, 2, 4, 2)], 'a', COLS);

    expect(result).toHaveLength(1);
    expect(at(result, 'b').y).toBe(0);
  });
});

describe(toSingleColumn.name, () => {
  it('stacks items at full width in reading order', () => {
    const result = toSingleColumn([item('b', 6, 0, 6, 3), item('a', 0, 0, 6, 2), item('c', 0, 3, 12, 4)]);

    expect(at(result, 'a')).toEqual({ x: 0, y: 0, w: 1, h: 2 });
    expect(at(result, 'b')).toEqual({ x: 0, y: 2, w: 1, h: 3 });
    expect(at(result, 'c')).toEqual({ x: 0, y: 5, w: 1, h: 4 });
  });
});

describe(sameLayout.name, () => {
  it('ignores array order', () => {
    expect(sameLayout([item('a', 0, 0, 1, 1), item('b', 1, 0, 1, 1)], [item('b', 1, 0, 1, 1), item('a', 0, 0, 1, 1)])).toBe(true);
  });

  it('notices a size change', () => {
    expect(sameLayout([item('a', 0, 0, 1, 1)], [item('a', 0, 0, 2, 1)])).toBe(false);
  });

  it('notices a missing item', () => {
    expect(sameLayout([item('a', 0, 0, 1, 1)], [])).toBe(false);
  });
});

describe(describePlacement.name, () => {
  it('speaks in 1-based columns and rows', () => {
    expect(describePlacement(item('a', 4, 2, 4, 3))).toBe('column 5, row 3, 4 wide by 3 tall');
  });
});
