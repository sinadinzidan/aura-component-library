import { fireEvent, render, screen } from '@testing-library/react';
import type { Mesh, Object3D } from 'three';

import { geometryParameter, renderScene } from '../renderScene.fixture';

import { PipelineCorridor } from './PipelineCorridor';
import { PIPELINE_ANOMALIES, PIPELINE_STATIONS, buildPipelineRoute, elevationProfile, scenarioProfile } from './pipelineData';
import { PipelineScene } from './PipelineScene';
import { ProfileStrip } from './ProfileStrip';
import { RailCamera } from './RailCamera';
import { StationModel } from './StationModel';

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const withGeometry = (objects: Object3D[], type: string): Mesh[] => objects.filter(isMesh).filter((mesh) => mesh.geometry.type === type);

const ROUTE = buildPipelineRoute();
const labels = () => [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent ?? '');

describe(StationModel.name, () => {
  it('draws a compressor station with two skids and a pad', async () => {
    const view = await renderScene(<StationModel kind="compressor" />);

    expect(withGeometry(view.objects(), 'BoxGeometry').some((mesh) => geometryParameter(mesh, 'width') === 30)).toBe(true);
    await view.unmount();
  });

  it('draws nothing for a crossing', async () => {
    const view = await renderScene(<StationModel kind="crossing" />);

    expect(view.objects().filter(isMesh)).toHaveLength(0);
    await view.unmount();
  });

  it('draws more equipment at a terminal than at a block valve', async () => {
    const valve = await renderScene(<StationModel kind="valve" />);
    const small = valve.objects().filter(isMesh).length;
    await valve.unmount();
    const terminal = await renderScene(<StationModel kind="terminal" />);

    expect(terminal.objects().filter(isMesh).length).toBeGreaterThan(small);
    await terminal.unmount();
  });

  it('follows its position and rotation', async () => {
    const view = await renderScene(<StationModel kind="valve" position={[5, 2, 9]} rotationY={0.5} />);
    const group = view.scene.children[0];

    expect(group.position.toArray()).toEqual([5, 2, 9]);
    expect(group.rotation.y).toBe(0.5);
    await view.unmount();
  });
});

describe(RailCamera.name, () => {
  it('puts the camera at the pose and looks at the target', async () => {
    const view = await renderScene(<RailCamera pose={{ position: [10, 5, 0], lookAt: [30, 5, 0] }} />);

    expect(view.camera.position.toArray()).toEqual([10, 5, 0]);
    const direction = view.camera.getWorldDirection(view.camera.position.clone());
    expect(direction.x).toBeGreaterThan(0.99);
    await view.unmount();
  });

  it('follows a new pose', async () => {
    const view = await renderScene(<RailCamera pose={{ position: [0, 5, 0], lookAt: [10, 5, 0] }} />);
    await view.rerender(<RailCamera pose={{ position: [50, 6, 2], lookAt: [60, 6, 2] }} />);

    expect(view.camera.position.toArray()).toEqual([50, 6, 2]);
    await view.unmount();
  });
});

describe(PipelineCorridor.name, () => {
  it('draws the line as one tube along the route and a terrain', async () => {
    const view = await renderScene(<PipelineCorridor route={ROUTE} labels={false} />);

    expect(withGeometry(view.objects(), 'TubeGeometry')).toHaveLength(1);
    expect(view.objects().filter(isMesh).some((mesh) => mesh.geometry.type === 'BufferGeometry')).toBe(true);
    await view.unmount();
  });

  it('pins every anomaly', async () => {
    const without = await renderScene(<PipelineCorridor route={ROUTE} labels={false} anomalies={[]} />);
    const base = without.objects().filter(isMesh).length;
    await without.unmount();
    const view = await renderScene(<PipelineCorridor route={ROUTE} labels={false} />);

    expect(view.objects().filter(isMesh).length - base).toBe(PIPELINE_ANOMALIES.length * 2);
    await view.unmount();
  });

  it('shows the pig only when it has a position', async () => {
    const without = await renderScene(<PipelineCorridor route={ROUTE} labels={false} pigKp={null} />);
    const base = withGeometry(without.objects(), 'CylinderGeometry').length;
    await without.unmount();
    const view = await renderScene(<PipelineCorridor route={ROUTE} labels={false} pigKp={46.5} />);

    expect(withGeometry(view.objects(), 'CylinderGeometry').length).toBe(base + 1);
    await view.unmount();
  });

  it('adds pressure rings and a plume while a leak is on, and the shut-in segment once isolated', async () => {
    const off = await renderScene(<PipelineCorridor route={ROUTE} labels={false} leakStage="off" />);
    const rings = withGeometry(off.objects(), 'RingGeometry').length;
    const tubes = withGeometry(off.objects(), 'TubeGeometry').length;
    await off.unmount();
    const detected = await renderScene(<PipelineCorridor route={ROUTE} labels={false} leakStage="detected" />);
    const isolated = await renderScene(<PipelineCorridor route={ROUTE} labels={false} leakStage="isolated" />);

    expect(withGeometry(detected.objects(), 'RingGeometry').length).toBe(rings + 3);
    expect(withGeometry(detected.objects(), 'TubeGeometry')).toHaveLength(tubes);
    expect(withGeometry(isolated.objects(), 'TubeGeometry')).toHaveLength(tubes + 1);
    await detected.unmount();
    await isolated.unmount();
  });

  it('labels the stations, and the leak when there is one', async () => {
    const view = await renderScene(<PipelineCorridor route={ROUTE} leakStage="detected" />);

    expect(labels().some((text) => text.includes('CS-01'))).toBe(true);
    expect(labels().some((text) => text.includes('Leak detected'))).toBe(true);
    await view.unmount();
  });
});

