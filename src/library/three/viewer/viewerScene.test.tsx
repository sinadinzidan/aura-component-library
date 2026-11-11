import { MeshStandardMaterial, Plane, Vector3 } from 'three';
import type { Mesh, Object3D } from 'three';

import { renderScene } from '../renderScene.fixture';

import { INITIAL_CLIP } from './clipPlane';
import type { ColorKey } from './colorBy';
import { MeasureLayer } from './MeasureLayer';
import { SectionPlaneHelper } from './SectionPlaneHelper';
import { ViewerModel } from './ViewerModel';
import { VIEWER_PARTS } from './viewerModel';
import { ViewerRig } from './ViewerRig';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const COLORS: Record<ColorKey, string> = {
  steel: 'rgb(128, 128, 128)',
  neutral: 'rgb(120, 120, 120)',
  success: 'rgb(0, 160, 0)',
  warning: 'rgb(220, 140, 0)',
  critical: 'rgb(220, 0, 0)',
  info: 'rgb(0, 100, 220)',
  sys1: 'rgb(10, 20, 30)',
  sys2: 'rgb(40, 50, 60)',
  sys3: 'rgb(70, 80, 90)',
  sys4: 'rgb(100, 110, 120)',
  sys5: 'rgb(130, 140, 150)',
};

const partMeshes = (objects: Object3D[]): Mesh[] => objects.filter(isMesh).filter((mesh) => ['BoxGeometry', 'CylinderGeometry'].includes(mesh.geometry.type));
const materialOf = (mesh: Mesh): MeshStandardMaterial => {
  if (!(mesh.material instanceof MeshStandardMaterial)) throw new Error('Expected one standard material');
  return mesh.material;
};

describe(ViewerModel.name, () => {
  it('draws one mesh per part', async () => {
    const view = await renderScene(<ViewerModel colors={COLORS} />);

    expect(partMeshes(view.objects())).toHaveLength(VIEWER_PARTS.length);

    await view.unmount();
  });

  it('leaves hidden parts out', async () => {
    const view = await renderScene(<ViewerModel colors={COLORS} display={{ motor: 'hidden', cooler: 'hidden' }} />);

    expect(partMeshes(view.objects())).toHaveLength(VIEWER_PARTS.length - 2);

    await view.unmount();
  });

  it('fades ghosted parts and makes them transparent', async () => {
    const view = await renderScene(<ViewerModel colors={COLORS} display={{ motor: 'ghost' }} />);
    const faded = partMeshes(view.objects()).map(materialOf).filter((material) => material.transparent);

    expect(faded).toHaveLength(1);
    expect(faded[0].opacity).toBeLessThan(0.2);

    await view.unmount();
  });

  it('makes every solid part see-through in x-ray', async () => {
    const view = await renderScene(<ViewerModel colors={COLORS} xray />);

    expect(partMeshes(view.objects()).map(materialOf).every((material) => material.transparent && material.opacity < 0.5)).toBe(true);

    await view.unmount();
  });

  it('swaps in a new material when a part becomes translucent', async () => {
    const view = await renderScene(<ViewerModel colors={COLORS} />);
    const before = partMeshes(view.objects()).map(materialOf);

    await view.rerender(<ViewerModel colors={COLORS} xray />);
    const after = partMeshes(view.objects()).map(materialOf);

    expect(after.every((material, index) => material !== before[index] && material.transparent)).toBe(true);

    await view.unmount();
  });

  it('colours parts by the chosen mode', async () => {
    const view = await renderScene(<ViewerModel colors={COLORS} colorMode="health" />);
    const colours = new Set(partMeshes(view.objects()).map((mesh) => materialOf(mesh).color.getStyle()));

    expect(colours.size).toBe(4);

    await view.unmount();
  });

  it('moves parts apart when exploded', async () => {
    const assembled = await renderScene(<ViewerModel colors={COLORS} />);
    const exploded = await renderScene(<ViewerModel colors={COLORS} explode={1} />);
    const motorX = (view: typeof assembled) => view.scene.children[0].children[4].position.x;

    expect(motorX(exploded)).toBeGreaterThan(motorX(assembled));

    await assembled.unmount();
    await exploded.unmount();
  });

  it('gives materials the clipping plane', async () => {
    const plane = new Plane(new Vector3(-1, 0, 0), 2);
    const view = await renderScene(<ViewerModel colors={COLORS} clipPlane={plane} />);

    expect(partMeshes(view.objects()).every((mesh) => materialOf(mesh).clippingPlanes?.length === 1)).toBe(true);

    await view.unmount();
  });
});

describe(MeasureLayer.name, () => {
  it('draws a marker per point', async () => {
    const view = await renderScene(<MeasureLayer points={[[0, 0, 0], [3, 4, 0]]} />);

    expect(view.objects().filter(isMesh).filter((mesh) => mesh.geometry.type === 'SphereGeometry')).toHaveLength(2);

    await view.unmount();
  });

  it('draws nothing for no points', async () => {
    const view = await renderScene(<MeasureLayer points={[]} />);

    expect(view.objects().filter(isMesh)).toHaveLength(0);

    await view.unmount();
  });
});

describe(SectionPlaneHelper.name, () => {
  it('draws a sheet only while the plane is on', async () => {
    const bounds = { min: [-10, 0, -5], max: [10, 4, 5] } as const;
    const off = await renderScene(<SectionPlaneHelper bounds={bounds} state={INITIAL_CLIP} />);
    const on = await renderScene(<SectionPlaneHelper bounds={bounds} state={{ ...INITIAL_CLIP, enabled: true }} />);

    expect(off.objects().filter(isMesh)).toHaveLength(0);
    expect(on.objects().filter(isMesh)).toHaveLength(1);

    await off.unmount();
    await on.unmount();
  });
});

describe(ViewerRig.name, () => {
  it('applies the first target at once', async () => {
    const view = await renderScene(<ViewerRig target={{ position: [10, 20, 30], lookAt: [0, 0, 0] }} />);

    expect(view.camera.position.x).toBeCloseTo(10);
    expect(view.camera.position.z).toBeCloseTo(30);

    await view.unmount();
  });

  it('jumps to a new target under reduced motion', async () => {
    const view = await renderScene(<ViewerRig target={{ position: [10, 20, 30], lookAt: [0, 0, 0] }} />, { reducedMotion: true });

    await view.rerender(<ViewerRig target={{ position: [0, 50, 5], lookAt: [0, 0, 0] }} />);

    expect(view.camera.position.y).toBeCloseTo(50);

    await view.unmount();
  });
});
