import { clusterMarkers } from './clustering';
import { blockGrid, chevronsAlong, graticule, graticuleStep, outlinePaths, pathThrough } from './geoPaths';
import { createMapState, mapReducer } from './mapReducer';
import type { MapState } from './mapReducer';
import { fitPoints, fromScreen, isInFrame, kilometresPerPixel, panBy, toScreen, zoomAbout, zoomCentered, zoomLevel, MAX_SCALE, MIN_SCALE } from './mapView';
import type { MapView, Size } from './mapView';
import { MAX_LATITUDE, formatLatLong, fromPlane, inverseMercatorY, mercatorY, toPlane, wrapLongitude } from './projection';
import type { ProjectionId } from './projection';
import { formatDistance, niceLengths, scaleBar } from './scaleBar';

const SIZE: Size = { width: 800, height: 500 };
const NORWAY: MapView = { center: { lat: 63, lon: 8 }, scale: 3000 };
const BOTH: ProjectionId[] = ['mercator', 'equal-area'];

describe('projection', () => {
  it.each([
    [0, 0],
    [190, -170],
    [-190, 170],
    [180, -180],
    [540, -180],
    [7.2, 7.2],
  ])('wraps longitude %d to %d', (lon, wrapped) => {
    expect(wrapLongitude(lon)).toBeCloseTo(wrapped);
  });

  it('puts the centre on the origin in both projections', () => {
    for (const projection of BOTH) {
      const plane = toPlane(projection, { lat: 63, lon: 8 }, { lat: 63, lon: 8 });
      expect(plane?.x).toBeCloseTo(0);
      expect(plane?.y).toBeCloseTo(0);
    }
  });

  it('puts east to the right and north up', () => {
    for (const projection of BOTH) {
      const east = toPlane(projection, { lat: 63, lon: 18 }, { lat: 63, lon: 8 });
      const north = toPlane(projection, { lat: 70, lon: 8 }, { lat: 63, lon: 8 });
      expect(east?.x).toBeGreaterThan(0);
      expect(north?.y).toBeGreaterThan(0);
    }
  });

  it('stretches Mercator toward the poles', () => {
    expect(mercatorY(60)).toBeGreaterThan(mercatorY(30) * 2);
    expect(mercatorY(0)).toBeCloseTo(0);
    expect(mercatorY(-45)).toBeCloseTo(-mercatorY(45));
  });

  it('clamps Mercator at its latitude limit', () => {
    expect(mercatorY(90)).toBeCloseTo(mercatorY(MAX_LATITUDE));
  });

  it('inverts the Mercator latitude', () => {
    for (const lat of [-80, -33, 0, 12.5, 65.3, 80]) expect(inverseMercatorY(mercatorY(lat))).toBeCloseTo(lat, 6);
  });

  it.each(BOTH)('round-trips places through %s', (projection) => {
    const center = { lat: 63, lon: 8 };
    for (const place of [{ lat: 65.3, lon: 7.2 }, { lat: 51.95, lon: 4.1 }, { lat: 38.4, lon: -76.4 }, { lat: 70.7, lon: 23.6 }, { lat: 0, lon: 0 }]) {
      const plane = toPlane(projection, place, center);
      if (!plane) throw new Error('expected a plane point');
      const back = fromPlane(projection, plane, center);
      expect(back.lat).toBeCloseTo(place.lat, 5);
      expect(back.lon).toBeCloseTo(place.lon, 5);
    }
  });

  it('cannot show the antipode in equal-area', () => {
    expect(toPlane('equal-area', { lat: -63, lon: -172 }, { lat: 63, lon: 8 })).toBeNull();
  });

  it('keeps equal-area areas equal: a one degree cell has the same area near and far from the centre', () => {
    const cell = (lat: number, lon: number) => {
      const corners = [
        [lat, lon],
        [lat, lon + 0.5],
        [lat + 0.5, lon + 0.5],
        [lat + 0.5, lon],
      ].map(([a, b]) => toPlane('equal-area', { lat: a, lon: b }, { lat: 0, lon: 0 }));
      if (corners.some((corner) => corner === null)) throw new Error('visible');
      const points = corners.flatMap((corner) => (corner ? [corner] : []));
      const shoelace = points.reduce((sum, point, index) => sum + point.x * points[(index + 1) % 4].y - points[(index + 1) % 4].x * point.y, 0);
      return Math.abs(shoelace) / 2;
    };
    const ratio = cell(0, 0) / cell(60, 0);
    // Spherical area of a 0.5 by 0.5 degree cell shrinks with cos(latitude): the projected area must follow.
    expect(ratio).toBeCloseTo(1 / Math.cos((60.25 * Math.PI) / 180), 1);
  });

  it('clamps positions off the equal-area disc to its edge', () => {
    const edge = fromPlane('equal-area', { x: 5, y: 0 }, { lat: 0, lon: 0 });
    expect(edge.lat).toBeCloseTo(0);
    expect(Math.abs(edge.lon)).toBeCloseTo(180);
  });

  it('formats positions', () => {
    expect(formatLatLong({ lat: 65.3, lon: 7.2 })).toBe('65.30° N, 7.20° E');
    expect(formatLatLong({ lat: -33.5, lon: -70.66 }, 1)).toBe('33.5° S, 70.7° W');
  });
});

