import { fireEvent } from '@testing-library/react';
import type { Mesh, Object3D } from 'three';

import { geometryParameter, renderScene } from '../renderScene.fixture';

import { FaultCallout } from './FaultCallout';
import { HologramScene } from './HologramScene';
import { ProjectorBase } from './ProjectorBase';
import { ScanPlane } from './ScanPlane';
import type { WireframePart } from './scanSweep';
import { WireframeModel } from './WireframeModel';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const meshes = (objects: Object3D[]): Mesh[] => objects.filter(isMesh);
const withGeometry = (objects: Object3D[], type: string): Mesh[] => meshes(objects).filter((mesh) => mesh.geometry.type === type);
const opacityOf = (mesh: Mesh): number => ('opacity' in mesh.material ? Number(mesh.material.opacity) : 1);
const callout = () => document.querySelector('[data-slot="fault-callout"]');

const PARTS: WireframePart[] = [
  { id: 'motor', shape: 'cylinder', center: [0, 2, 0], height: 2, radius: 1.2 },
  { id: 'bearing', shape: 'cylinder', center: [0, 3.5, 0], height: 0.6, radius: 0.6 },
  { id: 'base', shape: 'box', center: [0, 0.8, 0], height: 0.3, width: 3, depth: 3 },
];

describe(WireframeModel.name, () => {
  it('draws every part as a see-through solid', async () => {
    const view = await renderScene(<WireframeModel parts={PARTS} />);
    const solids = [...withGeometry(view.objects(), 'CylinderGeometry'), ...withGeometry(view.objects(), 'BoxGeometry')];

    expect(solids).toHaveLength(3);
    expect(solids.every((mesh) => opacityOf(mesh) < 0.3)).toBe(true);

    await view.unmount();
  });

  it('draws the edges of every part as lines', async () => {
    const view = await renderScene(<WireframeModel parts={PARTS} />);

    expect(view.objects().filter((object) => object.type === 'LineSegments2')).toHaveLength(3);

    await view.unmount();
  });

  it('fills the parts a scan is passing more strongly', async () => {
    const view = await renderScene(<WireframeModel parts={PARTS} activeIds={['motor']} />);
    const [motor, bearing] = withGeometry(view.objects(), 'CylinderGeometry');

    expect(opacityOf(motor)).toBeGreaterThan(opacityOf(bearing));

    await view.unmount();
  });

  it('wraps the faulted part in a glow', async () => {
    const plain = await renderScene(<WireframeModel parts={PARTS} />);
    const count = withGeometry(plain.objects(), 'CylinderGeometry').length;
    await plain.unmount();
    const view = await renderScene(<WireframeModel parts={PARTS} faultId="bearing" />);

    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(count + 1);

    await view.unmount();
  });

  it('breathes the glow only when motion is allowed', async () => {
    const still = await renderScene(<WireframeModel parts={PARTS} faultId="bearing" />);
    const before = opacityOf(withGeometry(still.objects(), 'CylinderGeometry')[2]);
    await still.advance(0.4);
    expect(opacityOf(withGeometry(still.objects(), 'CylinderGeometry')[2])).toBe(before);
    await still.unmount();

    const moving = await renderScene(<WireframeModel parts={PARTS} faultId="bearing" />, { reducedMotion: false });
    await moving.advance(0.4);
    expect(opacityOf(withGeometry(moving.objects(), 'CylinderGeometry')[2])).not.toBe(before);
    await moving.unmount();
  });
});

describe(ScanPlane.name, () => {
  it('draws a disc and its rim', async () => {
    const view = await renderScene(<ScanPlane radius={3} />);

    expect(withGeometry(view.objects(), 'CircleGeometry')).toHaveLength(1);
    expect(withGeometry(view.objects(), 'RingGeometry')).toHaveLength(1);

    await view.unmount();
  });

  it('adds a ring where it cuts the model', async () => {
    const view = await renderScene(<ScanPlane radius={3} sectionRadius={1.2} />);
    const rings = withGeometry(view.objects(), 'RingGeometry');

    expect(rings).toHaveLength(2);
    expect(Number(geometryParameter(rings[1], 'innerRadius'))).toBeCloseTo(1.224);

    await view.unmount();
  });
});

