import { render, screen, within } from '@testing-library/react';

import { ChangeList, type ChangeItem } from './ChangeList';

const ITEMS: ChangeItem[] = [
  { id: 'limit', attribute: 'High limit', from: '145 °C', to: '147 °C', reason: 'Normal operation reaches 145.8 °C.' },
  { id: 'trip', attribute: 'Trip limit', from: '155 °C', to: '155 °C' },
];

describe(ChangeList.name, () => {
  it('lists every setting with current and proposed values', () => {
    render(<ChangeList label="Proposed changes" items={ITEMS} />);

    const rows = within(screen.getByRole('list', { name: 'Proposed changes' })).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('High limit');
    expect(rows[0]).toHaveTextContent('145 °C');
    expect(rows[0]).toHaveTextContent('147 °C');
    expect(rows[0]).toHaveTextContent('Normal operation reaches 145.8 °C.');
  });

  it('marks changed rows and says when a value stays', () => {
    render(<ChangeList label="Proposed changes" items={ITEMS} />);

    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveAttribute('data-changed', 'true');
    expect(rows[1]).toHaveAttribute('data-changed', 'false');
    expect(rows[1]).toHaveTextContent('No change');
  });

  it('summarises how much changes and takes custom headers', () => {
    render(<ChangeList label="Proposed changes" items={ITEMS} fromHeader="Before" toHeader="After" />);

    expect(screen.getByText('1 of 2 settings change')).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });
});
