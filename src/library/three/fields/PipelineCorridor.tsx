import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial } from 'three';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { wellTubeGeometry } from '../models/wellTubeGeometry';
import { quaternionFromY } from '../pipeGeometry';
import { useSceneEnvironment } from '../sceneEnvironment';
import { SceneLabel } from '../SceneLabel';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { anomalySeverity, leakIsolation, PIPELINE_ANOMALIES, PIPELINE_LEAK, PIPELINE_STATIONS, PIPELINE_TOTAL_KM, pipelineDips, pipelineGround, positionAtKp } from './pipelineData';
import type { AnomalySeverity, LeakStage, PipelineAnomaly, PipelineStation } from './pipelineData';
import { kpToDistance, routeSlice } from './routeSpline';
import type { Route } from './routeSpline';
import { SeabedTerrain } from './SeabedTerrain';
import { StationModel } from './StationModel';

export type PipelineCorridorProps = {
  route: Route;
  stations?: readonly PipelineStation[];
  anomalies?: readonly PipelineAnomaly[];
  selectedAnomalyId?: string | null;
  onSelectAnomaly?: (id: string) => void;
  /** Station in focus; its label takes the accent border. */
  selectedStationId?: string | null;
  /** Position of the in-line inspection pig, in kilometres. `null` hides it. */
  pigKp?: number | null;
  /** Where the camera is in the overview, in kilometres. `null` hides the marker. */
  cursorKp?: number | null;
  leakStage?: LeakStage;
  /** Kilometre posts every this many kilometres. 0 draws none. */
  postEvery?: number;
  /** Station and post labels. */
  labels?: boolean;
};

const SEVERITY_TONE = { high: 'critical', medium: 'warning', low: 'info' } as const satisfies Record<Exclude<AnomalySeverity, 'critical'>, 'critical' | 'warning' | 'info'>;
const PIPE_RADIUS = 0.5;

function rotationFor(tangent: Vec3): number {
  return -Math.atan2(tangent[2], tangent[0]);
}

/**
 * A pipeline corridor laid over low-poly terrain: the line itself, kilometre posts, the stations
 * built from plant models, a river and a road crossing, pins for the anomalies from the last
 * inspection, the inspection pig, and the leak scenario (pressure rings, a plume and the shut-in
 * segment). Everything is placed from the route by chainage, so the 3D and the profile agree.
 */
