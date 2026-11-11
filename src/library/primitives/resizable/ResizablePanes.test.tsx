import { fireEvent, render, screen } from '@testing-library/react';

import { Pane } from './Pane';
import { PaneHandle } from './PaneHandle';
import { ResizablePanes } from './ResizablePanes';
import { renderPanes } from './testUtils';

describe(ResizablePanes.name, () => {
  it('lays panes out side by side by default and stacked when vertical', () => {
    const { unmount } = renderPanes();
    expect(document.querySelector('[data-slot="resizable-panes"]')).toHaveClass('flex-row');
    unmount();

    renderPanes({ group: { orientation: 'vertical' } });
    expect(document.querySelector('[data-slot="resizable-panes"]')).toHaveClass('flex-col');
  });

  it('starts from a saved layout', () => {
    renderPanes({ group: { defaultLayout: [44, 56] } });

    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '44');
  });

  it('falls back to the defaults when the saved layout does not match', () => {
    renderPanes({ group: { defaultLayout: [20, 30, 50] } });

    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '30');
  });

  it('reports the sizes after a change, not on first render', () => {
    const onLayoutChange = vi.fn();
    renderPanes({ group: { onLayoutChange } });
    expect(onLayoutChange).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' });

    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange).toHaveBeenCalledWith([32, 68]);
  });

  it('announces a keyboard resize', () => {
    renderPanes();

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' });

    expect(document.querySelector('[data-slot="resizable-announcer"]')).toHaveTextContent('Navigation 32 percent');
  });

  it('announces a collapse', () => {
    renderPanes({ first: { collapsible: true } });

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'Enter' });

    expect(document.querySelector('[data-slot="resizable-announcer"]')).toHaveTextContent('Navigation collapsed');
  });

  it('gives each handle of a three-pane group its own pane', () => {
    render(
      <ResizablePanes>
        <Pane label="Tree" defaultSize={20}>
          Tree
        </Pane>
        <PaneHandle />
        <Pane label="Canvas" defaultSize={55}>
          Canvas
        </Pane>
        <PaneHandle />
        <Pane label="Inspector" defaultSize={25}>
          Inspector
        </Pane>
      </ResizablePanes>
    );

    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize Canvas' }), { key: 'ArrowRight' });

    expect(screen.getByRole('separator', { name: 'Resize Tree' })).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByRole('separator', { name: 'Resize Canvas' })).toHaveAttribute('aria-valuenow', '57');
    expect(screen.getByRole('group', { name: 'Inspector' })).toHaveStyle({ flexGrow: '23' });
  });

  it('keeps nested groups independent', () => {
    render(
      <ResizablePanes>
        <Pane label="Explorer" defaultSize={25}>
          Explorer
        </Pane>
        <PaneHandle />
        <Pane label="Workspace">
          <ResizablePanes orientation="vertical">
            <Pane label="Editor" defaultSize={70}>
              Editor
            </Pane>
            <PaneHandle />
            <Pane label="Console">Console</Pane>
          </ResizablePanes>
        </Pane>
      </ResizablePanes>
    );

    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize Editor' }), { key: 'ArrowDown' });

    expect(screen.getByRole('separator', { name: 'Resize Editor' })).toHaveAttribute('aria-valuenow', '72');
    expect(screen.getByRole('separator', { name: 'Resize Explorer' })).toHaveAttribute('aria-valuenow', '25');
  });
});
