import { MeshBasicMaterial } from 'three';
import type { Mesh, Object3D } from 'three';

import { AreaVolume } from './AreaVolume';
import { CameraRig } from './CameraRig';
import { CompressorSkid } from './CompressorSkid';
import { Ground } from './Ground';
import { PipeRack } from './PipeRack';
import { PipeRun } from './PipeRun';
import { ProcessModule } from './ProcessModule';
import { geometryParameter, renderScene } from './renderScene.fixture';
import { SceneLights } from './SceneLights';
import { Selectable } from './Selectable';
import { SensorMarker } from './SensorMarker';
import { StatusBeacon } from './StatusBeacon';
import { Strut } from './Strut';
import { TurntableStage } from './TurntableStage';
import { ViewInsets } from './ViewInsets';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const ofType = (objects: Object3D[], type: string): Object3D[] => objects.filter((object) => object.type === type);
const withGeometry = (objects: Object3D[], type: string): Mesh[] => objects.filter(isMesh).filter((mesh) => mesh.geometry.type === type);

const ROUTE = [
  [0, 1, 0],
  [10, 1, 0],
  [10, 1, 10],
] as const;

describe(SceneLights.name, () => {
  it('sets up ambient, hemisphere and directional light', async () => {
    const view = await renderScene(<SceneLights />);

    expect(ofType(view.objects(), 'AmbientLight')).toHaveLength(1);
    expect(ofType(view.objects(), 'HemisphereLight')).toHaveLength(1);
    expect(ofType(view.objects(), 'DirectionalLight').length).toBeGreaterThanOrEqual(1);

    await view.unmount();
  });
});

describe(Ground.name, () => {
  it('draws a floor and two grid levels', async () => {
    const view = await renderScene(<Ground size={[40, 20]} cell={4} />);

    expect(withGeometry(view.objects(), 'PlaneGeometry')).toHaveLength(1);
    expect(ofType(view.objects(), 'LineSegments')).toHaveLength(2);

    await view.unmount();
  });
});

describe(Strut.name, () => {
  it('spans its two points', async () => {
    const view = await renderScene(<Strut from={[0, 0, 0]} to={[0, 0, 6]} material={new MeshBasicMaterial()} />);
    const [mesh] = withGeometry(view.objects(), 'CylinderGeometry');

    expect(mesh.position.toArray()).toEqual([0, 0, 3]);
    expect(geometryParameter(mesh, 'height')).toBe(6);

    await view.unmount();
  });
});

describe(PipeRun.name, () => {
  it('draws one segment per leg and an elbow at each corner', async () => {
    const view = await renderScene(<PipeRun points={ROUTE} />);

    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(2);
    expect(withGeometry(view.objects(), 'SphereGeometry')).toHaveLength(1);
    expect(withGeometry(view.objects(), 'ConeGeometry')).toHaveLength(0);

    await view.unmount();
  });

  it('places flow chevrons along the route, pointing downstream', async () => {
    const view = await renderScene(<PipeRun points={ROUTE} flow spacing={5} />);
    await view.advance();
    const chevrons = withGeometry(view.objects(), 'ConeGeometry');

    expect(chevrons).toHaveLength(4);
    expect(chevrons[0].position.toArray()).toEqual([2.5, 1, 0]);
    expect(chevrons[3].position.toArray()).toEqual([10, 1, 7.5]);

    await view.unmount();
  });

  it('keeps chevrons still under reduced motion', async () => {
    const view = await renderScene(<PipeRun points={ROUTE} flow spacing={5} />, { reducedMotion: true });
    await view.advance(1);
    await view.advance(1);

    expect(withGeometry(view.objects(), 'ConeGeometry')[0].position.toArray()).toEqual([2.5, 1, 0]);

    await view.unmount();
  });
});

describe(PipeRack.name, () => {
  it('builds portal frames along its length', async () => {
    const view = await renderScene(<PipeRack length={16} bay={8} pipes={2} />);

    // 3 frames × (2 columns + 2 beams).
    expect(withGeometry(view.objects(), 'BoxGeometry')).toHaveLength(12);
    // 2 levels × 2 pipes.
    expect(withGeometry(view.objects(), 'CylinderGeometry')).toHaveLength(4);

    await view.unmount();
  });
});

describe(ProcessModule.name, () => {
  it('frames its children', async () => {
    const view = await renderScene(
      <ProcessModule size={[14, 8, 10]}>
        <CompressorSkid />
      </ProcessModule>
    );

    expect(withGeometry(view.objects(), 'CylinderGeometry').length).toBeGreaterThan(12);

    await view.unmount();
  });
});

