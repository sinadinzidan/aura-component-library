import type { Vec3 } from '../cameraTargets';
import { pointAlong, polylineLength } from '../pipeGeometry';

/** How flow rate turns into motion. All distances are scene units; speeds are units per second. */
export type ParticleOptions = {
  /** Speed of a stream that barely flows. */
  minSpeed?: number;
  /** Speed at full rate. */
  maxSpeed?: number;
  /** Distance between particles at full rate. */
  minSpacing?: number;
  /** Distance between particles in a stream that barely flows. */
  maxSpacing?: number;
  /** Upper bound on particles for one route, whatever its length. */
  maxCount?: number;
};

const DEFAULTS = { minSpeed: 1.2, maxSpeed: 9, minSpacing: 1.8, maxSpacing: 9, maxCount: 48 } satisfies Required<ParticleOptions>;

export type Particle = { position: Vec3; direction: Vec3 };

const clampUnit = (value: number): number => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** A flow as a 0–1 share of a reference flow, so one scale drives every line in a scene. */
export function normalizeRate(flow: number, reference: number): number {
  if (reference <= 0) return 0;
  return clampUnit(flow / reference);
}

/** Particle speed for a rate (0–1): rises linearly with the rate, and is 0 when nothing flows. */
export function particleSpeed(rate: number, options: ParticleOptions = {}): number {
  const { minSpeed, maxSpeed } = { ...DEFAULTS, ...options };
  const share = clampUnit(rate);
  return share === 0 ? 0 : minSpeed + (maxSpeed - minSpeed) * share;
}

/** How many particles a route of `length` carries at a rate (0–1): density rises linearly with the rate. */
export function particleCount(length: number, rate: number, options: ParticleOptions = {}): number {
  const { minSpacing, maxSpacing, maxCount } = { ...DEFAULTS, ...options };
  const share = clampUnit(rate);
  if (share === 0 || length <= 0) return 0;
  const density = 1 / maxSpacing + (1 / minSpacing - 1 / maxSpacing) * share;
  return Math.min(maxCount, Math.max(1, Math.round(length * density)));
}

/**
 * Where the particles of one stream are at `time` (seconds). Particles are evenly spaced along
 * the route and travel from its first point to its last; one leaving the end re-enters at the
 * start, so the stream is seamless. Pure: the same route, time and rate give the same positions.
 */
export function particlePositions(route: readonly Vec3[], time: number, rate: number, options: ParticleOptions = {}): Particle[] {
  const length = polylineLength(route);
  const count = particleCount(length, rate, options);
  if (count === 0) return [];
  const spacing = length / count;
  const travelled = (Number.isFinite(time) ? time : 0) * particleSpeed(rate, options);
  const offset = ((travelled % spacing) + spacing) % spacing;
  const particles: Particle[] = [];
  for (let index = 0; index < count; index += 1) {
    const sample = pointAlong(route, index * spacing + offset);
    if (sample) particles.push(sample);
  }
  return particles;
}
