import { MeshBasicMaterial } from 'three';
import type { Mesh, Object3D } from 'three';

import { geometryParameter, renderScene } from '../renderScene.fixture';
import { useSceneEnvironment } from '../sceneEnvironment';

import { DeckModule } from './DeckModule';
import { Derrick } from './Derrick';
import { ExplodeLift } from './ExplodeLift';
import { FlareBoom } from './FlareBoom';
import { Helideck } from './Helideck';
import { LatticeFrame } from './LatticeFrame';
import { boomMembers, towerMembers } from './latticeGeometry';
import { LivingQuarters } from './LivingQuarters';
import { OffshorePlatform } from './OffshorePlatform';
import { PedestalCrane } from './PedestalCrane';
import { PlatformJacket } from './PlatformJacket';
import type { PlatformLayout } from './platformLayout';
import { SeaPlane } from './SeaPlane';
import { StillScene } from './StillScene';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const withGeometry = (objects: Object3D[], type: string): Mesh[] => objects.filter(isMesh).filter((mesh) => mesh.geometry.type === type);
const ofType = (objects: Object3D[], type: string): Object3D[] => objects.filter((object) => object.type === type);
const labels = (): string[] => [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent ?? '');

const LAYOUT: PlatformLayout = {
  size: [40, 26],
  gap: 9,
  draught: 4,
  levels: [
    { id: 'jacket', name: 'Jacket', kind: 'jacket', elevation: 12, height: 12, equipment: [] },
    {
      id: 'cellar',
      name: 'Cellar deck',
      kind: 'deck',
      elevation: 12,
      height: 6,
      equipment: [{ id: '21-pa-2001', kind: 'pump', tag: '21-PA-2001', position: [-10, 0, 4] }],
    },
    {
      id: 'upper',
      name: 'Upper deck',
      kind: 'deck',
      elevation: 18,
      height: 0,
      equipment: [{ id: '80-gt-2001', kind: 'turbine', tag: '80-GT-2001', position: [4, 0, 6] }],
      features: [
        { id: 'derrick', kind: 'derrick', position: [8, 0, -4] },
        { id: 'helideck', kind: 'helideck', position: [-18, 12, 0] },
      ],
    },
  ],
};

function Probe({ onRead }: { onRead: (reducedMotion: boolean) => void }) {
  const { reducedMotion } = useSceneEnvironment();
  onRead(reducedMotion);
  return null;
}

describe(StillScene.name, () => {
  it('tells its content to hold still', async () => {
    const seen: boolean[] = [];
    const view = await renderScene(
      <StillScene>
        <Probe onRead={(value) => seen.push(value)} />
      </StillScene>,
      { reducedMotion: false }
    );

    expect(seen[seen.length - 1]).toBe(true);

    await view.unmount();
  });

  it('passes motion through when switched off', async () => {
    const seen: boolean[] = [];
    const view = await renderScene(
      <StillScene still={false}>
        <Probe onRead={(value) => seen.push(value)} />
      </StillScene>,
      { reducedMotion: false }
    );

    expect(seen[seen.length - 1]).toBe(false);

    await view.unmount();
  });
});

describe(SeaPlane.name, () => {
  it('draws a water surface of the given size with swell lines', async () => {
    const view = await renderScene(<SeaPlane size={[80, 40]} center={[10, 5]} level={2} />);
    const [surface] = withGeometry(view.objects(), 'PlaneGeometry');

    expect(geometryParameter(surface, 'width')).toBe(80);
    expect(geometryParameter(surface, 'height')).toBe(40);
    expect(view.scene.children[0].position.toArray()).toEqual([10, 2, 5]);
    expect(ofType(view.objects(), 'LineSegments')).toHaveLength(1);

    await view.unmount();
  });

  it('draws no lines for a cell of 0', async () => {
    const view = await renderScene(<SeaPlane cell={0} />);

    expect(ofType(view.objects(), 'LineSegments')).toHaveLength(0);

    await view.unmount();
  });
});

describe(LatticeFrame.name, () => {
  it('draws one strut per member, legs thicker than braces', async () => {
    const members = towerMembers({ base: [10, 10], top: [4, 4], bottomY: 0, topY: 12, bays: 2 });
    const view = await renderScene(<LatticeFrame members={members} material={new MeshBasicMaterial()} legRadius={0.4} braceRadius={0.1} />);
    const struts = withGeometry(view.objects(), 'CylinderGeometry');

    expect(struts).toHaveLength(members.length);
    expect(geometryParameter(struts[0], 'radiusTop')).toBe(0.4);
    expect(geometryParameter(struts[struts.length - 1], 'radiusTop')).toBe(0.1);

    await view.unmount();
  });
});

describe(PlatformJacket.name, () => {
  it('builds the lattice and the risers', async () => {
    const view = await renderScene(<PlatformJacket bays={2} risers={3} />);

    // 4 legs + 3 rings × 4 + 2 bays × 8 braces, plus 3 risers.
    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(32 + 3);

    await view.unmount();
  });
});

describe(DeckModule.name, () => {
  it('builds a plate, girders and columns, and holds its children', async () => {
    const view = await renderScene(
      <DeckModule size={[40, 7, 26]} columns={3}>
        <mesh name="child" />
      </DeckModule>
    );
    const [plate] = withGeometry(view.objects(), 'BoxGeometry');

    expect(geometryParameter(plate, 'width')).toBe(40);
    // 4 girders + 3 columns on each long side.
    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(10);
    expect(view.objects().some((object) => object.name === 'child')).toBe(true);

    await view.unmount();
  });

  it('swaps columns for a handrail on a weather deck', async () => {
    const view = await renderScene(<DeckModule size={[40, 0, 26]} columns={3} handrail />);

    // 4 girders + 4 rails + 6 posts.
    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(14);

    await view.unmount();
  });
});

