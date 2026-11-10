import type { Vec3 } from '../cameraTargets';

import {
  centralAngle,
  densifyPolyline,
  globeCameraPosition,
  globeViewFrom,
  graticuleSegments,
  greatCircleArc,
  greatCircleKm,
  interpolateGreatCircle,
  interpolateOrbit,
  isFacing,
  latLongToVec3,
  markerRadius,
  projectPolyline,
  rotateAboutY,
  slerpDirection,
  vec3ToLatLong,
} from './geo';

const length = (point: Vec3): number => Math.hypot(point[0], point[1], point[2]);

function expectVec(actual: Vec3, expected: Vec3): void {
  expect(actual[0]).toBeCloseTo(expected[0], 6);
  expect(actual[1]).toBeCloseTo(expected[1], 6);
  expect(actual[2]).toBeCloseTo(expected[2], 6);
}

const OSLO = { lat: 59.9, lon: 10.7 };
const BERGEN = { lat: 60.4, lon: 5.3 };

describe(latLongToVec3.name, () => {
  it('puts 0°N 0°E on the +z axis', () => {
    expectVec(latLongToVec3(0, 0), [0, 0, 1]);
  });

  it('puts the north pole on +y and the south pole on −y', () => {
    expectVec(latLongToVec3(90, 0), [0, 1, 0]);
    expectVec(latLongToVec3(-90, 123), [0, -1, 0]);
  });

  it('puts east on +x and west on −x', () => {
    expectVec(latLongToVec3(0, 90), [1, 0, 0]);
    expectVec(latLongToVec3(0, -90), [-1, 0, 0]);
  });

  it('puts the antimeridian on −z', () => {
    expectVec(latLongToVec3(0, 180), [0, 0, -1]);
  });

  it('scales by the radius', () => {
    expectVec(latLongToVec3(0, 90, 10), [10, 0, 0]);
    expect(length(latLongToVec3(61.2, 4.8, 7))).toBeCloseTo(7, 9);
  });

  it('treats longitudes a full turn apart as the same place', () => {
    expectVec(latLongToVec3(40, 190), latLongToVec3(40, -170));
  });
});

describe(vec3ToLatLong.name, () => {
  it('round-trips a place', () => {
    const back = vec3ToLatLong(latLongToVec3(OSLO.lat, OSLO.lon, 3));

    expect(back.lat).toBeCloseTo(OSLO.lat, 9);
    expect(back.lon).toBeCloseTo(OSLO.lon, 9);
  });

  it('round-trips the western and southern hemispheres', () => {
    const back = vec3ToLatLong(latLongToVec3(-33.9, -70.6));

    expect(back.lat).toBeCloseTo(-33.9, 9);
    expect(back.lon).toBeCloseTo(-70.6, 9);
  });

  it('returns the origin of the grid for a zero vector', () => {
    expect(vec3ToLatLong([0, 0, 0])).toEqual({ lat: 0, lon: 0 });
  });
});

describe(centralAngle.name, () => {
  it('is zero for the same place', () => {
    expect(centralAngle(OSLO, OSLO)).toBeCloseTo(0, 6);
  });

  it('is a quarter turn from the equator to a pole', () => {
    expect(centralAngle({ lat: 0, lon: 20 }, { lat: 90, lon: 0 })).toBeCloseTo(Math.PI / 2, 9);
  });

  it('is a half turn between antipodes', () => {
    expect(centralAngle({ lat: 10, lon: 20 }, { lat: -10, lon: -160 })).toBeCloseTo(Math.PI, 6);
  });
});

describe(greatCircleKm.name, () => {
  it('measures Oslo to Bergen at about 300 km', () => {
    expect(greatCircleKm(OSLO, BERGEN)).toBeGreaterThan(290);
    expect(greatCircleKm(OSLO, BERGEN)).toBeLessThan(320);
  });

  it('measures a degree of latitude at about 111 km', () => {
    expect(greatCircleKm({ lat: 60, lon: 5 }, { lat: 61, lon: 5 })).toBeCloseTo(111.2, 0);
  });
});

