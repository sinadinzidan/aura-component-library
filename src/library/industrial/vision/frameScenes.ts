import type { SymbolKind } from '../diagrams/symbolPaths';

/**
 * Scenes for token-drawn camera frames. There are no image files in the library, so a frame is a
 * quiet silhouette of the plant it looks at: a horizon, the ground and equipment symbols. Positions
 * are in the 320 × 180 frame the placeholder draws.
 */

export const FRAME_WIDTH = 320;
export const FRAME_HEIGHT = 180;

export type SceneItem = { kind: SymbolKind; x: number; y: number; size: number };
export type SceneLine = { d: string };

export type FrameScene = {
  id: string;
  /** What the camera looks at, for accessible names. */
  description: string;
  /** y of the horizon line. */
  horizon: number;
  items: readonly SceneItem[];
  /** Pipework, racks and fences, as simple paths. */
  lines: readonly SceneLine[];
};

export const FRAME_SCENES: readonly FrameScene[] = [
  {
    id: 'compressor-hall',
    description: 'compressor hall with two compressor trains',
    horizon: 112,
    items: [
      { kind: 'compressor', x: 96, y: 100, size: 64 },
      { kind: 'compressor', x: 214, y: 106, size: 52 },
      { kind: 'motor', x: 40, y: 122, size: 34 },
      { kind: 'gate-valve', x: 276, y: 126, size: 22 },
    ],
    lines: [{ d: 'M 0 138 H 320' }, { d: 'M 20 40 H 300 M 20 40 V 112 M 300 40 V 112' }, { d: 'M 120 138 L 100 180 M 220 138 L 240 180' }],
  },
  {
    id: 'separator-yard',
    description: 'separator yard with an inlet separator and a pressure vessel',
    horizon: 118,
    items: [
      { kind: 'horizontal-separator', x: 108, y: 104, size: 78 },
      { kind: 'vertical-vessel', x: 224, y: 92, size: 70 },
      { kind: 'control-valve', x: 160, y: 142, size: 24 },
    ],
    lines: [{ d: 'M 0 144 H 320' }, { d: 'M 150 104 H 190 V 92' }, { d: 'M 40 60 L 40 144 M 40 60 H 80' }],
  },
  {
    id: 'flare',
    description: 'flare stack against the sky with a pipe rack in front',
    horizon: 130,
    items: [
      { kind: 'flare', x: 214, y: 78, size: 96 },
      { kind: 'vertical-vessel', x: 76, y: 108, size: 56 },
      { kind: 'storage-tank', x: 130, y: 114, size: 44 },
    ],
    lines: [{ d: 'M 0 148 H 320' }, { d: 'M 20 160 H 300 M 40 148 V 160 M 120 148 V 160 M 200 148 V 160 M 280 148 V 160' }],
  },
  {
    id: 'pump-bay',
    description: 'pump bay with two centrifugal pumps and their motors',
    horizon: 108,
    items: [
      { kind: 'centrifugal-pump', x: 88, y: 112, size: 52 },
      { kind: 'motor', x: 40, y: 112, size: 40 },
      { kind: 'centrifugal-pump', x: 224, y: 112, size: 52 },
      { kind: 'motor', x: 272, y: 112, size: 40 },
      { kind: 'check-valve', x: 156, y: 140, size: 20 },
    ],
    lines: [{ d: 'M 0 140 H 320' }, { d: 'M 88 140 H 224' }, { d: 'M 24 40 H 296 M 24 40 V 108 M 296 40 V 108' }],
  },
  {
    id: 'cooler-deck',
    description: 'air cooler bank on an elevated deck with a heat exchanger',
    horizon: 120,
    items: [
      { kind: 'air-cooler', x: 100, y: 84, size: 76 },
      { kind: 'air-cooler', x: 200, y: 84, size: 76 },
      { kind: 'heat-exchanger', x: 272, y: 128, size: 40 },
    ],
    lines: [{ d: 'M 0 148 H 320' }, { d: 'M 30 112 H 240 M 50 112 V 148 M 150 112 V 148 M 230 112 V 148' }],
  },
  {
    id: 'substation',
    description: 'outdoor substation with a transformer and disconnectors',
    horizon: 116,
    items: [
      { kind: 'transformer', x: 92, y: 98, size: 56 },
      { kind: 'disconnector', x: 190, y: 96, size: 44 },
      { kind: 'disconnector', x: 240, y: 96, size: 44 },
      { kind: 'earth', x: 140, y: 138, size: 22 },
    ],
    lines: [{ d: 'M 0 144 H 320' }, { d: 'M 92 70 V 40 H 262 V 74' }, { d: 'M 0 156 H 320' }],
  },
];

export function findScene(id: string): FrameScene {
  return FRAME_SCENES.find((scene) => scene.id === id) ?? FRAME_SCENES[0];
}
