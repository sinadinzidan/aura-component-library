import type { InstancedMesh, Mesh, Object3D } from 'three';

import { renderScene } from '../renderScene.fixture';

import { AirCoolerBank } from './AirCoolerBank';
import { ContainmentTank } from './ContainmentTank';
import { CryogenicExchanger } from './CryogenicExchanger';
import { FlareFlame } from './FlareFlame';
import { FlowLine } from './FlowLine';
import { FlowParticles } from './FlowParticles';
import { FlowValveMarker } from './FlowValveMarker';
import { LngCarrier } from './LngCarrier';
import { LngSite } from './LngSite';
import type { LngUnit } from './lngSite';
import { LoadingArms } from './LoadingArms';
import { ReplayPlantScene } from './ReplayPlantScene';
import { SlugCatcher } from './SlugCatcher';
import { ValueTag3d } from './ValueTag3d';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function isInstanced(object: Object3D): object is InstancedMesh {
  return 'isInstancedMesh' in object && object.isInstancedMesh === true;
}

const instances = (objects: Object3D[]): InstancedMesh[] => objects.filter(isInstanced);
const meshes = (objects: Object3D[]): Mesh[] => objects.filter(isMesh);
const rings = (objects: Object3D[]): Mesh[] => meshes(objects).filter((mesh) => mesh.geometry.type === 'RingGeometry');

const MODELS = [
  ['CryogenicExchanger', <CryogenicExchanger key="m" />],
  ['AirCoolerBank', <AirCoolerBank key="m" />],
  ['SlugCatcher', <SlugCatcher key="m" />],
  ['ContainmentTank', <ContainmentTank key="m" />],
  ['LngCarrier', <LngCarrier key="m" />],
  ['LoadingArms', <LoadingArms key="m" connected={2} />],
] as const;

const ROUTE = [
  [0, 1, 0],
  [30, 1, 0],
] as const;

const RAMP = { step0: 'rgb(10, 20, 30)', step1: 'rgb(10, 20, 30)', step2: 'rgb(10, 20, 30)', step3: 'rgb(10, 20, 30)', step4: 'rgb(10, 20, 30)' };

const UNITS: readonly LngUnit[] = [
  { id: 'tank', kind: 'tank', tag: '61-TK-101', name: 'LNG tank', stageId: 'storage', position: [10, 0, 20], temperature: -162, landmark: true },
  { id: 'cooler', kind: 'cooler-bank', tag: '45-EA-01', name: 'Coolers', stageId: 'liquefaction', position: [-20, 0, 0], temperature: 30, count: 4 },
];

const TARGET = { position: [60, 40, 80], lookAt: [0, 0, 0] } as const;

describe('LNG models', () => {
  it.each(MODELS)('%s builds a model from several primitives', async (_name, model) => {
    const view = await renderScene(model);

    expect(meshes(view.objects()).length).toBeGreaterThan(4);

    await view.unmount();
  });

  it('adds a status ring to the exchanger for a tone', async () => {
    const view = await renderScene(<CryogenicExchanger tone="warning" />);

    expect(rings(view.objects())).toHaveLength(1);

    await view.unmount();
  });

  it('makes the cooler bank longer with more bays', async () => {
    const short = await renderScene(<AirCoolerBank bays={4} />);
    const long = await renderScene(<AirCoolerBank bays={12} />);
    const size = (objects: Object3D[]) => Math.max(...meshes(objects).map((mesh) => Math.abs(mesh.position.x)));

    expect(size(long.objects())).toBeGreaterThan(size(short.objects()));

    await short.unmount();
    await long.unmount();
  });

  it('draws one spherical tank dome per cargo tank on the carrier', async () => {
    const view = await renderScene(<LngCarrier tanks={5} />);
    const domes = meshes(view.objects()).filter((mesh) => mesh.geometry.type === 'SphereGeometry');

    expect(domes).toHaveLength(5);

    await view.unmount();
  });

  it('extends connected loading arms and folds the rest', async () => {
    const parked = await renderScene(<LoadingArms arms={2} connected={0} />);
    const joined = await renderScene(<LoadingArms arms={2} connected={2} />);
    const reach = (objects: Object3D[]) => Math.max(...meshes(objects).map((mesh) => mesh.position.x));

    expect(reach(joined.objects())).toBeGreaterThan(reach(parked.objects()));

    await parked.unmount();
    await joined.unmount();
  });

  it('shows the tank level on a gauge strip', async () => {
    const empty = await renderScene(<ContainmentTank fill={0} />);
    const full = await renderScene(<ContainmentTank fill={1} />);

    expect(meshes(full.objects()).length).toBe(meshes(empty.objects()).length + 1);

    await empty.unmount();
    await full.unmount();
  });
});

