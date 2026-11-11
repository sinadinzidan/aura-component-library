import type { InstancedMesh, Mesh, Object3D } from 'three';

import { renderScene } from '../renderScene.fixture';

import { FlowPlantScene, pointOnRoute } from './FlowPlantScene';
import type { FlowSceneLine, FlowSceneValve } from './FlowPlantScene';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function isInstanced(object: Object3D): object is InstancedMesh {
  return 'isInstancedMesh' in object && object.isInstancedMesh === true;
}

const TARGET = { position: [60, 40, 80], lookAt: [0, 0, 0] } as const;

const EQUIPMENT = [{ id: 'k', kind: 'compressor', tag: '23-KA-9103', position: [0, 0, 0] }] as const;

const LINES: readonly FlowSceneLine[] = [
  { id: 'a', route: [[-20, 1, 0], [-6, 1, 0]], color: 'rgb(1, 2, 3)', rate: 0.6 },
  { id: 'b', route: [[6, 1, 0], [20, 1, 0]], color: 'rgb(1, 2, 3)', rate: 0 },
];

const VALVES: readonly FlowSceneValve[] = [{ id: 'v', tag: '23-XV-9103', lineId: 'a', at: 0.5, open: false }];

const scene = (props: Partial<Parameters<typeof FlowPlantScene>[0]> = {}) => (
  <FlowPlantScene equipment={EQUIPMENT} lines={LINES} valves={VALVES} size={[100, 60]} target={TARGET} time={0} {...props} />
);

describe(pointOnRoute.name, () => {
  const route = [
    [0, 1, 0],
    [10, 1, 0],
    [10, 1, 10],
  ] as const;

  it('finds the middle of a route', () => {
    expect(pointOnRoute(route, 0.5)?.position).toEqual([10, 1, 0]);
  });

  it('gives the direction of travel at that point', () => {
    expect(pointOnRoute(route, 0.25)?.direction).toEqual([1, 0, 0]);
    expect(pointOnRoute(route, 0.9)?.direction).toEqual([0, 0, 1]);
  });

  it('clamps outside 0–1 and returns null for a route without length', () => {
    expect(pointOnRoute(route, 3)?.position).toEqual([10, 1, 10]);
    expect(pointOnRoute([[0, 0, 0]], 0.5)).toBeNull();
  });
});

describe(FlowPlantScene.name, () => {
  it('draws a particle stream only for lines that flow', async () => {
    const view = await renderScene(scene(), { reducedMotion: false });

    expect(view.objects().filter(isInstanced)).toHaveLength(1);

    await view.unmount();
  });

  it('ghosts the equipment', async () => {
    const view = await renderScene(scene());
    const faded = view.objects().filter(isMesh).filter((mesh) => !Array.isArray(mesh.material) && mesh.material.transparent && mesh.material.opacity < 0.5);

    expect(faded.length).toBeGreaterThan(5);

    await view.unmount();
  });

  it('labels a valve with its tag and state', async () => {
    const view = await renderScene(scene());
    await view.advance();
    const labels = [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent ?? '');

    expect(labels.some((text) => text.includes('23-XV-9103') && text.includes('Closed'))).toBe(true);

    await view.unmount();
  });

  it('labels only the equipment asked for', async () => {
    const view = await renderScene(scene({ valves: [], labelled: ['k'] }));
    await view.advance();

    expect(document.querySelectorAll('[data-slot="scene-label"]')).toHaveLength(1);

    await view.unmount();
  });

  it('skips a valve whose line is unknown', async () => {
    const view = await renderScene(scene({ valves: [{ id: 'v', tag: 'X', lineId: 'nope', at: 0.5, open: true }] }));
    await view.advance();

    expect(document.querySelectorAll('[data-slot="scene-label"]')).toHaveLength(0);

    await view.unmount();
  });
});
