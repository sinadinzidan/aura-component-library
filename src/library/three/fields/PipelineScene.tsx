import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

import { CameraRig } from '../CameraRig';
import { frameBounds } from '../cameraTargets';
import type { ViewInsetsValue } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { SceneLights } from '../SceneLights';
import { ViewInsets } from '../ViewInsets';

import { PipelineCorridor } from './PipelineCorridor';
import type { PipelineCorridorProps } from './PipelineCorridor';
import { PIPELINE_TOTAL_KM } from './pipelineData';
import { RailCamera } from './RailCamera';
import { kpToDistance, railPose } from './routeSpline';

export type PipelineSceneProps = Omit<PipelineCorridorProps, 'cursorKp'> & {
  /** Where the camera is, in kilometres. In `rail` it rides there; in `overview` a marker shows it. */
  cameraKp: number;
  /** `rail` rides above the pipe looking ahead; `overview` frames the whole route and can be orbited. */
  mode?: 'rail' | 'overview';
  insets?: ViewInsetsValue;
};

const FOG_NEAR = 60;
const FOG_FAR = 320;

/**
 * The corridor with a camera: on a rail above the pipe at a chainage (distance from the start,
 * looking ahead along the line), or an orbitable overview of the whole route with a marker where
 * the rail camera is. Fog hides the far end of the terrain, so the line seems to carry on.
 */
export function PipelineScene({ route, cameraKp, mode = 'rail', insets, ...corridor }: PipelineSceneProps) {
  const { palette } = useSceneEnvironment();
  const size = useThree((state) => state.size);
  const aspect = Math.round((size.width / Math.max(size.height, 1)) * 10) / 10;
  const pose = useMemo(() => railPose(route, kpToDistance(route, cameraKp, PIPELINE_TOTAL_KM), { height: 5.5, back: 13, lookAhead: 20 }), [route, cameraKp]);
  const overview = useMemo(() => {
    const end = route.samples[route.samples.length - 1]?.position ?? [0, 0, 0];
    return frameBounds({ min: [-15, 0, -30], max: [end[0] + 15, 20, 30] }, { aspect, padding: 0.62, view: 'perspective' });
  }, [route, aspect]);

  return (
    <>
      {mode === 'rail' ? <fog attach="fog" args={[palette.ground.color, FOG_NEAR, FOG_FAR]} /> : null}
      <SceneLights sunPosition={[120, 160, 90]} />
      {mode === 'rail' ? <RailCamera pose={pose} /> : <CameraRig target={overview} minDistance={20} maxDistance={900} />}
      {insets ? <ViewInsets {...insets} /> : null}
      <PipelineCorridor route={route} {...corridor} cursorKp={mode === 'overview' ? cameraKp : null} />
    </>
  );
}
