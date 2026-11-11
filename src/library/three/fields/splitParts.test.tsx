import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mesh, Object3D } from 'three';

import { renderScene } from '../renderScene.fixture';

import { COMPRESSION_LINKS, COMPRESSION_SCENE } from './compressionArea';
import { PidDrawing } from './PidDrawing';
import type { PidInstrument } from './PidDrawing';
import { SplitScene } from './SplitScene';

const INSTRUMENTS: PidInstrument[] = [{ id: 'pt', letters: 'PT', loop: '92531', tag: '23-KA-9101', value: 48.6, unit: 'barg', decimals: 1 }];

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

const labels = () => [...document.querySelectorAll('[data-slot="scene-label"]')].map((label) => label.textContent ?? '');

function drawing(props: Partial<Parameters<typeof PidDrawing>[0]> = {}) {
  const onSelect = vi.fn();
  const onHover = vi.fn();
  const view = render(<PidDrawing links={COMPRESSION_LINKS} selectedTag={null} hoverTag={null} onSelect={onSelect} onHover={onHover} instruments={INSTRUMENTS} missingTags={['23-HV-9162']} {...props} />);
  return { onSelect, onHover, view };
}

describe(PidDrawing.name, () => {
  it('has a selectable hotspot for every symbol, named with tag and state', () => {
    drawing();

    expect(screen.getAllByRole('button')).toHaveLength(6);
    expect(screen.getByRole('button', { name: /23-KA-9101 1st stage compressor, running/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /23-XV-9111 Inlet shutdown valve, open/ })).toBeInTheDocument();
  });

  it('selects by tag on click and with the keyboard', async () => {
    const { onSelect } = drawing();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /23-KA-9102/ }));
    screen.getByRole('button', { name: /23-HA-9114/ }).focus();
    await user.keyboard('{Enter}');

    expect(onSelect.mock.calls).toEqual([['23-KA-9102'], ['23-HA-9114']]);
  });

  it('reports hover by tag and clears it on leave', async () => {
    const { onHover } = drawing();
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /23-VA-9120/ });

    await user.hover(button);
    await user.unhover(button);

    expect(onHover.mock.calls).toEqual([['23-VA-9120'], [null]]);
  });

  it('marks the selected symbol and highlights a cross-hovered one without selecting it', () => {
    const { view } = drawing({ selectedTag: '23-KA-9101', hoverTag: '23-HA-9114' });

    expect(screen.getByRole('button', { name: /23-KA-9101/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /23-HA-9114/ })).toHaveAttribute('aria-pressed', 'false');
    expect(view.container.querySelectorAll('rect[stroke-dasharray="4 3"]')).toHaveLength(1);
  });

  it('does not draw a hover highlight on the selected symbol', () => {
    const { view } = drawing({ selectedTag: '23-KA-9101', hoverTag: '23-KA-9101' });

    expect(view.container.querySelectorAll('rect[stroke-dasharray="4 3"]')).toHaveLength(0);
  });

  it('flags what the 3D model does not have', () => {
    drawing();

    expect(screen.getByText('Not in 3D model')).toBeInTheDocument();
  });

  it('shows the instrument value', () => {
    drawing();

    expect(screen.getByText('48.6')).toBeInTheDocument();
  });

  it('is an interactive diagram with a description', () => {
    drawing();

    expect(screen.getByRole('group', { name: /P&ID of the compression area/ })).toBeInTheDocument();
  });
});

describe(SplitScene.name, () => {
  const scene = (props: Partial<Parameters<typeof SplitScene>[0]> = {}) => <SplitScene links={COMPRESSION_LINKS} selectedTag={null} hoverTag={null} focusTag={null} drawingOnly={false} onSelect={vi.fn()} onHover={vi.fn()} {...props} />;
  const meshes = (objects: Object3D[]) => objects.filter(isMesh);
  const transparentCount = (objects: Object3D[]) => meshes(objects).filter((mesh) => !Array.isArray(mesh.material) && mesh.material.transparent && mesh.material.opacity < 0.3).length;

  it('draws every object in the model and labels it by tag', async () => {
    const view = await renderScene(scene());

    for (const item of COMPRESSION_SCENE) expect(labels()).toContain(item.tag);
    expect(meshes(view.objects()).length).toBeGreaterThan(60);
    await view.unmount();
  });

  it('can leave the labels off', async () => {
    const view = await renderScene(scene({ labels: false }));

    expect(labels().filter((text) => text.startsWith('23-'))).toHaveLength(0);
    await view.unmount();
  });

  it('ghosts what the drawing does not show', async () => {
    const normal = await renderScene(scene());
    const before = transparentCount(normal.objects());
    await normal.unmount();
    const ghosted = await renderScene(scene({ drawingOnly: true }));

    expect(transparentCount(ghosted.objects())).toBeGreaterThan(before);
    await ghosted.unmount();
  });

  it('flies the camera to the focused tag and back to the overview', async () => {
    const valve = COMPRESSION_SCENE.find((item) => item.tag === '23-XV-9171');
    const distanceToValve = (position: { x: number; y: number; z: number }) => Math.hypot(position.x - (valve?.position[0] ?? 0), position.y - 1, position.z - (valve?.position[2] ?? 0));
    const view = await renderScene(scene());
    const overview = distanceToValve(view.camera.position);
    await view.rerender(scene({ focusTag: '23-XV-9171' }));
    const focused = distanceToValve(view.camera.position);
    await view.rerender(scene({ focusTag: null }));

    expect(focused).toBeLessThan(overview * 0.7);
    expect(distanceToValve(view.camera.position)).toBeCloseTo(overview, 3);
    await view.unmount();
  });

  it('survives a focus tag the model does not have', async () => {
    const view = await renderScene(scene({ focusTag: '23-HV-9162', selectedTag: '23-HV-9162' }));

    expect(meshes(view.objects()).length).toBeGreaterThan(60);
    await view.unmount();
  });
});
