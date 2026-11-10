import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OverflowActions } from './OverflowActions';
import type { OverflowAction } from './OverflowActions';

describe(OverflowActions.name, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows every action as a button when there is room', () => {
    mockLayout({ containerWidth: 600, buttonWidth: 80 });

    render(<OverflowActions label="Work order actions" actions={makeActions()} />);

    expect(screen.getByRole('button', { name: 'Assign' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });

  it('moves the last actions into a menu when the row is too narrow', () => {
    mockLayout({ containerWidth: 200, buttonWidth: 80 });

    render(<OverflowActions label="Work order actions" actions={makeActions()} />);

    expect(screen.getByRole('button', { name: 'Assign' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('runs a hidden action from the menu', async () => {
    mockLayout({ containerWidth: 200, buttonWidth: 80 });
    const actions = makeActions();
    render(<OverflowActions label="Work order actions" actions={actions} />);

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    expect(actions[3].onSelect).toHaveBeenCalledTimes(1);
  });

  it('runs a visible action from its button', async () => {
    mockLayout({ containerWidth: 600, buttonWidth: 80 });
    const actions = makeActions();
    render(<OverflowActions label="Work order actions" actions={actions} />);

    await userEvent.click(screen.getByRole('button', { name: 'Export' }));

    expect(actions[1].onSelect).toHaveBeenCalledTimes(1);
  });

  it('names the group and the menu button', () => {
    mockLayout({ containerWidth: 200, buttonWidth: 80 });

    render(<OverflowActions label="Work order actions" moreLabel="More work order actions" actions={makeActions()} />);

    expect(screen.getByRole('group', { name: 'Work order actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More work order actions' })).toBeInTheDocument();
  });
});

function makeActions(): OverflowAction[] {
  return [
    { id: 'assign', label: 'Assign', onSelect: vi.fn() },
    { id: 'export', label: 'Export', onSelect: vi.fn() },
    { id: 'duplicate', label: 'Duplicate', onSelect: vi.fn() },
    { id: 'delete', label: 'Delete', onSelect: vi.fn(), destructive: true },
  ];
}

/** happy-dom has no layout, so give the list container and every button a fixed width. */
function mockLayout({ containerWidth, buttonWidth }: { containerWidth: number; buttonWidth: number }) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    let width = 0;
    if (this.getAttribute('data-slot') === 'overflow-list') width = containerWidth;
    if (this.tagName === 'BUTTON') width = buttonWidth;
    return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: 28, width, height: 28, toJSON: () => ({}) };
  });
}
