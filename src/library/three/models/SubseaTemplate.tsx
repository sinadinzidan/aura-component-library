import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type SubseaTemplateProps = {
  /** Width (x) and depth (z) of the template on the seabed. */
  size?: readonly [number, number];
  height?: number;
  dimmed?: boolean;
};

/** A subsea template on the seabed: a protective tubular frame over the well slots with a manifold header and an export spool. */
export function SubseaTemplate({ size = [5, 5], height = 1.3, dimmed = false }: SubseaTemplateProps) {
  const { frame, pipe, steel } = useEquipmentMaterials({ dimmed });
  const [width, depth] = size;
  const x = width / 2;
  const z = depth / 2;
  const corners = [
    [-x, -z],
    [x, -z],
    [x, z],
    [-x, z],
  ] as const;

  return (
    <group>
      <mesh position={[0, 0.04, 0]} material={steel}>
        <boxGeometry args={[width, 0.08, depth]} />
      </mesh>
      {corners.map(([cx, cz], index) => {
        const [nx, nz] = corners[(index + 1) % corners.length];
        return (
          <group key={index}>
            <Strut from={[cx, 0, cz]} to={[cx * 0.82, height, cz * 0.82]} radius={0.07} material={frame} segments={8} />
            <Strut from={[cx * 0.82, height, cz * 0.82]} to={[nx * 0.82, height, nz * 0.82]} radius={0.07} material={frame} segments={8} />
          </group>
        );
      })}
      {/* Manifold header and export spool */}
      <Strut from={[-x * 0.7, 0.3, 0]} to={[x * 1.6, 0.3, 0]} radius={0.11} material={pipe} segments={10} />
      <mesh position={[x * 1.6, 0.3, 0]} material={frame}>
        <sphereGeometry args={[0.2, 10, 8]} />
      </mesh>
    </group>
  );
}
