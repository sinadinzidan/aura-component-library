import { fireEvent } from '@testing-library/react';
import { MeshStandardMaterial } from 'three';
import type { Mesh, Object3D } from 'three';

import { geometryParameter, renderScene } from '../renderScene.fixture';
import { useSceneEnvironment } from '../sceneEnvironment';

import { AxialCylinder } from './AxialCylinder';
import { BarrelCasing } from './BarrelCasing';
import { BearingHousing } from './BearingHousing';
import { CompressorTrain } from './CompressorTrain';
import { COMPRESSOR_TRAIN_EXPLODE, TRAIN_ASSEMBLY_IDS, impellerPositions } from './compressorTrainLayout';
import { CouplingGuard } from './CouplingGuard';
import { ExplodeGroup } from './ExplodeGroup';
import { Hotspot } from './Hotspot';
import { InstrumentStand } from './InstrumentStand';
import { LubeOilSkid } from './LubeOilSkid';
import { RotorBundle } from './RotorBundle';
import { SealGasPanel } from './SealGasPanel';
import { SectionCut } from './SectionCut';
import { StillScene } from './StillScene';
import { TrainBaseFrame } from './TrainBaseFrame';
import { TrainGearbox } from './TrainGearbox';
import { TurbineDriver } from './TurbineDriver';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const meshes = (objects: Object3D[]): Mesh[] => objects.filter(isMesh);
const withGeometry = (objects: Object3D[], type: string): Mesh[] => meshes(objects).filter((mesh) => mesh.geometry.type === type);
const hotspotBadges = () => [...document.querySelectorAll('[data-slot="hotspot"]')];

const PARTS = [
  ['TrainBaseFrame', <TrainBaseFrame key="p" />, 8],
  ['TurbineDriver', <TurbineDriver key="p" />, 20],
  ['TrainGearbox', <TrainGearbox key="p" />, 10],
  ['CouplingGuard', <CouplingGuard key="p" />, 6],
  ['BarrelCasing', <BarrelCasing key="p" />, 8],
  ['RotorBundle', <RotorBundle key="p" />, 15],
  ['BearingHousing', <BearingHousing key="p" x={-1.8} />, 4],
  ['SealGasPanel', <SealGasPanel key="p" />, 10],
  ['LubeOilSkid', <LubeOilSkid key="p" />, 12],
  ['InstrumentStand', <InstrumentStand key="p" x={0} z={0} />, 4],
] as const;

describe('compressor train sub-assemblies', () => {
  it.each(PARTS)('%s is built from many primitives', async (_name, part, minimum) => {
    const view = await renderScene(part);

    expect(meshes(view.objects()).length).toBeGreaterThanOrEqual(minimum);

    await view.unmount();
  });
});

describe(AxialCylinder.name, () => {
  it('lies along the x axis at the given station', async () => {
    const view = await renderScene(<AxialCylinder x={3} y={2} radius={1} radiusEnd={0.5} length={4} material={new MeshStandardMaterial()} />);
    const [mesh] = withGeometry(view.objects(), 'CylinderGeometry');

    expect(mesh.position.toArray()).toEqual([3, 2, 0]);
    expect(mesh.rotation.z).toBeCloseTo(Math.PI / 2);
    expect(geometryParameter(mesh, 'height')).toBe(4);
    expect(geometryParameter(mesh, 'radiusBottom')).toBe(0.5);

    await view.unmount();
  });
});

describe(SectionCut.name, () => {
  const material = new MeshStandardMaterial();

  it('draws a whole shell when not cut', async () => {
    const view = await renderScene(<SectionCut radius={1.4} length={4} material={material} rimMaterial={material} />);
    const [shell] = withGeometry(view.objects(), 'CylinderGeometry');

    expect(geometryParameter(shell, 'thetaLength')).toBeCloseTo(Math.PI * 2);
    expect(withGeometry(view.objects(), 'BoxGeometry')).toHaveLength(0);

    await view.unmount();
  });

  it('keeps only the lower half, open, with two joint faces when cut', async () => {
    const view = await renderScene(<SectionCut radius={1.4} length={4} cut material={material} rimMaterial={material} />);
    const [shell] = withGeometry(view.objects(), 'CylinderGeometry');

    expect(geometryParameter(shell, 'thetaStart')).toBeCloseTo(Math.PI);
    expect(geometryParameter(shell, 'thetaLength')).toBeCloseTo(Math.PI);
    expect(geometryParameter(shell, 'openEnded')).toBe(true);
    expect(withGeometry(view.objects(), 'BoxGeometry')).toHaveLength(2);

    await view.unmount();
  });
});

