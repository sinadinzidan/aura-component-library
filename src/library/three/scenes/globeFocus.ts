import { centralAngle, latLongToVec3, vec3ToLatLong } from './geo';
import type { GlobeView, LatLong } from './geo';

/** The middle of a set of places on the globe: the direction of their summed position vectors. */
export function centroid(places: readonly LatLong[]): LatLong | null {
  if (places.length === 0) return null;
  const sum = places.reduce<[number, number, number]>(
    (total, place) => {
      const [x, y, z] = latLongToVec3(place.lat, place.lon);
      return [total[0] + x, total[1] + y, total[2] + z];
    },
    [0, 0, 0]
  );
  if (Math.hypot(sum[0], sum[1], sum[2]) < 1e-9) return null;
  return vec3ToLatLong(sum);
}

/** The largest angle, in radians, between a centre and any of the places. */
export function angularSpread(center: LatLong, places: readonly LatLong[]): number {
  return places.reduce((spread, place) => Math.max(spread, centralAngle(center, place)), 0);
}

export type FocusOptions = {
  /** Camera distance when looking at a single place, in globe radii from the centre. */
  near?: number;
  /** Camera distance that shows the whole globe, in globe radii. */
  far?: number;
};

/** The view that brings one place front and centre, close enough to read its surroundings. */
export function focusView(place: LatLong, radius: number, options: FocusOptions = {}): GlobeView {
  return { lat: place.lat, lon: place.lon, distance: radius * (options.near ?? 2.2) };
}

/**
 * The view that frames a group of places: above their middle, further out the wider they are
 * spread, and never further than the whole-globe distance. `null` for no places.
 */
export function groupView(places: readonly LatLong[], radius: number, options: FocusOptions = {}): GlobeView | null {
  const center = centroid(places);
  if (!center) return null;
  const { near = 2.2, far = 3.4 } = options;
  const spread = angularSpread(center, places);
  // A fifth of a radian of spread (about 11°) needs roughly one more half-radius of distance.
  const distance = Math.min(far, near + spread * 2.5);
  return { lat: center.lat, lon: center.lon, distance: radius * distance };
}
