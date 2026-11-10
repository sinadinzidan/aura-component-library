import { MeshStandardMaterial } from 'three';
import type { Mesh, Object3D } from 'three';

import { geometryParameter, renderScene } from '../renderScene.fixture';

import { DepthPlane } from './DepthPlane';
import { horizonDepthAt } from './horizonHeight';
import type { Horizon } from './horizonHeight';
import { HorizonSurface, horizonGeometry } from './HorizonSurface';
import { ReservoirZone } from './ReservoirZone';
import { SubseaTemplate } from './SubseaTemplate';
import { WellFieldScene } from './WellFieldScene';
import type { WellFieldSceneWell } from './WellFieldScene';
import { Wellhead } from './Wellhead';
import { WellTube, wellTubeGeometry } from './WellTube';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const meshes = (objects: Object3D[]): Mesh[] => objects.filter(isMesh);
const withGeometry = (objects: Object3D[], type: string): Mesh[] => meshes(objects).filter((mesh) => mesh.geometry.type === type);
const labels = () => [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent);

const COLOR = 'rgb(40, 120, 200)';
const PATH = [
  [0, 0, 0],
  [0, -5, 0],
  [2, -10, 0],
  [6, -12, 0],
] as const;
const HORIZONS: Horizon[] = [
  { id: 'kai', name: 'Top Kai', formation: 'Kai Fm', depth: 900, relief: 40, seed: 1 },
  { id: 'garn', name: 'Top Garn', formation: 'Garn Fm', depth: 2300, relief: 50, seed: 2 },
  { id: 'ile', name: 'Base Ile', formation: 'Ror Fm', depth: 2700, relief: 50, seed: 3 },
];
const WELLS: WellFieldSceneWell[] = [
  { id: 'a1', tag: 'A-01 H', kind: 'producer', points: PATH, status: 'Flowing', tone: 'success' },
  { id: 'a2', tag: 'A-02 W', kind: 'injector', points: PATH.map(([x, y, z]) => [-x, y, z] as const) },
];

describe(WellTube.name, () => {
  it('builds a tube that follows the path from wellhead to toe', () => {
    const geometry = wellTubeGeometry(PATH, 0.1);
    geometry.computeBoundingBox();

    expect(geometry.type).toBe('TubeGeometry');
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-12, 0);
    expect(geometry.boundingBox?.max.x).toBeCloseTo(6, 0);
  });

  it('draws the tube and, when selectable, a wider one to catch the pointer', async () => {
    const plain = await renderScene(<WellTube id="a1" points={PATH} color={COLOR} />);
    expect(withGeometry(plain.objects(), 'TubeGeometry')).toHaveLength(1);
    await plain.unmount();

    const view = await renderScene(<WellTube id="a1" points={PATH} color={COLOR} onSelect={() => undefined} />);
    const [tube, hit] = withGeometry(view.objects(), 'TubeGeometry');

    expect(Number(geometryParameter(hit, 'radius'))).toBeGreaterThan(Number(geometryParameter(tube, 'radius')) * 3);

    await view.unmount();
  });

  it('thickens when selected and fades when dimmed', async () => {
    const base = await renderScene(<WellTube id="a1" points={PATH} color={COLOR} radius={0.1} />);
    const baseRadius = Number(geometryParameter(withGeometry(base.objects(), 'TubeGeometry')[0], 'radius'));
    await base.unmount();

    const selected = await renderScene(<WellTube id="a1" points={PATH} color={COLOR} radius={0.1} selected />);
    expect(Number(geometryParameter(withGeometry(selected.objects(), 'TubeGeometry')[0], 'radius'))).toBeGreaterThan(baseRadius);
    await selected.unmount();

    const dimmed = await renderScene(<WellTube id="a1" points={PATH} color={COLOR} dimmed />);
    const material = withGeometry(dimmed.objects(), 'TubeGeometry')[0].material;
    expect(material instanceof MeshStandardMaterial && material.opacity).toBeLessThan(0.5);
    await dimmed.unmount();
  });
});

describe(HorizonSurface.name, () => {
  it('builds a grid whose depths come from the horizon function', () => {
    const geometry = horizonGeometry(HORIZONS[0], 2000, 0.01, 4);
    const position = geometry.getAttribute('position');

    expect(position.count).toBe(25);
    // First vertex: north-west corner (east −2000, north +2000).
    expect(position.getX(0)).toBeCloseTo(-20);
    expect(position.getZ(0)).toBeCloseTo(-20);
    expect(position.getY(0)).toBeCloseTo(-horizonDepthAt(HORIZONS[0], -2000, 2000) * 0.01);
    expect(geometry.getIndex()?.count).toBe(4 * 4 * 6);
  });

  it('draws a translucent surface with its mesh on top', async () => {
    const view = await renderScene(<HorizonSurface horizon={HORIZONS[0]} halfExtent={2000} scale={0.01} color={COLOR} />);
    const [surface, wire] = meshes(view.objects());

    expect(surface.material instanceof MeshStandardMaterial && surface.material.transparent).toBe(true);
    expect('wireframe' in wire.material && wire.material.wireframe).toBe(true);

    await view.unmount();
  });
});

