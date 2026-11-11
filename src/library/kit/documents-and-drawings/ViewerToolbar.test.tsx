import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { ViewerToolbar } from './ViewerToolbar';

const wrapper = ({ children }: { children: ReactNode }) => <TooltipProvider>{children}</TooltipProvider>;

describe(ViewerToolbar.name, () => {
  it('shows the zoom and calls the zoom handlers', async () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onFit = vi.fn();
    render(<ViewerToolbar label="Drawing viewer" zoom={125} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onFit={onFit} />, { wrapper });

    expect(screen.getByRole('toolbar', { name: 'Drawing viewer' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Zoom' })).toHaveTextContent('125 %');
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fit to window' }));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onFit).toHaveBeenCalledTimes(1);
    // Three tooltip-wrapped clicks are slow on a loaded machine.
  }, 20_000);

  it('disables zoom at the limits', () => {
    render(<ViewerToolbar label="Viewer" zoom={100} minZoom={100} maxZoom={100} onZoomIn={vi.fn()} onZoomOut={vi.fn()} onFit={vi.fn()} />, { wrapper });

    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  });

  it('pages through a document and hides paging for a single sheet', async () => {
    const onPage = vi.fn();
    const { rerender } = render(<ViewerToolbar label="Viewer" zoom={100} onZoomIn={vi.fn()} onZoomOut={vi.fn()} onFit={vi.fn()} page={1} pages={14} onPage={onPage} />, { wrapper });

    expect(screen.getByText('Page 1 of 14')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPage).toHaveBeenCalledWith(2);

    rerender(<ViewerToolbar label="Viewer" zoom={100} onZoomIn={vi.fn()} onZoomOut={vi.fn()} onFit={vi.fn()} page={1} pages={1} />);
    expect(screen.queryByText(/Page 1/)).not.toBeInTheDocument();
  });

  it('renders the title and extra controls', () => {
    render(
      <ViewerToolbar label="Viewer" zoom={100} onZoomIn={vi.fn()} onZoomOut={vi.fn()} onFit={vi.fn()} title="NK-23-PID-0103">
        <button type="button">Download</button>
      </ViewerToolbar>,
      { wrapper }
    );

    expect(screen.getByText('NK-23-PID-0103')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });
});