describe(BarrelCasing.name, () => {
  it('shows the stage diaphragms only when sectioned', async () => {
    const whole = await renderScene(<BarrelCasing />);
    const wholeCount = meshes(whole.objects()).length;
    await whole.unmount();
    const cut = await renderScene(<BarrelCasing sectionCut />);

    // Four diaphragms and two joint faces appear; the nameplate goes.
    expect(meshes(cut.objects()).length).toBe(wholeCount + 4 + 2 - 1);

    await cut.unmount();
  });

  it('ghosts the nozzles when sectioned', async () => {
    const view = await renderScene(<BarrelCasing sectionCut />);
    const flange = withGeometry(view.objects(), 'CylinderGeometry').find((mesh) => geometryParameter(mesh, 'radiusTop') === 0.7);
    const material = flange?.material;

    expect(material instanceof MeshStandardMaterial && material.transparent).toBe(true);

    await view.unmount();
  });
});

describe(RotorBundle.name, () => {
  it('spaces the impellers evenly from the suction end', () => {
    expect(impellerPositions(3).map((x) => Math.round(x * 10) / 10)).toEqual([-5.9, -5.2, -4.5]);
    expect(impellerPositions(0)).toEqual([]);
  });

  it('adds three primitives per stage', async () => {
    const three = await renderScene(<RotorBundle stages={3} />);
    const threeCount = meshes(three.objects()).length;
    await three.unmount();
    const five = await renderScene(<RotorBundle stages={5} />);

    expect(meshes(five.objects()).length).toBe(threeCount + 6);

    await five.unmount();
  });
});

describe(ExplodeGroup.name, () => {
  it('starts at its offset', async () => {
    const view = await renderScene(
      <ExplodeGroup offset={[2, 0, 0]}>
        <mesh name="part" />
      </ExplodeGroup>
    );

    expect(view.scene.getObjectByName('part')?.parent?.position.toArray()).toEqual([2, 0, 0]);

    await view.unmount();
  });

  it('jumps to a new offset under reduced motion', async () => {
    const content = <mesh name="part" />;
    const view = await renderScene(<ExplodeGroup offset={[0, 0, 0]}>{content}</ExplodeGroup>);

    await view.rerender(<ExplodeGroup offset={[4, 0, -1]}>{content}</ExplodeGroup>);
    await view.advance();

    expect(view.scene.getObjectByName('part')?.parent?.position.toArray()).toEqual([4, 0, -1]);

    await view.unmount();
  });

  it('eases towards a new offset when motion is allowed', async () => {
    const content = <mesh name="part" />;
    const view = await renderScene(<ExplodeGroup offset={[0, 0, 0]}>{content}</ExplodeGroup>, { reducedMotion: false });

    await view.rerender(<ExplodeGroup offset={[4, 0, 0]}>{content}</ExplodeGroup>);
    await view.advance(0.016);
    const x = view.scene.getObjectByName('part')?.parent?.position.x ?? 0;

    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(4);

    await view.unmount();
  });
});

describe(StillScene.name, () => {
  function Probe({ onRead }: { onRead: (reduced: boolean) => void }) {
    const { reducedMotion } = useSceneEnvironment();
    onRead(reducedMotion);
    return null;
  }

  it('makes everything inside behave as under reduced motion', async () => {
    const onRead = vi.fn();
    const view = await renderScene(
      <StillScene>
        <Probe onRead={onRead} />
      </StillScene>,
      { reducedMotion: false }
    );

    expect(onRead).toHaveBeenLastCalledWith(true);

    await view.unmount();
  });

  it('lets motion through when not still', async () => {
    const onRead = vi.fn();
    const view = await renderScene(
      <StillScene still={false}>
        <Probe onRead={onRead} />
      </StillScene>,
      { reducedMotion: false }
    );

    expect(onRead).toHaveBeenLastCalledWith(false);

    await view.unmount();
  });
});

