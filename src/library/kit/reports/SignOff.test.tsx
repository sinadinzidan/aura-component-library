import { render, screen } from '@testing-library/react';

import { SignOff } from './SignOff';

describe(SignOff.name, () => {
  it('shows each role with name, title and state in words', () => {
    const { container } = render(
      <SignOff
        signers={[
          { role: 'Prepared by', name: 'Ingrid Haugen', title: 'Shift supervisor', state: 'signed', at: '13 Mar 2026, 06:12 UTC' },
          { role: 'Approved by', name: 'Aisha Khan', title: 'Plant manager', state: 'pending' },
          { role: 'Reviewed by', name: 'Jonas Nyberg', title: 'Process engineer', state: 'rejected' },
        ]}
      />,
    );

    expect(screen.getByText('Prepared by')).toBeInTheDocument();
    expect(screen.getByText('Signed · 13 Mar 2026, 06:12 UTC')).toBeInTheDocument();
    expect(screen.getByText('Awaiting signature')).toBeInTheDocument();
    expect(screen.getByText('Returned')).toBeInTheDocument();
    expect(screen.getAllByText('Ingrid Haugen')).toHaveLength(2);
    expect(screen.getAllByText('Aisha Khan')).toHaveLength(1);
    expect(container.querySelector('[data-state="rejected"]')).toHaveAttribute('data-tone', 'critical');
  });
});
