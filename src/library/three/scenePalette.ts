import type { TokenColors } from './tokenColors';

/**
 * The tokens every scene resolves, keyed by the role they play in 3D. `SceneCanvas` resolves this
 * map once per theme and hands it to everything inside through `useSceneEnvironment`.
 * Equipment is neutral steel; colour is reserved for the accent (selection) and status tones.
 */
export const SCENE_TOKENS = {
  /** Plot plan and stage floors. */
  ground: 'card-background',
  /** Minor grid lines and quiet outlines. */
  line: 'default',
  /** Major grid lines, structural frames, saddles and base frames. */
  frame: 'emphasized',
  /** Equipment bodies. */
  steel: 'muted-foreground',
  /** Pipework. */
  pipe: 'medium-foreground',
  /** Highlights that must stand out from steel: nameplates, flow chevrons. */
  highlight: 'base-foreground',
  /** Hover and selection. */
  accent: 'primary-background',
  /** Focus-ring strength accent, for outlines on any surface. */
  outline: 'ring-default',
  neutral: 'neutral-foreground-strong',
  success: 'success-foreground-strong',
  warning: 'warning-foreground-strong',
  critical: 'critical-foreground-strong',
  info: 'info-foreground-strong',
  /** Liquid in tanks and sight glasses. */
  liquid: 'chart-1-450',
  /** Flare flame. */
  flame: 'chart-warning-450',
} as const;

export type ScenePalette = TokenColors<typeof SCENE_TOKENS>;

/** Status tones a scene can show. Matches `Tone` in `industrial/status.ts`. */
export type SceneTone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';
