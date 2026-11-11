import { fireEvent, render, screen } from '@testing-library/react';

import { ViewCube } from './ViewCube';

describe(ViewCube.name, () => {
  it('renders six faces as buttons', () => {
    render(<ViewCube angles={{ azimuth: 0, elevation: 0 }} onFace={() => undefined} />);

    expect(screen.getAllByRole('button')).toHaveLength(6);
  });

  it('turns the cube with the camera', () => {
    const { container } = render(<ViewCube angles={{ azimuth: 30, elevation: 20 }} />);

    expect(container.querySelector('[class*="preserve-3d"]')).toHaveStyle({ transform: 'rotateX(-20deg) rotateY(-30deg)' });
  });

  it('reports the face a user picks', () => {
    const onFace = vi.fn();
    render(<ViewCube angles={{ azimuth: 0, elevation: 0 }} onFace={onFace} />);

    fireEvent.click(screen.getByRole('button', { name: 'View from the right' }));

    expect(onFace).toHaveBeenCalledWith('right');
  });

  it('outlines the face the camera looks at', () => {
    render(<ViewCube angles={{ azimuth: 0, elevation: 0 }} active="front" onFace={() => undefined} />);

    expect(screen.getByRole('button', { name: 'View from the front' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'View from the back' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('never offers the bottom face', () => {
    const onFace = vi.fn();
    render(<ViewCube angles={{ azimuth: 0, elevation: 0 }} onFace={onFace} />);

    const bottom = screen.getByRole('button', { name: 'View from below, not available' });
    expect(bottom).toBeDisabled();
    fireEvent.click(bottom);
    expect(onFace).not.toHaveBeenCalled();
  });

  it('is read-only without a handler', () => {
    render(<ViewCube angles={{ azimuth: 0, elevation: 0 }} />);

    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });
});
