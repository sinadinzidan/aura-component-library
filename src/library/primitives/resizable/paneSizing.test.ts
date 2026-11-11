import {
  clamp,
  collapseTarget,
  createLayout,
  handleRange,
  normalizeSpecs,
  paneLayoutReducer,
  resizeAtHandle,
  roundSize,
  scaleToHundred,
  toggleCollapsed,
} from './paneSizing';
import type { PaneLayout } from './paneSizing';

const total = (layout: PaneLayout) => roundSize(layout.sizes.reduce((sum, size) => sum + size, 0));

const TWO = normalizeSpecs([
  { defaultSize: 30, minSize: 20, maxSize: 50 },
  { defaultSize: 70, minSize: 30 },
]);

const SIDEBAR = normalizeSpecs([{ defaultSize: 25, minSize: 16, maxSize: 40, collapsible: true }, { minSize: 40 }]);

const RAIL = normalizeSpecs([
  { defaultSize: 24, minSize: 16, maxSize: 40, collapsible: true, collapsedSize: 6 },
  { minSize: 40 },
]);

const THREE = normalizeSpecs([
  { defaultSize: 20, minSize: 10 },
  { defaultSize: 50, minSize: 30 },
  { defaultSize: 30, minSize: 20, collapsible: true },
]);

describe(clamp.name, () => {
  it('keeps a value inside the range', () => {
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(25, 10, 20)).toBe(20);
    expect(clamp(15, 10, 20)).toBe(15);
  });
});

describe(scaleToHundred.name, () => {
  it('scales sizes so they add up to 100', () => {
    expect(scaleToHundred([1, 1, 2])).toEqual([25, 25, 50]);
  });

  it('absorbs rounding drift in the last pane', () => {
    const sizes = scaleToHundred([1, 1, 1]);

    expect(roundSize(sizes.reduce((sum, size) => sum + size, 0))).toBe(100);
  });

  it('splits evenly when every size is zero', () => {
    expect(scaleToHundred([0, 0])).toEqual([50, 50]);
  });

  it('returns an empty list for no panes', () => {
    expect(scaleToHundred([])).toEqual([]);
  });
});

describe(normalizeSpecs.name, () => {
  it('applies the default limits', () => {
    const [spec] = normalizeSpecs([{ defaultSize: 100 }]);

    expect(spec).toEqual({ minSize: 10, maxSize: 100, defaultSize: 100, collapsible: false, collapsedSize: 0 });
  });

  it('shares the remaining space between panes without a default', () => {
    const specs = normalizeSpecs([{ defaultSize: 20 }, {}, {}]);

    expect(specs.map((spec) => spec.defaultSize)).toEqual([20, 40, 40]);
  });

  it('scales defaults that do not add up to 100', () => {
    const specs = normalizeSpecs([{ defaultSize: 30 }, { defaultSize: 30 }]);

    expect(specs.map((spec) => spec.defaultSize)).toEqual([50, 50]);
  });

  it('never lets the collapsed size exceed the minimum', () => {
    const [spec] = normalizeSpecs([{ minSize: 10, collapsedSize: 30, collapsible: true }, {}]);

    expect(spec.collapsedSize).toBe(10);
  });
});

describe(createLayout.name, () => {
  it('starts from the defaults', () => {
    expect(createLayout(TWO)).toEqual({ sizes: [30, 70], collapsed: [false, false], restore: [30, 70] });
  });

  it('restores saved sizes', () => {
    expect(createLayout(TWO, [42, 58]).sizes).toEqual([42, 58]);
  });

  it('ignores saved sizes for a different number of panes', () => {
    expect(createLayout(TWO, [20, 30, 50]).sizes).toEqual([30, 70]);
  });

  it('ignores saved sizes that are not numbers', () => {
    expect(createLayout(TWO, [Number.NaN, 50]).sizes).toEqual([30, 70]);
  });

  it('starts collapsed when saved at the collapsed size, and remembers the default to expand to', () => {
    const layout = createLayout(SIDEBAR, [0, 100]);

    expect(layout.collapsed).toEqual([true, false]);
    expect(layout.restore[0]).toBe(25);
  });
});

describe(handleRange.name, () => {
  it('uses the limits of the pane before the handle', () => {
    expect(handleRange(TWO, createLayout(TWO), 0)).toEqual({ min: 20, max: 50 });
  });

  it('respects the minimum of the pane after the handle', () => {
    const specs = normalizeSpecs([
      { defaultSize: 50, minSize: 10 },
      { defaultSize: 50, minSize: 40 },
    ]);

    expect(handleRange(specs, createLayout(specs), 0)).toEqual({ min: 10, max: 60 });
  });

  it('only counts the two panes around the handle', () => {
    expect(handleRange(THREE, createLayout(THREE), 0)).toEqual({ min: 10, max: 40 });
  });

  it('collapses to the current size for a handle that does not exist', () => {
    expect(handleRange(TWO, createLayout(TWO), 1)).toEqual({ min: 70, max: 70 });
  });
});

