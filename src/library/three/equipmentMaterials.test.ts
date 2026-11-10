import { getEquipmentMaterials } from './equipmentMaterials';
import { makeTestPalette } from './scenePalette.fixture';

describe(getEquipmentMaterials.name, () => {
  it('shares materials between models in the same state', () => {
    const palette = makeTestPalette();

    expect(getEquipmentMaterials(palette, {})).toBe(getEquipmentMaterials(palette));
  });

  it('builds separate materials per palette', () => {
    expect(getEquipmentMaterials(makeTestPalette())).not.toBe(getEquipmentMaterials(makeTestPalette()));
  });

  it('glows on hover and selection without changing the base colour', () => {
    const palette = makeTestPalette();
    const idle = getEquipmentMaterials(palette);
    const hovered = getEquipmentMaterials(palette, { hovered: true });
    const selected = getEquipmentMaterials(palette, { selected: true });

    expect(idle.steel.emissiveIntensity).toBe(0);
    expect(hovered.steel.emissiveIntensity).toBeGreaterThan(selected.steel.emissiveIntensity);
    expect(selected.steel.emissiveIntensity).toBeGreaterThan(0);
    expect(hovered.steel.color.equals(idle.steel.color)).toBe(true);
  });

  it('fades dimmed equipment and stops it writing depth', () => {
    const dimmed = getEquipmentMaterials(makeTestPalette(), { dimmed: true });

    expect(dimmed.steel.transparent).toBe(true);
    expect(dimmed.steel.opacity).toBeLessThan(0.5);
    expect(dimmed.steel.depthWrite).toBe(false);
  });
});