describe(Wellhead.name, () => {
  it('points up for a producer and down for an injector', async () => {
    const producer = await renderScene(<Wellhead position={[0, 0, 0]} kind="producer" color={COLOR} />);
    expect(withGeometry(producer.objects(), 'ConeGeometry')[0].rotation.x).toBe(0);
    await producer.unmount();

    const injector = await renderScene(<Wellhead position={[0, 0, 0]} kind="injector" color={COLOR} />);
    expect(withGeometry(injector.objects(), 'ConeGeometry')[0].rotation.x).toBeCloseTo(Math.PI);
    await injector.unmount();
  });

  it('uses a different silhouette per kind, not only a different direction', async () => {
    const producer = await renderScene(<Wellhead position={[0, 0, 0]} kind="producer" color={COLOR} />);
    const round = geometryParameter(withGeometry(producer.objects(), 'ConeGeometry')[0], 'radialSegments');
    await producer.unmount();
    const injector = await renderScene(<Wellhead position={[0, 0, 0]} kind="injector" color={COLOR} />);

    expect(geometryParameter(withGeometry(injector.objects(), 'ConeGeometry')[0], 'radialSegments')).not.toBe(round);

    await injector.unmount();
  });
});

describe(SubseaTemplate.name, () => {
  it('builds a frame over a base plate with a manifold header', async () => {
    const view = await renderScene(<SubseaTemplate />);

    expect(withGeometry(view.objects(), 'BoxGeometry')).toHaveLength(1);
    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(9);

    await view.unmount();
  });
});

describe(DepthPlane.name, () => {
  it('sits at the given depth and rings every crossing', async () => {
    const view = await renderScene(
      <DepthPlane
        y={-8}
        halfExtent={10}
        marks={[
          { id: 'a1', position: [1, -8, 0] },
          { id: 'a2', position: [-1, -8, 0], emphasized: true },
        ]}
      />
    );
    const [plane] = withGeometry(view.objects(), 'PlaneGeometry');
    const rings = withGeometry(view.objects(), 'RingGeometry');

    expect(plane.parent?.position.y).toBe(-8);
    expect(geometryParameter(plane, 'width')).toBe(20);
    expect(rings).toHaveLength(2);
    expect(Number(geometryParameter(rings[1], 'outerRadius'))).toBeGreaterThan(Number(geometryParameter(rings[0], 'outerRadius')));

    await view.unmount();
  });
});

describe(ReservoirZone.name, () => {
  it('spans from top to base', async () => {
    const view = await renderScene(<ReservoirZone top={-23} base={-27} halfExtent={10} color={COLOR} />);
    const [slab] = withGeometry(view.objects(), 'BoxGeometry');

    expect(slab.position.y).toBe(-25);
    expect(geometryParameter(slab, 'height')).toBe(4);

    await view.unmount();
  });
});

describe(WellFieldScene.name, () => {
  const scene = (props: Partial<Parameters<typeof WellFieldScene>[0]> = {}) => (
    <WellFieldScene wells={WELLS} horizons={HORIZONS} reservoir={{ topId: 'garn', baseId: 'ile' }} halfExtent={2000} blockDepth={3000} scale={0.01} depth={1200} {...props} />
  );

  it('draws every well, horizon and the reservoir', async () => {
    const view = await renderScene(scene());
    await view.advance();

    expect(withGeometry(view.objects(), 'TubeGeometry')).toHaveLength(WELLS.length);
    expect(withGeometry(view.objects(), 'ConeGeometry')).toHaveLength(WELLS.length);
    expect(labels()).toEqual(expect.arrayContaining(['A-01 H', 'A-02 W', 'Top Kai', 'Top Garn', 'Base Ile']));

    await view.unmount();
  });

  it('hides a layer when it is switched off', async () => {
    const view = await renderScene(scene({ layers: { horizons: false, wellbores: false, reservoir: false, labels: true } }));
    await view.advance();

    expect(withGeometry(view.objects(), 'TubeGeometry')).toHaveLength(0);
    expect(labels()).toEqual([]);
    // Wellheads stay: they are on the seabed, not in a layer.
    expect(withGeometry(view.objects(), 'ConeGeometry')).toHaveLength(WELLS.length);

    await view.unmount();
  });

  it('ghosts the other wells and labels only the selected one with its status', async () => {
    const view = await renderScene(scene({ selectedId: 'a1', layers: { horizons: false, wellbores: true, reservoir: false, labels: true } }));
    await view.advance();
    const tubes = withGeometry(view.objects(), 'TubeGeometry');
    const opacity = (mesh: Mesh) => (mesh.material instanceof MeshStandardMaterial ? mesh.material.opacity : 1);

    expect(opacity(tubes[0])).toBe(1);
    expect(opacity(tubes[1])).toBeLessThan(0.5);
    expect(labels()).toEqual(['A-01 HFlowing']);

    await view.unmount();
  });

  it('puts the cutting plane at the chosen depth', async () => {
    const view = await renderScene(scene({ depth: 1800 }));
    const sheet = withGeometry(view.objects(), 'PlaneGeometry').find((mesh) => mesh.parent?.position.y === -18);

    expect(sheet).toBeDefined();

    await view.unmount();
  });
});
