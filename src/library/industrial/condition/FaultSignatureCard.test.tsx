import { render, screen } from '@testing-library/react';

import { FAULT_SIGNATURES } from './faults';
import { FaultSignatureCard } from './FaultSignatureCard';

describe(FaultSignatureCard.name, () => {
  it('names the fault and describes its typical spectrum', () => {
    render(<FaultSignatureCard signature={FAULT_SIGNATURES.unbalance} />);

    expect(screen.getByRole('heading', { name: 'Unbalance' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Typical spectrum of unbalance/ })).toBeInTheDocument();
  });

  it('draws a line for each order on the axis', () => {
    const { container } = render(<FaultSignatureCard signature={FAULT_SIGNATURES.misalignment} />);

    expect(container.querySelectorAll('[data-slot="signature-line"]')).toHaveLength(4);
  });

  it('drops lines beyond the axis', () => {
    const { container } = render(<FaultSignatureCard signature={FAULT_SIGNATURES['bearing-outer']} maxOrder={4} />);

    expect(container.querySelectorAll('[data-slot="signature-line"]')).toHaveLength(2);
  });

  it('shows pattern, confirmation and action', () => {
    render(<FaultSignatureCard signature={FAULT_SIGNATURES.looseness} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText(FAULT_SIGNATURES.looseness.action)).toBeInTheDocument();
  });

  it('says when it matches the current spectrum', () => {
    render(<FaultSignatureCard signature={FAULT_SIGNATURES.unbalance} matched />);

    expect(screen.getByText('Matches this spectrum')).toBeInTheDocument();
  });
});
