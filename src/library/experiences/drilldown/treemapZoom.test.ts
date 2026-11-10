import { fixtureTree } from './drilldownFixture';
import { TREEMAP_FULL, layoutChildren, zoomOrigin } from './treemapZoom';

const tree = fixtureTree();

describe(layoutChildren.name, () => {
  it('sizes children by the metric and fills the canvas', () => {
    const rects = layoutChildren(tree.root, 'downtimeHours', 0);

    expect(rects.map((rect) => rect.id)).toEqual(['area-b', 'area-a']);
    expect(rects.reduce((sum, rect) => sum + rect.share, 0)).toBeCloseTo(1);
    expect(rects[0]?.share).toBeCloseTo(47 / 49);
  });
});

describe(zoomOrigin.name, () => {
  it('starts from the clicked rectangle when going in', () => {
    const rect = layoutChildren(tree.root, 'downtimeHours', 0.06).find((candidate) => candidate.id === 'area-b');

    expect(zoomOrigin(tree, ['site'], ['site', 'area-b'], 'downtimeHours', 0.06)).toEqual({ x: rect?.x, y: rect?.y, width: rect?.width, height: rect?.height });
  });

  it('starts blown up around the rectangle you came from when going up', () => {
    const origin = zoomOrigin(tree, ['site', 'area-b'], ['site'], 'downtimeHours', 0.06);

    expect(origin?.width).toBeGreaterThan(TREEMAP_FULL.width);
    expect(origin?.x).toBeLessThanOrEqual(0);
  });

  it('works across more than one level', () => {
    expect(zoomOrigin(tree, ['site'], ['site', 'area-b', 'comp-1'], 'downtimeHours', 0.06)).not.toBeNull();
    expect(zoomOrigin(tree, ['site', 'area-b', 'comp-1'], ['site'], 'downtimeHours', 0.06)).not.toBeNull();
  });

  it('has no origin between unrelated paths or the same path', () => {
    expect(zoomOrigin(tree, ['site', 'area-a'], ['site', 'area-b'], 'downtimeHours', 0.06)).toBeNull();
    expect(zoomOrigin(tree, ['site'], ['site'], 'downtimeHours', 0.06)).toBeNull();
  });
});
