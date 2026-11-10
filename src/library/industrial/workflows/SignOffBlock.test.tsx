import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SignOffBlock } from './SignOffBlock';
import type { SignOffSigner } from './SignOffBlock';

const SIGNERS: readonly SignOffSigner[] = [
  { id: 'op', role: 'Field operator', name: 'Tomás Barros', state: 'signed', at: '12 Mar, 13:40' },
  { id: 'sup', role: 'Shift supervisor', name: 'Liv Wold', state: 'pending' },
  { id: 'eng', role: 'Discipline engineer', state: 'pending' },
];

describe(SignOffBlock.name, () => {
  it('lists each signer with role, state and time', () => {
    render(<SignOffBlock label="Sign-off" signers={SIGNERS} />);
    expect(screen.getByRole('list', { name: 'Sign-off' })).toBeInTheDocument();
    expect(screen.getByText('Signed 12 Mar, 13:40')).toBeInTheDocument();
    expect(screen.getAllByText('Pending')).toHaveLength(2);
    expect(screen.getByText('Not assigned')).toBeInTheDocument();
  });

  it('gives only the current signer a sign button', async () => {
    const onSign = vi.fn();
    render(<SignOffBlock label="Sign-off" signers={SIGNERS} currentSignerId="sup" onSign={onSign} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Sign off' }));
    expect(onSign).toHaveBeenCalledWith('sup');
  });

  it('shows no button once the current signer has signed', () => {
    render(<SignOffBlock label="Sign-off" signers={SIGNERS} currentSignerId="op" onSign={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says when someone declined', () => {
    render(<SignOffBlock label="Sign-off" signers={[{ id: 'a', role: 'Approver', name: 'Aisha Khan', state: 'declined', at: '11 Mar' }]} />);
    expect(screen.getByText('Declined 11 Mar')).toBeInTheDocument();
  });
});
