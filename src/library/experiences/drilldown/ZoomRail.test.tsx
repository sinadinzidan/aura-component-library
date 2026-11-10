import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { fixtureTree } from './drilldownFixture';
import { createDrillReducer, createDrillState, levelSteps } from './drillReducer';
import { ZoomRail } from './ZoomRail';

const tree = fixtureTree();
const reduce = createDrillReducer(tree);
const atArea = reduce(createDrillState(tree), { type: 'drill', id: 'area-b' });

describe(ZoomRail.name, () => {
  it('lists the four levels with what is selected at each', () => {
    render(<ZoomRail steps={levelSteps(tree, atArea)} onSelect={vi.fn()} />);

    expect(screen.getByRole('list', { name: 'Zoom level' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Nordkapp plant')).toBeInTheDocument();
    expect(screen.getByText('Gas compression')).toBeInTheDocument();
  });

  it('marks the current level', () => {
    render(<ZoomRail steps={levelSteps(tree, atArea)} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Area/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /Site/ })).not.toHaveAttribute('aria-current');
  });

  it('says why a deeper level cannot be picked yet', () => {
    render(<ZoomRail steps={levelSteps(tree, atArea)} onSelect={vi.fn()} emptyText="Pick one on the plan" />);

    expect(screen.getByRole('button', { name: /Equipment/ })).toBeDisabled();
    expect(screen.getAllByText('Pick one on the plan')).toHaveLength(2);
  });

  it('goes to a level in one click', async () => {
    const onSelect = vi.fn();
    render(<ZoomRail steps={levelSteps(tree, atArea)} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Site/ }));

    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('keeps levels below reachable after going up', () => {
    const backUp = reduce(atArea, { type: 'up' });
    render(<ZoomRail steps={levelSteps(tree, backUp)} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Area/ })).toBeEnabled();
  });
});
