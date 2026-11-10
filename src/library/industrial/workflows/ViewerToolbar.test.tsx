import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ViewerToolbar } from './ViewerToolbar';

describe(ViewerToolbar.name, () => {
  it('shows the zoom level in a named toolbar', () => {
    render(<ViewerToolbar zoom={100} onZoomChange={vi.fn()} onFit={vi.fn()} label="Drawing controls" />);
    expect(screen.getByRole('toolbar', { name: 'Drawing controls' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Zoom level' })).toHaveTextContent('100%');
  });

  it('steps the zoom in and out', async () => {
    const onZoomChange = vi.fn();
    render(<ViewerToolbar zoom={100} onZoomChange={onZoomChange} onFit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onZoomChange.mock.calls).toEqual([[125], [75]]);
  });

  it('disables a zoom button at the end of the range', () => {
    render(<ViewerToolbar zoom={200} onZoomChange={vi.fn()} onFit={vi.fn()} range={{ max: 200 }} />);
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
  });

  it('fits to screen and renders extra controls', async () => {
    const onFit = vi.fn();
    render(
      <ViewerToolbar zoom={100} onZoomChange={vi.fn()} onFit={onFit}>
        <button type="button">Layers</button>
      </ViewerToolbar>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Fit to screen' }));
    expect(onFit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Layers' })).toBeInTheDocument();
  });
});
