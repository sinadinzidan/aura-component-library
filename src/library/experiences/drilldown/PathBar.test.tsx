import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { fixtureTree } from './drilldownFixture';
import { pathTo } from './hierarchy';
import { PathBar } from './PathBar';

const tree = fixtureTree();
const nodes = pathTo(tree, 'comp-1');

describe(PathBar.name, () => {
  it('lists the path with tag and name per level', () => {
    render(<PathBar nodes={nodes} onSelect={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: 'Location' })).toBeInTheDocument();
    expect(screen.getByText('NK-23')).toHaveClass('font-mono');
    expect(screen.getByText('Gas compression')).toBeInTheDocument();
  });

  it('marks the last node as the current location, not as a button', () => {
    render(<PathBar nodes={nodes} onSelect={vi.fn()} />);

    expect(screen.getByLabelText('Equipment: 23-KA-9101 1st stage compressor')).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('goes up to an ancestor in one click', async () => {
    const onSelect = vi.fn();
    render(<PathBar nodes={nodes} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Go up to site NK Nordkapp plant' }));

    expect(onSelect).toHaveBeenCalledWith('site');
  });

  it('copies the path as text', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    render(<PathBar nodes={nodes} onSelect={vi.fn()} copyable writeText={writeText} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy path' }));

    expect(writeText).toHaveBeenCalledWith('NK / NK-23 / 23-KA-9101');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument());
  });

  it('has no copy button unless asked', () => {
    render(<PathBar nodes={nodes} onSelect={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Copy path' })).not.toBeInTheDocument();
  });
});
