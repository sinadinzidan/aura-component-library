import { Building } from '../Building';
import { CompressorSkid } from '../CompressorSkid';
import { HorizontalVessel } from '../HorizontalVessel';
import { ShutdownValve } from '../ShutdownValve';
import { StorageTank } from '../StorageTank';
import { useEquipmentMaterials } from '../useEquipmentMaterials';
import { VerticalVessel } from '../VerticalVessel';

import type { PipelineStationKind } from './pipelineData';

export type StationModelProps = {
  kind: PipelineStationKind;
  /** On the ground directly below the pipe's axis. The station lies along x: turn it with `rotationY` to follow the line. */
  position?: readonly [number, number, number];
  rotationY?: number;
  /** Fades the station back, e.g. while another is in focus. */
  dimmed?: boolean;
};

type Place = { at: readonly [number, number, number]; scale?: number; turn?: number };

const PAD: Record<PipelineStationKind, readonly [number, number]> = {
  launcher: [22, 12],
  valve: [14, 12],
  crossing: [0, 0],
  compressor: [30, 24],
  metering: [18, 16],
  terminal: [40, 34],
};

/**
 * The buildings and equipment of one pipeline station, composed from the plant models: a pig
 * launcher barrel on the landfall, a valve and kiosk at a block valve, two compressor skids with
 * a control kiosk, a metering station, and tanks beside the terminal's receiver. Crossings have
 * no model; the corridor draws the river or the road itself.
 */
export function StationModel({ kind, position = [0, 0, 0], rotationY = 0, dimmed = false }: StationModelProps) {
  const { frame } = useEquipmentMaterials({ dimmed });
  const [padX, padZ] = PAD[kind];

  const valves: Place[] = kind === 'compressor' ? [{ at: [-7, 0, 0] }, { at: [7, 0, 0] }] : kind === 'metering' ? [{ at: [-4, 0, 0] }, { at: [4, 0, 0] }] : kind === 'launcher' || kind === 'valve' || kind === 'terminal' ? [{ at: [0, 0, 0] }] : [];

  return (
    <group position={[position[0], position[1], position[2]]} rotation={[0, rotationY, 0]}>
      {padX > 0 ? (
        <mesh position={[0, 0.05, 0]} material={frame}>
          <boxGeometry args={[padX, 0.1, padZ]} />
        </mesh>
      ) : null}
      {valves.map((valve) => (
        <ShutdownValve key={valve.at.join()} position={valve.at} dimmed={dimmed} />
      ))}
      {kind === 'launcher' ? <HorizontalVessel position={[-6.5, 0, 0]} scale={0.5} dimmed={dimmed} /> : null}
      {kind === 'launcher' || kind === 'valve' ? <Building position={[0, 0, 5]} scale={0.4} dimmed={dimmed} /> : null}
      {kind === 'compressor' ? (
        <>
          <CompressorSkid position={[0, 0, -8]} scale={0.8} dimmed={dimmed} />
          <CompressorSkid position={[0, 0, 8]} scale={0.8} dimmed={dimmed} />
          <Building position={[-13, 0, 0]} scale={0.5} variant="control-room" dimmed={dimmed} />
        </>
      ) : null}
      {kind === 'metering' ? (
        <>
          <VerticalVessel position={[0, 0, -6]} scale={0.5} dimmed={dimmed} />
          <Building position={[0, 0, 6.5]} scale={0.5} dimmed={dimmed} />
        </>
      ) : null}
      {kind === 'terminal' ? (
        <>
          <HorizontalVessel position={[-8, 0, 0]} scale={0.5} dimmed={dimmed} />
          <StorageTank position={[10, 0, -12]} scale={0.8} fill={0.6} dimmed={dimmed} />
          <StorageTank position={[10, 0, 12]} scale={0.8} fill={0.35} dimmed={dimmed} />
          <Building position={[-6, 0, 10]} scale={0.7} variant="control-room" dimmed={dimmed} />
        </>
      ) : null}
    </group>
  );
}
