import { render, screen } from '@testing-library/react';

import { SignOff } from './SignOff';

describe(SignOff.name, () => {
  it('shows signed and pending lines and puts the action under the first pending signer', () => {
    render(
      <SignOff
        label="Handover sign-off"
        signers={[
          { id: 'out', name: 'Ingrid Haugen', capacity: 'Outgoing operator', signedAt: '13:58' },
          { id: 'in', name: 'Liv Wold', capacity: 'Incoming supervisor' },
        ]}
        action={<button type="button">Accept handover</button>}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-signed', 'true');
    expect(items[1]).toHaveAttribute('data-signed', 'false');
    expect(screen.getByText('Signed 13:58')).toBeInTheDocument();
    expect(screen.getByText('Waiting for Liv Wold')).toBeInTheDocument();
    expect(items[1]).toContainElement(screen.getByRole('button', { name: 'Accept handover' }));
  });
});
