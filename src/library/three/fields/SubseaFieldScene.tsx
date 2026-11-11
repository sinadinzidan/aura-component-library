import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

import { CameraRig } from '../CameraRig';
import type { CameraTarget, Vec3, ViewInsetsValue } from '../cameraTargets';
import { WellTube } from '../models/WellTube';
import { useSceneEnvironment } from '../sceneEnvironment';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';
import { SeaPlane } from '../scenes/SeaPlane';
import { Selectable } from '../Selectable';
import { Strut } from '../Strut';
import type { TokenColors } from '../tokenColors';
import { useEquipmentMaterials } from '../useEquipmentMaterials';
import { ViewInsets } from '../ViewInsets';

import { FlowChevrons } from './FlowChevrons';
import { Fpso } from './Fpso';
import { MooringLine } from './MooringLine';
import { Rov } from './Rov';
import { SeabedTerrain } from './SeabedTerrain';
import { depthLevelTarget, isGhosted, itemAnchor, itemCameraTarget, rovStation, turretPosition } from './subseaField';
import type { DepthLevel, SubseaFieldLayout, SubseaSystem, SubseaSystemFilter } from './subseaField';
import { SubseaTemplate3d } from './SubseaTemplate3d';
import type { SUBSEA_TOKENS } from './subseaTokens';
import type { HeightFunction } from './terrainHeight';

export type SubseaFieldSceneProps = {
  layout: SubseaFieldLayout;
  /** Ground level, the same function the layout's lines were draped with. */
  height: HeightFunction;
  /** Network colours, resolved outside the canvas with `useTokenColors(SUBSEA_TOKENS, ref)`. */
  colors: TokenColors<typeof SUBSEA_TOKENS> | null;
  /** The network to highlight; everything else fades back. */
  filter?: SubseaSystemFilter;
  /** Where the camera sits when nothing is selected. */
  level?: DepthLevel;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Show flow chevrons on the lines that carry fluid. */
  flow?: boolean;
  /** Show the inspection vehicle and fly it to the selection. */
  rov?: boolean;
  /** Pixels that overlays cover on each edge of the canvas. */
  insets?: ViewInsetsValue;
  /** Labels on structures, risers and the vessel. */
  labels?: boolean;
  /** Called when the vehicle reaches the item it was sent to. */
  onRovArrive?: () => void;
};

const SEAWATER_FOG_NEAR = 1.4;
const SEAWATER_FOG_FAR = 4.6;

/**
 * A subsea production system: rolling seabed with templates and a manifold, flowlines and
 * umbilicals draped along it, lazy-wave risers up to a floating production vessel, mooring lines
 * to anchors, and an inspection vehicle on a tether. Water is a translucent surface with a
 * depth fog, so what lies deeper reads quieter. Selection is controlled by the parent.
 */