describe('map view', () => {
  it.each(BOTH)('puts the centre in the middle of the frame in %s', (projection) => {
    const point = toScreen(projection, NORWAY, SIZE, NORWAY.center);
    expect(point?.x).toBeCloseTo(400);
    expect(point?.y).toBeCloseTo(250);
  });

  it.each(BOTH)('finds the place under a pixel in %s', (projection) => {
    const place = fromScreen(projection, NORWAY, SIZE, { x: 400, y: 250 });
    expect(place.lat).toBeCloseTo(63, 5);
    const there = toScreen(projection, NORWAY, SIZE, { lat: 65.3, lon: 7.2 });
    if (!there) throw new Error('visible');
    expect(fromScreen(projection, NORWAY, SIZE, there).lat).toBeCloseTo(65.3, 5);
    expect(fromScreen(projection, NORWAY, SIZE, there).lon).toBeCloseTo(7.2, 5);
  });

  it.each(BOTH)('moves the map with the pointer when dragging in %s', (projection) => {
    const before = toScreen(projection, NORWAY, SIZE, { lat: 65.3, lon: 7.2 });
    const dragged = panBy(projection, NORWAY, 60, -30);
    const after = toScreen(projection, dragged, SIZE, { lat: 65.3, lon: 7.2 });

    expect((after?.x ?? 0) - (before?.x ?? 0)).toBeCloseTo(60, 0);
    expect((after?.y ?? 0) - (before?.y ?? 0)).toBeCloseTo(-30, 0);
  });

  it.each(BOTH)('keeps the place under the pointer fixed when zooming in %s', (projection) => {
    const pointer = { x: 610, y: 140 };
    const anchor = fromScreen(projection, NORWAY, SIZE, pointer);

    for (const factor of [2, 0.5, 1.37]) {
      const zoomed = zoomAbout(projection, NORWAY, SIZE, pointer, factor);
      const landed = toScreen(projection, zoomed, SIZE, anchor);
      expect(landed?.x).toBeCloseTo(pointer.x, 1);
      expect(landed?.y).toBeCloseTo(pointer.y, 1);
      expect(zoomed.scale).toBeCloseTo(NORWAY.scale * factor);
    }
  });

  it('keeps the centre when zooming about the centre', () => {
    const zoomed = zoomCentered('mercator', NORWAY, SIZE, 2);
    expect(zoomed.center.lat).toBeCloseTo(63, 6);
    expect(zoomed.center.lon).toBeCloseTo(8, 6);
  });

  it('never zooms past its limits', () => {
    expect(zoomAbout('mercator', { ...NORWAY, scale: MAX_SCALE }, SIZE, { x: 0, y: 0 }, 2)).toEqual({ ...NORWAY, scale: MAX_SCALE });
    expect(zoomAbout('mercator', { ...NORWAY, scale: MIN_SCALE }, SIZE, { x: 0, y: 0 }, 0.5).scale).toBe(MIN_SCALE);
    expect(zoomAbout('mercator', NORWAY, SIZE, { x: 0, y: 0 }, 1e9).scale).toBe(MAX_SCALE);
  });

  it('counts a zoom level that doubles with the scale', () => {
    expect(zoomLevel({ ...NORWAY, scale: MIN_SCALE })).toBe(1);
    expect(zoomLevel({ ...NORWAY, scale: MIN_SCALE * 8 })).toBe(4);
  });

  it.each(BOTH)('fits every point inside the frame with its padding in %s', (projection) => {
    const points = [
      { lat: 65.3, lon: 7.2 },
      { lat: 70.7, lon: 23.6 },
      { lat: 56.3, lon: 3.4 },
      { lat: 73.4, lon: 22.4 },
    ];
    const view = fitPoints(projection, SIZE, points, 48);

    for (const point of points) {
      const on = toScreen(projection, view, SIZE, point);
      if (!on) throw new Error('visible');
      expect(on.x).toBeGreaterThanOrEqual(47);
      expect(on.x).toBeLessThanOrEqual(SIZE.width - 47);
      expect(on.y).toBeGreaterThanOrEqual(47);
      expect(on.y).toBeLessThanOrEqual(SIZE.height - 47);
    }
  });

  it('centres a single point at a fixed zoom and handles none', () => {
    expect(fitPoints('mercator', SIZE, [{ lat: 60, lon: 5 }])).toEqual({ center: { lat: 60, lon: 5 }, scale: 6000 });
    expect(fitPoints('mercator', SIZE, []).scale).toBe(MIN_SCALE);
  });

  it('fits points across the antimeridian as one group', () => {
    const view = fitPoints('mercator', SIZE, [{ lat: 60, lon: 175 }, { lat: 62, lon: -175 }]);
    expect(Math.abs(wrapLongitude(view.center.lon - 180))).toBeLessThan(1);
  });

  it('tests whether a pixel is in the frame', () => {
    expect(isInFrame(SIZE, { x: 10, y: 10 })).toBe(true);
    expect(isInFrame(SIZE, { x: -10, y: 10 })).toBe(false);
    expect(isInFrame(SIZE, { x: -10, y: 10 }, 20)).toBe(true);
  });
});

