import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { cond, group, TEST_DATASET } from './fixtures';
import { ROOT_ID } from './queryModel';
import type { SavedQuery } from './queryModel';
import { SavedQueries } from './SavedQueries';

const QUERIES: SavedQuery[] = [
  { id: 'q1', name: 'Weak compressors', datasetId: 'assets', root: group(ROOT_ID, 'and', [cond('c1', 'score', 'lt', { a: '75' })]) },
  { id: 'q2', name: 'Tripped', datasetId: 'assets', root: group(ROOT_ID, 'and', [cond('c1', 'state', 'is', { a: 'tripped' })]) },
];

function setup(props: Partial<Parameters<typeof SavedQueries>[0]> = {}) {
  const handlers = { onLoad: vi.fn(), onDelete: vi.fn(), onSave: vi.fn() };
  render(<SavedQueries queries={QUERIES} datasets={[TEST_DATASET]} {...handlers} {...props} />);
  return handlers;
}

describe(SavedQueries.name, () => {
  it('lists each query with its chips', () => {
    setup();

    expect(screen.getByText('Weak compressors')).toBeInTheDocument();
    expect(screen.getByText('Health score is below 75 %')).toBeInTheDocument();
  });

  it('loads and deletes a query', async () => {
    const { onLoad, onDelete } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Load Tripped' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Tripped' }));

    expect(onLoad).toHaveBeenCalledWith('q2');
    expect(onDelete).toHaveBeenCalledWith('q2');
  });

  it('marks the open query and does not offer to reload it', () => {
    setup({ activeId: 'q1' });

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load Weak compressors' })).toBeDisabled();
  });

  it('saves the current query under a name and clears the box', async () => {
    const { onSave } = setup();

    await userEvent.type(screen.getByLabelText('Query name'), 'Pumps at risk');
    await userEvent.click(screen.getByRole('button', { name: 'Save query' }));

    expect(onSave).toHaveBeenCalledWith('Pumps at risk');
    expect(screen.getByLabelText('Query name')).toHaveValue('');
  });

  it('needs a name before saving', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Save query' })).toBeDisabled();
  });

  it('refuses to save and says why', async () => {
    const { onSave } = setup({ saveDisabledReason: 'Fix the incomplete conditions before saving.' });

    await userEvent.type(screen.getByLabelText('Query name'), 'x');

    expect(screen.getByText('Fix the incomplete conditions before saving.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save query' })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows an empty state', () => {
    setup({ queries: [] });

    expect(screen.getByText('No saved queries yet. Name the current query to keep it.')).toBeInTheDocument();
  });
});
