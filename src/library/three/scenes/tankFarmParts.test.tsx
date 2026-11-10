import type { Mesh, Object3D } from 'three';

import { geometryParameter, renderScene } from '../renderScene.fixture';

import { BundWall } from './BundWall';
import { IndicatorRing } from './IndicatorRing';
import { Jetty } from './Jetty';
import { TankerShip } from './TankerShip';
import { TankFarm } from './TankFarm';
import type { FarmTank } from './TankFarm';
import { movementRoute } from './tankFarmLayout';
import type { Manifold } from './tankFarmLayout';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const withGeometry = (objects: Object3D[], type: string): Mesh[] => objects.filter(isMesh).filter((mesh) => mesh.geometry.type === type);
const labels = (): string[] => [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent ?? '');

function opacityOf(mesh: Mesh): number {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  return material.opacity;
}

const TANKS: readonly FarmTank[] = [
  { id: 'ta-201', tag: '61-TA-201', center: [-20, -24], diameter: 16, height: 12, fill: 0.92, value: '92 % · high', tone: 'warning' },
  { id: 'ta-206', tag: '61-TA-206', center: [10, 14], diameter: 12, height: 10, fill: 0.4, value: '40 %' },
];

const MANIFOLD: Manifold = {
  headerZ: -6,
  y: 1,
  jetty: [
    [40, 1, -6],
    [60, 1, -6],
  ],
  pipeline: [
    [-50, 1, -6],
    [-70, 1, -6],
  ],
};

const PLOT = { center: [0, 0], size: [160, 100] } as const;

describe(IndicatorRing.name, () => {
  it('draws a band of the given radius and width on the ground', async () => {
    const view = await renderScene(<IndicatorRing position={[4, 0, -2]} radius={10} width={1.5} color="rgb(10, 20, 30)" />);
    const [ring] = withGeometry(view.objects(), 'RingGeometry');

    expect(geometryParameter(ring, 'outerRadius')).toBe(10);
    expect(geometryParameter(ring, 'innerRadius')).toBe(8.5);
    expect(ring.position.x).toBe(4);
    expect(ring.position.z).toBe(-2);

    await view.unmount();
  });

  it('fades when dimmed', async () => {
    const view = await renderScene(<IndicatorRing radius={10} color="rgb(10, 20, 30)" opacity={0.9} dimmed />);

    expect(opacityOf(withGeometry(view.objects(), 'RingGeometry')[0])).toBeCloseTo(0.18);

    await view.unmount();
  });
});

describe(BundWall.name, () => {
  it('builds four walls around a tinted floor', async () => {
    const view = await renderScene(<BundWall rect={{ center: [5, -3], size: [40, 20] }} />);

    expect(view.scene.children[0].position.toArray()).toEqual([5, 0, -3]);
    expect(withGeometry(view.objects(), 'BoxGeometry')).toHaveLength(4);
    expect(withGeometry(view.objects(), 'PlaneGeometry')).toHaveLength(1);

    await view.unmount();
  });
});

describe(Jetty.name, () => {
  it('stands the trestle on a pair of piles per bent', async () => {
    const view = await renderScene(<Jetty length={24} />);
    const piles = withGeometry(view.objects(), 'CylinderGeometry').filter((mesh) => geometryParameter(mesh, 'radiusTop') === 0.28);

    // 5 bents × 2 piles.
    expect(piles).toHaveLength(10);

    await view.unmount();
  });
});

describe(TankerShip.name, () => {
  it('builds a hull of the given length and beam', async () => {
    const view = await renderScene(<TankerShip length={50} beam={10} />);
    const [hull] = withGeometry(view.objects(), 'BoxGeometry');

    expect(geometryParameter(hull, 'width')).toBe(42);
    expect(geometryParameter(hull, 'depth')).toBe(10);
    expect(view.objects().filter(isMesh).length).toBeGreaterThan(6);

    await view.unmount();
  });
});

describe(TankFarm.name, () => {
  it('labels every tank with its tag and encoded value', async () => {
    const view = await renderScene(<TankFarm tanks={TANKS} manifold={MANIFOLD} plot={PLOT} />);
    await view.advance();

    expect(labels()).toEqual(['61-TA-20192 % · high', '61-TA-20640 %']);

    await view.unmount();
  });

  it('draws an indicator ring around every tank', async () => {
    const view = await renderScene(<TankFarm tanks={TANKS} manifold={MANIFOLD} plot={PLOT} showLabels={false} />);
    const rings = withGeometry(view.objects(), 'RingGeometry');

    expect(rings).toHaveLength(2);
    expect(geometryParameter(rings[0], 'outerRadius')).toBeCloseTo(10.2);

    await view.unmount();
  });

  it('dims the rings of the tanks that are not selected', async () => {
    const view = await renderScene(<TankFarm tanks={TANKS} manifold={MANIFOLD} plot={PLOT} selectedId="ta-206" showLabels={false} />);
    const rings = withGeometry(view.objects(), 'RingGeometry');

    expect(opacityOf(rings[0])).toBeLessThan(0.3);
    expect(opacityOf(rings[1])).toBeGreaterThan(0.9);

    await view.unmount();
  });

  it('shows flow chevrons only on routes that are transferring', async () => {
    const idle = await renderScene(<TankFarm tanks={TANKS} manifold={MANIFOLD} plot={PLOT} showLabels={false} />);
    const busy = await renderScene(
      <TankFarm tanks={TANKS} manifold={MANIFOLD} plot={PLOT} showLabels={false} flows={[{ id: 'm1', points: movementRoute(TANKS[0], null, MANIFOLD) }]} />
    );
    await busy.advance();

    // Tank roofs are cones too, so count what the flow adds.
    const roofs = withGeometry(idle.objects(), 'ConeGeometry').length;

    expect(roofs).toBe(TANKS.length);
    expect(withGeometry(busy.objects(), 'ConeGeometry').length - roofs).toBeGreaterThan(5);

    await idle.unmount();
    await busy.unmount();
  });

  it('adds open water and bunds when given', async () => {
    const view = await renderScene(
      <TankFarm tanks={TANKS} manifold={MANIFOLD} plot={PLOT} sea={{ center: [100, 0], size: [40, 100] }} bunds={[{ center: [-20, -24], size: [24, 24] }]} showLabels={false} />
    );
    const planes = withGeometry(view.objects(), 'PlaneGeometry');

    // Ground, sea and one bund floor.
    expect(planes).toHaveLength(3);

    await view.unmount();
  });
});
