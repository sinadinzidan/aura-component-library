import { render, screen } from '@testing-library/react';

import { LogCategoryBadge, logCategoryLabel } from './LogCategoryBadge';

describe(LogCategoryBadge.name, () => {
  it('names the category in words', () => {
    render(<LogCategoryBadge category="safety" />);
    expect(screen.getByText('Safety')).toHaveAttribute('data-category', 'safety');
  });

  it('pairs the word with a decorative icon', () => {
    const { container } = render(<LogCategoryBadge category="maintenance" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('accepts another label and exposes the default one', () => {
    render(<LogCategoryBadge category="environment" label="Flaring" />);
    expect(screen.getByText('Flaring')).toBeInTheDocument();
    expect(logCategoryLabel('operations')).toBe('Operations');
  });
});
