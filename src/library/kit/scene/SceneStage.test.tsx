import { fireEvent, render, screen } from '@testing-library/react';

import { SceneStage } from './SceneStage';

describe(SceneStage.name, () => {
  it('renders the scene and its overlay', () => {
    render(<SceneStage overlay={<button type="button">Reset view</button>}>Scene</SceneStage>);

    expect(screen.getByText('Scene')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeInTheDocument();
  });

  it('keeps the overlay layer out of the way of the pointer', () => {
    const { container } = render(<SceneStage overlay="Readouts">Scene</SceneStage>);

    expect(container.querySelector('[data-slot="scene-stage-overlay"]')).toHaveClass('pointer-events-none');
  });

  it('calls onEscape when Escape is pressed inside it', () => {
    const onEscape = vi.fn();
    render(<SceneStage onEscape={onEscape}>Scene</SceneStage>);

    fireEvent.keyDown(screen.getByText('Scene'), { key: 'Escape' });

    expect(onEscape).toHaveBeenCalledOnce();
  });

  it('ignores other keys', () => {
    const onEscape = vi.fn();
    render(<SceneStage onEscape={onEscape}>Scene</SceneStage>);

    fireEvent.keyDown(screen.getByText('Scene'), { key: 'Enter' });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it('draws the glow backdrop unless told not to', () => {
    const { container, rerender } = render(<SceneStage>Scene</SceneStage>);
    expect(container.querySelector('[data-slot="scene-stage-backdrop"]')).not.toBeNull();

    rerender(<SceneStage backdrop="none">Scene</SceneStage>);
    expect(container.querySelector('[data-slot="scene-stage-backdrop"]')).toBeNull();
  });
});