describe('scale bar', () => {
  it('measures ground distance per pixel and shrinks it with latitude in Mercator', () => {
    const equator = kilometresPerPixel('mercator', { center: { lat: 0, lon: 0 }, scale: 1000 }, SIZE);
    const sixty = kilometresPerPixel('mercator', { center: { lat: 60, lon: 0 }, scale: 1000 }, SIZE);

    expect(equator).toBeCloseTo(6.371, 2);
    expect(sixty).toBeCloseTo(equator / 2, 2);
  });

  it('matches true distance near the centre of an equal-area map', () => {
    expect(kilometresPerPixel('equal-area', { center: { lat: 63, lon: 8 }, scale: 1000 }, SIZE)).toBeCloseTo(6.371, 1);
  });

  it('lists 1, 2 and 5 times powers of ten', () => {
    expect(niceLengths(60)).toEqual(expect.arrayContaining([0.5, 1, 2, 5, 10, 20, 50]));
    expect(niceLengths(60)).not.toContain(100);
    expect(niceLengths(60)).toEqual([...niceLengths(60)].sort((a, b) => a - b));
  });

  it('picks the longest bar that fits and sizes it in pixels', () => {
    const bar = scaleBar(3, 120);
    expect(bar).toEqual({ km: 100, pixels: 100 / 3, label: '100 km' });
    expect(bar && bar.pixels).toBeLessThanOrEqual(120);
  });

  it('uses metres for short bars and separators for long ones', () => {
    expect(scaleBar(0.01, 100)?.label).toBe('1 km');
    expect(scaleBar(0.002, 100)?.label).toBe('200 m');
    expect(formatDistance(2000)).toBe('2,000 km');
    expect(formatDistance(0.5)).toBe('500 m');
  });

  it('gives no bar for nonsense input', () => {
    expect(scaleBar(0, 100)).toBeNull();
    expect(scaleBar(Number.NaN, 100)).toBeNull();
    expect(scaleBar(1, 0)).toBeNull();
  });

  it('is correct for the latitude shown: a bar of 100 km is wider at 60° than at the equator', () => {
    const equator = scaleBar(kilometresPerPixel('mercator', { center: { lat: 0, lon: 0 }, scale: 2000 }, SIZE), 200);
    const sixty = scaleBar(kilometresPerPixel('mercator', { center: { lat: 60, lon: 0 }, scale: 2000 }, SIZE), 200);
    expect(equator?.km).toBe(20);
    expect(sixty?.km).toBe(10);
  });
});

