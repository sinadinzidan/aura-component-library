import { render, screen } from '@testing-library/react';

import { StatsBand } from './StatsBand';

const STATS = [
  { id: 'series', value: '1.4', unit: 'M', label: 'Time series ingested', detail: 'Across four sites' },
  { id: 'assets', value: '38,200', label: 'Assets in the hierarchy' },
  { id: 'sources', value: '12', label: 'Source systems connected' },
];

describe(StatsBand.name, () => {
  it('names the group', () => {
    render(<StatsBand label="Deployment in numbers" stats={STATS} />);

    expect(screen.getByLabelText('Deployment in numbers')).toBeInTheDocument();
  });

  it('pairs each number with what it counts', () => {
    render(<StatsBand label="Deployment in numbers" stats={STATS} />);

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Time series ingestedAcross four sites',
      'Assets in the hierarchy',
      'Source systems connected',
    ]);
    expect(screen.getAllByRole('definition').map((definition) => definition.textContent)).toEqual(['1.4M', '38,200', '12']);
  });

  it('gives the muted band its own surface', () => {
    render(<StatsBand label="Deployment in numbers" stats={STATS} surface="muted" align="center" />);

    const list = screen.getByLabelText('Deployment in numbers');
    expect(list.className).toContain('bg-muted-background');
    expect(list.className).toContain('text-center');
  });
});
