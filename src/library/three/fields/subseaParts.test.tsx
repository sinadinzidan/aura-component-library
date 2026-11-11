import type { Mesh, Object3D } from 'three';

import { geometryParameter, renderScene } from '../renderScene.fixture';

import { FlowChevrons } from './FlowChevrons';
import { Fpso } from './Fpso';
import { MooringLine } from './MooringLine';
import { Rov } from './Rov';
import { SeabedTerrain } from './SeabedTerrain';
import { buildSubseaLayout, subseaHeight } from './subseaFieldData';
import { SubseaFieldScene } from './SubseaFieldScene';
import { SubseaTemplate3d } from './SubseaTemplate3d';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const meshes = (objects: Object3D[]): Mesh[] => objects.filter(isMesh);
const withGeometry = (objects: Object3D[], type: string): Mesh[] => meshes(objects).filter((mesh) => mesh.geometry.type === type);
const vertexCount = (mesh: Mesh): number => mesh.geometry.getAttribute('position').count;

const COLORS = {
  production: { color: 'rgb(10, 100, 200)', opacity: 1 },
  injection: { color: 'rgb(10, 200, 100)', opacity: 1 },
  control: { color: 'rgb(200, 100, 10)', opacity: 1 },
  mooring: { color: 'rgb(120, 120, 120)', opacity: 1 },
};
const LAYOUT = buildSubseaLayout();

describe(SeabedTerrain.name, () => {
  it('draws the facets and a mesh over them from the same vertices', async () => {
    const view = await renderScene(<SeabedTerrain height={subseaHeight} size={[100, 80]} segments={[10, 8]} />);
    const grids = meshes(view.objects()).filter((mesh) => mesh.geometry.type === 'BufferGeometry');

    expect(grids).toHaveLength(2);
    expect(vertexCount(grids[0])).toBe(11 * 9);
    expect(grids[0].geometry).toBe(grids[1].geometry);

    await view.unmount();
  });

  it('lifts vertices to the height function', async () => {
    const view = await renderScene(<SeabedTerrain height={() => 4} size={[20, 20]} segments={[2, 2]} />);
    const [mesh] = meshes(view.objects());
    const ys = Array.from({ length: vertexCount(mesh) }, (_, index) => mesh.geometry.getAttribute('position').getY(index));

    expect(new Set(ys)).toEqual(new Set([4]));

    await view.unmount();
  });
});

describe(SubseaTemplate3d.name, () => {
  it('stands a christmas tree on every slot', async () => {
    const view = await renderScene(<SubseaTemplate3d id="t" position={[0, 0, 0]} slots={3} />);

    expect(withGeometry(view.objects(), 'SphereGeometry').filter((mesh) => geometryParameter(mesh, 'radius') === 0.21)).toHaveLength(3);

    await view.unmount();
  });

  it('draws no trees without slots', async () => {
    const view = await renderScene(<SubseaTemplate3d id="t" position={[0, 0, 0]} slots={0} />);

    expect(withGeometry(view.objects(), 'SphereGeometry').filter((mesh) => geometryParameter(mesh, 'radius') === 0.21)).toHaveLength(0);

    await view.unmount();
  });

  it('moves with its position on the seabed', async () => {
    const view = await renderScene(<SubseaTemplate3d id="t" position={[5, -2, 7]} />);
    const group = view.scene.children[0];

    expect(group.position.toArray()).toEqual([5, -2, 7]);

    await view.unmount();
  });
});

describe(Fpso.name, () => {
  it('has a turret taller than the hull is deep', async () => {
    const view = await renderScene(<Fpso length={50} />);
    const cylinders = withGeometry(view.objects(), 'CylinderGeometry');
    const turret = cylinders.find((mesh) => Number(geometryParameter(mesh, 'height')) > 10);

    expect(turret).toBeDefined();

    await view.unmount();
  });

  it('puts the turret towards the bow, at the same place as the layout helper expects', async () => {
    const view = await renderScene(<Fpso length={50} />);
    const turret = withGeometry(view.objects(), 'CylinderGeometry').find((mesh) => Number(geometryParameter(mesh, 'height')) > 10);

    expect(turret?.position.x).toBeCloseTo(-18, 9);

    await view.unmount();
  });

  it('places the whole vessel at its position', async () => {
    const view = await renderScene(<Fpso position={[10, 40, -5]} />);

    expect(view.scene.children[0].position.toArray()).toEqual([10, 40, -5]);

    await view.unmount();
  });
});

describe(MooringLine.name, () => {
  it('draws a tube from the anchor and an anchor body', async () => {
    const view = await renderScene(<MooringLine id="ml" anchor={[0, 0.5, 0]} fairlead={[30, 35, 0]} color="rgb(100, 100, 100)" />);

    expect(withGeometry(view.objects(), 'TubeGeometry').length).toBeGreaterThanOrEqual(1);
    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(1);

    await view.unmount();
  });
});

describe(FlowChevrons.name, () => {
  const points = [
    [0, 0, 0],
    [30, 0, 0],
  ] as const;

  it('draws one cone per spacing along the line', async () => {
    const view = await renderScene(<FlowChevrons points={points} color="rgb(1, 2, 3)" spacing={6} />);

    expect(withGeometry(view.objects(), 'ConeGeometry')).toHaveLength(5);

    await view.unmount();
  });

  it('draws nothing on a line shorter than the spacing', async () => {
    const view = await renderScene(<FlowChevrons points={[[0, 0, 0], [2, 0, 0]]} color="rgb(1, 2, 3)" spacing={6} />);

    expect(withGeometry(view.objects(), 'ConeGeometry')).toHaveLength(0);

    await view.unmount();
  });

  it('holds still under reduced motion', async () => {
    const view = await renderScene(<FlowChevrons points={points} color="rgb(1, 2, 3)" />, { reducedMotion: true });
    await view.advance(0.5);
    const first = withGeometry(view.objects(), 'ConeGeometry')[0].position.x;
    await view.advance(2);

    expect(withGeometry(view.objects(), 'ConeGeometry')[0].position.x).toBe(first);

    await view.unmount();
  });

  it('moves along the line when motion is allowed', async () => {
    const view = await renderScene(<FlowChevrons points={points} color="rgb(1, 2, 3)" />, { reducedMotion: false });
    await view.advance(0.5);
    const first = withGeometry(view.objects(), 'ConeGeometry')[0].position.x;
    await view.advance(0.5);

    expect(withGeometry(view.objects(), 'ConeGeometry')[0].position.x).not.toBe(first);

    await view.unmount();
  });
});