describe(StatusBeacon.name, () => {
  it('draws a ring of the given radius', async () => {
    const view = await renderScene(<StatusBeacon tone="warning" radius={4} />);
    const [ring] = withGeometry(view.objects(), 'RingGeometry');

    expect(geometryParameter(ring, 'outerRadius')).toBe(4);

    await view.unmount();
  });
});

describe(SensorMarker.name, () => {
  it('draws a ball and a halo at the position', async () => {
    const view = await renderScene(<SensorMarker position={[1, 2, 3]} tone="critical" />);
    await view.advance();

    expect(withGeometry(view.objects(), 'SphereGeometry')).toHaveLength(1);
    expect(withGeometry(view.objects(), 'RingGeometry')).toHaveLength(1);
    expect(view.scene.children[0].position.toArray()).toEqual([1, 2, 3]);

    await view.unmount();
  });
});

describe(AreaVolume.name, () => {
  it('draws a floor plate and an outline at the area centre', async () => {
    const view = await renderScene(<AreaVolume id="nk-23" center={[5, -3]} size={[20, 10]} />);

    expect(view.scene.children[0].position.toArray()).toEqual([5, 0, -3]);
    expect(withGeometry(view.objects(), 'PlaneGeometry')).toHaveLength(1);
    expect(ofType(view.objects(), 'LineSegments')).toHaveLength(1);

    await view.unmount();
  });
});

describe(Selectable.name, () => {
  it('passes the selection state to a render function', async () => {
    const children = vi.fn(() => <mesh />);

    const view = await renderScene(
      <Selectable id="23-ka-9101" selected>
        {children}
      </Selectable>
    );

    expect(children).toHaveBeenCalledWith({ hovered: false, selected: true });

    await view.unmount();
  });

  it('shows its outline only while selected or hovered', async () => {
    const idle = await renderScene(
      <Selectable id="a">
        <CompressorSkid />
      </Selectable>
    );
    const selected = await renderScene(
      <Selectable id="a" selected>
        <CompressorSkid />
      </Selectable>
    );
    const outline = (objects: Object3D[]) => ofType(objects, 'LineSegments')[0];

    expect(outline(idle.objects()).visible).toBe(false);
    expect(outline(selected.objects()).visible).toBe(true);
    expect(outline(selected.objects()).scale.x).toBeGreaterThan(10);

    await idle.unmount();
    await selected.unmount();
  });

  it('hides the outline when disabled', async () => {
    const view = await renderScene(
      <Selectable id="a" selected disabled>
        <CompressorSkid />
      </Selectable>
    );

    expect(ofType(view.objects(), 'LineSegments')[0].visible).toBe(false);

    await view.unmount();
  });
});

describe(CameraRig.name, () => {
  it('applies the first target at once', async () => {
    const view = await renderScene(<CameraRig target={{ position: [10, 20, 30], lookAt: [0, 0, 0] }} />);

    expect(view.camera.position.x).toBeCloseTo(10);
    expect(view.camera.position.y).toBeCloseTo(20);
    expect(view.camera.position.z).toBeCloseTo(30);

    await view.unmount();
  });

  it('jumps to a new target under reduced motion', async () => {
    const view = await renderScene(<CameraRig target={{ position: [10, 20, 30], lookAt: [0, 0, 0] }} />, { reducedMotion: true });

    await view.rerender(<CameraRig target={{ position: [0, 50, 5], lookAt: [0, 0, 0] }} />);

    expect(view.camera.position.y).toBeCloseTo(50);
    expect(view.camera.position.z).toBeCloseTo(5);

    await view.unmount();
  });

  it('flies to a new target over its duration', async () => {
    const view = await renderScene(<CameraRig target={{ position: [0, 20, 40], lookAt: [0, 0, 0] }} duration={1} />, { reducedMotion: false });
    await view.rerender(<CameraRig target={{ position: [40, 20, 40], lookAt: [0, 0, 0] }} duration={1} />);

    await view.advance(0.1);
    await view.advance(0.5);
    const midway = view.camera.position.x;
    await view.advance(0.6);

    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(40);
    expect(view.camera.position.x).toBeCloseTo(40);

    await view.unmount();
  });
});

describe(TurntableStage.name, () => {
  it('frames the subject and lights it', async () => {
    const view = await renderScene(
      <TurntableStage subjectSize={[10, 4, 4]}>
        <CompressorSkid />
      </TurntableStage>
    );

    expect(withGeometry(view.objects(), 'CircleGeometry')).toHaveLength(1);
    expect(ofType(view.objects(), 'AmbientLight')).toHaveLength(1);
    expect(view.camera.position.y).toBeGreaterThan(2);

    await view.unmount();
  });
});

describe(ViewInsets.name, () => {
  it('renders nothing into the scene', async () => {
    const view = await renderScene(<ViewInsets left={280} />);
    await view.advance();

    expect(view.scene.children).toHaveLength(0);

    await view.unmount();
  });
});
