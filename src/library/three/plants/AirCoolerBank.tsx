import { EquipmentBase } from '../EquipmentBase';
import type { EquipmentProps } from '../equipmentProps';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type AirCoolerBankProps = EquipmentProps & {
  /** Number of cooler bays in the row. Each bay carries two fans side by side. */
  bays?: number;
  /** Length of one bay along x. */
  bayLength?: number;
  width?: number;
  /** Height of the tube bundles above ground: the top of the pipe rack they sit on. */
  height?: number;
};

/**
 * A long row of fin-fan air coolers on top of a pipe rack: the refrigerant condensers of an LNG
 * train. One continuous deck of tube bundles with two fan rings under each bay and the rack's
 * pipes running below.
 */
export function AirCoolerBank({ bays = 8, bayLength = 6, width = 9, height = 8, hovered, selected, dimmed, ...base }: AirCoolerBankProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const count = Math.max(1, Math.round(bays));
  const length = count * bayLength;
  const fanRadius = Math.min(bayLength, width / 2) * 0.4;
  const stations = Array.from({ length: count + 1 }, (_, index) => -length / 2 + index * bayLength);
  const bayCentres = Array.from({ length: count }, (_, index) => -length / 2 + (index + 0.5) * bayLength);
  const rackLevel = height * 0.55;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(length, width) / 2 + 1}>
      {stations.flatMap((x) =>
        [-1, 1].map((side) => (
          <mesh key={`${x}${side}`} position={[x, height / 2, side * (width / 2 - 0.3)]} material={frame}>
            <boxGeometry args={[0.35, height, 0.35]} />
          </mesh>
        ))
      )}
      {stations.map((x) => (
        <mesh key={x} position={[x, rackLevel, 0]} material={frame}>
          <boxGeometry args={[0.25, 0.25, width - 0.6]} />
        </mesh>
      ))}
      {/* Rack pipes under the coolers */}
      {[-0.3, -0.1, 0.1, 0.3].map((offset) => (
        <Strut key={offset} from={[-length / 2, rackLevel + 0.4, offset * width]} to={[length / 2, rackLevel + 0.4, offset * width]} radius={0.22} material={pipe} />
      ))}
      {/* Plenum deck and tube bundles */}
      <mesh position={[0, height + 0.3, 0]} material={steel}>
        <boxGeometry args={[length, 0.6, width]} />
      </mesh>
      <mesh position={[0, height + 0.8, 0]} material={frame}>
        <boxGeometry args={[length * 0.99, 0.4, width * 0.94]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (length / 2 + 0.25), height + 0.6, 0]} material={pipe}>
          <boxGeometry args={[0.5, 1, width * 0.9]} />
        </mesh>
      ))}
      {bayCentres.flatMap((x) =>
        [-1, 1].map((side) => (
          <mesh key={`${x}${side}`} position={[x, height - 0.4, (side * width) / 4]} material={steel}>
            <cylinderGeometry args={[fanRadius, fanRadius * 0.85, 0.8, 20, 1, true]} />
          </mesh>
        ))
      )}
    </EquipmentBase>
  );
}
