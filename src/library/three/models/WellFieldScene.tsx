import { CameraRig } from '../CameraRig';
import type { ViewInsetsValue, Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';
import type { SceneTone } from '../scenePalette';
import type { TokenColors } from '../tokenColors';
import { ViewInsets } from '../ViewInsets';

import { DepthPlane } from './DepthPlane';
import { horizonDepthAt } from './horizonHeight';
import type { Horizon } from './horizonHeight';
import { HorizonSurface } from './HorizonSurface';
import { ReservoirZone } from './ReservoirZone';
import { SubseaTemplate } from './SubseaTemplate';
import { wellFieldCameraTarget } from './wellFieldCamera';
import type { WellFieldView } from './wellFieldCamera';
import { HORIZON_TOKEN_KEYS } from './wellFieldTokens';
import type { WELL_FIELD_TOKENS } from './wellFieldTokens';
import { Wellhead } from './Wellhead';
import type { WellheadKind } from './Wellhead';
import { WellTube } from './WellTube';

export type WellFieldSceneWell = {
  id: string;
  /** Short name on the label at the toe of the well. */
  tag: string;
  kind: WellheadKind;
  /** The path in scene coordinates, wellhead first. */
  points: readonly Vec3[];
  /** Status text and tone, shown on the label of the selected well. */
  status?: string;
  tone?: SceneTone;
};

export type WellFieldLayers = { horizons: boolean; wellbores: boolean; reservoir: boolean; labels: boolean };

export type WellFieldSceneProps = {
  wells: readonly WellFieldSceneWell[];
  /** Shallowest first. */
  horizons: readonly Horizon[];
  /** Ids of the horizons that bound the reservoir: top and base. */
  reservoir?: { topId: string; baseId: string };
  /** Half the width of the mapped block, in metres. */
  halfExtent: number;
  /** Depth of the block, in metres. */
  blockDepth: number;
  /** Scene units per metre. */
  scale: number;
  /** Depth of the cutting plane, in metres TVD. */
  depth: number;
  /** Where wells cross the cutting plane, in scene coordinates. */
  crossings?: readonly { id: string; position: Vec3 }[];
  layers?: WellFieldLayers;
  view?: WellFieldView;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onHoverChange?: (id: string | null) => void;
  /** Tokens resolved outside the canvas. Without them the scene falls back to the shared palette. */
  colors?: TokenColors<typeof WELL_FIELD_TOKENS> | null;
  /** Pixels that overlays cover on each edge of the canvas. */
  insets?: ViewInsetsValue;
  /** Multiplier on the camera distance. */
  padding?: number;
  /** Width of the template on the seabed and size of the wellhead markers, in scene units. Drawn larger than life so they read. */
  templateSize?: number;
  wellheadSize?: number;
  /** Radius of the wellbore tubes. */
  wellRadius?: number;
};

const ALL_LAYERS: WellFieldLayers = { horizons: true, wellbores: true, reservoir: true, labels: true };

/**
 * A subsurface block: a translucent seabed with a template and wellheads, well paths curving
 * down through undulating horizons into the reservoir, and a cutting plane at the chosen depth.
 * Wells are selectable; one in focus ghosts the rest. Pure data in, so the page owns the wells,
 * surveys and what each layer shows.
 */
export function WellFieldScene({
  wells,
  horizons,
  reservoir,
  halfExtent,
  blockDepth,
  scale,
  depth,
  crossings = [],
  layers = ALL_LAYERS,
  view = 'perspective',
  selectedId = null,
  onSelect,
  onHoverChange,
  colors = null,
  insets,
  padding = 1,
  templateSize = 7.4,
  wellheadSize = 1.6,
  wellRadius = 0.15,
}: WellFieldSceneProps) {
  const { palette } = useSceneEnvironment();
  const half = halfExtent * scale;
  const target = wellFieldCameraTarget(view, { halfExtent: half, depth: blockDepth * scale }, { padding });
  const kindColor = (kind: WellheadKind): string => (colors ? colors[kind].color : kind === 'producer' ? palette.liquid.color : palette.highlight.color);
  const horizonColor = (index: number): string => (colors ? colors[HORIZON_TOKEN_KEYS[Math.min(index, HORIZON_TOKEN_KEYS.length - 1)]].color : palette.steel.color);
  const top = horizons.find((horizon) => horizon.id === reservoir?.topId);
  const base = horizons.find((horizon) => horizon.id === reservoir?.baseId);
  const topIndex = top ? horizons.indexOf(top) : 0;

  return (
    <>
      <SceneLights />
      <CameraRig target={target} minDistance={6} maxDistance={half * 9} maxPolarAngle={Math.PI * 0.74} />
      {insets ? <ViewInsets {...insets} /> : null}

      {/* Seabed: translucent, so the wells show through from above */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[half * 2, half * 2, 8, 8]} />
        <meshStandardMaterial color={palette.ground.color} transparent opacity={0.5} depthWrite={false} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[half * 2, half * 2, 8, 8]} />
        <meshBasicMaterial color={palette.frame.color} wireframe transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <SubseaTemplate size={[templateSize, templateSize]} height={templateSize * 0.3} dimmed={selectedId !== null} />

      {layers.horizons
        ? horizons.map((horizon, index) => (
            <HorizonSurface key={horizon.id} horizon={horizon} halfExtent={halfExtent} scale={scale} color={horizonColor(index)} opacity={selectedId ? 0.08 : 0.14} />
          ))
        : null}
      {layers.reservoir && top && base ? (
        <ReservoirZone top={-top.depth * scale} base={-base.depth * scale} halfExtent={half * 0.82} color={horizonColor(topIndex)} />
      ) : null}

      {wells.map((well) => {
        const selected = well.id === selectedId;
        const dimmed = selectedId !== null && !selected;
        const color = kindColor(well.kind);
        const toe = well.points[well.points.length - 1];
        return (
          <group key={well.id}>
            <Wellhead position={well.points[0]} kind={well.kind} color={color} selected={selected} dimmed={dimmed} size={wellheadSize} />
            {layers.wellbores ? (
              <WellTube id={well.id} points={well.points} color={color} radius={wellRadius} selected={selected} dimmed={dimmed} onSelect={onSelect} onHoverChange={onHoverChange} />
            ) : null}
            {layers.labels && layers.wellbores && toe && (!dimmed || selectedId === null) ? (
              <SceneLabel
                position={toe}
                tag={well.tag}
                value={selected ? well.status : undefined}
                tone={selected ? well.tone : undefined}
                selected={selected}
                onClick={onSelect ? () => onSelect(well.id) : undefined}
              />
            ) : null}
          </group>
        );
      })}

      {layers.labels && layers.horizons
        ? horizons.map((horizon) => (
            <SceneLabel key={horizon.id} position={[-half, -horizonDepthAt(horizon, -halfExtent, -halfExtent) * scale, half]} tag={horizon.name} dimmed />
          ))
        : null}

      <DepthPlane
        y={-depth * scale}
        halfExtent={half}
        marks={crossings.map((crossing) => ({ id: crossing.id, position: crossing.position, emphasized: crossing.id === selectedId }))}
        markRadius={wellRadius * 3}
      />
    </>
  );
}
