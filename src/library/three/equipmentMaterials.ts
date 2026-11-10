import { Color, MeshStandardMaterial } from 'three';

import type { ScenePalette } from './scenePalette';

/** How a piece of equipment is being interacted with. Changes its materials, never its colour scheme. */
export type EquipmentVisualState = {
  hovered?: boolean;
  selected?: boolean;
  /** Fades the equipment back, for everything outside the area in focus. */
  dimmed?: boolean;
};

/** The shared materials every equipment model is built from. */
export type EquipmentMaterials = {
  /** Bodies: shells, casings, enclosures. */
  steel: MeshStandardMaterial;
  /** Structure: base frames, saddles, legs, skirts. */
  frame: MeshStandardMaterial;
  /** Nozzles and pipework. */
  pipe: MeshStandardMaterial;
  /** Small details that should catch the eye: nameplates, couplings, windows. */
  detail: MeshStandardMaterial;
};

const DIMMED_OPACITY = 0.2;
const HOVER_GLOW = 0.22;
const SELECTED_GLOW = 0.14;

const cache = new WeakMap<ScenePalette, Map<string, EquipmentMaterials>>();

function stateKey(state: EquipmentVisualState): string {
  return `${state.hovered ? 'h' : '-'}${state.selected ? 's' : '-'}${state.dimmed ? 'd' : '-'}`;
}

function build(palette: ScenePalette, state: EquipmentVisualState): EquipmentMaterials {
  const glow = state.hovered ? HOVER_GLOW : state.selected ? SELECTED_GLOW : 0;
  const make = (color: string, roughness: number, metalness: number): MeshStandardMaterial =>
    new MeshStandardMaterial({
      color: new Color(color),
      roughness,
      metalness,
      emissive: new Color(palette.accent.color),
      emissiveIntensity: glow,
      transparent: Boolean(state.dimmed),
      opacity: state.dimmed ? DIMMED_OPACITY : 1,
      depthWrite: !state.dimmed,
    });

  return {
    steel: make(palette.steel.color, 0.55, 0.15),
    frame: make(palette.frame.color, 0.8, 0.05),
    pipe: make(palette.pipe.color, 0.5, 0.2),
    detail: make(palette.highlight.color, 0.4, 0.1),
  };
}

/**
 * Materials for one palette and interaction state, created once and shared by every model that
 * asks for the same combination. A whole plant therefore draws with a handful of materials.
 */
export function getEquipmentMaterials(palette: ScenePalette, state: EquipmentVisualState = {}): EquipmentMaterials {
  let byState = cache.get(palette);
  if (!byState) {
    byState = new Map();
    cache.set(palette, byState);
  }
  const key = stateKey(state);
  let materials = byState.get(key);
  if (!materials) {
    materials = build(palette, state);
    byState.set(key, materials);
  }
  return materials;
}
