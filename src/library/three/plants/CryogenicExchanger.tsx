import { EquipmentBase } from '../EquipmentBase';
import type { EquipmentProps } from '../equipmentProps';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type CryogenicExchangerProps = EquipmentProps & {
  /** Overall height, skirt and head included. */
  height?: number;
  /** Diameter of the lower, warm bundle. The cold bundle above it is narrower. */
  diameter?: number;
  /** Access levels on the steel structure around the tower. */
  levels?: number;
};

/**
 * The main cryogenic heat exchanger of an LNG train: a tall insulated spiral-wound tower with a
 * wide warm bundle below a narrower cold bundle, standing inside an open steel structure with
 * access levels. The tallest thing on the plot — the landmark people orient by.
 */
export function CryogenicExchanger({ height = 44, diameter = 5.4, levels = 5, hovered, selected, dimmed, ...base }: CryogenicExchangerProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const radius = diameter / 2;
  const coldRadius = radius * 0.72;
  const skirt = 3;
  const warm = height * 0.42;
  const cone = height * 0.06;
  const head = coldRadius * 0.6;
  const cold = height - skirt - warm - cone - head;
  const half = radius + 1.6;
  const structure = skirt + warm + cone + cold * 0.75;
  const platforms = Array.from({ length: levels }, (_, index) => (structure * (index + 1)) / levels);
  const corners = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ] as const;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={half * Math.SQRT2 + 1.2}>
      <mesh position={[0, skirt / 2, 0]} material={frame}>
        <cylinderGeometry args={[radius * 0.92, radius * 1.05, skirt, 24]} />
      </mesh>
      <mesh position={[0, skirt + warm / 2, 0]} material={steel}>
        <cylinderGeometry args={[radius, radius, warm, 32]} />
      </mesh>
      <mesh position={[0, skirt + warm + cone / 2, 0]} material={steel}>
        <cylinderGeometry args={[coldRadius, radius, cone, 32]} />
      </mesh>
      <mesh position={[0, skirt + warm + cone + cold / 2, 0]} material={steel}>
        <cylinderGeometry args={[coldRadius, coldRadius, cold, 32]} />
      </mesh>
      <mesh position={[0, skirt + warm + cone + cold, 0]} scale={[1, head / coldRadius, 1]} material={steel}>
        <sphereGeometry args={[coldRadius, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Cladding bands on the insulation */}
      {[0.25, 0.5, 0.75].map((fraction) => (
        <mesh key={`warm-${fraction}`} position={[0, skirt + warm * fraction, 0]} rotation={[Math.PI / 2, 0, 0]} material={frame}>
          <torusGeometry args={[radius + 0.03, 0.07, 6, 32]} />
        </mesh>
      ))}
      {[0.3, 0.65].map((fraction) => (
        <mesh key={`cold-${fraction}`} position={[0, skirt + warm + cone + cold * fraction, 0]} rotation={[Math.PI / 2, 0, 0]} material={frame}>
          <torusGeometry args={[coldRadius + 0.03, 0.07, 6, 32]} />
        </mesh>
      ))}
      {/* Open steel structure */}
      {corners.map(([x, z]) => (
        <Strut key={`${x}${z}`} from={[x, 0, z]} to={[x, structure, z]} radius={0.16} segments={4} material={frame} />
      ))}
      {platforms.flatMap((level) =>
        corners.map(([x, z], index) => {
          const [nextX, nextZ] = corners[(index + 1) % corners.length];
          return <Strut key={`${level}-${index}`} from={[x, level, z]} to={[nextX, level, nextZ]} radius={0.12} segments={4} material={frame} />;
        })
      )}
      {/* Refrigerant and feed lines up the side, overhead line off the top */}
      <Strut from={[-radius - 0.5, 1, 0.7]} to={[-radius - 0.5, skirt + warm + cone + cold * 0.9, 0.7]} radius={0.28} material={pipe} />
      <Strut from={[-radius - 0.5, 1, -0.7]} to={[-radius - 0.5, skirt + warm * 0.9, -0.7]} radius={0.22} material={pipe} />
      <Strut from={[0, height - 0.2, 0]} to={[0, height + 1, 0]} radius={0.24} material={pipe} />
      <Strut from={[0, height + 1, 0]} to={[half, height + 1, 0]} radius={0.24} material={pipe} />
      <Strut from={[half, height + 1, 0]} to={[half, structure, 0]} radius={0.24} material={pipe} />
    </EquipmentBase>
  );
}
