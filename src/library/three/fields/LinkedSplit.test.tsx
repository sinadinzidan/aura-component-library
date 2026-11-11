import { fireEvent, render, screen } from '@testing-library/react';

import { LinkedSplit } from './LinkedSplit';

function setup(ratio = 50) {
  const onRatioChange = vi.fn();
  const view = render(<LinkedSplit start={<p>Left pane</p>} end={<p>Right pane</p>} startLabel="Drawing" endLabel="3D model" ratio={ratio} onRatioChange={onRatioChange} />);
  return { onRatioChange, view };
}

describe(LinkedSplit.name, () => {
  it('shows both panes', () => {
    setup();

    expect(screen.getByText('Left pane')).toBeInTheDocument();
    expect(screen.getByText('Right pane')).toBeInTheDocument();
  });

  it('gives the left pane its share of the width', () => {
    const { view } = setup(40);

    expect(view.container.querySelector<HTMLElement>('[data-slot="linked-split"] > div')?.style.width).toBe('40%');
  });

  it('is a focusable vertical separator that says where it is', () => {
    setup(40);
    const separator = screen.getByRole('separator');

    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('aria-valuenow', '40');
    expect(separator).toHaveAttribute('aria-valuemin', '25');
    expect(separator).toHaveAttribute('aria-valuemax', '75');
    expect(separator).toHaveAttribute('aria-valuetext', 'Drawing 40 percent, 3D model 60 percent');
    expect(separator).toHaveAttribute('tabindex', '0');
  });

  it('moves with the arrow keys and announces the result', () => {
    const { onRatioChange } = setup(50);
    const separator = screen.getByRole('separator');

    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    fireEvent.keyDown(separator, { key: 'ArrowLeft' });
    fireEvent.keyDown(separator, { key: 'End' });

    expect(onRatioChange.mock.calls).toEqual([[55], [45], [75]]);
    expect(screen.getByRole('status')).toHaveTextContent('Drawing 75 percent, 3D model 25 percent');
  });

  it('does not report a change at a limit and leaves other keys alone', () => {
    const { onRatioChange } = setup(75);
    const separator = screen.getByRole('separator');

    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    fireEvent.keyDown(separator, { key: 'Tab' });

    expect(onRatioChange).not.toHaveBeenCalled();
  });

  it('resizes while dragged and stops on release', () => {
    const { onRatioChange, view } = setup(50);
    const root = view.container.querySelector<HTMLElement>('[data-slot="linked-split"]');
    if (!root) throw new Error('missing split');
    root.getBoundingClientRect = () => ({ left: 100, width: 800, top: 0, height: 400, right: 900, bottom: 400, x: 100, y: 0, toJSON: () => ({}) });
    const separator = screen.getByRole('separator');
    separator.setPointerCapture = vi.fn();
    separator.releasePointerCapture = vi.fn();

    fireEvent.pointerMove(separator, { clientX: 300 });
    expect(onRatioChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(separator, { clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(separator, { clientX: 420 });
    fireEvent.pointerUp(separator, { pointerId: 1 });
    fireEvent.pointerMove(separator, { clientX: 700 });

    expect(onRatioChange.mock.calls).toEqual([[40]]);
    expect(separator).toHaveAttribute('data-dragging', 'false');
  });

  it('keeps a ratio outside the limits inside them', () => {
    setup(5);

    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '25');
  });
});
