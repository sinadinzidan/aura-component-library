import { EquipmentBase } from '../EquipmentBase';
import type { EquipmentProps } from '../equipmentProps';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type LngCarrierProps = EquipmentProps & {
  /** Overall length along x; the bow points to +x. */
  length?: number;
  beam?: number;
  /** Number of spherical cargo tanks. */
  tanks?: number;
  /** Deck height above the waterline, which is the model's origin. */
  freeboard?: number;
};

/**
 * An LNG carrier of the spherical-tank type: a long hull with the domes of its cargo spheres
 * standing proud of the deck, accommodation and funnel aft. Place its origin on the waterline.
 */
export function LngCarrier({ length = 84, beam = 14, tanks = 4, freeboard = 4, hovered, selected, dimmed, ...base }: LngCarrierProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials({ hovered, selected, dimmed });
  const draught = 3;
  const hullHeight = freeboard + draught;
  const hullY = freeboard - hullHeight / 2;
  const body = length * 0.86;
  const bow = length - body;
  const diagonal = Math.SQRT1_2 * beam;
  const stern = -length / 2;
  const house = length * 0.12;
  const cargoStart = stern + house + 3;
  const cargoEnd = stern + body - 2;
  const count = Math.max(1, Math.round(tanks));
  const slot = (cargoEnd - cargoStart) / count;
  const sphere = Math.min(beam * 0.46, slot * 0.46);
  const centres = Array.from({ length: count }, (_, index) => cargoStart + slot * (index + 0.5));

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={length / 2 + 2}>
      <mesh position={[stern + body / 2, hullY, 0]} material={steel}>
        <boxGeometry args={[body, hullHeight, beam]} />
      </mesh>
      {/* Bow: a square prism on its corner, squeezed to the bow length */}
      <mesh position={[stern + body, hullY, 0]} rotation={[0, Math.PI / 4, 0]} scale={[(bow * 2) / beam, 1, 1]} material={steel}>
        <boxGeometry args={[diagonal, hullHeight, diagonal]} />
      </mesh>
      <mesh position={[stern + body / 2, freeboard + 0.1, 0]} material={frame}>
        <boxGeometry args={[body, 0.2, beam * 0.96]} />
      </mesh>
      {centres.map((x) => (
        <group key={x} position={[x, freeboard, 0]}>
          <mesh position={[0, sphere * 0.2, 0]} material={frame}>
            <cylinderGeometry args={[sphere * 0.98, sphere * 0.98, sphere * 0.4, 28, 1, true]} />
          </mesh>
          <mesh position={[0, sphere * 0.35, 0]} material={steel}>
            <sphereGeometry args={[sphere, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          </mesh>
          <mesh position={[0, sphere * 1.35 + 0.3, 0]} material={pipe}>
            <cylinderGeometry args={[0.5, 0.5, 0.8, 10]} />
          </mesh>
        </group>
      ))}
      {/* Catwalk over the tank domes */}
      <Strut from={[centres[0], freeboard + sphere * 1.35 + 0.6, 0]} to={[centres[count - 1], freeboard + sphere * 1.35 + 0.6, 0]} radius={0.22} segments={4} material={frame} />
      {/* Cargo manifold amidships, on both sides */}
      {[-1, 1].map((side) => (
        <Strut key={side} from={[(cargoStart + cargoEnd) / 2, freeboard + 1, 0]} to={[(cargoStart + cargoEnd) / 2, freeboard + 1, (side * beam) / 2]} radius={0.3} material={pipe} />
      ))}
      {/* Accommodation, bridge and funnel aft */}
      <mesh position={[stern + house / 2 + 1, freeboard + 3.5, 0]} material={steel}>
        <boxGeometry args={[house, 7, beam * 0.8]} />
      </mesh>
      <mesh position={[stern + house / 2 + 1.5, freeboard + 7.8, 0]} material={detail}>
        <boxGeometry args={[house * 0.6, 1.6, beam * 0.92]} />
      </mesh>
      <mesh position={[stern + house * 0.3, freeboard + 9.5, 0]} material={frame}>
        <cylinderGeometry args={[1, 1.3, 5, 12]} />
      </mesh>
    </EquipmentBase>
  );
}
