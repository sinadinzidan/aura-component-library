import type { ReactNode } from 'react';

import { toTuple } from './cameraTargets';
import type { EquipmentProps } from './equipmentProps';
import { StatusBeacon } from './StatusBeacon';

export type EquipmentBaseProps = Pick<EquipmentProps, 'position' | 'rotation' | 'scale' | 'tone' | 'pulse' | 'dimmed'> & {
  /** Radius of the status ring: roughly half the model's footprint diagonal. */
  beaconRadius: number;
  children: ReactNode;
};

/**
 * The shared shell of every equipment model: applies the transform and draws the status ring.
 * Build new equipment inside it so it behaves like the rest.
 */
export function EquipmentBase({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, tone, pulse, dimmed, beaconRadius, children }: EquipmentBaseProps) {
  return (
    <group position={toTuple(position)} rotation={toTuple(rotation)} scale={scale}>
      {children}
      {tone ? <StatusBeacon tone={tone} radius={beaconRadius} pulse={pulse} dimmed={dimmed} /> : null}
    </group>
  );
}
