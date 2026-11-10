import {
  boxAnchor,
  calloutPlacement,
  cylinderBounds,
  cylinderShape,
  iso,
  isoCircle,
  mustDrawBefore,
  prismFaces,
  sortBackToFront,
  toFractions,
  toPoints,
  unionBox,
} from './isoProjection';
import type { IsoBox } from './isoProjection';

const VIEW = { scale: 10, originX: 100, originY: 50 };

function box(x: number, y: number, z: number, w = 1, d = 1, h = 1): IsoBox {
  return { x, y, z, w, d, h };
}

describe('iso', () => {
  it('puts the world origin at the screen origin', () => {
    expect(iso(0, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(iso(0, 0, 0, VIEW)).toEqual({ x: 100, y: 50 });
  });

  it('runs x down and to the right at 30 degrees', () => {
    expect(iso(1, 0, 0)).toEqual({ x: 0.87, y: 0.5 });
  });

  it('runs y down and to the left at 30 degrees', () => {
    expect(iso(0, 1, 0)).toEqual({ x: -0.87, y: 0.5 });
  });

  it('runs z straight up', () => {
    expect(iso(0, 0, 1)).toEqual({ x: 0, y: -1 });
  });

  it('keeps equal x and y on the vertical centre line', () => {
    expect(iso(3, 3, 0)).toEqual({ x: 0, y: 3 });
  });

  it('scales and offsets by the view', () => {
    expect(iso(2, 0, 1, VIEW)).toEqual({ x: 117.32, y: 50 });
  });

  it('defaults z to the ground', () => {
    expect(iso(2, 1)).toEqual(iso(2, 1, 0));
  });
});

describe('toPoints', () => {
  it('formats points for an SVG polygon', () => {
    expect(toPoints([{ x: 1, y: 2 }, { x: 3.5, y: 4 }])).toBe('1,2 3.5,4');
  });
});

describe('prismFaces', () => {
  it('returns the top, left and right faces of a unit cube', () => {
    const faces = prismFaces(box(0, 0, 0));

    expect(faces.top).toBe('0,-1 0.87,-0.5 0,0 -0.87,-0.5');
    expect(faces.left).toBe('-0.87,-0.5 0,0 0,1 -0.87,0.5');
    expect(faces.right).toBe('0.87,-0.5 0,0 0,1 0.87,0.5');
  });

  it('shares the near vertical edge between the left and right faces', () => {
    const faces = prismFaces(box(2, 1, 0, 3, 2, 4), VIEW);
    const near = iso(5, 3, 0, VIEW);

    expect(faces.left).toContain(`${near.x},${near.y}`);
    expect(faces.right).toContain(`${near.x},${near.y}`);
  });
});

describe('boxAnchor', () => {
  it('is the middle of the top face', () => {
    expect(boxAnchor(box(0, 0, 0, 2, 2, 3))).toEqual(iso(1, 1, 3));
  });
});

describe('isoCircle', () => {
  it('returns one point per segment', () => {
    expect(isoCircle({ x: 0, y: 0, z: 0 }, 1, 'z', undefined, 12)).toHaveLength(12);
  });

  it('flattens a ground circle to half its width in height', () => {
    const points = isoCircle({ x: 0, y: 0, z: 0 }, 1, 'z', undefined, 64);
    const width = Math.max(...points.map((point) => point.x)) - Math.min(...points.map((point) => point.x));
    const height = Math.max(...points.map((point) => point.y)) - Math.min(...points.map((point) => point.y));

    expect(width).toBeCloseTo(2.45, 1);
    expect(height).toBeCloseTo(1.41, 1);
  });

  it('stands a circle across the x axis upright', () => {
    const points = isoCircle({ x: 0, y: 0, z: 0 }, 1, 'x', undefined, 4);

    expect(points[1]).toEqual({ x: 0, y: -1 });
  });
});

describe('cylinderShape', () => {
  it('draws a vertical cylinder with its top cap nearest', () => {
    const shape = cylinderShape({ x: 0, y: 0, z: 0, radius: 1, length: 2 }, undefined, 8);
    const topCentreY = shape.nearCap.split(' ').map((pair) => Number(pair.split(',')[1]));

    expect(Math.min(...topCentreY)).toBeLessThan(-2);
    expect(shape.body.split(' ')).toHaveLength(4);
  });

  it('spans the body between the silhouette edges', () => {
    const shape = cylinderShape({ x: 0, y: 0, z: 0, radius: 1, length: 2 }, undefined, 64);
    const xs = shape.body.split(' ').map((pair) => Number(pair.split(',')[0]));

    expect(Math.max(...xs)).toBeCloseTo(1.22, 1);
    expect(Math.min(...xs)).toBeCloseTo(-1.22, 1);
  });

  it('lays a cylinder along x', () => {
    const shape = cylinderShape({ x: 0, y: 0, z: 0, radius: 1, length: 4, axis: 'x' }, undefined, 8);
    const nearX = shape.nearCap.split(' ').map((pair) => Number(pair.split(',')[0]));
    const farX = shape.farCap.split(' ').map((pair) => Number(pair.split(',')[0]));

    expect(Math.min(...nearX)).toBeGreaterThan(Math.min(...farX));
  });
});

describe('cylinderBounds', () => {
  it('bounds a vertical cylinder', () => {
    expect(cylinderBounds({ x: 2, y: 3, z: 0, radius: 1, length: 4 })).toEqual({ x: 1, y: 2, z: 0, w: 2, d: 2, h: 4 });
  });

  it('bounds a cylinder lying along x or y', () => {
    expect(cylinderBounds({ x: 2, y: 3, z: 1, radius: 1, length: 4, axis: 'x' })).toEqual({ x: 2, y: 2, z: 0, w: 4, d: 2, h: 2 });
    expect(cylinderBounds({ x: 2, y: 3, z: 1, radius: 1, length: 4, axis: 'y' })).toEqual({ x: 1, y: 3, z: 0, w: 2, d: 4, h: 2 });
  });
});

describe('unionBox', () => {
  it('holds every box', () => {
    expect(unionBox([box(0, 0, 0), box(2, 3, 1, 1, 1, 2)])).toEqual({ x: 0, y: 0, z: 0, w: 3, d: 4, h: 3 });
  });

  it('is empty for no boxes', () => {
    expect(unionBox([])).toEqual({ x: 0, y: 0, z: 0, w: 0, d: 0, h: 0 });
  });
});

describe('mustDrawBefore', () => {
  it('paints the box with the smaller x first', () => {
    expect(mustDrawBefore(box(0, 0, 0), box(2, 0, 0))).toBe(true);
    expect(mustDrawBefore(box(2, 0, 0), box(0, 0, 0))).toBe(false);
  });

  it('paints the lower box first', () => {
    expect(mustDrawBefore(box(0, 0, 0), box(0, 0, 1))).toBe(true);
  });

  it('has no opinion when planes separate the boxes both ways', () => {
    expect(mustDrawBefore(box(0, 0, 3), box(2, 0, 0))).toBe(false);
    expect(mustDrawBefore(box(2, 0, 0), box(0, 0, 3))).toBe(false);
  });

  it('has no opinion about a box and itself', () => {
    expect(mustDrawBefore(box(0, 0, 0), box(0, 0, 0))).toBe(false);
  });
});

describe('sortBackToFront', () => {
  it('orders a row along x from far to near', () => {
    const boxes = [{ id: 'near', ...box(4, 0, 0) }, { id: 'far', ...box(0, 0, 0) }, { id: 'mid', ...box(2, 0, 0) }];

    expect(sortBackToFront(boxes).map((item) => item.id)).toEqual(['far', 'mid', 'near']);
  });

  it('paints a box on a deck after the deck and the unit under it', () => {
    const boxes = [{ id: 'cooler', ...box(1, 1, 3.2, 2, 2, 1) }, { id: 'deck', ...box(0, 0, 3, 6, 4, 0.2) }, { id: 'compressor', ...box(1, 1, 0, 2, 2, 2) }];

    expect(sortBackToFront(boxes).map((item) => item.id)).toEqual(['compressor', 'deck', 'cooler']);
  });

  it('paints a long rack between the rows it divides', () => {
    const boxes = [{ id: 'front', ...box(3, 8, 0, 2, 2, 2) }, { id: 'rack', ...box(0, 6, 0, 20, 1, 2) }, { id: 'back', ...box(12, 2, 0, 2, 2, 2) }];

    expect(sortBackToFront(boxes).map((item) => item.id)).toEqual(['back', 'rack', 'front']);
  });

  it('does not change its input and keeps every box', () => {
    const boxes = [{ id: 'b', ...box(2, 0, 0) }, { id: 'a', ...box(0, 0, 0) }];

    expect(sortBackToFront(boxes)).toHaveLength(2);
    expect(boxes[0].id).toBe('b');
  });
});

describe('toFractions and calloutPlacement', () => {
  it('expresses a point as fractions of the drawing', () => {
    expect(toFractions({ x: 250, y: 150 }, 1000, 600)).toEqual({ x: 0.25, y: 0.25 });
  });

  it('opens right and below near the top left', () => {
    expect(calloutPlacement({ x: 0.2, y: 0.2 })).toEqual({ side: 'right', vertical: 'below' });
  });

  it('opens left and above near the bottom right', () => {
    expect(calloutPlacement({ x: 0.8, y: 0.8 })).toEqual({ side: 'left', vertical: 'above' });
  });
});
