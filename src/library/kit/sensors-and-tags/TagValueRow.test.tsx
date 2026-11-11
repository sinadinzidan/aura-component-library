import { render, screen } from '@testing-library/react';

import { TagValueRow } from './TagValueRow';

const BASE = { tag: '23-PT-92531', name: 'Discharge pressure', unit: 'barg', limits: { low: 40, high: 52, highHigh: 55 }, range: [0, 60] as const };

describe(TagValueRow.name, () => {
  it('shows the value, its judgement and the limit scale', () => {
    render(
      <ul>
        <TagValueRow {...BASE} value={50.2} trend={[48, 49, 50.2]} />
      </ul>
    );

    expect(screen.getByText('50.2')).toBeInTheDocument();
    expect(screen.getByText('Near limit')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Discharge pressure against limits' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Discharge pressure, recent trend' })).toBeInTheDocument();
  });

  it('replaces the figure and the judgement when the signal is bad', () => {
    render(
      <ul>
        <TagValueRow {...BASE} value={0} quality="bad" age="No update for 9 h" leading={<span>pin</span>} />
      </ul>
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Bad signal')).toBeInTheDocument();
    expect(screen.getByText('No update for 9 h')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).toBeNull();
    expect(screen.getByRole('listitem')).toHaveAttribute('data-tone', 'critical');
  });
});
