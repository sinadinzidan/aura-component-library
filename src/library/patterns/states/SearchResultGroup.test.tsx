import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SearchResultGroup } from './SearchResultGroup';
import type { SearchResult } from './SearchResultGroup';

const RESULTS: SearchResult[] = [
  { id: '23-ka-9101', title: '1st stage compressor', context: 'Nordkapp · Gas compression', meta: '23-KA-9101' },
  { id: '23-ka-9102', title: '2nd stage compressor', context: 'Nordkapp · Gas compression', meta: '23-KA-9102' },
];

describe(SearchResultGroup.name, () => {
  it('names the group and counts its results', () => {
    render(<SearchResultGroup heading="Assets" results={RESULTS} onSelect={vi.fn()} />);

    expect(screen.getByRole('region', { name: /Assets · 2/ })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows the total when more results exist than are listed', () => {
    render(<SearchResultGroup heading="Assets" total={1284} results={RESULTS} onSelect={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /1,284/ })).toBeInTheDocument();
  });

  it('reports the selected result', async () => {
    const onSelect = vi.fn();
    render(<SearchResultGroup heading="Assets" results={RESULTS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /2nd stage compressor/ }));

    expect(onSelect).toHaveBeenCalledWith('23-ka-9102');
  });

  it('offers to view all only when there are more', async () => {
    const onViewAll = vi.fn();
    const { rerender } = render(
      <SearchResultGroup heading="Assets" results={RESULTS} onSelect={vi.fn()} onViewAll={onViewAll} />
    );
    expect(screen.queryByRole('button', { name: /View all/ })).not.toBeInTheDocument();

    rerender(<SearchResultGroup heading="Assets" total={12} results={RESULTS} onSelect={vi.fn()} onViewAll={onViewAll} />);
    await userEvent.click(screen.getByRole('button', { name: 'View all assets' }));

    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for a kind with no matches', () => {
    const { container } = render(<SearchResultGroup heading="Documents" results={[]} onSelect={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
