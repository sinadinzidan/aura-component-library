import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

import { CameraRig } from '../CameraRig';
import { boundsRadius, frameBounds, unionBounds } from '../cameraTargets';
import { EquipmentModel } from '../EquipmentModel';
import { Ground } from '../Ground';
import { PipeRun } from '../PipeRun';
import { equipmentBounds, labelAnchor } from '../plantLayout';
import type { PlantEquipment } from '../plantLayout';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';
import { Selectable } from '../Selectable';

import { COMPRESSION_PIPES, COMPRESSION_SCENE } from './compressionArea';
import { tagForId } from './tagMapping';
import type { TagLink } from './tagMapping';

export type SplitSceneProps = {
  links: readonly TagLink[];
  selectedTag: string | null;
  /** The tag highlighted because the pointer is over it on either side. */
  hoverTag: string | null;
  /** The tag the camera frames. `null` frames the whole area. */
  focusTag: string | null;
  /** Ghost everything the drawing does not show. */
  drawingOnly: boolean;
  /** Called with the tag of the object that was clicked. */
  onSelect: (tag: string) => void;
  /** Called with the tag under the pointer, and `null` when it leaves. */
  onHover: (tag: string | null) => void;
  items?: readonly PlantEquipment[];
  labels?: boolean;
};

const PIPE_RADIUS = 0.22;

/**
 * The compression area in 3D, built from the plant's equipment models. Objects have scene ids of
 * their own; the mapping table turns them into tags, so selection and hover are reported as tags
 * and the drawing never needs to know the scene's ids. An object the drawing does not show can be
 * ghosted, and the camera flies to whichever tag is in focus.
 */
export function SplitScene({ links, selectedTag, hoverTag, focusTag, drawingOnly, onSelect, onHover, items = COMPRESSION_SCENE, labels = true }: SplitSceneProps) {
  const size = useThree((state) => state.size);
  const aspect = Math.round((size.width / Math.max(size.height, 1)) * 10) / 10;
  const onDrawing = (item: PlantEquipment): boolean => links.some((link) => link.sceneId === item.id && link.drawingId !== null);
  const target = useMemo(() => {
    const focus = items.find((item) => item.tag === focusTag);
    if (focus) return frameBounds(equipmentBounds(focus), { aspect, padding: 2.7, minDistance: 15 });
    const all = unionBounds(items.map(equipmentBounds));
    return frameBounds(all ?? { min: [-10, 0, -10], max: [10, 5, 10] }, { aspect, padding: 1.02 });
  }, [items, focusTag, aspect]);
  const radius = boundsRadius(unionBounds(items.map(equipmentBounds)) ?? { min: [-10, 0, -10], max: [10, 5, 10] });

  return (
    <>
      <SceneLights sunPosition={[radius, radius * 1.4, radius]} />
      <CameraRig target={target} minDistance={8} maxDistance={radius * 5} />
      <Ground size={[radius * 3.4, radius * 2.4]} cell={4} />
      {COMPRESSION_PIPES.map((points, index) => (
        <PipeRun key={index} points={points} radius={PIPE_RADIUS} dimmed={drawingOnly} />
      ))}
      {items.map((item) => {
        const tag = tagForId(links, item.id, 'scene') ?? item.tag;
        const ghost = drawingOnly && !onDrawing(item);
        const selected = tag === selectedTag;
        const hovered = tag === hoverTag;
        return (
          <group key={item.id}>
            <Selectable
              id={item.id}
              selected={selected}
              disabled={ghost}
              onSelect={(id) => {
                const picked = tagForId(links, id, 'scene');
                if (picked) onSelect(picked);
              }}
              onHoverChange={(id) => onHover(id === null ? null : tagForId(links, id, 'scene'))}
            >
              {(state) => <EquipmentModel equipment={item} hovered={state.hovered || hovered} selected={state.selected || selected} dimmed={ghost} />}
            </Selectable>
            {labels ? <SceneLabel position={labelAnchor(item)} tag={item.tag} selected={selected || hovered} dimmed={ghost || (selectedTag !== null && !selected)} /> : null}
          </group>
        );
      })}
    </>
  );
}
