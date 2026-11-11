import { render, screen } from '@testing-library/react';

import { SourceCard } from './SourceCard';

describe(SourceCard.name, () => {
  it('shows the citation number, what the source is and the passage used', () => {
    render(<SourceCard index={2} title="Recompressor vibration" kind="Time series" location="13:30 to 14:00" excerpt="Peaked at 11.6 mm/s." />);

    expect(screen.getByRole('heading', { name: 'Recompressor vibration' })).toBeInTheDocument();
    expect(screen.getByText('Time series · 13:30 to 14:00')).toBeInTheDocument();
    expect(screen.getByText('Peaked at 11.6 mm/s.')).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveTextContent('Source 2');
  });

  it('marks the source in focus', () => {
    render(<SourceCard index={1} title="Alarm list" kind="Events" active />);

    expect(screen.getByRole('article')).toHaveAttribute('data-active');
  });
});
