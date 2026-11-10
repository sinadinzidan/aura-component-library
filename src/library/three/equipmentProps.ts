import type { Vec3 } from './cameraTargets';
import type { SceneTone } from './scenePalette';

/**
 * Props every procedural equipment model accepts. Models stand on the ground at their origin, with
 * their long axis along x. State is never shown by recolouring the machine: `tone` adds a status
 * ring at its base, and hover/selection add a glow in the accent colour.
 */
export type EquipmentProps = {
  position?: Vec3;
  /** Euler angles in radians. Most layouts only turn equipment around y. */
  rotation?: Vec3;
  scale?: number;
  /** Status ring on the ground around the equipment. Leave unset for normal operation. */
  tone?: SceneTone;
  /** Slow pulse on the status ring, for a state that needs attention. Stops under reduced motion. */
  pulse?: boolean;
  selected?: boolean;
  hovered?: boolean;
  /** Fade the model back, for equipment outside the area in focus. */
  dimmed?: boolean;
};
