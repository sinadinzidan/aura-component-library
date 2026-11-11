import { Plane, Vector3 } from 'three';

import type { Vec3 } from '../cameraTargets';

/** A plane in three.js's own type, from the plain `normal` and `constant` the section module computes. */
export function toThreePlane(spec: { normal: Vec3; constant: number }): Plane {
  return new Plane(new Vector3(spec.normal[0], spec.normal[1], spec.normal[2]), spec.constant);
}

/** The part of a renderer the viewer switches on: per-material clipping planes only apply when this is true. */
export type ClippingRenderer = { localClippingEnabled: boolean };

export function enableLocalClipping(renderer: ClippingRenderer): void {
  renderer.localClippingEnabled = true;
}