describe(slerpDirection.name, () => {
  it('returns the ends at 0 and 1', () => {
    expectVec(slerpDirection([0, 0, 1], [1, 0, 0], 0), [0, 0, 1]);
    expectVec(slerpDirection([0, 0, 1], [1, 0, 0], 1), [1, 0, 0]);
  });

  it('stays on the unit sphere halfway', () => {
    const middle = slerpDirection([0, 0, 1], [1, 0, 0], 0.5);

    expect(length(middle)).toBeCloseTo(1, 9);
    expectVec(middle, [Math.SQRT1_2, 0, Math.SQRT1_2]);
  });

  it('returns the start for identical directions', () => {
    expectVec(slerpDirection([0, 1, 0], [0, 1, 0], 0.3), [0, 1, 0]);
  });

  it('goes around the globe between antipodes, not through it', () => {
    const middle = slerpDirection([0, 0, 1], [0, 0, -1], 0.5);

    expect(length(middle)).toBeCloseTo(1, 6);
    expectVec(slerpDirection([0, 0, 1], [0, 0, -1], 1), [0, 0, -1]);
  });
});

describe(interpolateGreatCircle.name, () => {
  it('returns the ends at 0 and 1', () => {
    expect(interpolateGreatCircle(OSLO, BERGEN, 0).lat).toBeCloseTo(OSLO.lat, 9);
    expect(interpolateGreatCircle(OSLO, BERGEN, 1).lon).toBeCloseTo(BERGEN.lon, 9);
  });

  it('follows a meridian between places on the same longitude', () => {
    const middle = interpolateGreatCircle({ lat: 50, lon: 4 }, { lat: 70, lon: 4 }, 0.5);

    expect(middle.lat).toBeCloseTo(60, 9);
    expect(middle.lon).toBeCloseTo(4, 9);
  });

  it('bends towards the pole between places on the same parallel', () => {
    const middle = interpolateGreatCircle({ lat: 60, lon: -40 }, { lat: 60, lon: 40 }, 0.5);

    expect(middle.lon).toBeCloseTo(0, 9);
    expect(middle.lat).toBeGreaterThan(60);
  });

  it('splits the central angle evenly', () => {
    const quarter = interpolateGreatCircle(OSLO, BERGEN, 0.25);

    expect(centralAngle(OSLO, quarter)).toBeCloseTo(centralAngle(OSLO, BERGEN) / 4, 9);
  });

  it('clamps the fraction', () => {
    expect(interpolateGreatCircle(OSLO, BERGEN, 3).lat).toBeCloseTo(BERGEN.lat, 9);
  });
});

describe(greatCircleArc.name, () => {
  it('starts and ends on the surface at the two places', () => {
    const arc = greatCircleArc(OSLO, BERGEN, { radius: 10, segments: 8 });

    expect(arc).toHaveLength(9);
    expectVec(arc[0], latLongToVec3(OSLO.lat, OSLO.lon, 10));
    expectVec(arc[8], latLongToVec3(BERGEN.lat, BERGEN.lon, 10));
  });

  it('rises highest in the middle', () => {
    const arc = greatCircleArc({ lat: 60, lon: 5 }, { lat: 40, lon: -70 }, { radius: 10, segments: 8 });
    const heights = arc.map(length);

    expect(heights[4]).toBe(Math.max(...heights));
    expect(heights[4]).toBeGreaterThan(10);
  });

  it('lifts long hops higher than short ones', () => {
    const short = length(greatCircleArc(OSLO, BERGEN, { segments: 2 })[1]);
    const long = length(greatCircleArc(OSLO, { lat: 38, lon: -76 }, { segments: 2 })[1]);

    expect(long).toBeGreaterThan(short);
  });

  it('keeps a minimum lift on short hops', () => {
    expect(length(greatCircleArc(OSLO, BERGEN, { segments: 2, minLift: 0.05 })[1])).toBeCloseTo(1.05, 6);
  });

  it('never dips below the surface', () => {
    const arc = greatCircleArc({ lat: 70, lon: 24 }, { lat: -34, lon: 151 }, { radius: 10 });

    expect(Math.min(...arc.map(length))).toBeGreaterThanOrEqual(10 - 1e-9);
  });
});

describe(densifyPolyline.name, () => {
  it('leaves close points alone', () => {
    expect(densifyPolyline([OSLO, BERGEN], 5)).toEqual([OSLO, BERGEN]);
  });

  it('splits long edges so no step exceeds the limit', () => {
    const dense = densifyPolyline([{ lat: 0, lon: 0 }, { lat: 0, lon: 20 }], 5);

    expect(dense).toHaveLength(5);
    expect(dense[2].lon).toBeCloseTo(10, 9);
    dense.slice(1).forEach((point, index) => expect(centralAngle(dense[index], point)).toBeLessThanOrEqual((5 * Math.PI) / 180 + 1e-9));
  });

  it('closes a loop back to its first point without repeating it', () => {
    const dense = densifyPolyline([{ lat: 0, lon: 0 }, { lat: 0, lon: 10 }, { lat: 10, lon: 10 }], 5, true);

    expect(dense).toHaveLength(7);
    expect(dense[0]).toEqual({ lat: 0, lon: 0 });
  });

  it('returns short input unchanged', () => {
    expect(densifyPolyline([OSLO], 5)).toEqual([OSLO]);
  });
});