describe(ProjectorBase.name, () => {
  it('draws rings, ticks and a light cone', async () => {
    const view = await renderScene(<ProjectorBase radius={4} beamHeight={2} />);

    expect(withGeometry(view.objects(), 'RingGeometry')).toHaveLength(3);
    expect(withGeometry(view.objects(), 'PlaneGeometry')).toHaveLength(24);
    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(2);

    await view.unmount();
  });

  it('leaves the cone out when it has no height', async () => {
    const view = await renderScene(<ProjectorBase beamHeight={0} />);

    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(1);

    await view.unmount();
  });
});

describe(FaultCallout.name, () => {
  it('names the fault and stays hidden from assistive technology', async () => {
    const view = await renderScene(<FaultCallout position={[0, 3, 0]} title="Drive-end bearing" detail="Fault · 94 % confidence" />);
    await view.advance();

    expect(callout()).toHaveTextContent('Drive-end bearingFault · 94 % confidence');
    expect(callout()).toHaveAttribute('aria-hidden', 'true');

    await view.unmount();
  });

  it('becomes a pointer-only button with onClick', async () => {
    const onClick = vi.fn();
    const view = await renderScene(<FaultCallout position={[0, 3, 0]} title="Drive-end bearing" onClick={onClick} />);
    await view.advance();
    const button = callout()?.querySelector('button');

    if (button) fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('tabindex', '-1');

    await view.unmount();
  });
});

describe(HologramScene.name, () => {
  const planeHeight = (objects: Object3D[]): number => withGeometry(objects, 'CircleGeometry')[0].parent?.parent?.position.y ?? Number.NaN;

  it('places the scan plane from the scan fraction', async () => {
    const view = await renderScene(<HologramScene parts={PARTS} scan={0.5} />);

    // Parts span y 0.65 to 3.8.
    expect(planeHeight(view.objects())).toBeCloseTo(2.225);

    await view.unmount();
  });

  it('rings the part the plane is passing', async () => {
    const passing = await renderScene(<HologramScene parts={PARTS} scan={0.5} />);
    expect(withGeometry(passing.objects(), 'RingGeometry').some((ring) => Number(geometryParameter(ring, 'innerRadius')) === 1.2 * 1.02)).toBe(true);
    await passing.unmount();
  });

  it('holds still under reduced motion even in auto mode', async () => {
    const onScanChange = vi.fn();
    const view = await renderScene(<HologramScene parts={PARTS} scan={0.2} autoScan rotate onScanChange={onScanChange} />);
    const before = planeHeight(view.objects());

    await view.advance(2);

    expect(planeHeight(view.objects())).toBe(before);
    expect(onScanChange).not.toHaveBeenCalled();

    await view.unmount();
  });

  it('sweeps the plane and reports its position when motion is allowed', async () => {
    const onScanChange = vi.fn();
    const view = await renderScene(<HologramScene parts={PARTS} scan={0} autoScan scanPeriod={10} onScanChange={onScanChange} />, { reducedMotion: false });

    await view.advance(2.5);

    expect(planeHeight(view.objects())).toBeCloseTo(0.65 + (3.8 - 0.65) * 0.5);
    expect(onScanChange).toHaveBeenLastCalledWith(0.5);

    await view.unmount();
  });

  it('shows the fault callout on the faulted part', async () => {
    const view = await renderScene(<HologramScene parts={PARTS} scan={0} faultId="bearing" fault={{ title: 'Drive-end bearing' }} />);
    await view.advance();

    expect(callout()).toHaveTextContent('Drive-end bearing');

    await view.unmount();
  });
});