describe('platform landmarks', () => {
  it.each([
    ['Derrick', <Derrick key="m" />],
    ['Helideck', <Helideck key="m" />],
    ['FlareBoom', <FlareBoom key="m" />],
    ['PedestalCrane', <PedestalCrane key="m" />],
    ['LivingQuarters', <LivingQuarters key="m" />],
  ] as const)('%s builds a model from several primitives', async (_name, model) => {
    const view = await renderScene(model);

    expect(view.objects().filter(isMesh).length).toBeGreaterThan(4);

    await view.unmount();
  });

  it('gives the derrick a tower of the asked height', async () => {
    const view = await renderScene(<Derrick height={20} bays={4} />);
    const heights = withGeometry(view.objects(), 'CylinderGeometry').map((mesh) => geometryParameter(mesh, 'height'));

    expect(heights).toContain(20);

    await view.unmount();
  });

  it('lights the flare boom only when lit', async () => {
    const lit = await renderScene(<FlareBoom />);
    const dark = await renderScene(<FlareBoom lit={false} />);

    expect(withGeometry(lit.objects(), 'ConeGeometry')).toHaveLength(2);
    expect(withGeometry(dark.objects(), 'ConeGeometry')).toHaveLength(0);

    await lit.unmount();
    await dark.unmount();
  });

  it('draws a window band per storey on both long faces', async () => {
    const view = await renderScene(<LivingQuarters storeys={4} />);
    const boxes = withGeometry(view.objects(), 'BoxGeometry');

    // Block + roof + 4 storeys × 2 faces.
    expect(boxes).toHaveLength(10);

    await view.unmount();
  });

  it('draws the aiming circle on the helideck', async () => {
    const view = await renderScene(<Helideck radius={8} support={0} />);
    const [circle] = withGeometry(view.objects(), 'RingGeometry');

    expect(geometryParameter(circle, 'outerRadius')).toBeCloseTo(5.6);

    await view.unmount();
  });

  it('uses the boom members for the crane jib', async () => {
    const view = await renderScene(<PedestalCrane boom={14} />);
    const expected = boomMembers({ length: 14, width: 1.6, tipWidth: 0.5, bays: 4 }).length;

    // Pedestal + jib members + hook line.
    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(expected + 2);

    await view.unmount();
  });
});

describe(ExplodeLift.name, () => {
  it('applies its first height at once', async () => {
    const view = await renderScene(
      <ExplodeLift y={6}>
        <mesh />
      </ExplodeLift>,
      { reducedMotion: false }
    );

    expect(view.scene.children[0].position.y).toBe(6);

    await view.unmount();
  });

  it('glides to a new height', async () => {
    const view = await renderScene(
      <ExplodeLift y={0} duration={1}>
        <mesh />
      </ExplodeLift>,
      { reducedMotion: false }
    );
    await view.rerender(
      <ExplodeLift y={10} duration={1}>
        <mesh />
      </ExplodeLift>
    );
    await view.advance(0.1);
    await view.advance(0.5);
    const halfway = view.scene.children[0].position.y;
    await view.advance(0.6);

    expect(halfway).toBeGreaterThan(0);
    expect(halfway).toBeLessThan(10);
    expect(view.scene.children[0].position.y).toBe(10);

    await view.unmount();
  });

  it('jumps under reduced motion', async () => {
    const view = await renderScene(
      <ExplodeLift y={0}>
        <mesh />
      </ExplodeLift>,
      { reducedMotion: true }
    );
    await view.rerender(
      <ExplodeLift y={10}>
        <mesh />
      </ExplodeLift>
    );

    expect(view.scene.children[0].position.y).toBe(10);

    await view.unmount();
  });
});

describe(OffshorePlatform.name, () => {
  const liftHeights = (objects: Object3D[]): number[] => objects.filter((object) => object.type === 'Group' && object.parent?.type === 'Scene').map((group) => group.position.y);

  it('labels every level of the assembled platform', async () => {
    const view = await renderScene(<OffshorePlatform layout={LAYOUT} statuses={{ cellar: { tone: 'warning', text: '2 alarms' } }} />);
    await view.advance();

    expect(labels()).toEqual(['Jacket', 'Cellar deck2 alarms', 'Upper deck']);

    await view.unmount();
  });

  it('raises each level one more gap when exploded', async () => {
    const view = await renderScene(<OffshorePlatform layout={LAYOUT} explode={1} />);
    await view.advance();

    expect(liftHeights(view.objects()).slice(-3)).toEqual([0, 9, 18]);

    await view.unmount();
  });

  it('labels the equipment of the isolated level instead of the levels', async () => {
    const view = await renderScene(<OffshorePlatform layout={LAYOUT} levelId="cellar" statuses={{ '21-pa-2001': { tone: 'critical', text: 'Tripped' } }} />);
    await view.advance();

    expect(labels()).toEqual(['21-PA-2001Tripped']);

    await view.unmount();
  });

  it('shows a status ring for equipment with a tone', async () => {
    const view = await renderScene(<OffshorePlatform layout={LAYOUT} levelId="cellar" statuses={{ '21-pa-2001': { tone: 'critical' } }} showLabels={false} />);

    // The helideck circle is the only other ring.
    expect(withGeometry(view.objects(), 'RingGeometry')).toHaveLength(2);
    expect(labels()).toEqual([]);

    await view.unmount();
  });
});
