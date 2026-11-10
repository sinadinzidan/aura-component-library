import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { fixtureTree } from './drilldownFixture';
import { NodeList } from './NodeList';

const tree = fixtureTree();
const machines = tree.byId.get('area-b')?.children ?? [];

describe(NodeList.name, () => {
  it('lists every node as a button with its state and reading', () => {
    render(<NodeList nodes={machines} label="Equipment in Gas compression" onSelect={vi.fn()} />);
    const rows = within(screen.getByRole('list', { name: 'Equipment in Gas compression' })).getAllByRole('button');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('1st stage compressor');
    expect(rows[1]).toHaveTextContent('Tripped');
  });

  it('selects a node on click', async () => {
    const onSelect = vi.fn();
    render(<NodeList nodes={machines} label="Equipment" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Recompressor/ }));

    expect(onSelect).toHaveBeenCalledWith('comp-3');
  });

  it('previews a node while it is hovered and clears the preview afterwards', async () => {
    const onPreview = vi.fn();
    render(<NodeList nodes={machines} label="Equipment" onSelect={vi.fn()} onPreview={onPreview} />);

    await userEvent.hover(screen.getByRole('button', { name: /Recompressor/ }));
    await userEvent.unhover(screen.getByRole('button', { name: /Recompressor/ }));

    expect(onPreview).toHaveBeenNthCalledWith(1, 'comp-3');
    expect(onPreview).toHaveBeenLastCalledWith(null);
  });

  it('previews a node when it takes keyboard focus', async () => {
    const onPreview = vi.fn();
    render(<NodeList nodes={machines} label="Equipment" onSelect={vi.fn()} onPreview={onPreview} />);

    await userEvent.tab();

    expect(onPreview).toHaveBeenCalledWith('comp-1');
  });

  it('picks out the active row', () => {
    render(<NodeList nodes={machines} label="Equipment" onSelect={vi.fn()} activeId="comp-3" />);

    expect(screen.getByRole('button', { name: /Recompressor/ })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('button', { name: /1st stage/ })).not.toHaveAttribute('data-active');
  });

  it('says so when there is nothing to list', () => {
    render(<NodeList nodes={[]} label="Sensors" onSelect={vi.fn()} emptyText="No sensors on this machine" />);

    expect(screen.getByText('No sensors on this machine')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
