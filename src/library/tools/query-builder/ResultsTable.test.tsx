import { render, screen } from '@testing-library/react';

import { TEST_DATASET } from './fixtures';
import { ResultsTable } from './ResultsTable';

const setup = (rows = TEST_DATASET.records, limit?: number) => render(<ResultsTable columns={TEST_DATASET.columns} rows={rows} recordKey="tag" total={4} noun="assets" limit={limit} />);

describe(ResultsTable.name, () => {
  it('counts the matches against the total', () => {
    setup(TEST_DATASET.records.slice(0, 2));

    expect(screen.getByRole('status')).toHaveTextContent('2 of 4 assets match');
  });

  it('draws a row per record with formatted cells', () => {
    setup();

    expect(screen.getByRole('rowheader', { name: '23-KA-9103' })).toBeInTheDocument();
    expect(screen.getByText('41 %')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats a date column', () => {
    setup(TEST_DATASET.records.slice(0, 1));

    expect(screen.getByText('9 Mar 2026')).toBeInTheDocument();
  });

  it('shows enum cells by their option label', () => {
    render(<ResultsTable columns={[{ key: 'tag', label: 'Tag' }, { key: 'state', label: 'State' }]} fields={TEST_DATASET.fields} rows={TEST_DATASET.records.slice(0, 1)} recordKey="tag" total={4} noun="assets" />);

    expect(screen.getByText('Tripped')).toBeInTheDocument();
  });

  it('says nothing matches and what to do', () => {
    setup([]);

    expect(screen.getByText('No assets match. Remove a condition or widen a range.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('limits the rows drawn and says so', () => {
    setup(TEST_DATASET.records, 2);

    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('Showing the first 2. Narrow the query to see the rest.')).toBeInTheDocument();
  });
});
