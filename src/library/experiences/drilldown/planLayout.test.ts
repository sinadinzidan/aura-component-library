import { FIXTURE_INPUT, fixtureTree } from './drilldownFixture';
import { buildHierarchy } from './hierarchy';
import { PLAN_ZOOM, SENSOR_ANCHOR_X, between, layoutPlan, levelScales, linkSegment, mixViewport, project, projectRect, reveal, viewportFor, viewportScale } from './planLayout';
import type { PlanRect } from './planLayout';

const tree = fixtureTree();
const layout = layoutPlan(tree);
const place = (id: string) => {
  const found = layout.places.get(id);
  if (!found) throw new Error(`no place for ${id}`);
  return found;
};
const inside = (inner: PlanRect, outer: PlanRect): boolean =>
  inner.x >= outer.x - 1e-6 && inner.y >= outer.y - 1e-6 && inner.x + inner.width <= outer.x + outer.width + 1e-6 && inner.y + inner.height <= outer.y + outer.height + 1e-6;

describe(layoutPlan.name, () => {
  it('places every node of the tree', () => {
    expect(layout.places.size).toBe(tree.byId.size);
  });

  it('gives the site the whole world', () => {
    expect(place('site').rect).toEqual({ x: 0, y: 0, width: 1000, height: 600 });
  });

  it('lays areas out as equal blocks that do not overlap', () => {
    const a = place('area-a').rect;
    const b = place('area-b').rect;

    expect(a.width).toBeCloseTo(b.width);
    expect(a.height).toBeCloseTo(b.height);
    expect(a.x + a.width).toBeLessThan(b.x);
    expect(inside(a, place('site').rect)).toBe(true);
  });

  it('keeps equipment slots inside their area, below the title band', () => {
    const block = place('area-b').rect;

    expect(inside(place('comp-1').rect, block)).toBe(true);
    expect(place('comp-1').rect.y).toBeCloseTo(block.y + 44);
    expect(place('comp-1').rect.x + place('comp-1').rect.width).toBeCloseTo(place('comp-3').rect.x);
  });

  it('centres a short row of equipment in its area', () => {
    const block = place('area-a').rect;

    expect(place('sep').cx).toBeCloseTo(block.x + block.width / 2);
  });

  it('puts measurement points left and right of their machine, inside its slot', () => {
    const machine = place('comp-1');

    expect(place('pt')).toMatchObject({ side: 'left', cx: machine.cx - 30, cy: machine.cy });
    expect(place('tt')).toMatchObject({ side: 'right', cx: machine.cx + 30, cy: machine.cy });
    expect(inside(place('pt').rect, machine.rect)).toBe(true);
    expect(inside(place('tt').rect, machine.rect)).toBe(true);
  });

  it('respects a custom world size', () => {
    const custom = layoutPlan(tree, { width: 500, height: 300, margin: 10, gap: 10 });

    expect(custom.world).toEqual({ width: 500, height: 300 });
    expect(custom.places.get('area-a')?.rect).toMatchObject({ x: 10, y: 10, width: 235 });
  });
});

describe(viewportFor.name, () => {
  it('shows the whole world for the site', () => {
    expect(viewportFor(layout, tree.root)).toEqual({ x: 0, y: 0, width: 1000, height: 600 });
  });

  it('centres on an area, at the area zoom when the block fits', () => {
    const viewport = viewportFor(layout, { id: 'area-b', level: 'area' });
    const fourAreas = buildHierarchy({
      ...FIXTURE_INPUT,
      assets: [
        ...FIXTURE_INPUT.assets,
        { id: 'area-c', tag: 'NK-27', name: 'Gas export', type: 'area', parentId: 'site', state: 'running', health: 'good', healthScore: 96 },
        { id: 'area-d', tag: 'NK-40', name: 'Cooling water', type: 'system', parentId: 'site', state: 'running', health: 'good', healthScore: 89 },
      ],
    });

    expect(viewportFor(layoutPlan(fourAreas), { id: 'area-b', level: 'area' }).width).toBeCloseTo(1000 / PLAN_ZOOM.area);
    expect(viewport.width).toBeGreaterThan(1000 / PLAN_ZOOM.area);
    expect(viewport.x + viewport.width / 2).toBeCloseTo(place('area-b').cx);
    expect(viewport.y + viewport.height / 2).toBeCloseTo(place('area-b').cy);
  });

  it('fits the whole area block at the area zoom', () => {
    expect(inside(place('area-b').rect, viewportFor(layout, { id: 'area-b', level: 'area' }))).toBe(true);
  });

  it('fits the whole equipment slot at the equipment zoom', () => {
    expect(inside(place('comp-1').rect, viewportFor(layout, { id: 'comp-1', level: 'equipment' }))).toBe(true);
  });

  it('puts a selected sensor left of centre to leave room for its card', () => {
    const viewport = viewportFor(layout, { id: 'tt', level: 'sensor' });

    expect((place('tt').cx - viewport.x) / viewport.width).toBeCloseTo(SENSOR_ANCHOR_X);
    expect(viewport.y + viewport.height / 2).toBeCloseTo(place('tt').cy);
  });

  it('falls back to the whole world for an unknown node', () => {
    expect(viewportFor(layout, { id: 'nope', level: 'area' })).toEqual({ x: 0, y: 0, width: 1000, height: 600 });
  });
});

