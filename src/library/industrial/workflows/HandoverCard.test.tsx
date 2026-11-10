import { render, screen } from '@testing-library/react';

import { HandoverCard } from './HandoverCard';

const OUTGOING = { name: 'Ingrid Haugen', shift: 'Day shift' };
const INCOMING = { name: 'Liv Wold', shift: 'Night shift' };

describe(HandoverCard.name, () => {
  it('shows both parties with their role and shift', () => {
    render(<HandoverCard outgoing={OUTGOING} incoming={INCOMING} state="awaiting" />);
    expect(screen.getByText('Ingrid Haugen')).toBeInTheDocument();
    expect(screen.getByText('Outgoing · Day shift')).toBeInTheDocument();
    expect(screen.getByText('Incoming · Night shift')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'hands over to' })).toBeInTheDocument();
  });

  it('says that acceptance is outstanding', () => {
    render(<HandoverCard outgoing={OUTGOING} incoming={INCOMING} state="awaiting" acceptedAt="12 Mar, 14:02" />);
    expect(screen.getByText('Awaiting acceptance')).toBeInTheDocument();
  });

  it('shows when it was accepted', () => {
    render(<HandoverCard outgoing={OUTGOING} incoming={INCOMING} state="accepted" acceptedAt="12 Mar, 14:02" />);
    expect(screen.getByText('Accepted · 12 Mar, 14:02')).toBeInTheDocument();
  });

  it('renders the note', () => {
    render(
      <HandoverCard outgoing={OUTGOING} incoming={INCOMING} state="draft">
        <p>Recompressor remains isolated.</p>
      </HandoverCard>
    );
    expect(screen.getByText('Recompressor remains isolated.')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