describe(resizeAtHandle.name, () => {
  it('moves size between the two neighbours', () => {
    const layout = resizeAtHandle(TWO, createLayout(TWO), 0, 40);

    expect(layout.sizes).toEqual([40, 60]);
  });

  it('clamps at the minimum', () => {
    expect(resizeAtHandle(TWO, createLayout(TWO), 0, 5).sizes).toEqual([20, 80]);
  });

  it('clamps at the maximum', () => {
    expect(resizeAtHandle(TWO, createLayout(TWO), 0, 90).sizes).toEqual([50, 50]);
  });

  it('stops where the neighbour reaches its minimum', () => {
    const specs = normalizeSpecs([
      { defaultSize: 50, minSize: 10 },
      { defaultSize: 50, minSize: 40 },
    ]);

    expect(resizeAtHandle(specs, createLayout(specs), 0, 95).sizes).toEqual([60, 40]);
  });

  it('leaves the other panes alone', () => {
    const layout = resizeAtHandle(THREE, createLayout(THREE), 0, 30);

    expect(layout.sizes).toEqual([30, 40, 30]);
  });

  it('returns the same layout when nothing changes', () => {
    const layout = createLayout(TWO);

    expect(resizeAtHandle(TWO, layout, 0, 30)).toBe(layout);
    expect(resizeAtHandle(TWO, layout, 4, 30)).toBe(layout);
  });

  it('does not collapse unless asked to', () => {
    expect(resizeAtHandle(SIDEBAR, createLayout(SIDEBAR), 0, 2).sizes).toEqual([16, 84]);
  });

  it('holds at the minimum until half of it is crossed, then snaps shut', () => {
    const layout = createLayout(SIDEBAR);

    expect(resizeAtHandle(SIDEBAR, layout, 0, 9, true).sizes).toEqual([16, 84]);
    expect(resizeAtHandle(SIDEBAR, layout, 0, 7, true)).toMatchObject({ sizes: [0, 100], collapsed: [true, false] });
  });

  it('remembers the size to return to when a pane snaps shut', () => {
    const layout = resizeAtHandle(SIDEBAR, createLayout(SIDEBAR), 0, 3, true);

    expect(layout.restore[0]).toBe(25);
  });

  it('snaps to a rail size instead of zero when one is set', () => {
    expect(resizeAtHandle(RAIL, createLayout(RAIL), 0, 8, true).sizes).toEqual([6, 94]);
  });

  it('snaps open again when dragged back out', () => {
    const shut = resizeAtHandle(SIDEBAR, createLayout(SIDEBAR), 0, 3, true);

    expect(resizeAtHandle(SIDEBAR, shut, 0, 12, true)).toMatchObject({ sizes: [16, 84], collapsed: [false, false] });
  });

  it('collapses the pane after the handle when it is the collapsible one', () => {
    const layout = resizeAtHandle(THREE, createLayout(THREE), 1, 75, true);

    expect(layout.sizes).toEqual([20, 80, 0]);
    expect(layout.collapsed).toEqual([false, false, true]);
  });

  it('always adds up to 100', () => {
    let layout = createLayout(THREE);
    for (const target of [3, 77, 41.337, 12, 95, 28.5]) {
      layout = resizeAtHandle(THREE, layout, 0, target, true);
      layout = resizeAtHandle(THREE, layout, 1, target, true);
      expect(total(layout)).toBe(100);
    }
  });
});

describe(toggleCollapsed.name, () => {
  it('collapses a collapsible pane and gives the space to its neighbour', () => {
    expect(toggleCollapsed(SIDEBAR, createLayout(SIDEBAR), 0, 1)).toMatchObject({
      sizes: [0, 100],
      collapsed: [true, false],
    });
  });

  it('expands back to the previous size', () => {
    const resized = resizeAtHandle(SIDEBAR, createLayout(SIDEBAR), 0, 34);
    const shut = toggleCollapsed(SIDEBAR, resized, 0, 1);

    expect(toggleCollapsed(SIDEBAR, shut, 0, 1).sizes).toEqual([34, 66]);
  });

  it('collapses to the rail size', () => {
    expect(toggleCollapsed(RAIL, createLayout(RAIL), 0, 1).sizes).toEqual([6, 94]);
  });

  it('does nothing for a pane that is not collapsible', () => {
    const layout = createLayout(TWO);

    expect(toggleCollapsed(TWO, layout, 0, 1)).toBe(layout);
  });

  it('does nothing when the neighbour cannot absorb the space', () => {
    const specs = normalizeSpecs([
      { defaultSize: 40, minSize: 20, collapsible: true },
      { defaultSize: 60, minSize: 20, maxSize: 70 },
    ]);
    const layout = createLayout(specs);

    expect(toggleCollapsed(specs, layout, 0, 1)).toBe(layout);
  });
});

