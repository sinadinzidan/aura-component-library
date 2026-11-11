import type { Vec3 } from '../cameraTargets';

/** Bounding sizes (x, y, z) of the LNG models at their default dimensions, for framing cameras and rings. */
export const CRYOGENIC_EXCHANGER_SIZE: Vec3 = [9, 46, 9];

export function airCoolerBankSize(bays = 8, bayLength = 6, width = 9, height = 8): Vec3 {
  return [bays * bayLength, height + 1.4, width];
}

export function slugCatcherSize(fingers = 6, length = 36, pitch = 2.4): Vec3 {
  return [length + 4, 5.4, (fingers - 1) * pitch + 3];
}

export function containmentTankSize(diameter = 34, height = 22): Vec3 {
  return [diameter + 3, height + diameter * 0.18 + 2.5, diameter + 3];
}

export function lngCarrierSize(length = 84, beam = 14, freeboard = 4): Vec3 {
  return [length, freeboard + beam * 0.9, beam];
}

export function loadingArmsSize(arms = 4, spacing = 3.4, deck = 4): Vec3 {
  return [16, deck + 13, (arms - 1) * spacing + 6];
}