describe(FlowParticles.name, () => {
  it('draws one instanced mesh sized for the line', async () => {
    const view = await renderScene(<FlowParticles route={ROUTE} rate={1} color="rgb(1, 2, 3)" time={0} />, { reducedMotion: false });
    const instanced = instances(view.objects());

    expect(instanced).toHaveLength(1);

    await view.unmount();
  });

  it('shows more particles for a higher rate', async () => {
    const count = async (rate: number) => {
      const view = await renderScene(<FlowParticles route={ROUTE} rate={rate} color="rgb(1, 2, 3)" time={0} />, { reducedMotion: false });
      await view.advance();
      const instanced = instances(view.objects())[0];
      const shown = instanced.count;
      await view.unmount();
      return shown;
    };

    expect(await count(1)).toBeGreaterThan(await count(0.2));
  });

  it('moves the stream with the scene clock', async () => {
    const view = await renderScene(<FlowParticles route={ROUTE} rate={1} color="rgb(1, 2, 3)" />, { reducedMotion: false });
    await view.advance(0.1);
    const first = instances(view.objects())[0];
    const before = first.instanceMatrix.array[12];
    await view.advance(0.4);
    const after = first.instanceMatrix.array[12];

    expect(after).not.toBe(before);

    await view.unmount();
  });

  it('swaps the stream for still chevrons under reduced motion', async () => {
    const view = await renderScene(<FlowParticles route={ROUTE} rate={1} color="rgb(1, 2, 3)" />, { reducedMotion: true });

    expect(instances(view.objects())).toHaveLength(0);
    expect(meshes(view.objects()).filter((mesh) => mesh.geometry.type === 'ConeGeometry').length).toBeGreaterThan(0);

    await view.unmount();
  });

  it('draws nothing under reduced motion when the line does not flow', async () => {
    const view = await renderScene(<FlowParticles route={ROUTE} rate={0} color="rgb(1, 2, 3)" />, { reducedMotion: true });

    expect(meshes(view.objects())).toHaveLength(0);

    await view.unmount();
  });
});

describe(FlowLine.name, () => {
  it('draws a tube and a stream for a line that flows', async () => {
    const view = await renderScene(<FlowLine id="a" route={ROUTE} color="rgb(1, 2, 3)" rate={0.5} time={0} />, { reducedMotion: false });

    expect(instances(view.objects())).toHaveLength(1);
    expect(meshes(view.objects()).some((mesh) => mesh.geometry.type === 'CylinderGeometry')).toBe(true);

    await view.unmount();
  });

  it('goes dark without a stream when the line is blocked', async () => {
    const view = await renderScene(<FlowLine id="a" route={ROUTE} color="rgb(1, 2, 3)" rate={0} />, { reducedMotion: false });

    expect(instances(view.objects())).toHaveLength(0);
    expect(meshes(view.objects()).length).toBeGreaterThan(0);

    await view.unmount();
  });

  it('adds a sleeve when selected and a hit sleeve when clickable', async () => {
    const plain = await renderScene(<FlowLine id="a" route={ROUTE} color="rgb(1, 2, 3)" rate={0.5} time={0} />, { reducedMotion: false });
    const picked = await renderScene(<FlowLine id="a" route={ROUTE} color="rgb(1, 2, 3)" rate={0.5} time={0} emphasis="selected" onSelect={() => undefined} />, { reducedMotion: false });

    expect(meshes(picked.objects()).length).toBe(meshes(plain.objects()).length + 2);

    await plain.unmount();
    await picked.unmount();
  });
});

describe(FlowValveMarker.name, () => {
  it('adds a blocking plate when closed', async () => {
    const open = await renderScene(<FlowValveMarker position={[0, 1, 0]} direction={[1, 0, 0]} open />);
    const closed = await renderScene(<FlowValveMarker position={[0, 1, 0]} direction={[1, 0, 0]} open={false} />);

    expect(meshes(closed.objects()).length).toBe(meshes(open.objects()).length + 1);

    await open.unmount();
    await closed.unmount();
  });
});

describe(FlareFlame.name, () => {
  it('draws the flame cones at the given position', async () => {
    const view = await renderScene(<FlareFlame position={[5, 30, 0]} />);

    expect(meshes(view.objects()).length).toBe(3);
    expect(view.scene.children[0].position.y).toBe(30);

    await view.unmount();
  });
});

