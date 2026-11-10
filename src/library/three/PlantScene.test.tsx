import type { Mesh, Object3D } from 'three';

import type { PlantLayout } from './plantLayout';
import { PlantScene } from './PlantScene';
import { renderScene } from './renderScene.fixture';

const LAYOUT: PlantLayout = {
  id: 'plant',
  name: 'Test plant',
  size: [80, 60],
  areas: [
    {
      id: 'a-1',
      tag: 'A-1',
      name: 'Compression',
      center: [-10, 0],
      size: [30, 30],
      equipment: [
        { id: 'k-1', kind: 'compressor', tag: '23-KA-9101', position: [-12, 0, -4] },
        { id: 'e-1', kind: 'heat-exchanger', tag: '23-HA-9114', position: [-8, 0, 8] },
      ],
    },
    { id: 'a-2', tag: 'A-2', name: 'Export', center: [24, 0], size: [20, 30], equipment: [{ id: 'p-1', kind: 'pump', tag: '27-PA-2001A', position: [24, 0, 0] }] },
  ],
  scenery: [{ id: 'flare', kind: 'flare', tag: 'Flare', position: [34, 0, -24] }],
  pipes: [
    {
      id: 'line-1',
      flow: true,
      points: [
        [-12, 4, -4],
        [24, 4, -4],
      ],
    },
  ],
};

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const rings = (objects: Object3D[]): Mesh[] => objects.filter(isMesh).filter((mesh) => mesh.geometry.type === 'RingGeometry');
const labels = (): string[] => Array.from(document.querySelectorAll('[data-slot="scene-label"]')).map((label) => label.textContent ?? '');
const visibleOutlines = (objects: Object3D[]): number =>
  objects.filter((object) => object.type === 'LineSegments' && object.visible && object.scale.x > 1).length;

describe(PlantScene.name, () => {
  it('labels areas, not equipment, at plant level', async () => {
    const view = await renderScene(<PlantScene layout={LAYOUT} statuses={{ 'a-1': { tone: 'critical', text: '2 open alarms' } }} />);
    await view.advance();

    expect(labels()).toEqual(['A-1Compression2 open alarms', 'A-2Export']);

    await view.unmount();
  });

  it('labels the equipment of the area in focus instead of the area', async () => {
    const view = await renderScene(<PlantScene layout={LAYOUT} activeAreaId="a-1" statuses={{ 'k-1': { tone: 'critical', text: 'Tripped' } }} />);
    await view.advance();

    expect(labels()).toEqual(['23-KA-9101Tripped', '23-HA-9114', 'A-2Export']);

    await view.unmount();
  });

  it('hides every label on request', async () => {
    const view = await renderScene(<PlantScene layout={LAYOUT} showLabels={false} />);
    await view.advance();

    expect(labels()).toEqual([]);

    await view.unmount();
  });

  it('draws a status ring only for equipment with a tone', async () => {
    const view = await renderScene(<PlantScene layout={LAYOUT} statuses={{ 'k-1': { tone: 'critical', pulse: true }, 'p-1': { tone: 'warning' } }} />);

    // One ring and one halo for the pulsing unit, one ring for the other.
    expect(rings(view.objects())).toHaveLength(3);

    await view.unmount();
  });

  it('outlines the selected equipment', async () => {
    const idle = await renderScene(<PlantScene layout={LAYOUT} activeAreaId="a-1" />);
    const selected = await renderScene(<PlantScene layout={LAYOUT} activeAreaId="a-1" selectedId="k-1" />);

    expect(visibleOutlines(selected.objects())).toBe(visibleOutlines(idle.objects()) + 1);

    await idle.unmount();
    await selected.unmount();
  });

  it('moves the camera closer when the focus goes from plant to equipment', async () => {
    const plant = await renderScene(<PlantScene layout={LAYOUT} />);
    const unit = await renderScene(<PlantScene layout={LAYOUT} focusId="k-1" activeAreaId="a-1" selectedId="k-1" />);

    expect(unit.camera.position.length()).toBeLessThan(plant.camera.position.length());

    await plant.unmount();
    await unit.unmount();
  });

  it('marks a sensor on its machine with a labelled marker', async () => {
    const view = await renderScene(
      <PlantScene
        layout={LAYOUT}
        activeAreaId="a-1"
        selectedId="k-1"
        marker={{ equipmentId: 'k-1', anchor: [0, 1, 0], tag: '23-PT-92531', value: '48.6 barg' }}
      />
    );
    await view.advance();

    expect(labels()).toContain('23-PT-9253148.6 barg');
    expect(rings(view.objects())).toHaveLength(1);

    await view.unmount();
  });
});