describe(Rov.name, () => {
  const rovBody = (objects: Object3D[]): Object3D | undefined => objects.find((object) => object.type === 'Group' && object.scale.x === 1 && object.children.some((child) => isMesh(child) && child.geometry.type === 'BoxGeometry'));

  it('jumps to its target under reduced motion', async () => {
    const view = await renderScene(<Rov target={[1, 2, 3]} tetherFrom={[0, 10, 0]} />, { reducedMotion: true });
    await view.rerender(<Rov target={[10, 5, -4]} tetherFrom={[0, 10, 0]} />);
    await view.advance(0.05);

    expect(rovBody(view.objects())?.position.toArray()).toEqual([10, 5, -4]);

    await view.unmount();
  });

  it('flies towards a new target and has not arrived after one short frame', async () => {
    const view = await renderScene(<Rov target={[0, 0, 0]} tetherFrom={[0, 10, 0]} />, { reducedMotion: false });
    await view.rerender(<Rov target={[40, 0, 0]} tetherFrom={[0, 10, 0]} />);
    await view.advance(0.05);
    const x = rovBody(view.objects())?.position.x ?? 0;

    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(40);

    await view.unmount();
  });

  it('reports arrival once', async () => {
    const arrive = vi.fn();
    const view = await renderScene(<Rov target={[0, 0, 0]} tetherFrom={[0, 10, 0]} onArrive={arrive} />, { reducedMotion: true });
    await view.advance(0.05);
    await view.advance(0.05);

    expect(arrive).toHaveBeenCalledTimes(1);

    await view.unmount();
  });

  it('draws a light cone only when lit', async () => {
    const lit = await renderScene(<Rov target={[0, 0, 0]} tetherFrom={[0, 10, 0]} lit />);
    const litCones = withGeometry(lit.objects(), 'ConeGeometry').length;
    await lit.unmount();
    const dark = await renderScene(<Rov target={[0, 0, 0]} tetherFrom={[0, 10, 0]} lit={false} />);

    expect(litCones).toBe(1);
    expect(withGeometry(dark.objects(), 'ConeGeometry')).toHaveLength(0);

    await dark.unmount();
  });

  it('draws a tether line to the vessel', async () => {
    const view = await renderScene(<Rov target={[5, 0, 0]} tetherFrom={[0, 10, 0]} />);

    expect(view.objects().some((object) => object.type === 'Line')).toBe(true);

    await view.unmount();
  });
});

describe(SubseaFieldScene.name, () => {
  const scene = (props: Partial<Parameters<typeof SubseaFieldScene>[0]> = {}) => (
    <SubseaFieldScene layout={LAYOUT} height={subseaHeight} colors={COLORS} labels={false} {...props} />
  );
  const tubes = (objects: Object3D[]): Mesh[] => withGeometry(objects, 'TubeGeometry');

  it('draws the terrain, the vessel, templates and every line', async () => {
    const view = await renderScene(scene());

    expect(tubes(view.objects()).length).toBeGreaterThanOrEqual(LAYOUT.lines.length);
    expect(withGeometry(view.objects(), 'SphereGeometry').length).toBeGreaterThan(LAYOUT.structures.filter((item) => item.kind === 'template').length);

    await view.unmount();
  });

  it('ghosts the other networks under a system filter', async () => {
    const all = await renderScene(scene());
    const opaque = tubes(all.objects()).filter((mesh) => !Array.isArray(mesh.material) && mesh.material.transparent === false).length;
    await all.unmount();
    const filtered = await renderScene(scene({ filter: 'mooring' }));
    const stillOpaque = tubes(filtered.objects()).filter((mesh) => !Array.isArray(mesh.material) && mesh.material.transparent === false).length;

    expect(stillOpaque).toBeLessThan(opaque);

    await filtered.unmount();
  });

  it('adds flow chevrons on the lines that carry fluid when asked', async () => {
    const off = await renderScene(scene({ flow: false }));
    const base = withGeometry(off.objects(), 'ConeGeometry').length;
    await off.unmount();
    const on = await renderScene(scene({ flow: true }));

    expect(withGeometry(on.objects(), 'ConeGeometry').length).toBeGreaterThan(base + 10);

    await on.unmount();
  });

  it('shows the vehicle only when asked', async () => {
    const without = await renderScene(scene({ rov: false }));
    const lines = without.objects().filter((object) => object.type === 'Line').length;
    await without.unmount();
    const withRov = await renderScene(scene({ rov: true }));

    expect(withRov.objects().filter((object) => object.type === 'Line').length).toBe(lines + 1);

    await withRov.unmount();
  });

  it('survives an unknown selection and all depth levels', async () => {
    const view = await renderScene(scene({ selectedId: 'nope', level: 'seabed' }));
    await view.rerender(scene({ selectedId: 't-a', level: 'water-column' }));
    await view.rerender(scene({ selectedId: null, level: 'surface' }));

    expect(view.objects().length).toBeGreaterThan(50);

    await view.unmount();
  });
});
