import { render, screen } from '@testing-library/react';

import { AlarmStateLabel } from './AlarmStateLabel';

describe(AlarmStateLabel.name, () => {
  it('calls an active alarm unacknowledged and makes it strong', () => {
    render(<AlarmStateLabel state="active" />);

    expect(screen.getByText('Unacknowledged').parentElement).toHaveClass('font-medium', 'text-base-foreground');
  });

  it('keeps the other states quiet', () => {
    render(<AlarmStateLabel state="shelved" />);

    expect(screen.getByText('Shelved').parentElement).toHaveClass('text-muted-foreground');
  });

  it('shows the detail after the state', () => {
    render(<AlarmStateLabel state="acknowledged" detail="by IH" />);

    expect(screen.getByText('by IH')).toBeInTheDocument();
  });
});
