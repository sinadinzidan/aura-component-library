import { render, screen } from '@testing-library/react';

import { TagCard } from './TagCard';

const BASE = { tag: '23-VT-92540', name: 'Drive-end vibration', unit: 'mm/s', limits: { high: 7.1, highHigh: 11 }, range: [0, 15] as const };

describe(TagCard.name, () => {
  it('shows the figure, the judgement, the trend and the scale', () => {
    render(<TagCard {...BASE} value={6.8} asset="23-KA-9101" trend={[6.1, 6.4, 6.8]} caption="96 % of high limit" />);

    expect(screen.getByText('6.8')).toBeInTheDocument();
    expect(screen.getByText('Near limit')).toBeInTheDocument();
    expect(screen.getByText('96 % of high limit')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Drive-end vibration against limits' })).toBeInTheDocument();
  });

  it('withholds the figure and the scale for a bad signal', () => {
    render(<TagCard {...BASE} value={0} quality="bad" trend={[1, 2]} />);

    expect(screen.getByText('Bad signal')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