describe(clusterMarkers.name, () => {
  const marker = (id: string, x: number, y: number, weight = 1) => ({ id, x, y, weight });

  it('keeps distant markers apart', () => {
    expect(clusterMarkers([marker('a', 0, 0), marker('b', 200, 0)], 30).map((cluster) => cluster.memberIds)).toEqual([['a'], ['b']]);
  });

  it('joins markers within the radius, inclusive', () => {
    const clusters = clusterMarkers([marker('a', 0, 0), marker('b', 30, 0), marker('c', 31, 0)], 30);
    expect(clusters.map((cluster) => [...cluster.memberIds].sort())).toEqual([['a', 'b'], ['c']]);
  });

  it('seeds from the heaviest marker and weights the centre toward it', () => {
    const [cluster] = clusterMarkers([marker('small', 0, 0, 1), marker('big', 20, 0, 3)], 30);
    expect(cluster.memberIds[0]).toBe('big');
    expect(cluster.x).toBeCloseTo(15);
  });

  it('names a single marker by its id and a group by its members', () => {
    const clusters = clusterMarkers([marker('b', 0, 0), marker('a', 5, 0), marker('z', 500, 0)], 20);
    expect(clusters.map((cluster) => cluster.id)).toEqual(['cluster:a+b', 'z']);
  });

  it('does not chain: a marker joins only the seed it is near', () => {
    const clusters = clusterMarkers([marker('a', 0, 0, 3), marker('b', 25, 0, 2), marker('c', 50, 0, 1)], 30);
    expect(clusters.map((cluster) => [...cluster.memberIds].sort())).toEqual([['a', 'b'], ['c']]);
  });

  it('assigns every marker to exactly one cluster', () => {
    const items = Array.from({ length: 40 }, (_, index) => marker(`m${index}`, (index * 37) % 200, (index * 91) % 120, (index % 5) + 1));
    const ids = clusterMarkers(items, 25).flatMap((cluster) => cluster.memberIds);
    expect(ids.sort()).toEqual(items.map((item) => item.id).sort());
  });

  it('is deterministic whatever the input order', () => {
    const items = [marker('a', 0, 0), marker('b', 10, 0), marker('c', 300, 0)];
    expect(clusterMarkers([...items].reverse(), 30)).toEqual(clusterMarkers(items, 30));
  });

  it('splits as the radius shrinks', () => {
    const items = [marker('a', 0, 0), marker('b', 20, 0)];
    expect(clusterMarkers(items, 30)).toHaveLength(1);
    expect(clusterMarkers(items, 10)).toHaveLength(2);
  });

  it('returns nothing for nothing', () => {
    expect(clusterMarkers([], 30)).toEqual([]);
  });
});

describe('paths', () => {
  it('builds a path and lifts the pen at gaps', () => {
    expect(pathThrough([{ x: 1, y: 2 }, { x: 3, y: 4 }, null, { x: 5, y: 6 }])).toBe('M1 2L3 4M5 6');
    expect(pathThrough([{ x: 1, y: 2 }, { x: 3, y: 4 }], true)).toBe('M1 2L3 4Z');
    expect(pathThrough([])).toBe('');
    expect(pathThrough([null], true)).toBe('');
  });

  it('draws Mercator outlines near the centre once and far copies only when visible', () => {
    const square = [{ lat: 60, lon: 5 }, { lat: 60, lon: 10 }, { lat: 65, lon: 10 }, { lat: 65, lon: 5 }];
    const paths = outlinePaths('mercator', NORWAY, SIZE, square, true);
    expect(paths.some((path) => path.filled && path.d.endsWith('Z'))).toBe(true);
  });

  it('closes a shape that crosses the antimeridian in Mercator', () => {
    const across = [{ lat: 60, lon: 170 }, { lat: 60, lon: 190 }, { lat: 66, lon: 190 }, { lat: 66, lon: 170 }];
    const paths = outlinePaths('mercator', { center: { lat: 63, lon: 180 }, scale: 800 }, SIZE, across, true);
    expect(paths.filter((path) => path.filled)).not.toHaveLength(0);
    expect(paths[0].d).toMatch(/^M/);
  });

  it('draws equal-area outlines as one curved shape', () => {
    const square = [{ lat: 60, lon: 5 }, { lat: 60, lon: 10 }, { lat: 65, lon: 10 }, { lat: 65, lon: 5 }];
    const [path] = outlinePaths('equal-area', NORWAY, SIZE, square, true);
    expect(path.filled).toBe(true);
    expect((path.d.match(/L/g) ?? []).length).toBeGreaterThan(4);
  });

  it('does not fill a shape that straddles the rim of the equal-area disc', () => {
    const rim = [{ lat: 60, lon: 170 }, { lat: 60, lon: -170 }, { lat: 70, lon: -170 }, { lat: 70, lon: 170 }];
    const paths = outlinePaths('equal-area', { center: { lat: 63, lon: 8 }, scale: 400 }, SIZE, rim, true);
    expect(paths.every((path) => !path.filled)).toBe(true);
  });
});

