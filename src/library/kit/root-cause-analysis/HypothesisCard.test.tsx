import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { HypothesisCard } from './HypothesisCard';

const BASE = { reference: 'H1', title: 'Bearing wear', summary: 'The drive-end bearing wore until vibration passed the trip limit.', supports: 4, contradicts: 1 };

describe(HypothesisCard.name, () => {
  it('shows the state in words and the balance of evidence', () => {
    const { container } = render(<HypothesisCard {...BASE} state="confirmed" owner="Tomás Barros" />);

    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('4 supporting')).toBeInTheDocument();
    expect(screen.getByText('1 contradicting')).toBeInTheDocument();
    expect(screen.getByText('Owner: Tomás Barros')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
  });

  it('is a toggle button when selectable', async () => {
    const onSelect = vi.fn();
    render(<HypothesisCard {...BASE} state="open" selected onSelect={onSelect} />);

    const button = screen.getByRole('button', { name: /Bearing wear/ });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
