import { getEquipmentMaterials } from './equipmentMaterials';
import type { EquipmentMaterials, EquipmentVisualState } from './equipmentMaterials';
import { useSceneEnvironment } from './sceneEnvironment';

/** The shared equipment materials for the current theme and the given interaction state. */
export function useEquipmentMaterials(state: EquipmentVisualState = {}): EquipmentMaterials {
  const { palette } = useSceneEnvironment();
  return getEquipmentMaterials(palette, { hovered: state.hovered, selected: state.selected, dimmed: state.dimmed });
}
