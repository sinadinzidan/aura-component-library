import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { fireEvent, render, screen } from '@testing-library/react';

import { ViewerToolbar3d } from './ViewerToolbar3d';

function setup(props: Partial<Parameters<typeof ViewerToolbar3d>[0]> = {}) {
  const handlers = { onModeChange: vi.fn(), onToolChange: vi.fn(), onFit: vi.fn(), onHome: vi.fn() };
  render(
    <TooltipProvider>
      <ViewerToolbar3d mode="orbit" tool="select" {...handlers} {...props} />
    </TooltipProvider>
  );
  return handlers;
}

describe(ViewerToolbar3d.name, () => {
  it('is a labelled toolbar with the drag action pressed', () => {
    setup();

    expect(screen.getByRole('toolbar', { name: '3D viewer controls' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Orbit (O)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Pan (P)' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('changes the drag action', () => {
    const { onModeChange } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Pan (P)' }));

    expect(onModeChange).toHaveBeenCalledWith('pan');
  });

  it('changes the click tool', () => {
    const { onToolChange } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Measure (M)' }));

    expect(onToolChange).toHaveBeenCalledWith('measure');
  });

  it('hides the tool group when there is no tool handler', () => {
    setup({ tool: undefined, onToolChange: undefined });

    expect(screen.queryByRole('button', { name: 'Measure (M)' })).not.toBeInTheDocument();
  });

  it('fits and goes home', () => {
    const { onFit, onHome } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Fit to model (F)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Home view (H)' }));

    expect(onFit).toHaveBeenCalled();
    expect(onHome).toHaveBeenCalled();
  });
});
