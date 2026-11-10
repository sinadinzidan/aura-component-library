import { Html } from '@react-three/drei';
import { useMemo } from 'react';

import { cn } from '../../../lib/utils';
import { TONE_BORDER, TONE_TEXT } from '../../industrial/status';
import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { SceneEnvironmentContext, useSceneEnvironment } from '../sceneEnvironment';
import type { SceneTone } from '../scenePalette';
import { SensorMarker } from '../SensorMarker';

export type HotspotProps = {
  /** Where the measurement is taken, in the coordinates of the parent group. */
  position: Vec3;
  /** The number printed on the badge. The same number labels the reading in the DOM list. */
  index: number;
  /** Instrument tag, shown beside the number while the hotspot is selected. */
  tag: string;
  /** The formatted reading, shown with the tag while selected. */
  value?: string;
  /** Status of the reading. Without one the hotspot takes the accent colour. */
  tone?: SceneTone;
  selected?: boolean;
  /** Expanding halo, for a reading in alarm. Holds still under reduced motion. */
  pulse?: boolean;
  /** Quieter badge, for hotspots on parts that are ghosted. */
  dimmed?: boolean;
  onSelect?: () => void;
};

/**
 * A numbered measurement point on a machine: a `SensorMarker` on the spot and a round badge with
 * the number above it. Selecting it widens the badge to show the tag and reading. Pointer only —
 * list the same readings as buttons outside the canvas.
 */
export function Hotspot({ position, index, tag, value, tone, selected = false, pulse = false, dimmed = false, onSelect }: HotspotProps) {
  const environment = useSceneEnvironment();
  const markerEnvironment = useMemo(() => ({ ...environment, reducedMotion: environment.reducedMotion || !pulse }), [environment, pulse]);
  const alert = tone !== undefined && tone !== 'neutral';
  const badge = cn(
    'pointer-events-auto flex h-5 min-w-5 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-1 font-mono text-xs leading-none tabular-nums',
    'bg-[color-mix(in_oklab,var(--card-background)_88%,transparent)] backdrop-blur-sm',
    selected ? 'border-[var(--primary-background)] px-2' : alert ? TONE_BORDER[tone] : 'border-emphasized',
    dimmed && !selected && 'opacity-50'
  );

  return (
    <group position={toTuple(position)}>
      <SceneEnvironmentContext.Provider value={markerEnvironment}>
        <SensorMarker position={[0, 0, 0]} tone={tone} size={selected ? 0.16 : 0.12} />
      </SceneEnvironmentContext.Provider>
      <mesh
        onClick={
          onSelect
            ? (event) => {
                event.stopPropagation();
                onSelect();
              }
            : undefined
        }
      >
        <sphereGeometry args={[0.32, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div data-slot="hotspot" data-selected={selected || undefined} aria-hidden="true" className="-translate-y-5 font-sans">
          <button type="button" tabIndex={-1} onClick={onSelect} className={badge}>
            <span className={cn('font-semibold', alert ? TONE_TEXT[tone] : 'text-base-foreground')}>{index}</span>
            {selected ? (
              <>
                <span className="text-base-foreground">{tag}</span>
                {value ? <span className={alert ? TONE_TEXT[tone] : 'text-medium-foreground'}>{value}</span> : null}
              </>
            ) : null}
          </button>
        </div>
      </Html>
    </group>
  );
}