describe('graticule', () => {
  it('picks a coarser step when zoomed out', () => {
    expect(graticuleStep(60)).toBeGreaterThan(graticuleStep(3000));
    expect(graticuleStep(60000)).toBe(0.5);
  });

  it('keeps lines at least about 64 pixels apart', () => {
    for (const scale of [100, 400, 1500, 6000]) expect((graticuleStep(scale) * scale * Math.PI) / 180).toBeGreaterThanOrEqual(63);
  });

  it('draws meridians and parallels at multiples of the step', () => {
    const lines = graticule('mercator', NORWAY, SIZE, 10, { south: 50, north: 70, west: -10, east: 30 });
    const meridians = lines.filter((line) => line.kind === 'meridian').map((line) => line.degrees);
    const parallels = lines.filter((line) => line.kind === 'parallel').map((line) => line.degrees);

    expect(meridians).toEqual([-10, 0, 10, 20, 30]);
    expect(parallels).toEqual([50, 60, 70]);
    expect(lines.every((line) => line.d.startsWith('M'))).toBe(true);
  });
});

describe(chevronsAlong.name, () => {
  it('spaces marks evenly along a straight line and points them along it', () => {
    const marks = chevronsAlong([{ x: 0, y: 0 }, { x: 100, y: 0 }], 40);
    expect(marks.map((mark) => Math.round(mark.x))).toEqual([20, 60, 100]);
    expect(marks.every((mark) => mark.angle === 0)).toBe(true);
  });

  it('points down-right for a line that goes down and right', () => {
    const [mark] = chevronsAlong([{ x: 0, y: 0 }, { x: 50, y: 50 }], 40);
    expect(mark.angle).toBeCloseTo(45);
  });

  it('carries the spacing over a bend', () => {
    const marks = chevronsAlong([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 60 }], 40);
    expect(marks.map((mark) => [Math.round(mark.x), Math.round(mark.y)])).toEqual([[20, 0], [30, 30]]);
  });

  it('skips gaps and marks outside the frame', () => {
    expect(chevronsAlong([{ x: 0, y: 0 }, null, { x: 100, y: 0 }], 10)).toEqual([]);
    expect(chevronsAlong([{ x: -100, y: 5 }, { x: 100, y: 5 }], 50, { width: 40, height: 40 }).every((mark) => mark.x >= 0 && mark.x <= 40)).toBe(true);
  });
});

describe(blockGrid.name, () => {
  const cells = blockGrid({ south: 58, north: 60, west: 2, east: 5 }, 1, 0.5);

  it('covers the box with cells of the given size', () => {
    expect(cells).toHaveLength(12);
    expect(cells[0]).toMatchObject({ id: 'B1', north: 60, south: 59.5, west: 2, east: 3 });
    expect(cells[11]).toMatchObject({ id: 'B12', north: 58.5, south: 58, west: 4, east: 5 });
  });

  it('numbers cells row by row from the north west with unique ids', () => {
    expect(new Set(cells.map((cell) => cell.id)).size).toBe(12);
    expect(cells[3]).toMatchObject({ row: 1, column: 0, id: 'B4' });
  });
});

