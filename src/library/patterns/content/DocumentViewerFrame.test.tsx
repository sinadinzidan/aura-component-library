import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { DocumentViewerFrame } from './DocumentViewerFrame';

function renderViewer(props: Partial<ComponentProps<typeof DocumentViewerFrame>> = {}) {
  const handlers = { onPageChange: vi.fn(), onZoomChange: vi.fn() };
  render(
    <TooltipProvider>
      <DocumentViewerFrame title="P&ID rev C.pdf" page={2} pageCount={14} zoom={100} {...handlers} {...props}>
        <p>Page content</p>
      </DocumentViewerFrame>
    </TooltipProvider>
  );
  return handlers;
}

describe(DocumentViewerFrame.name, () => {
  it('names the viewer after the document and shows the page', () => {
    renderViewer();

    expect(screen.getByRole('region', { name: 'Viewer: P&ID rev C.pdf' })).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 14')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('steps pages in both directions', async () => {
    const { onPageChange } = renderViewer();

    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));

    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });

  it('stops at the first and the last page', () => {
    renderViewer({ page: 1, pageCount: 1 });

    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });

  it('zooms by one level', async () => {
    const { onZoomChange } = renderViewer();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));

    expect(onZoomChange.mock.calls).toEqual([[125], [75]]);
  });

  it('disables zoom at the largest level', () => {
    renderViewer({ zoom: 200 });

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
  });

  it('offers download only when there is a handler', async () => {
    const onDownload = vi.fn();
    renderViewer({ onDownload });

    await userEvent.click(screen.getByRole('button', { name: 'Download P&ID rev C.pdf' }));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('has no download button without a handler', () => {
    renderViewer();

    expect(screen.queryByRole('button', { name: /Download/ })).not.toBeInTheDocument();
  });
});
