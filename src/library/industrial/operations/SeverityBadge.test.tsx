import { render, screen } from '@testing-library/react';

import { SeverityBadge } from './SeverityBadge';

describe(SeverityBadge.name, () => {
  it('names the severity in words', () => {
    render(<SeverityBadge severity="critical" />);

    expect(screen.getByText('Critical')).toHaveAttribute('data-severity', 'critical');
  });

  it('reads as a count when given one', () => {
    render(<SeverityBadge severity="high" count={2} />);

    expect(screen.getByText('2 high')).toBeInTheDocument();
  });

  it('pairs the word with an icon so it reads without colour', () => {
    const { container } = render(<SeverityBadge severity="medium" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('accepts a custom label', () => {
    render(<SeverityBadge severity="low" label="Advisory" />);

    expect(screen.getByText('Advisory')).toBeInTheDocument();
  });
});
