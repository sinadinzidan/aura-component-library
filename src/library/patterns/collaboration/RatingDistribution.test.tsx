import { render, screen, within } from '@testing-library/react';

import { RatingDistribution } from './RatingDistribution';

const COUNTS = [
  { score: 1, count: 2 },
  { score: 2, count: 0 },
  { score: 3, count: 4 },
  { score: 4, count: 10 },
  { score: 5, count: 4 },
];

describe(RatingDistribution.name, () => {
  it('shows the average to 1 decimal and the number of ratings', () => {
    render(<RatingDistribution label="Ratings" counts={COUNTS} />);

    expect(screen.getByText('3.7')).toBeInTheDocument();
    expect(screen.getByText('of 5')).toBeInTheDocument();
    expect(screen.getByText('20 ratings')).toBeInTheDocument();
  });

  it('lists the scores highest first with their counts', () => {
    render(<RatingDistribution label="Ratings" counts={COUNTS} />);

    const rows = within(screen.getByRole('list', { name: 'Ratings' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(['54', '410', '34', '20', '12']);
  });

  it('sizes each bar by its share of all ratings', () => {
    const { container } = render(<RatingDistribution label="Ratings" counts={COUNTS} />);

    const bars = container.querySelectorAll<HTMLElement>('[data-slot="rating-bar"]');
    expect(bars[1].style.width).toBe('50%');
    expect(bars[3].style.width).toBe('0%');
  });

  it('shows a dash, not a zero, before anyone has rated', () => {
    render(<RatingDistribution label="Ratings" counts={[{ score: 5, count: 0 }]} />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
  });

  it('uses the singular for one rating', () => {
    render(<RatingDistribution label="Ratings" counts={[{ score: 5, count: 1 }]} noun={{ one: 'response', other: 'responses' }} />);

    expect(screen.getByText('1 response')).toBeInTheDocument();
  });

  it('names the rows with words when given', () => {
    render(<RatingDistribution label="Ratings" counts={COUNTS} scoreLabels={{ 5: 'Excellent', 1: 'Poor' }} />);

    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });
});
