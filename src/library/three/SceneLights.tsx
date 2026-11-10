import { useSceneEnvironment } from './sceneEnvironment';

export type SceneLightsProps = {
  /** Multiplier on all three lights. */
  intensity?: number;
  /** Where the key light stands, relative to the origin. */
  sunPosition?: [number, number, number];
  castShadow?: boolean;
};

/**
 * The standard light set: ambient fill, a hemisphere light whose ground bounce takes the theme's
 * floor colour, and one directional key light. Tuned so steel reads clearly on both near-black
 * and near-white floors. No environment maps: scenes run offline inside a strict CSP.
 */
export function SceneLights({ intensity = 1, sunPosition = [40, 70, 50], castShadow = false }: SceneLightsProps) {
  const { palette } = useSceneEnvironment();

  return (
    <>
      <ambientLight intensity={1.1 * intensity} />
      <hemisphereLight groundColor={palette.ground.color} intensity={0.9 * intensity} />
      <directionalLight position={sunPosition} intensity={2.2 * intensity} castShadow={castShadow} />
      <directionalLight position={[-sunPosition[0], sunPosition[1] * 0.4, -sunPosition[2]]} intensity={0.5 * intensity} />
    </>
  );
}
