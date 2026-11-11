import { fireEvent, render, screen } from '@testing-library/react';

import { WidgetChrome } from './WidgetChrome';

describe(WidgetChrome.name, () => {
  it('renders the widget untouched in view mode', () => {
    const { container } = render(
      <WidgetChrome actions={<button type="button">Remove</button>} onResizeStart={vi.fn()}>
        <p>Availability</p>
      </WidgetChrome>,
    );

    expect(screen.getByText('Availability')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    expect(container.querySelector('[data-resize]')).toBeNull();
  });

  it('makes the widget inert and shows the actions while editing', () => {
    render(
      <WidgetChrome editing actions={<button type="button">Remove</button>}>
        <p>Availability</p>
      </WidgetChrome>,
    );

    expect(screen.getByText('Availability').parentElement).toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('shows the size in cells once the widget is selected', () => {
    const { rerender } = render(
      <WidgetChrome editing sizeLabel="4 × 3">
        <p>Availability</p>
      </WidgetChrome>,
    );
    expect(screen.queryByText('4 × 3')).not.toBeInTheDocument();

    rerender(
      <WidgetChrome editing selected sizeLabel="4 × 3">
        <p>Availability</p>
      </WidgetChrome>,
    );

    expect(screen.getByText('4 × 3')).toBeInTheDocument();
  });

  it.each(['width', 'height', 'both'] as const)('starts a %s resize from its handle', (axis) => {
    const onResizeStart = vi.fn();
    const { container } = render(
      <WidgetChrome editing onResizeStart={onResizeStart}>
        <p>Availability</p>
      </WidgetChrome>,
    );
    const handle = container.querySelector(`[data-resize="${axis}"]`);
    if (!handle) throw new Error('No handle');

    fireEvent.pointerDown(handle);

    expect(onResizeStart).toHaveBeenCalledWith(axis, expect.anything());
  });

  it('has no resize handles for a fixed-size widget', () => {
    const { container } = render(
      <WidgetChrome editing>
        <p>Availability</p>
      </WidgetChrome>,
    );

    expect(container.querySelector('[data-resize]')).toBeNull();
  });
});