export function PipelineCorridor({
  route,
  stations = PIPELINE_STATIONS,
  anomalies = PIPELINE_ANOMALIES,
  selectedAnomalyId = null,
  onSelectAnomaly,
  selectedStationId = null,
  pigKp = null,
  cursorKp = null,
  leakStage = 'off',
  postEvery = 10,
  labels = true,
}: PipelineCorridorProps) {
  const { palette } = useSceneEnvironment();
  const { pipe } = useEquipmentMaterials();
  const ground = useMemo(() => (x: number, z: number) => pipelineGround(route, x, z), [route]);
  const endX = route.samples[route.samples.length - 1]?.position[0] ?? 0;
  const terrainSize = useMemo(() => [endX + 70, 120] as const, [endX]);
  const terrainCentre = useMemo(() => [endX / 2, 0] as const, [endX]);
  const segments = useMemo(() => [Math.round(terrainSize[0] / 5), 22] as const, [terrainSize]);
  const dips = useMemo(() => pipelineDips(route), [route]);

  const line = useMemo(() => wellTubeGeometry(route.samples.map((sample) => sample.position), PIPE_RADIUS), [route]);
  useEffect(() => () => line.dispose(), [line]);

  const pair = leakStage === 'isolated' ? leakIsolation() : null;
  const isolated = useMemo(() => {
    if (!pair) return null;
    const points = routeSlice(route, kpToDistance(route, pair.upstream.kp, PIPELINE_TOTAL_KM), kpToDistance(route, pair.downstream.kp, PIPELINE_TOTAL_KM));
    return wellTubeGeometry(points, PIPE_RADIUS * 1.25);
    // The pair's chainages are constants of the scenario; the route is what can change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, leakStage]);
  useEffect(() => () => isolated?.dispose(), [isolated]);
  const warning = useMemo(() => new MeshStandardMaterial({ color: palette.warning.color, emissive: palette.warning.color, emissiveIntensity: 0.5, roughness: 0.5 }), [palette]);
  useEffect(() => () => warning.dispose(), [warning]);

  const leak = positionAtKp(route, PIPELINE_LEAK.kp).position;
  const [qx, qy, qz, qw] = quaternionFromY(positionAtKp(route, pigKp ?? 0).tangent);
  const pigQuaternion: [number, number, number, number] = [qx, qy, qz, qw];
  const posts: number[] = [];
  if (postEvery > 0) for (let kp = postEvery; kp < PIPELINE_TOTAL_KM; kp += postEvery) posts.push(kp);

  return (
    <>
      <SeabedTerrain height={ground} size={terrainSize} center={terrainCentre} segments={segments} wire={0.12} />

      <mesh geometry={line} material={pipe} />
      {isolated ? <mesh geometry={isolated} material={warning} /> : null}

      {dips.map((dip, index) => {
        const station = stations.filter((candidate) => candidate.kind === 'crossing')[index];
        if (!station) return null;
        const at = positionAtKp(route, station.kp).position;
        const bed = ground(at[0], at[2]);
        return station.crossing === 'river' ? (
          <mesh key={station.id} rotation={[-Math.PI / 2, 0, 0]} position={[at[0], bed + 1.4, at[2]]}>
            <planeGeometry args={[dip.width * 0.62, 90]} />
            <meshBasicMaterial color={palette.liquid.color} transparent opacity={0.45 * palette.liquid.opacity + 0.1} depthWrite={false} />
          </mesh>
        ) : (
          <group key={station.id} position={[at[0], bed + 0.12, at[2]]}>
            <mesh>
              <boxGeometry args={[dip.width * 0.8, 0.2, 34]} />
              <meshStandardMaterial color={palette.line.color} roughness={1} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * dip.width * 0.36, 0.12, 0]}>
                <boxGeometry args={[0.18, 0.06, 34]} />
                <meshBasicMaterial color={palette.highlight.color} />
              </mesh>
            ))}
          </group>
        );
      })}

      {posts.map((kp) => {
        const sample = positionAtKp(route, kp);
        const base = ground(sample.position[0], sample.position[2] + 3.2);
        return (
          <group key={kp}>
            <mesh position={[sample.position[0], base + 1.1, sample.position[2] + 3.2]}>
              <boxGeometry args={[0.35, 2.2, 0.35]} />
              <meshStandardMaterial color={palette.highlight.color} roughness={0.7} />
            </mesh>
            {labels ? <SceneLabel position={[sample.position[0], base + 2.4, sample.position[2] + 3.2]} tag={`KP ${kp}`} maxDistance={95} dimmed /> : null}
          </group>
        );
      })}

      {stations.map((station) => {
        if (station.kind === 'crossing') return null;
        const sample = positionAtKp(route, station.kp);
        const base: Vec3 = [sample.position[0], sample.position[1] - 1, sample.position[2]];
        return (
          <group key={station.id}>
            <StationModel kind={station.kind} position={base} rotationY={rotationFor(sample.tangent)} />
          </group>
        );
      })}
      {labels
        ? stations.map((station) => {
            const sample = positionAtKp(route, station.kp);
            return <SceneLabel key={station.id} position={[sample.position[0], sample.position[1] + (station.kind === 'crossing' ? 5 : 8), sample.position[2]]} tag={station.short} selected={station.id === selectedStationId} maxDistance={130} />;
          })
        : null}

      {anomalies.map((anomaly) => {
        const sample = positionAtKp(route, anomaly.kp);
        const severity = anomalySeverity(anomaly);
        const tone = SEVERITY_TONE[severity === 'critical' ? 'high' : severity];
        const selected = anomaly.id === selectedAnomalyId;
        const size = (severity === 'high' ? 0.62 : severity === 'medium' ? 0.5 : 0.4) * (selected ? 1.4 : 1);
        const top: Vec3 = [sample.position[0], sample.position[1] + 2.6, sample.position[2]];
        return (
          <group key={anomaly.id}>
            <mesh position={[top[0], sample.position[1] + 1.4, top[2]]}>
              <cylinderGeometry args={[0.05, 0.05, 1.7, 6]} />
              <meshBasicMaterial color={palette[tone].color} />
            </mesh>
            <mesh
              position={toTuple(top)}
              onClick={(event) => {
                event.stopPropagation();
                onSelectAnomaly?.(anomaly.id);
              }}
              onPointerOver={(event) => event.stopPropagation()}
            >
              {severity === 'high' ? <octahedronGeometry args={[size * 1.2]} /> : severity === 'medium' ? <boxGeometry args={[size * 1.3, size * 1.3, size * 1.3]} /> : <sphereGeometry args={[size, 12, 8]} />}
              <meshBasicMaterial color={palette[tone].color} />
            </mesh>
            {selected && labels ? <SceneLabel position={[top[0], top[1] + 0.8, top[2]]} tag={`KP ${anomaly.kp}`} value={`${anomaly.depth}% wall`} tone={tone} selected /> : null}
          </group>
        );
      })}

      {pigKp !== null ? (
        <group position={positionAtKp(route, pigKp).position} quaternion={pigQuaternion}>
          <mesh>
            <cylinderGeometry args={[PIPE_RADIUS * 2, PIPE_RADIUS * 2, 2.4, 16, 1, true]} />
            <meshBasicMaterial color={palette.accent.color} transparent opacity={0.6} depthWrite={false} side={2} />
          </mesh>
        </group>
      ) : null}
      {pigKp !== null && labels ? (
        <SceneLabel position={[positionAtKp(route, pigKp).position[0], positionAtKp(route, pigKp).position[1] + 5, positionAtKp(route, pigKp).position[2]]} tag="ILI pig" value={`KP ${pigKp.toFixed(1)}`} selected maxDistance={120} />
      ) : null}

      {cursorKp !== null ? (
        <mesh position={positionAtKp(route, cursorKp).position}>
          <sphereGeometry args={[1.1, 14, 10]} />
          <meshBasicMaterial color={palette.accent.color} transparent opacity={0.85} depthTest={false} />
        </mesh>
      ) : null}

      {leakStage !== 'off' ? (
        <group position={[leak[0], ground(leak[0], leak[2]) + 0.25, leak[2]]}>
          {[3.5, 7, 11].map((radius, index) => (
            <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[radius - 0.25, radius, 40]} />
              <meshBasicMaterial color={palette.warning.color} transparent opacity={0.9 - index * 0.25} depthWrite={false} />
            </mesh>
          ))}
          <mesh position={[0, (leak[1] - ground(leak[0], leak[2])) / 2 + 2.2, 0]}>
            <coneGeometry args={[1.8, 5.5, 14, 1, true]} />
            <meshBasicMaterial color={palette.warning.color} transparent opacity={0.4} depthWrite={false} side={2} />
          </mesh>
        </group>
      ) : null}
      {leakStage !== 'off' && labels ? <SceneLabel position={[leak[0], leak[1] + 7, leak[2]]} tag={`KP ${PIPELINE_LEAK.kp}`} value={leakStage === 'detected' ? 'Leak detected' : 'Segment isolated'} tone="warning" shape="diamond" /> : null}
    </>
  );
}
