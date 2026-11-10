import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box3, BoxGeometry, EdgesGeometry, Vector3 } from 'three';
import type { Group, LineSegments } from 'three';

import { setSceneCursor } from './sceneCursor';
import { useSceneEnvironment } from './sceneEnvironment';

export type SelectableState = { hovered: boolean; selected: boolean };

export type SelectableProps = {
  id: string;
  /** Called with the id on click. */
  onSelect?: (id: string) => void;
  /** Called with the id on pointer enter and `null` on leave, to mirror hover in DOM panels. */
  onHoverChange?: (id: string | null) => void;
  selected?: boolean;
  /** Turns off interaction and highlight, e.g. for equipment outside the area in focus. */
  disabled?: boolean;
  /** Box outline in the accent colour while hovered or selected. */
  outline?: boolean;
  /** Meshes, or a function of the hover/selection state so models can glow. */
  children: ReactNode | ((state: SelectableState) => ReactNode);
};

const OUTLINE_MARGIN = 0.5;
/** One unit cube outline, scaled to each selectable's bounds. */
const UNIT_EDGES = new EdgesGeometry(new BoxGeometry(1, 1, 1));

/**
 * Makes the meshes inside it hoverable and clickable: pointer cursor, an outline box in the accent
 * colour, and `onSelect(id)`. Pass a render function to forward the state to an equipment model:
 *
 *   <Selectable id="23-ka-9101" onSelect={select} selected={isSelected}>
 *     {(state) => <CompressorSkid {...state} />}
 *   </Selectable>
 */
export function Selectable({ id, onSelect, onHoverChange, selected = false, disabled = false, outline = true, children }: SelectableProps) {
  const { palette } = useSceneEnvironment();
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const root = useRef<Group>(null);
  const content = useRef<Group>(null);
  const box = useRef<LineSegments>(null);
  const [pointerOver, setPointerOver] = useState(false);
  const hovered = pointerOver && !disabled;
  const active = outline && !disabled && (hovered || selected);

  useLayoutEffect(() => {
    if (!active || !root.current || !content.current || !box.current) return;
    root.current.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(content.current);
    if (bounds.isEmpty()) return;
    bounds.applyMatrix4(root.current.matrixWorld.clone().invert());
    bounds.getCenter(box.current.position);
    const size = bounds.getSize(new Vector3());
    box.current.scale.set(size.x + OUTLINE_MARGIN, size.y + OUTLINE_MARGIN, size.z + OUTLINE_MARGIN);
    invalidate();
  }, [active, invalidate]);

  useEffect(() => () => setSceneCursor(gl.domElement, ''), [gl]);

  const enter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setPointerOver(true);
    setSceneCursor(gl.domElement, 'pointer');
    onHoverChange?.(id);
    invalidate();
  };
  const leave = () => {
    setPointerOver(false);
    setSceneCursor(gl.domElement, '');
    onHoverChange?.(null);
    invalidate();
  };
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect?.(id);
  };

  const state: SelectableState = { hovered, selected };

  return (
    <group ref={root}>
      <group
        ref={content}
        onPointerOver={disabled ? undefined : enter}
        onPointerOut={disabled ? undefined : leave}
        onClick={disabled ? undefined : click}
      >
        {typeof children === 'function' ? children(state) : children}
      </group>
      <lineSegments ref={box} geometry={UNIT_EDGES} visible={active}>
        <lineBasicMaterial color={palette.accent.color} transparent opacity={selected ? 1 : 0.7} />
      </lineSegments>
    </group>
  );
}