describe(Hotspot.name, () => {
  it('shows only its number until selected', async () => {
    const view = await renderScene(<Hotspot position={[0, 1, 0]} index={3} tag="23-PT-92531" value="48.6 barg" />);
    await view.advance();

    expect(hotspotBadges()[0]).toHaveTextContent(/^3$/);

    await view.unmount();
  });

  it('adds the tag and reading when selected', async () => {
    const view = await renderScene(<Hotspot position={[0, 1, 0]} index={3} tag="23-PT-92531" value="48.6 barg" selected />);
    await view.advance();

    expect(hotspotBadges()[0]).toHaveTextContent('323-PT-9253148.6 barg');
    expect(hotspotBadges()[0]).toHaveAttribute('data-selected', 'true');

    await view.unmount();
  });

  it('calls onSelect from its badge and stays out of the tab order', async () => {
    const onSelect = vi.fn();
    const view = await renderScene(<Hotspot position={[0, 1, 0]} index={1} tag="23-VT-92540" onSelect={onSelect} />);
    await view.advance();
    const button = hotspotBadges()[0]?.querySelector('button');

    if (button) fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(hotspotBadges()[0]).toHaveAttribute('aria-hidden', 'true');

    await view.unmount();
  });

  it('keeps its halo still unless it pulses', async () => {
    const view = await renderScene(<Hotspot position={[0, 1, 0]} index={1} tag="23-VT-92540" tone="warning" />, { reducedMotion: false });
    const [halo] = withGeometry(view.objects(), 'RingGeometry');

    await view.advance(0.5);

    expect(halo.scale.x).toBe(1);

    await view.unmount();
  });

  it('expands its halo when it pulses', async () => {
    const view = await renderScene(<Hotspot position={[0, 1, 0]} index={1} tag="23-VT-92540" tone="critical" pulse />, { reducedMotion: false });
    const [halo] = withGeometry(view.objects(), 'RingGeometry');

    await view.advance(0.5);

    expect(halo.scale.x).toBeGreaterThan(1);

    await view.unmount();
  });
});

describe(CompressorTrain.name, () => {
  const groups = (objects: Object3D[]): Object3D[] => objects.filter((object) => object.type === 'Group' && object.parent?.parent?.type === 'Scene');

  it('draws one moving group per sub-assembly, assembled at the origin', async () => {
    const view = await renderScene(<CompressorTrain />);
    const parts = groups(view.objects());

    expect(parts).toHaveLength(TRAIN_ASSEMBLY_IDS.length);
    expect(parts.every((group) => group.position.length() === 0)).toBe(true);

    await view.unmount();
  });

  it('moves the sub-assemblies apart along their explode directions', async () => {
    const view = await renderScene(<CompressorTrain explode={1} />);
    const parts = groups(view.objects());
    const at = (id: (typeof TRAIN_ASSEMBLY_IDS)[number]) => parts[TRAIN_ASSEMBLY_IDS.indexOf(id)].position;

    expect(at('turbine').x).toBeCloseTo(COMPRESSOR_TRAIN_EXPLODE.turbine.distance);
    expect(at('rotor').x).toBeCloseTo(-COMPRESSOR_TRAIN_EXPLODE.rotor.distance);
    expect(at('casing').length()).toBe(0);
    expect(at('lube-oil').z).toBeGreaterThan(0);

    await view.unmount();
  });

  it('ghosts every sub-assembly that is not active', async () => {
    const view = await renderScene(<CompressorTrain activeIds={['rotor']} />);
    const ghosted = meshes(view.objects()).filter((mesh) => mesh.material instanceof MeshStandardMaterial && mesh.material.transparent);
    const solid = meshes(view.objects()).filter((mesh) => mesh.material instanceof MeshStandardMaterial && !mesh.material.transparent);

    expect(ghosted.length).toBeGreaterThan(solid.length);
    expect(solid.length).toBeGreaterThanOrEqual(15);

    await view.unmount();
  });

  it('puts hotspots on their sub-assembly so they travel with it', async () => {
    const view = await renderScene(
      <CompressorTrain
        explode={1}
        hotspots={[{ id: 'vt', index: 1, assemblyId: 'turbine', position: [5, 3, 0], tag: '23-VT-92540' }]}
        selectedHotspotId="vt"
      />
    );
    await view.advance();
    const marker = withGeometry(view.objects(), 'RingGeometry')[0];
    let owner: Object3D | null = marker;
    while (owner && owner.parent?.parent?.type !== 'Scene') owner = owner.parent;

    expect(owner?.position.x).toBeCloseTo(COMPRESSOR_TRAIN_EXPLODE.turbine.distance);
    expect(hotspotBadges()[0]).toHaveTextContent('123-VT-92540');

    await view.unmount();
  });
});
