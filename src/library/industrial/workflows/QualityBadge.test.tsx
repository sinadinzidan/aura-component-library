import { render, screen } from '@testing-library/react';

import { QualityBadge } from './QualityBadge';

describe(QualityBadge.name, () => {
  it('names the quality in words', () => {
    render(<QualityBadge quality="uncertain" />);
    expect(screen.getByText('Uncertain')).toHaveAttribute('data-quality', 'uncertain');
  });

  it('accepts a more specific label', () => {
    render(<QualityBadge quality="bad" label="No signal" />);
    expect(screen.getByText('No signal')).toBeInTheDocument();
  });

  it('pairs the word with a decorative icon', () => {
    const { container } = render(<QualityBadge quality="good" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
