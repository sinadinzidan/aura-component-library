import { Edges } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { Plane } from 'three';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { explodeOffset } from '../models/explodeOffsets';
import { setSceneCursor } from '../sceneCursor';
import { useSceneEnvironment } from '../sceneEnvironment';

import { enableLocalClipping } from './clipRenderer';
import { colorKeyFor } from './colorBy';
import type { ColorKey, ColorMode } from './colorBy';
import type { PartDisplay } from './modelTree';
import { VIEWER_EXPLODE, VIEWER_PARTS } from './viewerModel';
import type { ViewerPart } from './viewerModel';

export type ViewerModelProps = {
  parts?: readonly ViewerPart[];
  /** Solid, ghosted or hidden, per part id. Parts without an entry are solid. */
  display?: Readonly<Record<string, PartDisplay>>;
  colorMode?: ColorMode;
  /** Resolved colours of every colour key. */
  colors: Readonly<Record<ColorKey, string>>;
  selectedId?: string | null;
  hoveredId?: string | null;
  /** 0 assembled, 1 fully exploded. */
  explode?: number;
  /** See through solid parts so what is inside shows. */
  xray?: boolean;
  /** The section plane, when one is cutting. */
  clipPlane?: Plane | null;
  /** A click on a part, with the world point that was hit. Ghosted parts do not take clicks. */
  onPartClick?: (id: string, point: Vec3) => void;
  onPartHover?: (id: string | null) => void;
};

const GHOST_OPACITY = 0.1;
const XRAY_OPACITY = 0.3;

/** The geometry of one part, centred on its own origin and lifted so it stands on the ground. */
function PartGeometry({ part }: { part: ViewerPart }) {
  if (part.shape === 'box') {
    return <boxGeometry args={[part.size[0], part.size[1], part.size[2]]} />;
  }
  if (part.shape === 'hcyl') {
    return <cylinderGeometry args={[part.size[1] / 2, part.size[1] / 2, part.size[0], 28]} />;
  }
  return <cylinderGeometry args={[part.size[0] / 2, part.size[0] / 2, part.size[1], 28]} />;
}

function lift(part: ViewerPart): number {
  return part.size[1] / 2;
}

/**
 * The module the viewer chrome works on, drawn from primitives: ten parts that can be hidden,
 * ghosted, exploded, coloured by a property, selected and clicked. Colour is applied only when a
 * colour mode asks for it; otherwise every part is steel. Render inside `SceneCanvas`.
 */
export function ViewerModel({ parts = VIEWER_PARTS, display = {}, colorMode = 'none', colors, selectedId = null, hoveredId = null, explode = 0, xray = false, clipPlane = null, onPartClick, onPartHover }: ViewerModelProps) {
  const { palette } = useSceneEnvironment();
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const planes = useMemo(() => (clipPlane ? [clipPlane] : []), [clipPlane]);

  useEffect(() => {
    enableLocalClipping(gl);
    invalidate();
  }, [gl, invalidate]);

  useEffect(() => () => setSceneCursor(gl.domElement, ''), [gl]);

  return (
    <group>
      {parts.map((part) => {
        const mode = display[part.id] ?? 'solid';
        if (mode === 'hidden') return null;
        const ghost = mode === 'ghost';
        const [dx, dy, dz] = explodeOffset(VIEWER_EXPLODE[part.id] ?? { direction: [0, 0, 0], distance: 0 }, explode);
        const colorKey = colorKeyFor(part, colorMode);
        const active = !ghost && (part.id === selectedId || part.id === hoveredId);
        const translucent = ghost || xray;
        return (
          <group key={part.id} position={[part.position[0] + dx, part.position[1] + dy, part.position[2] + dz]}>
            <mesh
              position={[0, lift(part), 0]}
              rotation={part.shape === 'hcyl' ? [0, 0, Math.PI / 2] : [0, 0, 0]}
              raycast={ghost ? () => null : undefined}
              onClick={
                ghost
                  ? undefined
                  : (event: ThreeEvent<MouseEvent>) => {
                      event.stopPropagation();
                      onPartClick?.(part.id, toTuple([event.point.x, event.point.y, event.point.z]));
                    }
              }
              onPointerOver={
                ghost
                  ? undefined
                  : (event: ThreeEvent<PointerEvent>) => {
                      event.stopPropagation();
                      setSceneCursor(gl.domElement, 'pointer');
                      onPartHover?.(part.id);
                    }
              }
              onPointerOut={
                ghost
                  ? undefined
                  : () => {
                      setSceneCursor(gl.domElement, '');
                      onPartHover?.(null);
                    }
              }
            >
              <PartGeometry part={part} />
              {/* The shader forces full opacity while a material is opaque, so switching to translucent needs a new material, not a changed one. */}
              <meshStandardMaterial
                key={translucent ? 'translucent' : 'opaque'}
                color={colors[colorKey]}
                roughness={0.6}
                metalness={0.12}
                transparent={translucent}
                opacity={ghost ? GHOST_OPACITY : xray ? XRAY_OPACITY : 1}
                depthWrite={!translucent}
                clippingPlanes={planes}
              />
              {active ? <Edges color={palette.accent.color} /> : null}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