describe(mapReducer.name, () => {
  const start = (): MapState => createMapState(NORWAY, SIZE);
  const run = (state: MapState, ...actions: Parameters<typeof mapReducer>[1][]) => actions.reduce(mapReducer, state);

  it('starts with sites, pipelines and export routes on and licence blocks off', () => {
    expect(start().layers).toEqual({ sites: true, pipelines: true, exports: true, blocks: false });
  });

  it('pans by the distance dragged from where the press began, not step by step', () => {
    const once = run(start(), { type: 'drag-start', point: { x: 100, y: 100 } }, { type: 'drag-move', point: { x: 160, y: 80 } });
    const twice = run(start(), { type: 'drag-start', point: { x: 100, y: 100 } }, { type: 'drag-move', point: { x: 130, y: 90 } }, { type: 'drag-move', point: { x: 160, y: 80 } });

    expect(twice.view).toEqual(once.view);
    expect(once.view.center.lon).toBeLessThan(NORWAY.center.lon);
  });

  it('treats a press that barely moves as a click', () => {
    const state = run(start(), { type: 'drag-start', point: { x: 100, y: 100 } }, { type: 'drag-move', point: { x: 102, y: 101 } });

    expect(state.view).toBe(NORWAY);
    expect(state.drag?.moved).toBe(false);
  });

  it('records one history step per drag', () => {
    const state = run(start(), { type: 'drag-start', point: { x: 0, y: 0 } }, { type: 'drag-move', point: { x: 50, y: 0 } }, { type: 'drag-move', point: { x: 90, y: 0 } }, { type: 'drag-end' });

    expect(state.past).toEqual([NORWAY]);
    expect(state.drag).toBeNull();
  });

  it('records no history for a click', () => {
    expect(run(start(), { type: 'drag-start', point: { x: 0, y: 0 } }, { type: 'drag-end' }).past).toEqual([]);
  });

  it('ignores moves without a press', () => {
    const state = start();
    expect(mapReducer(state, { type: 'drag-move', point: { x: 5, y: 5 } })).toBe(state);
  });

  it('zooms about a pointer without adding history, and about the centre with it', () => {
    const wheel = run(start(), { type: 'zoom-at', point: { x: 600, y: 100 }, factor: 1.5 });
    const button = run(start(), { type: 'zoom-step', factor: 2 });

    expect(wheel.view.scale).toBeCloseTo(4500);
    expect(wheel.past).toEqual([]);
    expect(button.view.scale).toBe(6000);
    expect(button.past).toEqual([NORWAY]);
  });

  it('does not record a zoom that changes nothing', () => {
    const maxed = createMapState({ ...NORWAY, scale: MAX_SCALE }, SIZE);
    expect(mapReducer(maxed, { type: 'zoom-step', factor: 2 })).toBe(maxed);
  });

  it('pans with the keyboard in the direction of the arrow', () => {
    const east = run(start(), { type: 'pan-key', dx: 100, dy: 0 });
    const north = run(start(), { type: 'pan-key', dx: 0, dy: -100 });

    expect(east.view.center.lon).toBeGreaterThan(8);
    expect(north.view.center.lat).toBeGreaterThan(63);
    expect(east.past).toHaveLength(1);
  });

  it('fits the given points and ignores an empty list', () => {
    const fitted = run(start(), { type: 'fit', points: [{ lat: 56, lon: 3 }, { lat: 73, lon: 23 }] });
    const same = start();

    expect(fitted.view).not.toEqual(NORWAY);
    expect(mapReducer(same, { type: 'fit', points: [] })).toBe(same);
  });

  it('goes back through earlier views, and stops at the first', () => {
    let state = run(start(), { type: 'zoom-step', factor: 2 }, { type: 'zoom-step', factor: 2 });
    state = run(state, { type: 'back' });
    expect(state.view.scale).toBe(6000);
    state = run(state, { type: 'back' });
    expect(state.view).toEqual(NORWAY);
    expect(mapReducer(state, { type: 'back' })).toBe(state);
  });

  it('returns to the starting view', () => {
    const state = run(start(), { type: 'zoom-step', factor: 4 }, { type: 'home' });
    expect(state.view).toEqual(NORWAY);
  });

  it('caps its history', () => {
    let state = start();
    for (let index = 0; index < 30; index += 1) state = run(state, { type: 'pan-key', dx: 5, dy: 0 });
    expect(state.past).toHaveLength(20);
  });

  it('switches projection, keeping the view, as one history step', () => {
    const state = run(start(), { type: 'projection', projection: 'equal-area' });

    expect(state.projection).toBe('equal-area');
    expect(state.view).toBe(NORWAY);
    expect(mapReducer(state, { type: 'projection', projection: 'equal-area' })).toBe(state);
  });

  it('toggles layers one at a time', () => {
    const state = run(start(), { type: 'toggle-layer', layer: 'blocks' }, { type: 'toggle-layer', layer: 'pipelines' });
    expect(state.layers).toEqual({ sites: true, pipelines: false, exports: true, blocks: true });
  });

  it('selects and clears a site', () => {
    expect(run(start(), { type: 'select', id: 'nordkapp' }).selectedId).toBe('nordkapp');
    expect(run(start(), { type: 'select', id: 'nordkapp' }, { type: 'select', id: null }).selectedId).toBeNull();
  });

  it('keeps its state when resized to the same size', () => {
    const state = start();
    expect(mapReducer(state, { type: 'resize', size: { ...SIZE } })).toBe(state);
    expect(mapReducer(state, { type: 'resize', size: { width: 400, height: 300 } }).size).toEqual({ width: 400, height: 300 });
  });
});
