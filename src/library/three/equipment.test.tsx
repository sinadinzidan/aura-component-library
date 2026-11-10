import type { Mesh, Object3D } from 'three';

import { AirCooler } from './AirCooler';
import { Building } from './Building';
import { Column } from './Column';
import { CompressorSkid } from './CompressorSkid';
import { EquipmentModel } from './EquipmentModel';
import { FlareStack } from './FlareStack';
import { GasTurbine } from './GasTurbine';
import { HeatExchanger } from './HeatExchanger';
import { HorizontalVessel } from './HorizontalVessel';
import { EQUIPMENT_SIZES } from './plantLayout';
import type { PlantEquipmentKind } from './plantLayout';
import { PumpSkid } from './PumpSkid';
import { geometryParameter, renderScene } from './renderScene.fixture';
import { ShutdownValve } from './ShutdownValve';
import { StorageTank } from './StorageTank';
import { VerticalVessel } from './VerticalVessel';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const meshes = (objects: Object3D[]): Mesh[] => objects.filter(isMesh);
const rings = (objects: Object3D[]): Mesh[] => meshes(objects).filter((mesh) => mesh.geometry.type === 'RingGeometry');

const MODELS = [
  ['HorizontalVessel', <HorizontalVessel key="m" />],
  ['VerticalVessel', <VerticalVessel key="m" />],
  ['Column', <Column key="m" />],
  ['StorageTank', <StorageTank key="m" />],
  ['CompressorSkid', <CompressorSkid key="m" />],
  ['PumpSkid', <PumpSkid key="m" />],
  ['HeatExchanger', <HeatExchanger key="m" />],
  ['AirCooler', <AirCooler key="m" />],
  ['FlareStack', <FlareStack key="m" />],
  ['Building', <Building key="m" />],
  ['GasTurbine', <GasTurbine key="m" />],
  ['ShutdownValve', <ShutdownValve key="m" />],
] as const;

describe('equipment models', () => {
  it.each(MODELS)('%s builds a model from several primitives', async (_name, model) => {
    const view = await renderScene(model);

    expect(meshes(view.objects()).length).toBeGreaterThan(2);

    await view.unmount();
  });

  it('shows no status ring in normal operation', async () => {
    const view = await renderScene(<CompressorSkid />);

    expect(rings(view.objects())).toHaveLength(0);

    await view.unmount();
  });

  it('adds a status ring for a tone, and a halo when it pulses', async () => {
    const view = await renderScene(<CompressorSkid tone="critical" pulse />);

    expect(rings(view.objects())).toHaveLength(2);

    await view.unmount();
  });

  it('applies position, rotation and scale to the whole model', async () => {
    const view = await renderScene(<PumpSkid position={[4, 0, -2]} rotation={[0, Math.PI / 2, 0]} scale={1.5} />);
    const root = view.scene.children[0];

    expect(root.position.toArray()).toEqual([4, 0, -2]);
    expect(root.rotation.y).toBeCloseTo(Math.PI / 2);
    expect(root.scale.x).toBe(1.5);

    await view.unmount();
  });

  it('glows on hover without swapping the steel colour', async () => {
    const idle = await renderScene(<HorizontalVessel />);
    const hovered = await renderScene(<HorizontalVessel hovered />);
    const material = (objects: Object3D[]) => meshes(objects)[0].material;
    const idleMaterial = material(idle.objects());
    const hoveredMaterial = material(hovered.objects());

    expect('emissiveIntensity' in idleMaterial && idleMaterial.emissiveIntensity).toBe(0);
    expect('emissiveIntensity' in hoveredMaterial && hoveredMaterial.emissiveIntensity).toBeGreaterThan(0);

    await idle.unmount();
    await hovered.unmount();
  });
});

describe(StorageTank.name, () => {
  const liquid = (objects: Object3D[]) =>
    meshes(objects).find((mesh) => mesh.geometry.type === 'CylinderGeometry' && geometryParameter(mesh, 'openEnded') === false);

  it('draws the liquid to the fill level', async () => {
    const view = await renderScene(<StorageTank height={10} fill={0.5} />);
    const mesh = liquid(view.objects());

    expect(mesh && geometryParameter(mesh, 'height')).toBeCloseTo(4.9);

    await view.unmount();
  });

  it('draws no liquid when empty', async () => {
    const view = await renderScene(<StorageTank fill={0} />);

    expect(liquid(view.objects())).toBeUndefined();

    await view.unmount();
  });
});

describe(FlareStack.name, () => {
  it('has no flame when not lit', async () => {
    const lit = await renderScene(<FlareStack />);
    const unlit = await renderScene(<FlareStack lit={false} />);
    const cones = (objects: Object3D[]) => meshes(objects).filter((mesh) => mesh.geometry.type === 'ConeGeometry').length;

    expect(cones(lit.objects())).toBe(2);
    expect(cones(unlit.objects())).toBe(0);

    await lit.unmount();
    await unlit.unmount();
  });
});

describe(EquipmentModel.name, () => {
  const kinds = Object.keys(EQUIPMENT_SIZES).filter((kind): kind is PlantEquipmentKind => kind in EQUIPMENT_SIZES);

  it.each(kinds)('renders a model for kind %s at its layout position', async (kind) => {
    const view = await renderScene(<EquipmentModel equipment={{ id: 'e-1', kind, tag: 'E-1', position: [3, 0, 5], rotationY: 1 }} />);
    const root = view.scene.children[0];

    expect(root.position.toArray()).toEqual([3, 0, 5]);
    expect(root.rotation.y).toBeCloseTo(1);
    expect(meshes(view.objects()).length).toBeGreaterThan(2);

    await view.unmount();
  });
});
