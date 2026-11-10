import { render, screen } from '@testing-library/react';

import { SceneCanvas } from './SceneCanvas';

describe(SceneCanvas.name, () => {
  it('renders the fallback with the scene label when WebGL is unavailable', () => {
    render(
      <SceneCanvas label="Nordkapp plant in 3D" webglAvailable={() => false}>
        <mesh />
      </SceneCanvas>
    );

    expect(screen.getByRole('group', { name: 'Nordkapp plant in 3D' })).toBeInTheDocument();
    expect(screen.getByText(/needs WebGL/)).toBeInTheDocument();
  });

  it('renders fallback content, such as a list of the scene items', () => {
    render(
      <SceneCanvas label="Plant" webglAvailable={() => false} fallback={<ul><li>Inlet separator</li></ul>}>
        <mesh />
      </SceneCanvas>
    );

    expect(screen.getByText('Inlet separator')).toBeInTheDocument();
    expect(screen.getByText(/listed below/)).toBeInTheDocument();
  });

  it('renders the fallback on request even when WebGL works', () => {
    render(
      <SceneCanvas label="Plant" forceFallback webglAvailable={() => true}>
        <mesh />
      </SceneCanvas>
    );

    expect(screen.getByRole('group', { name: 'Plant' })).toBeInTheDocument();
  });

  it('names the canvas region as an image when WebGL is available', () => {
    render(
      <SceneCanvas label="Plant" webglAvailable={() => true}>
        <mesh />
      </SceneCanvas>
    );

    expect(screen.getByRole('img', { name: 'Plant' })).toBeInTheDocument();
    expect(screen.queryByText(/needs WebGL/)).not.toBeInTheDocument();
  });

  it('does not throw with the default WebGL check in a DOM without WebGL', () => {
    expect(() =>
      render(
        <SceneCanvas label="Plant">
          <mesh />
        </SceneCanvas>
      )
    ).not.toThrow();
  });
});
