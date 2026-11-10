import { render, screen } from '@testing-library/react';

import { DueLabel } from './DueLabel';

describe(DueLabel.name, () => {
  it('shows the due date quietly', () => {
    render(<DueLabel due="13 Mar" />);

    expect(screen.getByText('13 Mar')).toHaveClass('text-muted-foreground');
  });

  it('says overdue in words', () => {
    render(<DueLabel due="8 Mar" overdue />);

    expect(screen.getByText('Overdue · 8 Mar')).toHaveAttribute('data-overdue', 'true');
  });

  it('never marks finished work as overdue', () => {
    render(<DueLabel due="8 Mar" overdue done />);

    expect(screen.getByText('8 Mar')).not.toHaveAttribute('data-overdue');
  });
});