describe('projection', () => {
  const viewport = { x: 100, y: 50, width: 500, height: 300 };

  it('reports the zoom factor of a viewport', () => {
    expect(viewportScale(layout, viewport)).toBe(2);
  });

  it('projects a world point into view units', () => {
    expect(project(layout, viewport, 100, 50)).toEqual({ x: 0, y: 0 });
    expect(project(layout, viewport, 350, 200)).toEqual({ x: 500, y: 300 });
  });

  it('projects a rectangle', () => {
    expect(projectRect(layout, viewport, { x: 150, y: 100, width: 50, height: 20 })).toEqual({ x: 100, y: 100, width: 100, height: 40 });
  });
});

describe(mixViewport.name, () => {
  const from = { x: 0, y: 0, width: 1000, height: 600 };
  const to = { x: 400, y: 200, width: 250, height: 150 };

  it('returns the ends exactly', () => {
    expect(mixViewport(from, to, 0)).toBe(from);
    expect(mixViewport(from, to, 1)).toBe(to);
  });

  it('zooms geometrically: half way is the geometric mean of the widths', () => {
    expect(mixViewport(from, to, 0.5).width).toBeCloseTo(500);
    expect(mixViewport(from, to, 0.5).height).toBeCloseTo(300);
  });

  it('keeps the target inside the viewport all the way', () => {
    for (const progress of [0.1, 0.3, 0.5, 0.7, 0.9]) expect(inside(to, mixViewport(from, to, progress))).toBe(true);
  });

  it('pans linearly between viewports of the same size', () => {
    expect(mixViewport({ ...to, x: 0 }, to, 0.25)).toMatchObject({ x: 100, width: 250 });
  });
});

describe(reveal.name, () => {
  it('ramps from 0 to 1 between two zoom factors', () => {
    expect(reveal(1, 1.4, 2)).toBe(0);
    expect(reveal(1.7, 1.4, 2)).toBeCloseTo(0.5);
    expect(reveal(3, 1.4, 2)).toBe(1);
  });

  it('is a step when both ends are the same', () => {
    expect(reveal(1.9, 2, 2)).toBe(0);
    expect(reveal(2, 2, 2)).toBe(1);
  });
});

describe(linkSegment.name, () => {
  it('runs between the facing edges of two blocks side by side', () => {
    const segment = linkSegment({ x: 0, y: 0, width: 100, height: 60 }, { x: 140, y: 0, width: 100, height: 60 });

    expect(segment).toEqual({ x1: 100, y1: 30, x2: 140, y2: 30 });
  });

  it('runs between the facing edges of two stacked blocks', () => {
    const segment = linkSegment({ x: 0, y: 0, width: 100, height: 60 }, { x: 0, y: 100, width: 100, height: 60 });

    expect(segment).toEqual({ x1: 50, y1: 60, x2: 50, y2: 100 });
  });
});

describe(levelScales.name, () => {
  it('reports the zoom at which every area and every machine is framed', () => {
    const scales = levelScales(layout, tree);

    expect(scales.area).toBeCloseTo(1000 / viewportFor(layout, { id: 'area-a', level: 'area' }).width);
    expect(scales.equipment).toBeGreaterThanOrEqual(scales.area);
    expect(scales.sensor).toBe(PLAN_ZOOM.sensor);
  });

  it('never orders the levels backwards', () => {
    const scales = levelScales(layoutPlan(tree, { width: 300, height: 900 }), tree);

    expect(scales.area).toBeLessThanOrEqual(scales.equipment);
    expect(scales.equipment).toBeLessThanOrEqual(scales.sensor);
  });
});

describe(between.name, () => {
  it('interpolates between two zoom factors', () => {
    expect(between(1, 2, 0.25)).toBe(1.25);
    expect(between(2, 5, 1)).toBe(5);
  });
});
