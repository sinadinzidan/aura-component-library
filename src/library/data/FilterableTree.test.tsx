import { ItemContent, ItemTitle } from '@cognite/aura/components/item';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterableTree } from './FilterableTree';

type Node = { name: string; tag: string; children: string[] };

const NODES: Record<string, Node> = {
  root: { name: 'Root', tag: '', children: ['compression', 'export'] },
  compression: { name: 'Gas compression', tag: 'NK-23', children: ['compressor', 'cooler'] },
  compressor: { name: '1st stage compressor', tag: '23-KA-9101', children: [] },
  cooler: { name: 'Interstage cooler', tag: '23-HA-9114', children: [] },
  export: { name: 'Gas export', tag: 'NK-27', children: ['pump'] },
  pump: { name: 'Export pump A', tag: '27-PA-2001A', children: [] },
};

describe(FilterableTree.name, () => {
  it('shows the top level and keeps branches closed before anything is typed', () => {
    renderTree();

    expect(screen.getByText('Gas compression')).toBeInTheDocument();
    expect(screen.getByText('Gas export')).toBeInTheDocument();
    expect(screen.queryByText('Interstage cooler')).not.toBeInTheDocument();
  });

  it('opens the branches given as expanded by default', () => {
    renderTree({ defaultExpandedItems: ['compression'] });

    expect(screen.getByText('Interstage cooler')).toBeInTheDocument();
  });

  it('keeps matches and the branches that lead to them, and opens those branches', async () => {
    renderTree();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'cooler');

    expect(screen.getByText('Interstage cooler')).toBeInTheDocument();
    expect(screen.getByText('Gas compression')).toBeInTheDocument();
    expect(screen.queryByText('1st stage compressor')).not.toBeInTheDocument();
    expect(screen.queryByText('Gas export')).not.toBeInTheDocument();
  });

  it('matches on the extra search text as well as the name', async () => {
    renderTree();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search assets' }), '27-pa');

    expect(screen.getByText('Export pump A')).toBeInTheDocument();
    expect(screen.queryByText('Gas compression')).not.toBeInTheDocument();
  });

  it('reports how many nodes match', async () => {
    renderTree();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'compress');

    expect(screen.getByRole('status')).toHaveTextContent('2 matches');
  });

  it('says so when nothing matches and hides the tree', async () => {
    renderTree();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'turbine');

    expect(screen.getByRole('status')).toHaveTextContent('Nothing matches "turbine".');
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
  });

  it('restores the branches the user had open when the search is cleared', async () => {
    renderTree();
    await userEvent.click(screen.getByRole('button', { name: 'Expand Gas export' }));
    const search = screen.getByRole('searchbox', { name: 'Search assets' });

    await userEvent.type(search, 'cooler');
    await userEvent.clear(search);

    expect(screen.getByText('Export pump A')).toBeInTheDocument();
    expect(screen.queryByText('Interstage cooler')).not.toBeInTheDocument();
  });
});

function renderTree(props: { defaultExpandedItems?: string[] } = {}) {
  return render(
    <FilterableTree
      rootItemId="root"
      items={NODES}
      getChildren={(node) => node.children}
      getItemName={(node) => node.name}
      getSearchText={(node) => node.tag}
      searchLabel="Search assets"
      {...props}
    >
      {(item) => (
        <ItemContent>
          <ItemTitle>{item.getItemName()}</ItemTitle>
        </ItemContent>
      )}
    </FilterableTree>
  );
}
