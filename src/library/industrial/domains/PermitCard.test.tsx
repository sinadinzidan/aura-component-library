import { render, screen, within } from '@testing-library/react';

import { PermitCard } from './PermitCard';

const PROPS = {
  permitId: 'PTW-26-0418',
  type: 'Hot work',
  title: 'Weld repair on drain line',
  location: 'Gas compression, level 2',
  validFrom: '12 Mar, 07:00',
  validTo: '12 Mar, 19:00',
  holder: 'Tomás Barros',
};

describe(PermitCard.name, () => {
  it('names the card by type, number and state', () => {
    render(<PermitCard {...PROPS} state="active" />);

    expect(screen.getByRole('group', { name: 'Hot work permit PTW-26-0418, active' })).toBeInTheDocument();
  });

  it('writes the state out', () => {
    render(<PermitCard {...PROPS} state="suspended" />);

    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('shows location, validity and holder', () => {
    render(<PermitCard {...PROPS} state="active" />);

    const card = screen.getByRole('group');
    expect(within(card).getByText('Gas compression, level 2')).toBeInTheDocument();
    expect(within(card).getByText('12 Mar, 19:00')).toBeInTheDocument();
    expect(within(card).getByText('Tomás Barros')).toBeInTheDocument();
  });

  it('leaves out fields it was not given', () => {
    render(<PermitCard {...PROPS} state="active" />);

    expect(screen.queryByText('Equipment')).not.toBeInTheDocument();
    expect(screen.queryByText('Issued by')).not.toBeInTheDocument();
  });

  it('explains the state when given a note', () => {
    render(<PermitCard {...PROPS} state="suspended" stateNote="Suspended at 10:42 on general alarm." />);

    expect(screen.getByText('Suspended at 10:42 on general alarm.')).toBeInTheDocument();
  });

  it('lists the conditions', () => {
    render(<PermitCard {...PROPS} state="active" conditions={['Fire watch', 'Gas test every 2 h']} />);

    expect(within(screen.getByRole('list', { name: 'Conditions' })).getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders the actions it is given', () => {
    render(<PermitCard {...PROPS} state="requested" actions={<button type="button">Approve permit</button>} />);

    expect(screen.getByRole('button', { name: 'Approve permit' })).toBeInTheDocument();
  });
});
