import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { fireEvent, render, screen } from '@testing-library/react';

import { INITIAL_TREE_VISIBILITY } from './modelTree';
import { ModelTreePanel } from './ModelTreePanel';
import { VIEWER_PARTS, VIEWER_TREE } from './viewerModel';

function setup(visibility = INITIAL_TREE_VISIBILITY, selectedId: string | null = null) {
  const handlers = { onToggle: vi.fn(), onIsolate: vi.fn(), onSelect: vi.fn(), onShowAll: vi.fn() };
  render(
    <TooltipProvider>
      <ModelTreePanel tree={VIEWER_TREE} visibility={visibility} selectedId={selectedId} {...handlers} />
    </TooltipProvider>
  );
  return handlers;
}

describe(ModelTreePanel.name, () => {
  it('lists the module, its groups and every part', () => {
    setup();

    expect(screen.getAllByRole('listitem')).toHaveLength(1 + 5 + VIEWER_PARTS.length);
  });

  it('hides a part from its eye button', () => {
    const { onToggle } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Drive motor, shown. Hide' }));

    expect(onToggle).toHaveBeenCalledWith('motor');
  });

  it('says when a part is hidden and a group is partly hidden', () => {
    setup({ hiddenIds: ['motor'], isolatedId: null });

    expect(screen.getByRole('button', { name: 'Drive motor, hidden. Show' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compression, partly hidden. Show' })).toBeInTheDocument();
    expect(screen.getByText('1 hidden')).toBeInTheDocument();
  });

  it('isolates a node and marks the isolated one', () => {
    const { onIsolate } = setup({ hiddenIds: [], isolatedId: 'cooler' });

    fireEvent.click(screen.getByRole('button', { name: 'Isolate Drive motor' }));

    expect(onIsolate).toHaveBeenCalledWith('motor');
    expect(screen.getByRole('button', { name: 'Isolate Interstage cooler' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('One group isolated')).toBeInTheDocument();
  });

  it('selects by name and marks the selection', () => {
    const { onSelect } = setup(INITIAL_TREE_VISIBILITY, 'motor');

    fireEvent.click(screen.getByRole('button', { name: 'Lube oil skid 23-LU-9105' }));

    expect(onSelect).toHaveBeenCalledWith('lube-oil');
    expect(screen.getByRole('button', { name: /Drive motor 23-EM-9101/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows everything again', () => {
    const { onShowAll } = setup({ hiddenIds: ['motor'], isolatedId: null });

    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));

    expect(onShowAll).toHaveBeenCalled();
  });

  it('disables show all when nothing is changed', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Show all' })).toBeDisabled();
  });
});