describe(ValueTag3d.name, () => {
  it('shows label and value, hidden from assistive technology', async () => {
    const view = await renderScene(<ValueTag3d position={[0, 3, 0]} label="Vibration" value="11.6 mm/s" tone="critical" />);
    await view.advance();
    const tag = document.querySelector('[data-slot="value-tag"]');

    expect(tag).toHaveTextContent('Vibration11.6 mm/s');
    expect(tag).toHaveAttribute('aria-hidden', 'true');
    expect(tag).toHaveAttribute('data-tone', 'critical');

    await view.unmount();
  });
});

describe(LngSite.name, () => {
  const site = (props: Partial<Parameters<typeof LngSite>[0]> = {}) => (
    <LngSite units={UNITS} land={{ center: [0, 0], size: [200, 140] }} target={TARGET} rampColors={RAMP} {...props} />
  );

  it('builds ground, units and labels only for landmarks in the overview', async () => {
    const view = await renderScene(site());
    await view.advance();
    const labels = [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent ?? '');

    expect(labels).toHaveLength(1);
    expect(labels[0]).toContain('61-TK-101');

    await view.unmount();
  });

  it('labels the units of the active stage', async () => {
    const view = await renderScene(site({ activeStageId: 'liquefaction' }));
    await view.advance();
    const labels = [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent ?? '');

    expect(labels).toHaveLength(1);
    expect(labels[0]).toContain('45-EA-01');

    await view.unmount();
  });

  it('rings every unit with a temperature when coloured by temperature', async () => {
    const view = await renderScene(site({ colourBy: 'temperature' }));

    expect(rings(view.objects())).toHaveLength(UNITS.length);

    await view.unmount();
  });

  it('writes the temperature on the label when coloured by temperature', async () => {
    const view = await renderScene(site({ colourBy: 'temperature', activeStageId: 'storage' }));
    await view.advance();

    expect(document.querySelector('[data-slot="scene-label"]')).toHaveTextContent('−162');

    await view.unmount();
  });

  it('rings only units with a status when coloured by status', async () => {
    const view = await renderScene(site({ statuses: { tank: { tone: 'warning', text: 'High level' } } }));

    expect(rings(view.objects())).toHaveLength(1);

    await view.unmount();
  });

  it('shows no labels when asked not to', async () => {
    const view = await renderScene(site({ showLabels: false }));
    await view.advance();

    expect(document.querySelectorAll('[data-slot="scene-label"]')).toHaveLength(0);

    await view.unmount();
  });
});

describe(ReplayPlantScene.name, () => {
  const layout = {
    id: 'p',
    name: 'Plant',
    size: [100, 60] as const,
    areas: [{ id: 'a', tag: 'A', name: 'Area', center: [0, 0] as const, size: [40, 30] as const, equipment: [{ id: 'k', kind: 'compressor' as const, tag: '23-KA-9103', position: [0, 0, 0] as const }] }],
    scenery: [],
    pipes: [
      { id: 'in', flow: true, points: [[-20, 1, 0], [-6, 1, 0]] as const },
      { id: 'out', flow: true, points: [[6, 1, 0], [20, 1, 0]] as const },
    ],
  };

  it('rings and labels equipment from the beacons at the playhead', async () => {
    const view = await renderScene(<ReplayPlantScene layout={layout} target={TARGET} beacons={{ k: { tone: 'critical', text: 'Tripped', pulse: true } }} />);
    await view.advance();

    expect(rings(view.objects()).length).toBeGreaterThan(0);
    expect(document.querySelector('[data-slot="scene-label"]')).toHaveTextContent('Tripped');

    await view.unmount();
  });

  it('keeps chevrons on a stopped line but removes them from an idle one', async () => {
    const cones = (objects: Object3D[]) => meshes(objects).filter((mesh) => mesh.geometry.type === 'ConeGeometry').length;
    const flowing = await renderScene(<ReplayPlantScene layout={layout} target={TARGET} />);
    const stopped = await renderScene(<ReplayPlantScene layout={layout} target={TARGET} pipes={{ in: 'stopped' }} />);
    const idle = await renderScene(<ReplayPlantScene layout={layout} target={TARGET} pipes={{ in: 'idle', out: 'idle' }} />);
    await flowing.advance();

    expect(cones(stopped.objects())).toBe(cones(flowing.objects()));
    expect(cones(idle.objects())).toBe(0);

    await flowing.unmount();
    await stopped.unmount();
    await idle.unmount();
  });
});