describe(projectPolyline.name, () => {
  it('projects every point onto the sphere', () => {
    const points = projectPolyline([OSLO, BERGEN], 4);

    expect(points).toHaveLength(2);
    expect(length(points[1])).toBeCloseTo(4, 9);
  });
});

describe(graticuleSegments.name, () => {
  it('draws parallels and meridians as vertex pairs', () => {
    const vertices = graticuleSegments(1, 30, 90, 30);
    // 5 parallels × 12 pieces + 4 meridians × 6 pieces, two vertices of three numbers each.
    expect(vertices).toHaveLength((5 * 12 + 4 * 6) * 6);
  });

  it('keeps every vertex on the sphere', () => {
    const vertices = graticuleSegments(3, 45, 45, 15);

    for (let index = 0; index < vertices.length; index += 3) {
      expect(Math.hypot(vertices[index], vertices[index + 1], vertices[index + 2])).toBeCloseTo(3, 9);
    }
  });
});

describe(globeCameraPosition.name, () => {
  it('stands above the place at the given distance', () => {
    expectVec(globeCameraPosition({ lat: 0, lon: 90, distance: 30 }), [30, 0, 0]);
  });

  it('round-trips through globeViewFrom', () => {
    const view = globeViewFrom(globeCameraPosition({ lat: 62, lon: 6, distance: 25 }));

    expect(view.lat).toBeCloseTo(62, 9);
    expect(view.lon).toBeCloseTo(6, 9);
    expect(view.distance).toBeCloseTo(25, 9);
  });
});

describe(interpolateOrbit.name, () => {
  it('returns the ends at 0 and 1', () => {
    expectVec(interpolateOrbit([0, 0, 30], [20, 0, 0], 0), [0, 0, 30]);
    expectVec(interpolateOrbit([0, 0, 30], [20, 0, 0], 1), [20, 0, 0]);
  });

  it('swings around the globe at a blended distance', () => {
    const middle = interpolateOrbit([0, 0, 30], [20, 0, 0], 0.5);

    expect(length(middle)).toBeCloseTo(25, 9);
    expect(middle[0]).toBeCloseTo(middle[2], 9);
  });

  it('stays outside the globe on the way to the far side', () => {
    const steps = [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => length(interpolateOrbit([0, 0, 30], [0, 0, -30], t)));

    expect(Math.min(...steps)).toBeCloseTo(30, 6);
  });

  it('jumps to the goal when a position is at the centre', () => {
    expect(interpolateOrbit([0, 0, 0], [20, 0, 0], 0.5)).toEqual([20, 0, 0]);
  });
});

describe(rotateAboutY.name, () => {
  it('keeps the height and the distance', () => {
    const turned = rotateAboutY([3, 4, 5], 0.7);

    expect(turned[1]).toBe(4);
    expect(length(turned)).toBeCloseTo(length([3, 4, 5]), 9);
  });

  it('moves a camera on the prime meridian east by a positive angle', () => {
    expectVec(rotateAboutY([0, 0, 10], Math.PI / 2), [10, 0, 0]);
  });
});

describe(isFacing.name, () => {
  it('sees the place under the camera', () => {
    expect(isFacing(OSLO, latLongToVec3(OSLO.lat, OSLO.lon, 30))).toBe(true);
  });

  it('does not see the far side', () => {
    expect(isFacing({ lat: -40, lon: -170 }, latLongToVec3(OSLO.lat, OSLO.lon, 30))).toBe(false);
  });

  it('sees less of the globe from close up', () => {
    const place = { lat: 0, lon: 60 };

    expect(isFacing(place, [0, 0, 30])).toBe(true);
    expect(isFacing(place, [0, 0, 1.5])).toBe(false);
  });
});

describe(markerRadius.name, () => {
  it('gives the largest value the largest radius', () => {
    expect(markerRadius(200, 200, 1, 3)).toBe(3);
  });

  it('scales area, not radius, with the value', () => {
    expect(markerRadius(50, 200, 1, 3)).toBe(2);
  });

  it('gives no production the smallest radius', () => {
    expect(markerRadius(0, 200, 1, 3)).toBe(1);
    expect(markerRadius(40, 0, 1, 3)).toBe(1);
  });
});