export function SubseaFieldScene({ layout, height, colors, filter = 'all', level = 'surface', selectedId = null, onSelect, flow = false, rov = true, insets, labels = true, onRovArrive }: SubseaFieldSceneProps) {
  const { palette } = useSceneEnvironment();
  const size = useThree((state) => state.size);
  const aspect = Math.round((size.width / Math.max(size.height, 1)) * 10) / 10;
  const depth = layout.waterDepth;

  const target: CameraTarget = useMemo(() => (selectedId ? itemCameraTarget(layout, selectedId, height, aspect) : null) ?? depthLevelTarget(layout, level), [layout, height, selectedId, level, aspect]);
  const tetherFrom = useMemo<Vec3>(() => {
    const turret = turretPosition(layout.vessel, 0);
    return [turret[0] + 3, turret[1], turret[2] + 4];
  }, [layout.vessel]);
  const rovTarget = useMemo<Vec3>(() => {
    const station = selectedId ? rovStation(layout, selectedId, height) : null;
    return station ?? [layout.fieldCenter[0] + 10, height(layout.fieldCenter[0] + 10, layout.fieldCenter[1] + 8) + 5, layout.fieldCenter[1] + 8];
  }, [layout, height, selectedId]);

  const colorOf = (system: SubseaSystem): string => (colors ? colors[system].color : palette.accent.color);
  const dimmedBy = (system: SubseaSystem): boolean => isGhosted(filter, system);
  const focus = selectedId !== null;
  const vesselDimmed = filter !== 'all' && filter !== 'mooring';

  const showLabel = (id: string, system: SubseaSystem): boolean => {
    if (!labels || isGhosted(filter, system)) return false;
    if (id === selectedId) return true;
    return !focus && level === 'seabed';
  };

  return (
    <>
      <fog attach="fog" args={[palette.ground.color, depth * SEAWATER_FOG_NEAR, depth * SEAWATER_FOG_FAR]} />
      <SceneLights sunPosition={[40, 90, 30]} />
      <CameraRig target={target} minDistance={5} maxDistance={depth * 6} maxPolarAngle={Math.PI * 0.49} />
      {insets ? <ViewInsets {...insets} /> : null}

      <SeabedTerrain height={height} size={layout.size} />
      <SeaPlane size={layout.size} level={depth} cell={10} opacity={0.34} />
      {/* The water column: faint walls and a deep tint, so the volume reads from the side */}
      <mesh position={[0, depth / 2, 0]} renderOrder={1}>
        <boxGeometry args={[layout.size[0], depth, layout.size[1]]} />
        <meshBasicMaterial color={palette.liquid.color} transparent opacity={0.05 * palette.liquid.opacity + 0.02} side={1} depthWrite={false} />
      </mesh>

      <Fpso position={layout.vessel.position} rotationY={layout.vessel.rotationY} length={layout.vessel.length} dimmed={vesselDimmed} />
      {labels && level === 'surface' && !focus ? (
        <SceneLabel position={[layout.vessel.position[0], layout.vessel.position[1] + 11, layout.vessel.position[2]]} tag="FPSO" name="Nordkapp Vest" />
      ) : null}

      {layout.structures.map((item) => {
        const base: Vec3 = [item.position[0], height(item.position[0], item.position[1]), item.position[1]];
        const dimmed = dimmedBy(item.system);
        if (item.kind === 'template') {
          return (
            <SubseaTemplate3d key={item.id} id={item.id} position={base} rotationY={item.rotationY} slots={item.slots} selected={item.id === selectedId} dimmed={dimmed} onSelect={onSelect} />
          );
        }
        return <SeabedStructure key={item.id} id={item.id} kind={item.kind} position={base} selected={item.id === selectedId} dimmed={dimmed} onSelect={onSelect} />;
      })}

      {layout.lines.map((line) => {
        const dimmed = dimmedBy(line.system);
        const color = colorOf(line.system);
        const selected = line.id === selectedId;
        if (line.kind === 'mooring') {
          return <MooringLine key={line.id} id={line.id} anchor={line.points[0]} fairlead={line.points[line.points.length - 1]} color={color} radius={line.radius} dimmed={dimmed} />;
        }
        return (
          <group key={line.id}>
            <WellTube id={line.id} points={line.points} color={color} radius={line.radius} selected={selected} dimmed={dimmed} onSelect={line.selectable ? onSelect : undefined} />
            {flow && line.flow ? <FlowChevrons points={line.points} color={palette.highlight.color} radius={line.radius} dimmed={dimmed} /> : null}
          </group>
        );
      })}

      {layout.structures.map((item) => {
        const anchor = itemAnchor(layout, item.id, height);
        return anchor && showLabel(item.id, item.system) ? <SceneLabel key={item.id} position={[anchor[0], anchor[1] + 3.5, anchor[2]]} tag={item.tag} selected={item.id === selectedId} /> : null;
      })}
      {layout.lines
        .filter((line) => line.selectable && (line.id === selectedId || (!focus && level === 'water-column' && line.kind === 'riser')) && !isGhosted(filter, line.system) && labels)
        .map((line, index) => {
          const spot = line.points[Math.floor(line.points.length * (line.kind === 'riser' ? 0.46 + index * 0.12 : 0.5))] ?? line.points[0];
          return <SceneLabel key={line.id} position={spot} tag={line.tag} selected={line.id === selectedId} />;
        })}

      {rov ? <Rov target={rovTarget} tetherFrom={tetherFrom} onArrive={onRovArrive} /> : null}
    </>
  );
}

/** A manifold or a pipeline end termination: a skid with a frame, simple enough to read from afar. */
function SeabedStructure({ id, kind, position, selected, dimmed, onSelect }: { id: string; kind: string; position: Vec3; selected: boolean; dimmed: boolean; onSelect?: (id: string) => void }) {
  return (
    <group position={position}>
      <SeabedStructureBody id={id} wide={kind === 'manifold'} selected={selected} dimmed={dimmed} onSelect={onSelect} />
    </group>
  );
}

function SeabedStructureBody({ id, wide, selected, dimmed, onSelect }: { id: string; wide: boolean; selected: boolean; dimmed: boolean; onSelect?: (id: string) => void }) {
  const { steel, frame, pipe } = useEquipmentMaterials({ dimmed });
  const length = wide ? 8 : 4.4;
  const width = wide ? 4.4 : 3;
  const top = wide ? 1.9 : 1.3;

  return (
    <Selectable id={id} onSelect={onSelect} selected={selected} disabled={dimmed}>
      <group>
        <mesh position={[0, 0.1, 0]} material={steel}>
          <boxGeometry args={[length, 0.2, width]} />
        </mesh>
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Strut key={`${sx}${sz}`} from={[sx * length * 0.45, 0.1, sz * width * 0.45]} to={[sx * length * 0.45, top, sz * width * 0.45]} radius={0.07} material={frame} segments={6} />))}
        {[-1, 1].map((sz) => (
          <Strut key={sz} from={[-length * 0.45, top, sz * width * 0.45]} to={[length * 0.45, top, sz * width * 0.45]} radius={0.07} material={frame} segments={6} />
        ))}
        <Strut from={[-length * 0.35, 0.7, 0]} to={[length * 0.35, 0.7, 0]} radius={wide ? 0.22 : 0.3} material={pipe} segments={10} />
        {wide
          ? [-0.3, 0, 0.3].map((fraction) => <Strut key={fraction} from={[length * fraction, 0.7, 0]} to={[length * fraction, 0.7, width * 0.38]} radius={0.12} material={pipe} segments={8} />)
          : null}
      </group>
    </Selectable>
  );
}
