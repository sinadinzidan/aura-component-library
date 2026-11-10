import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';

import type { Vec3 } from '../cameraTargets';

/** Builds the tube of a well path. */
export function wellTubeGeometry(points: readonly Vec3[], radius: number): TubeGeometry {
  const curve = new CatmullRomCurve3(
    points.map((point) => new Vector3(point[0], point[1], point[2])),
    false,
    'centripetal'
  );
  return new TubeGeometry(curve, Math.max(8, points.length * 2), radius, 8, false);
}
