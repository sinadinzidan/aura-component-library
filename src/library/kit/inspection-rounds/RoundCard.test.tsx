import { render, screen } from '@testing-library/react';

import { RoundCard } from './RoundCard';

describe(RoundCard.name, () => {
  it('shows the count, the state and who walks it', () => {
    render(<RoundCard name="Compressor hall round" area="NK-23" state="in-progress" timing="Due 15:00" assignee="Tomás Barros" results={['pass', 'pass', 'pending']} />);

    expect(screen.getByRole('heading', { name: 'Compressor hall round' })).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('of 3 checkpoints')).toBeInTheDocument();
    expect(screen.getByText('Tomás Barros · Due 15:00')).toBeInTheDocument();
    expect(screen.getByText('No findings')).toBeInTheDocument();
  });

  it('counts failed checkpoints as findings and mentions skips', () => {
    render(<RoundCard name="Export round" area="NK-27" state="overdue" timing="Due 08:00" results={['fail', 'fail', 'skipped', 'pass']} />);

    expect(screen.getByText('2 findings')).toBeInTheDocument();
    expect(screen.getByText('1 skipped with a reason')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders the action in the footer', () => {
    render(<RoundCard name="Round" area="NK-20" state="scheduled" timing="Starts 18:00" results={['pending']} action={<button type="button">Start round</button>} />);

    expect(screen.getByRole('button', { name: 'Start round' })).toBeInTheDocument();
  });
});
