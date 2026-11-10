import { render, screen, within } from '@testing-library/react';

import type { CompareRow } from './compareRows';
import { CompareTable } from './CompareTable';

const ROWS: readonly CompareRow[] = [
  { id: 'high', label: 'High limit', left: '145.0 °C', right: '148.0 °C', delta: { text: '+3.0 °C', direction: 'up' } },
  { id: 'low', label: 'Low limit', left: '90.0 °C', right: '90.0 °C' },
  { id: 'delay', label: 'Alarm delay', right: '10 s' },
  { id: 'note', label: 'Operator note', left: 'Check cooler' },
];

const row = (label: string) => screen.getByRole('rowheader', { name: label }).closest('tr') ?? document.body;

describe(CompareTable.name, () => {
  it('shows both sides under their headings', () => {
    render(<CompareTable label="Limits" leftLabel="Current" rightLabel="Proposed" rows={ROWS} />);

    expect(screen.getByRole('table', { name: 'Limits' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Current' })).toBeInTheDocument();
    expect(within(row('High limit')).getByText('148.0 °C')).toBeInTheDocument();
  });

  it('marks each row with the kind of change in words', () => {
    render(<CompareTable label="Limits" leftLabel="Current" rightLabel="Proposed" rows={ROWS} />);

    expect(within(row('High limit')).getByText('Changed')).toBeInTheDocument();
    expect(within(row('Low limit')).getByText('Unchanged')).toBeInTheDocument();
    expect(within(row('Alarm delay')).getByText('Added')).toBeInTheDocument();
    expect(within(row('Operator note')).getByText('Removed')).toBeInTheDocument();
  });

  it('prints a dash for a side without a value', () => {
    render(<CompareTable label="Limits" leftLabel="Current" rightLabel="Proposed" rows={ROWS} />);

    expect(within(row('Alarm delay')).getByText('—')).toBeInTheDocument();
  });

  it('shows the difference with its direction', () => {
    render(<CompareTable label="Limits" leftLabel="Current" rightLabel="Proposed" rows={ROWS} />);

    expect(screen.getByRole('columnheader', { name: 'Difference' })).toBeInTheDocument();
    expect(within(row('High limit')).getByText('+3.0 °C')).toBeInTheDocument();
    expect(within(row('High limit')).getByText(', up')).toBeInTheDocument();
  });

  it('leaves the difference column out when no row has one', () => {
    render(<CompareTable label="Limits" leftLabel="A" rightLabel="B" rows={[{ id: 'a', label: 'Name', left: 'x', right: 'y' }]} />);

    expect(screen.queryByRole('columnheader', { name: 'Difference' })).not.toBeInTheDocument();
  });

  it('hides unchanged rows when only differences are asked for', () => {
    render(<CompareTable label="Limits" leftLabel="Current" rightLabel="Proposed" rows={ROWS} onlyDifferences />);

    expect(screen.queryByRole('rowheader', { name: 'Low limit' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('rowheader')).toHaveLength(3);
  });

  it('says so when there are no differences to show', () => {
    render(<CompareTable label="Limits" leftLabel="A" rightLabel="B" rows={[{ id: 'a', label: 'Name', left: 'x', right: 'x' }]} onlyDifferences />);

    expect(screen.getByText('No differences. Both sides are the same.')).toBeInTheDocument();
  });
});
