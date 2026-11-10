import type { Mesh, Object3D } from 'three';

import { geometryParameter, renderScene } from '../renderScene.fixture';

import { WORLD_OUTLINES } from './continents';
import { FleetGlobe } from './FleetGlobe';
import type { GlobeSite } from './FleetGlobe';
import { latLongToVec3 } from './geo';
import { Globe } from './Globe';
import { GlobeControls } from './GlobeControls';
import { GreatCircleArc } from './GreatCircleArc';
import { SiteMarker } from './SiteMarker';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const withGeometry = (objects: Object3D[], type: string): Mesh[] => objects.filter(isMesh).filter((mesh) => mesh.geometry.type === type);
const named = (objects: Object3D[], name: string): Object3D | undefined => objects.find((object) => object.name === name);
const labels = (): string[] => [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent ?? '');

function vertexCount(object: Object3D | undefined): number {
  if (!object || !('geometry' in object)) return 0;
  const geometry = object.geometry;
  if (typeof geometry !== 'object' || geometry === null || !('getAttribute' in geometry) || typeof geometry.getAttribute !== 'function') return 0;
  const attribute: unknown = geometry.getAttribute('position');
  return typeof attribute === 'object' && attribute !== null && 'count' in attribute && typeof attribute.count === 'number' ? attribute.count : 0;
}

function opacityOf(mesh: Mesh): number {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  return material.opacity;
}

const SITES: readonly GlobeSite[] = [
  { id: 'nordkapp', name: 'Nordkapp', lat: 65.2, lon: 7.4, size: 0.2, tone: 'warning', status: 'Reduced', pulse: true },
  { id: 'stord', name: 'Stord terminal', lat: 59.8, lon: 5.5, size: 0.14, shape: 'diamond' },
];

const OVERVIEW = { lat: 58, lon: 8, distance: 31 };

describe(Globe.name, () => {
  it('draws a sphere of the given radius with a halo', async () => {
    const view = await renderScene(<Globe radius={8} />);
    const spheres = withGeometry(view.objects(), 'SphereGeometry');

    expect(spheres).toHaveLength(2);
    expect(geometryParameter(spheres[0], 'radius')).toBe(8);

    await view.unmount();
  });

  it('draws the graticule and the coastlines as line segments', async () => {
    const view = await renderScene(<Globe outlines={WORLD_OUTLINES} graticuleStep={30} halo={false} />);

    expect(withGeometry(view.objects(), 'SphereGeometry')).toHaveLength(1);
    expect(vertexCount(named(view.objects(), 'graticule'))).toBeGreaterThan(500);
    expect(vertexCount(named(view.objects(), 'coastlines'))).toBeGreaterThan(1000);

    await view.unmount();
  });

  it('draws no grid for a step of 0 and no coast without outlines', async () => {
    const view = await renderScene(<Globe graticuleStep={0} />);

    expect(vertexCount(named(view.objects(), 'graticule'))).toBe(0);
    expect(vertexCount(named(view.objects(), 'coastlines'))).toBe(0);

    await view.unmount();
  });
});

describe(SiteMarker.name, () => {
  it('sits on the surface at its latitude and longitude', async () => {
    const view = await renderScene(<SiteMarker lat={0} lon={90} globeRadius={10} />);
    const [x, y, z] = view.scene.children[0].position.toArray();

    expect(x).toBeCloseTo(10.08);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);

    await view.unmount();
  });

  it('draws a dot, a soft disc and a ring of the given size', async () => {
    const view = await renderScene(<SiteMarker lat={60} lon={5} size={0.3} />);
    const discs = withGeometry(view.objects(), 'CircleGeometry');

    expect(discs.map((disc) => geometryParameter(disc, 'radius'))).toEqual([0.3 * 2.4, 0.3]);
    expect(withGeometry(view.objects(), 'RingGeometry')).toHaveLength(1);

    await view.unmount();
  });

  it('draws a four-sided mark for a diamond', async () => {
    const view = await renderScene(<SiteMarker lat={60} lon={5} shape="diamond" />);

    expect(geometryParameter(withGeometry(view.objects(), 'CircleGeometry')[1], 'segments')).toBe(4);

    await view.unmount();
  });

  it('adds a second ring when selected and grows', async () => {
    const view = await renderScene(<SiteMarker lat={60} lon={5} selected />);

    expect(withGeometry(view.objects(), 'RingGeometry')).toHaveLength(2);
    expect(view.scene.children[0].scale.x).toBeGreaterThan(1);

    await view.unmount();
  });

  it('pulses the ring over time', async () => {
    const view = await renderScene(<SiteMarker lat={60} lon={5} pulse />, { reducedMotion: false });
    await view.advance(0.1);
    await view.advance(1);

    expect(withGeometry(view.objects(), 'RingGeometry')[0].scale.x).toBeGreaterThan(1);

    await view.unmount();
  });

  it('holds the ring still under reduced motion', async () => {
    const view = await renderScene(<SiteMarker lat={60} lon={5} pulse />, { reducedMotion: true });
    await view.advance(1);

    expect(withGeometry(view.objects(), 'RingGeometry')[0].scale.x).toBe(1);

    await view.unmount();
  });

  it('fades when dimmed', async () => {
    const view = await renderScene(<SiteMarker lat={60} lon={5} dimmed />);

    expect(opacityOf(withGeometry(view.objects(), 'CircleGeometry')[1])).toBeLessThan(0.3);

    await view.unmount();
  });
});

