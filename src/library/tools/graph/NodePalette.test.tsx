import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NODE_TEMPLATES } from './graphFixtures';
import { NodePalette } from './NodePalette';

describe(NodePalette.name, () => {
  it('lists every template with its own add button', () => {
    render(<NodePalette templates={NODE_TEMPLATES} onAdd={vi.fn()} />);

    expect(screen.getByRole('list', { name: 'Nodes to add' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(NODE_TEMPLATES.length);
  });

  it('adds the chosen template', async () => {
    const onAdd = vi.fn();
    render(<NodePalette templates={NODE_TEMPLATES} onAdd={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add Resample' }));

    expect(onAdd).toHaveBeenCalledWith(NODE_TEMPLATES[2]);
  });

  it('disables adding and says why', () => {
    render(<NodePalette templates={NODE_TEMPLATES} onAdd={vi.fn()} disabledReason="This graph is read-only." />);

    expect(screen.getByText('This graph is read-only.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Resample' })).toBeDisabled();
  });
});
