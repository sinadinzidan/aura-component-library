import { render, screen, within } from '@testing-library/react';

import { StatRow } from './StatRow';

const STATS = [
  { id: 'availability', label: 'Availability', value: '96.4', unit: '%', detail: 'Target 97.5 %' },
  { id: 'alarms', label: 'Active alarms', value: '4' },
  { id: 'orders', label: 'Open work orders', value: '23' },
];

describe(StatRow.name, () => {
  it('names the group', () => {
    render(<StatRow label="Plant summary" stats={STATS} />);

    expect(screen.getByLabelText('Plant summary')).toBeInTheDocument();
  });

  it('pairs each value with its label', () => {
    render(<StatRow label="Plant summary" stats={STATS} />);

    const terms = screen.getAllByRole('term').map((term) => term.textContent);
    const definitions = screen.getAllByRole('definition');
    expect(terms).toEqual(['Availability', 'Active alarms', 'Open work orders']);
    expect(within(definitions[0]).getByText('96.4')).toBeInTheDocument();
    expect(within(definitions[0]).getByText('%')).toBeInTheDocument();
  });

  it('shows the detail line when one is given', () => {
    render(<StatRow label="Plant summary" stats={STATS} />);

    expect(screen.getByText('Target 97.5 %')).toBeInTheDocument();
  });

  it('draws dividers between figures, not before the first', () => {
    const { container } = render(<StatRow label="Plant summary" stats={STATS} />);

    const cells = [...container.querySelectorAll('[data-slot="stat"]')];
    expect(cells[0].className).not.toContain('border-l');
    expect(cells[1].className).toContain('border-l');
  });

  it('can drop the dividers', () => {
    const { container } = render(<StatRow label="Plant summary" stats={STATS} dividers={false} />);

    expect(container.querySelector('.border-l')).toBeNull();
  });
});