describe(GreatCircleArc.name, () => {
  const from = { lat: 65, lon: 7 };
  const to = { lat: 52, lon: 4 };

  it('draws one line between the two places', async () => {
    const view = await renderScene(<GreatCircleArc from={from} to={to} />);

    expect(view.objects().filter((object) => object.type === 'Line2')).toHaveLength(1);
    expect(withGeometry(view.objects(), 'SphereGeometry')).toHaveLength(0);

    await view.unmount();
  });

  it('moves a bead along the route when it flows', async () => {
    const view = await renderScene(<GreatCircleArc from={from} to={to} flow period={4} globeRadius={10} />, { reducedMotion: false });
    await view.advance(0.001);
    const [bead] = withGeometry(view.objects(), 'SphereGeometry');
    const start = bead.position.clone();
    await view.advance(2);

    expect(start.distanceTo(bead.position)).toBeGreaterThan(0.5);
    expect(bead.position.length()).toBeGreaterThan(10);

    await view.unmount();
  });

  it('holds the bead in the middle under reduced motion', async () => {
    const view = await renderScene(<GreatCircleArc from={from} to={to} flow />, { reducedMotion: true });
    await view.advance(1);
    const [bead] = withGeometry(view.objects(), 'SphereGeometry');
    const before = bead.position.clone();
    await view.advance(1);

    expect(before.distanceTo(bead.position)).toBe(0);

    await view.unmount();
  });
});

describe(GlobeControls.name, () => {
  it('places the camera above the view at once', async () => {
    const view = await renderScene(<GlobeControls view={{ lat: 0, lon: 90, distance: 30 }} />);

    expect(view.camera.position.x).toBeCloseTo(30);
    expect(view.camera.position.y).toBeCloseTo(0);

    await view.unmount();
  });

  it('swings around the globe to a new view without passing through it', async () => {
    const view = await renderScene(<GlobeControls view={{ lat: 0, lon: 0, distance: 30 }} duration={1} />, { reducedMotion: false });
    await view.rerender(<GlobeControls view={{ lat: 0, lon: 180, distance: 30 }} duration={1} />);
    await view.advance(0.1);
    await view.advance(0.5);
    const halfway = view.camera.position.length();
    await view.advance(0.6);

    expect(halfway).toBeCloseTo(30, 3);
    expect(view.camera.position.z).toBeCloseTo(-30, 3);

    await view.unmount();
  });

  it('jumps under reduced motion', async () => {
    const view = await renderScene(<GlobeControls view={{ lat: 0, lon: 0, distance: 30 }} />, { reducedMotion: true });
    await view.rerender(<GlobeControls view={{ lat: 60, lon: 10, distance: 18 }} />);
    const [x, y, z] = latLongToVec3(60, 10, 18);

    expect(view.camera.position.x).toBeCloseTo(x);
    expect(view.camera.position.y).toBeCloseTo(y);
    expect(view.camera.position.z).toBeCloseTo(z);

    await view.unmount();
  });

  it('turns slowly around the axis while spinning', async () => {
    const view = await renderScene(<GlobeControls view={{ lat: 30, lon: 0, distance: 30 }} spinning spinPeriod={10} />, { reducedMotion: false });
    await view.advance(0.1);
    const height = view.camera.position.y;
    await view.advance(0.2);
    await view.advance(0.2);

    expect(view.camera.position.x).not.toBeCloseTo(0, 2);
    expect(view.camera.position.y).toBeCloseTo(height);
    expect(view.camera.position.length()).toBeCloseTo(30);

    await view.unmount();
  });

  it('does not spin under reduced motion', async () => {
    const view = await renderScene(<GlobeControls view={{ lat: 30, lon: 0, distance: 30 }} spinning spinPeriod={10} />, { reducedMotion: true });
    await view.advance(0.2);
    await view.advance(0.2);

    expect(view.camera.position.x).toBeCloseTo(0);

    await view.unmount();
  });
});

describe(FleetGlobe.name, () => {
  it('draws a marker per site and a line per route', async () => {
    const view = await renderScene(<FleetGlobe sites={SITES} routes={[{ id: 'r1', from: SITES[0], to: SITES[1] }]} view={OVERVIEW} />);

    // Each marker has a soft disc and a dot.
    expect(withGeometry(view.objects(), 'CircleGeometry')).toHaveLength(4);
    expect(view.objects().filter((object) => object.type === 'Line2')).toHaveLength(1);

    await view.unmount();
  });

  it('labels only the selected site', async () => {
    const none = await renderScene(<FleetGlobe sites={SITES} view={OVERVIEW} />);
    await none.advance();
    const without = labels();
    await none.unmount();

    const one = await renderScene(<FleetGlobe sites={SITES} view={OVERVIEW} selectedId="nordkapp" />);
    await one.advance();

    expect(without).toEqual([]);
    expect(labels()).toEqual(['NordkappReduced']);

    await one.unmount();
  });
});