describe(PipelineScene.name, () => {
  it('rides the rail: the camera ends up above the pipe at the chainage', async () => {
    const view = await renderScene(<PipelineScene route={ROUTE} cameraKp={40} mode="rail" labels={false} />);

    expect(view.camera.position.x).toBeGreaterThan(150);
    expect(view.camera.position.x).toBeLessThan(215);
    await view.unmount();
  });

  it('moves along when the chainage changes', async () => {
    const view = await renderScene(<PipelineScene route={ROUTE} cameraKp={20} mode="rail" labels={false} />);
    const before = view.camera.position.x;
    await view.rerender(<PipelineScene route={ROUTE} cameraKp={60} mode="rail" labels={false} />);

    expect(view.camera.position.x).toBeGreaterThan(before + 100);
    await view.unmount();
  });

  it('shows a cursor marker in the overview and none on the rail', async () => {
    const rail = await renderScene(<PipelineScene route={ROUTE} cameraKp={20} mode="rail" labels={false} />);
    const railSpheres = withGeometry(rail.objects(), 'SphereGeometry').length;
    await rail.unmount();
    const overview = await renderScene(<PipelineScene route={ROUTE} cameraKp={20} mode="overview" labels={false} />);

    expect(withGeometry(overview.objects(), 'SphereGeometry').length).toBe(railSpheres + 1);
    await overview.unmount();
  });
});

describe(ProfileStrip.name, () => {
  const props = {
    label: 'Profile of the pipeline',
    totalKm: 84,
    elevation: elevationProfile(2),
    pressure: scenarioProfile('off').map((point) => ({ kp: point.kp, value: point.pressure })),
    maop: 132,
    cameraKp: 30,
    onSeek: vi.fn(),
  };

  beforeEach(() => props.onSeek.mockClear());

  it('is a slider that reports the camera position', () => {
    render(<ProfileStrip {...props} />);
    const slider = screen.getByRole('slider', { name: 'Profile of the pipeline' });

    expect(slider).toHaveAttribute('aria-valuenow', '30');
    expect(slider).toHaveAttribute('aria-valuetext', 'Kilometre 30.0 of 84');
  });

  it('steps along the line with the arrow keys and jumps with Home and End', () => {
    render(<ProfileStrip {...props} keyStep={2} />);
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
    fireEvent.keyDown(slider, { key: 'End' });
    fireEvent.keyDown(slider, { key: 'Home' });
    fireEvent.keyDown(slider, { key: 'a' });

    expect(props.onSeek.mock.calls).toEqual([[32], [20], [84], [0]]);
  });

  it('never seeks outside the line', () => {
    render(<ProfileStrip {...props} cameraKp={84} />);

    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight', shiftKey: true });

    expect(props.onSeek).toHaveBeenCalledWith(84);
  });

  it('draws the stations, findings, pig and cursor', () => {
    const { container } = render(
      <ProfileStrip {...props} pigKp={46.5} stations={PIPELINE_STATIONS.map((station) => ({ id: station.id, label: station.short, kp: station.kp }))} anomalies={[{ id: 'a', kp: 10, tone: 'warning' }]} />
    );

    expect(container.querySelector('[data-slot="profile-pig"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="profile-cursor"]')).not.toBeNull();
    expect(screen.getByText('CS-01')).toBeInTheDocument();
    expect(screen.getByText('MAOP')).toBeInTheDocument();
  });

  it('hides the pig and the isolated band when there are none, and shows the band when isolated', () => {
    const { container, rerender } = render(<ProfileStrip {...props} />);

    expect(container.querySelector('[data-slot="profile-pig"]')).toBeNull();
    expect(container.querySelector('[data-slot="profile-isolated"]')).toBeNull();

    rerender(<ProfileStrip {...props} isolated={[52, 70]} leak={{ kp: 58.4, fronts: [49, 67] }} />);

    expect(container.querySelector('[data-slot="profile-isolated"]')).not.toBeNull();
    expect(screen.getByText('Isolated')).toBeInTheDocument();
  });
});