describe(collapseTarget.name, () => {
  it('prefers the pane before the handle', () => {
    expect(collapseTarget(SIDEBAR, 0)).toBe(0);
  });

  it('falls back to the pane after the handle', () => {
    expect(collapseTarget(THREE, 1)).toBe(2);
  });

  it('is null when neither neighbour collapses', () => {
    expect(collapseTarget(TWO, 0)).toBeNull();
  });
});

describe(paneLayoutReducer.name, () => {
  it('drags relative to the sizes at the start of the drag', () => {
    const start = createLayout(TWO);
    const moved = paneLayoutReducer(TWO, start, { type: 'drag', handle: 0, origin: start.sizes, delta: 5 });
    const further = paneLayoutReducer(TWO, moved, { type: 'drag', handle: 0, origin: start.sizes, delta: 12 });

    expect(moved.sizes).toEqual([35, 65]);
    expect(further.sizes).toEqual([42, 58]);
  });

  it('collapses during a drag and restores to the size before it', () => {
    const start = createLayout(SIDEBAR);
    const shut = paneLayoutReducer(SIDEBAR, start, { type: 'drag', handle: 0, origin: start.sizes, delta: -22 });

    expect(shut.collapsed[0]).toBe(true);
    expect(paneLayoutReducer(SIDEBAR, shut, { type: 'toggle', pane: 0, neighbour: 1 }).sizes).toEqual([25, 75]);
  });

  it('ignores a drag whose origin does not match the panes', () => {
    const layout = createLayout(TWO);

    expect(paneLayoutReducer(TWO, layout, { type: 'drag', handle: 0, origin: [50], delta: 5 })).toBe(layout);
  });

  it('returns the same layout when a drag changes nothing', () => {
    const layout = createLayout(TWO);

    expect(paneLayoutReducer(TWO, layout, { type: 'drag', handle: 0, origin: layout.sizes, delta: 0 })).toBe(layout);
  });

  it('nudges by a step and stops at the limits', () => {
    let layout = createLayout(TWO);
    layout = paneLayoutReducer(TWO, layout, { type: 'nudge', handle: 0, delta: 2 });
    expect(layout.sizes).toEqual([32, 68]);

    layout = paneLayoutReducer(TWO, layout, { type: 'nudge', handle: 0, delta: -50 });
    expect(layout.sizes).toEqual([20, 80]);
  });

  it('never collapses on a nudge', () => {
    const layout = paneLayoutReducer(SIDEBAR, createLayout(SIDEBAR), { type: 'nudge', handle: 0, delta: -40 });

    expect(layout).toMatchObject({ sizes: [16, 84], collapsed: [false, false] });
  });

  it('expands a collapsed pane to its minimum on an outward nudge', () => {
    const shut = toggleCollapsed(SIDEBAR, createLayout(SIDEBAR), 0, 1);

    expect(paneLayoutReducer(SIDEBAR, shut, { type: 'nudge', handle: 0, delta: 2 }).sizes).toEqual([16, 84]);
  });

  it('jumps to the limits', () => {
    const layout = createLayout(TWO);

    expect(paneLayoutReducer(TWO, layout, { type: 'limit', handle: 0, to: 'min' }).sizes).toEqual([20, 80]);
    expect(paneLayoutReducer(TWO, layout, { type: 'limit', handle: 0, to: 'max' }).sizes).toEqual([50, 50]);
  });

  it('toggles collapse', () => {
    const layout = paneLayoutReducer(SIDEBAR, createLayout(SIDEBAR), { type: 'toggle', pane: 0, neighbour: 1 });

    expect(layout.collapsed).toEqual([true, false]);
  });

  it('sets a saved layout and ignores one of the wrong length', () => {
    const layout = createLayout(TWO);

    expect(paneLayoutReducer(TWO, layout, { type: 'set', sizes: [45, 55] }).sizes).toEqual([45, 55]);
    expect(paneLayoutReducer(TWO, layout, { type: 'set', sizes: [100] })).toBe(layout);
  });

  it('resets to the defaults', () => {
    const moved = resizeAtHandle(TWO, createLayout(TWO), 0, 44);

    expect(paneLayoutReducer(TWO, moved, { type: 'reset' }).sizes).toEqual([30, 70]);
  });
});
